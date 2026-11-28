Epic: FX11 A (coast fixes, parallel) · Issue A12: sea traffic: the Saltcut boat stops short of the Queen, and a fishing smack far out (G3#30)
Depends on: none · Agent: Haiku · Dev port 5532

(The Environment section the lead gave you applies.)

## Goal
Editor (G3#30): "The Saltwater only has clog cruisers, gravy boats and walnut dinghies, the same as the canal ... The Saltcut route ends at (300, 1300), just off the Queen's hull (deck to z 1276)." Fix: end the Saltcut run further out at about (450, 1330), and add one sea-going silhouette far out: a fishing smack working slowly along the horizon.

## Read first
- `games/gnome-theft-auto/src/boatTraffic.ts` (all of it: `createBoatTraffic(scene, vehicles, world)`, `allRoutes`, `update(dt, player, hats)`), and `boatTraffic.test.ts`.
- `games/gnome-theft-auto/src/water.ts` / `src/terrain.ts`: how a water surface height is read (`waterAt(x, z)` from `./terrain` is already imported in boatTraffic.ts; check what it returns).
- Prefab `fishing-smack` is being added right now in `packages/prefabs/src/catalog/gta-coast-beach.ts`: a small sea-going fishing boat, hull 2.0 long along z (bow +z) at scale 1, waterline at local y 0.15, the game uses scale 6. Guard with `getPrefab('fishing-smack')` (already imported in this file) so the module still works before it lands.

## Change: `src/boatTraffic.ts` (+ `boatTraffic.test.ts`)
1. The Saltcut clog cruiser: `to: { x: 300, z: 1300 }` becomes `to: { x: 450, z: 1330 }`. (Another worker is bending the Saltcut channel right now; the route follows the path automatically.)
2. A fishing smack: a scenery prop, not a vehicle (no new vehicle kind): if `getPrefab('fishing-smack')`, build it once with `buildPrefab('fishing-smack', { lights: false, scale: 6 })`, add it to the scene, and in `update(dt)` move it slowly (2.5 m/s) back and forth along a far line at z 1560 between x -1300 and 1300, turning round at each end over ~10 s (yaw eases to the new heading; bow +z, so heading east is yaw PI/2), at the water surface minus its waterline (0.15 x 6 m), with a slow bob (+-0.25 m) and roll (+-0.04 rad). It must be cheap: one object, no allocation per frame. Export a pure `smackPose(t: number): { x: number; z: number; yaw: number }` (deterministic in elapsed seconds t, so every client sees the same boat) and use it.
3. Tests: the Saltcut route's last point is (450, 1330) and is in water at least 1.5 m deep (`waterDepthAt` from `./water`); `smackPose` stays within x -1300..1300 at z 1560 and in water for t from 0 to 4000 s in 50 s steps.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/boatTraffic.test.ts` passes; `npx tsc --noEmit -p games/gnome-theft-auto` clean in your file.
- Shot (port 5532): `sea:0,1185,0` (from the beach looking out to sea; the smack should be a small silhouette on the horizon somewhere along the line; it may be off to the side at load time: try `?` a couple of shots or temporarily log its position).

## Out of scope
The level file and the Saltcut path (another worker), `src/coast/*`, the vehicle specs.
