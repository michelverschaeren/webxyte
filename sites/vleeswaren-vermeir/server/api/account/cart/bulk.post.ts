import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { cartItems } from "~~/server/database/schema";
import { requireUser } from "#layers/auth/server/utils/session";

/**
 * POST /api/account/cart/bulk — meerdere regels in één keer toevoegen aan
 * of het mandje mee vervangen. Eén endpoint voor alle "in bulk"-scenario's:
 * het gastenmandje samenvoegen bij het inloggen, "Vervang mandje"/"Toevoegen"
 * vanuit een lijst, opnieuw bestellen, en meerdere lijsten combineren.
 *
 * mode "merge": telt aantallen op bij wat al in het mandje zit.
 * mode "replace": maakt het mandje eerst leeg.
 */
const bodySchema = z.object({
  items: z
    .array(
      z.object({
        articleNr: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1).max(9999),
      }),
    )
    .max(500),
  mode: z.enum(["merge", "replace"]),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const body = await readValidatedBody(event, (data) => bodySchema.parse(data));

  const requested = mergeQuantitiesByArticleNr(body.items);
  const byArticleNr = await resolveProductsByArticleNr(
    requested.map((i) => i.articleNr),
  );

  const resolved = requested
    .map((item) => {
      const product = byArticleNr.get(item.articleNr);
      return product && product.isActive
        ? { productId: product.id, quantity: item.quantity }
        : null;
    })
    .filter((item) => item !== null);

  const skipped = requested
    .filter((i) => !byArticleNr.get(i.articleNr)?.isActive)
    .map((i) => i.articleNr);

  await db.transaction(async (tx) => {
    if (body.mode === "replace") {
      await tx.delete(cartItems).where(eq(cartItems.userId, user.id));
    }

    for (const item of resolved) {
      await tx
        .insert(cartItems)
        .values({ userId: user.id, productId: item.productId, quantity: item.quantity })
        .onConflictDoUpdate({
          target: [cartItems.userId, cartItems.productId],
          set: {
            quantity: sql`${cartItems.quantity} + ${item.quantity}`,
            updatedAt: new Date(),
          },
        });
    }
  });

  return { items: await getCartItems(user.id), skipped };
});
