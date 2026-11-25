Epic: 1 Fixes (parallel) · Item: L88 "profiler always attempts to route user to port :8080 which doesn't work (i think is internal pod port but not external)" · Model: sonnet
Depends on: none

## Environment
See `docs/roadmaps/gta-batch-3/E03/env.md` (read it first; its rules are part of this issue). This issue works in
shared packages and the profiler viewer, not the GTA game: change only the files you need there, keep it minimal.

## Goal
Nothing in the profiler flow (uploading a profile from a game, opening the admin profiler viewer, signing in, links to a
session) sends the browser to `:8080`. Fixed at the source, with a unit test for the URL builder.

## What is known (cause NOT confirmed)
- `packages/profiler/src/upload.ts` builds the endpoint from `@lawn/platform/url` `platformUrl()` (`?platform=` >
  `VITE_PLATFORM_URL` > `localhost:8090/api`). Viewer: `games/admin-profiler` (`src/data.ts`, served at
  `/admin/profiler/`, built by `tools/build-site.mjs`).
- `packages/platform-server` (Go): `Dockerfile` exposes 8080, `main.go` `PORT` default 8080: the INTERNAL pod port.
- Candidates: a redirect the Go server emits with an absolute URL built from `r.Host`/its own port (e.g. a trailing
  slash redirect, `http.Redirect` with a scheme+host, a login callback), `packages/platform/src/auth.ts` / `session.ts`
  (`redirect_uri = origin + pathname`), links in the admin-profiler page to sessions or to the API, deploy config
  (`docs/hosting.md`, any k8s/helm/yaml in the repo, `VITE_PLATFORM_URL`).
- `grep -rn "8080" --include=*.{ts,go,mjs,js,json,yaml,yml,md,html,toml} .` (skip node_modules, dist) is a good start.

## Change
- Find the code path that produces a URL with `:8080`; write a failing unit test for it (TS: vitest next to the module;
  Go: `go test` if Go is installed (`go version`), otherwise a TS-side test for the client part and explain).
- Fix: build public URLs from the request's forwarded host/proto (`X-Forwarded-Host`, `X-Forwarded-Proto`) or a
  relative path, never from the listen port; or strip the internal port from a URL the client builds. Document any
  deploy variable in `docs/hosting.md` (a short section "Public URL / ports").
- If the cause is deploy config outside this repo, document it in `docs/hosting.md` and fix what the repo controls.

## Done when
- `npm test -w packages/profiler` and `npm test -w games/admin-profiler` pass (from the worktree root), plus
  `npm test -w packages/platform` if you touched it, and `go test ./...` in `packages/platform-server` if you touched Go
  and Go exists.
- Report: the root cause (file and line), the fix, and whether it is fully fixed in the repo or needs a deploy change.

## Out of scope
`games/gnome-theft-auto` and every other game.
