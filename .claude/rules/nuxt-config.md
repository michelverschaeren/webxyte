---
paths:
  - "nuxt.config.ts"
---

# Nitro and security settings that must stay

Every setting here was added after measuring a regression. Do not undo one to
make a layout easier.

## Nitro

- `nitro.compressPublicAssets: { gzip: true, brotli: true }` — the Nitro node
  server compresses nothing at runtime. Without this (or a proxy that
  compresses), every asset goes over the wire raw. Measured on this starter:
  46096 B → 6863 B brotli for the home page.
- `nitro.prerender` with `crawlLinks` — brochure pages are rendered once at build
  time. @nuxt/image also prerenders the `/_ipx/` variants into
  `.output/public/_ipx/`, so images are static files, not runtime work.
- `routeRules` cache headers for `/images/**` and `/_ipx/**` (one month).
  `/_nuxt/**` is handled automatically (a year + `immutable`, filenames are
  hashed). Photos are content, not build output: a month is long enough for
  repeat visits, short enough that a replaced photo actually reaches people.
  Lighthouse flags this as "Serve static assets with an efficient cache policy"
  (it wants a year) — **that flag is expected here, do not raise the TTL to a
  year**. Unlike `/_nuxt/**`, image filenames are not content-hashed, so a
  year-long TTL means a replaced photo never reaches returning visitors.

## Security headers

Set on `/**`: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
`Permissions-Policy`. `scripts/verify-perf.mjs` asserts the exact same set at
runtime, so the two lists have to stay in sync.

- **A more specific routeRule replaces the `headers` of `/**`, it does not merge
  with it.** Verified with curl. Any rule that sets `headers` must spread
  `securityHeaders` as well — see how `/images/**` does it.
- **`Strict-Transport-Security` is commented out on purpose.** Enable it only
  when HTTPS is guaranteed for the domain *and every subdomain*; otherwise you
  lock yourself out for a year.
- **Do not paste a CSP in blindly.** Nuxt hydrates with inline scripts and
  styles, so a strict CSP needs nonces. Either add `nuxt-security` and let it
  manage them, or start with `Content-Security-Policy-Report-Only` and see what
  breaks first.

Headers are worthless if something in front strips them, so always confirm on
the real deploy:

```bash
curl -sI https://<host>/
curl -s -o /dev/null -D - -H "Accept-Encoding: br, gzip" https://<host>/ \
  | grep -iE "content-encoding|content-length|vary"
```

No `Content-Encoding` in that response means it is **not** in order, however
correct the config looks — check the proxy/CDN in front.
