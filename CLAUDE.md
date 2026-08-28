# CLAUDE.md

Nuxt 4 brochure-site starter. Every client site is a clone of this repo, so the
performance and security settings here are load-bearing — each was added after
measuring a regression, and the reason is written next to it. Do not undo one to
make a layout easier.

## Commands

| command | what it does |
| --- | --- |
| `pnpm dev` | dev server |
| `pnpm build` | production build (prerenders, writes `.gz`/`.br`) |
| `pnpm preview` | serve the build locally |
| `pnpm lint` | eslint, flat config, stylistic rules — **no Prettier** |
| `pnpm typecheck` | `nuxt typecheck` (vue-tsc) |
| `pnpm verify:perf <url>` | perf/security assertions against a **running** server |
| `pnpm fetch:site <url>` | pull an existing site's copy + images into `content-import/` |
| `pnpm playwright:install` | one-time, only for `fetch:site --render` |

There is no `test` script and no `format` script. Do not invent one.

## Verification policy

**Do not run `pnpm lint` or `pnpm typecheck` after each edit.** Hooks own this:

- **During work** — a PostToolUse hook lints the repo in the background and
  interrupts only on an error. Trust it; don't pre-empt it by linting by hand.
- **End of task** — a Stop hook runs lint + typecheck (~18s) and blocks the turn
  until both pass. It skips itself in <1s when no source file changed.
- **Before a deploy** — run `/ship`. Only that runs `pnpm build` and
  `verify:perf`; neither hook does.

`typescript-lsp` gives per-edit diagnostics for `.ts`/`.mjs` only. **`.vue` files
have no LSP coverage** — no Vue language server exists in the official plugin
marketplace, so `vue-tsc` at Stop is the only type signal an SFC ever gets. Weigh
a `.vue` edit accordingly.

## Where the detailed rules live

Loaded automatically when you touch a matching file — read them there, they are
not repeated here:

- `.claude/rules/images.md` (`**/*.vue`) — the @nuxt/image `sizes` trap. Read it
  before writing a single `<NuxtImg>`.
- `.claude/rules/nuxt-config.md` (`nuxt.config.ts`) — Nitro, routeRules, headers.
- `.claude/rules/deploy.md` (`Dockerfile`) — base image and sharp.

## Workflow

- Skip plan mode when the diff fits in one sentence. Plan when the change touches
  `nuxt.config.ts`, adds a page, or changes how an image is rendered — those are
  the places with measured regressions behind them.
- Stay inline. This is ~10 source files; an exploration subagent is a cold start
  that re-derives context you already have. Fork one only to sweep
  `content-import/` after a `fetch:site` run or `.output/public/_ipx/` after a
  build — those are generated and large.
- Everything in `public/` is served publicly. Check what you drop there.
- **Still holding `hero-workspace.webp` and the placeholder copy in
  `app/pages/index.vue`?** This is an unstarted clone. Run `/new-site` first.
