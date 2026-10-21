// @webxyte/auth — logins en rollen met Better Auth (Drizzle-adapter op Neon).
//
// Wat deze layer levert:
// - server/utils/session.ts: getAuthSession, requireUser, requireAdmin,
//   requireAgencyAdmin. Importeer via "#layers/auth/server/utils/session".
// - shared/agency-admin.ts: wie onomkeerbare acties mag (Xyte).
// - app/composables/useAuth.ts + middleware "admin".
// - hook "auth:logout" om site-state op te ruimen bij afmelden.
//
// Wat de site zelf levert (verschilt per site):
// - server/utils/auth.ts: `export const auth = betterAuth({...})` en
//   `export type AuthSession`. Plugins, mails en trustedOrigins horen daar.
// - app/utils/auth-client.ts: `export const authClient = createAuthClient({...})`.
// - server/database/schema/auth.ts + migraties (de tabellen staan in de db van de site).
//
// Skills: better-auth-conventions, admin-conventions, best-practices, security.
export default defineNuxtConfig({
  $meta: { name: 'auth' }
})
