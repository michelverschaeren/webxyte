---
name: release
description: Development naar main zetten en de Vercel-productiedeploy opvolgen voor vleeswarenvermeir.be. Gebruik wanneer de gebruiker vraagt om "development naar main", "mergen", "pushen naar productie", "live zetten", "release", of om development eerst na te kijken op bugs voor een merge.
---

# Release: development → main → Vercel

Productie = branch `main`. Vercel deployt `main` automatisch naar
vleeswarenvermeir.be. Migraties lopen **niet** mee met de deploy (zie
`db-migration`): ontbrekende tabellen of kolommen breken inloggen en bestellen.

Commit of push enkel als de gebruiker erom vraagt. Rapporteer elke stap
eerlijk: wat faalde, wat overgeslagen werd.

## 1. Wat gaat er mee?

```bash
git status --short                      # niets ongecommit vergeten?
git log --oneline main..development     # commits die meegaan
git log --oneline development..main     # main voor? Dan eerst bespreken
git diff --stat main...development
```

## 2. Review (vóór de merge)

Lees de volledige diff `git diff main...development`. Let vooral op:

- **Bestelflow** (`server/api/account/orders.post.ts`, `useCartCheckout`,
  mail/PDF): controles op login, onbeschikbare producten en leveringsadres
  moeten blijven; een mislukte mail mag een bestelling nooit ongedaan maken.
- **Nieuwe `server/api/admin/**`-endpoints**: elk begint met `requireAdmin`
  of `requireAgencyAdmin` (zie `admin-conventions`).
- **Gasten**: `/api/products` mag gasten geen artikelnr., leverancier,
  eenheid of fiche tonen (catalogus is niet crawlbaar).
- **Client ↔ API-vorm**: wijzigde een response (bv. `items` → `entries`)?
  Zoek alle `useFetch`/`$fetch`-gebruikers van dat endpoint.
- **Joins**: een nieuwe `leftJoin` kan rijen verdubbelen; controleer of de
  join-kolom uniek is (bv. `customers.user_id` heeft een unique index).
- **Verwijderen**: welke tabellen verwijzen ernaar (cascade/restrict)?

Daarna, verplicht:

```bash
npx nuxt typecheck
npx eslint .        # bekende, aanvaarde waarschuwing: v-html in HeroSection.vue
npx nuxt build      # zelfde build als Vercel
```

## 3. Staan de migraties op productie?

Nieuwe bestanden in `server/database/migrations/`? Vergelijk dan de laatste
`when` in `meta/_journal.json` met productie (Neon-project
`solitary-tree-68490960`, branch `production`, enkel lezen):

```sql
select max(created_at) as laatste from drizzle.__drizzle_migrations;
```

Gelijk aan de laatste `when` → in orde. Lager → **stop**: eerst migreren via
`db-migration` (`npm run db:migrate:production`), met akkoord van de
gebruiker. Let op: lokaal wijst `DATABASE_URL` naar de branch `development`,
dus een geslaagde lokale test zegt niets over productie. Het aantal rijen telt niet: de
tabel kan een rij meer hebben dan de journal.

## 4. Mergen en pushen

```bash
git checkout main && git pull --ff-only \
  && git merge --no-ff development -m "Merge development: <korte samenvatting>" \
  && git push origin main \
  && git checkout development
```

## 5. Deploy opvolgen

Voorkeur: de project-MCP `vercel` uit `.mcp.json`
(`mcp.vercel.com/webxytes-projects/vleeswaren-vermeir`): `list_deployments`,
`get_runtime_errors`. Niet de algemene "claude.ai Vercel"-connector: die
heeft geen toegang tot dit team. Werkt de MCP niet, gebruik dan de Vercel CLI
via npx (team `webxytes-projects`, project gelinkt in `.vercel/`):

```bash
npx -y vercel@latest --scope webxytes-projects list vleeswaren-vermeir
```

Wacht tot de bovenste **Production**-deploy `● Ready` is (±45 s build). Niet
in een lus pollen langer dan nodig.

## 6. Live controleren

```bash
for p in / /producten "/api/products?perPage=1" /admin /api/admin/promotions; do
  printf "%-32s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' "https://vleeswarenvermeir.be$p")"
done
```

Verwacht: 200, 200, 200, 302 (gast wordt doorgestuurd), 401.

```bash
npx -y vercel@latest --scope webxytes-projects logs runtime --project vleeswaren-vermeir --since 15m --query 'level:error'
npx -y vercel@latest --scope webxytes-projects logs requests --project vleeswaren-vermeir --since 15m \
  | grep -oE '"httpStatus":[0-9]+' | sort | uniq -c
```

Verwacht: 0 runtime-errors, geen 5xx.

## 7. Rapport

Commit-hash, buildtijd, resultaten van de checks, en wat de gebruiker zelf
ingelogd moet testen (bestelling plaatsen, mail + PDF, beheerpagina's die
wijzigden). Zonder browserverbinding: zeg dat ingelogde flows niet getest zijn.
