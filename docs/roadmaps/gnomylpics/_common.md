## Environment (common to every Gnomylpics issue)

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnome-games-party` (a git worktree; stay inside it, never `cd` to the main checkout). Use the Bash tool (Git Bash). If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. **Never run `npm install`.** Never run `git commit`, `git stash` or any branch command. Never start `vite` or any server.
- Other workers are editing other files in `games/gnomylpics` at the same time. Edit only the files your issue owns. `npx tsc --noEmit -p games/gnomylpics` type-checks the whole game: errors in files you do not own are someone else's work in progress; only errors in your files must be zero.
- `games/gnomylpics` is a **party-only** game: it has no game of its own; it only surfaces Gnome Party minigames ("slices") from `src/minigames/`. Three.js 0.187 (`import * as THREE from 'three'`), TypeScript strict.
- The slice contract (`packages/party/src/types.ts`, read it if your issue writes a slice) in short:
  - `init(seats, rng)`, `step(s, inputs, dt, rng)` (fixed dt = 1/60 s, host only), `cpu(s, seat, rng)`, `result(s, timeUp)` are **pure**: no DOM, no `window`, no three objects in the state, randomness only from the `rng` argument (never `Math.random` there).
  - State `S` and input `I` are plain JSON (no `undefined`, `NaN`, `Infinity`, class instances). `S` < 2 KB as JSON.
  - Input is a **level** sampled 15 times a second online: one-off actions are cumulative **counters** the view increments, never one-frame `true`s.
  - `result` returns `null` while playing, else `places[seat]` (0 = 1st, ties share). It must return places when `timeUp` is true.
  - `createView(ctx)` gets `{ scene, camera, renderer, ui, seats, mySeat }` and returns `{ render(s, dt), input(pad, s), dispose?() }`. `render` runs every frame on every screen with the host's live state or the latest snapshot (15/s): smooth positions yourself (`obj.position.lerp(target, 1 - Math.exp(-dt * 15))`) or compute them from times stored in `s`. Modules must not touch the DOM at import time.
  - CPU memory (timers, targets) lives in `S`; `step` updates it.
- Shared modules in `games/gnomylpics/src/olympic/` (do not edit unless your issue owns them):
  - `rank.ts`: `placesFrom(scores: (number|null)[], higherIsBetter): number[]` (null = foul/no mark, last, shared) and `bestMark(marks, higherIsBetter = true): number | null`.
  - `run.ts`: the alternating-tap model (`TapParams`, `RUN`, `SPIN`, `TapInput {taps, slips, acts}`, `Runner {v, stun, taps, slips, acts, cpuWait}`, `newRunner()`, `stepRunner(r, input, p, dt): newActs`, `cpuSkill(rng)`, `cpuTaps(r, skill, rng): TapInput`, `advanceCpu(r, skill, dt, rng)`).
  - `taps.ts`: `createTapper(ui, { actLabel?, actOn?: 'press'|'release', tapButtons? })` → `{ sample(pad): TapInput, lastSide, lastSlipAt, actDown, holdS, dispose() }`.
  - `field.ts`: `LANE_W`, `laneX(k)`, `css(color)`, `addSkyAndLights`, `addGrass`, `addTrack`, `addLine`, `addDistanceMarkers`, `textSprite`, `addRacers` → `Racer[]`, `poseRacer(r, x, y, z, vz, dt)`, `followCamera(camera, focus, offset, dt, rate?)`, `createBoard(ui, seats, mySeat)` → `{ el, set(seat, text), banner(text, color?, ms?), hint(text) }`.
- World convention: events run along **+z** from z = 0; lane k is at x = `laneX(k)`; y is up; 1 unit = 1 metre.
