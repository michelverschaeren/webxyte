import { generateRandomString } from "better-auth/crypto";
import { eq, sql as raw } from "drizzle-orm";
import { db } from "../database/client";
import { account, customers, session, user } from "../database/schema";
import { sendCustomerInvite } from "./auth";

/**
 * Eén klantnummer = één e-mailadres = één login. De admin koppelt niets:
 * de login wordt bij de uitnodiging aangemaakt met het contactadres van de
 * klant, en volgt dat adres daarna (zie PATCH /api/admin/customers/:id).
 */

/**
 * Loginstatus van een klant, als SQL-expressie voor lijsten:
 * - `no-email`    geen contactadres → kan niet uitgenodigd worden
 * - `not-invited` adres staat er, maar nog geen login
 * - `invited`     login aangemaakt, nog nooit ingelogd
 * - `active`      heeft een wachtwoord gekozen of al eens ingelogd
 */
export type CustomerLoginStatus = "no-email" | "not-invited" | "invited" | "active";

export const loginStatusSql = raw<CustomerLoginStatus>`case
  when ${customers.contactEmail} is null then 'no-email'
  when ${customers.userId} is null then 'not-invited'
  when exists (select 1 from ${account} where ${account.userId} = ${customers.userId} and ${account.password} is not null)
    or exists (select 1 from ${session} where ${session.userId} = ${customers.userId}) then 'active'
  else 'invited'
end`;

/** Postgres' foutcode voor een geschonden unieke index. */
export function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

/**
 * Maakt (indien nodig) de login van een klant aan en mailt een uitnodiging.
 * Opnieuw aanroepen stuurt een nieuwe uitnodiging. Gooit een h3-fout als de
 * klant geen adres heeft of het adres al bij een andere login hoort.
 */
export async function inviteCustomer(customerId: string) {
  const [customer] = await db
    .select({
      id: customers.id,
      name: customers.name,
      contactEmail: customers.contactEmail,
      userId: customers.userId,
    })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!customer) {
    throw createError({ statusCode: 404, statusMessage: "Klant niet gevonden." });
  }
  const email = customer.contactEmail;
  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: "Vul eerst een e-mailadres in voor deze klant.",
    });
  }

  const [owner] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (owner && owner.id !== customer.userId) {
    const [ownerCustomer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.userId, owner.id))
      .limit(1);
    if (owner.role === "admin" || ownerCustomer) {
      throw createError({
        statusCode: 409,
        statusMessage:
          owner.role === "admin"
            ? "Dit e-mailadres hoort bij een beheerder."
            : "Dit e-mailadres is al de login van een andere klant.",
      });
    }
  }

  await db.transaction(async (tx) => {
    if (customer.userId) {
      // Login bestaat al: zorg dat hij het huidige contactadres gebruikt.
      await tx.update(user).set({ email }).where(eq(user.id, customer.userId));
      return;
    }

    // Een losse login met dit adres (zonder klant) wordt overgenomen.
    let userId = owner?.id;
    if (!userId) {
      userId = generateRandomString(32, "a-z", "A-Z", "0-9");
      await tx.insert(user).values({
        id: userId,
        name: customer.name,
        email,
        // Door een beheerder aangemaakt = gecontroleerd. Zonder dit behandelt
        // Better Auth het account bij de eerste login als onbewezen.
        emailVerified: true,
        role: "customer",
      });
    }
    await tx.update(customers).set({ userId }).where(eq(customers.id, customer.id));
  });

  await sendCustomerInvite(email);
  return { email };
}
