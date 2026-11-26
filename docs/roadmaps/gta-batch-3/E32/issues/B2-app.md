Epic: E32-B (nine holes, parallel build)
Depends on: none · Worker: haiku

First read `docs/roadmaps/gta-batch-3/E32/issues/_env.md` (environment + the foundation facts).

## Goal
The Gnomlet's Hedgeworth app shows the real nine-hole card.

## Read first
- `games/gnome-theft-auto/src/golf/golfApp.ts` (114 lines)
- `games/gnome-theft-auto/src/golf/golfApp.test.ts`
- `games/gnome-theft-auto/src/golf/types.ts`: `HOLES`, `HOLE_ORDER`, `COURSE_PAR`, `GolfSave` (`bestNine`, `bestRound`)

## Change
- `src/golf/golfApp.ts`:
  - Intro line: `Nine holes, at last. Par ${COURSE_PAR}.` (replaces "Four holes. Nine on the card.").
  - The table lists holes in `HOLE_ORDER` (card numbers 1..9), not array order. Add an "Out" row is NOT needed; add a
    final row `Total | | ${COURSE_PAR} | <sum of yards> | <sum of bests if all nine have a best, else '–'>`.
  - `detailText` and the "Best round" stat use `save.bestNine` (text `Best nine 38 (+4)` / `No card yet`).
  - If `save.bestRound !== null`, add one more stats line: `Old four-hole card: ${save.bestRound}` (an E15 save's record).
  - Keep the 44 px button, the `startRound(0)` call and the rest.
- `src/golf/golfApp.test.ts`: update the failing "shows the four holes and the stats" test to nine rows in card order
  (row 4 is "Peony's Promise", row 9 is "The Ninth") plus the Total row, and test the old four-hole line appears only
  when `bestRound` is set. Keep the other tests.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/golfApp.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your two files.

## Out of scope
save.ts, hud.ts, runtime.ts, types.ts, app.ts (other issues / the lead).
