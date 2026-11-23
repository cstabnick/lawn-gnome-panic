Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and `docs/roadmaps/prefab-library/_common.md` first (prefab format, modelling rules, examine voice, checks). The Pay 'n' Glaze mod-prefab rules in `_prefabs.md` do NOT apply to this issue: these are gnome gear, not vehicle mods. You own only `packages/prefabs/src/catalog/gta-glaze-gear.ts` (export `GTA_GLAZE_GEAR`; it exists as an empty array; keep the export name and the `import type { PrefabDef } from '../types';` line).

## Goal
Five cosmetic gear prefabs for the Pay 'n' Glaze achievements (the achievements themselves are added by another issue): one for each of the head, neck, back and hand slots, plus a golden hand item.

## Read first
- `packages/prefabs/src/catalog/cosmetics-head-a.ts` (head gear; `uses: ['wear-head']`, origin at the base of the hat, ~0.15 radius, model rises from y = 0), `cosmetics-neck.ts` (neck gear hangs on the chest in front of the neck), `cosmetics-back.ts` (back gear), `tools.ts` (a held tool: `uses` includes `'hold'` and it needs `grip`; stands upright, handle at the bottom).
- `packages/gnome/src/anatomy.ts`: the gnome's head sphere (centre `[0, 0.8, 0]`, radius 0.17) and `EQUIP_ANCHORS` (where each slot puts gear). `packages/gnome/src/gear-clearance.test.ts` checks gear against the head, so keep head and neck gear clear of the head sphere: run `npx vitest run packages/gnome/src/gear-clearance.test.ts` and it must still pass.
- `docs/cosmetics.md` if it exists (the conventions for achievement cosmetics).

## Change
All: `category: 'armor'` for wearables, `'tool'` for the held ones; `emoji: []`; `tags` include `'glaze'`, `'reward'`; no tint; `about`; 5 `examine` lines in the Gnomes of Gnomomia voice; the in-world lore is Pay 'n' Glaze, a hot-pink-and-chrome custom paint franchise ("New Coat. Who Dis?").
- `glaze-pit-crew-cap` "Pit-Crew Cap": `uses: ['wear-head']`, a pink (`0xff7eb6`) flat cap with a chrome button, a stiff peak toward +z and a small oil-stained white badge on the front.
- `glaze-chequered-scarf` "Chequered Scarf": `uses: ['wear-neck']`, a scarf in black-and-white squares: a ring of small alternating `box`es round the neck plus a hanging tail on the chest.
- `glaze-spray-bandolier` "Spray-Can Bandolier": `uses: ['wear-back']`, a leather strap across the back holding four little spray cans (`cyl` bodies in pink, teal, yellow and violet with silver caps).
- `glaze-spray-can` "Spray Can": `uses: ['hold']`, `grip` at the middle of the body, a pink aerosol can (`cyl` `[0.04, 0.04, 0.2]`), silver dome top and a white nozzle button, a pink and chrome label band. About 0.22 tall, upright, handle (the can's lower half) at the bottom.
- `glaze-gold-spray-can` "Gold Spray Can": `uses: ['hold']`, `grip` as above, the same can in gold (`0xe0b030`) with a gem-like cap `ball`.
Add `wear` offsets (see `PrefabWear`) only if the gear-clearance test or a visual check shows clipping.

## Contract
Ids exactly `glaze-pit-crew-cap`, `glaze-chequered-scarf`, `glaze-spray-bandolier`, `glaze-spray-can`, `glaze-gold-spray-can`; export `GTA_GLAZE_GEAR`.

## Done when
- `npx tsc --noEmit -p packages/prefabs` has no error in your file.
- `npx vitest run packages/prefabs/src/catalog.test.ts -t "glaze-"` passes for your five ids (others' ids may still be missing).
- `npx vitest run packages/gnome/src/gear-clearance.test.ts` passes.

## Out of scope
Every other file, including `packages/achievements` and `packages/gnome`.
