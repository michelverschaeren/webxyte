import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { customerProductOverrides, customers, products } from "~~/server/database/schema";
import { requireAdmin } from "~~/server/utils/session";

/**
 * PUT /api/admin/customers/:id/products/:productId — admin-only. Past
 * "Mijn producten" van een klant aan (zie server/utils/customer-products.ts):
 * `included: true` voegt het product toe, `false` verbergt het, `null` wist
 * de correctie zodat weer enkel de aankoophistoriek telt.
 */
const paramsSchema = z.object({ id: z.uuid(), productId: z.uuid() });
const bodySchema = z.object({ included: z.boolean().nullable() });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id, productId } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );
  const { included } = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const [[customer], [product]] = await Promise.all([
    db.select({ id: customers.id }).from(customers).where(eq(customers.id, id)).limit(1),
    db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1),
  ]);
  if (!customer) {
    throw createError({ statusCode: 404, statusMessage: "Klant niet gevonden." });
  }
  if (!product) {
    throw createError({ statusCode: 404, statusMessage: "Product niet gevonden." });
  }

  if (included === null) {
    await db
      .delete(customerProductOverrides)
      .where(
        and(
          eq(customerProductOverrides.customerId, id),
          eq(customerProductOverrides.productId, productId),
        ),
      );
  } else {
    await db
      .insert(customerProductOverrides)
      .values({ customerId: id, productId, included })
      .onConflictDoUpdate({
        target: [customerProductOverrides.customerId, customerProductOverrides.productId],
        set: { included, updatedAt: new Date() },
      });
  }

  return { included };
});
