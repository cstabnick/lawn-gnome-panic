Epic: 1 Foundation (prefabs, physics, lore, water)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E11/_env.md` first. Other workers edit other game files at the same time (not the
files below). The ocean water itself is already built: a still-water body `water/saltwater` (superellipse centred at
(0, 1490), half extents 1790 x 300) and a river-like channel `saltcut` (from the Puddle Sea at (700, 882) south to the
Saltwater at (745, 1205), 14 m wide, a road bridge at (727.5, 1000)), both in `WATER.order` after `water/puddle-sea`.

## Goal
Tests pin the Saltwater and the Saltcut, NPC boats sail on the sea and through the Saltcut, and the boat-driver job has
stops on the Saltwater.

## Read first
- `games/gnome-theft-auto/src/water.test.ts`: test style; `waterAt`, `bedAt`, `heightAt` from `./terrain`;
  `bodyLevel`, `courseProfile`, `waterDepthAt`, `onWaterCourse` from `./water`.
- `games/gnome-theft-auto/src/boatTraffic.ts`: `createBoatTraffic` `allRoutes` (`npcRoute(kind, route, throttle,
  waterway?)`), `waterwayRoute(courses, { from, to, every })`, `pingPong`, `loopRoute`.
- `games/gnome-theft-auto/src/boatTraffic.test.ts`: how routes are tested.
- `games/gnome-theft-auto/src/jobs/places.ts` and `places.test.ts`: `WATER_STOPS`, `PlaceArea`, the depth rule.
- `games/gnome-theft-auto/src/coast/config.ts`: `COAST` (pier, launch, ship), `OCEAN_ID`, `SALTCUT_ID`.

## Change
1. `src/water.test.ts`: add `describe('the Saltwater and the Saltcut (E11)')` with:
   - `bodyLevel('water/saltwater')` is below `bodyLevel('water/puddle-sea')` and below every ground height sampled on the
     boardwalk (x -200..200 step 50, z 1100..1130 step 10: `heightAt(x, z) > level + 3`).
   - Depth (`waterDepthAt`) at (0, 1400) and (-1000, 1450) and (1000, 1450) is at least 5 m; at (0, 1250) and (300, 1280)
     at least 1.5 m; at (0, 1150) it is 0 (the beach is dry).
   - The Saltcut connects: `courseProfile('saltcut')` exists; its first surface equals the Puddle Sea level within 1e-6 and
     its last surface is >= the Saltwater level; every sample `k` of its profile has `waterDepthAt(x[k], z[k]) >= 1.2`
     except the first and last 3 samples.
2. `src/boatTraffic.ts`: in `createBoatTraffic`, add to `allRoutes` (keep the existing ones first, in order):
   - `npcRoute('clog-cruiser', pingPong(waterwayRoute(['saltcut'], { from: { x: 690, z: 860 }, to: { x: 300, z: 1300 } })), 0.6, true)`:
     a cruiser between the Puddle Sea and the pier through the Saltcut.
   - `npcRoute('gravy-boat', SEA_LOOP, 0.7)` where `const SEA_LOOP = [{ x: -600, z: 1450 }, { x: -200, z: 1380 },
     { x: 400, z: 1420 }, { x: 900, z: 1480 }, { x: 400, z: 1560 }, { x: -300, z: 1560 }]` (export it as
     `export const SEA_LOOP`): a sightseeing boat offshore of the boardwalk, clear of the slalom (z ~1300) and the ship.
3. `src/boatTraffic.test.ts`: add a test that every `SEA_LOOP` point has `waterDepthAt >= 3`, and that the Saltcut route
   (`waterwayRoute(['saltcut'])`) is non-empty and every point of it is on water (`waterDepthAt > 0.5`).
4. `src/jobs/places.ts`: append to `WATER_STOPS` (area `'sea'`, no type change):
   `{ id: 'long-spoon-pier', name: 'Long Spoon Pier', x: 318, z: 1245, area: 'sea' }`,
   `{ id: 'the-last-tube', name: 'The Last Tube', x: 150, z: 1232, area: 'sea' }`,
   `{ id: 'saltcut-mouth', name: 'The Saltcut', x: 745, z: 1215, area: 'sea' }` — then run `places.test.ts`; if one fails
   the depth rule, move it 10-20 m further south (z +) until it passes and keep the name.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/water.test.ts src/boatTraffic.test.ts src/jobs/places.test.ts src/boatCrossing.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for these files.

## Out of scope
`src/water.ts`, `src/config.ts`, `src/coast/`, `src/tubing/`, every other file.
