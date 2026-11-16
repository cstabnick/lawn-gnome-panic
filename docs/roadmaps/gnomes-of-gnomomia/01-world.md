Epic: 2, Systems
Depends on: none

## Environment
Read `docs/roadmaps/gnomes-of-gnomomia/00-environment.md` first; it applies in full.

## Goal
A low-poly, flat-shaded, old-school 3D world: rolling grass with dirt roads, a lake, forest, the mushroom-house village of Mossbottom, a feral camp, standing-stone barrows and the Mole King's burrow, with collision for walkers.

## Read first
- `games/gnomes-of-gnomomia/src/config.ts`: `TUNING` (worldHalf 120, waterLevel), `SPAWN`, `REGIONS`, `LAKE`, `HOUSES`, `WELL`.
- `games/gnomes-of-gnomomia/src/world.ts`: the stub you replace.

## Change
- `games/gnomes-of-gnomomia/src/world.ts`: replace the stub. Keep the five exports exactly.

### heightAt(x, z)
Pure and fast (called thousands of times per frame by pathfinding):
1. `h = 1.6*sin(x*0.045+1.1)*cos(z*0.038-0.6) + 0.8*sin((x+z)*0.09) + 0.5*sin(x*0.13 - z*0.11)`.
2. Edge hills: `h += 9 * smoothstep(TUNING.worldHalf - 28, TUNING.worldHalf, max(|x|, |z|))`.
3. Flatten regions: for each region in `REGIONS`, `d = distance to (r.x, r.z)`, `h *= smoothstep(r.r * 0.8, r.r + 10, d)` (so it is ~0 inside a region). Exception: for region id `'burrow'`, after flattening add `2.5 * exp(-(d*d)/(9*9)) - 3 * exp(-(d*d)/(3*3))` (a mound with a pit in the middle).
4. Lake: `dl = distance to (LAKE.x, LAKE.z)`; `h -= 4 * exp(-(dl*dl)/(LAKE.r*LAKE.r*0.6))`.
Write a local `smoothstep(a, b, x)` (clamped 0..1, `t*t*(3-2t)`).

### buildWorld(scene)
- `scene.background = new THREE.Color(0x9fd0f0)`; `scene.fog = new THREE.Fog(0x9fd0f0, 70, 170)`.
- Lights: `HemisphereLight(0xcfe8ff, 0x4a6b2a, 1.4)`; `DirectionalLight(0xfff1d6, 2.2)` at (60, 90, 40) with `castShadow = true`, `shadow.mapSize.set(4096, 4096)`, shadow camera left/bottom -130, right/top 130, near 1, far 300, `shadow.bias = -0.0005`. Add the light's target to the scene at (0,0,0).
- Terrain: `new THREE.PlaneGeometry(240, 240, 160, 160)`, `.rotateX(-Math.PI / 2)`, then for each vertex set y = heightAt(x, z). Call `geometry.toNonIndexed()` and colour each TRIANGLE with one colour (all 3 vertices the same, set via a `color` BufferAttribute) chosen at its centroid:
  - road (within 2.2 units of any segment from (0,0) to each non-village region centre): `0x9b7a4c`;
  - sand (height < TUNING.waterLevel + 0.6): `0xd8c78a`;
  - burrow region (within its r): `0x6b5038`;
  - barrows region (within its r): `0x6f8a55`;
  - otherwise grass: pick between `0x5f9e3f`, `0x5a963b`, `0x67a745` by `Math.abs(Math.sin(cx*12.9898 + cz*78.233)*43758.5453) % 1` (stable per triangle).
  Then `computeVertexNormals()`. Material `MeshLambertMaterial({ vertexColors: true, flatShading: true })`. `receiveShadow = true`. Keep this mesh for `getGroundMesh()`.
