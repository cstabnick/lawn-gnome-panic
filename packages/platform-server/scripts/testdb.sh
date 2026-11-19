#!/usr/bin/env bash
# Starts a throwaway Postgres 16 for the store tests and prints its connection string.
#   eval "$(bash scripts/testdb.sh start 55432)"   # exports PLATFORM_TEST_DATABASE_URL and TESTDB_DIR
#   bash scripts/testdb.sh stop                     # stops it and deletes its files
# Use a different port per parallel run. Needs the postgresql-16 server binaries (initdb, pg_ctl);
# when running as root, the server runs as the `postgres` user.
set -euo pipefail
BIN=${PG_BIN:-/usr/lib/postgresql/16/bin}
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/sh -c "$1"; else sh -c "$1"; fi; }
case "${1:-}" in
  start)
    PORT=${2:-55432}
    DIR=$(mktemp -d "${TMPDIR:-/tmp}/platform-testdb.XXXXXX")
    chmod 755 "$DIR"
    [ "$(id -u)" = 0 ] && chown postgres "$DIR"
    as_pg "$BIN/initdb -D '$DIR/data' -A trust -U postgres >/dev/null"
    as_pg "$BIN/pg_ctl -D '$DIR/data' -o \"-p $PORT -k '$DIR' -c listen_addresses=127.0.0.1\" -l '$DIR/log' -w start >/dev/null"
    echo "export TESTDB_DIR='$DIR' PLATFORM_TEST_DATABASE_URL='postgres://postgres@127.0.0.1:$PORT/postgres?sslmode=disable'"
    ;;
  stop)
    DIR=${TESTDB_DIR:?TESTDB_DIR not set: eval the output of start first}
    as_pg "$BIN/pg_ctl -D '$DIR/data' -m fast -w stop >/dev/null" || true
    rm -rf "$DIR"
    ;;
  *) echo "usage: $0 start [port] | stop" >&2; exit 2 ;;
esac
