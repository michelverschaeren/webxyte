import { eq, inArray, notExists } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { promotionGroups, promotions } from "~~/server/database/schema";
import { requireAdmin } from "~~/server/utils/session";

/**
 * POST /api/admin/promotions/delete — verwijdert een selectie promoties; de
 * klantkoppelingen verdwijnen mee via cascade. Groepen die daardoor leeg
 * raken, worden mee opgeruimd.
 */
const bodySchema = z.object({ ids: z.array(z.uuid()).min(1).max(200) });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { ids } = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const deleted = await db.transaction(async (tx) => {
    const rows = await tx
      .delete(promotions)
      .where(inArray(promotions.id, ids))
      .returning({ id: promotions.id });
    await tx
      .delete(promotionGroups)
      .where(
        notExists(
          tx
            .select({ id: promotions.id })
            .from(promotions)
            .where(eq(promotions.groupId, promotionGroups.id)),
        ),
      );
    return rows;
  });

  return { deleted: deleted.length };
});
