import { eq } from "drizzle-orm";
import { db } from "~~/server/database/client";
import { billingDetails } from "~~/server/database/schema";
import { requireUser } from "~~/server/utils/session";

/**
 * GET /api/account/billing — de facturatiegegevens van de ingelogde klant,
 * of `null` zolang die nog niets ingevuld heeft.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const [details] = await db
    .select()
    .from(billingDetails)
    .where(eq(billingDetails.userId, user.id))
    .limit(1);

  return details ?? null;
});
