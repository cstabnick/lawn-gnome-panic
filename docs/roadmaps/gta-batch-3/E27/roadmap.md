# E27 roadmap: physics follow-ups (bushes, water skipping, test stability)

Brief: [../E27-physics-follow-ups.md](../E27-physics-follow-ups.md). Game: `games/gnome-theft-auto`.

## Audit: which colliders count as "little bushes" (L113)

Mowable plants (`src/flora/`, `docs/roadmaps/gta-mowable-plants.md`) already took small bushes, beds, ferns, grass and
crops out of `world.boxes`: a vehicle cuts them to stubble with a clippings burst and a small slow. A headless audit
(build the world with the harvest open, install the city dressing, match every remaining collider no wider than 3 m and
no taller than 2.2 m above the ground to the static placement it stands on) listed what is still solid:

| Still solid | Count | Verdict |
|---|---|---|
| broadleaf-tree / palm-tree / cone-pine trunks | 1430 / 132 / 126 | trees: stay solid |
| hedgerow (4 m x 1.1 m, 1.3 m) | 521 | big hedge wall: stays solid |
| topiary-cone (2.0-2.2 m) | 28 boxes (106 placed) | set-piece topiary, taller than 1.8 m: stays solid |
| fences, walls, railings, bins, benches, mailboxes, rocks, stumps, barrels, carts | ~2,500 | not plants |
| **rose-bush** (parks) | 57 placed | **gap**: not in `PLANT_KINDS`, so the parks give it a collider |
| **allotment-bed** (parks) | 40 placed | **gap**: same |
| **flowering-bush** (Pebblewick) | 2 | no collider (`solid: false`) but drawn static, never flattened: hand to flora |

Threshold, written down: a plant is a "little bush" when its kind is in `PLANT_KINDS` with `mowable: true` and its
placed height is at most `FLORA.maxMowHeight` (1.8 m). Everything else in the table above stays solid.

## Test stability: root cause (traffic.test.ts)

The traffic sims were not deterministic, in four ways:

1. `vehicles.ts collideVehicles` debounced crash damage with `performance.now()`. A 6-minute sim runs in a few wall
   seconds alone but many more under a loaded full suite, so the 400 ms debounce let more hits through per simulated
   minute when loaded: lower `meanHp` (the "keep moving" check is `> 0.93`), slower damaged cars, more jams. Fixed: a
   game-time clock advanced by `dt` (the test now passes its `dt`).
2. The traffic-warden clock (`trafficDirectors.ts`) starts at `Date.now()` and is module state advanced by every
   traffic step of every earlier test: three wardens stand on junctions of the test grid, so their phase (and so the
   jams) changed per run and per test order. Fixed: `resetDirectorClock()` for tests.
3. Traffic draws from `Math.random`; only one test seeded it. Fixed: every sim test seeds it (`deterministic(seed)`).
4. The four-preset sim-chassis corner test had vitest's 30 s default timeout. Fixed: 120 s like the others.

No assertion was loosened.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 foundation (lead) | `types.ts` `Vehicle.skim`, `src/skim.ts` contract + stubs, traffic determinism; tsc clean | - |
| 1 parts | flora kinds + Pebblewick, skimming in both drive models, reward prefabs + achievements + tracker; each with tests | 3 |
| 2 wiring (lead) | `app.ts` spray/sound/achievements, `flora/runtime.ts` `onPlayerMow`, lore R-178, docs; full checks x3 | - |

Hot files (lead only): `src/app.ts`, `src/flora/runtime.ts`, `src/types.ts`, `AGENT_INDEX.md`, `docs/lore/rulings.md`.

## Epic 1 issues

~~~~text
Epic: 1 (E27 parts), issue 1A: little bushes that were still solid
Depends on: none

