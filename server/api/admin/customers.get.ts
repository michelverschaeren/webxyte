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
 * GET /api/admin/customers — klanten (rol "customer"), gepagineerd, met
 * bedrijfsnaam en een samenvatting van hun bestelgeschiedenis.
 */
const querySchema = z.object({
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { search, page, perPage } = await getValidatedQuery(event, (data) =>
    querySchema.parse(data),
  );

  const filters = [
    eq(user.role, "customer"),
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
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        companyName: billingDetails.companyName,
        orderCount: raw<number>`count(distinct ${orders.id})::int`,
        totalQuantity: raw<number>`coalesce(sum(${orderItems.quantity}) filter (where ${orders.status} != 'geannuleerd'), 0)::int`,
        lastOrderAt: raw<string | null>`max(${orders.createdAt})`,
      })
      .from(user)
      .leftJoin(billingDetails, eq(billingDetails.userId, user.id))
      .leftJoin(orders, eq(orders.userId, user.id))
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(where)
      .groupBy(user.id, billingDetails.id)
      .orderBy(desc(user.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),

    db
      .select({ value: count() })
      .from(user)
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
