Epic: 3 (more parts, nested pivots, suspension, showroom stage)
Depends on: 3A (ids and catalogue entries exist)

## Environment
Read `docs/roadmaps/pay-n-glaze/epic-3/_prefabs3.md` first. You own only `packages/prefabs/src/catalog/gta-glaze-ornaments.ts` and `packages/prefabs/src/catalog/gta-glaze-extras.ts`.

## Goal
Four new hood ornaments and four new extras.

## Change
- Ornaments (a small chrome base `cyl` first, then the figure; at most 0.3 tall and 0.25 wide; face +z; no tint):
  - `glaze-ornament-bee`: a brass bee with a striped abdomen, two translucent wings and tiny goggles.
  - `glaze-ornament-ladybird`: a red domed ladybird with black spots and a black head.
  - `glaze-ornament-dandelion`: a dandelion clock: a thin stem with a fluffy white ball of 12 small seeds.
  - `glaze-ornament-spraycan`: a mini chrome spray can on its base with a pink cap and a little puff of three pink balls.
- Extras (see "Epic 3 slots and the new extras" in `_prefabs.md`; no tint):
  - `glaze-extra-fairylights`: a thin cord across the top with two end poles and about 12 small `glow: true` bulbs in mixed colours hanging in a gentle droop (1.1 wide).
  - `glaze-extra-toolbox`: a little red metal box with a hinged lid line, a handle and two clasps (0.3 wide).
  - `glaze-extra-cooler`: a picnic cooler 0.4 wide, 0.25 tall: blue body, white lid, a handle and a bottle top peeking out.
  - `glaze-extra-windsock`: a 0.8 tall pole with an orange and white striped sock streaming back (-z) on a ring.

## Contract
Ids exactly as listed; exports `GTA_GLAZE_ORNAMENTS`, `GTA_GLAZE_EXTRAS` unchanged.

## Done when
As in `_prefabs3.md`, for your 8 ids.

## Out of scope
Every other file.
