import { eq } from "drizzle-orm";
import { db } from "~~/server/database/client";
import { customers } from "~~/server/database/schema";
import { listAddresses } from "~~/server/utils/customer-addresses";
import { requireUser } from "~~/server/utils/session";

/**
 * GET /api/account/contact — telefoon en leveringsadressen van de ingelogde
 * klant zoals ze bij de klant zelf staan: dezelfde die de beheerder ziet en
 * bewerkt. Het primaire adres staat eerst. `isCustomer` is false voor een
 * login zonder klant (beheerder).
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const [customer] = await db
    .select({ id: customers.id, phone: customers.phone })
    .from(customers)
    .where(eq(customers.userId, user.id))
    .limit(1);

  return {
    isCustomer: Boolean(customer),
    phone: customer?.phone ?? null,
    addresses: customer ? await listAddresses(customer.id) : [],
  };
});
