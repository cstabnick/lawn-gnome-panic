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
| Edit prefabs and how gear sits on a gnome (local tool, saves into the catalog) | `npm run prefab-editor` (port 5390) |
| Edit Gnomomia's terrain, roads, houses, props in 3D (local tool, saves into the level files) | `npm run level-editor` (port 5393) |
| End-to-end test of the level editor (real browser, saves into a throwaway copy) | `npm run e2e -w tools/level-editor` |
| Re-bake Gnomomia's walkability after changing zone data, stamps or deltas (the `build` fails when it is stale) | `npm run bake-walk -w games/gnomes-of-gnomomia` (check: `npm run check-bake -w ...`) |
| Local matchmaking server | `npm run dev -w packages/mp-server` (port 8787) |
| Local platform service (accounts) | `go run .` in `packages/platform-server` (port 8090 with `PORT=8090`; needs Postgres, see its README) |

## Games (`games/<name>/`)

Each is its own workspace: `index.html`, `vite.config.ts`, `src/main.ts`, `README.md`, often `CREDITS.md`, `demos/*.json`. Title = `index.html` `<title>`. "Slice" = has `src/minigames/` (keep `npm test` + `#minigame` working). Roadmaps are in `docs/roadmaps/<name>*.md`.

| Game | Title | Engine | Port | Online (`@lawn/mp`) | Slice | One line |
|---|---|---|---|---|---|---|
| `sample-dodge` | Sample Dodge | Phaser | 5173 | | | Reference prototype; template for `npm run new` |
| `sample-3d` | Lawn Gnome Panic | three | 5174 | yes (`lawn-gnome-panic`) | | 3D dodge mowers, collect acorns; battle royale (`src/br`) |
| `aether-board` | Aether Board | three | 5195 | | | Snowboard floating islands, tricks; `?mode=descent` roguelite, `?mode=flood` water-surge mode (experimental, `src/flood`) |
| `faster-than-lawn` | Faster Than Lawn | Phaser | 5181 | | | Real-time-with-pause mower crew battles |
| `giant-pup` | Giant Pup | three | 5196 | | | Pet sim: feed, bathe, fetch, tricks |
| `gnaft` | Gnaft | three | 5183 | yes | | Raft survival on a lawn-boat |
| `gnome-blackjack` | Gnome Blackjack | three | 5194 | yes | `bj-sprint` | Blackjack with bantering gnomes |
| `gnome-bowling` | Gnome Bowling | three | 5185* | yes | `bowl-frame` | Swipe-to-bowl ten-pin |
| `gnome-billiards` | Gnome Billiards | three | 5201 | yes (`gnome-billiards`) | | 3D 8-ball on the Gnomecino pool table: line up with a drag, then pull back and swipe through; tap the floor to walk your gnome, emotes, follow or table camera, spectate two CPUs; vs Big Lou, pass and play, or online (2). Physics and rules are pure (`src/physics.ts`, `src/rules.ts`), the aim geometry is `src/aim.ts` |
| `gnome-company` | Gnome Company: Chapel of Mulch | three | 5175* | own server (`npm run server`) | | Co-op scavenging horror |
| `gnome-creator` | Gnome Creator | three | 5186 | name filter only | | Make the player gnome every game shows |
| `water-flow` | Water Flow Demo | WebGPU (raw) | 5180* | | | Tech demo: GPU MLS-MPM water, four environments with sliders |
| `me` | Your Gnome (account page, `/me/`) | DOM only | 5199 | platform API | | Unlisted (`"lawn": {"unlisted": true}`): sign in with Keycloak, rename, sign out, delete |
| `gnome-front` | Gnome Front | three | 5182 | yes | | Conquest FPS with bots; e2e: `tools/gnome-front-mp-e2e.mjs` |
| `gnome-golf` | Gnome Golf | three | 5184 | yes | `golf-hole` | 9-hole island golf, swing meter |
| `cooking-gnoma` | Cooking Gnoma | Phaser | 5200 | | | Cooking Mama-style: an acorn-flour cake with grass frosting in five steps (scoop, stir, pour, bake, frost); phone portrait and landscape |
| `gnome-jam` | GBA GJAM | three | 5201 | | | 2-on-2 NBA Jam-style arcade basketball in the indoor Gnomerena: 8 pro teams, custom gnome creator, AI teammate/opponent + 2P local, season & Top-6 knockout tournament (top 2 bye), fun dunk animations |
| `gnome-party` | Gnome Party | three | 5191 | yes | host | Board party; auto-collects every game's slices |
| `club-gnome` | Club Gnome | three | 5197 | yes (`club-gnome`) | | Club Penguin-style hub: walk, chat, buildings open other games in a frame; Gnomecino = blackjack |
| `gnome-theft-auto` | Gnome Theft Auto | three | 5198 | yes (`gnome-theft-auto`) | | Open-world crime parody on a 1200x1200 map: Turfton city grid with towers plus desert (Fort Sandpit, airfield, Crop Duster plane), forest, tundra and farmland biomes; real guns (hitscan from the crosshair), parachutes, Hat Watch heat, Whirligig. Plan: docs/roadmaps/gnome-theft-auto-expansion/. `?drive=sim` (offline POC) drives the ground mowers with `@lawn/vehicle`. Ragdoll gnomes (`src/ragdoll.ts`, verlet skeleton): mowers and gun hits fling pedestrians; demo `demos/ragdoll.json` (`?mount&herd&offline`) |
| `gnome-sweet-gnome` | Gnome Sweet Gnome | Phaser | 5180 | | | Match-3, 60 levels, 3 homes to make over (`npm run assess`/`tune`) |
| `gnomeokemon` | Gnomokemon Snap & Gnomokedex | three | 5392 | | | Full-screen photo safari. The title screen is the Fescue Field Lab, a closed two-storey house on a raised plinth with bay windows, a columned porch, a cross-gabled attic room and a city around it (`src/lab/`, `city.ts` is the scenery: street, mowers, neighbours, skyline). Playing walks the camera (a gnome on a gnome's shoulders holding a camera; `src/lab/photographer.ts`) in through the front door, between rooms through the doorways and up the lobby stairs: Map Room, Lobby, Archive downstairs; Dressing Room (standing mirror cheated with a render target, Options panel in `src/screens/options.ts`, settings in `src/settings.ts`), Grading Office, Darkroom upstairs. Menus are docked 2D panels (`src/app.ts`, `src/screens/`); the ride (`src/snap/game.ts`) is full-screen with mouse capture. Gnome Jesus's grading: slow reveal with a spoken (`@lawn/mutter`) quip per photo; his lines, including per-creature `SPECIES_LINES`, are in `src/snap/jesus.ts` (players add their own in the Gnomokedex). `?mode=snap&course=desert` jumps to a ride; `?mode=` with `hall`, `map`, `archive`, `darkroom`, `options` or `office` (`&fake=4` grades made-up photos) to a room (default `title`). Demos: `demos/field-lab.json`, `demos/options.json`, `demos/grading.json` |
| `gnomes-of-gnomomia` | Gnomes of Gnomomia | three | 5291 | yes (`gnomomia`) | | Click-to-move RPG; biggest game; `lint:content`, `sim` |
| `gnomylpics` | Gnomylpics | three | 5192* | | 6 `oly-*` | **Party-only**: not on the landing page |
| `incregnomtal` | Incregnomtal | Phaser | 5197 | | | One-hour lawn incremental: problem chain, Biscuit, Mulch skill tree, `npm run sim` |
| `lawn-prix` | Lawn Prix | three | 5193 | | `prix-race` | Mower kart racing vs CPUs, plus ghost Time Trial (`src/ghost.ts`, `GhostStore`) |
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
| `mutter` | The Gnome Blackjack "mutter" voice as a package: `createMutter({ gain })`, `say(text, hz)` returns the line's duration. Used by Gnomokemon Snap's Gnome Jesus. Blackjack and Paragnormal still carry copies | `packages/mutter/README.md` |
| `cloudsave` | Cloud saves for signed-in players: `createCloudSlot` mirrors one localStorage save to the platform's SaveService (`choose` or `merge` mode). Used by Gnomomia, Gnome Sweet Gnome, Gnomokemon Snap, achievements | `packages/cloudsave/README.md` |
| `gnome` | Player gnome: profile store, look code, model; every game with a player character wears it (gear overrides in the README) | `README.md` |
| `prefabs` | ~190 primitive-built 3D items/gear/props, icons, drops, emoji lookup | `README.md`, `src/catalog/` |
| `music` | Tone.js synthesized music and foley, per-game themes (Gnome Sweet Gnome: garden lullaby; Club Gnome: area music; Gnome Front: fanfare-march menu and jungle-march battle) | `README.md` |
| `achievements` | Achievement registry, unlock store, toast UI; new games add achievements + gear rewards (README checklist) | `README.md` |
| `emotes` | Animated gnome emotes (pose functions), `createEmotePlayer`, 4-slot loadout; unlocked by achievements (`AchievementDef.emote`). Club Gnome plays them, Gnome Creator equips them | `packages/emotes/README.md` |
| `level` | Level documents for the 3D games (Gnomomia, Club Gnome, Gnome Front, Gnome Golf use them): JSON format, stamps, brush-edit height deltas, baked walk grid, validators. Gnomomia is the first user | `README.md` |
| `vehicle` | Scalable vehicle handling (raycast chassis, Pacejka tyres, input conditioning, assists, direct-drive or geared drivetrain; presets simcade, hybrid, casual). Pure maths. First user: Gnome Theft Auto `?drive=sim` | `README.md` |
| `volume` | Shared volume store + UI | `src/index.ts` |

## Docs

| File | When to read |
|---|---|
| `docs/stack.md` | Picking an engine/library (Phaser default, three for 3D, Unity rules) |
| `docs/assets.md` | Adding any external asset (CC0 only, `CREDITS.md` line) |
| `docs/demos.md` | Writing `demos/*.json`, recording, embedding in a PR |
| `docs/hosting.md` | Site + matchmaking server deploys (whale-net cluster at gnome.whalenet.app) |
| `docs/roadmaps/<plan>.md` + `<plan>/` | Plans from the decompose skill; subfolder holds per-issue files |
| `docs/roadmaps/level-format.md` | The level format + editor plan (what is built, what is later: Front, Golf, Club Gnome) |
| `docs/design/` | Design notes: driving physics research (`driving-physics-research.md`), achievements, multiplayer royale, weapons, Gnomomia world, gnome platform (accounts + inventory) |
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
| `level-editor/` | Local 3D level editor for Gnomomia, Club Gnome, Gnome Front and Gnome Golf (one `GameAdapter` each): terrain brushes, paint, roads, houses, props, flags, holes, cover rules, walkability, re-bake; saves each game's `src/data/levels/*`. [README](tools/level-editor/README.md) |
| `prefab-editor/` | Local prefab and gear-fit editor (npm workspace, `npm run prefab-editor`); writes `packages/prefabs/src/catalog/*.ts`, `EQUIP_ANCHORS`, and `review.json` notes. [README](tools/prefab-editor/README.md) |

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
- **Gnomomia's walk bake**: `src/data/levels/walk.bake.json` is generated. Changing zone data (`data/levels/*.level.json`), `world.deltas.json`, flora/collider code or `WORLD`/`TUNING` makes `npm run build -w games/gnomes-of-gnomomia` fail until you re-run `npm run bake-walk -w games/gnomes-of-gnomomia`. The editor's Analyze tab re-bakes too.
- **Level data is JSON now** in `src/data/levels/` of `gnomes-of-gnomomia`, `club-gnome` (`<map>.level.json`), `gnome-front` (`arena.level.json`) and `gnome-golf` (`island.level.json`). Each game has a `*.golden.test.ts` (or `terrain.golden.test.ts`) pinning the original data: do not regenerate those fixtures for a refactor.
- **Gnomomia zones are JSON now**: edit `src/data/levels/<zone>.level.json` (or use the level editor), not `src/data/zones/<zone>.ts` (a one-line loader).
- **Don't touch other games** than the one you were asked about.
- **Mobile is required**: touch for every action, 44 px targets, check 390x844 as well as desktop.
