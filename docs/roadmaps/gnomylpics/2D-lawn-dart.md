Epic: 2 (the six events)
Depends on: none

## Goal
`games/gnomylpics/src/minigames/oly-lawn-dart.ts` is **Lawn Dart Javelin**: alternate A/D to run up, then HOLD the throw button to raise the aim angle and RELEASE to throw a giant lawn dart before the red foul line. Run speed and a good angle (~40°) give distance; crossing the line without throwing is a foul. Best of two throws; longest wins.

## Owns
- `games/gnomylpics/src/minigames/oly-lawn-dart.ts` (replace the template)
- `games/gnomylpics/src/minigames/oly-lawn-dart.test.ts` (new)

## Read first
- `games/gnomylpics/src/olympic/run.ts`, `rank.ts`, `taps.ts` (note `actOn: 'release'` and `holdS`), `field.ts` — doc comments.
- `packages/party/src/types.ts` — the contract.

## Rules (constants at the top)
```ts
const FOUL = 20;              // foul line z
const MIN_THROW_Z = 2;        // throws before this are ignored
const THROW_BASE = 8, THROW_PER_RUN = 1.6; // throw speed = THROW_BASE + run speed * THROW_PER_RUN (m/s)
const ANGLE_MIN = 15, ANGLE_MAX = 75, AIM_S = 0.9; // holding AIM_S seconds sweeps the angle MIN..MAX
const G = 9.8, H0 = 1.8;
const THROWS = 2, PAUSE = 1.5;
// meta.maxSeconds = 40
```
- `angleFromHold(holdS) = clamp(ANGLE_MIN + (holdS / AIM_S) * (ANGLE_MAX - ANGLE_MIN), ANGLE_MIN, ANGLE_MAX)` (module function, used by the view).
- Flight: `vy = v sin a`, `vh = v cos a`, `fly = (vy + Math.sqrt(vy*vy + 2*G*H0)) / G`, land z = `relZ + vh * fly`, mark = `round2(landZ - FOUL)` (the dart sticks, no skid).
- meta: `id: 'oly-lawn-dart'`, `title: 'Lawn Dart Javelin'`, `goal: 'Throw the lawn dart the farthest past the red line in two tries.'`, `controls: 'Alternate A and D to run; hold THROW (Space or the button) to aim, release to throw before the red line.'`.
- `interface I { taps: number; slips: number; acts: number; angle: number }`.
- `type Ph = 'run' | 'fly' | 'wait' | 'done'`. Seat: `{ r: Runner; z: number; ph: Ph; t0: number; relZ: number; vel: number; ang: number; fly: number; n: number; marks: (number | null)[]; skill: number; cpuZ: number; cpuAng: number }`. `S = { t: number; seats: Seat[] }`.
- CPU plan in `init` and per new throw: `cpuZ = FOUL - 0.5 - (1 - skill) * 4 * rng()`, `cpuAng = round2(40 + (rng() * 2 - 1) * (1 - skill) * 20)`.
- `step`: `s.t += dt`; each seat:
  - `const newActs = stepRunner(seat.r, inputs[k], RUN, dt)` (always).
  - **run**: `z += r.v * dt`. If `newActs > 0 && z >= MIN_THROW_Z` → throw: `ang = clamp(inputs[k]?.angle ?? 40, ANGLE_MIN, ANGLE_MAX)` rounded to 2, `vel = round2(THROW_BASE + r.v * THROW_PER_RUN)`, `relZ = z`, `fly` (round3), `ph = 'fly'`, `t0 = s.t`. Else if `z > FOUL` → foul: `marks.push(null)`, `ph = 'wait'`, `t0 = s.t`.
  - **fly**: the thrower jogs to a stop: `z = Math.min(FOUL - 0.2, z + r.v * dt)`. When `s.t - t0 >= fly + 0.3`: `marks.push(mark)`, `ph = 'wait'`, `t0 = s.t`.
  - **wait**: when `s.t - t0 >= PAUSE`: `n += 1`; `n >= THROWS` → 'done'; else reset `z = 0`, `r.v = 0`, `ph = 'run'`, new CPU plan.
  - always `advanceCpu(seat.r, seat.skill, dt, rng)`.
