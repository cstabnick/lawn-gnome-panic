Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and then `docs/roadmaps/pay-n-glaze/_prefabs.md` first (they define the prefab frames for spoilers and seats, the checks and the examine voice). You own only these two files: `packages/prefabs/src/catalog/gta-glaze-spoilers.ts` (export `GTA_GLAZE_SPOILERS`) and `packages/prefabs/src/catalog/gta-glaze-seats.ts` (export `GTA_GLAZE_SEATS`). Both exist as empty arrays; fill them (keep the export names and the `import type { PrefabDef } from '../types';` line).

## Goal
Seven spoiler prefabs and seven seat-cover prefabs.

## Read first
- `docs/roadmaps/pay-n-glaze/_prefabs.md`: **Spoilers** and **Seats** placement rules.
- `packages/glaze/src/catalog.ts` lines 87-110: product names, blurbs, ids. Prefab ids `glaze-spoiler-<id>` and `glaze-seat-<id>`; the prefab `name` = the product name.
- `packages/prefabs/src/catalog/lawn-prix.ts` lines 10-45: the vehicle these bolt on to is a 1.2-wide mower with a bench seat (a 0.5 x 0.12 x 0.5 box) and a backrest; the seat cover sits over it.

## Change
Spoilers: origin = centre of the base on the rear deck, rising from y = 0; about 1.1 wide, front +z, `tags` include `'glaze'`, `'spoiler'`, `'wing'`; own colours (palette names or numbers; no tint). The leading edge points to +z; the wing is held by two posts (`box` `[0.05, h, 0.05]` at x = +-0.4) unless the style is flat.
- `glaze-spoiler-ducktail` "Duck-Tail": a low lip: a `wedge` `d: [1.0, 0.1, 0.3]` (rises toward the back? the wedge is full height at +z; rotate it `rot: [0, 180, 0]` so the tall edge is at the back) in glossy black with a thin chrome edge `box`.
- `glaze-spoiler-picket` "Picket Wing": a section of white picket fence as a wing: a horizontal white (`0xf4f1e8`) rail `box` `[1.1, 0.05, 0.12]` at y 0.26 and 9 pickets `box` `[0.09, 0.2, 0.03]` with a pointed top (`cone` `d: [0.06, 0.07]` `seg: 4`) standing along it, held by two posts.
- `glaze-spoiler-barndoor` "Barn-Door Wing": a big flat red (`0xa8322a`) plank `box` `[1.1, 0.04, 0.36]` at y 0.34 with a white `X` brace (two thin `box`es rotated about y, `rot: [0, 35, 0]` and `[0, -35, 0]`, lying on it) and two posts.
- `glaze-spoiler-trellis` "Trellis GT": a lattice wing: a frame of wood (`wood`) with 5 slats `box` `[1.0, 0.03, 0.03]` across and 4 `box` `[0.03, 0.03, 0.3]` along, a few green leaf `ball`s `d: [0.05]` `scale: [1, 0.5, 1]` in `0x4e9a3a` on it, two posts.
- `glaze-spoiler-biplane` "Biplane Wing": two stacked flat wings `box` `[1.1, 0.035, 0.3]` at y 0.2 and 0.38 in yellow (`0xf2c230`) joined by four thin struts (`cyl` `[0.012, 0.012, 0.18]`), two posts, red end plates `box` `[0.03, 0.2, 0.32]` at the tips.
- `glaze-spoiler-fin` "Dorsal Fin": one tall fin: a `wedge` `d: [0.06, 0.5, 0.6]` standing on the centre line in blue-grey (`0x4a6d8c`) with a lighter stripe; a small base plate `box` `[0.4, 0.04, 0.5]`. (width is small here: that is fine.)
- `glaze-spoiler-leaf` "Giant Leaf Lip": a broad leaf: a `ball` `d: [0.5]` `scale: [1.1, 0.06, 0.55]` in green (`0x3f9a45`) tilted `rot: [-12, 0, 0]`, a pale centre vein `box` `[0.03, 0.02, 0.9]`, a short stem base.
Seat covers: origin = middle of the seat top; front +z; about 0.5 wide, 0.4 deep, `tags` include `'glaze'`, `'seat'`, `'cushion'`.
- `glaze-seat-bench` "Quilted Bench": a patchwork cushion: a `box` `[0.52, 0.07, 0.42]` base plus four coloured patch `box`es on top (`[0.2, 0.01, 0.17]`, different colours) and a low backrest `box` `[0.52, 0.28, 0.07]` at z -0.2.
- `glaze-seat-bucket` "Racing Bucket": a deep bucket: a base `box`, two side bolsters `box` `[0.08, 0.14, 0.4]` at x = +-0.22, a tall backrest `box` `[0.4, 0.5, 0.08]` with a headrest `box` `[0.2, 0.12, 0.08]`, in black with red (`0xc0392b`) piping stripes.
- `glaze-seat-saddle` "Cowhide Saddle": a saddle: leather-brown base with a raised pommel (`ball` `d: [0.06]`) at the front and a cantle (`box` `[0.46, 0.2, 0.07]`) behind; a white-and-brown cow-spot patch (`ball` `[0.07]` `scale: [1, 0.15, 1]` in `0xf4f1e8` and dark brown).
- `glaze-seat-beanbag` "Bean-Bag Lounger": a lumpy squashed bag: a big `ball` `d: [0.3]` `scale: [1, 0.35, 1]` plus a second `ball` `d: [0.2]` as a backrest hump at z -0.15, y 0.2, in teal (`0x2e9c9a`).
- `glaze-seat-throne` "Garden Throne": a throne: a velvet-red (`0x8a1c2b`) cushion base, a tall carved back `box` `[0.5, 0.6, 0.08]`, a rounded top (`ball` `d: [0.25]` `scale: [1, 0.5, 0.3]`), gold (`0xe0b030`) arms `box` `[0.05, 0.14, 0.4]` with `ball` knobs on the corners and gold trim studs.
- `glaze-seat-springer` "Tractor Springer": a metal pan seat: a round pan (`cyl` `[0.24, 0.22, 0.04]` in `iron`), a coil spring (five thin `ring`s stacked, `rot: [90, 0, 0]`, `d: [0.05, 0.012]`, at y 0.02..0.12 under the pan: NOTE the pan must sit on top so keep the model rising from y = 0: spring at the bottom, pan at y 0.14), a small back bar.
- `glaze-seat-cosy` "Tea-Cosy Cushion": a woolly dome: a `ball` `d: [0.26]` `scale: [1, 0.55, 1.1]` in knitted orange (`0xe8903a`) with a bobble (`ball` `d: [0.05]`) on top and a stripe band (`cyl` `[0.255, 0.255, 0.04]` in cream) round it.
Give each prefab `about`, 5 `examine` lines, `uses: ['place']`, `category: 'prop'`, `emoji: []`.

## Contract
Ids exactly `glaze-spoiler-{ducktail,picket,barndoor,trellis,biplane,fin,leaf}` and `glaze-seat-{bench,bucket,saddle,beanbag,throne,springer,cosy}`; exports `GTA_GLAZE_SPOILERS` and `GTA_GLAZE_SEATS`.

## Done when
- `npx tsc --noEmit -p packages/prefabs` has no error in your two files.
- `npx vitest run packages/prefabs/src/catalog.test.ts -t "glaze-s"` passes for all 14 ids (`glaze-spoiler-*`, `glaze-seat-*`; the filter also matches the steering and other `glaze-s...` ids owned by others, which may still be missing: only yours must pass).

## Out of scope
Every other file.
