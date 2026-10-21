import { z } from "zod";
import { db } from "~~/server/database/client";
import { promotionGroups } from "~~/server/database/schema";
import {
  assertPromotionRefs,
  insertPromotions,
  promotionGroupFieldsSchema,
} from "~~/server/utils/promotions";
import { requireAdmin } from "#layers/auth/server/utils/session";

/**
 * POST /api/admin/promotions — maakt een promotie aan: een groep met naam,
 * periode en klanten, en per product een korting (de wizard bundelt
 * producten met dezelfde korting tot kortingsregels).
 */
const bodySchema = z.intersection(
  z.object({ groupName: z.string().trim().min(1, "Geef de promotie een naam.").max(120) }),
  promotionGroupFieldsSchema,
);

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));
  await assertPromotionRefs(
    body.items.map((i) => i.productId),
    body.customerIds,
  );

  const created = await db.transaction(async (tx) => {
    const [group] = await tx
      .insert(promotionGroups)
      .values({ name: body.groupName })
      .returning({ id: promotionGroups.id });
    return insertPromotions(tx, body, group!.id);
  });

  setResponseStatus(event, 201);
  return { ids: created.map((r) => r.id) };
});
