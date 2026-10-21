import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { billingDetails, customers, user as userTable } from "~~/server/database/schema";
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
 * Bedrijfsnaam, telefoon en leveringsadres horen niet bij de
 * facturatiegegevens maar bij de klant zelf (`customers`), zodat klant en
 * beheerder hetzelfde zien. De bedrijfsnaam is de klantnaam: de klant die ze
 * hier wijzigt, wijzigt ook wat de beheerder ziet, en de login volgt mee
 * (zoals bij PATCH /api/admin/customers/:id). Een login zonder klant
 * (beheerder) bewaart ze enkel in `billing_details`.
 */
const bodySchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  // Kleine letters, zoals de login: "INFO@X.BE" en "info@x.be" zijn hetzelfde adres.
  invoiceEmail: z.email().max(200).transform((value) => value.toLowerCase()),
  ...contactFields,
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const { companyName, invoiceEmail, ...contact } = await readValidatedBody(
    event,
    (data) => parseContactBody(bodySchema, data),
  );

  const details = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(billingDetails)
      .values({ companyName, invoiceEmail, userId: user.id })
      .onConflictDoUpdate({
        target: billingDetails.userId,
        set: { companyName, invoiceEmail },
      })
      .returning();

    const renamed = await tx
      .update(customers)
      .set({ name: companyName })
      .where(eq(customers.userId, user.id))
      .returning({ id: customers.id });
    if (renamed.length > 0) {
      await tx.update(userTable).set({ name: companyName }).where(eq(userTable.id, user.id));
    }

    return row!;
  });

  await saveCustomerContact(user.id, contact);

  return details;
});
