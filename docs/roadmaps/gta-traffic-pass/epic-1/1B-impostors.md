Epic: 1, traffic pass
Depends on: none

## Environment
Read `docs/roadmaps/gta-traffic-pass/_env.md` first (working directory, node path, rules: no install, no commit, no dev server,
other workers editing other files).

## Goal
A new module `games/gnome-theft-auto/src/trafficImpostors.ts`: cheap far-away stand-ins for traffic cars. Each vehicle kind
becomes one merged, vertex-coloured mesh drawn with `THREE.InstancedMesh`, so every distant car of a kind costs one or two
draw calls in total. The planner calls `update()` every frame with the poses of the cars that are far away.

## Read first
- `games/gnome-theft-auto/src/config.ts`: `VEHICLES` (each `VehicleSpec` has `prefab`, `scale`, `radius`, `seat: [x, y, z]`).
- `games/gnome-theft-auto/src/vehicles.ts` lines 240-275 (`createVehicle`: how the body is built with
  `buildPrefab(spec.prefab, { scale: spec.scale })` and added to `object`) and lines 455-475 (`syncVehicleMesh`: how
  `object.position` and the yaw rotation are set; match that rotation for the impostor).
- `packages/prefabs/src/instances.ts`: how `buildPrefab(id, { tint, shadows, lights, separateTint })` is used and how tint meshes
  are recognised (`mesh.userData.tint === true` when `separateTint` is set). Also `getPrefab(id)` from `@lawn/prefabs` returns
  undefined for an unknown id.
- `games/gnome-theft-auto/src/districts.ts` lines 1-60: `mergeGeometries` import and use.

## Change
Create `games/gnome-theft-auto/src/trafficImpostors.ts` and `games/gnome-theft-auto/src/trafficImpostors.test.ts`.

Per kind, built lazily the first time a pose of that kind arrives:
1. If `getPrefab(VEHICLES[kind].prefab)` is undefined (some prefabs are being added by another worker right now), use a
   fallback: one `BoxGeometry(radius * 1.1, radius * 0.7, radius * 1.6)` lifted so it sits on y = 0, all in the tint group.
2. Otherwise `const root = buildPrefab(spec.prefab, { scale: spec.scale, shadows: false, lights: false, separateTint: true })`,
   `root.updateMatrixWorld(true)`, then traverse meshes: skip any whose material is `transparent` or has `opacity < 1`;
   `geo = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld)`; if indexed, `geo = geo.toNonIndexed()`; delete every attribute
   except `position` and `normal`. Tint meshes (`mesh.userData.tint === true`) go to the tint list. Others get a `color`
   attribute filled with the material's `color` and go to the body list.
3. Add a driver blob to the body list (in vehicle-object space, so use `spec.seat` directly): a red hat
   `ConeGeometry(0.16, 0.42, 6)` (colour 0xc8312b) centred at `seat + (0, 0.72, 0)`, a face `SphereGeometry(0.17, 6, 4)`
   (0xf1c27d) at `seat + (0, 0.42, 0)`, a beard `SphereGeometry(0.13, 6, 4)` (0xf4f4f4) at `seat + (0, 0.34, 0.1)`. Same
   attribute rules (non-indexed, position + normal + color).
4. Body: `mergeGeometries(list, false)` -> `InstancedMesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }), IMPOSTOR_CAPACITY)`.
   Tint (if any): merged -> `InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), IMPOSTOR_CAPACITY)` and per
   instance `setColorAt(i, colour.setHex(pose.tint))`, then `instanceColor.needsUpdate = true`.
   For both: `count = 0`, `frustumCulled = false`, `castShadow = false`, `receiveShadow = false`,
   `instanceMatrix.setUsage(THREE.DynamicDrawUsage)`, `name = 'impostor:' + kind`. Add them to the module's group.
5. `update(poses)`: group by kind; for each kind in use set each instance matrix with
   `m.compose(pos.set(x, y, z), quat.setFromAxisAngle(UP, yaw), ONE)` (UP = (0,1,0), ONE = (1,1,1); reuse scratch objects,
   no allocation per frame), `count = min(n, IMPOSTOR_CAPACITY)`, `visible = true`, `instanceMatrix.needsUpdate = true`.
   Every kind not in this call: `count = 0`, `visible = false`.

## Contract
```ts
import * as THREE from 'three';
import type { VehicleKind } from './types';
export const IMPOSTOR_CAPACITY = 64;
export interface ImpostorPose { kind: VehicleKind; tint: number; x: number; y: number; z: number; yaw: number }
export interface TrafficImpostors {
  /** Holds every impostor mesh; already added to the scene. */
  readonly object: THREE.Group;
  /** Draw exactly these cars this frame; every other impostor is hidden. */
  update(poses: readonly ImpostorPose[]): void;
  /** How many InstancedMeshes are visible with count > 0 after the last update (= draw calls). */
  drawCalls(): number;
  /** Remove the group from the scene and dispose the merged geometries and materials (never the prefab's own geometry). */
  dispose(): void;
}
export function createTrafficImpostors(scene: THREE.Scene): TrafficImpostors;
```

## Tests (`trafficImpostors.test.ts`, vitest, node environment: three.js and `@lawn/prefabs` build fine without a DOM)
1. `update` with 3 'ride-on' and 2 'combine' poses: `drawCalls()` is between 2 and 4; the 'impostor:ride-on' meshes have
   `count === 3`; the instance matrix of ride-on #0 has the position you passed.
2. `update([])`: `drawCalls() === 0`.
3. Every kind in `['push-bike', 'ride-on', 'zero-turn', 'combine', 'lowrider', 'snail-coach', 'mulch-spreader', 'hoa-van']`
   builds without throwing, and a kind whose prefab is missing (`'pot-rod'` may or may not exist yet; also test the fallback by
   temporarily calling with a kind whose prefab id you know is unknown is not possible, so just check 'pot-rod' builds either way).
4. 70 poses of one kind: `count === IMPOSTOR_CAPACITY`, no throw.
5. `dispose()` removes the group from the scene.

## Done when
- `npx vitest run src/trafficImpostors.test.ts` passes, run from `games/gnome-theft-auto`
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your two files

## Out of scope
Every other file (vehicles.ts, traffic.ts, config.ts, the prefabs package).
