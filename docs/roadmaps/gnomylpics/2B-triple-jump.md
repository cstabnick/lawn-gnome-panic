Epic: 2 (the six events)
Depends on: none

## Goal
`games/gnomylpics/src/minigames/oly-triple-jump.ts` is **Triple Gnome Jump**: alternate A/D to sprint down the runway, press JUMP to take off before the red foul line, then press JUMP again each time you land (hop, skip, jump). Timing keeps your speed. Best of two attempts; longest mark wins.

## Owns
- `games/gnomylpics/src/minigames/oly-triple-jump.ts` (replace the template)
- `games/gnomylpics/src/minigames/oly-triple-jump.test.ts` (new)

## Read first
- `games/gnomylpics/src/olympic/run.ts`, `rank.ts`, `taps.ts`, `field.ts` — doc comments.
- `packages/party/src/types.ts` — the contract.

## Rules (constants at the top)
```ts
const RUNWAY = 22;            // foul line z
const ZONE = 4;               // take-off counts only when z >= RUNWAY - ZONE
const MULT = [0.5, 0.42, 0.62];   // phase distance = vj * MULT[j] (hop, skip, jump)
const AIR = [0.5, 0.45, 0.7];     // seconds in the air per phase
const HEIGHT = [0.6, 0.5, 0.9];   // view only: arc height per phase
const PERFECT = 0.15, GOOD = 0.3; // landing timing windows, seconds either side of the landing
const GOOD_KEEP = 0.85;           // speed kept on a GOOD landing (PERFECT keeps 1.0)
const ATTEMPTS = 2, PAUSE = 1.6;  // seconds between attempts
// meta.maxSeconds = 40
```
- meta: `id: 'oly-triple-jump'`, `title: 'Triple Gnome Jump'`, `goal: 'Jump the farthest from the red line in two tries.'`, `controls: 'Alternate A and D to run, JUMP (Space or the button) before the red line, then JUMP each time you land.'`.
- `I = { taps, slips, acts }` (TapInput).
- `type Ph = 'run' | 'air' | 'wait' | 'done'`. Seat:
  `{ r: Runner; z: number; ph: Ph; j: number; t0: number; z0: number; z1: number; vj: number; actT: number; att: number; marks: (number | null)[]; msg: string; skill: number; cpuTake: number; cpuOff: number }`
  (`j` = air phase 0..2, `t0` = phase start time, `z0`/`z1` = phase from/to, `vj` = speed carried into the jumps, `actT` = `s.t` of the latest unconsumed act or -1, `att` = attempt index, `msg` = last result word for the view: '', 'PERFECT', 'GOOD', 'FLOP', 'FOUL' or the mark like '14.20 m').
  `S = { t: number; seats: Seat[] }`.
