Epic: 3 (more parts, nested pivots, suspension, showroom stage)
Depends on: 3A (ids and catalogue entries exist)

## Environment
Read `docs/roadmaps/pay-n-glaze/epic-3/_prefabs3.md` first. You own only `packages/prefabs/src/catalog/gta-glaze-spoilers.ts` and `packages/prefabs/src/catalog/gta-glaze-seats.ts`.

## Goal
Four new spoilers and four new seat covers.

## Change
- Spoilers (origin = centre of the base on the rear deck, rising from y = 0, about 1.1 wide, 0.12..0.5 tall, front +z, own colours, no tint):
  - `glaze-spoiler-sail`: a tall triangular sail (a `wedge`) on a mast with a boom: white canvas with a red stripe.
  - `glaze-spoiler-rake`: a garden rake head as a wing: a bar with 9 upward tines, wooden posts.
  - `glaze-spoiler-watercan`: a green watering can lying across the tail, rose spout facing back.
  - `glaze-spoiler-butterfly`: two big butterfly wings spread like a wing: orange and black `wedge`/`ball` shapes on a central body with antennae.
- Seat covers (cover on the seat top: base on y = 0, front +z, about 0.5 wide, 0.4 deep, 0.05..0.12 thick plus a back where the style has one):
  - `glaze-seat-toadstool`: a red spotted toadstool cap cushion on a short cream stem.
  - `glaze-seat-barrel`: a small wooden half-barrel seat with two iron hoops and a cushion lid.
  - `glaze-seat-teacup`: a china teacup seat with a handle at the back, a gold rim and blue pattern bands.
  - `glaze-seat-hay`: a rough hay bale: a straw box with two twine bands and loose straw tufts.

## Contract
Ids exactly as listed; exports `GTA_GLAZE_SPOILERS`, `GTA_GLAZE_SEATS` unchanged.

## Done when
As in `_prefabs3.md`, for your 8 ids.

## Out of scope
Every other file.
