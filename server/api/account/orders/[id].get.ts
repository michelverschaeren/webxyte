import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { orderItems, orders } from "~~/server/database/schema";
import type { BillingSnapshot } from "~~/server/database/schema";
import { requireUser } from "~~/server/utils/session";

/**
 * GET /api/account/orders/:id — één bestelling van de ingelogde klant.
 *
 * De regels tonen de bevroren snapshot (wat er toen besteld werd) en zeggen
 * er via `available` bij of het artikel vandaag nog bestelbaar is — dat
 * bepaalt wat "opnieuw bestellen" mag overnemen.
 */
const paramsSchema = z.object({ id: z.uuid() });

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.userId, user.id)),
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

  return {
    id: order.id,
    name: order.name,
    note: order.note,
    createdAt: order.createdAt,
    billing: order.billingSnapshot as BillingSnapshot,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      articleNr: item.articleNr,
      name: item.name,
      supplier: item.supplier,
      unit: item.unit,
      quantity: item.quantity,
      /** Promoties die bij het bestellen golden (leeg op oudere bestellingen). */
      promotions: item.promotions ?? [],
      available: item.product?.isActive === true,
    })),
  };
});
