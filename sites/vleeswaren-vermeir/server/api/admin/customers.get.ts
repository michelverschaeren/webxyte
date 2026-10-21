import { asc, count, eq, ilike, or, sql as raw, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import {
  customerPurchaseHistory,
  customers,
  orderItems,
  orders,
} from "~~/server/database/schema";
import { loginStatusSql } from "~~/server/utils/customer-login";
import { requireAdmin } from "#layers/auth/server/utils/session";

/**
 * GET /api/admin/customers — klanten uit het CRM, gepagineerd, met hun
 * loginstatus en een samenvatting van hun aankoophistoriek (CRM) en hun
 * webshopbestellingen. `summary` telt
 * over alle klanten heen (los van zoeken/paginering), voor "alle klanten
 * uitnodigen". Sorteerbaar via `sort` + `sortDir`; standaard op klantnummer.
 */
const querySchema = z.object({
  search: z.string().trim().min(1).optional(),
  sort: z.enum(["customerNr", "name", "login", "history", "lastOrder"]).optional(),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { search, sort, sortDir, page, perPage } = await getValidatedQuery(event, (data) =>
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

  // Webshopbestellingen per login, om dezelfde reden apart geaggregeerd. De
  // laatste bestelling als kalenderdag in Belgische tijd, zoals het CRM.
  const web = db
    .select({
      userId: orders.userId,
      orderCount: raw<number>`count(distinct ${orders.id})::int`.as("order_count"),
      lastOrderedAt:
        raw<string>`(max(${orders.createdAt}) at time zone 'Europe/Brussels')::date::text`.as(
          "last_ordered_at",
        ),
      orderedQuantity: raw<number>`coalesce(sum(${orderItems.quantity}), 0)::int`.as(
        "ordered_quantity",
      ),
    })
    .from(orders)
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .groupBy(orders.userId)
    .as("web");

  // Loginstatus in een logische volgorde i.p.v. alfabetisch op de code.
  const loginRank = raw<number>`case ${loginStatusSql}
    when 'active' then 0 when 'invited' then 1 when 'not-invited' then 2 else 3 end`;

  const SORT_COLUMNS = {
    customerNr: customers.customerNr,
    name: customers.name,
    login: loginRank,
    history: history.lastPurchasedAt,
    lastOrder: web.lastOrderedAt,
  };

  // Klanten zonder historiek/bestelling altijd achteraan, in beide richtingen;
  // klantnummer als tiebreaker zodat de paginering stabiel blijft.
  const orderBy: SQL[] = sort
    ? [
        raw`${SORT_COLUMNS[sort]} ${raw.raw(sortDir === "asc" ? "asc" : "desc")} nulls last`,
        asc(customers.customerNr),
      ]
    : [asc(customers.customerNr)];

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
        orderCount: raw<number>`coalesce(${web.orderCount}, 0)::int`,
        lastOrderedAt: web.lastOrderedAt,
        orderedQuantity: raw<number>`coalesce(${web.orderedQuantity}, 0)::int`,
      })
      .from(customers)
      .leftJoin(history, eq(history.customerId, customers.id))
      .leftJoin(web, eq(web.userId, customers.userId))
      .where(where)
      .orderBy(...orderBy)
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
