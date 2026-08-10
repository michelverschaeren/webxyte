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
   * elke login. Daarom is localhost tijdens ontwikkeling poort-onafhankelijk.
   */
  trustedOrigins:
    process.env.NODE_ENV === "production"
      ? undefined
      : [/^https?:\/\/localhost(:\d+)?$/, /^https?:\/\/127\.0\.0\.1(:\d+)?$/],

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
});

/** Het volledige, afgeleide sessietype — inclusief je eigen `role`. */
export type Auth = typeof auth;
export type AuthSession = Auth["$Infer"]["Session"];
