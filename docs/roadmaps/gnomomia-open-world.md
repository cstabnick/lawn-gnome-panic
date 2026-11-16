# Gnomes of Gnomomia: open world

Goal: every outdoor zone of Fescue is one continuous world. You walk from Mossbottom to the Verge without a loading
step, roads cross the ridges between zones through passes (gated by the story), and from a raised floor (a watchtower,
the Keep's wall-walk) you see every player and everything out to the fog, about 640 m. Interiors (the Drainpipe Deeps,
later house interiors) are instances.

The architecture is in [docs/design/gnomomia/open-world.md](../design/gnomomia/open-world.md).

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (written by the planner) | `npm run build -w games/gnomes-of-gnomomia` passes; content loads in world coordinates; terrain.ts answers heights, blocking and floors | 0 (planner) |
| 2. Systems | build passes; the world streams and draws; you can walk Mossbottom to Thatchford on the road; decks are climbable; other players show by distance | 5, parallel |

Epic 1 (done by the planner): `config.ts` (`WORLD`, `Deck`, `ZoneDef.origin`, `ZoneDef.decks`), `src/data/layout.ts`
(`ORIGINS`), the world-coordinate pass in `content.ts`, `src/terrain.ts`, `src/zones.ts` (zone from position, live
zones, teleports only for instances), `setActiveEntityZones` in entities.ts, `setActiveObjectZones` in objects.ts,
input.ts picking walk meshes and passing the click height, save migration (`w: 1`), the Mower moved to the Verge's
origin, and stubs for `world.ts` and `dressing.ts`.

## Epic 2: systems

Files per issue (no file is under two issues):

- 2.1: `src/world.ts`
- 2.2: `src/dressing.ts`
- 2.3: `src/pathfind.ts`, `src/player.ts`
- 2.4: `src/net/protocol.ts`, `src/net/mmo.ts`, `src/ui/online.ts`
- 2.5: `src/data/zones/mossbottom.ts`, `thatchford.ts`, `keep.ts`, `verge.ts`, `scripts/lint-content.mjs`

Every check is `npx tsc --noEmit -p games/gnomes-of-gnomomia` (no output folder, no port) or the content linter (writes
only to the OS temp dir under a random name).

### 2.1 World streaming

~~~~text
Epic: 2 (Systems), issue 2.1: World streaming
Depends on: none

