Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and then `docs/roadmaps/pay-n-glaze/_prefabs.md` first (they define the prefab frame for tyres and rims, the checks and the examine voice). You own only these two files: `packages/prefabs/src/catalog/gta-glaze-tyres.ts` (export `GTA_GLAZE_TYRES`) and `packages/prefabs/src/catalog/gta-glaze-rims.ts` (export `GTA_GLAZE_RIMS`). Both exist as empty arrays; fill them (keep the export names and the `import type { PrefabDef } from '../types';` line).

## Goal
Seven tyre prefabs and eight rim prefabs, the wheel styles of Pay 'n' Glaze.

## Read first
- `docs/roadmaps/pay-n-glaze/_prefabs.md`: **Tyres** and **Rims** placement rules (axle along x, hub at `[0, 0.5, 0]`, diameter 1 so the model spans y 0..1 and z -0.5..0.5, width up to 1 along x, rim face toward +x).
- `packages/glaze/src/catalog.ts` lines 33-58: the product `name` (use it as the prefab `name`), `blurb` and id for each. The prefab id is `glaze-tyre-<id>` / `glaze-rim-<id>`.
- `packages/prefabs/src/catalog/lawn-prix.ts` lines 10-45: how wheels are written (`cyl` with `rot: [0, 0, 90]` is a cylinder lying along x).

