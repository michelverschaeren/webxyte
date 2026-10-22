#!/usr/bin/env node
/**
 * SessionStart — vertelt Claude bij elke start waar hij staat: hoofdmap of
 * taakmap, welke branch, voor welke site, welke sites/layers er zijn en welke
 * taken open staan. Wat dit script naar stdout schrijft, komt in de context.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const git = args => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

const top = git(['rev-parse', '--show-toplevel'])
if (!top) process.exit(0)
const mainRoot = path.dirname(path.resolve(top, git(['rev-parse', '--git-common-dir'])))
const isMain = path.resolve(top) === mainRoot
const branch = git(['branch', '--show-current']) || '(geen branch)'
const dirty = git(['status', '--porcelain']).split('\n').filter(Boolean).length

const dirs = rel => {
  const p = path.join(mainRoot, rel)
  return existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name) : []
}
const sites = dirs('sites')
const layers = dirs('packages')
const prefix = branch.split('/')[0]
const scope = sites.includes(prefix)
  ? `site sites/${prefix}`
  : layers.includes(prefix) ? `layer packages/${prefix}` : prefix === 'tooling' ? 'tooling (root)' : null

const tasks = git(['worktree', 'list', '--porcelain']).split('\n\n').filter(Boolean).map((b) => {
  const wt = Object.fromEntries(b.split('\n').map(l => [l.split(' ')[0], l.split(' ').slice(1).join(' ')]))
  return { path: wt.worktree, branch: (wt.branch || '').replace('refs/heads/', '') }
}).filter(t => path.resolve(t.path) !== mainRoot)

const lines = [
  `[${path.basename(mainRoot)} monorepo — sessiecontext]`,
  `Map: ${top} (${isMain ? 'HOOFDMAP' : 'TAAKMAP (git worktree)'})`,
  `Branch: ${branch}${scope ? ` → werkt aan ${scope}` : ''}${dirty ? ` — ${dirty} niet-gecommitte wijziging(en)` : ''}`,
  `Sites: ${sites.join(', ') || '(geen)'}`,
  `Layers: ${layers.join(', ')}`,
  `Open taken: ${tasks.length ? tasks.map(t => `${t.branch} (${t.path})`).join('; ') : 'geen'}`
]

if (isMain && branch === 'main') {
  lines.push('LET OP: dit is main. Volg "Werkwijze bij elke vraag" in AGENTS.md: vraag waarvoor, en stel een taak voor (pnpm task …, of pnpm voorstel <url> in webxyte-voorstellen) voor je iets wijzigt.')
} else if (!isMain && scope) {
  lines.push(`Deze taakmap is voor ${scope}. Wijzig niets daarbuiten; vraagt de gebruiker iets voor een andere site, stel dan een aparte taak voor.`)
}

console.log(lines.join('\n'))
