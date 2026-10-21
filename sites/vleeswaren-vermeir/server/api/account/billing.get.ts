import { eq } from "drizzle-orm";
import { db } from "~~/server/database/client";
import { billingDetails, customers } from "~~/server/database/schema";
import { requireUser } from "#layers/auth/server/utils/session";

/**
 * GET /api/account/billing — de facturatiegegevens van de ingelogde klant,
 * of `null` zolang die nog niets ingevuld heeft. De bedrijfsnaam is die van
 * de klant (`customers.name`), dezelfde die de beheerder ziet; enkel een
 * login zonder klant valt terug op `billing_details`.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const [[details], [customer]] = await Promise.all([
    db
      .select()
      .from(billingDetails)
      .where(eq(billingDetails.userId, user.id))
      .limit(1),
    db
      .select({ name: customers.name })
      .from(customers)
      .where(eq(customers.userId, user.id))
      .limit(1),
  ]);

  if (!details) return null;
  return { ...details, companyName: customer?.name ?? details.companyName };
});
