---
name: mail-lettermint
description: E-mail versturen in dit project (en elk project van deze stack) via Lettermint (officiële SDK achter een eigen sendMail()) - de vaste maildienst voor transactionele mail (bestelmeldingen, inloglinks, uitnodigingen, contactformulier). Gebruik bij elke nieuwe of gewijzigde mail, bij server/utils/mail*.ts, bij "mail komt niet aan", bij env-variabelen LETTERMINT_* / MAIL_* / *_NOTIFICATION_EMAIL, of als iemand een andere maildienst (Resend, SendGrid, SMTP, nodemailer) voorstelt.
---

# Mail via Lettermint

**Afspraak:** transactionele mail loopt altijd via **Lettermint**
(lettermint.co, EU). Stel geen andere dienst of SMTP-library voor, tenzij de
gebruiker daar zelf om vraagt.

## Opzet (`server/utils/mail.ts`)

Drie lagen; enkel de onderste kent Lettermint:

1. **Mails** (`sendOrderNotification`, `sendContactMail`, `sendAuthLinkMail`, …):
   inhoud en ontvanger, gebouwd op de server. Roepen enkel `sendMail()` aan.
2. **`sendMail()`** (intern): afzender, `MAIL_REDIRECT_TO`, time-out, logging.
   **Enige plek die Lettermint kent**; een andere maildienst = enkel deze
   functie vervangen.
3. **Officiële SDK `lettermint`** (versie exact vastgezet, 0 dependencies,
   github.com/lettermint/lettermint-node): `Lettermint.email(token, { timeout })`.

Afspraken in `sendMail()`:
- `timeout: 10_000`: een bestelling wacht op de mail; nooit laten hangen.
- Verplichte `tag` per soort mail (`order`, `contact`, `auth-login`, …):
  filter in het Lettermint-dashboard en in de logs. Patroon `[A-Za-z0-9_-]`.
- `idempotencyKey` voor mails die per gebeurtenis één keer mogen vertrekken
  (`order:<id>`): een nieuwe poging verstuurt geen tweede mail.
- Bij succes loggen: `[mail] <tag> verstuurd: <message_id> (<status>)`. Met
  dat id vind je de mail terug in Lettermint.
- Fouten vertalen naar één leesbare melding (`describeLettermintError`):
  `TimeoutError`, `ValidationError` (422 + `errorType` + antwoord),
  `HttpRequestError` (status + antwoord). Gooien met `{ cause }`.
- `mailConfigured()` = `LETTERMINT_API_TOKEN` en `MAIL_FROM_EMAIL` gezet;
  zonder: niets versturen, enkel loggen.

**Niet gebruiken:** de Nuxt-module `nuxt-lettermint`. Haar `autoEndpoint`
(`POST /api/lettermint/send`) aanvaardt `from`/`to`/`html` van elke bezoeker,
zonder login of limiet: een open mail-relay. Ook `useLettermint()` in de
browser niet: de inhoud van een mail hoort op de server gebouwd te worden.
Formulieren posten enkel hun velden naar een eigen, gevalideerd endpoint.

## Env-variabelen

| Variabele | Doel |
|---|---|
| `LETTERMINT_API_TOKEN` | Sending API-token (project in Lettermint) |
| `MAIL_FROM_EMAIL` | Afzender op een in Lettermint geverifieerd domein |
| `MAIL_FROM_NAME` | Weergavenaam |
| `ORDER_NOTIFICATION_EMAIL` | Ontvanger van bestelmeldingen (de klant, niet de ontwikkelaar) |
| `CONTACT_NOTIFICATION_EMAIL` | Ontvanger van het contactformulier |
| `CUSTOMER_REQUEST_EMAIL` | Ontvanger van accountaanvragen |
| `MAIL_REDIRECT_TO` | Enkel development en Preview: **alle** mail naar dit adres, met de echte ontvanger in het onderwerp (`[test → …]`). De development-database bevat echte klanten. **Leeg in productie.** |

Nieuwe variabelen ook in `.env.example` en in de `go-live`-checklist zetten.

## Regels

- **Mail mag de hoofdactie nooit breken.** Eerst opslaan (bestelling,
  aanvraag), daarna mailen in een eigen `try/catch` met `console.error`.
  Een mislukte PDF-bijlage laat de mail zonder bijlage vertrekken.
- **Altijd `text` én `html`.** HTML via `renderMailLayout` (+ `mailButton`,
  `withTextFooter`) uit `server/utils/mail-layout.ts`. Alle gebruikersinvoer
  door `escapeHtml`.
- **Antwoorden naar de juiste persoon:** bij het contactformulier en
  meldingen over een klant `replyTo` op het adres van die klant zetten.
- **Geen accountlekken:** auth-mails (magic link, reset) geven hetzelfde
  antwoord voor bestaande en onbekende adressen (zie `better-auth-project`).
- Stijl van de mails: inline CSS, tabellen voor de layout, merkkleur
  `MAIL_BRAND`. Geen externe CSS of scripts.

## Nieuw project of domein

- [ ] Domein toevoegen in Lettermint en de DNS-records (SPF, DKIM, eventueel
      return-path) instellen. Pas daarna `MAIL_FROM_EMAIL` op dat domein gebruiken.
- [ ] DMARC-record op het domein (minstens `p=none` met rapportage).
- [ ] Token als `LETTERMINT_API_TOKEN` in Vercel (Production, en Preview
      enkel als previews echt mogen mailen).
- [ ] Lettermint vermelden als verwerker in de privacyverklaring.
- [ ] Testmail van elke soort: komt aan, niet in spam, links werken.

## Debuggen

- Niets ontvangen? Zoek in de Vercel-runtime-logs op `[mail]`:
  `verstuurd: <message_id>` → zoek dat id op in Lettermint (afgeleverd,
  gebounced, geblokkeerd?); `mislukt:` → de reden staat erbij.
- `ValidationError 422` met `errors.from` → afzenderdomein niet geverifieerd;
  andere velden → inhoud ongeldig (bv. `text` korter dan 3 tekens).
- `HttpRequestError 401/403` → token fout of van een ander project.
- Token testen zonder te mailen: `await Lettermint.email(token).ping()` → `"pong"`.
- Upgrade van `lettermint`: changelog lezen, foutklassen en `send()`-antwoord
  (`message_id`, `status`) nakijken, en de drie paden testen (ping, 422,
  time-out).
