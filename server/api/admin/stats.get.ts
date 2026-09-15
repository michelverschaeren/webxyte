import { desc, eq, sql as raw } from "drizzle-orm";
import { db } from "~~/server/database/client";
import { customers, orderItems, orders, products } from "~~/server/database/schema";
import { requireAdmin } from "~~/server/utils/session";

/**
 * GET /api/admin/stats — kerncijfers voor het dashboard-overzicht.
 * "Verkocht" = bestelde hoeveelheid met bestellingen met status
 * "geannuleerd" uitgesloten (er is geen aparte "voltooid, dus verkocht"-
 * boekhouding — dit is de eenvoudigste eerlijke definitie).
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const [[productCounts], [customerCount], [soldTotal], topProducts] =
    await Promise.all([
      db
        .select({
          total: raw<number>`count(*)::int`,
          active: raw<number>`count(*) filter (where ${products.isActive})::int`,
        })
        .from(products),

      db.select({ value: raw<number>`count(*)::int` }).from(customers),

      db
        .select({
          value: raw<number>`coalesce(sum(${orderItems.quantity}) filter (where ${orders.status} != 'geannuleerd'), 0)::int`,
        })
        .from(orderItems)
        .leftJoin(orders, eq(orders.id, orderItems.orderId)),

      db
        .select({
          articleNr: orderItems.articleNr,
          name: orderItems.name,
          totalQuantity: raw<number>`coalesce(sum(${orderItems.quantity}) filter (where ${orders.status} != 'geannuleerd'), 0)::int`,
        })
        .from(orderItems)
        .leftJoin(orders, eq(orders.id, orderItems.orderId))
        .groupBy(orderItems.articleNr, orderItems.name)
        .orderBy(
          desc(
            raw`coalesce(sum(${orderItems.quantity}) filter (where ${orders.status} != 'geannuleerd'), 0)`,
          ),
        )
        .limit(10),
    ]);

  return {
    totalProducts: productCounts?.total ?? 0,
    activeProducts: productCounts?.active ?? 0,
    customerCount: customerCount?.value ?? 0,
    soldQuantity: soldTotal?.value ?? 0,
    topProducts: topProducts.filter((p) => p.totalQuantity > 0),
  };
});
