Epic: 2 (the six events)
Depends on: none

## Goal
`games/gnomylpics/src/minigames/oly-sprint.ts` is **Gnome Sprint**: a 100 m dash for four gnomes. Alternate A and D (or ◀ ▶) to run; the same key twice is a stumble: the gnome face-plants, loses most of its speed and ignores taps for a moment. Fastest time wins.

## Owns
- `games/gnomylpics/src/minigames/oly-sprint.ts` (replace the template)
- `games/gnomylpics/src/minigames/oly-sprint.test.ts` (new)

## Read first
- `games/gnomylpics/src/olympic/run.ts` (stepRunner, cpuTaps, advanceCpu, RUN), `rank.ts`, `taps.ts`, `field.ts` — doc comments.
- `packages/party/src/types.ts` — the contract.

## Rules (constants at the top of the file)
- `DIST = 100` (finish line z), `GRACE_S = 6` (the race ends this long after the first finisher), `meta.maxSeconds = 30`.
- meta: `id: 'oly-sprint'`, `title: 'Gnome Sprint'`, `game: 'gnomylpics'`, `goal: 'Run 100 m faster than everyone.'`, `controls: 'Alternate A and D (or tap ◀ ▶). The same key twice is a stumble!'`.
- `interface I { taps: number; slips: number; acts: number }` (= TapInput).
- `interface Seat { r: Runner; z: number; fin: number | null; skill: number }`, `interface S { t: number; seats: Seat[]; firstFin: number | null }`.
- `init`: every seat `{ r: newRunner(), z: 0, fin: null, skill: cpuSkill(rng) }`, `t: 0`, `firstFin: null`.
- `step(s, inputs, dt, rng)`: `s.t += dt`; for each seat k:
  - not finished: `stepRunner(seat.r, inputs[k], RUN, dt)`; `seat.z += seat.r.v * dt`; if `seat.z >= DIST`: `seat.fin = round3(s.t - (seat.z - DIST) / Math.max(seat.r.v, 0.01))`, `s.firstFin ??= s.t`.
  - finished: jog down: `seat.r.v = Math.max(0, seat.r.v - 6 * dt)`, `seat.z = Math.min(DIST + 12, seat.z + seat.r.v * dt)`.
  - always: `advanceCpu(seat.r, seat.skill, dt, rng)`.
- `cpu(s, seat, rng)`: `cpuTaps(s.seats[seat].r, s.seats[seat].skill, rng)`.
- `result(s, timeUp)`: if every seat finished, or `firstFin !== null && s.t >= firstFin + GRACE_S`, or `timeUp`: `placesFrom(seats.map(x => x.fin !== null ? 1000 - x.fin : x.z), true)`; else null.

## View
- Scene: `addSkyAndLights`, `addGrass(scene, 70, 180, -30)`, `addTrack(scene, 130, { z0: -10 })`, `addLine(scene, 0, 0xffffff, 0.15)` (start), `addLine(scene, DIST, 0xffffff, 0.4)` (finish), `addDistanceMarkers(scene, 10, 90, 10)`. A finish arch at z = DIST: two white posts (box 0.15×3×0.15) at x = ±(2 * LANE_W + 0.4) and a crossbar, with `textSprite('FINISH', '#ffd54f', 0.6)` above it.
- `racers = addRacers(scene, seats)`. Every render, per seat: ease a display z towards `s.seats[k].z` (`dz += (z - dz) * (1 - Math.exp(-dt * 15))`) and `poseRacer(racers[k], laneX(k), 0, dz, s.seats[k].r.v, dt)`. **Stumble:** while `s.seats[k].r.stun > 0`, after poseRacer set `racers[k].model.object.rotation.x` towards 1.2 (a face-plant forward), else ease it back to 0 (`rot += (target - rot) * (1 - Math.exp(-dt * 12))`).
- Camera: `followCamera(camera, new THREE.Vector3(0, 1, myZ + 3), new THREE.Vector3(-11, 5, -5), dt)` where myZ is my seat's display z (seat 0 when watching).
- `board = createBoard(ui, seats, mySeat)`: each frame `board.set(k, fin !== null ? \`${fin.toFixed(2)} s\` : \`${Math.floor(z)} m\`)`.
- My events: when `tapper.lastSlipAt` changes → `board.banner('STUMBLE!', '#ff5252', 700)`; when my `fin` becomes non-null → `board.banner(\`${fin.toFixed(2)} s\`, '#ffd54f', 2000)`. `board.hint('Alternate A ◀ ▶ D  (same key twice = stumble)')` until my seat has 6 taps, then `board.hint('')`.
- Speed bar (my seat only): a div bottom-left above the touch buttons (`left:12px;bottom:28vh;width:160px;height:14px;border:2px solid #fff;border-radius:8px`) with an inner fill width `v / RUN.max * 100%`, colour `css(seat.color)`.
- `tapper = createTapper(ui)` (no action button). `input(pad) { return tapper.sample(pad); }`. `dispose() { tapper.dispose(); }`.

## Done when / out of scope
Apply the common slice rules (pasted with this issue): `oly-sprint.test.ts` with `testMinigame(def)` plus one `it` — "a slip slows the runner": init with `defaultSeats(true)` from `@lawn/party`, step 60 times with seat 0 input taps rising by 1 every 6 steps (alternating is implicit: taps counter), record v, then send one more slip and check v dropped by more than half. All checks pass; no edits outside the two owned files.
