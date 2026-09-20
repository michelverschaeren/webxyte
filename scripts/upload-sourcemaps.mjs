// Uploads a Nuxt build's source maps to Panel, then deletes them so they are
// never served. Run it right after `nuxt build`, from the project root:
//
//   "build": "nuxt build && node scripts/upload-sourcemaps.mjs"
//
// This is the template Panel's Setup > Connect app step hands out — it lives in
// Panel's repo as a real file (not a string) so what is copied into a project
// is exactly what Panel's own test ran.
//
// Environment (build time, not runtime):
//   PANEL_URL         https://dashboard.xyte.be
//   PANEL_DEPLOY_KEY  the deploy key from Panel — a secret. Build environment
//                     only: never in client code, never in the running app.
//   PANEL_MAPS_DIR    optional. Browser bundle. Defaults to .output/public
//   PANEL_SERVER_MAPS_DIR  optional. Server (Nitro) bundle. Defaults to .output/server
//
// There is deliberately no release variable to set. PANEL_RELEASE is read only
// as a last-resort fallback for a build with no git checkout — see "Release".
//
// Two kinds of map are uploaded, named so Panel can find them from a stack
// trace: the browser bundle by the path a browser requests it under
// (`_nuxt/entry.3f9a1c.js.map`), the server bundle by its path from the project
// root (`.output/server/chunks/build/x.mjs.map`) — the tail of the absolute
// path Node reports in a server stack.
//
// Release. @sentry/nuxt writes the release it will report (the git commit)
// into every built bundle as `SENTRY_RELEASE={id:"…"}`. This script reads it
// back out of the bundle, so the release a map is uploaded under is by
// construction the one the running app reports — nothing to keep in sync, and
// no per-build value for a person to fill in. Only if the bundle carries none
// (a build with no git checkout) does it fall back to PANEL_RELEASE, then to
// `git rev-parse HEAD`, then to a timestamp — in which case stack traces are
// still mapped, but Panel cannot link an error to this release, and says so.
//
// Not configured is not an error: with neither PANEL_URL nor PANEL_DEPLOY_KEY
// set (a local build, a service Panel is not set up for yet) it warns loudly,
// uploads nothing and still DELETES the maps — they must never be served. Half
// configured (one of the two) or a refused upload exits non-zero, on purpose: a
// build that quietly ships without maps leaves every later stack trace
// minified, and nobody finds out until the first real bug.
import { execSync } from 'node:child_process'
import { readdir, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'

const MAX_REQUEST_BYTES = 20_000_000 // Panel refuses more than 25 MB per request
const MAX_FILES = 100 // Panel refuses more than 200 per request

const url = process.env.PANEL_URL?.replace(/\/+$/, '')
const key = process.env.PANEL_DEPLOY_KEY
const publicDir = process.env.PANEL_MAPS_DIR || '.output/public'
const serverDir = process.env.PANEL_SERVER_MAPS_DIR || '.output/server'

function fail(message) {
  console.error(`[panel-sourcemaps] ${message}`)
  process.exit(1)
}

// Forward slashes on every OS: the name is matched against a URL or a path in
// a stack trace, which Panel looks up by its tail.
async function collect(dir, prefix, { required }) {
  let entries
  try {
    entries = await readdir(dir, { recursive: true })
  } catch {
    if (required) fail(`Cannot read ${dir} — run this after the build, from the project root.`)
    return []
  }
  return entries
    .map((e) => e.split('\\').join('/'))
    // .output/server/node_modules holds third-party packages traced into the
    // build, with their own maps. Panel resolves the app's code, not theirs.
    .filter((e) => e.endsWith('.map') && !e.split('/').includes('node_modules'))
    .map((e) => ({ file: join(dir, e), name: `${prefix}${e}` }))
}

// The release @sentry/nuxt baked into the build: `SENTRY_RELEASE={id:"abc"}`,
// with backticks in minified browser output and double quotes in server output.
const INJECTED_RELEASE = /SENTRY_RELEASE=\{id:(["'`])([^"'`]+)\1\}/

async function releaseFromBundle() {
  for (const [dir, ext] of [
    [publicDir, '.js'],
    [serverDir, '.mjs'],
  ]) {
    let entries
    try {
      entries = await readdir(dir, { recursive: true })
    } catch {
      continue
    }
    for (const e of entries) {
      if (!e.endsWith(ext) || e.split(/[\\/]/).includes('node_modules')) continue
      const match = INJECTED_RELEASE.exec(await readFile(join(dir, e), 'utf8'))
      if (match) return match[2]
    }
  }
  return null
}

function releaseFromEnvOrGit() {
  if (process.env.PANEL_RELEASE) return process.env.PANEL_RELEASE
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null
  } catch {
    return null
  }
}

async function resolveRelease() {
  const injected = await releaseFromBundle()
  if (injected) return injected
  const fallback = releaseFromEnvOrGit()
  if (fallback) {
    console.warn(
      `[panel-sourcemaps] The build carries no release, so maps are uploaded as "${fallback}". Stack traces will be mapped, but errors from the running app report no release and cannot be linked to it.`,
    )
    return fallback
  }
  const stamp = `build-${new Date().toISOString().replace(/[:.]/g, '-')}`
  console.warn(
    `[panel-sourcemaps] No release anywhere (no git checkout in this build) — uploading as "${stamp}". Stack traces will be mapped, but errors cannot be linked to this release.`,
  )
  return stamp
}

const clientMaps = await collect(publicDir, '', { required: true })
// The server bundle is optional: a static or client-only site has none.
const serverMaps = await collect(serverDir, `${serverDir.replace(/^\.\//, '').replace(/\/+$/, '')}/`, { required: false })
const maps = [...clientMaps, ...serverMaps]

if (!url && !key) {
  for (const { file } of maps) await rm(file)
  console.warn(
    `[panel-sourcemaps] NOT CONFIGURED: PANEL_URL and PANEL_DEPLOY_KEY are not set, so nothing was uploaded and stack traces in Panel will stay minified. Removed ${maps.length} .map file(s) from the build output so they are not served.`,
  )
  process.exit(0)
}
if (!url) fail('PANEL_URL is not set (PANEL_DEPLOY_KEY is).')
if (!key) fail('PANEL_DEPLOY_KEY is not set (PANEL_URL is).')

if (!maps.length) {
  fail(`No .map files under ${publicDir}. Set  sourcemap: { client: 'hidden', server: 'hidden' }  in nuxt.config.ts so the build produces them.`)
}

const release = await resolveRelease()

async function send(batch) {
  const form = new FormData()
  form.append('release', release)
  for (const { name, data } of batch) form.append('files', new Blob([data]), name)
  const res = await fetch(`${url}/api/ingest/sourcemaps`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  })
  if (!res.ok) {
    let detail = ''
    try {
      detail = (await res.json()).statusMessage ?? ''
    } catch {
      // not JSON — the status code alone will have to do
    }
    fail(`Panel refused the upload (HTTP ${res.status}${detail ? `: ${detail}` : ''}).`)
  }
}

let batch = []
let batchBytes = 0
for (const { file, name } of maps) {
  const data = await readFile(file)
  if (batch.length && (batchBytes + data.length > MAX_REQUEST_BYTES || batch.length >= MAX_FILES)) {
    await send(batch)
    batch = []
    batchBytes = 0
  }
  batch.push({ name, data })
  batchBytes += data.length
}
await send(batch)

// Only after every batch succeeded — a failed upload must not also destroy the
// only copy of the maps.
for (const { file } of maps) await rm(file)

console.log(
  `[panel-sourcemaps] uploaded ${clientMaps.length} browser + ${serverMaps.length} server source map(s) for release ${release} and removed them from the build output`,
)
