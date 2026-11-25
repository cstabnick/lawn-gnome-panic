Epic: E12-A (winter sports, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E12/issues/_env.md` first (environment, rules).

## Goal
`winter/iceFishing.ts` lets a gnome on foot drill holes in pond ice: on painted ice, the E prompt "Drill a hole in the
ice" starts a short drill (an ice auger turning in the spot for `ICE.drillS` seconds); then a dark round hole lies on the
ice and is registered with fishing (`setIceHoleSource`), so the normal rod fishes it.

## Read first
- `games/gnome-theft-auto/src/winter/types.ts`: `ICE` (`drillS` 1.6, `holeR` 0.45, `maxHoles` 4, `reach` 2.5).
- `games/gnome-theft-auto/src/winter/iceFishing.ts`: the stub: `IceFishingDeps`, `IceFishing`, `createIceFishing(deps)`.
  Keep every signature.
- `games/gnome-theft-auto/src/fishing/waterKind.ts`: `IceHole { x, z, y, r }`, `setIceHoleSource(fn)`, `iceHoleNear`.
- `packages/depth/src/layers.ts` (or the `@lawn/depth` index): `flatLayer(material, LAYER.marking)` and `LAYER`.

## Change
`src/winter/iceFishing.ts`, `createIceFishing(deps)`:
- State: `holes: IceHole[]` (each `{ x, z, y: deps.heightAt(x, z) - 0.04, r: ICE.holeR }`) and one mesh per hole.
  On creation call `setIceHoleSource(() => holes)`.
- Hole mesh: a `THREE.CircleGeometry(ICE.holeR, 20)` with a dark blue-black `MeshBasicMaterial` (0x0d1a24) through
  `flatLayer(material, LAYER.marking)`, rotated flat (`rotation.x = -Math.PI / 2`), at `heightAt + 0.02`; plus a thin
  pale slush ring around it (`THREE.RingGeometry(ICE.holeR, ICE.holeR + 0.12, 20)`, 0xe8f2f8, also `flatLayer` with
  `LAYER.marking`, at `heightAt + 0.015`: different heights, so no z-fight). Add both to a group in `deps.scene`.
- `prompt(x, z)`: null unless `deps.surfaceAt(x, z) === 'ice'` and no hole is within `ICE.reach` (use `iceHoleNear(x, z,
  ICE.reach)`) and not already drilling; else `'Drill a hole in the ice'`.
- `interact(x, z)`: when the prompt is non-null, start drilling at `(x, z + 0.8)` (just south of the gnome), provided
  that point is also ice (else return false); show an `ice-auger` prop
  (`buildPrefab('ice-auger', { lights: false })` from `@lawn/prefabs`, once, reused) standing at the spot; `deps.play(
  'shutter')`-like click is not needed: call `deps.play('ice-drill')` (an unknown id is ignored by the caller). Return true.
- `update(dt, px, pz, onFoot)`: while drilling: progress += dt / ICE.drillS; the auger spins (rotation.y += 12 * dt) and
  sinks 0.3 m over the drill; cancel (toast "You stopped drilling.") if `!onFoot` or the player moved more than 1 m from
  where the drill started. At progress 1: add the hole (if there are already `ICE.maxHoles`, remove the oldest hole and
  its meshes first), hide the auger, `deps.toast('A hole in the ice. Fish it with your rod.')`, `deps.onHole()`.
- `holes()`, `drilling()` (0..1 progress or -1), `drillNow(x, z)` (adds a hole at once if that point is ice; true when
  added; used by the debug trainer and tests).
- New `src/winter/iceFishing.test.ts` (vitest; `three` works headless): a fake `surfaceAt` that is 'ice' for x < 0 and
  'snow' otherwise, `heightAt` = 3:
  - prompt on ice, null on snow; interact + updates of 0.1 s for 1.7 s at the same spot makes exactly one hole at (x,
    z + 0.8) with y 2.96, `onHole` called once; `iceHoleNear` (from fishing/waterKind) finds it; `fishWaterAt(hole.x,
    hole.z)` is `'ice'` (import from `../fishing/waterKind`; `waterAt` is null there in the headless world, which is
    fine because the test point is far from any water: use (-5000, -5000)-ish coordinates, which are off the map and dry).
  - moving 2 m during the drill cancels it (no hole); `!onFoot` cancels it.
  - a fifth hole removes the first (`holes().length` stays 4).
  - prompt is null within `ICE.reach` of an existing hole.
  Call `setIceHoleSource(null)` in `afterEach` so other tests are not affected.

## Contract
`createIceFishing(deps): IceFishing` with the stub's types. The runtime (another worker) creates it with real
`surfaceAt` (`terrain.ts`), `heightAt`, `hud.toast`, sound and the save's `recordHole`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/winter/iceFishing.test.ts src/fishing` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/winter/iceFishing*.ts`.

## Out of scope
`fishing/*` (read only), every other winter file.
