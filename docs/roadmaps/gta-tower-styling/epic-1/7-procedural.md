Epic: 1 tower kit
Depends on: none

(Read `docs/roadmaps/gta-tower-styling/epic-1/_env.md` first: environment and rules.)

## Goal
`games/gnome-theft-auto/src/towers/procedural.ts` gives every non-landmark downtown tower a seeded style that never
repeats a neighbour's facade, silhouette or crown, with a test.

## Read first
- `games/gnome-theft-auto/src/towers/types.ts`: `TowerSpec`, `TowerStyle`, `Silhouette`, `Crown`.
- `games/gnome-theft-auto/src/towers/procedural.ts`: the stub; keep the signature.
- `games/gnome-theft-auto/src/towers/kit.ts`: `seeded`, `hash2`.
- `games/gnome-theft-auto/src/towers/facadeAtlas.ts`: `FACADE` ids. `games/gnome-theft-auto/src/towers/signAtlas.ts`: `SIGN` ids.
- `games/gnome-theft-auto/src/brands.ts`: `BILLBOARD_SPOTS` (entries with `rooftop: true` have x, z).

## Change
- `games/gnome-theft-auto/src/towers/procedural.ts`, `minorStyle(spec, near)`:
  - `const rnd = seeded(hash2(spec.x, spec.z) ^ 0x51ab)`; pick with a helper `pick(list)` = `list[Math.floor(rnd() * list.length)]`.
    Draw the random numbers in a fixed order so the same spec always gives the same style.
  - silhouette: from `['box', 'setback', 'taper', 'slab', 'twin']` minus every silhouette in `near`; if that leaves none, use the full list. If spec.w < 14 or spec.d < 14 do not use 'twin'.
  - facade: from `[BRICK, BLUE_GLASS, CONCRETE_BANDS, SANDSTONE, GREEN_GLASS, WHITE_GRID, DECO_CREAM, COPPER, PASTEL_BALCONY, TERRACOTTA, BRICK_WEATHERED]` (FACADE ids) minus every facade in `near`.
  - facadeTint: from `[0xffffff, 0xf4f0e8, 0xeef3f7, 0xf7efe6, 0xe9f2ea]`.
  - trim from `[0x6e6e74, 0x3a3d42, 0xd8cbb0, 0x5b3a29, 0x2f4858, 0xe8e4dc]`; band: 50% 0, else from `[0xc0392b, 0x2e86de, 0xf1c40f, 0x16a085, 0x8e44ad, 0xe67e22]`; accent from the same band list.
  - ribs: rnd() < 0.4; balconies: rnd() < 0.3 (never both: if both, drop ribs).
  - crown: from `['flat', 'water-tank', 'antenna-farm', 'garden', 'helipad']` minus crowns in `near` (full list if none left). If spec.capped: from `['flat', 'helipad']` only.
    If a `BILLBOARD_SPOTS` entry with `rooftop: true` lies within the footprint grown by 12 m on every side (|spot.x - spec.x| <= w/2 + 12 and the same for z), crown is 'billboard' (whatever was drawn).
  - lobby: rnd() < 0.7 ? 'shops' : 'lobby'; awning from `[0x2e7d32, 0xc62828, 0x1565c0, 0xf9a825, 0x6a1b9a, 0x00838f]` minus awnings in `near`.
  - weathering: rnd() < 0.2 ? 'stains' : 'none' (never 'scaffold': only one landmark has that). If weathering is 'stains' and the facade is BRICK, use BRICK_WEATHERED instead.
  - sign: -1. mural: rnd() < 0.25 ? pick([SIGN.MURAL_FLOWERS, SIGN.MURAL_HAT]) minus murals in `near` (or -1 if none left) : -1.
- `games/gnome-theft-auto/src/towers/procedural.test.ts` (new, vitest): (1) the same spec gives a deep-equal style twice;
  (2) for spec at (40.5, -90, w 19, d 29.5, h 39.8) with a `near` list holding a style of silhouette 'box', facade BRICK, crown 'flat',
  the result's silhouette is not 'box', facade not BRICK, crown not 'flat'; (3) a capped spec only ever gets 'flat', 'helipad' or 'billboard';
  (4) a spec at (79.5, 90, w 19, d 29.5, h 42.1) gets crown 'billboard' (the Pay 'n' Glaze rooftop billboard stands at (90, 90));
  (5) over 200 random specs (x, z in -120..120, w, d in 11..36, h in 24..78) every style field is valid (facade 0..13 and not SHOPS/LOBBY, ribs && balconies never both true).

## Contract
`export function minorStyle(spec: TowerSpec, near: readonly TowerStyle[]): TowerStyle` (unchanged).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/towers/procedural.test.ts` passes.
- `npx tsc --noEmit -p .` shows no error in your two files.

## Out of scope
Every other file.
