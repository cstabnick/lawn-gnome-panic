Epic: 1 (World as level documents, flat parity)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, use absolute paths).
- Git Bash: if `node` is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first. Dependencies are installed.
- Two other workers are editing other files at the same time: `src/config.ts` and `src/quests/defs.ts` (one worker),
  `tools/level-editor` (another). Do not touch their files. If a type-check or test error is in a file you do not own,
  wait a minute and rerun; do not fix it.
- Do not commit, push or open a PR. Do not run `npm run build` (it writes `dist/`) or start a dev server.
- Repo rule: nothing laid flat may z-fight; you are not adding geometry, only moving where positions come from, so keep
  every mesh's material, layer and height exactly as it is.

## Goal
`src/biomes.ts` stops hard-coding the hand-placed world. It reads from the level documents (via `src/levels.ts`):
the reserved zones, every hand-placed prefab (props), the shootable barrels, the animated banners and windsock, the
setpiece anchors, the hand-placed walk points, and each region's scatter-generator seed. The procedural scatter code
stays as it is, run once per region with the seed from that region's document. `src/world.ts` gets its two seeds from
the Turfton document. The world must be exactly the same: the golden test proves it.

## Read first
- `games/gnome-theft-auto/src/levels.ts`: `REGION_IDS`, `REGIONS` (world coordinates), `markersOf(kind)`,
  `markerNum(m, ...path)`, `GENERATORS`, `LAYOUT.fenceEdge`, types `GtaProp`, `RegionId`, `WorldMarker`.
- `games/gnome-theft-auto/src/data/levels/mossy-wood.level.json`: what props and markers look like (`setpiece`
  markers carry `data.builder`; `reserve` markers carry `data.hw`, `data.hd`; `walk` markers have no data).
- `games/gnome-theft-auto/src/biomes.ts` (all of it; line numbers below are from the file as it is now).
- `games/gnome-theft-auto/src/world.ts` lines 609-611, 994-997 and 1043-1055.
- `games/gnome-theft-auto/src/layout.golden.test.ts`: the test that must pass.

## Why this works (so you do not "fix" it)
The old code drew every random number from one stream, `mulberry32(7)`, passed in as `rnd`. Each region document's
`base.seed` is the exact state of that stream at the moment its scatter section started in the old run, so
`mulberry32(base.seed)` continues the old sequence from there. Therefore: the hand-placed part must draw NO random
numbers any more (those draws are gone), and each scatter section must start a fresh `mulberry32(seed)` from its
region. The world must come out identical; never edit `src/data/layout.golden.json` and never set `UPDATE_GOLDEN`.

## Change: `games/gnome-theft-auto/src/biomes.ts`
1. Imports: add `import { mulberry32 } from '@lawn/level';` and
   `import { GENERATORS, LAYOUT, REGION_IDS, REGIONS, markerNum, markersOf, type GtaProp, type Region, type RegionId, type WorldMarker } from './levels';`
   (drop any you end up not using).
2. Signature: `export function buildBiomes(scene: THREE.Scene): BiomeBuild` (no `rnd` parameter). As the first line
   inside, declare the stream as a variable the helpers close over:
   ```ts
   const noRandom = (): number => { throw new Error('biomes: random numbers are only drawn inside a scatter generator'); };
   let rnd: () => number = noRandom;
   ```
   `uni`, `anywhere`, `village`, `park`, `scatter`, `tree` keep calling `rnd()` unchanged.
3. Reserved zones (lines 317-336): delete the `reserved.push(rectOf(-255, -60, 22, 22), ...)` call with its 17
   literal rectangles and put instead:
   `for (const m of markersOf('reserve')) reserved.push(rectOf(m.x, m.z, markerNum(m, 'hw'), markerNum(m, 'hd')));`
   Keep lines 308-316 (fort, airfield and apron zones) as they are.
4. Fort Sandpit (lines 341-410): keep the floor (341-348), the pad and its ring (391-402). In `wallRun`, delete the
   tile loop (`for (let i = 0; i < n; i++) { ... drop(...) }`) and the `n`/`yaw` locals; keep the `addBox(...)`. Delete
   the now-unused tile measuring locals (`tile`, `tileW`, `tileD`, `tileS`, `tileLongX`, `tileLen`). Delete the watch
   towers (379-383), the HQ tents and crates (384-390) and the banners (403-410): they are props now.
5. Airfield (lines 415-451): keep the runway, lines and apron meshes (415-440). Delete the hangar and its crates
   (442-446) and the windsock block (447-451): they are props now. Keep `let sock` (line 126); the windsock prop sets it.
