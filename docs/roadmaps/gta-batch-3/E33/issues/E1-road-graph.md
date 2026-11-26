Epic: E33 mountain routes, wave 1. Worker: Haiku.
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E33/_common.md` first. Another worker is redesigning the route lines at the same time:
your code must work for any line (read everything from the Track, never hard-code coordinates).

## Goal
The two mountain roads (routes of kind 'road': the Brim Gap Road and the Spine Cut) join the road graph, so traffic,
police and the GPS route over them. Trails and the Hatband stay out of the graph.

## Read first
- `games/gnome-theft-auto/src/mountainRoutes/graph.ts` (the stub you fill in) and `routes.ts`
- `games/gnome-theft-auto/src/highways/roads.ts` — `addSkywayRoads(graph)`: the pattern to copy (the `add`, `link`,
  `unlink`, `project` helpers and how a ramp foot splits a ground edge to join it)
- `games/gnome-theft-auto/src/highways/install.ts` (already calls `addMountainRoads(world.roads)` after `addSkywayRoads`)
- `games/gnome-theft-auto/src/highways/roads.test.ts` (test setup: `installFakeDom()`, `buildWorld`, `reachable`)
- `games/gnome-theft-auto/src/types.ts` — `RoadNode { id, x, z, links, deck?, ring?, noDrive? }`, `RoadGraph { nodes, laneOffset }`

## Change
- `src/mountainRoutes/graph.ts` — implement `export function addMountainRoads(graph: RoadGraph): void`:
  1. For each id in `routesOfKind('road')` (from `./routes`), take `ROUTES[id]`. Walk its `samples()` from first to last
     and choose node positions: the first and last sample, plus a sample whenever the distance along since the last
     node reaches `step`, where `step` is 5 m if any sample in the next 10 m has `Math.abs(curv) > 0.03`, else 12 m.
  2. Create ground nodes (no `deck`, no `ring`): `{ id: nodes.length, x, z, links: [] }` pushed onto `graph.nodes` (ids
     must stay equal to indices), linked in order (links both ways).
  3. Join each end: find the ground edge (two linked ground nodes `a`, `b`, both without `deck` and `ring`) whose segment
     passes nearest the end point, among edges within 4 m. If an existing node of that edge is within 6 m of the
     projected point, link the end to it; otherwise add a new ground node at the projected point, `unlink(a, b)`,
     `link(a, join)`, `link(join, b)`, and link the end node to `join`. If no edge is within 4 m, throw an Error naming
     the route id and which end ("mountain road 'spine-cut': no band road within 4 m of its start").
  4. Do nothing for routes of kind 'track' or 'trail'. Keep `RoadNode` unchanged (no new fields).
- New test `src/mountainRoutes/graph.test.ts`: build the world as `highways/roads.test.ts` does, call
  `addSkywayRoads(world.roads)` then `addMountainRoads(world.roads)`, and check:
  - node ids equal indices; links symmetric;
  - for each road route: there are nodes within 1 m of the route's first and last sample, consecutive route nodes are at
    most 12.5 m apart, every route node is within 0.5 m of the route's centre line (`track.locate(x, z, 2)`), and the
    route's nodes are reachable from a node of the north band road (e.g. the node nearest (300, -1330)) by links;
  - `roadRoute(world.roads, a, b)` (from `../route`) between a point 20 m beside the start and a point 20 m beside the
    end of each road returns a polyline whose points mostly (>= 60 %) lie within 6 m of the route's centre line;
  - no node lies on the Hatband or the Brim Walk centre lines (further than 8 m from them), except within 15 m of their
    meeting points with a road.

## Contract
`export function addMountainRoads(graph: RoadGraph): void` — signature unchanged. Called once by `installSkyways`
(already wired). Uses only `ROUTES`, `routesOfKind` from `./routes`.

## Done when
- `npx vitest run src/mountainRoutes/graph.test.ts` passes.
- `npx vitest run src/highways src/route.test.ts src/trafficSim.test.ts` still pass.
- `npx tsc --noEmit -p .` clean in your files.

## Out of scope
Everything else under `src/mountainRoutes/` (other workers), `highways/*` (read only), `route.ts`, `traffic*.ts`.
