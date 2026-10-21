import { z } from "zod";
import {
  addressSchema,
  requireCustomerId,
  updateAddress,
} from "~~/server/utils/customer-addresses";
import { parseContactBody } from "~~/server/utils/customer-contact";
import { requireUser } from "~~/server/utils/session";

/**
 * PUT /api/account/addresses/:id — de klant wijzigt een eigen leveringsadres
 * of maakt het primair (`isPrimary: true`).
 */
const paramsSchema = z.object({ id: z.uuid() });

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const customerId = await requireCustomerId(user.id);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );
  const body = await readValidatedBody(event, (data) =>
    parseContactBody(addressSchema, data),
  );

  return updateAddress(customerId, id, body);
});
