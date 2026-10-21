#!/usr/bin/env node
/**
 * Start de dev-server van één of meer sites.
 *
 *   pnpm dev                     menu: kies een of meer sites
 *   pnpm dev vermeir             één site (een deel van de mapnaam volstaat)
 *   pnpm dev vermeir bakkerij    meerdere tegelijk, elk op zijn eigen poort
 *   pnpm dev --list              enkel de lijst met poorten tonen
 *
 * Elke site heeft een vaste poort in het "dev"-script van haar package.json
 * (`nuxt dev --port 3001`). Vaste poorten = vaste localhost-URL's, zodat
 * BETTER_AUTH_URL in de .env van de site blijft kloppen.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GROUPS = ['sites', 'templates']

function listApps() {
  const apps = []
  for (const group of GROUPS) {
    const dir = path.join(root, group)
    if (!existsSync(dir)) continue
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const pkgPath = path.join(dir, entry.name, 'package.json')
      if (!entry.isDirectory() || !existsSync(pkgPath)) continue
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
      if (!pkg.scripts?.dev) continue
      const port = Number(/--port[ =](\d+)/.exec(pkg.scripts.dev)?.[1]) || null
      apps.push({ group, folder: entry.name, name: pkg.name, port })
    }
  }
  return apps
}

function printList(apps) {
  apps.forEach((app, i) => {
    const port = app.port ? `:${app.port}` : '(geen vaste poort)'
    const tag = app.group === 'templates' ? '  [template]' : ''
    console.log(`  ${String(i + 1).padStart(2)}. ${app.folder.padEnd(28)} ${port}${tag}`)
  })
  const seen = new Map()
  for (const app of apps) {
    if (!app.port) continue
    if (seen.has(app.port)) {
      console.warn(`\n  ! ${app.folder} en ${seen.get(app.port)} gebruiken allebei poort ${app.port}.`)
    }
    seen.set(app.port, app.folder)
  }
}

function match(apps, query) {
  const q = query.toLowerCase()
  const exact = apps.filter(a => a.folder === q || a.name === q)
  if (exact.length) return exact
  return apps.filter(a => a.folder.includes(q) || a.name.toLowerCase().includes(q))
}

async function choose(apps) {
  console.log('\nWelke site(s) starten?\n')
  printList(apps)
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question('\nNummer(s), gescheiden door een spatie: ')
  rl.close()
  return answer.split(/[\s,]+/).filter(Boolean).map((n) => {
    const app = apps[Number(n) - 1]
    if (!app) throw new Error(`Geen site met nummer ${n}.`)
    return app
  })
}

async function main() {
  const apps = listApps()
  const args = process.argv.slice(2)

  if (args.includes('--list')) {
    printList(apps)
    return
  }

  let selected = []
  if (args.length === 0) {
    if (!process.stdin.isTTY) {
      console.error('Geef een site mee, bv. `pnpm dev vermeir`. Beschikbaar:')
      printList(apps)
      process.exit(1)
    }
    selected = await choose(apps)
  } else {
    for (const query of args) {
      const found = match(apps, query)
      if (found.length !== 1) {
        console.error(found.length
          ? `"${query}" past op meerdere sites: ${found.map(a => a.folder).join(', ')}. Wees specifieker.`
          : `Geen site gevonden voor "${query}". Beschikbaar:`)
        if (!found.length) printList(apps)
        process.exit(1)
      }
      selected.push(found[0])
    }
  }
  if (!selected.length) return

  for (const app of selected) {
    const url = app.port ? `http://localhost:${app.port}` : '(poort: zie de output)'
    console.log(`→ ${app.folder}  ${url}`)
  }
  console.log()

  const filters = selected.map(a => `--filter=${a.name}`)
  // Eén site: gewoon pnpm (nette, ongekleurde Nuxt-output). Meerdere:
  // Turborepo draait ze naast elkaar met de sitenaam voor elke logregel.
  const command = selected.length === 1
    ? ['pnpm', [`--filter=${selected[0].name}`, 'dev']]
    : ['pnpm', ['turbo', 'run', 'dev', ...filters, '--ui=stream']]

  const child = spawn(command[0], command[1], {
    cwd: root,
    stdio: 'inherit',
    // pnpm is een .cmd-bestand op Windows.
    shell: process.platform === 'win32'
  })
  child.on('exit', code => process.exit(code ?? 0))
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
