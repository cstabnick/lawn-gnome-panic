Epic: E29-B European kit wiring (after E29-A)
Depends on: E29-A (the vehicle prefabs exist)

## Environment
Read the "Environment" section of `docs/roadmaps/gta-batch-3/E29/_common.md` (working directory, node path, do not
commit, other workers edit other files). Game: `games/gnome-theft-auto` (three.js + TypeScript, vitest).

## Goal
The driver of each open European ride holds its control with both hands (Deux-Pots: steering wheel; Wespa and Baguette
Trike: handlebars), and the two closed cabs (Petit Pois `'euro-hatch'`, Crepe Van `'crepe-van'`) are recorded as having
nothing to hold, so `driveGrips.test.ts` passes for the whole roster.

## Read first
- `games/gnome-theft-auto/src/driveGrips.ts` (the whole file: `DriveControl`, helpers `pair`, `bars`, `ringAxis`,
  `FACING`, the named control positions like `POT_ROD_WHEEL` / `BARROW_BARS`, the `DRIVE_CONTROLS` table and its comment
  listing kinds with no control, `registerDriveControls`)
- `games/gnome-theft-auto/src/driveGrips.test.ts` (what is checked: hands on the grips at every steer, grips 0.6..1.6
  arm lengths from the seated shoulder, `NO_CONTROL`)
- `packages/prefabs/src/catalog/gta-euro-fleet.ts` (`gta-deux-pots`: its `steer` pivot and steering ring) and
  `packages/prefabs/src/catalog/gta-euro-fleet-b.ts` (`gta-wespa`, `gta-baguette-trike`: `steer` pivots and handlebars)
- `games/gnome-theft-auto/src/config.ts` the `// ---- European rides (E29` block in `VEHICLES` (seats, scales)

## Change
- `games/gnome-theft-auto/src/driveGrips.ts`:
  - Named positions `DEUX_POTS_WHEEL`, `WESPA_BARS`, `TRIKE_BARS` (prefab-local Vec3) next to the others.
  - `DRIVE_CONTROLS` entries:
    - `'deux-pots'`: `control: 'wheel'`, `pivot: 'steer'`, grips `pair(DEUX_POTS_WHEEL, <ring radius>)`,
      `axis: ringAxis(<the ring's rot x in the prefab>)`, and a `variant: { dropParts: [], wheelAt: DEUX_POTS_WHEEL }`
      only if the wheel has to move to come within reach (the pot-rod / teacup entries show the pattern).
    - `wespa` and `'baguette-trike'`: `control: 'handlebar'`, `pivot: 'steer'`, grips `pair(<bars>, <half bar width>)`,
      default axis, and a `variant` with `wheelAt` (and `addParts: bars(...)` only if needed, like `'barrow-buggy'`) when the
      prefab's own bar is out of reach of the seated shoulder.
  - Add `'euro-hatch'` and `'crepe-van'` to the "A kind left out keeps its hands in the lap" comment: "closed cabs, the
    driver's hands are not seen".
- `games/gnome-theft-auto/src/driveGrips.test.ts`: add `'euro-hatch'` and `'crepe-van'` to `NO_CONTROL` (keep the rest).

Reach: a seated gnome's shoulder is at seat + (+-0.27, 0.62, 0) in root space (root space = prefab-local times the
vehicle `scale`); each grip must be 0.6..1.6 arm lengths (ARM_LENGTH 0.32) from its shoulder at every steer angle. Work
out the numbers, then run the test and adjust `wheelAt` until it passes. Do not change the prefabs or `config.ts`.

## Contract
`DRIVE_CONTROLS: Readonly<Partial<Record<VehicleKind, DriveControl>>>` (unchanged type).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` clean in your files.
- `cd games/gnome-theft-auto && npx vitest run src/driveGrips.test.ts src/driverHands.test.ts` passes.

## Out of scope
Prefab files, `config.ts`, `glazeMounts.ts`, every other file.
