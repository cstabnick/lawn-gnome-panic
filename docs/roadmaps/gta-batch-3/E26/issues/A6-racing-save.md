Epic: A (foundations) — E26 street racing
Depends on: none
Agent: haiku-worker

(Paste `_env.md` here.)

## Goal
The racing save `gta-racing-v1` works (best times per track, finish counts, wins, wager winnings), is part of the
game's save export and cloud save, and two devices' saves merge sensibly.

## Read first
- `games/gnome-theft-auto/src/streetRace/save.ts`: the stub with the final exported signatures (keep them).
- `games/gnome-theft-auto/src/winter/save.ts`: a similar store over localStorage to copy the style from.
- `games/gnome-theft-auto/src/saveIO.ts` (CRLF file): `GTA_SAVE_KEYS` list (add a line), around line 37.
- `games/gnome-theft-auto/src/cloudSave.ts` (CRLF file): `MERGES` record (add an entry) and `GROWS` set.
- `games/gnome-theft-auto/src/saveIO.test.ts`: whether it lists every key (add a sample for the new key if it does).

## Change
- `src/streetRace/save.ts`: implement.
  - `parseRacingSave(raw)`: JSON `{ v: 1, best, runs, pickupWins, onlineWins, wagerWon }`; anything invalid → empty;
    drop best/runs entries whose key is not in `TRACK_IDS` (`../raceTrack/tracks`) or whose value is not a positive
    finite number.
  - `mergeRacingSaves(a, b)`: per track the lower best and the higher runs; the higher of each count. Returns a JSON
    string with `v: 1`.
  - `createRacingStore(storage = globalThis.localStorage ?? null)`: reads `RACING_SAVE_KEY` once (try/catch), keeps
    the data in memory, writes back after every change (try/catch; storage null = memory only).
    `recordFinish(trackId, time)`: runs+1; best when time < old best (or none) → `{ best: true }`.
    `notePickupWin(acorns)`: pickupWins+1, wagerWon += max(0, acorns). `noteOnlineWin()`: onlineWins+1.
- `src/saveIO.ts`: add `'gta-racing-v1', // streetRace/save.ts: race best times, runs, wins (E26)` to GTA_SAVE_KEYS
  (keep CRLF line endings: edit with a tool that preserves them, and check `git diff` shows only your lines).
- `src/cloudSave.ts`: `'gta-racing-v1': mergeRacingSaves, // streetRace/save.ts: lowest best per track, counts grow`
  (import it from `./streetRace/save`), and add the key to `GROWS`. Keep CRLF.
- `src/streetRace/save.test.ts` (new): parse garbage → empty; record a finish → best; slower → not best; merge picks
  lower best and higher counts; store with a fake storage (`{ getItem, setItem }` over a Map) persists and reloads.
- If `saveIO.test.ts` or `cloudSave.test.ts` enumerate every key, extend them for the new key.

## Contract
The signatures in save.ts as they are now (RACING_SAVE_KEY, RacingSave, emptyRacingSave, parseRacingSave,
mergeRacingSaves, RacingStore, createRacingStore).

## Done when
- `npx vitest run src/streetRace/save.test.ts src/saveIO.test.ts src/cloudSave.test.ts` passes and
  `npx tsc --noEmit -p .` passes (games/gnome-theft-auto).
- `git diff --stat` shows small diffs for saveIO.ts and cloudSave.ts (no whole-file rewrite).

## Out of scope
Every other file under `streetRace/`, `app.ts`.
