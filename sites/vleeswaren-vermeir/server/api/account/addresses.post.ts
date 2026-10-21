import {
  addressSchema,
  createAddress,
  requireCustomerId,
} from "~~/server/utils/customer-addresses";
import { parseContactBody } from "~~/server/utils/customer-contact";
import { requireUser } from "#layers/auth/server/utils/session";

/**
 * POST /api/account/addresses — de klant voegt zelf een leveringsadres toe.
 * Het eerste adres wordt automatisch het primaire.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const customerId = await requireCustomerId(user.id);

  const body = await readValidatedBody(event, (data) =>
    parseContactBody(addressSchema, data),
  );

  setResponseStatus(event, 201);
  return createAddress(customerId, body);
});
