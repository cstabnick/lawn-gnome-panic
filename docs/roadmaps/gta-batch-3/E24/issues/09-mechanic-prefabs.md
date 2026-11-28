Epic: E24-2 (workplace jobs, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first. Two other workers add prefabs to `gta-diner.ts` and
`gta-comedy.ts` at the same time; you own only `gta-mechanic.ts`.

## Goal
Prefabs for the mechanic job's client lot at Turfton's Pay 'n' Glaze (house style: hot pink and chrome) and the three
mechanic rewards.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the PrefabDef rules.
- `packages/prefabs/src/catalog/gta-glaze-gear.ts`: Pay 'n' Glaze's existing gear (style reference, ids to avoid).
- `packages/prefabs/src/catalog/gta-jobs-gear.ts`: wearable examples (`uses: ['wear-head']`, `wear: { at }`).
- `packages/prefabs/src/catalog/gta-mechanic.ts`: the empty `GTA_MECHANIC` (already registered in `catalog/index.ts`).
- `packages/prefabs/src/types.ts`: `PrefabDef`, `Part`.

## Change
- `packages/prefabs/src/catalog/gta-mechanic.ts` (ids unique across the catalog; check with grep):
  - Props (tags 'gta', 'glaze', 'mechanic'): `glaze-work-order-board` (a pink pegboard on two legs, 1.6 m wide, 1.9 m
    tall, with clipped order slips and a chrome "WORK ORDERS" plate, no real text needed), `glaze-client-bench`
    (a chrome-and-pink waiting bench, 1.6 m), `glaze-tyre-stack` (three stacked tyres, one with a pink rim),
    `glaze-swatch-wall` (a 1.2 m board of painted colour chips), `glaze-key-hook-board` (keys on hooks, wall item
    0.6 m), `glaze-mud-bucket` (a bucket with a mop, mud-brown water), `glaze-traffic-cone-pink` (a pink cone 0.5 m),
    `glaze-oil-drum` (a chrome drum with a pink stripe).
  - Rewards (wearables): `glaze-shop-overalls-cap` (head: a pink-and-chrome mechanic's cap with a spanner badge;
    'Customer Is Always Right'), `torque-wrench-chrome` (hand: a long chrome torque wrench; 'Nailed the Brief'),
    `paint-swatch-fan` (hand: a fanned deck of paint swatch cards in clashing colours; 'Creative Differences').
  - Every prefab: `about`, 5 dry `examine` lines (Pay 'n' Glaze: "New Coat. Who Dis?", chrome and hot pink, a
    custom-shop foreman called Chrome-Knuckle Cass), real sizes in metres.

## Contract
The ids above, exactly.

## Done when
- `npm test -w packages/prefabs` passes; `npm test -w packages/gnome` passes.
- `npm test -w packages/achievements`: the three mechanic rewards pass (failures may remain only for chef/comedy
  rewards owned by other workers; say which).

## Out of scope
`gta-diner.ts`, `gta-comedy.ts`, `catalog/index.ts`, the achievements catalog, every game file.
