import { and, asc, count, desc, eq, ilike, inArray, max, or, sql } from "drizzle-orm";
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
import { activePromotionsForUser } from "~~/server/utils/customer-promotions";
import { getAuthSession } from "~~/server/utils/session";

/**
 * GET /api/products
 * Query: ?category=salamis&search=salami&supplier=Ter+Beke&sort=name&sortDir=asc&page=1&perPage=50
 *
 * Geeft producten terug mét hun categorie, gepagineerd. Het returntype
 * wordt volledig afgeleid uit de select — geen handgeschreven interface.
 *
 * Gasten zien enkel het gamma (naam + categorie): artikelnummer, fabrikant,
 * eenheid en productfiche zijn bedrijfsgevoelig en enkel voor ingelogde
 * klanten. Daarom zoekt een gast ook enkel op productnaam en negeert de API
 * voor hem elke filter of sortering op die velden — anders kan je de
 * koppeling product ↔ fabrikant alsnog afleiden.
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
  /** Enkel producten met een promotie die vandaag geldt voor deze klant. */
  promotions: z.coerce.boolean().optional(),
  /** Komma-gescheiden artikelnummers — gebruikt om de productenlijst te
   * beperken tot exact de inhoud van het winkelmandje. */
  articleNrs: z.string().trim().optional(),
});

/** "Mijn producten": aankopen van de laatste zoveel maanden. */
const PURCHASED_MONTHS = 18;

/** Sorteringen die ook een gast mag gebruiken. */
const GUEST_SORTS = new Set(["name", "category"]);