6. Move the `dewBarrels` array and `placeDewBarrel` (lines 485-495) up, to just before the props step below, unchanged.
7. Props: right after the airfield, add the props step. For each region in `REGION_IDS` order, for each `p` of
   `REGIONS[id].props` in order, call `placeProp(REGIONS[id], p)`:
   ```ts
   const batchByName: Record<string, Batch> = {
     'desert-scenery': batches.desert, 'forest-scenery': batches.forest, 'tundra-scenery': batches.tundra, 'farm-scenery': batches.farm,
   };
   /** A hand-placed prefab from a region document. x, z is the prefab's origin (not its footprint centre). */
   const placeProp = (region: Region, p: GtaProp): void => {
     if (p.prefab === 'team-banner') {
       const b = shadowed(buildPrefab('team-banner', { lights: false, ...(p.tint ? { tint: parseInt(p.tint.slice(1), 16) } : {}) }));
       b.scale.setScalar(p.scale ?? 1);
       b.position.set(p.x, 0, p.z);
       b.rotation.y = p.rot ?? 0;
       scene.add(b);
       banners.push(b as THREE.Group);
       return;
     }
     if (p.prefab === 'windsock') {
       const w = shadowed(buildPrefab('windsock', { lights: false }));
       w.scale.setScalar(p.scale ?? 1);
       w.position.set(p.x, 0, p.z);
       w.rotation.y = p.rot ?? 0;
       scene.add(w);
       sock = w.getObjectByName('sock') ?? null;
       return;
     }
     if (p.prefab === 'gta-dew-barrel') { placeDewBarrel(p.x, p.z, p.scale ?? 1, p.rot ?? 0); return; }
     const batch = region.data.batch ? batchByName[region.data.batch] : undefined;
     if (!batch) throw new Error(`biomes: region ${region.id} has no scenery batch for prop ${p.prefab}`);
     const m = measure(p.prefab, p.scale ?? 1, p.rot ?? 0);
     batch.push({ id: m.id, x: p.x, z: p.z, yaw: m.yaw, scale: m.s });
     if (p.solid) {
       const cx = p.x - m.ox, cz = p.z - m.oz;
       addBox({ minX: cx - m.hw, maxX: cx + m.hw, minZ: cz - m.hd, maxZ: cz + m.hd, h: m.h });
     }
   };
   ```
   (`placeDewBarrel` pushes its box to `boxes` directly, not through `addBox`: keep that, it matters.)
8. Setpieces (sections "1." to "6.", lines 497-1000): turn each landmark block into a builder in one table, called once
   per `setpiece` marker. Inside each builder, delete every line that places a prefab or a point the documents now
   hold: every `placeSetpiece(...)`, `placeAt(...)`, `drop(...)`, `placeDewBarrel(...)`, `walk(...)` and `park(...)`
   call (and any local that only fed them, e.g. `lanternLb`, `lanternScale`, `pencilLb`, `pencilScale`). Keep all
   other geometry, `addSafeBox`, `addSteam`, `flickers` and sign code exactly as it is. Replace the hard-coded anchor
   with the marker's position. Shape:
   ```ts
   const SETPIECES: Record<string, (m: WorldMarker) => void> = {
     'compost-heap': (m) => { const cx = m.x, cz = m.z; /* old block 1 body */ },
     // ...
   };
   for (const m of markersOf('setpiece')) {
     const build = SETPIECES[String(m.data?.builder)];
     if (!build) throw new Error(`biomes: no setpiece builder "${String(m.data?.builder)}" (marker ${m.id})`);
     build(m);
   }
   ```
   The builders and the literals that must become anchor-relative:
   - `compost-heap` (old anchor -255, -60): the four mound points become `[cx - 10, cz - 8], [cx + 11, cz - 7],
     [cx - 9, cz + 10], [cx + 9, cz + 11]` (keep only `addSteam(mx, mz, 2, 4.5)` in that loop); the cranes
     `[cx - 7, cz + 3, 0.5], [cx + 8, cz - 3, -2.4]`; the tanks `const tx = cx, tz = cz - 12;`; the vent
     `const vx = cx, vz = cz + 4;`. Delete the dew barrel loop, compost bins and wheelbarrows.
   - `unmowed-ring` (old block 2a, anchor ux, uz): only the clearing disc remains (stones, toadstools, campfire,
     seats and lamps are props).
   - `chapel-van` (2b): `const vx = m.x, vz = m.z, vyaw = markerNum(m, 'yaw');`.
   - `tall-house-porch` (2c): `const px = m.x, pz = m.z;` (keep the halos and their flicker).
   - `birdbath-basin` (3a): `const bx = m.x, bz = m.z;`.
   - `kiln-shrine` (3b): `const sx = m.x, sz = m.z;`.
   - `ley-ramp` (3c): `const ax = m.x, az = m.z;`.
   - `granny-farm` (4a): `const gx = m.x, gz = m.z;` (keep the pumpkins and their box).
   - `biscuits-nap` (4b): `const nx = m.x, nz = m.z;`.
   - `drainage-canal` (the canal part of 4c, lines 852-877): `const cx = m.x, canalZ = m.z;` and every x literal
     becomes `cx +` it: `-103` -> `cx - 103`, `103` -> `cx + 103`, `-12.5` -> `cx - 12.5`, `12.5` -> `cx + 12.5`, and the
     two parapet boxes `minX: cx - 13, maxX: cx - 12` and `minX: cx + 12, maxX: cx + 13`.
   - `brenda-throne` (the throne part of 4c, lines 879-896): `const brx = m.x, brz = m.z;`.
   - `driftwood-raft` (the raft part of 4c, lines 898-913): `const drx = m.x, drz = m.z;`.
   - `knot-hole` (the knot-hole part of section 5, lines 962-977): `const kx = m.x, kz = m.z;`; the two knot meshes
     translate to `kx - 4.4` and `kx - 4.35` instead of `-594.4` and `-594.35`. Delete the crate and pail `drop`s.
   - `dew-station` (section 6, one marker per station): `const s = { x: m.x, z: m.z, yaw: markerNum(m, 'yaw') };`;
     only the slab remains (the pump and barrels are props).
   The perimeter fence (section 5, lines 917-960) is not a setpiece: keep it as a plain block after the setpiece loop,
   with `const fenceEdge = LAYOUT.fenceEdge;` instead of `595`. Keep its `-120` knot-hole bay literal.
