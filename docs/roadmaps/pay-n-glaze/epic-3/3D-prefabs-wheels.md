Epic: 3 (more parts, nested pivots, suspension, showroom stage)
Depends on: 3A (ids and catalogue entries exist)

## Environment
Read `docs/roadmaps/pay-n-glaze/epic-3/_prefabs3.md` first. You own only `packages/prefabs/src/catalog/gta-glaze-tyres.ts` and `packages/prefabs/src/catalog/gta-glaze-rims.ts`.

## Goal
Four new tyres and four new rims.

## Change
- Tyres (axle along x, hub `[0, 0.5, 0]`, diameter 1 so y 0..1 and z -0.5..0.5, width up to 1 along x, no tint):
  - `glaze-tyre-spiked`: a black tyre with a ring of 12 small steel `cone` studs round the tread.
  - `glaze-tyre-balloon`: a fat party-balloon tyre: a `ball` `d [0.5]` scaled `[0.9, 1, 1]` in bright red with a white shine spot and a little knotted tie nub at the valve.
  - `glaze-tyre-cogs`: a black core with 10 chunky `box` cleats at 36 degree steps round the tread like a gear.
  - `glaze-tyre-glow`: a thin black tyre with a bright `glow: true` ring (`ring d [0.47, 0.03]`, glow-worm green) on each face.
- Rims (tint = the player's rim colour: set `tint: 0xc8ccd2` and use `c: 'tint'` for the metal; axle on x, hub `[0, 0.5, 0]`, face toward +x, x within -0.45..0.45):
  - `glaze-rim-gear`: a cog: a disc with 12 square teeth round the edge and a hex hub.
  - `glaze-rim-bottlecap`: a crimped bottle cap: a shallow dish with 16 small `box` crimps round the edge and a painted centre disc (red, not tinted).
  - `glaze-rim-sunflower`: a brown seed centre `cyl` with 14 yellow (`0xf2c230`) petals radiating (petals not tinted).
  - `glaze-rim-sawblade`: a thin steel disc with 16 wedge-shaped teeth round the rim and a centre bolt.

## Contract
Ids exactly as listed; exports `GTA_GLAZE_TYRES`, `GTA_GLAZE_RIMS` unchanged.

## Done when
As in `_prefabs3.md`, for your 8 ids.

## Out of scope
Every other file.
