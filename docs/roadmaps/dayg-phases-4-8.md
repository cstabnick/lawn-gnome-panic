# DayG roadmap, phases 4 to 8: talk and quests, online, the whole map, depth, live

Design: `docs/design/dayg/` (process, society, quests, multiplayer, havens, hatless, simulation-lod, regions, world,
survival, crafting, items, loot, economy, history, evaluation, feedback/RESPONSE). Built so far: `docs/roadmaps/dayg.md`
(phases 1, 2-lite, 3). Setting `apocrypha` (R-039). Game folder `games/dayg` (three.js), dev port **5206**.

## 1. Goal

DayG's simulation already runs a world without the player; this plan makes the player matter to it and lets friends
share it. Players talk to NPCs through verbs that move a trust ledger, take quests that the simulation posts on notice
boards from real needs, join factions and climb their ranks, and see the world change because of what they did; up to
16 players share one room hosted in a browser, with cloud room saves so any member can reopen it. The map grows from the
12-region slice to all 61 regions of Mossgrave at blockout level, deep systems (building, farming, crafting, traps,
skills and lineage, storylets, the Mowing) are added, and code hooks for live telemetry and a real-vs-sim report close
the loop.

### In scope (process.md phases 4 to 8)

- **Phase 4, talk and quests**: trust ledger and rumours, factions (founders, power, havens, ranks), 11 talk verbs with
  a phrase bank, quest templates and notice boards, the newcomer board at the Waystation, reputation and standing,
  joining a faction, bot players, consequence-reach and quest-variety bands, the playtest question.
- **Phase 5, online**: `dayg` in `GAMES` (room code only), a sim host that can run in a Web Worker, host-sequenced
  actions with a deterministic L2 lockstep (every member runs the same pure sim; the host orders actions and ticks),
  interest management for the L0 traffic (poses, Hatless, news), snapshots, host hand-off with hash checks, remote
  gnomes, room saves on the platform (new `RoomSaveService`, 8 MiB in 512 KiB parts) and the room client in
  `@lawn/cloudsave`, respawn, a 4-player headless hand-off test harness.
- **Phase 6, the whole map**: all 61 regions in the sim graph (`src/sim/regionsFull.ts`), the other ten districts'
  blockouts as data files (`src/world/districts/`), all seven havens, inner gates by stage, chunk streaming of the world
  meshes, the collider on the full map, `--map full` sweeps, performance bands (L2 tick time, snapshot size).
- **Phase 7, depth**: building pieces with HP under Hatless pressure, garden beds and crops, the crafting tree by
  station, traps (snares, noise lines, spike lines), skills with the XP curve and lineage, six storylets, the Mowing,
  grave lanterns and the chapel bell.
- **Phase 8, live**: four DayG telemetry events through the mp-server's existing anonymous telemetry endpoint, a
  `live-report` script that compares exported telemetry with sim runs of the same seeds, per-season tuning patches.
- Achievements for every phase, prefabs for every new object, lore entries and rulings for every new name.

### Decisions this plan makes

- **L2 lockstep.** The sim ticks once per sun-hour (5 real minutes), so every member runs the full pure sim on its own
  copy. The host sequences every sim-changing action (`SimAction` in an `ActionEnvelope`) and every tick, and sends the
  world hash with each tick. Hand-off is then exact (the new host already has the state), and a desync is a hash
  mismatch. Interest management filters the realtime L0 traffic, which is the heavy part. The cost: a guest's browser
  holds the whole world (a cheater could read it). Fine for friends' rooms; recorded in the PR.
- **Region bubbles.** Each region with a player in it is one L0 bubble with one owner (the first player in). The
  owner's browser runs that region's L0 Hatless and relays them to the others there; their hits go to the owner.
