import "dotenv/config";
import { generateRandomString, hashPassword } from "better-auth/crypto";
import { eq, inArray, like } from "drizzle-orm";
import { db, sql as connection } from "./client";
import { account, customers, user } from "./schema";

/**
 * TIJDELIJK — om te bekijken wat een klant ziet. Maakt per klantnummer een
 * testlogin aan en koppelt die aan de klant. Verwijder dit script (en de
 * testaccounts) zodra de controle klaar is.
 *
 *   npx tsx server/database/test-customer-login.ts 100145 100392
 *   npx tsx server/database/test-customer-login.ts --remove
 */
const EMAIL_DOMAIN = "test.vleeswarenvermeir.be";
const testEmail = (customerNr: string) => `klant-${customerNr}@${EMAIL_DOMAIN}`;

async function remove() {
  const testUsers = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(like(user.email, `%@${EMAIL_DOMAIN}`));

  if (testUsers.length === 0) {
    console.log("Geen testaccounts gevonden.");
    return;
  }

  // customers.userId staat op ON DELETE SET NULL; sessies, account, mandje en
  // lijstjes cascaden mee. Testbestellingen blokkeren (RESTRICT) — dan faalt dit.
  await db.delete(user).where(inArray(user.id, testUsers.map((u) => u.id)));
  for (const u of testUsers) console.log(`Verwijderd: ${u.email}`);
}

async function create(customerNrs: string[]) {
  for (const customerNr of customerNrs) {
    const [customer] = await db
      .select({ id: customers.id, name: customers.name, userId: customers.userId })
      .from(customers)
      .where(eq(customers.customerNr, customerNr))
      .limit(1);

    if (!customer) {
      console.warn(`! Klant ${customerNr} bestaat niet — overgeslagen.`);
      continue;
    }
    if (customer.userId) {
      console.warn(`! Klant ${customerNr} heeft al een gekoppeld account — overgeslagen.`);
      continue;
    }

    const email = testEmail(customerNr);
    const password = generateRandomString(16, "a-z", "A-Z", "0-9");
    const userId = generateRandomString(32, "a-z", "A-Z", "0-9");

    await db.transaction(async (tx) => {
      await tx.insert(user).values({
        id: userId,
        name: `TEST ${customer.name}`,
        email,
        emailVerified: true,
        role: "customer",
      });
      await tx.insert(account).values({
        id: generateRandomString(32, "a-z", "A-Z", "0-9"),
        accountId: userId,
        providerId: "credential",
        userId,
        password: await hashPassword(password),
      });
      await tx.update(customers).set({ userId }).where(eq(customers.id, customer.id));
    });

    console.log(`${customerNr}  ${customer.name}\n  e-mail:     ${email}\n  wachtwoord: ${password}\n`);
  }
}

const args = process.argv.slice(2);
const run = args.includes("--remove") ? remove() : create(args.filter((a) => /^\d+$/.test(a)));

run
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => connection.end());
