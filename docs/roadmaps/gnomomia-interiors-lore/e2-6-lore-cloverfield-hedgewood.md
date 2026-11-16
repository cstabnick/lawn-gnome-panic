Epic: 2 Content and polish
Depends on: none

## Environment, rules and checks
Read docs/roadmaps/gnomomia-interiors-lore/_content.md first and follow all of it (paths are relative to the worktree root C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnomomia-interiors-lore).

## Goal
E2-6 Lore: Cloverfield and Hedgewood: readable lore written into `games/gnomes-of-gnomomia/src/data/packs/lore-cloverfield-hedgewood.ts` (pack id `lore-cloverfield-hedgewood`).

## Your files (change only these)
- games/gnomes-of-gnomomia/src/data/packs/lore-cloverfield-hedgewood.ts
- games/gnomes-of-gnomomia/src/data/zones/cloverfield.ts, games/gnomes-of-gnomomia/src/data/zones/hedgewood.ts

## Ids
Every book and object id you create starts with `lch-` (e.g. `lch-harvest-songbook`). House ids you add are plain kebab-case (e.g. `tipsy-toadstool`).

## Quotas and what to write
- 14-18 books. About 6 are `common: true` with `where: ['cloverfield']` or `['hedgewood']` (a snail-herding handbook, an aphid-dairy almanac, a lumber tally, a Wildling book of growing songs).
- Name and furnish (pick houses nearest these regions; cloverfield: `sodbury` 0,0 · `granary` 10,-16 · `honeydew-ranch` -60,-40 · `pettigrew-ranch` -70,40; hedgewood: `clippings` 40,40 · `barkhollow` 80,-20 · `elder-privet` -50,-55 · `sawdust-mill` 0,60):
  - cloverfield: a Sodbury house as `shop` (a seed merchant, with an order book) and a ranch house as `cottage` with a rancher's diary about the old feud (storyline 08 range war: read docs/design/gnomomia/storylines/08-range-war.md and do not spoil its ending); one more of your choice.
  - hedgewood: a Barkhollow house as `hall` named as the hunters' lodge (neutral ground: a lodge rule book), a Clippings house as `workshop` (a sawyer's tally book and a complaint letter about Wildlings), and one Wildling-side dwelling as `cottage` (a book of growing songs).
- 3-5 hand-placed outdoor readables (e.g. a plaque at the Sodbury pump, a note nailed to a post in Clippings, a scroll left at Elder Privet). Outdoor objects must be at least 2 m from houses (r + 2) and from the shrine, and inside the map.
- Read first: docs/design/gnomomia/lore-rules.md, docs/design/gnomomia/history.md, sections "## 4. Cloverfield" and "## 5. Hedgewood" of docs/design/gnomomia/places-and-people.md, both zone files.

## Done when
- `cd games/gnomes-of-gnomomia && npx tsc --noEmit` passes for your files.
- `node games/gnomes-of-gnomomia/scripts/lint-content.mjs` (from the worktree root) prints no ERROR naming `lore-cloverfield-hedgewood`, your zones or your ids.

## Out of scope
src/config.ts, src/content.ts, src/data/interiors.ts, every other pack and zone file, everything under src/ except your files.
