import { createHash } from "node:crypto";
import { betterAuth } from "better-auth";
import { generateRandomString } from "better-auth/crypto";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db, schema } from "../database/client";
import { sendAuthLinkMail, sendLaunchMail } from "./mail";

/**
 * De Better Auth server-instantie. Alles in server/utils wordt door Nitro
 * automatisch geïmporteerd, dus `auth` is overal in server/ beschikbaar —
 * maar we importeren hem expliciet voor duidelijke types.
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  /**
   * Better Auth weigert requests van een onbekende origin (CSRF-bescherming).
   * In productie is dat strikt BETTER_AUTH_URL; lokaal wisselt de dev-server
   * van poort zodra 3000 bezet is, wat anders "Invalid origin" oplevert bij
   * elke login. Daarom is localhost tijdens ontwikkeling poort-onafhankelijk
   * via Better Auth's eigen wildcard-patronen (enkel `string[]` toegestaan,
   * geen RegExp — vandaar de `*` i.p.v. de vroegere regex-poort-match).
   */
  trustedOrigins:
    process.env.NODE_ENV === "production"
      ? ["https://vleeswarenvermeir.be"]
      : [
          "http://localhost:*",
          "https://localhost:*",
          "http://127.0.0.1:*",
          "https://127.0.0.1:*",
          "https://vleeswarenvermeir.be",
        ],
  database: drizzleAdapter(db, {
    provider: "pg",
    // De sleutels hier moeten matchen met de modelnamen van Better Auth.
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      rateLimit: schema.rateLimit,
    },
  }),

  emailAndPassword: {
    enabled: true,
    // Klanten krijgen hun account van een beheerder (admin/klanten) — geen
    // publieke registratie. Inloggen met e-mail/wachtwoord blijft wel gewoon
    // werken voor bestaande accounts.
    disableSignUp: true,
    minPasswordLength: 8,
    // Mail loopt via Lettermint (server/utils/mail.ts). Op true zetten vraagt
    // ook een `emailVerification.sendVerificationEmail` die daarlangs verstuurt.
    requireEmailVerification: false,
  },

  user: {
    additionalFields: {
      // Spiegelt de extra kolom in server/database/schema/auth.ts.
      role: {
        type: "string",
        defaultValue: "customer",
        // Voorkomt dat een klant zichzelf via de signup-body admin maakt.
        input: false,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 dagen
    updateAge: 60 * 60 * 24, // sessie verlengen na max 1 dag gebruik
    cookieCache: {
      // Scheelt een DB-query per request; sessie wordt 5 min gecached.
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  advanced: {
    // Verplicht achter de reverse proxy van Dokploy (Traefik) op https.
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  /**
   * Expliciet aan, onafhankelijk van hoe NODE_ENV gezet wordt (Better Auth's
   * default is `enabled: isProduction`). De ingebouwde regel voor /sign-in
   * (3 pogingen per 10s per IP) laat nog ~26.000 gokken per dag toe;
   * wachtwoord-login krijgt daarom een eigen, trager venster.
   *
   * De tellers staan in de database (tabel rate_limit): op Vercel draaien
   * meerdere instanties naast elkaar en worden ze geregeld vervangen, dus een
   * teller in het geheugen liet per instantie opnieuw 10 pogingen toe. Kost
   * één extra query per auth-call. Het IP komt uit `x-forwarded-for`, dat
   * Vercel zelf zet (niet te vervalsen door de client).
   */
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 300, max: 10 },
    },
  },

  plugins: [
    /**
     * Inloggen via een link in de mail. Dient ook voor "wachtwoord vergeten":
     * de client geeft dan `metadata.purpose = "reset"` mee (enkel voor de
     * tekst van de mail) en een callbackURL met `?wachtwoord=nieuw`, waarna
     * de popup om een nieuw wachtwoord vraagt (zie api/account/password).
     *
     * Onbekende adressen krijgen geen mail, maar wel hetzelfde antwoord —
     * zo valt niet af te leiden welke e-mailadressen een account hebben.
     */
    magicLink({
      disableSignUp: true,
      expiresIn: 60 * 15, // 15 min: ruimte voor trage mailservers
      storeToken: "hashed",
      rateLimit: { window: 60, max: 3 },
      async sendMagicLink({ email, url, metadata }, ctx) {
        const found = await ctx?.context.internalAdapter.findUserByEmail(email);
        if (!found) return;
        await sendAuthLinkMail({
          email,
          url,
          purpose: metadata?.purpose === "reset" ? "reset" : "login",
        });
      },
    }),
  ],
});

/** Hoe lang een uitnodiging (nieuwe klant) geldig blijft. */
const INVITE_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Stuurt een nieuwe klant een uitnodiging: een magic link die 7 dagen geldig
 * is (i.p.v. 15 min) en na het inloggen meteen om een wachtwoord vraagt —
 * dezelfde terugkeer als "wachtwoord vergeten" (`?wachtwoord=nieuw`).
 *
 * Bewust níét via `auth.api.signInMagicLink`: die volgt de korte `expiresIn`
 * van de plugin. We schrijven het token zelf weg in hetzelfde formaat als de
 * plugin, zodat Better Auth's eigen /magic-link/verify het gewoon inwisselt:
 * identifier `magic-link:<SHA-256/base64url>` (door `storeToken: "hashed"`)
 * en value `{ type: "magic-link", email }`. Dat formaat is intern aan Better
 * Auth: wijkt het af, dan krijgt de klant "link verlopen of al gebruikt".
 * Na een update van better-auth dus nakijken in
 * node_modules/better-auth/dist/plugins/magic-link/index.mjs.
 */
export async function sendCustomerInvite(
  email: string,
  /** Met `launch`: de lanceringsmail i.p.v. de korte uitnodiging. */
  launch?: { companyName: string },
) {
  const ctx = await auth.$context;
  const token = generateRandomString(32, "a-z", "A-Z");

  await ctx.internalAdapter.createVerificationValue({
    identifier: `magic-link:${createHash("sha256").update(token).digest("base64url")}`,
    value: JSON.stringify({ type: "magic-link", email }),
    expiresAt: new Date(Date.now() + INVITE_EXPIRES_MS),
  });

  const url = new URL(`${ctx.baseURL}/magic-link/verify`);
  url.searchParams.set("token", token);
  url.searchParams.set("callbackURL", "/?wachtwoord=nieuw");
  url.searchParams.set("errorCallbackURL", "/?login=fout");

  if (launch) {
    await sendLaunchMail({ email, url: url.toString(), companyName: launch.companyName });
  } else {
    await sendAuthLinkMail({ email, url: url.toString(), purpose: "invite" });
  }
}

/** Het volledige, afgeleide sessietype — inclusief je eigen `role`. */
export type Auth = typeof auth;
export type AuthSession = Auth["$Infer"]["Session"];
