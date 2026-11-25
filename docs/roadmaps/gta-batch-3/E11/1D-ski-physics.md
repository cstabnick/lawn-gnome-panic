Epic: 1 Foundation (prefabs, physics, lore, water)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E11/_env.md` first. Other workers edit other game files at the same time; nobody else
touches `src/tubing/` in this epic. `src/tubing/runtime.ts` calls `newTube`, `stepTube` and `stepRun`: keep their
current calls compiling (new parameters must be optional, with defaults that keep today's behaviour exactly).

## Goal
The tow physics gain a water-ski mode (a second tuning, not a copy of the module), a wake-ramp kick, and the tubing
course module holds two courses: the Loch Moss buoy run and the new ocean slalom off Saltbucket Shore.

## Read first
- `games/gnome-theft-auto/src/tubing/types.ts`: `TOW`, `TubeState`, `Sea`, `BoatPose`.
- `games/gnome-theft-auto/src/tubing/tow.ts`: `hookPoint`, `newTube`, `stepTube` (uses `TOW.*` fields), `scoreStep`.
- `games/gnome-theft-auto/src/tubing/course.ts`: `BuoyGate`, `BUOY_GATES`, `buoysOf`, `stepRun`.
- `games/gnome-theft-auto/src/tubing/tow.test.ts` and `course.test.ts`: test style (the course test checks buoy depth
  with `waterAt` from `../terrain`).
- `games/gnome-theft-auto/src/coast/config.ts`: `COAST.slalom` and `COAST.wakeRamp`.

## Change
1. `src/tubing/types.ts`:
   - `export type TowMode = 'tube' | 'ski';`
   - `TubeState` gains `mode: TowMode;` (doc: "'ski': water-skis (tow-ski vehicle), else a tube").
   - `export interface TowTuning { k; c; drag; leanForce; leanRate; gravity; hopV; hopCooldown; launch; floatY; sideFast;
     sideRisk; tooFast; fastRisk; riskDrain; hardLanding; throwUp: number }` (all `number`).
   - `export const SKI: TowTuning = { ...pick of TOW's values for those keys, with these overrides }`:
     `leanForce: 13` (skis carve harder), `leanRate: 5`, `drag: 0.8`, `launch: 0.6` (lower wave launch), `hopV: 4.2`,
     `hopCooldown: 0.8`, `floatY: 0.05`, `sideFast: 13` (wider), `tooFast: 30`, `hardLanding: 0.45`. Write the full
     object out literally (copy the other values from `TOW`).
   - `export function towTuning(mode: TowMode): TowTuning` returns `SKI` for 'ski', else an object with `TOW`'s values
     (build it once at module level: `const TUBE: TowTuning = { k: TOW.k, ... }`).
2. `src/tubing/tow.ts`:
   - `newTube(b, slot, sea, mode: TowMode = 'tube')`: sets `mode` and uses `towTuning(mode).floatY`.
   - `stepTube`: `const T = towTuning(t.mode);` at the top, and every tuning read that is listed in `TowTuning` uses `T.x`
     instead of `TOW.x` (`TOW.slots` stays). With `mode: 'tube'` the results must be bit-for-bit what they are today.
   - New: `export interface WakeRamp { x: number; z: number; yaw: number; length: number; width: number; kick: number }`
     and `export function rampKick(t: TubeState, r: WakeRamp): boolean`: true (and `t.vy = Math.max(t.vy, r.kick)`) when
     the rider is not fallen, is within 0.3 m of the water (`t.air === 0`), lies inside the ramp's rectangle (centre (x, z),
     `length` along the ramp's forward direction (sin yaw, cos yaw), `width` across) and moves forward along it faster
     than 3 m/s (`t.vx * sin(yaw) + t.vz * cos(yaw) > 3`). Else false, nothing changed.
   - `scoreStep` unchanged.
3. `src/tubing/course.ts`:
   - `export interface TowCourse { id: string; name: string; gates: readonly BuoyGate[] }`.
   - `export const LOCH_COURSE: TowCourse = { id: 'loch-moss', name: 'Loch Moss buoy run', gates: BUOY_GATES };`
   - `export const OCEAN_GATES: readonly BuoyGate[]` built from `COAST.slalom` (import from `../coast/config`):
     gate i (0..gates-1) at `x = startX + i * (endX - startX) / (gates - 1)`, `z = slalom.z + (i % 2 === 0 ? -swing : swing)`,
     `yaw: Math.PI / 2` (pass heading +x), `width: slalom.width`.
   - `export const OCEAN_COURSE: TowCourse = { id: 'saltwater', name: 'Saltwater slalom', gates: OCEAN_GATES };`
   - `export const TOW_COURSES: readonly TowCourse[] = [LOCH_COURSE, OCEAN_COURSE];`
   - `export function courseNear(x: number, z: number): TowCourse`: the course whose first gate is nearest (x, z).
   - `stepRun(r, ax, az, bx, bz, dt, gates: readonly BuoyGate[] = BUOY_GATES)`: use `gates` everywhere it used
     `BUOY_GATES` (including the finish length check).
4. Tests:
   - `src/tubing/tow.test.ts` (add a `describe('water-skis')`): `newTube(...)` without a mode gives `mode: 'tube'`; with
     'ski' gives 'ski' and `y = surface + SKI.floatY`; a ski towed straight behind a boat at 14 m/s on a flat sea
     (`surface: () => 0`, slope 0) with lean 0 for 20 s (dt 0.05) never falls; `towTuning('tube').leanForce === TOW.leanForce`
     and `SKI.sideFast > TOW.sideFast`; `rampKick` true for a rider in the middle of a ramp moving 8 m/s along it (vy
     becomes kick), false for one moving backwards, false for one 10 m to the side, false when `fallen`.
   - `src/tubing/course.test.ts` (add): every buoy of `OCEAN_GATES` is in water at least 1.5 m deep (same check as the
     loch test); `courseNear(-200, 1312).id === 'saltwater'` and `courseNear(-700, -665).id === 'loch-moss'`; a boat
     driving east along each ocean gate's centre line (10 m before to 10 m after) passes all gates in order with
     `stepRun(..., OCEAN_GATES)` and finishes.

## Contract
```ts
export type TowMode = 'tube' | 'ski';            // types.ts
TubeState.mode: TowMode
export const SKI: TowTuning; export function towTuning(mode: TowMode): TowTuning;
newTube(b: BoatPose, slot: number, sea: Sea, mode?: TowMode): TubeState     // tow.ts
export function rampKick(t: TubeState, r: WakeRamp): boolean
export const TOW_COURSES, LOCH_COURSE, OCEAN_COURSE, OCEAN_GATES; export function courseNear(x, z): TowCourse  // course.ts
stepRun(r, ax, az, bx, bz, dt, gates?)
```

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` clean for `src/tubing/`.
- `cd games/gnome-theft-auto && npx vitest run src/tubing` passes (old tests unchanged and green).

## Out of scope
`src/tubing/runtime.ts`, `src/tubing/view.ts` (a later issue), `src/coast/` (do not edit config), everything else.
