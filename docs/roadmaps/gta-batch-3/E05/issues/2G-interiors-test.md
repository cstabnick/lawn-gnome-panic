Epic: E05-2 Interiors and rooftops: engine pieces
Depends on: none

## Environment
Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a89501009f27d94ba` (a git worktree; stay in it).
Game: `games/gnome-theft-auto`. Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
Keep LF line endings. Do not commit. Other workers are editing other files of this game at the same time; you add one
new test file only. If a test fails because the code under test is wrong, do NOT change the code: report it.

## Goal
`src/interiors/interiors.test.ts` pins the pure E05 contracts: pocket allocation, the clampToWorld exemption, flat dry
floors in interior space, and rooftop surfaces for walking and landing.

## Read first
- `games/gnome-theft-auto/src/interiors/registry.ts`: `defineInterior`, `pocketOrigin`, `interiorToWorld`, `interiorAt`, `resetInteriorsForTest`, `POCKET_MAX` (180), `LARGE_POCKET_MAX` (600), `POCKET_STEP` (200).
- `games/gnome-theft-auto/src/interiors/rooftops.ts`: `addRooftop`, `rooftopSurfaceBelow(x, z, maxY, includeSolid = true)`, `rooftopAt`, `landingPads`, `clearRooftops`.
- `games/gnome-theft-auto/src/collide.ts`: `clampToWorld(x, z, half, r)`.
- `games/gnome-theft-auto/src/terrain.ts`: `heightAt`, `waterAt`, `groundAt(x, z, y?)` (a non-solid rooftop counts only when `y` is given). See `src/terrain.test.ts` for how tests call terrain.
- `games/gnome-theft-auto/src/craft/aircraft.ts`: `floorUnder(x, z, y)` (includes every rooftop).

## Change
- `games/gnome-theft-auto/src/interiors/interiors.test.ts` (new, vitest; `beforeEach`: `resetInteriorsForTest(); clearRooftops();`):
  1. Pockets: define 20 normal interiors (size 12 x 10 x 3, theme 'shop', door/exit at 0,0, `build() {}`) and 2 large
     (size 300 x 300 x 8). Every origin has x >= 5000; all origins differ; any two normal origins are at least 200 apart
     on x or on z; large origins have z >= 12000 and are at least 700 apart; `interiorAt(origin.x + 3, origin.z - 2)`
     returns the right interior; `interiorToWorld(id, 1, 2)` = origin + (1, 2).
  2. A duplicate id throws; a 700 m room throws.
  3. `clampToWorld(5100, 5100, 1400, 0.5)` returns x 5100, z 5100, hit false; `clampToWorld(1500, 0, 1400, 0.5)` is clamped to x 1399.5 with hit true.
  4. `heightAt(5100, 5300)` is 0 and `waterAt(5100, 5300)` is null.
  5. Rooftops, 4 corners: add `{ id: 'slab', minX: 111, maxX: 129, minZ: -111, maxZ: -69, y: 9, solid: false, parapet: false, pad: { x: 120, z: -92, r: 7 } }`
     and `{ id: 'tower', minX: 0, maxX: 20, minZ: 0, maxZ: 20, y: 40, solid: true, parapet: true }`.
     At each corner of 'tower' moved 0.5 m inwards, `rooftopAt(x, z, 40)` is the tower and `floorUnder(x, z, 45).y` is 40 (an aircraft lands);
     1 m outside the rim `rooftopAt` is null and `rooftopSurfaceBelow` is null.
     `rooftopSurfaceBelow(10, 10, 45, false)` is null (solid roofs are not in groundAt); `groundAt(120, -90, 9.2)` is 9
     (stand on the slab); `groundAt(120, -90, 1)` is below 9 (a car in the tunnel stays on the road);
     `groundAt(120, -90)` (no y) is below 9. `landingPads()` has one entry, id 'slab', y 9.
  6. `addRooftop` with an existing id throws.

## Contract
None new; this issue only tests.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/interiors/interiors.test.ts` passes, or every failure is reported with the exact assertion and why the code (not the test) is wrong.

## Out of scope
Every source file; only the new test file.
