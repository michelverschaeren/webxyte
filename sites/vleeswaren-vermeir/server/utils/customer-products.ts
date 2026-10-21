import { and, eq, max, sql } from "drizzle-orm";
import { db } from "~~/server/database/client";
import {
  customerProductOverrides,
  customerPurchaseHistory,
  customers,
  orderItems,
  orders,
  products,
} from "~~/server/database/schema";

/** "Mijn producten": aankopen van de laatste zoveel maanden. */
export const PURCHASED_MONTHS = 18;

/** Waarom een product bij "Mijn producten" staat. */
export type CustomerProductSource = "webshop" | "crm" | "admin";

export interface CustomerProductEntry {
  /** Laatste aankoop (JJJJ-MM-DD); null als enkel de beheerder het toevoegde. */
  lastPurchasedAt: string | null;
  sources: CustomerProductSource[];
}

/**
 * "Mijn producten" van een klant, per artikelnummer — exact wat de klant in
 * de webshop te zien krijgt: webshopbestellingen van de login en de
 * CRM-historiek van de klant (beide de laatste PURCHASED_MONTHS maanden),
 * plus wat de beheerder toevoegde, min wat de beheerder verborg.
 *
 * Geef de login (`userId`), de CRM-klant (`customerId`) of beide; de
 * ontbrekende wordt opgezocht.
 */
export async function customerProducts(owner: {
  userId?: string | null;
  customerId?: string | null;
}): Promise<Map<string, CustomerProductEntry>> {
  const userId = owner.userId ?? null;
  let customerId = owner.customerId ?? null;
  if (userId && !customerId) {
    const [row] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);
    customerId = row?.id ?? null;
  }

  const result = new Map<string, CustomerProductEntry>();
  const add = (articleNr: string, source: CustomerProductSource, last: string | null) => {
    const entry = result.get(articleNr) ?? { lastPurchasedAt: null, sources: [] };
    // ISO-datums vergelijken als tekst = chronologisch.
    if (last && (!entry.lastPurchasedAt || last > entry.lastPurchasedAt)) {
      entry.lastPurchasedAt = last;
    }
    if (!entry.sources.includes(source)) entry.sources.push(source);
    result.set(articleNr, entry);
  };

  // Per bron de laatste datum; de bestellingen als kalenderdag in Belgische
  // tijd, zoals het CRM.
  const [orderRows, crmRows, overrideRows] = await Promise.all([
    userId
      ? db
          .select({
            articleNr: orderItems.articleNr,
            last: sql<string>`(max(${orders.createdAt}) at time zone 'Europe/Brussels')::date::text`,
          })
          .from(orderItems)
          .innerJoin(orders, eq(orderItems.orderId, orders.id))
          .where(
            and(
              eq(orders.userId, userId),
              sql`${orders.createdAt} >= now() - make_interval(months => ${PURCHASED_MONTHS})`,
            ),
          )
          .groupBy(orderItems.articleNr)
      : [],
    customerId
      ? db
          .select({
            articleNr: products.articleNr,
            last: sql<string>`${max(customerPurchaseHistory.lastPurchasedAt)}::text`,
          })
          .from(customerPurchaseHistory)
          .innerJoin(products, eq(customerPurchaseHistory.productId, products.id))
          .where(
            and(
              eq(customerPurchaseHistory.customerId, customerId),
              sql`${customerPurchaseHistory.lastPurchasedAt} >= current_date - make_interval(months => ${PURCHASED_MONTHS})`,
            ),
          )
          .groupBy(products.articleNr)
      : [],
    customerId
      ? db
          .select({
            articleNr: products.articleNr,
            included: customerProductOverrides.included,
          })
          .from(customerProductOverrides)
          .innerJoin(products, eq(customerProductOverrides.productId, products.id))
          .where(eq(customerProductOverrides.customerId, customerId))
      : [],
  ]);

  for (const { articleNr, last } of orderRows) add(articleNr, "webshop", last);
  for (const { articleNr, last } of crmRows) add(articleNr, "crm", last);
  for (const { articleNr, included } of overrideRows) {
    if (included) add(articleNr, "admin", null);
    else result.delete(articleNr);
  }

  return result;
}
