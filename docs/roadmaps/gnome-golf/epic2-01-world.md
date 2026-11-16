Epic: 2 Systems · Issue 1: world
Depends on: none

## Goal
`src/world.ts` draws the island course: terrain with a painted lie texture, the sea, trees and palms, flags and tee markers on all 9 holes, a clubhouse, distant islands and drifting clouds. The sea, flags and clouds move so the world feels alive.

## Read first
- `games/gnome-golf/src/config.ts`: `HOLES`, `LOOK`, `ISLAND`, `CLUBHOUSE`, `TEE_HALF`, `FRINGE`
- `games/gnome-golf/src/course.ts`: `heightAt`, `lieAt`, `distToPath`, `distToCoast`, `coastRadius`
- `games/gnome-golf/src/world.ts` (stub)

## Change
- `games/gnome-golf/src/world.ts`: implement `createWorld(ctx: Ctx): System`.
  1. **Terrain mesh**: one `PlaneGeometry(1400, 1120, 466, 373)` rotated to lie flat (`geometry.rotateX(-Math.PI / 2)`), centred on the origin, each vertex y = `heightAt(x, z)`, then `computeVertexNormals()`. `receiveShadow = true`. Material `MeshStandardMaterial({ map: lieTexture, roughness: 0.95 })`.
  2. **Lie texture**: a `<canvas>` 1400 x 1120 px, 1 px = 1 yard, pixel (i, j) = world (x = i - 700 + 0.5, z = j - 560 + 0.5). Colour from `lieAt`: fairway `LOOK.fairway`, rough `LOOK.rough`, green `LOOK.green`, fringe `LOOK.fringe`, tee `LOOK.tee`, sand `LOOK.sand` (use `LOOK.beach` when `distToCoast(x, z) < ISLAND.beach + 2`), water: `LOOK.pond` if `distToCoast > 0` else `LOOK.waterDeep` (under the sea plane, mostly hidden). Variation: rough brightness +-8% from a cheap hash noise; fairway mowing stripes: alternate +-6% brightness by `Math.floor(distToPath(hole, x, z).along / 12) % 2` using the hole whose path is nearest; greens a fine checker (+-3%, 3-yard squares). Write pixels with `ImageData` (one `putImageData`), wrap in `THREE.CanvasTexture`, `colorSpace = THREE.SRGBColorSpace`, `anisotropy = renderer.capabilities.getMaxAnisotropy()`. The plane's UVs map u along +x and v along -z after rotateX, so set `texture.flipY = false` and check: canvas row 0 must be world z = -560. If it comes out mirrored, flip with `texture.flipY` rather than changing the pixel loop. Building this takes ~1 s; that is fine (do it once at create).
  3. **Sea**: `PlaneGeometry(6000, 6000, 120, 120)` at y = 0, `MeshStandardMaterial({ color: LOOK.water, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.92 })`. Animate gentle swell in `update`: for each vertex, y = 0.25 * sin(x / 40 + t * 0.8) + 0.2 * cos(z / 55 + t * 0.6), only for vertices farther than 700 yards from the origin (near the island keep y = 0 so ponds and shore stay correct). Update `position.needsUpdate` at most every 3rd frame.
  4. **Trees**: two `InstancedMesh` pairs (trunk + canopy) for broadleaf trees (brown cylinder trunk 0.4 x 4 yd, green sphere canopy r 3, a few greens via `setColorAt`) and palms (thin tall trunk 7 yd, flattened dark-green cone fronds). Scatter with a seeded RNG (mulberry32, seed 7): 700 broadleaf candidates over the island, keep a point only if `lieAt === 'rough'`, `distToCoast > 25`, and for every hole `distToPath(hole, x, z).dist > hole.fairwayWidth / 2 + 12`, more than 30 yd from every green centre and tee. 160 palms where `distToCoast` is between 4 and 24. Random scale 0.8..1.3, random yaw. Trees `castShadow = true`.
  5. **Holes**: for every hole: a cup (dark `CircleGeometry(0.12)` flat at `heightAt(pin) + 0.01`), a white flagstick (`CylinderGeometry(0.03, 0.03, 2.6)`) standing on the pin, a red flag (`PlaneGeometry(0.9, 0.55, 6, 1)`, double-sided) at the top that flutters: in `update`, offset each flag vertex z by `sin(t * 6 + x * 4) * 0.08 * x` (x = distance along the flag). Tee markers: two small blue spheres (r 0.25) 4 yd apart across the tee centre, perpendicular to the direction from the tee to `path[1]`. Hole number signs are optional.
  6. **Bunker lips**: nothing extra (the texture and the dip in heightAt are enough).
  7. **Clubhouse** at `CLUBHOUSE`: a 24 x 10 x 14 yd cream box with a red pitched roof (a 4-sided `ConeGeometry` scaled), a few window boxes, a flag pole. Base at `heightAt`.
  8. **Distant islands**: 5 low green-and-sand mounds (scaled squashed spheres, radius 80-200 yd) 1400-2200 yd from the origin in different directions; they sit in the fog.
  9. **Clouds**: 14 clusters of 3-5 white `SphereGeometry` puffs (MeshStandardMaterial white, `fog: false`? no: keep fog, flatShading) at height 160-260, spread over +-1500 yd, drifting +x at 3 yd/s, wrapping from x > 1600 to x = -1600.
- Export nothing else.

## Contract
`export function createWorld(ctx: Ctx): System` (signature unchanged). Read `ctx.state.time` for animation. Do not read or change `state.phase`.

## Done when
- `cd /home/user/lawn-gnome-panic/games/gnome-golf && npx tsc --noEmit -p .` shows no errors in `src/world.ts`.
- Every hole has a cup, flagstick and flag at its pin, and tee markers at its tee; trees never stand on a fairway, green, tee or bunker.

## Out of scope
Every other file. The ball, gnomes, mower, camera, minimap and ambient life (gnome golfers on other holes, the raft, birds) are other issues.
