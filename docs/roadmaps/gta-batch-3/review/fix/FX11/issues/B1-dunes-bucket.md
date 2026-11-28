Epic: FX11 B (placement, parallel) · Issue B1: the giant bucket, the spade, marram grass and the dune fence (G3#5, D14 must)
Depends on: epic A (the prefabs and the dune terrain exist now) · Agent: Sonnet · Dev port 5541

(The Environment section the lead gave you applies.)

## Goal
Decision D14 (final, a must): "A `giant-bucket-rim` ... a rim arc about 40 m across breaking the sand behind the boardwalk, and its handle arching over the coast spur as a gateway. Add a giant spade in a dune. A dune band at z about 1060-1090 with a `marram-grass` tuft prefab and a weathered picket fence." Lore (`saltbucket-shore.md`): "a bucket-and-spade town built round a giant sunk Tall-One bucket ... past a line of dunes"; "the bucket's handle was seen above the sand once, in a dry year". The terrain dunes (gauss stamps) and the sand paint were done in epic A; you build what stands on them, in `src/coast/dunes.ts` (a stub: `buildDunes(scene, boxes)`, already called by `buildCoast`).

## Read first
- `games/gnome-theft-auto/src/coast/dunes.ts` (stub), `src/coast/config.ts` (`COAST.bucket` {x 0, z 1028, r 20, handleH 14}, `COAST.spade` {-46, 1074, yaw 0.5}, `COAST.dunes` {minZ 1056, maxZ 1094, minX -1000, maxX 1000, gapHalf 9}, the boardwalk rect z 1102..1132, the Spokewheel at (-260, 1100), the Saltcut near x 700-760).
- `games/gnome-theft-auto/src/data/levels/south-shore.level.json` `stamps` (the dune centres: world z = local z + 1150; use them to put grass on the crests and the fence along the dunes' foot) and `paths` (`coast-spur` road ends at world (0, 1060)).
- `packages/prefabs/src/catalog/gta-coast-town.ts`: `giant-bucket-rim-arc` (read its `about:` for the exact convention: a 120-degree arc whose centre of curvature is local (-1, 0, 0), radius 1, middle at local (0, y, 0); game scale 20), `giant-bucket-handle` (lugs at local x -1 and 1, apex about 0.7 high at x 0; scale 20), `giant-spade` (scale 8, blade-down), `marram-grass` (a tuft, scale 1.5-3), `dune-fence` (a 2.0 m weathered section along x; scale 2).
- `packages/prefabs/src/instances.ts` `buildPrefabInstances(id, matrices, { tints? })` (one InstancedMesh per part: use it for the many grass tufts and fence sections) and `packages/prefabs/src/batch.ts` `buildStaticPrefabs(placements)` (merges static prefabs into 1-3 draw calls).
- `games/gnome-theft-auto/src/cull.ts` (`registerCull(obj, 'prop' | 'landmark')`), `src/terrain.ts` (`heightAt(x, z)`), `src/water.ts` (`waterDepthAt`).

## Change: `src/coast/dunes.ts` (+ `src/coast/dunes.test.ts`)
1. The bucket rim: two `giant-bucket-rim-arc`s at scale `COAST.bucket.r` (20): the east arc with its origin at (bucket.x + r, bucket.z), yaw 0 (its centre of curvature lands on the bucket centre), the west arc at (bucket.x - r, bucket.z), yaw PI. The coast spur road (x -5..5) passes through the gaps north and south. Sit each arc so it breaks the sand: base y a little below the lowest ground along it (sample `heightAt` along the arc), so the rim shows about 1.5-2.5 m above the sand and both ends dive in. A box collider per arc segment section above 1 m (3-4 boxes per arc) so cars bump it.
2. The handle: `giant-bucket-handle` at (bucket.x, bucket.z), yaw 0, scale 20, standing on the ground (lugs on the arcs' middles at x +-20). It arches 14 m over the spur road: the town's gateway. Colliders only at the two feet. `registerCull(obj, 'landmark')` for the rim and handle (they are seen from far).
3. The spade: `giant-spade` at `COAST.spade`, scale 8, yaw from the spot, sunk a little into the dune, leaning (rotation.z about 0.12). One collider at its shaft.
4. Marram grass: 250-500 tufts on the dune band (instanced: `buildPrefabInstances('marram-grass', matrices)`, split into 4-6 groups by x so culling can drop far ones), denser on crests and the landward sides, sparse in saddles, none on the spur path (|x| < gapHalf), none on the boardwalk deck, the wheel site (x -300..-220, z 1060..1140), roads or water. Random scale 1.4-2.8 and yaw from a seeded RNG (deterministic). A few clumps on the sand round the boardwalk's north edge and the wheel too.
5. The dune fence: weathered `dune-fence` sections along the dunes' south foot (about z 1094-1098), in runs of 4-10 sections with gaps, each section slightly turned (+-6 deg) and some leaning, following the ground (`heightAt`), never across the spur path or the wheel's approach. Instanced or static-batched.
6. Optional if it helps: a sand path look along the spur gap (footprint decals on `flatLayer(..., LAYER.decal)`), and a few bleached posts.
7. Test (`dunes.test.ts`): `buildDunes(new THREE.Scene(), boxes)` runs without a DOM, pushes colliders, and no collider covers the spur path (x -5..5, z 1000..1102) or the boardwalk entrance (0, 1100). Export pure helpers (e.g. `marramSpots()`, `fenceSpots()`) and test none is in water, on the deck rect or within 9 m of x = 0 between z 1050 and 1102.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/coast` passes; `npx tsc --noEmit -p games/gnome-theft-auto` clean in your files.
- Shots (port 5541): `entr:0,985,0` (driving down the spur, the handle arching over the road: the gateway), `entr2:0,1040,0`, `bucketW:-60,1010,1.2`, `dunes:-120,1050,0.3`, `bwwest:-200,1096,1.4`, `wheel:-230,1060,-0.6`, and `entrP:0,1000,0 --size 390x844`. Compare the editors' `a01-entr.png`, `a04-bwwest.png`, `a05-wheel.png`. The bucket must read as a giant tin bucket sunk in the sand, the dunes as dunes with grass. Iterate on placement, height and density until it looks hand-made.
- `npm run zfight -- "http://localhost:5541/?at=0,1040,0"` (if it times out, say so).
- Perf: `node tools/gta-perf.mjs http://localhost:5541/ --cpu 4 --legs '[["dunes",[[-300,1075],[300,1075]]]]'` and report the frame times.

## Out of scope
Every other file, the terrain stamps (if a dune is badly placed, report it rather than editing the level file).
