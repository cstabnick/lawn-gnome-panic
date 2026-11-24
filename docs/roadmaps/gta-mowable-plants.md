# Gnome Theft Auto: mowable plants

Goal (the user's words): "make small bushes and plants and such get mowed over by the vehicles rather than blocking
people." Small plants stop being colliders. A vehicle that drives into one mows it (cut to stubble, a burst of
clippings, a snip, a small slow and a camera shake only for big shrubs), a gnome on foot brushes it aside, and it grows
back 70-120 s later once the player is 30 m away. Lawn mowers are the point of the game, so the player's mows count:
a Mowed tally, two achievements with their own cosmetic rewards, and a small Lawn Service bonus for long grass cut on a
mower.

## What blocks today (survey, from `src/data/layout.golden.json`)

Plant colliders come from four builders, each pushing a plain `Box` into `world.boxes` next to a static batch placement:

| source | prefab | placed | with a collider | placed size |
|---|---|---|---|---|
| `biomes.ts` desert scatter (`drop`, solid) | barrel-cactus | 115 | 115 | 0.4-0.8 m wide, 0.45 m tall |
| `settlements.ts` `placeDecor` | barrel-cactus (scale 2.86) | 4 | 1 | 1.5 m, 1.0 m |
| `scenery.ts` `placeSolid` (planting >= 1.5 m wide) | fern-clump | 29 | 28 | 2 m, 0.45 m |
| same | flower-bed | 70 | 66 | 2-3.9 m, 0.5-0.8 m |
| same | wildflower-patch | 12 | 12 | 1.6-2.7 m, 1 m |
| same | reed-bed | 2 | 2 | 2.7 m, 1.5 m |

About 224 colliders. Non-blocking plants of the same kinds (Turfton gardens, forest scatter, wheat fields) are made
mowable too, so the rule is simple: every placement of a mowable kind under 1.8 m is mowable. 1393 plants in all
(wheat 858, flower-bed 108, barrel-cactus 121, fern-clump 84, ornamental-grass 69, round-bush 65, boxwood-ball 53,
lavender-row 18, wildflower-patch 14, reed-bed 3). Not mowable, colliders kept: hedgerows (560 garden + 100 roadside,
walls), hedge arches, topiary cones (2.2 m set pieces), tall cacti, every tree, hay bales, logs, stumps, rocks.

## Plant kinds (`src/flora/kinds.ts` PLANT_KINDS)

| id | size | mowable | slow | clippings | regrow s | sound | long grass |
|---|---|---|---|---|---|---|---|
| wheat-patch | tiny | yes | 1 | 0xd8b75a | 90-120 | mow-snip | yes |
| ornamental-grass | small | yes | 0.98 | 0xb8b060 | 70-110 | mow-snip | yes |
| fern-clump | small | yes | 0.98 | 0x4f8f3a | 70-110 | mow-snip | no |
| flower-bed | small | yes | 0.97 | 0xd96aa0 | 70-110 | mow-snip | no |
| wildflower-patch | small | yes | 0.97 | 0xe8c43a | 70-110 | mow-snip | no |
| lavender-row | small | yes | 0.97 | 0x9b7fd1 | 70-110 | mow-snip | no |
| barrel-cactus | small | yes | 0.95 | 0x5d8f4a | 80-120 | mow-chop | no |
| reed-bed | big | yes | 0.9 | 0x8fa457 | 80-120 | mow-chop | yes |
| boxwood-ball | big | yes | 0.86 | 0x3f7a35 | 90-120 | mow-thunk | no |
| round-bush | big | yes | 0.86 | 0x4a8a3c | 90-120 | mow-thunk | no |
| hedgerow, hedge-arch, topiary-cone, tall-cactus, broadleaf-tree, cone-pine, snow-pine, palm-tree, giant-oak | big | no | - | - | - | - | - |

A placement taller than `FLORA.maxMowHeight` (1.8 m) stays static and solid even when its kind is mowable.

## How it works

- **Harvest, not a builder rewrite.** `app.ts` calls `beginPlantHarvest()` right before `buildWorld`. While it is open,
  `cull.ts buildStaticCells` offers every placement to `flora/harvest.ts` first (`setStaticPlantFilter`); a mowable one
  becomes a `PlantSeed` and is left out of the merged cell. `createFlora` then drains the seeds, removes their colliders
  from `world.boxes` (`flora/extract.ts`, matched by footprint centre, size and height) and draws them instanced.
  `buildWorld` is untouched, so the golden layout test (which builds without a harvest) is unchanged, the same way the
  skyways are installed after `buildWorld`. Content built later (parks, fringe) calls
  `addMowablePlants(placements)` and batches what it gets back.
- **Drawing.** One `InstancedMesh` per prefab part per variant (id + tint) per 64 m cell, each cell group registered with
  the culler as `'prop'` (owned). A mow rewrites one instance matrix (`setMatrixAt` + `addUpdateRange` of 16 floats).
  Cut = the same instance at 14 % height (stubble, no extra mesh, nothing flat to z-fight).
- **Contact.** A uniform 4 m grid over the plants' contact centres (CSR typed arrays). Each frame, each ground vehicle
  that moved faster than 1.2 m/s queries a circle of its `spec.radius`; zero allocations. Remote players' vehicles are
  passed in too (local mowing from their relayed poses).
- **Regrow.** Only cut plants are in the active list. A cut plant waits its regrow time, then regrows in three staged
  pulses over 4 s, only while the player is at least 30 m away.
- **Online.** No new message. Each client mows locally from every vehicle it sees, including other players' (their poses
  arrive anyway), and regrowth is time-based, so clients agree closely enough for a cosmetic effect. net.ts untouched.
- **Rewards.** Counted only for the player's own driving: `gta-mowing-v1` save (`{ v, total, lawn, byKind }`, cloud merge
  = per-field max), achievements `gta-short-back-and-sides` (100 mows, head `clippings-crown`) and
  `gta-head-groundskeeper` (1000 mows, back `grass-catcher-pack`, exclusive), Lawn Service: every 10 long-grass cuts on a
  mower pays 3 Acorns. A small "✂ N mowed" pill on the HUD.
- **Trainer.** Section "Mowing" (counts, Mow all within 40 / 200 m, Regrow everything, Reset counter) and Spawn-tab
  group "Plants" (Mow 15 m here, Regrow all).

## Shape

