Epic: 2 · Item (added by the coordinator): "traffic algorithm seems busted on skyway vs the lower level" · Model: sonnet
Depends on: none

## Environment
See `docs/roadmaps/gta-batch-3/E03/env.md` (read it first; its rules are part of this issue).

## Goal
NPC traffic on the Turfton Skyway decks stays on the decks and street traffic stays on the street: no deck car drops to
the ground (or drives at ground height under the deck), no street car climbs or snaps onto a deck, cars on two levels do
not brake for or collide with each other, and cars that use the ramps change level smoothly.

## What is known (cause NOT confirmed - find it first, with a failing test)
- Decks and ramps: `highways/` (`roads.ts` `roadY(a, b, x, z)` uses `groundAt(x, z, ref + 1)` on deck links,
  `nearestRoadNode(nodes, x, z, y?)`), `terrain.ts` `groundAt(x, z, y)` (deck under y + SKYWAY.step, else land),
  `heightAt` (land only), `terrainProbe()` (wheel raycast, deck-aware).
- Traffic: `traffic.ts` (ghosts and live cars; `materialize` sets `v.y` from `roadY`; `LEVEL_GAP = 2.5` makes cars
  ignore others on another level; `spawnConvoy` ~line 903 places cars with `createVehicle` and never sets `v.y`;
  `createVehicle` in `vehicles.ts` ~315 starts every vehicle at `heightAt` = land), `trafficSim.ts`, `route.ts`.
- E02 just moved NPC cars near the player onto a sim chassis: `npcChassis.ts` `assignNpcChassis` / `createNpcChassis`
  -> `simdrive.ts` `createChassis(v, ...)` places the body at `groundAt(v.x, v.z, v.y)` and `stepChassis` writes
  `v.y = groundAt(v.x, v.z, sd.py)`. If `v.y` is the land height when a chassis is created for a car on a deck node, the
  chassis is placed on the land under the deck; also check what happens when a chassis is dropped (`dropNpcChassis`,
  arcade `stepVehicle` in `vehicles.ts` ~342-518 uses `groundAt(v.x, v.z, v.y)`), at deck edges/ramps (the `+ SKYWAY.step`
  snap could pull a street car up onto a low ramp end, or a ramp car down), and how lane-following picks the next node
  (a deck car choosing a ground node under it or vice versa: `nearestRoadNode` without `y`).
- Existing tests to extend: `traffic.levels.test.ts`, `route.levels.test.ts`, `police.levels.test.ts`, `traffic.test.ts`
  (its "keep moving" case is timing-flaky under load: rerun it alone).

## Change
1. A failing test first (extend `traffic.levels.test.ts`): run the real traffic system headless over the Skyway for a
   simulated minute or two with the focus (player) on a deck and then under it, with chassis assignment on (as app.ts
   does it: `traffic.update` calls `assignNpcChassis`), and assert for every live car each step: if its driver's current
   link is a deck link, `|v.y - roadY(...)| < 0.5`; if a ground link, `v.y` within 0.5 of `heightAt`. Record what broke
   and where in your report.
2. Fix at the source (traffic.ts / npcChassis.ts / highways). `collide.ts` is E02's: do not edit it; `simdrive.ts`
   only if the cause is there (keep the player's car behaviour identical).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/traffic.levels.test.ts src/route.levels.test.ts src/police.levels.test.ts src/npcChassis.test.ts src/trafficSim.test.ts src/traffic.test.ts` pass.
- `npx tsc --noEmit -p games/gnome-theft-auto` clean. Report the root cause, the fix, before/after.

## Out of scope
`collide.ts`, `app.ts`, quests, everything not about traffic levels.
