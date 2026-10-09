# AGENTS.md

Nuxt 4 brochure-site starter. Every client site is a clone of this repo, so the
performance and security settings here are load-bearing — each was added after
measuring a regression, and the reason is written next to it. Do not undo one to
make a layout easier.

## Commands

```bash
pnpm dev          # dev server
pnpm build        # production build (prerenders, writes .gz/.br)
pnpm preview      # serve the build locally
pnpm lint         # eslint, flat config, stylistic rules — no Prettier
pnpm typecheck    # nuxt typecheck (vue-tsc)
pnpm verify:perf  # perf/security assertions against a running server
pnpm fetch:site   # pull an existing site's copy + images into content-import/
```

There is no `test` script and no `format` script. Do not invent one.

`pnpm verify:perf` needs a server: `pnpm build && pnpm preview` in one terminal,
then `pnpm verify:perf http://localhost:3000` (or the deployed URL) in another.

## Where the rules live

The detailed rules are split by the files they apply to, so an agent only reads
what the task needs. Read the matching file **before** editing:

| Editing | Read first |
| --- | --- |
| any `.vue` file | [`.claude/rules/images.md`](.claude/rules/images.md) — the @nuxt/image `sizes` trap and the image rules. Non-negotiable before writing a `<NuxtImg>`. |
| `nuxt.config.ts` | [`.claude/rules/nuxt-config.md`](.claude/rules/nuxt-config.md) — Nitro compression and prerender, cache `routeRules`, security headers. |
| `Dockerfile` | [`.claude/rules/deploy.md`](.claude/rules/deploy.md) — same base image in both stages, pinned Node. |
| env vars, email, database | [`.claude/rules/integrations.md`](.claude/rules/integrations.md) — Vercel Analytics/Speed Insights, Lettermint email, opt-in Neon. |

Claude Code loads these three automatically via `paths:` frontmatter and reads
[`CLAUDE.md`](CLAUDE.md) for its own workflow and hook conventions. Other agents
should open them directly from the table above.

## Verification

Lint and typecheck once at the end of a change, not after each edit:

```bash
pnpm lint && pnpm typecheck
```

## Definition of done — every new site

- [ ] Lighthouse **mobile performance ≥ 85**, measured against the real deploy.
      Not localhost: it has no realistic TTFB and flatters the score.
- [ ] All images served as WebP, and no srcset candidate wider than its source.
- [ ] Compression, cache headers and security headers confirmed with `curl`
      against the deploy — not inferred from `nuxt.config.ts`.
- [ ] `pnpm verify:perf https://<deploy>` passes.
- [ ] `pnpm lint` and `pnpm typecheck` clean.

## Starting a new site from this clone

If `public/images/` still holds `hero-workspace.webp`, `collect-material.webp`,
`rebuild-frontend.webp` and `present-redesign.webp`, those are generated
gradients that came with the starter, and `app/pages/index.vue` still has its
placeholder copy. Replace both with the real content before shipping —
everything in `public/` is served publicly. Keep the `<NuxtImg>` patterns; they
are the point.
