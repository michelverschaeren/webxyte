# Nuxt Projects Starter

A clean Nuxt frontend starter for building new websites quickly.

## Why this template exists

This repository is the base template for quickly creating modern websites.
It is also meant for rebuilding outdated websites by reusing the text, context, and images gathered from an existing site and turning them into a fresh proposal for a future client.

## Included

**Framework**
- Nuxt 4, TypeScript, ESLint (`@nuxt/eslint`, flat config with stylistic rules — no separate Prettier setup needed)

**UI & visuals**
- [Nuxt UI](https://ui.nuxt.com) — component library (buttons, forms, modals, etc.), built on Tailwind CSS 4 and Reka UI
- Tailwind CSS 4
- `@nuxt/image` — optimized, responsive `<NuxtImg>`/`<NuxtPicture>` for any images you bring in
- `@nuxt/fonts` — automatic, self-hosted web font optimization (drop in a client's Google Font by name)
- `@vueuse/nuxt` — auto-imported [VueUse](https://vueuse.org) composables (scroll position, breakpoints, intersection observer, etc.)
- `@vueuse/motion` — declarative scroll/entrance animations via the `v-motion` directive, for a "modern" feel without hand-rolled CSS animation

**Deployment integrations (pre-installed, all sites run on Vercel)**
- `@vercel/analytics` and `@vercel/speed-insights` — registered as Nuxt modules, zero config. Both no-op off Vercel.
- `lettermint` — the official Lettermint SDK (pinned), wrapped in `sendMail()` in `server/utils/mail.ts`, plus a validated, rate-limited contact route (`POST /api/contact`). Needs `LETTERMINT_API_TOKEN` and `MAIL_FROM_EMAIL` (see `.env.example`). The `nuxt-lettermint` module is deliberately **not** used: its `autoEndpoint` is an open mail relay.
- Neon Postgres is **not** pre-installed — it's added per site, only when that site needs a database. See [`.claude/rules/integrations.md`](.claude/rules/integrations.md) for how.
- `.mcp.json` links Neon and Vercel **scoped to this site's own projects** (fill in the placeholders — `/new-site` step 7), plus context7 (current library docs) and Playwright (browser testing).

**Fetching an existing site for a rebuild**
- `scripts/fetch-site.mjs` — CLI that pulls a page's text (as Markdown), metadata, and images into `content-import/`
- `playwright` (dev-only) — renders JS-heavy pages and captures a full-page screenshot
- `cheerio` (dev-only) — parses HTML to pull out title, meta description, headings, and image URLs
- `turndown` (dev-only) — converts the cleaned page content to Markdown
- `sharp` — optimizes/downloads images (also used at runtime by `@nuxt/image`'s IPX provider)

## Setup

```bash
pnpm install
cp .env.example .env
```

Fill in `LETTERMINT_API_TOKEN` and `MAIL_FROM_EMAIL` once the site sends mail, and `MAIL_REDIRECT_TO` with your own address — in `.env` every mail goes there. Keep production values in `.env.live`. Leave `DATABASE_URL`
commented out unless this site uses Neon — see
[`.claude/rules/integrations.md`](.claude/rules/integrations.md).

If you'll use `--render` with the site-fetching script, install its browser once (not needed for plain fetches):

```bash
pnpm playwright:install
```

## Development

```bash
pnpm dev
```

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm build
```

### Performance and security verification

The starter ships with compression, prerendering, image optimization, cache
headers and security headers configured — but config is a claim, not proof. A
proxy or CDN in front can strip any of it, and one malformed `sizes` string
silently breaks a srcset. `scripts/verify-perf.mjs` checks the real responses:

```bash
pnpm build
pnpm preview                              # terminal 1
pnpm verify:perf http://localhost:3000    # terminal 2
pnpm verify:perf https://your-deploy.com  # or against the real thing
```

It exits non-zero on: a response without `Content-Encoding`, a `1w`/`2w` srcset
candidate (the @nuxt/image `sizes` trap), an image not served as WebP/AVIF, an
image response without `cache-control`, a missing security header, or a
generated image candidate wider than its source file.

The local build is not what Vercel serves: locally images come from IPX
(`/_ipx/…`) and Nitro pre-compresses assets; on Vercel @nuxt/image switches to
Vercel's image optimization (`/_vercel/image?…`) and the CDN compresses. Always
run it against a Vercel deploy as well. Preview deploys are protected by
default — pass the project's *Protection Bypass for Automation* secret:

```bash
VERCEL_AUTOMATION_BYPASS_SECRET=… pnpm verify:perf https://<preview>.vercel.app
```

**Read [CLAUDE.md](CLAUDE.md) before adding images or pages** — it documents the
rules these checks enforce and, more importantly, why each one exists.

## Deployment

Every site is hosted on Vercel. There is nothing to configure: Nitro detects
Vercel and uses its `vercel` preset, and @nuxt/image switches to Vercel's image
optimization by itself (its allowed widths come from `image.screens` in
`nuxt.config.ts`).

1. Import the repo in Vercel (or `vercel link` + `vercel deploy` from the CLI).
2. Set the env vars from `.env.example` in the Vercel project
   **per environment** — Production gets the real recipients, Preview gets
   `MAIL_REDIRECT_TO` (and the Neon `development` branch if the site has a
   database). See `.claude/skills/go-live`.
3. Enable Web Analytics and Speed Insights in the project — the modules are
   already installed.
4. Run `/ship` (or `pnpm verify:perf` by hand) against the deploy.

## Rebuilding an existing site

Use this when a client wants their outdated site redesigned and you need its text, structure, and images as raw material.

1. **Confirm you have the right to reuse the content** — this pulls text and images directly from a live page. Only run it against a client's own site or a site you otherwise have permission to reuse content from.

2. **Fetch a page:**

   ```bash
   pnpm fetch:site https://example.com
   ```

   Add `--render` for JS-heavy pages (also captures a full-page screenshot) — requires `pnpm playwright:install` first. Add `--max-images 80` to raise the default cap of 40 images.

   Run it once per page you need (home, about, services, etc.).

3. **Check the output** in `content-import/<page-slug>/`:
   - `content.md` — the page's text content, cleaned of nav/header/footer/scripts, as Markdown
   - `meta.json` — title, description, canonical URL, OG image, and a heading outline
   - `images/original/` and `images/optimized/` — every image found, plus a resized `.webp` version of each
   - `screenshot.png` — full-page reference screenshot (only with `--render`)

4. **Build the new pages** in `app/pages/` using Nuxt UI components, pulling copy from `content.md` and images from `images/optimized/` (copy the ones you're keeping into `public/` or `app/assets/`, don't build directly against `content-import/`).

5. `content-import/` is git-ignored — it's working reference material, not something to ship or commit. Delete it once the rebuild is done.

## Starting a new project from this template

- [ ] Update `name` in `package.json`
- [ ] Update the title/description in `README.md` (this section and above)
- [ ] Set the site's fonts via the `fonts` config in `nuxt.config.ts` if the client uses something other than the system default
- [ ] Replace `public/favicon.ico`
- [ ] Set page titles/meta via `useSeoMeta`/`useHead` in `app/app.vue` or per-page
- [ ] **Replace the four placeholder images in `public/images/`** with the real
      ones. They are generated abstract gradients — they exist so the image
      pipeline has something to optimize and `pnpm verify:perf` has something to
      check. Everything in `public/` is served publicly, so they ship if you
      leave them.
- [ ] **Rewrite `app/pages/index.vue`** with the client's content. Keep the
      `<NuxtImg>` patterns (see [CLAUDE.md](CLAUDE.md)) — replace the copy.
- [ ] Remove `content-import/` before shipping, if it was used
- [ ] Run through the definition of done in [AGENTS.md](AGENTS.md) against the
      deployed site before handing it over

## Recommended VS Code extensions

Opening this repo in VS Code will prompt you to install the recommended set (`.vscode/extensions.json`): Vue (Volar), ESLint, Tailwind CSS IntelliSense, Iconify IntelliSense, Nuxtr, and Playwright.