## Environment
Repo root: the worktree you were started in. Game: games/gnome-theft-auto (three.js, TypeScript, vitest). Git Bash; if
node is not found: export PATH="/c/Program Files/nodejs:$PATH". Keep LF line endings. Other workers are editing other
files of this game at the same time (src/skim.ts, src/vehicles.ts, src/simdrive.ts, packages/*): do not touch them.
Do not commit.

## Goal
Rose bushes and allotment beds in the parks, and Pebblewick's flowering bushes, become mowable plants: a vehicle drives
through them and flattens them (flora already does the cut, clippings and slow) instead of hitting a collider.

## Read first
- games/gnome-theft-auto/src/flora/kinds.ts: PLANT_KINDS rows, FLORA.maxMowHeight (1.8), mowableAt().
- games/gnome-theft-auto/src/flora/kinds.test.ts: how kinds are tested.
- games/gnome-theft-auto/src/flora/harvest.ts: addMowablePlants(placements) returns the placements it did NOT take.
- games/gnome-theft-auto/src/outskirts/build.ts: buildTown() at the bottom.

## Change
- src/flora/kinds.ts: add three mowable rows to PLANT_KINDS, after the 'round-bush' row and before the
  "Not mowable" comment (keep every existing row and its order; index order matters for saved per-kind counts, so only
  append in that spot):
    { id: 'rose-bush', name: 'Rose bush', size: 'big', mowable: true, slow: 0.88, clip: 0xd94a6a, regrow: [90, 120], sound: 'mow-thunk', longGrass: false },
    { id: 'flowering-bush', name: 'Flowering bush', size: 'big', mowable: true, slow: 0.88, clip: 0xe07ab0, regrow: [90, 120], sound: 'mow-thunk', longGrass: false },
    { id: 'allotment-bed', name: 'Allotment bed', size: 'small', mowable: true, slow: 0.95, clip: 0x6a9a3a, regrow: [80, 120], sound: 'mow-chop', longGrass: false },
  Put the measured unscaled height (m) as a trailing comment on each row, like the others (measure with
  new THREE.Box3().setFromObject(buildPrefab(id, { lights: false })).max.y in a throwaway script or test).
- src/outskirts/build.ts buildTown(): hand the plain placements to flora first and batch only what comes back:
    const rest = addMowablePlants(plan.placements);
    if (rest.length) scene.add(buildStaticCells(rest, { lights: false, name: 'pebblewick', cls: 'building' }));
  (import { addMowablePlants } from '../flora/harvest'). Leave the landmarks batch as it is.
- src/flora/kinds.test.ts: add a test: plantKind('rose-bush'), plantKind('flowering-bush') and
  plantKind('allotment-bed') are mowable, and mowableAt(id, <its measured unscaled height>) is true for each (import
  buildPrefab from '@lawn/prefabs' and THREE to measure). If a measured height is above 1.8, say so in your report and
  do not change FLORA.maxMowHeight.

## Contract
PLANT_KINDS keeps every existing row at its index; the three new rows go right after 'round-bush'.

## Done when
- cd games/gnome-theft-auto && npx vitest run src/flora src/cityScenery src/outskirts passes
- npx tsc --noEmit -p games/gnome-theft-auto passes (errors in src/skim.ts, src/vehicles.ts or src/simdrive.ts belong
  to another worker mid-edit: ignore those, report them)

## Out of scope
src/flora/runtime.ts, src/app.ts, src/skim.ts, src/vehicles.ts, src/simdrive.ts, packages/.
~~~~

~~~~text
Epic: 1 (E27 parts), issue 1B: skimming over deep water at speed (both drive models)
Depends on: none (the lead already wrote the contract stub src/skim.ts and the Vehicle.skim field in src/types.ts)

## Environment
Repo root: the worktree you were started in. Game: games/gnome-theft-auto (three.js, TypeScript, vitest). Git Bash; if
node is not found: export PATH="/c/Program Files/nodejs:$PATH". Keep LF line endings. Other workers edit
src/flora/*, src/outskirts/build.ts and packages/* at the same time. Do not commit. Keep the game's feel: this is a
small addition, do not retune anything else.

## Goal
A ground vehicle (not a boat, not a flyer) that reaches water at least SKIM.minDepth (0.6 m) deep at SKIM.enterSpeed
(13 m/s) or faster, underside at or above the surface (within SKIM.slack), skims across it like a flat stone: no engine
drive, speed bleeding by SKIM.dragPerS, a hop every SKIM.hopEvery s (vy = hopVelocity(speed), speed *= hopKeep), steering
at SKIM.steer of normal. Below SKIM.keepSpeed, or when it leaves deep water, the skim ends and the existing rules take
over unchanged: deep water sinks it (swim.ts checkSink only sinks when v.y < surface - 0.2), shallow water waterlogs it
(waterlog.ts only soaks when v.y < surface). Fords (< 0.6 m) behave exactly as today.

## Read first
- games/gnome-theft-auto/src/skim.ts: the contract (SKIM, SkimState, SkimEvent, skimSurfaceAt, stepSkim stub,
  hopVelocity, clearSkim). Keep every exported name and signature; fill in stepSkim.
- games/gnome-theft-auto/src/vehicles.ts: stepOther (arcade; `g = groundAt(...)`, the vertical branch with
  ARCADE_AIR.gravity, throttle/drag block, steering gate) and moveVehicle (`grounded` snap). Do not touch
  collideVehicles (the lead changed it).
- games/gnome-theft-auto/src/simdrive.ts: GUARDED_PROBE (wraps terrainProbe; placeCap is the precedent for a module
  flag read during a cast), stepChassis (sd.ctrl.update(dt, input), body.vel / body.pos), writePose
  (v.y = groundAt(...)).
- games/gnome-theft-auto/src/airtime.test.ts: how tests build a vehicle record and drive stepVehicle / createSimDrive /
  stepChassis headless (mocks at the top).
- games/gnome-theft-auto/src/swim.test.ts: Loch Moss centre (-700, -680) is deep water: waterAt(-700, -680)!.surface.

## Change
- src/skim.ts stepSkim(v, hSpeed, underY, moved, dt): create v.skim if missing ({ active: false, t: 0, dist: 0,
  bounces: 0, hopT: 0, event: null }); set event = null each call. Not active: start when skimSurfaceAt(v.x, v.z) is not
  null, hSpeed >= enterSpeed and underY >= surface - slack (active = true, t = dist = bounces = 0, hopT = hopEvery,
  event 'start'). Active: end (active = false, event 'end', keep t/dist/bounces) when skimSurfaceAt is null, hSpeed <
  keepSpeed, or underY < surface - slack - 0.5; otherwise t += dt, dist += moved, and while the underside is within
  0.1 m of the surface count hopT down; at <= 0, hopT += hopEvery, bounces++, event 'bounce'. Return v.skim.active.
- src/vehicles.ts stepOther, ground vehicles only (not flyers; boats never reach stepOther; skip v.sunk/exploded): call
  stepSkim(v, Math.abs(v.speed), v.y, Math.abs(v.speed) * dt, dt) before the vertical step. While it returns true: use
  floor = Math.max(g, skimSurfaceAt(v.x, v.z) ?? g) instead of g in the vertical branch, on event 'bounce' set
  v.vy = hopVelocity(v.speed) and v.speed *= SKIM.hopKeep, apply v.speed *= SKIM.dragPerS ** dt, give no throttle
  acceleration (braking still works), multiply the steering gate by SKIM.steer. moveVehicle's grounded snap must not
  pull a skimming vehicle down to the bed.
- src/simdrive.ts: a module flag (like placeCap) that GUARDED_PROBE reads: while on, a downward ray whose origin is at
  or above skimSurfaceAt(origin.x, origin.z) also hits that horizontal plane (normal (0,1,0)); return whichever hit is
  nearer (land/deck or water). In stepChassis, for ground specs: before sd.ctrl.update compute hSpeed =
  hypot(body.vel.x, body.vel.z) and turn the flag on when v.skim?.active or hSpeed >= SKIM.enterSpeed (so the front
  wheels already find the water as the car crosses the shore); turn it off after update (try/finally). After update,
  call stepSkim(v, hSpeed, body.pos.y - sd.ctrl.rideHeight, horizontal distance moved this frame, dt); while skimming:
  pass throttle 0 into the controller input (next frame is fine), multiply body.vel.x/z by SKIM.dragPerS ** dt, on
  'bounce' add hopVelocity(hSpeed) to body.vel.y and multiply body.vel.x/z by SKIM.hopKeep. In writePose, while
  v.skim?.active, v.y = Math.max(groundAt(...), surface) so checkSink and stepWaterlog see it at the surface.
- src/skim.test.ts (new): (1) stepSkim unit cases at Loch Moss (-700, -680): 20 m/s at the surface starts ('start');
  10 m/s does not; an active skim at 5 m/s ends ('end'); on land (0, 0) never starts. (2) Arcade: a 'sports' (or the
  fastest ground kind in config VEHICLES) record at the loch surface, yaw toward open water, speed 25, driver 'player',
  stepVehicle with throttle 1 at dt 1/30 for 8 s, checkSink after each step: it skims (event 'start' seen), at least one
  'bounce', covers 15-60 m before 'end', and is sunk (v.sunk) by the end. Same record at speed 10: sunk within 1 s and
  never skims. (3) Sim: the same with createSimDrive + stepChassis: skims at least 10 m and at least one bounce at 25 m/s
  entry; at 8 m/s never starts. Pick a heading from the loch centre that stays over deep water for 60 m (check with
  skimSurfaceAt along the line in the test).

## Contract
src/skim.ts keeps every exported name and signature as written. Vehicle.skim?: SkimState (types.ts, already there).

## Done when
- cd games/gnome-theft-auto && npx vitest run src/skim src/swim src/waterlog src/sinkSim src/boatCrossing src/boats src/canalCruise src/airtime src/ramps src/sandpitJump src/terrainDrive src/bail src/suspension src/npcChassis passes
- npx tsc --noEmit -p games/gnome-theft-auto passes (errors in src/flora/* or src/outskirts/* belong to another worker:
  report, ignore)
- Report the skim distances and bounce counts your tests measured for both models.

## Out of scope
src/app.ts (the lead wires spray, sound and achievements), collideVehicles in vehicles.ts, src/flora/*, boats.ts,
swim.ts, waterlog.ts, packages/.
~~~~

~~~~text
Epic: 1 (E27 parts), issue 1C: reward prefabs, achievements and the physics achievement tracker
Depends on: none

## Environment
Repo root: the worktree you were started in. Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH".
Keep LF line endings. Other workers edit games/gnome-theft-auto/src/flora/*, src/skim.ts, src/vehicles.ts and
src/simdrive.ts at the same time: do not touch them. Do not commit.

## Goal
Two new Gnome Theft Auto achievements with wearable rewards, and a small pure tracker the game calls from its events.

## Read first
- packages/prefabs/src/catalog/gta-mowing.ts: a GTA reward prefab file (PrefabDef shape: parts, about, examine, tags,
  uses ['wear-head'] / ['wear-neck']).
- docs/roadmaps/prefab-library/_common.md: prefab rules (part shapes, colours, examine lines).
- packages/prefabs/src/catalog/index.ts: how a catalog file is imported and spread into the list (GTA_MOWING).
- packages/achievements/src/catalog.ts: the 'gta-short-back-and-sides' entry (AchievementDef shape with reward).
- packages/prefabs/src/catalog/armor.ts: 'wool-scarf' for a 'wear-neck' item's wear placement.

## Change
- packages/prefabs/src/catalog/gta-physics-rewards.ts (new): export const GTA_PHYSICS_REWARDS: PrefabDef[] with
  1. id 'skipping-stone-pendant', name 'Skipping-Stone Pendant', category 'armor', uses ['wear-neck']: a flat, smooth
     grey pebble (squashed ball) on a thin brown cord loop, a small blue water-drop bead beside it; about 0.12 across.
  2. id 'shrub-disguise', name 'Shrub Disguise', category 'armor', uses ['wear-head']: a round leafy bush (3-4 overlapping
     green balls of slightly different greens) worn on the head, one pink rose and a twig sticking out; about 0.35
     across. Tags include 'bush', 'shrub', 'disguise', 'gta'.
  Write the about text and 4-5 examine lines in the same voice as gta-mowing.ts (dry, gnome-sized jokes; no violence).
- packages/prefabs/src/catalog/index.ts: import { GTA_PHYSICS_REWARDS } from './gta-physics-rewards' and spread it
  next to ...GTA_MOWING.
- packages/achievements/src/catalog.ts: right after the 'gta-head-groundskeeper' entry add
    { id: 'gta-skipping-stone', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Skipping Stone',
      description: 'Skim a mower 35 m across deep water before it sinks.',
      reward: { slot: 'neck', prefabId: 'skipping-stone-pendant', label: 'Skipping-Stone Pendant' } },
    { id: 'gta-shrub-bowling', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Shrub Bowling',
      description: 'Flatten 6 big shrubs within 10 seconds.',
      reward: { slot: 'head', prefabId: 'shrub-disguise', label: 'Shrub Disguise' } },
- games/gnome-theft-auto/src/physicsAchievements.ts (new, pure, no imports besides types):
    export const PHYSICS_ACH = { skippingStone: 'gta-skipping-stone', skimMetres: 35, shrubBowling: 'gta-shrub-bowling', shrubs: 6, shrubWindowS: 10 } as const;
    export interface PhysicsAchievements {
      /** The player's vehicle finished a skim of `dist` horizontal metres. */
      skimEnded(dist: number): void;
      /** The player's vehicle flattened a plant of flora size class `size` at game time `t` (seconds). */
      plantFlattened(size: 'tiny' | 'small' | 'big', t: number): void;
    }
    export function createPhysicsAchievements(deps: { unlock(id: string): void }): PhysicsAchievements
  skimEnded unlocks skippingStone once when dist >= skimMetres. plantFlattened keeps the times of the last 'big' shrubs
  (ignore tiny/small) and unlocks shrubBowling once when `shrubs` of them fall within `shrubWindowS` seconds. Each
  unlock is called at most once per tracker.
