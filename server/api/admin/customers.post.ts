import { eq, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { customers, user } from "~~/server/database/schema";
import { addressSchema, createAddress } from "~~/server/utils/customer-addresses";
import { inviteCustomer, isUniqueViolation } from "~~/server/utils/customer-login";
import { requireAdmin } from "~~/server/utils/session";

/**
 * POST /api/admin/customers — klant toevoegen met klantnummer en e-mail, en
 * meteen uitnodigen. Het e-mailadres wordt de login (zonder wachtwoord; de
 * klant kiest er zelf een via de uitnodiging).
 *
 * - Klantnummer al in het CRM → die klant krijgt dit adres en de login;
 *   een ingevulde bedrijfsnaam vervangt de naam uit het CRM.
 * - Klantnummer onbekend → nieuwe klant. Zonder bedrijfsnaam krijgt hij een
 *   voorlopige naam ("Klant 100145"), zoals de CRM-import dat ook doet.
 * - Eén e-mailadres hoort bij één klant: een adres dat al in gebruik is,
 *   wordt geweigerd.
 * - Een leveringsadres is optioneel: ingevuld staat het al klaar bij de
 *   klant (primair als het zijn eerste is), die het zelf nog kan wijzigen.
 */
const bodySchema = z.object({
  // Better Auth bewaart e-mailadressen in kleine letters.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email().max(200)),
  customerNr: z.string().trim().min(1).max(32),
  name: z.string().trim().max(200).optional(),
  address: addressSchema.omit({ isPrimary: true }).optional(),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { email, customerNr, name, address } = await readValidatedBody(event, (data) =>
    bodySchema.parse(data),
  );

  const [[existingCustomer], [emailOwner], [adminUser]] = await Promise.all([
    db
      .select({ id: customers.id, userId: customers.userId })
      .from(customers)
      .where(eq(customers.customerNr, customerNr))
      .limit(1),
    db
      .select({ customerNr: customers.customerNr })
      .from(customers)
      .where(raw`lower(${customers.contactEmail}) = ${email}`)
      .limit(1),
    db
      .select({ id: user.id })
      .from(user)
      .where(raw`${user.email} = ${email} and ${user.role} = 'admin'`)
      .limit(1),
  ]);

  if (existingCustomer?.userId) {
    throw createError({
      statusCode: 409,
      statusMessage: `Klant ${customerNr} heeft al een login.`,
    });
  }
  if (emailOwner && emailOwner.customerNr !== customerNr) {
    throw createError({
      statusCode: 409,
      statusMessage: `Dit e-mailadres hoort al bij klant ${emailOwner.customerNr}.`,
    });
  }
  if (adminUser) {
    throw createError({
      statusCode: 409,
      statusMessage: "Dit e-mailadres hoort bij een beheerder.",
    });
  }

  let customerId: string;
  try {
    if (existingCustomer) {
      await db
        .update(customers)
        .set({ contactEmail: email, ...(name ? { name } : {}) })
        .where(eq(customers.id, existingCustomer.id));
      customerId = existingCustomer.id;
    } else {
      const [created] = await db
        .insert(customers)
        .values({ customerNr, name: name || `Klant ${customerNr}`, contactEmail: email })
        .returning({ id: customers.id });
      customerId = created!.id;
    }
  } catch (err) {
    // Twee beheerders tegelijk met hetzelfde klantnummer of adres.
    if (isUniqueViolation(err)) {
      throw createError({
        statusCode: 409,
        statusMessage: "Dit klantnummer of e-mailadres is net al in gebruik genomen.",
      });
    }
    throw err;
  }

  // Net als de uitnodiging: een mislukt adres mag de klant niet terugdraaien.
  if (address) {
    try {
      await createAddress(customerId, address);
    } catch (err) {
      console.error(`[admin] Leveringsadres voor klant ${customerNr} niet opgeslagen:`, err);
    }
  }

  // De klant staat er al; een mislukte uitnodiging mag dat niet terugdraaien.
  // De beheerder kan opnieuw uitnodigen vanaf de klantpagina.
  try {
    await inviteCustomer(customerId);
    return { id: customerId, invited: true };
  } catch (err) {
    console.error(`[admin] Uitnodiging voor ${email} niet verstuurd:`, err);
    return { id: customerId, invited: false };
  }
});
