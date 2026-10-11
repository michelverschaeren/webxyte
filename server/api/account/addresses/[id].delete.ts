import { z } from "zod";
import { deleteAddress, requireCustomerId } from "~~/server/utils/customer-addresses";
import { requireUser } from "~~/server/utils/session";

/** DELETE /api/account/addresses/:id — de klant verwijdert een eigen leveringsadres. */
const paramsSchema = z.object({ id: z.uuid() });

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const customerId = await requireCustomerId(user.id);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  await deleteAddress(customerId, id);
  return { ok: true };
});
