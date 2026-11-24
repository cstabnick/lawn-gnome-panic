Epic: 1 tower kit
Depends on: none

(Read `docs/roadmaps/gta-tower-styling/epic-1/_env.md` first: environment and rules.)

## Goal
`games/gnome-theft-auto/src/towers/dress.ts` dresses a tower's walls: a signature colour band, vertical ribs,
balcony slabs, and scaffolding on the one tower that is under repair.

## Read first
- `games/gnome-theft-auto/src/towers/types.ts`: `TowerStyle` (`band`, `ribs`, `balconies`, `weathering`, `trim`), `Mass`, `TowerGeoms`.
- `games/gnome-theft-auto/src/towers/kit.ts`: `box`, `cyl`, `LOBBY_H`, `TILE_W` (6 m: window bay pitch is 3 m), `TILE_H` (6.4 m: floors are 3.2 m).
- `games/gnome-theft-auto/src/towers/dress.ts`: the stub; keep the signature.
- `packages/prefabs/src/batch.ts` lines 1-25: `StaticPrefabPlacement`.

## Change
`games/gnome-theft-auto/src/towers/dress.ts`, `dressFacade(spec, style, masses, out, gear, rnd)`. All geometry from the
kit helpers (`box(w, h, d, x, yBottom, z, hex, ry?)`, `cyl(...)`), pushed into `out.trim` unless stated.
`body` = the masses after masses[0] (masses[0] is the ground floor; leave it alone, the street worker dresses it).
- Band (style.band !== 0): on the tallest `body` mass whose height (y1 - y0) is over 12 m, one band 1.2 m tall at
  y = y0 + 0.62 * (y1 - y0), rounded down to a floor line (a multiple of 3.2 m). Box mass: a box (w + 0.5) x 1.2 x (d + 0.5)
  centred on the mass (it stands 0.25 proud on every side). Cyl mass: `cyl(r + 0.25, r + 0.25, 1.2, 16, ...)` with r = w / 2.
  Colour style.band.
- Ribs (style.ribs): on every box `body` mass at least 10 m tall: vertical fins 0.35 wide, 0.4 deep, running y0 + 0.2
  to y1 - 0.4, on all four faces, standing on the wall's outside (centre 0.2 outside the wall plane so they stand 0.4 proud).
  Spacing: on a face of length F, place them on the window-bay lines every 6 m (TILE_W), centred on the face
  (positions -F/2 + 3, ... like the facade tiles: the facade's u is 0 at the face centre and one tile is 6 m, so put fins at
  face-centre + k * 6 for every integer k with |k * 6| <= F/2 - 1), at most 5 per face. Colour: style.trim. For a cyl mass:
  8 fins evenly round it, each turned to face outward (box's last argument is the y rotation), same size.
- Balconies (style.balconies): on the two LONGER faces of every box `body` mass at least 10 m tall: one slab every 2 floors
  (6.4 m) from y0 + 6.4 to y1 - 3: slab 0.18 thick, 1.1 deep (standing out from the wall; its wall-side edge 0.05 inside the
  wall so it does not share the wall's plane), 0.6 of the face long, centred; plus a railing on its outer edge: a box
  0.08 thick x 0.9 tall along the slab, at the slab's outer edge, starting on the slab top. Slab colour 0xe8e4dc,
  railing style.trim. At most 10 slabs per face.
- Scaffolding (style.weathering === 'scaffold'): on ONE face of the tallest box `body` mass (one of the two long faces:
  if the mass's w >= d, the +z face; else the +x face), a grid of
  `tower-scaffold` prefabs (gear placements): the prefab is 2.0 wide, 2.0 tall, 0.6 deep, its back at local z = -0.3,
  front facing +z; with `scale: 1.6` a bay is 3.2 x 3.2 m and 0.96 deep. Columns: floor((F - 2) / 3.2) bays across the face,
  centred; rows from y = LOBBY_H up to 0.55 of the mass height. Place each bay 0.3 m out from the wall (its back 0.3 off
  the wall) with yaw turning its +z away from the wall (yaw 0 faces +z, PI/2 faces +x, PI faces -z, -PI/2 faces -x).
  At most 40 bays. ('stains' needs nothing here: the stains are in the facade texture.)
- Budget: at most 120 boxes per tower; skip ribs before balconies if over.

## Contract
`export function dressFacade(spec: TowerSpec, style: TowerStyle, masses: readonly Mass[], out: TowerGeoms, gear: StaticPrefabPlacement[], rnd: () => number): void`
(unchanged). Pushes only onto `out.trim` and `gear`.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no error in `src/towers/dress.ts`.
- Re-read the file: nothing below y = 3 m sticks outside the tower footprint (x ± w/2, z ± d/2) by more than 0.5 m; every piece that touches a wall stands proud of it or overlaps into it, never flush.

## Out of scope
Every other file.
