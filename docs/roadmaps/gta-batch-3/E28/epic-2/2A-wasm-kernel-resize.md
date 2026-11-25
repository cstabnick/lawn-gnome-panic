Epic: E28-2 Fill (GTA batch 3, world expansion II)
Depends on: none (the world data is final for this epic; other workers only add scenery and visuals)
Worker: Sonnet or Opus (careful numeric parity work)

(Paste of `_env.md` applies: read `docs/roadmaps/gta-batch-3/E28/epic-2/_env.md` first.)

## Goal
The AssemblyScript Wasm kernel works at any world size again: its linear-memory layout is derived from the world size
(or grows to fit) instead of a fixed map for worldHalf 900; every region's relief and paint the JS path has is in the
kernel too (the four E01 band generators and the two new E28 ones); the `KERNEL_MAX_WORLD_HALF` guard is gone; the
parity tests run again over the whole 3600 x 3600 map and pass. The JS fallback stays (kernel failure = JS path).

## Read first
- `games/gnome-theft-auto/assembly/kernel.ts`: the fixed pointer map (lines 9-62: CFG, region raster `REG_RASTER_PTR`
  sized 128 x 128 i8, distance-field grids `FIELD_*_PTR`, `HEIGHT_GRID_PTR`, `SCRATCH_A/B_PTR`, chunk buffers), the
  getters (lines ~114-154), `setStaticCounts`, `regionAtIdx`, `buildDistanceFields`, `evalRegionRelief` (per-region
  branches `reg == 1..6` in REGION_PRIORITY order), `evalRegionPaint`, `buildBaseHeightGrid`, `buildPaintGrid`,
  `buildChunkPosNormals`.
- `games/gnome-theft-auto/src/wasm/gtaWasm.ts`: `KERNEL_MAX_WORLD_HALF`, `kernelFitsWorld`, `setupRuntime` (typed-array
  views made once), `ensureStaticWorldUploaded` (config block, region polygons + 16 m raster, segment lists with caps
  1024/64/256/128/2048, per-region landform params `if (id === 'dust-flats') ...`), and every `wasm*` export.
- `games/gnome-theft-auto/src/wasm/gtaWasm.test.ts`: the skipped parity suite.
- `games/gnome-theft-auto/scripts/build-wasm.mjs`: asc flags (`--initialMemory 212 --maximumMemory 216`).
- `games/gnome-theft-auto/src/landforms/*.ts`: the JS generators to match. The region order the kernel indexes is
  `REGION_PRIORITY` in `src/levels.ts`: turfton 0, dust-flats 1, mossy-wood 2, frostbite-fells 3, cloverfield-farms 4,
  loch-moss 5, tallgrass-commons 6, north-highlands 7, south-shore 8, east-campus 9, west-estates 10, pardonlin 11,
  the-unmown 12. Not yet in the kernel: 7-12 (`northHighlands.ts`, `southShore.ts`, `eastCampus.ts`, `westEstates.ts`,
  `pardonlin.ts`, `theUnmown.ts`; each is ~20 lines: fbm/ridged of their params, `roadDistAt` for the highland crags,
  and a small paint rule). `src/landforms/noise.ts` is what `fbm`/`ridged`/`smoothstep` mean.
- `games/gnome-theft-auto/src/landforms/fields.ts` (JS distance fields: grid step and extent) and `src/terrainPaint.ts`
  (the JS paint grid the kernel's paint grid must equal).

## Change
- `assembly/kernel.ts`: replace the fixed big-buffer pointers (raster, the four fields, height grid, scratch A/B, chunk
  pos/normal) with globals computed by a new exported `configureLayout(rasterN: i32, fieldN: i32, gridN: i32): i32` that
  lays them out after the small fixed tables, calls `memory.grow` for whatever is missing, and returns the total bytes.
  Keep every getter's name and meaning (they now return the globals). Raise the small table caps if a count at
  worldHalf 1800 exceeds them (regions 16 is fine at 13; check road segments: count `highways()` segments, there are
  now many more Pardonlin streets; check trail points). Add relief branches `reg == 7..12` and paint branches matching
  the JS modules exactly (same seeds, octaves, defaults; read params from LF_PARAMS like the others).
- `src/wasm/gtaWasm.ts`: delete `KERNEL_MAX_WORLD_HALF` and `kernelFitsWorld` (and every use); call
  `ex.configureLayout(RASTER_N, MN, GN)` before the first upload and rebuild the runtime's typed-array views afterwards
  (memory growth detaches old views: make `setupRuntime` re-callable or add `refreshViews(rt)`); upload the params for
  regions 7-12 in `ensureStaticWorldUploaded` like the existing ones; keep the JS fallback behaviour (any exception or
  missing export = JS path, as today).
- `scripts/build-wasm.mjs`: memory flags that allow growth (e.g. drop `--maximumMemory` or raise it well above the
  need at worldHalf 1800, and keep a small `--initialMemory`); then run `npm run build:wasm -w games/gnome-theft-auto`
  to regenerate `src/wasm/kernelBytes.ts` (never hand-edit it).
- `src/wasm/gtaWasm.test.ts`: remove the `describe.skipIf`, sample x/z over the whole map (`-WORLD_HALF..WORLD_HALF`
  instead of the hard-coded 900), compute the expected grid sizes from `WORLD_HALF`, and keep the chunk test on a
  sloped chunk (pick one in a hilly region; indices from `GRID_N`).
- `scripts/bench-wasm.mjs` only if it hard-codes 900.

## Contract
- No exported name of `gtaWasm.ts` changes signature except the removed `KERNEL_MAX_WORLD_HALF`. Nothing else in the game
  imports `KERNEL_MAX_WORLD_HALF` (grep to confirm).
- Kernel results equal the JS path within the test tolerances (noise 1e-12, positions/normals 1e-5, regionAt exact).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/wasm/gtaWasm.test.ts` passes with no skipped tests.
- `npx vitest run src/terrain.test.ts src/landforms.test.ts src/terrainBiomes.test.ts` pass.
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- Report the kernel's memory in pages at worldHalf 1800 and the time of `heightGrid()` with and without the kernel
  (`npm run bench:wasm -w games/gnome-theft-auto` if it works).

## Out of scope
Everything outside `assembly/`, `src/wasm/`, `scripts/build-wasm.mjs`, `scripts/bench-wasm.mjs`. If parity fails because
a JS module reads something the kernel cannot (say so in the report rather than changing the JS landforms).
