import { count, desc, eq, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { orderItems, orders } from "~~/server/database/schema";
import { requireUser } from "~~/server/utils/session";

/**
 * GET /api/account/orders — bestelgeschiedenis van de ingelogde klant,
 * gepagineerd, met een samenvatting per bestelling.
 */
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const { page, perPage } = await getValidatedQuery(event, (data) =>
    querySchema.parse(data),
  );

  const where = eq(orders.userId, user.id);

  const [items, [total]] = await Promise.all([
    db
      .select({
        id: orders.id,
        status: orders.status,
        name: orders.name,
        createdAt: orders.createdAt,
        lineCount: raw<number>`count(${orderItems.id})::int`,
        totalQuantity: raw<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(where)
      .groupBy(orders.id)
      .orderBy(desc(orders.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),

    db.select({ value: count() }).from(orders).where(where),
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