- CPU plan, drawn in `init` and at each new attempt (in step, with the step's rng): `cpuTake = RUNWAY - 0.3 - (1 - skill) * 3 * rng()`, `cpuOff = (rng() * 2 - 1) * (1 - skill) * 0.45`.
- `step`: `s.t += dt`; for each seat k:
  - `const newActs = stepRunner(seat.r, inputs[k], RUN, dt)` (always; outside 'run' the speed is unused). If `newActs > 0`: `seat.actT = s.t`.
  - **run**: `seat.z += seat.r.v * dt`. If `seat.actT >= 0 && seat.z >= RUNWAY - ZONE && seat.z <= RUNWAY` → take off: `vj = r.v`, `j = 0`, `ph = 'air'`, `t0 = s.t`, `z0 = z`, `z1 = z + vj * MULT[0]`, `actT = -1`. Else if `seat.actT >= 0` (pressed too early) → `actT = -1` (ignored). Else if `seat.z > RUNWAY` → foul: `marks.push(null)`, `msg = 'FOUL'`, `ph = 'wait'`, `t0 = s.t`.
  - **air**: `landT = t0 + AIR[j]`.
    - j < 2: if `actT >= landT - GOOD && s.t >= landT` (an act in the window, decided at landing or when it arrives): `d = Math.abs(actT - landT)`; `keep = d <= PERFECT ? 1 : GOOD_KEEP`; `msg = d <= PERFECT ? 'PERFECT' : 'GOOD'`; next phase: `z0 = z1`, `vj *= keep`, `j += 1`, `t0 = landT`, `z1 = z0 + vj * MULT[j]`, `actT = -1`. Else if `actT >= 0 && actT < landT - GOOD` → `actT = -1` (too early, ignored). Else if `s.t > landT + GOOD` → flop: mark = `round2(z1 - RUNWAY)`, `marks.push(mark)`, `msg = 'FLOP'`, `z = z1`, `ph = 'wait'`, `t0 = s.t`.
    - j === 2: when `s.t >= landT`: mark = `round2(z1 - RUNWAY)`, `marks.push(mark)`, `msg = \`${mark.toFixed(2)} m\``, `z = z1`, `ph = 'wait'`, `t0 = s.t`.
  - **wait**: when `s.t - t0 >= PAUSE`: `att += 1`; if `att >= ATTEMPTS` → `ph = 'done'`; else reset `z = 0`, `r.v = 0`, `ph = 'run'`, `actT = -1`, `msg = ''`, new CPU plan.
  - always: `advanceCpu(seat.r, seat.skill, dt, rng)`.
- `cpu(s, seat, rng)`: `const i = cpuTaps(me.r, me.skill, rng)`; acts: in 'run' and `me.z >= me.cpuTake` and `me.actT < 0` → `i.acts = me.r.acts + 1`; in 'air' with `me.j < 2 && me.actT < 0 && s.t >= me.t0 + AIR[me.j] + me.cpuOff` → `i.acts = me.r.acts + 1`. Otherwise `i.acts = me.r.acts`. In 'wait'/'done' return taps unchanged too (`taps: me.r.taps, slips: me.r.slips`).
- `result`: when every seat is 'done', or `timeUp`: `placesFrom(seats.map(x => bestMark(x.marks)), true)`.

## View
- Scene: `addSkyAndLights`; `addGrass(scene, 60, 120, -20)`; `addTrack(scene, RUNWAY + 13, { z0: -5 })`; a lighter take-off zone plane from `RUNWAY - ZONE` to `RUNWAY` across the lanes (`0xe08a5a`, y 0.013); `addLine(scene, RUNWAY, 0xff1744, 0.2)`; a sand pit plane `0xe6c27a` across the lanes from `RUNWAY + 8` to `RUNWAY + 24` (y 0.014); `addDistanceMarkers(scene, RUNWAY + 8, RUNWAY + 20, 2, RUNWAY)`.
- `racers = addRacers(scene, seats)`. Keep a local clock (common rules). Gnome position per seat:
  - run/wait/done: `(laneX(k), 0, eased z)`, speed `r.v` (0 in wait/done).
  - air: `u = clamp01((clock - t0) / AIR[j])`, `z = z0 + (z1 - z0) * u`, `y = Math.sin(Math.PI * u) * HEIGHT[j]`, speed `vj`.
  `poseRacer(racers[k], laneX(k), y, z, speed, dt)`.
- Landing marks: when a seat's `marks.length` grows with a real mark, put a small dark disc (CircleGeometry 0.18, `0x8a6d3b`) flat in the sand at `(laneX(k), 0.02, RUNWAY + mark)`.
- Camera: `followCamera(camera, new THREE.Vector3(0, 1, myZ + 2), new THREE.Vector3(-10, 4.5, -4), dt)`.
- Board rows: `best !== null ? \`${best.toFixed(2)} m\` : (marks.length ? 'FOUL' : '—')` + `  (${Math.min(att + 1, 2)}/2)`.
- My seat: when `msg` changes to non-empty → `board.banner(msg, msg === 'FOUL' || msg === 'FLOP' ? '#ff5252' : '#ffd54f', 1000)`; when `tapper.lastSlipAt` changes → `board.banner('STUMBLE!', '#ff5252', 600)`. Hint: run → `'Alternate A/D — JUMP before the red line'`, air → `'JUMP as you land!'`, otherwise ''.
- `tapper = createTapper(ui, { actLabel: 'JUMP' })`; `input(pad) { return tapper.sample(pad); }`; `dispose() { tapper.dispose(); }`.

## Done when / out of scope
Apply the common slice rules (pasted with this issue). In `oly-triple-jump.test.ts`, besides `testMinigame(def)`, one `it`: with `runHeadless(def, 1)` from `@lawn/party/testkit` the 4 CPUs finish (`timeUp === false`). Also make sure (print once, then remove) that CPU best marks are mostly 10-18 m. No edits outside the two owned files.
