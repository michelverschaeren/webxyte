import { and, asc, isNotNull, isNull } from "drizzle-orm";
import { db } from "~~/server/database/client";
import { customers } from "~~/server/database/schema";
import { inviteCustomer } from "~~/server/utils/customer-login";
import { requireAdmin } from "~~/server/utils/session";

/**
 * POST /api/admin/customers/invite-all — nodigt elke klant uit die een
 * e-mailadres heeft maar nog geen login. Klanten die al uitgenodigd zijn,
 * worden overgeslagen; zo is opnieuw uitvoeren veilig.
 *
 * Bewust één voor één: de mailer krijgt geen piek, en één mislukte mail
 * houdt de rest niet tegen.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const pending = await db
    .select({ id: customers.id, customerNr: customers.customerNr })
    .from(customers)
    .where(and(isNotNull(customers.contactEmail), isNull(customers.userId)))
    .orderBy(asc(customers.customerNr));

  const failed: { customerNr: string; reason: string }[] = [];
  for (const customer of pending) {
    try {
      await inviteCustomer(customer.id);
    } catch (err) {
      const reason =
        (err as { statusMessage?: string }).statusMessage ?? "Mail niet verstuurd.";
      console.error(`[admin] Uitnodiging klant ${customer.customerNr} mislukt:`, err);
      failed.push({ customerNr: customer.customerNr, reason });
    }
  }

  return { invited: pending.length - failed.length, failed };
});