| epic | done when | issues |
|---|---|---|
| 0 foundation (planner) | `src/flora/types.ts`, `kinds.ts`, `harvest.ts`, stubs, `cull.ts` hook; tsc clean | - |
| 1 parts | grid/extract, state machine, instanced render, clippings + sounds, rewards + tally, prefabs + achievements; each with tests | 6 |
| 2 runtime | `createFlora` + trainer, the world classification test | 2 |
| 3 wiring (planner) | `app.ts`, `saveIO.ts`, `cloudSave.ts`, `__gta.flora`; headless drive-through check; perf before/after | - |

Hot-file edits (all additive, by the planner): `src/cull.ts` (`setStaticPlantFilter` + one `continue` in
`buildStaticCells`), `src/app.ts` (import, `beginPlantHarvest()` before `buildWorld`, `createFlora`, one update call,
`flora` on `__gta`), `src/saveIO.ts` (+1 key), `src/cloudSave.ts` (+1 merge). Packages: `packages/prefabs` (new
catalog file + index line), `packages/achievements/src/catalog.ts` (+2 entries).

## Status

Done. Workers did 1A, 1B, 1D, 1E and 1F; the planner wrote 1C (render), 2A (runtime, trainer and its test) and 2B
(world and kinds tests) itself because the shared subagent limit was full. Planner fix found by the runtime test:
`beginPlantHarvest()` now clears the old sink, so a second world build never hands its plants to an old flora.
Headless check: `node tools/gta-mow-check.mjs http://localhost:5198/` drives a zero-turn at full throttle through a
countryside flower bed that used to be a collider (-483, 540): the mower passes it at 23 m/s and the bed is cut.

Cost: `flora.update` measures 0.03 ms a frame in a node bench (whole world, 1349 plants, 40 moving vehicles, desktop CPU),
with zero per-frame allocations. `tools/gta-perf.mjs --cpu 4`, run A/B on the same tree with `&flora=0`: average draw
calls fall in Turfton (218 vs 308), Mossy Wood (176 vs 190) and Turfton back (237 vs 251) and stay the same elsewhere.
Frame times on the shared, busy machine varied by more than any difference between the two runs, both ways. `?flora=0`
keeps the plants static and solid, for comparing.

## Not done / later

- Gnome brush is a lean of the plant, no gnome animation (the anim/ lane owns animation ids).
- No journal page for the counter (the journal belongs to the quest lane); the count shows on the HUD pill and in the
  trainer.
- NPC pedestrians and police on foot pass through plants without brushing them (cost).

## Epic 1 issues

~~~~text
Epic: 1 (mowable plant parts), issue 1A: plant grid and collider extraction
Depends on: none

## Environment
Repo C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn, game games/gnome-theft-auto (three.js, TypeScript, vitest).
In Git Bash, if node is not found: export PATH="/c/Program Files/nodejs:$PATH". Other workers edit other files in
src/flora/ and elsewhere in the game at the same time: touch only the files listed under Change. Do not commit, stash,
switch branches or start servers. Performance matters: the query runs every frame for every vehicle, so it must not
allocate (no arrays, closures, objects or strings inside queryCircle).

## Goal
src/flora/grid.ts builds a PlantStore (flat typed arrays + a uniform grid) from PlantSeeds and answers circle queries
with zero allocations; src/flora/extract.ts removes mowable plants' colliders from the world's box list.

## Read first
- games/gnome-theft-auto/src/flora/types.ts: PlantSeed, PlantStore (every field), STANDING.
- games/gnome-theft-auto/src/flora/grid.ts and extract.ts: the stubs you replace (keep the exported signatures).
- games/gnome-theft-auto/src/flora/harvest.ts: seedOf(placement) makes a PlantSeed from a prefab placement (use it in tests).
- games/gnome-theft-auto/src/types.ts line ~59: `interface Box { minX; maxX; minZ; maxZ; h }` (h = absolute top height).

## Change
- src/flora/grid.ts:
  - createPlantStore(seeds, cell = 4): n = seeds.length. cx/cz/r/kind copied from each seed (cx, cz, r, kind). state all
    0 (STANDING), t and wait 0, active zeros, activeAt filled with -1, activeCount 0, seeds kept as given.
    Grid: if n === 0 then ox = oz = 0, nx = nz = 1, maxR = 0, cellStart = new Int32Array(2), cellItems = new Int32Array(0).
    Else ox = min cx, oz = min cz, nx = floor((max cx - ox) / cell) + 1, nz likewise, maxR = max r. Counting sort by the
    cell of (cx, cz): c = iz * nx + ix; cellStart has length nx * nz + 1 (prefix sums), cellItems length n.
  - queryCircle(s, x, z, r, out): cells from floor((x - r - s.maxR - s.ox) / s.cell) to floor((x + r + s.maxR - s.ox) / s.cell),
    clamped to [0, nx - 1] (same for z); return 0 at once when the range lies wholly outside the grid. A plant j is a hit
    when (cx[j] - x)^2 + (cz[j] - z)^2 < (r + s.r[j])^2. Write hits into out[0..], stop and return when out is full.
    Return the hit count. No allocation of any kind.
  - nearestPlant(s, x, z, maxR): the index with the smallest centre distance <= maxR, or -1 (may use the same cell walk).
- src/flora/extract.ts:
  - plantBoxMatch(b, s): true when ALL of:
    the box centre ((minX+maxX)/2, (minZ+maxZ)/2) is within 0.35 m of (s.cx, s.cz) OR of (s.x, s.z);
    the box half sizes are <= s.hw + 0.3 (x) and <= s.hd + 0.3 (z);
    the box top b.h is <= s.y + s.h + 0.6 and >= s.y - 0.5.
  - extractPlantBoxes(boxes, seeds): file seeds in a temporary Map keyed by 8 m cell of (cx, cz) (load-time code, may
    allocate), then for each box test plantBoxMatch against seeds in the 3x3 cells around the box centre; compact
    `boxes` in place keeping the order of the boxes that do not match (write index, then boxes.length = kept). Return
    how many were removed. The array object must stay the same (other systems hold a reference to it).
- src/flora/grid.test.ts (new): seeds via seedOf({ id: 'flower-bed', x, y: 0, z, yaw: 0, scale: 1 }) and other mowable
  ids ('fern-clump', 'barrel-cactus', 'boxwood-ball'). Tests: 400 seeds at seeded pseudo-random spots in a 300 m square
  (write a tiny LCG; no Math.random) compared with a brute-force overlap check for 200 random query circles (same sets);
  out capacity respected (out of length 2 returns 2 when more hit); empty store returns 0; a query far outside the grid
  returns 0; nearestPlant finds the right one and -1 past maxR.
