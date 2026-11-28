Epic: E32-B (nine holes, parallel build)
Depends on: none · Worker: haiku

First read `docs/roadmaps/gta-batch-3/E32/issues/_env.md`.

## Goal
Three new Hedgeworth achievements, each with a wearable reward prefab.

## Read first
- `packages/achievements/src/catalog.ts` lines 1375-1420: the six E15 golf achievements (`gta-kicked-board` ...
  `gta-groundskeepers-secret`): copy their exact shape (fields, `reward`, `game`, `gameTitle`, icon, etc.).
- `packages/achievements/README.md` (rules for rewards and the test).
- `packages/prefabs/src/catalog/gta-golf-gear.ts`: how E15's wearable rewards (`argyle-tam` head, `scorecard-lanyard`
  neck, `golf-bag-pack` back) are defined — slot uses (`wear-head` / `wear-neck` / `wear-back`), anchor conventions,
  size.

## Change
- `packages/prefabs/src/catalog/gta-golf-nine-gear.ts` (yours): three wearables in the same style as gta-golf-gear.ts:
  - `turn-rosette` (neck): a red-and-gold ribbon rosette with "9" stitched in the middle (shape only, no text), on a
    short ribbon.
  - `promise-boater` (head): a straw boater hat with a green-and-gold Hedgeworth band.
  - `topiary-cape` (back): a short cape of clipped hedge leaves, a little clump of leaf bumps.
  Five `examine` lines each (dry Hedgeworth humour: the promise, the maze, the nine).
- `packages/achievements/src/catalog.ts`: add after the E15 golf block:
  - `gta-hedgeworth-full-nine` — title "The Whole Nine", description "Finish all nine holes of Hedgeworth Links in one
    round.", reward neck `turn-rosette`.
  - `gta-nine-under-par` — title "Under the Promise", description "Finish a full nine at Hedgeworth under par.", reward
    head `promise-boater`.
  - `gta-out-of-the-maze` — title "Out of the Maze", description "Make par or better on The Maze, Hedgeworth's fifth.",
    reward back `topiary-cape`.
  Same `game: 'gnome-theft-auto'`, `gameTitle` as the neighbours.

## Done when
- `npm test -w packages/achievements` passes.
- `npm test -w packages/prefabs` passes for your three ids (report other failures without fixing them).

## Out of scope
The game code (the runtime unlocks them: another issue), other catalog files.
