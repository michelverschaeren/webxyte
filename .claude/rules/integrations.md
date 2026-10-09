---
paths:
  - "nuxt.config.ts"
  - ".env.example"
  - "server/**"
---

# Standard integrations: Vercel, Lettermint, Neon

Every site cloned from this starter deploys to Vercel. These three are the
standard stack across all of them — read this before touching env vars or
adding a database.

## Vercel Analytics + Speed Insights

`@vercel/analytics` and `@vercel/speed-insights` are registered as plain Nuxt
modules in `nuxt.config.ts` — no plugin code, no config block. Both are
Vercel-only: they no-op entirely when not deployed on Vercel, and Speed
Insights collects nothing in dev. **Do not remove them** to "simplify" the
modules list; they are already a no-op everywhere that matters.

## Lettermint (email)

`nuxt-lettermint` is the official module. `autoEndpoint: true` in
`nuxt.config.ts` exposes `POST /api/lettermint/send`, so a contact form can
call the client composable directly without the API token ever reaching the
browser:

```ts
const { send, sending, error } = useLettermint()
await send({ from: 'Site <noreply@domain>', to: 'you@domain', subject: '…', text: '…' })
```

For a server route that needs to validate input first, import `sendEmail`
from `#imports` inside `defineEventHandler` instead of hitting the auto
endpoint.

Requires `NUXT_LETTERMINT_API_KEY` (see `.env.example`) — a project token from
the Lettermint dashboard. **Never read this env var, or any Lettermint call,
from client-side code** — it only exists in server context (Nitro routes),
which is exactly what `autoEndpoint` and `sendEmail` already give you.

## Neon (database) — opt-in, not every clone needs one

No database client ships in this starter on purpose: most client sites are
static brochure pages, and this project is weight-conscious (Lighthouse
mobile ≥ 85 is in the definition of done in `AGENTS.md`). Add one only when a
site actually needs persistence (a form that stores submissions, a CMS-ish
page, etc.):

1. `pnpm add @neondatabase/serverless` (or `drizzle-orm` plus its Neon driver,
   if the site is relational-model-heavy enough to want a query builder).
2. Set `DATABASE_URL` (uncomment it in `.env.example`, set it for real in
   Vercel's project env vars — never commit the real value).
3. Query it only from `server/api/**` (Nitro) routes. Never import the Neon
   client or read `DATABASE_URL` from a `.vue` file or anything that ships to
   the browser.

The Neon MCP server is linked at the project level (`.mcp.json`) so branches,
connection strings and migrations can be managed from here directly once a
site needs them.
