Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
`src/campus/buildings.ts` stands Rootwell University's thirteen buildings in the world from `CAMPUS_BUILDINGS`, with
exact colliders, a name plate beside every front door, the Clod as a pitch between two grandstands, and the Dean's
home registered at his lodge.

## Background (confirmed)
- `src/campus/types.ts` `CAMPUS_BUILDINGS`: 13 rows `{ id, name, role, prefab, x, z, yaw, w, d, h, door: { x, z, yaw },
  interior?, roof?, tour }`. `yaw` (a multiple of PI/2) is the way the front door faces; `w` is the width across the
  front, `d` the depth, `h` the eaves height, all in game metres. So the world footprint is `w` along x and `d` along z
  when yaw is 0 or PI, and swapped (d along x, w along z) when yaw is +-PI/2.
- The building prefabs (other workers are adding them now: `rootwell-library`, `rootwell-plumbob-hall`, ...,
  `rootwell-grandstand`) are authored at **half size**: place every one with `scale: 2`. Some have porches or steps
  that stick out past the footprint, so do **not** use their bounds as colliders: use `solid: false` on the pieces and
  push your own colliders computed from the footprint.
- `src/homes/pieces.ts`: `buildPieces(scene, pieces, name)`, `HomePiece`, `textPlate(text, x, y, z, yaw, { w, h, bg, fg })`.
- `src/homes/data.ts`: `homeOf('lovage')` (a row with `door: null`), `registerHome(def)`; a home door is `[x, z, yaw]`
  (yaw = the way a gnome faces walking out). `src/winter/hill.ts` does the same for Gentian (search `registerHome`).
- `src/terrain.ts` `heightAt(x, z)`. The campus site is flat ground.

## Read first
- `games/gnome-theft-auto/src/campus/types.ts` (`CAMPUS_BUILDINGS`, `CAMPUS`).
- `games/gnome-theft-auto/src/campus/buildings.ts` (the stub: keep the signature).
- `games/gnome-theft-auto/src/homes/pieces.ts`, `src/homes/data.ts` (`registerHome`, `homeOf`, `HomeDef`).
- `games/gnome-theft-auto/src/winter/hill.ts` and `src/winter/hill.test.ts` (a finished scenery builder and its test).

## Change
`src/campus/buildings.ts`, `buildCampusBuildings(scene, boxes)`:
- A pure, exported helper `buildingFootprint(b: CampusBuilding): { minX, maxX, minZ, maxZ }` (the world rectangle from
  x, z, w, d and yaw as above).
- For every building except `the-clod`: a `HomePiece` `{ prefab: b.prefab, x: b.x, z: b.z, yaw: b.yaw, scale: 2,
  solid: false }`, and a collider `{ ...buildingFootprint(b), h: heightAt(b.x, b.z) + b.h }` pushed into `boxes`.
- The Clod (`the-clod`, centre (1040, -95), w 60 x d 40): two `rootwell-grandstand` pieces (scale 2, solid false), the
  north stand centred (1040, -111) yaw 0 and the south stand centred (1040, -79) yaw PI (both face the pitch); colliders
  x 1015..1065 by z -115..-107 and z -83..-75, h ground + 8. Between them the pitch: a green rectangle x 1013..1067,
  z -104..-86 (a `PlaneGeometry` laid flat, `MeshLambertMaterial` 0x4f9a3c, `flatLayer(mat, LAYER.area)`, 0.03 above
  `heightAt`) with white lines on it (touchlines, halfway line, centre circle as a thin ring: `RingGeometry`; one
  material with `flatLayer(mat, LAYER.marking)`, 0.05 above the ground), and four `slalom-flag` corner flags
  (solid false).
- Name plates: for every building, `textPlate(b.name.toUpperCase() + '\n' + b.role.toUpperCase(), ...)` (w 2.4, h 0.8, bg
  0x2b2a33, fg 0xefe3c8) on the front face 2.8 m to the right of the door (as seen from outside), centre y ground + 2.2,
  0.06 in front of the face. The front face is `b.d / 2` from the centre along the facing vector (sin yaw, cos yaw), and
  the plate's own yaw is `b.yaw` (it faces out). For the Clod put one plate "THE CLOD" on a `signpost` piece at
  (1040, -119) yaw PI.
- The Dean's home: `registerHome({ ...homeOf('lovage')!, door: [door.x, door.z, door.yaw] })` with the `deans-lodge` row's
  door.
- Add the plates and the pitch to one `THREE.Group` named 'rootwell-buildings' added to the scene; the prefabs go through
  one `buildPieces(scene, pieces, 'rootwell-buildings')` call (its returned boxes are empty because every piece is
  `solid: false`; push yours).
- New `src/campus/buildings.test.ts` (vitest, `installFakeDom` from `../testing/fakeDom` like `winter/hill.test.ts`):
  `buildCampusBuildings(new THREE.Scene(), boxes)` gives 14 colliders; every collider lies inside `CAMPUS.site`; none
  overlaps `CAMPUS.quad`, another collider, or the drive (x 946..1080, z -204..-196); no collider contains any
  building's `door` point (with 0.6 m margin); `buildingFootprint` of `trencher` (yaw -PI/2, w 30, d 24) is x 1233..1257,
  z -230..-200; `homeOf('lovage')!.door` is set after the build.

## Contract
`buildCampusBuildings(scene, boxes): void` (stub signature) and the new export `buildingFootprint(b)`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/campus/buildings.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/campus/buildings*.ts`.

## Out of scope
Every other file (grounds, story, interiors and the rest of `src/campus/` are other workers').
