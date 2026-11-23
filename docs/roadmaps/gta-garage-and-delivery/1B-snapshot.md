Epic: 1 Modules
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn. Game: games/gnome-theft-auto (Vite + TypeScript + three.js, vitest).
In Git Bash, if node is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
Other workers edit OTHER files of this game at the same time. Do not commit, push, stash or switch branches. Do not run
`vite build` or a dev server. `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files that are not yours:
ignore those, fix only errors in your files.

## Goal
Fill `games/gnome-theft-auto/src/lockup/snapshot.ts`: turn a live `Vehicle` into a saved `VehicleSnapshot`, say whether
a vehicle may be stored, and rebuild a stored vehicle in the scene. Plus a unit test.

## Read first
- games/gnome-theft-auto/src/lockup/types.ts: `StorageKind`, `StoredVehicle`, `VehicleSnapshot`.
- games/gnome-theft-auto/src/lockup/snapshot.ts: the stub (keep the four exported names and signatures).
- games/gnome-theft-auto/src/types.ts lines 187-257: `interface Vehicle` (fields kind, spec (spec.name, spec.flies,
  spec.boat), tint, look (a @lawn/glaze Loadout), rig, hp, damage, exploded, sunk, variant, enginePitch, waterlog,
  waterlogStalled, driver, questOwned).
- games/gnome-theft-auto/src/fleet.ts: `fleetEntry(id)` and `applyVariant(v, e, rng)` (sets v.variant, v.spec name/speed, v.enginePitch).
- games/gnome-theft-auto/src/vehicles.glaze.test.ts top 10 lines: how a test builds vehicles (`vi.mock('./audio', ...)`
  then `await import('./vehicles')`, `new THREE.Scene()`).

## Change
- games/gnome-theft-auto/src/lockup/snapshot.ts:
  - `storageKindOf(v)`: `v.spec.flies ? 'air' : v.spec.boat ? 'water' : 'ground'`.
  - `cannotStore(v, kind, owned)`: return the first matching sentence, else null:
    - `v.exploded` -> 'That is a wreck. Tansy does not store wrecks.'
    - `v.sunk` -> 'Get it out of the water first.'
    - `storageKindOf(v) !== kind` -> kind 'ground': 'The Lock-Up only takes ground vehicles.'; 'air': 'The hangar only takes aircraft.'; 'water': 'The boathouse only takes boats.'
    - `v.driver === 'remote'` -> 'That one belongs to another player.'
    - `v.questOwned && !owned` -> 'That one is spoken for (a job or a boat on its mooring).'
  - `snapshotVehicle(v)`: `{ kind: v.kind, variant: v.variant ?? null, name: v.spec.name, tint: v.tint,
    look: v.look ? encodeLoadout(v.look) : null, hp: Math.max(0.05, Math.min(1, v.hp)), enginePitch: v.enginePitch ?? null }`.
    `encodeLoadout` and `decodeLoadout` come from '@lawn/glaze'.
  - `restoreVehicle(scene, rec, x, z, yaw)`:
    1. `const v = createVehicle(scene, rec.kind, x, z, yaw, rec.tint)` (from '../vehicles').
    2. If `rec.variant`: `const e = fleetEntry(rec.variant)`; if e, `applyVariant(v, e)` (from '../fleet').
    3. `v.spec = { ...v.spec, name: rec.name }`; if `rec.enginePitch !== null` set `v.enginePitch = rec.enginePitch`.
    4. If `rec.look` and `v.rig`: `const l = decodeLoadout(rec.look)`; if l, `setVehicleLook(v, l)` (from '../vehicles').
    5. If `rec.hp < 1`: `damageVehicle(v, 1 - rec.hp)` (from '../vehicles'; it sets v.hp and the damage model).
    6. `v.questOwned = true` (ambient traffic never recycles an owned vehicle); `v.waterlog = 0; v.waterlogStalled = false`.
    7. Return v (do not push it into any list).
- games/gnome-theft-auto/src/lockup/snapshot.test.ts (new). Start with
  `vi.mock('../audio', () => ({ play: () => undefined }));` then dynamic imports (`await import('./snapshot')`,
  `await import('../vehicles')`). Tests: storageKindOf for 'ride-on' (ground), 'plane' (air), 'clog-cruiser' (water);
  cannotStore: exploded, wrong kind, questOwned not owned vs owned; round trip: create a 'zero-turn' with
  `createVehicle(scene, 'zero-turn', 0, 0, 0, 0x2f64c9)`, damage it with `damageVehicle(v, 0.4)`, snapshot it, build a
  StoredVehicle `{ ...snap, uid: 'lk-test', storedAt: 1 }`, restoreVehicle at (5, 5, 1) and expect same kind, name,
  tint, look (compare `encodeLoadout`), hp close to the original (toBeCloseTo 2 digits), questOwned true, x 5; variant:
  restore a record with `variant: 'golf-cart', kind: 'golf-cart'` and expect `v.variant === 'golf-cart'`.

## Contract
Exports, unchanged names and types:
`storageKindOf(v: Vehicle): StorageKind`, `cannotStore(v: Vehicle, kind: StorageKind, owned: boolean): string | null`,
`snapshotVehicle(v: Vehicle): VehicleSnapshot`, `restoreVehicle(scene: THREE.Scene, rec: StoredVehicle, x: number, z: number, yaw: number): Vehicle`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/lockup/snapshot.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/lockup/snapshot.ts or its test.

## Out of scope
Every other file: vehicles.ts, fleet.ts, types.ts and lockup/types.ts are read-only for you.
