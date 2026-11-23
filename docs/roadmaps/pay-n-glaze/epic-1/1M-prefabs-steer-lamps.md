Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and then `docs/roadmaps/pay-n-glaze/_prefabs.md` first (they define the prefab frames for steering wheels and lamps, the checks and the examine voice). You own only these two files: `packages/prefabs/src/catalog/gta-glaze-steer.ts` (export `GTA_GLAZE_STEER`) and `packages/prefabs/src/catalog/gta-glaze-lamps.ts` (export `GTA_GLAZE_LAMPS`). Both exist as empty arrays; fill them (keep the export names and the `import type { PrefabDef } from '../types';` line).

## Goal
Five steering-wheel prefabs and seven lamp prefabs.

## Read first
- `docs/roadmaps/pay-n-glaze/_prefabs.md`: **Steering wheels** and **Lamps** placement rules.
- `packages/glaze/src/catalog.ts` lines 60-85: the product names, blurbs and ids. Prefab ids: `glaze-steer-<id>`, `glaze-lamp-<id>`; prefab `name` = the product name.
- `packages/prefabs/src/catalog/lawn-prix.ts` lines 10-40: the stock `ride-on-mower` wheel is a `ring` `d: [0.22, 0.02]` with `rot: [90, 0, 0]` (flat on the x-z plane).

## Change
Steering wheels: flat in the x-z plane, centred, standing on y = 0, at most 0.07 tall, outer radius about 0.2; 12 o'clock is +z; rim parts use `c: 'tint'` and `tint: 0x3a2a20` (dark leather); spokes and hubs use palette names. `tags` include `'glaze'`, `'steering'`, `'wheel'`. Use `ring` parts with `rot: [90, 0, 0]` and `y = ring tube radius` so the ring rests on y = 0, boxes lying flat for spokes (`d: [w, 0.025, l]`).
- `glaze-steer-racing` "Racing Dish": a small ring `d: [0.17, 0.022]`, a flat-bottomed look (add a short flat `box` `[0.16, 0.03, 0.04]` at z = -0.17 covering the bottom of the ring), three spokes (left, right, down), a yellow centre mark at 12 o'clock (`box` `[0.02, 0.03, 0.05]` `0xf2c230`). Grip radius 0.17.
- `glaze-steer-banjo` "Banjo Sprig": ring `d: [0.2, 0.02]` in wood (`c: 'tint'`), three thin metal (`iron`) spokes (`box` `[0.02, 0.02, 0.18]`, 120 degrees apart: `rot: [0, a, 0]`, a = 0, 120, 240, centre of each at 0.09 from the hub in the right direction), a brass hub `cyl` `[0.04, 0.04, 0.04]`. Grip radius 0.2.
- `glaze-steer-donut` "Chunky Donut": a fat ring `d: [0.17, 0.05]`, bright (`tint`), a plain hub `cyl` and two short fat spokes. Grip radius 0.19.
- `glaze-steer-daisy` "Daisy Wheel": a ring `d: [0.17, 0.018]` plus eight round petals (`ball` `d: [0.05]` `scale: [1, 0.3, 1]`) around the outside at radius 0.2 (white `0xf1f1ee`) and a yellow hub `ball` `d: [0.05]` `scale: [1, 0.4, 1]`. Grip radius 0.2.
- `glaze-steer-pretzel` "Pretzel Wheel": two overlapping rings (`d: [0.12, 0.022]` at x = +-0.08, z = 0) in a golden-brown `0xc98a3a` (`c: 'tint'` with that `tint`), a cross brace and a small salt-grain `ball` row. Grip radius 0.2.
Lamps: bulb centre at `[0, 0.1, 0]`, housing from z = -0.1 (hidden in the body) to +0.13 (the lens), about 0.2 wide and 0.2 tall (`bar`: 1.1 wide, 0.12 tall); the lens is a `glow: true` part facing +z in a pale yellow (`0xfff3b8`); no tint. `tags` include `'glaze'`, `'lamp'`, `'headlight'`.
- `glaze-lamp-round` "Bug-Eye Rounds": a chrome bezel `cyl` `[0.11, 0.11, 0.1]` `rot: [90, 0, 0]` at `z = 0.03`, a glow lens `cyl` `[0.09, 0.09, 0.03]` at `z = 0.1`, a black bracket box behind.
- `glaze-lamp-square` "Square Dealers": a black box housing `[0.2, 0.16, 0.18]`, a glow lens `box` `[0.17, 0.13, 0.03]` in front, a chrome strip across the top.
- `glaze-lamp-halo` "Halo Rings": a chrome bezel `cyl` as for the round lamp, a glow lens, and a thin glowing `ring` `d: [0.115, 0.012]` (`glow: true`, light blue `0xbfe8ff`) around it, facing +z (no rotation).
- `glaze-lamp-popup` "Pop-Up Peepers": a housing hood: a black half-dome `ball` `d: [0.12]` `scale: [1, 0.7, 1]` over a lens `cyl` `[0.08, 0.08, 0.05]` with a glow lens; the hood sits above (`y` up to 0.2).
- `glaze-lamp-lantern` "Barn Lanterns": a little lantern: a brass base `cyl`, four thin posts, a glass `box` `[0.14, 0.16, 0.14]` with `alpha: 0.5` and an inner glow `ball` `d: [0.05]` (`glow: true`), a brass cap `cone`; a bracket arm behind.
- `glaze-lamp-bar` "Light-Bar Blaster": one long bar `box` `[1.1, 0.1, 0.1]` black with six round glow lenses (`cyl` `[0.04, 0.04, 0.03]` `rot: [90, 0, 0]`) in a row on its face and two end caps. Bulb centre at the middle `[0, 0.1, 0]`.
- `glaze-lamp-acorn` "Acorn Lamps": an acorn: a `ball` `d: [0.1]` `scale: [1, 1.2, 1]` in warm wood tone as the nut with a glow lens `ball` `d: [0.06]` on the front face, a cap (`ball` `d: [0.11]` `scale: [1, 0.5, 1]` in `wood-dark`) on top and a tiny stalk.
Give each prefab `about`, 5 `examine` lines, `uses: ['place']`, `category: 'prop'`, `emoji: []`.

## Contract
Ids exactly `glaze-steer-{racing,banjo,donut,daisy,pretzel}` and `glaze-lamp-{round,square,halo,popup,lantern,bar,acorn}`; exports `GTA_GLAZE_STEER` and `GTA_GLAZE_LAMPS`.

## Done when
- `npx tsc --noEmit -p packages/prefabs` has no error in your two files.
- `npx vitest run packages/prefabs/src/catalog.test.ts -t "glaze-s"` and `-t "glaze-l"` pass.
- Throwaway check of bounding boxes: steering wheels at most 0.07 tall, 0.4..0.5 wide; lamps about 0.2 (bar 1.1) wide.

## Out of scope
Every other file.
