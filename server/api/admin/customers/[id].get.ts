import { eq, desc, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import {
  billingDetails,
  orderItems,
  orders,
  user,
} from "~~/server/database/schema";
import { requireAdmin } from "~~/server/utils/session";

/**
 * GET /api/admin/customers/:id — klantgegevens + volledige bestelhistoriek,
 * admin-only. Zelfde samenvatting per bestelling als /api/account/orders,
 * maar dan voor een opgegeven klant i.p.v. de ingelogde gebruiker.
 */
const paramsSchema = z.object({ id: z.string().min(1) });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  const [customer] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);

  if (!customer) {
    throw createError({ statusCode: 404, statusMessage: "Klant niet gevonden." });
  }

  const [billing] = await db
    .select()
    .from(billingDetails)
    .where(eq(billingDetails.userId, id))
    .limit(1);

  const customerOrders = await db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
      lineCount: raw<number>`count(${orderItems.id})::int`,
      totalQuantity: raw<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
    })
    .from(orders)
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(eq(orders.userId, id))
    .groupBy(orders.id)
    .orderBy(desc(orders.createdAt));

  return {
    customer,
    billing: billing ?? null,
    orders: customerOrders,
  };
});
