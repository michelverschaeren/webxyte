#!/usr/bin/env node
/**
 * Post-build verification for a running server.
 *
 * The gap this closes: nuxt.config.ts can be perfectly correct while the thing
 * on the wire is not. A proxy strips compression, a CDN overwrites cache
 * headers, someone writes sizes="100vw" and every srcset silently collapses to
 * a 1px image. Config is a claim; this script is the evidence.
 *
 * Usage:
 *   node scripts/verify-perf.mjs [url] [--output-dir <dir>] [--json]
 *   pnpm verify:perf                      # against http://localhost:3000
 *   pnpm verify:perf https://example.com  # against the real deploy
 *   VERCEL_AUTOMATION_BYPASS_SECRET=… pnpm verify:perf https://<preview>.vercel.app
 *
 * Fails (exit 1) on:
 *   1. a response without Content-Encoding under `Accept-Encoding: br, gzip`
 *   2. a srcset candidate of ` 1w` / ` 2w` (the @nuxt/image `sizes` trap)
 *   3. an image not served as image/webp (or image/avif from Vercel)
 *   4. an /images/, /_ipx/ or /_vercel/image response without cache-control
 *   5. a missing security header
 *   6. a generated image candidate wider than its source file (upscaling)
 *
 * Locally (`pnpm build && pnpm preview`) images come from IPX under /_ipx/.
 * On Vercel @nuxt/image switches to its vercel provider and they come from
 * /_vercel/image?url=…&w=…; both URL shapes are understood here.
 */

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib'

// Mirrors `securityHeaders` in nuxt.config.ts. Strict-Transport-Security is
// intentionally not required: it is only correct once HTTPS is guaranteed for
// the domain and all its subdomains.
const REQUIRED_SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'SAMEORIGIN',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()'
}

// Formats that legitimately are not WebP.
const NON_WEBP_EXTENSIONS = ['.svg', '.ico', '.gif']

// Vercel negotiates the format from the Accept header and may answer with
// AVIF, which is smaller still. Locally IPX only produces what `format` asks.
const MODERN_IMAGE_TYPES = ['image/webp', 'image/avif']

// Nitro's compressPublicAssets skips anything under 1 KB (compressing it costs
// more bytes than it saves), plus .map files and non-compressible mime types.
// Mirroring that threshold here keeps the check honest instead of noisy.
const COMPRESSION_MIN_BYTES = 1024

const results = { pass: [], fail: [], warn: [], info: [] }

function pass(check, detail) {
  results.pass.push({ check, detail })
}
function fail(check, detail) {
  results.fail.push({ check, detail })
}
function warn(check, detail) {
  results.warn.push({ check, detail })
}
function info(detail) {
  results.info.push({ detail })
}

function parseArgs(argv) {
  const args = { url: 'http://localhost:3000', outputDir: '.output/public', json: false }
  const positional = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--output-dir') args.outputDir = argv[++i]
    else if (arg === '--json') args.json = true
    else positional.push(arg)
  }

  if (positional[0]) args.url = positional[0]
  args.url = args.url.replace(/\/$/, '')
  return args
}

// Vercel preview deploys sit behind Vercel Authentication by default, so every
// request would come back 401. The project's "Protection Bypass for
// Automation" secret lets this script through without turning protection off.
const VERCEL_BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

function fetchRaw(url, { method = 'GET', headers = {} } = {}) {
  if (VERCEL_BYPASS) headers = { ...headers, 'x-vercel-protection-bypass': VERCEL_BYPASS }
  return new Promise((resolve, reject) => {
    const target = new URL(url)
    const send = target.protocol === 'https:' ? httpsRequest : httpRequest
    const req = send(target, { method, headers, timeout: 20000 }, (res) => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve({
        url,
        status: res.statusCode,
        headers: res.headers,
        raw: Buffer.concat(chunks)
      }))
    })
    req.on('timeout', () => req.destroy(new Error('request timed out')))
    req.on('error', reject)
    req.end()
  })
}

function decode(res) {
  const encoding = res.headers['content-encoding']
  try {
    if (encoding === 'br') return brotliDecompressSync(res.raw).toString('utf8')
    if (encoding === 'gzip') return gunzipSync(res.raw).toString('utf8')
    if (encoding === 'deflate') return inflateSync(res.raw).toString('utf8')
  } catch {
    return ''
  }
  return res.raw.toString('utf8')
}

