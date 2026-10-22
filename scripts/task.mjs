#!/usr/bin/env node
/**
 * Een taak = een branch + een eigen map (git worktree), zodat je aan meerdere
 * sites tegelijk kan werken, elk in een eigen VS Code-venster / Claude-sessie.
 *
 *   pnpm task vermeir promoties-filter   nieuwe taak → branch vleeswaren-vermeir/promoties-filter
 *                                        in map ../webxyte-vleeswaren-vermeir-promoties-filter
 *   pnpm task base security-headers      taak aan een layer (packages/base)
 *   pnpm task bakkerij-x start --nieuw   nieuwe site sites/bakkerij-x uit templates/<template>
 *                                        (--template <naam> kiest een andere template)
 *   pnpm task list                       alle open taken
 *   pnpm task done promoties-filter
 *                                        map en lokale branch opruimen (na de merge)
 *
 * Het eerste woord moet passen bij een map in sites/ of packages/ (een deel van
 * de naam volstaat), of "tooling" zijn (scripts, config in de root).
 * Nieuwe taken vertrekken altijd van de laatste origin/main.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline/promises'

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
/** Vaste dev-poorten: de hoogste poort van de sites + 1 (start: package.json → webxyte.firstDevPort). */
function nextDevPort() {
  const rootPkg = JSON.parse(readFileSync(path.join(mainRoot, 'package.json'), 'utf8'))
  const first = rootPkg.webxyte?.firstDevPort ?? 3001
  const used = subdirs('sites').map((site) => {
    const pkgPath = path.join(mainRoot, 'sites', site, 'package.json')
    if (!existsSync(pkgPath)) return 0
    return Number(/--port[ =](\d+)/.exec(JSON.parse(readFileSync(pkgPath, 'utf8')).scripts?.dev ?? '')?.[1]) || 0
  })
  return Math.max(first - 1, ...used) + 1
}

