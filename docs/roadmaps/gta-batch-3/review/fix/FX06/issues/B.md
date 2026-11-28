Epic: FX06 epic 1, issue B: rock paint only in rock sites, feathered paint edges (D58; G5#1, G5#2, G5#3)
Depends on: none (dev port 5517)

## Goal
The terrain paint grid paints rock only inside the lore's rock sites (the Hatbrim, the Spine Cut and its Keyhole).
Every other steep cut or fill gets its region's own paint (dirt, grass, snow, gravel ... per the region rule). Paint
borders (dirt lanes, gravel pads, trail edges, the Anthill verge) stop being straight 2 m stair-steps: they get an
irregular, feathered outline.

## The problem today
`src/terrainPaint.ts` `buildPaint(g)` makes a (GRID_N-1)^2 byte grid (one cell per 2 m height cell; TERRAIN.step = 2),
either from the Wasm kernel (`wasmBuildPaintGrid`, mirrors the JS rule in `assembly/kernel.ts buildPaintGrid`) or the
JS loop. Rule: 1. trails -> dirt; 2. slope >= TERRAIN.rockSlope (0.8) outside Turfton -> rock; 3. region paint
(`regionPaintAt(x, z, facts)`); 4. near a river -> mud; else 0. `terrainMesh.ts` gives each triangle its cell's kind
(one material per kind), so every paint border is a hard 2 m staircase. Rule 2 paints the Anthill summit ring, the
Rutbottom Dirt Bowl's raised corners and every other cut as grey rock cliffs (editors: "a mesa with a stone cap",
"grey rock walls with sawtooth edges").

## Read first
- `src/terrainPaint.ts` (all, 122 lines).
- `src/wasm/gtaWasm.test.ts` lines 57-110: the parity test re-derives the JS rule for 6000 sampled cells and compares
  with `paintGridBytes()`.
- `src/landforms.test.ts` lines 30-50 and 175-185 (`PROMISED_PAINT`: 'rock' is promised in dust-flats,
  frostbite-fells, loch-moss) and `src/campus/mound.test.ts` lines 110-120 (`paintAt` checks on the Anthill).
- `src/landforms/macro.ts` `LANDSCAPE.features` (`{ id, kind, points, r, h }`); `src/data/landscape.json` has
  `ridge/hatbrim` (points [[775,-1450],[730,-1590],[690,-1700],[650,-1800]], r 95) and `ridge/highland-spine`
  (points [[420,-1080],[560,-1180],[640,-1260]], r 70; the Spine Cut road crosses it, the Keyhole at (576.5, -1195.8)).
- `src/landforms/noise.ts`: `valueNoise(x, z, seed)` in [-1, 1], `distToPolyline(x, z, points)`.

## Change (only `src/terrainPaint.ts` and the four test files below)
1. Rock sites, in `terrainPaint.ts`:
   ```ts
   /** Where the lore says rock (D58): the Hatbrim, and the Highland Spine where the Spine Cut and the Keyhole are. */
   export const ROCK_SITES: readonly { id: string; points: readonly (readonly [number, number])[]; r: number }[];
   export function inRockSite(x: number, z: number): boolean;
   ```
   Build ROCK_SITES from `LANDSCAPE.features` by id (`ridge/hatbrim` with r = its r + 15, `ridge/highland-spine` with
   r = its r + 10), so the data has one source. Comment the rule at the top of the file (update the numbered rule).
2. Split the build: `rawPaint(g)` = today's result (Wasm or JS, unchanged, so the kernel needs no change), and
   `buildPaint(g) = finishPaint(rawPaint(g), g)`. Export `paintRawBytes(): Uint8Array | null` (the raw grid, same
   guards and caching style as `paintGridBytes`) for the parity test. `paintGridBytes`/`paintAt` return the finished grid.