/** Routes to test: every prerendered HTML file, so nothing is checked by luck. */
async function discoverRoutes(outputDir) {
  if (!existsSync(outputDir)) {
    warn('routes', `${outputDir} not found — only "/" is checked. Run \`pnpm build\` first for full coverage.`)
    return ['/']
  }

  const entries = await readdir(outputDir, { recursive: true, withFileTypes: true })
  const routes = []

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue
    const relative = path.relative(outputDir, path.join(entry.parentPath ?? entry.path, entry.name))
    const posix = relative.split(path.sep).join('/')
    if (posix === '200.html' || posix === '404.html') continue
    routes.push(posix === 'index.html' ? '/' : `/${posix.replace(/(\/)?index\.html$/, '').replace(/\.html$/, '')}`)
  }

  return routes.length ? [...new Set(routes)] : ['/']
}

// IPX URLs carry their modifiers as `f_webp&q_70&s_640x360`, which the
// serializer escapes to `&amp;`. Requesting the escaped form 404s.
function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i'))
    || tag.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`, 'i'))
  return match ? decodeEntities(match[1]) : null
}

function srcsetUrls(value) {
  return value
    .split(',')
    .map(candidate => candidate.trim().split(/\s+/)[0])
    .filter(Boolean)
}

/** All <img>/<source>/preload markup that produces an image request. */
function collectImageMarkup(html) {
  const tags = html.match(/<(?:img|source)\b[^>]*>/gi) ?? []
  const preloads = (html.match(/<link\b[^>]*>/gi) ?? [])
    .filter(tag => /rel\s*=\s*["']?preload/i.test(tag) && /as\s*=\s*["']?image/i.test(tag))

  const urls = new Set()
  const srcsets = []

  for (const tag of [...tags, ...preloads]) {
    const srcset = attr(tag, 'srcset') || attr(tag, 'imagesrcset')
    const src = attr(tag, 'src') || attr(tag, 'href')
    if (srcset) {
      srcsets.push(srcset)
      srcsetUrls(srcset).forEach(url => urls.add(url))
    }
    if (src) urls.add(src)
  }

  return { urls: [...urls], srcsets }
}

/** Check 2: the @nuxt/image `sizes` trap. */
function checkSrcsets(label, srcsets) {
  for (const srcset of srcsets) {
    const junk = srcset.match(/\s(1|2)w(?=,|$)/g)
    if (junk) {
      fail('sizes-trap', `${label}: srcset contains ${junk.join('/').trim()} candidates — a \`sizes\` token is missing its breakpoint prefix (write "xs:100vw", not "100vw"). Offending srcset: ${srcset.slice(0, 160)}…`)
      return false
    }
  }
  return true
}

/** Source path (without leading slash) and requested width of a generated image URL. */
function generatedImage(url) {
  const ipx = url.match(/^\/_ipx\/([^/]+)\/(.+)$/)
  if (ipx) {
    const [, modifiers, sourcePath] = ipx
    const width = Number(modifiers.match(/(?:^|&)s_(\d+)x/)?.[1] ?? modifiers.match(/(?:^|&)w_(\d+)/)?.[1])
    return { sourcePath, width }
  }
  if (url.startsWith('/_vercel/image?')) {
    const params = new URLSearchParams(url.slice(url.indexOf('?') + 1))
    const source = params.get('url') ?? ''
    if (!source.startsWith('/')) return null
    return { sourcePath: source.slice(1), width: Number(params.get('w')) }
  }
  return null
}

