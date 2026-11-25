# E27 Physics follow-ups: bushes, water skipping, test stability
Wave: 3 · Depends on: E02 · Kind: Fix
Source items:
- L113 "idk if covered already but make little bushes able to be ran over"
- L114 "allow player to drive over water on jumps"
- (from E02's notes) `traffic.test.ts` "keep moving" and two other traffic cases fail intermittently under full-suite load.

## Goal

Small plants never stop a car; a fast car that reaches water skims across it with bounces and spray before it sinks;
the traffic tests give the same answer on every run. Keep the charm (L104): grow the existing flora and water systems,
do not rewrite them.

## Scope

In:
- **L113 audit + coverage.** Mowable plants (`src/flora/`, plan `docs/roadmaps/gta-mowable-plants.md`) already make
  small bushes, beds, ferns and grass non-solid: a vehicle cuts them to stubble with a clippings burst, a snip and a
  small slow (`kind.slow`). The audit (a headless world build that matched every remaining small collider to its
  placement, results in `E27/roadmap.md`) found the gaps: `rose-bush` (57 in the parks) and `allotment-bed` (40) are not
  in `PLANT_KINDS`, so they stay solid colliders; Pebblewick's `flowering-bush` is drawn static (no collider, but never
  flattened). Fix: add the three kinds, hand Pebblewick's placements to flora (`addMowablePlants`). Everything else small
  and solid is not a plant (fences, bins, benches, rocks, tree trunks) or is a big hedge/topiary that stays solid.
- **Little-bush threshold (documented):** a plant kind in `PLANT_KINDS` with `mowable: true` and a placed height
  <= `FLORA.maxMowHeight` (1.8 m). Hedgerows, hedge arches, topiary cones (2.0-2.2 m), tall cacti and every tree stay
  solid.
- **L114 skimming.** New pure module `src/skim.ts`. A ground vehicle (not a boat, not a flyer) that reaches water at
  least `SKIM.minDepth` deep at a horizontal speed >= `SKIM.enterSpeed`, with its underside at or above the surface,
  rides on the surface: no engine thrust, speed bleeds by drag, it bounces (hops) every so often with spray, and once
  below `SKIM.keepSpeed` it drops in and the existing rules take over (deep water sinks it via `swim.ts checkSink`,
  shallow water waterlogs it via `waterlog.ts`). Both drive models: arcade (`vehicles.ts stepOther`) and the sim
  chassis (`simdrive.ts stepChassis`, used by the player and NPC chassis). Fords (shallower than `SKIM.minDepth`) behave
  exactly as today. Boats and aircraft untouched.
- **Test stability.** Root causes found (see roadmap): `collideVehicles` debounces crash damage with
  `performance.now()` (wall clock, so a slow machine applies more damage per simulated minute and the "keep moving"
  `meanHp > 0.93` and the jam checks move), the warden clock starts from `Date.now()` and is shared module state
  advanced by every test, traffic draws from unseeded `Math.random`, and the four-preset corner test has the default
  30 s timeout. Fix: a game-time bump clock in `vehicles.ts`, seeded randomness and a fixed warden clock in the tests,
  explicit timeouts. Nothing the tests check is loosened.
- **Achievements:** `gta-skipping-stone` (skim 40 m in one go; neck: Skipping-Stone Pendant) and
  `gta-shrub-bowling` (flatten 6 big shrubs within 10 s; head: Shrub Disguise). New prefabs in
  `packages/prefabs/src/catalog/gta-physics-rewards.ts`.

Out: new plant prefabs (E29 adds European plants: E29 or the merge adds their `PLANT_KINDS` rows), boats, swimming,
online messages (skim is local physics; remote players see the broadcast pose), a skim sound of its own (uses the
existing `splash`).

## Code pointers (confirmed)

- `src/flora/kinds.ts` `PLANT_KINDS`, `FLORA.maxMowHeight`; `src/flora/harvest.ts` `addMowablePlants`, `seedOf`;
  `src/flora/runtime.ts` `createFlora` (`FloraDeps`, `mowWith`); `src/cityScenery/site.ts` `place` skips colliders for
  `mowableAt` plants; `src/outskirts/build.ts` `buildTown` (Pebblewick static cells); `src/flora/world.test.ts`.
- `src/terrain.ts` `waterAt(x, z) -> { surface, depth } | null`, `groundAt`, `aboveGround`; `src/swim.ts checkSink`
  (sinks only when `v.y < surface - 0.2`); `src/waterlog.ts stepWaterlog` (soaks only when `v.y < surface`);
  `src/config.ts WATER.stallDepth` 0.9, `wadeDepth` 0.7.
- `src/vehicles.ts stepOther` (arcade vertical step, `ARCADE_AIR.gravity` 30), `moveVehicle`, `collideVehicles`
  (`performance.now()` debounce). `src/simdrive.ts` `GUARDED_PROBE`, `stepChassis`, `writePose`, `SIM_AIR`.
- `src/app.ts` player driving step (~line 1775), `fx.waterJet`, `play('splash')`, `achievements.unlock`.
- `src/traffic.test.ts`, `src/trafficDirectors.ts` (`setDirectorClock`, `BASE = Date.now()/1000`).

## Contracts this epic provides

- `Vehicle.skim?: SkimState` (types.ts) and `src/skim.ts` (`SKIM`, `SkimState`, `SkimEvent`, `skimFloor`,
  `beginSkimFrame`/`stepSkim`): E14 (dirt/rally jumps into water) and E26 (races) can read `v.skim?.active`.
- `FloraDeps.onPlayerMow?(kindId, size)` for any later "flatten N" counter.
- `collideVehicles(list, dt)` debounces on game time (dt), not wall time.

## Contracts consumed

- E02: `SIM_AIR`, `ARCADE_AIR`, `RAMP_LAUNCH` (jumps that land in water), NPC chassis (`npcChassis.ts`).

## Online / mobile / achievements / prefabs / lore

- Online: no new messages. Skimming is local physics; peers see the pose. Flora mows from remote vehicles already.
- Mobile: no new controls (driving only).
- Achievements + prefabs as above. Lore: ruling R-178 "mowers skim" (fast mowers skip over deep water like a flat
  stone, then sink as R-050/R-140 say); renumber at merge if another epic took 178.

## Risks and decisions

- Skimming in the sim chassis: the tyres' ground raycasts see a water plane while skimming (a module flag in
  `GUARDED_PROBE`, the same pattern as `placeCap`), throttle is cut while skimming so it cannot skim forever.
- `boatCrossing.test.ts`, `swim.test.ts`, `waterlog.test.ts`, `sinkSim.test.ts`, `canalCruise.test.ts` must pass
  unchanged.
- Bump damage on game time changes damage frequency in-game by at most frame-rate jitter (400 ms of game time instead
  of wall time): same feel.

## Done when

- `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto` three times in a row with no traffic
  failure, `npm test -w packages/achievements`, `npm test -w packages/prefabs`, `npm run lore`, smoke check.
