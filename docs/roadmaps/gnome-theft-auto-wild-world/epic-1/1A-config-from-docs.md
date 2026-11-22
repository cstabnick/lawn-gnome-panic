Epic: 1 (World as level documents, flat parity)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, use absolute paths).
- Git Bash: if `node` is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first. Dependencies are installed.
- Two other workers are editing other files of `games/gnome-theft-auto` at the same time (`src/biomes.ts`,
  `src/world.ts`, and `tools/level-editor`). Do not touch their files. If a type-check or test error is in a file you
  do not own, wait a minute and rerun; do not fix it.
- Do not commit, push or open a PR. Do not run `npm run build` (it writes `dist/`) or start a dev server.

## Goal
`src/config.ts` keeps only tuning numbers. Its layout constants (world size, city grid, biome names and colours,
highways, Fort Sandpit, the airfield, the spawn and the Turfton landmarks) become values derived from the level
documents through `src/levels.ts`, with the same names and the same values, so every existing import keeps working.
The quest givers' positions in `src/quests/defs.ts` come from the documents too.

## Read first
- `games/gnome-theft-auto/src/levels.ts`: the loader. Use `LAYOUT`, `REGIONS`, `regionOf`, `marker`, `markerNum`,
  `highways`. Coordinates it returns are world coordinates; offsets inside marker `data` (`dx`, `dz`) are relative to
  the marker.
- `games/gnome-theft-auto/src/data/levels/turfton.level.json` and `dust-flats.level.json`: the markers you read
  (kinds `spawn`, `landmark`, `area`, `portal`, `giver`, `site`) and `data.grid`.
- `games/gnome-theft-auto/src/config.ts` lines 1-101: the constants to derive.
- `games/gnome-theft-auto/src/quests/defs.ts` lines 1-132: `GIVERS`.

## Change
- `games/gnome-theft-auto/src/config.ts`: add `import { LAYOUT, REGIONS, highways, marker, markerNum, regionOf } from './levels';`
  and replace the literal values of these exports with derived ones. Keep every export name, keep the doc comments
  (adjust "the ground is flat..." wording only if you like), keep the tuning constants (`ROAD_WIDTH`,
  `SIDEWALK_WIDTH`, `LANE_OFFSET`, `VIEW`, `BUILDINGS`, `COLORS`, everything from line 112 on) exactly as they are.
  Do not change `biomeAt`, `BIOMES` or `PLACES` (PLACES already reads the derived landmark constants).
  Exact derivations (`turf = REGIONS.turfton`, `grid = turf.data.grid!`):
  - `WORLD_HALF = LAYOUT.worldHalf`
  - `CITY_HALF = grid.half`; `ROAD_LINES: readonly number[] = grid.lines`; `ROAD_PITCH = grid.pitch`
  - `BIOME_NAMES` and `BIOME_GROUND`: for each `BiomeId` b in `city, desert, forest, tundra, farmland`,
    `regionOf(b).name` and `regionOf(b).data.ground`.
  - `HIGHWAYS: readonly Highway[] = highways().map((h) => ({ id: h.id, points: h.points }))` (keep the `Highway` interface).
  - `BASE`, from `const fort = marker('site', 'fort-sandpit')`, `w = markerNum(fort, 'w')`, `d = markerNum(fort, 'd')`:
    `minX: fort.x - w / 2, maxX: fort.x + w / 2, minZ: fort.z - d / 2, maxZ: fort.z + d / 2,
    gateX: fort.x + markerNum(fort, 'gate', 'dx'), gateZ: fort.z + d / 2, gateWidth: markerNum(fort, 'gate', 'width'),
    padX: fort.x + markerNum(fort, 'pad', 'dx'), padZ: fort.z + markerNum(fort, 'pad', 'dz'),
    wallHeight: markerNum(fort, 'wallHeight'),
    guardPosts: (fort.data!.guardPosts as { dx: number; dz: number }[]).map((g) => ({ x: fort.x + g.dx, z: fort.z + g.dz }))`.
  - `AIRFIELD`, from `const af = marker('site', 'airfield')`: `x: af.x, z: af.z, yaw: markerNum(af, 'yaw'),
    length: markerNum(af, 'length'), width: markerNum(af, 'width'), planeSpots: (af.data!.planeSpots as
    { dx: number; dz: number; yaw: number; kind: string }[]).map((p) => ({ x: af.x + p.dx, z: af.z + p.dz, yaw: p.yaw, kind: p.kind as VehicleKind }))`.
  - `SPAWN`, from `marker('spawn', 'player')`: `{ x, z, yaw: markerNum(m, 'yaw') }`.
  - Landmarks, each from `const m = marker('landmark', <id>)`; `{ x: m.x, z: m.z, ... }` plus:
    `MULCH_CLUB` ('mulch-club'): `footprint`. `HOSPITAL` ('hospital'): `footprint`, `respawn: { x: m.x + respawn.dx,
    z: m.z + respawn.dz, yaw: respawn.yaw }`. `BODEGA` ('bodega'): `footprint`. `SIDE_VALVE` ('side-valve'):
    `footprint`, `bay: { x: m.x + bay.dx, z: m.z + bay.dz }`. `PAY_N_GLAZE` ('pay-n-glaze'): `footprint`,
    `bay: { x: m.x + bay.dx, z: m.z + bay.dz, radius: bay.radius }`. `GNOMECINO` ('gnomecino'): `footprint`.
    `THORNE_TOWER` ('thorne-tower'): `footprint`, `height`. `CLAY_MART` ('clay-mart'): `footprint`.
    `AMPHITHEATER` ('amphitheater'): `footprint`. `GNOMA_TRUCK` ('gnoma-truck'): `yaw`.
    Read every nested number with `markerNum(m, 'respawn', 'dx')` style calls.
  - `PATIO_HEIGHTS` and `GREENHOUSE_STRIP`, from `marker('area', 'patio-heights' | 'greenhouse-strip')` with
    `w`, `d`: `{ minX: m.x - w / 2, maxX: m.x + w / 2, minZ: m.z - d / 2, maxZ: m.z + d / 2 }`.
  - `CULVERT_PORTALS = { downtown: { x, z } of marker('portal', 'culvert-downtown'), canal: { x, z } of marker('portal', 'culvert-canal') }`.
  - Types: the old values were `as const` objects. Give each derived constant an explicit readonly type (an
    interface or an inline `{ readonly x: number; ... }`), so callers that read the fields still type-check. Do not
    add `as const` to derived values.
