# webxyte

Alle Nuxt-klantensites van webxyte in één repository: gedeelde Nuxt layers,
één lockfile, één update-ronde voor alle sites.

| Map | Wat |
| --- | --- |
| `packages/base` | security headers, images, fonts, compressie, Vercel Analytics — voor elke site |
| `packages/mail` | Lettermint `sendMail()`, rate-limit, contactformulier `POST /api/contact` |
| `packages/auth` | Better Auth-guards (`requireAdmin`, …), `useAuth`, agency-admin-regel |
| `packages/admin` | beheeromgeving: layout, `AdminShell`, paginering, zoekveld, licht/donker |
| `packages/analytics` | `/admin/bezoekers` met cijfers uit Vercel Web Analytics |
| `sites/<klant>` | één klantensite = één Vercel-project |
| `templates/starter` | startpunt voor een nieuwe brochure-site (`/new-site`) |
| `scripts/` | `verify-perf.mjs`, `fetch-site.mjs` (via `pnpm verify:perf` / `pnpm fetch:site` in een site) |

Regels voor mens en AI-agent: [AGENTS.md](AGENTS.md).

## Starten

```bash
corepack enable          # gebruikt de pnpm-versie uit package.json
pnpm install             # in de root, voor alle sites
pnpm --filter vleewaren-vermeir dev
```

Per site blijft de `.env` in de map van de site staan (`sites/<klant>/.env`).

## Vercel

Elke site is een eigen Vercel-project dat naar deze repo wijst:

1. **Settings → Git**: koppel de repo `webxyte`.
2. **Settings → Build and Deployment → Root Directory**: `sites/<klant>`.
   Laat "Include files outside the root directory" aan (standaard): de site
   heeft `packages/` nodig. Vercel installeert vanuit de root (pnpm workspace).
3. **Settings → Git → Ignored Build Step**: `npx turbo-ignore --fallback=HEAD^1`.
   Een push bouwt dan enkel de sites waarin iets wijzigde, of die een
   gewijzigde layer gebruiken.
4. Environment variables blijven per project, zoals voorheen.

## Updates

[Renovate](https://github.com/apps/renovate) (`renovate.json`): op de eerste
van de maand één PR met alle patch/minor-updates voor de hele repo, automatisch
gemerged als de checks slagen. Majors (bv. Nuxt 5) wachten op goedkeuring in het
Dependency Dashboard (een issue in de repo).

Bewust vastgepind tot een aparte, geteste update: `better-auth` 1.7.7 in
Vermeir (zie de waarschuwing in `server/utils/auth.ts` over het magic-link
tokenformaat), `@nuxt/image` 2.1.0 en `lettermint` 2.8.0.

## Een nieuwe site

In Claude Code vanuit de root: `/new-site` — kopieert `templates/starter` naar
`sites/<naam>` en loopt de rest af. Login of beheer nodig? Voeg `@webxyte/auth`,
`@webxyte/admin` en eventueel `@webxyte/analytics` toe aan `extends`.

## Geschiedenis

`sites/vleeswaren-vermeir` en `templates/starter` zijn met `git subtree`
binnengehaald: hun volledige commitgeschiedenis staat in deze repo
(`git log -- sites/vleeswaren-vermeir`). Vleewaren-Vermeir en Nuxt-Projects
kunnen gearchiveerd worden zodra alles hier live draait.
