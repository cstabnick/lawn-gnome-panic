Epic: E02-1 Engine pieces
Depends on: none
Items: L78 ("allow me to crack gnomes who are driving")

(Environment: paste `_environment.md`.)

## Goal
A bullet that hits an NPC driver's head cracks the driver like a pedestrian (falls out cracked, quest/heat/achievement credit), and the car rolls to a stop.

## Read first
- `types.ts` `Traffic` (~593): optional members `driverAt?(x, y, z): Vehicle | null` and `crackDriver?(v): { x: number; z: number; look: GnomeLook } | null` (already declared with docs). `Npcs.spawnFleeing(x, z, fromX, fromZ, look): Npc` and `Npcs.crack(npc, playerX, playerZ)`.
- `traffic.ts` `ejectDriver` (~843): removes the rider (`clearHands(v.rider)`, `v.object.remove(v.rider.object)`, `v.rider = null`, `v.riderLook = null`, `v.driver = 'none'`, `v.speed = 0`, `drivers.delete(v.id)`, drops the ghost). Members live in the object literal returned by `createTraffic`. `seatWorld(v, out, seat)` in `vehicles.ts` (~799) gives the seat in world space.
- `app.ts` `hitTest(x, y, z)` (~1184): the pedestrian crack block (`npcs.hitTest` -> ambulances.dispatch, quests.onCracked, npcs.crack, crackAchievements, stats.cracked++, watch.addHeat(HEAT.crackPedestrian), achievements.increment('gta-rainmaker'), toast, play('crack')); then officers, sky, online, then the vehicle loop that damages vehicles.
- `traffic.test.ts`: how tests create traffic and vehicles.

## Change
- `traffic.ts`: implement `driverAt(x, y, z)`: over the live vehicles this traffic drives (keep a reference to the `vehicles` array passed to `update`, filtered to `v.driver === 'npc'`, `v.rider` set, not exploded, with a record in `drivers`): head point = `seatWorld(v, tmp, 0)` + (0, h, 0) with `h = clamp(DRIVER_HEAD_HEIGHT_PER_SCALE * v.spec.scale, 0.6, 1.6)`; hit when the distance to (x, y, z) < `DRIVER_HIT_RADIUS * Math.max(1, v.spec.scale / 1.5)`. New consts at the top: `DRIVER_HEAD_HEIGHT_PER_SCALE = 0.75`, `DRIVER_HIT_RADIUS = 0.45`. Return the first hit. `crackDriver(v)`: the same as `ejectDriver` except the car is not stopped dead (do not zero `v.speed`; with `v.driver = 'none'` the game's coasting step slows it) and the returned (x, z) is the seat's world position, so the cracked gnome appears in the seat. `ejectDriver` and `crackDriver` share one private function (no copied code); `ejectDriver` behaves exactly as before.
- `app.ts`, inside `hitTest` only: move the pedestrian crack statements into a local `function crackNpc(n: Npc): void` used by the pedestrian path (same statements, same order); then right after the pedestrian check add: `const dv = traffic.driverAt?.(x, y, z); if (dv) { const out = traffic.crackDriver?.(dv); if (out) { const n = npcs.spawnFleeing(out.x, out.z, player.x, player.z, out.look); crackNpc(n); void achievements.increment('gta-driver-down'); fx.spark(x, y, z); return true; } }`. Import the `Npc` type if needed. Nothing else in app.ts.
- `traffic.test.ts`: a live NPC car (from the traffic update or `spawnConvoy`): `driverAt` at its head point returns it, 2 m above returns null; `crackDriver` returns a look and leaves `v.driver === 'none'`, `v.rider === null`, and `driverAt` then returns null for it; `ejectDriver` unchanged.

## Contract
`Traffic.driverAt` / `Traffic.crackDriver` exactly as declared in types.ts. Achievement id `gta-driver-down` (added to the catalog by another issue in this epic; check `achievements.increment` with an unknown id does not throw).

## Done when
- `npx vitest run src/traffic.test.ts src/trafficSim.test.ts src/traffic.levels.test.ts` pass; `npx tsc --noEmit -p .` clean for traffic.ts and app.ts.

## Out of scope
`weapons.ts`, `npcs.ts`, `police.ts`, `types.ts`, any other part of app.ts.
