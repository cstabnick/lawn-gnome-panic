Epic: 1 Foundation (prefabs, physics, lore, water)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E11/_env.md` first. Then read `docs/roadmaps/prefab-library/_common.md` for the prefab
rules, **except its "Environment" section** (the working directory there is wrong: use the one in `_env.md`).
Other workers edit `gta-coast.ts`, `gta-coast-kit.ts` and game files at the same time.

## Goal
`packages/prefabs/src/catalog/gta-coast-gear.ts` holds five wearable achievement rewards from Saltbucket Shore.

## Read first
- `packages/prefabs/src/types.ts` (`PrefabDef`, `uses`, `wear`), `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/cosmetics-head-b.ts`: `propeller-beanie` and `hedge-hopper-cap` (head rewards: category
  `'armor'`, uses `['wear-head']`, small, base at y 0, centred, tags end with `'reward'`, `about` names the achievement).
- `packages/prefabs/src/catalog/cosmetics-neck.ts` (one neck item, uses `['wear-neck']`) and
  `packages/prefabs/src/catalog/cosmetics-back.ts` (one back item, uses `['wear-back']`): copy their sizes and how they sit.
- `packages/prefabs/src/catalog/gta-coast-gear.ts`: the file you fill (`GTA_COAST_GEAR`, now empty).

## Change
`packages/prefabs/src/catalog/gta-coast-gear.ts`: fill `GTA_COAST_GEAR` with:

| id | name | slot / uses | achievement (for `about`) | look |
|---|---|---|---|---|
| `ski-visor` | Salt-Skier Visor | head, `['wear-head']` | Salt Skier (water-ski 2000 m) | a white sun visor: a band ring and a curved peak (`'tint'`, default 0x2a9df4) at +z, a tiny red ski badge on the front |
| `life-ring-back` | Life Ring | back, `['wear-back']` | Wake Jumper (1 s of air off the wake ramp) | an orange and white striped ring (alternate segments with 4 small boxes on a `ring`) with a rope loop, worn flat on the back like a shell; about 0.4 across |
| `spokewheel-scarf` | Spokewheel Scarf | neck, `['wear-neck']` | Full Circle (ride the Spokewheel one full turn) | a red and white striped knitted scarf loop with two tails, one tail ending in a tiny teacup charm |
| `pirate-bandana` | Pirate Bandana | head, `['wear-head']` | The Queen's Treasure (find the Bathtub Queen's treasure) | a red bandana (squashed ball cap) with white polka dots (small flat balls) and a knot with two short tails at the back (-z) |
| `eye-patch` | Toy Eye Patch | head, `['wear-head']` | Shiver Me Glaze (finish Pirate Tours, Mostly) | a thin black band ring round the head height with a black oval patch over one eye at +z, a tiny gold skull dot on the patch |

Each: 5 examine lines in the lore voice (Saltbucket, the Saltwater, the Spokewheel, the Bathtub Queen and Long Spoon Pier
may be named), tags include `'reward'`, `'saltbucket'` and the nouns, `emoji: []`, under 25 parts, lowest point y 0.

## Contract
Prefab ids exactly: `ski-visor`, `life-ring-back`, `spokewheel-scarf`, `pirate-bandana`, `eye-patch`. The achievements
catalog (another worker, later) uses them as `reward: { slot: 'head' | 'back' | 'neck', prefabId }`.

## Done when
- `cd packages/prefabs && npx tsc --noEmit -p .` has no errors in `gta-coast-gear.ts`.
- `cd packages/prefabs && npx vitest run -t "ski-visor|life-ring-back|spokewheel-scarf|pirate-bandana|eye-patch"` passes.

## Out of scope
Every other catalog file, `catalog/index.ts` (already registers `GTA_COAST_GEAR`), anything under `games/`, the
achievements package.