## Change
Tyres (no tint; `tags` include `'glaze'`, `'tyre'`, `'wheel'`, `'rubber'`):
- `glaze-tyre-stock` "Stock Rubber": a plain black tyre, a `cyl` `d: [0.5, 0.5, 0.8]` `rot: [0, 0, 90]` at the hub plus a slightly narrower, lighter-black `cyl` `[0.46, 0.46, 0.86]` so the shoulders read; `seg: 16`.
- `glaze-tyre-fat` "Pudgy Puffers": full width 1.0, rounded look: a main `cyl` `[0.5, 0.5, 1.0]`, two end `cyl`s `[0.45, 0.5, 0.08]` (chamfers) at x = +-0.46.
- `glaze-tyre-slim` "Skinny Sprinters": narrow `cyl` `[0.5, 0.5, 0.35]` with a thin pale sidewall stripe ring (`cyl` `[0.49, 0.49, 0.36]` in `0x9a9a9a`, then the black one on top is `[0.5, 0.5, 0.3]`).
- `glaze-tyre-whitewall` "Whitewall Wafers": black tread `cyl` plus a white (`0xf2f2f2`) wide ring on both faces: two `cyl`s `[0.47, 0.47, 0.04]` at x = +-0.32, black sidewall inside.
- `glaze-tyre-knobbly` "Mud-Grub Knobbies": black core `cyl` `[0.46, 0.46, 0.9]` plus 12 tread blocks: `box`es `d: [0.9, 0.12, 0.09]` placed around the rim at 30 degree steps (compute `at` as `[0, 0.5 + 0.5*cos(a), 0.5*sin(a)]` hmm: y is `0.5 + r cos a`, z is `r sin a` with `r = 0.5`; `rot: [a, 0, 0]` in degrees, a = 0, 30, ..., 330). Use a small helper in the file to generate them (it is a plain TS array comprehension).
- `glaze-tyre-cart` "Wagon-Spoke Hoops": a wooden cart wheel: a thin iron hoop (a `cyl` `[0.5, 0.5, 0.18]` iron-dark) with a wooden (`wood`) inner `cyl` `[0.44, 0.44, 0.14]` and 8 wooden spokes (`box` `d: [0.1, 0.44, 0.06]` rotated about x in 22.5 degree steps, 8 of them cover 180 degrees: rotate by 0, 22.5, 45 ... 157.5; each spoke passes through the hub), plus a hub `cyl` `[0.09, 0.09, 0.3]` `rot: [0,0,90]`.
- `glaze-tyre-saucer` "Flying Saucers": a very wide flat disc: `cyl` `[0.5, 0.5, 0.16]` in silver-grey (`0xb8bec7`) with a black rubber rim `cyl` `[0.5, 0.5, 0.1]`, and a small raised dome `ball` `d: [0.18]` `scale: [0.6, 1, 1]` at the hub... all on the x axis, width about 1 (scaled later).
Rims (tint = the player's rim colour; set `tint: 0xc8ccd2` on each; hub caps and accents may be palette colours; `tags` include `'glaze'`, `'rim'`, `'wheel'`, `'chrome'`):
- `glaze-rim-stock` "Stock Steel": a flat dull-steel disc `cyl` `[0.5, 0.5, 0.1]` (tint) with four round lightening holes drawn as darker `cyl`s `[0.07, 0.07, 0.12]` at radius 0.28 (every 90 degrees) and a hub cap `cyl` `[0.12, 0.12, 0.16]` in iron.
- `glaze-rim-fivespoke` "Five-Spoke Stars": a thin outer ring (a `cyl` `[0.5, 0.5, 0.08]` and a dark `cyl` `[0.4, 0.4, 0.1]` cutting the middle) and five `box` spokes `d: [0.1, 0.4, 0.07]` at 72 degree steps radiating from the hub (each box centred 0.22 from the hub), a hub `cyl` `[0.1, 0.1, 0.12]`.
- `glaze-rim-mesh` "Chicken-Wire Mesh": outer ring plus 12 thin spokes (`box` `d: [0.04, 0.46, 0.04]` at 15 degree steps over 180 degrees, two layers rotated 7.5 degrees apart for the criss-cross) and a hub.
- `glaze-rim-deepdish` "Deep-Dish Buckets": a bowl: outer rim `cyl` `[0.5, 0.5, 0.2]` (tint), an inner darker `cyl` `[0.42, 0.42, 0.22]` pushed 0.06 toward -x, a bright inner step ring, and a hub cap; the dish is deep (x from -0.35 to 0.2).
- `glaze-rim-spinner` "Spinner Spinners": a disc with 4 curved-looking blades: four `box` blades `d: [0.1, 0.42, 0.06]` rotated 0, 45, 90, 135 degrees with a 14 degree extra twist (`rot: [a + 14, 0, 0]`, a = 0, 45, 90, 135, applied about x), a chrome hub `cyl` `[0.14, 0.14, 0.14]`, a thin ring.
- `glaze-rim-daisy` "Flower-Power Rims": eight petal-shaped spokes (`ball`s `d: [0.14]` scaled `[0.4, 1.6, 1]`... place 8 around at radius 0.3 with `rot` about x so each petal's long side points out) in tint, plus a yellow (`0xf2c230`) hub `cyl` `[0.12, 0.12, 0.14]`.
- `glaze-rim-acorn` "Acorn-Cap Hubcaps": a plain disc (tint) with a big acorn-cap hubcap: a `ball` `d: [0.3]` `scale: [0.55, 1, 1]` toward +x in brown (`wood-dark`) with a small stalk `cyl`, crosshatched look not needed.
- `glaze-rim-turbine` "Turbofan Rims": ten slanted blades: `box` `d: [0.07, 0.4, 0.05]` rotated about x at 36 degree steps with a 25 degree tilt about y (`rot: [a, 25, 0]`), a dark inner disc, a ring, a hub.
Give each prefab `about`, 5 `examine` lines, `uses: ['place']`, `category: 'prop'`, `emoji: []`.

## Contract
Ids exactly `glaze-tyre-{stock,fat,slim,whitewall,knobbly,cart,saucer}` and `glaze-rim-{stock,fivespoke,mesh,deepdish,spinner,daisy,acorn,turbine}`; file exports `GTA_GLAZE_TYRES` and `GTA_GLAZE_RIMS` as `readonly PrefabDef[]`.

## Done when
- `npx tsc --noEmit -p packages/prefabs` has no error in your two files.
- `npx vitest run packages/prefabs/src/catalog.test.ts -t "glaze-t"` and `-t "glaze-r"` pass (every one of your 15 prefabs builds, stands on y = 0, is centred, has 5 examine lines of 9..160 characters).
- Visual sanity: for each prefab compute its bounding box in a throwaway test or script and check the size is about diameter 1 in y and z and a width of at most 1 in x.

## Out of scope
Every other file. Do not edit `types.ts` or the catalog index.
