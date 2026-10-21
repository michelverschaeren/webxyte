---
name: better-auth-conventions
description: How logins are set up with Better Auth in sites from this starter (Drizzle adapter on Neon, Vercel) - no public sign-up, roles, magic link and invitations, session cookie cache, rate limiting, and gotchas that already bit us. Use together with the official Better Auth skills (best-practices, security) for any change to login, sessions, roles, invitations, passwords or server/utils/auth.ts.
---

# Better Auth conventions

The official skills `best-practices` and `security` (from Better Auth) cover
the API. This skill records how we use it and what went wrong before. Check
the installed version and read `node_modules/better-auth/dist` when a detail
matters — the docs sometimes lag.

## Setup

- `server/utils/auth.ts`: `betterAuth({ database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification, rateLimit } }) })`.
  The keys are Better Auth **model names**, not table names.
- Env: `BETTER_AUTH_SECRET` (32+ chars, unique per site), `BETTER_AUTH_URL`.
- `trustedOrigins`: production = the domain only; development = `http://localhost:*`
  (the dev server changes port when 3000 is taken).
- Client: `createAuthClient` from `better-auth/vue` plus a `useAuth()`
  composable (`user`, `isLoggedIn`, `isAdmin`, `refresh`). During SSR fetch the
  session via `/api/auth/get-session` and forward `cookie` and `x-forwarded-for`.
- Server guards `requireUser` / `requireAdmin` / `requireAgencyAdmin` (skill
  `admin-conventions`). Do not name a helper `getSession`: it shadows h3's
  auto-import.

## Accounts

- **No public sign-up** for B2B/customer portals: `emailAndPassword.disableSignUp`
  and `magicLink({ disableSignUp: true })`. Admins invite customers.
- Role via `user.additionalFields.role` with `input: false` (a customer can never
  send their own role).
- Unknown addresses get no mail but the same response: no account enumeration.

## Sessions

- `cookieCache` (e.g. 5 min) saves a DB query per request — but after changing
  `user.name`/`email`/`role` on the server the client sees the old value until
  it expires. Refresh with
  `authClient.getSession({ query: { disableCookieCache: true } })`, then
  `refresh()` the composable.

## Rate limiting

- `enabled: true` explicitly and `storage: "database"` (table `rate_limit`).
  On Vercel several instances run side by side; memory storage resets per
  instance.
- **`customRules` keys are paths WITHOUT the basePath:** `"/sign-in/email"`,
  not `"/api/auth/sign-in/email"`. Better Auth strips `/api/auth` before
  matching (`normalizePathname` in `dist/api/rate-limiter`). The example with
  `/api/auth/...` in the official security skill would never match.
- Give password sign-in a slower window, e.g. `"/sign-in/email": { window: 300, max: 10 }`.

## Invitations longer than the magic-link lifetime

If invites must stay valid for days while login links last minutes, writing
the verification row yourself in the plugin's format works — but that format
is internal. Re-check `dist/plugins/magic-link` and test an invite after
**every** Better Auth upgrade.

## Changes checklist

- [ ] New plugin/field → schema + migration (skill `db-migration`), and the
      table in the adapter's `schema`.
- [ ] After a Better Auth upgrade: login, magic link, invite, password reset,
      rate limiting tested.
- [ ] Never `disableCSRFCheck` or `disableOriginCheck`.
