Epic: E01-2 Fill (GTA batch 3, world expansion)
Depends on: none

## Environment
- Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af7a6a91d2dd2fbef` (a git worktree). Game: `games/gnome-theft-auto`.
- Git Bash. If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. `node_modules` is installed.
- Other workers are editing other files of this game at the same time (`src/hud.ts`, `src/world.ts`, `src/parks/*`,
  `src/landforms/*` and the band level documents, `src/app.ts`, `docs/lore`). Touch only `src/biomes.ts`. Do not
  commit. Do not run `vite build` or a dev server.
- Keep the file's line endings (use the Edit tool).
- `src/layout.golden.test.ts` fails on purpose right now; never touch `src/data/layout.golden.json`.
- Repo rule: every object is an existing `@lawn/prefabs` prefab (check an id exists with
  `grep -rn "id: '<id>'" packages/prefabs/src/catalog` from the repo root). No hand-built meshes.

## Goal
The map grew by four band regions with no scenery at all (bare ground). Add a light procedural scatter pass for each
band in `buildBiomes`, so the bands look like places: trees, rocks and bushes in each band's look, kept off roads and
off every reserved site (later epics build there).

| region id | biome | area (world, +z south) | look | generator id (document `base.id`, version 1) |
|---|---|---|---|---|
| `north-highlands` | `highland` | x -1400..1400, z -1400..-900 | bare high moor: scattered pines, rocks, cairns | `gta-highland-scatter` |
| `south-shore` | `coast` | x -1400..1400, z 900..1400 | dunes: palms, rocks, bushes; nothing south of z 1140 (beach and sea) | `gta-coast-scatter` |
| `east-campus` | `campus` | x 900..1400, z -900..900 | parkland: broadleaf trees, round bushes | `gta-campus-scatter` |
| `west-estates` | `estate` | x -1400..-900, z -900..900 | old estates: broadleaf trees, topiary, bushes | `gta-estate-scatter` |

## Read first
- `games/gnome-theft-auto/src/biomes.ts`, `buildBiomes(scene)`:
  - `const batches: Record<'desert' | 'forest' | 'tundra' | 'farm', Batch>` (~line 176) and `batchByName` (~line 467).
  - The PRNG and world view: `rnd`, `half`, `oldFence`, `genRoads`, `anywhere()`, `free()`, `findSpot()`, `scatter()`,
    `treeAt()`, `fit()`, `uni()` (~lines 200-320). `free()` already refuses points near any highway, inside the city, and
    inside `reserved` (which holds every reserve marker and every site slot).
  - `startGenerator(id)` / `startOuter(id)` (~line 970) and the outer-ring loop near the end
    (`for (const id of ['dust-flats', 'mossy-wood', 'frostbite-fells', 'cloverfield-farms'] as const)`), then
    `rnd = noRandom; half = H;` and the `groups` list of static batches.
- `games/gnome-theft-auto/src/levels.ts`: `GENERATORS` (the four band ids map to the generator ids above, version 1),
  `REGIONS[id].base.seed`.

## Change
- `src/biomes.ts` only:
  1. Add four batches: extend the `batches` record type and value with `highland: [], coast: [], campus: [], estate: []`,
     and add `'highland-scenery': batches.highland, 'coast-scenery': batches.coast, 'campus-scenery': batches.campus,
     'estate-scenery': batches.estate` to `batchByName` (the band documents name these as their `data.batch`).
  2. Add a starter next to `startOuter`:
     ```ts
     /** Starts a batch-3 band's scatter (E01): the whole 2800 map, every highway, a PRNG stream from the document's seed. */
     const startBand = (id: RegionId): void => {
       const base = REGIONS[id].base;
       const want = GENERATORS[id];
       if (base.id !== want.id || base.version !== want.version) {
         throw new Error(`biomes: ${id} wants generator ${base.id} v${base.version}; this code is ${want.id} v${want.version}`);
       }
       rnd = mulberry32(base.seed ?? 0);
       half = H;
       oldFence = null;
       genRoads = HIGHWAYS;
     };
     ```
  3. After the outer-ring loop and BEFORE `rnd = noRandom; half = H;`, add one block per band (after
     `startBand('<id>')`), using only `treeAt` and `scatter` with the biome id from the table:
     - highland: 160 x `treeAt(Hl, rnd() < 0.6 ? 'cone-pine' : 'snow-pine', 'highland', uni(0.8, 1.2))`; 40 x
       `scatter(Hl, 'garden-rock', 'highland', fit('garden-rock', uni(1.5, 3.5)), true)`; 12 x
       `scatter(Hl, 'stone-cairn', 'highland', uni(0.9, 1.3), true)`.
     - coast: an `ok` filter `(p) => p.z < 1140`; 70 x `treeAt(C, 'palm-tree', 'coast', uni(0.9, 1.2), ok)`; 30 x
       `scatter(C, 'garden-rock', 'coast', fit('garden-rock', uni(1.2, 2.5)), true, anywhere, ok)`; 40 x
       `scatter(C, 'round-bush', 'coast', uni(0.7, 1.1), false, anywhere, ok)`.
     - campus: 140 x `treeAt(Cp, 'broadleaf-tree', 'campus', uni(0.9, 1.3))`; 50 x `scatter(Cp, 'round-bush', 'campus', uni(0.8, 1.2), false)`.
     - estate: 140 x `treeAt(Es, 'broadleaf-tree', 'estate', uni(0.9, 1.4))`; 30 x
       `scatter(Es, 'topiary-cone', 'estate', uni(0.9, 1.2), true)`; 40 x `scatter(Es, 'round-bush', 'estate', uni(0.8, 1.2), false)`.
     (`Hl`, `C`, `Cp`, `Es` = the four new batches.) Check every prefab id exists first (see Environment); if one does
     not, use the nearest existing one (`garden-rock`, `round-bush`, `broadleaf-tree`, `cone-pine`).
  4. Add the four batches to `groups`: `['highland-scenery', batches.highland]`, `['coast-scenery', batches.coast]`,
     `['campus-scenery', batches.campus]`, `['estate-scenery', batches.estate]`.
  5. Do not change any earlier generator, the order of earlier `rnd()` calls, or the outer-ring pass: the old 1800 x 1800
     square's scatter must come out exactly as before (the bands run last, on their own PRNG streams).

## Contract
- Batch names `highland-scenery`, `coast-scenery`, `campus-scenery`, `estate-scenery` (static cells via `buildStaticCells`).
- Nothing new lands inside a site rectangle (`src/sites.ts` `reservedRects()`), on a highway, or south of z 1140.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` succeeds.
- `npx vitest run src/biomes src/propsOffRoad.test.ts src/scenery.test.ts src/sites.test.ts src/critters.test.ts src/cull.test.ts src/levels.test.ts` passes (patterns that match no file are fine).
- A quick check you add to your report (not a committed test): count of placements per new batch (each > 0), e.g. by a
  temporary `console.log` you remove again.

## Out of scope
- Every file but `src/biomes.ts`. Settlements, fringe belts and roadside hedges in the bands. The golden fixture.
