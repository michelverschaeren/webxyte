import { inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { promotions } from "~~/server/database/schema";
import { requireAdmin } from "~~/server/utils/session";

/**
 * POST /api/admin/promotions/delete — verwijdert een selectie promoties; de
 * klantkoppelingen verdwijnen mee via cascade.
 */
const bodySchema = z.object({ ids: z.array(z.uuid()).min(1).max(200) });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { ids } = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const deleted = await db
    .delete(promotions)
    .where(inArray(promotions.id, ids))
    .returning({ id: promotions.id });

  return { deleted: deleted.length };
});
