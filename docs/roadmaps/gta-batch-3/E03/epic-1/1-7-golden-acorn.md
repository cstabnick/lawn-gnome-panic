Epic: 1 Fixes (parallel) · Item: L80 "golden acorn near spawn near hospital is not accessible" · Model: sonnet
Depends on: none

## Environment
See `docs/roadmaps/gta-batch-3/E03/env.md` (read it first; its rules are part of this issue).

## Goal
Every golden acorn can be picked up on foot, and a test guards it (so later buildings never swallow one again).

## What is known (cause NOT confirmed)
`easterEggs.ts` `GOLDEN_ACORN_SPOTS` (~line 43), e.g. `acorn-city-1` at (-30, 16), `acorn-city-2` (18, 42); pickup
radius 2.5 (~line 564) checked against the player position. Hospital: `config.ts` `HOSPITAL` (marker
`landmark/hospital`); spawn `SPAWN`. The acorn may sit inside a building/prop collider (`world.boxes`), under a raised
deck or roof (pickup measured in 2D but the acorn drawn at roof height?), inside a reserved site
(`cityScenery/site.ts` ~188), or the pickup may also check `y` and the acorn floats too high.

## Change
1. New `easterEggs.reach.test.ts`: build the world the way other world tests do (`terrainWalk.test.ts`,
   `propsOffRoad.test.ts` show how to get `world.boxes` and walkable ground) and, for every `GOLDEN_ACORN_SPOTS` entry,
   assert: no box with a top above ground+0.5 covers any point within the pickup radius of the spot... at least one
   point within the pickup radius is outside every box (inflated by the gnome radius ~0.4) and walkable from a road
   (or at least on ground within 1 m of `heightAt`), and the acorn's drawn height is within reach of the gnome there.
   Run it, record which spot(s) fail and why (box id / what object is there) in your report.
2. Move each failing spot to the nearest reachable point that keeps its idea (near the hospital / spawn), and fix the
   pickup check if the cause is there.
3. Keep the test as the regression guard (name it so E01/E10 can extend it to other pickups).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/easterEggs.test.ts src/easterEggs.reach.test.ts` pass.
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for your files.

## Out of scope
`config.ts`, `world.ts`, buildings and any other module (move the acorn, not the building).
