# Gnome Theft Auto: WebAssembly & render performance plan

Goal: push Gnome Theft Auto's startup time and frame rate further using high-performance WebAssembly (`AssemblyScript`
with `wasm32` `simd128`) where pure numerical grids/buffers dominate, paired with targeted Three.js scene-graph cuts
where JS/WebGL object traversal dominates—structured as low-conflict, isolated epics that can land cleanly once active
GTA feature work settles.

> **Status:** Epics 1 & 2 shipped (`assembly/kernel.ts`, `src/wasm/gtaWasm.ts`, `packages/prefabs/src/batch.ts`,
> `src/landforms/fields.ts`, `src/terrain.ts`, `src/terrainPaint.ts`, `src/terrainMesh.ts`, `src/cull.ts`).
> Compact mobile-friendly linear memory (`13.25 MB` / `212` pages), async `initGtaWasm()` at boot (`?wasm=0` fallback),
> and zero diffs against `layout.golden.json`.

## Measured before vs after (`npm run bench:wasm -w games/gnome-theft-auto`)

| Workload | Before (JS) | After (Wasm + Packer) | Speedup |
|---|---:|---:|---:|
| **`fields` (`451² × 4`) + `heightGrid` (`901²`)** | 843.4 ms | **268.0 ms** | **3.1x** |
| **`terrainPaint` surface raster (`900²`)** | 158.0 ms | **33.6 ms** | **4.7x** |
| **`buildTerrainChunks` (`15×15` chunks, bridge-aware normals + UV)** | 322.7 ms | **163.9 ms** | **2.0x** |
| **`buildStaticPrefabs` (`2,000` props, `@lawn/prefabs`)** | 105.9 ms | **49.2 ms** | **2.2x** |
| **`updateCull` (`100` frames × `3,000` entries)** | 4.4 ms *(checked 25%/frame)* | **4.2 ms *(checks 100%/frame via `f32x4` SIMD)*** | **~4.2x per-entry** *(zero 4-frame lag)* |
| **Cold mobile boot to playable mower (`390x844 @2x`, `4x` CPU throttle)** | 12.98 s (`?wasm=0`) | **9.68 s** | **-3.30 s (-25.4%)** |

## Grounded baseline (from `gta-performance-pass-2.md`, 4x mobile CPU, 390x844 @2x)

