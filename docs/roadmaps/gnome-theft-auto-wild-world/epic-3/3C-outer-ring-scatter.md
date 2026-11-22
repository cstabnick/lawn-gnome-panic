Epic: 3 (Wild World: world expansion and the region map)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, use absolute paths).
- Git Bash: if `node` is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first. Dependencies are installed.
- Five other workers are editing other files at the same time (`src/world.ts`, `src/textures.ts`, `src/hud.ts`,
  `src/config.ts`, `src/gnomes.ts`, `tools/level-editor`, `docs/lore`). Do not touch their files. If a type-check
  error is in a file you do not own, wait a minute and rerun; do not fix it.
- Do not commit, push or open a PR. Do not run `npm run build`, do not start a dev server, and do not run
  `UPDATE_GOLDEN=1` (the planner regenerates the golden fixture once at the end).
- Assets: only existing `@lawn/prefabs` ids (the ones `biomes.ts` already uses). No new prefabs, no hand-built meshes.

## Goal
The map grew from 1200 x 1200 to 1800 x 1800. The land the four old biomes gained (the ring outside |x|, |z| <= 600)
gets its own seeded scatter, lighter than the old density, kept clear of the new highways and the reserved river
course, so the outer ring is not bare ground. Everything inside the old square stays exactly as it is.

## Read first
- `games/gnome-theft-auto/src/biomes.ts`:
  - lines 160-330: the helpers inside `buildBiomes` you call: `uni(a, b)`, `anywhere()`, `free(x, z, margin)`,
    `findSpot(pick, margin, biome, tries, ok?)`, `scatter(batch, id, biome, scale, solid, pick = anywhere, ok?)`,
    `treeAt(batch, id, biome, scale, ok?)`, `tree(batch, id, scale, p)`, `placeAt(batch, id, scale, yaw, solid, p)`,
    `siteFor(biome, want, radius)`, `village(batch, c, id, scale, count, ring, palm)`, `park(kind, biome, near, margin?, reach?)`,
    `walk(x, z)`, and the module-level `fit(id, footprint)`.
  - lines 940-1120: the version 1 scatter of each biome (desert, forest, tundra, farmland). Copy its style, but do
    NOT edit any of it (not one line, not a number): it must keep drawing the same random numbers.
  - lines 1120-1135: the `outerRing` stub and the loop that calls it after `startOuter(id)`.
- `games/gnome-theft-auto/src/levels.ts`: `waterPaths()`, `waterBodies()` (the reserved river course and still water).

