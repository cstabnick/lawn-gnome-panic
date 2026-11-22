Epic: 3 (Wild World: world expansion and the region map)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, use absolute paths).
- Git Bash: if `node` is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first. Dependencies are installed.
- Five other workers are editing other files at the same time (`src/world.ts`, `src/textures.ts`, `src/biomes.ts`,
  `src/config.ts`, `src/gnomes.ts`, `tools/level-editor`, `docs/lore`). Do not touch their files. If a type-check
  error is in a file you do not own, wait a minute and rerun; do not fix it.
- Do not commit, push or open a PR. Do not run `npm run build` (it writes `dist/`) and do not run `UPDATE_GOLDEN=1`.
- You are the only worker allowed to start a dev server, and only on port 5291 (see Done when). Stop it when done.
- Repo rules: UI modules append to the shared `#ui` element and never restyle it; every game plays on a phone, so check
  the map at a phone viewport (390x844 portrait and 844x390 landscape) as well as desktop.

## Goal
The minimap and the big map (press M, or tap the minimap) show the 1800 x 1800 world as it now is: each region filled
from its border polygon, Loch Moss and Tallgrass Commons in their own colours, the reserved river course and the two
still-water bodies drawn in water blue under the roads, and one name label per region on the big map.

## Read first
- `games/gnome-theft-auto/src/hud.ts`: `MAP` colours (around line 268), `buildBackground(world)` (around 355-460:
  1 px per world unit, mirrored in x by `X = (x) => H - x`, `Y = (z) => H - z`, the `poly()` helper), and `drawBig`
  (around 675-745, the "Biome names, one per wedge" labels).
- `games/gnome-theft-auto/src/levels.ts`: `REGIONS`, `REGION_IDS`, `Region.border` (world coordinates),
  `waterPaths()`, `waterBodies()`.

## Change
- `games/gnome-theft-auto/src/hud.ts`:
  - `import { REGIONS, REGION_IDS, waterBodies, waterPaths } from './levels';`
  - `MAP` gains `loch: 0x3f7f6a` (deep moss green), `parkland: 0xb6e05a` (bright meadow), `water: 0x3d8fd6`.
  - In `buildBackground`, replace the four wedge `poly(...)` calls with one `poly(REGIONS[id].border, MAP[REGIONS[id].data.region])`
    per region in `REGION_IDS` order, skipping `'turfton'` (the city rectangle drawn after it stays). Update the
    comment above (no more diagonals: "Regions from their border polygons (data.border in the region documents)").
  - Right after the regions and the Turfton rectangle, before the roads: fill each `waterBodies()` rectangle with
    `MAP.water` (use the existing `rect()` helper), then stroke each `waterPaths()` polyline with
    `g.strokeStyle = hexColor(MAP.water)`, `g.lineWidth = p.width`, `g.lineCap = 'round'`, `g.lineJoin = 'round'`
    (moveTo / lineTo through `X()`, `Y()`). The roads drawn after it sit on top, which shows the bridge points.
  - In `drawBig`, replace the five hard-coded `lab(...)` calls with one label per region: `lab(REGIONS[id].name, x, z)`
    at the region's label point. Label point: the average of its border vertices, except Loch Moss at (-720, -720)
    and Tallgrass Commons at (-720, 720) (their vertex average lands on their inner corner). Keep the font and colour.
    On a small big map (CSS size under 360 px) use `'700 10px system-ui,sans-serif'` so the names do not collide.
  - Nothing else: the minimap window (`MAP_VIEW` / `MAP_RANGE`), blips, pins and the far-player rim logic already
    work from `world.half` and need no change. Check, do not change, that a player 1700 units away still shows on the
    minimap rim and on the big map.

## Contract
- `Region.border: [number, number][]` in world coordinates; `REGIONS[id].data.region` is a `BiomeId`
  (`'city' | 'desert' | 'forest' | 'tundra' | 'farmland' | 'loch' | 'parkland'`); `REGIONS[id].name` is the display name.
- `waterPaths(): { id: string; points: [number, number][]; width: number }[]` and
  `waterBodies(): { id: string; minX: number; maxX: number; minZ: number; maxZ: number }[]`, world coordinates.
- `createHud(ui)` and the `Hud` interface are unchanged.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes (from the repo root).
- Visual check on a dev server on its own port (from `games/gnome-theft-auto`):
  `npx vite --port 5291 --strictPort` in the background, then
  `bash /c/Users/cpsai/orca/workspaces/lawn-gnome-panic/pomfret/tools/smoke.sh http://localhost:5291/ gta-hud` reports
  no console errors. Take headless Edge screenshots at 390x844, 844x390 and 1280x800, e.g.
  `"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --virtual-time-budget=9000 --window-size=390,844 --screenshot=C:/Users/cpsai/AppData/Local/Temp/claude/580443193e58038f/4ef1f3a1-2e4b-4e06-b989-b484b67e0320/scratchpad/3B-390.png http://localhost:5291/`
  and look at them (Read the png). If the big map cannot be opened in a screenshot, temporarily call `setBig(true)`
  from a `?bigmap` query check while you look, then remove that code before you finish. Report what you saw at each size
  (minimap regions and river visible; big map labels readable and inside the canvas). Stop the dev server.

## Out of scope
- `src/world.ts`, `src/textures.ts`, `src/biomes.ts`, `src/config.ts`, `src/levels.ts`, any `.level.json`, the golden
  fixture, `src/app.ts`. No new buttons or keys.
