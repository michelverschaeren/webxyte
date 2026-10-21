import { asc, count } from "drizzle-orm";
import { db } from "~~/server/database/client";
import { products } from "~~/server/database/schema";
import { requireAdmin } from "#layers/auth/server/utils/session";

/**
 * GET /api/admin/suppliers — alle leveranciers uit de catalogus (ook van
 * inactieve producten), met hun aantal producten. Voedt de
 * leveranciersfilter op /admin/producten en /admin/promoties.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  return db
    .select({ name: products.supplier, productCount: count() })
    .from(products)
    .groupBy(products.supplier)
    .orderBy(asc(products.supplier));
});
