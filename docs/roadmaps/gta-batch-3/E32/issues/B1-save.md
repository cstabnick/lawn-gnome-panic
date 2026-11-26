Epic: E32-B (nine holes, parallel build)
Depends on: none · Worker: haiku

First read `docs/roadmaps/gta-batch-3/E32/issues/_env.md` (environment + the foundation facts).

## Goal
The golf save (`gta-golf-v1`) handles nine holes and stays compatible with E15 four-hole saves.

## Read first
- `games/gnome-theft-auto/src/golf/save.ts` (whole file, 155 lines)
- `games/gnome-theft-auto/src/golf/save.test.ts`
- `games/gnome-theft-auto/src/golf/types.ts`: `GolfSave`, `GolfStore`, `HOLES`

## Change
- `src/golf/save.ts`:
  - `parseGolfSave`: read `bestNine` with `isStrokes` (like `bestRound`). `best` keeps mapping over `HOLES` (9 entries),
    so an old 4-entry array fills indices 0..3 and leaves 4..8 null (already true; keep it).
  - `mergeGolfSave`: `bestNine: lower(...)` is already there; keep `bestRound` merged too.
  - `recordRound(total)`: `rounds += 1`; set `bestNine` when lower or null. **Do not touch `bestRound` any more.**
  - Update the header comment: nine holes, `bestNine`, `bestRound` = legacy four-hole best.
- `src/golf/save.test.ts`: fix the two failing tests (expected objects need `bestNine` and 9-long `best`), and add:
  - "an E15 four-hole save keeps its records": parse
    `{"v":1,"boardBroken":true,"holesPlayed":7,"parHoles":2,"rounds":1,"best":[4,3,6,5],"bestRound":18,"aces":0,"ballsFound":["lb-1"],"molehills":[]}`
    → `best` equals `[4,3,6,5,null,null,null,null,null]`, `bestRound` 18, `bestNine` null, other fields kept.
  - "recordRound writes bestNine, not bestRound": a store from that save, `recordRound(40)` then `recordRound(38)` →
    `bestNine` 38, `bestRound` still 18, `rounds` 3.
  - `recordHole(8, 3, 4)` sets `best[8]` to 3; `recordHole(9, ...)` is ignored.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/save.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `save.ts` / `save.test.ts`.

## Out of scope
Every other file (types.ts is the lead's; runtime, app, hud belong to other issues).
