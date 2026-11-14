# Roadmap: gnaft

Goal: a 3D Raft-like prototype. A gnome adrift on a little patch of floating grass fishes junk out of the sea, grows and mows grass to expand the raft, crafts a telescope to find islands, and sails to them for better mowers (scrap metal → push mower, fuel → gas mower, parts → riding mower).

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (written directly) | `config.ts` (types, tuning, tables), `rules.ts` (pure rules), `input.ts`, `main.ts` loop, stubs for every system, copied `gnome.ts` / `mowerModels.ts`; game builds | 0 |
| 2. Systems | Ocean, raft tiles, player, mowing, fishing, building, navigation, HUD, audio all real; game builds and smoke test passes | 9 |
| 3. Feature round 1 | Day/night, weather, seagull, shark, minimap, goals + victory, music, save, sprinkler/flamingo props, raft polish, bottles + splashes, zoom/sprint, new sounds, HUD clock; build, smoke and #selftest pass | 14 |
| 4. Swim, grab, planks and sheds | Rename to gnaft; swimming, grabbing nearby junk with E, planks + fun junk, plank floor/wall/roof building, island docking fix; build, smoke and #selftest pass | 3 |
| 5. Co-op and mobile | Shared server (`packages/mp`, `packages/mp-server`: per-game queues, drop-in joins); Gnaft net sync, co-op lobby, touch controls; server tests, two-browser co-op test, build, smoke and #selftest pass | 3 |

Epic 2 issues are in `docs/roadmaps/gnaft/epic2-*.md`, each one being `_common.md` (environment and world conventions) plus the issue body.

Epic 3 issues are `docs/roadmaps/gnaft/epic3-*.md`. Before epic 3 the planner added the contracts directly: new GameState fields, rules (props, growth multipliers, shark/bottle helpers), input wheel, `getAudio`/`setRain`, light handles in Ctx and stubs for every new system.

Epic 4 issues are `docs/roadmaps/gnaft/epic4-*.md`. Before epic 4 the planner renamed the game to gnaft and added the contracts directly: planks and fun junk (`FUN`, `collectDebris`), `SWIM`/`GRAB`, shed pieces (`Structure`, `SHED`, `canBuild`/`placeTile` with a wall direction, `deconstruct`, `surfaceY`, `wallBlocks`), solid islands (`islandGap`, docking on contact, cast off pointing away), and the mowing/save/audio changes.

Epic 5 issues are `docs/roadmaps/gnaft/epic5-*.md`. Before epic 5 the planner moved the Lawn Gnome Panic matchmaking server to `packages/mp-server` with the protocol, client and text filter in `packages/mp`, made matchmaking per-game (`GAMES`) with drop-in joins, and added the co-op contracts to Gnaft: `netRole`, `CoopState`, `netHook`/`NetAction`/`applyNetAction`, `snapshotWorld`/`applyWorld`, guest guards in main/save/weather, and the virtual input layer for touch.
