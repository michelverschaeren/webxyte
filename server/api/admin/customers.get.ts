import { asc, count, eq, ilike, or, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { customerPurchaseHistory, customers } from "~~/server/database/schema";
import { loginStatusSql } from "~~/server/utils/customer-login";
import { requireAdmin } from "~~/server/utils/session";

/**
 * GET /api/admin/customers — klanten uit het CRM, gepagineerd, met hun
 * loginstatus en een samenvatting van hun aankoophistoriek. `summary` telt
 * over alle klanten heen (los van zoeken/paginering), voor "alle klanten
 * uitnodigen".
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

  const [items, [total], [summary]] = await Promise.all([
    db
      .select({
        id: customers.id,
        customerNr: customers.customerNr,
        name: customers.name,
        contactEmail: customers.contactEmail,
        phone: customers.phone,
        loginStatus: loginStatusSql,
        productCount: raw<number>`coalesce(${history.productCount}, 0)::int`,
        lastPurchasedAt: history.lastPurchasedAt,
      })
      .from(customers)
      .leftJoin(history, eq(history.customerId, customers.id))
      .where(where)
      .orderBy(asc(customers.customerNr))
      .limit(perPage)
      .offset((page - 1) * perPage),

    db.select({ value: count() }).from(customers).where(where),

    db
      .select({
        notInvited: raw<number>`count(*) filter (where ${customers.contactEmail} is not null and ${customers.userId} is null)::int`,
        noEmail: raw<number>`count(*) filter (where ${customers.contactEmail} is null)::int`,
      })
      .from(customers),
  ]);

  return {
    items,
    summary: summary ?? { notInvited: 0, noEmail: 0 },
    pagination: {
      page,
      perPage,
      total: total?.value ?? 0,
      pageCount: Math.ceil((total?.value ?? 0) / perPage),
    },
  };
});
