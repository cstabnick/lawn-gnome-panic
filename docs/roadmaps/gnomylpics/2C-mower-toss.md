Epic: 2 (the six events)
Depends on: none

## Goal
`games/gnomylpics/src/minigames/oly-mower-toss.ts` is **Mower Toss**, the gnome hammer throw: alternate A/D to spin a push mower round and round, then press THROW while the swinging angle needle is near 45°. Faster spin = farther. Best of two throws; longest wins.

## Owns
- `games/gnomylpics/src/minigames/oly-mower-toss.ts` (replace the template)
- `games/gnomylpics/src/minigames/oly-mower-toss.test.ts` (new)

## Read first
- `games/gnomylpics/src/olympic/run.ts` (SPIN params), `rank.ts`, `taps.ts`, `field.ts` — doc comments.
- `packages/party/src/types.ts` — the contract.

## Rules (constants at the top)
```ts
const SPIN_S = 5;           // seconds of spinning; then the mower is let go automatically
const MIN_SPIN_S = 0.3;     // a THROW earlier than this is ignored
const PERIOD = 1.4;         // the angle needle sweeps MIN..MAX..MIN in this time
const NEEDLE_MIN = 10, NEEDLE_MAX = 80; // degrees
const REL_PER_SPIN = 1.5;   // launch m/s per rad/s of spin (SPIN.max 22 → 33 m/s)
const G = 9.8, H0 = 1.0;    // gravity, release height (m)
const SKID = 0.15;          // extra skid distance = horizontal speed * SKID, slid over SKID_S
const SKID_S = 0.5;
const THROWS = 2, PAUSE = 1.5;
// meta.maxSeconds = 35
```
- `needle(since) = NEEDLE_MIN + (NEEDLE_MAX - NEEDLE_MIN) * (0.5 - 0.5 * Math.cos(2 * Math.PI * since / PERIOD))` (degrees; `since` = seconds since the spin began). Export nothing extra; keep it a module function so the view uses the same one.
- Flight from speed v and angle a (deg): `vy = v sin a`, `vh = v cos a`, `fly = (vy + Math.sqrt(vy*vy + 2*G*H0)) / G`, `dist = round2(vh * fly + vh * SKID)`.
- meta: `id: 'oly-mower-toss'`, `title: 'Mower Toss'`, `goal: 'Throw the mower the farthest in two tries.'`, `controls: 'Alternate A and D to spin, then THROW (Space or the button) when the needle is near 45°.'`.
- `I = { taps, slips, acts }` (TapInput).
- `type Ph = 'spin' | 'fly' | 'wait' | 'done'`. Seat: `{ r: Runner; ph: Ph; t0: number; ang: number; vel: number; fly: number; dist: number; n: number; marks: number[]; skill: number; cpuRel: number; cpuTol: number }` (`t0` = start of the current phase, `n` = throw index). `S = { t: number; seats: Seat[] }`.
- CPU plan, drawn in `init` and at each new throw: `cpuRel = 2.6 + skill * 1.6 + rng() * 0.6` (seconds of spinning before it looks for the release), `cpuTol = 4 + (1 - skill) * 20` (degrees from 45 it accepts).
- `step`: `s.t += dt`; each seat:
  - `const newActs = stepRunner(seat.r, inputs[k], SPIN, dt)` (always).
  - **spin**: `since = s.t - t0`. If `(newActs > 0 && since >= MIN_SPIN_S) || since >= SPIN_S` → release: `ang = round2(needle(since))`, `vel = round2(r.v * REL_PER_SPIN)`, compute `fly` (round3) and `dist`, `ph = 'fly'`, `t0 = s.t`.
  - **fly**: when `s.t - t0 >= fly + SKID_S`: `marks.push(dist)`, `ph = 'wait'`, `t0 = s.t`.
  - **wait**: when `s.t - t0 >= PAUSE`: `n += 1`; `n >= THROWS` → 'done'; else `ph = 'spin'`, `t0 = s.t`, `r.v = 0`, new CPU plan.
  - always `advanceCpu(seat.r, seat.skill, dt, rng)`.