- `cpu(s, seat, rng)`: `const i = cpuTaps(r, skill, rng)`; `acts = (ph === 'run' && z >= cpuZ) ? r.acts + 1 : r.acts`; return `{ ...i, acts, angle: cpuAng }`. (Outside 'run', taps may keep coming; harmless.)
- `result`: all 'done', or `timeUp` → `placesFrom(seats.map(x => bestMark(x.marks)), true)`.

## View
- Scene: `addSkyAndLights`; `addGrass(scene, 80, 160, -20)`; `addTrack(scene, FOUL + 5, { z0: -5 })`; `addLine(scene, FOUL, 0xff1744, 0.2)`; `addDistanceMarkers(scene, FOUL + 10, FOUL + 90, 10, FOUL)`; a few white arc lines on the grass are optional.
- Dart prop per seat (in this file): a lawn dart ~1.2 m long: grey metal shaft (CylinderGeometry 0.03), a heavy cone tip (ConeGeometry 0.07, 0.25) at the front, three fins in the seat colour at the back (thin boxes at 120° steps). Build it pointing along +z in a Group.
- `racers = addRacers(scene, seats)`; local clock (common rules). Gnome: `poseRacer(racers[k], laneX(k), 0, easedZ, ph === 'run' ? r.v : 0, dt)`. While running, the dart is held at the gnome's shoulder (gnome pos + (0.25, 1.3, 0)), pointing forward; for MY seat while `tapper.actDown`, tilt it up to `angleFromHold(tapper.holdS)` so I see my aim.
- **fly**: `tau = clamp(clock - t0, 0, fly)`, position `(laneX(k), H0 + vy*tau - 0.5*G*tau*tau, relZ + vh*tau)`, pitch along the velocity (`rotation.x = -Math.atan2(vy - G*tau, vh)`). After `tau >= fly` it stays stuck in the ground at its landing pose (keep the last transform; slightly sunk, y 0.15). A dart that landed stays there for the rest of the round (wait/done); a new throw uses a new dart mesh or moves the old one only after the next throw starts.
- Camera: run → focus my gnome, offset `(-8, 4, -6)`; my dart in flight/landed → focus the dart, offset `(-7, 5, -10)`.
- Aim meter (my seat, while `tapper.actDown`): a vertical bar at bottom-right showing `angleFromHold(holdS)` from 15° to 75° with a green band at 35-45° and the number `NN°`.
- Board rows: best `'xx.xx m'`, else `'FOUL'` if any foul, else '—', plus `  (${Math.min(n + 1, 2)}/2)`. My banners: foul → 'FOUL!' ('#ff5252'); landed → `\`${mark.toFixed(2)} m\`` ('#ffd54f'); slip → 'STUMBLE!'. Hint in run: `'Alternate A/D — hold THROW to aim, release before the line'`.
- `tapper = createTapper(ui, { actLabel: 'HOLD TO THROW', actOn: 'release' })`. In the view keep `let lastActs = 0, angle = 40;` and
  `input(pad) { const c = tapper.sample(pad); if (c.acts > lastActs) { lastActs = c.acts; angle = Math.round(angleFromHold(tapper.holdS) * 100) / 100; } return { ...c, angle }; }`. `dispose() { tapper.dispose(); }`.

## Done when / out of scope
Apply the common slice rules (pasted with this issue). In `oly-lawn-dart.test.ts`, besides `testMinigame(def)`, one `it`: `angleFromHold` is exported for the test only if you prefer (exporting extra named helpers from the slice file is allowed) and `angleFromHold(0) === 15`, `angleFromHold(10) === 75`; and `runHeadless(def, 1).timeUp === false`. Check once that CPU marks are mostly 30-70 m. No edits outside the two owned files.
