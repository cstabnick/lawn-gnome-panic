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
| Find z-fighting (surfaces flickering through each other) in a running three.js game | `npm run zfight -- <url>` ([docs/rendering.md](docs/rendering.md)) |
| Record a demo / embed in a PR | `npm run demo -- <demo.json> [--gif] [--pr <n>]` ([docs/demos.md](docs/demos.md)) |
| Build the whole arcade site into `site/` | `npm run site` (what CI runs) |
| Edit prefabs and how gear sits on a gnome (local tool, saves into the catalog) | `npm run prefab-editor` (port 5390) |
| Edit Gnomomia's terrain, roads, houses, props in 3D (local tool, saves into the level files) | `npm run level-editor` (port 5393) |
| End-to-end test of the level editor (real browser, saves into a throwaway copy) | `npm run e2e -w tools/level-editor` |
| Drive the level editor from an agent or script (`window.le`: commands as undo steps, JSON queries, `le.problems()`) | [tools/level-editor/README.md#agent-api-windowle](tools/level-editor/README.md#agent-api-windowle) |
| Re-bake Gnomomia's walkability after changing zone data, stamps or deltas (the `build` fails when it is stale) | `npm run bake-walk -w games/gnomes-of-gnomomia` (check: `npm run check-bake -w ...`) |
| Check Gnomomia's XP / coin / skill pacing after changing `src/data/economy.ts`, prices or gates (exit 1 on any flag) | `npm run sim:economy -w games/gnomes-of-gnomomia -- --check` (also runs the player variants; add `--cap=70` for the level-70 projection, `--levels` for a per-level table; [docs/design/gnomomia/economy.md](docs/design/gnomomia/economy.md)) |
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
| `admin-profiler` | Hitch Profiler viewer (`/admin/profiler/`) | DOM + canvas | 5205 | platform API | | Unlisted, own path (`"lawn": {"path": "admin/profiler"}`), sign-in required; `?demo` for made-up data. Time series, sessions, session timeline, frame Gantt of `@lawn/profiler` uploads |
| `gnome-front` | Gnome Front | three | 5182 | yes | | Conquest FPS with bots; e2e: `tools/gnome-front-mp-e2e.mjs` |
| `gnome-golf` | Gnome Golf | three | 5184 | yes | `golf-hole` | 9-hole island golf, swing meter |
| `cooking-gnoma` | Cooking Gnoma | Phaser | 5200 | | | Cooking Mama-style: an acorn-flour cake with grass frosting in five steps (scoop, stir, pour, bake, frost); phone portrait and landscape |
| `gba-gjam` | GBA GJAM | three | 5201 | yes (`gba-gjam`) | | 2-on-2 NBA Jam-style arcade basketball in the indoor Gnomerena: 8 pro teams, custom gnome creator with 0-100 stat progression, AI teammate/opponent + 2P local + online 1v1, season & Top-6 knockout tournament (top 2 bye), fun dunk animations; bot fun-metrics scorecard + CRN sweep (`npm run eval:scorecard` / `eval:sweep -w games/gba-gjam`, see `ai/RESEARCH_ROUND_4.md`) |
| `wordle-gnome` | Wordle (the answer is gnome) | DOM | 5173* | | | Literally Wordle, but the only answer is GNOME; single-player |
| `gnome-party` | Gnome Party | three | 5191 | yes | host | Board party; auto-collects every game's slices |
| `club-gnome` | Club Gnome | three | 5197 | yes (`club-gnome`) | | Club Penguin-style hub: walk, chat, every listed game opens from a spot in a frame (coverage.test.ts enforces it); Gnomecino = blackjack; town traffic + court ball in ambient.ts |
| `gnome-theft-auto` | Gnome Theft Auto | three | 5198 | yes (`gnome-theft-auto`) | `gta-getaway` | Open-world crime parody on an 1800x1800 map, stored as one level document per region (`src/data/levels/*.level.json`, each with its border polygon in `data.border`, placed by `src/data/world.layout.json`, loaded by `src/levels.ts` with `regionAt(x, z)` and the reserved river course `waterPaths()`, pinned by `src/layout.golden.test.ts`); ground height from `src/terrain.ts` (`heightAt`/`normalAt`/`terrainProbe`, `TERRAIN.amplitude` 1, `?terrain=0` flattens, `?terrain=hill` shows a test hill) with the chunked ground mesh in `src/terrainMesh.ts`, region landforms in `src/landforms/` (one generator per region, numbers in each document's `data.terrain`; the north-to-south tilt) and terrain paint in `src/terrainPaint.ts` (rock, dirt trails `trail/...`, mud, ice, gravel), water in `src/water.ts` (river, canal, Loch Moss, Puddle Sea carved into the grid by one hook in terrain.ts; `waterAt`/`bedAt`, bridge decks in `heightAt`; `WATER` in config.ts; `setTerrainOptions({ water: false })` for the dry world) drawn by `src/waterMesh.ts`, with `src/waterworks.ts` (bridges, docks, locks, weir, moored boats), boats (`src/boats.ts` hull physics, `src/wake.ts`, `src/boatTraffic.ts` NPC boats and the HOA patrol boat; five boats relayed online like mowers) and `src/swim.ts` (gnomes bob, mowers sink): Turfton city grid with towers plus desert (Fort Sandpit, airfield, Crop Duster plane), forest, tundra and farmland biomes, and Loch Moss (Tessie the giant turtle, `src/tessie.ts`, side quest `sq-tessie`) and Tallgrass Commons; 5-chapter story campaign (`src/quests/chapter1.ts`–`chapter5.ts`), 11 Strangers & Freaks side quests (`sideQuests.ts`), speaking cutscenes + `@lawn/cloudsave`, corporate brands & billboards (`src/brands.ts`), Acorns/Kiln-Debt economy (`src/economy.ts`), Pay 'n' Glaze & Side-Valve tuning garages (`src/garages.ts`), 4-Hat HOA Code-Enforcement Van escalation, expanded garden-scale arsenal & special vehicles (`lowrider`, `boot-float`, `snail-coach`, `mulch-spreader`, `hoa-van`), public world events (`src/worldEvents.ts`), Turfton FM radio (`src/radio/`), wildlife (`src/critters.ts` runtime, one `RegionLife` per region in `src/critters/`: Cloverfield herds, the Drey Gang, Frostbite Fells snowmen, sgnowmes and polar bears, Tallgrass Commons giant grass and bees; local per browser), Mounting (`src/mount.ts`: an animated walk, climb or door sequence to get in, out or yank a driver out, with `MOUNT_STYLES` in `config.ts`; closed vehicles set `openTop: false` and `doors`; demo stage `?mountdemo=ride-on|van|yank`, demos `demos/mount-*.json`), Experimental save export/import/reset in Options (`src/saveIO.ts`), and `gta-getaway` party slice (`src/minigames/`), demos in `demos/` (boat river run, Drey Gang raid, Tessie surfacing, hills drive). Plan: `docs/roadmaps/gnome-theft-auto-story-world.md` |
| `gnome-sweet-gnome` | Gnome Sweet Gnome | Phaser | 5180 | | | Match-3, 60 levels, 3 homes to make over (`npm run assess`/`tune`) |
| `gnomeokemon` | Gnomokemon Snap & Gnomokedex | three | 5392 | | | Full-screen photo safari. The title screen is the Fescue Field Lab, a closed two-storey house on a raised plinth with bay windows, a columned porch, a cross-gabled attic room and a city around it (`src/lab/`, `city.ts` is the scenery: street, mowers, neighbours, skyline). Playing walks the camera (a gnome on a gnome's shoulders holding a camera; `src/lab/photographer.ts`) in through the front door, between rooms through the doorways and up the lobby stairs: Map Room, Lobby, Archive downstairs; Dressing Room (standing mirror cheated with a render target, Options panel in `src/screens/options.ts`, settings in `src/settings.ts`), Grading Office, Darkroom upstairs. Menus are docked 2D panels (`src/app.ts`, `src/screens/`), each opening with the shared `paneHead` header (`src/ui.ts`); the top bar's room orbs walk between rooms (keys 1-5 too); the ride (`src/snap/game.ts`) is full-screen with mouse capture. Gnome Jesus's grading: slow reveal with a spoken (`@lawn/mutter`) quip per photo; his lines, including per-creature `SPECIES_LINES`, are in `src/snap/jesus.ts` (players add their own in the Gnomokedex). `?mode=snap&course=desert` jumps to a ride; `?mode=` with `hall`, `map`, `archive`, `darkroom`, `options` or `office` (`&fake=4` grades made-up photos) to a room (default `title`). Courses are level documents (`src/data/levels/<course>.level.json`): the rail (a `road` path with a lift per point), terrain stamps, roam zones, cover and creatures, plus set pieces: ponds and lava (`pond`), islands, platforms, walls (`wall` paths with a style), toy and lore props, and the `cave` / `city` flags. `src/snap/levels.ts` reads them; `src/snap/set-pieces.ts` builds the water, lava, walls, cave roof and Turfton street. Creatures can bob on water (`bob`) and play near a toy (a small zone). Tunnels: the lawn only. Demos: `demos/field-lab.json`, `demos/options.json`, `demos/grading.json`, `demos/room-orbs.json` |
| `gnomes-of-gnomomia` | Gnomes of Gnomomia | three | 5291 | yes (`gnomomia`) | | Click-to-move RPG; biggest game; `lint:content`, `sim`, `sim:economy`, `sim:town` (town walks: `src/towns.ts`, `src/sim/townWalk.ts`, `?townwalk=<town>`). Plans: `docs/roadmaps/gnomomia-town-walk.md`, `docs/roadmaps/gnomomia-economy-scaling.md` |
| `gnomillion` | Once in a Gnomillion | DOM | 5173* | yes (`gnomillion`) | | Slow multiplayer rarity-trivia: everyone names an answer to a prompt, rarer answers score more (plankton to One in a Gnomillion). The host browser owns the room (saved to localStorage); guests queue answers offline. Engine is pure (`src/engine.ts`), net in `src/net/`, plan: `docs/roadmaps/gnomillion.md` |
| `gnomylpics` | Gnomylpics | three | 5192* | | 6 `oly-*` | **Party-only**: not on the landing page |
| `incregnomtal` | Incregnomtal | Phaser | 5197 | | | One-hour lawn incremental: problem chain, Biscuit, Mulch skill tree, `npm run sim` |
| `lawn-prix` | Lawn Prix | three | 5193 | | `prix-race` | Mower kart racing vs CPUs, plus ghost Time Trial (`src/ghost.ts`, `GhostStore`). Experimental `?drive=sim` / garage SIM toggle: every kart on `@lawn/vehicle` (`src/simDrive.ts`), races only |
| `mower-chain` | Mower Chain | Phaser | 5190 | yes | | Snake.io with mowers |
| `music-room` | Music Room | DOM/Web Audio | 5192* | yes | | Multiplayer jam room |
| `paragnormal` | Paragnormal | three | 5185* | | | First-person gnome horror |
| `peak-climb` | Mt. Gnome | three | 5175* | | | Co-op procedural climbing |
| `prefab-gallery` | Prefab Gallery | three | 5391 | | | Browse every `@lawn/prefabs` item |
| `snigms` | Snigms | three | 5203 | | | Gnome life sim: build a house wall by wall, furnish it, keep one gnome fed and rested, send it to work for acorns. A town on the Town Square (a level document, edited in the level editor, `?game=snigms`) with four neighbours on routines; the gnome goes out for evenings, chats, and has a temper of its own (suggestions can be refused; a crash-out ignores them all) |
| `gnome-set-radio` | Gnom Set Radio | three | 5204 | | | Cel-shaded inline rollerblade action-music game across the Broadcast Archipelago (`the-aether` × Turfton pirate radio): 10 reactive `@lawn/music` tracks + Music Explorer, `@lawn/vehicle` simulated-arcade carving + double jump, Aether-style speed trails & sick trick pop-ups, regional GLSL skyboxes, freeform surface graffiti (3 variations/region), Regional Helper Gnomes, and all 9 playable levels (`velvet-keys` through `zero-hz-zenith`) |
| `nothing-left-to-collect` | Nothing Left to Collect | three | 5205 | | `hoard-rush` | Four-chapter, ~19-minute satirical mega-collectathon in the Annex office by Club Gnome's square: a secretary's "Hello.", Floors 1, 2, 2½ and ∞ of escalating collectibles, fake achievements and a drifting narrator, the Pointlessness, then "I'm not taking the job" and a flight to Shellshore, the beach planet. Chapters are scripts on one API (`src/director.ts` implements `ChapterCtx`; `src/chapters/*.ts`); collecting is pure (`src/collect.ts`); three `@lawn/music` themes (`fcHoldMusic`, `fcSynergyLoop`, `fcShellshore`); 8 easter eggs; `?chapter=<id>`, `?fast`, `window.fc`. Plan: `docs/roadmaps/nothing-left-to-collect.md` |

\* Port shared with another game (bowling/paragnormal, company/peak-climb, gnomylpics/music-room, gnomillion/sample-dodge). Vite moves to the next free port: read the real one from the dev server output.

Online game IDs are the keys of `GAMES` in `packages/mp/src/protocol.ts`; a new online game adds itself there.

## Packages (`packages/`, shared code, `@lawn/<name>`)

| Package | What | Read first |
|---|---|---|
| `party` | Party-slice contract, runner (CPUs, net sync, countdown), input pad, contract test, `template/minigame.ts` | `packages/party/README.md` (size rules + **slice backlog**) |
| `mp` | Client, protocol, `GAMES` table, interpolation, text filter, hidden-tab timers (`@lawn/mp/background`) | `packages/mp/README.md` |
| `gamepad` | Which pad a game reads: `firstPad()` / `getPads()` (standard mapping first, any pad as fallback) plus the 2026 Steam Controller over WebHID (browsers list it as mouse + keyboard, never as a gamepad), `mountSteamConnect(ui)` button. Used by gnome-theft-auto, lawn-prix, aether-board, sample-3d | `packages/gamepad/README.md` |
| `mp-server` | The one matchmaking + relay server (Node, port 8787); image built by `.github/workflows/server.yml` | `src/index.ts`, `src/matchmaker.ts` |
| `platform` | Browser side of accounts: Keycloak sign-in (oidc-client-ts), generated `UserService` Connect client; `session.ts` is the only part games load up front | `packages/platform/README.md` |
| `platform-server` | Player accounts + cloud saves service (Go, Connect, Postgres); image built by `.github/workflows/platform.yml`; `npm test -w packages/platform-server` runs `go test` | `packages/platform-server/README.md` |
| `mutter` | The Gnome Blackjack "mutter" voice as a package: `createMutter({ gain })`, `say(text, hz)` returns the line's duration. Used by Gnomokemon Snap's Gnome Jesus. Blackjack and Paragnormal still carry copies | `packages/mutter/README.md` |
| `cloudsave` | Cloud saves for signed-in players: `createCloudSlot` mirrors one localStorage save to the platform's SaveService (`choose` or `merge` mode). Used by Gnomomia, Gnome Sweet Gnome, Gnomokemon Snap, achievements | `packages/cloudsave/README.md` |
| `gnome` | Player gnome: profile store, look code, model; every game with a player character wears it (gear overrides in the README) | `README.md` |
| `prefabs` | ~190 primitive-built 3D items/gear/props, icons, drops, emoji lookup | `README.md`, `src/catalog/` |
| `music` | Tone.js synthesized music and foley, per-game themes (Gnome Sweet Gnome: garden lullaby; Club Gnome: area music; Gnome Front: fanfare-march menu and jungle-march battle; Nothing Left to Collect: Hold Music, Synergy Loop, Shellshore) | `README.md` |
| `achievements` | Achievement registry, unlock store, toast UI; new games add achievements + gear rewards (README checklist) | `README.md` |
| `emotes` | Animated gnome emotes (pose functions), `createEmotePlayer`, 4-slot loadout; unlocked by achievements (`AchievementDef.emote`). Club Gnome plays them, Gnome Creator equips them | `packages/emotes/README.md` |
| `level` | Level documents for the 3D games (Gnomomia, Club Gnome, Gnome Front, Gnome Golf use them): JSON format, stamps, brush-edit height deltas, baked walk grid, validators. Gnomomia is the first user; Gnomokemon Snap is the second (its seven courses in `games/gnomeokemon/src/data/levels/`, read by `src/snap/levels.ts`) | `README.md` |
| `vehicle` | Scalable vehicle handling (raycast chassis, Pacejka tyres, input conditioning, assists, direct-drive or geared drivetrain; presets simcade, hybrid, casual) plus a tuning layer of 11 named knobs with per-vehicle ranges (`tuning.ts`, what a tuning garage edits). Pure maths. Users: Gnome Theft Auto, Lawn Prix sim handling | `README.md` |
| `volume` | Shared volume store + UI | `src/index.ts` |
| `profiler` | Opt-in hitch profiler, off by default: `?profile[=ms][,upload][,keep]`; `timed` / `beginFrame` / `endFrame` / `measure`, long tasks, `__lawnProfile.summary()`; `upload` sends anonymous reports to the platform's `ProfileService` (viewer: `games/admin-profiler`). Used by Gnomomia | `README.md` |
| `depth` | Against z-fighting: `flatLayer(material, LAYER.road)` draw layers (polygon offset) for anything flat on the ground, and `auditCoplanar(scene)`, which finds coplanar overlaps (`npm run zfight` runs it on a live game). Used by Gnome Theft Auto, Gnomomia | `README.md`, `docs/rendering.md` |

## Docs

| File | When to read |
|---|---|
| `docs/stack.md` | Picking an engine/library (Phaser default, three for 3D, Unity rules) |
| `docs/assets.md` | Adding any external asset (CC0 only, `CREDITS.md` line) |
| `docs/cosmetics.md` | Inventory of every achievement cosmetic (gear and emotes), the one-achievement-per-item rule, RARE items, creator guidance |
| `docs/demos.md` | Writing `demos/*.json`, recording, embedding in a PR |
| `docs/rendering.md` | Laying anything flat on the ground or on another surface in a three.js game, or boxes that touch: z-fighting, draw layers, `npm run zfight` |
| `docs/hosting.md` | Site + matchmaking server deploys (whale-net cluster at gnome.whalenet.app) |
| `docs/roadmaps/<plan>.md` + `<plan>/` | Plans from the decompose skill; subfolder holds per-issue files |
| `docs/roadmaps/gnome-theft-auto-story-world.md` | Gnome Theft Auto 6-epic story, world, brands & side-quests build plan (31 parallel worker issues) |
| `docs/roadmaps/gnome-theft-auto-wild-world.md` | Gnome Theft Auto Wild World, 8 epics, done (issues in `gnome-theft-auto-wild-world/epic-1/` to `epic-8/`): world as level docs, terrain heights, 1800 m map, river/loch/boats, per-region landforms, wildlife, Tessie side quest, integration |
| `docs/roadmaps/gnomomia-town-walk.md` | Gnomomia town walking: the eight towns (`src/towns.ts`), the Bound-Peace (no enemy fights in town), walkable lanes with recorded blocks (`src/townBlocks.ts`), strolling companions, `sim:town` |
| `docs/roadmaps/gnomillion.md` | Once in a Gnomillion build plan (engine, host/guest net, UI, achievements) |
| `docs/roadmaps/nothing-left-to-collect.md` | Nothing Left to Collect design (chapters, eggs, soundtracks, achievements) and its 4-epic build plan |
| `docs/roadmaps/gnome-set-radio-regions.md` | Gnom Set Radio Regions 5–9 expansion roadmap (architecture, prefabs, writing beats; Regions 1–4 in `docs/design/gnome-set-radio/regions-architecture.md`) |
| `docs/roadmaps/level-format.md` | The level format + editor plan (what is built, what is later: Front, Golf, Club Gnome) |
| `docs/roadmaps/gnomomia-economy-scaling.md` | Gnomomia economy plan: economy sim, retune of XP/coins/skills, quest gates |
| `docs/design/gnomomia/economy.md` | Changing Gnomomia's XP, coin rewards, prices, skill growth or quest gates: the economy sim, its targets, the `ECONOMY` table in force, before/after |
| `docs/design/` | Design notes: driving physics research (`driving-physics-research.md`), achievements, multiplayer royale, weapons, Gnomomia world, Gnomokemon Snap world and lore (`gnomeokemon/`: origin, regions, temperaments), Gnome Theft Auto (`gnome-theft-auto/`), Gnom Set Radio (`gnome-set-radio/`: world, lore, regional architecture, cast & cutscenes), gnome platform (accounts + inventory), DayG (`dayg/`: zombie-gnome survival sim in the Mossgrave cemetery: world, regions, loot, havens, society, economy, evaluation bands, build process; persona reviews in `dayg/feedback/`) |
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
| `gta-perf.mjs` | Gnome Theft Auto phone-viewport frame-time and draw-call check, driving across every region (`node tools/gta-perf.mjs [url]`, dev server running) |
| `smoke.sh` | Headless console-error + DOM-marker check |
| `zfight.mjs` | Headless z-fighting audit of a running three.js game (`npm run zfight -- <url>`): coplanar overlaps that flicker inside the camera's range |
| `gnome-front-mp-e2e.mjs` | Two-page Gnome Front online test |
| `level-editor/` | Local 3D level editor for Gnomomia, Club Gnome, Gnome Front, Gnome Golf, Gnomokemon Snap, the Snigms town and Gnome Theft Auto's regions (one `GameAdapter` each): terrain brushes, paint, roads, houses, props, flags, holes, cover rules, walkability, re-bake, object and spawn markers, the details window, door and exit links, a Problems list, and `window.le` for agents (commands, queries, checks); saves each game's `src/data/levels/*`. [README](tools/level-editor/README.md) |
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
- **A small lift does not stop z-fighting**: 5 mm over the ground looks fine up close and flickers 90 m away. Flat things on flat things take a `@lawn/depth` draw layer; touching boxes must not share a face ([docs/rendering.md](docs/rendering.md)).
- **`#ui` is shared**: append your own container; never restyle or hide `#ui`.
- **Slices reuse game code**: refactor the game's function out of `main.ts`/`Ctx` once; never copy it into `src/minigames/`.
- **Gnome Party never edits games**: it globs `games/*/src/minigames/index.ts` (`games/gnome-party/src/minigames.ts`).
- **Gnomomia's walk bake**: `src/data/levels/walk.bake.json` is generated. Changing zone data (`data/levels/*.level.json`), `world.deltas.json`, flora/collider code or `WORLD`/`TUNING` makes `npm run build -w games/gnomes-of-gnomomia` fail until you re-run `npm run bake-walk -w games/gnomes-of-gnomomia`. The editor's Analyze tab re-bakes too.
- **Level data is JSON now** in `src/data/levels/` of `gnomes-of-gnomomia`, `club-gnome` (`<map>.level.json`), `gnome-front` (`arena.level.json`), `gnome-golf` (`island.level.json`) and `gnome-theft-auto` (`<region>.level.json`). Each game has a `*.golden.test.ts` (or `terrain.golden.test.ts`) pinning the original data: do not regenerate those fixtures for a refactor.
- **Gnomomia zones are JSON now**: edit `src/data/levels/<zone>.level.json` (or use the level editor), not `src/data/zones/<zone>.ts` (a one-line loader).
- **Don't touch other games** than the one you were asked about.
- **Mobile is required**: touch for every action, 44 px targets, check 390x844 as well as desktop.
