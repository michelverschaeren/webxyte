---
name: mail-lettermint
description: E-mail versturen in dit project (en elk project van deze stack) via Lettermint - de vaste maildienst voor transactionele mail (bestelmeldingen, inloglinks, uitnodigingen, contactformulier). Gebruik bij elke nieuwe of gewijzigde mail, bij server/utils/mail*.ts, bij "mail komt niet aan", bij env-variabelen LETTERMINT_* / MAIL_* / *_NOTIFICATION_EMAIL, of als iemand een andere maildienst (Resend, SendGrid, SMTP, nodemailer) voorstelt.
---

# Mail via Lettermint

**Afspraak:** transactionele mail loopt altijd via **Lettermint**
(lettermint.co, EU). Stel geen andere dienst of SMTP-library voor, tenzij de
gebruiker daar zelf om vraagt.

## Opzet (`server/utils/mail.ts`)

- Eén interne `sendMail()`: `POST https://api.lettermint.co/v1/send` met
  header `x-lettermint-token`. **Geen SDK**: één `fetch`, geen extra dependency.
- Body: `from` (`"<naam> <MAIL_FROM_EMAIL>"`), `to` (array), `subject`,
  `text`, `html`, `reply_to` (array), `attachments`
  (`{ filename, content: base64, content_type }`).
- Een antwoord dat niet `ok` is → `throw`, met status en body in de melding.
- `mailConfigured()` = `LETTERMINT_API_TOKEN` én `MAIL_FROM_EMAIL` gezet.
  Lokaal zonder token: niets versturen, enkel een logregel.
- Per soort mail een geëxporteerde functie: `sendOrderNotification`,
  `sendContactMail`, `sendCustomerRequestMail`, `sendAuthLinkMail`,
  `sendLaunchMail`. Nieuwe mails volgen dat patroon.

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

- Niets ontvangen? Eerst de Vercel-runtime-logs nakijken op
  `Lettermint gaf <status>` of `[mail]` / `[orders]`. Daarna het dashboard
  van Lettermint (verzonden, gebounced, geblokkeerd).
- 401/403 → token fout of van een ander project. 422 → afzenderdomein niet
  geverifieerd of veld ongeldig.
