# Agent index

A map of the repo for agents: where things are, which command does what, and the traps. Read this instead of `ls`-ing around. Rules and priorities live in [AGENTS.md](AGENTS.md) (`CLAUDE.md` imports it) and [SOUL.md](SOUL.md); this file only points.

Keep it current: if you add, rename or delete a game, package, tool or doc, update its row here in the same PR.

## Commands

All from the repo root. `npm install` once (workspaces share one `node_modules`).

| Do | Command |
|---|---|
| Run a game | `npm run dev -w games/<name>` (port: see the games table) |
| Type-check + build a game (required before done) | `npm run build -w games/<name>` |
| Tests for a game / package | `npm test -w games/<name>` / `npm test -w packages/<name>` |
| New game (copies `sample-dodge`) | `npm run new -- <name> [--from <game>] [--party-only]` |
| New party slice | `npm run new-mini -- <game> <id>` |
| Smoke-check a running page | `bash tools/smoke.sh <url> <dom-id>...` (see traps) |
| Record a demo / embed in a PR | `npm run demo -- <demo.json> [--gif] [--pr <n>]` ([docs/demos.md](docs/demos.md)) |
| Build the whole arcade site into `site/` | `npm run site` (what CI runs) |
| Local matchmaking server | `npm run dev -w packages/mp-server` (port 8787) |
| Local platform service (accounts) | `go run .` in `packages/platform-server` (port 8090 with `PORT=8090`; needs Postgres, see its README) |

## Games (`games/<name>/`)

Each is its own workspace: `index.html`, `vite.config.ts`, `src/main.ts`, `README.md`, often `CREDITS.md`, `demos/*.json`. Title = `index.html` `<title>`. "Slice" = has `src/minigames/` (keep `npm test` + `#minigame` working). Roadmaps are in `docs/roadmaps/<name>*.md`.

| Game | Title | Engine | Port | Online (`@lawn/mp`) | Slice | One line |
|---|---|---|---|---|---|---|
| `sample-dodge` | Sample Dodge | Phaser | 5173 | | | Reference prototype; template for `npm run new` |
| `sample-3d` | Lawn Gnome Panic | three | 5174 | yes (`lawn-gnome-panic`) | | 3D dodge mowers, collect acorns; battle royale (`src/br`) |
| `aether-board` | Aether Board | three | 5195 | | | Snowboard floating islands, tricks |
| `faster-than-lawn` | Faster Than Lawn | Phaser | 5181 | | | Real-time-with-pause mower crew battles |
| `giant-pup` | Giant Pup | three | 5196 | | | Pet sim: feed, bathe, fetch, tricks |
| `gnaft` | Gnaft | three | 5183 | yes | | Raft survival on a lawn-boat |
| `gnome-blackjack` | Gnome Blackjack | three | 5194 | yes | `bj-sprint` | Blackjack with bantering gnomes |
| `gnome-bowling` | Gnome Bowling | three | 5185* | yes | `bowl-frame` | Swipe-to-bowl ten-pin |
| `gnome-company` | Gnome Company: Chapel of Mulch | three | 5175* | own server (`npm run server`) | | Co-op scavenging horror |
| `gnome-creator` | Gnome Creator | three | 5186 | name filter only | | Make the player gnome every game shows |
| `me` | Your Gnome (account page, `/me/`) | DOM only | 5199 | platform API | | Unlisted (`"lawn": {"unlisted": true}`): sign in with Keycloak, rename, sign out, delete |
| `gnome-front` | Gnome Front | three | 5182 | yes | | Conquest FPS with bots; e2e: `tools/gnome-front-mp-e2e.mjs` |
| `gnome-golf` | Gnome Golf | three | 5184 | yes | `golf-hole` | 9-hole island golf, swing meter |
| `gnome-party` | Gnome Party | three | 5191 | yes | host | Board party; auto-collects every game's slices |
| `gnome-sweet-gnome` | Gnome Sweet Gnome | Phaser | 5180 | | | Match-3, 60 levels, 3 homes to make over (`npm run assess`/`tune`) |
| `gnomeokemon` | Gnomokemon Snap & Gnomokedex | three | 5392 | | | 3D creature model viewer (prefabs) |
| `gnomes-of-gnomomia` | Gnomes of Gnomomia | three | 5291 | yes (`gnomomia`) | | Click-to-move RPG; biggest game; `lint:content`, `sim` |
| `gnomylpics` | Gnomylpics | three | 5192* | | 6 `oly-*` | **Party-only**: not on the landing page |
| `lawn-prix` | Lawn Prix | three | 5193 | | `prix-race` | Mower kart racing vs CPUs |
| `mower-chain` | Mower Chain | Phaser | 5190 | yes | | Snake.io with mowers |
| `music-room` | Music Room | DOM/Web Audio | 5192* | yes | | Multiplayer jam room |
| `paragnormal` | Paragnormal | three | 5185* | | | First-person gnome horror |
| `peak-climb` | Mt. Gnome | three | 5175* | | | Co-op procedural climbing |
| `prefab-gallery` | Prefab Gallery | three | 5391 | | | Browse every `@lawn/prefabs` item |

\* Port shared with another game (bowling/paragnormal, company/peak-climb, gnomylpics/music-room). Vite moves to the next free port: read the real one from the dev server output.

Online game IDs are the keys of `GAMES` in `packages/mp/src/protocol.ts`; a new online game adds itself there.

## Packages (`packages/`, shared code, `@lawn/<name>`)

