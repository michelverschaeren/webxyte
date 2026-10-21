---
name: ship
description: Build and verify this Nuxt site against the definition of done before it goes live on Vercel. Runs pnpm build + verify:perf locally, then verify:perf against a Vercel preview or production URL.
argument-hint: "[deploy-url]"
disable-model-invocation: true
allowed-tools: Bash Read Edit
---

Pre-launch verification. `$ARGUMENTS` is a Vercel deploy URL (preview or
production), if there is one yet.

The Stop hook already covers lint and typecheck. This skill covers the part it
deliberately skips: the build, and what actually goes over the wire.

Every site runs on Vercel, and a local build is **not** the same output — see
the "Two builds, two image pipelines" table in `.claude/rules/nuxt-config.md`.
Step 1–2 prove the markup and the config; only step 3 proves the site.

## 1. Build locally

```bash
pnpm build
```

This is a node-server build: it prerenders the routes and writes every `/_ipx/`
variant plus `.gz`/`.br` siblings into `.output/public/`. A failure here fails
on Vercel too. Report how long it took.

## 2. Verify locally

Start the preview server in the background, wait for it to answer, then assert:

```bash
pnpm preview
```

```bash
pnpm verify:perf http://localhost:3000
```

`scripts/verify-perf.mjs` exits non-zero on: a response without
`Content-Encoding`, a `1w`/`2w` srcset candidate (the `sizes` trap), an image not
served as WebP/AVIF, an image response without `cache-control`, a missing
security header, or a generated candidate wider than its source file.

Fix what it reports. For a `1w`/`2w` finding, read `.claude/rules/images.md` —
that failure is always a `sizes` string missing its `xs:` prefix.

Stop the preview server when you are done with it.

## 3. Verify on Vercel

Use `$ARGUMENTS` if given. Otherwise, if the repo is linked (`.vercel/` exists),
make a preview deploy and use the URL it prints:

```bash
vercel deploy
```

If it is not linked, do not run `vercel link` yourself — ask the user which
Vercel project this is, or for the URL of a deploy that a Git push made.

Preview deploys are behind Vercel Authentication by default and answer 401 to
curl. If that happens, ask the user for the project's **Protection Bypass for
Automation** secret (Project Settings → Deployment Protection) — never turn the
protection off. Then:

```bash
VERCEL_AUTOMATION_BYPASS_SECRET=<secret> pnpm verify:perf <url>
curl -sI <url>   # add -H "x-vercel-protection-bypass: <secret>" on a preview
```

Run `pnpm build` first if `.output/` is missing: the script reads the route
list from it. On Vercel, image URLs are `/_vercel/image?url=…&w=…` rather than
`/_ipx/…`, and AVIF is a pass — the script handles both.

## 4. Report against the definition of done

Report each item as met, not met, or not checked — never infer one from the
config file:

- [ ] Lighthouse **mobile performance ≥ 85** against the Vercel deploy, not
      localhost (localhost has no realistic TTFB and flatters the score). You
      cannot run Lighthouse here — tell the user to run it and report back.
      Speed Insights in the Vercel dashboard gives real-user numbers once the
      site has traffic.
- [ ] All images served as WebP/AVIF, no srcset candidate wider than its source.
- [ ] Compression, cache headers, security headers confirmed with `curl`.
- [ ] `pnpm verify:perf <vercel-url>` passes.
- [ ] `pnpm lint` and `pnpm typecheck` clean.

One expected failure: Lighthouse flags `/images/**` under "Serve static assets
with an efficient cache policy" because it wants a year and this project sets a
month. **That flag is correct to ignore** — see `.claude/rules/nuxt-config.md`
for why raising it would break photo replacement.
