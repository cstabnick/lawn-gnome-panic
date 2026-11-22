# Gnomomia: walking around town

Goal: in Gnomes of Gnomomia it is easy and safe to walk around every town. Enemies never attack a gnome inside a town
(the Bound-Peace), town lanes are walkable unless something is meant to block them, the AI gnome players
(companions, "Wayfarers") stroll in whatever town the player is in and are relayed to other players there, and the
balance sim gains town-walk scenarios with a headless check and a visible demo. The reasoning lives in `docs/lore`.

Reading of the request (decided without asking):

- "The simulator and scenario thing" is `games/gnomes-of-gnomomia/src/sim`. Town walking gets its own module there
  (`src/sim/townWalk.ts`), a script (`npm run sim:town`) and a dev URL (`?townwalk=<town>`) for the visible demo.
- "Simulated players" are the companions (`src/companions.ts`): the AI gnome players that already roam the world and
  are already relayed over `@lawn/mp` (`companionPoses()` in the MMO pose). No new netcode.
- Towns are the eight in `src/towns.ts` (foundation, below).

## Foundation (done by the planner)

- `games/gnomes-of-gnomomia/src/towns.ts`: `TOWN_DEFS`, `TOWNS` (world bounds from each town's region),
  `townAt`, `inTown`, `townsInZone`, `townById`, `townWaypoints`, and the pure peace rules `enemyMayEngage`,
  `enemyMayWanderTo`, `spawnCircleClearOfTowns`, `TOWN_SPAWN_MARGIN = 2`.
- Ambient spawn markers moved out of towns (level JSON markers): `c2-spawn-2` (Thatchford water beetles),
  `s03-spawn-1`, `s03-spawn-2` (cellar rats, to the Hose bank west of the square), `c4-spawn-4` (field mice),
  `c4-spawn-5` (grasshoppers), `c5-spawn-6` (Hedgewright thugs after the peace).

| Town | Zone | Region (bounds) | World centre, r |
|---|---|---|---|
| Mossbottom | mossbottom | village | 0, 0, 24 |
| Thatchford | thatchford | thatchford-town | 0, -240, 28 |
| Pedestal Ward | keep | pedestal-ward | 0, -415, 24 |
| Sodbury | cloverfield | sodbury | -210, -490, 26 |
| Clippings | hedgewood | clippings | 200, -640, 22 |
| Barkhollow | hedgewood | barkhollow | 240, -700, 16 |
| Flintdelve | rockery | flintdelve | -180, -740, 22 |
| the Last Tuft | verge | last-tuft | -20, -940, 24 |

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation | `npx tsc --noEmit` and `check-bake` pass | planner |
| 2. Town walk | build, tests, lore, smoke, `sim:town` pass | 5 (A-E), parallel |

Run on Opus sub-agents at the user's request (not Haiku). Files are disjoint; only issue B runs `bake-walk`.

## Epic 2 issues

~~~~text
A. The Bound-Peace in code
Files: src/config.ts (SpawnGroup.townFight), src/entities.ts, src/combat.ts, src/quests.ts,
src/data/packs/s04-queen-outside.ts, s14-the-smiths-road.ts, s03-heir-of-the-heap.ts, new src/townPeace.test.ts.
- SpawnGroup gains `townFight?: boolean` (called fight). spawnEnemyAt(defId, x, z, opts?: { townFight?: boolean }).
- entities.ts: Slot remembers townFight. findAggroTarget skips targets where !enemyMayEngage(x, z, townFight).
  An enemy in combat whose target is inside a town gives up exactly like a leash break (heal, walk home,
  'enemy-reset'). It never swings at a target in a town. pickSpot rejects spots where !enemyMayWanderTo.
- combat.ts enemyAttack: no damage when the player is in a town and the enemy is not a called fight (belt and braces).
- quests.ts: defend-wave spawns pass { townFight: true }.
- Data: s04-spawn-1 and s14-spawn-1 get townFight: true. The s03 cellar-rat kill stage text says where the rats are now.
- Test: every ambient spawn group (no townFight) passes spawnCircleClearOfTowns; every townFight group has a
  quest/questStage condition; the called-fight list equals an explicit allowlist; enemyMayEngage cases.

B. Town lanes are walkable
Files: new src/townBlocks.ts (intentional blocks), new src/townPaths.test.ts, level JSON, world.deltas.json,
walk.bake.json. For every town: flood fill over the live terrain (gates open) from the shrine/centre, then every
townWaypoints() spot and every road sample inside the bounds must be reached, except entries in TOWN_BLOCKS
(each with a reason). Real gaps get fixed in the level data, then bake-walk. Plus click-to-move legs with findPath3
from the centre to a spread of waypoints.

C. Town-walk sim and demo
Files: new src/sim/townWalk.ts, src/sim/townWalk.test.ts, scripts/sim-town.mjs, package.json (script sim:town),
new src/townTour.ts, main.ts (dev ?townwalk=<town>), demos/town-walk-thatchford.json.

D. Wayfarers stroll in town
Files: src/companions.ts, src/companionLogic.ts, src/companionLogic.test.ts, new src/net/townVisibility.test.ts.
When the player is in a town, at least two companions stroll between that town's waypoints instead of questing.

E. Lore
Files: docs/lore/** only. Entries the-bounds (concept), beating-the-bounds (event or term, may be folded into
the-bounds), wayfarers (faction); rulings R-041 (Bound-Peace, called fights), R-042 (cart-width lanes,
intentional blocks), R-043 (Wayfarers are the companions; they keep the peace); town entries get a line.
~~~~

## End-of-epic fixes (planner)

- The sim arena sits at world (0, 0), inside Mossbottom's bounds: its enemies are now called fights
  (`src/sim/arena.ts` `ARENA_FIGHT`), or the Bound-Peace switched the balance sim's fights off.
- Click-to-move re-plans from where it stopped (up to twice) after a blocked step instead of dropping the path
  (`src/player.ts` `BLOCK_REPLANS`). The 1 m planner sometimes judges a step clear that grazes a house collider from
  the walker's real position; the sim found three such snags in Thatchford and Pedestal Ward. `src/sim/townWalk.ts`
  walks the same way and aims each leg at the nearest standable spot (the Thatchford fountain is solid).
- `townWalk.test.ts` now requires every scripted leg to succeed (okRate 1).
