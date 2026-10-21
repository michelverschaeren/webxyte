import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { cartItems } from "~~/server/database/schema";
import { requireUser } from "~~/server/utils/session";

/** DELETE /api/account/cart/items/:productId — één mandjeregel verwijderen. */
const paramsSchema = z.object({ productId: z.uuid() });

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const { productId } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  await db
    .delete(cartItems)
    .where(and(eq(cartItems.userId, user.id), eq(cartItems.productId, productId)));

  return { items: await getCartItems(user.id) };
});
