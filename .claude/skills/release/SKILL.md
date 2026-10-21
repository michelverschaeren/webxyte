---
name: release
description: Move development to main and follow the Vercel production deploy for a site from this starter. Use when the user asks to "merge development into main", "push to production", "release", "go live with these changes", or to review development for bugs before merging. For the pre-launch performance checks of a brand-new site, use /ship.
---

# Release: development → main → Vercel

Production = branch `main`, deployed by Vercel automatically. Migrations do
**not** run on deploy (skill `db-migration`). Commit or push only when the user
asks. Report every step honestly: what failed, what was skipped.

## 1. What goes along?

```bash
git status --short                      # nothing uncommitted forgotten?
git log --oneline main..development     # commits going to production
git log --oneline development..main     # main ahead? discuss first
git diff --stat main...development
```

## 2. Review (before merging)

Read the full `git diff main...development`. Look hardest at:

- **Forms, orders, mail**: validation kept; a failed mail never undoes the
  main action; no new open endpoint (see `mail-lettermint`).
- **New `server/api/**` routes**: a guard on the first line when the route is
  not meant to be public (skill `admin-conventions`).
- **Client ↔ API shape**: did a response change shape? Find every
  `useFetch`/`$fetch` caller of that route.
- **Joins**: a new `leftJoin` can duplicate rows; is the join column unique?
- **Deletes**: which tables reference the row (cascade/restrict)?
- **Env**: new vars in `.env.example` and set in Vercel **per environment**.

Then, mandatory (the Stop hook does lint + typecheck; the build is on you):

```bash
pnpm lint
pnpm typecheck
pnpm build
```

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

```bash
git checkout main && git pull --ff-only \
  && git merge --no-ff development -m "Merge development: <short summary>" \
  && git push origin main \
  && git checkout development
```

## 5. Follow the deploy

Prefer the project-scoped `vercel` MCP (`list_deployments`,
`get_runtime_errors`). Fallback: the Vercel CLI (repo linked in `.vercel/`):

```bash
npx -y vercel@latest api "/v6/deployments?projectId=<prj_id>&teamId=<team_id>&limit=3"
```

(`vercel list` prints only URLs when it detects an agent; the API gives
`target`, `state` and the commit.) Wait for the newest production deploy to be
`READY`.

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
