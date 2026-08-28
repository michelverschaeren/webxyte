---
name: ship
description: Build, preview and verify this Nuxt site against the definition of done before a deploy. Runs pnpm build, serves it, and asserts compression, cache headers, security headers and image srcsets with verify:perf.
argument-hint: "[deploy-url]"
disable-model-invocation: true
allowed-tools: Bash Read Edit
---

Pre-deploy verification. `$ARGUMENTS` is the deployed URL, if there is one yet.

The Stop hook already covers lint and typecheck. This skill covers the part it
deliberately skips: the build, and what the server actually puts on the wire.

## 1. Build

```bash
pnpm build
```

This prerenders the routes and writes every `/_ipx/` variant plus `.gz`/`.br`
siblings into `.output/public/`. Report how long it took — it is the one cost in
this project that has never been measured.

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
served as WebP, an `/_ipx/` response without `cache-control`, a missing security
header, or a generated candidate wider than its source file.

Fix what it reports. For a `1w`/`2w` finding, read `.claude/rules/images.md` —
that failure is always a `sizes` string missing its `xs:` prefix.

Stop the preview server when you are done with it.

## 3. Verify the real deploy

Localhost proves the config; it does not prove the deploy. A proxy or CDN in
front can strip any of it. If `$ARGUMENTS` names a URL:

```bash
pnpm verify:perf $ARGUMENTS
curl -sI $ARGUMENTS
curl -s -o /dev/null -D - -H "Accept-Encoding: br, gzip" $ARGUMENTS \
  | grep -iE "content-encoding|content-length|vary"
```

No `Content-Encoding` in that last response means compression is **not** in
order, however correct `nuxt.config.ts` looks — the proxy in front is stripping
it. Say so rather than passing the item.

## 4. Report against the definition of done

Report each item as met, not met, or not checked — never infer one from the
config file:

- [ ] Lighthouse **mobile performance ≥ 85** against the real deploy, not
      localhost (localhost has no realistic TTFB and flatters the score). You
      cannot run Lighthouse here — tell the user to run it and report back.
- [ ] All images served as WebP, no srcset candidate wider than its source.
- [ ] Compression, cache headers, security headers confirmed with `curl`.
- [ ] `pnpm verify:perf <deploy>` passes.
- [ ] `pnpm lint` and `pnpm typecheck` clean.

One expected failure: Lighthouse flags `/images/**` under "Serve static assets
with an efficient cache policy" because it wants a year and this project sets a
month. **That flag is correct to ignore** — see `.claude/rules/nuxt-config.md`
for why raising it would break photo replacement.
