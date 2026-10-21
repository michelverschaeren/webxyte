---
name: admin-conventions
description: Conventies voor het beheer (/admin) en de API's van dit project - rollen en rechten (agency-admin, beheerder, klant), requireAdmin/requireAgencyAdmin, Zod-validatie, bevroren bestelgegevens, adm-*-stijlen en bevestigingsdialogen. Gebruik bij elke nieuwe of gewijzigde pagina onder app/pages/admin, endpoint onder server/api/admin of server/api/account, of bij vragen over wie wat mag.
---

# Beheer- en API-conventies

## Rollen

| Wie | Herkenning | Mag |
|---|---|---|
| Agency-admin (Xyte) | rol `admin` + `isAgencyAdminEmail()` | alles, ook onomkeerbare acties (klanten/bestellingen verwijderen) |
| Beheerder (de klant van Xyte) | rol `admin` | beheer, maar niets definitief verwijderen |
| Klant | rol `customer` | enkel webshop en `/account` |

- Het agency-adres staat op één plek: `shared/agency-admin.ts`. Nooit opnieuw
  hardcoden.
- Server: `requireUser`, `requireAdmin`, `requireAgencyAdmin` uit
  `server/utils/session.ts`, als **eerste regel** van elke handler.
- Client: `isAgencyAdminEmail(auth.user.value?.email)` dient enkel om knoppen
  te verbergen. De server controleert altijd opnieuw.
- Pagina's: `definePageMeta({ layout: "admin", middleware: "admin" })`.

## Endpoints (`server/api/**`)

- Bestandsnamen volgens Nitro: `[id].get.ts`, `[id].patch.ts`,
  `[id].delete.ts`, `[id]/pdf.get.ts`, `delete.post.ts` (bulk).
- Invoer altijd via Zod: `getValidatedRouterParams` (`z.uuid()` voor ids),
  `getValidatedQuery`, `readValidatedBody`. Klantformulieren met
  veldmeldingen: `parseContactBody`.
- Fouten: `createError({ statusCode, statusMessage })` met een Nederlandse,
  toonbare `statusMessage`. 404 als iets niet bestaat.
- Meerdere schrijfacties die samen horen → `db.transaction`.
- Een klant geeft nooit database-id's van producten door: enkel artikelnr.
  plus aantal; de server zoekt de rest op.
- Gasten: geen artikelnr., leverancier, eenheid of fiche (catalogus is niet
  crawlbaar). Nieuwe product-endpoints volgen die regel.

## Gegevensmodel: één bron per gegeven

- **Klantnaam = bedrijfsnaam** = `customers.name`. Klant (Gegevens) en
  beheerder (Klanten) wijzigen hetzelfde veld; `user.name` volgt mee. Lees
  `coalesce(customers.name, user.name)`. `billing_details.company_name` is
  enkel een terugval voor logins zonder klant.
- Telefoon en leveringsadres staan bij `customers` / `customer_addresses`.
- E-mailadressen vergelijken zonder hoofdletters; facturatie-e-mail bewaren in
  kleine letters.
- **Bevroren op de bestelling:** `orders.billing_snapshot` en per regel naam,
  leverancier, eenheid en `promotions`. Toon in het beheer de bevroren waarde
  (bestelbon, "Naam bij bestelling"), nooit herberekenen uit de huidige data.

## UI (`app/assets/css/admin.css`)

- Pagina in `<AdminShell title subtitle>`; knoppen in `<template #actions>`.
- Bouwstenen: `adm-card` (+ `-toolbar`, `-head`, `-title`, `-body`,
  `-empty`, `-hint`), `adm-table` met `adm-num` en `adm-col-actions`,
  `adm-row-btn` (icoonknop in een rij), `adm-btn` + `--primary` /
  `--secondary` / `--ghost` / `--danger` / `--sm`, `adm-badge--*`, `adm-dl`,
  `adm-stats`, `adm-input`, `adm-label`.
- Componenten: `AdminSearchField`, `AdminPagination`, `AdminSwitch`.
- Mobiel is een rij in een lijst één `NuxtLink`: zet daar geen tweede knop
  in. Extra acties komen op de detailpagina.
- Iconen: inline `<svg viewBox="0 0 24 24" stroke="currentColor">` met
  `aria-hidden="true"`; icoonknoppen krijgen `aria-label` en `title`.
- Downloads (PDF) via een gewone `<a :href download>` naar een API-route,
  niet via `$fetch`: dan gaat de sessiecookie gewoon mee.

## Onomkeerbare acties

- Enkel voor de agency-admin, op server én client.
- Bevestigen met een eigen dialoog (`Teleport to="body"`,
  `role="alertdialog"`): wat er verdwijnt, en een veld waarin de gebruiker
  een sleutel overtypt (bv. bestelnummer = eerste 8 tekens van de id, in
  hoofdletters). De knop blijft uit tot het klopt; Escape sluit.
- Gebruik geen `window.confirm` voor nieuwe acties.
- Bekijk vóór het verwijderen welke tabellen ernaar verwijzen
  (`pg_constraint`): cascade of restrict?

## Nalopen bij een nieuw endpoint

- [ ] Guard op de eerste regel; ontbreekt hij, dan is het endpoint publiek.
- [ ] Zod voor params, query en body.
- [ ] Response-vorm gewijzigd? Alle `useFetch`/`$fetch`-gebruikers aangepast.
- [ ] `npx nuxt typecheck` en `npx eslint` zonder fouten.
