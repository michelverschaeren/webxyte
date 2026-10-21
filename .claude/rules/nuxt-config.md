---
paths:
  - "**/nuxt.config.ts"
---

# Nitro and security settings that must stay

Every setting here was added after measuring a regression. Do not undo one to
make a layout easier.

## Two builds, two image pipelines

Every site deploys to Vercel. Nitro picks the `vercel` preset by itself there,
and @nuxt/image picks its `vercel` provider by itself (`std-env` detection in
`node_modules/@nuxt/image/dist/module.js`). Locally, `pnpm build` produces a
`node-server` build with IPX instead. Same config, different output:

| | local `pnpm build` / `preview` | Vercel |
| --- | --- | --- |
| image URLs | `/_ipx/f_webp&q_70&s_640x360/images/x.webp` | `/_vercel/image?url=/images/x.webp&w=640&q=70` |
| image work | prerendered into `.output/public/_ipx/` | optimized on demand, cached by Vercel |
| compression | `.gz`/`.br` from `compressPublicAssets` | Vercel's CDN, on the fly |

So a local run proves the markup (srcsets, `sizes`, headers in routeRules); only
a deploy proves what visitors get. `/ship` does both.

## Nitro

- `nitro.compressPublicAssets: { gzip: true, brotli: true }` — needed for the
  local node-server build, which compresses nothing at runtime (measured:
  46096 B → 6863 B brotli for the home page). On Vercel the CDN compresses
  anyway, so it is redundant there but harmless. Keep it: it is what makes the
  local `verify:perf` run meaningful.
- `nitro.prerender` with `crawlLinks` — brochure pages are rendered once at build
  time, on both targets.
- `nitro.externals.inline` — a **Windows-only** workaround for local builds
  (nuxt/nuxt#36467). Vercel builds on Linux and does not need it. Remove it once
  the upstream fix ships in a Nuxt release, not before.
- `routeRules` cache headers for `/images/**` and `/_ipx/**` (one month). The
  Vercel preset writes these into `.vercel/output/config.json`, so they apply to
  static files there too. `/_ipx/**` only exists locally; on Vercel the
  optimized images are served from `/_vercel/image`, whose caching Vercel
  manages. `/_nuxt/**` is handled automatically (a year + `immutable`,
  filenames are hashed). Photos are content, not build output: a month is long
  enough for repeat visits, short enough that a replaced photo actually reaches
  people. Lighthouse flags this as "Serve static assets with an efficient cache
  policy" (it wants a year) — **that flag is expected here, do not raise the
  TTL to a year**. Unlike `/_nuxt/**`, image filenames are not content-hashed,
  so a year-long TTL means a replaced photo never reaches returning visitors.
- `image.screens` doubles as the list of widths Vercel is allowed to generate:
  the provider copies it into Vercel's `images.sizes`, and any other width is
  rounded **up** to the next screen. Adding a screen is cheap; removing one
  changes every srcset.

## Security headers

Set on `/**`: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
`Permissions-Policy`. `scripts/verify-perf.mjs` asserts the exact same set at
runtime, so the two lists have to stay in sync.

- **A more specific routeRule replaces the `headers` of `/**`, it does not merge
  with it.** Verified with curl. Any rule that sets `headers` must spread
  `securityHeaders` as well — see how `/images/**` does it.
- **`Strict-Transport-Security` is commented out on purpose.** Vercel may
  already send one for its own domains — check the deploy with `curl -sI`
  before adding your own. Enable `includeSubDomains` only when HTTPS is
  guaranteed for the domain *and every subdomain*; otherwise you lock visitors
  out for a year.
- **Do not paste a CSP in blindly.** Nuxt hydrates with inline scripts and
  styles, so a strict CSP needs nonces. Either add `nuxt-security` and let it
  manage them, or start with `Content-Security-Policy-Report-Only` and see what
  breaks first. Vercel Analytics and Speed Insights load from `/_vercel/insights`
  and `/_vercel/speed-insights`, so a CSP must allow those.

Always confirm on the real deploy, not from the config:

```bash
curl -sI https://<host>/
curl -s -o /dev/null -D - -H "Accept-Encoding: br, gzip" https://<host>/ \
  | grep -iE "content-encoding|content-length|vary"
```
