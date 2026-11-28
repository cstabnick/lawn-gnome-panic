Epic: E17 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first.

## Goal
The pure rules of the four Loamdeep mole jobs exist and are tested: starting a shift, the clock, each job's actions,
stars and pay. No DOM, no three.js (the runtime that calls these is another worker's).

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`MoleJobId`, `HallId`, `LampTunnelId`, `LAMP_TUNNELS`,
  `LOAMDEEP.spots.rootDrops` keys, `LOAMDEEP.lamps`, `HALL_NAMES`)
- `games/gnome-theft-auto/src/societies/loamdeep/jobs.ts` (yours: the stub with the exported signatures)

## Change
- `games/gnome-theft-auto/src/societies/loamdeep/jobs.ts`: keep every exported name and signature of the stub; fill the
  bodies; add the functions below. Pure functions returning NEW objects (never mutate the argument).
  - `MOLE_JOBS`: keep the numbers; write each `blurb` (one friendly sentence, e.g. roots: "Carry bundles from Rootway
    Hall to whichever hall is short. Gently. They are someone's supper." lamps: "Light every lamp down one tunnel
    before the taper burns out." post: "Sort the post into the right pigeonholes for Mister Sift." dig: "Dig three tidy
    nooks in Hearth Hall's wall. Not too shallow. Not so deep the ceiling joins you.").
  - `startShift(job, rand)`: as the stub, plus: `lamps` picks `tunnel = LAMP_TUNNELS[floor(rand() * 3)]` and
    `lit = [false, false, false, false]`; other jobs `tunnel: null, lit: []`; `rootTo` starts null.
  - `tickShift(s, dt)`: as the stub (an over shift stays over and its clock stops).
  - `takeRoots(s: MoleShift, rand: () => number): MoleShift`: Root Run only, only when `rootTo === null` and not over:
    `rootTo` = one of the five keys of `LOAMDEEP.spots.rootDrops` picked by `rand`, never the same hall twice in a row
    (remember the previous one in a new optional field `lastTo?: Exclude<HallId, 'rootway'> | null`).
  - `dropRoots(s: MoleShift, hall: Exclude<HallId, 'rootway'>): MoleShift`: when `hall === s.rootTo`: `done + 1`,
    `lastTo = rootTo`, `rootTo = null`, `over = true` when `done` reaches `units`. Any other hall: unchanged object.
  - `lightLamp(s: MoleShift, i: number): MoleShift`: Lamplighter only, `0 <= i < 4`, not over, not already lit: sets
    `lit[i] = true`, `done` = number lit, `over = true` when all four are lit.
  - `recordSorting(s: MoleShift, sorted: number, misses: number): MoleShift`: Post Sorting: `done = min(sorted, units)`,
    `misses`, `over = true`.
  - `recordNook(s: MoleShift, good: boolean): MoleShift`: Dig a Nook: good -> `done + 1`, else `misses + 1`; `over = true`
    when `done + misses >= units`.
  - `shiftStars(s)`: 0 when `done === 0`. Else `frac = done / units`; `stars = 1 + Math.floor(frac * 3)` (1..4);
    `+1` when `frac === 1 && s.left >= MOLE_JOBS[s.job].seconds * 0.25`; `-Math.floor(s.misses / 2)`; clamp to 1..5.
  - `shiftPay(s)`: 0 when `done === 0`, else `Math.round(done * MOLE_JOBS[s.job].payPerUnit * shiftStars(s) / 3)`.
  - `jobLine(s: MoleShift): string`: the HUD strip text, e.g. "Root Run 2/4 · to Hearth Hall · 1:41", "Lamplighter 3/4
    · 0:12", "Post Sorting", "Dig a Nook 1/3". Use `HALL_NAMES` (capitalise the first letter) and m:ss.
- `games/gnome-theft-auto/src/societies/loamdeep/jobs.test.ts` (new): vitest cases for every function above with a
  seeded `rand` (e.g. a mulberry32 or a fixed sequence), including: a full Root Run reaches 4/4 and is over; dropping at
  the wrong hall changes nothing; never the same hall twice in a row (50 draws); lighting the same lamp twice counts once;
  time running out marks over and freezes `left` at 0; stars 0 for nothing done, 5 for a fast clean full shift, fewer
  with misses; pay is 0 when nothing was done.

## Contract
The stub's exports keep their signatures (other workers import `MOLE_JOBS`, `MoleShift`, `startShift`, `tickShift`,
`shiftStars`, `shiftPay`); new exports exactly as named above.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/loamdeep/jobs.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (the runtime, the UIs, config.ts).
