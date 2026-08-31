import "dotenv/config";
import { auth } from "../utils/auth";
import { sql as connection } from "./client";

/**
 * Maakt een gebruiker aan vanaf de commandline.
 *
 * Nodig omdat `emailAndPassword.disableSignUp` aan staat: klanten krijgen hun
 * account van een beheerder, dus er is bewust geen publieke sign-up-route én
 * geen admin-endpoint dat gebruikers aanmaakt. Dit script doet exact wat
 * Better Auth's eigen sign-up-route doet (hash → createUser → linkAccount met
 * providerId "credential"), maar dan buiten de HTTP-laag om.
 *
 *   npx tsx server/database/create-user.ts <email> <naam> <wachtwoord> [rol]
 *
 * Rol is "customer" (default) of "admin". Draai met DATABASE_URL op de
 * database die je wil vullen — bij Neon de directe, niet-gepoolde URL.
 */
const [email, name, password, role = "customer"] = process.argv.slice(2);

if (!email || !name || !password) {
  console.error(
    "Gebruik: npx tsx server/database/create-user.ts <email> <naam> <wachtwoord> [customer|admin]",
  );
  process.exit(1);
}

if (role !== "customer" && role !== "admin") {
  console.error(`Onbekende rol "${role}". Kies "customer" of "admin".`);
  process.exit(1);
}

// Spiegelt minPasswordLength uit server/utils/auth.ts — hier zelf checken,
// want internalAdapter slaat de validatie van de sign-up-route over.
if (password.length < 8) {
  console.error("Wachtwoord moet minstens 8 tekens lang zijn.");
  process.exit(1);
}

async function main() {
  const ctx = await auth.$context;

  const existing = await ctx.internalAdapter.findUserByEmail(email!);
  if (existing) {
    console.error(`Er bestaat al een gebruiker met ${email}.`);
    process.exit(1);
  }

  // Eerst hashen: breekt er iets in de hashing, dan staat er nog geen
  // gebruiker zonder account in de database.
  const hash = await ctx.password.hash(password!);

  const user = await ctx.internalAdapter.createUser({
    email: email!,
    name: name!,
    role,
    // Geen mailer aan requireEmailVerification gekoppeld; een handmatig
    // aangemaakt account is per definitie door de beheerder geverifieerd.
    emailVerified: true,
  });

  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: hash,
  });

  console.log(`Aangemaakt: ${user.email} (${role}) — id ${user.id}`);
  await connection.end();
}

main().catch(async (error) => {
  console.error(error);
  await connection.end();
  process.exit(1);
});
