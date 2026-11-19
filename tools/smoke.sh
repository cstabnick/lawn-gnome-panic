#!/usr/bin/env bash
# Headless browser smoke test: loads a running dev server in headless Edge,
# prints page console errors, and checks that expected DOM markers rendered.
#
# Usage: tools/smoke.sh <url> [marker ...]
#   e.g. tools/smoke.sh http://localhost:5174/ lb-play hud-root
# Exit code 1 if a console error or uncaught exception is logged, or a marker is missing.
set -u
URL="${1:?usage: tools/smoke.sh <url> [marker ...]}"
shift
# Override with EDGE=/path/to/chromium on Linux/macOS.
EDGE="${EDGE:-/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
OUT="${TMPDIR:-/tmp}/smoke-$$"
mkdir -p "$OUT"
# Chromium refuses to start as root (cloud containers) without --no-sandbox.
SANDBOX=()
[ "$(id -u)" = 0 ] && SANDBOX=(--no-sandbox)

timeout 90 "$EDGE" "${SANDBOX[@]}" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
  --user-data-dir="$OUT/profile" --enable-logging=stderr --v=0 \
  --virtual-time-budget=8000 --dump-dom "$URL" > "$OUT/dom.html" 2> "$OUT/log.txt"

status=0
# Page console output only (skip extensions and Vite's own chatter).
errors=$(grep "CONSOLE" "$OUT/log.txt" | grep -v "chrome-extension://" | grep -iE "error|uncaught|exception|failed" || true)
if [ -n "$errors" ]; then
  echo "CONSOLE ERRORS:"
  echo "$errors"
  status=1
fi
for m in "$@"; do
  if grep -q "$m" "$OUT/dom.html"; then
    echo "ok: $m"
  else
    echo "MISSING: $m"
    status=1
  fi
done
[ $status -eq 0 ] && echo "SMOKE OK"
rm -rf "$OUT"
exit $status
