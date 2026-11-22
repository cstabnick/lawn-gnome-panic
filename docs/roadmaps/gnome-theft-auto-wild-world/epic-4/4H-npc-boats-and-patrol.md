Epic: 4 (Wild World: water, bridges and boats)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: if `node`/`npm` is not found, in Git Bash run `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
  installed: never run `npm install`. Never commit, push, stash, reset, or `git checkout`/`git restore` any file.
- About ten other workers and two other planning sessions edit other files of this game at the same time. Edit only
  the files this issue names. If `tsc` or a test fails in a file you do not own, someone is mid-edit: ignore it.
- The boat prefabs are being modelled by another worker right now. `createVehicle` throws for a prefab that does not
  exist yet, so: create boats only when `getPrefab(VEHICLES[kind].prefab)` (from `@lawn/prefabs`) is defined, and
  never call `createVehicle` in a test (test the pure steering helpers instead).
- Another worker is rewriting `boats.ts` (the boat physics) at the same time. Drive boats only through
  `stepVehicle(v, controls, dt, world)` from `./vehicles` (it hands boats to `boats.ts stepBoat`). Do not edit boats.ts.

## Goal
`games/gnome-theft-auto/src/boatTraffic.ts` puts a few NPC boats on the water (the Watering-Can Steamer ferry on Loch
Moss, a Walnut Dinghy on the canal, a Gravy Boat on the Puddle Sea) and, when the player is in a boat with 3 or more
hats of Hat Watch heat, sends an **HOA Patrol Boat** after them. Today it is a planner stub with no boats.

## Read first
- `games/gnome-theft-auto/src/boatTraffic.ts`: the stub and its exported signature (keep it).
- `games/gnome-theft-auto/src/vehicles.ts`: `createVehicle(scene, kind, x, z, yaw, tint?)`, `stepVehicle(v, c, dt,
  world)`, `removeVehicle(scene, v)`.
- `games/gnome-theft-auto/src/types.ts`: `Vehicle` (`driver`, `questOwned`, `speed`, `yaw`, `spec`, `exploded`),
  `DriveControls` (throttle -1..1, steer -1..1 with +1 = turn right), `Player` (`x`, `z`, `vehicle`).
- `games/gnome-theft-auto/src/water.ts`: `BODIES` (`water/loch-moss` centre (-700, -680), a 150, b 120;
  `water/puddle-sea` centre (690, 830), a 200, b 60), `shorePoint(w, angle)` (a point on the shore at that angle).
- `games/gnome-theft-auto/src/terrain.ts`: `waterAt(x, z)` (`{ surface, depth } | null`).
- `games/gnome-theft-auto/src/collide.ts`: `angleDiff(to, from)`.
- `games/gnome-theft-auto/src/config.ts`: `WATER.patrolHats` (3), the boat specs in `VEHICLES`.

## Change
- `games/gnome-theft-auto/src/boatTraffic.ts`:
  - Export pure helpers:
    - `loopRoute(bodyId: string, scale: number, count: number): { x: number; z: number }[]`: `count` points on the
      body's shore pulled in toward its centre (`centre + (shorePoint(b, 2 * PI * i / count) - centre) * scale`).
    - `steerToward(v: { x: number; z: number; yaw: number }, tx: number, tz: number): number`: the steer (-1..1)
      that turns toward (tx, tz): `clamp(-angleDiff(atan2(tx - x, tz - z), yaw) * 1.5, -1, 1)` (steer +1 turns right,
      which lowers yaw).
    - `patrolSpawn(px: number, pz: number): { x: number; z: number; yaw: number } | null`: the first of 16 points on a
      40 m ring around (px, pz) (then a 60 m ring) where `waterAt` depth >= 1.2, yaw facing (px, pz); null if none.
  - `createBoatTraffic(scene, vehicles, world)`: a list of NPC routes, created lazily on the first `update` (so the
    prefabs have loaded): steamer on `loopRoute('water/loch-moss', 0.6, 8)`, gravy boat on
    `loopRoute('water/puddle-sea', 0.55, 6)`, dinghy shuttling between (-180, 230) and (-110, 230) on the canal's
    west pound. Each: `createVehicle(scene, kind, start.x, start.z, yaw)`, `driver = 'npc'`, `questOwned = true` (so
    traffic.ts never takes it), pushed into `vehicles` and into `boats`.
  - `update(dt, player, hats)`: for each NPC boat (skip `exploded`; skip one the player has taken: `driver !== 'npc'`):
    throttle 0.6 (steamer 0.8), `steer = steerToward(...)` at the next waypoint, advance the waypoint within 12 m;
    `stepVehicle(v, { throttle, steer, lift: 0 }, dt, world)`. A boat farther than 450 m from the player is not
    stepped (it waits).
  - Patrol: when `hats >= WATER.patrolHats` and `player.vehicle?.spec.boat` and no patrol is out, spawn a
    `hoa-patrol-boat` at `patrolSpawn(player.x, player.z)` (if not null), `driver = 'npc'`, `questOwned = true`; it
    chases: full throttle, `steerToward(player)`; within 6 m it slows to throttle 0.4 (the vehicle-vehicle bump code
    in app.ts already handles rams). It leaves (`removeVehicle`, removed from `vehicles` and `boats`) when hats have
    been below `patrolHats` for 20 s, or the player has been out of a boat for 20 s and is farther than 120 m from it.
- `games/gnome-theft-auto/src/boatTraffic.test.ts` (new): `loopRoute('water/loch-moss', 0.6, 8)` gives 8 points all
  with `waterAt` depth > 1; `steerToward` returns > 0 for a target to the boat's right (boat at origin, yaw 0, target
  at (-10, 10): the right side is -x) and < 0 for one on the left; `patrolSpawn(-700, -620)` returns a point in the
  loch with depth >= 1.2, and `patrolSpawn(0, 0)` (Turfton, no water within 60 m) returns null.

## Contract
```ts
export interface BoatTraffic { readonly boats: readonly Vehicle[]; update(dt: number, player: Player, hats: number): void }
export function createBoatTraffic(scene: THREE.Scene, vehicles: Vehicle[], world: World): BoatTraffic
export function loopRoute(bodyId: string, scale: number, count: number): { x: number; z: number }[]
export function steerToward(v: { x: number; z: number; yaw: number }, tx: number, tz: number): number
export function patrolSpawn(px: number, pz: number): { x: number; z: number; yaw: number } | null
```
`app.ts` already calls `createBoatTraffic(scene, vehicles, world)` and `update(dt, player, Math.floor(watch.heat))`
every frame; do not edit app.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `boatTraffic.ts` or its test.
- `(cd games/gnome-theft-auto && npx vitest run src/boatTraffic.test.ts)` passes.

## Out of scope
`app.ts`, `vehicles.ts`, `boats.ts`, `traffic.ts`, `police.ts`, any other file.
