---
paths:
  - "**/nuxt.config.ts"
  - "**/.env.example"
  - "**/server/**"
---

# Standard integrations: Vercel, Lettermint, Neon

Every site cloned from this starter deploys to Vercel. These three are the
standard stack across all of them — read this before touching env vars or
adding a database. Deeper how-tos live in the skills `mail-lettermint`,
`db-migration` and `release`.

## Vercel Analytics + Speed Insights

`@vercel/analytics` and `@vercel/speed-insights` are registered as plain Nuxt
modules in `nuxt.config.ts` — no plugin code, no config block. Both are
Vercel-only: they no-op entirely when not deployed on Vercel, and Speed
Insights collects nothing in dev. **Do not remove them** to "simplify" the
modules list; they are already a no-op everywhere that matters.

## Lettermint (email) — always, via the official SDK

All transactional mail goes through Lettermint. Do not suggest Resend,
SendGrid, SMTP or nodemailer.

- `server/utils/mail.ts` is the **only** file that knows Lettermint:
  `sendMail()` on top of the official SDK `lettermint` (version pinned
  exactly, zero dependencies). Everything else calls `sendMail()` — swapping
  providers means rewriting that one function.
- `sendMail()` enforces: a 10 s timeout, a `tag` per kind of mail, an optional
  `idempotencyKey` (`order:<id>`), logging the `message_id` on success, and a
  readable error (timeout / 422 with reason / HTTP status) on failure.
- **A failed mail never undoes the main action.** Store first, mail second,
  in its own `try/catch`.
- **Never** add the `nuxt-lettermint` module or its `autoEndpoint`
  (`POST /api/lettermint/send`): it accepts `from`/`to`/`html` from any
  visitor, unauthenticated — an open mail relay that sends phishing in the
  client's name. Never build a mail in the browser either. A form posts only
  its fields to its own validated route; see `server/api/contact.post.ts`
  (honeypot + per-IP limit, fixed recipient).
- Env: `LETTERMINT_API_TOKEN`, `MAIL_FROM_EMAIL` (domain verified in
  Lettermint: SPF + DKIM, plus DMARC), `MAIL_FROM_NAME`, recipients such as
  `CONTACT_NOTIFICATION_EMAIL`. **Server only** — never a `NUXT_PUBLIC_*` var.
- `MAIL_REDIRECT_TO` (development and Vercel Preview only): every mail goes
  to the developer with `[test → real@recipient]` in the subject. Empty in
  production.

## Neon (database) — opt-in, not every clone needs one

No database client ships in this starter on purpose: most client sites are
static brochure pages, and this project is weight-conscious (Lighthouse
mobile ≥ 85 is in the definition of done in `AGENTS.md`). Add one only when a
site actually needs persistence. The stack, when it does: Drizzle ORM +
`postgres` (postgres.js) on Neon, Better Auth for logins.

1. `pnpm add drizzle-orm postgres` and `pnpm add -D drizzle-kit`. Query only
   from `server/**`. Never import the client or read `DATABASE_URL` in a
   `.vue` file or anything that ships to the browser.
2. **Two Neon branches from day one:** `production` (the live site) and
   `development` (a copy, for local work and Vercel Preview).
3. **Two env files:** `.env` = development (the app reads it), `.env.live` =
   production values, read by nothing except
   `pnpm db:migrate:production` (a `drizzle.production.config.ts` that loads
   `DATABASE_URL` from `.env.live`). Both gitignored.
4. **Vercel env per environment:** Production → production branch and real
   recipients. Preview → development branch, `MAIL_REDIRECT_TO`,
   `NUXT_PUBLIC_DATABASE_ENV=development`. Never one `DATABASE_URL` shared by
   both: Preview would then write to live data.
5. `NUXT_PUBLIC_DATABASE_ENV=development` shows the
   `DEVELOPMENT · TESTDATABASE` banner (`app/components/DatabaseEnvFrame.vue`).
   If the site has a fixed header with a z-index above 70, raise the banner's.
6. Migrations do **not** run on deploy. Apply them to production before the
   code that needs them reaches `main` (skill `db-migration`).

The Neon and Vercel MCP servers in `.mcp.json` are scoped to **this site's**
Neon project and Vercel project (see `/new-site`), never account-wide.