- `games/gnome-theft-auto/src/quests/defs.ts`: keep every giver's `id`, `name`, `label`, `room`, `letter` as they are;
  take `x`, `z` and `exit` from the documents with a helper:
  ```ts
  import { marker, markerNum } from '../levels';
  /** A giver's position and exit, from its `giver/<id>` marker in the level documents. */
  function placed(id: string): { x: number; z: number; exit: { x: number; z: number; yaw: number } } {
    const m = marker('giver', `giver/${id}`);
    return { x: m.x, z: m.z, exit: { x: m.x + markerNum(m, 'exit', 'dx'), z: m.z + markerNum(m, 'exit', 'dz'), yaw: markerNum(m, 'exit', 'yaw') } };
  }
  ```
  and write each entry as `'pip-spawn': { id: 'pip-spawn', name: ..., label: ..., ...placed('pip-spawn'), room: ..., letter: ... }`.
  Remove the now-unused `BODEGA, GNOMECINO, SIDE_VALVE` import. Every giver in `GIVERS` has a marker (12 givers).

## Contract
- Every export of `config.ts` keeps its name and its value. The golden test compares them all (rounded to 4
  decimals, tolerance 2e-4) against `src/data/layout.golden.json`, which you must never edit or regenerate
  (never set `UPDATE_GOLDEN`).
- `levels.ts` must not import `config.ts` (config imports levels). Do not edit `levels.ts`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- `npm test -w games/gnome-theft-auto` passes, including `src/layout.golden.test.ts` and `src/levels.test.ts`. (If the
  golden test fails only on `batches`, `world.boxes` or `scene`, that may be the biomes worker mid-edit: check that the
  `layout` and `givers` sections of the diff are clean, wait, rerun.)
- `grep -n "= 600\|= 215\|\[180, 0\]\|minX: 340\|x: -30, z: -30" games/gnome-theft-auto/src/config.ts` finds no
  layout literals left.

## Out of scope
- `src/biomes.ts`, `src/world.ts`, `src/levels.ts`, the JSON files under `src/data/`, `tools/level-editor/`.
- Positions in other modules (npcs, districts, easter eggs...): they stay as they are in this epic.
