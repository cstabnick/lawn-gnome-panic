Epic: E32-B (nine holes, parallel build)
Depends on: none · Worker: sonnet (general-purpose)

First read `docs/roadmaps/gta-batch-3/E32/issues/_env.md` and `docs/roadmaps/gta-batch-3/E32/issues/_canon.md`.

## Goal
A side quest from Dame Peony, **Peony's Promise** (`sq-hedgeworth-peonys-promise`): she finally opens holes 4 to 8; the
player walks through the Turn Gate, cuts the opening ribbon at hole 4's green, and plays one of the new holes. Plus the
quest probe `golf-bottom-holes`.

## Read first
- `games/gnome-theft-auto/src/quests/golfQuests.ts` (224 lines): the four E15 side quests (shape: id, title, giver,
  rewardAcorns, prereq, hoa, cutscene dialogue lines with `look`, objectives `probe` / `visit`, outro, doneText).
- `games/gnome-theft-auto/src/city/probes.ts` around line 58 (the golf probes reading `createGolfStore`).
- `games/gnome-theft-auto/src/quests/stages/golf.ts` (the stage list naming which quests use each stage).
- `games/gnome-theft-auto/src/quests/unlocks.test.ts` and any test that lists every probe id or quest id (grep
  `golf-molehills` and `sq-hedgeworth-members-cup` in `src/` and `tools/quest-sim.mjs` to find every list that needs
  the new ids, including the quest sim's probe solvers).
- `games/gnome-theft-auto/src/golf/types.ts`: `GOLF_QUESTS.promise`, `GOLF_PROBES.bottomHoles`, `TURN_GATE`, `HOLES`
  (index 4 = hole 4, green (-1272, 862)), `PEOPLE_SPOTS.peony`, `HEDGEWORTH_CAST`.

## Change
- `src/city/probes.ts`: `[GOLF_PROBES.bottomHoles]`: the number of entries among `best[4..8]` that are not null.
- `src/quests/golfQuests.ts`: the quest `GOLF_QUESTS.promise`, giver `peony`, title `Peony's Promise`, reward 400
  acorns, prereq `GOLF_QUESTS.membersCup` (the last E15 golf side quest; check that is right), `hoa: 'off'`.
  - Intro dialogue (4-6 lines, Peony's voice: polite as a method, proud, the mortgage, never quite admitting the card
    was a joke): she announces holes 4 to 8, built by Thrift in the Bottom Garden, and asks the player to cut the
    ribbon "since nobody else turned up".
  - Objectives: (1) `visit` the Turn Gate (`TURN_GATE.x`, `TURN_GATE.z + 4`, radius 4) with a toast; (2) `visit` the
    ribbon at hole 4's green front (-1259, 860), radius 3, toast `Snip. The fourth hole is open. Applause, from the
    birds.`; (3) `probe` `golf-bottom-holes` count 1, text `Play one of the new holes (4 to 8)`, `at` hole 4's tee.
  - Outro (2-3 lines: Peony, then maybe Thrift), doneText.
  - Search lore first (`npm run lore -- find peony`, `find hedgeworth`) and keep her consistent with
    `docs/lore/entries/apocrypha/peony-gravelrake.md`.
- `src/quests/stages/golf.ts`: add the new quest to the Peony stage's `usedBy` (if the stage list has one for her).
- Any list/test that must know every probe or quest id (found by your grep): add the new ids. The quest sim
  (`tools/quest-sim.mjs`) must be able to solve the new probe the same way it solves `golf-par-holes`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/quests src/city` passes (run them; report failures outside your files).
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for your files.

## Out of scope
golf/ (all of it), lore files (another issue writes R-226 and the entries; mention the quest id in your report).
