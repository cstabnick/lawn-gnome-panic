Epic: 1 tower kit
Depends on: none

(Read `docs/roadmaps/gta-tower-styling/epic-1/_env.md` first: environment and rules.)

## Goal
`games/gnome-theft-auto/src/towers/silhouettes.ts` turns a tower spec and its style into a list of solid masses for
all nine silhouettes, as pure data, with a test proving every mass stays inside the collider.

## Read first
- `games/gnome-theft-auto/src/towers/types.ts`: `TowerSpec`, `TowerStyle`, `Silhouette`, `Mass` (read the rules on Mass).
- `games/gnome-theft-auto/src/towers/silhouettes.ts`: the stub (keep its signature and its first mass exactly).
- `games/gnome-theft-auto/src/towers/kit.ts`: `LOBBY_H` (4.5).
- `games/gnome-theft-auto/src/towers/facadeAtlas.ts`: `FACADE` ids (SHOPS, LOBBY).

## Change
- `games/gnome-theft-auto/src/towers/silhouettes.ts`: `massesFor(spec, style): Mass[]`. No three.js import, no randomness (the same input always gives the same masses).
  - masses[0] is always the ground floor: `{ shape: 'box', x, z, w, d, y0: 0, y1: LOBBY_H, facade: style.lobby === 'shops' ? FACADE.SHOPS : FACADE.LOBBY }`.
  - Everything else starts at `b = LOBBY_H - 0.1`. A mass standing on another starts 0.1 below that one's y1. Masses side by side overlap by 0.3. Every mass: `Math.abs(m.x - x) + m.w / 2 <= w / 2 + 1e-6`, same for z/d, `m.y1 <= h + 1e-6`, `m.y1 > m.y0`. At least one mass reaches y1 = h exactly.
  - Let `L` = the longer of w and d, `S` = the shorter, and "along L" mean along x when w >= d, else along z.
  - `box`: one body, full footprint, b..h.
  - `setback`: h >= 40: three tiers: full footprint b..0.6h; 0.72w x 0.72d centred, (0.6h - 0.1)..0.82h; 0.46w x 0.46d centred, (0.82h - 0.1)..h. h < 40: two tiers: full b..0.65h; 0.6w x 0.6d centred (0.65h - 0.1)..h.
  - `taper`: full footprint b..0.7h; then three stages splitting 0.7h..h evenly; stage k (1..3) is (w - 2k * 0.08w) x (d - 2k * 0.08d), centred, each starting 0.1 below the previous top.
  - `twin`: podium full footprint b..min(14, 0.25h) (call that top P). Two towers, each 0.38L along L and 0.8S across, centred on the short axis, their centres at ±(L/2 - 0.19L) along L from the centre; both from P - 0.1; the one on the negative side to h, the other to 0.88h.
  - `lean`: six slices splitting b..h evenly, each 0.82w x 0.82d, each starting 0.1 below the previous slice's top. Slice k (0..5) is shifted along L by `-0.09L + k * (0.18L / 5)` from the centre (the slice is 0.82 of the size, so 0.09L of slack per side).
  - `ziggurat`: five steps splitting b..h evenly; step i (0..4) is (w * (1 - 0.16i)) x (d * (1 - 0.16i)), centred, each starting 0.1 below the previous top.
  - `drum`: podium full footprint b..min(12, 0.2h) (= P); then a cylinder `{ shape: 'cyl', x, z, w: 0.82 * S, d: 0.82 * S, y0: P - 0.1, y1: h }`.
  - `hblock`: two wings at the two ends along L, each 0.34L along L and S across, from b to h, their centres at ±(L/2 - 0.17L); a bridge between them, (L - 2 * 0.34L + 0.6) along L (so it overlaps each wing by 0.3) and 0.5S across, centred, from b to 0.75h.
  - `slab`: main slab, L along L and 0.62S across, pushed to the negative side of the short axis (its outer edge on the footprint edge: centre at -(S/2 - 0.31S) on the short axis), b..h; a core, 0.35L along L and (0.38S + 0.3) across, on the positive side (its outer edge on the footprint edge, so it overlaps the slab by 0.3), from b to min(h - 3, 0.92h).
- `games/gnome-theft-auto/src/towers/silhouettes.test.ts` (new, vitest): for every `Silhouette` value, and for specs
  `{ w: 19, d: 26.6, h: 63 }`, `{ w: 28.9, d: 28.9, h: 72.4 }`, `{ w: 11.7, d: 18.3, h: 68.5 }`, `{ w: 22.3, d: 22.3, h: 29.8 }`, `{ w: 31, d: 19, h: 36 }`
  (x = 90, z = -30; the other TowerSpec fields: blockX 90, blockZ -30, slot 0, count 1, pal 0, stepped false, roofRoll 0.5, capped false; the style: any complete TowerStyle object with that silhouette):
  every mass is inside the footprint (for 'cyl' use w as the diameter on both axes), `y1 <= h`, `y1 > y0`, some mass has y1 close to h (`toBeCloseTo(h, 5)`), masses[0] is the ground floor described above, and every mass after masses[0] has `y0 >= LOBBY_H - 0.1 - 1e-6`.

## Contract
`export function massesFor(spec: TowerSpec, style: TowerStyle): Mass[]` (unchanged signature).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/towers/silhouettes.test.ts` passes.
- `npx tsc --noEmit -p .` (from games/gnome-theft-auto) shows no error in your two files.

## Out of scope
Every other file.
