import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import {
  categories,
  customerPurchaseHistory,
  customers,
  orderItems,
  orders,
  products,
} from "~~/server/database/schema";
import { getAuthSession } from "~~/server/utils/session";

/**
 * GET /api/products
 * Query: ?category=salamis&search=salami&supplier=Ter+Beke&sort=name&sortDir=asc&page=1&perPage=50
 *
 * Geeft producten terug mét hun categorie, gepagineerd. Het returntype
 * wordt volledig afgeleid uit de select — geen handgeschreven interface.
 */
const querySchema = z.object({
  /** Slug van de categorie, bv. "salamis". Leeg = alle categorieën. */
  category: z.string().min(1).optional(),
  /** Zoekt in productnaam, artikelnummer en leverancier. */
  search: z.string().trim().min(1).optional(),
  /** Exacte leveranciersnaam, voor het "filter op fabrikant"-chip. */
  supplier: z.string().trim().min(1).optional(),
  sort: z.enum(["name", "articleNr", "supplier", "unit", "category"]).optional(),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(200).default(50),
  /** Enkel producten die de ingelogde klant ooit al bestelde. */
  purchased: z.coerce.boolean().optional(),
  /** Komma-gescheiden artikelnummers — gebruikt om de productenlijst te
   * beperken tot exact de inhoud van het winkelmandje. */
  articleNrs: z.string().trim().optional(),
});

const SORT_COLUMNS = {
  name: products.name,
  articleNr: products.articleNr,
  supplier: products.supplier,
  unit: products.unit,
  category: categories.name,
};

export default defineEventHandler(async (event) => {
  const { category, search, supplier, sort, sortDir, page, perPage, purchased, articleNrs } =
    await getValidatedQuery(event, (data) => querySchema.parse(data));

  const emptyResult = () => ({
    items: [],
    pagination: { page, perPage, total: 0, pageCount: 0 },
  });

  // "Enkel eerder afgenomen": beperkt tot artikelnummers die ooit in een
  // bestelling van deze klant zaten. Zonder sessie of zonder bestelhistoriek
  // kan er nooit een match zijn — dan meteen een leeg resultaat teruggeven.
  let purchasedArticleNrs: string[] | undefined;
  if (purchased) {
    const session = await getAuthSession(event);
    if (!session) return emptyResult();

    // Twee bronnen: webshopbestellingen van deze login, en de CRM-historiek
    // van de klant(en) die aan deze login gekoppeld zijn.
    const [orderRows, crmRows] = await Promise.all([
      db
        .selectDistinct({ articleNr: orderItems.articleNr })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(eq(orders.userId, session.user.id)),
      db
        .selectDistinct({ articleNr: products.articleNr })
        .from(customerPurchaseHistory)
        .innerJoin(customers, eq(customerPurchaseHistory.customerId, customers.id))
        .innerJoin(products, eq(customerPurchaseHistory.productId, products.id))
        .where(eq(customers.userId, session.user.id)),
    ]);

    purchasedArticleNrs = [
      ...new Set([...orderRows, ...crmRows].map((r) => r.articleNr)),
    ];
    if (purchasedArticleNrs.length === 0) return emptyResult();
  }

  // "Enkel winkelmandje": de klant filtert de productenlijst op precies de
  // artikelnummers die al in het mandje zitten (zie useCart.showCartOnly).
  let cartArticleNrs: string[] | undefined;
  if (articleNrs !== undefined) {
    cartArticleNrs = articleNrs
      .split(",")
      .map((nr) => nr.trim())
      .filter(Boolean);
    if (cartArticleNrs.length === 0) return emptyResult();
  }

  const filters = [
    eq(products.isActive, true),
    category ? eq(categories.slug, category) : undefined,
    supplier ? eq(products.supplier, supplier) : undefined,
    search
      ? or(
          ilike(products.name, `%${search}%`),
          ilike(products.articleNr, `%${search}%`),
          ilike(products.supplier, `%${search}%`),
        )
      : undefined,
    purchasedArticleNrs ? inArray(products.articleNr, purchasedArticleNrs) : undefined,
    cartArticleNrs ? inArray(products.articleNr, cartArticleNrs) : undefined,
  ].filter((filter) => filter !== undefined);

  const where = and(...filters);

  const orderBy = sort
    ? [sortDir === "asc" ? asc(SORT_COLUMNS[sort]) : desc(SORT_COLUMNS[sort])]
    : [asc(categories.sortOrder), asc(products.articleNr)];

  const [items, [total]] = await Promise.all([
    db
      .select({
        id: products.id,
        articleNr: products.articleNr,
        name: products.name,
        supplier: products.supplier,
        unit: products.unit,
        infoPdf: products.infoPdf,
        category: {
          id: categories.id,
          slug: categories.slug,
          name: categories.name,
          emoji: categories.emoji,
          image: categories.image,
        },
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(...orderBy)
      .limit(perPage)
      .offset((page - 1) * perPage),

    db
      .select({ value: count() })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(where),
  ]);

  return {
    items,
    pagination: {
      page,
      perPage,
      total: total?.value ?? 0,
      pageCount: Math.ceil((total?.value ?? 0) / perPage),
    },
  };
});
