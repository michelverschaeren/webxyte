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

/** git status van een taakmap; null als de map (half) weg is. */
function taskStatus(dir) {
  if (!existsSync(path.join(dir, '.git'))) return null
  try {
    return git(['status', '--porcelain'], { cwd: dir })
  } catch {
    return null
  }
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
    const st = taskStatus(t.path)
    const dirty = st === null ? '  (map is weg of half verwijderd: Taak afronden ruimt op)' : st ? '  (niet-gecommitte wijzigingen)' : ''
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

/**
 * Alles wat "Taak afronden" kan opruimen: taakmappen (worktrees), lokale
 * branches zonder map (bv. na een half mislukt opruimen) en branches die
 * enkel nog op GitHub staan.
 */
function cleanupCandidates() {
  const wts = worktrees().filter(w => path.resolve(w.path) !== mainRoot)
  const withDir = new Set(wts.map(w => w.branch))
  const local = git(['for-each-ref', '--format=%(refname:short)', 'refs/heads'], { cwd: mainRoot })
    .split('\n').filter(b => b && b !== 'main' && !withDir.has(b))
  const remote = git(['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin'], { cwd: mainRoot })
    .split('\n').map(r => r.replace(/^origin\//, ''))
    .filter(b => b && b.includes('/') && b !== 'HEAD' && !withDir.has(b) && !local.includes(b))
  return [
    ...wts.map(w => ({ branch: w.branch, path: w.path, note: '' })),
    ...local.map(b => ({ branch: b, path: null, note: '(geen map meer)' })),
    ...remote.map(b => ({ branch: b, path: null, remoteOnly: true, note: '(enkel nog op GitHub)' }))
  ]
}

async function done(name, ...flags) {
  const force = flags.includes('--force')
  git(['fetch', '--quiet', '--prune', 'origin'], { cwd: mainRoot })
  const all = cleanupCandidates()
  let t
  if (!name) {
    if (!all.length) fail('Geen open taken of overgebleven branches om op te ruimen.')
    if (!process.stdin.isTTY) fail('Gebruik: pnpm task done <taak> (zie pnpm task list)')
    console.log('\nWelke taak afronden?\n')
    all.forEach((c, i) => console.log(`  ${i + 1}. ${c.branch}  ${c.note}`))
    t = all[Number(await ask('\nNummer: ')) - 1]
    if (!t) fail('Geen geldige keuze.')
  } else {
    t = all.find(c => c.branch === name) ?? all.find(c => c.branch.includes(name))
    if (!t) fail(`Geen open taak "${name}". Zie: pnpm task list`)
  }
  // Een map die er nog staat volgens de vaste naam, maar niet meer bij git
  // gekend is (half verwijderd): mee opruimen.
  if (!t.path && !t.remoteOnly) {
    const leftover = path.join(parentDir, `${repoName}-${t.branch.replace(/\//g, '-')}`)
    if (existsSync(leftover)) t.path = leftover
  }

  if (t.path && path.resolve(process.cwd()).startsWith(path.resolve(t.path))) {
    fail(`Je staat zelf in die map. Ga eerst naar de hoofdmap:\n  cd "${mainRoot}"\n  pnpm task done ${t.branch}`)
  }
  if (t.path && !force && taskStatus(t.path)) {
    fail(`${t.branch} heeft nog niet-gecommitte wijzigingen in ${t.path}. Commit of gooi ze weg, dan opnieuw.`)
  }

  const ref = t.remoteOnly ? `origin/${t.branch}` : t.branch
  const notMerged = git(['log', '--oneline', `origin/main..${ref}`], { cwd: mainRoot })
  if (notMerged && !force && !contentInMain(ref)) {
    fail(`${t.branch} heeft werk dat nog niet in main zit:\n${notMerged.split('\n').map(l => `    ${l}`).join('\n')}\n\n  Eerst live zetten: 4 Push & merge in het taakvenster. Echt weggooien? pnpm task done ${t.branch} --force`)
  }

  if (t.path && existsSync(t.path)) {
    console.log(`\n→ Map verwijderen: ${t.path}`)
    // Zelf verwijderen i.p.v. `git worktree remove`: dat struikelt op Windows
    // over de node_modules-koppelingen van pnpm ("Directory not empty"). Node
    // verwijdert koppelingen zonder hun doel aan te raken.
    try {
      rmSync(t.path, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
    } catch (error) {
      fail(`De map kon niet (helemaal) weg: ${error.code || error.message}.
  Waarschijnlijk gebruikt een programma nog bestanden erin. Sluit het
  taakvenster in VS Code (en een draaiende Start/Preview in een terminal),
  wacht enkele seconden en klik opnieuw Taak afronden.`)
    }
  }
  git(['worktree', 'prune'], { cwd: mainRoot })
  if (!t.remoteOnly) {
    // -D: hierboven al nagekeken dat alles in origin/main zit (of --force).
    git(['branch', '-D', t.branch], { cwd: mainRoot })
    console.log(`→ Lokale branch ${t.branch} verwijderd`)
  }

  // De branch op GitHub ook weg. Niet bij --force: niet-gemerged werk op
  // GitHub laten staan.
  if (!force) {
    const onRemote = git(['ls-remote', '--heads', 'origin', t.branch], { cwd: mainRoot })
    if (onRemote) {
      git(['push', '--quiet', 'origin', '--delete', t.branch], { cwd: mainRoot })
      console.log(`→ Branch ${t.branch} op GitHub verwijderd`)
    }
  }
  git(['fetch', '--quiet', '--prune', 'origin'], { cwd: mainRoot })
  const rest = cleanupCandidates().length
  console.log(`\n✓ Opgeruimd.${rest ? ` Nog ${rest} om op te ruimen: klik opnieuw Taak afronden.` : ''}\n`)
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

  const button = (label, command, statusbar, { options = {}, ...extra } = {}) => ({
    label,
    type: 'shell',
    command,
    problemMatcher: [],
    presentation: { panel: 'shared', clear: true, focus: true },
    options: { statusbar, ...options },
    ...extra
  })

  // Volgorde = volgorde in de statusbalk. Links: waar je bent en werken;
  // daarna de vier stappen om af te ronden, genummerd.
  const tasks = [
    button(`Taak ${branch}`, 'pnpm task status',
      { label: `$(git-branch) ${task}`, tooltip: `Taakmap voor ${isSite ? `sites/${prefix}` : prefix}. Klik: wat is er veranderd?`, color: '#ffffff' }),
    isSite
      ? button(`Start ${prefix}`, `pnpm dev ${prefix}`,
          { label: `$(play) Start ${prefix}`, tooltip: port ? `Ontwikkelserver: http://localhost:${port}` : 'Start deze site', color: '#89d185' },
          { isBackground: true, presentation: { panel: 'dedicated', focus: true } })
      : button('Start site', 'pnpm dev',
          { label: '$(play) Start site', tooltip: 'Kies welke site(s) je start', color: '#89d185' },
          { isBackground: true, presentation: { panel: 'dedicated', focus: true, clear: true } }),
    // Enkel in webxyte-voorstellen: één knop om het voorstel te laten bouwen.
    ...(isSite && existsSync(path.join(dir, 'scripts', 'bouw.mjs'))
      ? [button('Bouw voorstel', 'pnpm voorstel bouw',
          { label: '$(wand) Bouw voorstel', tooltip: 'Ophalen, stijl kiezen, bouwen, laten nakijken en committen (Claude, zonder chat)', color: '#f5a3ff' })]
      : []),
    button('Bijwerken', 'pnpm task update',
      { label: '$(sync) Bijwerken', tooltip: 'Laatste main in deze taak halen (bv. na een merge van een layer)', color: '#75beff' }),
    button('1 Check', isSite ? `pnpm turbo run lint typecheck --filter=./sites/${prefix}` : 'pnpm turbo run lint typecheck',
      { label: '$(check-all) 1 Check', tooltip: isSite ? `Lint + typecheck van ${prefix}` : 'Lint + typecheck van alles', color: '#e2c08d' }),
    button('2 Preview', 'pnpm task preview',
      { label: '$(eye) 2 Preview', tooltip: 'Productiebuild lokaal bekijken, zoals Vercel hem zal tonen (stoppen: Ctrl+C)', color: '#e2c08d' },
      { isBackground: true, presentation: { panel: 'dedicated', focus: true, clear: true } }),
    button('3 Commit', 'pnpm task commit',
      { label: '$(git-commit) 3 Commit', tooltip: 'Alles bewaren in deze taak, met een korte omschrijving', color: '#e2c08d' },
      { options: { env: { TASK_MESSAGE: '${input:commitMessage}' } } }),
    button('4 Push & merge', 'pnpm task merge',
      { label: '$(rocket) 4 Push & merge', tooltip: 'Naar main = live. Vraagt eerst bevestiging.', color: '#f48771' }),
    button('Naar hoofdmap', `code "${mainRoot}"`,
      { label: '$(home) Hoofdmap', tooltip: 'Open het venster van de hoofdmap (daar: Taak afronden na de merge)', color: '#cca700' }),
    button('Hulp', 'pnpm task help', { label: '$(question) Hulp', tooltip: 'Uitleg bij de knoppen' }),
    // Zonder knop (Ctrl+Shift+P → Tasks: Run Task): pushen zonder mergen,
    // voor een Vercel Preview online.
    button('Push zonder merge', 'pnpm task push', { hide: true })
  ]

  const vscodeDir = path.join(dir, '.vscode')
  writeFileSync(path.join(vscodeDir, 'tasks.json'), `${JSON.stringify({
    // Gegenereerd door pnpm task (scripts/task.mjs) voor deze taakmap.
    // git negeert dit bestand hier (skip-worktree).
    version: '2.0.0',
    tasks,
    inputs: [
      { id: 'commitMessage', type: 'promptString', description: 'Wat heb je veranderd? (kort, bv. "foto\'s homepage vervangen")' }
    ]
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
/**
 * origin/main in de taakbranch van `top` mergen. De gegenereerde knoppen even
 * terugzetten, anders weigert git de merge als main .vscode/ veranderde; daarna
 * opnieuw genereren. Bij een conflict: uitleg en stoppen.
 */
function mergeMainInto(top, again = 'Bijwerken') {
  const vscodeFiles = ['.vscode/tasks.json', '.vscode/settings.json']
  git(['update-index', '--no-skip-worktree', ...vscodeFiles], { cwd: top })
  git(['checkout', '--', ...vscodeFiles], { cwd: top })
  let ok = true
  try {
    git(['merge', '--no-edit', 'origin/main'], { cwd: top })
  } catch {
    ok = false
  }
  if (!ok) {
    setupVscode(top)
    console.error(`
✗ main en je taak veranderden dezelfde regels (conflict).

  VS Code toont de conflicten in Source Control (links), met knoppen
  "Accept Current / Incoming / Both". Los ze op, klik 3 Commit, en klik
  opnieuw ${again}. Of vraag het aan Claude: "los de merge-conflicten op".
  Liever terug naar hoe het was? In de terminal: git merge --abort
`)
    process.exit(1)
  }
  // In een nieuw proces: na de merge kan dit script zelf veranderd zijn.
  spawnSync(process.execPath, [path.join(top, 'scripts', 'task.mjs'), 'vscode', '--stil'], { cwd: top, stdio: 'inherit' })
}

function update() {
  const top = path.resolve(git(['rev-parse', '--show-toplevel']))
  const branch = git(['branch', '--show-current'])
  const inTask = top !== mainRoot
  if (git(['status', '--porcelain'])) {
    fail('Er zijn nog niet-gecommitte wijzigingen. Klik eerst 3 Commit, dan opnieuw Bijwerken.')
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
    mergeMainInto(top)
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
    fail('Er zijn nog niet-gecommitte wijzigingen. Klik eerst 3 Commit.')
  }
  console.log(`\n→ ${branch} naar GitHub pushen…`)
  git(['push', '--quiet', '-u', 'origin', 'HEAD'])
  const remote = git(['remote', 'get-url', 'origin']).replace(/\.git$/, '').replace(/^git@github\.com:/, 'https://github.com/')
  console.log(`
✓ Gepusht. Vercel maakt nu een Preview-deploy van de geraakte site(s)
  (vercel.com → Deployments, of de pull request op GitHub):
  ${remote}/compare/main...${encodeURIComponent(branch).replace(/%2F/g, '/')}?expand=1

  Live zetten: knop 4 Push & merge in dit venster.
`)
}

// ── pnpm task preview [site] ───────────────────────────────────────────────
/** Site van deze taak (branch-prefix), of null bij een layer/tooling/hoofdmap. */
function taskSite(top) {
  const prefix = git(['branch', '--show-current'], { cwd: top }).split('/')[0]
  return existsSync(path.join(top, 'sites', prefix, 'package.json')) ? prefix : null
}

/** Productiebuild van één site, lokaal geserveerd: wat Vercel straks toont. */
async function preview(arg) {
  const top = path.resolve(git(['rev-parse', '--show-toplevel']))
  const sites = readdirSync(path.join(top, 'sites'), { withFileTypes: true })
    .filter(e => e.isDirectory() && existsSync(path.join(top, 'sites', e.name, 'package.json'))).map(e => e.name)
  let site = arg ? sites.find(s => s.includes(slug(arg))) : taskSite(top)
  if (!site) {
    if (sites.length === 1) site = sites[0]
    else {
      if (!process.stdin.isTTY) fail(`Welke site? pnpm task preview <site>. Sites: ${sites.join(', ')}`)
      console.log('\nWelke site bekijken?\n')
      sites.forEach((s, i) => console.log(`  ${i + 1}. ${s}`))
      site = sites[Number(await ask('\nNummer: ')) - 1]
      if (!site) fail('Geen geldige keuze.')
    }
  }
  const siteDir = path.join(top, 'sites', site)
  const port = /--port[ =](\d+)/.exec(JSON.parse(readFileSync(path.join(siteDir, 'package.json'), 'utf8')).scripts?.dev ?? '')?.[1] ?? '3000'

  console.log(`\n→ Productiebuild van ${site} (1 à 2 minuten)…\n`)
  if (!run('pnpm', ['build'], siteDir)) fail('De build mislukte: zie de fout hierboven. Klik 1 Check, of vraag het aan Claude.')
  console.log(`
→ Preview: http://localhost:${port}
  Zo ziet Vercel hem straks. Kijk ook op gsm-breedte (F12 → gsm-icoon).
  Stoppen: Ctrl+C in deze terminal. Tevreden? 3 Commit, dan 4 Push & merge.
`)
  run('pnpm', ['preview', '--port', port], siteDir)
}

// ── pnpm task commit ───────────────────────────────────────────────────────
/** Alles in deze taak committen; omschrijving uit de knop (TASK_MESSAGE). */
function commit(...words) {
  const top = path.resolve(git(['rev-parse', '--show-toplevel']))
  const branch = git(['branch', '--show-current'])
  if (top === mainRoot || branch === 'main') {
    fail('Dit is de hoofdmap (main). Commit in het venster van een taak (paarse balk).')
  }
  if (!git(['status', '--porcelain'])) {
    console.log('\n✓ Niets te committen: alles is al bewaard.\n')
    return
  }
  git(['add', '-A'])
  // Vangnet bovenop .gitignore: nooit een .env met geheimen in git.
  const secrets = git(['diff', '--cached', '--name-only']).split('\n')
    .filter(f => /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith('.env.example'))
  if (secrets.length) {
    git(['reset', '--quiet', '--', ...secrets])
    console.log(`→ Niet mee gecommit (geheimen): ${secrets.join(', ')}`)
  }
  if (!git(['diff', '--cached', '--name-only'])) {
    console.log('\n✓ Niets te committen.\n')
    return
  }
  const message = (words.join(' ') || process.env.TASK_MESSAGE || '').trim()
    || `${branch.split('/').slice(1).join('/') || branch}: wijzigingen`
  const files = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
  git(['commit', '--quiet', '-m', message])
  console.log(`\n✓ Gecommit: "${message}" (${files.length} bestand(en))`)
  console.log('  Volgende stap: 4 Push & merge (of eerst verder werken).\n')
}

// ── pnpm task merge ────────────────────────────────────────────────────────
/**
 * De taak live zetten zonder GitHub-website:
 *   1. alles gecommit? toon wat er live gaat en vraag bevestiging;
 *   2. nieuwe commits op main? die eerst in de taak + opnieuw lint/typecheck;
 *   3. in de hoofdmap: main bijwerken, de taak erin mergen, main pushen.
 * Vercel bouwt daarna de geraakte site(s) (turbo-ignore). Opruimen blijft
 * "Taak afronden" in de hoofdmap (dit venster staat nog in de taakmap).
 */
async function merge(...flags) {
  const yes = flags.includes('--ja')
  const top = path.resolve(git(['rev-parse', '--show-toplevel']))
  const branch = git(['branch', '--show-current'])
  if (top === mainRoot || !branch || branch === 'main') {
    fail('Dit doe je in het venster van een taak (paarse balk), niet in de hoofdmap.')
  }
  if (git(['status', '--porcelain'])) {
    fail('Er zijn nog niet-bewaarde wijzigingen. Klik eerst 3 Commit, dan opnieuw 4 Push & merge.')
  }
  console.log('\n→ Laatste versie van main ophalen…')
  git(['fetch', '--quiet', 'origin', 'main'])
  const commits = git(['log', '--oneline', 'origin/main..HEAD'])
  // Geen eigen commits, of enkel merges van main (Bijwerken): de inhoud staat
  // al in main. VS Code toont dan soms toch "↑ n" t.o.v. de oude taakbranch
  // op GitHub; dat zijn de commits van main die Bijwerken binnenhaalde.
  if (!commits || !git(['diff', '--name-only', 'origin/main...HEAD'])) {
    console.log(`
✓ Alles van deze taak staat al in main (en is dus live). Niets te doen.
  Ziet VS Code nog "↑" of "Sync Changes"? Negeer dat: het zijn de commits van
  main die Bijwerken binnenhaalde, niet je eigen werk.

  Volgende stap: sluit dit venster, en klik in de hoofdmap op Taak afronden.
`)
    return
  }

  const files = git(['diff', '--name-only', 'origin/main...HEAD']).split('\n').filter(Boolean)
  const touched = [...new Set(files.map(f => /^(sites|packages)\/[^/]+/.exec(f)?.[0] ?? 'root (scripts, config)'))]
  const layers = touched.filter(t => t.startsWith('packages/'))
  const migrations = files.filter(f => /(^|\/)(migrations?|drizzle)\/.+\.(sql|ts)$/.test(f))

  console.log(`\n  Taak:    ${branch}`)
  console.log(`  Raakt:   ${touched.join(', ')}`)
  console.log(`  Commits:\n${commits.split('\n').map(l => `    ${l}`).join('\n')}`)
  console.log(`  ${files.length} bestand(en) gewijzigd.`)
  if (layers.length) {
    console.log(`\n  ⚠ Dit verandert een gedeelde layer (${layers.join(', ')}): ELKE site die hem gebruikt, gaat mee live.`)
  }
  if (migrations.length) {
    console.log(`\n  ⚠ Databasemigratie(s): ${migrations.join(', ')}
    Die draaien NIET vanzelf. Voer de productiemigratie uit vóór of meteen na
    het live zetten (vraag het aan Claude: skill db-migration).`)
  }
  if (!yes) {
    if (!process.stdin.isTTY) fail('Bevestiging nodig: pnpm task merge --ja')
    const answer = (await ask('\n  Live zetten (naar main)? Typ j en Enter: ')).toLowerCase()
    if (!['j', 'ja', 'y', 'yes'].includes(answer)) fail('Gestopt. Er is niets veranderd.')
  }

  // Nieuwe commits op main (andere taak, voorstellen.json …)? Eerst in de taak,
  // en dan opnieuw controleren: de combinatie is nog nooit getest.
  if (git(['log', '--oneline', 'HEAD..origin/main'])) {
    console.log('\n→ main veranderde intussen: eerst in deze taak mergen…')
    mergeMainInto(top, '4 Push & merge')
    const site = taskSite(top)
    const filter = site && !layers.length ? [`--filter=./sites/${site}`] : []
    console.log(`→ Opnieuw lint + typecheck (${filter.length ? site : 'alles'})…\n`)
    if (!run('pnpm', ['turbo', 'run', 'lint', 'typecheck', ...filter], top)) {
      fail('Na het mergen van main faalt lint/typecheck. Er is niets live gezet. Los het op (of vraag het aan Claude), 3 Commit, dan opnieuw 4 Push & merge.')
    }
  }

  // In de hoofdmap: daar staat main.
  if (git(['branch', '--show-current'], { cwd: mainRoot }) !== 'main') {
    fail(`De hoofdmap (${mainRoot}) staat niet op main. Vraag het aan Claude.`)
  }
  if (git(['status', '--porcelain', '--untracked-files=no'], { cwd: mainRoot })) {
    fail(`De hoofdmap heeft niet-gecommitte wijzigingen:\n${git(['status', '--short', '--untracked-files=no'], { cwd: mainRoot })}\n  Ruim die eerst op (of vraag het aan Claude). Er is niets live gezet.`)
  }
  console.log('\n→ Mergen naar main…')
  try {
    git(['merge', '--ff-only', '--quiet', 'origin/main'], { cwd: mainRoot })
  } catch {
    fail('main in de hoofdmap heeft eigen commits die niet op GitHub staan. Vraag het aan Claude. Er is niets live gezet.')
  }
  const before = git(['rev-parse', 'HEAD'], { cwd: mainRoot })
  try {
    git(['merge', '--no-ff', '--quiet', '-m', `Merge ${branch}`, branch], { cwd: mainRoot })
  } catch (error) {
    git(['reset', '--quiet', '--merge', before], { cwd: mainRoot })
    fail(`Mergen in de hoofdmap lukte niet:\n  ${String(error.stderr || error.message).trim().split('\n')[0]}\n  Er is niets live gezet. Vraag het aan Claude.`)
  }
  try {
    git(['push', '--quiet', 'origin', 'main'], { cwd: mainRoot })
  } catch (error) {
    // Merge in de hoofdmap terugdraaien: main = weer gelijk aan GitHub.
    git(['reset', '--quiet', '--keep', before], { cwd: mainRoot })
    fail(`Pushen naar GitHub lukte niet (main veranderde net, of geen verbinding).\n  ${String(error.stderr || error.message).trim().split('\n')[0]}\n  Er is niets live gezet. Klik opnieuw 4 Push & merge.`)
  }
  // De taakbranch op GitHub (als je ooit "Push zonder merge" deed) mag weg.
  try {
    if (git(['ls-remote', '--heads', 'origin', branch])) git(['push', '--quiet', 'origin', '--delete', branch])
  } catch {
    // Niet erg: Taak afronden probeert het opnieuw.
  }

  console.log(`
✓ Live gezet: ${branch} zit in main.
  Vercel bouwt nu ${touched.filter(t => t.startsWith('sites/')).map(t => t.slice(6)).join(', ') || 'de geraakte site(s)'}: 1 à 3 minuten (vercel.com → Deployments).${migrations.length ? '\n  ⚠ Vergeet de productiemigratie niet.' : ''}

  Volgende stap: sluit dit venster, en klik in de hoofdmap op Taak afronden.
`)
  run('code', [mainRoot], mainRoot)
}

// ── uitleg ─────────────────────────────────────────────────────────────────
function help() {
  console.log(`
  KNOPPEN IN DE HOOFDMAP (blauwe balk)

  ▶ Start site       kies welke site(s) je lokaal wil draaien
  ⎇ Nieuwe taak      vraagt site + taaknaam → eigen branch + eigen map + nieuw venster
  🗀 Nieuwe site      nieuwe site uit de template, als taak in een eigen venster
  ⟳ Bijwerken        laatste main van GitHub binnenhalen
  ▣ Taak afronden    na het live zetten: map en branch van een taak opruimen
  ✓ Check            lint + typecheck van alles

  KNOPPEN IN EEN TAAK (paarse balk), van links naar rechts

  ▶ Start <site>     ontwikkelserver (past zich aan terwijl je werkt)
  ⟳ Bijwerken        laatste main in je taak (bv. na een wijziging aan een layer)
  1 Check            lint + typecheck
  2 Preview          productiebuild lokaal bekijken, zoals Vercel hem toont
  3 Commit           alles bewaren, met een korte omschrijving
  4 Push & merge     naar main = live (toont eerst wat, vraagt bevestiging)
  ⌂ Hoofdmap         het venster van de hoofdmap openen

  EEN TAAK, VAN BEGIN TOT EINDE

  1. Nieuwe taak          (hoofdvenster)  → er opent een nieuw venster
  2. Werken               (taakvenster)   → zelf of met Claude, kijken met Start
  3. 1 Check → 2 Preview → 3 Commit → 4 Push & merge   (taakvenster)
  4. Taakvenster sluiten, Taak afronden   (hoofdvenster)

  Liever eerst een Vercel Preview online? Ctrl+Shift+P → "Tasks: Run Task" →
  "Push zonder merge". Mergen kan daarna nog altijd met 4 Push & merge.

  In de terminal: pnpm dev | pnpm task <site> <taak> | pnpm task preview |
  pnpm task commit "…" | pnpm task merge | pnpm task done
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
  console.log(changed ? 'Volgende stap: 1 Check → 2 Preview → 3 Commit → 4 Push & merge.' : commits ? 'Volgende stap: 4 Push & merge (zet het live).' : 'Nog niets om live te zetten.')
  console.log()
} else if (cmd === 'vscode') {
  // Knoppen en kleur (opnieuw) zetten in de taakmap waar je nu staat.
  const top = git(['rev-parse', '--show-toplevel'])
  if (path.resolve(top) === mainRoot) fail('Dit is de hoofdmap; die houdt de gewone knoppen.')
  setupVscode(top)
  if (!rest.includes('--stil')) console.log('✓ Knoppen en kleur ingesteld. Herlaad het venster: Ctrl+Shift+P → Developer: Reload Window')
} else if (cmd === 'update') {
  update()
} else if (cmd === 'push') {
  push()
} else if (cmd === 'preview') {
  await preview(rest[0])
} else if (cmd === 'commit') {
  commit(...rest)
} else if (cmd === 'merge') {
  await merge(...rest)
} else if (cmd === 'list') {
  list()
} else if (cmd === 'done') {
  await done(...rest)
} else {
  create(cmd, ...rest)
}
