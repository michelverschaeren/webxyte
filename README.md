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

**Fetching an existing site for a rebuild**
- `scripts/fetch-site.mjs` — CLI that pulls a page's text (as Markdown), metadata, and images into `content-import/`
- `playwright` (dev-only) — renders JS-heavy pages and captures a full-page screenshot
- `cheerio` (dev-only) — parses HTML to pull out title, meta description, headings, and image URLs
- `turndown` (dev-only) — converts the cleaned page content to Markdown
- `sharp` — optimizes/downloads images (also used at runtime by `@nuxt/image`'s IPX provider)

## Setup

```bash
pnpm install
```

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
- [ ] Remove `content-import/` before shipping, if it was used

## Recommended VS Code extensions

Opening this repo in VS Code will prompt you to install the recommended set (`.vscode/extensions.json`): Vue (Volar), ESLint, Tailwind CSS IntelliSense, Iconify IntelliSense, Nuxtr, and Playwright.
