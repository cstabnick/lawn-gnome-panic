Epic: 2 Content and polish
Depends on: none

## Environment, rules and checks
Read docs/roadmaps/gnomomia-interiors-lore/_content.md first and follow all of it (paths are relative to the worktree root C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnomomia-interiors-lore).

## Goal
E2-3 Lore: world-wide common books: readable lore written into `games/gnomes-of-gnomomia/src/data/packs/lore-common.ts` (pack id `lore-common`).

## Your files (change only these)
- games/gnomes-of-gnomomia/src/data/packs/lore-common.ts
- none (no zone files: you do not name houses or place objects)

## Ids
Every book and object id you create starts with `lc-` (e.g. `lc-harvest-songbook`). House ids you add are plain kebab-case (e.g. `tipsy-toadstool`).

## Quotas and what to write
- 18-22 books, all `common: true` with NO `where` (they can appear on any shelf in Fescue).
- Cover the whole world's shared culture, mixing kinds and layers: at least 3 Planting songs/rhymes/prayers (e.g. "The Long Lawn" in fuller form, a counting rhyme about the seven Kiln-born that names a different seventh than other villages do, a bedtime prayer to the Tall Ones), at least 5 Charters-era histories or primers (the Dry Summer, the Dandelion Schism, the Three Charters, the founding of the Pipewrights; each written from a clearly partisan view: a Crown primer, a Wildling pamphlet, an Even Cut tract), at least 4 everyday books (a glazing and crack-care manual, a weather almanac, a cookery book of seed cakes and dew broth, a manners guide), and at least 3 Rumbling-era pieces (a pamphlet of 'what to do when the ground hums', a memorial list, a widely copied letter).
- `objects` stays `{}`.
- Read first: docs/design/gnomomia/lore-rules.md, docs/design/gnomomia/history.md (all of it), docs/design/gnomomia/README.md.

## Done when
- `cd games/gnomes-of-gnomomia && npx tsc --noEmit` passes for your files.
- `node games/gnomes-of-gnomomia/scripts/lint-content.mjs` (from the worktree root) prints no ERROR naming `lore-common`, your zones or your ids.

## Out of scope
src/config.ts, src/content.ts, src/data/interiors.ts, every other pack and zone file, everything under src/ except your files.
