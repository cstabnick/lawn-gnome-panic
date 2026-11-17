Epic: 2 Snowboard Descenders
Depends on: none

## Environment
Working directory: `C:\Users\cstab\Documents\gaming` (Windows, Git Bash). If `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Do not run `git commit`.
Other workers are editing other files in `games/aether-board` at the same time (world.ts, physics.ts, view/*,
descent/*). Touch only the files listed under Change.

## Goal
Risky landings score: a clean landing right next to a hazard (the physics marks the `land` event `near: true`) adds a
"Close Call" line to the combo, worth `CLOSE_CALL_POINTS * ASSIST.closeCall` points (the Daredevil perk raises
`ASSIST.closeCall`). A long air (airT >= 1.5 s) also adds "Big Air" for 150 points. Free ride never has `near`, but
Big Air applies there too: that is intended.

## Read first
- `games/aether-board/src/config.ts`: `ASSIST`, `CLOSE_CALL_POINTS`, the `land` PhysEvent (`near?: boolean`, `airT`).
- `games/aether-board/src/tricks.ts`: `createCombo`, its `event()` switch, `case 'land':` (uses `add(name, points)`).
- `games/aether-board/src/tricks.test.ts`: how combo tests feed events and read `view()`.

## Change
- `games/aether-board/src/tricks.ts`: in `case 'land':` after the existing lines (before `if (ev.perfect) ...` or
  after it, your choice, but before `if (lines.length > 0) linkLeft = LINK_S;`):
  `if (ev.near) add('Close Call', Math.round(CLOSE_CALL_POINTS * ASSIST.closeCall));`
  `if (ev.airT >= 1.5) add('Big Air', 150);`
  Make sure `add` starts a combo if none is running the same way other land lines do (read how `Perfect` behaves
  when it is the only line and match it).
  Also: a `saved` PhysEvent needs no scoring; make sure the switch ignores it (no exhaustive-check error).
- `games/aether-board/src/tricks.test.ts`: add tests.

## Contract
No exported signature changes. Line names exactly `'Close Call'` and `'Big Air'`.

## Done when
- `cd games/aether-board && npx vitest run src/tricks.test.ts` passes, with new tests: a land event with `near: true`
  adds a 'Close Call' line worth 250 points; with `ASSIST.closeCall = 2` it is worth 500 (reset ASSIST.closeCall to 1
  afterwards); a land with `airT: 1.6` adds 'Big Air'; a land without near and short air adds neither.
  Existing tricks tests that check exact combo lines or points after a landing with `airT >= 1.5` may need their
  expectation updated: change only such expectations, and say which in your report.
- `cd games/aether-board && npx tsc --noEmit -p .` passes (errors in files you did not touch are another worker's
  mid-edit; rerun once, then report them rather than fixing them).

## Out of scope
physics.ts, config.ts, world.ts, view/*, descent/*, app.ts, hud.ts.