/** Kopieert templates/<template> naar sites/<name> in de taakmap, met eigen naam en poort. */
function scaffoldSite(dir, name, template) {
  const from = path.join(dir, 'templates', template)
  if (!existsSync(from)) fail(`Template templates/${template} bestaat niet. Beschikbaar: ${subdirs('templates').join(', ')}`)
  const to = path.join(dir, 'sites', name)
  cpSync(from, to, {
    recursive: true,
    filter: src => !/[\\/](node_modules|\.nuxt|\.output|\.turbo|content-import)([\\/]|$)/.test(src)
  })
  const pkgPath = path.join(to, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const port = nextDevPort()
  pkg.name = name
  pkg.scripts.dev = `nuxt dev --port ${port}`
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
  for (const env of ['.env', '.env.live', '.env.local']) rmSync(path.join(to, env), { force: true })
  return port
}

function create(scopeArg, ...args) {
  const flags = args.filter(a => a.startsWith('--'))
  const taskWords = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] === '--template'))
  const isNew = flags.includes('--nieuw')
  const noOpen = flags.includes('--no-open')
  const template = args.includes('--template') ? args[args.indexOf('--template') + 1] ?? null : null
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
  } else if (isNew) {
    if (sites.includes(query)) fail(`sites/${query} bestaat al. Laat --nieuw weg om eraan te werken.`)
    const similar = sites.filter(s => s.includes(query) || query.includes(s))
    if (similar.length) fail(`"${query}" lijkt op een bestaande site: ${similar.join(', ')}. Bedoel je die? Laat dan --nieuw weg. Echt een nieuwe site? Kies een duidelijk andere naam.`)
    if (layers.includes(query) || query === 'tooling') fail(`"${query}" is gereserveerd. Kies een andere sitenaam.`)
    target = `sites/${query} (nieuw)`
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

  if (isNew) {
    const rootPkg = JSON.parse(readFileSync(path.join(mainRoot, 'package.json'), 'utf8'))
    const tpl = template ?? rootPkg.webxyte?.defaultTemplate ?? 'starter'
    const port = scaffoldSite(dir, scope, tpl)
    console.log(`→ Nieuwe site sites/${scope} uit templates/${tpl} (dev-poort ${port})`)
  }
  setupVscode(dir)
  console.log('→ VS Code-knoppen en -kleur voor deze taak ingesteld')

  console.log('→ pnpm install (snel: pakketten komen uit de gedeelde pnpm-opslag)…\n')
  if (!run('pnpm', ['install', '--prefer-offline'], dir)) {
    fail(`pnpm install mislukte. De map staat er wel: ${dir}`)
  }

  if (noOpen) {
    console.log(`\n✓ Taakmap klaar: ${dir}`)
    return dir
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

/**
 * "Squash and merge" of "Rebase and merge" op GitHub maakt nieuwe commits:
 * de commits van de branch staan dan niet letterlijk in main, de inhoud wel.
 * Dus: is elk bestand dat de branch wijzigde in origin/main identiek aan de
 * versie op de branch? Dan is het werk gemerged.
 */
function contentInMain(branch) {
  const base = git(['merge-base', 'origin/main', branch], { cwd: mainRoot })
  const files = git(['diff', '--name-only', base, branch], { cwd: mainRoot }).split('\n').filter(Boolean)
  if (!files.length) return true
  try {
    git(['diff', '--quiet', branch, 'origin/main', '--', ...files], { cwd: mainRoot })
    return true
  } catch {
    return false
  }
}

// ── pnpm task done <branch> ────────────────────────────────────────────────
async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(question)
  rl.close()
  return answer.trim()
}

async function done(name, ...flags) {
  const force = flags.includes('--force')
  if (!name) {
    const open = worktrees().filter(w => path.resolve(w.path) !== mainRoot)
    if (!open.length) fail('Geen open taken om af te ronden.')
    if (!process.stdin.isTTY) fail('Gebruik: pnpm task done <taak> (zie pnpm task list)')
    console.log('\nWelke taak afronden?\n')
    open.forEach((t, i) => console.log(`  ${i + 1}. ${t.branch}`))
    const pick = open[Number(await ask('\nNummer: ')) - 1]
    if (!pick) fail('Geen geldige keuze.')
    name = pick.branch
  }

  const tasks = worktrees().filter(w => path.resolve(w.path) !== mainRoot)
  const t = tasks.find(w => w.branch === name) ?? tasks.find(w => w.branch.includes(name))
  if (!t) fail(`Geen open taak "${name}". Zie: pnpm task list`)

  if (path.resolve(process.cwd()).startsWith(path.resolve(t.path))) {
    fail(`Je staat zelf in die map. Ga eerst naar de hoofdmap:\n  cd "${mainRoot}"\n  pnpm task done ${t.branch}`)
  }
  if (!force && git(['status', '--porcelain'], { cwd: t.path })) {
    fail(`${t.branch} heeft nog niet-gecommitte wijzigingen in ${t.path}. Commit of gooi ze weg, dan opnieuw.`)
  }

  git(['fetch', '--quiet', 'origin', 'main'], { cwd: mainRoot })
  const notMerged = git(['log', '--oneline', `origin/main..${t.branch}`], { cwd: mainRoot })
  if (notMerged && !force && !contentInMain(t.branch)) {
    fail(`${t.branch} heeft commits die nog niet in main zitten:\n${notMerged.split('\n').map(l => `    ${l}`).join('\n')}\n\n  Eerst mergen (skill release). Echt weggooien? pnpm task done ${t.branch} --force`)
  }

  console.log(`\n→ Map verwijderen: ${t.path}`)
  git(['worktree', 'remove', ...(force ? ['--force'] : []), t.path], { cwd: mainRoot })
  // -D: hierboven al nagekeken dat alles in origin/main zit (of --force).
  git(['branch', '-D', t.branch], { cwd: mainRoot })
  console.log(`→ Lokale branch ${t.branch} verwijderd`)

  // De branch op GitHub ook weg (als hij er nog is: de knop "Delete branch"
  // na een pull request doet hetzelfde). Niet bij --force: niet-gemerged werk
  // op GitHub laten staan.
  if (!force) {
    const onRemote = git(['ls-remote', '--heads', 'origin', t.branch], { cwd: mainRoot })
    if (onRemote) {
      git(['push', '--quiet', 'origin', '--delete', t.branch], { cwd: mainRoot })
      console.log(`→ Branch ${t.branch} op GitHub verwijderd`)
    }
  }
  git(['fetch', '--quiet', '--prune', 'origin'], { cwd: mainRoot })
  console.log('\n✓ Opgeruimd.\n')
}

// ── VS Code in een taakmap: eigen knoppen en kleur ─────────────────────────
/**
 * Schrijft in de taakmap een eigen .vscode/tasks.json (knoppen voor déze taak)
 * en zet een andere kleur op het venster. Beide bestanden krijgen
 * `skip-worktree`: git negeert de wijziging in deze map, ze komt nooit in een
 * commit, en de hoofdmap houdt haar eigen knoppen.
 */
function setupVscode(dir) {
  const branch = git(['branch', '--show-current'], { cwd: dir })
  const [prefix, ...rest] = branch.split('/')
  const task = rest.join('/') || branch
  const siteDir = path.join(dir, 'sites', prefix)
  const isSite = existsSync(path.join(siteDir, 'package.json'))
  const port = isSite
    ? /--port[ =](\d+)/.exec(JSON.parse(readFileSync(path.join(siteDir, 'package.json'), 'utf8')).scripts?.dev ?? '')?.[1]
    : null

  const button = (label, command, statusbar, extra = {}) => ({
    label,
    type: 'shell',
    command,
    problemMatcher: [],
    presentation: { panel: 'shared', clear: true, focus: true },
    options: { statusbar },
    ...extra
  })

  const tasks = [
    button(`Taak ${branch}`, 'pnpm task status',
      { label: `$(git-branch) ${task}`, tooltip: `Taakmap voor ${isSite ? `sites/${prefix}` : prefix}. Klik: wat is er veranderd?`, color: '#ffffff' }),
    isSite
      ? button(`Start ${prefix}`, `pnpm dev ${prefix}`,
          { label: `$(play) Start ${prefix}`, tooltip: port ? `http://localhost:${port}` : 'Start deze site', color: '#89d185' },
          { isBackground: true, presentation: { panel: 'dedicated', focus: true } })
      : button('Start site', 'pnpm dev',
          { label: '$(play) Start site', tooltip: 'Kies welke site(s) je start', color: '#89d185' },
          { isBackground: true, presentation: { panel: 'dedicated', focus: true, clear: true } }),
    button('Bijwerken', 'pnpm task update',
      { label: '$(sync) Bijwerken', tooltip: 'Laatste main in deze taak halen (bv. na een merge van een layer)', color: '#75beff' }),
    button('Push', 'pnpm task push',
      { label: '$(cloud-upload) Push', tooltip: 'Commit eerst (Source Control links). Dan: naar GitHub, Preview en link om te mergen', color: '#75beff' }),
    button('Check', isSite ? `pnpm turbo run lint typecheck --filter=./sites/${prefix}` : 'pnpm turbo run lint typecheck',
      { label: '$(check-all) Check', tooltip: isSite ? `Lint + typecheck van ${prefix}` : 'Lint + typecheck van alles' }),
    button('Naar hoofdmap', `code "${mainRoot}"`,
      { label: '$(home) Hoofdmap', tooltip: 'Open het venster van de hoofdmap (daar: Taak afronden na de merge)', color: '#cca700' }),
    button('Hulp', 'pnpm task help', { label: '$(question) Hulp', tooltip: 'Uitleg bij de knoppen' })
  ]

  const vscodeDir = path.join(dir, '.vscode')
  writeFileSync(path.join(vscodeDir, 'tasks.json'), `${JSON.stringify({
    // Gegenereerd door pnpm task (scripts/task.mjs) voor deze taakmap.
    // git negeert dit bestand hier (skip-worktree).
    version: '2.0.0',
    tasks
  }, null, 2)}\n`)

  // Andere kleur voor titel- en statusbalk: je ziet meteen dat dit een taakmap is.
  const settingsPath = path.join(vscodeDir, 'settings.json')
  const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, 'utf8')) : {}
  settings['workbench.colorCustomizations'] = {
    'statusBar.background': '#5b2c83',
    'statusBar.foreground': '#ffffff',
    'statusBarItem.hoverBackground': '#7a3fae',
    'titleBar.activeBackground': '#5b2c83',
    'titleBar.activeForeground': '#ffffff',
    'titleBar.inactiveBackground': '#3f1f5c',
    'titleBar.inactiveForeground': '#dddddd'
  }
  settings['window.title'] = `TAAK ${branch} — \${activeEditorShort}`
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`)

  git(['update-index', '--skip-worktree', '.vscode/tasks.json', '.vscode/settings.json'], { cwd: dir })
}

// ── pnpm task update ───────────────────────────────────────────────────────
/**
 * Haalt de laatste main binnen. In de hoofdmap: main bijwerken. In een
 * taakmap: origin/main in de taakbranch mergen (bv. na een layer-merge).
 * Daarna pnpm install als de lockfile veranderde.
 */
function update() {
  const top = path.resolve(git(['rev-parse', '--show-toplevel']))
  const branch = git(['branch', '--show-current'])
  const inTask = top !== mainRoot
  if (git(['status', '--porcelain'])) {
    fail('Er zijn nog niet-gecommitte wijzigingen. Commit ze eerst (Source Control links), dan opnieuw Bijwerken.')
  }
  const lockBefore = git(['rev-parse', 'HEAD:pnpm-lock.yaml'])
  const headBefore = git(['rev-parse', 'HEAD'])

  console.log('\n→ Laatste versie van main ophalen…')
  git(['fetch', '--quiet', 'origin', 'main'])

  if (!inTask) {
    if (branch !== 'main') fail(`De hoofdmap staat op ${branch} in plaats van main. Ga eerst terug naar main.`)
    try {
      git(['merge', '--ff-only', 'origin/main'])
    } catch {
      fail('main kan niet gewoon bijgewerkt worden (lokale commits op main?). Vraag het aan Claude.')
    }
  } else {
    // De gegenereerde knoppen even terugzetten, anders weigert git de merge
    // als main .vscode/ veranderde. Na de merge opnieuw genereren.
    const vscodeFiles = ['.vscode/tasks.json', '.vscode/settings.json']
    git(['update-index', '--no-skip-worktree', ...vscodeFiles])
    git(['checkout', '--', ...vscodeFiles])
    let ok = true
    try {
      git(['merge', '--no-edit', 'origin/main'])
    } catch {
      ok = false
    }
    if (!ok) {
      console.error(`
