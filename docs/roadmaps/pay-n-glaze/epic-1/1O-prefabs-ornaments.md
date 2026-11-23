Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and then `docs/roadmaps/pay-n-glaze/_prefabs.md` first (they define the prefab frame for ornaments, the checks and the examine voice). You own only `packages/prefabs/src/catalog/gta-glaze-ornaments.ts` (export `GTA_GLAZE_ORNAMENTS`). It exists as an empty array; fill it (keep the export name and the `import type { PrefabDef } from '../types';` line).

## Goal
Nine hood-ornament prefabs: the "random little objects" of Pay 'n' Glaze.

## Read first
- `docs/roadmaps/pay-n-glaze/_prefabs.md`: **Ornaments** rule (origin at the centre of the base that bolts onto the bonnet; at most 0.3 tall and 0.25 wide; facing +z).
- `packages/glaze/src/catalog.ts` lines 111-125: the product names, blurbs and ids. Prefab ids `glaze-ornament-<id>`; prefab `name` = the product name.
- `packages/prefabs/src/catalog/gta-story.ts` (any one prefab): an example of a finished chunky prop with `about` and `examine`.

## Change
Every ornament has a small chrome mounting base (`cyl` `[0.05, 0.06, 0.03]` in `iron-light` or a palette chrome-like grey) at y 0.015 and then the figure above it. `tags` include `'glaze'`, `'ornament'`, `'hood'`. No tint. The figure is chunky, readable at 32 px, 6 to 16 parts.
- `glaze-ornament-hat` "Mini Gnome Hat": a red (`0xd8342c`) cone hat `cone` `d: [0.09, 0.2]` with a brim `cyl` `[0.11, 0.11, 0.015]`, a white band, a gold buckle `box`.
- `glaze-ornament-acorn` "Golden Acorn": a gold (`0xe0b030`) acorn: nut `ball` `d: [0.07]` `scale: [1, 1.25, 1]`, cap `ball` `d: [0.075]` `scale: [1, 0.5, 1]` in a darker gold, stalk, set on a short post.
- `glaze-ornament-snail` "Chrome Snail": a silver (`0xdfe4ea`) snail: a coiled shell (`ball` `d: [0.07]` plus a `ring` `d: [0.045, 0.012]` on its side), a body `pill` `d: [0.03, 0.14]` lying along z `rot: [90, 0, 0]`, two eye stalks (`cyl` `[0.006, 0.006, 0.05]` + tiny `ball`s) at the front (+z).
- `glaze-ornament-flamingo` "Lawn Flamingo": a pink (`0xff7eb6`) flamingo on one leg: leg `cyl` `[0.008, 0.008, 0.14]`, body `ball` `d: [0.06]` `scale: [1, 0.8, 1.5]`, S-curved neck (three short angled `cyl`s), head `ball`, a black-tipped beak `cone` pointing to +z.
- `glaze-ornament-dragonfly` "Dragonfly Pilot": a long thin body `pill` along z in teal (`0x2aa6a0`), four wings (`box` `[0.16, 0.004, 0.05]`, `alpha: 0.6`, light blue, two pairs angled `rot: [0, +-20, 0]`), a goggle `ring` on the head (`ball`) in brown leather, leaning forward `rot: [-10, 0, 0]` on the whole figure is not needed.
- `glaze-ornament-trowel` "Trowel Standard": a trowel pointing forward and slightly up: a flat metal blade (`wedge` or `box` scaled) `[0.06, 0.012, 0.16]`, a wooden handle `cyl` `[0.015, 0.015, 0.08]` `rot: [90, 0, 0]` at the back, a ferrule, tilted `rot: [-20, 0, 0]` via part rotations.
- `glaze-ornament-rooster` "Weathervane Rooster": a black iron (`iron-dark`) rooster on a vertical rod with an arrow `box`/`cone` crossing it: rod `cyl` `[0.008, 0.008, 0.2]`, arrow `box` `[0.01, 0.01, 0.2]` at y 0.14 with a `cone` head toward +z, and a small rooster silhouette (`ball` body, `ball` head, a red comb `ball`, tail `wedge`) on top.
- `glaze-ornament-mushroom` "Fly-Agaric Knob": a red (`0xd8342c`) cap `ball` `d: [0.1]` `scale: [1, 0.6, 1]` with 5 small white `ball` spots `d: [0.014]` on its top surface, a cream stalk `cyl` `[0.03, 0.04, 0.08]`.
- `glaze-ornament-gnomelet` "Tiny Hood Gnome": a tiny gnome with both fists up: body `box` `[0.07, 0.08, 0.05]` in blue, head `ball` `d: [0.04]`, white beard `cone` `d: [0.035, 0.06]` pointing down at the front, red hat `cone`, two arms `cyl` `[0.01, 0.01, 0.06]` raised `rot: [0, 0, +-150]` with fist `ball`s; facing +z.
Give each prefab `about`, 5 `examine` lines, `uses: ['place']`, `category: 'prop'`, `emoji: []`.

## Contract
Ids exactly `glaze-ornament-{hat,acorn,snail,flamingo,dragonfly,trowel,rooster,mushroom,gnomelet}`; export `GTA_GLAZE_ORNAMENTS`.

## Done when
- `npx tsc --noEmit -p packages/prefabs` has no error in your file.
- `npx vitest run packages/prefabs/src/catalog.test.ts -t "glaze-ornament"` passes (9 prefabs: build, y = 0, centred, 5 examine lines).
- Throwaway check: each bounding box is at most 0.3 tall and 0.25 wide.

## Out of scope
Every other file.
