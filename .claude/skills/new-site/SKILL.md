---
name: new-site
description: Turn this starter clone into a real client site — optionally pull an existing site's content with fetch:site, then replace the four placeholder images, the placeholder copy in app/pages/index.vue, and the SEO strings in app.vue.
argument-hint: "[existing-site-url]"
disable-model-invocation: true
allowed-tools: Bash Read Edit Write Glob Grep
---

Convert this clone into a client site. `$ARGUMENTS` is the URL of the client's
existing site, if this is a rebuild rather than a greenfield build.

## 1. Confirm this clone is actually unstarted

```bash
ls public/images/
```

If `hero-workspace.webp`, `collect-material.webp`, `rebuild-frontend.webp` and
`present-redesign.webp` are still there, they are the generated gradients that
shipped with the starter and this skill applies. If they are gone, someone has
already run this — stop and ask what the user actually wants changed.

## 2. Gather the source material (rebuilds only)

Skip this for a greenfield site. With `$ARGUMENTS`:

```bash
pnpm fetch:site $ARGUMENTS --render
```

`--render` drives a real browser, so it handles JS-heavy pages and also captures
a full-page screenshot. It needs a one-time `pnpm playwright:install` first; run
that only if the fetch complains about a missing browser. Drop `--render` for a
plain static page — it is much faster.

Output lands in `content-import/<slug>/`: `content.md`, `meta.json`, an optional
`screenshot.png`, and `images/original` + `images/optimized`.

`content-import/` is gitignored and can hold dozens of files. **This is one of
the two places in this repo worth forking a subagent for** — have it read the
directory and report back the headings, the copy worth keeping, and which images
are real content rather than chrome.

Only run this against sites the user owns or has permission to reuse content
from. It is a working-reference tool, not a publishing pipeline.

## 3. Replace the images

Put the real images in `public/images/` as **WebP at quality 90** — high enough
that IPX' `q70` on top causes no visible loss. Convert anything that is not
already WebP; `sharp` is already a dependency:

```bash
node -e "require('sharp')('in.png').webp({quality:90}).toFile('public/images/out.webp')"
```

Then delete the four placeholder files.

## 4. Update the markup

Read `.claude/rules/images.md` before touching any `<NuxtImg>` — it loads
automatically when you open a `.vue` file, and the `sizes` trap it describes will
silently break every srcset if you get it wrong.

- `app/pages/index.vue` — replace the placeholder copy and point each
  `<NuxtImg>` at the new files. **Keep the existing patterns**: the hero shows
  the LCP treatment, the workflow cards show the lazy-loaded grid. They are the
  point of the starter. Update every `width`/`height` to the real dimensions of
  the new source file — a wrong value makes IPX upscale, and `verify:perf`
  fails on it.
- `app/app.vue` — replace `title`, `description` and the `navigation` array, and
  the footer's "Clean Nuxt frontend template" line.
- `app/app.config.ts` — set the Nuxt UI `primary` and `neutral` colors to the
  client's palette.
- `public/favicon.ico` — replace it.

## 5. Re-check the LCP element

Do not assume the hero image is LCP. On the starter's default page it was the
`<h1>`, because a tall text hero pushes the image below the fold on a phone. New
copy changes this. Run Lighthouse and read the
`largest-contentful-paint-element` audit, then move the
`:preload="{ fetchPriority: 'high' }"` treatment to whatever it names.

## 6. Verify

Run `/ship`. Do not consider the site started until `verify:perf` passes.

## 7. Scope the MCP servers and env to this site

`.mcp.json` ships with placeholders so that no clone ever gets account-wide
access. Ask the user for the Vercel project name and (if the site uses a
database) the Neon project id — do not create projects yourself.

1. Replace `REPLACE_WITH_VERCEL_PROJECT_NAME` and `REPLACE_WITH_NEON_PROJECT_ID`
   in `.mcp.json`. No database yet? Remove the Neon entries instead.
2. Link the CLI: `vercel link --yes --scope webxytes-projects --project <name>`.
   It writes `.vercel/` and a `.env.local` with an OIDC token (both gitignored).
3. Tell the user to run `/mcp` once, approve the project servers, and
   authenticate **Neon choosing only this project** (not "All projects") and
   **vercel choosing the team webxytes-projects**.
4. Check: `claude mcp get Neon` must show `Project config` (or `Local config`)
   with `projectId` in the URL. If it still shows the account-wide `User
   config`, add a local override:
   `claude mcp add --transport http -s local Neon "https://mcp.neon.tech/mcp?projectId=<id>"`.
5. Env: `cp .env.example .env`, fill in development values
   (`MAIL_REDIRECT_TO` = the developer, `NUXT_PUBLIC_DATABASE_ENV=development`
   if there is a database). Keep production values in `.env.live`. Set the
   Vercel env **per environment** (skill `go-live`).

Finally: update `README.md` so it describes the client site rather than the
starter, and delete the "Starting a new site from this clone" section from
`AGENTS.md` — it no longer applies to this repo.
