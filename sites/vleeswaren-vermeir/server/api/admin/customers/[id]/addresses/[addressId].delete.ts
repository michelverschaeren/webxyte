import { z } from "zod";
import { deleteAddress } from "~~/server/utils/customer-addresses";
import { requireAdmin } from "~~/server/utils/session";

/**
 * DELETE /api/admin/customers/:id/addresses/:addressId — de beheerder
 * verwijdert een leveringsadres van een klant.
 */
const paramsSchema = z.object({ id: z.uuid(), addressId: z.uuid() });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id, addressId } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );

  await deleteAddress(id, addressId);
  return { ok: true };
});
