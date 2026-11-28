Epic: E16-C (countryside, scenery wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/country/estates.ts` builds the structure of Thorne Even-Estates' three Levelright building
sites from `EVEN_ESTATES`: hoardings with a gate, identical empty show-homes, the half-built house in scaffolding, the
bucket crane, the materials yard and the site caravan, all with colliders, in one culled static batch per site.

## Read first
- `games/gnome-theft-auto/src/country/types.ts`: `EVEN_ESTATES` / `EstateSite` (every position is precomputed in world
  coordinates; footprints give world width `w` along x and depth `d` along z; `yaw` is the facing), `estateLocal`.
- `games/gnome-theft-auto/src/homes/pieces.ts`: `buildPieces`, `HomePiece`, `prefabBox`, `textPlate`, `litWindow`.
- `games/gnome-theft-auto/src/campus/buildings.ts`: a finished builder of the same kind (pieces + colliders + signs).
- Prefabs you place (all exist in `packages/prefabs/src/catalog/gta-country-site.ts` and `gta-skyway-works.ts`; read
  their headers for sizes): `even-show-home` (7 x 7, door on local +z, roof top 4.75), `even-half-built` (8 x 8),
  `site-hoarding` (4 m along local x, 2.4 tall), `site-hoarding-gate` (8 m gap between posts at local x ±4),
  `bucket-crane` (3 x 3 footing at the origin, jib toward +z), `mushroom-girder-stack`, `clay-brick-pallet`,
  `site-cement-mixer`, `tower-scaffold`, `site-cone`, `site-portaloo`, `caravan`.

The three sites (computed from `EVEN_ESTATES`, for orientation; read the real values from the import):
- construction-1 centre (-295, -120), hoarding x -319..-271, z -144..-96, gate (-320, -120) facing west; homes at
  z -139, x -308 / -298 / -288 facing south (yaw 0); half-built (-282, -107); crane (-275, -122); yard (-297, -104);
  caravan (-312, -102) yaw PI/2 (lies along z).
- construction-2 centre (195, 325) turned PI: gate (220, 325) facing east; homes at z 344 facing north.
- construction-3 centre (1050, 250), half 30: four homes at z 226; gate (1020, 250) facing west.

## Change
`src/country/estates.ts` (keep `export function buildEstates(scene, boxes): void`). For each site `s` of `EVEN_ESTATES`:
- Hoarding: `site-hoarding` panels laid end to end along the four sides of `s.hoarding` (panel yaw 0 or PI/2 so it runs
  along the side; panels 4 m long: use `Math.round(side / 4)` panels and a `size`/scale so they meet without overlap),
  leaving the 8 m gap centred on `s.gate`; a `site-hoarding-gate` in the gap (yaw so its posts straddle the gap).
  Colliders: one thin `Box` per side segment (0.3 thick, h 2.4), not one per panel; none across the gate gap.
- Show-homes: `even-show-home` at each `s.homes[i]` with `yaw: home.yaw`; one collider each from the footprint
  (7 x 7, h 4.75). Each gets a `litWindow` in one front window (lit at night: nobody lives there, so make it the SAME
  window on every house: the joke is that they all leave the same light on) and a tiny `textPlate` house number on the
  door ("1", "1", "1": every house is number 1) mounted 0.04 in front of the door face.
- Half-built: `even-half-built` at `s.halfBuilt` (yaw) and four `tower-scaffold` pieces round it (one per side, 1 m
  outside the 8 x 8 footprint); colliders: the four corner posts as small boxes (0.6 x 0.6, h 4) so a gnome can walk
  into the frame (no full-footprint collider).
- Crane: `bucket-crane` at `s.crane` (yaw so the jib points over the half-built house); collider: its footing 3 x 3,
  h 14. A `textPlate` "LEVEL IS KIND" on the jib side is optional (skip if fiddly).
- Yard (`s.yard`, 10 x 8): `site-cement-mixer`, two `clay-brick-pallet`s, one `mushroom-girder-stack`, three
  `site-cone`s, a `site-portaloo` at a corner. Colliders from `buildPieces` (solid default) are fine here.
- Caravan: `caravan` at `s.caravan` (yaw PI/2 + s.turn, i.e. use `s.caravan.yaw`), collider 3 x 6.
- A big sign board at the gate, outside, 3 m to one side: a `textPlate` 3 x 1.6 m on two posts (posts: any thin post
  prefab or `kit`-free plain boxes as architecture) reading "THORNE EVEN-ESTATES" / `s.name` / "COMING SOON: SAMENESS"
  (beige 0xd9c8a5 background, dark text), facing out of the gate (`s.gate.yaw`).
- Ground: a packed-dirt yard decal across the inside of the hoarding (a `PlaneGeometry` rotated flat, `flatLayer(material,
  LAYER.area)`, 0.03 above `heightAt`), its own material.
- Everything through `buildPieces(scene, pieces, 'estate-' + s.id)` once per site; push its boxes and your own boxes
  into `boxes`; never put a collider in the gate lane (from the gate to the site centre, 8 m wide).

## Contract
`buildEstates(scene, boxes)` unchanged. Do not place anything at `s.story` spots (4 m radius) or on the `s.crewLoop`
path: another worker puts vignettes and walking crews there.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no errors in your file.
- `npx vitest run src/sites.test.ts src/flora` passes.
- A short self-check script (a temporary vitest file you delete afterwards) builds `buildEstates(new THREE.Scene(), boxes)`
  and asserts: no box overlaps the gate lane rectangle of any site, and no box lies outside its site's hoarding + 6 m.

## Out of scope
`src/country/estatesLife.ts` (vignettes, people, sounds), `src/country/types.ts`, every other file.
