Epic: E24-2 (workplace jobs, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first. Two other workers add prefabs to `gta-diner.ts` and
`gta-mechanic.ts` at the same time; you own only `gta-comedy.ts`.

## Goal
Prefabs for Le Petit Groan (a comedy cellar club in Pardonlin, the satirical continental town) and the comedian
rewards: the stage, the cellar entrance on the street, the thrown tomato.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the PrefabDef rules.
- `packages/prefabs/src/catalog/gta-pardonlin-gear.ts` and `gta-euro-street.ts`: Pardonlin style and examples.
- `packages/prefabs/src/catalog/gta-jobs-gear.ts`: wearable examples.
- `packages/prefabs/src/catalog/gta-comedy.ts`: the empty `GTA_COMEDY` (already registered).
- `packages/prefabs/src/types.ts`.

## Change
- `packages/prefabs/src/catalog/gta-comedy.ts` (ids unique; check with grep):
  - Stage and room: `groan-mic-stand` (a chrome mic stand with an old ball mic, 1.5 m), `groan-stage-stool` (a tall
    wobbly bar stool, 0.8 m), `groan-brick-backdrop` (the classic comedy brick wall panel, 4 x 2.6 m, thin 0.1 m, dark
    red bricks with mortar lines as parts or a texture-free pattern of slightly offset boxes, few parts),
    `groan-spotlight` (a ceiling can light, 0.4 m), `groan-cafe-table-small` (a tiny round table with a candle in a
    bottle, 0.6 m), `groan-velvet-rope` (two posts and a sagging red rope, 1.4 m), `groan-tip-jar` (an empty glass jar
    labelled with nothing in it but a button), `groan-setlist` (a crumpled sheet, flat 0.2 m: lift it off the floor
    0.01 m in parts).
  - Street entrance (world): `groan-cellar-entrance` (a stone stairwell going down below street level: a low stone
    surround 2.4 x 1.6 m, 0.9 m tall, with iron railings on three sides and a little lamp; the open side faces +z),
    `groan-chalkboard-sign` (an A-frame chalkboard 1.1 m), `groan-poster-column` (a short round poster column 2.4 m in
    the Pardonlin way, posters as coloured panels).
  - The tomato: `comedy-tomato` (a ripe tomato, 0.09 m, red with a green calyx; category 'consumable').
  - Rewards (wearables): `open-mic-bowtie` (neck: an oversized sparkly bow tie; 'Tough Room'), `tomato-splat-beret`
    (head: a black Pardonlin beret with a tomato splat on it; 'Fresh Produce'), `squeaky-rubber-chicken` (hand: a
    rubber chicken; 'Double Down').
  - Every prefab: `about`, 5 dry `examine` lines (Le Petit Groan: the booker Mireille Sans-Rire has never laughed; the
    crowd are critics; the brick wall "has heard every joke and laughed at none").

## Contract
The ids above, exactly (club.ts, runtime.ts and the achievements catalog use them).

## Done when
- `npm test -w packages/prefabs` passes; `npm test -w packages/gnome` passes.
- `npm test -w packages/achievements`: the three comedy rewards pass (failures may remain only for chef/mechanic
  rewards owned by other workers; say which).

## Out of scope
`gta-diner.ts`, `gta-mechanic.ts`, `catalog/index.ts`, the achievements catalog, every game file.
