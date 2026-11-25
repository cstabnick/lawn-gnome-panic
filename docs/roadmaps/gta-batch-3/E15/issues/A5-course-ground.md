Epic: E15-A (Hedgeworth Links, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/golf/greens.ts` draws Hedgeworth's playing surfaces on the flat yard: mown fairways with
stripes, tee boxes, greens (which really rise and tilt, matching the ball physics), fringes, bunkers, Hosepipe Pond,
the gravel cart paths, a flagstick in every cup and tee markers on every tee, without any z-fighting.

## Read first
- `games/gnome-theft-auto/src/golf/types.ts`: `HOLES` (tee, path, fairwayWidth, green, pin, bunkers, ponds), `TEE_HALF_M`,
  `CART_PATHS`, `CART_PATH_W`, `greenRise`.
- `games/gnome-theft-auto/src/golf/course.ts`: `courseGroundY(x, z)` (terrain + green rise: build the green meshes on it).
- `games/gnome-theft-auto/src/golf/greens.ts`: the stub you replace (keep its export).
- `docs/rendering.md` (the rules) and `packages/depth/src/layers.ts` (`LAYER`: ground 0, tint 1, area 2, road 3,
  edge 4, marking 5, decal 6, marker 7; `flatLayer(material, layer)`).
- `games/gnome-theft-auto/src/winter/hill.ts` lines 50-80 (`skiTrack`: a strip mesh following the ground with
  `flatLayer`) and `src/homes/pieces.ts` (`buildPieces`, `HomePiece`) for standing prefabs.
- `packages/prefabs/src/catalog/golf.ts` (`golf-flagstick`, `tee-marker`) and `gnome-golf-props.ts` (`golf-ball`, `golf-tee`).
- `games/gnome-theft-auto/src/cull.ts` header (how static content registers for distance culling: `registerCull` /
  `buildStaticCells`).

## Change
`src/golf/greens.ts`, `buildCourseGround(scene): { boxes: Box[] }` (one `THREE.Group` named `hedgeworth-course` added to
the scene, registered for culling as the header of cull.ts says for big static ground pieces, or built with
`buildStaticCells` where it is prefabs):
- Layers (each layer its own material; never share a material between layers): rough is the terrain itself (no mesh).
  **Fairways** `LAYER.tint`: a ribbon along each hole's path (width `fairwayWidth`, from `fairwayStart` to the green)
  sampled every 2 m on `heightAt` + 0.02, colour 0x5fae3e, with lighter mowing stripes 0x6dbd49 as a second ribbon set on
  `LAYER.area` (alternate 6 m bands across the fairway's length; only the light bands get a mesh).
  **Cart paths** `LAYER.road`: ribbons along `CART_PATHS`, width `CART_PATH_W`, gravel 0xc8b48a.
  **Tee boxes** `LAYER.area`: a square `2 * TEE_HALF_M` on each tee, 0x74c454, with a 0.12 m raised plain box under it
  is NOT wanted (keep it flat).
  **Fringes** `LAYER.edge`: an annulus green.r .. green.r + 1.2, 0x6cc04c, on `courseGroundY`.
  **Greens** `LAYER.marking`: a disc of radius green.r as a triangle fan (rings every 1 m, 32 segments) whose vertex
  heights are `courseGroundY(x, z) + 0.02` so the tilt shows, colour 0x7fd35f; the cup: a small dark disc (r 0.12)
  `LAYER.decal` at the pin.
  **Bunkers** `LAYER.decal`: a disc per bunker (r) with a slightly wobbly edge, sand 0xe8d7a0; **ponds** `LAYER.decal`:
  a disc per pond, water 0x4a8fb8 with `MeshStandardMaterial` roughness 0.2, plus a reed ring (prefab `reed-bed` placed
  every ~6 m round the edge just outside r; they are mowable plants, so give them no collider; pass the placements
  through `addMowablePlants` from `../flora/harvest` and build the rest with `buildStaticCells`, as its doc comment shows).
- Prefabs (via `buildPieces` or `buildStaticCells`): `golf-flagstick` in every cup (scaled so the pole is ~2.2 m tall;
  it has no collider: `solid: false`), two `tee-marker`s on every tee 2 m either side of the aim line (perpendicular to
  the first path leg), a `golf-tee` with a `golf-ball` sitting on it is NOT placed (the runtime draws the ball).
  A flag on hole 3's pin may be tinted red (the long hole), the others yellow, if the prefab takes a tint.
- Return `{ boxes: [] }` unless you add something solid (you should not need to).
New `src/golf/greens.test.ts` (with `installFakeDom` from `../testing/fakeDom` if prefabs need it): builds into a
`THREE.Scene`; the group exists; every material is on a layer (`polygonOffset` true) except prefab meshes; there are 4
green meshes whose highest vertex is above their lowest (the tilt is real); no two of your flat materials share a
`polygonOffsetUnits` value unless they are the same layer.

## Contract
`buildCourseGround(scene: THREE.Scene): { boxes: Box[] }` exactly. Read positions only from types.ts.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/greens.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file. Hedges, grass, plants and the fence are another worker's (yard.ts); buildings another's.
