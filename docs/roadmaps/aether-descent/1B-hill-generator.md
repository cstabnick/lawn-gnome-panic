Epic: 1 Descent
Depends on: none

## Environment
Working directory: `C:\Users\cstab\Documents\gaming` (Windows, Git Bash). If `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Do not run `git commit`.
Other workers are editing other files in `games/aether-board` at the same time (physics.ts, view/*, descent/*,
app.ts). Touch only the files listed under Change.

## Goal
`generateWorld(seed, hill)` builds a Descent hill from three sliders (hazard, steep, tricky; integers 0..5) and a
run count, including aether-spike hazards. `generateWorld(seed)` without `hill` stays byte-for-byte the same world
as today (a test pins it).

## Read first
- `games/aether-board/src/world.ts`: `generateWorld` (the loop over runs: bumps, side kickers, exit kicker, rails,
  decor, then link and placement of the next run), `Hazard`, `World.hazards`, `mulberry32`, `surfaceY`.
- `games/aether-board/src/descent/types.ts`: `HillParams { hazard; steep; tricky; runs }`.
- `games/aether-board/src/world.descent.test.ts`: the free-ride fingerprint test. It must keep passing unchanged.

## Change
- `games/aether-board/src/world.ts`: only inside `generateWorld` (and new private helpers). Remove the `void hill;`
  line once `hill` is used.
- `games/aether-board/src/world.descent.test.ts`: add a new `describe('descent hills')` block; do not edit the
  existing free-ride test or its fingerprints.

### The free-ride rule
When `hill` is undefined, every `rnd()` call must happen in the same order with the same arguments as now, and every
number must come out the same. Write each change as `hill ? <new> : <old expression unchanged>`. Descent-only random
choices (links, hazards) use a second generator `const hrnd = mulberry32((seed ^ 0x5bd1e995) >>> 0);` so they never
touch `rnd`. Run the fingerprint test after every edit.

### Slider effects (only when `hill` is given; h = hill.hazard, s = hill.steep, k = hill.tricky)
- Number of runs: `hill.runs` instead of `RUNS` (the last run still jumps to the gate).
- Links (each run except the last): with `const r = hrnd()`: `r < 0.12 + 0.05*h + 0.04*k` → 'jump', else if
  `r < that + 0.08 + 0.05*k` → 'pipe', else 'join'. The first run (i = 0) is always 'join'.
- Steep: the first run's slope `0.2` becomes `0.12 + 0.04*s`; each next run's `nslope = range(0.16, 0.24)` becomes
  `range(0.10, 0.14) + 0.045*s`. The jump landing `drop = range(6, 12)` becomes `range(6, 12) * (1 + 0.25*s)`, and the
  planning speed `PLAN_SPEED` (32) becomes `30 + 1.6*s` for that hill (use a local variable, do not change the const).
- Hazard narrows runs: `nr = range(56, 72)` becomes `range(56, 72) * (1 - 0.05*h)`.
- Tricky:
  - side kickers: count `Math.round(range(1.5, 2.5) * st * (0.4 + 0.35*k))`, height `range(1.8, 2.6) + 0.3*k`.
  - rails: count `Math.max(k > 0 ? 1 : 0, Math.round(range(0.5, 1.1) * st * (0.3 + 0.35*k)))`.
  - ley-lines: on every run when k >= 3, on odd runs (`i % 2 === 1`, as now) when k is 1 or 2, none when k is 0.
- Hazards (after the rails of each run, all randoms from `hrnd`): count
  `Math.round(h * (1.0 + 0.6*hrnd()) * st / 3.4)`. For each, up to 8 tries: a point at `along` in `[-span, span]`
  (the same `span` the loop computes) and `side` in `[-0.7r, 0.7r]`, via the loop's `at(along, side)`. Reject a try if
  it is within `k.len / 2 + 8` m of any kicker's middle (`k.x + sin(k.yaw)*k.len/2`, `k.z + cos(k.yaw)*k.len/2`) on
  this run, within 6 m of any point of a rail added on this run, or within 12 m of another hazard. Keep it:
  `{ x, z, y: surfaceY(isl, x, z) ?? isl.baseY, r: 1.6 + 1.0*hrnd(), h: 1.6 + 0.8*hrnd(), island: i }` pushed to
  `hazards`. (y must be the ground height; bumps are already added before this point, and later runs do not change
  it.)
- Hazard 0 → no hazards at all.

## Contract
`export function generateWorld(seed: number, hill?: HillParams): World` (signature unchanged). Every Hazard has
finite x, y, z, `r` 1.6..2.6 and `h` 1.6..2.4, and `island` = the run index it sits on. Other workers read
`World.hazards` (physics collides with them, the view draws them).

## Done when
- `cd games/aether-board && npx vitest run src/world.descent.test.ts` passes: the existing free-ride test, plus new
  tests that for seeds 1, 2, 3 and every hill in
  `{hazard,steep,tricky} ∈ {0,5}³` with runs 5: there are 5 islands, the gate position is finite, every island's
  baseY is finite, hazards is empty when hazard = 0 and not empty when hazard = 5, every hazard field is finite;
  and a steep-5 hill's average island slope is larger than a steep-0 hill's.
- `cd games/aether-board && npx vitest run src/physics.test.ts` still passes (free ride rides as before).
- `cd games/aether-board && npx tsc --noEmit -p .` passes (errors in files you did not touch are another worker's
  mid-edit; rerun once, then report them rather than fixing them).

## Out of scope
Everything except `generateWorld` in world.ts (heights, `groundAt`, types) and the two files above. Do not edit
physics.ts, view/*, descent/*, app.ts, config.ts.
