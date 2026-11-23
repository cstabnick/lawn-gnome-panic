Epic: 1, traffic pass
Depends on: none

## Environment
Read `docs/roadmaps/gta-traffic-pass/_env.md` first (working directory, node path, rules: no install, no commit, no dev server,
other workers editing other files).

## Goal
Fix the main reason NPC traffic drives around visibly broken: vehicle-vehicle bumps charge crash damage by the faster
vehicle's absolute speed instead of by how fast the two close on each other. Traffic cruises at 11-19 m/s (over `CRASH_MIN` = 5),
so two cars grazing side by side in the same direction, or nudging in a queue, lose about 10 % hit points per touch, and
after a few touches the prefab swaps to its 'dented' and then its 'wrecked' model (wheel off, smoke).

## Read first
- `games/gnome-theft-auto/src/vehicles.ts` lines 575-660: `groundVel`, `collideVehicles` (the damage block is near the end of
  the inner loop: `const closing = Math.max(Math.abs(a.speed), Math.abs(b.speed), Math.max(0, closingN));`).
- `games/gnome-theft-auto/src/vehicles.ts` lines 50-110: `CRASH_MIN`, `CRASH_SCALE`, `damageVehicle`, `damageLevelFor`.
- `games/gnome-theft-auto/src/bump.test.ts`: the test harness (`make`, `run`) you will extend.

## Change
1. `games/gnome-theft-auto/src/vehicles.ts`, inside `collideVehicles` only: compute the damage speed from the closing speed
   along the contact normal, measured before the bump impulse, i.e. `const closing = Math.max(0, closingN);` (`closingN` is
   already computed above from `groundVel` of both vehicles before `kick`). Keep everything else in the block (the
   `CRASH_MIN` threshold, the 400 ms `lastHit` gate, the mass split, the 'bump' sound). Update the comment above it to say
   damage follows the closing speed, so grazing a car going the same way costs nothing. This is the only edit to vehicles.ts.
2. `games/gnome-theft-auto/src/bump.test.ts`: add a `describe('bump damage', ...)` with:
   - two ride-ons side by side, overlapping by 0.3 m sideways, both heading +z (yaw 0) at 14 m/s, `run([a, b], 1)`:
     both keep `hp === 1`.
   - a ride-on 0.5 m behind another in the same lane, rear one at 15 m/s, front one at 13 m/s (closing 2 m/s), `run(..., 1)`:
     both keep `hp === 1`.
   - head-on: two ride-ons 3 m apart facing each other (yaw 0 and yaw Math.PI) at 12 m/s each, `run(..., 0.5)`: both have
     `hp < 1`.
   - a ride-on at 20 m/s hitting a parked one (`driver: 'none'`, speed 0) from behind: the parked one has `hp < 1`.
   The `make()` helper sets `driver: 'npc'`; for the parked case set `driver` to `'none'` on the made object.
   `damageVehicle` reads the real prefab's damage stages via `getPrefab`; with `object: null` the model swap is skipped but
   `hp` still drops, which is what the tests check. If `object: null` makes `damageVehicle` throw, give the made vehicles
   `object: new THREE.Group()` (import `* as THREE from 'three'`).

## Contract
`collideVehicles(list: Vehicle[]): void` keeps its signature and its push-apart and impulse behaviour exactly; only the damage
speed changes. Existing tests in bump.test.ts must still pass.

## Done when
- `npx vitest run src/bump.test.ts src/collide.test.ts src/traffic.test.ts` passes, run from `games/gnome-theft-auto`
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in vehicles.ts or bump.test.ts

## Out of scope
Every other file; nothing else in vehicles.ts (other workers and lanes touch it).