const SORT_COLUMNS = {
  name: products.name,
  articleNr: products.articleNr,
  supplier: products.supplier,
  unit: products.unit,
  category: categories.name,
};

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, (data) => querySchema.parse(data));
  const session = await getAuthSession(event);
  const isGuest = !session;

  const { category, search, sortDir, page, perPage } = query;
  const supplier = isGuest ? undefined : query.supplier;
  const sort = isGuest && query.sort && !GUEST_SORTS.has(query.sort) ? undefined : query.sort;
  const purchased = isGuest ? undefined : query.purchased;
  const promotionsOnly = isGuest ? undefined : query.promotions;

  // Promoties van deze klant (enkel ingelogd): voor het label per product,
  // de filter "Promoties" en de teller die bepaalt of die knop verschijnt.
  const promoByProduct = session
    ? await activePromotionsForUser(session.user.id)
    : new Map<string, never[]>();
  const promotionProductIds = [...promoByProduct.keys()];
  const articleNrs = isGuest ? undefined : query.articleNrs;

  const emptyResult = () => ({
    items: [],
    pagination: { page, perPage, total: 0, pageCount: 0 },
    listCategoryCounts: {},
    promotionCount: promotionProductIds.length,
  });

  if (promotionsOnly && promotionProductIds.length === 0) return emptyResult();

  // "Mijn producten": beperkt tot artikelnummers die de laatste
  // PURCHASED_MONTHS maanden in een bestelling van deze klant zaten (gasten:
  // zie hierboven, genegeerd).
  // Zonder bestelhistoriek kan er nooit een match zijn — dan meteen een leeg
  // resultaat teruggeven.
  let purchasedArticleNrs: string[] | undefined;
  /** Artikelnr → laatste aankoopdatum (JJJJ-MM-DD), enkel bij `purchased`. */
  const lastPurchased = new Map<string, string>();
  if (purchased && session) {
    // Twee bronnen: webshopbestellingen van deze login, en de CRM-historiek
    // van de klant achter deze login. Per bron de laatste datum; de
    // bestellingen als kalenderdag in Belgische tijd, zoals het CRM.
    const [orderRows, crmRows] = await Promise.all([
      db
        .select({
          articleNr: orderItems.articleNr,
          last: sql<string>`(max(${orders.createdAt}) at time zone 'Europe/Brussels')::date::text`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.userId, session.user.id),
            sql`${orders.createdAt} >= now() - make_interval(months => ${PURCHASED_MONTHS})`,
          ),
        )
        .groupBy(orderItems.articleNr),
      db
        .select({
          articleNr: products.articleNr,
          last: sql<string>`${max(customerPurchaseHistory.lastPurchasedAt)}::text`,
        })
        .from(customerPurchaseHistory)
        .innerJoin(customers, eq(customerPurchaseHistory.customerId, customers.id))
        .innerJoin(products, eq(customerPurchaseHistory.productId, products.id))
        .where(
          and(
            eq(customers.userId, session.user.id),
            sql`${customerPurchaseHistory.lastPurchasedAt} >= current_date - make_interval(months => ${PURCHASED_MONTHS})`,
          ),
        )
        .groupBy(products.articleNr),
    ]);

    // ISO-datums vergelijken als tekst = chronologisch.
    for (const { articleNr, last } of [...orderRows, ...crmRows]) {
      const current = lastPurchased.get(articleNr);
      if (!current || last > current) lastPurchased.set(articleNr, last);
    }

    purchasedArticleNrs = [...lastPurchased.keys()];
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
      ? isGuest
        ? ilike(products.name, `%${search}%`)
        : or(
            ilike(products.name, `%${search}%`),
            ilike(products.articleNr, `%${search}%`),
            ilike(products.supplier, `%${search}%`),
          )
      : undefined,
    purchasedArticleNrs ? inArray(products.articleNr, purchasedArticleNrs) : undefined,
    cartArticleNrs ? inArray(products.articleNr, cartArticleNrs) : undefined,
    promotionsOnly ? inArray(products.id, promotionProductIds) : undefined,
  ].filter((filter) => filter !== undefined);

  const where = and(...filters);

  // Zit de klant in een lijst (eerder afgenomen, mandje of bestelling/lijstje),
  // dan geven we ook mee in welke categorieën die lijst producten heeft — los
  // van de gekozen categorie en zoekterm, zodat de categorielijst niet krimpt
  // terwijl de klant erin filtert.
  const listArticleNrs = purchasedArticleNrs ?? cartArticleNrs;
  const listFilter = listArticleNrs
    ? inArray(products.articleNr, listArticleNrs)
    : promotionsOnly
      ? inArray(products.id, promotionProductIds)
      : undefined;

  const orderBy = sort
    ? [sortDir === "asc" ? asc(SORT_COLUMNS[sort]) : desc(SORT_COLUMNS[sort])]
    : [asc(categories.sortOrder), asc(products.articleNr)];

  const [items, [total], listCategories] = await Promise.all([
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

    listFilter
      ? db
          .select({ slug: categories.slug, count: count() })
          .from(products)
          .innerJoin(categories, eq(products.categoryId, categories.id))
          .where(and(eq(products.isActive, true), listFilter))
          .groupBy(categories.slug)
      : null,
  ]);

  return {
    items: isGuest
      ? items.map(({ id, name, category }) => ({
          id,
          name,
          category,
          articleNr: null,
          supplier: null,
          unit: null,
          infoPdf: null,
          lastPurchasedAt: null,
          promotions: [],
        }))
      : items.map((item) => ({
          ...item,
          /** Laatste aankoop door deze klant; enkel bij "eerder afgenomen". */
          lastPurchasedAt: lastPurchased.get(item.articleNr) ?? null,
          /** Promoties die vandaag voor deze klant op dit product gelden. */
          promotions: (promoByProduct.get(item.id) ?? []).map((p) => ({
            id: p.id,
            label: p.label,
            hint: p.hint,
            endsOn: p.endsOn,
          })),
        })),
    pagination: {
      page,
      perPage,
      total: total?.value ?? 0,
      pageCount: Math.ceil((total?.value ?? 0) / perPage),
    },
    /** Aantal producten per categorie-slug in de actieve lijst; `null`
     * zonder lijst-filter (dan gelden alle categorieën). */
    listCategoryCounts: listCategories
      ? Object.fromEntries(listCategories.map((c) => [c.slug, c.count]))
      : null,
    /** Aantal producten met een promotie voor deze klant; 0 = geen knop. */
    promotionCount: promotionProductIds.length,
  };
});