✗ main en je taak veranderden dezelfde regels (conflict).

  VS Code toont de conflicten in Source Control (links), met knoppen
  "Accept Current / Incoming / Both". Los ze op, commit, en klik opnieuw
  Bijwerken. Of vraag het aan Claude: "los de merge-conflicten op".
  Liever terug naar hoe het was? In de terminal: git merge --abort
`)
      process.exit(1)
    }
    setupVscode(top)
  }

  const commits = git(['log', '--oneline', `${headBefore}..HEAD`]).split('\n').filter(Boolean).length
  console.log(commits ? `→ ${commits} nieuwe commit(s) binnengehaald` : '→ Al up-to-date')

  if (git(['rev-parse', 'HEAD:pnpm-lock.yaml']) !== lockBefore) {
    console.log('→ Dependencies veranderden: pnpm install…\n')
    if (!run('pnpm', ['install', '--prefer-offline'], top)) fail('pnpm install mislukte.')
  }
  console.log(`\n✓ Bijgewerkt${inTask ? ': je taak bevat nu de laatste main' : ''}.\n`)
}

// ── pnpm task push ─────────────────────────────────────────────────────────
function push() {
  const branch = git(['branch', '--show-current'])
  if (!branch) fail('Je zit niet op een branch.')
  if (branch === 'main') {
    fail('Je staat op main: pushen zet dat meteen live. Werk op een taakbranch (knop "Nieuwe taak").')
  }
  if (git(['status', '--porcelain'])) {
    fail('Er zijn nog niet-gecommitte wijzigingen. Commit ze eerst (Source Control, links: bericht typen → Commit).')
  }
  console.log(`\n→ ${branch} naar GitHub pushen…`)
  git(['push', '--quiet', '-u', 'origin', 'HEAD'])
  const remote = git(['remote', 'get-url', 'origin']).replace(/\.git$/, '').replace(/^git@github\.com:/, 'https://github.com/')
  console.log(`
