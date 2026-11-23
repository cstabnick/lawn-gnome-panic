Epic: 2 (parallel build)
Depends on: none (the store prefabs, the shop sheet and the gun rig are being written by other workers right now; your code must cope
with a missing prefab by skipping that piece, and calls their final signatures)

## Environment
Read `docs/roadmaps/gta-gun-store/_common.md` first.

## Goal
`createGunStore(deps)` in `games/gnome-theft-auto/src/gunStore.ts`: the Ammu-Gnation storefront stands on the east edge of Turfton with
collision boxes and a "Shop mods" prompt at its counter; using it opens the shop sheet and shows the modded gun big on a turntable in a
back-room stage far off the map, which the showroom camera orbits.

## Read first
- `games/gnome-theft-auto/src/gunStore.ts`: the stub. Keep `GUN_STORE`, `GUN_STORE_BLIP`, `GunStoreDeps`, `GunStore`, `createGunStore` exactly.
- `games/gnome-theft-auto/src/glazeStage.ts`: the whole file (~150 lines). Copy its approach for the back room: a group far off the map,
  hidden until the shop opens, a floor disc, a backdrop sphere, props built with `buildPrefab`, point lights, a canvas-texture sign.
- `games/gnome-theft-auto/src/gunShop.ts`: `createGunShop(ui, hud, deps)` and `GunShopDeps` (another worker fills it; its signature is final).
- `games/gnome-theft-auto/src/camera.ts` lines 60-80: `ShowroomTarget` and how `showroom(target)` frames it (look point = `y + radius * 0.55`,
  distance = `target.distance` when given).
- `games/gnome-theft-auto/src/world.ts` lines 238-256: `instantiate` / `boxOf` (how a building prefab is scaled, turned and placed).

## Change
- `games/gnome-theft-auto/src/gunStore.ts`: implement `createGunStore(deps)`.

### Storefront (in the world)
- `const y0 = heightAt(GUN_STORE.x, GUN_STORE.z)` (from './terrain'). If `getPrefab('gta-ammu-gnation')`: `buildPrefab('gta-ammu-gnation')`,
  `scale.setScalar(GUN_STORE.scale)`, `rotation.y = GUN_STORE.yaw`, `position.set(GUN_STORE.x, y0, GUN_STORE.z)`, every mesh
  `castShadow = receiveShadow = true`, `deps.scene.add(...)`.
- A sign name plate: a canvas texture (1024 x 128, bold white "AMMU-GNATION" text with a dark outline on transparent) on a
  `PlaneGeometry(2.9, 0.36)` with `MeshBasicMaterial({ map, transparent: true, depthWrite: false })` passed through
  `flatLayer(mat, LAYER.decal)` from '@lawn/depth' (if `LAYER` has no `decal`, use its highest entry), added as a child of the building at
  prefab-local `(0.25, 2.45, 1.99)` (it scales and turns with the building). Skip it when `document` is undefined.
- Local -> world: the building's local point `(lx, lz)` (prefab units) is at
  `x = GUN_STORE.x + S * (lx * cos(yaw) + lz * sin(yaw))`, `z = GUN_STORE.z + S * (-lx * sin(yaw) + lz * cos(yaw))`
  with `S = GUN_STORE.scale`, `yaw = GUN_STORE.yaw` (three.js `rotation.y`). With yaw = -PI/2 the open front (+z local) faces world -x.
- `boxes`: four collision boxes from these prefab-local rectangles (`[minX, maxX, minZ, maxZ, height]`), each turned into a world AABB by
  transforming its four corners and taking min/max, with `h = y0 + height * S`:
  - left wall `[-2.2, -1.9, -1.8, 1.8, 2.16]`, right wall `[1.9, 2.2, -1.8, 1.8, 2.16]`, back wall `[-1.92, 1.92, -1.79, -1.49, 2.0]`,
    counter `[-1.3, 1.3, -0.94, -0.46, 0.44]`.
  Return them in `boxes` even if the prefab is missing (the game adds them to `world.boxes` once).
- `blip`: `{ x: GUN_STORE.x, z: GUN_STORE.z, color: GUN_STORE_BLIP }`.
- Counter serve point: prefab-local `(0, -0.1)` in world coordinates. `prompt(player)`: when `!player.vehicle && !player.airborne` and
  `Math.hypot(player.x - sx, player.z - sz) <= 2.4` and the shop is closed, return `'Shop mods at Ammu-Gnation'`; else null.
- `interact(player)`: if `prompt(player)` is null, do nothing. If `deps.heat() >= 1`: `deps.hud.toast('Ammu-Gnation: "Not with the Hat Watch on your tail, pal. Come back clean."')`,
  `deps.play('alarm')`, stop. Else open (below).

