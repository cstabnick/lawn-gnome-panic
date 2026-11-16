Epic: 1 (shared modules and the party-only capability)
Depends on: none

## Goal
`games/gnomylpics/src/olympic/run.ts` is the real alternating-tap model shared by the Sprint, Triple Jump, Mower Toss and Lawn Dart events, with unit tests. It is pure (no DOM, no three) and its state is plain JSON.

## Read first
- `games/gnomylpics/src/olympic/run.ts`: the stub. Every exported name, type, constant and doc comment is final; fill in the bodies only (you may add private helpers).

## Change
- `games/gnomylpics/src/olympic/run.ts`:
  - `stepRunner(r, input, p, dt): number`
    1. If `input` is not null:
       - `newSlips = max(0, input.slips - r.slips)`; if > 0: `r.v *= p.stumbleMult` (once, however many), `r.stun = p.stumbleS`, `r.slips = input.slips`.
       - `newTaps = max(0, input.taps - r.taps)`; `r.taps = max(r.taps, input.taps)`. If `r.stun <= 0` (checked AFTER the slip handling above, so a slip in this step blocks this step's taps): `r.v = min(p.max, r.v + newTaps * p.boost)`. While stunned the taps are consumed but give nothing.
       - `newActs = max(0, input.acts - r.acts)`; `r.acts = max(r.acts, input.acts)`.
    2. `r.v = max(0, r.v - p.drag * dt)`; `r.stun = max(0, r.stun - dt)`.
    3. Return `newActs` (0 when input is null).
  - `cpuTaps(r, skill, rng): TapInput`: if `r.cpuWait > 1 / 60` return `{ taps: r.taps, slips: r.slips, acts: r.acts }` (no tap due). Otherwise a tap is due: with chance `mistake = lerp(0.08, 0.01, skill)` (`lerp(a, b, t) = a + (b - a) * t`) return `slips: r.slips + 1` (taps unchanged), else `taps: r.taps + 1`. `acts` is always `r.acts`. Call `rng()` exactly once when a tap is due, never when none is.
  - `advanceCpu(r, skill, dt, rng)`: `r.cpuWait -= dt`; if `r.cpuWait <= 0`: `r.cpuWait = lerp(0.15, 0.085, skill) * (0.85 + rng() * 0.3)`. (So a CPU taps about 6.5-12 times a second.)
  - Keep `newRunner` and `cpuSkill` as they are.
- `games/gnomylpics/src/olympic/run.test.ts` (new, vitest: `import { describe, expect, it } from 'vitest'`):
  - 10 alternating taps (input counters rising by 1 per step, dt 1/60) with RUN give `v` close to `10 * 1.1 - 10 * 2.4 / 60` (toBeCloseTo, 1 digit) and never above `RUN.max`.
  - a slip after reaching speed multiplies v by 0.4 (minus one step of drag) and sets stun; taps during the next 0.4 s add nothing; after 0.5 s taps add speed again.
  - `stepRunner` returns 2 when acts jumps from 0 to 2, then 0 on the next step with the same input; returns 0 for a null input.
  - a CPU (skill 0.7, `mulberry32(1)` from `@lawn/party` as rng) driven for 10 s of steps — each step: `const i = cpuTaps(r, 0.7, rng); stepRunner(r, i, RUN, 1/60); advanceCpu(r, 0.7, 1/60, rng);` — ends with `r.taps` between 60 and 130, `r.v > 6`, and `JSON.parse(JSON.stringify(r))` equal to `r`.
  - the same CPU loop with the same seed twice gives identical runners (determinism).

## Contract
The exported API of `run.ts` exactly as in the stub (names, parameter lists, return types, `RUN`, `SPIN` values). Other workers code against it right now.

## Done when
- `cd games/gnomylpics && npx vitest run src/olympic/run.test.ts` passes.
- `npx tsc --noEmit -p games/gnomylpics` shows no errors in `src/olympic/run.ts` or `src/olympic/run.test.ts`.

## Out of scope
Every other file. In particular `src/olympic/taps.ts`, `src/olympic/field.ts`, `src/olympic/rank.ts` and `src/minigames/**` (other workers).