| Package | What | Read first |
|---|---|---|
| `party` | Party-slice contract, runner (CPUs, net sync, countdown), input pad, contract test, `template/minigame.ts` | `packages/party/README.md` (size rules + **slice backlog**) |
| `mp` | Client, protocol, `GAMES` table, interpolation, text filter, hidden-tab timers (`@lawn/mp/background`) | `packages/mp/README.md` |
| `mp-server` | The one matchmaking + relay server (Node, port 8787); image built by `.github/workflows/server.yml` | `src/index.ts`, `src/matchmaker.ts` |
| `platform` | Browser side of accounts: Keycloak sign-in (oidc-client-ts), generated `UserService` Connect client; `session.ts` is the only part games load up front | `packages/platform/README.md` |
| `platform-server` | Player accounts + cloud saves service (Go, Connect, Postgres); image built by `.github/workflows/platform.yml`; `npm test -w packages/platform-server` runs `go test` | `packages/platform-server/README.md` |
| `cloudsave` | Cloud saves for signed-in players: `createCloudSlot` mirrors one localStorage save to the platform's SaveService (`choose` or `merge` mode). Used by Gnomomia, Gnome Sweet Gnome, Gnomokemon Snap, achievements | `packages/cloudsave/README.md` |
| `gnome` | Player gnome: profile store, look code, model; every game with a player character wears it (gear overrides in the README) | `README.md` |
| `prefabs` | ~190 primitive-built 3D items/gear/props, icons, drops, emoji lookup | `README.md`, `src/catalog/` |
| `music` | Tone.js synthesized music and foley, per-game themes (Gnome Sweet Gnome: garden lullaby) | `README.md` |
| `achievements` | Achievement registry, unlock store, toast UI; new games add achievements + gear rewards (README checklist) | `README.md` |
| `volume` | Shared volume store + UI | `src/index.ts` |

## Docs

| File | When to read |
|---|---|
| `docs/stack.md` | Picking an engine/library (Phaser default, three for 3D, Unity rules) |
| `docs/assets.md` | Adding any external asset (CC0 only, `CREDITS.md` line) |
| `docs/demos.md` | Writing `demos/*.json`, recording, embedding in a PR |
| `docs/hosting.md` | Site + matchmaking server deploys (whale-net cluster at gnome.whalenet.app) |
| `docs/roadmaps/<plan>.md` + `<plan>/` | Plans from the decompose skill; subfolder holds per-issue files |
| `docs/design/` | Design notes: achievements, multiplayer royale, weapons, Gnomomia world, gnome platform (accounts + inventory) |
| `proto/` | Protobuf API of the platform service (`buf.gen.yaml` regenerates Go + TS; generated code is checked in) |

## Read on demand (guides loaded only when the task needs them)

Not every task touches these; open the file only when the condition applies.

| When you are working with | Follow |
|---|---|
| Gear sync: other players seeing a customized gnome or its gear online (rosters, seats, `resolveLook` / `prefetchLooks`, `PlayerInfo.userId`, the `gnome` or `mp` packages) | [docs/gear-sync.md](docs/gear-sync.md) |

## Agent tooling

- `.claude/skills/decompose/SKILL.md`: planning skill (epics of parallel issues).
- `.claude/agents/haiku-worker.md`: worker agent; `prompts/worker.md`: worker prompt. Workers never commit.
- `.claude/settings.json`: project permissions.

## Tools (`tools/`)

| File | Does |
|---|---|
| `new-game.mjs` | Scaffold a game (`npm run new`) |
| `new-minigame.mjs` | Scaffold a slice from `packages/party/template/minigame.ts` (`npm run new-mini`) |
| `build-site.mjs` | Build all games + landing page into `site/` (`npm run site`) |
| `thumbnails.cjs` | 480x270 `thumbnail.jpg` per game for the landing page |
| `record-demo.mjs` | Scripted MP4/GIF demos (`npm run demo`) |
| `smoke.sh` | Headless console-error + DOM-marker check |
| `gnome-front-mp-e2e.mjs` | Two-page Gnome Front online test |

## Deploy and CI

- `.github/workflows/ci.yml`: `npm ci` + `npm run site` (builds every game) on PRs.
- `.github/workflows/pages.yml`: deploys `site/` to GitHub Pages (with `VITE_MP_URL` and `VITE_PLATFORM_URL` pointing at gnome.whalenet.app).
- `.github/workflows/server.yml`: tests and publishes the mp-server image.
- `.github/workflows/platform.yml`: tests (with Postgres) and publishes the platform service image.
- `deploy/`: `site.Dockerfile` + `nginx.conf` + `otel-logging.sh` (JSON access log when `ENABLE_OTEL_LOGGING` is on) for the cluster site image. Structured logs, OTEL log export, tracing and metrics for all three images: `docs/hosting.md` > Logging, tracing and metrics. Cluster manifests live in the separate `whale-net/argok8s` repo (`services/lawn-gnome-panic/`).

## Traps

- **Smoke test off Windows**: `tools/smoke.sh` defaults to the Windows Edge path. On Linux/cloud run `EDGE=/opt/pw-browsers/chromium bash tools/smoke.sh ...` (it adds `--no-sandbox` when run as root).
- **tsc passing is not "works"**: run the smoke check with the dev server up; a module that hid all UI once passed every type-check.
- **`#ui` is shared**: append your own container; never restyle or hide `#ui`.
- **Slices reuse game code**: refactor the game's function out of `main.ts`/`Ctx` once; never copy it into `src/minigames/`.
- **Gnome Party never edits games**: it globs `games/*/src/minigames/index.ts` (`games/gnome-party/src/minigames.ts`).
- **Don't touch other games** than the one you were asked about.
- **Mobile is required**: touch for every action, 44 px targets, check 390x844 as well as desktop.