- src/flora/extract.test.ts (new): a seed's own collider (a box built from its footprint: cx +- hw, cz +- hd, h = y + h)
  is removed; a hedgerow-sized box (4 m long) at the same centre is kept; a tree trunk box (1 m square, top y + 6) at
  the same centre is kept; a box 2 m away is kept; the order of kept boxes is unchanged; the same array object is
  returned-to (identity) and the return value is the removed count.

## Contract
```ts
export function createPlantStore(seeds: readonly PlantSeed[], cell = 4): PlantStore;
export function queryCircle(s: PlantStore, x: number, z: number, r: number, out: Int32Array): number;
export function nearestPlant(s: PlantStore, x: number, z: number, maxR: number): number;
export function plantBoxMatch(b: Box, s: PlantSeed): boolean;
export function extractPlantBoxes(boxes: Box[], seeds: readonly PlantSeed[]): number;
```
Keep exactly these signatures (other workers compile against them now).

## Done when
- cd games/gnome-theft-auto && npx vitest run src/flora/grid.test.ts src/flora/extract.test.ts passes
- npx tsc --noEmit -p games/gnome-theft-auto shows no error in src/flora/ (errors in other folders belong to other workers)

## Out of scope
Every other file, including src/flora/types.ts, kinds.ts, harvest.ts, state.ts, render.ts and anything outside src/flora/.
~~~~

~~~~text
Epic: 1 (mowable plant parts), issue 1B: mow / regrow state machine
Depends on: none

## Environment
Repo C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn, game games/gnome-theft-auto (TypeScript, vitest).
In Git Bash, if node is not found: export PATH="/c/Program Files/nodejs:$PATH". Other workers edit other files in
src/flora/ at the same time (grid.ts is still a stub while you work): touch only the files listed under Change. Do not
commit, stash, switch branches or start servers. These functions run every frame: no allocation inside them.

## Goal
src/flora/state.ts: pure functions that cut a plant, step cut plants through their wait and a staged regrowth, and give
the drawn height scale.

## Read first
- games/gnome-theft-auto/src/flora/types.ts: PlantStore (state, t, wait, active, activeAt, activeCount), STANDING, CUT, REGROWING.
- games/gnome-theft-auto/src/flora/kinds.ts: FLORA (stubbleY 0.14, regrowSeconds 4, regrowAwayM 30) and PLANT_KINDS (regrow [min, max] per kind).
- games/gnome-theft-auto/src/flora/state.ts: the stub you replace (keep the signatures).