## Environment
Work only in the git worktree C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnomomia-open-world
(Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnomes-of-gnomomia (Vite + TypeScript + three.js 0.187; not Phaser).
Four other workers are editing other files of this game at the same time. Change only src/world.ts.
Do not run npm run build / npm run dev, do not start servers, do not git commit.
All positions at runtime are WORLD coordinates (zones are placed side by side; negative z is north).

## Goal
src/world.ts draws the open world around the player: terrain in 64 m chunks streamed by distance with two levels of
detail, instanced flora on near chunks, a sun whose shadow box follows the player, and sky/fog that blend to the theme
of the zone the player is in. Today it is a stub.

## Read first
- games/gnomes-of-gnomomia/src/world.ts: the stub. Keep its three exported signatures exactly.
- games/gnomes-of-gnomomia/src/terrain.ts: the data you draw. Use: heightAt(x, z), groundColourAt(x, z) (0xRRGGBB),
  chunkFlora(ci, cj): readonly Flora[] (Flora = { kind: FloraKind; x; y; z; s; rot }, FloraKind = 'pine' | 'broad' |
  'grass' | 'clover' | 'hedge' | 'boulder' | 'pipe' | 'stubble' | 'rock'), themeZoneAt(x, z): ZoneDef,
  zoneAt(x, z): ZoneId | null, zoneRectDistance(id, x, z): number (negative inside the zone's square).
- games/gnomes-of-gnomomia/src/config.ts: WORLD (chunk 64, viewRadius 640, nearRadius 192, fogNear 260, fogFar 640),
  ZoneDef.theme { sky, fog } and ZoneDef.indoor.
- The OLD single-zone world (for the exact lights, terrain colouring and flora shapes):
  run `git show HEAD:games/gnomes-of-gnomomia/src/world.ts` (functions buildWorld and buildFlora).

## Change
- games/gnomes-of-gnomomia/src/world.ts: replace the stub body. Keep it importing buildDressing/updateDressing from
  './dressing' (another worker writes that file; its signatures are below and will not change).

  initWorld(scene):
  - root = new THREE.Group(), root.name = 'world' (input.ts skips the object named 'world' when raycasting; keep the
    name), scene.add(root).
  - Lights in root: hemi = new THREE.HemisphereLight(0xcfe8ff, 0x4a6b2a, 1.4);
    sun = new THREE.DirectionalLight(0xfff1d6, 2.2), sun.castShadow = true, sun.shadow.mapSize.set(2048, 2048),
    shadow camera left/bottom -80, right/top 80, near 1, far 300, updateProjectionMatrix(), sun.shadow.bias = -0.0005;
    root.add(sun) and root.add(sun.target).
  - scene.background = new THREE.Color(0x9fd0f0); scene.fog = new THREE.Fog(0x9fd0f0, WORLD.fogNear, WORLD.fogFar).
  - dressingWalk = buildDressing(root) (array of deck floor and ramp meshes).

  updateWorld(dt, focus):
  1. Sun: sun.position.set(focus.x + 60, focus.y + 90, focus.z + 40); sun.target.position.copy(focus);
     sun.target.updateMatrixWorld().
  2. Theme: id = zoneAt(focus.x, focus.z); def = themeZoneAt(focus.x, focus.z). Indoor (id !== null &&
     ZONES[id].indoor, import ZONES from './content'): sun.visible = false, hemi colours 0x8a8aa0 / 0x222222 intensity
     0.45, fog near 30 far 120. Outdoor: sun.visible = true, hemi 0xcfe8ff / 0x4a6b2a 1.4, fog near WORLD.fogNear far
     WORLD.fogFar. Blend scene.background and fog colour toward def.theme.sky and def.theme.fog with
     color.lerp(target, 1 - Math.exp(-2 * dt)); snap on the very first call.
  3. Streaming. C = WORLD.chunk. A chunk (ci, cj) covers x in [ci*C, (ci+1)*C), z likewise; its centre is
     (ci*C + C/2, cj*C + C/2). Wanted chunks: every chunk whose centre is within WORLD.viewRadius of focus (x, z) AND
     that is part of the world: min over all zone ids of zoneRectDistance(id, cx, cz) < WORLD.blend + 50 (skip the
     void). Wanted LOD: 0 when the centre is within WORLD.nearRadius, else 1. Keep a Map from chunk key to
     { lod, group }. Each frame build at most 2 chunks (missing ones or ones whose LOD changed), nearest first;
     a rebuilt chunk replaces the old one (dispose the old geometries; never dispose the shared materials).
     Remove chunks whose centre is farther than WORLD.viewRadius + C.
     The very first call (and any call where the chunk under focus is missing) builds all LOD 0 chunks within
     WORLD.nearRadius at once, so the player never stands on nothing.
  4. updateDressing().

  getWalkMeshes(): the terrain meshes of every built chunk plus dressingWalk. Keep an array and update it when chunks
  change (input.ts calls this on every pointer move).

  A chunk's terrain mesh: geometry = new THREE.PlaneGeometry(C, C, n, n) with n = 32 for LOD 0 and n = 8 for LOD 1,
  .rotateX(-Math.PI / 2), .translate(centreX, 0, centreZ); set each vertex Y to heightAt(x, z); toNonIndexed(); colour
  each triangle with groundColourAt(centroid x, centroid z) into a 'color' attribute (as the old buildWorld does);
  computeVertexNormals(). One shared material: new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }).
  mesh.receiveShadow = true. LOD 1 meshes: mesh.position.y = -0.1 so seams with LOD 0 neighbours hide.

  Flora (LOD 0 chunks only): group chunkFlora(ci, cj) by kind; for each kind and each of its parts make one
  THREE.InstancedMesh(partGeometry, sharedMaterial(colour), count) with setMatrixAt(i, m) where m is
  new THREE.Matrix4().compose(new Vector3(f.x, f.y, f.z), new Quaternion().setFromAxisAngle(Y axis, f.rot), scale).
  Bake each part's offset into its geometry once (geometry.translate), shared by all chunks. Parts (from the old
  buildFlora), scale (s, s, s) unless noted:
  - pine: trunk CylinderGeometry(0.25, 0.35, 1.6, 6) up 0.8, 0x6b4a2e; cones ConeGeometry(1.6, 2, 7) up 1.8,
    ConeGeometry(1.25, 2, 7) up 2.8, ConeGeometry(0.9, 2, 7) up 3.7, all 0x2f6b2f.
  - broad: the same trunk; IcosahedronGeometry(1.7, 0) up 3, 0x3f8f3a.
  - grass: four ConeGeometry(0.07, 0.9, 3) blades up 0.45 at (0.15, 0), (-0.12, 0.1), (0.05, -0.18), (-0.08, -0.05),
    merged into one geometry with mergeGeometries from 'three/examples/jsm/utils/BufferGeometryUtils.js'; 0x7fb84a.
  - clover: three IcosahedronGeometry(0.28, 0).scale(1, 0.35, 1) leaves up 0.1 at angle k*2*PI/3, distance 0.18,
    merged; 0x3f9a45.
  - hedge: BoxGeometry(2.4, 1.5, 2.2) up 0.75, 0x2d5e2b, scale (1, 1, 1).
  - boulder: DodecahedronGeometry(1, 0) up 0.5, 0x8f8f88, scale (s, 0.8 s, s).
  - pipe: CylinderGeometry(0.35, 0.35, 4, 8) up 2, 0x8a4a2a, scale (1, 1, 1).
  - stubble: five ConeGeometry(0.1, 0.5, 3) tufts up 0.25 at small fixed offsets within 0.25 m, merged; 0xd9c35a.
  - rock: DodecahedronGeometry(1, 0), 0x8a8a80, scale (s, 0.7 s, s).
  castShadow = true for pine, broad, hedge, boulder, pipe, rock; false for grass, clover, stubble.
  receiveShadow = true for all. Materials: one MeshLambertMaterial({ color, flatShading: true }) per colour, shared.

