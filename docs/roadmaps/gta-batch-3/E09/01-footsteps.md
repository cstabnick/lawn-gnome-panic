Epic: E09 step 1 (sound, voice, animation, direction)
Depends on: none
Worker: Haiku

## Environment
Read `docs/roadmaps/gta-batch-3/E09/_env.md` first (worktree, node, CRLF rule, checks).

## Goal
Footsteps are about 3 dB quieter by default (L31: "make footsteps a little quieter") and a little less identical step to
step, without touching the vehicle sounds, the World slider or the master volume.

## Read first
- `games/gnome-theft-auto/src/sound/recipes/world.ts`: `pitch()`, `level()` (cap 0.3, `base * (0.6 + 0.6 * info.param)`),
  the eleven `step*` recipes (`stepAsphalt` ... `stepWater`) and `STEP_DUR`.
- `games/gnome-theft-auto/src/sound/watchLife.ts`: `playerFeet` (~line 102) and `gnomeStep` (NPC steps, `gain: 0.5`).
- `games/gnome-theft-auto/src/sound/synth.ts`: `burst(c, out, t, dur, type, f0, f1, peak, q?, attack?)`, `tone(...)`.
- `games/gnome-theft-auto/src/sound/recipes/recipes.test.ts`: every recipe must start and stop all its sources by
  `t + returned duration + 0.05`.

## Change
- `src/sound/recipes/world.ts`:
  - Add `const STEP_LEVEL = 0.7;` (about -3 dB) with a one-line comment "L31: footsteps sit under the world; 0.7 is
    about -3 dB". `level(info, base)` becomes `Math.min(0.21, base * STEP_LEVEL * (0.6 + 0.6 * info.param))`.
  - Variety: add a helper `heelToe(info)` returning `{ dt: number; second: number }` from `info.rand`: when
    `info.rand > 0.55`, a second, softer contact 0.025..0.045 s after the first (`dt = 0.025 + (info.rand - 0.55) * 0.044`,
    `second = 0.45`), else `{ dt: 0, second: 0 }`. In `stepAsphalt`, `stepRock`, `stepGravel`, `stepDirt` and `stepGrass`
    play the main burst again at `t + dt` with the peak multiplied by `second` when `second > 0` (same filter, a 10 %
    higher centre). Keep each recipe's returned duration covering the extra hit (`return Math.max(old, dt + old)`).
  - Do not change the other world sounds in this file.
- `src/sound/watchLife.ts`: NPC steps `gain: 0.5` -> `gain: 0.4`. The player's steps: walking `param` stays 0.5,
  sprint stays 1. Nothing else.

## Contract
- Recipe ids and signatures unchanged (`STEP_SOUNDS` in `src/sound/ids.ts`). No new slider, no change to `bus.ts`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/sound/recipes/recipes.test.ts src/sound/watchLife.test.ts` passes.
- `npx tsc --noEmit -p .` passes.
- `git diff --stat` shows only `world.ts` and `watchLife.ts`.

## Out of scope
`src/sound/bus.ts`, `src/sound/ambience.ts`, `src/sound/recipes/regions.ts`, `src/sound/ids.ts` (other issues own them),
vehicle and engine sounds.
