Epic: 3 (Wild World: world expansion and the region map)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, use absolute paths).
- Git Bash: if `node` is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first. Dependencies are installed.
- Five other workers are editing other files at the same time (`src/hud.ts`, `src/biomes.ts`, `src/config.ts`,
  `src/gnomes.ts`, `tools/level-editor`, `docs/lore`). Do not touch their files. If a type-check error is in a file
  you do not own, wait a minute and rerun; do not fix it.
- Do not commit, push or open a PR. Do not run `npm run build` (it writes `dist/`), do not start a dev server, and do
  not run `UPDATE_GOLDEN=1` (the planner regenerates the golden fixture once at the end).
- Repo rule (3D): anything laid flat on the ground takes a draw layer (`flatLayer(material, LAYER.<x>)` from
  `@lawn/depth`), and two coplanar ground pieces must never overlap.

## Goal
The 3D ground is drawn from the region borders instead of four diagonal triangles: one flat polygon per region (the
L-shaped corners included), each tinted by its own ground texture, and Loch Moss and Tallgrass Commons get their own
procedural ground textures.

## Read first
- `games/gnome-theft-auto/src/world.ts` lines 100-145 (`merged`, `groundPoly`) and 630-662 (the ground: base plane,
  the `biomeTris` wedges, the city square).
- `games/gnome-theft-auto/src/textures.ts`: `GroundKind`, `TILE`, `make()` (one `case` per kind, lines 80-175).
- `games/gnome-theft-auto/src/levels.ts`: `REGIONS`, `REGION_IDS`, `Region.border` (world coordinates).

## Change
- `games/gnome-theft-auto/src/textures.ts`:
  - `GroundKind` gains `'moss'` (Loch Moss: damp moss and peat, darker blue-green than `forest`, with a few grey
    pebbles) and `'meadow'` (Tallgrass Commons: bright yellow-green grass with small white and yellow flower dots).
    Add both to `TILE` (`moss: 10, meadow: 9`) and a `case` each in `make()`, written like the `grass` / `forest`
    cases (same helpers: `dots`, `shade`, `wrap`; a base fill colour then dots). Update the file's first comment line.
- `games/gnome-theft-auto/src/world.ts`:
  - Add `import { REGIONS, REGION_IDS } from './levels';` (merge into an existing levels import if there is one).
  - Replace the `biomeTris` array and its loop with a loop over `REGION_IDS` that skips `'turfton'` (the city square
    stays exactly as it is) and, for each other region `r = REGIONS[id]`, draws `r.border` as one flat polygon at
    y = 0.004 on `LAYER.tint` with `merged([geo], BIOME_GROUND[r.data.region], LAYER.tint, kind)`, where `kind` is
    `{ desert: 'sand', forest: 'forest', tundra: 'snow', farmland: 'farm', city: 'grass', loch: 'moss', parkland: 'meadow' }[r.data.region]`
    (type it `Record<BiomeId, GroundKind>`).
  - Replace `groundPoly` with a version that triangulates any simple polygon (the borders are non-convex L shapes):
    ```ts
    /** A flat ground polygon at height y (any simple polygon, either winding), triangulated, facing up. */
    function groundPoly(pts: [number, number][], y: number): THREE.BufferGeometry
    ```
    Use `THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), [])`, which returns index
    triples. For each triangle (a, b, c) compute `up = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)` and
    emit it as a, c, b when `up > 0`, else a, b, c (this is the winding the old wedge code used to face +y; a triangle
    wound the other way renders almost black). Write a non-indexed `position` attribute and a `normal` attribute of
    (0, 1, 0) per vertex, as the old function did. The caller no longer flips the winding.
  - Keep the comment block above the ground describing the draw layers; change "one triangle per biome" to "one
    polygon per region (data.border)".
  - The base plane (`PlaneGeometry(H * 2, H * 2)` at y = -0.12) stays; it already follows `WORLD_HALF` (900 now).

## Contract
- `GroundKind = 'grass' | 'asphalt' | 'pavement' | 'sand' | 'forest' | 'snow' | 'farm' | 'moss' | 'meadow'`.
- `Region.border: [number, number][]` (world x, z), for example Loch Moss
  `[[-900,-900],[-300,-900],[-300,-600],[-600,-600],[-600,-300],[-900,-300]]`. The seven borders tile the
  1800 x 1800 square with no overlap, so the polygons never z-fight each other.
- `buildWorld`'s exports and the `World` object are unchanged.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes (run from the repo root).
- `npx vitest run src/levels.test.ts src/world*.test.ts src/collide.test.ts` passes from `games/gnome-theft-auto`
  (`src/layout.golden.test.ts` is expected to fail until the planner regenerates it; do not edit it).
- `GOLDEN_OUT=C:/Users/cpsai/AppData/Local/Temp/claude/580443193e58038f/4ef1f3a1-2e4b-4e06-b989-b484b67e0320/scratchpad/3A.json npx vitest run src/layout.golden.test.ts`
  (from `games/gnome-theft-auto`) passes, then
  `node C:/Users/cpsai/AppData/Local/Temp/claude/580443193e58038f/4ef1f3a1-2e4b-4e06-b989-b484b67e0320/scratchpad/cmp.cjs C:/Users/cpsai/AppData/Local/Temp/claude/580443193e58038f/4ef1f3a1-2e4b-4e06-b989-b484b67e0320/scratchpad/golden.before.json C:/Users/cpsai/AppData/Local/Temp/claude/580443193e58038f/4ef1f3a1-2e4b-4e06-b989-b484b67e0320/scratchpad/3A.json`
  shows `removed 0 (0 inside)` for every `batch` line and `world.walkPoints` (your change touches only scene
  meshes). Report the `scene:` line it prints.
- In your report, say how many triangles the six region polygons produced in total (log it once from a quick test or
  count by hand: a polygon of n vertices gives n - 2).

## Out of scope
- `src/hud.ts` (the minimap), `src/biomes.ts`, `src/config.ts`, `src/levels.ts`, any `.level.json`, the golden
  fixture. Heights (y stays 0 + the existing lifts).
