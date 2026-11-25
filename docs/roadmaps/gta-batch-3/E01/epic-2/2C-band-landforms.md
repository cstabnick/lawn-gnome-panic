Epic: E01-2 Fill (GTA batch 3, world expansion)
Depends on: none

## Environment
- Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af7a6a91d2dd2fbef` (a git worktree). Game: `games/gnome-theft-auto`.
- Git Bash. If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. `node_modules` is installed.
- Other workers are editing other files of this game at the same time (`src/hud.ts`, `src/world.ts`, `src/parks/*`,
  `src/biomes.ts`, `src/app.ts`, `docs/lore`). Touch only the files listed under Change. Do not commit. Do not run
  `vite build` or a dev server.
- Keep each existing file's line endings (use the Edit tool). JSON level documents are 2-space indented; edit only the
  `data.terrain` key.
- `src/layout.golden.test.ts` fails on purpose right now; never touch `src/data/layout.golden.json`.

## Goal
The map grew by four band regions round the old square (world coordinates, +z is south):
| region id | biome | area | document |
|---|---|---|---|
| `north-highlands` | highland | x -1400..1400, z -1400..-900 | `src/data/levels/north-highlands.level.json`, origin (0, -1150) |
| `south-shore` | coast | x -1400..1400, z 900..1400 | `src/data/levels/south-shore.level.json`, origin (0, 1150) |
| `east-campus` | campus | x 900..1400, z -900..900 | `src/data/levels/east-campus.level.json`, origin (1150, 0) |
| `west-estates` | estate | x -1400..-900, z -900..900 | `src/data/levels/west-estates.level.json`, origin (-1150, 0) |

They have no relief generator yet, so they are flat apart from the shared landscape features. Give each band a small
landform module (relief + paint), registered like the existing regions, so the ground rolls and is painted.

## Read first
- `games/gnome-theft-auto/src/landforms/tallgrassCommons.ts`: the template (DEFAULTS + `param()`, `relief`, `paint`).
- `games/gnome-theft-auto/src/landforms/types.ts`: `Landform`, `LandformInput`, `GroundFacts`, `PaintKind`
  (`'rock' | 'dirt' | 'gravel' | 'mud' | 'ice' | 'snow' | 'sand' | 'grass' | 'farm' | 'forest' | 'moss' | 'meadow'`).
  Relief must be cheap (at most 4 noise octaves); the caller already fades it to 0 at inner region borders and rivers.
- `games/gnome-theft-auto/src/landforms/index.ts`: the imports and `LANDFORMS` record.
- `games/gnome-theft-auto/src/landforms.test.ts`: `PROMISED_PAINT` (line ~34) and the per-region tests run for every
  key in it (relief sd > 0.5 m, heights -30..100, highways/trails drivable, at most 8 % of land steeper than 0.6,
  flat sites flat, buildings level, promised paint present).
- `games/gnome-theft-auto/src/landforms/noise.ts`: `fbm(x, y, seed, octaves)`, `ridged(...)`, `smoothstep(a, b, x)`.

## Change
- New `src/landforms/northHighlands.ts`: `export const landform: Landform = { id: 'gta-highland-relief', version: 1, ... }`.
  Relief: rolling high moor, `swell * fbm(x/swellScale, z/swellScale, 61, 3)` plus `crags * max(0, ridged(x/cragScale, z/cragScale, 63, 2) - 0.4)`,
  faded near roads with `smoothstep(10, 50, roadDistAt(x, z))` on the crag term (import `roadDistAt` from `./fields`).
  DEFAULTS `{ swell: 5, swellScale: 240, crags: 6, cragScale: 90 }`. Paint: `g.height > 32` -> `'snow'`; `g.slope > 0.3`
  -> `'gravel'`; else `'meadow'`.
- New `src/landforms/southShore.ts`: id `'gta-coast-relief'`, v1. Relief: dunes, `dunes * fbm(x/duneScale, z/duneScale, 71, 2)`
  with DEFAULTS `{ dunes: 2.5, duneScale: 70, swell: 2, swellScale: 300 }` plus the swell term. Paint: `z > 1130` -> `'sand'`
  (the beach and the shore to the edge); else `'grass'`.
- New `src/landforms/eastCampus.ts`: id `'gta-campus-relief'`, v1. Relief: gentle parkland, DEFAULTS
  `{ swell: 2.5, swellScale: 260 }`, `swell * fbm(x/swellScale, z/swellScale, 81, 2)`. Paint: always `'grass'`.
- New `src/landforms/westEstates.ts`: id `'gta-estate-relief'`, v1. Relief: DEFAULTS `{ swell: 3, swellScale: 220 }`,
  `swell * fbm(..., 91, 3)`. Paint: `fbm(x/120, z/120, 93, 2) > 0.25` -> `'meadow'`, else `'grass'`.
- `src/landforms/index.ts`: import the four (`import { landform as northHighlands } from './northHighlands';` etc.) and
  add them to `LANDFORMS` under their region ids.
- Each band document gets `data.terrain` (add the key inside `data`, after `border`), e.g. north-highlands:
  `"terrain": { "relief": { "id": "gta-highland-relief", "version": 1, "params": { "swell": 5, "swellScale": 240, "crags": 6, "cragScale": 90 } } }`
  and the same pattern with each module's id and DEFAULTS for the other three.
- `src/landforms.test.ts` `PROMISED_PAINT`: add
  `'north-highlands': ['meadow', 'snow']`, `'south-shore': ['sand', 'grass']`, `'east-campus': ['grass']`,
  `'west-estates': ['grass', 'meadow']`.
- If a test fails for a band (too steep, a highway too steep, heights out of range), lower that band's numbers (in the
  document params and DEFAULTS together) until it passes. If `snow` never shows in north-highlands, lower its height
  threshold (the ski-hill mountain peaks at about 60-65 m near (-350, -1300)).

## Contract
- Generator ids and versions exactly: `gta-highland-relief` 1, `gta-coast-relief` 1, `gta-campus-relief` 1,
  `gta-estate-relief` 1 (the documents' `data.terrain.relief.id`/`version` must equal them; index.ts throws otherwise).
- Do not change any other region's document or generator.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` succeeds.
- `npx vitest run src/landforms.test.ts src/levels.test.ts src/sites.test.ts src/terrain.test.ts src/terrainBiomes.test.ts` passes.
- `npx vitest run src/landforms.test.ts` reports the four band ids among its describe blocks.

## Out of scope
- `src/data/landscape.json` (the shared macro features), `src/terrain.ts`, `src/sites.ts`, every other region document
  and file. Do not move or resize any `slot` marker in the band documents.
