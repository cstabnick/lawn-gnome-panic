#!/usr/bin/env bash
# Two-browser co-op test. Needs the game dev server and the matchmaking server running:
#   npm run dev -w games/gnaft            (port 5183)
#   npm run dev -w packages/mp-server     (ws://localhost:8787/ws)
# Usage: bash games/gnaft/cooptest.sh [game-port] [matchmaking-ws-url]
set -u
PORT="${1:-5183}"
MP="${2:-ws://localhost:8787/ws}"
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
OUT="${TMPDIR:-/tmp}/gnaft-coop-$$"
mkdir -p "$OUT"
ROOM=$((RANDOM % 900 + 100))
run() { # role
  timeout 60 "$EDGE" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
    --user-data-dir="$OUT/p-$1" --enable-logging=stderr --v=0 --virtual-time-budget=40000 \
    --dump-dom "http://localhost:$PORT/?room=$ROOM&mp=$MP#cooptest=$1" > "$OUT/$1.html" 2> "$OUT/$1.log"
}
run host & run guest & wait
status=0
for r in host guest; do
  grep CONSOLE "$OUT/$r.log" | grep -v chrome-extension | grep -oE '(COOPTEST[^"]*|Uncaught[^"]*)' | sed "s/^/$r: /"
  # Edge can outlive its virtual-time budget here (live sockets), so judge by the console line, not the DOM dump.
  grep -q "COOPTEST ${r^^} OK" "$OUT/$r.log" || status=1
done
[ $status = 0 ] && echo "COOP OK" || echo "COOP FAILED"
exit $status