- **Map frame.** The slice keeps its coordinates. The full map is x -1800..2200, z -3480..520 (4 x 4 km of gnome
  metres, a blockout at a quarter of the design's 16 km; travel time is not tuned yet).
- **Acorns** live in the sim on `PlayerRecord.acorns` (counted by `acornTotal`), not as an inventory item.
- **Room pace and room modes** (Brisk / Standard / Slow; Full / Haven peace / Co-op) are chosen in the room panel and
  stored, but only Brisk and Co-op behaviour exists (players cannot hurt players; one world-day = one sun-day).
- **No L1 simulation** (agents on the zone graph at 1 Hz): the sim stays L2 plus L0 bubbles; the LOD-equivalence test
  is still out of scope.

### Out of scope

- PvP combat, the 20-second logout, caravans and outside traders, scrip, faction wars resolved by L1 tables, procedural
  interiors, `@lawn/level` documents (district blockouts stay TypeScript data, like the slice), the full-detail map,
  a Gnome Party slice (the `last-ladder` backlog row in `packages/party/README.md` stays "later": DayG rounds are not
  20-60 s rounds).

### What cannot be done from this repo

| Needs | Why | What this plan does instead |
|---|---|---|
| The playtests (12 people x 3 sessions, a third on phones) for phases 4 and 7 | needs real people | `PLAYTEST.md` gets the forms and the questions; the gate stays open until someone runs them |
| Live telemetry and the "within 20% of real worlds" gate (phase 8) | needs a deployed build with players | event hooks, the server's accepted event names, `scripts/live-report.mjs` tested on fixture logs; `sim/LIVE.md` says what to collect |
| A real 4-player hour on several devices, a phone host | needs devices on a network | `tools/dayg-mp-e2e.mjs` runs 4 headless Edge pages against a local mp-server and checks hashes through a hand-off |
| Room saves against the real platform | needs Keycloak and the deployed platform-server | Go tests on the memory and Postgres stores, the service with fake auth, cloudsave tests with fakes |
| Frame rate on a mid phone with 120 Hatless | needs a phone | desktop numbers plus the `?touch=1` phone viewport checks |

## 2. Shape

| Epic | Name | Done when | Issues |
|---|---|---|---|
| 5 | Foundation (planner-written, Step 0) | `npx tsc --noEmit -p games/dayg`, `npm run build -w games/dayg`, `npm test -w games/dayg`, `npm run sim -w games/dayg -- --seeds 2 --days 3` and `-- --seeds 1 --days 3 --map full`; smoke at `?seed=1` and `?seed=1&map=full` | 0 (planner) |
| 6 | Platform, mp, prefabs, lore, graph test | `go test ./...` in platform-server, `npm test -w packages/mp-server`, `npm test -w packages/prefabs`, `npx tsc --noEmit -p packages/platform`, `npm run lore`, `npm test -w games/dayg` | 11 |
| 7 | Sim systems, districts, room service, achievements catalog | build and all tests pass; `npm run sim -w games/dayg -- --seeds 3 --days 20` shows factions and quests; `?map=full` smoke and zfight pass; `npm test -w packages/cloudsave` and `-w packages/achievements` pass | 18 |
| 8 | Talk, boards, quests in play; the net runtime; streaming; scorecard | build and tests pass; a desktop and phone loop (talk, take a quest from a board, finish it, see standing change) works; two browser tabs share a room on a local mp-server; `npm run sim -w games/dayg -- --seeds 20 --days 60 --bots quester,solo` prints the new bands | 15 |
| 9 | Depth in play, live hooks, mp e2e | build and tests pass; build a wall, plant and harvest a bed, craft at a workbench, light lanterns, ring the bell; `node tools/dayg-mp-e2e.mjs --players 4 --minutes 5` passes | 11 |
| 10 | Tuning, phone pass, gates and docs | the gate commands in section 6 pass; PLAYTEST.md, README.md and sim/LIVE.md updated; PR open | 6 |

### Rounds

A round starts only after the previous round's end-of-round check passes (the planner runs it and fixes `main.ts`).

| Round | Epics | Issues (all parallel within the round) |
|---|---|---|
| 1 | 5 then 6 | Step 0 (planner) first; then 6.1 Room-save proto and codegen, 6.2 Room store (memory), 6.3 `dayg` in GAMES, 6.4 Prefabs: cemetery and talk, 6.5 Prefabs: building and traps, 6.6 Prefabs: materials, 6.7 Lore: Mossgrave and the Hatless, 6.8 Lore: Keepers, Sisters, Spades, 6.9 Lore: Holders, Greybearded, Truce, 6.10 Lore: Willow Folk, Shelf Wrights, the Mowing, 6.11 Full region graph test |
| 2 | 7 | 7.1 Trust and rumours, 7.2 Factions, 7.3 Quests and boards, 7.4 Talk verbs and phrases, 7.5 Actions and bubbles, 7.6 Snapshots and interest, 7.7 Bot players, 7.8 North districts, 7.9 Lawn and Drowned Corner, 7.10 Mausoleum Hill and the Shed, 7.11 Yew Walk and Gnome Garden, 7.12 Wreathwood and Compost, 7.13 Room store (Postgres), 7.14 RoomSaveService, 7.15 Cloudsave room client, 7.16 Achievements catalog, 7.17 Building and farming sim, 7.18 Mowing and storylets sim |
| 3 | 8 | 8.1 Talk panel, 8.2 Ledger panel, 8.3 Notice boards, 8.4 Quest runner, 8.5 Sim host and worker, 8.6 Net session, 8.7 Room panel, 8.8 Remote gnomes and Hatless authority, 8.9 Room saver, 8.10 Containers and feed through the host, 8.11 Chunk streaming, 8.12 Scorecard, bots and perf in the CLI, 8.13 Skills, 8.14 Respawn, 8.15 Achievements wiring A |
| 4 | 9 | 9.1 Building in play, 9.2 Farming and traps in play, 9.3 Crafting tree, 9.4 Lanterns, bell and Mowing effects, 9.5 Skills tab, 9.6 Telemetry event names, 9.7 Telemetry hooks, 9.8 Live vs sim report, 9.9 Seasonal tuning, 9.10 Achievements wiring B, 9.11 Multiplayer e2e harness |
| 5 | 10 | 10.1 Society and quest tuning, 10.2 Full-map tuning, 10.3 Depth tuning, 10.4 Phone pass A, 10.5 Phone pass B and HUD, 10.6 Playtest kit and docs |

### Dependencies that remain

- **Across rounds only.** Every round's issues depend only on earlier rounds and on the Step 0 stubs.
- **Bots before tuning (rounds 2-3 to 5).** The consequence-reach and quest-variety bands are measured with bot
  players (7.7) through the scorecard (8.12); a bot test in round 2 can only check determinism and movement, since the
  quests it plays are written in parallel.
- **Three tuning issues in round 5 move one shared simulation.** 10.1, 10.2 and 10.3 own separate tuning files, but
  their knobs interact; the planner reruns the 200-seed sweep after all three and may roll one back.
- **`main.ts` integration** surfaces cross-system bugs only at the end of each round, where the planner fixes it.
- **Codegen tools.** 6.1 needs `buf` (via npx), `protoc-gen-go` and `protoc-gen-connect-go` (both found in
  `C:\Users\cpsai\go\bin`) and `protoc-gen-es` (in `node_modules/.bin`). If codegen fails on the machine, 6.1 is the
  only issue blocked; 6.2 and every other round-1 issue still run.

## 3. Shared files and their owners

| File | Owner |
|---|---|
| `games/dayg/src/main.ts` | planner (Step 0 and every end-of-round fix). No worker edits it. |
| `games/dayg/package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `scripts/sim.mjs` | planner (Step 0); 9.8 adds `scripts/live-report.mjs` (new file only) |
| `src/sim/types.ts`, `src/sim/rng.ts`, `src/sim/regions.ts`, `src/sim/regionsFull.ts`, `src/sim/world.ts`, `src/sim/tuning.ts`, `src/config.ts`, `src/game/types.ts`, `src/game/bus.ts`, `src/world/types.ts`, `src/world/stamp.ts`, `src/world/fullMap.ts`, `src/world/districts.test.ts`, `src/items/defs.ts`, `src/items/defsDepth.ts`, `src/net/protocol.ts` | planner (Step 0). Workers read them, never edit them. |
| `src/sim/tuning.json` | planner; round 5: 10.2 |
| `src/sim/tuning.social.json` (sections `social`, `factions`, `quests`, `bots`) | planner; round 5: 10.1 |
| `src/sim/tuning.depth.json` (sections `build`, `farm`, `mowing`, `storylets`, `bell`, `seasonal`) | planner; round 5: 10.3 |
| `src/world/blockout.ts` | planner (Step 0: `checkMap` regions param); round 3: 8.3 (board spots); round 4: 9.4 (lantern and bell spots) |
| `src/world/collide.ts` | planner (Step 0: full-map options, `addBlock`, `removeBlock`) |
| `src/scene/hatless.ts` | planner (Step 0 stub methods); round 3: 8.8; round 4: 9.2 |
| `src/scene/npcActors.ts` | planner (Step 0 stub methods); round 3: 8.1 |
| `src/scene/worldBuilder.ts` | planner (Step 0: `update`, colours); round 3: 8.11 |
| `src/scene/containers.ts`, `src/game/simFeed.ts` | round 3: 8.10 |
| `src/ui/ledgerPanel.ts` | round 3: 8.2; round 4: 9.5; round 5: 10.5 |
| `src/ui/talkPanel.ts`, `src/ui/boardPanel.ts`, `src/ui/roomPanel.ts` | round 3: 8.1, 8.3, 8.7; round 5: 10.4 |
| `src/ui/buildPanel.ts` | round 4: 9.1; round 5: 10.5 |
| `src/ui/hud.ts` | planner (Step 0: `HAVEN_NAME` import); round 5: 10.5 |
| `src/ui/recap.ts` | round 3: 8.14 |
| `src/game/achievements.ts` | round 3: 8.15; round 4: 9.10 |
| `src/game/useItem.ts`, `src/items/recipes.ts` | round 4: 9.3 |
| `src/sim/bands.ts`, `src/sim/scorecard.ts` | round 3: 8.12 |
| `src/sim/cli.ts` | planner (Step 0: `--map`); round 3: 8.12; round 4: 9.9 |
| `games/dayg/sim/TUNING_LOG.md` | round 5: 10.2 (10.1 and 10.3 write their own `TUNING_LOG_SOCIAL.md`, `TUNING_LOG_DEPTH.md`) |
| `games/dayg/PLAYTEST.md`, `README.md`, `CREDITS.md`, `sim/LIVE.md` | round 5: 10.6 (CREDITS: planner adds lines any issue reports) |
| `packages/prefabs/src/catalog/index.ts` | planner (Step 0 registers `dayg-build.ts`, `dayg-materials.ts`) |
| `packages/prefabs/src/catalog/dayg.ts`, `dayg-build.ts`, `dayg-materials.ts` | round 1: 6.4, 6.5, 6.6 |
| `packages/achievements/src/catalog.ts` | round 2: 7.16 |
| `packages/mp/src/protocol.ts`, `packages/mp-server/test/server.test.mjs` | round 1: 6.3; round 4: 9.6 |
| `packages/mp-server/src/matchmaker.ts` | round 1: 6.3 |
| `proto/gnome/common/v1/common.proto` | planner (Step 0: `GAME_DAYG = 12`) |
| `proto/gnome/save/v1/room.proto`, `packages/platform/src/client.ts`, `packages/platform/src/index.ts`, generated code | round 1: 6.1 |
| `packages/platform-server/internal/store/room.go`, `room_test.go` | round 1: 6.2 |
| `packages/platform-server/internal/store/room_postgres.go`, `room_postgres_test.go`, `postgres.go` | round 2: 7.13 |
| `packages/platform-server/internal/service/room.go`, `room_test.go`, `main.go` | round 2: 7.14 |
| `packages/cloudsave/src/room.ts`, `room.test.ts`, `package.json` | round 2: 7.15 |
| `docs/lore/rulings.md` | round 1: 6.7 only; later rounds: the issue that says so |
| `docs/lore/INDEX.md` | planner only (`npm run lore` at the end of a round; workers run `npm run lore -- check`) |
| `AGENT_INDEX.md`, `packages/mp/README.md`, `docs/lore/settings.md` | planner |

New files under `games/dayg/src/` and their owners (Step 0 writes every one as a stub or in full):

| File | Written by | Filled by |
|---|---|---|
| `sim/regionsFull.ts`, `sim/tuning.social.json`, `sim/tuning.depth.json`, `items/defsDepth.ts`, `net/protocol.ts`, `world/stamp.ts`, `world/fullMap.ts`, `world/districts.test.ts` | planner (full) | none |
| `sim/regionsFull.test.ts` | 6.11 | 6.11 |
| `sim/social.ts` (+ `social.test.ts`) | planner stub | 7.1 |
| `sim/factions.ts` (+ test) | planner stub | 7.2 |
| `sim/quests.ts` (+ test) | planner stub | 7.3 |
| `sim/talk.ts`, `sim/phrases.ts` (+ `talk.test.ts`) | planner stub | 7.4 |
| `sim/actions.ts`, `sim/bubbles.ts` (+ `actions.test.ts`) | planner stub | 7.5 |
| `net/snapshot.ts`, `net/interest.ts` (+ `net/net.test.ts`) | planner stub | 7.6 |
| `sim/bots.ts` (+ test) | planner stub | 7.7 |
| `world/districts/columbarium.ts`, `bellChapel.ts` | planner stub | 7.8 |
| `world/districts/lawnSection.ts`, `drownedCorner.ts` | planner stub | 7.9 |
| `world/districts/mausoleumHill.ts`, `shed.ts` | planner stub | 7.10 |
| `world/districts/yewWalk.ts`, `gnomeGarden.ts` | planner stub | 7.11 |
| `world/districts/wreathwood.ts`, `compost.ts` | planner stub | 7.12 |
| `sim/build.ts`, `sim/farming.ts` (+ `depth.test.ts`) | planner stub | 7.17 |
| `sim/mowing.ts`, `sim/storylets.ts` (+ `story.test.ts`) | planner stub | 7.18 |
| `ui/talkPanel.ts` | planner stub | 8.1, 10.4 |
| `ui/ledgerPanel.ts` | planner stub | 8.2, 9.5, 10.5 |
| `scene/boards.ts`, `ui/boardPanel.ts` | planner stub | 8.3 (10.4: boardPanel) |
| `game/questRunner.ts` (+ test) | planner stub | 8.4 |
| `net/simHost.ts`, `net/simWorker.ts` (+ `simHost.test.ts`) | planner stub (solo works) | 8.5 |
| `net/session.ts` (+ test) | planner stub | 8.6 |
| `ui/roomPanel.ts` | planner stub | 8.7, 10.4 |
| `net/bubbleSync.ts`, `scene/remotePlayers.ts` | planner stub | 8.8 |
| `net/roomSave.ts` (+ test) | planner stub | 8.9 |
| `game/skills.ts` (+ test) | planner stub | 8.13 |
| `game/respawn.ts` | planner stub | 8.14 |
| `game/building.ts`, `scene/pieces.ts`, `ui/buildPanel.ts` | planner stub | 9.1 (10.5: buildPanel) |
| `game/farming.ts`, `game/traps.ts` | planner stub | 9.2 |
| `items/recipes.test.ts` | 9.3 | 9.3 |
| `scene/lanterns.ts`, `scene/mowingFx.ts` | planner stub | 9.4 |
| `live/telemetry.ts` (+ test) | planner stub | 9.7 |
| `sim/liveCompare.ts` (+ test) | planner stub | 9.8 |
| `sim/seasonal.ts` (+ test) | planner (real `withSeason`) | 9.9 |

### Ports (dev servers, one per issue, never shared)

Round 2: 7.8: 5271, 7.9: 5272, 7.10: 5273, 7.11: 5274, 7.12: 5275. Round 3: 8.1: 5241, 8.2: 5242, 8.3: 5243,
8.7: 5244, 8.8: 5245, 8.10: 5246, 8.11: 5247, 8.14: 5248. Round 4: 9.1: 5251, 9.2: 5252, 9.4: 5253, 9.5: 5254;
9.11 uses game port 5259 and mp-server `PORT=8797`. Round 5: 10.4: 5261, 10.5: 5262. Start a game server with
`cd games/dayg && npx vite --port <port> --strictPort` (in the background) and stop it when done. The planner's own
checks use 5206 and mp-server 8787.

### Phone screenshot command (used by UI issues)

```sh
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
  --window-size=390,844 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-<issue>-portrait.png" "http://localhost:<port>/?seed=1&touch=1<extra>"
```
Repeat with `--window-size=844,390` for landscape, then open the PNGs with the Read tool and look at them. `<extra>`
is the debug parameter the issue names (for example `&open=talk`).

---

## 4. Step 0: foundation (planner-written)

The planner does all of this before launching round 1, then runs the Step 0 checks (4.14). Nothing here renames an
existing type, field or function; unions grow, interfaces gain members, functions gain optional parameters.

### 4.1 `src/sim/types.ts`: unions extended in place

```ts
export type RegionId =
  | 'gate-roof' | 'forecourt' | 'verge-path' | 'bin-corner'
  | 'ivy-rows' | 'leaning-rows' | 'the-sinks' | 'angel-square' | 'masons-corner' | 'child-graves' | 'yew-edge'
  | 'the-tap'
  | 'lower-walk' | 'the-yews' | 'upper-walk'
  | 'the-pile' | 'ornament-lawn' | 'solar-walk' | 'the-birdbath' | 'windchime-hedge'
  | 'the-rings' | 'petalfall' | 'ribbon-halls' | 'foam-fields' | 'the-crown'
  | 'warm-bays' | 'clipping-hills' | 'leaf-bins' | 'wormways'
  | 'parapet' | 'niches-high' | 'niches-low' | 'walkway' | 'garden-of-remembrance' | 'rose-gate'
  | 'the-spire' | 'the-nave' | 'the-vestry' | 'chapel-rise' | 'the-catacombs'
  | 'obelisk-garden' | 'great-crypt' | 'back-stair' | 'crypt-row' | 'new-hill' | 'diggers-rest'
  | 'the-plaques' | 'sprinkler-field' | 'bench-line' | 'the-irrigation' | 'mower-tracks'
  | 'the-reeds' | 'lily-pond' | 'footbridge' | 'the-willow' | 'drain-mouth'
  | 'shed-floor' | 'the-shelves' | 'fuel-store' | 'mower-yard' | 'back-gate';
export type DistrictId =
  | 'lychgate' | 'old-rows' | 'yew-walk' | 'gnome-garden' | 'wreathwood' | 'compost'
  | 'columbarium' | 'bell-chapel' | 'mausoleum-hill' | 'lawn-section' | 'drowned-corner' | 'shed';
export const DISTRICTS: readonly DistrictId[] = ['lychgate', 'old-rows', 'yew-walk', 'gnome-garden', 'wreathwood', 'compost',
  'columbarium', 'bell-chapel', 'mausoleum-hill', 'lawn-section', 'drowned-corner', 'shed'];
export type HavenId = 'waystation' | 'tap' | 'columbarium' | 'infirmary' | 'willow' | 'bath-house' | 'shelves';
export const HAVENS: readonly HavenId[] = ['waystation', 'tap', 'columbarium', 'infirmary', 'willow', 'bath-house', 'shelves'];
```

In `WorldState`, `nextId` becomes `{ group: number; herd: number; faction: number; quest: number; rumour: number; piece: number }`.
`Ledger` gains `farmed: Record<Resource, number>` (inflow: crops, snares) and `givenByPlayer: Record<Resource, number>`
(inflow: items a player traded or delivered into the world). `DailyRow` gains the optional fields listed in 4.2.
`SimEvent` gains the members in 4.2. `Tuning` gains the sections in 4.4.

### 4.2 `src/sim/types.ts`: appended (verbatim)

```ts
// ---------------------------------------------------------------- phases 4-8 (docs/roadmaps/dayg-phases-4-8.md)
export type MapKind = 'slice' | 'full';
export type MapStage = 'south-west' | 'north' | 'east';
export const DISTRICT_STAGE: Record<DistrictId, MapStage> = {
  lychgate: 'south-west', 'old-rows': 'south-west', 'yew-walk': 'south-west', 'gnome-garden': 'south-west',
  wreathwood: 'south-west', compost: 'south-west', columbarium: 'north', 'bell-chapel': 'north',
  'mausoleum-hill': 'east', 'lawn-section': 'east', 'drowned-corner': 'east', shed: 'east',
};

/** 'local' offline; online 'u:<platform userId>' when signed in, else 'g:<mp player id>'; bots 'bot:<n>'. */
export type PlayerKey = string;
/** 'n:<NpcId>' an NPC, 'p:<PlayerKey>' a player, 'g:<GroupId>' a group, 'f:<FactionId>' a faction. */
export type SubjectKey = string;
export type FactionId = number;
export type QuestId = number;
export type BoardId = string;                 // 'board:<RegionId>'

// ---- trust ledger and rumours (society.md "Memory and trust")
export type Grudge = 'theft' | 'betrayal' | 'abandoned' | 'attacked' | 'robbed' | 'lied';
export type Deed = 'helped' | 'shared-food' | 'kept-watch' | 'stole' | 'betrayed' | 'killed-gnome' | 'robbed'
  | 'threatened' | 'warned' | 'quest-done' | 'quest-failed' | 'rang-bell';
export const DEEDS: readonly Deed[] = ['helped', 'shared-food', 'kept-watch', 'stole', 'betrayed', 'killed-gnome', 'robbed',
  'threatened', 'warned', 'quest-done', 'quest-failed', 'rang-bell'];
/** trust -1..1; debt in acorns (+ = the subject owes this NPC); seen = tick of the last change; heard = only by rumour. */
export interface TrustEntry { s: SubjectKey; trust: number; debt: number; grudge: Grudge | null; seen: number; heard: boolean }
export interface NpcMemory { entries: TrustEntry[] } // at most tuning.social.memoryCap; the weakest |trust| is forgotten first
export type RumourFact =
  | { kind: 'deed'; who: SubjectKey; deed: Deed }
  | { kind: 'herd'; size: number }
  | { kind: 'price'; resource: Resource; price: number };
/** A fact spreading along the region graph from `origin`; `at` = regions it has reached, in the order reached. */
export interface Rumour { id: number; fact: RumourFact; origin: RegionId; at: RegionId[]; tick: number; strength: number }

// ---- factions (society.md "Factions and power", havens.md)
export type Rank = 'stray' | 'hand' | 'sworn' | 'warden' | 'voice';
export const RANKS: readonly Rank[] = ['stray', 'hand', 'sworn', 'warden', 'voice'];
export interface Norms {
  sharing: 'all' | 'tithe' | 'own';
  strangers: 'welcome' | 'question' | 'turn-away' | 'rob';
  bitten: 'nurse' | 'cast-out' | 'shatter';
  leadership: 'strongest' | 'council' | 'founder-line';
  violence: 'never-first' | 'raiders-only' | 'outsiders';
}
export type FactionPlan = 'hold' | 'expand' | 'trade' | 'ally' | 'tribute' | 'raid' | 'schism' | 'collapse';
export const FACTION_PLANS: readonly FactionPlan[] = ['hold', 'expand', 'trade', 'ally', 'tribute', 'raid', 'schism', 'collapse'];
export type FounderId = 'yarrow-gravelpot' | 'nettle-rustspade' | 'comfrey-kilnworth' | 'thistle-stonewort' | 'lichen-ashbucket';
export interface Faction {
  id: FactionId; name: string; founder: FounderId | null; hat: number;   // hat colour 0xRRGGBB
  home: RegionId; leader: NpcId; groups: GroupId[]; norms: Norms;
  power: number; morale: number;                    // morale 0..1
  stock: Record<Resource, number>; acorns: number;   // the store; counted by resourceTotals / acornTotal
  havens: HavenId[]; territory: RegionId[];
  allies: FactionId[]; enemies: FactionId[];
  plan: FactionPlan; planTarget: FactionId | null; planSince: number;
  formedTick: number; diedTick: number | null;
  ranks: Record<PlayerKey, Rank>;                    // players who joined
  done: Record<PlayerKey, number>;                   // quests each player finished for this faction
  leaders: { npc: NpcId; from: number }[];           // leader history, oldest first
}

// ---- players as sim entities (society.md "Where the player fits")
export type SkillId = 'foraging' | 'carpentry' | 'masonry' | 'glazing' | 'cooking' | 'trapping' | 'fishing' | 'gardening'
  | 'tracking' | 'stealth' | 'melee' | 'ranged' | 'climbing' | 'bartering' | 'leadership';
export const SKILLS: readonly SkillId[] = ['foraging', 'carpentry', 'masonry', 'glazing', 'cooking', 'trapping', 'fishing',
  'gardening', 'tracking', 'stealth', 'melee', 'ranged', 'climbing', 'bartering', 'leadership'];
export interface PlayerRecord {
  key: PlayerKey; name: string; look: string; userId: string | null;   // look = @lawn/gnome look code ('' = default)
  region: RegionId | null; online: boolean; joinedTick: number; lastTick: number;
  acorns: number;                                   // counted by acornTotal
  faction: FactionId | null; notoriety: number;     // 0..1: share of alive NPCs with an entry for this player
  quests: QuestId[];                                // taken and not finished
  done: number; failed: number; deaths: number;
  skills: Partial<Record<SkillId, number>>;         // XP per skill (the game's SkillSystem writes it with 'set-skills')
  bed: HavenId | null;
}

// ---- quests and notice boards (quests.md)
export type QuestTemplate = 'supply-run' | 'escort' | 'clear-ground' | 'missing-gnome' | 'open-crypt' | 'bounty'
  | 'sabotage' | 'steer-drift' | 'envoy' | 'teach' | 'the-bitten' | 'storylet';
export const QUEST_TEMPLATES: readonly QuestTemplate[] = ['supply-run', 'escort', 'clear-ground', 'missing-gnome', 'open-crypt',
  'bounty', 'sabotage', 'steer-drift', 'envoy', 'teach', 'the-bitten', 'storylet'];
export type QuestState = 'offered' | 'taken' | 'done' | 'failed' | 'expired';
export type QuestGoal =
  | { kind: 'deliver'; resource: Resource; count: number; to: RegionId }   // supply-run; the-bitten (medicine)
  | { kind: 'clear'; region: RegionId; count: number }                     // clear-ground, open-crypt: destroy N Hatless there
  | { kind: 'find'; npc: NpcId; region: RegionId }                         // missing-gnome: talk to the NPC (or reach its remains)
  | { kind: 'escort'; npc: NpcId; from: RegionId; to: RegionId }           // be in `to`; the NPC is moved there with you
  | { kind: 'visit'; region: RegionId; item: ItemId | null }               // sabotage, envoy (carry the item there)
  | { kind: 'target'; npc: NpcId }                                         // bounty: threaten or rob the target (warning it completes the rival quest)
  | { kind: 'steer'; herd: number; away: RegionId }                        // steer-drift: make noise near the herd; herd not in `away` at the deadline
  | { kind: 'teach'; group: GroupId; skill: SkillId; level: number; hours: number }
  | { kind: 'storylet'; storylet: StoryletId; step: number; region: RegionId };
/** Paid from the poster's store at completion; trust is added to every member of the poster's faction for the taker. */
export interface QuestReward { acorns: number; items: ItemStack[]; trust: number }
export interface Quest {
  id: QuestId; template: QuestTemplate; title: string;
  poster: SubjectKey;               // 'f:<id>' or 'n:<id>'
  board: BoardId | null;            // null = offered only in talk ('ask-help')
  region: RegionId;                 // where the need is (used for "quests near")
  goal: QuestGoal; reward: QuestReward;
  postedTick: number; deadline: number;
  state: QuestState; takenBy: PlayerKey | null; takenTick: number | null; doneTick: number | null;
  rival: QuestId | null;            // the quest another side posted about the same event
  progress: number;                 // goal counter: Hatless destroyed, units delivered, noise made, hours taught
}
export interface NoticeBoard { id: BoardId; region: RegionId; haven: HavenId | null; name: string; newcomer: boolean }
/** reach stays null until tuning.quests.reachDays have passed since doneTick. */
export interface QuestOutcome {
  quest: QuestId; template: QuestTemplate; doneTick: number; by: PlayerKey;
  reach: { rankChange: boolean; havenChange: boolean; marketOutOfBand: boolean } | null;
}

// ---- talk (quests.md "Talking to NPCs")
export type TalkVerb = 'greet' | 'ask' | 'trade' | 'offer-help' | 'ask-help' | 'recruit' | 'join' | 'threaten' | 'rob'
  | 'share-food' | 'warn';
export const TALK_VERBS: readonly TalkVerb[] = ['greet', 'ask', 'trade', 'offer-help', 'ask-help', 'recruit', 'join',
  'threaten', 'rob', 'share-food', 'warn'];
export type AskTopic =
  | { about: 'place'; region: RegionId } | { about: 'gnome'; npc: NpcId }
  | { about: 'price'; resource: Resource } | { about: 'herd' };
export interface ResourceCount { resource: Resource; count: number }
export interface TalkInput {
  npc: NpcId; player: PlayerKey; verb: TalkVerb;
  topic?: AskTopic;                 // ask
  offer?: ResourceCount;            // trade (what the player gives), share-food (food), offer-help
  want?: ResourceCount;             // trade (what the player wants)
  acorns?: number;                  // trade: acorns the player adds (+) or asks for (-)
  carried?: Partial<Record<Resource, number>>; // what the player has, as the game counts it (rob, threaten, trade checks)
  warnOf?: NpcId;                   // warn: the bounty target being warned (the NPC talked to is the target)
}
export interface PhraseLine { key: string; vars: Record<string, string | number> }
export interface TalkResult {
  ok: boolean; lines: PhraseLine[]; trustDelta: number;
  give: ItemStack[];                // the NPC hands these to the player (taken out of the NPC's carried stock)
  take: ResourceCount[];            // the game removes these from the player's inventory
  acorns: number;                   // + = the player receives
  quest: QuestId | null;            // offer-help: the quest this NPC offers you (posted if needed); else null
  joined: FactionId | null;         // join or recruit succeeded
  hostile: boolean;                 // the NPC fled or turned on the player (the game reacts)
}

// ---- actions: every change a player makes to the sim (hand-off replays them)
export type CropId = 'clover' | 'toadstool' | 'grain' | 'berries' | 'roses' | 'acorn-tree';
export const CROPS: readonly CropId[] = ['clover', 'toadstool', 'grain', 'berries', 'roses', 'acorn-tree'];
export type PieceKind = 'plank-wall' | 'barricade' | 'reinforced-barricade' | 'stone-wall' | 'door' | 'pull-ladder'
  | 'spike-line' | 'dug-pit' | 'garden-bed' | 'rain-catcher' | 'drying-rack' | 'workbench' | 'hearth' | 'kiln' | 'anvil'
  | 'bed' | 'storage' | 'snare' | 'noise-line' | 'rope-bridge';
export const PIECE_KINDS: readonly PieceKind[] = ['plank-wall', 'barricade', 'reinforced-barricade', 'stone-wall', 'door',
  'pull-ladder', 'spike-line', 'dug-pit', 'garden-bed', 'rain-catcher', 'drying-rack', 'workbench', 'hearth', 'kiln', 'anvil',
  'bed', 'storage', 'snare', 'noise-line', 'rope-bridge'];
export interface PieceDef { kind: PieceKind; region: RegionId; x: number; y: number; z: number; rotY: number }
export interface Piece extends PieceDef { id: number; hp: number; maxHp: number; owner: SubjectKey; placedTick: number }
export interface Bed { piece: number; crop: CropId | null; plantedTick: number; water: number; tendedTick: number; ready: boolean; picks: number }
export type SimAction =
  | { kind: 'player-join'; name: string; look: string; userId: string | null; region: RegionId | null }
  | { kind: 'player-leave' }
  | { kind: 'enter-region'; region: RegionId | null; alive: number }  // alive = L0 Hatless still standing in the bubble I leave (owner)
  | { kind: 'open-container'; id: string }
  | { kind: 'player-take'; stack: ItemStack }                          // recordPlayerTake booking
  | { kind: 'hatless-destroyed'; region: RegionId }
  | { kind: 'noise'; region: RegionId; amount: number }
  | { kind: 'talk'; input: TalkInput }
  | { kind: 'take-quest'; quest: QuestId }
  | { kind: 'quest-progress'; quest: QuestId; amount: number }
  | { kind: 'deliver'; quest: QuestId; resource: Resource; count: number }
  | { kind: 'complete-quest'; quest: QuestId }
  | { kind: 'abandon-quest'; quest: QuestId }
  | { kind: 'join-faction'; faction: FactionId }
  | { kind: 'leave-faction' }
  | { kind: 'player-died'; cause: DeathCause; region: RegionId | null; carried: ItemStack[] }
  | { kind: 'respawn'; at: HavenId; teacher: NpcId | null }
  | { kind: 'set-skills'; skills: Partial<Record<SkillId, number>> }
  | { kind: 'build'; piece: PieceDef }
  | { kind: 'damage-piece'; id: number; amount: number }
  | { kind: 'remove-piece'; id: number }
  | { kind: 'plant'; bed: number; crop: CropId }
  | { kind: 'water-bed'; bed: number; litres: number }
  | { kind: 'tend-bed'; bed: number }
  | { kind: 'harvest'; bed: number }
  | { kind: 'check-snare'; piece: number }
  | { kind: 'ring-bell'; region: RegionId }
  | { kind: 'light-lantern'; id: string };
export interface ActionEnvelope { tick: number; seq: number; player: PlayerKey; action: SimAction }
export interface ActionResult { ok: boolean; error?: string; items?: ItemStack[]; talk?: TalkResult; quest?: QuestId; piece?: number }
export interface Arrival { player: PlayerKey; region: RegionId; count: number; from: RegionId | null }
export interface TickResult { tick: number; arrivals: Arrival[]; hash: string }
/** One L0 bubble per region with a player in it. Its owner's browser runs the L0 Hatless (held here as `hatless`). */
export interface Bubble { owner: PlayerKey; region: RegionId; hatless: number; viewers: PlayerKey[] }

// ---- depth (crafting.md, world.md, quests.md storylets)
export interface MowingState { next: number; district: DistrictId | null; lastTick: number | null; mownUntil: Partial<Record<DistrictId, number>>; warned: boolean }
export type StoryletId = 'last-sexton' | 'seeds-for-spring' | 'greybearded-walk' | 'who-rang-the-horn' | 'mower-rumbles' | 'gate-book';
export const STORYLET_IDS: readonly StoryletId[] = ['last-sexton', 'seeds-for-spring', 'greybearded-walk', 'who-rang-the-horn', 'mower-rumbles', 'gate-book'];
export interface StoryletState { id: StoryletId; firedTick: number; quest: QuestId | null; done: boolean }

// ---- new WorldState fields (added inside the interface)
//   map: MapKind;
//   tuningBase: Tuning;                       // tuning before the season patch (withSeason); excluded from hash and snapshot
//   memory: NpcMemory[];                      // index = NpcId
//   rumours: Rumour[];
//   factions: Faction[];                      // alive and dead, index = id
//   groupFaction: Record<string, FactionId>;  // String(GroupId) -> faction
//   players: Record<PlayerKey, PlayerRecord>;
//   quests: Quest[];                          // index = id
//   boards: NoticeBoard[];
//   outcomes: QuestOutcome[];
//   bubbles: Bubble[];
//   pieces: Piece[];                          // index = id; a removed or broken piece keeps hp 0
//   beds: Bed[];
//   mowing: MowingState;
//   storylets: StoryletState[];
//   lanterns: Record<string, boolean>;        // grave lantern spot id -> lit
//   bellTick: number | null;                  // last time the chapel bell rang
//   lastSeason: Season;                       // for the season patch

// ---- new optional DailyRow fields (filled by recordDaily)
//   factions?: number; topFactions?: FactionId[]; hhiNorm?: number; topShare?: number; havensUp?: number;
//   havenHolders?: Partial<Record<HavenId, FactionId | null>>;
//   marketInBand?: boolean; questsOpen?: number; questsDone?: number; templatesOffered?: QuestTemplate[];
//   outcomesMeasured?: number; outcomesReached?: number;
//   piecesUp?: number; bedsGrowing?: number; farmedFood?: number; mown?: DistrictId | null; stepMs?: number;

// ---- new SimEvent members
//   | { kind: 'faction-formed'; faction: FactionId; region: RegionId }
//   | { kind: 'faction-fell'; faction: FactionId; region: RegionId }
//   | { kind: 'leader-changed'; faction: FactionId; leader: NpcId }
//   | { kind: 'haven-changed'; haven: HavenId; from: FactionId | null; to: FactionId | null }
//   | { kind: 'faction-plan'; faction: FactionId; plan: FactionPlan; target: FactionId | null }
//   | { kind: 'rank-changed'; player: PlayerKey; faction: FactionId; rank: Rank }
//   | { kind: 'player-joined-faction'; player: PlayerKey; faction: FactionId }
//   | { kind: 'quest-posted'; quest: QuestId; template: QuestTemplate; region: RegionId }
//   | { kind: 'quest-done'; quest: QuestId; player: PlayerKey }
//   | { kind: 'quest-failed'; quest: QuestId; player: PlayerKey | null; expired: boolean }
//   | { kind: 'rumour'; rumour: number; region: RegionId }
//   | { kind: 'piece-broken'; piece: number; region: RegionId }
//   | { kind: 'harvest'; bed: number; food: number }
//   | { kind: 'mowing-soon'; district: DistrictId }
//   | { kind: 'mowing'; district: DistrictId }
//   | { kind: 'storylet'; storylet: StoryletId; quest: QuestId | null }
//   | { kind: 'bell'; region: RegionId }
```

### 4.3 `src/sim/rng.ts`

`StreamName` and `STREAM_NAMES` gain, appended in this order: `'social' | 'factions' | 'quests' | 'story' | 'farm' |
'mowing' | 'bots'`. Existing streams keep their seeds (each stream seed is `hashString(seed:name)`), so the stream
isolation test still holds.

### 4.4 Tuning: `src/sim/tuning.social.json`, `src/sim/tuning.depth.json`, `src/sim/tuning.ts`

`tuning.ts`: `TUNING = { ...tuning.json, ...tuning.social.json, ...tuning.depth.json } as unknown as Tuning`.
`Tuning` gains (verbatim):

```ts
  social: { memoryCap: number; forgetPerDay: number; rumourChance: number; rumourDiscount: number; rumourMaxDays: number;
            rumoursMax: number; deed: Record<Deed, number>; groupShare: number; standingLeaderPull: number };
  factions: { formAt: number; membersExp: number; upkeepK: number; upkeepExp: number; havenHoldDays: number; planEvery: number;
              planTemp: number; raidTake: number; raidLoss: number; collapseMorale: number; moraleDrift: number; patrolReach: number;
              founders: [number, number]; storeShare: number; rankTrust: Record<Rank, number>; rankDone: Record<Rank, number> };
  quests: { maxOpen: number; perBoard: number; checkEvery: number; rewardShare: number; minReward: number; supplyBelow: number;
            clearDensity: number; clearCount: [number, number]; bountyGrudge: number; driftSize: number; envoyTrust: number;
            reachDays: number; marketBand: [number, number]; expireDays: Record<QuestTemplate, number> };
  bots: { sessionHours: number; nearHops: number; riskLimit: number; hatlessPerHour: number };
  build: { hp: Record<PieceKind, number>; pushPerHatless: number; spikeKillsPerDay: number; snareFoodPerDay: number; wallsWeight: number };
  farm: { crops: Record<CropId, { days: number; yield: number; seasons: Season[]; repeatDays: number }>; waterPerDay: number;
          unwateredMul: number; weedsDays: number; weedsMul: number; trampleK: number };
  mowing: { everyDays: [number, number]; coverDays: number; herdScatter: number; spillShare: number; warnDays: number };
  storylets: { checkEvery: number };
  bell: { noise: number; hops: number };
  seasonal: Partial<Record<Season, unknown>>;
```

`tuning.social.json` (verbatim):

```json
{
  "social": {
    "memoryCap": 24, "forgetPerDay": 0.02, "rumourChance": 0.3, "rumourDiscount": 0.5, "rumourMaxDays": 10, "rumoursMax": 200,
    "deed": { "helped": 0.15, "shared-food": 0.2, "kept-watch": 0.1, "stole": -0.4, "betrayed": -0.6, "killed-gnome": -0.8,
              "robbed": -0.5, "threatened": -0.25, "warned": 0.15, "quest-done": 0.25, "quest-failed": -0.1, "rang-bell": -0.5 },
    "groupShare": 0.5, "standingLeaderPull": 0.3
  },
  "factions": {
    "formAt": 9, "membersExp": 0.8, "upkeepK": 0.05, "upkeepExp": 1.2, "havenHoldDays": 3, "planEvery": 24, "planTemp": 0.5,
    "raidTake": 0.3, "raidLoss": 0.15, "collapseMorale": 0.15, "moraleDrift": 0.05, "patrolReach": 2, "founders": [2, 4],
    "storeShare": 0.3,
    "rankTrust": { "stray": 0, "hand": 0.2, "sworn": 0.4, "warden": 0.6, "voice": 0.8 },
    "rankDone": { "stray": 0, "hand": 1, "sworn": 3, "warden": 6, "voice": 10 }
  },
  "quests": {
    "maxOpen": 40, "perBoard": 8, "checkEvery": 6, "rewardShare": 0.2, "minReward": 2, "supplyBelow": 0.3,
    "clearDensity": 40, "clearCount": [5, 15], "bountyGrudge": -0.5, "driftSize": 150, "envoyTrust": 0.1,
    "reachDays": 5, "marketBand": [0.5, 2.5],
    "expireDays": { "supply-run": 4, "escort": 2, "clear-ground": 3, "missing-gnome": 4, "open-crypt": 10, "bounty": 6,
                    "sabotage": 5, "steer-drift": 2, "envoy": 5, "teach": 6, "the-bitten": 1, "storylet": 14 }
  },
  "bots": { "sessionHours": 3, "nearHops": 2, "riskLimit": 0.02, "hatlessPerHour": 4 }
}
```

`tuning.depth.json` (verbatim):

```json
{
  "build": {
    "hp": { "plank-wall": 120, "barricade": 80, "reinforced-barricade": 200, "stone-wall": 400, "door": 150, "pull-ladder": 40,
            "spike-line": 60, "dug-pit": 999, "garden-bed": 50, "rain-catcher": 30, "drying-rack": 30, "workbench": 80, "hearth": 100,
            "kiln": 150, "anvil": 300, "bed": 40, "storage": 60, "snare": 20, "noise-line": 10, "rope-bridge": 60 },
    "pushPerHatless": 1, "spikeKillsPerDay": 3, "snareFoodPerDay": 0.5, "wallsWeight": 0.002
  },
  "farm": {
    "crops": {
      "clover": { "days": 5, "yield": 8, "seasons": ["spring", "summer", "autumn"], "repeatDays": 0 },
      "toadstool": { "days": 4, "yield": 6, "seasons": ["spring", "summer", "autumn", "winter"], "repeatDays": 0 },
      "grain": { "days": 10, "yield": 14, "seasons": ["spring", "summer", "autumn"], "repeatDays": 0 },
      "berries": { "days": 14, "yield": 6, "seasons": ["spring", "summer", "autumn"], "repeatDays": 6 },
      "roses": { "days": 12, "yield": 3, "seasons": ["spring", "summer", "autumn"], "repeatDays": 0 },
      "acorn-tree": { "days": 40, "yield": 30, "seasons": ["spring", "summer", "autumn", "winter"], "repeatDays": 28 }
    },
    "waterPerDay": 1, "unwateredMul": 0.5, "weedsDays": 3, "weedsMul": 0.5, "trampleK": 0.1
  },
  "mowing": { "everyDays": [18, 24], "coverDays": 7, "herdScatter": 0.5, "spillShare": 0.5, "warnDays": 2 },
  "storylets": { "checkEvery": 24 },
  "bell": { "noise": 400, "hops": 2 },
  "seasonal": {}
}
```

### 4.5 `src/sim/regions.ts` and `src/sim/regionsFull.ts`

`regions.ts`: `HAVEN_REGION` becomes `{ waystation: 'gate-roof', tap: 'the-tap', columbarium: 'niches-high', infirmary:
'the-nave', willow: 'the-willow', 'bath-house': 'the-birdbath', shelves: 'the-shelves' }`; add
`export const HAVEN_NAME: Record<HavenId, string> = { waystation: 'Lychgate Waystation', tap: 'The Tap', columbarium:
'The Columbarium', infirmary: 'The Chapel Infirmary', willow: 'The Willow', 'bath-house': 'The Bath House', shelves:
'The Shelves' }` and `export function regionAtIn(regions: readonly RegionDef[], x: number, z: number): RegionId | null`
(first rect holding the point, edges inclusive; `regionAt(x, z)` becomes `regionAtIn(REGIONS, x, z)`). `hud.ts` and
`eventLog.ts` import `HAVEN_NAME` instead of their own copies; `eventLog.ts` builds `REGION_NAME` from `FULL_REGIONS`.

`regionsFull.ts` (planner, full): `NEW_REGIONS` (the 49 rows below, in this order), `FULL_REGIONS = [...REGIONS,
...NEW_REGIONS]`, `NEW_EDGES`, `FULL_EDGES = [...EDGES, ...NEW_EDGES]`, `FULL_BOUNDS: Rect = { x0: -1800, x1: 2200, z0:
-3480, z1: 520 }`, `buildFullGraph(): RegionGraph` (= `buildGraph(FULL_REGIONS, FULL_EDGES)`), `graphFor(map: MapKind):
RegionGraph`, `regionsFor(map: MapKind): readonly RegionDef[]`, `districtOf(r: RegionId): DistrictId`,
`DISTRICT_PREFIX: Record<DistrictId, string>` = `{ lychgate: 'lg', 'old-rows': 'or', 'yew-walk': 'yw', 'gnome-garden':
'gg', wreathwood: 'ww', compost: 'cp', columbarium: 'cb', 'bell-chapel': 'bc', 'mausoleum-hill': 'mh', 'lawn-section':
'ls', 'drowned-corner': 'dc', shed: 'sh' }`.

Rows: `id | name | district | rect x0,x1,z0,z1 | floorY | traits | tier | startHatless | startNpcs | water | forage`.

```
lower-walk | The Lower Walk | yew-walk | 440,800,0,400 | 0 | OPEN CHOKE | 1 | 20-50 | 4-10 | - | 2
the-yews | The Yews | yew-walk | 440,800,-1600,0 | 40 | HIGH COVER | 2 | 0-0 | 6-14 | - | 4
upper-walk | The Upper Walk | yew-walk | 0,440,-1600,0 | 0 | OPEN | 1 | 30-70 | 2-6 | - | 2
the-pile | The Pile | gnome-garden | -1200,-600,-400,100 | 0 | MOSSY NEST PIT | 3 | 150-300 | 0-0 | - | 0
ornament-lawn | Ornament Lawn | gnome-garden | -600,0,-400,100 | 0 | OPEN | 2 | 20-50 | 2-6 | - | 2
the-birdbath | The Birdbath | gnome-garden | -1800,-1200,-400,100 | 50 | HIGH HAVEN | 1 | 0-0 | 6-14 | clean | 1
solar-walk | Solar Walk | gnome-garden | -1800,0,100,400 | 0 | OPEN | 2 | 10-30 | 2-6 | - | 2
windchime-hedge | Windchime Hedge | gnome-garden | -1800,200,400,520 | 0 | ECHO COVER | 2 | 10-30 | 1-4 | - | 3
the-rings | The Rings | wreathwood | -1800,-900,-1300,-400 | 0 | COVER HUSH | 1 | 40-90 | 2-6 | - | 5
petalfall | Petalfall | wreathwood | -900,0,-1300,-400 | 0 | COVER | 2 | 20-50 | 4-10 | - | 4
foam-fields | Foam Fields | wreathwood | -1800,-1300,-2200,-1300 | 0 | HUSH FLOODS | 1 | 5-20 | 1-4 | dirty | 2
the-crown | The Crown | wreathwood | -1300,-900,-2200,-1300 | 60 | HIGH CHOKE | 2 | 0-0 | 6-14 | - | 1
ribbon-halls | The Ribbon Halls | wreathwood | -900,0,-2200,-1300 | 20 | COVER HIGH | 2 | 5-15 | 3-8 | - | 2
warm-bays | The Warm Bays | compost | -1800,-900,-3480,-2800 | 0 | WARM MOSSY NEST | 1 | 200-400 | 0-0 | - | 2
clipping-hills | Clipping Hills | compost | -900,0,-3480,-2800 | 0 | WARM HUSH | 1 | 30-70 | 1-4 | - | 3
wormways | Wormways | compost | -1800,-900,-2800,-2200 | -10 | DEEP DARK WARM | 2 | 30-80 | 6-12 | - | 1
leaf-bins | Leaf Bins | compost | -900,0,-2800,-2200 | 0 | COVER | 1 | 10-30 | 2-6 | - | 2
parapet | The Parapet | columbarium | 0,700,-3480,-3350 | 70 | HIGH OPEN | 1 | 0-0 | 2-6 | - | 0
niches-high | The High Niches | columbarium | 0,700,-3350,-3200 | 40 | HIGH HAVEN | 2 | 0-0 | 30-60 | - | 0
niches-low | The Low Niches | columbarium | 0,700,-3200,-3050 | 4 | ECHO | 2 | 20-50 | 6-14 | - | 1
walkway | The Walkway | columbarium | 700,1400,-3480,-3050 | 0 | ECHO CHOKE | 1 | 20-50 | 4-10 | - | 1
garden-of-remembrance | Garden of Remembrance | columbarium | 0,1000,-3050,-2800 | 0 | COVER | 2 | 20-40 | 6-12 | clean | 5
rose-gate | The Rose Gate | columbarium | 1000,1400,-3050,-2800 | 0 | CHOKE TOLL | 1 | 10-30 | 3-8 | - | 1
the-spire | The Spire | bell-chapel | 0,700,-2800,-2500 | 120 | HIGH ECHO | 3 | 0-0 | 0-2 | - | 0
the-nave | The Nave | bell-chapel | 0,700,-2500,-2100 | 0 | ECHO SACRED HAVEN | 2 | 5-20 | 10-20 | - | 0
the-vestry | The Vestry | bell-chapel | 700,1000,-2800,-2100 | 0 | DARK | 3 | 0-10 | 2-6 | - | 0
chapel-rise | Chapel Rise | bell-chapel | 0,1000,-2100,-1600 | 0 | OPEN | 1 | 40-90 | 2-6 | - | 3
the-catacombs | The Catacombs | bell-chapel | 1000,1400,-2800,-1600 | -30 | DEEP DARK ECHO FLOODS | 3 | 300-600 | 0-4 | dirty | 0
obelisk-garden | Obelisk Garden | mausoleum-hill | 1400,1800,-3480,-3100 | 33 | HIGH OPEN | 2 | 5-15 | 1-4 | - | 1
great-crypt | The Great Crypt | mausoleum-hill | 1800,2200,-3480,-2800 | 80 | HIGH DARK CHOKE | 4 | 0-40 | 6-12 | - | 0
back-stair | The Back Stair | mausoleum-hill | 1400,1800,-3100,-2800 | -15 | DEEP CHOKE | 2 | 20-60 | 0-2 | - | 0
crypt-row | Crypt Row | mausoleum-hill | 1400,2200,-2800,-2300 | 50 | HIGH ECHO | 3 | 10-30 | 8-16 | - | 0
new-hill | The New Hill | mausoleum-hill | 1400,2200,-2300,-1900 | 0 | PIT OPEN | 1 | 80-200 | 1-4 | - | 1
diggers-rest | Digger's Rest | mausoleum-hill | 1400,2200,-1900,-1600 | 25 | HIGH | 3 | 5-15 | 3-8 | - | 0
the-plaques | The Plaques | lawn-section | 800,1200,-1600,-900 | 0 | OPEN | 2 | 40-90 | 0-2 | - | 2
sprinkler-field | The Sprinkler Field | lawn-section | 1200,1600,-1600,-900 | 0 | OPEN FLOODS | 1 | 20-50 | 0-2 | dirty | 2
bench-line | The Bench Line | lawn-section | 800,1200,-900,-200 | 0 | OPEN | 1 | 10-30 | 1-4 | - | 2
the-irrigation | The Irrigation | lawn-section | 1200,1400,-900,-200 | -8 | DEEP DARK ECHO | 2 | 20-50 | 0-2 | - | 0
mower-tracks | Mower Tracks | lawn-section | 1400,1600,-900,-200 | 0 | OPEN | 0 | 5-20 | 0-1 | - | 3
the-reeds | The Reeds | drowned-corner | 1600,2000,-1600,-1300 | 0 | COVER HUSH | 1 | 5-20 | 2-6 | dirty | 4
lily-pond | Lily Pond | drowned-corner | 1600,2000,-1300,-700 | 0 | OPEN | 2 | 20-60 | 2-6 | dirty | 3
footbridge | The Footbridge | drowned-corner | 1600,2000,-700,-200 | 0 | CHOKE TOLL | 1 | 20-50 | 3-8 | - | 1
the-willow | The Willow | drowned-corner | 2000,2200,-1600,-900 | 40 | HIGH COVER HAVEN | 2 | 0-0 | 10-20 | dirty | 2
drain-mouth | The Drain Mouth | drowned-corner | 2000,2200,-900,-200 | -6 | DEEP DARK FLOODS GATE | 2 | 20-60 | 0-3 | dirty | 0
shed-floor | Shed Floor | shed | 800,1300,-200,200 | 0 | DARK ECHO | 2 | 10-40 | 3-8 | - | 0
the-shelves | The Shelves | shed | 1300,1600,-200,200 | 30 | HIGH HAVEN | 3 | 0-0 | 8-16 | - | 0
fuel-store | The Fuel Store | shed | 1600,2200,-200,200 | 0 | ECHO | 3 | 5-20 | 1-4 | - | 0
mower-yard | The Mower Yard | shed | 800,1800,200,520 | 0 | OPEN | 3 | 5-20 | 2-6 | - | 1
back-gate | The Back Gate | shed | 1800,2200,200,520 | 0 | GATE CHOKE | 1 | 5-15 | 2-6 | - | 1
```

`NEW_EDGES` (`a-b` walks, `a^b` is `climb: true`):

```
lower-walk-bin-corner lower-walk-the-tap lower-walk-forecourt lower-walk^the-yews lower-walk-shed-floor lower-walk-mower-yard
the-yews^upper-walk the-yews^the-plaques the-yews^bench-line the-yews^shed-floor the-yews^chapel-rise
upper-walk-the-tap upper-walk-child-graves upper-walk-yew-edge upper-walk-ornament-lawn upper-walk-petalfall upper-walk^ribbon-halls upper-walk-chapel-rise
the-pile-ornament-lawn the-pile-solar-walk the-pile^the-birdbath the-pile-the-rings the-pile-petalfall
ornament-lawn-solar-walk ornament-lawn-child-graves ornament-lawn-petalfall
solar-walk-the-sinks solar-walk-ivy-rows solar-walk-windchime-hedge solar-walk^the-birdbath the-birdbath^the-rings
windchime-hedge-forecourt windchime-hedge-ivy-rows windchime-hedge-leaning-rows windchime-hedge-verge-path
the-rings-petalfall the-rings-foam-fields the-rings^the-crown petalfall^ribbon-halls
ribbon-halls^the-crown ribbon-halls^leaf-bins ribbon-halls^the-nave ribbon-halls^chapel-rise
foam-fields^the-crown foam-fields-wormways the-crown^wormways
warm-bays-clipping-hills warm-bays-wormways clipping-hills-leaf-bins clipping-hills-niches-low clipping-hills-garden-of-remembrance
leaf-bins-wormways leaf-bins-the-nave leaf-bins^the-spire
parapet^niches-high parapet^walkway niches-high^niches-low niches-high^walkway niches-low-walkway niches-low-garden-of-remembrance
walkway-garden-of-remembrance walkway-rose-gate walkway^obelisk-garden walkway-back-stair
garden-of-remembrance-rose-gate garden-of-remembrance^the-spire garden-of-remembrance-the-vestry rose-gate-the-catacombs rose-gate-back-stair
the-spire^the-nave the-spire^the-vestry the-nave-the-vestry the-nave-chapel-rise the-vestry-chapel-rise the-vestry-the-catacombs
chapel-rise-the-catacombs chapel-rise-the-plaques the-catacombs-back-stair the-catacombs-crypt-row the-catacombs-new-hill
great-crypt^obelisk-garden great-crypt^back-stair great-crypt^crypt-row obelisk-garden^back-stair back-stair^crypt-row
crypt-row^new-hill new-hill^diggers-rest diggers-rest^sprinkler-field diggers-rest^the-reeds
the-plaques-sprinkler-field the-plaques-bench-line sprinkler-field-the-irrigation sprinkler-field-mower-tracks sprinkler-field-the-reeds sprinkler-field-lily-pond
bench-line-the-irrigation bench-line-shed-floor the-irrigation-mower-tracks the-irrigation-shed-floor
mower-tracks-lily-pond mower-tracks-footbridge mower-tracks^the-shelves
the-reeds-lily-pond the-reeds^the-willow lily-pond-footbridge lily-pond^the-willow lily-pond-drain-mouth
footbridge-drain-mouth footbridge-fuel-store the-willow^drain-mouth drain-mouth-fuel-store drain-mouth-back-gate
shed-floor^the-shelves shed-floor-mower-yard the-shelves^fuel-store the-shelves^mower-yard fuel-store-mower-yard fuel-store-back-gate mower-yard-back-gate
```

(Region ids contain hyphens; the planner writes the edges as `{ a, b, climb }` objects, not by parsing this list.)

### 4.6 `src/sim/world.ts` changes

- `createWorld(seed, tuning = TUNING, containers = MAP.containers, opts: { map?: MapKind } = {})`: graph =
  `graphFor(opts.map ?? 'slice')`; `map`, `tuningBase = tuning`, `lastSeason = seasonOf(1, tuning)`; every new field
  starts empty (`mowing = { next: 0, district: null, lastTick: null, mownUntil: {}, warned: false }`); after
  `initMarket`: `seedFactions(w, s.factions)`, `initBoards(w)`, `initMowing(w, s.mowing)`. Ledger `farmed` and
  `givenByPlayer` start at zero.
- `stepWorld` order: weather; if `seasonOf(day)` changed, `w.tuning = withSeason(w.tuningBase, season)` and update
  `lastSeason`; horde; npcs; groups; `stepSocial(w, s.social)`; `stepFactions(w, s.factions)`; market;
  `stepQuests(w, s.quests)`; `stepBuild(w, s.farm)`; `stepFarms(w, s.farm)`; `stepMowing(w, s.mowing)`;
  `stepStorylets(w, s.story)`; end of day (forage, recordDaily); chronicle; tick += 1.
- `recordDaily` assigns `factionDaily(w)`, `questDaily(w)` and `depthDaily(w)` into the row.
- `hatlessTotal` adds `bubbleHatless(w)`. `resourceTotals` adds every faction's `stock`. `acornTotal` adds faction
  `acorns` and every `PlayerRecord.acorns`. `hashWorld` also covers `memory`, `rumours`, `factions`, `groupFaction`,
  `players`, `quests`, `outcomes`, `bubbles`, `pieces`, `beds`, `mowing`, `storylets`, `lanterns`, `bellTick`.
- `export const LOCAL_PLAYER: PlayerKey = 'local'`.

### 4.7 `src/items/defs.ts` and `src/items/defsDepth.ts`

`Tag` gains `'CLOTH' | 'FIBRE' | 'CORD' | 'STICK' | 'PLANK' | 'NAILS' | 'IRON' | 'GLASS' | 'SOIL' | 'SEED' | 'FISH' |
'CHARCOAL' | 'SAW' | 'HAMMER' | 'SHARP' | 'PAPER' | 'LETTER' | 'SIGNAL' | 'BOOK' | 'FILTER' | 'COMPASS'`. `d()` is
exported. `ITEM_LIST = [...BASE_ITEMS, ...DEPTH_ITEMS]` (the current list becomes `BASE_ITEMS`). `defsDepth.ts`
(verbatim):

```ts
import { d, type ItemDef } from './defs';
export const DEPTH_ITEMS: readonly ItemDef[] = [
  d('cord', 'Cord', 'materials', ['CORD', 'BINDING', 'FIBRE'], 0.05, 0.2, 10),
  d('rag', 'Rag', 'materials', ['CLOTH', 'TINDER'], 0.05, 0.2, 10),
  d('stick', 'Stick', 'materials', ['STICK', 'KINDLING'], 0.2, 0.5, 10, { burnHours: 0.3 }),
  d('plank', 'Plank', 'materials', ['PLANK', 'MATERIAL'], 0.6, 1.5, 6),
  d('nails', 'Nails', 'materials', ['NAILS'], 0.05, 0.05, 30),
  d('iron-bar', 'Iron bar', 'materials', ['IRON', 'MATERIAL'], 1.0, 0.5, 4),
  d('scrap-gear', 'Scrap gear', 'materials', ['MATERIAL'], 0.2, 0.2, 6),
  d('glass-shard', 'Glass shard', 'materials', ['GLASS', 'SHARP'], 0.1, 0.2, 6),
  d('charcoal', 'Charcoal', 'fuel', ['CHARCOAL', 'FUEL'], 0.1, 0.2, 10, { burnHours: 1.5 }),
  d('soil-sack', 'Sack of compost soil', 'materials', ['SOIL'], 1.5, 2, 3),
  d('thorn', 'Thorn', 'materials', ['SHARP', 'PIERCE'], 0.02, 0.05, 20),
  d('feather', 'Feather', 'materials', ['MATERIAL'], 0.01, 0.1, 20),
  d('clover-seed', 'Clover seed', 'food', ['SEED'], 0.01, 0.05, 20),
  d('grain-sheaf', 'Grain sheaf', 'food', ['SEED', 'FOOD'], 0.3, 1, 6, { food: 6 }),
  d('acorn', 'Acorn', 'food', ['SEED', 'FOOD'], 0.05, 0.1, 20, { food: 3 }),
  d('fish', 'Fish', 'food', ['FISH', 'FOOD'], 0.3, 0.5, 4, { food: 12 }),
  d('smoked-fish', 'Smoked fish', 'food', ['FISH', 'FOOD'], 0.2, 0.4, 6, { food: 14 }),
  d('toadstool-stew', 'Toadstool stew', 'food', ['FOOD'], 0.4, 0.5, 2, { food: 25, water: 10 }),
  d('pickled-slug', 'Pickled slug', 'food', ['FOOD'], 0.2, 0.3, 6, { food: 10 }),
  d('acorn-flour-sack', 'Acorn flour', 'food', ['FOOD'], 0.4, 0.6, 4, { food: 16 }),
  d('petal-bundle', 'Petal bundle', 'medicine', ['MEDICINE'], 0.05, 0.2, 10),
  d('hand-saw', 'Hand saw', 'tools', ['SAW', 'CUT'], 0.5, 1, 1, { damage: 0.8, reach: 1.0 }, { maxCondition: 40 }),
  d('garden-mallet', 'Garden mallet', 'tools', ['HAMMER', 'BLUNT'], 0.7, 1, 1, { damage: 1.4, reach: 1.1 }, { maxCondition: 60 }),
  d('iron-trowel', 'Iron trowel', 'tools', ['DIG', 'PRY', 'BLUNT', 'SHARP'], 0.6, 1, 1, { damage: 1.3, reach: 1.1 }, { maxCondition: 80 }),
  d('dibber', 'Dibber', 'tools', ['DIG'], 0.2, 0.4, 1),
  d('watering-can', 'Watering can', 'tools', ['HOLD_LIQUID'], 0.5, 2, 1, { liquidCap: 3 }),
  d('fishing-rod', 'Fishing rod', 'tools', ['STICK'], 0.4, 2, 1),
  d('compass', 'Compass', 'tools', ['COMPASS'], 0.05, 0.1, 1),
  d('water-filter', 'Water filter', 'tools', ['FILTER'], 0.3, 0.5, 1, {}, { maxCondition: 20 }),
  d('red-book', 'Red book', 'materials', ['BOOK', 'PAPER'], 0.3, 0.5, 1),
  d('recipe-card', 'Recipe card', 'materials', ['BOOK', 'PAPER'], 0.01, 0.05, 4),
  d('folded-map', 'Folded map', 'materials', ['PAPER'], 0.02, 0.05, 1),
  d('sealed-letter', 'Sealed letter', 'valuables', ['LETTER', 'PAPER'], 0.01, 0.05, 1),
  d('clay-whistle', 'Clay whistle', 'tools', ['SIGNAL'], 0.05, 0.1, 1),
  d('signal-horn', 'Signal horn', 'tools', ['SIGNAL'], 0.3, 0.5, 1),
];
```

Prefab ids are the item ids; `cord`, `rag`, `stick`, `plank`, `nails`, `glass-shard`, `charcoal`, `soil-sack`, `thorn`,
`fish`, `smoked-fish` come from 6.6, `petal-bundle`, `compass`, `water-filter` from 6.4; all others already exist.

### 4.8 `src/world/types.ts`, `src/world/stamp.ts`, `src/world/fullMap.ts`, `src/world/districts/*`

`BlockKind` gains `'crypt' | 'niche-wall' | 'yew' | 'pond' | 'reed' | 'bench' | 'plaque' | 'wreath' | 'heap' | 'bay' |
'obelisk' | 'birdbath' | 'spire' | 'chapel' | 'shelf' | 'mower' | 'shed' | 'pipe' | 'ornament' | 'fence' | 'gate' |
'piece'`. `SpotKind` gains `'board' | 'lantern' | 'bell' | 'garden'`. Appended:

```ts
/** One district's blockout. Every id starts with `${DISTRICT_PREFIX[district]}-`. innerGates: walls on the border
    with an earlier stage, placed only while this district's stage is closed. */
export interface DistrictMap {
  district: DistrictId;
  blocks: BlockDef[]; routes: ClimbRouteDef[]; pits: PitDef[]; spots: SpotDef[]; havens: HavenDef[];
  water: WaterDef[]; paths: PathDef[]; props: PropDef[]; containers: ContainerDef[]; innerGates: BlockDef[];
}
```

`stamp.ts` (planner, full; the same helpers as `blockout.ts`, collecting into one district, each id prefixed):

```ts
export interface RowOpts { width: number; depth: number; gaps: number[]; heights: number[]; skipX0?: number; skipX1?: number; xEnd: number; row: number }
export interface Stamper {
  block(id: string, kind: BlockKind, x0: number, x1: number, z0: number, z1: number, h: number, y?: number): BlockDef;
  top(b: BlockDef): number;
  route(b: { id: string }, side: Side, kind: RouteKind, at: number): void;
  spot(id: string, kind: SpotKind, region: RegionId, x: number, y: number, z: number): void;
  spotOnTop(id: string, kind: SpotKind, region: RegionId, b: BlockDef, dx?: number, dz?: number): void;
  container(id: string, type: ContainerType, region: RegionId, x: number, y: number, z: number, guaranteed?: string[]): void;
  containerOnTop(id: string, type: ContainerType, region: RegionId, b: BlockDef, dx?: number, dz?: number): void;
  prop(prefab: string, x: number, y: number, z: number, rotY?: number): void;
  hatless(region: RegionId, pts: [number, number, number][]): void;   // spots h-<region>-1..n
  pit(id: string, rect: Rect, depth: number): void;
  haven(def: HavenDef): void;
  water(def: WaterDef): void;
  path(def: PathDef): void;
  kerbPlot(stone: BlockDef, length: number, inset: number): void;
  headstoneRow(prefix: string, x0: number, z: number, o: RowOpts): BlockDef[];
  gate(id: string, x0: number, x1: number, z0: number, z1: number, h: number): void; // an inner gate wall (kind 'gate')
  done(): DistrictMap;
}
export function createStamper(district: DistrictId): Stamper;  // prefixes every id (blocks, routes, spots, containers, pits, water, paths) with DISTRICT_PREFIX + '-'
```

`fullMap.ts` (planner, full): `DISTRICT_MAPS: readonly DistrictMap[]` (imports the ten district files);
`assembleFullMap(opts: { open?: readonly MapStage[] } = {}): BlockoutMap` = the slice `MAP` without those of its boundary hedges
(ids matching `/^hedge-\d+$/`) whose box overlaps a `NEW_REGIONS` rect, plus every district's lists, plus `innerGates` of districts whose stage is not in
`open` (default: all open), `bounds: FULL_BOUNDS`, `playerSpawn: MAP.playerSpawn`; `checkFullMap(map): string[]` =
`checkMap(map, FULL_REGIONS)` plus duplicate-id problems. `blockout.ts`: `checkMap(map, regions = REGIONS)`.

Each `districts/<name>.ts` stub: `export const <NAME>_MAP: DistrictMap = createStamper('<district>').done();` with
names `COLUMBARIUM_MAP` (`columbarium.ts`), `BELL_CHAPEL_MAP` (`bellChapel.ts`), `MAUSOLEUM_HILL_MAP`
(`mausoleumHill.ts`), `LAWN_SECTION_MAP` (`lawnSection.ts`), `DROWNED_CORNER_MAP` (`drownedCorner.ts`), `SHED_MAP`
(`shed.ts`), `YEW_WALK_MAP` (`yewWalk.ts`), `GNOME_GARDEN_MAP` (`gnomeGarden.ts`), `WREATHWOOD_MAP`
(`wreathwood.ts`), `COMPOST_MAP` (`compost.ts`).

`districts.test.ts` (planner, full): for every district map with at least one block: `checkFullMap(assembleFullMap())`
has no problem naming one of its ids; every id has its prefix; every one of its regions with `startHatless[1] > 0`
has at least 4 `hatless` spots, with `startNpcs[1] > 0` at least 2 `npc` spots, and every region at least 3
containers; every `HAVEN` region has a `HavenDef` whose rect lies in the region, one `board` spot and one `bed` spot;
every `HIGH` region has at least one route up; regions on the full map's outer edge have a `fence` block along it.

### 4.9 `src/world/collide.ts`

`createCollider(map, opts: { regions?: readonly RegionDef[] } = {})`: `regionAt` and `inBounds` use `opts.regions ??
REGIONS`. `Collider` gains `addBlock(b: BlockDef): void` and `removeBlock(id: string): void` (insert into / remove from
the grid and the id map; used for built pieces).

### 4.10 `src/config.ts` (appended, verbatim)

```ts
export const DOM_MORE = { talk: 'dayg-talk', ledger: 'dayg-ledger', board: 'dayg-board', room: 'dayg-room', build: 'dayg-build', net: 'dayg-net' } as const;
export const NET = {
  game: 'dayg', poseHz: 10, hatlessHz: 10, sunEverySec: 5, newsEverySec: 5, saveEverySec: 300, chunkChars: 40000,
  resendSec: 2, maxPlayers: 16, phoneHostCap: 4, interpDelayMs: 150,
} as const;
export const STREAMING = { chunk: 256, radius: 3, maxBuildPerFrame: 2 } as const;  // chunks of 256 gm; keep |dx|,|dz| <= radius chunks
export const TALK = { radius: 2.5, linesShown: 6 } as const;
export const BOARD = { radius: 2.5 } as const;
export const SKILL = { base: 100, growth: 1.5, maxLevel: 10, timePerLevel: 0.08, failPerLevel: 0.1, xpEasy: 2, xpHard: 10, bookMul: 2, teacherMul: 3, lineageShare: 0.5 } as const;
export const BUILD = { grid: 4, half: 2, reach: 6, ghostOpacity: 0.45 } as const;
export const RESPAWN_KIT: readonly ItemStack[] = [
  { def: 'rag', count: 1, condition: 1 }, { def: 'candle', count: 1, condition: 1 }, { def: 'bread-loaf', count: 1, condition: 1 },
];
```

### 4.11 `src/game/types.ts` and `src/game/bus.ts` (appended, verbatim)

`NpcActors` gains `nearest(pos: Vec3, radius: number): NpcId | null` and `positionOf(id: NpcId): Vec3 | null`.
`HatlessSystem` gains `exportState(): HatlessNet[]`, `applyRemote(list: readonly HatlessNet[]): void`,
`setAuthority(owner: boolean): void` (false = puppets driven by `applyRemote`, no AI, and `strike` queues the hit
instead), `drainStrikes(): { x: number; y: number; z: number; f: number; reach: number; dmg: number }[]` (the hits
queued while not the authority), `setExtraTargets(fn: (() => { key: string; pos: Vec3 }[]) | null): void` (other
players the owner's Hatless may chase; a scratch on one emits nothing locally and is reported through
`onRemoteScratch`), `onRemoteScratch(fn: (key: string, strength: number, from: { x: number; z: number }) => void): void`,
`setHazards(fn: ((x: number, z: number) => number) | null): void` (damage per second at a point, e.g. spike lines).
`WorldView` gains `update(focus: Vec3): void`. `HudState` gains `acorns?: number; quest?: string | null; net?: string | null`.
`Recap` gains `onRise(fn: (at: HavenId) => void): void` and `hide(): void`. `RecipeId` gains `'cord' | 'rope-coil' |
'torch' | 'acorn-club' | 'toadstool-stew' | 'smoked-fish' | 'charcoal' | 'acorn-flour' | 'plank' | 'ladder' |
'water-filter' | 'grave-lantern' | 'clay-jar' | 'glaze-pot' | 'nails' | 'iron-trowel'`; add `export type Station =
'hand' | 'fire' | 'workbench' | 'kiln' | 'anvil'`; `RecipeDef` gains optional `station?: Station; skill?: { id: SkillId;
level: number }; items?: { def: ItemId; count: number }[]; output?: { def: ItemId; count: number }` (exact item inputs
next to the tag inputs; the made item).

```ts
import type { ActionEnvelope, ActionResult, BoardId, HavenId, NpcId, PieceKind, PlayerKey, Quest, QuestId, SimAction, SkillId, TickResult, WorldState } from '../sim/types';
import type { Streams } from '../sim/rng';
import type { DaygMsg, Snapshot } from '../net/protocol';

/** s: 0 idle, 1 walk, 2 lunge, 3 down (crumbling). id is stable while the Hatless exists. */
export interface HatlessNet { id: number; x: number; y: number; z: number; f: number; s: 0 | 1 | 2 | 3 }
export type SimRole = 'solo' | 'host' | 'guest';
export interface SimHost {
  readonly world: WorldState;          // the main-thread replica; the object is never replaced (fields are reassigned)
  readonly streams: Streams;           // the same object; its Rng fields are replaced after a worker step
  readonly role: SimRole;
  readonly me: PlayerKey;
  setRole(role: SimRole, me: PlayerKey): void;
  setOutbox(fn: ((a: SimAction) => void) | null): void;   // guest: apply() hands actions to it
  apply(a: SimAction): ActionResult | null;               // solo/host: sequence and apply now; guest: send, return null
  applyFor(player: PlayerKey, a: SimAction): ActionResult; // solo/host: sequence an action on behalf of another player (a guest's 'act')
  receive(env: ActionEnvelope): ActionResult;             // apply an envelope the host sequenced (guests, replays)
  update(sunHours: number): void;                         // solo/host: tick while Math.floor(sunHours) > world.tick
  receiveTick(tick: number, hash: string): void;          // guest: tick up to `tick`, compare the hash
  onTick(fn: (r: TickResult & { desync: boolean }) => void): () => void;
  onAction(fn: (env: ActionEnvelope, r: ActionResult) => void): () => void;
  log(): readonly ActionEnvelope[];                       // envelopes applied since the last snapshot() or load()
  snapshot(): Snapshot;                                   // clears log()
  load(s: Snapshot): void;                                // replaces the replica in place, replays s.log, emits onTick
  busy(): boolean;                                        // a worker step is in flight
}
export interface TalkPanel { root: HTMLElement; open(npc: NpcId): void; close(): void; isOpen(): boolean }
export type LedgerTab = 'people' | 'factions' | 'quests' | 'skills';
export interface LedgerPanel { root: HTMLElement; open(tab?: LedgerTab): void; close(): void; toggle(): void; isOpen(): boolean }
export interface BoardPanel { root: HTMLElement; open(board: BoardId): void; close(): void; isOpen(): boolean }
export interface BoardsInWorld { boardNear(pos: Vec3): BoardId | null }
export interface QuestRunner { update(dt: number): void; active(): Quest[]; tracked(): Quest | null; track(id: QuestId | null): void }
export interface RoomChoice { mode: 'solo' | 'create' | 'join' | 'reopen'; code: string | null; title: string; pace: 'brisk' | 'standard' | 'slow'; roomMode: 'full' | 'haven-peace' | 'co-op' }
export interface RoomListItem { code: string; title: string; summary: string; updatedAt: string }
export interface RoomPanel { root: HTMLElement; open(): void; close(): void; isOpen(): boolean; onChoose(fn: (c: RoomChoice) => void): void; onOpen(fn: () => void): void; setWorlds(list: readonly RoomListItem[]): void; setStatus(text: string): void }
export type NetStatus = 'offline' | 'connecting' | 'host' | 'guest' | 'lost';
export interface NetPlayer { id: number; key: PlayerKey; name: string; character: string; userId: string | null; color: number }
export interface NetSession {
  readonly status: NetStatus; readonly code: string | null; readonly myId: number | null;
  players(): NetPlayer[];
  start(c: RoomChoice, me: { name: string; character: string }): Promise<void>;
  leave(): void;
  update(dt: number): void;
  send(to: number | null, m: DaygMsg): void;
  onStatus(fn: (s: NetStatus) => void): () => void;
  onMessage(fn: (from: number, m: DaygMsg) => void): () => void;
  keyOf(id: number): PlayerKey | null; idOf(key: PlayerKey): number | null;
}
export interface RemotePlayers { update(dt: number): void; count(): number }
export interface BubbleSync { update(dt: number): void }
export interface RoomSaver { update(dt: number): void; saveNow(reason: 'timer' | 'handoff' | 'leave'): Promise<boolean>; lastSaved(): number | null }
export interface SkillSystem {
  xp: Record<SkillId, number>;
  level(s: SkillId): number;
  gain(s: SkillId, kind: 'easy' | 'hard' | 'fail', mul?: number): void;
  timeMul(s: SkillId): number;                   // 1 - 0.08 x level
  failChance(s: SkillId, need: number): number;  // 0.1 x max(0, need - level)
  load(xp: Partial<Record<SkillId, number>>): void;
  onLevel(fn: (s: SkillId, level: number) => void): () => void;
}
export interface BuildSystem { update(dt: number): void; start(kind: PieceKind): boolean; cancel(): void; placing(): PieceKind | null; confirm(): boolean; canAfford(kind: PieceKind): boolean }
export interface BuildPanel { root: HTMLElement; open(): void; close(): void; toggle(): void; isOpen(): boolean }
export interface FarmSystem { update(dt: number): void }
export interface TrapSystem { update(dt: number): void }
export interface LanternSystem { update(dt: number): void; litCount(): number }
export interface MowingFx { update(dt: number): void }
export interface PiecesView { update(dt: number): void }
export interface Respawner { respawn(at: HavenId): void }
export type DaygEvent =
  | { ev: 'dayg_session'; role: SimRole; players: number; map: string; minutes: number; quests: number; deaths: number }
  | { ev: 'dayg_day'; rh: string; seed: number; day: number; alive: number; start: number; hatless: number; factions: number; quests: number; food: number; price: number; players: number }
  | { ev: 'dayg_quest'; template: string; done: boolean; minutes: number }
  | { ev: 'dayg_death'; cause: string; region: string; minutes: number; unfair: boolean };
export interface Telemetry { record(e: DaygEvent): void; flush(): void }
```

`GameEvents` gains (verbatim):

```ts
  'talked': { npc: NpcId; verb: TalkVerb; ok: boolean };
  'quest-taken': { quest: QuestId }; 'quest-done': { quest: QuestId; template: QuestTemplate }; 'quest-failed': { quest: QuestId };
  'joined-faction': { faction: FactionId }; 'rank-changed': { faction: FactionId; rank: Rank };
  'board-opened': { board: BoardId };
  'world-loaded': { tick: number };                       // SimHost.load replaced the world (systems re-read it)
  'net-status': { status: NetStatus }; 'host-changed': { me: boolean }; 'desync': { tick: number };
  'respawned': { at: HavenId; taught: boolean };
  'skill-up': { skill: SkillId; level: number };
  'piece-built': { kind: PieceKind; id: number }; 'harvested': { crop: CropId; food: number }; 'trap-sprung': { kind: PieceKind };
  'lantern-lit': { id: string; lit: number }; 'bell-rung': { survived: boolean };
  'mowing': { district: DistrictId; here: boolean };
```

### 4.12 `src/net/protocol.ts` (planner, verbatim)

```ts
// DayG game messages (the `d` of an @lawn/mp relay). Pure types and constants.
import type { ActionEnvelope, MapKind, PlayerKey, RegionId, SimAction } from '../sim/types';
import type { StreamName } from '../sim/rng';
import type { HatlessNet } from '../game/types';

export interface Snapshot {
  v: 1; seed: number; map: MapKind; tuningHash: string; tick: number; hash: string;
  world: string;                                 // JSON of WorldState without graph, tuning, tuningBase
  streams: Record<StreamName, number>;           // Rng.state() of every stream
  log: ActionEnvelope[];                         // envelopes applied after the snapshot was taken (replayed on load)
}
/** a: 0 idle, 1 walk, 2 run, 3 climb, 4 down. */
export interface Pose { x: number; y: number; z: number; f: number; a: 0 | 1 | 2 | 3 | 4; r: RegionId | null; held: string | null }
export type DaygMsg =
  | { t: 'hi'; key: PlayerKey; name: string; look: string; userId: string | null; snap: number }  // to the host on match/joined; snap = newest local snapshot tick or -1
  | { t: 'act'; n: number; a: SimAction }                                     // guest -> host: my n-th action
  | { t: 'env'; e: ActionEnvelope[]; ack: { key: PlayerKey; n: number } | null } // host -> all
  | { t: 'tick'; tick: number; hash: string; sun: number }                    // host -> all after each world tick
  | { t: 'snap'; id: string; i: number; of: number; d: string }               // host -> one: chunk i of `of` (base64 of the packed snapshot)
  | { t: 'sun'; sun: number }                                                 // host -> all every NET.sunEverySec
  | { t: 'pose'; p: Pose }                                                    // client -> interested players, NET.poseHz
  | { t: 'hl'; r: RegionId; l: HatlessNet[] }                                 // bubble owner -> its viewers, NET.hatlessHz
  | { t: 'hit'; r: RegionId; x: number; y: number; z: number; f: number; reach: number; dmg: number } // viewer -> bubble owner
  | { t: 'scratch'; strength: number; x: number; z: number }                  // bubble owner -> the viewer its Hatless scratched
  | { t: 'news'; lines: string[] }                                            // host -> all every NET.newsEverySec
  | { t: 'bye' };                                                             // leaving for good
```

### 4.13 Stubs (final signatures, trivial bodies), small edits, `main.ts`

| File | Exports (final signatures) | Stub body | Owner |
|---|---|---|---|
| `sim/social.ts` | `subjectOfNpc(id: NpcId): SubjectKey`, `subjectOfPlayer(key: PlayerKey): SubjectKey`, `memoryOf(w, npc: NpcId): NpcMemory`, `entryOf(w, npc: NpcId, s: SubjectKey): TrustEntry \| null`, `trustOf(w, npc: NpcId, s: SubjectKey): number`, `adjustTrust(w, npc: NpcId, s: SubjectKey, delta: number): void`, `witnessDeed(w, who: SubjectKey, deed: Deed, region: RegionId, rng: Rng): void`, `startRumour(w, fact: RumourFact, origin: RegionId): void`, `stepSocial(w, rng): void`, `standingOf(w, f: FactionId, player: PlayerKey): number`, `knownBy(w, player: PlayerKey): { npc: NpcId; trust: number }[]` | keys `n:`/`p:`; memoryOf creates `{ entries: [] }`; adjustTrust adds or updates the entry (clamped); the rest 0, null, [] or no-op | 7.1 |
| `sim/factions.ts` | `interface FounderDef { id: FounderId; name: string; faction: string; hat: number; home: RegionId; fallback: RegionId; traits: Partial<NpcTraits>; norms: Norms }`, `FOUNDERS: readonly FounderDef[]` (stub `[]`; 7.2 fills it), `seedFactions(w, rng): void`, `stepFactions(w, rng): void`, `factionOf(w, npc: Npc): Faction \| null`, `membersOf(w, f: Faction): NpcId[]`, `powerOf(w, f: Faction): number`, `havenHolder(w, h: HavenId): FactionId \| null`, `rankOf(w, f: FactionId, player: PlayerKey): Rank \| null`, `joinFaction(w, f: FactionId, player: PlayerKey): boolean`, `leaveFaction(w, player: PlayerKey): void`, `promoteRanks(w, player: PlayerKey): Rank \| null`, `factionDaily(w): Pick<DailyRow, 'factions' \| 'topFactions' \| 'hhiNorm' \| 'topShare' \| 'havensUp' \| 'havenHolders'>` | no factions; null / 0 / false; `factionDaily` zeros | 7.2 |
| `sim/quests.ts` | `initBoards(w): void`, `stepQuests(w, rng): void`, `questsOn(w, board: BoardId): Quest[]`, `questsNear(w, region: RegionId, hops: number): Quest[]`, `takeQuest(w, q: QuestId, player: PlayerKey): boolean`, `progressQuest(w, q: QuestId, player: PlayerKey, amount: number): void`, `deliver(w, q: QuestId, player: PlayerKey, resource: Resource, count: number): number`, `completeQuest(w, q: QuestId, player: PlayerKey): QuestReward \| null`, `abandonQuest(w, q: QuestId, player: PlayerKey): void`, `postQuest(w, q: NewQuest): QuestId`, `questDaily(w): Pick<DailyRow, 'marketInBand' \| 'questsOpen' \| 'questsDone' \| 'templatesOffered' \| 'outcomesMeasured' \| 'outcomesReached'>`, `questStartItems(q: Quest): ItemStack[]`, `questTitle(w, q: Quest): string`; `export type NewQuest = Omit<Quest, 'id' \| 'state' \| 'takenBy' \| 'takenTick' \| 'doneTick' \| 'progress'>` | `initBoards` real: one board per `HAVEN` region in `w.graph` (`id 'board:<region>'`, name `HAVEN_NAME[haven] + ' board'`, `newcomer` true for `gate-roof`); the rest [] / false / 0 / null / no-op | 7.3 |
| `sim/talk.ts` | `verbsFor(w, npc: NpcId, player: PlayerKey): { verb: TalkVerb; ok: boolean; why: string \| null }[]`, `talk(w, input: TalkInput, rng: Rng): TalkResult` | every verb ok; talk returns ok with one line `{ key: 'greet.neutral', vars: { name } }`, empty give/take | 7.4 |
| `sim/phrases.ts` | `PHRASES: Record<string, readonly string[]>`, `renderLine(line: PhraseLine, pick: number): string`, `renderLines(lines: readonly PhraseLine[], seed: number): string[]` | one phrase `'greet.neutral': ['{name} nods.']`; `{var}` replaced | 7.4 |
| `sim/actions.ts` | `applyAction(w, s: Streams, env: ActionEnvelope): ActionResult`, `tickWorld(w, s: Streams): TickResult` | `player-join` creates or revives the `PlayerRecord` (acorns 0, online true); everything else `{ ok: false, error: 'stub' }`; `tickWorld` = `stepWorld` then `{ tick: w.tick, arrivals: [], hash: hashWorld(w) }` | 7.5 |
| `sim/bubbles.ts` | `bubbleOf(w, player: PlayerKey): Bubble \| null`, `bubbleIn(w, r: RegionId): Bubble \| null`, `enterRegion(w, player: PlayerKey, r: RegionId \| null, alive: number): { promoted: number; owner: PlayerKey \| null }`, `absorbBubbles(w): Arrival[]`, `destroyInBubble(w, r: RegionId): boolean`, `bubbleHatless(w): number` | `bubbleHatless` real (sum of `hatless`); the rest null / no-op / [] / false | 7.5 |
| `sim/bots.ts` | `type BotKind = 'quester' \| 'scavenger' \| 'solo' \| 'friends'`, `interface BotRow { seed: number; bot: PlayerKey; kind: BotKind; day: number; region: RegionId \| null; alive: boolean; questsNear: number; templatesSeen: QuestTemplate[]; questsDone: number; districts: DistrictId[]; sessionOk: boolean \| null; deaths: number; cause: DeathCause \| null }`, `addBots(w, s: Streams, kinds: readonly BotKind[]): PlayerKey[]`, `stepBots(w, s: Streams, bots: readonly PlayerKey[]): ActionEnvelope[]`, `botDaily(w, bots: readonly PlayerKey[]): BotRow[]`, `runWithBots(seed: number, days: number, kinds: readonly BotKind[], opts?: { tuning?: Tuning; map?: MapKind; perturb?: boolean }): { world: WorldState; rows: DailyRow[]; bots: BotRow[] }`, `divergence(a: WorldState, b: WorldState): number`, `nullPerturb(w, rng: Rng): void` | [] / 0 / `runWorld` without bots | 7.7 |
| `sim/build.ts` | `placePiece(w, def: PieceDef, owner: SubjectKey): Piece`, `damagePiece(w, id: number, amount: number): void`, `removePiece(w, id: number): void`, `piecesIn(w, r: RegionId): Piece[]`, `stepBuild(w, rng): void`, `defenceOf(w, r: RegionId): number`, `checkSnare(w, piece: number): ItemStack[]`, `depthDaily(w): Pick<DailyRow, 'piecesUp' \| 'bedsGrowing' \| 'farmedFood' \| 'mown'>` | `placePiece` pushes a Piece (hp = `tuning.build.hp[kind]`) and, for `garden-bed`, a `Bed`; the rest trivial | 7.17 |
| `sim/farming.ts` | `plantBed(w, bed: number, crop: CropId): boolean`, `waterBed(w, bed: number, litres: number): void`, `tendBed(w, bed: number): void`, `harvestBed(w, bed: number): ItemStack[]`, `stepFarms(w, rng): void`, `bedOf(w, piece: number): Bed \| null` | trivial | 7.17 |
| `sim/mowing.ts` | `initMowing(w, rng): void`, `stepMowing(w, rng): void`, `isMown(w, d: DistrictId): boolean`, `mowingSoon(w): { district: DistrictId; inTicks: number } \| null`, `regionTraits(w, r: RegionId): readonly Trait[]` | `next = everyDays[0] x ticksPerDay`; traits from the graph | 7.18 |
| `sim/storylets.ts` | `STORYLETS: readonly { id: StoryletId; title: string }[]`, `stepStorylets(w, rng): void` | ids and titles (The Last Sexton, Seeds for the Spring, The Greybearded Walk, Who Rang the Horn?, The Mower Rumbles, The Gate Book); no-op | 7.18 |
| `sim/seasonal.ts` | `withSeason(t: Tuning, season: Season): Tuning`, `seasonalReport(runs: readonly (readonly DailyRow[])[], t: Tuning): string` | `withSeason` real: `withOverrides(t, t.seasonal[season] ?? {})`; report `''` | 9.9 |
| `sim/liveCompare.ts` | `interface LiveDay { rh: string; seed: number; day: number; alive: number; start: number; hatless: number; factions: number; quests: number; food: number; price: number; players: number }`, `parseTelemetry(jsonl: string): LiveDay[]`, `compare(live: readonly LiveDay[], sim: ReadonlyMap<number, readonly DailyRow[]>): { metric: string; live: number; sim: number; ratio: number; within20: boolean }[]`, `formatComparison(rows: ReturnType<typeof compare>): string` | [] / `''` | 9.8 |
| `net/snapshot.ts` | `tuningHash(t: Tuning): string`, `makeSnapshot(w, s: Streams, log: readonly ActionEnvelope[]): Snapshot`, `restoreSnapshot(snap: Snapshot, tuning?: Tuning): { world: WorldState; streams: Streams }`, `packSnapshot(snap: Snapshot): Promise<Uint8Array>`, `unpackSnapshot(bytes: Uint8Array): Promise<Snapshot>`, `toBase64(b: Uint8Array): string`, `fromBase64(s: string): Uint8Array`, `chunk(text: string, size: number): string[]`, `replay(w, s: Streams, log: readonly ActionEnvelope[], toTick: number): void` | throw `new Error('stub')` except `chunk` (real) | 7.6 |
| `net/interest.ts` | `interestedPlayers(w, me: PlayerKey): PlayerKey[]`, `bubbleViewers(w, owner: PlayerKey): PlayerKey[]`, `newsSince(w, tick: number): string[]`, `regionSummary(w, r: RegionId): { region: RegionId; hatless: number; npcs: number; danger: 0 \| 1 \| 2 \| 3 }` | [] / zeros | 7.6 |
| `net/simHost.ts` | `createSimHost(opts: { world: WorldState; streams: Streams; worker: boolean; me: PlayerKey }): SimHost` | in-thread solo host that works: apply sequences and calls `applyAction`; update calls `tickWorld`; log, snapshot (via `makeSnapshot`) and load; `worker` ignored | 8.5 |
| `net/simWorker.ts` | worker entry (`self.onmessage`) | empty handler | 8.5 |
| `net/session.ts` | `createNetSession(deps: SessionDeps): NetSession`; `interface SessionDeps { host: SimHost; bus: Bus; clock: Clock; getPose: () => Pose; client?: NetClient<DaygMsg> }` | status `'offline'`, no-ops | 8.6 |
| `net/bubbleSync.ts` | `createBubbleSync(deps: { host: SimHost; session: NetSession; hatless: HatlessSystem; getPlayer: () => PlayerState; bus: Bus }): BubbleSync` | no-op | 8.8 |
| `net/roomSave.ts` | `createRoomSaver(deps: { host: SimHost; session: NetSession; rooms?: RoomSaves }): RoomSaver`; `loadRoom(code: string, rooms?: RoomSaves): Promise<Snapshot \| null>` | no-op, false, null | 8.9 |
| `ui/talkPanel.ts` | `createTalkPanel(ui: HTMLElement, deps: TalkDeps): TalkPanel`; `interface TalkDeps { host: SimHost; npcs: NpcActors; interact: Interact; inv: InventorySystem; bus: Bus; getPlayer: () => PlayerState }` | hidden `#dayg-talk` | 8.1 |
| `ui/ledgerPanel.ts` | `createLedgerPanel(ui: HTMLElement, deps: { host: SimHost; quests: QuestRunner; skills: SkillSystem; bus: Bus }): LedgerPanel` | hidden `#dayg-ledger` | 8.2 |
| `scene/boards.ts` | `createBoards(deps: { scene: THREE.Scene; map: BlockoutMap; interact: Interact; host: SimHost; panel: BoardPanel; bus: Bus }): BoardsInWorld` | null | 8.3 |
| `ui/boardPanel.ts` | `createBoardPanel(ui: HTMLElement, deps: { host: SimHost; inv: InventorySystem; bus: Bus; getPlayer: () => PlayerState }): BoardPanel` | hidden `#dayg-board` | 8.3 |
| `game/questRunner.ts` | `createQuestRunner(deps: { host: SimHost; bus: Bus; inv: InventorySystem; getPlayer: () => PlayerState }): QuestRunner` | [] / null | 8.4 |
| `ui/roomPanel.ts` | `createRoomPanel(ui: HTMLElement): RoomPanel` | hidden `#dayg-room` | 8.7 |
| `scene/remotePlayers.ts` | `createRemotePlayers(deps: { scene: THREE.Scene; host: SimHost; session: NetSession }): RemotePlayers` | no-op, 0 | 8.8 |
| `game/skills.ts` | `createSkills(bus: Bus): SkillSystem` | all 0, `timeMul` 1, `failChance` 0 | 8.13 |
| `game/respawn.ts` | `createRespawner(deps: { host: SimHost; player: PlayerState; inv: InventorySystem; needs: NeedsSystem; body: BodySystem; skills: SkillSystem; bus: Bus; map: BlockoutMap; collider: Collider }): Respawner` | no-op | 8.14 |
| `game/building.ts` | `createBuildSystem(deps: { scene: THREE.Scene; host: SimHost; inv: InventorySystem; collider: Collider; interact: Interact; bus: Bus; skills: SkillSystem; getPlayer: () => PlayerState; getYaw: () => number }): BuildSystem` | no-op, false | 9.1 |
| `scene/pieces.ts` | `createPiecesView(deps: { scene: THREE.Scene; host: SimHost; collider: Collider; bus: Bus }): PiecesView` | no-op | 9.1 |
| `ui/buildPanel.ts` | `createBuildPanel(ui: HTMLElement, deps: { build: BuildSystem; inv: InventorySystem }): BuildPanel` | hidden `#dayg-build` | 9.1 |
| `game/farming.ts` | `createFarmSystem(deps: { host: SimHost; inv: InventorySystem; interact: Interact; bus: Bus; skills: SkillSystem }): FarmSystem` | no-op | 9.2 |
| `game/traps.ts` | `createTrapSystem(deps: { host: SimHost; hatless: HatlessSystem; bus: Bus; getPlayer: () => PlayerState }): TrapSystem` | no-op | 9.2 |
| `scene/lanterns.ts` | `createLanterns(deps: { scene: THREE.Scene; map: BlockoutMap; interact: Interact; host: SimHost; inv: InventorySystem; bus: Bus; getPlayer: () => PlayerState }): LanternSystem` | no-op, 0 | 9.4 |
| `scene/mowingFx.ts` | `createMowingFx(deps: { scene: THREE.Scene; host: SimHost; bus: Bus; getPlayer: () => PlayerState; camera: THREE.Camera }): MowingFx` | no-op | 9.4 |
| `live/telemetry.ts` | `createTelemetry(deps: { host: SimHost; bus: Bus; clock: Clock; getRole: () => SimRole; wsUrl: string }): Telemetry` | no-op | 9.7 |

Small edits to existing files (planner): `npcActors.ts` gets real `nearest` and `positionOf` (loop over shown actors);
`hatless.ts` gets `exportState` and `drainStrikes` returning `[]` and no-op `applyRemote`, `setAuthority`,
`setExtraTargets`, `onRemoteScratch`, `setHazards`; `recap.ts` gets no-op `onRise` and a `hide`; `scripts/sim.mjs`
uses `const r = await runCli(...)` (so the CLI may become async); `cli.ts` passes `--map` to `createWorld`; `worldBuilder.ts`
gets a no-op `update` and a colour for every new `BlockKind`; `hud.ts` and `eventLog.ts` import `HAVEN_NAME`; fix any
`Record<RegionId | HavenId, ...>` literal tsc flags by building it from the graph.

Packages: `games/dayg/package.json` adds `@lawn/mp`, `@lawn/cloudsave`, `@lawn/platform` (all `*`), then `npm install`
at the root; `vite.config.ts` adds `worker: { format: 'es' }`; `proto/gnome/common/v1/common.proto` appends
`GAME_DAYG = 12; // dayg`; `packages/prefabs/src/catalog/dayg-build.ts` and `dayg-materials.ts` are created as
`export const DAYG_BUILD: readonly PrefabDef[] = [];` / `export const DAYG_MATERIALS: readonly PrefabDef[] = [];` and
registered in `catalog/index.ts` next to `DAYG`.

`main.ts` (planner): new params `map` (`slice` default, `full`), `worker` (default `1`), `room` (a code to join),
`open` (`talk` | `ledger` | `board` | `room` | `build`: open that panel at start, for screenshots). `mapData = map ===
'full' ? assembleFullMap() : MAP`; `createWorld(seed, TUNING, mapData.containers, { map })`; `createCollider(mapData,
{ regions: regionsFor(map) })`; `host = createSimHost({ world, streams, worker, me: LOCAL_PLAYER })` and
`host.apply({ kind: 'player-join', ... })`; then every stub above is constructed in table order and updated in the
frame loop; `worldView.update(player.pos)` each frame. Until the end of round 3, `simFeed` keeps stepping the world
itself and `host.update` is **not** called; at the end of round 3 the planner switches the frame to
`host.update(clock.sunHours)` (8.10's contract). Movement and actions are blocked while the talk, board, ledger,
room or build panel is open (as for the pack). On the full map the camera's far plane is 2500 and fog starts at 600.
`window.__dayg` also exposes `host`, `session`, `quests`, `skills`, `hash()` (= `hashWorld(host.world)`) and
`desyncs` (a counter of `desync` bus events). The HUD gets `acorns`, `quest` (the tracked quest's title) and `net`
(the session status when not offline).

### 4.14 Step 0 checks

- `npx tsc --noEmit -p games/dayg`, `npm run build -w games/dayg`, `npm test -w games/dayg` (determinism and
  conservation tests still pass: new steps are no-ops), `npm run sim -w games/dayg -- --seeds 2 --days 3` (the planner
  adds `--map full` to `cli.ts` in Step 0: it passes `{ map }` to `createWorld`), `npm run sim -w games/dayg -- --seeds
  1 --days 3 --map full`, `npm test -w packages/prefabs`, `npm run lore`.
- `npm run dev -w games/dayg`, then `bash tools/smoke.sh "http://localhost:5206/?seed=1" dayg-hud dayg-inv dayg-touch
  dayg-talk dayg-ledger dayg-board dayg-room dayg-build` and the same with `&map=full`.
- Commit Step 0 on the branch (one commit), so round-1 workers start from it.

---

## 5. Issues

Where an issue says "(paste the shared ... Environment block ...)", the planner replaces that line with the block
when launching the worker (the worker cannot see this roadmap). Before each round the planner re-checks the round's
issues against the code as it stands and corrects their text.

### Round 1, Epic 6: platform, mp, prefabs, lore, graph test

~~~~text
Epic: 6 Platform, mp, prefabs, lore (issue 6.1 Room-save proto and codegen)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Go is installed (`go version`).
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Ten other workers are editing other files at the same time (one of them writes
  packages/platform-server/internal/store/room.go). Edit only the files under Change plus the generated code.

## Goal
A `RoomSaveService` exists in the platform's protos, with generated Go and TypeScript code and a `roomSaveClient()`
in @lawn/platform, so the service and the browser client can be written next.

## Read first
- proto/gnome/save/v1/save.proto: the house style for comments, auth notes and error codes.
- proto/buf.gen.yaml: the codegen command and plugins (comments at the top).
- proto/README.md: lint and breaking-change rules (never renumber a field).
- packages/platform/src/client.ts and index.ts: how `saveClient()` is built and exported.

## Change
- proto/gnome/save/v1/room.proto (new): exactly the file in Contract.
- Generated code: from proto/, run codegen for the four paths. On Windows, copy proto/buf.gen.yaml to
  "$TEMP/buf.gen.win.yaml" and change the three `local:` entries to absolute paths:
  `C:/Users/cpsai/go/bin/protoc-gen-go.exe`, `C:/Users/cpsai/go/bin/protoc-gen-connect-go.exe` and
  `C:/Users/cpsai/orca/workspaces/lawn-gnome-panic/encantado/node_modules/.bin/protoc-gen-es.cmd`; then
  `cd proto && npx @bufbuild/buf@1.47.2 generate --template "$TEMP/buf.gen.win.yaml" --path gnome/user --path gnome/save --path gnome/common --path gnome/profile`.
  This writes packages/platform-server/gen/gnome/save/v1/room.pb.go, .../savev1connect/room.connect.go and
  packages/platform/src/gen/gnome/save/v1/room_pb.ts, and refreshes the common enum (it already has GAME_DAYG = 12).
- packages/platform/src/client.ts: `export function roomSaveClient(): Client<typeof RoomSaveService>` built like
  `saveClient()` (`createClient(RoomSaveService, transport())`), importing `RoomSaveService` from
  './gen/gnome/save/v1/room_pb'.
- packages/platform/src/index.ts: export `roomSaveClient` next to `saveClient`.

## Contract
```proto
syntax = "proto3";

package gnome.save.v1;

import "gnome/common/v1/common.proto";
import "google/protobuf/timestamp.proto";

// RoomSaveService: one shared world save per room (DayG). A room is made by one player (its creator) and is
// shared by its members: any member can read and write its save, so any member can host the room next time.
// Auth is the same Keycloak access token as gnome.user.v1.UserService; every RPC here is [caller] and the
// caller's account is created on first use, as in SaveService.
//
// A save is the game's own bytes (DayG: a gzipped snapshot), sent in parts of at most 512 KiB, at most 16 parts
// and 8 MiB in all. Upload the parts with PutRoomSavePart under one upload_id, then CommitRoomSave. Commits are
// guarded by revision like SaveService.PutSave: a stale base_revision is ABORTED and nothing changes. Only the
// newest committed revision's parts can be read.
service RoomSaveService {
  // [caller] Makes a room with a new 8-character code (A-Z, 0-9); the caller is its creator and first member.
  rpc CreateRoom(CreateRoomRequest) returns (CreateRoomResponse);
  // [caller] Becomes a member (no-op for a member). NOT_FOUND: no such code. PERMISSION_DENIED: invite-only and
  // no valid unused invite. FAILED_PRECONDITION: the room is closed.
  rpc JoinRoom(JoinRoomRequest) returns (JoinRoomResponse);
  // [caller] The rooms the caller is a member of for one game, most recently saved first ("My worlds").
  rpc ListMyRooms(ListMyRoomsRequest) returns (ListMyRoomsResponse);
  // [caller, member] The newest committed save's manifest. NOT_FOUND: no save yet. PERMISSION_DENIED: not a member.
  rpc GetRoomSave(GetRoomSaveRequest) returns (GetRoomSaveResponse);
  // [caller, member] One part of a committed revision. NOT_FOUND: that revision is not the newest any more.
  rpc GetRoomSavePart(GetRoomSavePartRequest) returns (GetRoomSavePartResponse);
  // [caller, member] Stages one part of an upload. INVALID_ARGUMENT: index >= 16 or data over 512 KiB.
  rpc PutRoomSavePart(PutRoomSavePartRequest) returns (PutRoomSavePartResponse);
  // [caller, member] Makes the staged parts of upload_id the room's save. ABORTED: base_revision is stale.
  // INVALID_ARGUMENT: a part is missing, or total_bytes is over 8 MiB, or part_hashes has the wrong length.
  rpc CommitRoomSave(CommitRoomSaveRequest) returns (CommitRoomSaveResponse);
  // [caller, creator] Sets invite-only, removes members (never the creator) or closes the room.
  rpc UpdateRoom(UpdateRoomRequest) returns (UpdateRoomResponse);
  // [caller, creator] A single-use invite token for an invite-only room.
  rpc CreateInvite(CreateInviteRequest) returns (CreateInviteResponse);
}

message Room {
  string code = 1;
  gnome.common.v1.Game game = 2;
  // At most 60 characters.
  string title = 3;
  string creator_id = 4;
  // Account ids, creator first, in join order.
  repeated string member_ids = 5;
  bool invite_only = 6;
  bool closed = 7;
  // 0 = no save yet; then +1 per commit.
  int64 revision = 8;
  // The game's world tick of the newest save (DayG: sim ticks).
  int64 tick = 9;
  google.protobuf.Timestamp updated_at = 10;
  // Short, human-readable, set by the game ("Day 12, 4 players"). At most 200 characters.
  string summary = 11;
}

message RoomSaveManifest {
  string code = 1;
  int64 revision = 2;
  int64 tick = 3;
  // The account that committed it.
  string host_id = 4;
  int32 part_count = 5;
  int64 total_bytes = 6;
  // One per part, in order: 8 hex characters (FNV-1a 32 of the part's bytes), computed by the client.
  repeated string part_hashes = 7;
  string summary = 8;
  google.protobuf.Timestamp updated_at = 9;
}

message CreateRoomRequest {
  gnome.common.v1.Game game = 1;
  string title = 2;
}
message CreateRoomResponse { Room room = 1; }

message JoinRoomRequest {
  string code = 1;
  // Required for invite-only rooms.
  string invite = 2;
}
message JoinRoomResponse { Room room = 1; }

message ListMyRoomsRequest { gnome.common.v1.Game game = 1; }
message ListMyRoomsResponse { repeated Room rooms = 1; }

message GetRoomSaveRequest { string code = 1; }
message GetRoomSaveResponse { RoomSaveManifest manifest = 1; }

message GetRoomSavePartRequest {
  string code = 1;
  int64 revision = 2;
  int32 index = 3;
}
message GetRoomSavePartResponse { bytes data = 1; }

message PutRoomSavePartRequest {
  string code = 1;
  // Chosen by the client (16-40 characters of A-Z a-z 0-9 _ -), the same for every part of one save.
  string upload_id = 2;
  int32 index = 3;
  bytes data = 4;
}
message PutRoomSavePartResponse {}

message CommitRoomSaveRequest {
  string code = 1;
  // The revision this save replaces; 0 when the room has no save yet.
  int64 base_revision = 2;
  string upload_id = 3;
  int64 tick = 4;
  int32 part_count = 5;
  int64 total_bytes = 6;
  repeated string part_hashes = 7;
  string summary = 8;
}
message CommitRoomSaveResponse { RoomSaveManifest manifest = 1; }

message UpdateRoomRequest {
  string code = 1;
  optional bool invite_only = 2;
  repeated string remove_member_ids = 3;
  bool close = 4;
}
message UpdateRoomResponse { Room room = 1; }

message CreateInviteRequest { string code = 1; }
message CreateInviteResponse { string invite = 1; }
```

## Done when
- `cd proto && npx @bufbuild/buf@1.47.2 lint` passes.
- `cd packages/platform-server && go build ./... && go vet ./...` passes (the generated package compiles; nothing
  implements the service yet).
- `npx tsc --noEmit -p packages/platform` passes, and `grep -n GAME_DAYG packages/platform/src/gen/gnome/common/v1/common_pb.ts` finds it.

## Out of scope
packages/platform-server/internal/** and main.go (other issues implement the service and its store),
packages/cloudsave, proto/gnome/common/v1/common.proto (already has GAME_DAYG).
~~~~

~~~~text
Epic: 6 Platform, mp, prefabs, lore (issue 6.2 Room store, memory)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Go is installed. Work in
  packages/platform-server. Do not run `git commit` or `git stash`.
- Other workers are editing other files at the same time (one regenerates packages/platform-server/gen). Edit only
  the files under Change. This issue needs no generated code.

## Goal
The platform service's store layer can hold DayG rooms in memory: rooms, members, invites, staged save parts and
committed saves, behind a `RoomStore` interface a Postgres version will also implement.

## Read first
- packages/platform-server/internal/store/store.go: `ErrNotFound`, `ErrConflict`, the `Store` interface style.
- packages/platform-server/internal/store/memory.go: `GetSave` / `PutSave` (revision guard) and the mutex style.
- packages/platform-server/internal/store/hitch.go: a second interface (`HitchStore`) with its own memory type; copy
  that layout.

## Change
- packages/platform-server/internal/store/room.go (new): the types, constants, `ErrTooBig`, the `RoomStore` interface
  and `MemoryRooms` (a `sync.Mutex`, maps by code; staged parts keyed by code + upload id + index with their time),
  `func NewMemoryRooms() *MemoryRooms`, and `var _ RoomStore = (*MemoryRooms)(nil)`.
- packages/platform-server/internal/store/room_test.go (new): table tests for every method, against `NewMemoryRooms()`.
  Write the tests as `func testRoomStore(t *testing.T, s RoomStore)` called from `TestMemoryRooms`, so the Postgres
  version can reuse it.

## Contract
```go
// Room is one shared world save (DayG). Members can read and write its save.
type Room struct {
	Code       string // 8 of A-Z0-9, unique
	Game       int32
	Title      string
	CreatorID  string
	Members    []string // creator first, then join order
	InviteOnly bool
	Closed     bool
	Revision   int64 // 0 = no save yet
	Tick       int64
	HostID     string
	PartCount  int32
	TotalBytes int64
	PartHashes []string
	Summary    string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type RoomManifest struct {
	Tick       int64
	HostID     string
	PartCount  int32
	TotalBytes int64
	PartHashes []string
	Summary    string
}

const (
	MaxRoomPartBytes = 512 * 1024
	MaxRoomParts     = 16
	MaxRoomBytes     = 8 * 1024 * 1024
	MaxRoomMembers   = 64
)

var ErrTooBig = errors.New("store: too big")

type RoomStore interface {
	CreateRoom(ctx context.Context, code string, game int32, title, creatorID string, now time.Time) (Room, error) // ErrConflict: code taken
	GetRoom(ctx context.Context, code string) (Room, error)                                                      // ErrNotFound
	AddMember(ctx context.Context, code, userID string, now time.Time) (Room, error)                             // idempotent; ErrNotFound; ErrConflict at MaxRoomMembers
	RemoveMembers(ctx context.Context, code string, userIDs []string, now time.Time) (Room, error)                // never removes the creator
	SetRoomFlags(ctx context.Context, code string, inviteOnly, closed *bool, now time.Time) (Room, error)         // nil = unchanged
	ListRoomsOf(ctx context.Context, userID string, game int32) ([]Room, error)                                  // member rooms, newest UpdatedAt first
	PutPart(ctx context.Context, code, uploadID string, index int32, data []byte, now time.Time) error            // ErrNotFound room; ErrTooBig: index >= MaxRoomParts or len(data) > MaxRoomPartBytes
	CommitSave(ctx context.Context, code string, baseRevision int64, uploadID string, m RoomManifest, now time.Time) (Room, error)
	// CommitSave: ErrConflict when baseRevision != Room.Revision; ErrNotFound when a part 0..m.PartCount-1 of uploadID
	// is not staged; ErrTooBig when m.TotalBytes > MaxRoomBytes or the staged bytes differ from m.TotalBytes. On success
	// Revision+1, the manifest fields copied in, the previous revision's parts and this upload's staging dropped.
	GetPart(ctx context.Context, code string, revision int64, index int32) ([]byte, error) // ErrNotFound unless revision == Room.Revision and index < PartCount
	CreateInvite(ctx context.Context, code, token string, now time.Time) error
	UseInvite(ctx context.Context, code, token string, now time.Time) error // ErrNotFound when unknown or already used
	PurgeUploads(ctx context.Context, before time.Time) (int, error)       // drops staged parts older than before; returns how many
}
```
Returned `Room` and slices are copies (callers cannot change the store through them).

## Done when
- `cd packages/platform-server && go test ./internal/store/ -run Room -count=1` passes.
- `cd packages/platform-server && go vet ./internal/store/` passes.

## Out of scope
postgres.go and any Postgres code (issue 7.13), internal/service, main.go, proto/, gen/.
~~~~

~~~~text
Epic: 6 Platform, mp, prefabs, lore (issue 6.3 `dayg` in GAMES, room code only)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Do not run `npm install`,
  `git commit` or `git stash`.
- Other workers are editing other files at the same time. Edit only the files under Change. Do not start the
  mp-server on port 8787 (the planner uses it); the server tests start their own.

## Goal
The shared matchmaking server knows the game `dayg` (1-16 players, drop-in, starts at once) and refuses a public
queue for it: DayG rooms are joined by room code only.

## Read first
- packages/mp/src/protocol.ts: `GameId`, `GameRules`, `GAMES` and their comments.
- packages/mp-server/src/matchmaker.ts: `queue()` (about line 287), where the room code is parsed, and `rules()`.
- packages/mp-server/test/server.test.mjs: how a test opens sockets, says hello and queues (copy a lateJoin game's test).

## Change
- packages/mp/src/protocol.ts: add `'dayg'` to `GameId`; add to `GameRules`
  `/** No public queue: a queue with code null is refused with an error. */ roomCodeOnly?: boolean;`; add the row
  `// DayG: a persistent zombie-gnome world per room, hosted in a player's browser; join by room code only, drop in any time.`
  `'dayg': { minPlayers: 1, maxPlayers: 16, publicWaitS: 0, privateWaitS: 0, lateJoin: true, roomCodeOnly: true },`.
- packages/mp-server/src/matchmaker.ts: in `queue()`, right after `code` is parsed: if `code === null` and
  `this.rules(p.game).roomCodeOnly`, send `{ t: 'error', message: 'This game is played by room code only.' }` and return.
- packages/mp-server/test/server.test.mjs: a test that a `dayg` hello plus `queue` with `code: null` gets that error and
  no `match`, and that `queue` with code `'DAYG1234'` gets a `match` at once (minPlayers 1), and a second socket
  queueing the same code gets `match` while the first gets `joined`.

## Contract
`GAMES.dayg = { minPlayers: 1, maxPlayers: 16, publicWaitS: 0, privateWaitS: 0, lateJoin: true, roomCodeOnly: true }`
and the error message text above, verbatim (the game shows it).

## Done when
- `npm test -w packages/mp-server` passes (it builds the server first).
- `npx tsc --noEmit -p packages/mp` passes.

## Out of scope
packages/mp/README.md (the planner adds the table row), packages/mp-server/src/telemetry.ts, every game folder.
~~~~

~~~~text
Epic: 6 Platform, mp, prefabs, lore (issue 6.4 Prefabs: cemetery and talk)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Do not run `npm install`, `git commit` or `git stash`.
- Two other workers add prefabs at the same time, in packages/prefabs/src/catalog/dayg-build.ts and
  dayg-materials.ts. Edit only dayg.ts. Every id below must be new: check with
  `grep -rn "id: '<id>'" packages/prefabs/src/catalog/` first.
- House style for examine lines: plain, dry, short; five lines per prefab (a look, a saying, a use, a joke, a detail),
  as the existing entries in dayg.ts do. No gore. Gnome scale: 1 unit = one gnome height.

## Goal
Nine DayG prefabs exist for notice boards, navigation, the cemetery and medicine, so the game never hand-builds them.

## Read first
- packages/prefabs/README.md: "Add a prefab" (what the test checks).
- docs/roadmaps/prefab-library/_common.md: the rules (parts, colours, grips, `uses`, categories).
- packages/prefabs/src/types.ts: `PrefabDef` and part shapes.
- packages/prefabs/src/catalog/dayg.ts: the existing DayG prefabs (style to copy; append to the `DAYG` array).

## Change
- packages/prefabs/src/catalog/dayg.ts: append these PrefabDefs (ids exact):
  - `notice-board`: scenery, `uses: ['place', 'examine']`; a plank board about 1.4 wide and 1.0 tall on two posts
    (total height about 2.2), three pinned paper sheets (pale box parts) and a small roof plank.
  - `compass`: tool, `uses: ['hold', 'examine']`; a brass disc 0.12 across with a needle (thin red and white boxes).
  - `urn`: scenery/container, `uses: ['place', 'examine']`; a grey stone urn 0.9 tall with a lid and two handles.
  - `crypt-door`: scenery, `uses: ['place', 'examine']`; an iron double door 2.4 tall, 1.8 wide with studs and a ring.
  - `kiln`: furniture (a crafting station), `uses: ['place', 'craft', 'examine']`; a domed clay kiln 1.3 tall with a
    dark mouth and a chimney stub.
  - `water-filter`: tool, `uses: ['hold', 'craft', 'examine']`; a thimble 0.15 tall with layers of sand and charcoal.
  - `petal-bundle`: consumable, `uses: ['hold', 'use', 'examine']`; a tied bunch of pink and white petals 0.2 long.
  - `wreath-wire`: material, `uses: ['hold', 'craft', 'examine']`; a green wire ring 0.35 across (a `ring` part).
  - `chapel-bell`: scenery, `uses: ['place', 'examine']`; a bronze bell 2.0 tall on a beam (for the Spire), with a rope.
  Each with `tags`, `emoji` where one fits (`📋`, `🧭`, `⚱️`, `🚪`, `🏺`, `💧`, `🌸`, `⭕`, `🔔`), `about` (one
  sentence of shape and size), five `examine` lines, `grip` for held ones.

## Contract
The nine ids above, exactly. The game builds them with `buildPrefab(id)` / `buildHeld(id)` and their icons with
`prefabIcon(id)`; nothing else is assumed about their parts.

## Done when
- `npm test -w packages/prefabs` passes.
- Optional look: `npm run dev -w games/prefab-gallery` on its own port (`npx vite --port 5281 --strictPort` in
  games/prefab-gallery), find the new ids, then stop the server.

## Out of scope
dayg-build.ts, dayg-materials.ts, catalog/index.ts (already registers DAYG), every game folder.
~~~~

~~~~text
Epic: 6 Platform, mp, prefabs, lore (issue 6.5 Prefabs: building and traps)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Do not run `npm install`, `git commit` or `git stash`.
- Two other workers add prefabs at the same time (dayg.ts, dayg-materials.ts). Edit only dayg-build.ts. Check every id
  is new with `grep -rn "id: '<id>'" packages/prefabs/src/catalog/`.
- House style for examine lines: plain, dry, short; five per prefab. No gore. 1 unit = one gnome height.
- 3D rule: parts that touch must not share a face (offset by at least 0.01) or the game will z-fight.

## Goal
The eleven building and trap pieces a player can place in DayG exist as prefabs.

## Read first
- packages/prefabs/README.md ("Add a prefab"), docs/roadmaps/prefab-library/_common.md (rules).
- packages/prefabs/src/types.ts: `PrefabDef`.
- packages/prefabs/src/catalog/dayg.ts: style to copy.
- packages/prefabs/src/catalog/dayg-build.ts: the empty `DAYG_BUILD` array (already registered in catalog/index.ts).

## Change
- packages/prefabs/src/catalog/dayg-build.ts: fill `DAYG_BUILD` with (ids exact; sizes in gnome heights; the game
  scales them by 1.7 so 4 gm = about 2.35 units):
  - `plank`: material, hold/craft; one rough plank 1.2 x 0.06 x 0.18.
  - `plank-wall`: building piece, place; a 2.35 wide, 1.4 tall wall of five vertical planks with two cross battens.
  - `plank-door`: building piece, place; a 1.0 wide, 1.4 tall plank door in a frame with a rope handle.
  - `barricade`: building piece, place; three planks nailed crosswise over two uprights, 2.35 wide, 1.2 tall.
  - `stone-wall`: building piece, place; a 2.35 wide, 1.4 tall wall of stacked grey stones (staggered boxes).
  - `garden-bed`: building piece, place/craft; a 2.35 x 2.35 plank frame 0.25 tall filled with dark soil (soil top
    0.02 below the frame top).
  - `snare`: trap, place; a bent twig with a cord loop, 0.4 tall.
  - `noise-line`: trap, place; two short stakes 2.0 apart with a cord between and three tin cans hung on it.
  - `spike-line`: trap, place; a row of six sharpened sticks leaning outwards on a base log, 2.35 long, 0.6 tall.
  - `drying-rack`: furniture, place/craft; a stick frame 1.0 wide, 0.9 tall with three cords and leaves hung on them.
  - `rope-bridge`: building piece, place; a 2.35 long span of planks on two ropes, 0.5 wide.
  Each with tags, an emoji if one fits, `about`, five examine lines.

## Contract
The eleven ids above, exactly. DayG maps its pieces to prefabs as: plank-wall `plank-wall`, barricade and
reinforced-barricade `barricade`, stone-wall `stone-wall`, door `plank-door`, pull-ladder `ladder`, spike-line
`spike-line`, garden-bed `garden-bed`, rain-catcher `rain-catcher`, drying-rack `drying-rack`, workbench `workbench`,
hearth `hearth`, kiln `kiln`, anvil `anvil`, bed `bedroll`, storage `crate`, snare `snare`, noise-line `noise-line`,
rope-bridge `rope-bridge`.

## Done when
- `npm test -w packages/prefabs` passes.

## Out of scope
dayg.ts, dayg-materials.ts, catalog/index.ts, every game folder.
~~~~

~~~~text
Epic: 6 Platform, mp, prefabs, lore (issue 6.6 Prefabs: materials)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Do not run `npm install`, `git commit` or `git stash`.
- Two other workers add prefabs at the same time (dayg.ts, dayg-build.ts). Edit only dayg-materials.ts. Check every id
  is new with `grep -rn "id: '<id>'" packages/prefabs/src/catalog/`.
- House style for examine lines: plain, dry, short; five per prefab. No gore. 1 unit = one gnome height.

## Goal
Ten small DayG materials and foods exist as prefabs so items in the crafting tree have models and icons.

## Read first
- packages/prefabs/README.md ("Add a prefab"), docs/roadmaps/prefab-library/_common.md.
- packages/prefabs/src/types.ts: `PrefabDef`.
- packages/prefabs/src/catalog/materials.ts: how existing materials (`twig-bundle`, `stone-chunk`) look.
- packages/prefabs/src/catalog/dayg-materials.ts: the empty `DAYG_MATERIALS` array (already registered).

## Change
- packages/prefabs/src/catalog/dayg-materials.ts: fill `DAYG_MATERIALS` with, all `uses: ['hold', 'craft', 'examine']`
  (foods also `'use'`): `cord` (a small coil of thin cord), `rag` (a crumpled cloth square), `stick` (a straight twig
  0.6 long), `nails` (a pinch of five nails), `glass-shard` (a pale green shard), `charcoal` (two black lumps),
  `soil-sack` (a small tied sack of dark soil), `thorn` (a curved thorn 0.15 long), `fish` (a silver minnow 0.35 long),
  `smoked-fish` (the same, brown, on a twig). Tags, emoji where one fits, `about`, five examine lines, `grip`.

## Contract
The ten ids above, exactly (they are DayG item ids too).

## Done when
- `npm test -w packages/prefabs` passes.

## Out of scope
dayg.ts, dayg-build.ts, materials.ts, catalog/index.ts, every game folder.
~~~~

~~~~text
Epic: 6 Platform, mp, prefabs, lore (issue 6.7 Lore: Mossgrave and the Hatless)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Do not run `git commit` or `git stash`.
- Three other workers write other lore entries at the same time. Edit only the files under Change. Check with
  `npm run lore -- check` (it writes nothing). Never run plain `npm run lore`: it rewrites docs/lore/INDEX.md, which
  the planner regenerates once at the end.
- You are the only worker this round who appends to docs/lore/rulings.md.

## Goal
The lore knows DayG's setting: Mossgrave as a place, the Hatless as a creature, and a ruling for how DayG's NPCs talk,
so the phrase bank, notice boards and quest titles written next have a house style to follow.

## Read first
- docs/lore/README.md: the entry schema and tiers. docs/lore/canon.md: the core house style (search it for "house style").
- docs/lore/rulings.md: R-039 (DayG is apocrypha; the Hatless; Mossgrave), and the format of the last ruling (append
  the next free number after the highest one in the file).
- docs/design/dayg/world.md (scale, the map, two clocks), docs/design/dayg/hatless.md (first 50 lines),
  docs/design/dayg/history.md (eras).
- Run `npm run lore -- find mossgrave` and `npm run lore -- find hatless` first: if an entry exists, extend it instead.

## Change
- docs/lore/entries/apocrypha/mossgrave.md (new): `id: mossgrave`, kind `place`, tier `apocrypha`, setting
  `apocrypha`, era `now`, status `draft`, games `[dayg]`, aliases `[the Cemetery, the Railings]`, sources the design
  docs above, related `[the-hatless]`. Body: what it is (a Tall One city cemetery at gnome height, 1 Tall metre = 11 gm),
  the twelve districts in one line each, the eras (the Long Quiet, the Greying, the Scatter, the Holding, Now), and the
  loose threads (who brings the Visitation flowers; where the Verge traders come from).
- docs/lore/entries/apocrypha/the-hatless.md (new): kind `creature`, same frontmatter style, aliases `[the grey ones]`.
  Body: cracked gnomes that a grey moss has grown into; lose their hats first; can't climb; crumble over seasons; the
  moss stages (exposed, rooting, spreading, taking); no gore, they crack and shatter.
- docs/lore/rulings.md: append one ruling, "DayG speech": NPC lines are dry, plain and short, one or two sentences,
  present tense in talk and past tense in the chronicle; gnomes say "shattered" not "killed" for a gnome and "put
  down" for a Hatless; acorns are the money and are counted ("two acorns"); quest titles are a plain imperative or a
  noun phrase ("Bring salt to the Tap", "The bitten at the Willow"); notice-board posts sign with the poster's name or
  faction; NPC names follow the core style (plant first names, soil-and-tool surnames); no swearing, no gore.
  Applies to: apocrypha, dayg.

## Contract
Entry ids `mossgrave` and `the-hatless`; the ruling's title "DayG speech". Later issues cite them by id.

## Done when
- `npm run lore -- check` passes.
- `npm run lore -- find mossgrave` lists the new entry.

## Out of scope
docs/lore/INDEX.md, docs/lore/settings.md (the planner keeps them), every other entry.
~~~~

~~~~text
Epic: 6 Platform, mp, prefabs, lore (issue 6.8 Lore: Lantern Keepers, Kiln Sisters, Rusted Spades)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Do not run `git commit` or `git stash`.
- Three other workers write other lore entries at the same time. Edit only the files under Change. Check with
  `npm run lore -- check`; never run plain `npm run lore` (it rewrites INDEX.md). Do not edit docs/lore/rulings.md.

## Goal
Three of DayG's founding factions have fact-sheets, each with its founder, so the game's names and behaviour match.

## Read first
- docs/lore/README.md (schema). docs/lore/canon.md (house style; names: plant first names, soil-and-tool surnames).
- docs/design/dayg/society.md: "Named founders" and "Norms and institutions". docs/design/dayg/havens.md: the sites.
- docs/design/dayg/regions.md: the Columbarium, the Bell Chapel, the Yew Walk sections.
- Run `npm run lore -- find lantern`, `-- find kiln`, `-- find spade` first; extend an existing entry if there is one.

## Change
- docs/lore/entries/apocrypha/lantern-keepers.md: kind `faction`, tier `apocrypha`, setting `apocrypha`, era `now`,
  status `draft`, games `[dayg]`, aliases `[the Keepers]`, related `[mossgrave]`. Founder Sexton Yarrow Gravelpot
  (ordered, open, builder); home the High Niches of the Columbarium (the Columbarium haven); norms (sharing a tithe,
  strangers questioned, the bitten nursed, a council, never strike first); hat colour gold (`#d9a441`); what they
  want (relight Lantern Night); what they fear.
- docs/lore/entries/apocrypha/kiln-sisters.md: founder Old Mother Comfrey Kilnworth (commune, empathy, cure the moss);
  home the Nave of the Bell Chapel (the Chapel Infirmary); norms (all shared, strangers welcome, the bitten nursed,
  council, never first); hat colour bone white (`#e8e2d0`); glazing and the firing cure.
- docs/lore/entries/apocrypha/rusted-spades.md: founder Nettle Rustspade (strongest rules, raider); home the Yews on the
  Yew Walk; norms (each keeps their own, strangers robbed, the bitten shattered, strongest leads, violence to
  outsiders); hat colour rust (`#8b3a2b`); tolls at Yew Edge and the Footbridge.
Each entry: a one-line summary, then sections "What they are", "How they live", "What they want", "Loose threads".

## Contract
Entry ids `lantern-keepers`, `kiln-sisters`, `rusted-spades`; founder names and hat colours as written above (the sim's
`FOUNDERS` table uses them).

## Done when
- `npm run lore -- check` passes; `npm run lore -- find gravelpot` finds the Keepers.

## Out of scope
rulings.md, INDEX.md, settings.md, other entries.
~~~~

~~~~text
Epic: 6 Platform, mp, prefabs, lore (issue 6.9 Lore: Crypt Holders, Greybearded, Truce of the Tap)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Do not run `git commit` or `git stash`.
- Three other workers write other lore entries at the same time. Edit only the files under Change. Check with
  `npm run lore -- check`; never run plain `npm run lore`. Do not edit docs/lore/rulings.md.

## Goal
Three more DayG factions have fact-sheets: the Crypt Holders, the Greybearded and the Truce of the Tap.

## Read first
- docs/lore/README.md (schema), docs/lore/canon.md (house style).
- docs/design/dayg/society.md: "Named founders", the moss ideology axis. docs/design/dayg/havens.md: the Tap.
- docs/design/dayg/regions.md: Mausoleum Hill, the Compost Heaps (Wormways), the Yew Walk and the Tap.
- Run `npm run lore -- find crypt`, `-- find greybeard`, `-- find tap` first.

## Change
- docs/lore/entries/apocrypha/crypt-holders.md: kind `faction` (frontmatter as in any apocrypha faction entry: tier
  `apocrypha`, setting `apocrypha`, era `now`, status `draft`, games `[dayg]`, related `[mossgrave]`). Founder Thistle
  Stonewort (closed walls, hoard); home Crypt Row and the Great Crypt; norms (a tithe, strangers turned away, the bitten
  cast out, the founder's line leads, violence against raiders); hat colour slate (`#4b4f6b`); relics.
- docs/lore/entries/apocrypha/greybearded.md: founder Lichen Ashbucket (live with the moss); home the Wormways under the
  Compost; norms (all shared, strangers questioned, the bitten nursed, the founder's line, never first); hat colour moss
  (`#7d8b6a`); they let moss grow in their beards and are rarely bitten (why stays a loose thread).
- docs/lore/entries/apocrypha/truce-of-the-tap.md: kind `faction`, aliases `[the Truce]`; no founder: a council of every
  faction that signed; holds the Tap haven; norms (a tithe, strangers welcome, the bitten cast out to the Infirmary,
  council, never first); hat colour slate blue (`#5b7a8c`); the one neutral water source and the biggest market.
Sections as in the other faction entries: summary, "What they are", "How they live", "What they want", "Loose threads".

## Contract
Entry ids `crypt-holders`, `greybearded`, `truce-of-the-tap`; names and hat colours as written above.

## Done when
- `npm run lore -- check` passes; `npm run lore -- find stonewort` finds the Holders.

## Out of scope
rulings.md, INDEX.md, settings.md, other entries.
~~~~

~~~~text
Epic: 6 Platform, mp, prefabs, lore (issue 6.10 Lore: Willow Folk, Shelf Wrights, the Mowing)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Do not run `git commit` or `git stash`.
- Three other workers write other lore entries at the same time. Edit only the files under Change. Check with
  `npm run lore -- check`; never run plain `npm run lore`. Do not edit docs/lore/rulings.md.

## Goal
The east's two haven factions and DayG's Mowing event have fact-sheets.

## Read first
- docs/lore/README.md (schema), docs/lore/canon.md (house style, and core fact 3: nobody sees the Tall Ones).
- docs/design/dayg/havens.md (the Willow, the Shelves), docs/design/dayg/regions.md (the Drowned Corner, the Shed).
- docs/design/dayg/world.md: "Weather, seasons" (the Mowing).
- Run `npm run lore -- find mower` and `-- find willow`: Fescue's `the-mower` exists in another setting; DayG's
  Mowing is apocrypha and must not contradict core fact 3 (nobody sees it happen).

## Change
- docs/lore/entries/apocrypha/willow-folk.md: kind `faction`, apocrypha frontmatter as in any faction entry; no
  founder; fishers in the willow over the Lily Pond (the Willow haven); small, slow to trust; rafts and the ferry; hat
  colour reed green (`#6f8f5a`).
- docs/lore/entries/apocrypha/shelf-wrights.md: kind `faction`; builders and crafters on shed shelves 2-4 (the Shelves
  haven); tools for hire, repairs; hat colour paint red (`#b5523b`).
- docs/lore/entries/apocrypha/the-mowing.md: kind `event`, era `now`, aliases `[the Rumble]`: about every three
  seasons the ground shakes in one district for one night and the grass is cut flat; cover is gone for a season, herds
  scatter, grave goods are strewn; nobody sees it happen; factions try to predict which district is next; related
  `[mossgrave]`.

## Contract
Entry ids `willow-folk`, `shelf-wrights`, `the-mowing`; hat colours as above.

## Done when
- `npm run lore -- check` passes; `npm run lore -- find rumble` finds the Mowing.

## Out of scope
rulings.md, INDEX.md, settings.md, other entries.
~~~~

~~~~text
Epic: 6 Platform, mp, prefabs, lore (issue 6.11 Full region graph test)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Game: games/dayg (TypeScript
  strict, vitest). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Do not run
  `npm install`, `git commit`, `git stash` or `npm run build`.
- This is the only worker in games/dayg this round. Edit only the file under Change. If the test finds a real data
  bug in src/sim/regionsFull.ts, do not fix it: make that one test case `it.fails(...)` with a comment naming the bug,
  and report it (the planner owns regionsFull.ts).

## Goal
A test guards the 61-region graph of the full map, so later district and tuning work cannot break it silently.

## Read first
- games/dayg/src/sim/regionsFull.ts: `NEW_REGIONS`, `FULL_REGIONS`, `NEW_EDGES`, `FULL_EDGES`, `FULL_BOUNDS`,
  `buildFullGraph`, `graphFor`, `districtOf`, `DISTRICT_PREFIX`.
- games/dayg/src/sim/regions.ts: `REGIONS`, `EDGES`, `HAVEN_REGION`, `buildGraph`, `rectArea`.
- games/dayg/src/sim/types.ts: `RegionDef`, `HavenId`, `HAVENS`, `DISTRICTS`, `DISTRICT_STAGE`.
- games/dayg/src/sim/world.ts: `createWorld(seed, tuning, containers, { map })`, `runDays`, `hashWorld`, `hatlessTotal`.

## Change
- games/dayg/src/sim/regionsFull.test.ts (new), vitest, cases:
  - 61 regions, ids unique; per district counts: lychgate 4, old-rows 7, yew-walk 4, gnome-garden 5, wreathwood 5,
    compost 4, columbarium 6, bell-chapel 5, mausoleum-hill 6, lawn-section 5, drowned-corner 5, shed 5.
  - every rect has x0 < x1, z0 < z1 and lies inside FULL_BOUNDS; no two rects overlap with positive area, except
    `gate-roof` over `forecourt` and `verge-path`.
  - every edge names two known regions, no duplicate pair; for NEW_EDGES the two rects share a border segment of
    positive length, except the three logical links `lower-walk`-`forecourt`, `the-catacombs`-`back-stair`,
    `drain-mouth`-`back-gate`.
  - the graph is connected (breadth-first from `gate-roof` reaches all 61); `neighbours` is symmetric.
  - every edge in NEW_EDGES that touches a region with the `HIGH` trait has `climb: true` (the slice's old EDGES are
    not checked: Angel Square's walk-on edges predate this rule).
  - every `HavenId` in `HAVENS` maps through `HAVEN_REGION` to a region with the `HAVEN` trait, and every `HAVEN`
    region is some haven's region.
  - `createWorld(7, TUNING, [], { map: 'full' })` then `runDays(world, streams, 3)`: no throw, `world.graph.regions`
    has 61 entries, alive NPCs > 0, `hatlessTotal` finite; two runs give the same `hashWorld`.

## Contract
None provided; the test only reads.

## Done when
- `cd games/dayg && npx vitest run src/sim/regionsFull.test.ts` passes.
- `npx tsc --noEmit -p games/dayg` shows no error in regionsFull.test.ts.

## Out of scope
Every other file, especially regionsFull.ts, regions.ts, world.ts (planner).
~~~~

### Round 2, Epic 7: sim systems, districts, room service, achievements catalog

The sim issues 7.1 to 7.7, 7.17 and 7.18 share this Environment block (pasted into each):

```
## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Game: games/dayg (TypeScript
  strict, vitest). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Do not run
  `npm install`, `git commit`, `git stash` or `npm run build` (it writes dist/).
- Seventeen other workers are editing other files at the same time. Edit only the files under Change. tsc errors in
  files you do not own are someone else's work in progress: ignore them; yours must have none. Keep every exported
  signature exactly as in Contract: other files compile against the stubs, and the functions you call from other
  modules may still be stubs while you work (write tests that set up the state they need by hand).
- src/sim/ is pure: no DOM, no three.js, no Math.random, no Date. Random numbers only from the `rng: Rng` passed in
  (src/sim/rng.ts: next(), int(min,max) inclusive, range, chance(p), pick, weighted(items, fn), round(x)). Iterate
  arrays by index, regions in `w.graph.regions` order, object keys only after sorting. Every knob comes from
  `w.tuning.<section>`.
- Conservation (npm test checks it): resources move, they are never made or lost, except through the ledger's
  inflows (`foraged`, `farmed`, `givenByPlayer`) and outflows (`consumed`, `removedByPlayer`); acorns only move.
  `resourceTotals` counts region loot, containers, NPC carried, the market and faction stores.
- A new chronicle line is `w.chronicle.push({ tick: w.tick, text: `${formatDate(w.tick, w.tuning)}. ${sentence}` })`
  (formatDate from src/sim/chronicle.ts); sentences follow the "DayG speech" ruling in docs/lore/rulings.md: plain,
  dry, past tense, one sentence.
```

~~~~text
Epic: 7 Sim systems (issue 7.1 Trust ledger and rumours)
Depends on: none

## Environment
(paste the shared sim Environment block from the roadmap section "Round 2, Epic 7")

## Goal
NPCs remember the gnomes and players they meet: trust that moves with deeds they see or hear, debts and grudges,
rumours that travel the region graph, standing with a faction computed from its members, and a player's notoriety.

## Read first
- games/dayg/src/sim/types.ts: `TrustEntry`, `NpcMemory`, `Deed`, `DEEDS`, `Grudge`, `Rumour`, `RumourFact`,
  `SubjectKey`, `PlayerKey`, `Faction`, `PlayerRecord`, `WorldState` (memory, rumours, players, factions, groups),
  `Tuning['social']`.
- games/dayg/src/sim/social.ts: the stub you replace (signatures to keep).
- games/dayg/src/sim/world.ts: `npcsIn`, `dayOf`, `endOfDay`, `createWorld`, `runDays`.
- games/dayg/src/sim/tuning.social.json: the `social` section.
- docs/design/dayg/society.md: "Memory and trust" and the rumour rule under "At L2".

## Change
- games/dayg/src/sim/social.ts: implement every export (Contract).
- games/dayg/src/sim/social.test.ts (new).

## Contract
```ts
export function subjectOfNpc(id: NpcId): SubjectKey            // `n:${id}`
export function subjectOfPlayer(key: PlayerKey): SubjectKey    // `p:${key}`
export function memoryOf(w: WorldState, npc: NpcId): NpcMemory  // w.memory[npc] ??= { entries: [] }
export function entryOf(w: WorldState, npc: NpcId, s: SubjectKey): TrustEntry | null
export function trustOf(w: WorldState, npc: NpcId, s: SubjectKey): number   // 0 when unknown
export function adjustTrust(w: WorldState, npc: NpcId, s: SubjectKey, delta: number): void
export function witnessDeed(w: WorldState, who: SubjectKey, deed: Deed, region: RegionId, rng: Rng): void
export function startRumour(w: WorldState, fact: RumourFact, origin: RegionId): void
export function stepSocial(w: WorldState, rng: Rng): void
export function standingOf(w: WorldState, f: FactionId, player: PlayerKey): number   // -100..100
export function knownBy(w: WorldState, player: PlayerKey): { npc: NpcId; trust: number }[]
```
Rules:
- `adjustTrust`: creates the entry if missing (`trust 0, debt 0, grudge null, heard false`), sets `seen = w.tick`,
  `heard = false`. A negative delta is multiplied by `clamp(1 + paranoia - loyalty, 0.25, 2)` (the NPC's traits);
  trust is clamped to -1..1. When `entries.length > memoryCap`, drop the entry with the smallest |trust| (oldest `seen`
  on ties), never the one just changed. A subject that is the NPC itself is ignored.
- `witnessDeed`: every alive NPC in `region` (npcsIn order) except `who` itself calls `adjustTrust(npc, who,
  deed[deed])` and sets a grudge for `stole` (theft), `betrayed` (betrayal), `robbed` (robbed), `threatened` and
  `killed-gnome` (attacked). If |deed value| >= 0.2, `startRumour({ kind: 'deed', who, deed }, region)`.
- `startRumour`: pushes `{ id: w.nextId.rumour++, fact, origin, at: [origin], tick: w.tick, strength: 1 }`, event
  `{ kind: 'rumour', rumour: id, region: origin }`; when over `rumoursMax`, drop the oldest.
- `stepSocial` (every tick): for each rumour, for each region in a copy of `at`, for each neighbour (graph order) not in
  `at`: with chance `rumourChance / ticksPerDay` it reaches it (push to `at`); every alive NPC there hears it: a deed
  rumour calls `adjustTrust(npc, who, deed value x rumourDiscount ^ hops)` then sets `heard = true` (hops =
  `at.length - 1` after the push). Drop rumours older than `rumourMaxDays`. Once per world-day (`w.tick % ticksPerDay
  === 0`): every entry's trust moves toward 0 by `forgetPerDay` (not past 0); entries with |trust| < 0.01 and debt 0
  are removed; each player's `notoriety` = share of alive NPCs with an entry for `p:<key>`.
- `standingOf`: members = alive NPCs in the faction's groups (`w.groups` entries whose id is in `faction.groups`); known
  = members with an entry for the player; none known -> 0; else `100 x (mean + (leaderTrust - mean) x
  standingLeaderPull)` where leaderTrust is the leader's trust if known, else mean; clamped to -100..100. Unknown or
  dead faction -> 0. (Do not import factions.ts: compute members here.)
- `knownBy`: alive NPCs with an entry for `p:<key>`, |trust| descending, then id ascending.

## Done when
- `cd games/dayg && npx vitest run src/sim/social.test.ts` passes, with tests for: clamping and the paranoia/loyalty
  multiplier; the memory cap eviction; `witnessDeed` reaching only NPCs in the region; a rumour reaching a neighbour
  within 3 world-days on a fixed seed (set `rumourChance` to 1 through `withOverrides` from src/sim/tuning.ts);
  forgetting; `standingOf` on a hand-built faction (push a `Group` and a `Faction` object yourself); determinism (two
  runs of 5 days with a rumour give equal `hashWorld`).
- `npx tsc --noEmit -p games/dayg` shows no error in social.ts or social.test.ts.
- `npm test -w games/dayg` still passes the existing determinism and conservation tests.

## Out of scope
factions.ts, quests.ts, talk.ts, world.ts, types.ts, tuning JSON files.
~~~~

~~~~text
Epic: 7 Sim systems (issue 7.2 Factions, power, havens and ranks)
Depends on: none

## Environment
(paste the shared sim Environment block from the roadmap section "Round 2, Epic 7")

## Goal
Factions exist in every world: 2-4 founders' factions plus the Truce of the Tap (and, on the full map, the Willow Folk
and the Shelf Wrights) are seeded at the start; groups of 9+ become factions; factions have power, stores, morale,
territory, havens, leaders and plans; they are born and fall; players can join and rise through the ranks.

## Read first
- games/dayg/src/sim/types.ts: `Faction`, `Norms`, `FactionPlan`, `FounderId`, `Rank`, `RANKS`, `HavenId`, `HAVENS`,
  `PlayerRecord`, `Group`, `Npc`, `NpcTraits`, `WorldState` (factions, groupFaction, players), `Tuning['factions']`.
- games/dayg/src/sim/factions.ts: the stub (signatures to keep).
- games/dayg/src/sim/world.ts: `killNpc`, `npcsIn`, `createWorld` (seedFactions runs after initMarket).
- games/dayg/src/sim/groups.ts: how groups form, split and dissolve (`removeGroup`), `groupOf`.
- docs/design/dayg/society.md: "Factions and power", "Raiding has costs", "Named founders".

## Change
- games/dayg/src/sim/factions.ts: implement every export, including the `FOUNDERS` data below.
- games/dayg/src/sim/factions.test.ts (new).

## Contract
Signatures (keep exactly):
```ts
export interface FounderDef { id: FounderId; name: string; faction: string; hat: number; home: RegionId; fallback: RegionId; traits: Partial<NpcTraits>; norms: Norms }
export const FOUNDERS: readonly FounderDef[];
export function seedFactions(w: WorldState, rng: Rng): void;
export function stepFactions(w: WorldState, rng: Rng): void;
export function factionOf(w: WorldState, npc: Npc): Faction | null;     // via npc.groupId and w.groupFaction; null if dead faction
export function membersOf(w: WorldState, f: Faction): NpcId[];          // alive NPCs of the faction's groups, ascending id
export function powerOf(w: WorldState, f: Faction): number;             // the power formula below (also stored in f.power)
export function havenHolder(w: WorldState, h: HavenId): FactionId | null;
export function rankOf(w: WorldState, f: FactionId, player: PlayerKey): Rank | null;
export function joinFaction(w: WorldState, f: FactionId, player: PlayerKey): boolean;
export function leaveFaction(w: WorldState, player: PlayerKey): void;
export function promoteRanks(w: WorldState, player: PlayerKey): Rank | null;  // the new rank when it changed, else null
export function factionDaily(w: WorldState): Pick<DailyRow, 'factions' | 'topFactions' | 'hhiNorm' | 'topShare' | 'havensUp' | 'havenHolders'>;
```
`FOUNDERS` (verbatim; names and hat colours match docs/lore entries):
```ts
[
  { id: 'yarrow-gravelpot', name: 'Sexton Yarrow Gravelpot', faction: 'the Lantern Keepers', hat: 0xd9a441, home: 'niches-high', fallback: 'angel-square',
    traits: { sociability: 0.9, paranoia: 0.2, industry: 0.9, loyalty: 0.8 },
    norms: { sharing: 'tithe', strangers: 'question', bitten: 'nurse', leadership: 'council', violence: 'never-first' } },
  { id: 'nettle-rustspade', name: 'Nettle Rustspade', faction: 'the Rusted Spades', hat: 0x8b3a2b, home: 'the-yews', fallback: 'yew-edge',
    traits: { boldness: 0.95, greed: 0.9, industry: 0.1, loyalty: 0.4 },
    norms: { sharing: 'own', strangers: 'rob', bitten: 'shatter', leadership: 'strongest', violence: 'outsiders' } },
  { id: 'comfrey-kilnworth', name: 'Old Mother Comfrey Kilnworth', faction: 'the Kiln Sisters', hat: 0xe8e2d0, home: 'the-nave', fallback: 'masons-corner',
    traits: { sociability: 0.8, greed: 0.1, paranoia: 0.2 },
    norms: { sharing: 'all', strangers: 'welcome', bitten: 'nurse', leadership: 'council', violence: 'never-first' } },
  { id: 'thistle-stonewort', name: 'Thistle Stonewort', faction: 'the Crypt Holders', hat: 0x4b4f6b, home: 'crypt-row', fallback: 'child-graves',
    traits: { paranoia: 0.9, greed: 0.8, sociability: 0.4 },
    norms: { sharing: 'tithe', strangers: 'turn-away', bitten: 'cast-out', leadership: 'founder-line', violence: 'raiders-only' } },
  { id: 'lichen-ashbucket', name: 'Lichen Ashbucket', faction: 'the Greybearded', hat: 0x7d8b6a, home: 'wormways', fallback: 'the-sinks',
    traits: { boldness: 0.7, paranoia: 0.3, sociability: 0.6 },
    norms: { sharing: 'all', strangers: 'question', bitten: 'nurse', leadership: 'founder-line', violence: 'never-first' } },
]
```
Rules:
- **Seeding** (`seedFactions`): pick `rng.int(founders[0], founders[1])` distinct founders (rng order). Home = `home`
  if that region is in `w.graph`, else `fallback`. The leader is the lowest-id alive NPC with `groupId === null` in
  the home region (else in its neighbours); rename it to the founder's name and `Object.assign` the founder traits. A
  group (`id = w.nextId.group++`, name = the faction name, leader, region = home, formedTick 0) takes the leader plus
  up to 8 more ungrouped alive NPCs from the home region then its neighbours; set their `groupId`. The faction gets
  `id = w.nextId.faction++`, `morale 0.7`, `territory [home]`, `plan 'hold'`, `leaders [{ npc, from: 0 }]`, empty
  stock, and `acorns` = `storeShare` of each member's acorns (moved, rounded down). Always seed **the Truce of the
  Tap** the same way at `the-tap` (no founder, hat 0x5b7a8c, norms `{ tithe, welcome, cast-out, council,
  never-first }`, the leader keeps its name). On the full map also **the Willow Folk** (`the-willow`, 0x6f8f5a,
  `{ all, question, nurse, council, never-first }`) and **the Shelf Wrights** (`the-shelves`, 0xb5523b, `{ tithe,
  question, cast-out, council, raiders-only }`). Havens: each haven whose region (`HAVEN_REGION`) is a faction's home
  goes to it; the Tap to the Truce; the Waystation to `rng.pick` of the seeded factions. Push `groupFaction`.
- **Every tick**: drop group ids no longer in `w.groups` from factions; unmapped groups of `formAt`+ members become
  new factions (name `the <leader surname>s` from the leader's name, e.g. Bramble Potsworth -> "the Potsworths";
  norms from the leader: greed > 0.6 -> sharing own; paranoia > 0.6 -> strangers turn-away; boldness > 0.7 and greed
  > 0.6 -> strangers rob, violence outsiders, leadership strongest; otherwise tithe / question / nurse / council /
  never-first), event `faction-formed` and a chronicle line.
- **Every `planEvery` ticks**, each alive faction in id order:
  - no members -> it falls: `diedTick`, havens released, event `faction-fell`, chronicle line.
  - leader dead or not a member -> new leader by norms.leadership (strongest: highest boldness; council: highest
    sociability + loyalty; founder-line: the earliest member of its first group), event `leader-changed`, push to
    `leaders`, chronicle line.
  - stores: each member puts in a share of its carried units above 2 per resource (own 0, tithe `storeShare`, all
    `2 x storeShare`, at most 1), rounded down; and the same share of acorns above 2.
  - `power = members^membersExp x arms x walls x (1 + ln(1 + stockpileDays / 30)) x morale x rep`, with arms = 1 +
    (members' carried tools + stock.tools) / members, walls = 1 + defenceOf(w, home) x build.wallsWeight (import
    `defenceOf` from src/sim/build.ts), stockpileDays = (stock.food + members' carried food) / members, rep = 0.5 +
    0.5 x (mean `standingOf` of online players / 100), 0.5 when no player is online (import from src/sim/social.ts).
  - upkeep: `upkeepK x power^upkeepExp x planEvery / ticksPerDay` food from the store, then from members' carried
    food; what is eaten is booked in `ledger.consumed.food`; a shortfall lowers morale by `moraleDrift`, none raises it
    by `moraleDrift / 2` (morale clamped 0..1). Morale below `collapseMorale` -> the faction collapses (it falls as
    above; its groups stay as packs).
  - a plan by softmax (`rng.weighted`, weight `exp(score / planTemp)`) over: hold 0; expand 0.5 when territory has
    fewer than `patrolReach + 1` regions and a neighbour of the territory is unclaimed (claim it); trade 0.3 when any
    store resource is above 10; ally 0.4 per other faction sharing 3+ norms and an enemy (both add each other to
    `allies`); tribute when power > 2x a neighbouring faction's (take `raidTake / 2` of its acorns); raid = leader greed
    + (violence outsiders ? 1 : 0) - morale-loss risk, target the faction with the most stock whose territory touches
    ours: succeeds with chance p/(p+q); success moves `raidTake` of the target's store to the raider, target morale
    -0.1 and target adds the raider to `enemies` (retaliation); failure kills `max(1, round(raidLoss x members))`
    raiders with `killNpc(..., 'gnome', rng)`; schism when the faction has 2+ groups and morale < 0.4: its last group
    becomes a new faction. Event `faction-plan`; chronicle lines for raids, alliances and schisms.
  - havens: daily, a haven whose holder has no member in the haven region sets flag `haven-empty:<id>:<day>`; after
    `havenHoldDays` such consecutive days, the faction with the most members there takes it (or none), event
    `haven-changed`, chronicle line.
- **Players**: `joinFaction` succeeds when the player has no faction, the faction is alive, and `standingOf >= 0`
  (`>= 40` when strangers is turn-away); sets `ranks[key] = 'stray'`, `PlayerRecord.faction`, event
  `player-joined-faction`. `promoteRanks` moves the player up one rank at a time while `done[key] >= rankDone[next]`
  and `standingOf / 100 >= rankTrust[next]`, event `rank-changed`. `leaveFaction` removes the rank and lowers every
  member's trust in the player by 0.1.
- `factionDaily`: alive count; `topFactions` = alive ids by power descending; `hhiNorm = (HHI - 1/n) / (1 - 1/n)`
  over power shares (0 when n < 2); `topShare`; `havensUp` = havens with a holder; `havenHolders`.

## Done when
- `cd games/dayg && npx vitest run src/sim/factions.test.ts` passes, with tests for: seed 1 on the slice has the Truce
  holding `tap` and 2-4 founders' factions with leaders named as in FOUNDERS; `--map full` seeding includes the Willow
  Folk; a faction with no members falls; a 30-day slice run keeps at least one faction alive and is deterministic
  (equal `hashWorld`); conservation over 30 days (copy the check in src/sim/sim.test.ts); join and promote with a
  hand-set `done` count and hand-set trust.
- `npx tsc --noEmit -p games/dayg` shows no error in your files; `npm test -w games/dayg` still passes.

## Out of scope
groups.ts (do not change how groups form), social.ts, quests.ts, build.ts, world.ts, types.ts, tuning files.
~~~~

~~~~text
Epic: 7 Sim systems (issue 7.3 Quest templates and notice boards)
Depends on: none

## Environment
(paste the shared sim Environment block from the roadmap section "Round 2, Epic 7")

## Goal
The world posts quests from real needs: eleven templates fire from sim state, land on the nearest notice board (easy
ones near the gate on the Waystation's newcomer board), pay from the poster's store, expire on sim deadlines, change
the world when done, and are measured for consequence reach.

## Read first
- games/dayg/src/sim/types.ts: `Quest`, `QuestGoal`, `QuestReward`, `QuestTemplate`, `QUEST_TEMPLATES`, `NoticeBoard`,
  `QuestOutcome`, `DailyRow` (marketInBand, questsOpen, questsDone, templatesOffered, outcomesMeasured,
  outcomesReached, topFactions, havenHolders), `Tuning['quests']`.
- games/dayg/src/sim/quests.ts: the stub (initBoards is already real; keep every signature).
- games/dayg/src/sim/factions.ts and social.ts: the signatures you call (`membersOf`, `havenHolder`, `promoteRanks`,
  `adjustTrust`, `witnessDeed`, `standingOf`); they may be stubs while you work.
- games/dayg/src/sim/market.ts (`priceOf`), horde.ts (`hatlessInRegion`, `hatlessThreat`), world.ts (`npcsIn`).
- docs/design/dayg/quests.md (the template table) and the "DayG speech" ruling in docs/lore/rulings.md.

## Change
- games/dayg/src/sim/quests.ts: implement every export.
- games/dayg/src/sim/quests.test.ts (new).

## Contract
Signatures as in the stub: `initBoards`, `stepQuests`, `questsOn`, `questsNear`, `takeQuest`, `progressQuest`,
`deliver`, `completeQuest`, `abandonQuest`, `postQuest`, `questDaily`, `questStartItems`, `questTitle`, `NewQuest`.
Rules:
- `stepQuests` every `checkEvery` ticks: (1) expire: past `deadline`, `offered` -> `expired`, `taken` -> `failed`
  (event `quest-failed`, the player's `failed += 1`, its id removed from `PlayerRecord.quests`, `witnessDeed('p:<key>',
  'quest-failed', poster home)`); (2) post new quests in this template order while fewer than `maxOpen` are offered,
  at most one new quest per template per check, skipping a need that already has an open quest (same template and
  region):
  | Template | Fires when | Poster | Goal |
  |---|---|---|---|
  | supply-run | market stock of a resource < `supplyBelow` x target, or a faction's stock.food < its members | Tap holder, or that faction | deliver resource, count `max(2, target x supplyBelow - stock)` (faction: members), to market region / faction home |
  | clear-ground | density (`hatlessInRegion`) >= `clearDensity` in a faction's home or a neighbour of it | that faction | clear, count `rng.int(clearCount)` |
  | missing-gnome | an alive member 2+ hops from its faction's home | that faction | find npc |
  | bounty | an NPC whose entry for another alive NPC has trust <= `bountyGrudge` and a grudge | `f:` of its faction, else `n:` | target npc; if the target is in a faction, that faction posts a rival escort of the target to its home (`rival` set both ways) |
  | steer-drift | a herd of `driftSize`+ whose `target` is a faction's home or a haven region | that faction | steer herd away from that region |
  | the-bitten | an alive faction member with `infectedAt !== null`, norms.bitten not shatter | its faction | deliver 1 medicine to the NPC's region, deadline 1 day |
  | envoy | two alive factions, neither ally nor enemy, sharing 3+ norms | the stronger | visit the other's home with item `sealed-letter` |
  | sabotage | a faction with an enemy | that faction | visit the enemy's home |
  | escort | a member of a faction with an ally, whose ally's home is 2+ hops away | the faction | escort that npc to the ally's home |
  | open-crypt | the graph has `crypt-row`, a faction holds it in territory, density there > 0 | that faction | clear `crypt-row`, count 10 |
  | teach | a faction group of 4+ with no member of industry >= 0.7 | that faction | teach that group `gardening` level 3 for 6 hours |
  Reward: `acorns = max(minReward, round(value x (1 + rewardShare)))` with value = `priceOf` x count for deliver goals,
  else `2 + 2 x count` (clear) or 6 (others); capped at what the poster has (faction acorns; an NPC poster's acorns);
  `trust 0.1`; `items` empty except open-crypt (one `gold-coins`). Deadline `postedTick + expireDays[template] x
  ticksPerDay`. Board: if the quest's region is within 2 hops of `gate-roof` and the template is supply-run,
  clear-ground or missing-gnome and the newcomer board has fewer than `perBoard`, the newcomer board; else the nearest
  board by hops with fewer than `perBoard` open quests; else null. Title from `questTitle`. Event `quest-posted`.
- `postQuest` assigns `id = w.nextId.quest++`, `state 'offered'`, nulls, `progress 0`; event `quest-posted`.
- `questTitle(w, q)`: plain imperative per the ruling, e.g. "Bring 4 food to the Tap", "Thin the Hatless in Ivy Rows",
  "Find Bramble Potsworth", "Deal with Thistle Mudhook", "Turn the herd from the Tap", "Medicine for the bitten in Angel
  Square", "Carry a letter to the Kiln Sisters", "Spoil the Rusted Spades' store", "See Fern Pebbleshaw to the Tap",
  "Open Crypt Row", "Teach gardening to the Lantern Keepers"; storylet quests keep the title they were posted with.
- `questStartItems(q)`: a visit goal with an item -> `[{ def: item, count: 1, condition: 1 }]`; else [].
- `takeQuest`: only `offered`, before the deadline, the player record exists, fewer than 3 taken: `taken`, `takenBy`,
  `takenTick`, push to `PlayerRecord.quests`.
- `progressQuest`: only the taker; `progress += amount`.
- `deliver`: only the taker, a deliver goal for that resource, the player's `PlayerRecord.region === goal.to`; accepts
  `min(count, goal.count - progress)`; the units go to the poster faction's stock (the market's stock when the poster
  holds the Tap and `to` is the market region) and `ledger.givenByPlayer[resource]`; returns the accepted count.
- `completeQuest`: only the taker and only when the goal is met (deliver/clear: progress >= count; find, target:
  progress >= 1; escort: taker's region === to (then move the NPC there); visit: taker's region === region; steer:
  progress >= 1 and the herd's region !== away; teach: progress >= hours; storylet: progress >= goal.step). Pays
  acorns from the poster to `PlayerRecord.acorns`; reward items are taken from the poster's stock by resource
  (`ledger.removedByPlayer`) and returned; every poster member's trust in the player += reward.trust;
  `witnessDeed('p:<key>', 'quest-done', poster home)`; `faction.done[key] += 1`; `PlayerRecord.done += 1`;
  `promoteRanks`; push a `QuestOutcome` with `reach: null`; event `quest-done`; a chronicle line ("<player name>
  finished <title> for <poster name>."). Template effects: the-bitten cures the NPC (`infectedAt = null`, event
  `npc-cured`) and sets the faction's norms.bitten to 'nurse'; envoy makes the two factions allies; sabotage spills
  30% of the enemy's store into the region loot there and lowers its morale by 0.1; bounty: the target's faction
  morale -0.05 and its trust in the player -0.3; clear-ground: the poster's morale +0.05; the rival quest (if any) fails.
- `abandonQuest`: taken -> failed; poster members' trust in the player -0.05; `failed += 1`.
- Outcomes, once per world-day: an outcome with `reach === null` whose `doneTick + reachDays x ticksPerDay <=
  w.tick` gets `reach` from `w.daily` rows between its day and `reachDays` later: rankChange (the first three of
  `topFactions` differ), havenChange (`havenHolders` differ), marketOutOfBand (some row has `marketInBand` false
  while the done day's row had it true).
- `questDaily`: `marketInBand` = every price of food, water, medicine and fuel / `market.base` within `marketBand`;
  `questsOpen` = offered count; `questsDone` = total done; `templatesOffered` = distinct templates offered now (in
  QUEST_TEMPLATES order); `outcomesMeasured` = outcomes with reach; `outcomesReached` = those with any true flag.
- `questsOn(w, board)`: quests on that board that are offered or taken, newest first. `questsNear(w, region, hops)`:
  offered quests whose region is within `hops` graph steps, newest first.

## Done when
- `cd games/dayg && npx vitest run src/sim/quests.test.ts` passes, with tests for: a supply-run posted when the market's
  food stock is set low by hand, landing on the Tap's board; take, deliver and complete paying acorns from a faction
  you set up by hand (acornTotal unchanged); expiry and failure; a quest near the gate landing on the newcomer board;
  outcome reach filled from hand-written daily rows; determinism over 10 days.
- `npx tsc --noEmit -p games/dayg` shows no error in your files; `npm test -w games/dayg` still passes.

## Out of scope
factions.ts, social.ts, talk.ts, actions.ts, storylets.ts, world.ts, types.ts, tuning files.
~~~~

~~~~text
Epic: 7 Sim systems (issue 7.4 Talk verbs and the phrase bank)
Depends on: none

## Environment
(paste the shared sim Environment block from the roadmap section "Round 2, Epic 7")
- Lore: before writing any line, run `npm run lore -- find hatless` and read the "DayG speech" ruling at the end of
  docs/lore/rulings.md (dry, plain, one or two sentences, "shattered" for gnomes, "put down" for Hatless, acorns
  counted). If a line needs a fact the lore does not have, keep it vague rather than inventing lore.

## Goal
Talking to an NPC is a menu of eleven verbs; each one is decided from the NPC's traits, trust and stock, moves the
trust ledger, may hand things over or start a quest, and answers in a few generated lines from a phrase bank.

## Read first
- games/dayg/src/sim/types.ts: `TalkVerb`, `TALK_VERBS`, `TalkInput`, `TalkResult`, `PhraseLine`, `AskTopic`,
  `ResourceCount`, `Npc`, `PlayerRecord`.
- games/dayg/src/sim/talk.ts and phrases.ts: the stubs.
- games/dayg/src/sim/social.ts, factions.ts, quests.ts: signatures you call (`trustOf`, `adjustTrust`, `entryOf`,
  `witnessDeed`, `factionOf`, `joinFaction`, `questsNear`, `postQuest`, `questTitle`); may be stubs while you work.
- games/dayg/src/sim/market.ts (`priceOf`), horde.ts (`hatlessThreat`), items/defs.ts (`itemsWith`).
- docs/design/dayg/quests.md: "Talking to NPCs".

## Change
- games/dayg/src/sim/talk.ts, games/dayg/src/sim/phrases.ts: implement.
- games/dayg/src/sim/talk.test.ts (new).

## Contract
```ts
export function verbsFor(w: WorldState, npc: NpcId, player: PlayerKey): { verb: TalkVerb; ok: boolean; why: string | null }[]; // all 11, TALK_VERBS order
export function talk(w: WorldState, input: TalkInput, rng: Rng): TalkResult;
export const PHRASES: Record<string, readonly string[]>;
export function renderLine(line: PhraseLine, pick: number): string;          // variant pick % length, {var} replaced
export function renderLines(lines: readonly PhraseLine[], seed: number): string[]; // line i uses pick seed + i
```
Rules (t = the NPC's trust in `p:<player>`; the NPC must be alive and in the player's region, else ok false with
line `talk.away`):
- any verb but greet with t <= -0.6: ok false, line `talk.hostile`, hostile true.
- greet: +0.02 trust at most once per world-day per pair (flag `greet:<npc>:<player>:<day>`); line by band
  `greet.hostile` (t <= -0.5), `greet.wary` (< 0), `greet.neutral`, `greet.friendly` (>= 0.3), `greet.close` (>= 0.6).
- ask (t >= -0.3): place -> `ask.place` with region name and danger word from `hatlessThreat`; gnome -> `ask.gnome`
  with that NPC's region name, or `ask.unknown`; price -> `ask.price` with `priceOf`; herd -> `ask.herd` with the
  biggest herd within 2 hops (region, size), or `ask.noherd`. Else `ask.refuse`.
- trade: the NPC sells at `priceOf x (1 + 0.5 x greed)` and buys at `priceOf x (1 - 0.3 x greed)`, 10% better when
  t >= 0.2; accepts when value(offer) + acorns >= value(want) and it carries `want` (and has the acorns it would pay);
  then `give` = `want.count` stacks of `itemsWith(want.resource)[0]` (out of the NPC's carried; booked in
  `ledger.removedByPlayer`), `take` = offer (into its carried; `ledger.givenByPlayer`), acorns moved between
  `npc.acorns` and `PlayerRecord.acorns`; lines `trade.accept` / `trade.refuse`.
- offer-help: the NPC's faction's offered quests within 1 hop (newest); if none and the NPC's carried food < 2, it
  posts a small supply-run (deliver 2 food to its region, reward 3 acorns or what it has, poster `n:<id>`, board null,
  deadline 2 days) with `postQuest`; `quest` = that id; lines `help.quest` (title) or `help.none`.
- ask-help: t >= 0.3 and greed < 0.6 and carried food >= 1: gives 1 food (as above), its entry `debt += 1`, line
  `askhelp.give`; else `askhelp.refuse`.
- recruit: the player is in a faction F, the NPC has no faction, t >= 0.4, sociability >= 0.4: the NPC joins F's first
  group (groupId, members, region = F's home), `joined = F`, line `recruit.ok`; else `recruit.refuse`.
- join: the NPC is in a faction F: `joinFaction(w, F, player)`; `joined = F` and `join.ok`, or `join.refuse`.
- threaten: succeeds when `carried.tools >= 1` and the NPC's boldness < 0.5: gives 1 unit of its largest carried
  resource; else hostile; `witnessDeed('p:<player>', 'threatened', region)`; lines `threaten.give` / `threaten.fight`.
- rob: succeeds with chance `0.5 x (1 - boldness)`: gives up to 2 units of its largest carried resource; always
  `witnessDeed('p:<player>', 'robbed', region)` plus the NPC's grudge `robbed`; failure hostile; lines `rob.ok` /
  `rob.caught`.
- share-food: `offer` of food: take it (into the NPC's carried, `ledger.givenByPlayer`), trust +0.2 x count capped at
  +0.4, `witnessDeed('p:<player>', 'shared-food', region)`; line `share.thanks`.
- warn: talking to `warnOf` (the NPC itself): +0.15 trust, `witnessDeed('p:<player>', 'warned', region)`; every offered
  or taken bounty on this NPC fails; the NPC moves to its faction's home; line `warn.thanks`.
- `trustDelta` = the change of t during this call. PHRASES: every key named above with 3-5 variants each, vars
  `{name}` (the NPC), `{player}`, `{region}`, `{danger}`, `{price}`, `{resource}`, `{count}`, `{size}`, `{faction}`,
  `{title}`. Example lines: `greet.wary`: "{name} keeps a hand on the trowel. \"Morning.\"", `trade.refuse`: "\"Not for
  that,\" {name} says.", `ask.herd`: "\"About {size} of them in {region}. Moving slow.\"".

## Done when
- `cd games/dayg && npx vitest run src/sim/talk.test.ts` passes, with tests for: hostile cut-off; greet once per day;
  a trade that conserves resources and acorns (resourceTotals + givenByPlayer - removedByPlayer, acornTotal); rob
  making a grudge and a rumour; every key used by talk exists in PHRASES; renderLines replaces every `{var}`;
  determinism of 50 random verb calls on a fixed seed.
- `npx tsc --noEmit -p games/dayg` shows no error in your files.

## Out of scope
social.ts, factions.ts, quests.ts, actions.ts, every game or UI file.
~~~~

~~~~text
Epic: 7 Sim systems (issue 7.5 Actions and L0 bubbles)
Depends on: none

## Environment
(paste the shared sim Environment block from the roadmap section "Round 2, Epic 7")

## Goal
Every change a player makes to the world goes through one pure function, `applyAction`, and the per-tick step through
`tickWorld`; L0 bubbles (one per region with a player, one owner each) hold promoted Hatless and conserve them. Replay of
the same envelopes on a copy gives the same world hash, which is what host hand-off relies on.

## Read first
- games/dayg/src/sim/types.ts: `SimAction`, `ActionEnvelope`, `ActionResult`, `TickResult`, `Arrival`, `Bubble`,
  `PlayerRecord`, `Ledger`, `WorldState` (bubbles, players, promoted).
- games/dayg/src/sim/actions.ts and bubbles.ts: the stubs.
- games/dayg/src/sim/world.ts: `promoteRegion`, `absorbIntoPromoted`, `demoteRegion` (mirror their Hatless
  bookkeeping), `stepWorld`, `hashWorld`, `hatlessTotal`, `recordPlayerTake`.
- games/dayg/src/sim/loot.ts (`rollContainer`), horde.ts (`addNoise`), quests.ts, talk.ts, factions.ts, build.ts,
  farming.ts: the function signatures you dispatch to (several are stubs while you work).

## Change
- games/dayg/src/sim/actions.ts, games/dayg/src/sim/bubbles.ts: implement.
- games/dayg/src/sim/actions.test.ts (new).

## Contract
Signatures (keep): `applyAction(w, s: Streams, env: ActionEnvelope): ActionResult`, `tickWorld(w, s): TickResult`,
`bubbleOf`, `bubbleIn`, `enterRegion`, `absorbBubbles`, `destroyInBubble`, `bubbleHatless`.
Bubbles:
- `enterRegion(w, player, r, alive)`: leave the old bubble first: as owner with viewers, ownership passes to
  `viewers[0]`; as owner alone, `density[region] += bubble.hatless` and the bubble is removed; as viewer, drop from
  `viewers`. (`alive` is informational: the bubble's own `hatless` count is the truth.) Then for `r !== null`: join
  an existing bubble in r as a viewer (`promoted: 0`), or create `{ owner: player, region: r, hatless: density[r] + the
  sizes of herds in r, viewers: [] }`, zeroing density[r] and removing those herds (`promoted` = that count).
- `absorbBubbles(w)`: for each bubble in order, move `density[region]` and herds now in the region into it; an
  `Arrival` per bubble with count > 0, `from` = the `from` of a `herd-moved` event into that region this tick, else null.
- `destroyInBubble(w, r)`: false without a bubble in r or with `hatless <= 0`; else `hatless -= 1`,
  `ledger.hatlessDestroyed += 1`, true.
Actions (`p = env.player`, its record `w.players[p]`; every case returns `{ ok: false, error }` on bad input):
| kind | does |
|---|---|
| player-join | create or revive the record (`acorns 0` only when new; online true; `joinedTick`, `lastTick`); `enterRegion` if region |
| player-leave | `enterRegion(w, p, null, 0)`; online false |
| enter-region | `enterRegion`; record `region`, `lastTick` |
| open-container | `rollContainer(w, id, s.loot)` -> `items` |
| player-take | `recordPlayerTake(w, stack)` |
| hatless-destroyed | `destroyInBubble`; then `progressQuest(+1)` on every quest taken by p with a clear goal in that region |
| noise | `addNoise`; `progressQuest(+1)` on p's steer quests whose herd is in that region or a neighbour |
| talk | `talk(w, { ...input, player: p }, s.social)` -> `talk`; on ok: `progressQuest(+1)` on p's find quests for that NPC, on p's bounty (target) quests for that NPC when the verb is threaten or rob, and on p's storylet quests whose goal region is the NPC's region |
| take-quest | `takeQuest`; `items: questStartItems(q)` |
| quest-progress | `progressQuest` |
| deliver | `deliver`; ok when it accepted more than 0 |
| complete-quest | `completeQuest`; `items` = reward.items; ok when not null |
| abandon-quest | `abandonQuest` |
| join-faction / leave-faction | `joinFaction` / `leaveFaction` |
| player-died | `deaths += 1`; each taken quest abandoned; trust of every NPC entry for `p:<p>` halved; the carried stacks become a new opened container `body-<p>-<tick>` of type `body` in that region (`ledger.givenByPlayer` by resource); the gnome rises: `density[region] += 1`, `ledger.hatlessRisen += 1`; `enterRegion(w, p, null, 0)` |
| respawn | record region = `HAVEN_REGION[at]`; `enterRegion` there |
| set-skills | record `skills` = action.skills |
| build | `placePiece(w, piece, 'p:' + p)` -> `piece` id |
| damage-piece / remove-piece | `damagePiece` / `removePiece` |
| plant / water-bed / tend-bed | `plantBed` / `waterBed` / `tendBed` |
| harvest | `harvestBed` -> `items` |
| check-snare | `checkSnare` -> `items` |
| ring-bell | `w.bellTick = w.tick`; `addNoise(region and every region within tuning.bell.hops, tuning.bell.noise)`; `witnessDeed('p:' + p, 'rang-bell', region, s.social)`; event `bell` |
| light-lantern | `w.lanterns[id] = true`; `progressQuest(+1)` on p's storylet quests of storylet `last-sexton` |
`tickWorld(w, s)`: `stepWorld(w, s)`; `arrivals = absorbBubbles(w)`; `{ tick: w.tick, arrivals, hash: hashWorld(w) }`.

## Done when
- `cd games/dayg && npx vitest run src/sim/actions.test.ts` passes, with tests for: `hatlessTotal` unchanged across
  enter, leave, hand-over of ownership and absorb; destroy booking; every action kind with valid input returns ok
  where the callee is real (assert only on bubbles, player records, containers, noise and bell, which you own or
  which are already real); replay: two copies (`structuredClone` of world; streams rebuilt with `createRng(state())`)
  given the same 30 envelopes over 3 days through applyAction and tickWorld end with equal hashes.
- `npx tsc --noEmit -p games/dayg` shows no error in your files; `npm test -w games/dayg` still passes.

## Out of scope
world.ts (do not change promoteRegion and friends), quests.ts, talk.ts, factions.ts, build.ts, farming.ts, net/.
~~~~

~~~~text
Epic: 7 Sim systems (issue 7.6 Snapshots and interest management)
Depends on: none

## Environment
(paste the shared sim Environment block from the roadmap section "Round 2, Epic 7")
- src/net/snapshot.ts and src/net/interest.ts are pure too (no DOM). `CompressionStream`, `DecompressionStream`,
  `TextEncoder`, `btoa` and `atob` are allowed: they exist in browsers and in Node 22, where vitest runs.

## Goal
A world can be frozen into a snapshot (state, RNG stream states, the action log since), packed small, cut into relay
chunks, restored exactly and replayed; and the host can tell which players should hear about each other.

## Read first
- games/dayg/src/net/protocol.ts: `Snapshot`.
- games/dayg/src/net/snapshot.ts, interest.ts: the stubs.
- games/dayg/src/sim/rng.ts: `createRng(seed)` resumes from a `state()`, `STREAM_NAMES`, `hashString`.
- games/dayg/src/sim/world.ts (`hashWorld`, `createWorld`, `runDays`), regionsFull.ts (`graphFor`), tuning.ts
  (`TUNING`), seasonal.ts (`withSeason`), actions.ts (`applyAction`, `tickWorld`; stubs while you work).

## Change
- games/dayg/src/net/snapshot.ts, games/dayg/src/net/interest.ts: implement.
- games/dayg/src/net/net.test.ts (new).

## Contract
```ts
export function tuningHash(t: Tuning): string;   // hashString(JSON.stringify(t)) as 8 hex characters
export function makeSnapshot(w: WorldState, s: Streams, log: readonly ActionEnvelope[]): Snapshot;
//   world = JSON of w without the keys graph, tuning, tuningBase; streams = state() of every stream; tick, hash = hashWorld(w),
//   tuningHash(w.tuningBase), map = w.map, seed = w.seed, log copied.
export function restoreSnapshot(snap: Snapshot, tuning?: Tuning): { world: WorldState; streams: Streams };
//   tuning defaults to TUNING; throws Error('tuning mismatch') if tuningHash differs; graph = graphFor(snap.map);
//   tuningBase = tuning; tuning = withSeason(tuning, world.lastSeason); streams = createRng(state) per name;
//   throws Error('snapshot hash mismatch') if hashWorld(world) !== snap.hash. Does not replay the log.
export function packSnapshot(snap: Snapshot): Promise<Uint8Array>;     // JSON -> UTF-8 -> gzip (CompressionStream)
export function unpackSnapshot(bytes: Uint8Array): Promise<Snapshot>;
export function toBase64(b: Uint8Array): string;                      // chunked over 32 KiB slices, btoa
export function fromBase64(s: string): Uint8Array;
export function chunk(text: string, size: number): string[];          // already real
export function replay(w: WorldState, s: Streams, log: readonly ActionEnvelope[], toTick: number): void;
//   skips envelopes with tick < w.tick; loop: apply (applyAction) every envelope whose tick === w.tick in log order;
//   stop when w.tick >= toTick; else tickWorld. Envelopes for toTick are applied before it returns.
export function interestedPlayers(w: WorldState, me: PlayerKey): PlayerKey[];
//   online players whose region is mine or a graph neighbour of mine, excluding me, sorted by key; [] when mine is null
export function bubbleViewers(w: WorldState, owner: PlayerKey): PlayerKey[];   // viewers of the bubble owned by owner
export function newsSince(w: WorldState, tick: number): string[];              // texts of chronicle lines with tick >= tick, at most the last 20
export function regionSummary(w: WorldState, r: RegionId): { region: RegionId; hatless: number; npcs: number; danger: 0 | 1 | 2 | 3 };
//   hatless = hatlessInRegion + the bubble's hatless; npcs = npcsIn count; danger from hatlessThreat: < 0.2 -> 0, < 0.5 -> 1, < 1 -> 2, else 3
```

## Done when
- `cd games/dayg && npx vitest run src/net/net.test.ts` passes, with tests for: restore of a 2-day slice world gives the
  same hash, and both copies stepped 1 more day stay equal; pack/unpack round trip; base64 round trip of random bytes
  (from a seeded Rng) including lengths not divisible by 3; chunk + join round trip; replay of a recorded log from a
  snapshot equals the original world's hash; a tuning mismatch throws; `interestedPlayers` with hand-made player
  records; and it logs (`console.log`) the packed size of a 30-day slice world and of a 30-day full-map world, and
  asserts the slice one is under 4 MiB.
- `npx tsc --noEmit -p games/dayg` shows no error in your files.

## Out of scope
net/protocol.ts (planner), simHost.ts, session.ts, sim/*.
~~~~

~~~~text
Epic: 7 Sim systems (issue 7.7 Bot players)
Depends on: none

## Environment
(paste the shared sim Environment block from the roadmap section "Round 2, Epic 7")
- Bots run only in the headless sim (CLI and tests), never in the game. Their private memory may live in a
  module-level `WeakMap<WorldState, BotMemory>`; everything they change in the world goes through `applyAction`.

## Goal
Bot players play the sim through the same action interface a human uses, so the player-experience bands (quests on
offer, quest variety, session fit, consequence reach, counterfactual divergence) can be measured over many seeds.

## Read first
- games/dayg/src/sim/bots.ts: the stub (`BotKind`, `BotRow` and signatures to keep).
- games/dayg/src/sim/types.ts: `SimAction`, `ActionEnvelope`, `Quest`, `QuestGoal`, `PlayerRecord`, `Tuning['bots']`.
- games/dayg/src/sim/actions.ts (`applyAction`, `tickWorld`), quests.ts (`questsNear`), horde.ts (`hatlessThreat`),
  regionsFull.ts (`districtOf`), world.ts (`createWorld`, `hashWorld`): signatures (some are stubs while you work).
- docs/design/dayg/evaluation.md: "Player experience (bot players)".

## Change
- games/dayg/src/sim/bots.ts: implement.
- games/dayg/src/sim/bots.test.ts (new).

## Contract
Signatures as in the stub. Rules:
- `addBots(w, s, kinds)`: bot i gets key `bot:<i>` and a `player-join` envelope (name `Bot <i>`, look '', userId
  null, region `gate-roof`); `friends` adds three keys that always move together (decisions of the first apply to all).
- `stepBots(w, s, bots)`, every tick, rng `s.bots`, at most one decision per bot: a bot with a taken quest walks one
  graph edge per tick toward the goal region (breadth-first next hop; `enter-region` envelope), avoiding regions with
  `hatlessThreat > riskLimit` unless that region is the goal; at the goal it acts: clear -> up to `hatlessPerHour`
  `hatless-destroyed` envelopes; deliver -> `open-container` on unopened containers in regions it passes, then
  `deliver` with what it got of that resource; find / target -> `talk` greet / threaten the NPC; visit / escort ->
  arrive; steer -> one `noise`; teach -> `abandon-quest`; then `complete-quest`. A bot without a quest takes the best
  of `questsNear(region, nearHops)` (reward acorns / (1 + hops)), else wanders toward the nearest region with unopened
  containers. `scavenger` never takes quests and trades food at the Tap (`talk` trade). `solo` is a quester with half
  the riskLimit. Death: each tick in a region with threat t, chance `0.02 x t` -> `player-died` then, next tick,
  `respawn` at `waystation`. Returns the envelopes it applied.
- `botDaily(w, bots)`: one row per bot per day: region, alive (not dead today), `questsNear` (count within
  `nearHops`), `templatesSeen` (distinct templates the bot saw near it during its last `sessionHours` sun-hours),
  `questsDone` (cumulative), `districts` (visited so far), `sessionOk` (for each 9-tick window ending today: did it
  finish a quest or a trade and end in a `HAVEN` region; null when no window ended), `deaths`, `cause`.
- `runWithBots(seed, days, kinds, opts)`: `createWorld(seed, opts.tuning, containers, { map: opts.map })` (containers =
  `assembleFullMap().containers` for full, else `MAP.containers`), `addBots`, then per tick `stepBots` and
  `tickWorld`, collecting `botDaily` at each day end; `opts.perturb` calls `nullPerturb` at tick 24 with
  `createRng(hashString(seed + ':perturb'))`.
- `divergence(a, b)`: share of NPC ids (over the longer list) whose `alive`, `region` or `groupId` differ.
- `nullPerturb(w, rng)`: one alive NPC (rng.pick) moves to a random neighbour region.

## Done when
- `cd games/dayg && npx vitest run src/sim/bots.test.ts` passes, with tests for: determinism (two 5-day runs with
  `['quester', 'solo']` give equal bot rows and world hashes); bots visit at least two districts by day 5 on the full
  map; `divergence(w, w) === 0`; `nullPerturb` makes divergence > 0. (Do not assert quest completions: quests.ts is
  written in parallel.)
- `npx tsc --noEmit -p games/dayg` shows no error in your files.

## Out of scope
cli.ts, scorecard.ts, bands.ts (issue 8.12 wires bots into the CLI), actions.ts, quests.ts, every game file.
~~~~

The five district issues (7.8 to 7.12) share this block, pasted into each:

```
## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Game: games/dayg (three.js,
  TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Do not run
  `npm install`, `git commit`, `git stash` or `npm run build`.
- Four other workers write the other districts at the same time, and more workers edit other games/dayg files. Edit
  only your two district files. tsc errors elsewhere are not yours.
- Units: 1 gm = 1 three.js unit; x grows east, z grows south (north is smaller z); ground is y = 0. The full map is
  x -1800..2200, z -3480..520; the slice (Lychgate, Old Rows, the Tap) keeps x 0..560, z 0..520.
- Code over clicking: place everything with loops and the helpers of `createStamper(district)` from
  src/world/stamp.ts (block, top, route, spot, spotOnTop, container, containerOnTop, prop, hatless, pit, haven, water,
  path, kerbPlot, headstoneRow, gate, done). Every id is prefixed for you; keep ids unique inside the district.
- 3D rules (docs/rendering.md): boxes that touch overlap by at least 0.1 gm and their tops differ by at least 0.1 gm
  (no shared faces); flat paths are PathDefs (the world builder lays them with draw layers), never thin boxes on the
  ground. Keep each district under 1500 blocks.
- What every region needs (src/world/districts.test.ts checks it): at least 4 `hatless` spots on the ground if its
  startHatless max > 0 (8 in NEST and PIT regions), at least 2 `npc` spots on safe high places if startNpcs max > 0
  (6 in HAVEN regions), at least 3 containers (8+ in regions over 0.2 km2), a climb route up every HIGH place, a
  `fence` block (30 tall, 4 thick, just outside the edge) along every part of the region's rect on the full map's
  outer edge. Container types by loot tier: T0-T1 vase, bin, sack, crate; T2 grave-goods, crate, chest; T3-T4 chest,
  grave-goods; DEEP regions camp-cache. A HAVEN region has `haven({ id, name: HAVEN_NAME[id], region, rect, minY })`
  over its safe top (minY = the top's height - 0.5) with `bed`, `board` and `fire` spots and 6 `npc` spots on it, and a
  `water` def when the region has water. DEEP regions are pits (`pit(id, rect, depth)` with depth = -floorY, the rect
  4 gm inside the region) with at least two `ladder` routes out (`route({ id: pitId }, side, 'ladder', at)`).
- Use existing @lawn/prefabs ids for props (`gravestone`, `gnome-statue`, `bench`, `flower-pot`, `signpost`,
  `lamp`, `wheelbarrow`, `crate`, `barrel`, `pew`, `altar`, `urn`, `crypt-door`, `chapel-bell`, `notice-board`,
  `compost-bin`, `market-stall`, `giant-flower`, `flowering-bush`, `standing-stone`, `stone-plaque`, `tree-stump`);
  check an id exists with `grep -rn "id: '<id>'" packages/prefabs/src/catalog/` before using it.
- Visual check: `cd games/dayg && npx vite --port <PORT> --strictPort` in the background, then the screenshot command
  (Edge headless, `--window-size=1280,800`, URL `http://localhost:<PORT>/?seed=1&map=full&spawn=<x>,<z>`) at one spawn
  point per region of yours, open the PNGs with the Read tool, then `npm run zfight -- "http://localhost:<PORT>/?seed=1&map=full&spawn=<x>,<z>"`
  at two of them. Stop the server when done.
```

~~~~text
Epic: 7 Districts (issue 7.8 The north: the Columbarium and the Bell Chapel)
Depends on: none

## Environment
(paste the shared district Environment block from the roadmap section "Round 2, Epic 7"). Your port: 5271.

## Goal
The north stage exists at blockout level: the vertical city in the Columbarium's niche wall (the Lantern Keepers'
haven) and the Bell Chapel with its 310 gm spire, the Kiln Sisters' infirmary in the nave and the catacombs beneath.

## Read first
- games/dayg/src/world/stamp.ts (helpers), src/world/types.ts (`DistrictMap`, `BlockKind`, `SpotKind`, `HavenDef`).
- games/dayg/src/sim/regionsFull.ts: your regions' rects, traits and floorY (district columbarium and bell-chapel).
- games/dayg/src/world/blockout.ts lines 1-120: how the slice stamps headstone rows, the gatehouse and routes.
- docs/design/dayg/regions.md: "6. The Columbarium", "7. The Bell Chapel", "Routes up".

## Change
- games/dayg/src/world/districts/columbarium.ts: `COLUMBARIUM_MAP` (district `columbarium`).
- games/dayg/src/world/districts/bellChapel.ts: `BELL_CHAPEL_MAP` (district `bell-chapel`).

## Contract
Regions and what to build (rects from regionsFull.ts):
- parapet (0..700, z -3480..-3350) and niches-high (z -3350..-3200) and niches-low (z -3200..-3050): one long
  `niche-wall` 70 tall along z -3480..-3360 (its top is the Parapet, `HIGH OPEN`, lookout `npc` spots and two
  `lamp` props); in front, stepped `niche-wall` ledges rows 1-6 at tops 4, 9, 25, 35, 45, 55 (rows 1-2 in niches-low,
  rows 3-6 in niches-high), each 12 deep, with `rope` routes every 60 gm and `ladder` routes from row 2 to row 3.
  Haven `columbarium` on the row-4 ledge over niches-high (minY 34.5); containers `urn`-like vases in niches.
- walkway (700..1400, z -3480..-3050): a colonnade, `stone` pillars 3x3 x 20 every 20 gm and a `roof` at y 20 (2
  thick) on two lines; `market-stall` props under it; a `letters` route on one pillar.
- garden-of-remembrance (0..1000, z -3050..-2800): rose beds as low `hedge` blocks (1.5 tall) in a grid with gravel
  paths, a fountain (`stone` basin) with a clean `water` def; `flowering-bush` props.
- rose-gate (1000..1400, z -3050..-2800): an arch (two `gatehouse` pillars 30 tall and a beam) across a gravel path.
- the-spire (0..700, z -2800..-2500): a `spire` tower 80x80 to y 120 with a `ladder` route on its south face, a
  `chapel-bell` prop and a `bell` spot on top (y 120), then a slender `spire` tip block to y 310 (the landmark).
- the-nave (0..700, z -2500..-2100): the chapel as four `chapel` walls (4 thick, 60 tall) around x 100..600, z
  -2480..-2120 with a `roof` at y 60, a door gap in the south wall closed by a 2.2 tall `stone` sill with a `ladder`
  route each side (Hatless cannot step over it); inside: `bench` rows (pews, 2 tall) and an `altar` prop. Haven
  `infirmary`: rect = the inside, minY -0.5.
- the-vestry (700..1000, z -2800..-2100): a small `chapel` building with a door sill like the nave's; T3 chests inside.
- chapel-rise (0..1000, z -2100..-1600): open grass with gravel paths up to the nave and a few `headstone` blocks.
- the-catacombs (1000..1400, z -2800..-1600): pit depth 30, `stone` pillars and coffin shelves (`stone` 2 tall at the
  pit floor y -30), three `ladder` routes out; dirty `water` puddle; FLOODS.
- Outer fence along the north edge z = -3480 for x 0..1400.
- Inner gates (north stage closed): `gate` walls 30 tall on the west border x = 0 for z -3480..-1600 and on the south
  border z = -1600 for x 0..800.

## Done when
- `cd games/dayg && npx vitest run src/world/districts.test.ts` passes for your two districts.
- `npx tsc --noEmit -p games/dayg` shows no error in your files.
- Screenshots at the spawn points `350,-3320` (niche ledges), `350,-2300` (inside the nave), `350,-2650` (the spire's
  foot), `1200,-2200` (catacombs) show the shapes; zfight passes at two of them.

## Out of scope
Every other district file, stamp.ts, fullMap.ts, worldBuilder.ts, blockout.ts.
~~~~

~~~~text
Epic: 7 Districts (issue 7.9 The east: the Lawn Section and the Drowned Corner)
Depends on: none

## Environment
(paste the shared district Environment block from the roadmap section "Round 2, Epic 7"). Your port: 5272.

## Goal
The flat, open Lawn Section (plaques, sprinklers, the irrigation tunnels, the mower tracks) and the Drowned Corner (lily
pond, reeds, the footbridge toll, the Willow Folk's haven in the willow, and the drain mouth smugglers' gate) exist at
blockout level.

## Read first
- games/dayg/src/world/stamp.ts, src/world/types.ts.
- games/dayg/src/sim/regionsFull.ts: districts lawn-section and drowned-corner.
- docs/design/dayg/regions.md: "9. The Lawn Section", "10. The Drowned Corner".

## Change
- games/dayg/src/world/districts/lawnSection.ts: `LAWN_SECTION_MAP`.
- games/dayg/src/world/districts/drownedCorner.ts: `DROWNED_CORNER_MAP`.

## Contract
- the-plaques (800..1200, z -1600..-900): a grid of flat `plaque` blocks (6 x 3, 0.6 tall) every 12 gm with
  flower-vase containers on some; nothing else (OPEN, no cover).
- sprinkler-field (1200..1600, z -1600..-900): sprinkler heads (`pipe` 1x1 x 1) every 30 gm, dirty puddle `water` defs.
- bench-line (800..1200, z -900..-200): a gravel path with `bench` blocks (2 tall) along it; lookout `npc` spots on them.
- the-irrigation (1200..1400, z -900..-200): pit depth 8 as three 12-wide north-south lanes with `pipe` valve boxes and
  ladder routes out at both ends.
- mower-tracks (1400..1600, z -900..-200): mown stripes as grass `path` defs 20 wide; nothing tall.
- the-reeds (1600..2000, z -1600..-1300): clusters of `reed` blocks 1x1 x 4 (COVER), dirty water.
- lily-pond (1600..2000, z -1300..-700): pit depth 3 over x 1650..1950, z -1250..-750 (dirty `water` def), lily pads
  as `stone` blocks from y -3 to y 0.2, 6x6, scattered so a gnome can hop between some.
- footbridge (1600..2000, z -700..-200): a stream pit (depth 3, 20 wide, east-west) with a wooden `beam` bridge over it
  (top 1.5) and toll-keeper `npc` spots at its ends.
- the-willow (2000..2200, z -1600..-900): a `yew` trunk 20x20 to y 60 with a platform `beam` 120x120 at top 40 (rope
  routes on two sides). Haven `willow` on the platform (minY 39.5); dirty water at the pond edge.
- drain-mouth (2000..2200, z -900..-200): pit depth 6 with a `pipe` culvert block and two ladder routes; GATE trait.
- Outer fence along the east edge x = 2200 for z -1600..-200.
- Inner gates (east stage closed): `gate` walls on the lawn's west border x = 800 for z -1600..-200 and on its north
  border z = -1600 for x 800..1600.

## Done when
- `cd games/dayg && npx vitest run src/world/districts.test.ts` passes for your two districts.
- `npx tsc --noEmit -p games/dayg` shows no error in your files.
- Screenshots at `1000,-1250`, `1300,-500`, `1800,-1000`, `2100,-1250` show the shapes; zfight passes at two.

## Out of scope
Every other district file, stamp.ts, fullMap.ts, worldBuilder.ts, blockout.ts.
~~~~

~~~~text
Epic: 7 Districts (issue 7.10 The east: Mausoleum Hill, the New Hill, the Shed and the Mower Yard)
Depends on: none

## Environment
(paste the shared district Environment block from the roadmap section "Round 2, Epic 7"). Your port: 5273.

## Goal
Mausoleum Hill (ten crypts, the Great Crypt, the obelisks, the back stair down to the catacombs, the New Hill's grave
pits, Digger's Rest) and the Shed (the dark shed floor, the four shelves with the Shelf Wrights' haven, the fuel store,
the giant mower, the back gate) exist at blockout level.

## Read first
- games/dayg/src/world/stamp.ts, src/world/types.ts.
- games/dayg/src/sim/regionsFull.ts: districts mausoleum-hill and shed.
- docs/design/dayg/regions.md: "11. Mausoleum Hill and the New Hill", "12. The Shed and the Mower Yard".

## Change
- games/dayg/src/world/districts/mausoleumHill.ts: `MAUSOLEUM_HILL_MAP`.
- games/dayg/src/world/districts/shed.ts: `SHED_MAP`.

## Contract
- crypt-row (1400..2200, z -2800..-2300): ten `crypt` blocks (40 x 30, tops 45 to 65 in steps of 2.3 so no two tops
  match) in two rows, `crypt-door` props on their fronts, `letters` routes on half of them; T3 chests on their roofs.
- great-crypt (1800..2200, z -3480..-2800): a `crypt` 300x300 to y 70 with a `roof` dome block 200x200 to y 80 on top,
  one `rope` route; T4 chest containers on top (CHOKE).
- obelisk-garden (1400..1800, z -3480..-3100): three `obelisk` blocks 4x4 x 33 with `letters` routes.
- back-stair (1400..1800, z -3100..-2800): pit depth 15 with a stair of `stone` steps 0.45 high each (walkable) down
  to its floor, plus one ladder route.
- new-hill (1400..2200, z -2300..-1900): open graves as pits 8 x 20, depth 20, in rows (PIT: hatless spots inside the
  pits too), and a spoil `heap` 15 tall with an `ivy` route.
- diggers-rest (1400..2200, z -1900..-1600): a parked mini digger as a `mower` block 60x30 to y 25 with a ladder.
- shed-floor (800..1300, z -200..200) and the-shelves (1300..1600, z -200..200): the shed as four `shed` walls (4
  thick, 80 tall) around x 800..1600, z -196..196 with a `roof` at y 80 and a wide door gap on the west wall; inside
  giant tool handles (`beam` 3x3 x 60) and sacks (containers, one guaranteed `salt-pinch`); four `shelf` boards (300 x
  40, 1 thick) along the east wall at tops 15, 30, 45, 60 with `rope` routes ("string") between them. Haven `shelves`
  on the 30 shelf (minY 29.5).
- fuel-store (1600..2200, z -200..200): fuel cans as `bin` blocks 6x6 x 10 and a burnt patch path.
- mower-yard (800..1800, z 200..520): the giant mower as a `mower` block 200x120 to y 40 with a deck `beam` at y 20 and
  a ladder route (T3 parts containers on the deck).
- back-gate (1800..2200, z 200..520): two `gatehouse` posts and a `fence` either side of a gap at the east edge.
- Outer fence: north edge z = -3480 and east edge x = 2200 for Mausoleum Hill; south edge z = 520 for x 800..2200 and
  east edge x = 2200 for z -200..520 (leave the back gate's gap).
- Inner gates (east stage closed): `gate` walls on x = 1400 for z -3480..-1600 (against the north) and on x = 800 for
  z -200..400 (against the Lower Walk and the Yews).

## Done when
- `cd games/dayg && npx vitest run src/world/districts.test.ts` passes for your two districts.
- `npx tsc --noEmit -p games/dayg` shows no error in your files.
- Screenshots at `1800,-2550`, `2000,-3140`, `1800,-2100`, `1100,0`, `1300,360` show the shapes; zfight passes at two.

## Out of scope
Every other district file, stamp.ts, fullMap.ts, worldBuilder.ts, blockout.ts.
~~~~

~~~~text
Epic: 7 Districts (issue 7.11 The south-west: the Yew Walk and the Gnome Garden)
Depends on: none

## Environment
(paste the shared district Environment block from the roadmap section "Round 2, Epic 7"). Your port: 5274.

## Goal
The rest of the Yew Walk (the Lower and Upper Walk and the Yews' branch towns) and the Gnome Garden (the Pile, the
ornament lawn with its giant gnome statues, the solar walk, the Bath House on the birdbath, the windchime hedge) exist
at blockout level, joined to the slice around the Tap and the Old Rows.

## Read first
- games/dayg/src/world/stamp.ts, src/world/types.ts.
- games/dayg/src/sim/regionsFull.ts: districts yew-walk (lower-walk, the-yews, upper-walk; the-tap is in the slice) and
  gnome-garden.
- games/dayg/src/world/blockout.ts lines 100-125: the Tap platform and its benches (match their style at the joins).
- docs/design/dayg/regions.md: "5. The Gnome Garden", "8. The Yew Walk and the Tap".

## Change
- games/dayg/src/world/districts/yewWalk.ts: `YEW_WALK_MAP` (district `yew-walk`).
- games/dayg/src/world/districts/gnomeGarden.ts: `GNOME_GARDEN_MAP` (district `gnome-garden`).

## Contract
- upper-walk (0..440, z -1600..0): a gravel avenue `path` (14 wide) from (380, 0) north to (380, -1600), benches and
  `bin` blocks along it; open ground elsewhere with a few headstone rows (use `headstoneRow`).
- the-yews (440..800, z -1600..0): giant clipped yews as `yew` blocks 60x60 x 130 every 120 gm in two lines, each with
  a branch platform `beam` 70x70 at top 40 and `rope` routes; yew-town `npc` spots and containers on the platforms.
- lower-walk (440..800, z 0..400): a gravel path from the Forecourt's corner (440, 400) north to (620, 0), benches, bins.
- the-pile (-1200..-600, z -400..100): a ring of broken-ornament heaps (`ornament` blocks 6-20 tall, irregular) around
  a pit (depth 8, 200x200) in the middle; 8+ hatless spots in and around it; T3 grave-goods containers in the pit.
- ornament-lawn (-600..0, z -400..100): five giant gnome statues (`ornament` 8x8 x 20, `gnome-statue` prop scaled at
  their base) with `letters` routes and lookout `npc` spots on top; a resin frog `ornament` 10x8 x 6.
- solar-walk (-1800..0, z 100..400): a gravel path east-west with `lamp` props every 40 gm.
- the-birdbath (-1800..-1200, z -400..100): a stone pedestal `birdbath` 10x10 to y 45 and a basin `birdbath` 40x40
  from y 45 to 50 on top with a clean `water` def, `ladder` routes on the pedestal; haven `bath-house` on the basin
  (minY 49.5).
- windchime-hedge (-1800..200, z 400..520): two `hedge` rows 8 tall with gaps; `soul-bell` props hung on posts.
- Outer fence: west edge x = -1800 for z -400..520 and south edge z = 520 for x -1800..200.
- No inner gates (south-west stage).

## Done when
- `cd games/dayg && npx vitest run src/world/districts.test.ts` passes for your two districts.
- `npx tsc --noEmit -p games/dayg` shows no error in your files.
- Screenshots at `380,-800`, `620,-600`, `-900,-150`, `-1500,-150`, `-800,460` show the shapes; zfight passes at two.

## Out of scope
Every other district file, blockout.ts (the slice), stamp.ts, fullMap.ts, worldBuilder.ts.
~~~~

~~~~text
Epic: 7 Districts (issue 7.12 The south-west: Wreathwood and the Compost Heaps)
Depends on: none

## Environment
(paste the shared district Environment block from the roadmap section "Round 2, Epic 7"). Your port: 5275.

## Goal
Wreathwood (wreath rings, Petalfall, the ribbon halls, the foam fields, the Crown) and the Compost Heaps (the warm bays,
clipping hills, leaf bins, the Greybearded's Wormways) exist at blockout level.

## Read first
- games/dayg/src/world/stamp.ts, src/world/types.ts.
- games/dayg/src/sim/regionsFull.ts: districts wreathwood and compost.
- docs/design/dayg/regions.md: "3. Wreathwood", "4. The Compost Heaps".

## Change
- games/dayg/src/world/districts/wreathwood.ts: `WREATHWOOD_MAP`.
- games/dayg/src/world/districts/compost.ts: `COMPOST_MAP`.

## Contract
- the-rings (-1800..-900, z -1300..-400): wreath frames lying flat, each four `wreath` blocks (6 tall) around a hole,
  in heaps; wire tunnels as gaps; HUSH COVER.
- petalfall (-900..0, z -1300..-400): bouquet `heap` blocks 3-8 tall with containers (several guaranteed
  `petal-bundle`); herbalist `npc` spots.
- ribbon-halls (-900..0, z -2200..-1300): tall stalks (`beam` 2x2 x 30) in a grid with ribbon platforms (`beam`
  boards 20x20 at top 20) and `rope` routes; ribbon gliders' `npc` spots up there.
- foam-fields (-1800..-1300, z -2200..-1300): green foam blocks (`stone` 10x10 x 3) and dirty puddle `water` defs.
- the-crown (-1300..-900, z -2200..-1300): one huge wreath on its edge: an arch of `wreath` blocks rising to a top
  platform at y 60 (40x20), one `rope` route; a band's hideout (npc spots, T2 chests).
- warm-bays (-1800..-900, z -3480..-2800): three compost bays, each three `bay` walls (U-shaped, 40 tall, 4 thick,
  120 wide); 8+ hatless spots inside; nothing sane lives here (no npc spots).
- clipping-hills (-900..0, z -3480..-2800): grass heaps (`heap` 10-25 tall) with `ivy` routes; WARM.
- leaf-bins (-900..0, z -2800..-2200): wire cages as `fence` boxes 20x20 x 15 with `ivy` routes; fuel containers.
- wormways (-1800..-900, z -2800..-2200): pit depth 10 as a maze of 12-wide tunnels (several pit rects that touch),
  `ladder` routes out at three places; the Greybearded's `npc` spots and old camp caches inside.
- Outer fence: west edge x = -1800 for z -3480..-400 and north edge z = -3480 for x -1800..0.
- No inner gates (south-west stage).

## Done when
- `cd games/dayg && npx vitest run src/world/districts.test.ts` passes for your two districts.
- `npx tsc --noEmit -p games/dayg` shows no error in your files.
- Screenshots at `-1350,-850`, `-450,-1750`, `-1100,-1750`, `-1350,-3140`, `-1350,-2500` show the shapes; zfight
  passes at two.

## Out of scope
Every other district file, stamp.ts, fullMap.ts, worldBuilder.ts, blockout.ts.
~~~~

~~~~text
Epic: 7 Room service (issue 7.13 Room store, Postgres)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Go is installed. Work in
  packages/platform-server. Do not run `git commit` or `git stash`.
- Another worker writes internal/service/room.go and main.go at the same time. Edit only the files under Change.
- Postgres tests run only when `PLATFORM_TEST_DATABASE_URL` is set (scripts/testdb.sh starts one if the postgresql-16
  binaries exist; on this Windows machine they may not). Without it, the Postgres test skips; say so in your report.

## Goal
`*Postgres` implements `RoomStore`, so production keeps DayG room saves in the database.

## Read first
- packages/platform-server/internal/store/room.go: `Room`, `RoomManifest`, limits, `ErrTooBig`, `RoomStore`, and
  `testRoomStore(t, s)` in room_test.go (reuse it).
- packages/platform-server/internal/store/postgres.go: `migrations` (append only), `Migrate`, `GetSave`/`PutSave`
  (the revision guard in SQL), `scanSave`.
- packages/platform-server/internal/store/hitch_postgres.go and hitch_test.go: a second store on `*Postgres` and its
  skip-without-database test.

## Change
- packages/platform-server/internal/store/postgres.go: append one migration creating `rooms` (code text primary key,
  game int, title, creator_id, invite_only bool, closed bool, revision bigint, tick bigint, host_id, part_count int,
  total_bytes bigint, part_hashes text[], summary, created_at, updated_at timestamptz), `room_members` (code, user_id,
  joined_at; primary key (code, user_id); index on user_id), `room_parts` (code, revision, idx, data bytea; primary
  key (code, revision, idx)), `room_uploads` (code, upload_id, idx, data bytea, created_at; primary key (code,
  upload_id, idx)), `room_invites` (code, token primary key, used bool, created_at). Foreign keys to rooms with
  `ON DELETE CASCADE`.
- packages/platform-server/internal/store/room_postgres.go (new): every `RoomStore` method on `*Postgres`, plus
  `var _ RoomStore = (*Postgres)(nil)`. CommitSave in one transaction: lock the room row (`SELECT ... FOR UPDATE`),
  check the base revision (ErrConflict), check every staged part exists and the byte total (ErrNotFound /
  ErrTooBig), copy the staged parts to `room_parts` at the new revision, delete older revisions' parts and the
  staging, update the room.
- packages/platform-server/internal/store/room_postgres_test.go (new): `TestPostgresRooms` that skips without the
  database and otherwise runs `testRoomStore` on a fresh schema (as hitch_test.go does).

## Contract
The `RoomStore` interface in room.go, unchanged; same errors as the memory store for the same inputs.

## Done when
- `cd packages/platform-server && go build ./... && go vet ./...` pass.
- `go test ./internal/store/ -count=1` passes (Postgres tests skip without the database; run them if you can start one
  with `eval "$(bash scripts/testdb.sh start 55433)"`, then `bash scripts/testdb.sh stop`).

## Out of scope
room.go and room_test.go (issue 6.2, done), internal/service, main.go, proto/, gen/.
~~~~

~~~~text
Epic: 7 Room service (issue 7.14 RoomSaveService)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Go is installed. Work in
  packages/platform-server. Do not run `git commit` or `git stash`.
- Another worker writes internal/store/room_postgres.go and postgres.go at the same time. Edit only the files under
  Change. Your tests use `store.NewMemoryRooms()`.

## Goal
The platform serves `gnome.save.v1.RoomSaveService` (generated in proto/gnome/save/v1/room.proto) on top of a
`store.RoomStore`, with membership, invite and size rules enforced.

## Read first
- packages/platform-server/gen/gnome/save/v1/room.pb.go and savev1connect/room.connect.go: the generated types and
  `RoomSaveServiceHandler`.
- packages/platform-server/internal/service/save.go: `SaveService.begin` (caller, account, pending-deletion check, game
  check), error mapping (`connect.NewError`, `internalErr`), timestamps.
- packages/platform-server/internal/service/save_test.go: how tests fake auth and build the service.
- packages/platform-server/internal/store/room.go: `RoomStore`, limits, errors.
- packages/platform-server/main.go lines 130-145: where services are registered.

## Change
- packages/platform-server/internal/service/room.go (new): `type RoomSaveService struct` embedding
  `savev1connect.UnimplementedRoomSaveServiceHandler`, `func NewRoomSaveService(users *UserService, rooms
  store.RoomStore) *RoomSaveService`, all nine RPCs.
- packages/platform-server/internal/service/room_test.go (new).
- packages/platform-server/main.go: register `savev1connect.NewRoomSaveServiceHandler(service.NewRoomSaveService(users,
  pg), append(opts, connect.WithReadMaxBytes(600*1024))...)`, and start a goroutine that calls
  `pg.PurgeUploads(ctx, now - 1h)` every hour.

## Contract
- Every RPC: the caller as in `SaveService.begin`. CreateRoom: game must be a known non-unspecified value; title
  trimmed, at most 60 runes (else INVALID_ARGUMENT); a code of 8 characters from A-Z0-9 by `crypto/rand`, retried on
  `ErrConflict` up to 5 times; returns the room.
- Member-only RPCs (GetRoomSave, GetRoomSavePart, PutRoomSavePart, CommitRoomSave) answer PERMISSION_DENIED to
  non-members; creator-only RPCs (UpdateRoom, CreateInvite) answer PERMISSION_DENIED to others.
- JoinRoom: NOT_FOUND unknown code; FAILED_PRECONDITION closed; invite-only rooms need a valid unused `invite`
  (`UseInvite`), else PERMISSION_DENIED; members join without an invite again (idempotent).
- PutRoomSavePart: upload_id matches `^[A-Za-z0-9_-]{16,40}$`; index 0..15; data at most 512 KiB (INVALID_ARGUMENT).
- CommitRoomSave: `part_hashes` length equals `part_count`, each 8 lowercase hex; summary at most 200 runes; store
  ErrConflict -> ABORTED, ErrNotFound -> INVALID_ARGUMENT ("a part is missing"), ErrTooBig -> INVALID_ARGUMENT; host_id
  = the caller.
- GetRoomSave: NOT_FOUND when `Revision == 0`. GetRoomSavePart: NOT_FOUND for a stale revision.
- CreateInvite: a 22-character token from `crypto/rand` (base64url without padding).
- Room and manifest messages filled from the store record (timestamps with `timestamppb.New`).

## Done when
- `cd packages/platform-server && go test ./internal/service/ -run Room -count=1` passes, covering: create, join,
  invite-only join with and without an invite, a non-member denied, a two-part upload and commit, a stale commit
  ABORTED, reading the parts back, a part too big, closing a room.
- `go build ./... && go vet ./...` pass.

## Out of scope
internal/store/** (other issues), proto/, gen/, packages/platform, packages/cloudsave.
~~~~

~~~~text
Epic: 7 Room service (issue 7.15 Cloudsave room client)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Do not run `npm install`, `git commit` or `git stash`.
- Other workers are editing other packages at the same time. Edit only the files under Change.
- Tests run in Node (vitest): no window, no localStorage, no IndexedDB. Everything outside comes through `deps`.

## Goal
`@lawn/cloudsave/room` lets a game create, join and list rooms and push and pull a shared world save of up to 8 MiB in
512 KiB parts through the platform's `RoomSaveService`, and keeps a local copy of the newest save in IndexedDB.

## Read first
- packages/cloudsave/src/index.ts: `CloudDeps`, `PlatformApi`, `GameName`, `defaultDeps`, how a missing session or a
  network error turns into 'off' (copy the style), `hashText` (FNV-1a).
- packages/cloudsave/README.md: the save rules.
- packages/platform/src/index.ts and src/gen/gnome/save/v1/room_pb.ts: `roomSaveClient()`, request and response types.
- packages/cloudsave/src/index.test.ts: how the platform is faked.

## Change
- packages/cloudsave/src/room.ts (new): the Contract.
- packages/cloudsave/src/room.test.ts (new): tests with a fake `RoomSaveService` client (an in-memory map of rooms and
  parts that applies the same revision rule) and a Map-backed `kv`.
- packages/cloudsave/package.json: add `"./room": "./src/room.ts"` to `exports`.

## Contract
```ts
export const ROOM_PART_BYTES = 512 * 1024;
export const ROOM_MAX_BYTES = 8 * 1024 * 1024;
export interface RoomInfo { code: string; title: string; creatorId: string; memberIds: string[]; inviteOnly: boolean; closed: boolean; revision: number; tick: number; updatedAt: string; summary: string }
export interface RoomDeps {
  signedIn: () => boolean;
  load: () => Promise<Pick<typeof import('@lawn/platform'), 'roomSaveClient' | 'ConnectError' | 'Code' | 'Game'>>;
  kv: { get(key: string): Promise<Uint8Array | null>; set(key: string, value: Uint8Array): Promise<void>; getMeta(key: string): Promise<string | null>; setMeta(key: string, value: string): Promise<void> };
}
export type PushResult = { ok: true; revision: number } | { ok: false; reason: 'stale' | 'too-big' | 'off' | 'error' };
export interface RoomSaves {
  available(): boolean;
  create(title: string): Promise<RoomInfo>;                        // rejects when not available
  join(code: string, invite?: string): Promise<RoomInfo>;
  list(): Promise<RoomInfo[]>;
  pull(code: string): Promise<{ data: Uint8Array; revision: number; tick: number; summary: string } | null>; // null: no save yet or off
  push(code: string, data: Uint8Array, tick: number, summary: string): Promise<PushResult>;
  local: { get(code: string): Promise<{ data: Uint8Array; tick: number } | null>; put(code: string, data: Uint8Array, tick: number): Promise<void> };
}
export function createRoomSaves(opts: { game: GameName; deps?: Partial<RoomDeps> }): RoomSaves;
export function fnvBytes(b: Uint8Array): string;                   // FNV-1a 32 as 8 lowercase hex
```
- pull: GetRoomSave (NOT_FOUND -> null), then every part of that revision in order, checks each `fnvBytes` against
  `part_hashes` (mismatch -> throw), concatenates; remembers the revision (meta `room:<code>:rev`).
- push: `data.length > ROOM_MAX_BYTES` -> too-big; splits into parts, a random upload id (24 characters A-Za-z0-9 from
  `crypto.getRandomValues`), PutRoomSavePart each, CommitRoomSave with the remembered revision as base (0 if none);
  Code.Aborted -> stale (the caller pulls and decides; highest tick wins); not signed in -> off; other errors -> error.
- local: IndexedDB by default (database `lawn-cloudsave-rooms`, store `rooms`, keys `data:<code>` and meta), the kv
  dep in tests; `local.put` stores the data and its tick.

## Done when
- `npm test -w packages/cloudsave` passes (new tests: create/join/list mapping, a 1.2 MiB push split into 3 parts and
  pulled back equal, a stale push, too-big, off when signed out, local put/get).
- `npx tsc --noEmit -p packages/cloudsave` passes.

## Out of scope
src/index.ts (the slot), README.md (the planner adds a section), packages/platform, every game.
~~~~

~~~~text
Epic: 7 Achievements (issue 7.16 Achievements catalog for phases 4-7)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Do not run `npm install`, `git commit` or `git stash`.
- Other workers are editing other files at the same time. Edit only packages/achievements/src/catalog.ts.

## Goal
DayG's new achievements exist in the shared catalog, each with a cosmetic gear reward from @lawn/prefabs, so the game
can unlock them from its own events.

## Read first
- packages/achievements/README.md: `AchievementDef`, rewards, slots.
- packages/achievements/src/types.ts: the exact fields.
- packages/achievements/src/catalog.ts: the existing `dayg-*` entries (about line 976); append after them.
- packages/achievements/src/achievements.test.ts: what the test checks about reward prefabs and slots.

## Change
- packages/achievements/src/catalog.ts: append these (game `dayg`, gameTitle `DayG`):
  | id | title | description | target | reward slot, prefab, label |
  |---|---|---|---|---|
  | dayg-word-gets-around | Word Gets Around | Finish 5 quests. | 5 | hand, folded-map, Folded Map |
  | dayg-sworn | Sworn | Reach Sworn rank in any faction. | | neck, name-tag, Name Tag |
  | dayg-kingmaker | Kingmaker | Finish a quest that puts its faction in first place. | | head, mole-crown, Mole Crown |
  | dayg-wanted | Wanted | Be known by half the gnomes alive. | | hand, wanted-poster, Wanted Poster |
  | dayg-four-at-the-gate | Four at the Gate | Play a room with three other gnomes. | | neck, clay-whistle, Clay Whistle |
  | dayg-handed-over | Handed Over | Stay in a room while its host changes. | | hand, compass, Compass |
  | dayg-bell-ringer | Bell Ringer | Ring the chapel bell and live through the night. | | hand, soul-bell, Soul Bell |
  | dayg-keeper | Keeper | Relight 20 grave lanterns on the Old Rows. | 20 | head, pilgrim-hat, Pilgrim Hat |
  | dayg-gatekeeper | Gatekeeper | Hold the Waystation with your faction for a whole season. | | neck, signal-horn, Signal Horn |
  | dayg-herd-herder | Herd Herder | Steer a herd of 200 or more into a pit. | | back, leaf-cloak, Leaf Cloak |
  | dayg-green-thumb | Green Thumb | Harvest a garden bed. | | hand, grain-sheaf, Grain Sheaf |
  | dayg-stonewright | Stonewright | Build a stone wall. | | hand, iron-trowel, Iron Trowel |
  | dayg-taught | Taught | Start a new gnome who learned from an old one. | | hand, red-book, Red Book |
  If the test rejects a reward (the prefab does not fit the slot), replace it with another existing prefab for that
  slot found with `grep -rn "id: '" packages/prefabs/src/catalog/` and say which in your report; keep the ids.

## Contract
The thirteen achievement ids above, exactly (the game calls `unlock` / `increment` with them).

## Done when
- `npm test -w packages/achievements` passes.

## Out of scope
Every other package and game; tracker.ts, types.ts.
~~~~

~~~~text
Epic: 7 Sim systems (issue 7.17 Building, traps and farming in the sim)
Depends on: none

## Environment
(paste the shared sim Environment block from the roadmap section "Round 2, Epic 7")

## Goal
Built pieces live in the sim with HP that Hatless pressure wears down, spike lines thin the horde, snares catch food,
and garden beds grow crops by world-day with water, weeding, seasons and trampling, all with ledger bookkeeping.

## Read first
- games/dayg/src/sim/types.ts: `PieceKind`, `PieceDef`, `Piece`, `Bed`, `CropId`, `CROPS`, `Ledger` (farmed,
  removedByPlayer), `DailyRow` (piecesUp, bedsGrowing, farmedFood, mown), `Tuning['build']`, `Tuning['farm']`.
- games/dayg/src/sim/build.ts and farming.ts: the stubs (placePiece is already real; keep every signature).
- games/dayg/src/sim/horde.ts: `hatlessInRegion`; games/dayg/src/sim/bubbles.ts: `bubbleIn` (regions with a bubble are
  simulated at L0 by the game, so skip L2 pressure there).
- games/dayg/src/sim/weather.ts: `seasonOf`; world.ts: `dayOf`, `endOfDay`.
- docs/design/dayg/crafting.md: "Building pieces", "Farming".

## Change
- games/dayg/src/sim/build.ts, games/dayg/src/sim/farming.ts: implement.
- games/dayg/src/sim/depth.test.ts (new).

## Contract
build.ts:
```ts
export function placePiece(w: WorldState, def: PieceDef, owner: SubjectKey): Piece;   // keep the stub's behaviour (garden-bed also pushes a Bed)
export function damagePiece(w: WorldState, id: number, amount: number): void;         // hp to 0 at least; reaching 0: event piece-broken, chronicle line
export function removePiece(w: WorldState, id: number): void;                         // hp = 0, no event
export function piecesIn(w: WorldState, r: RegionId): Piece[];                        // hp > 0, id order
export function stepBuild(w: WorldState, rng: Rng): void;
export function defenceOf(w: WorldState, r: RegionId): number;                        // sum hp of walls, barricades, doors in r
export function checkSnare(w: WorldState, piece: number): ItemStack[];
export function depthDaily(w: WorldState): Pick<DailyRow, 'piecesUp' | 'bedsGrowing' | 'farmedFood' | 'mown'>;
```
- `stepBuild`, each tick, for regions without a bubble: H = `hatlessInRegion`; walls (`plank-wall`, `barricade`,
  `reinforced-barricade`, `stone-wall`, `door`) take `pushPerHatless x H` damage per tick, split evenly over the
  region's walls (this is the L2 average of the design's 1 HP per Hatless per sun-minute against the few that find a
  wall); each `spike-line` destroys `rng.round(min(H, spikeKillsPerDay / ticksPerDay))` Hatless (density first, then
  herds; `ledger.hatlessDestroyed`) and loses 5 HP per kill; each `snare` sets flag `snare:<id>` with chance
  `snareFoodPerDay / ticksPerDay`.
- `checkSnare`: a standing snare with its flag set clears it and returns `[{ def: 'pickled-slug', count: 1, condition:
  1 }]`, booking `ledger.farmed.food += 1` and `ledger.removedByPlayer.food += 1`; else [].
- `depthDaily`: standing pieces, beds with a crop not ready, `ledger.farmed.food`, the district with
  `mowing.mownUntil > tick` (first in DISTRICTS order) or null.
farming.ts:
```ts
export function plantBed(w: WorldState, bed: number, crop: CropId): boolean;   // bed index into w.beds
export function waterBed(w: WorldState, bed: number, litres: number): void;    // water += litres, at most 3
export function tendBed(w: WorldState, bed: number): void;                     // tendedTick = tick
export function harvestBed(w: WorldState, bed: number): ItemStack[];
export function stepFarms(w: WorldState, rng: Rng): void;
export function bedOf(w: WorldState, piece: number): Bed | null;
```
- `plantBed`: the bed's piece stands, no crop, the current season is in `crops[crop].seasons`.
- `stepFarms`, once per world-day (at `endOfDay(w)`): each planted bed uses `waterPerDay` (below 0 -> flag
  `bed:<i>:dry`); ready when `(tick - plantedTick) / ticksPerDay >= days`; trample: with chance `trampleK x H / 10`
  (H in its region) the crop is lost (crop null) and the bed piece takes 10 damage.
- `harvestBed`: a ready bed yields `round(yield x (dry ? unwateredMul : 1) x (untended for weedsDays ? weedsMul : 1))`
  items: clover `seed-cake`, toadstool `red-mushroom`, grain `grain-sheaf`, berries `blackberry` (x2 count), roses
  `petal-bundle`, acorn-tree `acorn`; booked in `ledger.farmed` and `ledger.removedByPlayer` by the item's resource;
  crops with `repeatDays > 0` regrow (`plantedTick = tick - (days - repeatDays) x ticksPerDay`), others clear; event
  `harvest`.

## Done when
- `cd games/dayg && npx vitest run src/sim/depth.test.ts` passes, with tests for: clover ready in 5 days and its yield;
  the unwatered and weeds multipliers; a barricade broken by density 40 in the expected number of ticks; spike-line kills
  booked so `hatlessTotal` + destroyed stays consistent; a snare catch; conservation over 10 days with pieces and beds
  (resourceTotals + farmed + givenByPlayer - consumed - removedByPlayer).
- `npx tsc --noEmit -p games/dayg` shows no error in your files; `npm test -w games/dayg` still passes.

## Out of scope
actions.ts, factions.ts (it calls defenceOf), mowing.ts, every game file.
~~~~

~~~~text
Epic: 7 Sim systems (issue 7.18 The Mowing and the storylets)
Depends on: none

## Environment
(paste the shared sim Environment block from the roadmap section "Round 2, Epic 7")
- Lore: the Mowing is never seen (core fact 3 in docs/lore/canon.md; entry `the-mowing`); storylet names are fixed in
  the stub. Run `npm run lore -- find sexton` before writing quest titles; follow the "DayG speech" ruling.

## Goal
About every three seasons the Mowing cuts one district flat (cover gone, herds scattered, loot strewn) after two days
of rumbling, and six hand-written storylets fire once each when the world fits them, posting special quests.

## Read first
- games/dayg/src/sim/types.ts: `MowingState`, `StoryletId`, `STORYLET_IDS`, `StoryletState`, `QuestGoal` (storylet,
  visit), `Tuning['mowing']`, `Tuning['storylets']`, `DISTRICTS`.
- games/dayg/src/sim/mowing.ts and storylets.ts: the stubs.
- games/dayg/src/sim/quests.ts: `postQuest`, `NewQuest`, `questTitle`; factions.ts: `FOUNDERS`, `membersOf`;
  social.ts: `standingOf`; regionsFull.ts: `districtOf` (signatures; some are stubs while you work).
- docs/design/dayg/quests.md: "Hand-written storylets"; docs/design/dayg/world.md: "Weather, seasons".

## Change
- games/dayg/src/sim/mowing.ts, games/dayg/src/sim/storylets.ts: implement.
- games/dayg/src/sim/story.test.ts (new).

## Contract
mowing.ts (signatures as in the stub):
- `initMowing`: `next = tick + rng.int(everyDays) x ticksPerDay`.
- `stepMowing`: when not warned and `next - tick <= warnDays x ticksPerDay`: pick the district now (weighted among
  districts present in `w.graph`: lawn-section 3, every other 1), `warned = true`, event `mowing-soon`, chronicle "The
  ground shook in the night, somewhere toward <district name>." At `tick >= next`: `mownUntil[d] = tick + coverDays x
  ticksPerDay`; in d's regions, `herdScatter` of every herd's size moves to density of a random neighbour outside d;
  `spillShare` of each region's loot moves to a random neighbour region (conserved); event `mowing`; chronicle "In
  one night the grass of <district name> was cut flat."; `lastTick`, a new `next`, `warned = false`, `district = null`.
- `isMown(w, d)`: `(mownUntil[d] ?? -1) > tick`. `mowingSoon(w)`: warned ? `{ district, inTicks: next - tick }` : null.
- `regionTraits(w, r)`: the graph's traits; while its district is mown, without `COVER` and with `OPEN`.
- District names: the Lychgate, the Old Rows, the Yew Walk, the Gnome Garden, Wreathwood, the Compost Heaps, the
  Columbarium, the Bell Chapel, Mausoleum Hill, the Lawn Section, the Drowned Corner, the Shed.
storylets.ts: `STORYLETS` keeps ids and titles; `stepStorylets` every `storylets.checkEvery` ticks fires each storylet
at most once per world (push a `StoryletState`, event `storylet`, chronicle line) when:
| id | fires when | quest (template `storylet`, poster, board = nearest board to the region) |
|---|---|---|
| gate-book | tick >= 1 | "The Gate Book": goal visit `the-tap` with item `red-book`; poster the Waystation's holder; the newcomer board |
| last-sexton | the Lantern Keepers (founder yarrow-gravelpot) are alive and their first leader is alive | "The Last Sexton": goal storylet step 10 (lanterns lit) region `ivy-rows`; on done (quests.ts records it), the Keepers' norms.strangers becomes 'welcome' if the Old Rows' density fell since firing, else 'question' (check it here when the quest is done) |
| seeds-for-spring | winter, and the market's food stock < half its target | "Seeds for the Spring": goal storylet step 1 region = the Crypt Holders' home (or `child-graves`); poster the Tap holder |
| greybearded-walk | the Greybearded are alive and some online player's standing with them >= 20 | "The Greybearded Walk": goal storylet step 1 region = their home; on done set flag `greybearded-walk:<player>` |
| who-rang-the-horn | `bellTick` within the last 3 days, or a herd moved into a HAVEN region this check | "Who Rang the Horn?": goal storylet step 2 region = the haven or bell region; poster its holder |
| mower-rumbles | `mowingSoon(w)` is not null | "The Mower Rumbles": goal storylet step 1 region = a region of the coming district; reward acorns 10 |
Rewards: acorns 6 (10 for mower-rumbles), trust 0.15, no items; deadline `expireDays.storylet`.

## Done when
- `cd games/dayg && npx vitest run src/sim/story.test.ts` passes, with tests for: a Mowing within `everyDays` on a fixed
  seed, its warning `warnDays` before, cover removed while mown, resources conserved through the spill; gate-book fires
  on day 1; each other storylet fires once when you set its condition by hand (push factions or flags yourself) and
  never twice.
- `npx tsc --noEmit -p games/dayg` shows no error in your files; `npm test -w games/dayg` still passes.

## Out of scope
quests.ts (postQuest is called, not changed), factions.ts, chronicle.ts, every game file.
~~~~

<!-- PART 6 -->
