Epic: E31 wave 2 (building the places)
Depends on: wave 1 (prefabs exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first.

## Goal
The Unmown's footpaths read as a real preserve trail: waymarkers to follow, fingerposts at the forks, rules boards and
interpretive panels with satirical text, benches at the viewpoints, bird boxes and insect hotels — signage that tells
the preserve's story (AC (b) environmental storytelling).

## Read first
- `games/gnome-theft-auto/src/unmown/trails.ts` (your stub: keep `buildUnmownTrails(scene, boxes): void`)
- `games/gnome-theft-auto/src/living/config.ts` (STATION, UNMOWN_HIDES, BOARDWALK, LAST_DANDELION)
- `packages/prefabs/src/catalog/gta-preserve-trail.ts` (the prefab ids and sizes; `rules-board` face centre
  (0, 1.45, 0.05) size 1.4 x 0.9; read each `about`)
- `games/gnome-theft-auto/src/homes/pieces.ts` `textPlate` (lines ~100-150)

## Paths (world metres, footpaths 3 m wide)
- `trail/unmown-loop`: (-1560,-1172) (-1600,-1350) (-1500,-1500) (-1300,-1460) (-1150,-1470) (-900,-1560)
  (-750,-1460) (-550,-1440) (-330,-1560) (-300,-1460)
- `trail/reedmere-boardwalk`: (-1300,-1460) (-1200,-1520) (-1100,-1560) (-1000,-1520) (-900,-1560)
- `unmown-lane` (a road, 10 m): (-1400,-1020) (-1480,-1060) (-1540,-1120)

## Change
- `games/gnome-theft-auto/src/unmown/trails.ts`, with an exported pure planner `planTrailDressing(): TrailPiece[]`
  (`{ id: string; x: number; z: number; yaw: number; text?: string }`) and the builder that places it:
  - `trail-waymarker` every ~45 m along both trails, 2.5 m off the path centre on alternating sides, facing the path.
  - `trail-fingerpost` at every vertex where the two trails meet ((-1300,-1460), (-900,-1560)), at the trailhead
    (-1560,-1172) and 6 m from each hide's path side.
  - 6 `rules-board`s along the trails at bends, each with a different text plate (2-4 short lines, in this voice):
    e.g. "PLEASE KEEP TO THE PATH / The grass keeps to everything else."; "NO MOWING BEYOND THIS POINT / (or before it)";
    "DOGS ON LEADS / HOA INSPECTORS ON LONGER LEADS"; "QUIET PLEASE / Bitterns nesting / Rangers napping";
    "THIS MEADOW HAS NOT BEEN CUT SINCE / [date illegible, grass grew over it]"; "LOST? / Good. That is the idea." —
    write your own six.
  - 4 `interpretive-panel`s at viewpoints (meadow edge (-560,-1450), marsh edge (-1180,-1545), wood edge (-1580,-1420),
    the far end (-310,-1470)), facing the view.
  - 6 `log-bench`es near the panels and at (-750,-1460), facing the view.
  - 8 `bird-box` poles and 3 `insect-hotel`s near the wood edge and the meadow, 4-8 m off the path.
  - Everything sits on `heightAt`, never closer than 2 m to a path centre line or to the boardwalk legs, never inside
    another pushed collider (check `boxes` you received before placing), deterministic.
  - Static pieces in ONE `buildStaticCells` batch 'unmown-trails'; text plates added as separate meshes (they are few).
  - Colliders: small boxes for boards, panels and benches (not for waymarkers or bird-box poles).
- NEW `games/gnome-theft-auto/src/unmown/trails.test.ts`: the plan has >= 25 waymarkers, 6 boards each with text,
  4 panels; no piece within 2 m of a trail centre line; every piece is in region 'the-unmown' (`regionAt`).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/unmown/trails.test.ts` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
Other `unmown/*` files, `living/*`, prefabs, level documents.
