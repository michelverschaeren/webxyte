import { requireUser } from "~~/server/utils/session";

/** GET /api/account/cart — het winkelmandje van de ingelogde klant. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  return { items: await getCartItems(user.id) };
});
