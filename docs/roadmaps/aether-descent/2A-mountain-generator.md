Epic: 2 Snowboard Descenders
Depends on: none

## Environment
Working directory: `C:\Users\cstab\Documents\gaming` (Windows, Git Bash). If `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Do not run `git commit`.
Other workers are editing other files in `games/aether-board` at the same time (physics.ts, tricks.ts, view/*,
descent/*). Touch only the files listed under Change.

## Goal
Descent hills become Descenders-style snowy mountains instead of open slopes: pine forests along the edges, glades of
trees to weave through, forks where a tree strip splits the run into a safe line and a trick line, rock gardens, and
cliff drops (some ride-around). The sliders drive it: hazard = trees / rocks / spikes, steep = grade and cliffs,
tricky = kickers, rails and the trick line. Free ride (`generateWorld(seed)` with no `hill`) stays byte-identical.

## Read first
- `games/aether-board/src/world.ts`:
  - `HazardKind`, `Hazard { kind; x; y; z; r; h; island }`, `Drop { al; h; half; lead }`, `Island.drops`,
    `dropHeight(dr, al, sd)` and where `surfaceY` adds it (already written: do not change heights code).
  - `generateWorld`: inside the per-run loop: `at(along, side)` (a point on this run), `span` (features stay in
    `[-span, span]` along the run), `ra` (half length), `r` (half width), `st`, `isl`, the Descent variables `hz`, `sp`,
    `tr`, `hrnd` (Descent-only random), and the existing spike block (`// Hazards (Descent only)`), which you will
    replace. Also the jump-link code where `anchorX` / `anchorZ` (where a jump lands on the next run) are computed.
- `games/aether-board/src/world.descent.test.ts`: the free-ride fingerprint test (must keep passing unchanged) and the
  `descent hills` tests (yours to update).

## The free-ride rule
When `hill` is undefined, every `rnd()` call must happen in the same order with the same arguments, and nothing new
may be added to the world. All new randomness uses `hrnd`, never `rnd`. Every new block sits inside `if (hill) { }`.
Run `npx vitest run src/world.descent.test.ts` after every edit.

