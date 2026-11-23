Epic: 3 (more parts, nested pivots, suspension, showroom stage)
Depends on: 3A (ids and catalogue entries exist)

## Environment
Read `docs/roadmaps/pay-n-glaze/epic-3/_prefabs3.md` first. You own only `packages/prefabs/src/catalog/gta-glaze-grille.ts` (export `GTA_GLAZE_GRILLE`) and `packages/prefabs/src/catalog/gta-glaze-bumper.ts` (export `GTA_GLAZE_BUMPER`); both exist as empty arrays.

## Goal
Four grilles and four bumpers (the `stock` entry of each shelf has no prefab).

## Change
- Grilles (a front face plate about 0.7 wide, 0.35 tall, standing on y = 0, z from -0.03 to 0.07, face +z, no tint):
  - `glaze-grille-picket`: a row of 7 white pointed pickets on a rail.
  - `glaze-grille-wire`: chicken wire in a dark frame: a criss-cross of thin boxes.
  - `glaze-grille-grin`: a wide toothy grin: a dark mouth plate with a row of 9 white teeth.
  - `glaze-grille-slot`: a letterbox slot: a brass plate with a long dark slot and a small flap.
- Bumpers (a bar across the nose about 1.15 wide, 0.2 tall, reaching up to z +0.15, standing on y = 0, no tint):
  - `glaze-bumper-chrome`: a chrome bar with two end caps and two small brackets.
  - `glaze-bumper-cowcatcher`: a V-shaped iron cowcatcher: angled bars meeting in a centre point.
  - `glaze-bumper-log`: a rough bark log with lighter ring ends and two rope bands.
  - `glaze-bumper-fender`: a black rubber fender: a squat curved bar made of 4 ribbed boxes.

## Contract
Ids exactly as listed; exports `GTA_GLAZE_GRILLE`, `GTA_GLAZE_BUMPER`.

## Done when
As in `_prefabs3.md`, for your 8 ids.

## Out of scope
Every other file.
