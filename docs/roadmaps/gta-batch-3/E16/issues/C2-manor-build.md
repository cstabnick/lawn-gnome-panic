Epic: E16-C (countryside, scenery wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/country/manor.ts` builds Brassknock Manor's grounds: the walled site with the gate on the
lane, the gravel drive and forecourt with a fountain, the house (scale 2) with its raised terrace over the vines, the
back door path, and formal gardens behind, with colliders and walkable terrace.

## Read first
- `games/gnome-theft-auto/src/country/types.ts`: `MANOR` (site x -1210..-1090, z -10..90, flat ~1.6 m; `gate`
  (-1150, -9) facing north (yaw PI) onto vineyard-lane; `fountain` (-1150, 6); `house` centre (-1150, 31), 46 x 18,
  front facing north (front wall at z 22, back wall at z 40); `door` (-1150, 20.5) = the front door (the knocker);
  `terrace` x -1172..-1128, z 18..22; `countess` spot; `gardens` x -1200..-1100, z 46..86; `story` spots). The back
  door (the way in: another worker defines the interior there) is at (-1150, 40) with its world spot at (-1150, 41.5).
- `games/gnome-theft-auto/src/homes/pieces.ts`: `buildPieces`, `HomePiece` (`scale`), `prefabBox`, `textPlate`,
  `litWindow`.
- `games/gnome-theft-auto/src/interiors/` index exports (`addRooftop` or similar walkable-surface helper: grep
  `export function add` in `src/interiors/*.ts`; E05 rooftops make a flat surface walkable). Use it for the terrace top
  if it fits; otherwise make the terrace a low step (a collider with `h` = terrace height is walkable if the player can
  step up 0.6 m: check `PLAYER` step height in `src/config.ts`; if the step is too high, lower the terrace or skip its
  collider).
- `games/gnome-theft-auto/src/campus/buildings.ts`: how a scale-2 building prefab is placed with its collider.
- Prefabs: `brassknock-manor` (HALF size: body 23 x 9, front +z: place with `scale: 2` and `yaw: PI` so the front faces
  north; the terrace is in the prefab, in front of the front wall), `manor-gate` (8 m gap, piers at local x ±4.4),
  `manor-wall` (6 m along local x, 0.5 thick, 2 tall), `manor-urn`, `manor-sundial`, `stone-fountain` or
  `euro-fountain` (existing), European garden plants from `gta-euro-garden.ts` / `gta-euro-garden-b.ts`
  (`euro-box-hedge`, `euro-topiary-spiral`, `euro-topiary-lollipop`, `euro-plane-tree`, flower beds: grep the files for
  ids and sizes).

## Change
`src/country/manor.ts` (keep `export function buildManor(scene, boxes): void`):
- Walls: `manor-wall` runs round the site edge (1 m inside it) on all four sides, leaving an 8 m gap at `gate` for
  `manor-gate` (yaw so its gap faces north) and a 3 m garden gap in the south wall at x -1150. One collider per wall run
  (0.5 thick, h 2), none across the gaps.
- Drive: a gravel drive decal from the gate south to the forecourt and a ring round the fountain (`PlaneGeometry` /
  `RingGeometry` flat at `heightAt + 0.03`, `flatLayer(material, LAYER.road)`, its own material); the forecourt as an
  `LAYER.area` decal (its own material, not overlapping the drive in the same plane: drive at +0.05, forecourt at +0.03).
  A gravel path along the west side of the house to the back door (`LAYER.road`).
- Fountain at `fountain` with a round collider box (2.5 x 2.5).
- House: `brassknock-manor` at (`house.x`, `house.z`) with `scale: 2`, `yaw: Math.PI`; one collider for the main body:
  x -1173..-1127, z 22..40, h 10 (do not cover the terrace in front of z 22). Two `litWindow`s on the front (one lit
  window: the Countess lights one fire; place them 0.04 in front of the front wall at z 21.96, facing north).
- Terrace: walkable if feasible (see Read first); its balustrade is part of the prefab.
- Gardens (`gardens` rect): a symmetrical parterre: two rows of `euro-box-hedge` boxes framing four beds, a
  `manor-sundial` in the middle, two `manor-urn`s, four topiaries, a plane tree in each corner; keep a 4 m clear walk
  along the middle (x -1152..-1148) from the back door to the south garden gap, and leave every `MANOR.story` spot free
  (4 m). Hedges are not mowable plants? Check `src/flora/kinds.ts` `FLORA`: give colliders only to plants that are
  `mowable: false` there (box hedge and topiaries are; flower beds may not be: no colliders on mowable plants).
- Signs: on the gate's left pier a small brass `textPlate` "BRASSKNOCK" (0.03 proud); on a stand inside the gate a
  `textPlate` "VISITORS: ROUND THE BACK. THE KNOCKER IS FOR THE CHARTER."
- Push every collider into `boxes`.

## Contract
`buildManor(scene, boxes)` unchanged. Keep clear: the front door spot `MANOR.door` (-1150, 20.5) and the back door spot
(-1150, 41.5) (no colliders within 2 m), the `MANOR.countess` spot, the `story` spots.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no errors in your file.
- `npx vitest run src/flora src/sites.test.ts` passes.
- A temporary vitest file (deleted afterwards) runs `buildManor(new THREE.Scene(), boxes)` and asserts no box contains
  the points (-1150, 20.5), (-1150, 41.5), (-1150, -9) and (-1150, 88).

## Out of scope
`src/country/manorInterior.ts`, `src/country/trellisLife.ts`, `src/country/vineyard.ts`, `src/country/types.ts`, every
other file.
