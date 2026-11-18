# platform-server: player accounts (Go)

`gnome.user.v1.UserService` (`proto/gnome/user/v1/user.proto`) over [Connect](https://connectrpc.com), at `/api/`.
Design: `docs/design/gnome-platform.md`; plan: `docs/roadmaps/accounts.md`.

- **Sign-in is Keycloak** (`auth.whalenet.dev`, realm `whalenet`, public client `gnome-web`). The browser signs in
  (`packages/platform`); this service only verifies access tokens against the realm's JWKS (`internal/auth`): issuer,
  expiry, `aud` contains `gnome-web`, `typ` Bearer. Accounts are keyed on the token's `sub`.
- **Accounts** live in Postgres (`internal/store`, tables created on start in the `PG_SEARCH_PATH` schema). Deleted
  accounts are purged after `DELETE_GRACE` (7 days); signing in before then restores them.
- **Names** follow `packages/mp/src/textFilter.ts` (`internal/names`, profanity via go-away).

Run it locally (needs Postgres; `scripts/testdb.sh` starts a throwaway one):

```bash
cd packages/platform-server
eval "$(bash scripts/testdb.sh start 55432)" && psql "$PLATFORM_TEST_DATABASE_URL" -c 'create schema gnome'
PORT=8090 PGHOST=127.0.0.1 PGPORT=55432 PGUSER=postgres PGDATABASE=postgres PGSSLMODE=disable go run .
```

`npm run dev -w games/me` (port 5199) then talks to it at `http://localhost:8090/api`. Real sign-in needs Keycloak's
`gnome-web` client, whose redirect URIs include `http://localhost:5199/*`.

Tests: `go test ./...` (the Postgres store tests run when `PLATFORM_TEST_DATABASE_URL` is set, as in CI).
Generated code (`gen/`, and `packages/platform/src/gen/`) is checked in; regenerate with the command in `proto/buf.gen.yaml`.
Deploy: `.github/workflows/platform.yml` pushes `ghcr.io/cstabnick/lawn-gnome-platform`; the cluster side is
whale-net/argok8s `services/lawn-gnome-panic` (Keycloak client: `opentofu/keycloak/lawn-gnome-panic`).
