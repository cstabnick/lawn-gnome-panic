Epic: E32-B (nine holes, parallel build)
Depends on: none · Worker: sonnet (general-purpose)

First read `docs/roadmaps/gta-batch-3/E32/issues/_env.md` (environment + the foundation facts).

## Goal
The golf course physics knows the new holes: the ball bounces off hedge walls (the hole 5 maze must stop it), off the
potting shed's walls, and starts hole 7 from the shed roof 2.6 m up; the drawn course ground (greens.ts) draws all nine
holes, hole 7's tee mat on the roof.

## Read first
- `games/gnome-theft-auto/src/golf/course.ts` (85 lines): `courseGroundY`, `golfHeight`, `ENV` (`CourseEnv`).
- `packages/golf/src/physics.ts` lines 1-30 and 150-320: `CourseEnv.collide?(p, v, r): 'trunk' | 'leaves' | 'cart' | null`
  is called every air and roll step with the ball position `p` and velocity `v` in the **golf frame** (yards; y up,
  golf height = GOLF_LIFT + (world y - yard floor) / YD). It may push `p` and change `v`; return 'trunk' for a hard
  bounce (an event is logged), null for nothing. Read how 'trunk' is handled so your push-out is consistent.
- `games/gnome-theft-auto/src/golf/types.ts`: `HEDGES`, `HEDGE_H`, `HEDGE_T`, `HEDGE_ARCHES`, `ARCH_GAP`, `MAZE_HEDGES`,
  `MAZE_H`, `POTTING_SHED`, `HOLES` (`teeY`), `toGolf`, `toWorld`, `YD`, `GOLF_LIFT`, `greenRise`.
- `games/gnome-theft-auto/src/golf/greens.ts` (312 lines): how tees, greens, fairways, bunkers, ponds and flags are drawn
  per hole; `greens.test.ts`.
- `games/gnome-theft-auto/src/golf/course.test.ts`

## Change
- `src/golf/course.ts`:
  - `export function teeRise(x, z): number`: `POTTING_SHED.roofY` when (x, z) is inside the shed's rectangle
    (`|x - POTTING_SHED.x| <= w/2`, `|z - POTTING_SHED.z| <= d/2`), else 0. `courseGroundY` = `heightAt + greenRise + teeRise`.
    (Hole 7's tee is at the shed centre, so its ball starts on the roof: `golfStart` and the resting ball already read
    `courseGroundY`.)
  - `collide(p, v, r)` on `ENV`: walls are vertical slabs. Hedge walls: every segment in `HEDGES` (height `HEDGE_H`,
    half thickness 0.6 m: the hedges are drawn 1.2 m deep) and `MAZE_HEDGES` (height `MAZE_H`, half thickness 0.6 m), **except** the openings in
    `HEDGES` where a `HEDGE_ARCHES` arch stands (an opening `ARCH_GAP` m wide centred on the arch, measured along the
    segment; ignore the arch's own legs). The shed: its rectangle from the ground up to `roofY`. Convert `p` to world
    with `toWorld(p.x, p.z)`, height over the yard floor in metres = `(p.y - GOLF_LIFT) * YD`. When the ball is inside a
    slab (distance to the segment < half thickness + r*YD, and height below the wall top), push it out along the
    segment normal to the side it came from (use `-v` to pick the side), reflect the normal velocity component with
    restitution 0.35 and damp the tangential by 0.7, and return 'trunk'. Precompute segments once (module scope).
    Keep it cheap: early-out with a bounding box of all walls.
  - Keep every existing export and signature.
- `src/golf/course.test.ts`: add tests:
  - `courseGroundY(POTTING_SHED.x, POTTING_SHED.z) - heightAt(same)` ≈ 2.6; `golfStart(hole 7 tee)` is 2.6 / YD yards
    higher than `golfStart` 10 m east of the shed.
  - A low punch along hole 5 from its tee straight at the first maze wall: `simulateShot(golfEnv(), golfStart(tee), {
    club: '5I', power: 0.6, accuracy: 0, yaw: <toward (-1318, 870)> }, 'tee', {yaw:0,mph:0}, pin)`: the ball's end point
    is north of z 866 (it did not pass through the wall) — pick a club/power whose flight is low enough that it really
    hits the wall (check the apex at the wall in the test by sampling `points`); also assert a high `SW` (or `LW` if it
    exists in `CLUBS`) wedge from the same spot can fly over it (end z > 866) — or, if no club clears it from there, say
    so in the report and assert only the first.
  - The E15 test "a perfect calm driver off the first tee carries the club carry" still passes (hole 1 has no hedge in
    the way).
- `src/golf/greens.ts`: it must draw all 9 holes (it loops `HOLES`; check nothing assumes 4). For a hole with `teeY`,
  draw its tee mat at `heightAt + teeY + small lift` (on the roof) instead of on the ground, with the same draw layer. Do
  not draw a fairway ribbon under the shed (fairway starts at `fairwayStart` 20 m from the tee, so check it already
  does not). Ponds: the Drip (hole 6) is drawn like Hosepipe Pond.
- `src/golf/greens.test.ts`: update the failing "has four greens" test to nine greens.

## Contract
`courseGroundY(x, z)`, `golfEnv()`, `golfStart`, `lieAtWorld` keep their signatures. New export `teeRise(x, z): number`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/course.test.ts src/golf/greens.test.ts src/golf/round.test.ts` passes.
- `cd games/gnome-theft-auto && npx vitest run src/golf/` — report any failure outside your files without fixing it.
- `npm test -w packages/golf` and `npm test -w games/gnome-golf` still pass (you must not edit packages/golf).
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for your files.

## Out of scope
packages/golf (no changes), yard.ts (the hedges' meshes/colliders for gnomes: another issue), bottomGarden.ts (the shed
building: another issue), runtime.ts, types.ts.
