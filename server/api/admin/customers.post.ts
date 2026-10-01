import { generateRandomString } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/database/client";
import { customers, user } from "~~/server/database/schema";
import { sendCustomerInvite } from "~~/server/utils/auth";
import { requireAdmin } from "~~/server/utils/session";

/**
 * POST /api/admin/customers — nieuwe klant toevoegen met enkel e-mail en
 * klantnummer. Maakt een login aan (zonder wachtwoord), koppelt die aan de
 * klant en mailt een uitnodiging om zelf een wachtwoord te kiezen.
 *
 * - Klantnummer al in het CRM → die klant krijgt de login.
 * - Klantnummer onbekend → nieuwe klant met een voorlopige naam
 *   ("Klant 100145"), zoals de CRM-import dat ook doet.
 * - E-mail hoort al bij een klantlogin → het klantnummer wordt daar aan
 *   toegevoegd (één login, meerdere klantnummers); geen uitnodiging nodig.
 */
const bodySchema = z.object({
  // Better Auth bewaart e-mailadressen in kleine letters.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email().max(200)),
  customerNr: z.string().trim().min(1).max(32),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { email, customerNr } = await readValidatedBody(event, (data) =>
    bodySchema.parse(data),
  );

  const [[existingCustomer], [existingUser]] = await Promise.all([
    db
      .select({ id: customers.id, name: customers.name, userId: customers.userId })
      .from(customers)
      .where(eq(customers.customerNr, customerNr))
      .limit(1),
    db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.email, email))
      .limit(1),
  ]);

  if (existingCustomer?.userId) {
    throw createError({
      statusCode: 409,
      statusMessage: `Klant ${customerNr} heeft al een account.`,
    });
  }
  if (existingUser?.role === "admin") {
    throw createError({
      statusCode: 409,
      statusMessage: "Dit e-mailadres hoort bij een beheerder.",
    });
  }

  const name = existingCustomer?.name ?? `Klant ${customerNr}`;

  const customerId = await db.transaction(async (tx) => {
    let userId = existingUser?.id;
    if (!userId) {
      userId = generateRandomString(32, "a-z", "A-Z", "0-9");
      await tx.insert(user).values({
        id: userId,
        name,
        email,
        // Door een beheerder aangemaakt = gecontroleerd. Zonder dit behandelt
        // Better Auth het account bij de eerste login als onbewezen.
        emailVerified: true,
        role: "customer",
      });
    }

    if (existingCustomer) {
      await tx
        .update(customers)
        .set({ userId })
        .where(eq(customers.id, existingCustomer.id));
      return existingCustomer.id;
    }

    const [created] = await tx
      .insert(customers)
      .values({ customerNr, name, contactEmail: email, userId })
      .returning({ id: customers.id });
    return created!.id;
  });

  if (existingUser) {
    return { id: customerId, invited: false, linkedToExistingAccount: true };
  }

  // De klant staat er al; een mislukte mail mag dat niet terugdraaien. De
  // beheerder kan de klant dan naar "Wachtwoord vergeten" verwijzen.
  try {
    await sendCustomerInvite(email);
    return { id: customerId, invited: true, linkedToExistingAccount: false };
  } catch (err) {
    console.error(`[admin] Uitnodiging voor ${email} niet verstuurd:`, err);
    return { id: customerId, invited: false, linkedToExistingAccount: false };
  }
});
