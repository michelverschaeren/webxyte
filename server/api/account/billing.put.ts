import { z } from "zod";
import { db } from "~~/server/database/client";
import { billingDetails } from "~~/server/database/schema";
import {
  contactFields,
  parseContactBody,
  saveCustomerContact,
} from "~~/server/utils/customer-contact";
import { requireUser } from "~~/server/utils/session";

/**
 * PUT /api/account/billing — de gegevens van "Mijn account → Gegevens"
 * opslaan. Eén facturatieprofiel per klant: bestaat er al een rij, dan wordt
 * die bijgewerkt.
 *
 * Telefoon en leveringsadres horen niet bij de facturatiegegevens maar bij
 * de klant zelf (`customers`), zodat klant en beheerder hetzelfde zien. Een
 * login zonder klant (beheerder) heeft ze dus niet.
 */
const bodySchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  invoiceEmail: z.email().max(200),
  ...contactFields,
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const { companyName, invoiceEmail, ...contact } = await readValidatedBody(
    event,
    (data) => parseContactBody(bodySchema, data),
  );

  const [details] = await db
    .insert(billingDetails)
    .values({ companyName, invoiceEmail, userId: user.id })
    .onConflictDoUpdate({
      target: billingDetails.userId,
      set: { companyName, invoiceEmail },
    })
    .returning();

  await saveCustomerContact(user.id, contact);

  return details;
});
