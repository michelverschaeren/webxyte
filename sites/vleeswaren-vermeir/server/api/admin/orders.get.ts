import { and, count, desc, eq, ilike, inArray, isNotNull, or, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import {
  customers,
  orderItems,
  orders,
  user,
} from "~~/server/database/schema";
import { requireAdmin } from "#layers/auth/server/utils/session";

/**
 * GET /api/admin/orders — alle bestellingen van alle klanten, gepagineerd,
 * met de klantnaam en een samenvatting per bestelling. Zelfde vorm
 * als /api/account/orders, maar dan zonder userId-filter en met wie de
 * bestelling plaatste erbij.
 */
const querySchema = z.object({
  search: z.string().trim().min(1).optional(),
  /** Enkel de bestellingen van deze CRM-klant (via diens login). */
  customer: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { search, customer: customerId, page, perPage } = await getValidatedQuery(
    event,
    (data) => querySchema.parse(data),
  );

  // Leveringsadres zoals bevroren op de bestelling (`BillingSnapshot`), niet
  // het huidige adres van de klant; ontbreekt op heel oude bestellingen.
  const street = raw<string | null>`${orders.billingSnapshot}->>'street'`;
  const postalCode = raw<string | null>`${orders.billingSnapshot}->>'postalCode'`;
  const city = raw<string | null>`${orders.billingSnapshot}->>'city'`;
  // De klantnaam (= bedrijfsnaam, door klant en beheerder te wijzigen);
  // een login zonder klant (beheerder, test) toont de naam van de login.
  const customerName = raw<string>`coalesce(${customers.name}, ${user.name})`;

  // Klant zonder login = nog geen bestellingen: inArray op een lege
  // subquery geeft dan gewoon niets terug.
  const [customer] = customerId
    ? await db
        .select({ id: customers.id, customerNr: customers.customerNr, name: customers.name })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1)
    : [];
  if (customerId && !customer) {
    throw createError({ statusCode: 404, statusMessage: "Klant niet gevonden." });
  }

  const filters = [
    customerId
      ? inArray(
          orders.userId,
          db
            .select({ userId: customers.userId })
            .from(customers)
            .where(and(eq(customers.id, customerId), isNotNull(customers.userId))),
        )
      : undefined,
    search
      ? or(
          ilike(customerName, `%${search}%`),
          ilike(user.email, `%${search}%`),
          ilike(street, `%${search}%`),
          ilike(postalCode, `%${search}%`),
          ilike(city, `%${search}%`),
          // Bestelnummer: het begin van de id (kort of volledig geplakt).
          ilike(raw`${orders.id}::text`, `${search}%`),
        )
      : undefined,
  ].filter((filter) => filter !== undefined);

  const where = and(...filters);

  const [items, [total]] = await Promise.all([
    db
      .select({
        id: orders.id,
        createdAt: orders.createdAt,
        customerName,
        customerEmail: user.email,
        delivery: { street, postalCode, city },
        lineCount: raw<number>`count(${orderItems.id})::int`,
        totalQuantity: raw<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      })
      .from(orders)
      .innerJoin(user, eq(orders.userId, user.id))
      .leftJoin(customers, eq(customers.userId, user.id))
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(where)
      .groupBy(orders.id, user.id, customers.id)
      .orderBy(desc(orders.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),

    db
      .select({ value: count() })
      .from(orders)
      .innerJoin(user, eq(orders.userId, user.id))
      .leftJoin(customers, eq(customers.userId, user.id))
      .where(where),
  ]);

  return {
    items,
    /** De klant achter de `customer`-filter, voor de filterchip. */
    customer: customer ?? null,
    pagination: {
      page,
      perPage,
      total: total?.value ?? 0,
      pageCount: Math.ceil((total?.value ?? 0) / perPage),
    },
  };
});
