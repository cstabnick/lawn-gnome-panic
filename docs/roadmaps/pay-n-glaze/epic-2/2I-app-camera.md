Epic: 2 (Gnome Theft Auto adopts Pay 'n' Glaze)
Depends on: none (epic 1 has landed)

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and `docs/roadmaps/pay-n-glaze/epic-2/_common2.md` first. You own only `games/gnome-theft-auto/src/app.ts`, `games/gnome-theft-auto/src/camera.ts` and the `ChaseCamera` interface inside `games/gnome-theft-auto/src/types.ts` (edit ONLY that interface in types.ts).

## Goal
Wire Pay 'n' Glaze into the running game: the player's owned look is applied to any vehicle of that model they drive, the showroom camera orbits the vehicle while the shop is open (and the controls are frozen), purchases drive the achievements and the physics refresh, and the player's look is broadcast to other players.

## Read first
- `games/gnome-theft-auto/src/app.ts`: the `createGarages(...)` call (near line 165: it already passes `setLook: setVehicleLook` and a no-op `showroom`), `takeWheel`, `getOut`, `refreshDriving`, the frame loop (`const inp = ...` near line 752, `chase.update(...)` near line 1114, `net.setPose({...})` near line 1085, `setVehicleHeadlights(vehicles, nightF > 0.35)`), the `KeyT` handler (~line 722) and the debug `__gta` object at the bottom.
- `games/gnome-theft-auto/src/camera.ts` (all) and the `ChaseCamera` interface in `types.ts` (line ~291).
- `games/gnome-theft-auto/src/garages.ts` (`GarageDeps`: `setLook`, `showroom`, and the NEW `onPurchase` another issue adds; `Garages.isOpen()`).
- `games/gnome-theft-auto/src/glazeStore.ts` (`ownedLoadout`, `GLAZE_KINDS`), `games/gnome-theft-auto/src/glazeAchievements.ts` (stub or finished: `glazeAchievements(info)`; see `docs/roadmaps/pay-n-glaze/epic-2/2L-achievements.md` for its contract; it may not exist yet: if the file is missing when you compile, create nothing, write your call against the contract below and report that you could not compile that line).
- `games/gnome-theft-auto/src/net.ts` (`GtaNet.setLook(code | null)`; implemented by another issue) and `packages/glaze/src/loadout.ts` (`encodeLoadout`, `isStockLoadout`).

## Change
- `types.ts` `ChaseCamera`: add `showroom(target: { x: number; y: number; z: number; radius: number } | null): void;` and `readonly showroomActive: boolean;`.
- `camera.ts`: implement them. While a showroom target is set, `update()` ignores `target`/`mode` and orbits the showroom target: distance `max(5.5, radius * 3.4)`, look height `radius * 0.55` above the target's `y`, pitch eased to 0.2, yaw advancing at 0.35 rad/s unless the player is dragging (`input.camYaw !== 0 || input.camPitch !== 0`, then the drag controls the orbit as normal and the auto-spin pauses for 3 s); no wall clipping and no shoulder offset; position smoothing like the `drive` view; FOV at base. Entering and leaving the showroom eases (no cut longer than the smoothing allows). The other modes are untouched.
- `app.ts`:
  1. **Showroom:** replace the no-op `showroom` dep with `(v) => { chase.showroom(v ? { x: v.x, y: v.y, z: v.z, radius: v.spec.radius } : null); }` and track `showroomVehicle`. While `garages.isOpen()` (either modal) set `inp` to a neutral state for driving: zero `moveX`, `moveY`, `lift`, `enterExit`, `fire`, any boost/jump flags (read how `inp` is built and how `deathT > 0` already neutralises it, and do the same; touch the minimum), and keep the vehicle parked (`v.speed = 0` for the player's vehicle each frame while the shop is open). Keep `canLock` as it is.
  2. **Owned look:** in `takeWheel(v)`, after `v.driver = 'player'`: `const own = ownedLoadout(v.kind); if (own && v.rig) setVehicleLook(v, own)` (so any vehicle of that model the player drives wears the player's Pay 'n' Glaze work; an NPC's own mower becomes theirs: that is the design, the shop "files the VIN off"). Do it before `createSimDrive(v)` so the ride height reaches the physics (`createSimDrive` reads `v.look`).
  3. **Purchases:** pass to `createGarages` the new dep `onPurchase(info)`: `refreshDriving()` (so the chassis is rebuilt with the new ride height) and `glazeAchievements(info)` (from `./glazeAchievements`; contract: `glazeAchievements(info: { kind: VehicleKind; before: Loadout; after: Loadout; spent: number }, tracker: { unlock(id: string): unknown; increment(id: string, by?: number): unknown }): void`; pass the existing `achievements` wrapper used elsewhere in app.ts, the object with `unlock` / `increment`).
  4. **Broadcast:** every frame after `net.setPose`, keep `let sentLook: Loadout | null | undefined` and: `const look = v && v.driver === 'player' && v.look && !isStockLoadout(v.look) ? v.look : null;` when `look !== sentLook` (identity) call `net.setLook(look ? encodeLoadout(look) : null)` and set `sentLook = look`. (The vehicle's `look` object changes identity on every change because `setVehicleLook` stores a normalised copy.)
  5. **Debug hook:** add `glaze: { owned: ownedLoadout, open: (kind?) => ..., look: (patch) => ... }` to `__gta`: `glaze.look(patch)` merges `patch` into the driven vehicle's look through `setVehicleLook` (for demos: `window.__gta.glaze.look({ spoiler: 'picket' })`); `glaze.open()` opens the shop on the driven vehicle via `garages.openGlaze(player.vehicle)`.
  6. **Demo stage `?glaze=<json>`:** with `?mount`, if the URL has a `glaze` parameter holding URL-encoded JSON, apply it to the mounted vehicle once at start through `setVehicleLook(m, normalizeLoadout({ ...defaultLoadout(m.tint), ...JSON.parse(param) }))` (try/catch; ignore garbage). Also `?shop` (with `?mount`): open the shop on the mounted vehicle right after start (`garages.openGlaze(m)`), for the demo recording. Document both in the comment block that already describes `?mount`.
  7. Do not change behaviour for non-ground vehicles (flyers, boats): `v.rig` is undefined for them, so every new branch must be guarded by it.
- No new test file (wiring). Instead run the full existing suite for the game: `npx vitest run games/gnome-theft-auto` and make sure nothing that passed before fails because of you.

## Contract
`ChaseCamera.showroom(target | null): void`, `ChaseCamera.showroomActive: boolean`. URL params `?glaze=<json>` and `?shop` (with `?mount`). `window.__gta.glaze` as above (only with `?debug`). `onPurchase` is passed to `createGarages` in `GarageDeps`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes (if `glazeAchievements.ts` or the `onPurchase` dep do not exist yet because their issues are still running, say which line is waiting on them).
- `npx vitest run games/gnome-theft-auto` has no new failure.

## Out of scope
Every other file. Other issues own `vehicles.ts`, `garages.ts`, `glazeShop.ts`, `net.ts`, `remotes.ts`, `player.ts`, `traffic.ts`.
