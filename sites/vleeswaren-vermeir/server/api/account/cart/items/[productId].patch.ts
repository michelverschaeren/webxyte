import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { cartItems } from "~~/server/database/schema";
import { requireUser } from "#layers/auth/server/utils/session";

/**
 * PATCH /api/account/cart/items/:productId — aantal van één mandjeregel
 * bijwerken. Aantal 0 of minder verwijdert de regel, net als de lokale
 * `updateQuantity`. `:productId` is enkel een sleutel binnen het eigen
 * mandje van de klant (WHERE userId = ...) — geen nieuwe productverwijzing,
 * dus geen articleNr-omweg nodig zoals bij het aanmaken van regels.
 */
const paramsSchema = z.object({ productId: z.uuid() });
const bodySchema = z.object({ quantity: z.coerce.number().int() });

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const { productId } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );
  const { quantity } = await readValidatedBody(event, (data) =>
    bodySchema.parse(data),
  );

  const where = and(eq(cartItems.userId, user.id), eq(cartItems.productId, productId));

  if (quantity <= 0) {
    await db.delete(cartItems).where(where);
  } else {
    await db.update(cartItems).set({ quantity, updatedAt: new Date() }).where(where);
  }

  return { items: await getCartItems(user.id) };
});
