import { and, asc, count, desc, eq, ilike, or, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import {
  categories,
  orderItems,
  orders,
  products,
} from "~~/server/database/schema";
import { requireAdmin } from "#layers/auth/server/utils/session";

/**
 * GET /api/admin/products — zoals /api/products, maar admin-only en zonder
 * het `isActive`-filter: toont ook uit het assortiment gehaalde producten,
 * plus prijs, notitie en het totaal aantal ooit bestelde stuks.
 */
const querySchema = z.object({
  category: z.string().min(1).optional(),
  supplier: z.string().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  sort: z
    .enum(["name", "articleNr", "supplier", "unit", "category", "sold"])
    .optional(),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(200).default(50),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { category, supplier, search, status, sort, sortDir, page, perPage } =
    await getValidatedQuery(event, (data) => querySchema.parse(data));

  const filters = [
    category ? eq(categories.slug, category) : undefined,
    supplier ? eq(products.supplier, supplier) : undefined,
    status ? eq(products.isActive, status === "active") : undefined,
    search
      ? or(
          ilike(products.name, `%${search}%`),
          ilike(products.articleNr, `%${search}%`),
          ilike(products.supplier, `%${search}%`),
        )
      : undefined,
  ].filter((filter) => filter !== undefined);

  const where = and(...filters);

  // FILTER i.p.v. een WHERE op orders.status: dat laatste zou producten
  // zonder bestellingen wegfilteren (NULL vergelijkt nooit "waar" met !=).
  const soldQuantity = raw<number>`coalesce(sum(${orderItems.quantity}) filter (where ${orders.status} != 'geannuleerd'), 0)::int`;

  const SORT_COLUMNS = {
    name: products.name,
    articleNr: products.articleNr,
    supplier: products.supplier,
    unit: products.unit,
    category: categories.name,
    sold: soldQuantity,
  };
  const sortColumn = sort ? SORT_COLUMNS[sort] : undefined;

  const orderBy = sortColumn
    ? [sortDir === "asc" ? asc(sortColumn) : desc(sortColumn)]
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
        price: products.price,
        notes: products.notes,
        isActive: products.isActive,
        category: {
          id: categories.id,
          slug: categories.slug,
          name: categories.name,
        },
        soldQuantity,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(orderItems, eq(orderItems.articleNr, products.articleNr))
      .leftJoin(orders, eq(orders.id, orderItems.orderId))
      .where(where)
      .groupBy(products.id, categories.id)
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
    items: items.map((item) => ({
      ...item,
      price: item.price ? Number(item.price) : null,
    })),
    pagination: {
      page,
      perPage,
      total: total?.value ?? 0,
      pageCount: Math.ceil((total?.value ?? 0) / perPage),
    },
  };
});
