---
name: db-migration
description: Databaseschema wijzigen in dit project (Drizzle + Neon Postgres) - tabel of kolom toevoegen, migratie genereren, testen en op productie toepassen. Gebruik bij elke wijziging in server/database/schema/, bij "migratie", "db:migrate", "drizzle-kit", "nieuwe kolom/tabel", of als een release nieuwe migratiebestanden bevat.
---

# Databasemigratie (Drizzle + Neon)

## Databases (Neon-project `solitary-tree-68490960`)

| Branch | Id | Gebruik | Waar |
|---|---|---|---|
| `development` | `br-divine-cherry-b1hdolzv` | lokaal + Vercel Preview | `DATABASE_URL` in `.env`; Vercel (Preview) |
| `production` | `br-dawn-rice-b1pb9n8c` | vleeswarenvermeir.be | `DATABASE_URL` in `.env.live`; Vercel (Production) |

`.env` = development (de app leest dit). `.env.live` = productiewaarden ter
referentie; de app leest dit niet, enkel `drizzle.production.config.ts`.
Beide staan buiten git.

- `npm run db:migrate` en alle scripts in `server/database/` gaan naar
  **development**.
- Productie enkel via `npm run db:migrate:production`
  (`drizzle.production.config.ts`), en altijd pas na expliciet akkoord.
- `development` is een kopie van productie van 18 okt 2026, met echte
  klanten en e-mailadressen. Verse data nodig? Gebruik Neon `reset_from_parent`
  op `development`, na akkoord, want lokale testdata gaat dan verloren.

Migraties lopen **niet** automatisch bij een Vercel-deploy. Ze moeten op
productie staan **vóór** de code die ze nodig heeft naar `main` gaat.

## Afspraken

- Schema in `server/database/schema/*.ts`, alles geëxporteerd via `index.ts`.
- `casing: "snake_case"`: in TS camelCase, in Postgres snake_case. Moet gelijk
  zijn in `drizzle.config.ts` en `server/database/client.ts`.
- Migraties in `server/database/migrations/` (SQL + `meta/`), gegenereerd door
  drizzle-kit. Nooit met de hand een bestaande migratie wijzigen.
- **Geen `db:push`** buiten een wegwerpbranch: dat slaat de migratiehistoriek over.
- Liefst enkel toevoegen (nieuwe tabel, nullable kolom of kolom met default):
  dan blijft de huidige `main`-code werken terwijl de migratie al draait.
  Kolom hernoemen of verwijderen = twee releases (eerst code die de oude kolom
  niet meer gebruikt, dan pas de kolom weg).

## Stappen

1. **Schema aanpassen** in `server/database/schema/`.
2. **Genereren:**
   ```bash
   npm run db:generate      # drizzle-kit generate
   ```
   Lees de nieuwe `.sql`. Verwacht je een `DROP` of `RENAME` niet? Stop en bespreek.
3. **Testen op development:**
   ```bash
   npm run db:migrate       # tegen de branch development
   ```
   Controleer met Neon `describe_table_schema` (branch `development`) en test
   de app lokaal. Is de migratie riskant (data omzetten, kolom weg)? Test ze
   dan eerst op een wegwerpbranch van `production`, en verwijder die daarna
   (na akkoord).
4. **Typecheck + build** (`npx nuxt typecheck`, `npx nuxt build`).
5. **Productie migreren** (enkel na expliciet akkoord):
   ```bash
   npm run db:migrate:production
   ```
6. **Controleren:** de laatste `when` in `meta/_journal.json` moet gelijk zijn aan
   (Neon `run_sql`, branch `production`):
   ```sql
   select max(created_at) from drizzle.__drizzle_migrations;
   ```
   (Het aantal rijen kan één hoger liggen dan de journal; dat is normaal hier.)
7. Pas daarna de code via `release` naar `main`.

## Valkuilen

- `numeric`-kolommen komen terug als **string**: `Number(...)` bij lezen,
  `.toFixed(2)` bij schrijven.
- `date`-kolommen zijn strings `"JJJJ-MM-DD"`; "vandaag" = Belgische
  kalenderdag (`todayInBrussels()` in `shared/promotion.ts`).
- Een tabel voor Better Auth (bv. `rate_limit`) moet ook in de `schema` van
  `drizzleAdapter` in `server/utils/auth.ts`, met de modelnaam als sleutel.
- Na het verwijderen van een tabel of kolom: zoek alle verwijzingen in
  `server/`, `app/` en `shared/`.
