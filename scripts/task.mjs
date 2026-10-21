#!/usr/bin/env node
/**
 * Een taak = een branch + een eigen map (git worktree), zodat je aan meerdere
 * sites tegelijk kan werken, elk in een eigen VS Code-venster / Claude-sessie.
 *
 *   pnpm task vermeir promoties-filter   nieuwe taak → branch vleeswaren-vermeir/promoties-filter
 *                                        in map ../webxyte-vleeswaren-vermeir-promoties-filter
 *   pnpm task base security-headers      taak aan een layer (packages/base)
 *   pnpm task list                       alle open taken
 *   pnpm task done promoties-filter
 *                                        map en lokale branch opruimen (na de merge)
 *
 * Het eerste woord moet passen bij een map in sites/ of packages/ (een deel van
 * de naam volstaat), of "tooling" zijn (scripts, config in de root).
 * Nieuwe taken vertrekken altijd van de laatste origin/main.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

const isWin = process.platform === 'win32'

function git(args, opts = {}) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim()
}

function run(cmd, args, cwd) {
  const res = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: isWin })
  return res.status === 0
}

function fail(message) {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

// De hoofdmap (de "echte" clone), ook als je dit vanuit een worktree draait.
const commonDir = path.resolve(git(['rev-parse', '--git-common-dir']))
const mainRoot = path.dirname(commonDir)
const parentDir = path.dirname(mainRoot)
const repoName = path.basename(mainRoot)

function subdirs(dir) {
  const full = path.join(mainRoot, dir)
  return existsSync(full)
    ? readdirSync(full, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name)
    : []
}

function worktrees() {
  const out = git(['worktree', 'list', '--porcelain'])
  return out.split('\n\n').filter(Boolean).map((block) => {
    const wt = {}
    for (const line of block.split('\n')) {
      const [key, ...rest] = line.split(' ')
      wt[key] = rest.join(' ')
    }
    return { path: wt.worktree, branch: wt.branch?.replace('refs/heads/', '') ?? '(geen branch)' }
  })
}

function slug(value) {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── pnpm task list ─────────────────────────────────────────────────────────
function list() {
  const tasks = worktrees().filter(w => path.resolve(w.path) !== mainRoot)
  if (!tasks.length) {
    console.log('\nGeen open taken. Start er een met: pnpm task <site> <taak>\n')
    return
  }
  console.log('\nOpen taken:\n')
  for (const t of tasks) {
    const dirty = git(['status', '--porcelain'], { cwd: t.path }) ? '  (niet-gecommitte wijzigingen)' : ''
    console.log(`  ${t.branch.padEnd(40)} ${t.path}${dirty}`)
  }
  console.log()
}

// ── pnpm task <site|layer> <taak> ──────────────────────────────────────────
function create(scopeArg, ...taskWords) {
  if (!scopeArg || !taskWords.length) {
    fail('Gebruik: pnpm task <site of layer> <taak>, bv. pnpm task vermeir promoties-filter')
  }

  const query = slug(scopeArg)
  const sites = subdirs('sites')
  const layers = subdirs('packages')
  let target
  let scope = query
  if (query === 'tooling') {
    target = 'de root (scripts, config)'
  } else {
    const hits = [
      ...sites.filter(s => s.includes(query)).map(s => `sites/${s}`),
      ...layers.filter(l => l.includes(query)).map(l => `packages/${l}`)
    ]
    if (hits.length === 0) {
      fail(`Geen site of layer gevonden voor "${scopeArg}".\n  Sites: ${sites.join(', ')}\n  Layers: ${layers.join(', ')}\n  Of: tooling`)
    }
    if (hits.length > 1) fail(`"${scopeArg}" past op meerdere: ${hits.join(', ')}. Wees specifieker.`)
    target = hits[0]
    // De volledige mapnaam als prefix: altijd dezelfde branchnaam, ook als je
    // de naam afkort (pnpm task verm … → vleeswaren-vermeir/…).
    scope = path.basename(target)
  }

  const task = slug(taskWords.join(' '))
  const branch = `${scope}/${task}`
  const dir = path.join(parentDir, `${repoName}-${scope}-${task}`)

  if (existsSync(dir)) fail(`De map ${dir} bestaat al. Open die, of kies een andere taaknaam.`)
  try {
    git(['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`])
    fail(`Branch ${branch} bestaat al. Zie: pnpm task list`)
  } catch {
    // Bestaat niet: goed.
  }

  console.log(`\n→ Taak ${branch} voor ${target}`)
  console.log('→ Laatste versie van main ophalen…')
  git(['fetch', '--quiet', 'origin', 'main'], { cwd: mainRoot })

  console.log(`→ Map aanmaken: ${dir}`)
  git(['worktree', 'add', '-b', branch, dir, 'origin/main'], { cwd: mainRoot })
  // Geen tracking van origin/main: de eerste push maakt origin/<branch>.
  git(['branch', '--unset-upstream', branch], { cwd: mainRoot })

  // .env-bestanden staan niet in git: kopieer ze uit de hoofdmap.
  let copied = 0
  for (const group of ['sites', 'templates']) {
    for (const site of subdirs(group)) {
      for (const file of ['.env', '.env.live', '.env.local']) {
        const from = path.join(mainRoot, group, site, file)
        const to = path.join(dir, group, site, file)
        if (existsSync(from) && existsSync(path.dirname(to))) {
          copyFileSync(from, to)
          copied++
        }
      }
    }
  }
  console.log(`→ ${copied} .env-bestand(en) gekopieerd`)

  console.log('→ pnpm install (snel: pakketten komen uit de gedeelde pnpm-opslag)…\n')
  if (!run('pnpm', ['install', '--prefer-offline'], dir)) {
    fail(`pnpm install mislukte. De map staat er wel: ${dir}`)
  }

  const opened = run('code', ['--new-window', dir], dir)
  console.log(`
✓ Klaar.

  Map:     ${dir}
  Branch:  ${branch}
  ${opened ? 'Geopend in een nieuw VS Code-venster.' : `Open de map in VS Code: code "${dir}"`}

  Werk en commit in dat venster. Eerste push: git push -u origin ${branch}
  Na de merge naar main opruimen (vanuit eender welke map):
    pnpm task done ${branch}
`)
}

// ── pnpm task done <branch> ────────────────────────────────────────────────
function done(name, ...flags) {
  const force = flags.includes('--force')
  if (!name) fail('Gebruik: pnpm task done <branch>, bv. pnpm task done vermeir/promoties-filter (zie pnpm task list)')

  const tasks = worktrees().filter(w => path.resolve(w.path) !== mainRoot)
  const t = tasks.find(w => w.branch === name) ?? tasks.find(w => w.branch.includes(name))
  if (!t) fail(`Geen open taak "${name}". Zie: pnpm task list`)

  if (path.resolve(process.cwd()).startsWith(path.resolve(t.path))) {
    fail(`Je staat zelf in die map. Ga eerst naar de hoofdmap:\n  cd "${mainRoot}"\n  pnpm task done ${t.branch}`)
  }
  if (git(['status', '--porcelain'], { cwd: t.path })) {
    fail(`${t.branch} heeft nog niet-gecommitte wijzigingen in ${t.path}. Commit of gooi ze weg, dan opnieuw.`)
  }

  git(['fetch', '--quiet', 'origin', 'main'], { cwd: mainRoot })
  const notMerged = git(['log', '--oneline', `origin/main..${t.branch}`], { cwd: mainRoot })
  if (notMerged && !force) {
    fail(`${t.branch} heeft commits die nog niet in main zitten:\n${notMerged.split('\n').map(l => `    ${l}`).join('\n')}\n\n  Eerst mergen (skill release). Echt weggooien? pnpm task done ${t.branch} --force`)
  }

  console.log(`\n→ Map verwijderen: ${t.path}`)
  git(['worktree', 'remove', ...(force ? ['--force'] : []), t.path], { cwd: mainRoot })
  // -D: hierboven al nagekeken dat alles in origin/main zit (of --force).
  git(['branch', '-D', t.branch], { cwd: mainRoot })
  console.log(`→ Lokale branch ${t.branch} verwijderd`)
  console.log(`\n✓ Opgeruimd. Remote branch nog weg? git push origin --delete ${t.branch}\n`)
}

const [cmd, ...rest] = process.argv.slice(2)
if (!cmd || cmd === 'help' || cmd === '--help') {
  console.log(`
  pnpm task <site|layer> <taak>   nieuwe taak in een eigen map, bv. pnpm task vermeir promoties-filter
  pnpm task list                  open taken
  pnpm task done <branch>         opruimen na de merge
`)
} else if (cmd === 'list') {
  list()
} else if (cmd === 'done') {
  done(...rest)
} else {
  create(cmd, ...rest)
}
