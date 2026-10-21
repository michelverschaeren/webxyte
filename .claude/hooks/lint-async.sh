#!/usr/bin/env bash
# PostToolUse (Write|Edit) — background full-repo lint.
#
# Why the whole repo and not the edited file: measured on this project, a
# single-file `eslint app/pages/index.vue` takes 4.0s and `eslint .` takes 4.4s.
# The cost is ESLint + the Nuxt flat-config startup, not the file count, so
# per-file linting buys ~0.4s in exchange for partial coverage.
#
# Runs under asyncRewake, so it never blocks: exit 0 is silent, exit 2 wakes
# Claude with whatever went to stderr.
set -u

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0

# --- only lint what ESLint actually covers -----------------------------------
payload=$(cat)
file=$(printf '%s' "$payload" | node -e '
  let s = ""
  process.stdin.on("data", d => s += d).on("end", () => {
    try { process.stdout.write(String(JSON.parse(s)?.tool_input?.file_path ?? "")) }
    catch { /* malformed payload: fall through to the skip below */ }
  })
' 2>/dev/null)

case "$file" in
  *.vue|*.ts|*.mts|*.cts|*.js|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac

# --- single flight ------------------------------------------------------------
# A burst of edits must not stack concurrent ESLint processes. `mkdir` is atomic,
# so exactly one caller wins the lock; the rest drop out silently.
LOCK_DIR=".turbo/claude"
LOCK="$LOCK_DIR/lint.lock"
mkdir -p "$LOCK_DIR" 2>/dev/null || exit 0

# Reap a lock left behind by a killed process before trying to take it.
if [ -d "$LOCK" ] && [ -n "$(find "$LOCK" -maxdepth 0 -mmin +2 2>/dev/null)" ]; then
  rmdir "$LOCK" 2>/dev/null
fi

mkdir "$LOCK" 2>/dev/null || exit 0
trap 'rmdir "$LOCK" 2>/dev/null' EXIT INT TERM

# --- lint ---------------------------------------------------------------------
if out=$(pnpm -s lint 2>&1); then
  exit 0
fi

{
  echo "ESLint failed (background lint after editing $file):"
  printf '%s\n' "$out" | tail -40
  echo
  echo "Fix these before finishing. Do not run 'pnpm lint' to re-check by hand —"
  echo "the Stop hook runs lint + typecheck at the end of the turn."
} >&2
exit 2
