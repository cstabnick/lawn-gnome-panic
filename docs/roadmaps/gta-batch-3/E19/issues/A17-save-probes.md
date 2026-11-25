Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: haiku-worker

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own the new files
`games/gnome-theft-auto/src/sports/save.ts` and `sports/save.test.ts`, and small additions to `src/city/probes.ts`,
`src/saveIO.ts`, `src/cloudSave.ts` (and `src/saveIO.test.ts` only if it lists keys). Others edit other files.

## Goal
The save of Founders' Green sports (`gta-sports-v1`): pickup-game and shootaround counts, the skateboard, combo and
line bests; cloud merge; and the quest probes that read it.

## Read first
- `games/gnome-theft-auto/src/sports/types.ts`: `SPORTS_SAVE_KEY`, `SportsSave`, `SportsStore` (the contract).
- `games/gnome-theft-auto/src/court/types.ts` (`COURT_PROBES`) and `src/skate/types.ts` (`SKATE_PROBES`, `LineId`,
  `SKATE_LINES`).
- `games/gnome-theft-auto/src/golf/save.ts` and `golf/save.test.ts`: the model to copy (parse with defaults and
  clamping, merge, a store over `Pick<Storage, 'getItem' | 'setItem'>`, `notifySaveChanged()` from `../saveHook` after
  writes, try/catch round storage, in-memory without storage).
- `games/gnome-theft-auto/src/city/probes.ts` lines 1-70 (`SAVED`, `withStore`, `storage()`, the golf rows).
- `games/gnome-theft-auto/src/saveIO.ts` (`GTA_SAVE_KEYS`, the `gta-golf-v1` row) and `src/cloudSave.ts` (`MERGES`,
  the `gta-golf-v1` row).

## Change
- `src/sports/save.ts`:
  - `emptySportsSave(): SportsSave` (all counts 0, `boardOwned` false, `lines` {}).
  - `parseSportsSave(raw: string | null): SportsSave`: defaults for every missing/invalid field, counts clamped to
    integers >= 0, `lines` kept only for known `LineId`s (from `SKATE_LINES`) with positive finite numbers; bad JSON ->
    empty.
  - `mergeSportsSave(a: string, b: string): string`: counts max, `boardOwned` OR, `bestCombo`/`bestMargin` max, line
    bests the lower time per id (union of ids).
  - `createSportsStore(storage?): SportsStore` exactly per the interface: `recordGame` (games + 1; wins + 1 when won;
    threes/dunks added; swishBeaten + 1 when won and swish; bestMargin = max(margin) when won), `recordShootMake`,
    `setBoardOwned`, `recordOllie`, `recordCombo(points)` (true and stored when > bestCombo), `recordFullRail`,
    `recordLine(id, time)` (linesDone + 1; true and stored when no best or time < best). Reads the key once, writes
    after every change and calls `notifySaveChanged()`.
- `src/sports/save.test.ts`: parse defaults and bad input, merge rules, each store method, a round trip through a fake
  storage over a Map.
- `src/city/probes.ts` `SAVED`: rows after the golf rows, reading `createSportsStore(storage() ?? undefined).data()`
  through `withStore` like them, keys from the constants: `COURT_PROBES.games` (jam.games), `.wins`, `.threes`,
  `.dunks`, `.swishBeaten`, `.shootMakes`; `SKATE_PROBES.boardOwned` (1/0), `.ollies`, `.bestCombo`, `.lines`
  (skate.linesDone), `.fullRails`; and one row per line: key `` `skate-line-${id}` `` for each `SKATE_LINES` id (1 when
  that line has a best time, else 0).
- `src/saveIO.ts` `GTA_SAVE_KEYS`: `'gta-sports-v1'` after the golf row with a comment like the others.
- `src/cloudSave.ts` `MERGES`: `'gta-sports-v1': mergeSportsSave`.
- `src/saveIO.test.ts`: only if it lists every key in a fixture, add the new key the same way.

## Contract
`SportsStore` exactly as in sports/types.ts; export `emptySportsSave`, `parseSportsSave`, `mergeSportsSave`,
`createSportsStore(storage?: Pick<Storage, 'getItem' | 'setItem'>)`; probe keys exactly as listed; save key
`gta-sports-v1`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/sports/save.test.ts src/saveIO.test.ts src/cloudSave.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
court/, skate/ (other workers), quests.
