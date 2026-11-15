Epic: 2 (the six events)
Depends on: none

## Goal
`games/gnomylpics/src/minigames/oly-grass-mow.ts` is **Grass Mowing**: four gnomes push mowers around one shared 20×20 lawn for 40 s. Every patch of tall grass you cut first is yours and turns your colour. Rocks block the way, mowers bump each other. Most patches wins.

## Owns
- `games/gnomylpics/src/minigames/oly-grass-mow.ts` (replace the template)
- `games/gnomylpics/src/minigames/oly-grass-mow.test.ts` (new)

## Read first
- `games/gnomylpics/src/olympic/rank.ts`, `field.ts` — doc comments. (This event does not use `run.ts` or `taps.ts`: it steers with the pad stick.)
- `packages/party/src/types.ts` — the contract (`PadState.x/.y`: -1..1 from WASD/arrows or a touch drag).

## Rules (constants at the top)
```ts
const N = 20;                 // cells per side; cell (i, j) centre: x = i - N/2 + 0.5, z = j - N/2 + 0.5 (1 m cells)
const SPEED = 3.4;            // m/s at full stick
const TURN = 5;               // rad/s
const CUT_R = 0.65;           // cells whose centre is within this of the mower centre get cut
const MOWER_R = 0.45;         // mowers push apart below 2 * MOWER_R
const ROCKS = 6;
const ROUND_S = 40;           // meta.maxSeconds = 40 too
const START = [[-8, -8], [8, -8], [-8, 8], [8, 8]]; // seat start (x, z)
```
- meta: `id: 'oly-grass-mow'`, `title: 'Grass Mowing'`, `goal: 'Mow more of the lawn than anyone in 40 seconds.'`, `controls: 'Steer with WASD or the arrows (or drag on the screen).'`.
- `interface I { x: number; y: number }` (stick, rounded to 2 decimals by the view).
- `interface Mower { x: number; z: number; h: number; cut: number }` (`h` heading, radians, direction `(sin h, cos h)` in x/z). `interface S { t: number; cells: string; m: Mower[]; tgt: number[]; skill: number[] }`.
  - `cells`: N*N chars, index `j * N + i`: `'.'` tall grass, `'#'` rock, `'0'..'3'` cut by that seat.
  - `tgt[k]`: the CPU target cell index (-1 none). `skill[k] = cpuSkill(rng)` from `run.ts` (that one import is fine).
- `init`: all '.'; place ROCKS rocks at random cells with `rng`, never within 3 cells (Chebyshev) of a start corner nor on another rock. Mowers at START, heading towards the centre (`Math.atan2(-x, -z)`), `cut: 0`. The start cells are not pre-cut.
- `step`: `s.t += dt`; split `cells` into an array once; per seat k with input `i = inputs[k] ?? { x: 0, y: 0 }`:
  - stick → world: the camera looks down from +z, so screen-up is world -z: `dx = i.x`, `dz = -i.y`; `mag = Math.min(1, Math.hypot(dx, dz))`. If `mag > 0.15`: `want = Math.atan2(dx, dz)`; turn `h` towards `want` by at most `TURN * dt` along the shortest way (wrap the difference to -π..π); move `SPEED * mag * dt` along `(sin h, cos h)`.
  - Clamp x, z to `±(N/2 - 0.4)`. If the new position's cell is `'#'`, undo this step's move (keep the turn).
  - Cut: for the cells in the 3×3 block around the mower's cell, if `'.'` and the cell centre is within `CUT_R` → set to `String(k)`, `cut += 1`.
- After all seats moved: push apart every pair closer than `2 * MOWER_R` (each moves half the overlap along the line between them; skip if exactly on top of each other).
- CPU targets (every seat, every step): if `tgt[k] < 0` or `cells[tgt[k]] !== '.'`: pick the nearest `'.'` cell to mower k; with chance `(1 - skill[k]) * 0.5` (rng) pick the 2nd nearest instead; `-1` if none left.
- Join the array back into `cells`. Round `x`, `z`, `h` to 3 decimals.
- `cpu(s, seat)`: no target → `{ x: 0, y: 0 }`; else the direction to the target centre `(dx, dz)` normalised, times `0.65 + 0.3 * skill`, returned as `{ x: dx * f, y: -dz * f }` (so it goes through the same stick mapping). No rng needed.
- `result`: when no `'.'` remains, or `s.t >= ROUND_S`, or `timeUp` → `placesFrom(m.map(x => x.cut), true)`.

## View
- Scene: `addSkyAndLights(scene)`; a brown soil plane 26×26 under the lawn; a low white picket fence round the edge (thin boxes) is a nice touch.
- Grass: one `THREE.InstancedMesh(new THREE.BoxGeometry(0.96, 1, 0.96), new THREE.MeshStandardMaterial(), N * N)`; per cell a matrix at the cell centre with height `0.45` (tall, colour `0x2e7d32`, y = height/2) or `0.08` (cut, colour = the seat colour mixed 35% into `0x8bc34a` → `new THREE.Color(0x8bc34a).lerp(new THREE.Color(seat.color), 0.35)`); rocks: hide the cell (scale 0) and add a grey `DodecahedronGeometry(0.45)` rock there on first render. Use `setMatrixAt` / `setColorAt`; only update cells whose char changed since the last render, then set `instanceMatrix.needsUpdate` / `instanceColor.needsUpdate`.
- Mower prop per seat (in this file): body box 0.7×0.3×0.9 in the seat colour, dark wheels, a handle sloping back; positioned at the eased mower position and rotated `rotation.y = h` (ease the angle along the shortest way).
- Gnomes: `racers = addRacers(scene, seats)`; each walks behind its mower: position = mower − `(sin h, cos h) * 0.85`; set `pose.position`, `pose.velocity` = the mower's display velocity (difference of eased positions / dt), `pose.facing = h`, call `racers[k].model.update(racers[k].pose, dt)` (not poseRacer: it forces facing 0), `racers[k].label.position` at y 1.9 above.
- A few green clipping particles when a seat's `cut` rises are optional.
- Camera fixed: `camera.position.set(0, 21, 15); camera.lookAt(0, 0, 1)`.
- Board rows: `${cut}  (${Math.round(cut * 100 / grassTotal)}%)` where `grassTotal` = count of non-'#' cells. Hint: `'Steer with WASD / arrows (or drag)'` for the first 4 s, then ''. Banner 'MOW!' on the first render.
- `input(pad) { return { x: Math.round(pad.x * 100) / 100, y: Math.round(pad.y * 100) / 100 }; }`.

## Done when / out of scope
Apply the common slice rules (pasted with this issue). In `oly-grass-mow.test.ts`, besides `testMinigame(def)`: one `it` — init with seed 1, step 120 times with seat 0 input `{ x: 1, y: 0 }` and the others null: seat 0's `x` increased and its `cut > 0`, and the `cells` string length stays 400. Check once that 4 CPUs cut most of the lawn (the state's '.' count at the end is small). No edits outside the two owned files.
