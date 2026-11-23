Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` first (working directory, toolchain, rules, how to report). You own only the files below.

## Goal
Headlights: new lamp housings on the nose and the coloured bulbs + beams that switch on at dusk.

## Read first
- `packages/glaze/src/types.ts`: `Loadout` (`lamp`, `beam`), `VehicleMounts` (`lamps`, `width`).
- `packages/glaze/src/catalog.ts`: `beamColor(id)`; `packages/glaze/src/lamps.ts`: the stub (`LampBuild`, `buildLamps`).
- `games/gnome-theft-auto/src/vehicles.ts` lines 153-180: the game's current headlights (two 0.11-radius bulbs 0.32 apart at height 0.52, and a cone beam `ConeGeometry(0.9, 5.5, 10, 1, true)`, opacity 0.14, `depthWrite: false`, double sided, tilted `rotation.x = -PI/2 + 0.08`, centred 2.75 ahead). Keep this look and size for the beams (they are in prefab units, which the game scales with the vehicle).
- `docs/roadmaps/pay-n-glaze/_prefabs.md`: the **Lamps** rule: bulb centre `[0, 0.1, 0]`.

## Change
- `packages/glaze/src/lamps.ts`: implement `buildLamps(mounts, loadout)`:
  - `mounts.lamps === null` -> `{ housings: null, beams: null }`.
  - `k = mounts.width / 1.2`. For each lamp position `p` (index 0 = left, +x; index 1 = right, -x): a **bulb** `THREE.Mesh` (module-level shared geometry `SphereGeometry(0.08, 8, 6)`, `scale.setScalar(k)`) with a shared `MeshBasicMaterial({ color })` per beam colour (cache by colour), at `p`; and a **beam** `THREE.Mesh(ConeGeometry(0.9, 5.5, 10, 1, true))` (shared geometry), `MeshBasicMaterial({ color, transparent: true, opacity: 0.14, depthWrite: false, side: DoubleSide })` cached by colour, rotated `x = -PI/2 + 0.08`, positioned at `p + (0, 0.04, 2.75)`, scale `k`. (The cone's apex must be at the lamp, so with the cone centred 2.75 ahead and rotated it works as in the game's code.) Both into `beams`, a `THREE.Group` named `'glaze-beams'`. Colour = `beamColor(loadout.beam)`.
  - Housings (only when `loadout.lamp !== 'stock'` and the prefab `glaze-lamp-<id>` exists, `getPrefab` from `@lawn/prefabs`): for every lamp except `'bar'`, `buildPrefab('glaze-lamp-' + id)` (no scale arg), put it in a holder at `p - (0, 0.1 * k, 0)` with `holder.scale.setScalar(k)`; the right lamp (index 1) is the same prefab with `holder.scale.x = -k` (a mirrored copy). For `'bar'`: ONE prefab at the midpoint `((p0.x + p1.x) / 2, p0.y - 0.1*k, p0.z)` with `scale k`. All in a `THREE.Group` named `'glaze-lamps'`, `castShadow` true on meshes. For `lamp === 'popup'` also raise the housing's bulbs by `0.03*k` (so the bulb appears to pop out): add `0.03*k` to the y of that lamp's bulb and beam.
  - Bulbs and beams for `lamp === 'stock'` are built too (at the same `mounts.lamps`).
  - Do not add the beams to the housings group; return them separately.
- `packages/glaze/src/lamps.test.ts` (new): hand-write `mounts` (`lamps: [[0.32, 0.5, 0.9], [-0.32, 0.5, 0.9]]`, `width: 1.2`); `null` lamps -> both `null`; stock lamp -> `housings === null`, `beams` has 4 children (2 bulbs + 2 beams), the first bulb's world position equals `[0.32, 0.5, 0.9]`; scaling: positions are the mounts as given and only sizes scale (with `width: 2.4` a bulb's `scale.x === 2`). A beam colour: `beam: 'rose'` -> the bulb material colour hex equals `beamColor('rose')`. With a lamp style whose prefab is missing (all of them until the prefab worker finishes) `housings` is `null`: write the housing assertions guarded by `getPrefab('glaze-lamp-round') ? ... : skip` (use `it.skipIf`).

## Contract
`buildLamps(mounts: VehicleMounts, loadout: Loadout): LampBuild`; `LampBuild = { housings: THREE.Group | null; beams: THREE.Group | null }`.

## Done when
- `npx tsc --noEmit -p packages/glaze` has no error in `lamps.ts` / `lamps.test.ts`.
- `npx vitest run packages/glaze/src/lamps.test.ts` passes.

## Out of scope
Every other file.
