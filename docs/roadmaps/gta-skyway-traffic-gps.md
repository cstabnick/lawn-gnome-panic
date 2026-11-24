# GTA: Skyway traffic, GPS, the East Beltway, work sites and map icons

Request (verbatim, from the batch): "solving the map icon, ... and skyway and gps. pls fix all that." Added during
planning: "extend the skyway some too so it goes out the other side of the city", "then add a perpendicular one that
kind of acts like an easy-side only beltway", and "add little cracks and such on the side so that players can drop off
them or little construction sites with ramps".

Assumption: "easy-side" is read as **east side**. The East Beltway runs north-south east of Turfton only (a partial
beltway), branching off the Skyway at a level junction.

## Decisions

- **Geometry (planner, foundation).** `highways/skyways.ts` is the table. The Turfton Skyway now starts on the west
  highway at (-219, -30), turns at a low corner, climbs to 7.5 m by x = -188 and runs across the whole city over the
  z = -60 street (bents mid-block only, columns on the pavements, `followedStreet` / `PAVEMENT_KEEP` in colliders.ts),
  then as before over Ring Road NE and the airfield spur down onto the east highway. The East Beltway is two decks,
  `beltway-north` and `beltway-south`, that start on the Skyway at (255, -60) (`SkywayPoint.on`: a junction point takes
  its parent's deck top) and come down beside Ring Road NE (255, -200) and Ring Road SE (290, 130). Cracks are rail gaps
  (`SkywayDef.cracks`, by deck distance). Work-site ramps and platforms are skyways of kind `'site'`; sites are
  `SKYWAY_SITES` (yard rectangles). The Unfinished Span is kind `'stunt'`.
- **Junctions.** `pushOutOfDecks` does not push a body back where another deck carries on level past the edge, nor in a
  crack (`railGaps`). Walls and bents skip what lies inside another deck. A branch's mesh starts at its parent's edge
  (`branchTrim`) so the two decks never overlap in a plane.
- **Road graph levels.** `RoadNode.deck?: string` (types.ts). `highways/roads.ts` adds deck nodes (control points,
  junctions, max 40 m links), shares the junction node, links each ramp foot to the highway it meets (splitting that
  edge), and never adds stunt or site decks or cracks. Height of a node: `nodeY(n)`; of a car on a link: `roadY(a, b, x,
  z)` (exactly `heightAt` on ground links, so nothing changes off the skyways); level-aware nearest node:
  `nearestRoadNode(nodes, x, z, y?)` (no y = ground nodes only). Ground places (errands, quest waypoints) skip deck nodes.
  Any road added later is a ground road with no extra work.
- **GPS.** `roadRoute(graph, from {x, z, y?}, to)` starts on the player's level and tags each stretch `level: 'deck' |
  'under'` (HudRoute points); `highways/routeDraw.ts` draws decks with a light casing and underpasses faded, on the
  minimap and the big map.
- **Online.** Traffic stays host-simulated with the existing sync; the skyways are static geometry built the same on every
  client. Deck traffic needs no new messages (vehicle y is already synced). Nothing to add to net.ts.
- **Mobile.** No new input.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| S1 Foundation (planner, done) | skyways.ts data, deck.ts junctions / gaps / trims, colliders.ts street bents, roads.ts graph, install.ts wiring, types.ts (`RoadNode.deck`, Blip kinds, HudRoute level), stubs (sites.ts, routeDraw.ts, lockup/marking.ts), app.ts + hud.ts wiring, errands + objectivesDrive filters, roads.test.ts + deck.test.ts; `npx vitest run src/highways` passes except mesh.test (S2.1) | 0 |
| S2 Build-out | all issues' checks; `npm test -w games/gnome-theft-auto`; `npm run build -w games/gnome-theft-auto`; smoke + zfight on port 5431 | 9 |

Hot-file edits (planner): `types.ts` (RoadNode.deck, 6 Blip kinds, HudRoute.level), `app.ts` (lockup marking, route y,
removed the three shop-kind blips now in mapPois, ambulance y, highways reward, taxi player y), `hud.ts` (drawRoute
instead of strokeRoute). Not edited: net.ts, events/, skyTraffic/, hunting/, birding/, fishing/, anim/, seats.ts.

**For the sync / events owners:** `events/spots.ts` picks road nodes for street scenes with a 2D filter; add
`&& n.deck === undefined` there so a street event never lands on the land under a deck. `events/kit.ts` routes with
`roadRoute` and needs nothing.

## Epic S2 issues

Common environment for every issue (pasted into each):

~~~~text
## Environment
Repo C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn, game games/gnome-theft-auto (Vite + TypeScript +
three.js). In Git Bash, if node is missing: export PATH="/c/Program Files/nodejs:$PATH". Other workers (and other
planners) edit other files in this game at the same time: touch ONLY the files under Change, and change them with small
Edit calls, never by rewriting a whole existing file (others may have edits in it). Do not commit, stash or switch
branches. tsc may show errors in files that are not yours; ignore those. Do not run vite build or a dev server.
Repo rules: 3D must not z-fight: anything flat on another surface gets flatLayer(material, LAYER.<x>) from '@lawn/depth'
(LAYER: ground 0, tint 1, area 2, road 3, edge 4, marking 5, marker 6), boxes that touch must not share a face. New
objects to see or examine come from @lawn/prefabs (buildPrefab), not hand-built meshes. Per-frame cost must stay tiny.
Skyway API (src/highways/, already there, read-only for you unless listed):
- skyways.ts: SKYWAYS (defs: id, name, points {x,z,h,on?}, width, openEnd?, kind?: 'road'|'stunt'|'site', cracks?:
  {along, side: 1|-1, length}[]), SKYWAY_SITES ({id, name, ramps, yard {minX,maxX,minZ,maxZ}, x, z}), SKYWAY tuning
  (railHeight 0.9, slab 1, solidBelow 4, columnSize 1.2, step 0.6), kindOf(def).
- deck.ts: skywayDefs(), deckSamples(id, step) -> {skyway, x, z, y (deck top), land, along, dirX, dirZ, solid}[],
  skywayLength(id), deckContactsAt(x, z) -> {skyway: def, along, across (+ = right of travel), dist, cx, cz, surfaceY,
  land, solid, dirX, dirZ, grade}[], railGaps(id) -> {from, to, side, kind: 'crack'|'junction'}[], branchTrim(id) ->
  {start, end} (metres of a branch deck that lie inside its parent's deck and must not be drawn).
- roads.ts: isDeckNode(n), nodeY(n) (deck top or land), roadY(a, b, x, z) (ground height for a car on the link a-b:
  heightAt on ground links), nearestRoadNode(nodes, x, z, y?) (level-aware; no y = ground nodes only),
  footConnectors() -> {skyway, foot {x,z}, to {x,z}}[] (each road ramp foot and the highway point it joins).
- terrain.ts: heightAt(x, z) = the land only; groundAt(x, z, y?) = the highest surface (land, bridge, deck top) at or
  below y + 0.6 (no y: the top surface).
- types.ts RoadNode: { id, x, z, links, deck?: string } (deck set = a node on a skyway deck).
~~~~

~~~~text
Epic: S2 Build-out
Depends on: none
Issue S2.1: skyway meshes for branches, sharp corners, cracks, site ramps, and chunking

<Environment block>

## Goal
highways/mesh.ts draws the new skyways right: branch decks start at their parent's edge (no overlapping tops), sharp
corners do not fold, rails open at cracks and junctions (with broken rail stubs at a crack), site-kind decks look like
plank ramps on timber trestles, foot slip-road aprons join each ramp foot to its highway, and the big ribbons are split
into chunks so frustum culling works.

## Read first
- games/gnome-theft-auto/src/highways/mesh.ts (all of it), mesh.test.ts
- games/gnome-theft-auto/src/highways/skyways.ts, deck.ts (railGaps, branchTrim, deckSamples), colliders.ts (skywayBents)
- games/gnome-theft-auto/src/highways/roads.ts (footConnectors)

## Change
- games/gnome-theft-auto/src/highways/mesh.ts (keep `export function buildSkywayMeshes(): THREE.Group`):
  1. Sharp corners: framesOf averages neighbour directions; at the Skyway's 90-degree corner at (-219, -60) the inner
     edge folds (mesh.test "the deck top faces up" fails). Fix in framesOf: at a joint where the direction turns by more
     than 20 degrees, drop the 2 m frames within (width/2 + 0.6) of the joint on both legs, and give the joint frame the
     bisector direction with its right vector scaled by 1 / cos(turn / 2) (a true mitre), so every edge offset reaches
     the joint without crossing. Everything built from frames (deck, rails, markings) then follows.
  2. Branch trim: const { start, end } = branchTrim(def.id); build every ribbon (deck top, sides, rails, markings) only
     from along = start to along = length - end (use sliceFrames). The parent draws the overlap.
  3. Rail gaps: for each g of railGaps(def.id), the rail on side g.side is not built between g.from and g.to (build
     each rail as runs between gaps with sliceFrames). For kind 'crack' add two broken stubs: at each end of the gap a
     0.6 m rail piece tilted outwards 25 degrees about the deck direction and 0.15 lower (railMat), so they do not touch
     the standing rail's end face (leave 0.05 m between).
  4. Site decks (kindOf(def) === 'site'): deck top material a plank brown MeshStandardMaterial 0x9a7448 (roughness 1),
     sides 0x6b4f32; no lane markings; rails 0.15 wide at 0.7 height in 0x6b4f32; bents under their viaduct part drawn as
     timber (colour 0x6b4f32) instead of concrete (skywayBents() has b.skyway: check the def kind). Open-end barrier
     stays for openEnd site platforms.
  5. Foot slip roads: for every footConnectors() entry, a flat asphalt strip 8 m wide from c.foot to c.to on the land:
     sample every 2 m, y = heightAt(x, z) + 0.03, material MeshStandardMaterial 0x55555b passed through
     flatLayer(mat, LAYER.road), one merged mesh 'skyway-slip-roads'.
  6. Chunking: build each skyway's deck, rails and markings per chunk of at most 120 m of along (consecutive
     sliceFrames(fs, a, b) with b - a <= 120; consecutive chunks share their boundary frame so no gap shows), one Mesh per
     chunk and material set; columns grouped the same way by bent along. Keep names `${def.id}-deck` etc. as prefixes
     (`${def.id}-deck-0`, ...).
- games/gnome-theft-auto/src/highways/mesh.test.ts: keep existing tests passing (the deck-top test must pass with the
  corner fix; if it looks up a mesh by its old name, update it to the chunk names); add: no deck-top triangle anywhere
  has a downward normal; the 'skyway-slip-roads' mesh exists; no rail vertex lies inside a crack gap (for each crack,
  rail positions between from+0.5 and to-0.5 on that side are absent).

## Contract
`buildSkywayMeshes(): THREE.Group` unchanged. Do not change deck.ts, colliders.ts, roads.ts, skyways.ts, install.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in src/highways/mesh.ts or mesh.test.ts
- `cd games/gnome-theft-auto && npx vitest run src/highways/mesh.test.ts` passes

## Out of scope
Every other file (sites.ts, map.ts, routeDraw.ts, system.ts belong to other issues).
~~~~

~~~~text
Epic: S2 Build-out
Depends on: none
Issue S2.2: Local 404 work sites and crack dressing (prefabs + sites.ts)

<Environment block>

## Goal
Each work site (SKYWAY_SITES) is dressed from prefabs inside its yard, every crack has rubble, cones, hazard tape and a
fallen barrier board on the deck beside the gap, solid pieces have colliders, and a new neck cosmetic exists for an
achievement reward.

## Read first
- games/gnome-theft-auto/src/highways/sites.ts (the stub: keep its exports), skyways.ts (SKYWAY_SITES, cracks)
- games/gnome-theft-auto/src/highways/deck.ts: deckSamples, deckContactsAt
- docs/roadmaps/prefab-library/_common.md (prefab rules; ignore its Environment section), packages/prefabs/src/types.ts
- packages/prefabs/src/catalog/gta-hangar-boathouse.ts (a GTA prefab file to copy the style from), and
  packages/prefabs/src/catalog/index.ts (how a catalog file is registered: one import + one spread)
- games/gnome-theft-auto/src/cull.ts header (registerCull)

## Change
- packages/prefabs/src/catalog/gta-skyway-works.ts (new): `export const GTA_SKYWAY_WORKS: PrefabDef[]` with ids
  'site-cement-mixer', 'site-portaloo', 'site-office' (a cabin with a window and door), 'site-tower-crane' (lattice
  mast + jib + counterweight, tall), 'site-barrier' (red-and-white striped A-frame barrier), 'site-sign-local-404' (board
  on two posts, "LOCAL 404" implied by colours; text is not possible), 'site-rubble' (broken concrete chunks and rebar),
  'site-hazard-tape' (two posts with a yellow-black tape strip), 'site-plank-stack', and the reward 'hazard-tape-scarf'
  (category 'armor', uses ['wear-neck'], a yellow-black striped scarf; copy the shape of an existing neck item: grep the
  catalog for "wear-neck"). Before adding a cone, grep the catalog for an existing traffic cone (e.g. "cone" in props or
  gnome-theft-auto.ts) and reuse it; add 'site-cone' only if none exists. Follow _common.md (lowest point y = 0, 5-6
  examine lines, tags, about).
- packages/prefabs/src/catalog/index.ts: import GTA_SKYWAY_WORKS and add it to the catalog list exactly like
  GTA_SKY_TRAFFIC (two lines).
- games/gnome-theft-auto/src/highways/sites.ts: implement `buildSkywaySites(): SkywaySitesBuilt`:
  - Per site: an office, a mixer, a portaloo, a crane, the sign at (site.x, site.z), a plank stack, 4-6 barriers along
    the yard edge facing out and 6-10 cones, all inside site.yard, none within 1.5 m of any deck footprint
    (deckContactsAt(x, z) empty for the piece's corners) or of each other. buildPrefab(id, { scale }) from
    '@lawn/prefabs', positioned at (x, heightAt(x, z), z) with rotation.y. Sizes in metres (a gnome is ~1): office ~5 x
    3 x 3, portaloo ~1.3 x 2.4, mixer ~2, crane ~14 tall, barrier ~2 wide, cone ~0.6.
  - Per crack (each def's cracks): on the deck, 1.5 m inside the gap's rail line: a 'site-rubble', two cones at the gap
    ends, a 'site-hazard-tape' across behind them is NOT allowed (it would close the gap): put the tape posts at the gap
    ends along the rail line instead, and one 'site-barrier' lying on its side (rotation.z = PI/2) near the gap. y = the
    deck top there (deckSamples). These are decoration only: no colliders on the deck.
  - Colliders (Box: {minX, maxX, minZ, maxZ, h} with h = top height in world y) for office, portaloo, mixer, crane mast
    and barriers in yards only.
  - Register each site's group and each crack's group with registerCull(obj, 'prop') AFTER positioning (import from
    '../cull'); all in the returned group named 'skyway-sites'.
  - Deterministic layout (no Math.random; use a small seeded rand from the site id).
- games/gnome-theft-auto/src/highways/sites.test.ts (new): buildSkywaySites() returns > 10 children total, boxes
  non-empty, no box centre inside any deck footprint, every yard piece inside its site's yard.

## Contract
`buildSkywaySites(): { group: THREE.Group; boxes: Box[] }` (install.ts calls it; do not change install.ts). The reward
prefab id 'hazard-tape-scarf' (slot neck) is used by another issue's achievement.

## Done when
- `npm test -w packages/prefabs` passes
- `cd games/gnome-theft-auto && npx vitest run src/highways/sites.test.ts` passes
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files

## Out of scope
mesh.ts, deck.ts, skyways.ts, install.ts, system.ts, packages/achievements.
~~~~

~~~~text
Epic: S2 Build-out
Depends on: none
Issue S2.3: traffic on the skyways (traffic.ts)

<Environment block>

## Goal
NPC traffic drives on the Skyway and the East Beltway and up and down their ramps at the right height, and a car on the
deck never brakes for, or is placed at the height of, the street underneath (and the reverse).

## Read first
- games/gnome-theft-auto/src/traffic.ts (createTraffic: driverFromHere, blockerAhead, materialize, the impostorPoses
  push near the end of updateGhosts). Another planner has added rider-animation lines to this file; leave them.
- games/gnome-theft-auto/src/highways/roads.ts (nodeY, roadY, nearestRoadNode)
- games/gnome-theft-auto/src/trafficSim.ts (lanePose, Ghost: from, to, x, z, rx, rz) - read only

## Change
- games/gnome-theft-auto/src/traffic.ts:
  - import { nearestRoadNode, roadY } from './highways/roads'.
  - materialize: replace `v.y = heightAt(g.x, g.z)` with
    `const a = nodeOf(g.from), b = nodeOf(g.to); v.y = a && b ? roadY(a, b, g.x, g.z) : heightAt(g.x, g.z);`
  - the impostor pose: y = roadY(nodeOf(g.from), nodeOf(g.to), g.rx, g.rz) when both nodes exist, else heightAt
    (same pattern). This runs per far car per frame: no allocations, no extra loops.
  - driverFromHere: pick the junction with `nearestRoadNode(world.roads.nodes, v.x, v.z, v.y)` instead of the 2D loop.
  - blockerAhead: skip any other vehicle o with Math.abs(o.y - v.y) > 2.5 (in both loops), and skip the on-foot player
    when Math.abs(playerY - v.y) > 2.5: add a `playerY: number` parameter after playerZ to blockerAhead and drive(), and
    pass it down from update (find where update calls drive with playerX/playerZ; the player's height is available
    where those come from; if update does not receive it, use the TrafficView / update args it has, and if none has a
    y, pass v.y so behaviour is unchanged). Keep exported types unchanged.
- games/gnome-theft-auto/src/traffic.levels.test.ts (new): build the world (see src/highways/roads.test.ts for the
  buildWorld + addSkywayRoads setup), then for 200 random spots from trafficSim pickSpot(simGraph(...), {x, z, minDist:
  0, maxDist: 400, viewers: [], avoid: [], clear: 0}) around (255, -60) and (0, -60): the y the materialize rule gives
  (roadY) equals the deck top (some deckContactsAt(x,z).surfaceY within 0.05) when both nodes are deck nodes, and
  equals heightAt(x, z) when neither is; at least one spot of each kind occurs.

## Contract
createTraffic's signature and the Traffic interface stay the same.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in traffic.ts or your test
- `cd games/gnome-theft-auto && npx vitest run src/traffic src/trafficSim src/trafficImpostors` passes

## Out of scope
trafficSim.ts, trafficImpostors.ts, net.ts, vehicles.ts, anim/, seats.ts.
~~~~

~~~~text
Epic: S2 Build-out
Depends on: none
Issue S2.4: GPS route over the skyways (route.ts + routeDraw.ts)

<Environment block>

## Goal
The waypoint route can use the Skyway and the beltway, starts on the player's level, and is drawn so elevated stretches
and underpasses read differently on the minimap and the big map.

## Read first
- games/gnome-theft-auto/src/route.ts, route.test.ts
- games/gnome-theft-auto/src/highways/routeDraw.ts (stub; hud.ts already calls drawRoute for both maps)
- games/gnome-theft-auto/src/highways/roads.ts (nearestRoadNode, isDeckNode), deck.ts (deckContactsAt)
- games/gnome-theft-auto/src/types.ts: HudRoute (points: { x, z, level?: 'deck' | 'under' }[])

## Change
- games/gnome-theft-auto/src/route.ts: `roadRoute(graph, from: Pt, to: Pt): RoutePt[]` where
  `export type RoutePt = HudRoute['points'][number]` and Pt = { x, z, y? } (already). Start node =
  nearestRoadNode(graph.nodes, from.x, from.z, from.y); goal node = nearestRoadNode(graph.nodes, to.x, to.z) (ground);
  replace the private `nearest`. If either is null, the direct line. Keep the ROUTE_DIRECT / straight-line fallbacks
  and the trimming rules. Levels: a stretch between two consecutive deck nodes gets level 'deck' on its first point. A
  ground stretch (any other pair, and from/to legs) is walked in 4 m steps; where deckContactsAt(x, z) has a deck whose
  surfaceY is more than 2.5 above heightAt(x, z), that part is 'under': insert a point where the level changes (the
  step point) so each stretch has one level. The first point stays {x: from.x, z: from.z} (app.ts overwrites points[0]
  each frame with the player's x, z). This runs twice a second: no per-frame work.
- games/gnome-theft-auto/src/highways/routeDraw.ts: drawRoute draws consecutive runs of equal level:
  ground = the current look (dark underlay, coloured dashes); 'deck' = a solid light casing (#f4f4f4, width +2.5 px
  over the underlay) under the dashes, so it reads as raised; 'under' = no underlay, dashes in the route colour at
  globalAlpha 0.45 and 0.7x width, so it reads as hidden beneath. Restore globalAlpha, dash and offset afterwards.
  Keep the signature.
- games/gnome-theft-auto/src/route.levels.test.ts (new): build the world + addSkywayRoads (setup as in
  src/highways/roads.test.ts). (1) A route starting on the Skyway deck at (100, -60) with y = groundAt(100, -60) to the
  east highway at (600, 32) has some 'deck' stretch. (2) A route starting on the deck at (0, -60) with y =
  groundAt(0, -60) begins on a deck node (points[1] is near a deck node). (3) A route from (0, -70) to (100, -70) at
  ground level has an 'under' stretch or no 'deck' stretch, never starting on the deck. (4) No route point lies in the
  'unfinished-span' footprint (deckContactsAt).
- Keep route.test.ts passing (update only type annotations if needed).

## Contract
hud.ts calls `drawRoute(g, points, toScreen, color, t, small)`; app.ts calls
`roadRoute(world.roads, { x, z, y }, wp)` and stores the result as HudRoute.points. Do not edit hud.ts or app.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in route.ts, routeDraw.ts or the tests
- `cd games/gnome-theft-auto && npx vitest run src/route` passes

## Out of scope
hud.ts, app.ts, roads.ts, events/ (events/kit.ts also calls roadRoute; your change must stay compatible with
`roadRoute(roads, {x, z}, {x, z})` returning points with x and z).
~~~~

~~~~text
Epic: S2 Build-out
Depends on: none
Issue S2.5: police on the skyways (police.ts)

<Environment block>

## Goal
Pursuit vehicles and roadblocks spawn on the player's level (on the deck when the player is on the deck, never on the
land under it), roadblock cones and cars sit on the deck top, and officers on foot keep the level they walk on.

## Read first
- games/gnome-theft-auto/src/police.ts: spawnPursuit, the roadblock block in stepPursuits, nudge, animate, stepUnit's
  ragdoll recovery, hitTest, crack (every heightAt use)
- games/gnome-theft-auto/src/highways/roads.ts (nodeY), terrain.ts groundAt
- games/gnome-theft-auto/src/types.ts WatchContext (playerX, playerY, playerZ, playerVehicle)

## Change
- games/gnome-theft-auto/src/police.ts:
  - spawnPursuit(kind, world, px, pz, py): candidates in the 32..75 ring as now, filtered to Math.abs(nodeY(n) - py)
    < 3 (fall back to ground nodes, n.deck === undefined, when none). After createVehicle set v.y = node ? nodeY(node)
    : groundAt(x, z, py). Callers pass ctx.playerY (or the player vehicle's y when in one).
  - Roadblock: target y ty = playerVehicle ? playerVehicle.y : playerY. Candidates also need Math.abs(nodeY(n) - ty) <
    3. Each roadblock vehicle gets rv.y = groundAt(vx, vz, ny + 0.6) where ny = nodeY(node); cones at
    groundAt(cx, cz, ny + 0.6) + 0.35. Never place a roadblock on a node whose links include a node with a different
    `deck` value (a ramp foot or junction).
  - Officers on foot: keep their height in u.state.position.y. nudge: pushOutOfBoxes(..., groundAt(wx, wz,
    u.state.position.y)); animate: s.position.set(n.x, groundAt(n.x, n.z, s.position.y), n.z); ragdoll recovery and
    crack/re-post: groundAt(x, z, <their current y>) instead of heightAt; hitTest: h = y - u.state.position.y. A new
    officer at a walk point starts at heightAt (unchanged).
- games/gnome-theft-auto/src/police.levels.test.ts (new, pure where possible): with the world + addSkywayRoads (setup as
  src/highways/roads.test.ts), export and test a small pure helper you add to police.ts:
  `export function levelNodes(nodes, x, z, y, minD, maxD): RoadNode[]` (the filter used above) - with y = deck top at
  (0, -60) every returned node is a deck node; with y = land every returned node is a ground node.

## Contract
createWatch's signature and the Watch interface stay the same.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in police.ts or your test
- `cd games/gnome-theft-auto && npx vitest run src/police` passes

## Out of scope
Every other file.
~~~~

~~~~text
Epic: S2 Build-out
Depends on: none
Issue S2.6: ambulance and taxi on the skyways (ambulance.ts, taxi.ts)

<Environment block>

## Goal
An ambulance sent to a gnome cracked on a deck drives there along the deck (and up the ramp), at deck height; the
crack pile lies on the deck. The Turfton Taxi summoned on a deck arrives on the deck.

## Read first
- games/gnome-theft-auto/src/ambulance.ts (dispatch has a new last parameter `_y?: number`: the height of the gnome;
  app.ts passes it)
- games/gnome-theft-auto/src/taxi.ts (toggle, drive, pickApproach, every heightAt), taxi.test.ts
- games/gnome-theft-auto/src/highways/roads.ts (nodeY, nearestRoadNode), deck.ts (deckContactsAt, deckSamples)

## Change
- games/gnome-theft-auto/src/ambulance.ts:
  - dispatch(x, z, coat?, ambulance = false, y?: number): pile y = y === undefined ? heightAt(x, z) : groundAt(x, z, y
    + 0.3). Rig gets a `y` field. End node = nearestRoadNode(world.roads.nodes, x, z, pileY); start = a node 35..80
    away with Math.abs(nodeY(n) - pileY) < 3 (else any ground node in the ring, else the end node). The rig starts at
    nodeY(start). Each frame: r.y = groundAt(r.x, r.z, r.y + 0.3); mesh y = r.y. The BFS route is unchanged (links are
    level-correct). Remove the old private nearestNode if unused.
- games/gnome-theft-auto/src/taxi.ts:
  - New exported pure helper `deckApproach(px, pz, py): { x, z, yaw, stopX, stopZ } | null`: when deckContactsAt(px, pz)
    has a road-kind deck (c.skyway.kind undefined or 'road') with Math.abs(c.surfaceY - py) < 1.5, return a start 30 m
    back along that deck's centre line (deckSamples(c.skyway.id, 2): the sample nearest c.along - 30, or c.along + 30
    when that is before 0), facing the player, and a stop TAXI.stopDist short of the player on the line between them;
    else null.
  - toggle: const p = deps.player(); const pick = (p.y !== undefined && deckApproach(p.x, p.z, p.y)) ||
    pickApproach(world.boxes, p.x, p.z); v.y = groundAt(pick.x, pick.z, p.y ?? heightAt(pick.x, pick.z)).
  - Every other `v.y = heightAt(v.x, v.z)` in the taxi: v.y = groundAt(v.x, v.z, v.y).
- games/gnome-theft-auto/src/taxi.test.ts: add a test for deckApproach: on the Skyway at (0, -60) with py =
  groundAt(0, -60) it returns a point within 6 m of the deck centre line (z close to -60) and 25..35 m away; with py =
  heightAt(0, -60) (the street under it) it returns null.

## Contract
`Ambulances` and createTaxi signatures unchanged except dispatch's optional last parameter (already in the type).
TaxiDeps.player() returns { x, z, y? } (already).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in ambulance.ts, taxi.ts or taxi.test.ts
- `cd games/gnome-theft-auto && npx vitest run src/taxi` passes

## Out of scope
app.ts, police.ts, traffic.ts, every other file.
~~~~

~~~~text
Epic: S2 Build-out
Depends on: none
Issue S2.7: map icons for every place, the beltway and the ramps (mapIcons.ts, mapPois.ts, highways/map.ts)

<Environment block>

## Goal
Every fixed place has a proper badge and a name on the minimap and big map: the Side-Valve Lock-Up, the Tuft & Tally
Lodge, the Reedwatch Hide, The Bent Pin (they used the gun-shop badge), each skyway ramp, the Unfinished Span, the East
Beltway and the two work sites. The map draws the beltway like the Skyway and does not draw site ramps or cracks.

## Read first
- games/gnome-theft-auto/src/mapIcons.ts, mapPois.ts, mapIcons.test.ts
- games/gnome-theft-auto/src/types.ts Blip.kind: now also 'lockup' | 'lodge' | 'hide' | 'tackle' | 'onramp' | 'works'
- games/gnome-theft-auto/src/highways/map.ts, skyways.ts (kindOf, SKYWAY_SITES), roads.ts (footConnectors), deck.ts
- Place constants (import read-only): LOCKUP.sites[0] in src/lockup/config.ts (Side-Valve Lock-Up), LODGE in
  src/hunting/species.ts, HIDE in src/birding/types.ts, SHOP in src/fishing/types.ts (The Bent Pin). Do not edit those
  folders.

## Change
- games/gnome-theft-auto/src/mapIcons.ts: add the six kinds to PlaceKind and PLACE_STYLE (distinct names and colours;
  lodge '#7a9a3a', hide '#5a9a8a', tackle '#3f8fb0', lockup '#c4661f', onramp '#6f7684', works '#e0a100' or close), and
  a glyph each in drawPlaceIcon: lockup = a garage door (box with 3 horizontal slats), lodge = a tuft/antler (a Y fork),
  hide = binoculars (two circles + bridge), tackle = a fish hook (J curve with a barb), onramp = an up-arrow on a
  slope, works = a traffic cone (triangle with a band). RIM_PLACES unchanged.
- games/gnome-theft-auto/src/mapPois.ts placeBlips(): add Side-Valve Lock-Up (LOCKUP.sites[0] x, z, kind 'lockup'),
  'Tuft & Tally Lodge' (LODGE, 'lodge'), 'Reedwatch Hide' (HIDE, 'hide'), 'The Bent Pin' (SHOP, 'tackle'), one 'onramp'
  per footConnectors() entry labelled `${def.name} ramp (${compass})` where compass = west/east when |dx| > |dz| else
  north/south, from the foot relative to the midpoint of that skyway's first and last points (z negative = north), the
  Unfinished Span at its first point ('onramp', label 'The Unfinished Span'), 'East Beltway' ('skyway', at (255, -130)),
  and one 'works' blip per SKYWAY_SITES (label site.name). Keep the existing ten. All labels distinct.
- games/gnome-theft-auto/src/highways/map.ts: skip kindOf(def) === 'site'; draw 'road' and 'stunt' as now (beltway
  included automatically); for a branch whose first point has `on`, start its stroke at deckSamples index where along >=
  branchTrim(def.id).start (so it does not paint over the Skyway's outline).
- games/gnome-theft-auto/src/mapIcons.test.ts: the kind count becomes 20 (or KINDS.length >= 20), placeBlips() count
  becomes the new total; keep "distinct labels"; drop "distinct kinds" for kinds that legitimately repeat ('onramp',
  'works', 'skyway') - assert instead that every other kind appears once. Add: every PlaceKind draws without throwing on
  a fake 2D context (see how existing tests use installFakeDom) - optional if no canvas is available.

## Contract
`placeBlips(): Blip[]`, `drawPlaceIcon(g, x, y, r, kind)`, `PLACE_STYLE`, `isPlace` keep their signatures. Another
planner may add more places to these files later: keep the code additive (one line per place).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files
- `cd games/gnome-theft-auto && npx vitest run src/mapIcons src/highways/deck` passes

## Out of scope
hud.ts, app.ts, types.ts, hunting/, birding/, fishing/, lockup/ (read only).
~~~~

~~~~text
Epic: S2 Build-out
Depends on: none
Issue S2.8: the Side-Valve Lock-Up's painted bay and sign (lockup/marking.ts)

<Environment block>

## Goal
The Lock-Up, where you drive in to store a vehicle (LOCKUP.sites[0]: x = SIDE_VALVE.bay.x + 16, z = SIDE_VALVE.bay.z,
radius 6; about (-134, 72), on the forecourt in front of the Side-Valve Salvage building whose box is about x -162..-138,
z 78..102), is visible in the world: a painted bay on the ground and a sign.

## Read first
- games/gnome-theft-auto/src/lockup/marking.ts (stub), lockup/config.ts (LOCKUP.sites)
- packages/depth/README.md (flatLayer, LAYER)
- games/gnome-theft-auto/src/world.ts lines 250-270 (tryInstantiate: how a prefab is placed; you may import it) and
  packages/prefabs README for buildPrefab
- games/gnome-theft-auto/src/cull.ts header (registerCull)

## Change
- games/gnome-theft-auto/src/lockup/marking.ts: buildLockupMarking(scene): Box[]:
  - Painted bay: a CanvasTexture (document.createElement('canvas'), 512 x 384) with a white 8 x 6 m rectangle outline
    (thick border), diagonal yellow hatch corners and the words "LOCK-UP" in large block letters; on a PlaneGeometry(8,
    6) rotated flat (rotateX(-PI/2)), y = heightAt(x, z) + 0.03, material MeshBasicMaterial({ map, transparent: true })
    through flatLayer(mat, LAYER.marking), centred on the site, yaw 0 (text reads from the road side, +z towards the
    building). Guard: if document is missing (tests), skip the texture and return [] early.
  - Sign: the 'signpost' prefab (buildPrefab, check it exists with getPrefab; fall back to 'wooden-wall-sign') about
    2.5 m tall at (site.x + 5, site.z + 4.5), plus a small board on it showing "SIDE-VALVE LOCK-UP" as a canvas texture
    on a thin box (front face only textured) at the top of the post. Return one collider box for the post (0.4 x 0.4).
    Make sure the sign is not inside the building box above and not on the road (z > 67.5).
  - registerCull(group, 'prop') after placing; add the group to the scene.
- games/gnome-theft-auto/src/lockup/marking.test.ts (new): with installFakeDom (src/testing/fakeDom), calling
  buildLockupMarking(new THREE.Scene()) does not throw and returns at most 2 boxes, each outside x -162..-138 / z
  78..102.

## Contract
`buildLockupMarking(scene: THREE.Scene): Box[]` (app.ts already calls it right after installSkyways and pushes the boxes
into world.boxes).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files
- `cd games/gnome-theft-auto && npx vitest run src/lockup` passes

## Out of scope
Every other lockup/ file, app.ts, world.ts.
~~~~

~~~~text
Epic: S2 Build-out
Depends on: none
Issue S2.9: drop-off stunts and the Hard Hat Area achievement (highways/system.ts)

<Environment block>

## Goal
Dropping off a deck through a crack, or flying off a work-site ramp or platform, counts as a stunt: a toast, an Acorn
reward through deps.reward, and an achievement with a cosmetic reward. Also the Skyway run achievement still works on the
longer Skyway.

## Read first
- games/gnome-theft-auto/src/highways/system.ts (createHighways: the Mind the Gap airborne logic to copy), system.test.ts
- games/gnome-theft-auto/src/highways/deck.ts (deckContactsAt, railGaps), skyways.ts (kindOf, SKYWAYS)
- packages/achievements/src/catalog.ts: the 'gta-skyway-run' and 'gta-mind-the-gap' entries (AchievementDef shape)

## Change
- games/gnome-theft-auto/src/highways/system.ts (HighwaysDeps already has optional reward(acorns, why)):
  - Drop-off: while the player's ground vehicle (or the player on foot) is on a deck (contact with |baseY - surfaceY| <
    1), remember that deck's id, kind and surfaceY as `lastDeck`. When it then becomes airborne (same test as Mind the
    Gap) with no deck under it (deckContactsAt empty or all far below), arm a drop with the launch point and height.
    When it lands (not airborne) at least 3 m lower than the launch: if the deck was a road deck and the launch was within
    2 m of a crack gap (railGaps(id) kind 'crack': the contact's along inside [from - 2, to + 2]), it is a 'Crack drop';
    if the deck's kind was 'site', a 'Site jump'. Toast `${label}! +${acorns} Acorns` and deps.reward?.(acorns, label)
    with acorns = 20 + 5 * floor(drop metres), capped at 80; deps.unlock('gta-hard-hat-area') the first time. Ignore
    drops off the Unfinished Span's end (Mind the Gap already covers it) and anything in flying craft or boats. Pure
    helper exported for tests: `export function dropReward(dropMetres: number): number`.
  - Keep pushOutOfDecks use and the two existing achievements unchanged.
- games/gnome-theft-auto/src/highways/system.test.ts: add tests for dropReward (3 m -> 35, 20 m -> 80).
- packages/achievements/src/catalog.ts: after 'gta-mind-the-gap', add
  { id: 'gta-hard-hat-area', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Hard Hat Area',
    description: 'Drop off a Skyway crack or jump a Local 404 work ramp.',
    reward: { slot: 'neck', prefabId: 'hazard-tape-scarf', label: 'Hazard Tape Scarf' } }
  ('hazard-tape-scarf' is being added to packages/prefabs by another worker right now; the achievements test that
  checks reward prefabs may fail until it lands: that is expected, do not add the prefab yourself.)

## Contract
createHighways(deps) and Highways.update(dt, player) unchanged.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in system.ts / system.test.ts
- `cd games/gnome-theft-auto && npx vitest run src/highways/system.test.ts` passes

## Out of scope
deck.ts, mesh.ts, sites.ts, stunts.ts, app.ts, packages/prefabs.
~~~~

## Status (end of S2)

All nine S2 issues are done (S2.1, S2.2, S2.4 and S2.5 were cut off by a usage limit and finished after it reset).
Planner fixes after the epic:
- The west ramp got a level landing round its 90-degree corner (-219, -52) .. (-219, -60) .. (-211, -60) at 3.4 m: two
  climbing legs met at different heights on the inside of the corner, and a headless drive fell through to the land
  there. New deck test "no step a wheel cannot climb" (0.45 m) guards every corner and junction.
- Foot slip roads draw at LAYER.tint, 0.012 above the land, under the highway asphalt (a coplanar audit found them
  fighting a road mesh at the west foot).
- mapIcons.test counts are "at least" (other features add places).

Verified: `npx vitest run` for highways, route, traffic, taxi, police, mapIcons, lockup (154 tests); prefabs package
tests; tsc clean for these files; headless Edge on port 5431: 8-15 NPC cars on the decks at once, a mower drives the
west ramp up to the corner landing and along the city deck at 7.5 m; coplanar audit (buildWorld + skyways + sites +
Lock-Up) has no finding on skyway objects; `tools/smoke.sh` OK. `npm run zfight` could not load the page (its
networkidle wait never settles while the mp relay on 8787 is down), so the audit ran in vitest instead.
Mesh worker deviations: every joint is mitred (not just turns over 20 degrees), and the crack-gap test allows 1 m slack.
