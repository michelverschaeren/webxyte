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
 *
 * Verstuurt de lanceringsmail (aankondiging nieuwe website) i.p.v. de korte
 * uitnodiging: dit is de eenmalige actie bij de livegang.
 */

/**
 * Tijdelijk uit, ook hier en niet enkel in de admin: anders kan een
 * rechtstreekse POST toch alle klanten mailen. Samen aanzetten met
 * INVITE_ALL_ENABLED in app/pages/admin/klanten/index.vue.
 */
const INVITE_ALL_ENABLED = false;

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  if (!INVITE_ALL_ENABLED) {
    throw createError({
      statusCode: 403,
      statusMessage: "Alle klanten uitnodigen is tijdelijk uitgeschakeld.",
    });
  }

  const pending = await db
    .select({ id: customers.id, customerNr: customers.customerNr })
    .from(customers)
    .where(and(isNotNull(customers.contactEmail), isNull(customers.userId)))
    .orderBy(asc(customers.customerNr));

  const failed: { customerNr: string; reason: string }[] = [];
  for (const customer of pending) {
    try {
      await inviteCustomer(customer.id, { mail: "launch" });
    } catch (err) {
      const reason =
        (err as { statusMessage?: string }).statusMessage ?? "Mail niet verstuurd.";
      console.error(`[admin] Uitnodiging klant ${customer.customerNr} mislukt:`, err);
      failed.push({ customerNr: customer.customerNr, reason });
    }
  }

  return { invited: pending.length - failed.length, failed };
});
