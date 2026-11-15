## How to write a Gnomylpics slice (common to issues 2A-2F)

- Your slice file `games/gnomylpics/src/minigames/<id>.ts` exists as the scaffold's "Mash" template. **Replace its whole content.** Keep `export default def;` and the `meta.id` given in your issue; `meta.game` is `'gnomylpics'`.
- `src/minigames/index.ts` already imports your file. Do not edit it.
- Structure the file as: constants block (all tuning numbers, named, at the top) → `interface S`, `interface I`, per-seat interface → pure helpers → `const def: MinigameDef<S, I> = { meta, init, step, cpu, result, createView }` → `export default def;`.
- Imports you will use: `import * as THREE from 'three';`, `import { STEP_S, type MinigameDef, type SeatIndex } from '@lawn/party';`, from `'../olympic/run'`, `'../olympic/rank'`, `'../olympic/taps'`, `'../olympic/field'` (see the environment section for their APIs; read the files for doc comments).
- Every seat gets a `skill` drawn in `init` with `cpuSkill(rng)` from `run.ts`. Call CPU bookkeeping (`advanceCpu`, timers, CPU targets) for **every** seat in `step`, human or not: a human who leaves mid-round becomes a CPU (the runner then feeds `cpu()` inputs) and must keep playing.
- A human's input is `null` until it sends one: treat null as "no taps, no acts".
- `result(s, timeUp)`: return places as soon as every seat is done (or the event's own end condition), and always when `timeUp`. Use `placesFrom` / `bestMark` from `rank.ts`.
- Keep the state small: round stored floats you do not need exactly with `Math.round(x * 1000) / 1000` if the test reports a state near 2 KB. No `undefined` fields (use `null`), no `NaN`/`Infinity` (guard divisions).
- The view (`createView`):
  - Build the scene with `field.ts` (`addSkyAndLights`, `addGrass`, `addTrack`, `addLine`, `addDistanceMarkers`, `addRacers`, `poseRacer`, `followCamera`, `createBoard`). Make your own small props (a mower, a dart) from three primitives in the slice file.
  - `render(s, dt)` runs on every screen with the host's state or a 15/s snapshot: ease display positions (`a += (b - a) * (1 - Math.exp(-dt * 15))`); for flights, keep a local clock (`clock += dt`; if `Math.abs(s.t - clock) > 0.25` snap `clock = s.t`, else `clock += (s.t - clock) * Math.min(1, dt * 3)`) and compute positions from the times stored in `s`.
  - Board: `board.set(k, text)` for every seat each frame; `board.banner(...)` on events of MY seat (`ctx.mySeat`, null when watching); `board.hint(...)` for the one-line instruction.
  - Camera: follow my seat (or seat 0 when watching).
  - `dispose()`: dispose the tapper (and anything with a listener). The runner disposes the scene and ui.
- Test: create `games/gnomylpics/src/minigames/<id>.test.ts` with exactly
  ```ts
  import { testMinigame } from '@lawn/party/testkit';
  import def from './<id>';

  testMinigame(def);
  ```
  It plays 4 CPUs headless for seeds 1..5 and checks: valid meta (maxSeconds 15..90), places valid, state plain JSON and < 2048 bytes, deterministic. Add 1-3 small `it(...)` checks of your own rules in the same file if cheap (e.g. "a slip slows the runner").
- Done when (for every slice issue):
  - `cd games/gnomylpics && npx vitest run src/minigames/<id>.test.ts` passes.
  - `npx tsc --noEmit -p games/gnomylpics` shows **no errors in your files** (others may be mid-edit).
  - CPUs finish the event in the headless test well before `maxSeconds` on most seeds (print `runHeadless(def, seed).seconds` from `@lawn/party/testkit` in a throwaway check if unsure, then remove it).
- Never run `vite`, `npm run build`, `npm install` or `npm test` for the whole workspace (others are editing). Never edit `src/olympic/**`, `src/minigames/index.ts`, `play.ts`, `minigames.test.ts`, another slice, or `packages/**`.
