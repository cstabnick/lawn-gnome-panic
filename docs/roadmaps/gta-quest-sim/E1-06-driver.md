Epic: 1 (solvers and tools, all parallel)
Depends on: none

(Read `docs/roadmaps/gta-quest-sim/_env.md` first: environment, style and solver rules.)

## Goal
The bot can get about for real, without teleporting: walk round buildings, drive a ground vehicle (or boat) along the
road graph (Skyway decks included), and fly a flyer to a point at a height. Timed checkpoint runs use these.

## Read first
- `src/questSim/solvers/driver.ts`: the stub with the exact exported signatures (`MoveOpts`, `walkTo`, `driveTo`,
  `flyTo`). Keep them.
- `src/types.ts`: `RoadNode` (`id, x, z, links, deck?`: a node with `deck` is on an elevated Skyway deck), `RoadGraph`,
  `World.roads`.
- `src/highways/roads.ts`: `nodeY(n)` (a node's height, deck top or land), `nearestRoadNode(nodes, x, z, y?)` (pass the
  current y to pick deck vs ground correctly).
- `src/errands.ts`: `planRoute(nodes, fromId, goalId)` returns node ids or null.
- `src/quests/objectivesDrive.ts`: `steerToward` (how the game's quest NPC steers: `steer = clamp(-diff * 2.2)`,
  slow down when the turn is sharp) and `expandRoadWaypoints`.
- `src/player.ts` `updateFoot`: walking direction is `camYaw` (moveY +1 = forward along camYaw,
  `fx = sin(camYaw), fz = cos(camYaw)`).
- `src/vehicles.ts` `stepVehicle` / the flyer code (~lines 357-440): `lift` +1 climbs, -1 descends; a 'plane' needs
  airspeed to lift off; the 'whirligig' and 'sycamore-copter' hover. `src/collide.ts`: `angleDiff(a, b)`.
- `src/questSim/harness.ts`: `ctx.walk`, `ctx.drive`, `ctx.step`, `ctx.now`.

## Change
- `src/questSim/solvers/driver.ts` (fill in; keep the signatures):
  - `walkTo(ctx, x, z, o)`: each step `ctx.walk({ moveX: 0, moveY: 1, camYaw: atan2(x - px, z - pz) })` until within
    `o.arrive` or `o.until?.()`. Stuck (moved < 0.5 m in 2 s): sidestep for 1 s (`moveX: 1`), then go on. Budget
    `o.budget ?? 300` sim s, then `throw new SimFail('bot', 'walkTo <why>: stuck at (x, z)')`. `ctx.walk(null)` at the end.
  - `driveTo(ctx, x, z, o)`: plan on `ctx.world.roads.nodes`: start = `nearestRoadNode(nodes, v.x, v.z, v.y)`, goal =
    `nearestRoadNode(nodes, x, z, o.deckY)`; `planRoute`; follow node positions (aim 2 m right of the centre line like
    `steerToward`), then drive straight to (x, z) for the last leg. Speed: `o.speed ?? v.spec.maxSpeed`, x0.55 when
    `|angleDiff| > 0.45`; brake (`throttle -1`) when going faster than allowed. Boats (`v.spec.boat`): skip the road
    graph, steer straight. Stuck (moved < 1 m in 2 s): reverse (`throttle -1`, steer opposite) for 1.2 s. Done when
    within `o.arrive` (and `o.until?.()` may end it early). Budget as walkTo. `ctx.drive(null)` at the end.
  - `flyTo(ctx, x, y, z, o)`: the player must be in a flyer (`v.spec.flies`), else SimFail('bot'). Each step:
    `steer` toward (x, z) as above, `throttle` 1 (0.4 within 30 m for hovering flyers), `lift` = clamp((y - v.y) / 5,
    -1, 1); a plane on the ground takes off first (throttle 1, lift 0 until `v.speed` is near its stall speed, then
    lift 1). Done within `o.arrive` horizontally AND |v.y - y| < 4. Budget as walkTo.
- `src/questSim/solvers/driver.test.ts` (new), headless, each test in its own session from `openSession(sim, ALL_CHEATS)`
  (no quest needed; `buildSimWorld`, `openSession` from '../harness', `ALL_CHEATS` from '../types'):
  - walk: teleport to the Central Bus Stop area (0, 18), `walkTo` (40, 18) with arrive 2: arrives within 60 sim s.
  - drive: `ctx.spawnVehicle('ride-on', 0, 18, 0)`, `ctx.enter`, `driveTo` a road point about 200 m away (pick two
    ground nodes from `world.roads.nodes` with `planRoute` non-null, e.g. the nearest to (0, 18) and the nearest to
    (0, -200)): arrives within 120 sim s.
  - fly: `ctx.spawnVehicle('whirligig', 0, 18, 0)`, enter, `flyTo(ctx, 60, heightAt(60, 60) + 25, 60, ...)`: arrives.
  - Log sim seconds per test.

## Contract
```ts
export interface MoveOpts { arrive: number; why: string; speed?: number; budget?: number; until?: () => boolean }
export async function walkTo(ctx: SimCtx, x: number, z: number, o: MoveOpts): Promise<void>;
export async function driveTo(ctx: SimCtx, x: number, z: number, o: MoveOpts & { deckY?: number }): Promise<void>;
export async function flyTo(ctx: SimCtx, x: number, y: number, z: number, o: MoveOpts): Promise<void>;
```

## Done when
- `npx vitest run src/questSim/solvers/driver.test.ts` passes.
- `npx tsc --noEmit -p .` shows no error in `src/questSim/solvers/driver*.ts`.

## Out of scope
Every other file. (`util.ts travelTo` already imports `walkTo` / `driveTo` lazily; do not change it.)