## Change
- src/flora/state.ts:
  - mowPlant(s, i, rnd): if s.state[i] === CUT return false. Else state = CUT, t = 0,
    wait = k.regrow[0] + (k.regrow[1] - k.regrow[0]) * rnd with k = PLANT_KINDS[s.kind[i]]; if activeAt[i] < 0 append i
    to the active list (active[activeCount] = i; activeAt[i] = activeCount; activeCount++). Return true.
  - regrowPlant(s, i): state = STANDING, t = 0, and remove i from the active list if it is in it (swap-remove: move the
    last active entry into i's slot, fix its activeAt, decrement activeCount, set activeAt[i] = -1; handle i being last).
  - stepPlants(s, dt, px, pz, changed): walk the active list from the end to the start (so swap-removal is safe). For
    each i: t[i] += dt. CUT: when t >= wait and (cx - px)^2 + (cz - pz)^2 >= FLORA.regrowAwayM^2, become REGROWING with
    t = 0 and record i in changed. REGROWING: record i in changed every frame; when t >= FLORA.regrowSeconds call
    regrowPlant(s, i) (STANDING, out of the list). Never write past changed.length (skip recording, keep stepping).
    Return the number recorded.
  - plantHeightScale(s, i): STANDING 1, CUT FLORA.stubbleY, REGROWING regrowCurve(min(1, t / FLORA.regrowSeconds)).
  - regrowCurve(f): clamp f to [0, 1]; three stages: g = (floor(3f) + smooth(frac(3f))) / 3 with smooth(u) = u*u*(3 - 2u)
    and g = 1 at f = 1; return FLORA.stubbleY + (1 - FLORA.stubbleY) * g. Monotonic non-decreasing, exactly stubbleY at
    0 and exactly 1 at 1.
- src/flora/state.test.ts (new): build stores by hand with a helper (do NOT use createPlantStore, another worker is
  writing it): fill every PlantStore field from types.ts for n plants (seeds can be an empty-cast array `[] as never`,
  cx/cz from given points, kind = index of 'flower-bed' via plantKindIndex from kinds.ts, activeAt filled with -1, grid
  fields 0/1/empty). Tests: mow -> CUT, active list holds it, second mow returns false; wait picked inside the kind's
  range for rnd 0 and 0.999; with the player 100 m away a cut plant becomes REGROWING after its wait and STANDING
  after a further 4 s, and is then out of the active list; with the player 5 m away it stays CUT forever (step 1000 s);
  regrowPlant on a middle element keeps the active list consistent (activeAt of the moved one); regrowCurve(0) =
  stubbleY, (1) = 1, monotonic over 101 samples; plantHeightScale for each state; changed never overflows (length 1
  with 3 regrowing plants returns 1 and all three still progress).

## Contract
```ts
export function mowPlant(s: PlantStore, i: number, rnd: number): boolean;
export function regrowPlant(s: PlantStore, i: number): void;
export function stepPlants(s: PlantStore, dt: number, px: number, pz: number, changed: Int32Array): number;
export function plantHeightScale(s: PlantStore, i: number): number;
export function regrowCurve(f: number): number;
```

## Done when
- cd games/gnome-theft-auto && npx vitest run src/flora/state.test.ts passes
- npx tsc --noEmit -p games/gnome-theft-auto shows no error in src/flora/state*.ts

## Out of scope
Every other file (types.ts, kinds.ts and grid.ts are owned by others or by the planner).
~~~~

~~~~text
Epic: 1 (mowable plant parts), issue 1C: instanced plant rendering
Depends on: none

## Environment
Repo C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn, game games/gnome-theft-auto (three.js 0.187, TypeScript,
vitest). In Git Bash, if node is not found: export PATH="/c/Program Files/nodejs:$PATH". Other workers edit other files
in src/flora/ at the same time (grid.ts is still a stub): touch only the files listed under Change. Do not commit,
stash, switch branches or start servers. The game has frame-rate problems: pose() runs when a plant is mowed and for
regrowing plants every frame, so it must not allocate (module-level scratch Matrix4/Vector3/Quaternion/Euler only).

## Goal
src/flora/render.ts draws every plant of a PlantStore with InstancedMeshes, split per 64 m cell and registered with the
culler, and can re-pose one plant (height scale + lean) by rewriting only its instance.

## Read first
- games/gnome-theft-auto/src/flora/types.ts: PlantStore (count, seeds), PlantSeed (p = the prefab placement with id, tint,
  trim; x, y, z, yaw, scale).
- games/gnome-theft-auto/src/flora/render.ts: the stub you replace (keep the exported interface and signature).
- packages/prefabs/src/instances.ts: how a prefab becomes InstancedMeshes (buildPrefab, proto.updateMatrixWorld,
  one InstancedMesh per mesh part, part matrix = mesh.matrixWorld). Copy the idea; do not call buildPrefabInstances
  (you need to keep each part's matrix to re-pose one instance later).
- games/gnome-theft-auto/src/cull.ts lines 1-35 (header) and registerCull: register each cell group with
  `registerCull(group, 'prop', { owned: true })` after its meshes are filled.
- packages/prefabs/src/types.ts: BuildOptions (tint, trim types).

## Change
- src/flora/render.ts, buildPlantRender(store, { cell = 64 } = {}):
  - Variant key per plant: `${p.id}|${p.tint ?? ''}|${p.trim ?? ''}` (p = store.seeds[i].p). Group key = variant key +
    `|${Math.floor(seed.x / cell)},${Math.floor(seed.z / cell)}`.
  - One prototype per variant: buildPrefab(p.id, { tint: p.tint, trim: p.trim, lights: false }), updateMatrixWorld(true);
    parts = every Mesh in it with { geometry, material, matrix: mesh.matrixWorld.clone(), castShadow, receiveShadow }.
    Prefab geometry is a shared cache: never dispose it.
  - Per group: a THREE.Group (name `flora:<group key>`) holding one InstancedMesh(geometry, material, plantsInGroup)
    per part (castShadow/receiveShadow from the part). Remember for each plant i its group index and slot
    (Int32Arrays of store.count). Fill every instance with the standing pose (height scale 1, no lean), then per mesh:
    instanceMatrix.clearUpdateRanges(); instanceMatrix.needsUpdate = true; computeBoundingSphere(); computeBoundingBox().
  - root = new THREE.Group(), name 'flora', root.userData.cullCells = true; add every group, then registerCull each
    group as 'prop' with { owned: true } (import registerCull from '../cull').
  - pose(i, sy, leanX = 0, leanZ = 0): M = compose(position (seed.x, seed.y, seed.z), quaternion qLean * qYaw,
    scale (seed.scale, seed.scale * sy, seed.scale)) where qLean = from Euler(leanX, 0, leanZ) and qYaw = rotation of
    seed.yaw about +Y. For each part j of the plant's group: tmp = M * part.matrix; mesh.setMatrixAt(slot, tmp);
    mesh.instanceMatrix.addUpdateRange(slot * 16, 16); mesh.instanceMatrix.needsUpdate = true. No allocation.
  - meshCount(): total InstancedMeshes. dispose(): remove root from its parent and call dispose() on each InstancedMesh.
- src/flora/render.test.ts (new): build seeds with seedOf from ./harvest ({ id: 'flower-bed', x: 10, y: 0, z: 10, yaw: 0.5,
  scale: 1 }, another flower-bed at (20, 12) in the same 64 m cell, a 'boxwood-ball' at (300, 300)); make a PlantStore by
  hand (fill every field of PlantStore from types.ts; createPlantStore is being written by another worker). Tests:
  root.userData.cullCells is true; meshCount() >= 2 (two variants/cells); every InstancedMesh count equals its plants;
  after pose(0, 0.5) the instance's matrix element [5] (getMatrixAt -> elements[5]) is half of what it was after
  pose(0, 1) (lean 0); pose adds an update range starting at slot * 16; pose(0, 1, 0.3, 0) differs from pose(0, 1).

## Contract
```ts
export interface PlantRender {
  root: THREE.Group;
  pose(i: number, sy: number, leanX?: number, leanZ?: number): void;
  meshCount(): number;
  dispose(): void;
}
export function buildPlantRender(store: PlantStore, opts?: { cell?: number }): PlantRender;
```

## Done when
- cd games/gnome-theft-auto && npx vitest run src/flora/render.test.ts passes
- npx tsc --noEmit -p games/gnome-theft-auto shows no error in src/flora/render*.ts

## Out of scope
Every other file. Do not edit src/cull.ts or packages/prefabs.
~~~~

~~~~text
Epic: 1 (mowable plant parts), issue 1D: clippings particles and mow sounds
Depends on: none

## Environment
Repo C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn, game games/gnome-theft-auto (three.js 0.187, TypeScript,
vitest). In Git Bash, if node is not found: export PATH="/c/Program Files/nodejs:$PATH". Other workers edit other files
in src/flora/ at the same time: touch only the files listed under Change. Do not commit, stash, switch branches or start
servers. Frame-rate matters: update() runs every frame and burst() on every mow: no allocation in either (typed arrays and
module-level scratch objects only).

## Goal
src/flora/clippings.ts: one pooled InstancedMesh of leaf clippings thrown up when a plant is mowed. src/flora/sounds.ts:
four short procedural sounds registered on the world sound bus.

## Read first
- games/gnome-theft-auto/src/flora/clippings.ts and sounds.ts: the stubs you replace (keep exports and signatures).
- games/gnome-theft-auto/src/fishing/sounds.ts: how a module writes Recipe functions with burst/tone and registers them.
- games/gnome-theft-auto/src/sound/synth.ts: burst(), tone() signatures. games/gnome-theft-auto/src/sound/bus.ts:
  registerSound(id, recipe), hasSound(id). games/gnome-theft-auto/src/sound/ids.ts: Recipe, SoundInfo.

## Change
- src/flora/clippings.ts, createClippings(scene, max = 120):
  - InstancedMesh(new BoxGeometry(0.09, 0.015, 0.06), new MeshLambertMaterial({ color: 0xffffff }), max);
    frustumCulled = false; castShadow = false; receiveShadow = false; name 'flora-clippings'; every instance starts as a
    zero-scale matrix (hidden); setColorAt(0, white) once so instanceColor exists; scene.add(object).
  - State in Float32Arrays of length max: px, py, pz, vx, vy, vz, floorY, life, spin; a ring index `next`; alive count.
  - burst(x, y, z, color, count, spread): `y` is the ground under the plant. For each of `count` (at most max) take slot
    next (wrap), position x/z jittered within +-spread, height y + 0.15 + random 0..0.35, velocity radial 1..3 m/s,
    vy 2..4, floorY = y, life 0.9..1.4 s, spin 0..8;
    setColorAt(slot, scratch colour = color with a small random lightness change via offsetHSL(0, 0, +-0.06));
    instanceColor.needsUpdate = true. Math.random is fine (cosmetic).
  - update(dt): if nothing alive, return at once. For alive slots: vy -= 9.8 dt; vx, vz *= (1 - 1.5 dt); move; when py
    <= floorY + 0.01: py = floorY + 0.01, vx = vz = vy = 0 (it lies there); life -= dt; dead -> zero-scale matrix. Alive
    matrix = compose(position, quaternion from Euler(spin*t, spin*t*0.7, 0) (keep an angle per slot), scale 1). Set
    instanceMatrix.needsUpdate only when something changed this frame.
- src/flora/sounds.ts: RECIPES for 'mow-snip' (a quick bright snip: two 15-25 ms highpass/bandpass noise bursts ~3-5 kHz,
  0.08 s total), 'mow-chop' (a woody chop: a 40 ms bandpass noise burst ~1.2 kHz plus a short 180->120 Hz sine thud,
  0.15 s), 'mow-thunk' (a leafy shrub hit: a 0.12 s sine thud 110->70 Hz plus a 0.25 s lowpass noise rustle), 'mow-rustle'
  (a soft 0.3 s highpass noise swish at low level). Use info.rand for +-10% pitch and info.param for level like
  fishing/sounds.ts. Peaks never above 0.25. Each recipe returns its duration. registerMowSounds(): for each id, if
  !hasSound(id) registerSound(id, recipe).
- src/flora/clippings.test.ts (new): createClippings(new THREE.Scene(), 16); burst 5 -> after update(0.05) some instance
  matrix has non-zero scale; after update steps totalling 3 s every instance is zero-scale; bursting 40 into a pool of 16
  does not throw and leaves at most 16 alive; registerMowSounds() then hasSound('mow-snip') etc. are true for all four ids.

## Contract
```ts
export interface Clippings {
  object: THREE.InstancedMesh;
  burst(x: number, y: number, z: number, color: number, count: number, spread: number): void;
  update(dt: number): void;
}
export function createClippings(scene: THREE.Scene, max = 120): Clippings;
export const MOW_SOUND_IDS: readonly MowSoundId[]; // ['mow-snip', 'mow-chop', 'mow-thunk', 'mow-rustle']
export function registerMowSounds(): void;
```

## Done when
- cd games/gnome-theft-auto && npx vitest run src/flora/clippings.test.ts passes
- npx tsc --noEmit -p games/gnome-theft-auto shows no error in src/flora/clippings*.ts or sounds.ts

## Out of scope
Every other file. Do not edit src/fx.ts or anything in src/sound/.
~~~~

~~~~text
Epic: 1 (mowable plant parts), issue 1E: Mowed counter, save, achievements progress, Lawn Service bonus, HUD pill
Depends on: none

## Environment
Repo C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn, game games/gnome-theft-auto (TypeScript, vitest).
In Git Bash, if node is not found: export PATH="/c/Program Files/nodejs:$PATH". Other workers edit other files in
src/flora/ at the same time: touch only the files listed under Change. Do not commit, stash, switch branches or start
servers. record() runs on every mow and update() every frame: no allocation in them (no string building except the
rare toast, no new objects). Mobile by default: the HUD pill must fit a 390x844 portrait phone, sit below the safe-area
top, and never take touches (pointer-events: none). UI rule: append your own element to the `ui` element passed in;
never restyle or hide `ui` itself.

## Goal
src/flora/rewards.ts counts the player's mows into a saved total (per kind too), feeds two achievements in batches, pays
a small Lawn Service bonus, and saves; src/flora/tally.ts shows a small "✂ N mowed" pill for a moment after each mow.

## Read first
- games/gnome-theft-auto/src/flora/rewards.ts and tally.ts: the stubs you replace (keep every export and signature).
- games/gnome-theft-auto/src/flora/kinds.ts: FLORA.lawn ({ every: 10, pay: 3 }) and FLORA.achievements
  ({ shortBack: 'gta-short-back-and-sides', groundskeeper: 'gta-head-groundskeeper' }).
- games/gnome-theft-auto/src/saveHook.ts: call notifySaveChanged() right after writing the save.
- games/gnome-theft-auto/src/saveIO.ts: StorageLike (getItem, setItem, removeItem).
- games/gnome-theft-auto/src/fishing/fishSave.ts: an example of a small save module (parse defensively).

## Change
- src/flora/rewards.ts:
  - parseMowSave(raw): JSON.parse in try/catch; keep total and lawn only when finite numbers >= 0 (floored), byKind only
    entries whose values are finite numbers >= 0; anything else -> emptyMowSave().
  - mergeMowSave(a, b): parse both; total = max, lawn = max, byKind = per-key max over the union; return JSON.stringify.
  - createMowRewards(deps): storage = deps.storage !== undefined ? deps.storage : (typeof localStorage !== 'undefined' ?
    localStorage : null). Load the save from MOW_SAVE_KEY (try/catch).
    record(kindId, longGrass, onMower): total += 1; byKind[kindId] = (byKind[kindId] ?? 0) + 1; pending += 1;
    dirty = true; when total becomes 1 for the first time ever: deps.toast('Mowed! Plants grow back in a minute or
    two.', 3500). If longGrass && onMower: lawn += 1, run += 1; when run reaches FLORA.lawn.every: run = 0,
    deps.earn(FLORA.lawn.pay, 'Lawn Service'), deps.toast(`Lawn Service: +${FLORA.lawn.pay} Acorns`, 2500).
    update(dt): every 2 s, if pending > 0: deps.increment(FLORA.achievements.shortBack, pending) and
    deps.increment(FLORA.achievements.groundskeeper, pending), pending = 0. When dirty and at least 5 s since the last
    write: storage.setItem(MOW_SAVE_KEY, JSON.stringify(save)) in try/catch, notifySaveChanged(), dirty = false.
    save(): the live save object. reset(): save = emptyMowSave(), pending = 0, run = 0, write at once, notifySaveChanged().
- src/flora/tally.ts, createMowTally(ui): a div (id 'gta-mow-tally') appended to a wrapper div appended to `ui`; style
  (inline or one <style> element added once): position fixed; top calc(env(safe-area-inset-top, 0px) + 56px); left 50%;
  transform translateX(-50%); pointer-events none; z-index 30; font 700 13px system-ui, sans-serif; color #eaf7c9;
  background rgba(24, 40, 14, .72); border-radius 12px; padding 4px 10px; opacity 0; transition opacity .25s.
  show(total): set text `✂ ${total} mowed` only when total changed; opacity 1; timer = 2.5 s. update(dt): count the timer
  down; at 0 set opacity 0 (once). dispose(): remove the wrapper.
- src/flora/rewards.test.ts (new): an in-memory StorageLike (a Map). Tests: 10 records of long grass on a mower -> earn
  called once with (3, 'Lawn Service'); not on a mower -> never; first record toasts once, later records do not;
  update(2.1) after 7 records -> increment('gta-short-back-and-sides', 7) and increment('gta-head-groundskeeper', 7) once
  each; nothing written before 5 s, written after update steps totalling 5.1 s and parseMowSave of it has total 7 and
  byKind; a new createMowRewards with the same storage loads total 7; mergeMowSave takes per-field maxima;
  parseMowSave('garbage') and parseMowSave(null) give the empty save; reset() zeroes and writes.

## Contract
```ts
export const MOW_SAVE_KEY = 'gta-mowing-v1';
export interface MowSave { v: 1; total: number; lawn: number; byKind: Record<string, number> }
export function emptyMowSave(): MowSave;
export function parseMowSave(raw: string | null): MowSave;
export function mergeMowSave(a: string, b: string): string;
export interface MowRewardsDeps { increment(id: string, by?: number): void; earn(amount: number, reason?: string): void; toast(text: string, ms?: number): void; storage?: StorageLike | null }
export interface MowRewards { record(kindId: string, longGrass: boolean, onMower: boolean): void; update(dt: number): void; save(): Readonly<MowSave>; reset(): void }
export function createMowRewards(deps: MowRewardsDeps): MowRewards;
export interface MowTally { show(total: number): void; update(dt: number): void; dispose(): void }
export function createMowTally(ui: HTMLElement): MowTally;
```

## Done when
- cd games/gnome-theft-auto && npx vitest run src/flora/rewards.test.ts passes
- npx tsc --noEmit -p games/gnome-theft-auto shows no error in src/flora/rewards*.ts or tally.ts

## Out of scope
Every other file. Do not edit saveIO.ts or cloudSave.ts (the planner adds the key and the merge).
~~~~

~~~~text
Epic: 1 (mowable plant parts), issue 1F: two reward prefabs and two achievements
Depends on: none

## Environment
Repo C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn. Shared packages packages/prefabs and packages/achievements.
In Git Bash, if node is not found: export PATH="/c/Program Files/nodejs:$PATH". Other workers (and other planners) edit
other files at the same time, and other planners may also add lines to packages/prefabs/src/catalog/index.ts and
packages/achievements/src/catalog.ts: make small insertions with the Edit tool exactly where described, re-read the file
right before editing, never rewrite or reformat these files. Do not commit, stash, switch branches or start servers.
Lore rule: before writing names or item text, run `npm run lore -- find clippings` and `npm run lore -- find mow` from the
repo root and read docs/lore/canon.md and docs/lore/entries/fescue/clippings.md; follow them. If you add or change
anything under docs/lore/, `npm run lore` must pass.

## Goal
Two new wearable prefabs (one per achievement, each used by no other achievement) and two Gnome Theft Auto achievements
counting the player's mows.

## Read first
- packages/achievements/README.md (rules for rewards, exclusive, target).
- packages/prefabs/src/catalog/gta-odd-rides.ts: the 'sunday-driver-cap' entry (a wear-head PrefabDef: category, uses,
  tags, emoji, tint, about, examine lines, parts). packages/prefabs/src/catalog/index.ts: how GTA_ODD_RIDES is imported and spread.
- docs/roadmaps/prefab-library/_common.md: prefab rules.
- packages/achievements/src/catalog.ts around the entry with id 'gta-bits-everywhere' (format of GTA entries).
- docs/cosmetics.md: if it lists rewards, add rows for the two new ones.

## Change
- packages/prefabs/src/catalog/gta-mowing.ts (new): `export const GTA_MOWING: PrefabDef[]` with
  - 'clippings-crown': name 'Clippings Crown', category 'armor', uses ['wear-head'], tags incl. 'gta', 'mowing',
    'grass', 'crown'; a ring of cut grass blades and a few petals worn like a laurel (a 'ring' or torus band of green plus
    8-12 small thin blades sticking up and out, two or three pink/yellow petal dots). About 0.3 m across, sits on a
    gnome's hat line like the sunday-driver-cap. about + 4-5 examine lines (garden-scale jokes in the GTA voice).
  - 'grass-catcher-pack': name 'Grass-Catcher Pack', category 'armor', uses ['wear-back'], tags incl. 'gta', 'mowing',
    'bag', 'back'; a mower's grass-catcher bag worn as a backpack: a boxy canvas body (tint), a rigid frame rim on top,
    two straps, a little clippings heap peeking out of the top. About 0.35 x 0.3 x 0.2 m. about + 4-5 examine lines.
  Use only part shapes and colour names that other catalog files already use (check gta-odd-rides.ts and the PrefabDef
  types in packages/prefabs/src/types.ts).
- packages/prefabs/src/catalog/index.ts: import { GTA_MOWING } from './gta-mowing' next to the GTA_ODD_RIDES import, and
  spread ...GTA_MOWING right after ...GTA_ODD_RIDES.
- packages/achievements/src/catalog.ts: insert right after the 'gta-bits-everywhere' entry:
  { id: 'gta-short-back-and-sides', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Short Back and Sides',
    description: 'Mow 100 bushes, beds and patches of long grass with a vehicle.', target: 100,
    reward: { slot: 'head', prefabId: 'clippings-crown', label: 'Clippings Crown' } },
  { id: 'gta-head-groundskeeper', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Head Groundskeeper',
    description: 'Mow 1,000 plants. They grow back; you keep going.', target: 1000,
    reward: { slot: 'back', prefabId: 'grass-catcher-pack', label: 'Grass-Catcher Pack', exclusive: true } },
  (format it like the neighbouring entries; keep these ids and prefab ids exactly.)

## Contract
Achievement ids 'gta-short-back-and-sides' (target 100) and 'gta-head-groundskeeper' (target 1000); prefab ids
'clippings-crown' (wear-head) and 'grass-catcher-pack' (wear-back). The game calls increment(id, n) on both.

## Done when
- npm test -w packages/prefabs passes
- npm test -w packages/achievements passes
- (if you touched docs/lore/) npm run lore passes

## Out of scope
Everything under games/. Any other catalog entry.
~~~~

## Epic 2 issues

~~~~text
Epic: 2 (runtime), issue 2A: createFlora runtime and the trainer section
Depends on: Epic 1 (landed)

## Environment
Repo C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn, game games/gnome-theft-auto (three.js, TypeScript, vitest).
In Git Bash, if node is not found: export PATH="/c/Program Files/nodejs:$PATH". Another worker writes
src/flora/world.test.ts and kinds.test.ts at the same time; other planners edit other parts of the game: touch only the
files listed under Change. Do not commit, stash, switch branches or start servers. PERFORMANCE IS CRITICAL: update() runs
every frame over ~40 vehicles; it must not allocate (no closures, arrays, objects, strings, for..of over Maps inside
the per-frame path; use index loops; scratch objects at module or closure level, created once).

## Goal
src/flora/runtime.ts: createFlora turns the harvested plants into mowable, regrowing instanced plants: vehicles mow them,
the player on foot brushes them aside, the player's mows count; src/flora/trainer.ts adds a "Mowing" trainer tab.

## Read first
- games/gnome-theft-auto/src/flora/types.ts, kinds.ts (FLORA, MOWER_KINDS, PLANT_KINDS), harvest.ts (drainHarvest, setPlantSink).
- games/gnome-theft-auto/src/flora/grid.ts (createPlantStore, queryCircle, nearestPlant), extract.ts (extractPlantBoxes),
  state.ts (mowPlant, regrowPlant, stepPlants, plantHeightScale), render.ts (buildPlantRender, PlantRender.pose),
  clippings.ts (createClippings), sounds.ts (registerMowSounds), rewards.ts (createMowRewards), tally.ts (createMowTally).
- games/gnome-theft-auto/src/trainer/registry.ts (registerTrainerSection, registerTrainerSpawnable), trainer/types.ts
  (TrainerCtx has player; TrainerSpot has x, z), trainer/ui.ts (heading, note, grid, button, confirmButton, status),
  trainer/mark.ts (markTrainerModified).
- games/gnome-theft-auto/src/types.ts: Vehicle (x, y, z, speed, driver, kind, exploded?, spec.radius, spec.boat?),
  Player (x, z, vehicle, ragdolling), World (boxes).

## Change
- src/flora/runtime.ts (new):
```ts
export interface FloraDeps {
  scene: THREE.Scene; world: World; ui: HTMLElement;
  shake(amount: number): void;                 // chase.shake
  increment(id: string, by?: number): void;    // achievements
  earn(amount: number, reason?: string): void; // economy
  toast(text: string, ms?: number): void;      // hud.toast
}
export interface FloraStats { plants: number; standing: number; cut: number; regrowing: number; mowed: number; lawn: number; byKind: Record<string, number> }
export interface Flora {
  /** Per frame. `remote`: other players' vehicles (mow locally from their poses; never slowed, never counted). */
  update(dt: number, vehicles: readonly Vehicle[], player: Player, remote?: readonly Vehicle[]): void;
  /** Trainer: cut every standing plant within r of (x, z) (not counted). Returns how many. */
  mowAllNear(x: number, z: number, r: number): number;
  /** Trainer: every plant standing again at once. Returns how many changed. */
  regrowAll(): number;
  stats(): FloraStats;
  /** Nearest plant (any state) within maxR (default 50): contact centre, radius, prefab id, state. For scripted checks. */
  nearest(x: number, z: number, maxR?: number): { x: number; z: number; r: number; id: string; state: number } | null;
  /** Trainer: zero the Mowed counter. */
  resetCounter(): void;
}
export function createFlora(deps: FloraDeps): Flora;
```
  Behaviour:
  - Layers: a layer = { store, render, changed: Int32Array(store.count) }. createFlora: seeds = drainHarvest();
    extractPlantBoxes(deps.world.boxes, seeds); add a layer (createPlantStore(seeds), buildPlantRender(store),
    deps.scene.add(render.root)) unless seeds is empty. setPlantSink((more) => { extractPlantBoxes(world.boxes, more);
    add a layer }) so plants handed over later work too. registerMowSounds(); clippings = createClippings(deps.scene);
    rewards = createMowRewards({ increment, earn, toast } from deps); tally = createMowTally(deps.ui);
    registerFloraTrainer(flora) (trainer.ts).
  - update, vehicles: for each vehicle (local list, then remote): skip when exploded, spec.boat, or
    aboveGround(v.x, v.y, v.z) > FLORA.maxMowAboveGround (import aboveGround from '../terrain'). Keep last position per
    vehicle in a WeakMap<Vehicle, Float64Array> ([x, z, soundCooldown]); first sight: store and skip. moved =
    hypot(dx, dz); skip when moved / dt < FLORA.minMowSpeed or moved > 20 (teleport). Query each layer with
    queryCircle(store, v.x, v.z, v.spec.radius, hits) (hits = one Int32Array(64) made once). For each hit i where
    mowPlant(store, i, Math.random()) is true: render.pose(i, FLORA.stubbleY); kind = PLANT_KINDS[store.kind[i]];
    seed = store.seeds[i]; clippings.burst(seed.cx, seed.y, seed.cz, kind.clip, FLORA.clipCount[kind.size],
    max(0.3, store.r[i] * 0.6)); sound: when the vehicle's cooldown <= 0 and fewer than FLORA.soundsPerFrame sounds this
    frame, playAt(kind.sound, scratchPos) (import playAt from '../sound/bus'; scratchPos = one reused { x, z } object),
    cooldown = FLORA.soundGap. Local vehicles only: v.speed *= kind.slow. Player-driven local vehicle only
    (v.driver === 'player'): kind.size === 'big' -> deps.shake(FLORA.bigShake); rewards.record(kind.id, kind.longGrass,
    MOWER_KINDS.includes(v.kind)); tally.show(rewards.save().total). Count cooldown down by dt each frame.
  - update, gnome on foot (player.vehicle null and not player.ragdolling): query each layer at (player.x, player.z,
    FLORA.brushRadius). For each STANDING plant hit that is not already brushed, take a free slot of 8 preallocated brush
    slots { layer, i, lx, lz, t } with lx = dz/d * FLORA.brushLean, lz = -dx/d * FLORA.brushLean where (dx, dz) = plant
    centre - player (d = length; use (1, 0) when d < 1e-3). Play 'mow-rustle' at the plant at most every 0.5 s. Every
    frame for each used slot: if the plant is no longer STANDING free the slot; if the player is still within
    store.r[i] + FLORA.brushRadius keep t = 0, else t += dt; a = 1 - t / FLORA.brushBack; when a <= 0 pose(i, 1) and free
    the slot, else pose(i, 1, lx * a, lz * a).
  - update, regrowth: for each layer n = stepPlants(store, dt, player.x, player.z, changed); for k < n pose(changed[k],
    plantHeightScale(store, changed[k])). Then clippings.update(dt); rewards.update(dt); tally.update(dt).
  - mowAllNear: per layer, a temporary Int32Array(store.count) for queryCircle (allowed: trainer only); mowPlant + pose
    stubble; no rewards. regrowAll: per layer, walk active from the end: regrowPlant + pose(i, 1). stats(): count states
    over all layers; mowed/lawn/byKind from rewards.save(). nearest: nearestPlant per layer, best overall. resetCounter:
    rewards.reset().
- src/flora/trainer.ts (new): `export function registerFloraTrainer(flora: Flora): void` (import type Flora from
  './runtime'). registerTrainerSection({ id: 'mowing', label: 'Mowing', order: 47, build(el, ctx) {...} }): a status line,
  heading 'Mowing', a note with plants / standing / cut / regrowing, a note with "Mowed by you: N (Lawn Service cuts: M)",
  a note listing byKind counts, and a grid of buttons: 'Mow all within 40 m' (flora.mowAllNear(ctx.player.x,
  ctx.player.z, 40)), 'Mow all within 200 m', 'Regrow everything' (flora.regrowAll()), and confirmButton 'Reset Mowed
  counter' (flora.resetCounter(); markTrainerModified('mowed counter')). Each reports through the status line.
  registerTrainerSpawnable('Plants', 'mow-here', 'Mow 15 m here', (at) => `Mowed ${flora.mowAllNear(at.x, at.z, 15)}`)
  and registerTrainerSpawnable('Plants', 'regrow-all', 'Regrow all plants', () => `Regrew ${flora.regrowAll()}`).
- src/flora/runtime.test.ts (new): installFakeDom() from '../testing/fakeDom' first. beginPlantHarvest();
  addMowablePlants([{ id: 'flower-bed', x: 0, y: heightAt(0, 10), z: 10, yaw: 0, scale: 1 }, { id: 'boxwood-ball', x: 0,
  y: heightAt(0, 30), z: 30, yaw: 0, scale: 1 }]) (from './harvest', heightAt from '../terrain'); world = { boxes: [the
  flower-bed's own collider box, a far wall box] } as unknown as World; createFlora with spy deps. A fake vehicle object
  ({ x: 0, y: heightAt(0, 0), z: 0, yaw: 0, speed: 20, driver: 'player', kind: 'ride-on', exploded: false, spec: { radius: 1 } }
  cast as unknown as Vehicle) driven +z 0.4 m per update(1/60) (keep y on the ground) to z = 40; player = { x: 0, z: -100,
  vehicle: <that vehicle>, ragdolling: false } cast. Tests: the collider box was removed and the wall kept; both plants
  end CUT (flora.nearest(...).state === 1); v.speed dropped below 20 after the boxwood (big, slow 0.86); shake called;
  stats().mowed === 2; after rewards' 2 s flush increment was called with 'gta-short-back-and-sides'; with the player
  moved 200 m away, update(1) x 130 then update(1) x 5 -> both STANDING again; with the player standing 5 m from a cut
  plant it stays CUT; a vehicle with driver 'npc' mows but stats().mowed does not grow; a remote vehicle mows and its
  speed is unchanged; regrowAll() and mowAllNear() return counts; a parked vehicle (not moving) mows nothing.

## Done when
- cd games/gnome-theft-auto && npx vitest run src/flora/ passes (all flora tests)
- npx tsc --noEmit -p games/gnome-theft-auto shows no error in src/flora/

## Out of scope
app.ts, net.ts, cull.ts and every file outside src/flora/ (the planner wires the game). Do not change the other
src/flora/ modules except to fix a real bug you can show with a failing test (say so in your report).
~~~~

~~~~text
Epic: 2 (runtime), issue 2B: world classification test and plant table test
Depends on: Epic 1 (landed)

## Environment
Repo C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn, game games/gnome-theft-auto (TypeScript, vitest).
In Git Bash, if node is not found: export PATH="/c/Program Files/nodejs:$PATH". Another worker writes
src/flora/runtime.ts and trainer.ts at the same time; other planners edit other files: touch only the files listed
under Change. Do not commit, stash, switch branches or start servers.

## Goal
Tests that fail if a mowable plant kind keeps a blocking collider in the built world, or if the plant table is wrong.

## Read first
- games/gnome-theft-auto/src/layout.golden.test.ts: how a test builds the whole world (installFakeDom, dynamic imports,
  buildWorld(scene, null as unknown as THREE.WebGLRenderer)) and its 120 s timeout.
- games/gnome-theft-auto/src/flora/harvest.ts (beginPlantHarvest, drainHarvest), extract.ts (extractPlantBoxes),
  kinds.ts (PLANT_KINDS, FLORA, mowableAt), types.ts (PlantSeed).

## Change
- src/flora/world.test.ts (new), one world build shared by the tests (beforeAll, timeout 120 s): installFakeDom();
  dynamic-import './harvest', './extract', '../world'; beginPlantHarvest(); world = buildWorld(...); seeds = drainHarvest();
  before = world.boxes.length; removed = extractPlantBoxes(world.boxes, seeds). Tests:
  - seeds.length > 1000; counts per prefab id include flower-bed, barrel-cactus, fern-clump, wheat-patch, boxwood-ball,
    round-bush, ornamental-grass (each > 0).
  - every seed's kind is mowable and seed.h <= FLORA.maxMowHeight; no seed is a hedgerow, hedge-arch, topiary-cone,
    tall-cactus or tree id.
  - 200 <= removed <= 260 (about 224 plant colliders today: 116 barrel cacti, 28 ferns, 66 flower beds, 12 wildflower
    patches, 2 reed beds) and world.boxes.length === before - removed.
  - THE GUARD: no box left in world.boxes blocks a mowable plant: for every seed there is no remaining box whose rect
    contains (seed.cx, seed.cz) and whose top b.h < seed.y + 2.5. On failure print the first few offending seed ids and
    positions (so a new builder that gives a mowable plant a collider is caught).
- src/flora/kinds.test.ts (new): every PLANT_KINDS id is unique and getPrefab(id) (from '@lawn/prefabs') exists; every
  mowable row has 0.8 <= slow <= 1, 30 <= regrow[0] <= regrow[1] <= 300, size in tiny/small/big; mowableAt('flower-bed',
  0.6) true, mowableAt('flower-bed', 2) false, mowableAt('hedgerow', 1) false, mowableAt('not-a-plant', 0.1) false;
  every big mowable row has slow < 1 and every tiny row slow === 1.

## Done when
- cd games/gnome-theft-auto && npx vitest run src/flora/world.test.ts src/flora/kinds.test.ts passes
- npx tsc --noEmit -p games/gnome-theft-auto shows no error in those files

## Out of scope
Every other file, including src/layout.golden.test.ts and src/data/layout.golden.json (must stay unchanged).
~~~~
