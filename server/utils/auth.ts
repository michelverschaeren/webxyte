import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "../database/client";

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
    // Verplicht achter de reverse proxy van Dokploy (Traefik) op https.
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  /**
   * Better Auth's default (`enabled: isProduction`) hangt af van hoe Dokploy
   * NODE_ENV precies zet — expliciet aanzetten maakt dat onafhankelijk
   * daarvan. Ingebouwde regels beperken /sign-in en /sign-up al streng tot
   * 3 pogingen per 10s per IP; dat volstaat hier zonder extra storage.
   */
  rateLimit: {
    enabled: true,
  },
});

/** Het volledige, afgeleide sessietype — inclusief je eigen `role`. */
export type Auth = typeof auth;
export type AuthSession = Auth["$Infer"]["Session"];
