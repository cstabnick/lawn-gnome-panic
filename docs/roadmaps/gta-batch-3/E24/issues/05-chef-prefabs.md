Epic: E24-2 (workplace jobs, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first. Two other workers add prefabs to `gta-mechanic.ts` and
`gta-comedy.ts` at the same time; you own only `gta-diner.ts`.

## Goal
The prefabs of the diner kitchen (chef job): kitchen props, the eight plated dishes (bag icons and pass models) and
the three chef rewards (wearables).

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the PrefabDef rules (parts, colours, sizes, examine lines, wear mounts).
- `packages/prefabs/src/catalog/gta-jobs-gear.ts`: example wearables (`uses: ['wear-head']`, `wear: { at: [...] }`).
- `packages/prefabs/src/catalog/kitchen.ts`: example food/kitchen props (`acorn-cake`, `clay-oven`).
- `packages/prefabs/src/catalog/gta-diner.ts`: the empty array `GTA_DINER` (already registered in `catalog/index.ts`).
- `packages/prefabs/src/types.ts`: `PrefabDef`, `Part` (shapes `s`, `d`, `at`, `rot`, `c` colour names).

## Change
- `packages/prefabs/src/catalog/gta-diner.ts`: fill `GTA_DINER` (ids must be unique across the catalog: check with
  `grep -rn "id: '<id>'" packages/prefabs/src/catalog`):
  - Kitchen props (category 'furniture' or 'prop', tags include 'gta', 'diner', 'kitchen'):
    `diner-ticket-rail` (a 1.6 m steel rail with 4 paper slips hanging, wall-mounted, ~0.25 m tall),
    `diner-pass-bell` (a brass counter bell, ~0.1 m), `diner-griddle` (a flat-top grill on legs, 1.2 x 0.7 x 0.95 m,
    a grease-shine top), `diner-fryer` (a deep fryer with two baskets, 0.6 x 0.6 x 1 m),
    `diner-chopping-board` (board with a knife and three chopped carrot pieces, 0.5 m),
    `diner-stock-pot` (a big dented pot with a ladle sticking out, 0.45 m), `diner-order-spike` (a spike with
    impaled slips), `diner-menu-board` (a 1.4 x 0.9 m chalk menu board on the wall, no text needed: chalk scribble
    lines), `diner-dish-rack` (a tall drying rack with plates), `diner-hatch-shelf` (a pass shelf with heat lamps,
    1.8 m wide, 0.4 deep, lamps hanging 0.4 m above).
  - Dishes (category 'consumable', uses ['eat'] if that use exists in types.ts, else no `uses`; each on a small plate
    or bowl, about 0.2-0.3 m wide), ids EXACTLY: `diner-acorn-cake`, `diner-dew-clover`, `diner-root-stew`,
    `diner-acorn-toastie`, `diner-dandelion-fritters`, `diner-mushroom-coffee` (a cup), `diner-mulch-chilli`,
    `diner-pie-of-the-day` (a slice).
  - Rewards (wearables): `diner-chef-toque` (head: a tall pleated white toque with a small acorn badge;
    `uses: ['wear-head']`), `pass-bell-medal` (neck: a tiny brass pass bell on a red ribbon; `uses: ['wear-neck']`,
    `wear` like `meter-medal`), `golden-ladle` (hand: a gold ladle; `uses: ['wear-hand']` or the hand use name in
    types.ts, held like other hand items such as `bubble-wrap-roll`). Each `about` names the achievement:
    toque = "Order Up", medal = "Five Stars", ladle = "The Whole Menu".
  - Every prefab: `about`, 5 `examine` lines (dry gnome humour, the diner is the Route South Acorn Diner run by Sage
    Ladle; the stew is "grub-free" and nobody asks), sensible real-world size in metres.
- No changes to `catalog/index.ts` (already registers `GTA_DINER`).

## Contract
The ids listed above, exactly (other modules reference them: `diner-<dishId>` for dishes, the three reward ids in the
achievements catalog).

## Done when
- `npm test -w packages/prefabs` passes.
- `npm test -w packages/gnome` passes (wearable fit checks).
- `npm test -w packages/achievements` may still fail ONLY on rewards owned by the mechanic/comedy workers
  (`glaze-shop-overalls-cap`, `torque-wrench-chrome`, `paint-swatch-fan`, `open-mic-bowtie`, `tomato-splat-beret`,
  `squeaky-rubber-chicken`); the three chef rewards must pass. Say which failures remain.

## Out of scope
`gta-mechanic.ts`, `gta-comedy.ts`, `catalog/index.ts`, the achievements catalog, every game file.
