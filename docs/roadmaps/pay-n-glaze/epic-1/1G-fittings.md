Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` first (working directory, toolchain, rules, how to report). You own only the files below.

## Goal
The bolt-ons: spoiler, seat cover, hood ornament, up to four extras and neon underglow, each placed at the right mount point of any vehicle.

## Read first
- `packages/glaze/src/types.ts`: `Loadout`, `VehicleMounts` (`points`, `wheels`, `width`, `length`).
- `packages/glaze/src/catalog.ts` lines 100-140: the products; `packages/glaze/src/fittings.ts`: the stub (`FittingsBuild`, `buildFittings`).
- `docs/roadmaps/pay-n-glaze/_prefabs.md`: how each slot's prefab is authored (origin = attachment point, rising from y = 0, front +z, authored for a 1.2-wide vehicle).

## Change
- `packages/glaze/src/fittings.ts`: implement `buildFittings(mounts, loadout)`. `k = mounts.width / 1.2`. A helper `place(prefabId, at: Vec3, opts?: { mirrorX?: boolean; rotY?: number })` that returns a `THREE.Group` holder with `buildPrefab(prefabId)` inside, `holder.position.set(...at)`, `holder.scale.set(mirrorX ? -k : k, k, k)`, shadows on, or `null` when the prefab does not exist (`getPrefab`). Everything goes into `group` (name `'glaze-fittings'`) except the underglow (`ground`). Placement:
  - `spoiler` (not `'none'`): prefab `glaze-spoiler-<id>` at `points.rear` (skip when absent).
  - `seat` (not `'none'`): prefab `glaze-seat-<id>` at `points.seat`.
  - `ornament` (not `'none'`): prefab `glaze-ornament-<id>` at `points.hood`.
  - each `extra`: prefab `glaze-extra-<id>`: `dice` at `points.dash` offset `(+0.18*k, 0, 0)`; `flag` at `points.rear` offset `(+0.42 * k, 0, 0)` (the rear-left corner); `pipes`: at `points.side` AND mirrored at `(-side.x, side.y, side.z)` with `mirrorX: true`; `mudflaps`: one per rear wheel (`mounts.wheels` entries with `front === false`) at `[w.at[0] + w.side * 0.12*k, w.at[1] - 0.15*k, w.at[2] - 0.34*k]`, mirrored (`mirrorX: w.side === -1`); `bunting` at `points.top`; `plate` at `points.rear` offset `(0, -0.18*k, -0.02)`; `roobar` at `points.front`; `bell` at `points.dash` offset `(-0.18*k, 0, 0)`. An extra whose point (or the wheels, for mudflaps) is missing is skipped.
  - `underglow` not `null`: a flat glow quad in `ground`: `PlaneGeometry(mounts.width * 0.95, mounts.length * 0.95)` rotated `x = -PI/2` at `(0, 0.025, zMid)` where `zMid = (points.front?.[2] ?? mounts.length / 2) - mounts.length / 2` (the middle of the body), `MeshBasicMaterial({ color: underglow, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })`, `renderOrder = 1`, `polygonOffset: true` with factor -1 and units -1 so it never z-fights the ground. Cache materials by colour.
  - `update(dt)`: pulse the underglow material opacity `0.4 + 0.12 * sin(t * 3)` with a running time `t += dt` (create one underglow material per call, not a shared one, so vehicles pulse on their own; dispose nothing).
- `packages/glaze/src/fittings.test.ts` (new): hand-write `mounts` (width 1.2, a full `points` set, two rear wheels with `side` 1 and -1 at `[0.55, 0.3, -0.5]` / `[-0.55, 0.3, -0.5]`, `front: false`, indexes 0, 1). `defaultLoadout` -> empty `group` and `ground`. `underglow: 0x44ff88` -> one mesh in `ground` with additive blending, nothing in `group`. With `extras: ['pipes', 'mudflaps']` and the prefabs present (use `it.skipIf(!getPrefab('glaze-extra-pipes'))`) `group` holds 2 + 2 holders, the mirrored ones have `scale.x < 0`. A missing mount point (`points: {}`) skips quietly (no throw) even with prefabs. `update(1)` runs with and without underglow.

## Contract
`buildFittings(mounts: VehicleMounts, loadout: Loadout): FittingsBuild` with `FittingsBuild = { group: THREE.Group; ground: THREE.Group; update(dt: number): void }`, as stubbed.

## Done when
- `npx tsc --noEmit -p packages/glaze` has no error in `fittings.ts` / `fittings.test.ts`.
- `npx vitest run packages/glaze/src/fittings.test.ts` passes.

## Out of scope
Every other file, including the prefab catalog (other workers add the spoiler, seat, ornament and extra prefabs).
