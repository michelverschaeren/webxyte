---
paths:
  - "**/*.vue"
---

# Image rules

Every rule here was added after measuring a regression. Do not undo one to make
a layout easier.

## The `sizes` trap — read this before writing a single `<NuxtImg>`

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

## The rest of the image rules

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