✓ Gepusht. Vercel maakt nu een Preview-deploy van de geraakte site(s).

  Klaar om live te zetten? Open de pull request en klik "Merge":
  ${remote}/compare/main...${encodeURIComponent(branch).replace(/%2F/g, '/')}?expand=1

  Daarna: knop "Taak afronden" in het venster van de hoofdmap.
`)
}

// ── uitleg ─────────────────────────────────────────────────────────────────
function help() {
  console.log(`
  KNOPPEN (statusbalk onderaan in VS Code)

  ▶ Start site       kies welke site(s) je lokaal wil draaien
  ⎇ Nieuwe taak      vraagt site + taaknaam → eigen branch + eigen map + nieuw venster
  🗀 Nieuwe site      nieuwe site uit de template, als taak in een eigen venster
  ⟳ Bijwerken        laatste main binnenhalen (hoofdmap: main; taakmap: main in je taak)
  ☁ Push             je gecommitte werk naar GitHub → Vercel Preview + link om te mergen
  ▣ Taak afronden    na de merge: map en branch opruimen (in het venster van de hoofdmap)
  ✓ Check            lint + typecheck van alles

  EEN TAAK, VAN BEGIN TOT EINDE

  1. Nieuwe taak       (hoofdvenster)   → er opent een nieuw venster
  2. Werken            (taakvenster)    → zelf of met Claude
  3. Commit            (taakvenster)    → Source Control links: bericht typen, Commit
  4. Push              (taakvenster)    → Preview nakijken, link openen, Merge op GitHub
  5. Taakvenster sluiten
  6. Taak afronden     (hoofdvenster)   → kies de taak uit de lijst

  In de terminal: pnpm dev | pnpm task <site> <taak> | pnpm task push | pnpm task done
