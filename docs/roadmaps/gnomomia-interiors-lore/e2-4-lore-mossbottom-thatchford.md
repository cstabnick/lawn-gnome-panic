Epic: 2 Content and polish
Depends on: none

## Environment, rules and checks
Read docs/roadmaps/gnomomia-interiors-lore/_content.md first and follow all of it (paths are relative to the worktree root C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnomomia-interiors-lore).

## Goal
E2-4 Lore: Mossbottom and Thatchford: readable lore written into `games/gnomes-of-gnomomia/src/data/packs/lore-mossbottom-thatchford.ts` (pack id `lore-mossbottom-thatchford`).

## Your files (change only these)
- games/gnomes-of-gnomomia/src/data/packs/lore-mossbottom-thatchford.ts
- games/gnomes-of-gnomomia/src/data/zones/mossbottom.ts, games/gnomes-of-gnomomia/src/data/zones/thatchford.ts

## Ids
Every book and object id you create starts with `lmt-` (e.g. `lmt-harvest-songbook`). House ids you add are plain kebab-case (e.g. `tipsy-toadstool`).

## Quotas and what to write
- 14-18 books. About 6 are `common: true` with `where: ['mossbottom']` or `['thatchford']` (local family books: a Mossbottom harvest songbook, a Thatchford market-day price list with grumbles in the margin, a ferryman's log of the ford).
- Name and furnish these buildings (add `id` + `interior` to the existing entries):
  - thatchford, the entry commented `// Tipsy Toadstool` (x -10, z 14): id `tipsy-toadstool`, template `tavern`, name `The Tipsy Toadstool`, books: a drinking-song book and a pinned note of debts (kind note).
  - thatchford `// guildhall` (x 10, z -17): id `guildhall`, template `hall`, name `Thatchford Guildhall`, books: the town charter (Charters layer) and a minutes book of a quarrelsome guild meeting.
  - thatchford `// mill` (x -19, z -24): id `mill`, template `workshop`, name `The Mill`, books: a miller's ledger.
  - thatchford `// neat chapel` (x 41, z 8): id `neat-chapel`, template `chapel`, name `The Neat Chapel`, books: an Order of the Even Cut sermon (the lectern). Keep it consistent with storyline docs/design/gnomomia/storylines/02-neat-chapel.md (read it; do not spoil its ending).
  - mossbottom: the biggest mushroom house (x 0, z -18, r 4): id `fernwick-house`, template `mushroom-home`, name `Elder Fernwick's House`, books: Fernwick's own journal (Rumbling layer, his memories; he is 212), and one more.
  - one more Mossbottom house of your choice as a `library` named for a local schoolroom, with a primer for young gnomes among its books.
- 3-5 hand-placed outdoor readables in these zones (e.g. a plaque at the Thatchford fountain about the town's founding, a note pinned near the ford, a grave in Mossbottom). Outdoor objects must be at least 2 m from houses (r + 2) and from the shrine, and inside the map.
- Read first: docs/design/gnomomia/lore-rules.md, docs/design/gnomomia/history.md, sections "## 1. Mossbottom Vale" and "## 2. Thatchford Downs" of docs/design/gnomomia/places-and-people.md, both zone files.

## Done when
- `cd games/gnomes-of-gnomomia && npx tsc --noEmit` passes for your files.
- `node games/gnomes-of-gnomomia/scripts/lint-content.mjs` (from the worktree root) prints no ERROR naming `lore-mossbottom-thatchford`, your zones or your ids.

## Out of scope
src/config.ts, src/content.ts, src/data/interiors.ts, every other pack and zone file, everything under src/ except your files.
