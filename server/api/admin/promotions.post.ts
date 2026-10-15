import { z } from "zod";
import { db } from "~~/server/database/client";
import { promotionCustomers, promotions } from "~~/server/database/schema";
import {
  assertPromotionRefs,
  promotionColumns,
  promotionFieldsSchema,
} from "~~/server/utils/promotions";
import { requireAdmin } from "~~/server/utils/session";

/**
 * POST /api/admin/promotions — maakt promoties aan. Meerdere producten in één
 * keer kan: elk product krijgt dan een eigen promotie met dezelfde korting,
 * periode en klanten, zodat ze daarna los te bewerken zijn.
 */
const bodySchema = z.intersection(
  z.object({ productIds: z.array(z.uuid()).min(1).max(100) }),
  promotionFieldsSchema,
);

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));
  const productIds = [...new Set(body.productIds)];
  const customerIds = body.customerIds ? [...new Set(body.customerIds)] : null;
  await assertPromotionRefs(productIds, customerIds);

  const columns = promotionColumns(body);

  const created = await db.transaction(async (tx) => {
    const rows = await tx
      .insert(promotions)
      .values(productIds.map((productId) => ({ ...columns, productId })))
      .returning({ id: promotions.id });

    if (customerIds) {
      await tx.insert(promotionCustomers).values(
        rows.flatMap((row) =>
          customerIds.map((customerId) => ({ promotionId: row.id, customerId })),
        ),
      );
    }
    return rows;
  });

  setResponseStatus(event, 201);
  return { ids: created.map((r) => r.id) };
});
