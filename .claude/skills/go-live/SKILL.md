---
name: go-live
description: Launch checklist for a site from this starter beyond performance - indexing, env vars per Vercel environment, mail and DNS, auth and security, domain, Search Console. Use for "go live", "launch", "is everything ready", "Search Console", or when reviewing what is still open before or after launch. Pair it with /ship (build + performance).
---

# Go-live checklist

Walk every item; report each as done / open / not checkable. Do not change
Vercel settings, DNS or a production database without the user's OK.

## 1. Performance

- [ ] `/ship` passes (build, `verify:perf` locally and on the Vercel deploy,
      Lighthouse mobile ≥ 85 reported by the user).

## 2. Indexing

- [ ] No "under construction" gate, no `site.indexable: false`, no
      `NUXT_SITE_INDEXABLE=false` in Vercel.
- [ ] Private paths (`/admin`, `/account`, `/api/**`) excluded from sitemap and
      robots; nothing sensitive in Schema.org, sitemap or llms.txt.
- [ ] `/sitemap.xml` and `/robots.txt` checked on the live domain.

## 3. Env vars — per Vercel environment

Compare with `.env.example`:

- [ ] Production: real recipients (`CONTACT_NOTIFICATION_EMAIL`, …) = the
      **client's** addresses; `MAIL_REDIRECT_TO` and `NUXT_PUBLIC_DATABASE_ENV`
      **not** set.
- [ ] Preview: `MAIL_REDIRECT_TO` = developer; with a database also
      `DATABASE_URL` = branch `development` and
      `NUXT_PUBLIC_DATABASE_ENV=development`.
- [ ] No leftover vars from a construction phase (site passwords, access
      tokens) — a `NUXT_PUBLIC_*` value ends up in the HTML.
- [ ] Secrets are type Sensitive in Vercel.

## 4. Mail (skill `mail-lettermint`)

- [ ] Sender domain verified in Lettermint (SPF, DKIM), DMARC record present.
- [ ] One real test per kind of mail arrives in the client's inbox, not in spam.

## 5. Auth and security (sites with logins)

- [ ] `trustedOrigins` contains the production domain; `BETTER_AUTH_URL` is https.
- [ ] Rate limiting on, `storage: "database"` (serverless: memory does not work).
- [ ] No public sign-up unless the client wants it.
- [ ] Security headers / CSP active, no CSP errors in the console.
- [ ] Agency-only destructive actions guarded (skill `admin-conventions`).

## 6. Domain and deploy

- [ ] Domain + `www` in Vercel, https works, one canonical host.
- [ ] Latest Production deploy `READY`, runtime logs clean (skill `release`).
- [ ] All migrations applied to production (skill `db-migration`).
- [ ] No `DEVELOPMENT · TESTDATABASE` banner on the live site.

## 7. After launch

- [ ] Search Console: verify the domain, submit `sitemap.xml`.
- [ ] Privacy policy reviewed by the client (processors: Vercel, Lettermint,
      Neon; retention periods; company number).
- [ ] Web Analytics and Speed Insights enabled in the Vercel project.
