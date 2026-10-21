#!/usr/bin/env bash
# Stop — the one full check per task: lint (~4s) + typecheck (~13s).
#
# `pnpm build` is deliberately not here. It prerenders every route and generates
# every /_ipx/ variant; that belongs in /ship, next to preview + verify:perf.
set -u

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0

payload=$(cat)

# --- never re-block a stop this hook already blocked --------------------------
active=$(printf '%s' "$payload" | node -e '
  let s = ""
  process.stdin.on("data", d => s += d).on("end", () => {
    try { process.stdout.write(JSON.parse(s)?.stop_hook_active ? "1" : "") }
    catch {}
  })
' 2>/dev/null)
[ -n "$active" ] && exit 0

# --- change gate --------------------------------------------------------------
# A turn that only answered a question must end instantly. The stamp records the
# last passing run; if nothing under app/, server/, shared/ or scripts/ (or a
# root config file) is newer than it, there is nothing to re-check. Paths that
# do not exist yet (server/ and shared/ on a static site) are skipped by find.
STAMP_DIR=".turbo/claude"
STAMP="$STAMP_DIR/verified"
mkdir -p "$STAMP_DIR" 2>/dev/null || exit 0

SOURCES="packages sites templates scripts package.json pnpm-workspace.yaml turbo.json"

if [ -f "$STAMP" ]; then
  # find is scoped to the source paths — never node_modules, .nuxt or .output.
  changed=$(find $SOURCES \( -name node_modules -o -name .nuxt -o -name .output -o -name .turbo \) -prune -o -type f -newer "$STAMP" -print 2>/dev/null | head -1)
  [ -z "$changed" ] && exit 0
fi

# --- the check ----------------------------------------------------------------
# Both run even if the first fails: one report beats two round trips.
lint_failed=0
type_failed=0
lint_out=$(pnpm -s lint 2>&1) || lint_failed=1
type_out=$(pnpm -s typecheck 2>&1) || type_failed=1

if [ "$lint_failed" -eq 0 ] && [ "$type_failed" -eq 0 ]; then
  : > "$STAMP"
  exit 0
fi

{
  echo "Verification failed — fix before finishing this task."
  if [ "$lint_failed" -eq 1 ]; then
    echo
    echo "--- pnpm lint ---"
    printf '%s\n' "$lint_out" | tail -30
  fi
  if [ "$type_failed" -eq 1 ]; then
    echo
    echo "--- pnpm typecheck ---"
    printf '%s\n' "$type_out" | tail -30
  fi
} >&2
exit 2
