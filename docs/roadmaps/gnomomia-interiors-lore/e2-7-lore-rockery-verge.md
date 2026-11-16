Epic: 2 Content and polish
Depends on: none

## Environment, rules and checks
Read docs/roadmaps/gnomomia-interiors-lore/_content.md first and follow all of it (paths are relative to the worktree root C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnomomia-interiors-lore).

## Goal
E2-7 Lore: the Rockery and the Verge: readable lore written into `games/gnomes-of-gnomomia/src/data/packs/lore-rockery-verge.ts` (pack id `lore-rockery-verge`).

## Your files (change only these)
- games/gnomes-of-gnomomia/src/data/packs/lore-rockery-verge.ts
- games/gnomes-of-gnomomia/src/data/zones/rockery.ts, games/gnomes-of-gnomomia/src/data/zones/verge.ts

## Ids
Every book and object id you create starts with `lrv-` (e.g. `lrv-harvest-songbook`). House ids you add are plain kebab-case (e.g. `tipsy-toadstool`).

## Quotas and what to write
- 14-18 books. About 6 are `common: true` with `where: ['rockery']` or `['verge']` (a miner's songbook, a smith's notes on Blade-iron, a kilnwright's apprentice primer, a soldier's field guide to the Shorn).
- Name and furnish (houses nearest regions; rockery: `flintdelve` 0,20 · `shard-mine` 40,-20 · `kiln` 0,-80 · `marble-pits` -80,40; verge: `last-tuft` 0,80 · `shorn` -40,20 · `kings-cart` -60,-10):
  - rockery: a Flintdelve house as `workshop` named as a forge (a smith's ledger), one as `library` or `hall` for the kilnwrights (records of gnomes made, a note on the Kiln-born legend that disagrees with the songs), and one more of your choice.
  - verge: Last Tuft tents are a forward camp. Name two (template `tent` or `hall`): a quartermaster's tent (a supply roll, a note of orders) and a field hospital tent (glazing records; the region's honest sad note: soldiers too cracked to send back). One Even Cut-side dwelling near the Shorn as `chapel` with an Even Cut catechism.
- The Verge is the end of the game: hint at the Mower's coming without explaining it (lore-rules rule 8: gnomes describe it as an animal or a saint, never as a machine). Never state the Designer's truths in history.md.
- 3-5 hand-placed outdoor readables (e.g. a plaque at the Flintdelve forge, a grave at Last Tuft, a scroll by the King's Cart). Outdoor objects must be at least 2 m from houses (r + 2) and from the shrine, and inside the map.
- Read first: docs/design/gnomomia/lore-rules.md, docs/design/gnomomia/history.md, sections "## 6. The Rockery" and "## 7. The Verge" of docs/design/gnomomia/places-and-people.md, both zone files.

## Done when
- `cd games/gnomes-of-gnomomia && npx tsc --noEmit` passes for your files.
- `node games/gnomes-of-gnomomia/scripts/lint-content.mjs` (from the worktree root) prints no ERROR naming `lore-rockery-verge`, your zones or your ids.

## Out of scope
src/config.ts, src/content.ts, src/data/interiors.ts, every other pack and zone file, everything under src/ except your files.
