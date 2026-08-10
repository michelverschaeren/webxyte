import { eq, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { orderItems, orders, products } from "~~/server/database/schema";
import { requireAdmin } from "~~/server/utils/session";

/**
 * GET /api/admin/products/:id — één product met alle velden, voor het
 * bewerk-formulier. `soldQuantity` telt bestellingen op, "geannuleerd"
 * uitgesloten (zelfde regel als /api/admin/products).
 */
const paramsSchema = z.object({ id: z.uuid() });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { category: true },
  });

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: "Product niet gevonden." });
  }

  const [soldRow] = await db
    .select({
      soldQuantity: raw<number>`coalesce(sum(${orderItems.quantity}) filter (where ${orders.status} != 'geannuleerd'), 0)::int`,
    })
    .from(orderItems)
    .leftJoin(orders, eq(orders.id, orderItems.orderId))
    .where(eq(orderItems.articleNr, product.articleNr));
  const soldQuantity = soldRow?.soldQuantity ?? 0;

  return {
    ...product,
    price: product.price ? Number(product.price) : null,
    soldQuantity,
  };
});
