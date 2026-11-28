Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: general-purpose (Sonnet)

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own the new files
`games/gnome-theft-auto/src/skate/build.ts` and `skate/build.test.ts`. Another worker builds the park's people and
storytelling (`skate/life.ts`) at the same time: you build the park itself.

## Goal
The Gutter Bowls exist in the world and look like the lore says: "made from old Tall-One roof gutters: long
half-pipes, curved bowls and a few downspouts to jump". The ridable surfaces are meshes built from the very height
function the skateboard rides (so what you see is what you ride), the rails and props are prefabs, and the park
stands on a concrete pad.

## Read first
- `games/gnome-theft-auto/src/skate/types.ts`: `SKATE_ORIGIN`, `SKATE_SITE`, `SkatePiece` (profiles), `SKATE_PIECES`,
  `SkateRailDef` (`look`: 'prefab' | 'coping' | 'handrail' | 'edge'), `SKATE_RAILS`, `BOARD_LIBRARY`.
- `games/gnome-theft-auto/src/skate/park.ts`: `pieceHeight(p, u, v)`, `parkHeight(x, z)`, `parkRails()` (world
  rails), `parkBoxes()` (the runtime pushes those itself; you return only your props' boxes).
- `packages/prefabs/src/catalog/gta-gutter-bowls.ts`: `skate-ledge` (5.0 x 0.6 x 0.45, origin bottom centre),
  `gutter-deck-platform` (3.5 x 11.0, top at 2.0), `downspout-rail` (6.0 along x, top at 0.5), `gutter-bracket`,
  `board-library-rack`, and `packages/prefabs/src/catalog/gta-park-kit.ts` `grind-rail` (4.0 along x, top 0.47).
- `games/gnome-theft-auto/src/golf/greens.ts`: building a ground mesh from a height function with a material on a
  draw layer (`flatLayer`), vertex colours, merged geometry.
- `packages/depth/src/layers.ts` (`LAYER.area`, `LAYER.decal`) and AGENTS.md's z-fighting rule.

## Change
`src/skate/build.ts`:
```ts
export interface SkateBuild { boxes: Box[]; group: THREE.Group }
export function buildGutterBowls(scene: THREE.Scene): SkateBuild;
```
- A concrete pad over the whole site (`SKATE_SITE`), light grey with darker expansion-joint lines,
  `flatLayer(mat, LAYER.area)` at +0.02 above `heightAt`.
- For every piece that is not a `box` with a `prefab`: a surface mesh sampled from `pieceHeight` on a grid over the
  piece's footprint (0.25 m across curves, coarser on flats; world y = heightAt + h + 0.005), with side walls
  ("skirts") down to the pad wherever the surface ends above the ground (deck backs, the ends of the half-pipe, wedge
  sides and the kicker's lip face, stair risers and the platform's sides). Material: the half-pipe and the bowl are
  galvanised gutter (a pale blue-grey with faint vertical seam lines via vertex colour and a darker rivet stripe near
  the lip); wedges, the platform and stairs are concrete. Flat-shaded, chunky like the rest of the game. Make sure
  coplanar surfaces never overlap (the pad and a piece's flat floor: lift the piece surface 0.005 above the pad, or
  skip pad triangles under pieces).
- Rails: for `look: 'prefab'` place the prefab centred between a and b, rotated to the segment (the prefabs run along
  x); 'coping' and 'handrail': a steel tube (`CylinderGeometry`, radius 0.035, merged) along the segment, with small
  posts down to the stair noses for the handrail; 'edge': nothing.
- Prefab boxes: `skate-ledge` and `gutter-deck-platform` at their pieces (bottom centre at the piece centre on the
  ground); `gutter-bracket`s every 3 m along the outside of the Long Gutter's two deck backs and round the outside of
  the bowl; the `board-library-rack` at `BOARD_LIBRARY`.
- Graffiti and decals on the gutter walls (simple shapes: an acorn, a crown, "GB" letters drawn as quads) with
  `LAYER.decal`, never coplanar with each other.
- Return colliders only for props that `parkBoxes()` does not cover (the rack, the rail feet if any, brackets are
  decoration: none); keep every collider inside the site.

`src/skate/build.test.ts`: build into a `THREE.Scene`; sample 200 vertices of the surface meshes inside the site and
check each vertex y is within 0.03 of `heightAt + parkHeight` at its (x, z) (vertices on skirts excluded); the prefab
objects for the ledge and the deck are where their pieces are; the boxes are inside the site.

## Contract
`buildGutterBowls(scene): SkateBuild`, exactly.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/skate/build.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
skate/park.ts and skate/types.ts (do not edit; report a problem), skate/life.ts, skate/runtime.ts, prefabs.
