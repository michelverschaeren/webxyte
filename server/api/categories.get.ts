import { and, asc, count, eq } from "drizzle-orm";
import { db } from "~~/server/database/client";
import { categories, products } from "~~/server/database/schema";

/**
 * GET /api/categories
 * Alle categorieën met het aantal actieve producten erin — precies wat
 * de CategorySidebar nodig heeft.
 */
export default defineEventHandler(async () => {
  return db
    .select({
      id: categories.id,
      code: categories.code,
      slug: categories.slug,
      name: categories.name,
      emoji: categories.emoji,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(
      products,
      and(eq(products.categoryId, categories.id), eq(products.isActive, true)),
    )
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder));
});