- Lake water: `CircleGeometry(LAKE.r * 1.4, 40)` rotated flat, at y = TUNING.waterLevel, `MeshLambertMaterial({ color: 0x3f7fbf, transparent: true, opacity: 0.8 })`.
- Use a seeded random so the world is the same every load: `function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}`, seed 7.
- Trees: 320 attempts at random (x, z) inside ±(worldHalf - 6). Skip if within (r + 5) of any region, within 3.5 of a road segment, within LAKE.r + 5 of the lake, or heightAt < waterLevel + 0.5. Two kinds at random: pine (trunk `CylinderGeometry(0.25, 0.35, 1.6, 6)` colour 0x6b4a2e, then 3 stacked `ConeGeometry` of radius 1.6, 1.25, 0.9, height 2, 7 segments, colour 0x2f6b2f, at y 1.8, 2.8, 3.7) or broadleaf (same trunk, then `IcosahedronGeometry(1.7, 0)` colour 0x3f8f3a at y 3). Random scale 0.9..1.7 and yaw. All `MeshLambertMaterial({ flatShading: true })`, `castShadow = true`. Collider circle radius 0.6 * scale.
- Rocks: 70 attempts, same skip rules (without the road rule), `DodecahedronGeometry(1, 0)` colour 0x8a8a80 flat-shaded, scale random 0.4..1.4 (y squashed by 0.7), half sunk into the ground; collider radius 0.8 * scale. Also 6 rocks around the lake shore.
- Mossbottom: for each of `HOUSES` build a mushroom house at ground height: stem `CylinderGeometry(r*0.7, r*0.85, 3, 10)` colour 0xf2e6c8 (centre at y 1.5); cap = hemisphere `SphereGeometry(r*1.35, 14, 8, 0, Math.PI*2, 0, Math.PI/2)` colour 0xc8352e at y 2.8, scaled y by 0.8; 8 white dots (`SphereGeometry(0.25, 6, 4)`, 0xffffff) on the cap surface; a door (`BoxGeometry(1, 1.6, 0.2)`, 0x5a3a1e) on the stem surface facing the house's yaw (door direction = (sin yaw, 0, cos yaw)); a round window (`CircleGeometry(0.35, 12)`, 0xfff2a8, emissive feel via `MeshBasicMaterial`). Collider radius r * 0.9. Cast and receive shadows.
- Well at `WELL`: ring `CylinderGeometry(1.2, 1.3, 0.9, 12, 1, true)` grey 0x8d8d8d plus a dark water disc, two posts and a small cone roof 0x8b4a2b. Collider radius WELL.r.
- Village flowers: 40 small spheres (radius 0.15) in random bright colours (0xff6fa8, 0xffe14f, 0xb36bff, 0xffffff) on short green stems, scattered within 20 of (0,0), not inside a house or the well. No collider.
- Feral camp (region `'camp'`): 3 tents (`ConeGeometry(2.2, 3, 6)`, colours 0x7d6a4f / 0x6a5a40) round the centre at radius 8; a campfire at the centre (5 small logs + `ConeGeometry(0.5, 1.2, 6)` with `MeshBasicMaterial` colour 0xff8a1e, plus `PointLight(0xff9a3c, 3, 14)` at y 1.2). Colliders for tents (radius 2) and the fire (radius 1).
- Beetle Barrows (`'barrows'`): 9 standing stones (`BoxGeometry(1.2, 3.5, 0.8)`, 0x7f7f78, flat-shaded, slight random tilt) evenly round a ring of radius 13 about the centre, plus 2 grassy mounds (`SphereGeometry(4, 10, 6)` squashed y 0.35, colour 0x6f8a55) at radius 6. Colliders for stones (radius 0.9) and mounds (radius 3.2).
- Grubthorn's Burrow (`'burrow'`): 7 dirt heaps (`ConeGeometry(2.2, 2, 7)`, 0x6b5038) round a ring of radius 10, a black disc (`CircleGeometry(2.2, 16)`, 0x1a120c) flat at the centre at ground height + 0.05. Colliders for heaps (radius 1.8). The centre stays walkable.
- Signposts: at each road's midpoint a post (`BoxGeometry(0.15, 1.6, 0.15)`) and a board (`BoxGeometry(1.2, 0.35, 0.08)`), colour 0x8b6a3e. Collider radius 0.3.
- Every scenery object sits at `heightAt(x, z)` of its position.

### isBlocked(x, z)
True if `|x|` or `|z|` > TUNING.worldHalf - 2, or `heightAt(x, z) < TUNING.waterLevel + 0.1`, or inside any collider circle. Colliders must be fast: store them in a `Map<string, {x,z,r}[]>` keyed `` `${Math.floor(x/8)},${Math.floor(z/8)}` ``, adding each collider to every 8x8 cell its circle overlaps; a query only checks its own cell.

### getGroundMesh()
Returns the terrain mesh (throw if buildWorld has not run).

### regionNameAt(x, z)
The `name` of the first region in `REGIONS` with distance <= r + 6, else `'the Wilds'`.

## Contract
The five exports keep their stub signatures exactly. `heightAt` must stay pure and must not depend on buildWorld having run (other modules call it at any time). Spawn point `SPAWN` (3, 3), the NPC spots near (0, 6), (-9, -4), (9, -3), (-20, 2), (6, 14) and every region centre must NOT be blocked.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` shows no errors in `src/world.ts`.
- Reading your code: `isBlocked(3, 3)`, `isBlocked(0, 6)`, `isBlocked(45, 18)`, `isBlocked(10, -88)` are false and `isBlocked(50, -45)` (lake centre) is true.

## Out of scope
Every other file. No entities, no player, no UI.
