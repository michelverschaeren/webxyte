import { z } from "zod";
import { addressSchema, updateAddress } from "~~/server/utils/customer-addresses";
import { parseContactBody } from "~~/server/utils/customer-contact";
import { requireAdmin } from "#layers/auth/server/utils/session";

/**
 * PUT /api/admin/customers/:id/addresses/:addressId — de beheerder wijzigt
 * een leveringsadres van een klant of maakt het primair.
 */
const paramsSchema = z.object({ id: z.uuid(), addressId: z.uuid() });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id, addressId } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );
  const body = await readValidatedBody(event, (data) =>
    parseContactBody(addressSchema, data),
  );

  return updateAddress(id, addressId, body);
});
