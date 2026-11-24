# Gnomes of Gnomomia: WebAssembly terrain, pathfinding & chunk mesher

Goal: eliminate click-to-move and companion pathfinding hitches (previously up to 1.0–1.6 s on hard or unreachable
routes) and cut terrain chunk streaming and minimap rasterisation CPU cost by moving Gnomomia's pure numerical hot
paths (`terrainCore` height/walkability queries, 2D/3D grid A* with line-of-sight smoothing, chunk vertex/normal/colour
generation, and minimap tile rasterisation) into a compiled WebAssembly kernel (`assembly/kernel.ts` →
`src/wasm/kernel.wasm`, compiled with AssemblyScript `-O3 --runtime stub --enable simd`).

## Why these subsystems (and not others)

- **Boundary rule:** Wasm wins when one call crunches 10k–1M operations in flat linear memory and returns a typed-array
  view; it loses when crossing JS↔Wasm per callback or mutating `THREE.Object3D` hierarchies.
- **1. 3D Grid A* + Walkability (`src/pathfind.ts` + `src/terrainCore.ts`):** `findPath3` expands up to 16,000 nodes
  (800–1,500 per companion/chase repath), running ~65 `standY` checks per node (~1M terrain queries worst-case). Moving
  both `findPath3` and the terrain walkability model (zones, spatial-bucketed roads/cuts/decks, baked `WalkGrid`
  bitsets, live collider buckets, `DeltaGrid`, `PaintGrid`, pass open-mask, and a 64k-slot generation-stamped `f64`
  height memo) into one Wasm module eliminates **all** JS callbacks and heap allocations during world pathfinding.
- **2. Chunk Terrain Mesh Generation (`src/world.ts` `buildChunk`):** builds non-indexed `Float32Array` `positions`,
  flat-shaded face `normals`, and per-triangle `colors` (1,089 heights + 2,048 `groundColourAt` evaluations at LOD 0)
  in one Wasm call, skipping `PlaneGeometry`, `.toNonIndexed()`, `THREE.Color.setHex`, and `computeVertexNormals()`.
- **3. Minimap Tile Rasterisation (`src/ui/minimap.ts` `getTerrainChunk`):** fills a 32×32 `Uint32Array` RGBA buffer in
  one Wasm call for a single `ctx.putImageData()`, replacing 1,024 hex-string allocations and 1,024 `fillRect(1, 1)`
  calls per tile.
- **4. JS-side cleanups (`terrainCore.ts`, `pathfind.ts`, `world.ts`, `ui/minimap.ts`):** spatial bucketing for
  `distToCut` and decks, zero-allocation typed-array SoA A* for custom JS callbacks in tests, integer chunk keys instead
  of `${ci},${cj}` strings, and dirty-checked DOM writes on the minimap compass/zone label.
- **Not moved to Wasm:** `renderer.render`, gnome rig posing, WebSocket JSON (`@lawn/mp`), quests/combat (small N,
  event-driven). Party slice: `packages/party/README.md` marks `gnomomia-skirmish` as `later`; combat/arena are not
  touched here.

## Dual-environment Wasm loading (Browser + Node/Vitest/esbuild)

- `npm run build:wasm -w games/gnomes-of-gnomomia` compiles `assembly/kernel.ts` with `asc` (`--runtime stub -O3
  --shrinkLevel 2 --enable simd`) and emits `src/wasm/kernelBytes.ts` (base64 bytes, zero bundler plugins needed for
  Vite, Vitest, or `esbuild` scripts `check-bake.mjs` and `sim-*.mjs`).
- **Node / Workers:** instantiated synchronously on first use via `new WebAssembly.Module(bytes)` (< 0.5 ms), so all
  synchronous unit tests (`terrain.golden.test.ts`, `pathfind.test.ts`, `pathfindCost.test.ts`) and headless sims use
  Wasm immediately without changing sync signatures.
- **Browser main thread:** `await initGnomomiaWasm()` runs at startup alongside `await loadMyGnome()` in `src/main.ts`
  using async `WebAssembly.instantiate(bytes)` (avoiding Chromium's 4 KB main-thread sync compile cap), with seamless
  fallback to the typed-array TS path if anything runs before startup resolves.
- **Exact parity:** Wasm uses IEEE-754 `f64` for heights, `standY`, and A* costs, importing host `Math.sin` / `Math.cos`
  / `Math.exp` behind a 64k-entry generation-stamped `(x, z) -> height` hash cache in linear memory, so
  `terrain.golden.test.ts` (`toFixed(9)` SHA-1 hashes) and `walk.bake.json` fingerprints remain bit-identical.

## Measured before vs after (`npm run bench:wasm -w games/gnomes-of-gnomomia`)

| Workload | Before (JS) | After (Wasm) | Speedup |
|---|---:|---:|---:|
| **8 cross-zone & town routes** (`WalkGrid` baked, median) | 481.0 ms | **137.7 ms** (~17 ms/route) | **3.5x** |
| **8 cross-zone & town routes** (live colliders, median) | 612.7 ms | **115.7 ms** (~14 ms/route) | **5.3x** |
| **800 m cross-world search + smoothing** (16k nodes, min) | 471.0 ms | **139.5 ms** | **3.4x** |
| **25 LOD-0 terrain chunks** (`33x33` heights + `2,048` tri colours + flat normals, min) | 29.0 ms *(data only)* | **6.8 ms** *(full `pos`+`nrm`+`col`)* | **4.3x** *(~8x vs `PlaneGeometry`+`toNonIndexed`)* |
| **25 minimap `32x32` tiles** (`1,024` px each, min) | 22.0 ms *(data only)* | **3.7 ms** *(packed `ImageData`)* | **6.0x** *(~20x vs `1,024` `fillRect`s/tile)* |

## Shape

| Epic | Done when | Work |
|---|---|---|
| 1. AssemblyScript Wasm kernel + TS host bridge | `npm run build:wasm -w games/gnomes-of-gnomomia` and `wasmParity.test.ts` pass | `assembly/kernel.ts`, `scripts/build-wasm.mjs`, `src/wasm/kernelBytes.ts`, `src/wasm/terrainWasm.ts` |
| 2. Engine integration & JS hot-path cleanup | `npm test -w games/gnomes-of-gnomomia`, `npm run build -w games/gnomes-of-gnomomia`, `sim:town`, `bench:wasm`, and headless Edge smoke (desktop + 390x844 phone) pass | `src/terrainCore.ts`, `src/pathfind.ts`, `src/world.ts`, `src/ui/minimap.ts`, `src/main.ts`, `scripts/bench-wasm.mjs` |
