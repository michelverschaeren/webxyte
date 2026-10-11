import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { customers } from "~~/server/database/schema";
import { addressSchema, createAddress } from "~~/server/utils/customer-addresses";
import { parseContactBody } from "~~/server/utils/customer-contact";
import { requireAdmin } from "~~/server/utils/session";

/**
 * POST /api/admin/customers/:id/addresses — de beheerder voegt een
 * leveringsadres toe voor een klant. Zelfde adressen als de klant zelf ziet.
 */
const paramsSchema = z.object({ id: z.uuid() });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = await getValidatedRouterParams(event, (data) =>
    paramsSchema.parse(data),
  );
  const body = await readValidatedBody(event, (data) =>
    parseContactBody(addressSchema, data),
  );

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);
  if (!customer) {
    throw createError({ statusCode: 404, statusMessage: "Klant niet gevonden." });
  }

  setResponseStatus(event, 201);
  return createAddress(id, body);
});