/** Check 6: never generate a candidate wider than the source file. */
async function checkNoUpscaling(imageUrls) {
  const widths = new Map()

  for (const url of imageUrls) {
    const image = generatedImage(url)
    if (!image?.width) continue
    const { sourcePath, width } = image
    const current = widths.get(sourcePath) ?? 0
    if (width > current) widths.set(sourcePath, width)
  }

  if (!widths.size) return

  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    warn('upscaling', 'sharp not available — skipped the "no candidate wider than the source" check.')
    return
  }

  for (const [sourcePath, width] of widths) {
    const file = path.join('public', decodeURIComponent(sourcePath))
    if (!existsSync(file)) {
      info(`upscaling: source ${sourcePath} is not a local public/ file — skipped.`)
      continue
    }
    const { width: sourceWidth } = await sharp(await readFile(file)).metadata()
    if (width > sourceWidth) {
      fail('upscaling', `/${sourcePath} is ${sourceWidth}px wide but a ${width}px candidate is requested — a wasted variant at best, an upscaled one (bigger file, no extra detail) at worst. Lower the top breakpoint, set densities="1", or supply a larger source.`)
    } else {
      pass('upscaling', `/${sourcePath}: largest candidate ${width}px <= source ${sourceWidth}px`)
    }
  }
}

async function checkDocument(baseUrl, route) {
  const url = `${baseUrl}${route}`
  const res = await fetchRaw(url, { headers: { 'accept-encoding': 'br, gzip', 'accept': 'text/html' } })

  if (res.status !== 200) {
    fail('document', `${route} responded ${res.status}`)
    return null
  }

  // Check 1 — compression.
  const encoding = res.headers['content-encoding']
  if (!encoding) {
    fail('compression', `${route} has no Content-Encoding under \`Accept-Encoding: br, gzip\`. Locally compressPublicAssets writes .gz/.br at build time; on Vercel the CDN compresses — either way, something is decompressing or stripping. Body: ${res.raw.length} B.`)
  } else {
    pass('compression', `${route} → ${encoding}, ${res.raw.length} B on the wire`)
    if (!res.headers.vary || !/accept-encoding/i.test(res.headers.vary)) {
      warn('compression', `${route} is compressed but has no \`Vary: Accept-Encoding\` — a shared cache may hand a compressed body to a client that cannot read it.`)
    }
  }

  // Check 5 — security headers.
  for (const [header, expected] of Object.entries(REQUIRED_SECURITY_HEADERS)) {
    const actual = res.headers[header]
    if (!actual) {
      fail('security-headers', `${route} is missing \`${header}\`.`)
    } else if (String(actual).toLowerCase() !== expected.toLowerCase()) {
      warn('security-headers', `${route} has \`${header}: ${actual}\` (expected \`${expected}\`) — intentional?`)
    } else {
      pass('security-headers', `${route} → ${header}: ${actual}`)
    }
  }

  if (new URL(url).protocol === 'https:' && !res.headers['strict-transport-security']) {
    warn('security-headers', 'HTTPS deploy without Strict-Transport-Security. Enable it once HTTPS is guaranteed for the domain and every subdomain.')
  }

  const html = decode(res)
  if (!html) {
    fail('document', `${route}: could not decode the response body (content-encoding: ${encoding}).`)
    return null
  }
  return html
}

async function checkAsset(baseUrl, url) {
  const res = await fetchRaw(`${baseUrl}${url}`, { headers: { 'accept-encoding': 'br, gzip' } })
  if (res.status !== 200) {
    fail('compression', `${url} responded ${res.status}`)
    return
  }
  if (!res.headers['content-encoding']) {
    if (res.raw.length < COMPRESSION_MIN_BYTES) {
      info(`compression: ${url} is ${res.raw.length} B — under Nitro's 1 KB threshold, not worth compressing.`)
    } else {
      fail('compression', `${url} has no Content-Encoding under \`Accept-Encoding: br, gzip\` (${res.raw.length} B raw).`)
    }
  } else {
    pass('compression', `${url} → ${res.headers['content-encoding']}, ${res.raw.length} B`)
  }
  if (/^\/_nuxt\//.test(url)) {
    const cacheControl = res.headers['cache-control'] ?? ''
    if (!/immutable/.test(cacheControl)) {
      warn('caching', `${url} → \`cache-control: ${cacheControl || '(none)'}\` — hashed build output should be immutable.`)
    } else {
      info(`caching: ${url} → ${cacheControl}`)
    }
  }
}