- `cpu(s, seat, rng)`: in 'spin': `i = cpuTaps(r, skill, rng)`; `since = s.t - t0`; if `since >= cpuRel && Math.abs(needle(since) - 45) <= cpuTol` → `i.acts = r.acts + 1`. Other phases: `{ taps: r.taps, slips: r.slips, acts: r.acts }`.
- `result`: all 'done', or `timeUp` → `placesFrom(seats.map(x => bestMark(x.marks)), true)`.

## View
- Scene: `addSkyAndLights`; `addGrass(scene, 80, 200, -20)`; per lane a throwing circle (a white `RingGeometry(0.9, 1.0, 32)` flat at `(laneX(k), 0.02, 0)`); `addDistanceMarkers(scene, 10, 120, 10)`.
- A mower prop per seat (make it in this file, scale ~0.7): red body box 0.6×0.3×0.8, a black U-handle (two thin boxes up and a crossbar), 4 dark wheel cylinders; a stripe in the seat colour on top. `castShadow = true`.
- `racers = addRacers(scene, seats)`. Local clock (common rules).
  - **spin**: a spin angle per seat kept in the view: `spinA[k] += s.seats[k].r.v * dt`. Gnome at `(laneX(k), 0, 0)`: set `racers[k].pose.position`, `pose.velocity.set(0,0,0)`, `pose.facing = spinA[k]`, call `racers[k].model.update(racers[k].pose, dt)` (do NOT use poseRacer here: it forces facing 0), raise both arms (`model.arms.left/right.rotation.x = -1.4`), and put `racers[k].label` at y 1.9 above. Mower at gnome + `(Math.sin(spinA) * 0.9, 0.5, Math.cos(spinA) * 0.9)`, rotated to face along the orbit.
  - **fly**: `tau = clamp(clock - t0, 0, fly)`, `vy, vh` from `ang`/`vel`: mower at `(laneX(k), H0 + vy*tau - 0.5*G*tau*tau, 0.9 + vh*tau)`, tumbling (`rotation.x += dt * 8`). After landing (`clock - t0 > fly`): slide the skid: `z = 0.9 + vh*fly + vh*SKID * min(1, (clock - t0 - fly) / SKID_S)`, y 0, rotation settles upright.
  - **wait/done**: the mower stays where it landed (keep its last position); the gnome stands facing +z (poseRacer with speed 0). On landing, a small flag (thin pole + seat-colour triangle) at the landing spot stays for the rest of the round.
- Camera: spin → `followCamera(camera, new THREE.Vector3(0, 1, 6), new THREE.Vector3(0, 5, -12), dt)`; my mower in flight/after landing → focus my mower position, offset `(-6, 6, -12)`.
- Needle gauge (my seat, 'spin' only): a DOM semicircle (`width:180px;height:90px;border-radius:90px 90px 0 0`, bottom-right above the buttons) with a green wedge at 40-50° (conic-gradient is fine) and a needle div rotated by `needle(clock - t0)` degrees (0° = pointing right, 90° = up). Next to it a spin bar (`r.v / SPIN.max`).
- Board rows: best mark `'xx.xx m'` or '—', plus `  (${Math.min(n + 1, 2)}/2)`. My banners: on release `\`${ang.toFixed(0)}°\``, on landing `\`${dist.toFixed(2)} m\`` ('#ffd54f'), slip → 'SLIP!' ('#ff5252'). Hint while spinning: `'Alternate A/D to spin — THROW near 45°'`.
- `tapper = createTapper(ui, { actLabel: 'THROW' })`; `input(pad) { return tapper.sample(pad); }`; `dispose() { tapper.dispose(); }`.

## Done when / out of scope
Apply the common slice rules (pasted with this issue). In `oly-mower-toss.test.ts`, besides `testMinigame(def)`, one `it`: for seed 1, `runHeadless` finishes with `timeUp === false`. Check once (print, then remove) that CPU best marks are mostly 40-125 m. No edits outside the two owned files.
