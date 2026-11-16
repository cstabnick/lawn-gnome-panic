Epic: 2 Content and polish
Depends on: none

## Environment, rules and checks
Read docs/roadmaps/gnomomia-interiors-lore/_content.md first and follow all of it (paths are relative to the worktree root C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnomomia-interiors-lore).

## Goal
E2-5 Lore: Birdbath Keep and the Drainpipe Deeps: readable lore written into `games/gnomes-of-gnomomia/src/data/packs/lore-keep-deeps.ts` (pack id `lore-keep-deeps`).

## Your files (change only these)
- games/gnomes-of-gnomomia/src/data/packs/lore-keep-deeps.ts
- games/gnomes-of-gnomomia/src/data/zones/keep.ts, games/gnomes-of-gnomomia/src/data/zones/deeps.ts

## Ids
Every book and object id you create starts with `lkd-` (e.g. `lkd-harvest-songbook`). House ids you add are plain kebab-case (e.g. `tipsy-toadstool`).

## Quotas and what to write
- 16-20 books. About 6 are `common: true` with `where: ['keep']` or `['deeps']`.
- Name and furnish (pick the existing house nearest each region in keep.ts; regions: `archive` -18,-28 · `throne-hall` 0,-34 · `guild-halls` 25,25 · `pedestal-ward` 0,25):
  - id `royal-archive`, template `library`, name `The Royal Archive (reading room)`: the Archive is the home of the Charters layer. 5-6 books: three accounts of the same event that disagree (e.g. the Stopping of the Blade told by the Crown, by the Pipewrights and by a Wildling copyist), a king list of the Clayfoots, a catalogue page with missing entries, an archivist's note. Archivist Basil Inkcap is canon (read his entry); he may write a note but must not explain the Designer's truths.
  - id `pipewrights-guild`, template `hall`, name `The Pipewrights' Guildhall` (near guild-halls): a valve-turning manual and a roll of the drowned of the Backflow (one honest sad note).
  - two more Keep houses of your choice (e.g. a robin-keeper's loft as `workshop`, a court tailor as `shop`), each with 1-2 books.
  - Deeps: the six stone houses are pipewright shacks. Name two of them (e.g. `pump-keepers-shack`, template `workshop`) with a pipewright's work diary from the Backflow (Rumbling layer) and a list of valve settings.
- 3-5 hand-placed readables: e.g. a plaque on the Pedestal about Gnorwin raising the Keep, a scroll in the Deeps gutters, a note pinned near the deeps stairs. Outdoor objects must be at least 2 m from houses (r + 2) and from the shrine, and inside the map; in the Deeps keep 2 m from the wall segments listed in deeps.ts.
- Read first: docs/design/gnomomia/lore-rules.md, docs/design/gnomomia/history.md, sections "## 3. Birdbath Keep" and "## 3a. The Drainpipe Deeps" of docs/design/gnomomia/places-and-people.md, both zone files.

## Done when
- `cd games/gnomes-of-gnomomia && npx tsc --noEmit` passes for your files.
- `node games/gnomes-of-gnomomia/scripts/lint-content.mjs` (from the worktree root) prints no ERROR naming `lore-keep-deeps`, your zones or your ids.

## Out of scope
src/config.ts, src/content.ts, src/data/interiors.ts, every other pack and zone file, everything under src/ except your files.
