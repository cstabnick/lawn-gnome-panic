#!/usr/bin/env bash
# Usage: bash games/gnaft/snap.sh <scenario> <out.png> [port] [WxH] [query]
#   e.g. snap.sh raft phone.png 5183 390,844 touch=1   (a phone-sized screenshot with the touch controls)
# Screenshots the running dev server in a debug scenario (see runSnap in src/selftest.ts).
set -u
SCEN="${1:-raft}"; OUT="${2:?out.png}"; PORT="${3:-5183}"; SIZE="${4:-1280,720}"; QUERY="${5:-}"
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
PROFILE="$(mktemp -d)"
timeout 90 "$EDGE" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --user-data-dir="$PROFILE" \
  --window-size="$SIZE" --virtual-time-budget=3000 --screenshot="$OUT" "http://localhost:$PORT/?$QUERY#snap=$SCEN" 2>/dev/null
rm -rf "$PROFILE"
