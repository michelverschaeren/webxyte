import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { savedListItems, savedLists } from "~~/server/database/schema";
import { requireUser } from "#layers/auth/server/utils/session";

/**
 * PUT /api/account/lists/:id — naam en/of inhoud van een lijstje bijwerken.
 * Items worden in hun geheel vervangen; dat is eenvoudiger en correcter
 * dan verschillen bijhouden bij deze lijstgroottes. Net als bij het aanmaken
 * stuurt de client enkel articleNr + aantal, nooit een database-id.
 */
const paramsSchema = z.object({ id: z.uuid() });

const bodySchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  items: z
    .array(
      z.object({
        articleNr: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1).max(9999),
      }),
    )
    .max(500)
    .optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );
  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const requested = body.items ? mergeQuantitiesByArticleNr(body.items) : null;
  const byArticleNr = requested
    ? await resolveProductsByArticleNr(requested.map((i) => i.articleNr))
    : null;

  const skipped = requested
    ? requested.filter((i) => !byArticleNr!.has(i.articleNr)).map((i) => i.articleNr)
    : [];

  await db.transaction(async (tx) => {
    const [list] = await tx
      .select({ id: savedLists.id })
      .from(savedLists)
      .where(and(eq(savedLists.id, id), eq(savedLists.userId, user.id)))
      .limit(1);

    if (!list) {
      throw createError({ statusCode: 404, statusMessage: "Lijst niet gevonden." });
    }

    // updatedAt volgt via $onUpdate, dus ook bij een pure items-wijziging
    // moet deze update draaien.
    await tx
      .update(savedLists)
      .set({ name: body.name ?? undefined, updatedAt: new Date() })
      .where(eq(savedLists.id, id));

    if (!requested) return;

    await tx.delete(savedListItems).where(eq(savedListItems.listId, id));

    const resolved = requested
      .map((item) => {
        const product = byArticleNr!.get(item.articleNr);
        return product
          ? { listId: id, productId: product.id, quantity: item.quantity }
          : null;
      })
      .filter((item) => item !== null);

    if (resolved.length > 0) {
      await tx.insert(savedListItems).values(resolved);
    }
  });

  return { ok: true, skipped };
});
