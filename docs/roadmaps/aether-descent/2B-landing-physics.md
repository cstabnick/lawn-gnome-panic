Epic: 2 Snowboard Descenders
Depends on: none

## Environment
Working directory: `C:\Users\cstab\Documents\gaming` (Windows, Git Bash). If `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Do not run `git commit`.
Other workers are editing other files in `games/aether-board` at the same time (world.ts, tricks.ts, view/*,
descent/*). Touch only the files listed under Change.

## Goal
1. Hitting a hazard (tree, rock or spikes) bails you with a reason per kind and pushes you clear, so you never get
   stuck bailing again and again inside one.
2. The Descent landing perks work: saved landings (`ASSIST.landSaves`), wider tolerance on big airs
   (`ASSIST.bigAirTol`), and clean landings right next to a hazard are flagged as close calls (`near: true`).
Free ride: `ASSIST` defaults (0, 1, 1) and no hazards, so nothing changes there.

## Read first
- `games/aether-board/src/config.ts`: `ASSIST`, `BIG_AIR_S`, `CLOSE_CALL_M`, `TUNE`, `PhysEvent` (the `land` event has
  an optional `near?: boolean`, and there is a new `{ e: 'saved'; reason: string }`).
- `games/aether-board/src/physics.ts`: `hitHazard`, `spikeBail`, the call after `switch (p.mode)` in `stepPlayer`,
  and the landing judgement (search `// Judge the landing.`: it sets `reason` for 'Board still flipping',
  'Over-rotated', 'Landed sideways', then `if (reason) { ...bail... }`, then the clean landing that pushes
  `{ e: 'land', ... }`). Also `yawOf`, `forwardOf`, `resetAir`.
- `games/aether-board/src/world.ts`: `Hazard { kind: 'spike' | 'tree' | 'rock'; x; y; z; r; h; island }`.
- `games/aether-board/src/physics.hazard.test.ts`: existing hazard tests (yours to extend).

## Change
- `games/aether-board/src/physics.ts`:
  - `hitHazard` returns the hit `Hazard` or null (instead of a boolean). `spikeBail(p, hz, ev)`: reason by kind:
    spike `'Spiked'`, tree `'Hit a tree'`, rock `'Hit a rock'`. After setting bail mode, push the rider clear:
    horizontal vector from `hz` to `p.pos` (if near zero, use minus the velocity's horizontal direction), place
    `p.pos.x/z` at `hz.r + 0.8` m from the hazard centre along it, and remove the velocity component pointing into the
    hazard (`v -= min(0, v·n) n` with n the outward unit vector), then scale by TUNE.bailKeep as now.
  - Landing judgement:
    - Tolerances: `const big = p.airT >= BIG_AIR_S ? ASSIST.bigAirTol : 1;` use `TUNE.landFlipTol * big` and
      `Math.cos(TUNE.landYawTol * big)` where those are used (keep the cos clamped sensibly: `Math.min(TUNE.landYawTol * big, 1.45)`).
    - Save: if `reason` is set and `ASSIST.landSaves > 0`: `ASSIST.landSaves -= 1`, push `{ e: 'saved', reason }`,
      then make it a clean landing: `p.trick = null` (no trickDone for it), set `p.flip` to the nearest whole turn
      (`flips * 2π`), point `p.heading` along the landing travel direction `vT` (or its reverse if the board was
      closer to switch), and clear `reason` so the normal clean-landing path runs (the land event then has
      `perfect: false`: force it false for a saved landing).
    - Close call: on the clean landing, `near` = some hazard has horizontal distance from `p.pos` less than
      `hz.r + CLOSE_CALL_M` and `|p.pos.y - hz.y| < hz.h + 3`. Add `near` to the pushed land event (only set the field
      when true, so free-ride events look the same).
- `games/aether-board/src/physics.hazard.test.ts`: add tests; keep the existing ones passing (they use kind
  'spike' and expect reason 'Spiked').

## Contract
No exported signature changes in physics.ts. Event shapes exactly as in config.ts. Reasons exactly `'Spiked'`,
`'Hit a tree'`, `'Hit a rock'`. Tests must reset `ASSIST` to `{ landSaves: 0, bigAirTol: 1, closeCall: 1 }` after
changing it (other test files share the module).

## Done when
- `cd games/aether-board && npx vitest run src/physics.hazard.test.ts` passes, with new tests:
  1. Riding into a tree (kind 'tree', r 0.8, h 12) 10 m ahead gives a 'Hit a tree' bail, and over the next 4 s
     there is exactly one bail (pushed clear, no repeat).
  2. A landing that would bail ('Landed sideways': set up a player in 'air' just above flat ground of
     `generateWorld(3)`'s first island with heading 90° off its velocity) bails with `landSaves` 0, and with
     `ASSIST.landSaves = 1` gives a `saved` event, a `land` event, no bail, and `ASSIST.landSaves` back to 0.
  3. A clean landing within 3 m of a hazard's edge has `near: true`; one 30 m away has no `near`.
- `cd games/aether-board && npx vitest run src/physics.test.ts src/tricks.test.ts` still pass.
- `cd games/aether-board && npx tsc --noEmit -p .` passes (errors in files you did not touch are another worker's
  mid-edit; rerun once, then report them rather than fixing them).

## Out of scope
config.ts, world.ts, tricks.ts, view/*, descent/*, app.ts.