## Change
- `games/gnome-theft-auto/src/biomes.ts` only, and only the `outerRing` stub (you may add small helpers directly
  above it, inside `buildBiomes`). Add `waterPaths, waterBodies` to the existing `./levels` import.
  - When `outerRing` runs, `startOuter(id)` has already set: `half` = 900 (so `anywhere()` picks over the whole map
    and `free()` keeps 12 from the edge), every highway counts for `free()`, and `rnd` is a fresh stream for that region.
    Draw random numbers only through `uni()` / `rnd()` (never `Math.random`).
  - `outerOk(p)`: true when `Math.max(Math.abs(p.x), Math.abs(p.z)) > 606` (outside the old square, with a margin) and
    the point is clear of the reserved water: its distance to every `waterPaths()` centre line (use the module-level
    `segDist(px, pz, ax, az, bx, bz)` over each segment) is at least `width / 2 + 8`, and it is at least 8 outside
    every `waterBodies()` rectangle. Compute the water lists once, above `outerRing`.
  - Pass `outerOk` as the `ok` argument to every `scatter` / `treeAt` / `findSpot` call you make, and check it on every
    fixed point you build around (a village centre from `siteFor` must pass `outerOk` too, else skip that village).
  - Per region (`id` → biome and batch): `'dust-flats'` → `'desert'`, `batches.desert` (the local `D`);
    `'mossy-wood'` → `'forest'`, `F`; `'frostbite-fells'` → `'tundra'`, `T`; `'cloverfield-farms'` → `'farmland'`, `Fm`.
    About half the old density:
    - desert: one adobe village (`siteFor('desert', { x: 760, z: -300 }, 16)`, then `village(D, c, 'adobe-hut', 1, 4, 11, 'palm-tree')`),
      90 cacti (`'tall-cactus'` / `'barrel-cactus'` 50/50, scale `uni(0.9, 1.3)`, solid), 12 `'garden-rock'`
      (`fit('garden-rock', uni(1.5, 3))`, solid), 5 `'desert-mesa'` (`uni(0.8, 1.4)`, solid), one parked `'zero-turn'` near the village.
    - forest: 220 trees through `treeAt` (60% `'broadleaf-tree'` `uni(0.85, 1.25)`, 30% `'cone-pine'` `uni(0.85, 1.25)`,
      10% `'giant-oak'` `4 * uni(0.9, 1.5)`), 15 of `'fallen-log'` (`2 * uni(0.9, 1.1)`) / `'tree-stump'` / `'garden-rock'`,
      30 `'fern-clump'` / `'round-bush'` (not solid).
    - tundra: one lodge village (`siteFor('tundra', { x: 350, z: -760 }, 14)`, `village(T, c, 'snow-lodge', 1, 4, 13, null)`),
      200 `'snow-pine'` through `treeAt` (`uni(0.85, 1.2)`), 25 `'ice-rock'` (`fit('ice-rock', uni(1.5, 3))`, solid),
      6 `'snowman'` (`uni(0.9, 1.1)`, solid), one parked `'push-bike'` near the village.
    - farmland: one farmyard at `c = findSpot(anywhere, 22, 'farmland', 400, outerOk)`: `placeAt` a `'barn'` (scale 5,
      yaw 0) at (c.x - 10, c.z - 8), a `'silo'` (5) at (c.x + 16, c.z - 8), two `'haystack'` (1) at (c.x + 8, c.z + 8)
      and (c.x - 10, c.z + 10), a `'scarecrow'` (1) at (c.x - 2, c.z + 6); `walk()` at c and c + (0, 14); then
      `reserved.push(rectOf(c.x, c.z, 22, 22))`, `park('combine', 'farmland', c, 6, 14)`; then 80 `'broadleaf-tree'`
      through `treeAt` (`uni(0.9, 1.2)`) and 20 `'hay-bale'` scattered (scale 1, solid).
  - Replace the stub's doc comment with one line saying what it places.

## Contract
- `outerRing(id: 'dust-flats' | 'mossy-wood' | 'frostbite-fells' | 'cloverfield-farms'): void` keeps its name and
  signature, and the loop that calls it stays as it is.
- Nothing before the `// Outer ring` section changes.
- `waterPaths(): { id: string; points: [number, number][]; width: number }[]`,
  `waterBodies(): { id: string; minX: number; maxX: number; minZ: number; maxZ: number }[]` (world coordinates).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes (from the repo root).
- From `games/gnome-theft-auto`:
  `GOLDEN_OUT=C:/Users/cpsai/AppData/Local/Temp/claude/580443193e58038f/4ef1f3a1-2e4b-4e06-b989-b484b67e0320/scratchpad/3C.json npx vitest run src/layout.golden.test.ts`
  passes, then
  `node C:/Users/cpsai/AppData/Local/Temp/claude/580443193e58038f/4ef1f3a1-2e4b-4e06-b989-b484b67e0320/scratchpad/cmp.cjs C:/Users/cpsai/AppData/Local/Temp/claude/580443193e58038f/4ef1f3a1-2e4b-4e06-b989-b484b67e0320/scratchpad/golden.before.json C:/Users/cpsai/AppData/Local/Temp/claude/580443193e58038f/4ef1f3a1-2e4b-4e06-b989-b484b67e0320/scratchpad/3C.json`
  prints, for every `batch` line, `removed 0 (0 inside)` and `added N (0 inside)` with N > 0; for `world.walkPoints`
  and `world.parked`, `removed 0 (0 inside)`; for `world.boxes`, `removed 4 (4 inside), added ... (1 inside)` (those
  are the old fence and the Old Fence panel, from before your change). Anything else inside the old square means you
  changed the old scatter: undo that.
- `npx vitest run src/levels.test.ts src/destructibles.test.ts` passes (from `games/gnome-theft-auto`).
- Report how many items each batch gained.

## Out of scope
- Everything in `biomes.ts` above the `// Outer ring` section, `levels.ts`, any `.level.json`, the golden fixture,
  Loch Moss and Tallgrass Commons (they stay empty), `world.ts`, `hud.ts`.