## Change
- `games/aether-board/src/world.ts`, only inside `generateWorld` (plus private helpers):
  Order inside each run (Descent only), after the existing side kickers and exit kicker:
  1. **Fork** (when `hz >= 1 || tr >= 2`, with chance `0.35 + 0.08 * (hz + tr)` capped at 0.85): a section
     `forkLen = 90 + 50*hrnd()` m long starting at `along0` in `[-span, span - forkLen]`. The trick side is
     `tside = hrnd() < 0.5 ? -1 : 1`. Add `2 + Math.round(tr / 2)` extra small kickers on the trick side at
     `side = tside * (0.3 + 0.25*hrnd()) * r`, spread along the section (≥ 25 m apart), same shape as the side
     kickers (`len 6..8, width 6..8, height 1.8..2.6 + 0.3*tr, yaw ≈ run yaw ± 0.2`, `big: false`). The centre
     strip (trees) is added in step 4.
  2. **Cliffs** (`isl.drops`): count `Math.round((0.25 * sp + 0.1 * tr) * (0.6 + 0.8 * hrnd()))`. Each:
     `al` in `[-span + 30, span - 30]`, `h = 2.5 + 0.8 * sp + 1.5 * hrnd()`, `lead = 18 + 10 * hrnd()`,
     `half = r * (hrnd() < 0.35 + 0.08 * sp ? 1.05 : 0.3 + 0.35 * hrnd())` (full-width cliffs get likelier with
     steep). Reject (retry up to 6) if `al` is within 40 m of another cliff, or a kicker's start or end lies within
     `[al - lead - 10, al + 25]` along the run, or a landing point (see below) lies on this run within 35 m.
     Push to `isl.drops`. For a partial cliff the whole band is centred on the run (side 0).
  3. **Rails**: the existing rail loop runs after the cliffs. In Descent, skip a rail (do not push it) if any of its
     points has `dropHeight(...) !== 0` for some drop of this run (compute `al`/`sd` of the point in the island frame:
     `al = (x - isl.cx) * isl.dx + (z - isl.cz) * isl.dz`, `sd = (x - isl.cx) * isl.dz - (z - isl.cz) * isl.dx`).
     So move the cliff step before the rail loop, inside `if (hill)`.
  4. **Hazards**, replacing the spike block. Common placement test `free(x, z, clear)`: false if `surfaceY` is null;
     within `k.len / 2 + 8` m of a kicker middle (as the spike block does) or within 14 m of a kicker's lip
     (`k.x + sin(k.yaw)*k.len`, `k.z + cos(k.yaw)*k.len`) and the 30 m straight ahead of the lip; within 6 m of a rail
     point of this run; within `clear` m of another hazard; within 25 m of a landing point; on a cliff's ledge or in
     the 20 m below its face (`dropHeight` region extended 20 m downstream, across `|sd| < half + 8`).
     y = `surfaceY(isl, x, z)` at placement (cliffs are already in, so y is right).
     - **Edge forests** (always in Descent, even hazard 0): along both sides every 7..11 m (step from hrnd), trees at
       `|side|` in `[0.82r, 0.97r]`, `along` in `[-ra + 10, ra - 10]`; drop a tree with chance `0.25` (gaps). Trees:
       `{ kind: 'tree', r: 0.7 + 0.3*hrnd(), h: 9 + 7*hrnd() }`, `clear` 4. (`at()` points outside the ellipse give
       `surfaceY` null and are skipped.)
     - **Glades** (hz >= 1): `Math.round(hz * 0.5 * st / 3.4 + hrnd())` sections, each `30 + 30*hrnd()` m long at a
       random along in span: trees scattered across `|side| < 0.8r` with target count `round((4 + 3*hz) * len / 40)`,
       `clear` `max(6, 11 - hz)` m (gaps to weave), up to 10 tries each.
     - **Fork strip** (if step 1 made a fork): trees every 5..7 m along the fork section at `|side| < 5` m (one or two
       per row), `clear` 3. Keep the fork's own kickers' clearance rules.
     - **Rock gardens** (hz >= 2): `Math.round((hz - 1) * 0.4 * st / 3.4 + hrnd() * 0.6)` gardens, each 4..8 rocks
       within 12 m of a centre at `|side| < 0.7r`: `{ kind: 'rock', r: 1.4 + 1.6*hrnd(), h: 1.2 + 1.4*hrnd() }`,
       `clear` 4.
     - **Spikes** (hz >= 3, aether flavour): the old count formula times 0.4, `clear` 12, same shape as before
       (`{ kind: 'spike', r: 1.6 + 1.0*hrnd(), h: 1.6 + 0.8*hrnd() }`).
  - **Landing points**: keep a `const landings: { x: number; z: number }[] = []`. In the jump-link code, when a jump's
    `anchorX` / `anchorZ` is computed (Descent only), push it; the next run's features (cliffs and hazards) then
    respect it. The gate jump at the last run needs nothing.
  - Remove nothing from free ride. Keep `theme` as already set (`hill ? 'snow' : 'aether'`).
- `games/aether-board/src/world.descent.test.ts`: update the `descent hills` block; do not edit the free-ride test.

## Contract
`generateWorld(seed, hill?)` signature unchanged. Every Hazard has `kind`, finite x/y/z, `island` = its run index,
and these ranges: spike r 1.6..2.6 h 1.6..2.4; tree r 0.7..1.0 h 9..16; rock r 1.4..3.0 h 1.2..2.6. Every Drop has
`h > 0`, `lead > 0`, `half > 0`. Other workers read these (physics collides, the view draws trees, rocks, spikes).

## Done when
- `cd games/aether-board && npx vitest run src/world.descent.test.ts` passes: the untouched free-ride test, plus
  tests over seeds 1, 2, 3 and every `{hazard,steep,tricky} ∈ {0,5}³` (runs 5): 5 islands; finite gate; field ranges
  above; with hazard 0 every hazard is a tree with `|side| >= 0.8r` in its island's frame; hazard 5 has rocks and
  more trees than hazard 0; steep 5 has at least one drop in total over the three seeds and steep 0 with tricky 0 has
  none; no hazard lies within 6 m of any rail point.
- `cd games/aether-board && npx vitest run src/physics.test.ts` still passes.
- `cd games/aether-board && npx tsc --noEmit -p .` passes (errors in files you did not touch are another worker's
  mid-edit; rerun once, then report them rather than fixing them).

## Out of scope
`surfaceY`, `dropHeight`, `groundAt`, types in world.ts (already done), physics.ts, view/*, descent/*, app.ts,
config.ts.
