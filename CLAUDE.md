# CLAUDE.md

@AGENTS.md

## Context and safety nets (Claude Code)

- **SessionStart hook** (`.claude/hooks/session-context.mjs`): at the start of
  every session you get the folder (main folder or task folder), branch, the
  site/layer that branch is for, all sites and layers, and the open tasks. Use
  it for step 1–2 of "Werkwijze bij elke vraag" in AGENTS.md instead of
  asking things it already answers.
- **PreToolUse hook** (`.claude/hooks/guard-main.mjs`): a Write/Edit to a repo
  file while on `main` asks the user to confirm. Expect that prompt; it means
  you skipped step 2. Propose a task instead of pushing past it, unless the
  user explicitly wants the change on `main` (e.g. a README typo).
- The user is learning git, worktrees and this setup. Explain the *next
  button to press* in plain Dutch (the VS Code status bar: Start site,
  Nieuwe taak, Push, Taak afronden, Check, Hulp) rather than raw git commands.
  Answer in Dutch.

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
