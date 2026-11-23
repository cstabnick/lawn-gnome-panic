Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` first (working directory, toolchain, rules, how to report). You own only the files below.

## Goal
`deriveMounts(body)` makes a sensible `VehicleMounts` for ANY built prefab vehicle (so a new game gets lamps, spoilers, decals and wheels with no hand-tuning), and `getMounts(prefabId, body)` lets a game override any field.

## Read first
- `packages/glaze/src/types.ts`: `VehicleMounts`, `SteerMount`, `DecalPanel`, `MountPointId`.
- `packages/glaze/src/mounts.ts`: the stub (the registry and `getMounts` are final; fill `deriveMounts`).
- `packages/prefabs/src/catalog/lawn-prix.ts` lines 1-45: the `ride-on-mower` prefab (a real vehicle: pivots `wheel-0..3`, `steer`).
- `packages/prefabs/src/build.ts` lines 230-290: how pivot groups are built (a group's `position` is its pivot's `at`).

## Change
- `packages/glaze/src/mounts.ts`: implement `deriveMounts(body: THREE.Object3D): VehicleMounts`. `body` is a built prefab root and may carry a uniform scale `s = body.scale.x` and a position; results are in **prefab-local** units (divide by `s`, subtract `body.position`; assume no rotation). Steps:
  1. `body.updateWorldMatrix(true, true)`; `box = new THREE.Box3().setFromObject(body)` then convert to prefab-local: `min = (box.min - body.position) / s`, same for max. Ignore pivot groups' own `PointLight`s (they have no geometry, so `setFromObject` already skips them).
  2. `width = max.x - min.x`, `length = max.z - min.z`, `height = max.y` (use `Math.max(0.2, ...)` on all three so an empty body never gives zero).
  3. Wheels: for `i` in 0..3, `p = body.getObjectByName('wheel-' + i)`; if present push `{ index: i, pivot: 'wheel-' + i, front: i >= 2, side: p.position.x >= 0 ? 1 : -1, at: [p.position.x, p.position.y, p.position.z] }`.
  4. Steer: if `body.getObjectByName('steer')` exists with position `(px, py, pz)` -> `{ pivot: 'steer', grips: [[px + 0.2, py, pz], [px - 0.2, py, pz]] }`, else `null`.
  5. With `zf = max.z`, `zr = min.z`, `h = height`, `L = length`, `W = width`: `points = { hood: [0, h*0.62, zf - L*0.12], front: [0, h*0.35, zf], rear: [0, h*0.55, zr + L*0.06], seat: [0, h*0.45, zr + L*0.3], top: [0, h, zr + L*0.45], side: [W/2, h*0.35, zr + L*0.35], dash: [0, h*0.7, zf - L*0.32] }`; `lamps = [[W*0.26, h*0.45, zf], [-W*0.26, h*0.45, zf]]`.
  6. `panels`: `{ id: 'left', at: [W/2 + 0.004, h*0.42, (zf+zr)/2], size: [L*0.55, h*0.3], rot: [0, 90, 0] }`, `{ id: 'right', at: [-W/2 - 0.004, ...same], size: same, rot: [0, -90, 0] }`, `{ id: 'hood', at: [0, h*0.74, zf - L*0.2], size: [W*0.55, L*0.28], rot: [-90, 0, 0] }`, `{ id: 'rear', at: [0, h*0.5, zr - 0.004], size: [W*0.6, h*0.25], rot: [0, 180, 0] }`.
  Return all of it. Round nothing.
- `packages/glaze/src/mounts.test.ts` (new): build `ride-on-mower` with `buildPrefab('ride-on-mower', { scale: 1.5 })` and with scale 1; both derive the same numbers within 1e-6 (width about 1.2, 4 wheels, `wheels[0].side === 1`... check the sign against the prefab: `wheel-0` is at x -0.6, so side -1, and `front` false for 0 and 1, true for 2 and 3), `steer` not null, every panel has finite numbers, `lamps` is mirrored (`lamps[0][0] === -lamps[1][0]`). Also build `'sandbag-wall'` (no pivots): `wheels` is `[]`, `steer` null, no NaN. `defineMounts('ride-on-mower', { lamps: null })` then `getMounts` returns `lamps === null` but the derived width; `defineMounts('ride-on-mower', {})` afterwards restores derived lamps.

## Contract
`deriveMounts(body: THREE.Object3D): VehicleMounts`; `getMounts(prefabId: string, body: THREE.Object3D): VehicleMounts`; `defineMounts(prefabId: string, def: GlazeMountsDef): void` exactly as stubbed. No new exports.

## Done when
- `npx tsc --noEmit -p packages/glaze` has no error in `mounts.ts` / `mounts.test.ts`.
- `npx vitest run packages/glaze/src/mounts.test.ts` passes.

## Out of scope
Every other file. Do not edit prefabs.
