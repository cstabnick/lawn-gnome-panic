Epic: 3 (more parts, nested pivots, suspension, showroom stage)
Depends on: 3A (ids and catalogue entries exist)

## Environment
Read `docs/roadmaps/pay-n-glaze/epic-3/_prefabs3.md` first. You own only `packages/prefabs/src/catalog/gta-glaze-steer.ts` and `packages/prefabs/src/catalog/gta-glaze-lamps.ts`.

## Goal
Four new steering wheels and four new headlight housings.

## Change
- Steering wheels (flat in the x-z plane, centred, standing on y = 0, at most 0.07 tall, outer radius about 0.2, 12 o'clock is +z, rim `c: 'tint'` with a `tint`; the grip radius is where the rim must be):
  - `glaze-steer-ship`: a ship's helm: a ring with 8 wooden spokes poking out past the rim as handles and a brass hub. Grip radius 0.2.
  - `glaze-steer-heart`: a heart-shaped rim made of two overlapping rings and a V of boxes, pink tint. Grip radius 0.19.
  - `glaze-steer-square`: a square rim from four boxes with ball corners. Grip radius 0.18.
  - `glaze-steer-sprocket`: a gear rim: a ring with 12 small teeth and three round holes. Grip radius 0.2.
- Lamps (bulb centre at `[0, 0.1, 0]`, lens up to z +0.13, housing back to z -0.1, about 0.2 wide and tall, a `glow: true` pale-yellow lens facing +z, no tint):
  - `glaze-lamp-cateye`: a slim vertical slit lens in a dark almond housing.
  - `glaze-lamp-goggle`: a round brass-rimmed lens with a leather strap band and a small buckle.
  - `glaze-lamp-candle`: a glass cylinder (`alpha 0.5`) with a candle and a small glowing flame on a brass dish.
  - `glaze-lamp-spotlight`: a chunky black cylindrical can with a bright lens, a ribbed back and a swivel bracket.

## Contract
Ids exactly as listed; exports `GTA_GLAZE_STEER`, `GTA_GLAZE_LAMPS` unchanged.

## Done when
As in `_prefabs3.md`, for your 8 ids.

## Out of scope
Every other file.
