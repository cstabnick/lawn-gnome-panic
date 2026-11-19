Epic: 1 (Modules), issue 1E: HUD for guns, flight and the big world (hud.ts)
Depends on: none

## Environment
Working directory: C:\Users\cstab\Documents\gaming (Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnome-theft-auto (Vite + TypeScript + three.js 0.187). Several other workers are editing other files of this game at the same time: change only the files named under "Change". Do not run `npm run build` or `npm run dev`, do not start servers, do not git commit.
The check is `npx tsc --noEmit -p games/gnome-theft-auto`. An error in a file you do not own means another worker is mid-edit: ignore it unless your change caused it. NEVER edit types.ts, config.ts or collide.ts: they are final contracts, already written. Read them first (types.ts: every interface; config.ts: WORLD_HALF, CITY_HALF, ROAD_LINES, BIOMES, biomeAt, HIGHWAYS, BASE, AIRFIELD, VIEW, BUILDINGS, VEHICLES, FLY, GUNS, BULLET, CHUTE).
Conventions: y is up, 1 unit = one gnome's height (about 1.3). Yaw 0 faces +z, forward = (sin yaw, 0, cos yaw), turning right DECREASES yaw. The ground is flat (y = 0) everywhere. No per-frame allocation in hot loops (reuse scratch vectors). Free assets only: everything is built from code or from @lawn/prefabs (prefabs are data in packages/prefabs/src/catalog). The game is a gnome parody (lore setting: apocrypha): keep any text dry and cartoon-safe, no gore, no real brands.
The world: a 1200 x 1200 flat map. Turfton (the city grid, |x|,|z| <= 215) in the middle; outside it four biomes split along the diagonals: desert east (Fort Sandpit and the airfield with two planes), forest west, tundra north, farmland south, joined to the city by highways (config.ts HIGHWAYS).

## Goal
The HUD shows a centred crosshair, ammo and reload state, flight and parachute readouts, the biome name, correct controls help, and a minimap that works for a 1200-unit world (a window around the player, with roads and biomes).

## Read first
- games/gnome-theft-auto/src/hud.ts: the whole file (bars, gun row, crosshair, minimap code `drawBackground`, `sizeMap`, the `set` function and its `last` cache).
- games/gnome-theft-auto/src/types.ts: `Hud` (now has `setWorld(world)`), `HudState` (now `ammo`, `mag`, `reloading`, `altitude`, `speed`, `chute`, `biome`; `tank` is gone), `World` (`roads.nodes`, `biomeAt`, `base`, `airfield`, `half`).
- games/gnome-theft-auto/src/config.ts: `GUNS`, `BIOME_GROUND`, `BIOME_NAMES`, `CITY_HALF`, `ROAD_WIDTH`, `WORLD_HALF`, `COLORS`, `AIRFIELD`, `BASE`.

## Change
- games/gnome-theft-auto/src/hud.ts:
  - Remove the "Tank" bar. Add an ammo readout in the gun row: `ammo / mag` big and clear, and the text RELOADING (pulsing) while `reloading`. Keep the gun icon (`prefabIconElement(GUNS[kind].prefab, ...)`, find the kind by name as the code does).
  - The crosshair is exactly at the screen centre (50%, 50%), always shown on foot, driving and under a parachute, and also shown when flying. Make it a small dot with four ticks that is visible on light and dark backgrounds.
  - Flight panel: when `altitude !== null` show `ALT n m` (round to integer) and, when `speed !== null`, `SPD n`; show `PARACHUTE` when `chute` is true. Hide the panel when altitude is null.
  - Biome label: when `biome` changes show it as a large fading label at the top centre for 3 seconds (CSS transition, no per-frame DOM writes). Cache every value in `last` as the code does so the DOM is written only on change.
  - Help text: desktop `WASD move . mouse look . click fire . R reload . Q swap gun . E enter/exit . Space jump / climb . Shift descend . bail out of a plane in the air with E`; touch `Stick to move . drag to look . Fire . Reload . Enter / Exit`.
  - Minimap: implement `setWorld(world)`. Render a static background once into an offscreen canvas at 1 pixel per world unit (1200 x 1200): fill with the city colour, draw the four biome wedges (triangles from the origin to the world corners, colours `BIOME_GROUND`) outside the city square (`CITY_HALF`) and the city square on top; then every road: for each node, each link to a node with a greater id, draw a line of width `ROAD_WIDTH` in `COLORS.road` between them (`world.roads.nodes` with `links` ids); the Fort Sandpit rectangle (`world.base`, `COLORS.sand`, wall outline) and the runway (`world.airfield`: a rectangle `length` x `width` rotated by `yaw`, forward = (sin yaw, cos yaw)). Each frame draw onto the visible minimap canvas the sub-rectangle of the background that is within 150 units of the player (north-up, clipped at the world edge; fill the rest dark), then the blips within range, then the player arrow. The minimap keeps its present size and corner. Before `setWorld` is called, draw nothing but the player.
  - `set(s)` must tolerate `s.altitude`, `s.speed` null.

## Contract
`createHud(ui: HTMLElement): Hud` with `setWorld(world: World)`, `set(s: HudState)`, `toast(text, ms?)`, `banner(text, ms?)`. UI modules append their own container to `ui` and never restyle `ui` itself. Must stay usable at a 390 x 844 phone viewport (no overlap of the minimap and the left bars; touch targets are not yours).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` reports no error in hud.ts.

## Out of scope
types.ts, config.ts, main.ts, input.ts (it owns the touch buttons), every other file.
