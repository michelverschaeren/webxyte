# CLAUDE.md

@AGENTS.md

## Verification policy (Claude Code)

**Do not run `pnpm lint` or `pnpm typecheck` after each edit.** Hooks own this
(`.claude/settings.json`):

- **During work** — a PostToolUse hook lints in the background and interrupts
  only on an error.
- **End of task** — a Stop hook runs lint + typecheck and blocks the turn until
  both pass. From the repo root this covers every site via Turborepo (cached,
  so unchanged sites cost nothing).
- **Before a site goes live** — run `/ship` in that site's folder.

`.vue` files have no LSP coverage; `vue-tsc` at Stop is the only type signal
an SFC gets.

## Workflow

- Start Claude Code (or open VS Code) in the **repo root**, so the hooks,
  rules and skills in `.claude/` load, and name the site in your request
  ("in sites/bakkerij-x: …"). A site's own `CLAUDE.md` loads when you work on
  its files.
- Skip plan mode when the diff fits in one sentence. Plan when the change
  touches a `nuxt.config.ts`, anything under `packages/`, adds a page, or
  changes how an image is rendered.
- Everything in a site's `public/` is served publicly. Check what you drop there.
