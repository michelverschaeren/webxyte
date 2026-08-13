# CLAUDE.md

Guidance for agents working in this repository.

This project carries a set of performance and security settings that are cheap
to keep and expensive to rediscover — most were added after measuring a
regression, and the reason is written next to each one. Do not undo them to make
a layout easier.

Treat this as a real site that will be deployed: the definition of done at the
bottom applies here.

## Commands

```bash
pnpm dev          # dev server
pnpm build        # production build (prerenders + writes .gz/.br)
pnpm preview      # serve the build locally
pnpm lint         # eslint (flat config, stylistic rules — no Prettier)
pnpm typecheck    # vue-tsc
pnpm verify:perf  # performance/security assertions against a running server
```

`pnpm verify:perf` needs a server: `pnpm build && pnpm preview` in one terminal,
then `pnpm verify:perf http://localhost:3000` (or the deployed URL) in another.

## Image and performance rules

### The `sizes` trap — read this before writing a single `<NuxtImg>`

@nuxt/image parses `sizes` with `parseSizes()`. A token **without** a
`breakpoint:` prefix is stored under the key `"1px"`
(`node_modules/@nuxt/image/dist/runtime/utils/index.js`), and that key is later
resolved as `screens["1px"] ?? parseInt("1px")` → **a synthetic screen 1 pixel
wide**. So:

| written | result |
| --- | --- |
| `sizes="100vw"` | 100vw of 1px = 1px. The srcset is `1w, 2w`. The image is broken. |
| `sizes="100vw lg:50vw"` | junk `1w`/`2w` candidates *plus* the right ones. Works, wastes variants. |
| `sizes="280px sm:320px"` | fine — absolute px survive. Only `vw` is affected. |

**Rule 1: every `sizes` token starts with a breakpoint prefix, and the first one
is `xs:`.** `xs: 320` is declared in `nuxt.config.ts` precisely for this;
@nuxt/image's own defaults start at `sm: 640`, so without it there is no bucket
for phones.

**Rule 2: write out every breakpoint you want a candidate for.**
`xs:50vw sm:33vw lg:25vw` stops at a 512w candidate, so a 1536px screen gets an
image that is too small and looks soft. Write
`xs:50vw sm:33vw md:33vw lg:25vw xl:25vw 2xl:25vw`.

### The rest of the image rules

- **`format="webp"` on every non-WebP source.** IPX keeps the source format when
  no `format` is given. Measured on this stack with a detail-rich source: the
  same 800×600 render is **287 kB as PNG and 77 kB as WebP** — 3.7× for one
  missing prop. Better still: convert source files to WebP yourself (quality 90 —
  high enough that IPX' q70 on top causes no visible loss) and drop them in
  `public/images/`.
- **`width`/`height` must be the real source dimensions.** Declaring 1920×640
  for a 1440×602 file makes IPX generate candidates up to 2560px by *enlarging*
  a smaller source: bigger files, no extra detail. The srcset must never contain
  a candidate wider than the source file (`pnpm verify:perf` checks this).
- **`densities="1"`** for decorative images behind a dark overlay, and for any
  image whose source is smaller than the largest breakpoint. A 2x candidate of
  an image nobody looks at closely is pure weight.
- **`loading="lazy"` on everything below the fold.** The LCP image gets the
  opposite: `:preload="{ fetchPriority: 'high' }"` **and** `fetchpriority="high"`,
  and no `loading="lazy"`.
- **Check which element is actually LCP before spending a preload on it.**
  Lighthouse's `largest-contentful-paint-element` audit tells you. It is often
  not the hero image: on the starter's default page it was the `<h1>`, because a
  tall text hero pushes the image below the fold on a phone. Preloading a
  non-LCP image competes with the real LCP for bandwidth, so move the treatment
  to whatever the audit names — and re-check after the content changes.
- **Never `object-cover` on an image with baked-in text or captions** — it crops
  the words. Use `object-contain` or let the image keep its own ratio.

`app/pages/index.vue` is the reference implementation: the hero shows the LCP
pattern, the workflow cards show the lazy-loaded grid pattern.

**Placeholder check — do this once, at the start of a project.** If
`public/images/` still holds `hero-workspace.webp`, `collect-material.webp`,
`rebuild-frontend.webp` and `present-redesign.webp`, those are generated
gradients that came with the starter, and `app/pages/index.vue` still has its
placeholder copy. Replace both with the real content before shipping —
everything in `public/` is served publicly. Keep the `<NuxtImg>` patterns; they
are the point. Once replaced, this paragraph no longer applies.

### Nitro settings that must stay

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

Set on `/**` in `nuxt.config.ts`: `X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options`, `Permissions-Policy`.

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

## Deployment

`Dockerfile` is multi-stage: the build stage needs devDependencies (Nuxt modules
are build-time), the runtime stage copies only `.output`. **Both stages use the
same base image** — sharp ships native binaries per libc, and a glibc build
dropped into an Alpine runtime fails on the first image request, not at build
time. The Node version is pinned via `ARG NODE_VERSION`; auto-detecting builders
(Nixpacks and friends) still guess Node 18 while Nuxt needs ≥ 22.19.

## Definition of done — every new site

- [ ] Lighthouse **mobile performance ≥ 85**, measured against the real deploy.
      Not localhost: it has no realistic TTFB and flatters the score.
- [ ] All images served as WebP, and no srcset candidate wider than its source.
- [ ] Compression, cache headers and security headers confirmed with `curl`
      against the deploy — not inferred from `nuxt.config.ts`.
- [ ] `pnpm verify:perf https://<deploy>` passes.
- [ ] `pnpm lint` and `pnpm typecheck` clean.
