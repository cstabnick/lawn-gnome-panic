Epic: 3 Trees, music, cigarillos and golf water · Issue 1: larger trees
Depends on: none

## Goal
The island gets some big trees: giant old oaks and tall pines that tower over the course (3-5x the current trees), standing in the rough between holes and as backdrops behind greens, so the course has scale and landmarks.

## Read first
- `games/gnome-golf/src/world.ts`: the existing tree code (two InstancedMesh pairs for broadleaf trees and palms, the seeded mulberry32 RNG, the placement filter using `lieAt`, `distToCoast`, `distToPath`)
- `games/gnome-golf/src/config.ts`: `HOLES`

## Change
- `games/gnome-golf/src/world.ts` only. Add, next to the existing trees (keep them):
  1. **Giant oaks**: 70, one InstancedMesh for trunks and one for canopies. Trunk: `CylinderGeometry(0.9, 1.6, 12, 8)` brown (0x5b3a22), base at ground. Canopy: an `IcosahedronGeometry(1, 1)` blob, flatShading, scaled to about 11 x 8 x 11 yd and centred at y = 15, greens varied with `setColorAt` (0x2f6b2a .. 0x3f8a35). Give each oak a second and third smaller canopy blob offset sideways (+-5 yd, y 12-14) so the crown is lumpy: a third InstancedMesh with 2 instances per oak is fine.
  2. **Tall pines**: 60, trunk `CylinderGeometry(0.5, 0.9, 18, 6)` (0x4a3020) and 3 stacked dark-green cones (0x1f4d2b, `ConeGeometry` radii 6, 4.5, 3, heights 9, 8, 6 at y 10, 15, 20), as InstancedMeshes.
  3. **Placement** with its own seeded RNG (mulberry32 seed 21): candidates anywhere on the island; keep a point only if `lieAt(x, z) === 'rough'`, `distToCoast(x, z) > 40`, and for every hole `distToPath(hole, x, z).dist > hole.fairwayWidth / 2 + 28` and the distance to every green centre and tee is > 45 yd (big trees must never block a normal shot). Random scale 0.85..1.3 and random yaw. Also no two big trees closer than 18 yd.
  4. **Backdrops**: for each hole, try to place 2 of the oaks/pines 55-80 yd beyond the green centre, along the direction from the last path corner to the green (+-25 deg), if the spot passes the same filter.
  5. All big tree meshes `castShadow = true`, `receiveShadow = false`. No sway animation.
- Keep `createWorld(ctx: Ctx): System` exactly.

## Contract
`export function createWorld(ctx: Ctx): System` unchanged. No new exports.

## Done when
- `cd /home/user/lawn-gnome-panic/games/gnome-golf && npx tsc --noEmit -p .` shows no errors in `src/world.ts`.
- About 130 big trees exist, none within 28 yd of a fairway edge or 45 yd of a green or tee.

## Out of scope
Every other file. Ball collisions with trees are not part of this.
