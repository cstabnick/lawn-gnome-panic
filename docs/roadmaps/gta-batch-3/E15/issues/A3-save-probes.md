Epic: E15-A (Hedgeworth Links, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
Hedgeworth's progress is saved under `gta-golf-v1` (board broken, holes and rounds played, bests, aces, lost balls
found, molehills patted), is part of the save export and the cloud save, and quests can read it through six probes.

## Read first
- `games/gnome-theft-auto/src/golf/types.ts`: `GolfSave`, `GolfStore`, `GOLF_SAVE_KEY`, `GOLF_PROBES`, `HOLES`,
  `LOST_BALLS`, `MOLEHILLS`.
- `games/gnome-theft-auto/src/golf/save.ts`: the stub you replace (keep its exports).
- `games/gnome-theft-auto/src/winter/save.ts` and `winter/save.test.ts`: the model to copy (parse with defaults and
  clamping, merge, a store over `Pick<Storage, 'getItem' | 'setItem'>`, `notifySaveChanged()` from `../saveHook` after
  writes, try/catch around storage).
- `games/gnome-theft-auto/src/city/probes.ts` lines 1-60: `SAVED`, `withStore`, `storage()`, the winter rows.
- `games/gnome-theft-auto/src/saveIO.ts` (`GTA_SAVE_KEYS`, the `gta-winter-v1` row), `src/cloudSave.ts` (the `MERGES`
  table, the `gta-winter-v1` row and how a merge function is given), `src/saveIO.test.ts` line ~46.

## Change
- `src/golf/save.ts`:
  - `emptyGolfSave()` (as the stub), `parseGolfSave(raw)`: JSON with defaults for every missing/invalid field, counts
    clamped to integers >= 0, `best` an array of HOLES.length entries (number >= 1 or null), id arrays filtered to known
    `LOST_BALLS` / `MOLEHILLS` ids without duplicates; bad JSON -> empty.
  - `mergeGolfSave(a, b)`: string in, string out: boardBroken OR, counts max, best per hole the lower non-null,
    bestRound the lower non-null, aces max, id arrays union.
  - `createGolfStore(storage?)`: reads `GOLF_SAVE_KEY` once, keeps the data in memory, writes back after every change
    (and calls `notifySaveChanged()`):
    `breakBoard()` sets boardBroken; `recordHole(index, strokes, par)`: holesPlayed + 1, parHoles + 1 when strokes <= par,
    aces + 1 when strokes === 1, best[index] = min; `recordRound(total)`: rounds + 1, bestRound = min;
    `findBall(id)` / `flattenMolehill(id)`: add a known id once, true when it was new.
    Without storage (tests) it works in memory.
- New `src/golf/save.test.ts`: parse defaults and bad input, merge rules, the store's methods, a round trip through a
  fake storage (`{ getItem, setItem }` over a Map).
- `src/city/probes.ts` `SAVED`: six rows after the winter rows, reading a fresh `createGolfStore(storage() ?? undefined).data()`
  through `withStore` like them: `golf-board-broken` (1 when boardBroken else 0), `golf-holes-played` (holesPlayed),
  `golf-par-holes` (parHoles), `golf-rounds` (rounds), `golf-balls-found` (ballsFound.length), `golf-molehills`
  (molehills.length). Use the `GOLF_PROBES` constants for the keys.
- `src/saveIO.ts` `GTA_SAVE_KEYS`: add `'gta-golf-v1'` after the winter row with a comment like the others.
- `src/cloudSave.ts` `MERGES`: `'gta-golf-v1': mergeGolfSave` (check the table's value type: a `(a: string, b: string) => string`
  merge, or null for newer-wins; use the merge).
- `src/saveIO.test.ts`: if it lists every key in a fixture (as it does for winter), add a golf entry the same way.

## Contract
`GolfStore` exactly as in types.ts; probe ids exactly the `GOLF_PROBES` values; the key `gta-golf-v1`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/save.test.ts src/saveIO.test.ts src/cloudSave.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (the runtime calls the store; quests read the probes).
