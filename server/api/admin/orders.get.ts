import { and, count, desc, eq, ilike, or, sql as raw } from "drizzle-orm";
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
 * GET /api/admin/orders — alle bestellingen van alle klanten, gepagineerd,
 * met klant/bedrijfsnaam en een samenvatting per bestelling. Zelfde vorm
 * als /api/account/orders, maar dan zonder userId-filter en met wie de
 * bestelling plaatste erbij.
 */
const querySchema = z.object({
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { search, page, perPage } = await getValidatedQuery(
    event,
    (data) => querySchema.parse(data),
  );

  const filters = [
    search
      ? or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`),
          ilike(billingDetails.companyName, `%${search}%`),
        )
      : undefined,
  ].filter((filter) => filter !== undefined);

  const where = and(...filters);

  const [items, [total]] = await Promise.all([
    db
      .select({
        id: orders.id,
        createdAt: orders.createdAt,
        customerName: user.name,
        customerEmail: user.email,
        companyName: billingDetails.companyName,
        lineCount: raw<number>`count(${orderItems.id})::int`,
        totalQuantity: raw<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      })
      .from(orders)
      .innerJoin(user, eq(orders.userId, user.id))
      .leftJoin(billingDetails, eq(billingDetails.userId, user.id))
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(where)
      .groupBy(orders.id, user.id, billingDetails.id)
      .orderBy(desc(orders.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),

    db
      .select({ value: count() })
      .from(orders)
      .innerJoin(user, eq(orders.userId, user.id))
      .leftJoin(billingDetails, eq(billingDetails.userId, user.id))
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
