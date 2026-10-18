---
name: better-auth-project
description: Hoe Better Auth (1.7) in dit project is opgezet - server/utils/auth.ts, magic link en uitnodigingen, rollen, sessie-helpers, cookie cache, rate limiting en de valkuilen die al eens fout gingen. Gebruik samen met de algemene Better Auth-skills (best-practices, security) bij elke wijziging aan login, sessies, rollen, uitnodigingen, wachtwoord of server/utils/auth.ts.
---

# Better Auth in dit project

De algemene skills `best-practices` en `security` (officieel, van Better Auth)
beschrijven de API. Deze skill legt vast hoe het hier gebruikt wordt. Bij een
conflict wint de code van dit project: lees eerst `server/utils/auth.ts`.

## Opzet

- Server: `server/utils/auth.ts` (`betterAuth` + `drizzleAdapter(db, { provider: "pg" })`).
  Tabellen in `server/database/schema/auth.ts`; de sleutels in `schema: {…}`
  zijn de **modelnamen** van Better Auth (`user`, `session`, `account`,
  `verification`, `rateLimit`).
- Client: `app/utils/auth-client.ts` (`better-auth/vue`) en
  `app/composables/useAuth.ts` (`user`, `isLoggedIn`, `isAdmin`, `refresh`,
  `login`, `logout`). Tijdens SSR haalt `useAuth` de sessie op via
  `/api/auth/get-session` en stuurt `cookie` en `x-forwarded-for` mee.
- Env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. `trustedOrigins` is in
  productie enkel het domein; lokaal `localhost:*`.

## Accounts en rollen

- **Geen publieke registratie** (`disableSignUp: true`, ook in de magic-link-plugin).
  Klanten krijgen een login via het beheer (`sendCustomerInvite`).
- Rol = `user.additionalFields.role` (`"customer"` of `"admin"`, `input: false`).
  Agency-admin = rol `admin` + `isAgencyAdminEmail()` (zie `admin-conventions`).
- Eén klantnummer = één e-mailadres = één login. `user.name` volgt
  `customers.name`; `user.email` volgt `customers.contact_email` (zie
  `PATCH /api/admin/customers/:id` en `PUT /api/account/billing`).

## Magic link, uitnodiging en wachtwoord

- Magic link (15 min, `storeToken: "hashed"`) dient voor inloggen én
  "wachtwoord vergeten" (`metadata.purpose = "reset"`, callback
  `?wachtwoord=nieuw`). Een onbekend adres krijgt geen mail, maar wel
  hetzelfde antwoord, zodat niet te raden valt welke adressen bestaan.
- **Uitnodiging (7 dagen)** schrijft zelf een verificatierij in het formaat
  van de plugin: `magic-link:<sha256 base64url>`. Dat formaat is intern aan
  Better Auth. **Na elke update van `better-auth`** nakijken in
  `node_modules/better-auth/dist/plugins/magic-link/index.mjs` en een
  uitnodiging testen.

## Sessies

- 30 dagen, verlengd na 1 dag gebruik. `cookieCache` van 5 minuten.
- Gevolg: wijzigt `user.name`, `user.email` of `user.role` op de server, dan
  ziet de client dat tot 5 min niet. Vernieuw na zo'n wijziging met
  `authClient.getSession({ query: { disableCookieCache: true } })` en daarna
  `auth.refresh()` (zie `app/pages/account/gegevens.vue`).
- Server-guards: `requireUser` / `requireAdmin` / `requireAgencyAdmin`
  (`server/utils/session.ts`). `getAuthSession` wordt bewust niet
  `getSession` genoemd, omdat die naam de auto-import van h3 zou overschrijven.

## Rate limiting

- `enabled: true`, `storage: "database"` (tabel `rate_limit`). Op Vercel
  draaien meerdere instanties, dus geen opslag in het geheugen.
- **`customRules`-sleutels zijn paden zónder basePath**: `"/sign-in/email"`,
  niet `"/api/auth/sign-in/email"`. Better Auth haalt `/api/auth` eraf vóór
  het vergelijkt (`normalizePathname` in
  `node_modules/better-auth/dist/api/rate-limiter/index.mjs`). Het voorbeeld
  met `/api/auth/...` in de security-skill zou hier nooit matchen.
- Het IP komt uit `x-forwarded-for`, dat Vercel zelf zet.

## Bij wijzigingen

- [ ] Nieuwe plugin of extra veld → schema aanpassen en migreren (`db-migration`);
      tabel toevoegen aan `schema` in `drizzleAdapter`.
- [ ] Na een update van `better-auth`: inloggen, magic link, uitnodiging,
      wachtwoord-reset en rate limiting testen.
- [ ] Nooit `disableCSRFCheck` of `disableOriginCheck`.
