import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "../database/client";

/**
 * De Better Auth server-instantie. Alles in server/utils wordt door Nitro
 * automatisch geïmporteerd, dus `auth` is overal in server/ beschikbaar —
 * maar we importeren hem expliciet voor duidelijke types.
 */
export const auth = betterAuth({
  /**
   * Op Vercel heeft elke preview-deploy een eigen, onvoorspelbare hostname.
   * BETTER_AUTH_URL blijft de bron van waarheid voor productie; valt die weg
   * (preview/branch-deploy) dan gebruiken we de door Vercel geinjecteerde
   * VERCEL_URL zodat callbacks en cookies op de juiste host landen.
   */
  baseURL:
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined),
  secret: process.env.BETTER_AUTH_SECRET,

  /**
   * Better Auth weigert requests van een onbekende origin (CSRF-bescherming).
   * De productie-hostnames staan altijd toegestaan; preview- en dev-origins
   * komen er alleen bij in die omgevingen zelf. Patronen mogen enkel Better
   * Auth's eigen wildcards gebruiken (`string[]`, geen RegExp) — vandaar de
   * `*` voor de wisselende dev-poort en de preview-subdomeinen.
   */
  trustedOrigins: [
    "https://vleeswarenvermeir.be",
    "https://www.vleeswarenvermeir.be",

    // Preview-deploys draaien op een willekeurige *.vercel.app-hostname.
    // Alleen daar toestaan: op de productie-deploy blijft de lijst strikt.
    ...(process.env.VERCEL_ENV === "preview" ? ["https://*.vercel.app"] : []),

    // Lokaal wisselt de dev-server van poort zodra 3000 bezet is, wat anders
    // "Invalid origin" oplevert bij elke login.
    ...(process.env.NODE_ENV === "production"
      ? []
      : [
          "http://localhost:*",
          "https://localhost:*",
          "http://127.0.0.1:*",
          "https://127.0.0.1:*",
        ]),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    // De sleutels hier moeten matchen met de modelnamen van Better Auth.
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    // Klanten krijgen hun account van een beheerder (admin/klanten) — geen
    // publieke registratie. Inloggen met e-mail/wachtwoord blijft wel gewoon
    // werken voor bestaande accounts.
    disableSignUp: true,
    minPasswordLength: 8,
    // Zet op true zodra je een mailer (Resend, SMTP, …) gekoppeld hebt.
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
    // Verplicht achter de reverse proxy van Vercel op https.
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  /**
   * Ingebouwde regels beperken /sign-in en /sign-up tot 3 pogingen per 10s
   * per IP. Let op: de default storage is in-memory, dus op Vercel telt elke
   * warme instance zijn eigen teller — de effectieve limiet ligt hoger dan
   * op de single-container setup. Wil je een harde limiet, dan moet dit naar
   * `storage: "database"` (vergt een extra `rateLimit`-tabel + migratie).
   */
  rateLimit: {
    enabled: true,
  },
});

/** Het volledige, afgeleide sessietype — inclusief je eigen `role`. */
export type Auth = typeof auth;
export type AuthSession = Auth["$Infer"]["Session"];
