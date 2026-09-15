import { asc, count, eq, ilike, or, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import {
  customerPurchaseHistory,
  customers,
  user,
} from "~~/server/database/schema";
import { requireAdmin } from "~~/server/utils/session";

/**
 * GET /api/admin/customers — klanten uit het CRM, gepagineerd, met het
 * gekoppelde account en een samenvatting van hun aankoophistoriek.
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

  const where = search
    ? or(
        ilike(customers.customerNr, `%${search}%`),
        ilike(customers.name, `%${search}%`),
        ilike(customers.contactEmail, `%${search}%`),
        ilike(user.email, `%${search}%`),
      )
    : undefined;

  // Historiek apart aggregeren: rechtstreeks joinen zou per klant één rij per
  // product opleveren en de paginering scheeftrekken.
  const history = db
    .select({
      customerId: customerPurchaseHistory.customerId,
      productCount: raw<number>`count(*)::int`.as("product_count"),
      lastPurchasedAt: raw<string>`max(${customerPurchaseHistory.lastPurchasedAt})::text`.as(
        "last_purchased_at",
      ),
    })
    .from(customerPurchaseHistory)
    .groupBy(customerPurchaseHistory.customerId)
    .as("history");

  const [items, [total]] = await Promise.all([
    db
      .select({
        id: customers.id,
        customerNr: customers.customerNr,
        name: customers.name,
        contactEmail: customers.contactEmail,
        phone: customers.phone,
        accountEmail: user.email,
        productCount: raw<number>`coalesce(${history.productCount}, 0)::int`,
        lastPurchasedAt: history.lastPurchasedAt,
      })
      .from(customers)
      .leftJoin(user, eq(customers.userId, user.id))
      .leftJoin(history, eq(history.customerId, customers.id))
      .where(where)
      .orderBy(asc(customers.customerNr))
      .limit(perPage)
      .offset((page - 1) * perPage),

    db
      .select({ value: count() })
      .from(customers)
      .leftJoin(user, eq(customers.userId, user.id))
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
