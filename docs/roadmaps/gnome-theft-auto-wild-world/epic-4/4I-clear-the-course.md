Epic: 4 (Wild World: water, bridges and boats)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: if `node`/`npm` is not found, in Git Bash run `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
  installed: never run `npm install`. Never commit, push, stash, reset, or `git checkout`/`git restore` any file.
- About ten other workers and two other planning sessions edit other files of this game at the same time, and another
  session may edit other parts of `biomes.ts` (the Loch Moss and Tallgrass Commons generators). Make only small,
  targeted Edit-tool edits in the places named below; never rewrite the file. If `tsc` or a test fails in a file you
  do not own, someone is mid-edit: ignore it.
- `layout.golden.test.ts` is expected to fail in this epic (the planner regenerates the fixture later). Never
  regenerate or edit `src/data/layout.golden.json`.

## Goal
The river is now carved into the ground (a channel about 1 m below the banks, 1.6-2 m deep), but the old scatter in
`games/gnome-theft-auto/src/biomes.ts` still puts trees, rocks and their colliders in the river bed, and the Southern
Drainage Canal setpiece still draws its old flat concrete beds and water strips at ground level, plus two parapet
colliders that would stop boats under the canal bridge. Clear the course and fix the canal setpiece.

## Read first
- `games/gnome-theft-auto/src/water.ts`: `onWaterCourse(x, z, margin)`: true on a river, the canal, the loch or the sea
  (within width / 2 + margin of a course centre line). Static: needs no heights, safe to call anywhere in biomes.ts.
- `games/gnome-theft-auto/src/terrain.ts`: `waterAt(x, z)` (`{ surface, depth } | null`), `heightAt`.
- `games/gnome-theft-auto/src/biomes.ts`, only these parts: the helpers `addBox` (~line 164), `drop` (~223), `tree`
  (~280), `walk` (~291), `addSafeBox`, `addWorld` and `addMerged` (~249-290: see whether they lift geometry onto the
  ground with `addGroundToGeometry`); the setpiece builders `'drainage-canal'` and `'driftwood-raft'` (~805-870).

## Change (all in `games/gnome-theft-auto/src/biomes.ts`)
1. **Keep the random stream identical.** The scatter draws all its random numbers from one seeded stream, and every
   later placement depends on how many numbers came before. So never skip a random draw: only skip the *push*.
   - `tree(batch, id, scale, p)`: draw the yaw first (`const yaw = uni(0, TWO_PI);`), then
     `if (onWaterCourse(p.x, p.z, t + 3)) return;` (t = its trunk radius, already computed), then push with that yaw
     and add the box as before.
   - `drop(batch, m, p, solid)`: at the top, `if (onWaterCourse(p.x, p.z, Math.max(m.hw, m.hd) + 3)) return;`.
   - `walk(x, z)`: also skip when `onWaterCourse(x, z, 2)`.
   Do not touch `free`, `findSpot`, `scatter`'s random calls, or the hand-placed `props` loop (~line 471).
2. **`'drainage-canal'` setpiece**: remove the two 3 cm concrete channel beds (`boxGeo(174, 0.03, 10, ...)`), the two
   water planes (`waterGeos` and its `addWorld` call) and the two road-bridge parapets (`boxGeo(1.0, 1.0, 11.4, ...)`
   and both `addSafeBox` calls at `cx +- 12.5`): the carved canal, its water surface (waterMesh.ts) and a road bridge
   prefab (waterworks.ts) replace them. Keep the four retaining curbs (`boxGeo(174, 0.9, 1.0, ...)`) as the canal's
   concrete lips. Update the comment above it.
3. **`'driftwood-raft'` setpiece**: the raft floats. Lower everything it builds (its meshes and its `addSafeBox`) so the
   raft's base (y 0.22 - 0.175 today) sits 0.05 below the water surface `waterAt(m.x, m.z)?.surface` (keep today's
   heights when that is null). If `addWorld` already lifts geometry onto `heightAt` (the carved canal bed), subtract
   that too, so the raft ends up at the surface, not on the bed. Note in a comment that the raft floats on the canal.
4. Add the import `import { onWaterCourse } from './water';` (and `waterAt` to the existing `./terrain` import if it
   is not there yet).

## Contract
No exported signature changes. `buildBiomes` returns the same shape.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `biomes.ts`.
- `(cd games/gnome-theft-auto && npx vitest run src/terrainBiomes.test.ts src/water.test.ts)` passes.
- A quick check script or test run shows no tree or box centre from `buildBiomes` within `width / 2 + 1` of a course
  (e.g. add an `it` to a new `src/clearCourse.test.ts`: install the fake DOM (`installFakeDom()` from
  `./testing/fakeDom`, as `layout.golden.test.ts` does), call `buildBiomes(new THREE.Scene())`, and assert every
  `boxes` entry whose centre satisfies `onWaterCourse(cx, cz, 0)` is one of the setpiece colliders you kept (none, for
  the canal); keep that test file.
- `(cd games/gnome-theft-auto && GOLDEN_OUT=../../.golden-4i.json npx vitest run src/layout.golden.test.ts)` runs (it
  may fail: that is expected); delete `.golden-4i.json` afterwards.

## Out of scope
Every other part of `biomes.ts` (the generators, the outer-ring scatter, the loch and parkland generators, the other
setpieces) and every other file.
