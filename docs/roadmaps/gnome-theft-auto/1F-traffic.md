Epic: 1 (parallel modules)
Depends on: none

## Environment

- Repo root: `/home/user/lawn-gnome-panic` (Linux). Run commands from there. Dependencies are installed: do not run `npm install`. Do not commit.
- Game: `games/gnome-theft-auto` (three.js 0.187 + TypeScript + Vite). It already builds: every module exists as a STUB with its final exported signature. Your job is to replace ONE stub (or the files named below) with the real thing.
- About ten other workers are editing the other files of this game at the same time. Edit only the files your issue names. Keep every exported name and signature of your file exactly as in its stub, so other files keep compiling.
- The contracts are in `games/gnome-theft-auto/src/types.ts` (read it first, do not edit it) and all tuning numbers are in `games/gnome-theft-auto/src/config.ts` (read, do not edit). `src/collide.ts` (box collision, `angleDiff`) and `src/gnomes.ts` (town looks, names, `makeGnome`, `poseHandsUp`, `clearHandsUp`, `gnomeState`) are shared helpers: use them, do not edit them. `src/main.ts` is the wiring that calls your module; read it to see how you are called, do not edit it.
- Conventions: y up, 1 unit = one gnome's height (a gnome model is about 1.1 tall). Yaw 0 faces +z; forward = `(Math.sin(yaw), 0, Math.cos(yaw))`; the gnome's right = `(-Math.cos(yaw), 0, Math.sin(yaw))`. Turning right DECREASES yaw. Prefab models from `@lawn/prefabs` stand on y = 0 and face +z.
- `buildPrefab(id, { scale, tint })` (from `@lawn/prefabs`) returns a `THREE.Group`; it throws `Unknown prefab` for an id that does not exist yet. The new ids `squirt-pistol`, `super-soaker`, `zero-turn-mower`, `whirligig-mower`, `sandbag-wall`, `watch-tower` are being added by another worker right now; you may reference them, they will exist when the epic is done.
- Lore (Gnome Theft Auto is a parody set in the town of Turfton): no gore, nothing bleeds or dies; water guns only; soaked gnomes put their hands up and run. Gnomes are fired clay. No humans ever appear.
- Mobile matters: anything a player does must work by touch too (only the input/HUD issues build UI).
- Check: `npx tsc --noEmit -p games/gnome-theft-auto` must show no errors in YOUR files (errors in another worker's file mean they are mid-edit: ignore those). Do NOT run `vite build`, `npm run build` or a dev server: other workers share the folder and the port.

## Goal
`games/gnome-theft-auto/src/traffic.ts` fills Turfton's roads with NPC gnomes driving mowers along the road graph, on the right-hand lane, braking for the player and for each other; a driver can be pulled off (the player steals the mower).

## Read first
- `games/gnome-theft-auto/src/types.ts`: `Traffic`, `Vehicle`, `World` (`roads: RoadGraph`), `RoadNode`.
- `games/gnome-theft-auto/src/config.ts`: `TRAFFIC`, `MOWER_TINTS`, `VEHICLES`.
- `games/gnome-theft-auto/src/traffic.ts`: the stub (keep `export function createTraffic(scene: THREE.Scene, world: World): Traffic`).
- `games/gnome-theft-auto/src/vehicles.ts`: use `createVehicle`, `stepVehicle`, `removeVehicle`, `exitPoint` (another worker rewrites their bodies; signatures stay).
- `games/gnome-theft-auto/src/gnomes.ts`: `randomTownLook`, `gnomeState`; `createGnomeModel` from `@lawn/gnome`.
- `games/gnome-theft-auto/src/collide.ts`: `angleDiff`.

## Change
`games/gnome-theft-auto/src/traffic.ts` only.

- Keep a `Map<number, { from: number; to: number }>` route per NPC vehicle id.
- `update(dt, vehicles, world, playerX, playerZ)`:
  - Spawn: while the number of `vehicles` with `driver === 'npc'` is below `TRAFFIC.count`, pick a random road node 25..90 units from the player (fall back to any node), a random link as the next node, place the vehicle on the right-hand lane just past the node, facing the next node: `createVehicle(scene, kind, x, z, yaw, tint)` with `kind` a random entry of `TRAFFIC.kinds` and a random `MOWER_TINTS` tint; set `driver = 'npc'`; push it into `vehicles`. Add a seated rider: `const look = randomTownLook(); const m = createGnomeModel(look);` `v.object.add(m.object)`; `v.rider = m; v.riderLook = look`. Do not spawn one within 12 units of another vehicle. At most 3 spawns per frame.
  - Drive each `driver === 'npc'` vehicle: the lane target is the `to` node shifted by `world.roads.laneOffset` to the right of the direction of travel (direction `d` = normalised `to - from`; right of `d` = `(-d.z, d.x)`). Steer: `desired = Math.atan2(tx - v.x, tz - v.z)`, `steer = clamp(-angleDiff(desired, v.yaw) * 2, -1, 1)`. Throttle `TRAFFIC.cruise`, `0.3` when `|angleDiff| > 0.6`. Brake (`throttle = -1` while `speed > 0`, then 0) when the player (`playerX, playerZ`) or any other vehicle is less than `TRAFFIC.stopDistance + spec.radius` ahead (in front: dot with forward > 0, sideways offset < 2.5). Call `stepVehicle(v, { throttle, steer, lift: 0 }, dt, world)`.
    Within 4 units of the target: `from = to`, `to` = a random link of the node other than the one we came from (if it is the only link, go back).
  - Keep the rider seated: `v.rider.update(gnomeState(seat x, seat y, seat z, 0, 0, true), dt)` using `v.spec.seat` (local to `v.object`, yaw 0, because the rider is a child of the vehicle root). Reuse one state object; do not allocate per frame.
  - Recycle: an NPC vehicle farther than `TRAFFIC.despawnDistance` from the player is moved to a fresh node 25..90 units from the player (new route, speed 0).
  - Cleanup: if `vehicles.length > 40`, remove (`removeVehicle` + splice) the farthest vehicle with `driver === 'none'` that is not `kind === 'whirligig'` and is more than 60 units from the player.
- `ejectDriver(v)`: if `v.driver !== 'npc'` or no rider, return null. Remove `v.rider.object` from `v.object`, keep the look, set `v.rider = null`, `v.riderLook = null`, `v.driver = 'none'`, `v.speed = 0`, delete the route, return `{ ...exitPoint(v), look }`.
- Also forget routes of vehicles no longer driven by NPCs (`driver !== 'npc'`).

## Contract
`Traffic` exactly as in `types.ts`. The vehicle list is shared: main also holds parked mowers and the Whirligig in it; only touch vehicles with `driver === 'npc'` (plus the cleanup rule above).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/traffic.ts`.

## Out of scope
Every other file. Pedestrians are `npcs.ts`; the fleeing driver is spawned by main.ts through `npcs.spawnFleeing`.