| Bottleneck | Current cost | Wasm fit? | Why |
|---|---|---|---|
| **World build (`heightGrid` + `fields` + `terrainMesh`)** | ~1.4 s desktop, ~4–6 s phone main-thread stall | **Excellent (#1 Wasm target)** | Pure dense 2D math: four `451x451` segment distance rasters (`203k` cells), one `901x901` (`812k`-vertex) multi-octave `fbm`/`ridged` heightfield + road/water carving, and chunk `Float32Array` `pos`/`nrm`/index generation. Zero Three.js contact. |
| **Static prefab cell merging (`buildStaticCells`)** | ~0.6–1.0 s of startup | **Good (#2 Wasm target)** | Pure `4x4` matrix × vertex/normal buffer transforms across thousands of placements into merged `Float32Array` attributes. |
| **Per-frame culling (`cull.ts` `updateCull`)** | Checks only 1/4 of ~2,500+ entries/frame in JS | **Good (#3 Wasm target, delta-list pattern)** | Flat `(x, z, r, cls)` arrays in Wasm linear memory let `f32x4` SIMD test **100%** of entries every frame in < 0.05 ms and return *only* the sparse indices whose `(show, cast, near)` bits flipped (typically 0–5 objects/frame), eliminating 4-frame cull lag and JS object reads. |
| **Off-screen wide-area traffic (`trafficSim.ts` + `roadRoute` A*)** | Scales with sim car count | **Moderate (if sim N grows 5x)** | Pure graph movement & A* route-finding; worth moving only if ambient traffic grows from tens to hundreds of simulated vehicles. |
| **`renderer.render` (`updateMatrixWorld` 17%, `projectObject` 10%, shadow walk 11%, draws 15%)** | **53% of frame** | **No (scene-graph bound)** | Bound by walking 5,700–7,400 `THREE.Object3D`s in JS. Must be attacked by shrinking node count (gnome part merging/instancing, hierarchical cell groups, freeing far critter meshes), not Wasm matrix math. |
| **Radio synthesis (`radio/music/build.ts` Tone.js)** | **~9% of frame** | **No (WebAudio node churn)** | Fix by pre-rendering song loops to `AudioBuffer` in a Worker or offline pass. |

---

## Shape (ready to execute once GTA churn settles)

| Epic | Done when | Issues | Touches active gameplay files? |
|---|---|---|---|
| 1. Wasm terrain, distance fields & chunk mesher | `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto` (`layout.golden.test.ts` & `landforms.test.ts` exact), world build < 350 ms desktop | Foundation (planner) + 3 parallel worker issues (1A–1C) | **No** — isolated to `assembly/`, `src/wasm/`, `src/landforms/fields.ts`, `src/terrain.ts`, `src/terrainMesh.ts`, and 1 boot `await` in `src/main.ts` |
| 2. Wasm static batch packer (`@lawn/prefabs`) & delta-stream culler (`cull.ts`) | `npm test -w packages/prefabs`, `npm test -w games/gnome-theft-auto`, `gta-perf.mjs --cpu 4` | 2 parallel worker issues (2A–2B) | **No** — isolated to `packages/prefabs` and `src/cull.ts` |
| 3. Scene-graph node & audio reductions (non-Wasm `renderer.render` wall) | `gta-perf.mjs --cpu 4` Turfton p50 < 35 ms, `npm run zfight` clean | 3 parallel worker issues (3A–3C) | Minimal (`packages/gnome`, `src/critters.ts`, `src/hunting/`, `src/radio/music/`) |

---

## Epic 1: Wasm Terrain, Distance Fields & Chunk Mesher

### Foundation (planner, before launching 1A–1C)

1. Add `assemblyscript@0.28.20` to `games/gnome-theft-auto/package.json` `devDependencies` and `"build:wasm": "node scripts/build-wasm.mjs"`.
2. Create `games/gnome-theft-auto/src/wasm/terrainWasm.ts` exporting the exact contract stubbed to `null` until compiled:
   ```ts
   export interface GtaWasm {
     /** Builds the 451x451 river, water, border and road distance rasters (4 m step) in Wasm linear memory. */
     buildDistanceFields(
       riverSegs: Float64Array,
       roadSegs: Float64Array,
       waterBodies: Float64Array,
       regionPolys: Float64Array,
       regionOffsets: Int32Array,
       edgeSegs: Float64Array,
       edgeOffsets: Int32Array,
     ): { river: Float32Array; water: Float32Array; border: Float32Array; road: Float32Array };
     /** Builds the 901x901 base natural height grid + road/trail/site flattening in Wasm. */
     buildBaseHeightGrid(params: Float64Array, flatSegs: Float64Array, flatSites: Float64Array, stamps: Float64Array): Float32Array;
     /** Computes positions (Float32Array) and central-difference normals (Float32Array) for a terrain chunk [i0..i1, j0..j1]. */
     buildChunkPosNormals(grid: Float32Array, gridN: number, worldHalf: number, step: number, i0: number, i1: number, j0: number, j1: number): { pos: Float32Array; nrm: Float32Array };
   }
   export function initGtaWasm(): Promise<void>;
   export function getGtaWasm(): GtaWasm | null;
   ```
3. Wire `await initGtaWasm()` in `games/gnome-theft-auto/src/main.ts` in parallel with `loadMyGnome()` and cloud-save sync (`Promise.all`), before `import('./app')` runs `buildWorld`.

### 1A. AssemblyScript Wasm kernel: noise, distance fields, height grid & chunk normals

~~~~text
Epic: 1 Wasm terrain, distance fields & chunk mesher
Depends on: Foundation

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\weakfish. Node: in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Other workers are editing src/landforms/fields.ts, src/terrain.ts and src/terrainMesh.ts at the same time: edit ONLY assembly/*, scripts/build-wasm.mjs, src/wasm/terrainWasm.ts, src/wasm/kernelBytes.ts and src/wasm/terrainWasm.test.ts.

## Goal
Implement the AssemblyScript Wasm kernel (`assembly/kernel.ts`) for GTA's distance fields (`451x451`), value/fBm/ridged noise + road/site flattening (`901x901`), and chunk vertex/normal buffer generation, with a Vitest parity test proving bit/1e-5 agreement against the TS reference functions.

## Read first
- games/gnome-theft-auto/src/landforms/noise.ts (hash, fade, valueNoise, fbm, ridged — port `hash` integer `Math.imul` bit-identically)
- games/gnome-theft-auto/src/landforms/fields.ts (MN = 451, MC = 4, packSegs, nearestSeg with previous-cell hint)
- games/gnome-theft-auto/src/landforms/index.ts, macro.ts, and each region generator in src/landforms/*.ts
- games/gnome-theft-auto/src/terrain.ts (buildGrid road/trail nearest-segment flatten + rectFlatten)
- games/gnome-theft-auto/src/terrainMesh.ts (lines 165-182: chunk pos & central-difference normal loop)

## Change
- games/gnome-theft-auto/assembly/kernel.ts: export linear-memory allocators and `buildDistanceFields`, `buildBaseHeightGrid`, `buildChunkPosNormals`. Use `i32` `imul` matching `noise.ts:hash` so procedural noise matches JS to `1e-6`, and `v128` (`f32x4`) SIMD for segment-bbox culling where 4 segments are tested per iteration.
- games/gnome-theft-auto/scripts/build-wasm.mjs: compile `assembly/kernel.ts` with `asc -O3 --shrinkLevel 2 --runtime stub --enable simd` and write base64 bytes to `src/wasm/kernelBytes.ts`.
- games/gnome-theft-auto/src/wasm/terrainWasm.ts: instantiate synchronously in Node (`new WebAssembly.Module`) and asynchronously in browsers (`WebAssembly.instantiate` in `initGtaWasm()`), implementing `GtaWasm`.
- games/gnome-theft-auto/src/wasm/terrainWasm.test.ts: compare Wasm vs TS `buildFields`, `valueNoise`/`fbm`/`ridged`, and chunk `pos`/`nrm` across 5,000 samples (max error < `1e-5`) and assert Wasm `buildFields` + `buildBaseHeightGrid` completes in < 250 ms.

## Contract
Matches `GtaWasm` in `src/wasm/terrainWasm.ts` verbatim.

## Done when
- `npm run build:wasm -w games/gnome-theft-auto` succeeds.
- `npx vitest run src/wasm/terrainWasm.test.ts` (in `games/gnome-theft-auto`) and `npx tsc --noEmit -p games/gnome-theft-auto` pass.

## Out of scope
Every file outside `assembly/`, `scripts/build-wasm.mjs`, and `src/wasm/`.
~~~~

### 1B. Wire `fields.ts` and `terrain.ts` to `getGtaWasm()`

~~~~text
Epic: 1 Wasm terrain, distance fields & chunk mesher
Depends on: Foundation

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\weakfish. Other workers are editing assembly/, src/wasm/, and src/terrainMesh.ts: edit ONLY src/landforms/fields.ts and src/terrain.ts.

## Goal
When `getGtaWasm()` is available, `buildFields()` in `src/landforms/fields.ts` and the base + road/site passes of `buildGrid()` in `src/terrain.ts` delegate to Wasm, keeping `applyTrackRelief` and `carveWater` on the returned `Float32Array` so water/bridge/track behaviour is 100% unchanged.

## Read first
- games/gnome-theft-auto/src/wasm/terrainWasm.ts (`getGtaWasm` contract)
- games/gnome-theft-auto/src/landforms/fields.ts
- games/gnome-theft-auto/src/terrain.ts (`buildGrid`, lines 153-232)
- games/gnome-theft-auto/src/layout.golden.test.ts and `src/landforms.test.ts` (if present)

## Change
- `src/landforms/fields.ts`: pack region border polygons and segment arrays once and call `wasm.buildDistanceFields(...)` when `getGtaWasm()` is non-null; keep existing TS `buildFields()` as fallback.
- `src/terrain.ts`: when `getGtaWasm()` is non-null and `opts.landforms` is standard, call `wasm.buildBaseHeightGrid(...)`, then run `applyTrackRelief`, Turfton `rectFlatten`, and `carveWater` on the `Float32Array` exactly as today.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- Existing terrain, water, boatCrossing and golden tests pass (`npx vitest run src/boatCrossing.test.ts src/layout.golden.test.ts`).

## Out of scope
`src/terrainMesh.ts`, `src/water.ts`, `src/wasm/*`.
~~~~

### 1C. Wire `terrainMesh.ts` chunk vertex/normal build to `getGtaWasm()`

~~~~text
Epic: 1 Wasm terrain, distance fields & chunk mesher
Depends on: Foundation

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\weakfish. Other workers edit src/wasm/, src/landforms/fields.ts, and src/terrain.ts: edit ONLY src/terrainMesh.ts.

## Goal
`buildTerrainChunks` uses `wasm.buildChunkPosNormals(...)` (when `getGtaWasm()` is non-null) to populate each non-flat chunk's `pos` and `nrm` `Float32Array`s in one Wasm call instead of `(per+1)^2` JS `normalAt` + `heightAt` calls per chunk, and skips building full `pos`/`nrm` arrays when a chunk is uniform height and single ground kind (`quad` fast path).

## Read first
- games/gnome-theft-auto/src/terrainMesh.ts (lines 144-228)
- games/gnome-theft-auto/src/wasm/terrainWasm.ts

## Change
- `src/terrainMesh.ts`: check whether all grid heights in `[i0..i1, j0..j1]` equal `g[j0 * N + i0]` BEFORE computing per-vertex normals; if `quad` (`level && byKind.size === 1`), emit the 4-vertex quad directly without computing `(per+1)^2` normals! For sloped chunks, call `wasm.buildChunkPosNormals(...)` when available, falling back to the current TS loop.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.

## Out of scope
Every file except `src/terrainMesh.ts`.
~~~~

---

## Epic 2: Wasm Static Batch Packer & Delta-Stream Culler

### 2A. `@lawn/prefabs`: Wasm SIMD vertex/normal matrix transform for `buildStaticPrefabs`
- **Files:** `packages/prefabs/src/wasm/*`, `packages/prefabs/src/static.ts` (or batch builder).
- **What:** Pack unique sub-mesh prototype `(pos, nrm, idx)` buffers once into Wasm memory; pass a `Float32Array` of instance transforms `(x, y, z, sinYaw, cosYaw, sx, sy, sz, colorRGB)` per material bucket; Wasm transforms all positions and normals with `f32x4` SIMD and returns merged `Float32Array`s + `Uint32Array` index buffer in one call.
- **Gain:** Cuts `scenery.ts` / `landscaping.ts` / `settlements.ts` / `stageSets.ts` mesh-merge CPU time by 3–5×, and benefits **every** 3D game using `buildStaticPrefabs`.

### 2B. `cull.ts`: Wasm SIMD full-scene broadphase returning state-change deltas
- **Files:** `games/gnome-theft-auto/assembly/kernel.ts`, `games/gnome-theft-auto/src/cull.ts`.
- **What:** Mirror `entries`'s `(x, z, r, drawLim, shadowLim, nearLim, stateBits)` in a flat SoA buffer in Wasm linear memory. Each frame:
  1. Write updated `(x, z)` only for `moves: true` entries (~150 dynamic objects) into a shared `Float32Array` view.
  2. Call `wasmUpdateCull(cx, cz, viewScale, shadowScale) -> changedCount`: Wasm tests **all** 2,500+ entries every frame (no 1/4-per-frame cursor lag) with `f32x4` SIMD distance checks and writes packed `(entryIndex << 3) | newStateBits` ONLY for entries whose `(show, cast, near)` state changed since last frame.
  3. JS loops over the `changedCount` deltas (typically 0–5 per frame) to toggle `[CULLED]`, `castShadow`, or `layers`.
- **Gain:** 100% single-frame culling accuracy at ~0.05 ms/frame with near-zero JS object touches.

---

## Epic 3: Attacking the 53% `renderer.render` Wall (Scene-Graph & Audio)

Wasm cannot speed up Three.js walking 7,400 JS `Object3D`s inside `renderer.render`. Once GTA stabilises, pair Epics 1–2 with three targeted JS/Three.js cuts:

1. **3A. Shared baked geometry cache + single-mesh far LOD in `@lawn/gnome`:**
   - Profiling found ~2,500 unique geometries uploaded to WebGL because each gnome bakes its own part geometries, and each gnome has ~20 child `Object3D`s.
   - Cache baked limb geometries by quantized look key, and merge static body parts (`hat + head + torso + beard`) into 1 vertex-coloured `BufferGeometry` per look so every pedestrian/driver drops from ~20 `Object3D`s to 4–5 (body + 2 arms + 2 legs).
2. **3B. Spatial parent `Group`s in `cull.ts` + critter mesh release:**
   - Group static `registerScenery` entries into `128 m × 128 m` spatial parent `THREE.Group`s. When an entire `128 m` cell is beyond `building` draw range (`520 m * view`), `cull.ts` hides the cell's single parent `Group` so `updateMatrixWorld`, `projectObject`, and `WebGLShadowMap` skip hundreds of children in 1 branch instead of N.
   - Release/pool `critters.ts` and `hunting/` quarry `Object3D`s past `simRadius * 1.2` so node count stays at ~5,700 instead of growing to 7,400 over a 3-minute drive.
3. **3C. Pre-rendered loop stems for `radio/music/`:**
   - Render Tone.js station patterns into looping `AudioBuffer`s in an `OfflineAudioContext` (on station switch or idle slice) instead of scheduling dozens of live Tone.js synth/part callbacks every frame (~9% of total frame CPU recovered).
