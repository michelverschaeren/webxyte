import { z } from "zod";
import { db } from "~~/server/database/client";
import { savedListItems, savedLists } from "~~/server/database/schema";
import { requireUser } from "~~/server/utils/session";

/**
 * POST /api/account/lists — nieuw bestellijstje aanmaken.
 * Alleen articleNr + aantal komen van de client (nooit een database-id);
 * naam/leverancier worden bij het uitlezen live uit de catalogus gehaald.
 */
const bodySchema = z.object({
  name: z.string().trim().min(1).max(60),
  items: z
    .array(
      z.object({
        articleNr: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1).max(9999),
      }),
    )
    .max(500),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));
  const requested = mergeQuantitiesByArticleNr(body.items);
  const byArticleNr = await resolveProductsByArticleNr(
    requested.map((i) => i.articleNr),
  );

  const list = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(savedLists)
      .values({ userId: user.id, name: body.name })
      .returning();

    const resolved = requested
      .map((item) => {
        const product = byArticleNr.get(item.articleNr);
        return product
          ? { listId: created!.id, productId: product.id, quantity: item.quantity }
          : null;
      })
      .filter((item) => item !== null);

    if (resolved.length > 0) {
      await tx.insert(savedListItems).values(resolved);
    }

    return created!;
  });

  const skipped = requested
    .filter((i) => !byArticleNr.has(i.articleNr))
    .map((i) => i.articleNr);

  setResponseStatus(event, 201);
  return { id: list.id, skipped };
});
