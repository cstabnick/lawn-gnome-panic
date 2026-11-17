Epic: 2 Snowboard Descenders
Depends on: none

## Environment
Working directory: `C:\Users\cstab\Documents\gaming` (Windows, Git Bash). If `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Do not run `git commit`.
Other workers are editing other files in `games/aether-board` at the same time (world.ts, physics.ts, tricks.ts,
view/*). Touch only the files listed under Change.

## Goal
The three landing perks (Guardian Gnome, Soft Knees, Daredevil) set the shared `ASSIST` tuning, the overlay flashes
"SAVED!" when a landing is saved, and the hill cards tell you what terrain to expect.

## Read first
- `games/aether-board/src/config.ts`: `ASSIST { landSaves; bigAirTol; closeCall }`.
- `games/aether-board/src/descent/perks.ts`: `PERKS` (the three new entries already have name, desc, max) and
  `applyPerks` (restores TUNE from BASE then applies perk levels).
- `games/aether-board/src/descent/ui.ts`: `flashSave` stub in the returned object, `flashCrash` (copy its approach:
  the `.dsc-crash` element, class restart via `void el.offsetWidth`), `showPicker` (how a card is built).
- `games/aether-board/src/descent/types.ts`: `HillParams { hazard; steep; tricky; runs }`.
- `games/aether-board/src/descent/run.test.ts`: existing applyPerks tests.

## Change
- `games/aether-board/src/descent/perks.ts`: in `applyPerks`, after restoring TUNE: set
  `ASSIST.bigAirTol = 1 + 0.15 * L(softKnees)` and `ASSIST.closeCall = 1 + 0.5 * L(daredevil)`. Do not touch
  `ASSIST.landSaves` here (the app refills it at the start of each hill from guardianGnome).
  So `applyPerks({})` gives `bigAirTol 1`, `closeCall 1`.
- `games/aether-board/src/descent/ui.ts`:
  - `flashSave(reason)`: the same big flash as flashCrash, text `SAVED!` in lime (`PALETTE.lime`), with a smaller
    second line `{reason}` (e.g. "Landed sideways") under it; add a `.dsc-crash.save` colour class.
  - In each hill card (`showPicker`), under the sliders, one dim line of terrain tags derived from the sliders:
    hazard >= 1 'GLADES', hazard >= 2 'ROCK GARDENS', hazard >= 3 'SPIKES', steep >= 2 'CLIFFS', steep >= 4
    'BIG DROPS', tricky >= 2 'TRICK LINE', (hazard >= 1 or tricky >= 2) 'FORKS'; joined with ' · ', or 'OPEN SLOPE'
    when none. Always 'PINE FORESTS' first.
- `games/aether-board/src/descent/run.test.ts`: add tests for the ASSIST values from applyPerks.

## Contract
`DescentUi.flashSave(reason: string): void` as declared. `applyPerks(perks)` signature unchanged. Tests must leave
ASSIST at its defaults (`applyPerks({})` at the end).

## Done when
- `cd games/aether-board && npx vitest run src/descent/run.test.ts` passes, including new tests:
  `applyPerks({ softKnees: 2, daredevil: 1 })` gives `ASSIST.bigAirTol` 1.3 and `ASSIST.closeCall` 1.5 (toBeCloseTo),
  `applyPerks({})` gives 1 and 1.
- `cd games/aether-board && npx tsc --noEmit -p .` passes (errors in files you did not touch are another worker's
  mid-edit; rerun once, then report them rather than fixing them).

## Out of scope
config.ts, types.ts, run.ts, app.ts, physics.ts, tricks.ts, world.ts, view/*.