## Contract (do not change these signatures)
export function initWorld(scene: THREE.Scene): void
export function updateWorld(dt: number, focus: THREE.Vector3): void
export function getWalkMeshes(): readonly THREE.Object3D[]
From './dressing' (fixed): buildDressing(root: THREE.Group): THREE.Object3D[]; updateDressing(): void.

## Done when
- npx tsc --noEmit -p games/gnomes-of-gnomomia passes (run from the worktree root). Errors in files you do not own
  that come from other workers mid-edit are not yours; your file must have none.
- Reading the code: no per-blade or per-tree THREE.Mesh (flora is InstancedMesh only); chunk builds are capped at 2
  per frame except the first-call/near rule; removed chunks dispose their geometries.

## Out of scope
src/dressing.ts (houses, shrines, lakes, decks, gates), src/terrain.ts, src/main.ts, src/input.ts and every other file.
~~~~

### 2.2 Dressing

~~~~text
Epic: 2 (Systems), issue 2.2: Dressing (every zone's set pieces, decks, gates)
Depends on: none

## Environment
Work only in the git worktree C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnomomia-open-world
(Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnomes-of-gnomomia (Vite + TypeScript + three.js 0.187; not Phaser).
Four other workers are editing other files of this game at the same time. Change only src/dressing.ts.
Do not run npm run build / npm run dev, do not start servers, do not git commit.
All positions at runtime are WORLD coordinates: every ZoneDef in ZONES (from './content') already has its houses,
regions, lakes, shrine, walls, decks and exits moved to where the zone sits in the world. Negative z is north.

## Goal
src/dressing.ts builds every zone's fixed set pieces once, for the whole world (the world no longer loads one zone at a
time): houses, shrines, village flowers, lake water, the feral camp, barrows and burrow, signposts, walls, the ring
wall of indoor zones, raised decks with ramps, rings and signs for teleport exits, and gates on closed road passes.

## Read first
- games/gnomes-of-gnomomia/src/dressing.ts: the stub. Keep both signatures.
- The OLD single-zone world, which built all of this for one zone: run
  `git show HEAD:games/gnomes-of-gnomomia/src/world.ts`. Port these functions: lambert/addMesh (shared material per
  colour), addWall (mesh only), labelTexture, buildExit, buildHouse, buildShrine, and from buildWorld the lakes, village
  flowers, feral camp, barrows, burrow, signposts, zone walls and the indoor ring wall.
- games/gnomes-of-gnomomia/src/terrain.ts: heightAt(x, z); addCollider(x, z, r); passes(): readonly Pass[] where
  Pass = { from: ZoneId; to: ZoneId; a: ZoneExit; b: ZoneExit } (a, b = the two road ends, world x/z, with label);
  passOpen(p): boolean; deckLayout(): readonly { deck: Deck; top: number; ramp: { minX; maxX; minZ; maxZ } }[].
- games/gnomes-of-gnomomia/src/config.ts: Deck { x, z, w, d, y, stair: 'n'|'s'|'e'|'w', style?: 'wood'|'stone' },
  ZoneDef, TUNING.waterLevel.
- games/gnomes-of-gnomomia/src/zones.ts: isTeleportExit(from: ZoneId, to: ZoneId): boolean.

## Change
- games/gnomes-of-gnomomia/src/dressing.ts:
  buildDressing(root): for every zone in Object.values(ZONES) build into root (one THREE.Group per zone):
  - Houses (buildHouse as before), the shrine (the well when zone.id === 'mossbottom', else the stone shrine), lake
    water (CircleGeometry(lake.r * 1.4, 40) at y = TUNING.waterLevel; skip lakes in indoor zones only if the old code
    did; it did not), the zone.walls (addWall, height 4, colour 0x8a8a84, or 0x8b4a3a when zone.indoor), and for indoor
    zones the ring wall at half - 0.75 around the zone's origin (zone.origin!, height 8, 0x8b4a3a).
  - Village flowers round each outdoor zone's shrine (40 per zone, rng seeded per zone: mulberry32(7 + index of the
    zone)), the feral camp / barrows / burrow when the zone has a region with that id, signposts halfway from the
    shrine to each region (as before).
  - COLLIDERS: terrain.ts already adds colliders for houses, shrines, zone walls, indoor ring walls and deck posts. Do
    NOT add those again. DO call addCollider for the props terrain does not know: camp tents (r 2) and campfire (r 1),
    barrow stones (r 0.9) and mounds (r 3.2), burrow heaps (r 1.8), signposts (r 0.3). Remove every other addCollider
    call from the ported code.
  - Teleport exits: for each exit of each zone with isTeleportExit(zone.id, exit.to), the glowing ring and signpost
    (buildExit). Keep the list for updateDressing.
  - Road passes: for each p of passes(), at each end (p.a and p.b): a signpost with that end's label (always visible,
    same board style as buildExit, no ring) and a gate group shown while the pass is closed: two posts
    BoxGeometry(0.3, 2.2, 0.3) 0x5a3a1e at +-3.2 m across the road, a bar BoxGeometry(6.8, 0.3, 0.3) 0x8b6a3e at
    y 1.6 and a second at y 0.8, turned to face along the road (rotation.y = Math.atan2(b.x - a.x, b.z - a.z)), and a
    small board above reading 'Closed'. Keep the list for updateDressing.
  - Decks: for each entry of deckLayout(): colour 0x8b6a3e (wood, the default) or 0x9a9a92 (stone).
    Floor: BoxGeometry(deck.w, 0.3, deck.d) centred at (deck.x, top - 0.15, deck.z).
    Posts: CylinderGeometry(0.2, 0.2, h) at the four corners inset 0.3 m, from the ground (heightAt at the post) up to
    the floor (h = top - ground).
    Railings: BoxGeometry boxes 0.1 thick and 0.9 tall standing on the floor along all four edges, leaving a 2.4 m gap
    centred on the stair side.
    Ramp: one BoxGeometry(2.4, 0.2, length) for 'n'/'s' (or (length, 0.2, 2.4) for 'e'/'w') where
    run = 2 * deck.y, rise = top - heightAt(ramp foot centre), length = Math.hypot(run, rise); centre it halfway
    between the top edge (at the deck side, height top) and the foot (height of the ground there), and tilt it
    (rotation.x for n/s, rotation.z for e/w) by Math.atan2(rise, run) with the sign that makes it slope down away from
    the deck. Check the sign by computing both end heights in a comment.
    Return the floor and ramp meshes (not posts or railings) from buildDressing: they are what a click lands on.
  updateDressing(): each teleport exit's group.visible = checkCondition(exit.when) (import from './quests'); each gate
  group.visible = !passOpen(p).
  Use one shared MeshLambertMaterial({ color, flatShading: true }) per colour; castShadow and receiveShadow true on
  meshes as before.

