import { asc, desc, eq, ilike, or, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import {
  customers,
  orders,
  products,
  user,
} from "~~/server/database/schema";
import { requireAdmin } from "~~/server/utils/session";

/**
 * GET /api/admin/search — globale zoekbalk in de beheer-topbalk. Zoekt
 * tegelijk in klanten, bestellingen en producten, met dezelfde voorwaarden
 * als de lijstendpoints, en geeft per soort de eerste paar treffers terug.
 */
const querySchema = z.object({
  q: z.string().trim().min(2).max(100),
});

const LIMIT = 5;

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { q } = await getValidatedQuery(event, (data) => querySchema.parse(data));
  const like = `%${q}%`;

  const [customerRows, orderRows, productRows] = await Promise.all([
    db
      .select({
        id: customers.id,
        customerNr: customers.customerNr,
        name: customers.name,
      })
      .from(customers)
      .where(
        or(
          ilike(customers.customerNr, like),
          ilike(customers.name, like),
          ilike(customers.contactEmail, like),
        ),
      )
      .orderBy(asc(customers.customerNr))
      .limit(LIMIT),

    db
      .select({
        id: orders.id,
        createdAt: orders.createdAt,
        // Klantnaam; een login zonder klant toont de naam van de login.
        customerName: raw<string>`coalesce(${customers.name}, ${user.name})`,
      })
      .from(orders)
      .innerJoin(user, eq(orders.userId, user.id))
      .leftJoin(customers, eq(customers.userId, user.id))
      .where(
        or(
          ilike(raw`coalesce(${customers.name}, ${user.name})`, like),
          ilike(user.email, like),
          // Bestelnummer: het begin van de id.
          ilike(raw`${orders.id}::text`, `${q}%`),
        ),
      )
      .orderBy(desc(orders.createdAt))
      .limit(LIMIT),

    db
      .select({
        id: products.id,
        articleNr: products.articleNr,
        name: products.name,
        isActive: products.isActive,
      })
      .from(products)
      .where(
        or(
          ilike(products.name, like),
          ilike(products.articleNr, like),
          ilike(products.supplier, like),
        ),
      )
      .orderBy(asc(products.name))
      .limit(LIMIT),
  ]);

  return { customers: customerRows, orders: orderRows, products: productRows };
});
