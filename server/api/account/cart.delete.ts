import { eq } from "drizzle-orm";
import { db } from "~~/server/database/client";
import { cartItems } from "~~/server/database/schema";
import { requireUser } from "~~/server/utils/session";

/** DELETE /api/account/cart — het volledige winkelmandje leegmaken. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  await db.delete(cartItems).where(eq(cartItems.userId, user.id));

  return { ok: true };
});