## Contract (do not change these signatures)
export function buildDressing(root: THREE.Group): THREE.Object3D[]
export function updateDressing(): void

## Done when
- npx tsc --noEmit -p games/gnomes-of-gnomomia passes (run from the worktree root). Errors in files you do not own
  that come from other workers mid-edit are not yours; your file must have none.
- The file builds every zone (outdoor and indoor) in one call, adds colliders only for the props listed above, and
  draws gates and teleport rings that follow their conditions.

## Out of scope
src/world.ts (terrain, flora, lights, fog), src/terrain.ts, src/zones.ts, src/config.ts and every other file.
~~~~

### 2.3 Floors: pathfinding and the player

~~~~text
Epic: 2 (Systems), issue 2.3: Walk on floors (pathfinding and the player)
Depends on: none

## Environment
Work only in the git worktree C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnomomia-open-world
(Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnomes-of-gnomomia (Vite + TypeScript + three.js 0.187).
Four other workers are editing other files of this game at the same time. Change only src/pathfind.ts and
src/player.ts. Do not run npm run build / npm run dev, do not start servers, do not git commit.

## Goal
The player can walk up a ramp onto a raised deck (an outdoor second floor), walk around on it, and walk back down.
Clicking a deck walks to the deck; clicking the ground under it walks to the ground. Paths respect heights.

## Read first
- games/gnomes-of-gnomomia/src/pathfind.ts: grid A* (findPath) over 1 m cells with line-of-sight smoothing.
- games/gnomes-of-gnomomia/src/player.ts: pathTo, walkTo(x, z, _y?), teleportPlayer, updatePlayer (step 3 moves along
  the path, step 4 sets position.y = heightAt).
- games/gnomes-of-gnomomia/src/terrain.ts: heightAt(x, z); standY(x, z, fromY): number | null = the height a walker
  standing at fromY ends up at when stepping to (x, z) (a ground, deck or ramp surface within WORLD.step = 0.6 m of
  fromY that is not blocked), or null when it cannot step there. isBlocked(x, z) is the ground-only test.

## Change
- games/gnomes-of-gnomomia/src/pathfind.ts: keep findPath as it is (other code may use it). Add:
    export interface Point3 { x: number; y: number; z: number }
    export function findPath3(from: Point3, to: Point3,
      step: (x: number, z: number, fromY: number) => number | null): Point3[]
  Same A* as findPath, but a node carries y and its key is (i, j, level) with level = Math.floor(y / 2) (combine into
  one number, e.g. cellKey(i, j) * 64 + (level + 32)). A neighbour (ni, nj) is reachable when
  ny = step(ni, nj, n.y) is not null; its y is ny. Diagonals need both orthogonal neighbours reachable from n.y. The
  start node uses from.y and is always free. The goal is reached at cell (round(to.x), round(to.z)) with
  |y - to.y| < 1.5. Heuristic: octile as now. "Closest" fallback node: the one with the smallest h + |y - to.y|.
  Smoothing: line check samples every 0.4 m carrying y: y = step(x, z, y) at each sample; the line is clear when no
  sample returns null and the final y is within 1.5 of the target waypoint's y. Output waypoints carry y. A reached
  goal ends exactly on (to.x, y found there, to.z).
- games/gnomes-of-gnomomia/src/player.ts:
  - player.path becomes { x: number; y: number; z: number }[].
  - pathTo(x, z, y?) uses findPath3({ x, y, z of player.position }, { x, y: y ?? heightAt(x, z), z }, standY).
  - walkTo(x, z, y?: number): rename _y to y and pass it to pathTo. Keep the signature.
  - Action targets (entities, objects) path to their ground height (y undefined).
  - updatePlayer step 3: move x/z along the path as now, but in sub-steps of at most 0.25 m; after each sub-step,
    ny = standY(x, z, currentY). If ny is null, stop: keep the last good x/z/y and clear the path. Else currentY = ny.
    Step 4 becomes: player.position.y = currentY (no more heightAt there).
  - teleportPlayer(x, z) keeps setting y = heightAt(x, z) (teleports land on the ground).
  - createPlayer keeps y = heightAt.

## Contract (do not change these signatures)
export function walkTo(x: number, z: number, y?: number): void   (input.ts passes the clicked point's y)
export function teleportPlayer(x: number, z: number): void
export function findPath(from: Point, to: Point, blocked: (x: number, z: number) => boolean): Point[]  (unchanged)
player.position stays a THREE.Vector3 whose y is the height the player stands at.

## Done when
- npx tsc --noEmit -p games/gnomes-of-gnomomia passes (run from the worktree root). Errors in files you do not own
  that come from other workers mid-edit are not yours; your files must have none.
- A small test you write and delete again: bundle a script with esbuild that imports findPath3 and calls it with a
  step function describing a 10 x 10 m flat ground plus a 4 x 4 deck at height 3 (x 0..4, z 0..4) with a ramp along
  +z from z 4 to z 10 at x 1.5..2.5 that falls from 3 to 0 (the ground under the ramp's high part is blocked); a path
  from the ground point { x: 7, y: 0, z: 9 } to the deck point { x: 2, y: 3, z: 2 } must end at y 3 and pass through
  the ramp (some waypoint or line sample with z between 4 and 10 and y between 0 and 3). Put scratch files under C:\Users\cpsai\.claude\jobs\f448d056\tmp\worker-2-3\ and delete them.

## Out of scope
src/terrain.ts, src/input.ts, src/entities.ts (enemies stay on the ground for now) and every other file.
~~~~

### 2.4 See players by distance

~~~~text
Epic: 2 (Systems), issue 2.4: Other players by distance, with height
Depends on: none

## Environment
Work only in the git worktree C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnomomia-open-world
(Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnomes-of-gnomomia (Vite + TypeScript + three.js 0.187).
Four other workers are editing other files of this game at the same time. Change only src/net/protocol.ts,
src/net/mmo.ts and src/ui/online.ts. Do not run npm run build / npm run dev, do not start servers (no mp-server
either), do not git commit.

## Goal
In the open world you see every other gnome within WORLD.remoteViewRadius (450 m) of you, whatever zone either of you
is in, at their real height (on a deck or on the ground). Name plates show within WORLD.plateRadius (60 m).
Today remote gnomes are drawn only when they are in the same zone, on the ground.

## Read first
- games/gnomes-of-gnomomia/src/net/protocol.ts: Pose = [x, z, facing, dead, swings], NET_VERSION, readPose.
- games/gnomes-of-gnomomia/src/net/mmo.ts: myPose, sendPose, the 'relay' pos handler (drops the model when the zone
  differs), the 'zone-changed' handler in initMmo, updateMmo (draws only r.zone === state.zone; sets y = heightAt),
  the Interp created with { angles: [2], steps: [3, 4], pos: [0, 1], snapDist: SNAP_DIST }.
- games/gnomes-of-gnomomia/src/ui/online.ts: updateOnlineUi (plates), the pill's "here" count, the roster sort.
- games/gnomes-of-gnomomia/src/config.ts: WORLD.remoteViewRadius = 450, WORLD.plateRadius = 60.
- packages/mp/src/interp.ts (read only): samples are fixed-length number arrays; `pos` lists position indexes.

## Change
- src/net/protocol.ts: Pose becomes [x, z, facing, dead, swings, y] (y appended at index 5, finite in -1e4..1e4).
  NET_VERSION = 2. readPose accepts length 6 only. Update the Pose doc comment.
- src/net/mmo.ts: myPose appends round(player.position.y). Interp: pos [0, 1, 5]. The pos handler keeps r.zone up to
  date (it is still shown in the roster) but no longer drops the model when the zone differs; it clears interp only
  when the zone changes AND the new position is farther than 50 m from the shown one (a teleport). The
  'zone-changed' handler no longer drops models (keep sendPose(true) and changed()). updateMmo: a remote gnome is
  drawn when interp.ready and Math.hypot(x - player.position.x, z - player.position.z) <= WORLD.remoteViewRadius
  using its sampled x/z; otherwise dropModel. Its y is the sampled y (index 5), not heightAt. r.shown becomes 6 long
  wherever it is created. Update the header comment ("other players who are in my zone" -> "within 450 m").
- src/ui/online.ts: plates only for gnomes with a model within WORLD.plateRadius of the player (hide others). The
  pill's count of gnomes "here" becomes the count with a model (drawn = near you); rename its wording from "here" to
  "near" where it is shown. The roster still sorts gnomes in my zone first.

## Contract
Pose on the wire: [x, z, facing, dead, swings, y]; NET_VERSION 2. Clients of version 1 are ignored (cards from
another version are already ignored by readCard; poses of the wrong length by readPose).
Exports of mmo.ts and online.ts keep their names and signatures (main.ts calls initMmo, updateMmo, goOnline,
createOnlineUi, updateOnlineUi).

## Done when
- npx tsc --noEmit -p games/gnomes-of-gnomomia passes (run from the worktree root). Errors in files you do not own
  that come from other workers mid-edit are not yours; your files must have none.
- grep shows no remaining `r.zone !== state.zone` visibility test in mmo.ts and no heightAt for remote y.

## Out of scope
packages/mp and packages/mp-server (no server change: the room already relays to everyone), src/player.ts and every
other file.
~~~~

### 2.5 Decks in the zones, and the linter for world coordinates

~~~~text
Epic: 2 (Systems), issue 2.5: Decks in the zones; content linter for world coordinates
Depends on: none

## Environment
Work only in the git worktree C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnomomia-open-world
(Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnomes-of-gnomomia. Four other workers are editing other files of this game at the same time. Change only
games/gnomes-of-gnomomia/scripts/lint-content.mjs and the zone files src/data/zones/mossbottom.ts, thatchford.ts,
keep.ts, verge.ts. Do not run npm run build / npm run dev, do not start servers, do not git commit.

## Goal
1. The content linter works with the open world: src/content.ts now moves every zone, NPC, spawn, object, quest point
   and travel action to WORLD coordinates (each ZoneDef has `origin: { x, z }`, the world position of its centre;
   zone files are still authored around 0,0). The linter's "off the map" and exit checks still assume local
   coordinates, so today it reports 19 false errors.
2. Four zones get raised decks (outdoor second floors with a ramp), so players can climb up and look out over the
   world, and the linter checks every deck.

## Read first
- games/gnomes-of-gnomomia/scripts/lint-content.mjs: the whole file.
- games/gnomes-of-gnomomia/src/config.ts: Deck { x, z, w, d, y, stair: 'n'|'s'|'e'|'w', style?: 'wood'|'stone' }
  (x, z centre; w along x; d along z; y floor height above the ground; the ramp is 2.4 m wide, 2*y long, leaving the
  middle of the `stair` side; 'n' = -z, 's' = +z, 'e' = +x, 'w' = -x), ZoneDef.decks, ZoneDef.origin, ZoneExit.
- games/gnomes-of-gnomomia/src/zones.ts: isTeleportExit (an exit teleports only when either zone is indoor or it
  points to its own zone; exits between two outdoor zones are now road ends, not teleports).
- The four zone files.

## Change
- scripts/lint-content.mjs:
  - Every "off the map" test compares positions relative to the zone's origin: with o = zone.origin ?? { x: 0, z: 0 },
    a point is off the map when Math.abs(x - o.x) > half or Math.abs(z - o.z) > half (same margin the file uses now).
    For an exit's arrival, use the origin of the zone it arrives in (ZONES[exit.to]).
  - Arrival checks (arrival off the map, arrival inside something, "bounces straight back") apply only to teleport
    exits: (exit.to === zone.id) || ZONES[zone.id].indoor || ZONES[exit.to].indoor. Skip them for outdoor-to-outdoor
    exits. Add one check instead: an outdoor-to-outdoor exit must have a matching exit back in the other zone
    (some e in ZONES[exit.to].exits with e.to === zone.id), else error.
  - New deck checks (error level) for every deck of every zone: inside the map with its ramp (ramp box: for 's'
    x in centre +-1.2, z from z + d/2 to z + d/2 + 2y; mirror for the other sides); y between 3 and 12; w and d between
    3 and 40; the deck's footprint and its ramp box, grown by 1 m, do not overlap any house circle (r), the shrine
    (r 1.5), any lake (r * 1.4) or any exit ring (r); the ramp's foot (the far end centre) is not inside any of those.
  - Keep the output format and the exit code.
- Zone files: add a `decks: [...]` field (after `houses`) with these decks, positions in that zone's LOCAL
  coordinates like everything else in the file. Pick exact x/z yourself so that the linter passes; stay close to
  the place described:
  - mossbottom.ts: the Mossbottom watchtower: { w: 4, d: 4, y: 7, stair: 's' } (wood) within 25 m of the well (0, 0),
    clear of the five mushroom houses.
  - thatchford.ts: the market lookout: { w: 6, d: 4, y: 5 } (wood) within 30 m of the fountain (0, 0), on dry land
    (the Hose river lakes run north-south near x = 0; the ford corridor |z| < 7, |x| < 14 must stay clear).
  - keep.ts: the Pedestal wall-walk: a long stone deck { w: 28, d: 3, y: 6, style: 'stone' } between the castle
    (z about -30) and Pedestal Ward (z about 25), clear of the castle houses; and Robin Roost tower:
    { w: 4, d: 4, y: 9, style: 'stone' } near (22, -46) but clear of the tent there and of the Basin lake (0, -50, r 10).
  - verge.ts: the Last Tuft lookout: { w: 4, d: 4, y: 9 } (wood) within 20 m of the Last Tuft region's centre (read
    its region in the file).
  Add a one-line comment above each deck naming it.

## Done when
- From the worktree root: node games/gnomes-of-gnomomia/scripts/lint-content.mjs prints 0 errors (warnings that were
  there before are fine; list them in your report).
- npx tsc --noEmit -p games/gnomes-of-gnomomia passes for your files.
- Temporarily moving one deck onto a house makes the linter report it (then move it back).

## Out of scope
src/content.ts, src/terrain.ts, src/config.ts, the other zone files and every other file.
~~~~
