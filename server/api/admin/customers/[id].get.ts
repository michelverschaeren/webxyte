import { desc, eq, getTableColumns, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import {
  billingDetails,
  customerPurchaseHistory,
  customers,
  orderItems,
  orders,
  products,
  user,
} from "~~/server/database/schema";
import { loginStatusSql } from "~~/server/utils/customer-login";
import { requireAdmin } from "~~/server/utils/session";

/**
 * GET /api/admin/customers/:id — één CRM-klant, admin-only: contactgegevens,
 * loginstatus, aankoophistoriek uit het CRM en — als de klant een login
 * heeft — diens facturatiegegevens en webshopbestellingen.
 */
const paramsSchema = z.object({ id: z.uuid() });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  const [customer] = await db
    .select({ ...getTableColumns(customers), loginStatus: loginStatusSql })
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (!customer) {
    throw createError({ statusCode: 404, statusMessage: "Klant niet gevonden." });
  }

  const purchaseHistory = await db
    .select({
      productId: products.id,
      articleNr: products.articleNr,
      name: products.name,
      supplier: products.supplier,
      unit: products.unit,
      isActive: products.isActive,
      lastPurchasedAt: raw<string>`${customerPurchaseHistory.lastPurchasedAt}::text`,
    })
    .from(customerPurchaseHistory)
    .innerJoin(products, eq(customerPurchaseHistory.productId, products.id))
    .where(eq(customerPurchaseHistory.customerId, id))
    .orderBy(desc(customerPurchaseHistory.lastPurchasedAt), products.articleNr);

  let account = null;
  let billing = null;
  let accountOrders: {
    id: string;
    createdAt: Date;
    lineCount: number;
    totalQuantity: number;
  }[] = [];

  if (customer.userId) {
    const userId = customer.userId;
    const [linkedUser, [linkedBilling], linkedOrders] = await Promise.all([
      db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1),
      db.select().from(billingDetails).where(eq(billingDetails.userId, userId)).limit(1),
      db
        .select({
          id: orders.id,
          createdAt: orders.createdAt,
          lineCount: raw<number>`count(${orderItems.id})::int`,
          totalQuantity: raw<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
        })
        .from(orders)
        .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(eq(orders.userId, userId))
        .groupBy(orders.id)
        .orderBy(desc(orders.createdAt)),
    ]);
    account = linkedUser[0] ?? null;
    billing = linkedBilling ?? null;
    accountOrders = linkedOrders;
  }

  return {
    customer: {
      id: customer.id,
      customerNr: customer.customerNr,
      name: customer.name,
      contactEmail: customer.contactEmail,
      phone: customer.phone,
      deliveryStreet: customer.deliveryStreet,
      deliveryPostalCode: customer.deliveryPostalCode,
      deliveryCity: customer.deliveryCity,
      deliveryCountry: customer.deliveryCountry,
      loginStatus: customer.loginStatus,
    },
    account,
    billing,
    orders: accountOrders,
    purchaseHistory,
  };
});
