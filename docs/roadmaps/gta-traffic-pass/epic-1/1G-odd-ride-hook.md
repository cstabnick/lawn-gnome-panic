Epic: 1, traffic pass
Depends on: none

## Environment
Read `docs/roadmaps/gta-traffic-pass/_env.md` first (working directory, node path, rules: no install, no commit, no dev server,
other workers editing other files).

## Goal
The game counts the "Sunday Driver" achievement (drive each of the four odd rides once: `pot-rod`, `lawn-roller`,
`teacup-trundler`, `barrow-buggy`), and the four odd rides get handling profiles so they feel slow and quirky under the
physics driving model.

## Read first
- `games/gnome-theft-auto/src/wildAchievements.ts`: `HELM_BOATS`, `HELMED_KEY`, `CAPTAIN_CLAY`, `recordHelm`, `HelmStorage`.
  Copy this exact pattern.
- `games/gnome-theft-auto/src/wildAchievements.test.ts`: its `recordHelm` tests (copy the pattern).
- `games/gnome-theft-auto/src/app.ts` lines 75-85 (imports) and 570-590 (`takeWheel`: the `recordHelm` line).
- `games/gnome-theft-auto/src/handling.ts` lines 40-125: `VehicleProfile`, `PROFILES` (stock knobs and ranges, `lean`).
- `games/gnome-theft-auto/src/config.ts`: the four odd rides at the end of `VEHICLES`.

## Change
1. Create `games/gnome-theft-auto/src/oddRides.ts`:
   ```ts
   import type { VehicleKind } from './types';
   /** The odd rides "Sunday Driver" counts (packages/achievements catalog.ts, gta-sunday-driver). */
   export const ODD_RIDES: readonly VehicleKind[] = ['pot-rod', 'lawn-roller', 'teacup-trundler', 'barrow-buggy'];
   export const ODD_RIDES_KEY = 'gta-odd-rides-v1';
   export const SUNDAY_DRIVER = 'gta-sunday-driver';
   export interface RideStorage { getItem(k: string): string | null; setItem(k: string, v: string): void }
   /** Remember that the player drove `kind`. True only the first time ever for an ODD_RIDES kind. */
   export function recordOddRide(kind: VehicleKind, storage: RideStorage | null): boolean;
   ```
   Same behaviour as `recordHelm` (JSON array of kinds under ODD_RIDES_KEY, garbage counts as empty, a null or throwing storage
   falls back to an in-memory set).
2. Create `games/gnome-theft-auto/src/oddRides.test.ts`: true once per odd ride and false on a repeat; false for 'ride-on';
   garbage in storage counts as empty; null storage works in memory.
3. `games/gnome-theft-auto/src/app.ts` (two small edits only; other lanes edit this file too, so touch nothing else):
   import `{ SUNDAY_DRIVER, recordOddRide } from './oddRides'` next to the wildAchievements import, and in `takeWheel`
   directly after the `recordHelm` line add
   `if (recordOddRide(v.kind, helmStorage())) void achievements.increment(SUNDAY_DRIVER);`
4. `games/gnome-theft-auto/src/handling.ts`: add four `PROFILES` entries after `'hoa-van'`, each with a one-line comment:
   - `'pot-rod'`: light and tail-happy: `stock: { grip: 0.9, balance: -0.2, steering: 1.2, assists: 0.8, stiffness: 0.85, comHeight: 1.1 }`, ranges like lowrider's, `lean: 1.2`.
   - `'lawn-roller'`: a slow, planted brick: `stock: { grip: 1.2, balance: 0.4, steering: 0.75, assists: 1.4, brakes: 1.2, stiffness: 1.2, comHeight: 0.8 }`, ranges like combine's, `lean: 0.3`.
   - `'teacup-trundler'`: pivots on the spot, wobbly: `stock: { grip: 0.85, balance: 0, steering: 1.4, assists: 0.9, stiffness: 0.8, comHeight: 1.2 }`, ranges like push-bike's, `lean: 1.5`.
   - `'barrow-buggy'`: nose-heavy, wanders: `stock: { grip: 0.95, balance: 0.3, steering: 0.95, assists: 1.0, stiffness: 0.9, comHeight: 1.1 }`, ranges like ride-on's, `lean: 1.1`.
   Check every knob name you use exists in the other entries (the TuningValues keys); use only those.

## Done when
- `npx vitest run src/oddRides.test.ts src/handling.test.ts` passes, run from `games/gnome-theft-auto`
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in oddRides.ts, oddRides.test.ts, app.ts or handling.ts

## Out of scope
config.ts, types.ts, net.ts (already done), traffic.ts, vehicles.ts, packages/ (another worker adds the achievement entry
and the prefabs), every other file.
