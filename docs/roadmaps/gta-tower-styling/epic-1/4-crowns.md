Epic: 1 tower kit
Depends on: none

(Read `docs/roadmaps/gta-tower-styling/epic-1/_env.md` first: environment and rules.)

## Goal
`games/gnome-theft-auto/src/towers/crowns.ts` builds every tower's roof crown: spire, sail, pyramid, crown ring of
fins, clock, water tank, helipad, roof garden, antenna farm, giant gnome-hat finial, plain flat roof, and the bare
roof under a rooftop billboard.

## Read first
- `games/gnome-theft-auto/src/towers/types.ts`: `TowerSpec` (note `capped`), `TowerStyle` (`crown`, `accent`, `trim`), `Crown`, `Mass`, `TowerGeoms`.
- `games/gnome-theft-auto/src/towers/kit.ts`: `box`, `cyl`, `ball`, `colored`, `capTop` (every geometry you push must come from these helpers or have a `color` attribute added with `colored`, and must be indexed: BoxGeometry, CylinderGeometry, ConeGeometry and SphereGeometry are).
- `games/gnome-theft-auto/src/towers/crowns.ts`: the stub; keep the signature.
- `packages/prefabs/src/batch.ts` lines 1-25: `StaticPrefabPlacement` (`{ id, x, y, z, yaw?, scale?, tint?, trim? }`, y is where the prefab's base stands).

## Change
`games/gnome-theft-auto/src/towers/crowns.ts`, `buildCrown(spec, style, masses, out, gear, rnd)`:
- The roof: `top` = the mass with the highest y1 (the first one if two tie). Build the crown on it;
  `ry = capTop(top)` is the roof surface, `rw`, `rd` the top mass's w and d (for a 'cyl' mass rw = rd = its w), centre (top.x, top.z).
  `m = Math.min(rw, rd)`.
- Rooftop clutter on every roof except 'garden', 'helipad' and 'billboard': 1-3 `tower-hvac` prefabs (count from rnd)
  placed at random spots inside the roof (keep 1.5 m from the roof edge and 2 m from the roof centre), `scale: 1.6`,
  yaw a multiple of PI/2. On roofs under 8 m across, only one.
- `capped` towers: nothing may rise more than 2 m above spec.h. If the crown is 'spire', 'sail', 'pyramid',
  'antenna-farm', 'gnome-hat', 'clock', 'water-tank' or 'crown-ring' and spec.capped is true, build 'flat' instead.
- Crowns (all sizes in metres; `out.trim`, `out.metal`, `out.glow` are geometry lists; `gear` gets prefab placements):
  - 'flat': only the clutter. 'billboard': nothing at all (a rooftop billboard stands there).
  - 'spire': a base drum `cyl(0.18 * m, 0.22 * m, 2, 8, x, ry, z, style.trim)` into out.trim, then a needle `cyl(0.12, 0.5, Math.min(16, 0.25 * spec.h), 8, x, ry + 2, z, style.accent)` in `style.accent` into out.metal, a glow ball `ball(0.35, ...)` colour 0xff3030 at the tip into out.glow.
  - 'sail': a curved fin along the longer roof side (L = max(rw, rd)): 7 thin metal boxes (thickness 0.4 m), box k (0..6) is `0.7 * L * (1 - k / 7.5)` long, 2.2 m tall, stacked from ry upward (each starting 2.1 m above the previous, so they overlap 0.1), each shifted 0.6 m * k toward one end of the roof so the stack curves like a sail; colour style.accent into out.metal. Keep every box inside the roof rectangle (clamp the shift). A glow ball 0xff3030 at the top end.
  - 'pyramid': a four-sided glass pyramid: `new THREE.ConeGeometry(0.62 * m, 0.45 * m, 4)` rotated `rotateY(Math.PI / 4)`, base at ry (translate so its bottom is at ry), centred, `colored(..., style.accent)` into out.metal; a glow ball 0xfff2c0 radius 0.4 at the apex.
  - 'crown-ring': a drum `cyl(0.3 * m, 0.3 * m, 3, 12, x, ry, z, style.trim)` into out.trim; around it, 14 fins: thin boxes 0.35 x (5 + 3 * (k % 2)) x 1.2 in style.accent on a circle of radius 0.36m, each turned to face outward (box(..., ry_angle) with the kit's `ry` argument = the angle), bottom at ry; a glow ring: 8 small glow balls 0xfff2c0 radius 0.25 on the circle at ry + 3.2.
  - 'clock': a trim plinth `box(0.5 * m, 1.2, 0.5 * m, x, ry, z, style.trim)` in style.trim at ry, then a `tower-clock` prefab on it at y = ry + 1.2, scale = 0.42 * m / 1.2 (the prefab is 1.2 wide), tint style.accent.
  - 'water-tank': a platform `box(0.3 * m, 0.5, 0.3 * m, px, ry, pz, 0x6b6b70)` into out.trim, its centre offset toward one roof corner by 0.2 * m on both axes; on it a `tower-water-tank` prefab, scale 2.6, tint style.accent. If m > 20 add a second tank on its own platform at the opposite corner, scale 2.2.
  - 'helipad': a `tower-helipad` prefab centred at y = ry, scale = min(4, 0.8 * m / 3) (the prefab is 3 across), tint style.accent.
  - 'garden': along the roof edge, `tower-planter` prefabs (scale 2, so 2.4 m long) every ~4 m on all four sides, set 1.2 m in from the edge and turned to run along the edge (yaw 0 on the z sides, PI/2 on the x sides), at most 16; 2-4 `tower-roof-tree` (scale 2) inside; one `tower-pergola` (scale 2.2) near the centre. If spec.capped, use only planters (the trees are 3.2 m tall).
  - 'antenna-farm': 3-5 `tower-mast` prefabs (scale 2.5 to 4 from rnd; the mast is 3 tall) spread over the roof (1.5 m from edges, 3 m apart at least), and 2 `tower-dish` prefabs (scale 2.2) with random yaw.
  - 'gnome-hat': a short drum `cyl(0.3 * m, 0.32 * m, 1.5, 12, x, ry, z, style.trim)` into out.trim, then a `tower-gnome-hat` prefab on it at ry + 1.5, scale = 0.55 * m / 1.2, tint style.accent, trim 0xd4af37.
- Aircraft light: if spec.h > 50 and the crown is not 'spire' / 'sail' / 'pyramid' (they have their own), put one glow ball 0xff3030 radius 0.3 on a metal post `cyl(0.08, 0.08, 2.5, 6, ...)` at a roof corner 1 m in from the edges.
- Prefab ids are fixed (another worker is adding them to the prefab library right now; do not check they exist):
  `tower-water-tank` (1.2 across, 2.0 tall), `tower-hvac` (1.2 x 0.7 x 0.8), `tower-dish` (0.9 tall), `tower-mast` (3.0 tall, red light on top), `tower-helipad` (3.0 across, 0.14 tall), `tower-gnome-hat` (1.2 across, 2.4 tall), `tower-planter` (1.2 x 0.6 x 0.6), `tower-roof-tree` (1.6 tall), `tower-pergola` (2.0 x 1.4 x 2.0), `tower-clock` (1.2 wide, 1.7 tall). Every one stands on its base: y in the placement is the surface it stands on.
- Budget: at most 60 boxes/cylinders and 16 prefab placements per tower.
- Write a small `inRoof(x, z)` helper and keep every prefab inside the roof rectangle.

## Contract
`export function buildCrown(spec: TowerSpec, style: TowerStyle, masses: readonly Mass[], out: TowerGeoms, gear: StaticPrefabPlacement[], rnd: () => number): void`
(unchanged). It only pushes onto `out.trim`, `out.metal`, `out.glow` and `gear`.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no error in `src/towers/crowns.ts`.
- Re-read the file: every crown kind in the `Crown` type is handled, the capped rule is applied, nothing is placed outside the top mass's roof rectangle.

## Out of scope
Every other file (the prefabs, silhouettes and the rest are other workers' issues).
