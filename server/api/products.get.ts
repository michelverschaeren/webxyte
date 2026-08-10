import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { categories, products } from "~~/server/database/schema";

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
});

const SORT_COLUMNS = {
  name: products.name,
  articleNr: products.articleNr,
  supplier: products.supplier,
  unit: products.unit,
  category: categories.name,
};

export default defineEventHandler(async (event) => {
  const { category, search, supplier, sort, sortDir, page, perPage } =
    await getValidatedQuery(event, (data) => querySchema.parse(data));

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
