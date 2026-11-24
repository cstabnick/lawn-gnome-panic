Epic: 1 tower kit
Depends on: none

(Read `docs/roadmaps/gta-tower-styling/epic-1/_env.md` first: environment and rules.)

## Goal
`games/gnome-theft-auto/src/towers/street.ts` gives every tower a street level (striped shop awnings or a lobby
canopy) and hangs the company sign and the mural on the landmark towers.

## Read first
- `games/gnome-theft-auto/src/towers/types.ts`: `TowerStyle` (`lobby`, `awning`, `trim`, `sign`, `mural`), `Mass`, `TowerGeoms`.
- `games/gnome-theft-auto/src/towers/kit.ts`: `box`, `quad(x, y, z, w, h, facing, uvRect)`, `Facing`, `LOBBY_H` (4.5).
- `games/gnome-theft-auto/src/towers/signAtlas.ts`: `signUv(id)`, `signAspect(id)` (signs are 4:1, murals 1:1; ids 0-11 signs, 12-15 murals).
- `games/gnome-theft-auto/src/towers/street.ts`: the stub; keep the signature.

## Change
`games/gnome-theft-auto/src/towers/street.ts`, `buildStreetLevel(spec, style, masses, out, rnd)`. Geometry from the kit
helpers. The four faces of the footprint: +z (z = spec.z + d/2, facing 'pz'), -z ('nz'), +x ('px'), -x ('nx').
- The "front" face is the one facing the city centre (0, 0): if |spec.x| > |spec.z| it is 'nx' when spec.x > 0 else 'px';
  otherwise 'nz' when spec.z > 0 else 'pz'. The "side" face is the next one clockwise (pz -> px -> nz -> nx -> pz... pick any fixed order, write it as a table).
- Shops (style.lobby === 'shops'): on all four faces, one awning per 6 m of face (centred like the facade tiles: bay
  centres at face-centre + k * 6 for |k * 6| <= F/2 - 3), each a box 4.6 wide x 0.15 thick x 1.4 deep, tilted down
  outward: build it with `box(...)` then the wall-side edge sits at y = 3.6 touching 0.05 inside the wall, the outer edge
  at about y = 3.2, 1.35 m out. Simplest: build the awning as a flat box, `rotateX`/`rotateZ` it by 0.28 rad about its
  long axis before translating (build with new THREE.BoxGeometry, rotate, translate, then `colored(g, hex)`). Colours alternate style.awning and 0xf4f1ea along the face.
- Lobby (style.lobby === 'lobby'): on the front face and the opposite face, one flat canopy slab 0.35 thick, 2.2 deep,
  0.45 of the face wide (max 14 m), its top at y = 4.2, its wall edge 0.1 inside the wall, colour style.awning; a trim
  fascia under its outer edge: box (canopy width) x 0.5 x 0.12 in style.trim, hanging just below the slab's outer edge.
  No posts (nothing on the sidewalk).
- Nothing below y = 3.0 may stick out of the footprint.
- Signs (style.sign >= 0), into `out.sign` as `quad(...)` plus a backing box into `out.trim`:
  1. Top sign on the front face, near the top of the highest BOX mass whose front face is at least 10 m wide (box masses
     only: a 'cyl' mass has no flat face; if no box mass qualifies, skip the top sign). Its front-face plane: for 'pz' it is
     z = m.z + m.d/2, etc. Width W = min(0.7 * face length, 16), height W / 4, centred on the face, top edge 1.5 m below
     the mass's y1. Backing: a box (W + 0.6) x (W/4 + 0.6) x 0.3 in style.trim, its back 0.05 inside the wall; the quad 0.12 in front of the backing's front.
  2. Street sign above the front-face canopy/awnings: W = min(0.5 * face, 8), height W / 4, bottom at y = LOBBY_H + 0.4,
     on the ground-floor mass (masses[0]) front face, with the same kind of backing.
  Use `signUv(style.sign)` as the uv rectangle.
- Mural (style.mural >= 0): on the side face of the lowest box mass after masses[0] whose side face is at least 10 m wide
  and 14 m tall: a square quad of size S = min(0.6 * face width, 0.6 * (y1 - y0), 14), centred on the face, bottom at
  y = max(y0, LOBBY_H) + 2, 0.12 out from the wall; uv `signUv(style.mural)`. No backing.
- At most 40 boxes per tower.

## Contract
`export function buildStreetLevel(spec: TowerSpec, style: TowerStyle, masses: readonly Mass[], out: TowerGeoms, rnd: () => number): void`
(unchanged). Pushes onto `out.trim` and `out.sign` only.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no error in `src/towers/street.ts`.
- Re-read: every quad faces outward from its wall (check `quad`'s facing table in kit.ts), nothing below 3 m pokes out of the footprint.

## Out of scope
Every other file.
