# AGENTS.md — webxyte monorepo

Alle klantensites van webxyte in één repo. Nuxt 4, gehost op Vercel, pnpm
workspaces + Turborepo.

```
packages/      gedeelde Nuxt layers (code die ALLE sites gebruiken)
  base/        security headers, images, fonts, compressie, Vercel Analytics
  mail/        Lettermint sendMail(), rate-limit, POST /api/contact
  auth/        Better Auth: requireUser/requireAdmin/requireAgencyAdmin, useAuth
  admin/       beheeromgeving: layout, AdminShell, paginering, zoekveld, thema
  analytics/   /admin/bezoekers + /api/admin/analytics (Vercel Web Analytics)
sites/<klant>/ één map = één klantensite = één Vercel-project
templates/     startpunten voor nieuwe sites (skill /new-site)
scripts/       verify-perf.mjs, fetch-site.mjs (draaien vanuit een sitemap)
```

## De belangrijkste regel

**Werk enkel in de site die de gebruiker noemt.** Een wijziging in
`packages/` raakt elke site die die layer gebruikt.

- Wijzig `packages/**` **nooit** tenzij de gebruiker dat expliciet vraagt.
- Moet een layer-bestand anders voor één klant? Maak een bestand met
  **hetzelfde pad** in de site (bv. `sites/<klant>/app/components/admin/Shell.vue`):
  de site wint van de layer. Pas daarvoor de layer niet aan.
- Kijk in `packages/` voor je een nieuw component, composable of util maakt:
  misschien bestaat het al.
- Neem geen code, teksten of beelden over uit een andere klantensite.
- Wordt iets in drie of meer sites op dezelfde manier gebruikt, stel dan voor
  (vraag het, doe het niet zelf) om het naar een layer te verhuizen.

## Hoe een site de layers gebruikt

```ts
// sites/<klant>/nuxt.config.ts
export default defineNuxtConfig({
  extends: ['@webxyte/base', '@webxyte/auth', '@webxyte/admin'],
  // enkel wat specifiek is voor deze klant
})
```

Elke layer documenteert bovenaan zijn `nuxt.config.ts` wat hij levert en
wat de site zelf moet leveren. Importeer layer-code expliciet via het alias
`#layers/<naam>/...`, bv. `import { requireAdmin } from "#layers/auth/server/utils/session"`.

Configuratie zonder code (merk, menu-items van het beheer) staat in
`sites/<klant>/app/app.config.ts`.

Tailwind scant enkel de map van de site. Een site die Tailwind-klassen uit de
layers gebruikt, zet in haar `main.css`: `@source "../../../../../packages";`.

## Branches

- `main` = productie voor **alle** sites. Een merge naar `main` zet live wat
  veranderde (Vercel + `turbo-ignore` bouwen enkel de geraakte sites).
- Per taak één korte branch vanaf `main`, genoemd naar wat hij raakt:
  `vleeswaren-vermeir/promoties-filter`, `bakkerij-x/contactpagina`, `base/security-headers`.
- **Eén site óf één layer per branch.** Raakt je werk ongemerkt een andere
  site of `packages/`? Stop en vraag het, of splits het in een aparte branch.
- Geen langlevende `development`-branch. Elke push naar een taakbranch geeft
  een Vercel Preview (Neon-branch `development`, mail naar `MAIL_REDIRECT_TO`).
- Een layer-branch: bekijk de Preview van **elke** site die de layer gebruikt.
- Nieuwe taak: `pnpm task <site|layer> <taak>` maakt de branch in een eigen
  map naast de repo (git worktree), zodat meerdere taken en Claude-sessies
  naast elkaar kunnen lopen. `pnpm task list` toont ze, `pnpm task done <taak>`
  ruimt op na de merge.
- Mergen en live opvolgen: skill `release`.

## Commando's

Vanuit de root:

```bash
pnpm install                                   # alles, één lockfile
pnpm dev                                       # menu: kies een of meer sites
pnpm dev vermeir                               # één site (deel van de mapnaam volstaat)
pnpm dev vermeir bakkerij                      # meerdere tegelijk
pnpm dev --list                                # sites en hun vaste poort
pnpm build | lint | typecheck                  # alle sites via Turborepo
pnpm --filter vleewaren-vermeir add <pakket>   # dependency voor één site
```

Elke site heeft een vaste dev-poort in haar `dev`-script (`nuxt dev --port …`),
zodat `BETTER_AUTH_URL` in haar `.env` klopt. Een nieuwe site krijgt de
volgende vrije poort.

Of in de map van de site: `pnpm dev`, `pnpm build`, `pnpm lint`,
`pnpm typecheck`, `pnpm verify:perf <url>`.

Er is geen `test`- of `format`-script. Verzin er geen.

## Waar de regels staan

| Je bewerkt | Lees eerst |
| --- | --- |
| een `.vue`-bestand met `<NuxtImg>` | [`.claude/rules/images.md`](.claude/rules/images.md) — de `sizes`-valkuil |
| een `nuxt.config.ts` | [`.claude/rules/nuxt-config.md`](.claude/rules/nuxt-config.md) |
| env vars, mail, database | [`.claude/rules/integrations.md`](.claude/rules/integrations.md) |
| mail, release, database, logins, beheer | de skill in [`.claude/skills/`](.claude/skills/) |

Een site kan eigen skills hebben in `sites/<klant>/.claude/skills/` en een
eigen `AGENTS.md`/`CLAUDE.md` met klantspecifieke info. Lees die als je in
die site werkt.

## Afspraken voor alle sites

- **Mail = Lettermint** via de officiële SDK achter `sendMail()`. Nooit
  `nuxt-lettermint` met `autoEndpoint` (open relay).
- **Twee env-bestanden** per site: `.env` = development, `.env.live` =
  productie (enkel voor `db:migrate:production`). Vercel-env per omgeving:
  Preview raakt nooit productiedata of echte inboxen.
- **Rollen:** agency-admin (Xyte, `packages/auth/shared/agency-admin.ts`) >
  klant-beheerder > klant. Onomkeerbare acties enkel voor de agency-admin.
- **Eerst bevestigen:** productiemigraties, schrijven in productiedata,
  Vercel env/DNS, echte mail versturen, en elke wijziging in `packages/`.

## Klaar = 

- [ ] `pnpm lint` en `pnpm typecheck` in de site zijn schoon.
- [ ] Raakte de wijziging `packages/`? Dan ook `pnpm typecheck` in de root
      (alle sites), want elke site die de layer gebruikt kan breken.
- [ ] Nieuwe site: Lighthouse mobiel ≥ 85 en `pnpm verify:perf` tegen de deploy.
