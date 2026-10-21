import "dotenv/config";
import { generateRandomString, hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { db, sql as connection } from "./client";
import { account, user } from "./schema";

/**
 * Maakt een beheerder aan, of promoveert een bestaand account tot admin.
 * Een nieuw account krijgt een willekeurig wachtwoord (eenmalig getoond);
 * de beheerder kan dat daarna wijzigen via "Wachtwoord vergeten".
 *
 *   npx tsx server/database/create-admin.ts naam@domein.be "Weergavenaam"
 */
async function createAdmin(rawEmail: string | undefined, name: string | undefined) {
  // Better Auth bewaart e-mailadressen in kleine letters.
  const email = rawEmail?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Geef een geldig e-mailadres op.");
  }

  const [existing] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existing) {
    await db
      .update(user)
      .set({ role: "admin", emailVerified: true })
      .where(eq(user.id, existing.id));
    console.log(
      existing.role === "admin"
        ? `${email} was al admin (e-mail als bevestigd gemarkeerd).`
        : `${email} bestond al en is nu admin. Het wachtwoord is ongewijzigd.`,
    );
    return;
  }

  const password = generateRandomString(16, "a-z", "A-Z", "0-9");
  const userId = generateRandomString(32, "a-z", "A-Z", "0-9");

  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id: userId,
      name: name?.trim() || email,
      email,
      // Door een beheerder aangemaakt = gecontroleerd. Zonder dit wist Better
      // Auth het wachtwoord bij de eerste login via e-maillink.
      emailVerified: true,
      role: "admin",
    });
    await tx.insert(account).values({
      id: generateRandomString(32, "a-z", "A-Z", "0-9"),
      accountId: userId,
      providerId: "credential",
      userId,
      password: await hashPassword(password),
    });
  });

  console.log(`Admin aangemaakt\n  e-mail:     ${email}\n  wachtwoord: ${password}`);
}

const [email, name] = process.argv.slice(2);

createAdmin(email, name)
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => connection.end());
