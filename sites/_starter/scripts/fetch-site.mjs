#!/usr/bin/env node
/**
 * Fetches a page from an existing site and saves everything needed to rebuild it:
 * cleaned text as Markdown, metadata, and every image (original + optimized webp).
 *
 * Usage:
 *   pnpm fetch:site <url> [--render] [--out <dir>] [--max-images <n>]
 *
 *   --render        Render the page in a real browser first (Playwright/Chromium).
 *                    Use this for JS-heavy sites and to also capture a full-page screenshot.
 *                    Requires a one-time `pnpm playwright:install`.
 *   --out <dir>      Output root (default: content-import)
 *   --max-images <n> Max number of images to download (default: 40)
 *
 * Output: <out>/<slug>/{content.md, meta.json, screenshot.png?, images/original, images/optimized}
 *
 * Only run this against sites you or your client own, or otherwise have permission
 * to reuse content from — this is a working-reference tool, not a publishing pipeline.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import * as cheerio from 'cheerio'
import sharp from 'sharp'
import TurndownService from 'turndown'

const REMOVE_SELECTORS = [
  'script', 'style', 'noscript', 'svg', 'iframe', 'form', 'button',
  'nav', 'footer', 'header', '[aria-hidden="true"]'
]

const IMAGE_EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif'
}

function parseArgs(argv) {
  const args = { render: false, out: 'content-import', maxImages: 40 }
  const positional = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--render') args.render = true
    else if (arg === '--out') args.out = argv[++i]
    else if (arg === '--max-images') args.maxImages = Number(argv[++i])
    else positional.push(arg)
  }

  if (!positional[0]) {
    console.error('Usage: pnpm fetch:site <url> [--render] [--out <dir>] [--max-images <n>]')
    process.exit(1)
  }

  args.url = positional[0]
  return args
}

function slugify(url) {
  const { hostname, pathname } = new URL(url)
  const trimmedPath = pathname.replace(/\/$/, '') || '/index'
  return `${hostname}${trimmedPath}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

async function fetchWithBrowser(url) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 })
    const html = await page.content()
    const screenshot = await page.screenshot({ fullPage: true })
    const finalUrl = page.url()
    return { html, screenshot, finalUrl }
  } finally {
    await browser.close()
  }
}

async function fetchWithHttp(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; site-content-fetcher/1.0)' }
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`)
  const html = await res.text()
  return { html, screenshot: null, finalUrl: res.url }
}

function extractMeta($, sourceUrl) {
  const headings = []
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, ' ')
    if (text) headings.push({ tag: el.tagName.toLowerCase(), text })
  })

  return {
    sourceUrl,
    title: $('title').first().text().trim() || $('meta[property="og:title"]').attr('content') || null,
    description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || null,
    canonical: $('link[rel="canonical"]').attr('href') || null,
    ogImage: $('meta[property="og:image"]').attr('content') || null,
    lang: $('html').attr('lang') || null,
    headings
  }
}

function extractContentMarkdown($) {
  const $content = $('main').length ? $('main') : $('article').length ? $('article') : $('body')
  const $clone = $content.clone()
  $clone.find(REMOVE_SELECTORS.join(', ')).remove()

  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
  return turndown.turndown($clone.html() || '').replace(/\n{3,}/g, '\n\n').trim()
}

function extractImageUrls($, baseUrl, max) {
  const urls = new Set()
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src')
    if (!src || src.startsWith('data:')) return
    try {
      urls.add(new URL(src, baseUrl).href)
    } catch {
      // ignore unresolvable src values
    }
  })
  return [...urls].slice(0, max)
}

async function pMap(items, mapper, concurrency = 6) {
  const results = new Array(items.length)
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await mapper(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}

async function downloadImage(url, index, dirs) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const buffer = Buffer.from(await res.arrayBuffer())

  const pathnameExt = path.extname(new URL(url).pathname).toLowerCase()
  const mimeExt = IMAGE_EXT_BY_MIME[res.headers.get('content-type')?.split(';')[0] || '']
  const ext = /\.(jpe?g|png|webp|gif|svg|avif)$/.test(pathnameExt) ? pathnameExt : (mimeExt || '.jpg')
  const base = `${String(index).padStart(2, '0')}-${path.basename(new URL(url).pathname, pathnameExt).replace(/[^a-z0-9-]+/gi, '-').slice(0, 60) || 'image'}`

  const originalPath = path.join(dirs.original, `${base}${ext}`)
  await writeFile(originalPath, buffer)

  if (ext === '.svg') {
    await writeFile(path.join(dirs.optimized, `${base}.svg`), buffer)
    return { url, original: originalPath, optimized: path.join(dirs.optimized, `${base}.svg`) }
  }

  const optimizedPath = path.join(dirs.optimized, `${base}.webp`)
  await sharp(buffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(optimizedPath)

  return { url, original: originalPath, optimized: optimizedPath }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const slug = slugify(args.url)
  const outDir = path.join(args.out, slug)
  const dirs = {
    root: outDir,
    original: path.join(outDir, 'images', 'original'),
    optimized: path.join(outDir, 'images', 'optimized')
  }

  console.log(`Fetching ${args.url}${args.render ? ' (rendered)' : ''}...`)
  const { html, screenshot, finalUrl } = args.render
    ? await fetchWithBrowser(args.url)
    : await fetchWithHttp(args.url)

  const $ = cheerio.load(html)
  const meta = extractMeta($, finalUrl)
  const markdown = extractContentMarkdown($)
  const imageUrls = extractImageUrls($, finalUrl, args.maxImages)

  await mkdir(dirs.original, { recursive: true })
  await mkdir(dirs.optimized, { recursive: true })

  await writeFile(
    path.join(outDir, 'content.md'),
    `# ${meta.title || args.url}\n\nSource: ${args.url}\nFetched: ${new Date().toISOString()}\n\n---\n\n${markdown}\n`
  )

  console.log(`Downloading ${imageUrls.length} image(s)...`)
  const results = await pMap(imageUrls, async (url, i) => {
    try {
      return await downloadImage(url, i, dirs)
    } catch (err) {
      console.warn(`  skipped ${url}: ${err.message}`)
      return null
    }
  })
  const downloaded = results.filter(Boolean)

  if (screenshot) {
    await writeFile(path.join(outDir, 'screenshot.png'), screenshot)
  }

  await writeFile(
    path.join(outDir, 'meta.json'),
    JSON.stringify({ ...meta, rendered: args.render, fetchedAt: new Date().toISOString(), imageCount: downloaded.length }, null, 2)
  )

  console.log(`\nSaved to ${outDir}`)
  console.log(`  content.md      extracted text as Markdown`)
  console.log(`  meta.json       title, description, headings outline`)
  console.log(`  images/original + images/optimized (${downloaded.length}/${imageUrls.length} downloaded)`)
  if (screenshot) console.log(`  screenshot.png  full-page reference screenshot`)
  console.log(`\nReminder: only reuse this content if you/your client own it or have permission.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
