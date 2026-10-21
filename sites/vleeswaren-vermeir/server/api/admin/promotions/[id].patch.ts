import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { promotionCustomers, promotions } from "~~/server/database/schema";
import {
  assertPromotionRefs,
  promotionColumns,
  promotionFieldsSchema,
} from "~~/server/utils/promotions";
import { requireAdmin } from "#layers/auth/server/utils/session";

/**
 * PATCH /api/admin/promotions/:id — vervangt product, korting, periode en
 * klanten van één promotie (de wizard stuurt altijd alles mee).
 */
const paramsSchema = z.object({ id: z.uuid() });

const bodySchema = z.intersection(
  z.object({ productId: z.uuid() }),
  promotionFieldsSchema,
);

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) => paramsSchema.parse(data));
  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));
  const customerIds = body.customerIds ? [...new Set(body.customerIds)] : null;
  await assertPromotionRefs([body.productId], customerIds);

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(promotions)
      .set({ ...promotionColumns(body), productId: body.productId })
      .where(eq(promotions.id, id))
      .returning({ id: promotions.id });
    if (!row) return null;

    await tx.delete(promotionCustomers).where(eq(promotionCustomers.promotionId, id));
    if (customerIds) {
      await tx
        .insert(promotionCustomers)
        .values(customerIds.map((customerId) => ({ promotionId: id, customerId })));
    }
    return row;
  });

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: "Promotie niet gevonden." });
  }

  return { id: updated.id };
});
