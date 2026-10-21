import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { savedLists } from "~~/server/database/schema";
import { requireUser } from "#layers/auth/server/utils/session";

/** DELETE /api/account/lists/:id — items verdwijnen mee via de foreign key. */
const paramsSchema = z.object({ id: z.uuid() });

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  const deleted = await db
    .delete(savedLists)
    .where(and(eq(savedLists.id, id), eq(savedLists.userId, user.id)))
    .returning({ id: savedLists.id });

  if (deleted.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "Lijst niet gevonden." });
  }

  return { ok: true };
});
