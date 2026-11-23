Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and then `docs/roadmaps/pay-n-glaze/_prefabs.md` first (they define the prefab conventions, the checks and the examine voice). You own only `packages/prefabs/src/catalog/gta-glaze-extras.ts` (export `GTA_GLAZE_EXTRAS`). It exists as an empty array; fill it (keep the export name and the `import type { PrefabDef } from '../types';` line).

## Goal
Eight "extra" prefabs, small bolt-ons placed at different mount points of a vehicle.

## Read first
- `docs/roadmaps/pay-n-glaze/_prefabs.md`: the common rules (origin is the attachment point and the model rises from y = 0; authored for a 1.2-wide vehicle).
- `packages/glaze/src/catalog.ts` lines 126-140: product names, blurbs, ids. Prefab ids `glaze-extra-<id>`; prefab `name` = the product name.
- `docs/roadmaps/pay-n-glaze/epic-1/1G-fittings.md` "Change": where each extra is placed (the code that places them): dice at the dash (offset +x), flag at the rear-left corner, pipes at the side point and mirrored, mudflaps behind each rear wheel, bunting at the top, plate at the rear, roobar at the front, bell at the dash (offset -x).

## Change
All: `tags` include `'glaze'`, `'extra'` and the noun; no tint; `uses: ['place']`, `category: 'prop'`, `emoji: []`, `about`, 5 `examine` lines. Chunky and readable.
- `glaze-extra-dice` "Fuzzy Dice": a little mirror-post: `cyl` `[0.01, 0.01, 0.3]` from y 0 to 0.3 with a small chrome ball on top, and two fuzzy dice hanging from a thin string `cyl` `[0.004, 0.004, 0.12]` at y 0.18..0.3: each die a `box` `[0.07, 0.07, 0.07]` in pink (`0xff7eb6`) and white (`0xf4f4f4`) at y 0.11 and x = +-0.04 with small black pip `ball`s on the +z faces (`d: [0.008]`). The lowest point of the model is the post base at y 0.
- `glaze-extra-flag` "Whip-Antenna Flag": a tall thin aerial `cyl` `[0.004, 0.01, 0.85]` in black from y 0 to 0.85 on a small base `cyl` `[0.03, 0.035, 0.04]`, with a triangular red pennant near the top: a `wedge` `d: [0.01, 0.1, 0.16]` rotated so it flies backward (-z), plus a tiny ball tip.
- `glaze-extra-pipes` "Stovepipe Exhausts": ONE chrome stovepipe (the code mirrors it to the other side): a vertical pipe `cyl` `[0.04, 0.045, 0.4]` at y 0..0.4 with a bell-flared top (`cone`-like: `cyl` `[0.06, 0.04, 0.05]` at y 0.4), two clamp bands (`cyl` `[0.05, 0.05, 0.02]`), a small heat-shield `box` on the +x side, a mounting plate at the base. Chrome = palette `iron-light` or `0xdfe4ea`.
- `glaze-extra-mudflaps` "Mudflap Gnomes": ONE mudflap (mirrored by the code): a black rubber flap `box` `[0.03, 0.2, 0.16]` hanging from a bracket `box` at y 0.2 to 0.22 (the model rises from y 0: so flap spans y 0..0.2), with a chrome gnome silhouette (a `cone` hat, a `ball` head, a `box` body, in `0xdfe4ea`) on its +x face.
- `glaze-extra-bunting` "Parade Bunting": a string of flags across the top of the vehicle: a thin cord `cyl` `[0.005, 0.005, 1.1]` `rot: [0, 0, 90]` at y 0.28 with two small end poles (`cyl` `[0.01, 0.01, 0.3]` at x = +-0.55, y 0..0.3) and nine hanging triangle flags (`wedge`-or-`cone` `d: [0.05, 0.1]` `seg: 3`, pointing down, rotated `rot: [180, 0, 0]`), in red, yellow, blue, green repeating, hanging from the cord at y 0.2..0.28. Allowed up to 30 parts.
- `glaze-extra-plate` "Vanity Plate": a number plate: white `box` `[0.3, 0.14, 0.015]` with a dark border (`box` a touch bigger behind it, `0x222222`) and, on its +z face, the plate text GNOME 1 drawn as five tiny dark `box`es in a row (a rough blocky stand-in for letters) plus a dash; standing at y 0.07 (lowest point 0), on a small bracket `box` at the back.
- `glaze-extra-roobar` "Hedge-Bar Bumper": a tough bumper: two vertical chrome bars `cyl` `[0.025, 0.025, 0.3]` at x = +-0.32, a top bar `cyl` `[0.03, 0.03, 0.8]` `rot: [0, 0, 90]` at y 0.3, a lower bar at y 0.08, a central bar, and two angled leaf-cutting blades (`wedge` `d: [0.02, 0.1, 0.1]`) at the corners. About 0.85 wide.
- `glaze-extra-bell` "Bicycle Bell": a small silver dome bell `ball` `d: [0.05]` `scale: [1, 0.7, 1]` on a short post `cyl` `[0.01, 0.01, 0.1]` and a clamp, with a lever (`box` `[0.02, 0.02, 0.07]`) beside it, a cream trim ring.

## Contract
Ids exactly `glaze-extra-{dice,flag,pipes,mudflaps,bunting,plate,roobar,bell}`; export `GTA_GLAZE_EXTRAS`.

## Done when
- `npx tsc --noEmit -p packages/prefabs` has no error in your file.
- `npx vitest run packages/prefabs/src/catalog.test.ts -t "glaze-extra"` passes (8 prefabs).

## Out of scope
Every other file.