`)
}

const [cmd, ...rest] = process.argv.slice(2)
if (!cmd || cmd === 'help' || cmd === '--help') {
  help()
} else if (cmd === 'status') {
  // Knop met de taaknaam: wat is er veranderd in deze taak?
  const branch = git(['branch', '--show-current'])
  const changed = git(['status', '--short'])
  const commits = branch === 'main' ? '' : git(['log', '--oneline', `origin/main..${branch}`])
  console.log(`\nTaak: ${branch}\n`)
  console.log(changed ? `Nog niet gecommit:\n${changed.split('\n').map(l => `  ${l}`).join('\n')}\n` : 'Alles gecommit.\n')
  console.log(commits ? `Commits in deze taak (nog niet in main):\n${commits.split('\n').map(l => `  ${l}`).join('\n')}\n` : 'Nog geen commits die niet in main zitten.\n')
  console.log(changed ? 'Volgende stap: Source Control (links) → bericht typen → Commit, dan Push.' : commits ? 'Volgende stap: Push (en daarna mergen via de link).' : 'Nog niets te pushen.')
  console.log()
} else if (cmd === 'vscode') {
  // Knoppen en kleur (opnieuw) zetten in de taakmap waar je nu staat.
  const top = git(['rev-parse', '--show-toplevel'])
  if (path.resolve(top) === mainRoot) fail('Dit is de hoofdmap; die houdt de gewone knoppen.')
  setupVscode(top)
  console.log('✓ Knoppen en kleur ingesteld. Herlaad het venster: Ctrl+Shift+P → Developer: Reload Window')
} else if (cmd === 'update') {
  update()
} else if (cmd === 'push') {
  push()
} else if (cmd === 'list') {
  list()
} else if (cmd === 'done') {
  await done(...rest)
} else {
  create(cmd, ...rest)
}