- games/gnome-theft-auto/src/physicsAchievements.test.ts (new): skims of 20 m then 36 m unlock once; 6 big shrubs at
  t = 0..5 unlock; 6 spread over 20 s do not; small plants never count; a second qualifying run does not unlock again.

## Contract
Achievement ids 'gta-skipping-stone', 'gta-shrub-bowling'; prefab ids 'skipping-stone-pendant', 'shrub-disguise'; the
physicsAchievements.ts exports exactly as written above.

## Done when
- npm test -w packages/prefabs passes
- npm test -w packages/achievements passes
- cd games/gnome-theft-auto && npx vitest run src/physicsAchievements passes

## Out of scope
games/gnome-theft-auto/src/app.ts (the lead wires the tracker), every other game file.
~~~~

## Epic 2 (lead)

`app.ts`: after the player's driving step, read `v.skim?.event`: 'start'/'bounce' → `fx.waterJet` at the surface +
`play('splash')` + a small shake; 'end' → `physicsAch.skimEnded(v.skim.dist)`. `flora/runtime.ts`:
`FloraDeps.onPlayerMow?(kindId, size)` called where the player's mow is recorded; app passes
`physicsAch.plantFlattened(size, clock)`. Lore ruling R-178. `AGENT_INDEX.md` row.

## Status

Done. 1A and 1C on Haiku, 1B on Sonnet; foundation, traffic determinism and wiring by the lead.
- Skim measured at a 25 m/s entry (zero-turn, Loch Moss): arcade 28.7 m / 4 hops, sim 25.6 m / 3 hops, then it sinks;
  10 m/s never skims. Skipping Stone (35 m) needs a faster car or a boost off a ramp. SKIM numbers as in the stub.
- Measured heights: rose-bush 0.91 m, flowering-bush 0.48 m, allotment-bed 0.62 m (all under 1.8 m).
- Pull-out traffic test, warden clock fixed, 16-seed sweep: 13 seeds wait 9-15 s, 3 jam (7: 32 s, 12: 30 s, 14: 150 s).
  The test uses seed 1 (11 s). The rare blocker jam is real and left for a traffic epic.
- Checks: GTA build; `npm test -w games/gnome-theft-auto` three runs in a row, 3241 passed each, no traffic failure;
  achievements 22, prefabs 2753; `npm run lore` OK; smoke OK (`ui`, `canvas`) on port 5327.
- Not done: no real-device or in-browser drive of a skim (headless tests only); no skim sound of its own (uses `splash`);
  NPC arcade cars can skim too (harmless, they stay on roads).
