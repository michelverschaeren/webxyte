#!/usr/bin/env node
/**
 * PreToolUse (Write|Edit) — vangnet: wie op `main` in de hoofdmap een bestand
 * van de repo wil wijzigen, krijgt eerst een bevestigingsvraag. Werk hoort op
 * een taakbranch (pnpm task <site> <taak>). Bevestigt de gebruiker toch (bv.
 * een tikfout in de README), dan gaat het gewoon door.
 */
import { execFileSync } from 'node:child_process'
import path from 'node:path'

let input = ''
process.stdin.on('data', (d) => { input += d })
process.stdin.on('end', () => {
  let file = ''
  try {
    file = JSON.parse(input)?.tool_input?.file_path ?? ''
  } catch {
    process.exit(0)
  }
  if (!file) process.exit(0)

  const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd()
  const git = args => execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  let top, branch
  try {
    top = path.resolve(git(['rev-parse', '--show-toplevel']))
    branch = git(['branch', '--show-current'])
  } catch {
    process.exit(0)
  }

  // Enkel bestanden binnen deze repo, en enkel op main.
  const target = path.resolve(dir, file)
  if (branch !== 'main' || !target.startsWith(top + path.sep)) process.exit(0)

  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason:
        'Je staat op main (= productie). Normaal start je eerst een taak: pnpm task <site> <taak> '
        + '(knop "Nieuwe taak"). Toch hier wijzigen?'
    }
  }))
})
