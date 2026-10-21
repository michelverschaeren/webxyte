import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { promotionGroups, promotions } from "~~/server/database/schema";
import {
  assertPromotionRefs,
  insertPromotions,
  promotionGroupFieldsSchema,
} from "~~/server/utils/promotions";
import { requireAdmin } from "~~/server/utils/session";

/**
 * PUT /api/admin/promotion-groups/:id — vervangt naam, producten (elk met
 * eigen korting), periode en klanten van een groep. De wizard stuurt altijd
 * de hele groep; de promoties worden opnieuw aangemaakt (niets verwijst naar
 * hun id, bestelregels bewaren hun promotie als tekst).
 */
const paramsSchema = z.object({ id: z.uuid() });

const bodySchema = z.intersection(
  z.object({ name: z.string().trim().min(1).max(120) }),
  promotionGroupFieldsSchema,
);

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) => paramsSchema.parse(data));
  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));
  await assertPromotionRefs(
    body.items.map((i) => i.productId),
    body.customerIds,
  );

  const updated = await db.transaction(async (tx) => {
    const [group] = await tx
      .update(promotionGroups)
      .set({ name: body.name })
      .where(eq(promotionGroups.id, id))
      .returning({ id: promotionGroups.id });
    if (!group) return null;

    // Klantkoppelingen verdwijnen mee via cascade.
    await tx.delete(promotions).where(eq(promotions.groupId, id));
    await insertPromotions(tx, body, id);
    return group;
  });

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: "Promotiegroep niet gevonden." });
  }

  return { id: updated.id };
});
