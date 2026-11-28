Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: general-purpose (Sonnet)

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own the new files
`games/gnome-theft-auto/src/court/build.ts` and `court/build.test.ts`. Another worker builds the court's people and
storytelling (`court/life.ts`) at the same time: you build the court itself.

## Goal
Drainpipe Court exists in the world: an asphalt court with chalk lines exactly where GBA GJAM's simulation plays
(scaled by `COURT_SCALE`), two drainpipe hoops whose rims sit exactly on the simulation's hoops, the chalk
scoreboard, the ball cage, Old Burdock's bench, the court rules sign, a pointer to the laundrette, low railings along
the run-off, and lights. Colliders for the solid things.

## Read first
- `games/gnome-theft-auto/src/court/types.ts`: `COURT_ORIGIN`, `COURT_SCALE`, `COURT_SITE`, `COURT` (halfX 9.2,
  halfZ 4.96, hoopY 2.44, threeRadius 4.32, hoops), `SCOREBOARD`, `BALL_CAGE`, `OLD_BENCH`.
- `games/gba-gjam/src/arena.ts` (the court markings GJAM draws: boundary, centre line and circle, keys/lanes,
  free-throw circles, three-point arcs and corner lines; copy their proportions in sim units, then scale by
  COURT_SCALE).
- `packages/prefabs/src/catalog/gta-drainpipe-court.ts`: `drainpipe-hoop` (rim centre at local (0, 3.05, 0.4), front
  +z; scaled 0.8 the rim is at (0, 2.44, 0.32)), `chalk-scoreboard`, `ball-cage`, `old-court-bench`,
  `court-rules-sign`, `laundrette-sign`.
- `games/gnome-theft-auto/src/golf/yard.ts`: a module that builds a place from prefabs and flat meshes and returns
  colliders (`buildPrefab`, `prefabBox` from `../homes/pieces` or its own helper, `flatLayer`).
- `games/gnome-theft-auto/src/parks/layoutC.ts` and `parks/kit.ts`: what already stands round the site (benches at
  z 15 and 45, lamps, trees, a `civic-railing` perimeter); the lamp and railing prefab ids it uses.
- `packages/depth/src/layers.ts`: `LAYER` (area 2, marking 5) and `flatLayer`.

## Change
`src/court/build.ts`:
```ts
export interface CourtBuild { boxes: Box[]; groundY: number; group: THREE.Group }
export function buildDrainpipeCourt(scene: THREE.Scene): CourtBuild;
```
- groundY = `heightAt(COURT_ORIGIN.x, COURT_ORIGIN.z)` (the site is flat).
- Surface: a dark asphalt slab covering the court plus 2 m run-off (x COURT.x +- (halfX + 2), z COURT.z +- (halfZ +
  2)), a few slightly different patches (repairs) on it; `flatLayer(mat, LAYER.area)` at +0.02. Lines: chalk white
  (slightly off-white, a little uneven: build each line as thin quads, width 0.06), `LAYER.marking` at +0.03: the
  boundary, centre line and circle, both keys and free-throw circles, both three-point arcs (radius
  `COURT.threeRadius` round each hoop, joined to straight corner lines where the arc meets the sideline offset GJAM
  uses). One merged geometry per material.
- Hoops: `drainpipe-hoop` at scale 0.8 for each of `COURT.hoops`: the left (west) hoop faces +x (rotation.y = PI/2),
  base at (hoop.x - 0.32, groundY, hoop.z); the right faces -x (rotation.y = -PI/2), base at (hoop.x + 0.32,
  groundY, hoop.z). So the rims are exactly at (hoop.x, groundY + 2.44, hoop.z). A round collider for each pole.
- `chalk-scoreboard` at SCOREBOARD (its yaw), `ball-cage` at BALL_CAGE, `old-court-bench` at OLD_BENCH, the
  `court-rules-sign` by the court's south-west corner facing the court, `laundrette-sign` on a post at the court's
  west edge facing east (towards the court), two lamps (the park's lamp prefab) at the court's north-west and
  south-east corners outside the run-off, and the park railing along the north and south edges of the site
  (`COURT_SITE` minZ/maxZ + 0.3 inside), leaving the east side open (it faces Gnorwin). Colliders for every solid
  prop (bench, cage, scoreboard, signs, lamps, railing runs) as boxes that do not share faces.
- Return the boxes (the runtime pushes them into `world.boxes`).

`src/court/build.test.ts`: building into a `THREE.Scene` returns boxes all inside `COURT_SITE`; none of them covers
the painted court rectangle except the two hoop poles; the two hoop prefab objects' rim positions (compute from the
object's position, rotation and the 0.32/2.44 offsets) are within 0.01 of `COURT.hoops` at hoopY.

## Contract
`buildDrainpipeCourt(scene): CourtBuild`, exactly.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/court/build.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.
- If you have time: start a dev server on port 5321 and take `node tools/gta-shots.mjs "http://localhost:5321/?offline&no-intro" <scratch dir> court:-90,46,3.14 hoop:-84,30,-1.57`, look at the PNGs; this only works once the runtime installs the build (it may not yet: then skip).

## Out of scope
court/life.ts, court/runtime.ts, parks/ (do not edit), every other file.
