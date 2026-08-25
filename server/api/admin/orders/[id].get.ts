import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { orderItems, orders, user } from "~~/server/database/schema";
import type { BillingDetails } from "~~/server/database/schema";
import { requireAdmin } from "~~/server/utils/session";

/**
 * GET /api/admin/orders/:id — één bestelling, met klantgegevens erbij.
 * Geen eigendomscontrole zoals bij /api/account/orders/:id — elke admin mag
 * elke bestelling inzien.
 */
const paramsSchema = z.object({ id: z.uuid() });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      items: {
        orderBy: orderItems.createdAt,
        with: { product: true },
      },
    },
  });

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: "Bestelling niet gevonden.",
    });
  }

  const [customer] = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, order.userId))
    .limit(1);

  return {
    id: order.id,
    createdAt: order.createdAt,
    billing: order.billingSnapshot as BillingDetails,
    customer,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      articleNr: item.articleNr,
      name: item.name,
      supplier: item.supplier,
      unit: item.unit,
      quantity: item.quantity,
      available: item.product?.isActive === true,
    })),
  };
});