### Back room (the display stage)
- `const STAGE = { x: 4000, z: 900 }` (far outside the map; the Pay 'n' Glaze stage is at 4000, 0). A `THREE.Group` at
  `(STAGE.x, heightAt(STAGE.x, STAGE.z), STAGE.z)`, `visible = false`, added to the scene once, built lazily on the first open.
- Floor: a concrete-grey `CircleGeometry(30, 40)` disc lying flat at y 0.02 (`MeshStandardMaterial` roughness 1, colour 0x5a5a55) through
  `flatLayer(mat, LAYER.ground)` (or the lowest LAYER entry), plus a backdrop sphere like glazeStage's but olive at the top, orange at the
  horizon, dark below (`0x1d2410`, `0x4b5d2a`, `0xff7a1a`, `0x2a2a24`).
- Props via `buildPrefab` (skip any `getPrefab` misses): `ammu-stage-pegboard` at `(0, 0, -5)` scale 2.5 facing +z; `ammu-stage-counter` at
  `(-3.2, 0, -1.5)` scale 2 turned 0.5 rad toward the middle; `ammu-stage-turntable` at `(0, 0, 0)` scale 2.5 (its top is at y = 0.3 * 2.5 = 0.75).
- Lights: a warm `PointLight(0xffe2b0, 80, 40, 1.6)` at `(0, 6, 3)` and an orange `PointLight(0xff7a1a, 40, 30, 1.6)` at `(2.5, 2, -3)`.
- Display gun: a `THREE.Group` `display` at `(0, 1.75, 0)` in the stage group. `preview(gun, loadout)` (the shop's dep) removes the old gun
  and adds `buildModdedGun(gun, loadout, { scale: 7 })` (from './gunRig') turned to lie on its side: `gunObj.rotation.x = Math.PI / 2`
  (barrel toward +z, the gun's underside down), then `display.rotation.y = Math.PI / 2` (barrel toward +x); then centre it: measure
  `Box3.setFromObject(gunObj)` in display space and offset `gunObj.position` by minus the box centre. Hide nothing else.
- Camera target while open: `deps.showroom({ x: STAGE.x, y: groundY + 1.75 - 0.55 * 1.2, z: STAGE.z, radius: 1.2, distance: 5.5 })` (so the
  look point is the display gun's centre).

### Open / close
- `const shop = createGunShop(deps.ui, deps.hud, { acorns: () => deps.economy.state().acorns, spend: (n, r) => deps.economy.spend(n, r),
  play: deps.play, preview, testFire: (g, l) => playGunShot(g, moddedGun(g, l).sound), onFit: deps.onFit, onClose })`
  (`playGunShot` from './gunSounds', `moddedGun` from './gunMods').
- Open: build the stage if needed, `stage.visible = true`, `shop.open(deps.currentGun())` (which calls `preview`), then `deps.showroom(target)`.
- `onClose` (the shop calls it): `stage.visible = false`, `deps.showroom(null)`.
- `isOpen()` = `shop.isOpen()`; `close()` = `shop.close()`.
- `update(dt)`: while open, bob the display gun gently: `display.position.y = 1.75 + 0.05 * Math.sin(time * 1.6)` (do not spin it; the
  showroom camera orbits by itself).

## Contract
The stub's exports, unchanged (`GUN_STORE = { x: 200, z: -30, yaw: -Math.PI / 2, scale: 3 }`). Prefab ids: `gta-ammu-gnation`,
`ammu-stage-counter`, `ammu-stage-pegboard`, `ammu-stage-turntable` (top at y = 0.3 at scale 1). Shop and rig signatures as in their stubs.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `gunStore.ts`.
- `games/gnome-theft-auto/src/gunStore.test.ts` (new, vitest, call `installFakeDom()` from './testing/fakeDom' first; build with
  `new THREE.Scene()` and a fake `hud` `{ toast() {} }` cast as `Hud`, a fake economy from `createEconomy()` with an in-memory storage):
  the four `boxes` are finite, every box has `minX < maxX`, `minZ < maxZ`, all lie within 8 units of `(GUN_STORE.x, GUN_STORE.z)`, the
  counter box is lower than the walls; `prompt` returns the string for a player object `{ x: sx, z: sz, vehicle: null, airborne: false }`
  (cast) at the serve point and null 10 units away. `npx vitest run src/gunStore.test.ts` passes.

## Out of scope
`gunShop.ts`, `gunRig.ts`, `app.ts` (the planner wires the store into the game), `world.ts`, the level JSON files, every other file.