3. `finishPaint`, pass 1 (rock rule): every ROCK cell whose centre is not `inRockSite` is re-painted by rules 3-4 in
   JS (the same `facts` computation as the JS loop: height = mean of the 4 corners, slope, riverDistAt, waterDistAt,
   region; `regionPaintAt(...)` else mud within TERRAIN.mudReach of a river, else 0). Only rock cells are re-evaluated,
   so it stays cheap.
4. `finishPaint`, pass 2 (feathered edges): a copy `src` of the grid; for each cell that differs from at least one of
   its 4 neighbours, read its value instead from a nearby cell of `src` offset by (di, dj) in {-1, 0, 1}, where the
   offset comes from smooth noise (domain warp, `valueNoise(x / 9, z / 9, seedA)` and `seedB`, wavelength about 9 m)
   plus a small per-cell hash jitter, rounded. Interior cells never change, so a border wobbles by up to one cell
   (2 m) in an irregular, natural way instead of a straight staircase. Tune amplitude / wavelength by screenshot (see
   Done when): soft and irregular, not noisy speckle. A trail 2 cells wide must not break into gaps: never change a
   trail cell (rule 1 dirt from the raw trail raster) into non-dirt; it may only grow. Keep the pass deterministic.
   Time it (`performance.now()` around buildPaint in a quick test): the finish passes must add under ~60 ms.
5. Tests:
   - `src/wasm/gtaWasm.test.ts`: compare against `paintRawBytes()` instead of `paintGridBytes()` (the raw rule is the
     kernel's contract; it is unchanged).
   - New `src/terrainPaint.test.ts` (use `setTerrainOptions({ amplitude: 1, testHill: false, landforms: true })` like
     gtaWasm.test.ts, reset in finally): no cell outside `inRockSite` is rock; some cell inside the Hatbrim is rock; the
     Anthill flank (e.g. around (1240, 190) and the summit ring 32-45 m from (1240, 150)) is not rock; the Rutbottom
     corners (e.g. 1215, -560 north side of the start straight) are not rock; the feather pass changes only border
     cells (count: changed cells all had a differing neighbour in raw) and is deterministic.
   - `src/landforms.test.ts` `PROMISED_PAINT`: drop 'rock' from dust-flats, frostbite-fells and loch-moss (they keep
     their other kinds); keep the test otherwise.
   - `src/campus/mound.test.ts`: only if a `paintAt` expectation lands on a feathered border, move the probe point a
     few metres inward; do not weaken it otherwise.

## Contract
`paintAt`, `paintedSurfaceAt`, `paintedGroundAt`, `paintGridBytes`, `PAINT_SURFACE`, `PAINT_GROUND` keep their
signatures. New exports: `ROCK_SITES`, `inRockSite`, `paintRawBytes`. FX13 applies the same rule to the north routes
by reading `inRockSite`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/terrainPaint.test.ts src/wasm/gtaWasm.test.ts src/landforms.test.ts src/campus/mound.test.ts src/surfaces*.test.ts` passes; `npx tsc --noEmit -p games/gnome-theft-auto` clean in your files.
- Screenshots (dev server on 5517) compared with the editors' (`...\shots\G5\`): `x-mound-n` (stand about 1240, 330
  facing north, yaw Math.PI), `a-road` (on trail/anthill-road below the summit), `b-stands` (1215, -520 facing north),
  `b-gate` (1010, -650 facing east), `r-track` (Pinwheel service track start; find `trail/pinwheel-track` in
  `src/data/levels/east-campus.level.json` and stand on its first point; level coordinates are region-local, world =
  level + the region's origin: use `trails()` from `src/levels.ts` in a scratch vitest to print world points), and a
  Hatbrim slope (e.g. 740, -1560) to show rock is still there. No grey rock outside the rock sites; borders irregular.

## Out of scope
`assembly/kernel.ts` and `src/wasm/gtaWasm.ts` (raw rule unchanged), `terrainMesh.ts`, heights (another worker widens
the Anthill blend and the Rutbottom batter), `unmown/trails.ts` (another worker draws a ribbon over the Unmown trails).
