---
name: go-live
description: Checklist om een Nuxt + Neon + Vercel-site (zoals vleeswarenvermeir.be) live te zetten of na te kijken - indexeerbaarheid, afgeschermde paden, env-variabelen, mail, domein, Search Console, beveiliging. Gebruik bij "live zetten", "go-live", "lancering", "indexeren", "Search Console", of als de gebruiker vraagt wat er nog openstaat voor de lancering.
---

# Go-live-checklist

Loop elk punt na en rapporteer per punt: in orde / open / niet te controleren.
Wijzig niets aan Vercel-instellingen, DNS of de productiedatabase zonder
akkoord van de gebruiker.

## 1. Indexeren en afschermen
- [ ] Geen "in aanbouw"-poort meer en geen `site.indexable: false` in `nuxt.config.ts`.
- [ ] In Vercel geen `NUXT_SITE_INDEXABLE=false`.
- [ ] `BLOCKED_PATHS` (nuxt.config.ts) bevat `/account`, `/admin`,
      `/producten`, `/api/**` en de productfiches. Die staan dan niet in
      sitemap en llms.txt.
- [ ] Gasten zien op `/api/products` enkel naam + categorie
      (`curl https://<domein>/api/products?perPage=1`).
- [ ] `/sitemap.xml` en `/robots.txt` bekijken op het live domein.

## 2. Omgevingsvariabelen (Vercel → Production)
Vergelijk met `.env.example`:
- [ ] `DATABASE_URL`: de **pooled** Neon-URL (host met `-pooler`) van de productiebranch.
- [ ] `BETTER_AUTH_SECRET` (32+ tekens, uniek), `BETTER_AUTH_URL` = https-domein.
- [ ] `LETTERMINT_API_TOKEN`, `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME`.
- [ ] `ORDER_NOTIFICATION_EMAIL`, `CONTACT_NOTIFICATION_EMAIL`,
      `CUSTOMER_REQUEST_EMAIL` → adressen van de **klant**, niet van de ontwikkelaar.
- [ ] Oude variabelen weg: `NUXT_PUBLIC_SITE_PASSWORD` (lekt anders in de
      HTML), `NUXT_PUBLIC_CUSTOMER_ACCESS_TOKEN`.
- [ ] Preview-omgeving wijst **niet** naar de productiedatabase (Preview:
      `DATABASE_URL` = branch `development`, `MAIL_REDIRECT_TO` en
      `NUXT_PUBLIC_DATABASE_ENV=development` gezet).
- [ ] Production: `MAIL_REDIRECT_TO` en `NUXT_PUBLIC_DATABASE_ENV` **niet** gezet.
- [ ] De `S3_*`-bucket (productfiches) is bewust gedeeld door Production en
      Preview: een upload op een preview overschrijft de echte fiche.

## 3. Auth en beveiliging
- [ ] `trustedOrigins` in `server/utils/auth.ts` bevat het productiedomein.
- [ ] Rate limiting aan met `storage: "database"` (de tabel `rate_limit` bestaat).
- [ ] Geen publieke registratie (`disableSignUp: true`), tenzij de klant dat wil.
- [ ] Content-Security-Policy actief (nuxt.config.ts); console zonder CSP-fouten.
- [ ] Beheerder heeft een lang, uniek wachtwoord; de agency-admin staat in
      `shared/agency-admin.ts`.

## 4. Domein en deploy
- [ ] Domein + `www` als alias in Vercel, https werkt, één canonieke host.
- [ ] Laatste Production-deploy `Ready`; runtime-logs zonder errors (zie `release`).
- [ ] Alle migraties op productie (zie `db-migration`).

## 5. Na de lancering
- [ ] Search Console: domein verifiëren, `sitemap.xml` indienen.
- [ ] Privacyverklaring door de klant laten nalezen (bewaartermijnen,
      ondernemingsnummer).
- [ ] Klanten uitnodigen (`INVITE_ALL_ENABLED` / bulkactie op /admin/klanten);
      klanten zonder e-mailadres apart opvolgen.
- [ ] Oude hosting en databases (VPS) opruimen, door de gebruiker zelf.
- [ ] Eén echte testbestelling: mail met PDF komt aan bij de klant.
