Epic: 3 (more parts, nested pivots, suspension, showroom stage)
Depends on: 3A

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` first. You own only `packages/glaze/src/fittings.ts`, `fittings.test.ts`, `wheels.ts`, `wheels.test.ts`, `steer.ts`, `steer.test.ts`, `lamps.ts`, `lamps.test.ts`. Other workers edit other glaze files (paint, decals, attach, catalogue) and the prefab catalogue at the same time.

## Goal
Place the six new shelves on a vehicle, and make the tables the new tyre and steering ids need compile and behave. `tsc` for `wheels.ts` and `steer.ts` currently fails because their `Record`s miss the new ids.

## Read first
`packages/glaze/src/types.ts` (`Loadout` new fields `grille`, `bumper`, `canopy`, `mirror`, `exhaust`, `horn`; `VehicleMounts.points`), `ids.ts`, `fittings.ts` (`put`, `off`, the per-extra switch, underglow), `wheels.ts` (`TYRE_WIDTH`), `steer.ts` (`STEER_STYLES`), `docs/roadmaps/pay-n-glaze/_prefabs.md` ("Epic 3 slots": how each new prefab is authored).

## Change
- `wheels.ts`: `TYRE_WIDTH` gains `spiked: 1.1, balloon: 1.6, cogs: 1.2, glow: 0.7`.
- `steer.ts`: `STEER_STYLES` gains `ship: 0.2, heart: 0.19, square: 0.18, sprocket: 0.2`. Also fix `steer.test.ts` line ~30 (`base.pivots?.steer?.[1]`) to read the pivot through `pivotAt(...)` from `@lawn/prefabs` (pivots may now be `{ at, parent }`).
- `fittings.ts` `buildFittings`: place (with the existing `put`/`off` helpers and `k = width / 1.2`; skip when the mount point is missing; never throw when the prefab is missing):
  - `grille` (not `'stock'`): prefab `glaze-grille-<id>` at `points.front` offset `(0, -0.08k, 0.02)`.
  - `bumper` (not `'stock'`): `glaze-bumper-<id>` at `points.front` offset `(0, -0.2k, 0.02)`.
  - `canopy` (not `'none'`): `glaze-canopy-<id>` at `points.top`.
  - `mirror` (not `'none'`): `glaze-mirror-<id>` at `points.dash` offset `(+0.5 * mounts.width, 0, 0)` and mirrored at `(-0.5 * mounts.width, ...)` with `mirrorX: true`.
  - `exhaust` (not `'none'`): `glaze-exhaust-<id>` at `points.rear` offset `(0, -0.1k, 0)`; for every id except `twin`, shifted `(-0.3k, 0, 0)` to the right side.
  - new extras: `fairylights` at `points.top`; `toolbox` at `points.rear` offset `(-0.28k, 0.02k, -0.02)`; `cooler` at `points.rear` offset `(0.18k, 0.02k, 0.12k)`; `windsock` at `points.rear` offset `(-0.42k, 0, 0)`.
- Tests: a full loadout with every new slot set and hand-written mounts: with the prefabs present (`it.skipIf(!getPrefab('glaze-grille-picket'))` per group) the right holders exist at the right positions (mirror pair has one `scale.x < 0`), a missing mount point skips quietly, and nothing throws when prefabs are absent. Existing tests keep passing.

## Contract
`TYRE_WIDTH`, `STEER_STYLES` complete over the new ids; `buildFittings` signature unchanged.

## Done when
- `npx tsc --noEmit -p packages/glaze` has no error in your files (errors in `paint.ts`/`decals` belong to another issue).
- `npx vitest run packages/glaze/src/fittings.test.ts packages/glaze/src/wheels.test.ts packages/glaze/src/steer.test.ts packages/glaze/src/lamps.test.ts` passes.

## Out of scope
Every other file.