async function checkImage(baseUrl, url) {
  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:')) {
    info(`image: ${url.slice(0, 80)} is external — skipped.`)
    return
  }

  const res = await fetchRaw(`${baseUrl}${url}`, { headers: { accept: 'image/webp,image/avif,image/*,*/*' } })
  if (res.status !== 200) {
    fail('image', `${url} responded ${res.status}`)
    return
  }

  const contentType = String(res.headers['content-type'] ?? '')
  const extension = path.extname(url.split('?')[0]).toLowerCase()

  // Check 3 — WebP delivery.
  if (NON_WEBP_EXTENSIONS.includes(extension)) {
    info(`image: ${url} is ${contentType} (${extension} is exempt from the WebP rule).`)
  } else if (!MODERN_IMAGE_TYPES.includes(contentType)) {
    fail('webp', `${url} is served as \`${contentType}\`, not image/webp. Add format="webp" to the <NuxtImg> (IPX keeps the source format otherwise), or convert the source file.`)
  } else {
    pass('webp', `${url} → ${contentType}, ${(res.raw.length / 1024).toFixed(1)} kB`)
  }

  // Check 4 — cache headers on generated and static images.
  if (/^\/(_ipx\/|images\/|_vercel\/image\?)/.test(url)) {
    const cacheControl = res.headers['cache-control']
    if (!cacheControl) {
      fail('caching', `${url} has no cache-control — every repeat visit re-downloads it. Check the \`/_ipx/**\` and \`/images/**\` routeRules (Vercel manages \`/_vercel/image\` itself), and whether a proxy strips them.`)
    } else if (!/max-age=([1-9]\d{4,})/.test(cacheControl)) {
      warn('caching', `${url} → \`cache-control: ${cacheControl}\` — shorter than the intended month (max-age=2592000).`)
    } else {
      pass('caching', `${url} → ${cacheControl}`)
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  console.log(`\nVerifying ${args.url}\n${'='.repeat(60)}`)

  try {
    await fetchRaw(args.url + '/', { method: 'HEAD' })
  } catch (error) {
    console.error(`\nCannot reach ${args.url} — is the server running? (${error.message})`)
    console.error('Start it with `pnpm build && pnpm preview`, or pass the deployed URL.\n')
    process.exit(2)
  }

  const routes = await discoverRoutes(args.outputDir)
  info(`routes checked: ${routes.join(', ')}`)

  const imageUrls = new Set()
  const assetUrls = new Set()

  for (const route of routes) {
    const html = await checkDocument(args.url, route)
    if (!html) continue

    const { urls, srcsets } = collectImageMarkup(html)
    checkSrcsets(route, srcsets)
    urls.forEach(url => imageUrls.add(url))
    if (!srcsets.length && urls.length) {
      info(`sizes-trap: ${route} has images but no srcset — fixed-size or single-density images only.`)
    }

    for (const asset of html.match(/\/_nuxt\/[^"']+\.(?:js|css)/g) ?? []) assetUrls.add(asset)
  }

  // Prerendered HTML on disk, so routes the crawler produced but we did not
  // fetch are covered too.
  if (existsSync(args.outputDir)) {
    const entries = await readdir(args.outputDir, { recursive: true, withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.html')) continue
      const file = path.join(entry.parentPath ?? entry.path, entry.name)
      const { srcsets } = collectImageMarkup(await readFile(file, 'utf8'))
      checkSrcsets(path.relative(args.outputDir, file), srcsets)
    }
  }

  for (const asset of [...assetUrls].slice(0, 4)) await checkAsset(args.url, asset)
  for (const url of imageUrls) await checkImage(args.url, url)
  await checkNoUpscaling([...imageUrls])

  if (args.json) {
    console.log(JSON.stringify(results, null, 2))
  } else {
    for (const { detail } of results.info) console.log(`  ·  ${detail}`)
    for (const { check, detail } of results.pass) console.log(`  ✓  [${check}] ${detail}`)
    for (const { check, detail } of results.warn) console.log(`  !  [${check}] ${detail}`)
    for (const { check, detail } of results.fail) console.log(`  ✗  [${check}] ${detail}`)
  }

  console.log(`${'='.repeat(60)}`)
  console.log(`${results.pass.length} passed, ${results.warn.length} warnings, ${results.fail.length} failed\n`)

  if (results.fail.length) {
    console.error('FAILED — the build does not meet the performance/security baseline.\n')
    process.exit(1)
  }
  console.log('OK — compression, image pipeline, caching and security headers verified.\n')
}

main().catch((error) => {
  console.error(error)
  process.exit(2)
})
