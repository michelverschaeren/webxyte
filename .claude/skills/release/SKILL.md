---
name: release
description: Merge a task branch (<site>/<task> or <layer>/<task>) into main in the webxyte monorepo and follow the Vercel production deploy of every affected site. Use when the user asks to "merge", "push to production", "release", "go live with these changes", "merge this branch", or to review a branch for bugs before merging. Also for starting a new task branch. For the pre-launch performance checks of a brand-new site, use /ship.
---

# Release: task branch → main → Vercel

## Branch model (monorepo)

- `main` = production for **every** site. Vercel deploys each site's project
  from `main`; `turbo-ignore` skips sites that did not change.
- **One short-lived branch per task**, named after what it touches:
  `vermeir/promoties-filter`, `bakkerij-x/contactpagina`,
  `base/security-headers`. One site **or** one layer per branch — never a mix.
- No long-lived `development` branch: it would bundle unfinished work of one
  site with a release of another.
- Every push to a task branch gets Vercel **Preview** deploys (Neon branch
  `development`, `MAIL_REDIRECT_TO`) — only for the affected sites.
- A branch under `packages/` affects every site that extends that layer: check
  the Preview of **each** of them before merging.

Start a task (only when the user asks to start one):

```bash
git switch main && git pull --ff-only && git switch -c <site-or-layer>/<task>
```

Migrations do **not** run on deploy (skill `db-migration`). Commit or push only
when the user asks. Report every step honestly: what failed, what was skipped.

## 1. What goes along?

`B` = the task branch (`git branch --show-current`).

```bash
git status --short                 # nothing uncommitted forgotten?
git fetch origin
git log --oneline main..$B         # commits going to production
git log --oneline $B..origin/main  # main moved on? rebase or merge main in first
git diff --stat main...$B          # which sites / packages does it touch?
```

Files outside the site or layer in the branch name? Ask before merging — that
is a mixed branch. Changes under `packages/<layer>`: list the sites whose
`nuxt.config.ts` extends `@webxyte/<layer>`; all of them go live with this merge.

## 2. Review (before merging)

Read the full `git diff main...$B`. Look hardest at:

- **Forms, orders, mail**: validation kept; a failed mail never undoes the
  main action; no new open endpoint (see `mail-lettermint`).
- **New `server/api/**` routes**: a guard on the first line when the route is
  not meant to be public (skill `admin-conventions`).
- **Client ↔ API shape**: did a response change shape? Find every
  `useFetch`/`$fetch` caller of that route.
- **Joins**: a new `leftJoin` can duplicate rows; is the join column unique?
- **Deletes**: which tables reference the row (cascade/restrict)?
- **Env**: new vars in `.env.example` and set in Vercel **per environment**.

Then, mandatory (the Stop hook does lint + typecheck; the build is on you).
From the repo root, Turborepo limits it to what the branch changed:

```bash
pnpm turbo run lint typecheck build --filter="...[origin/main]"
```

(`...[origin/main]` = every changed package plus every site that depends on it.)

## 3. Migrations on production? (sites with a database)

New files in the migrations folder? Compare the last `when` in
`meta/_journal.json` with production (Neon MCP, branch `production`, read-only):

```sql
select max(created_at) from drizzle.__drizzle_migrations;
```

Equal → fine. Lower → **stop**: migrate first (`pnpm db:migrate:production`,
with the user's explicit OK). Local `DATABASE_URL` points at `development`, so a
passing local test says nothing about production.

## 4. Merge and push

Via a GitHub pull request (preferred: the PR shows the Preview links), or:

```bash
git switch main && git pull --ff-only \
  && git merge --no-ff $B -m "Merge $B: <short summary>" \
  && git push origin main \
  && git branch -d $B && git push origin --delete $B
```

## 5. Follow the deploy

Prefer the project-scoped `vercel` MCP (`list_deployments`,
`get_runtime_errors`). Fallback: the Vercel CLI (repo linked in `.vercel/`):

```bash
npx -y vercel@latest api "/v6/deployments?projectId=<prj_id>&teamId=<team_id>&limit=3"
```

(`vercel list` prints only URLs when it detects an agent; the API gives
`target`, `state` and the commit.) Wait for the newest production deploy to be
`READY` — for **each** affected site (step 1).

## 6. Check live

- Key pages answer 200; guarded routes 401/302 for a guest.
- No `DEVELOPMENT · TESTDATABASE` banner on production.
- `vercel logs runtime --project <name> --since 15m --query 'level:error'` → 0.
- `vercel logs requests --project <name> --since 15m` → no 5xx.
- Git Bash rewrites a lone `/` argument into a Windows path: prefix
  `MSYS_NO_PATHCONV=1` for `vercel curl / …`.

## 7. Report

Commit hash, build time, check results, and what the user must test logged in
(forms, mails, admin pages that changed). Without a browser connection: say
which logged-in flows were not tested.