9. Walk points: after the fence, `for (const m of markersOf('walk')) walkPoints.push({ x: m.x, z: m.z });` (push
   directly; do not call `walk()`, which re-checks boxes).
10. Generators: add
    ```ts
    /** Starts a region's scatter generator: checks its id and version, then continues the PRNG stream from its seed. */
    const startGenerator = (id: RegionId): void => {
      const base = REGIONS[id].base;
      const want = GENERATORS[id];
      if (base.id !== want.id || base.version !== want.version) {
        throw new Error(`biomes: ${id} wants generator ${base.id} v${base.version}; this code is ${want.id} v${want.version}`);
      }
      rnd = mulberry32(base.seed ?? 0);
    };
    ```
    Call `startGenerator('dust-flats')` right before `const desertSites`, `startGenerator('mossy-wood')` right before
    `const clumpy`, `startGenerator('frostbite-fells')` right before `const tundraSites`,
    `startGenerator('cloverfield-farms')` right before `const yardSites`, and set `rnd = noRandom;` after the farmland
    section. Do not change the scatter code in between.
11. Delete helpers left unused (`placeSetpiece` probably; keep `placeAt`, the farm yards use it). Update the top-of-file
    comment: hand-placed things come from the region documents, the scatter is a seeded generator per region.

## Change: `games/gnome-theft-auto/src/world.ts`
- Add `import { REGIONS } from './levels';`.
- Line 610: `const rnd = mulberry32(REGIONS.turfton.base.seed ?? 7);`.
- Line 995: `const biomes = buildBiomes(scene);`.
- The kerb-side parking loop (lines 1043-1055): right before `for (const kind of restKinds)`, add
  `const kerbRnd = mulberry32(REGIONS.turfton.data.kerbSeed ?? 0);` and change the six `rnd()` calls inside that loop to
  `kerbRnd()`. Nothing else in world.ts changes.

## Contract
- `buildBiomes(scene: THREE.Scene): BiomeBuild`; `BiomeBuild` unchanged.
- Uses `levels.ts` as it is (do not edit it) and the config constants by their current names (another worker is
  turning them into derived values with the same names and values).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- `npm test -w games/gnome-theft-auto` passes, including `src/layout.golden.test.ts` (the whole world identical to the
  fixture) and `src/levels.test.ts`. The failure message lists up to 20 differing paths with golden and current
  values: use them to find the builder or prop you got wrong (e.g. `world.boxes[...]` = a collider, `scene[...]` = a
  mesh's position or size, `batches[k].items[...]` = a prefab placement, an exception = a random number drawn outside
  a generator).
- `grep -n "rectOf(-255\|placeSetpiece(\|-594.4" games/gnome-theft-auto/src/biomes.ts` finds nothing.

## Out of scope
- `src/config.ts`, `src/quests/`, `src/levels.ts`, the JSON under `src/data/`, `tools/level-editor/`.
- The scatter code itself, the city in world.ts, and any visible change.
