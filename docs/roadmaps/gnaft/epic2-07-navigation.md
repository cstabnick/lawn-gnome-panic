Epic: 2 - Systems (all issues run in parallel)
Depends on: none (foundation done: config.ts, rules.ts, input.ts, main.ts and stubs exist and build)

## Environment
- Repo: `C:\Users\cpsai\cstabnick\lawn-gnome-panic` (Windows, Git Bash). Game: `games/gnaft` (Vite + TypeScript strict + three@0.187.0). If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not run `npm install` or add packages.
- **Other workers are editing other files in `games/gnaft/src` at the same time.** Edit ONLY the file(s) listed under Change. Never edit `config.ts`, `rules.ts`, `input.ts`, `main.ts`, `gnome.ts`, `mowerModels.ts` or another system's file unless your Change section lists it. A constant you need that is not in config.ts: declare it as a local `const` at the top of your file.
- Keep every existing exported function name and signature in your file exactly.
- Do not run `vite build`, `npm run dev`, or start any server. Do not `git commit`.
- All art is generated in code from three.js primitives (`MeshStandardMaterial`, `BoxGeometry`, `CylinderGeometry`, `ConeGeometry`, `SphereGeometry`, ...). No external assets. Set `castShadow = true` on solid meshes above the water.
- UI rule: if you create DOM, append your own container to `ctx.ui` (the shared `#ui` element) and style only your own elements inline. Never restyle, hide or clear `#ui` itself. `#ui` has `pointer-events:none`; set `pointer-events:auto` on your own clickable elements only.

## World conventions (read config.ts and rules.ts for the exact types)
- Each system is `createX(ctx: Ctx): System` with `System = { update(dt: number): void }`. `main.ts` calls, every frame and in this order: ocean, raft, player, mowing, fishing, building, navigation, hud; then `input.endFrame()`, then renders. `tickWorld` (grass growth, sea movement, docking) is already called by main before the systems.
- The raft never moves in the 3D scene: it stays around the origin and the sea moves past it. Raft tile (i, j) has its centre at world `(i * TILE_SIZE, RAFT_TOP, j * TILE_SIZE)`, TILE_SIZE = 2, RAFT_TOP = 0.3. Water surface is y = 0. The raft's velocity through the sea is `raftVelocity(state)` (rules.ts); things floating in the water move at `FISHING.current - raftVelocity`. Islands are drawn at `islandRelPos(state, id)`.
- `state.mode`: `'title' | 'play' | 'build' | 'telescope' | 'craft'`. A system only switches into its own mode from `'play'` and back to `'play'`.
- Player: `state.player.position` (feet, THREE.Vector3), `.velocity`, `.facing` (rotation.y; facing direction is `(Math.sin(facing), 0, Math.cos(facing))`).
- Input (`ctx.input`, src/input.ts): `down(code)`, `pressed(code)`, `mouseDown(0)`, `mousePressed(0)`, `mouseReleased(0)`, `look()` -> `{dx, dy}` pixel deltas (only while pointer-locked), `locked()`, `requestLock()`, `exitLock()`. Key codes are in `KEYS` in config.ts.
- Messages: `notify(state, text)` from rules.ts shows a toast. Sounds: `import { sfx, setEngine, startAudio } from './audio'`; `sfx(name: SfxName)`.
- Type-check: `npx tsc --noEmit -p games/gnaft`. Only errors in YOUR file(s) matter; errors elsewhere may be other workers mid-edit.

## Goal
Three islands out at sea, a telescope to spot them, charting a course to sail there, and crates to loot once docked.

## Read first
- games/gnaft/src/config.ts: `ISLANDS`, `ISLAND_ORDER`, `IslandId`, `TELESCOPE`, `SEA`, `KEYS`, `TUNING`, `RAFT_TOP`, `COLORS.sand`
- games/gnaft/src/rules.ts: `islandRelPos`, `chartCourse`, `castOff`, `lootCrate`, `notify`
- games/gnaft/src/mowerModels.ts: only the signature `createMowerModel(tier: MowerTier): MowerModel` (`.group`, `.setNight(0)`)

## Change
- games/gnaft/src/navigation.ts: implement `createNavigation(ctx: Ctx): System`.
  - Island visuals: one `THREE.Group` per id, positioned every frame at `islandRelPos(state, id)` (y 0):
    - Sand mound: `CylinderGeometry(radius, radius + 4, 1.2, 40)` colour `COLORS.sand`, top at y = RAFT_TOP (centre y = RAFT_TOP - 0.6). A green grass patch on top (thin cylinder, radius * 0.5).
    - 3 palm trees (trunk of a few stacked, slightly offset cylinders; 5 green flattened boxes as leaves) near the edge.
    - Theme props: scrapyard = grey heaps of `DodecahedronGeometry` (metalness 0.6, roughness 0.5) and a small rusty shed; fuelDepot = clusters of red drum cylinders and a gas pump (box with a hose); mowerGraveyard = 4 `createMowerModel('red')` groups scaled 1.3, tilted and half-sunk in the sand (`setNight(0)` on each).
    - Crates: crate k of `ISLANDS[id].crates` is a wooden box (0.8 m, colour 0x9c6b3c) on the top at angle `k * 2 * Math.PI / n`, distance `radius * 0.55` from the centre. When `state.islands[id].looted[k]`, show it opened (lid removed, darker colour).
    - Beacon: once `state.islands[id].spotted`, a tall thin cylinder (height 80, radius 0.6) `MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.55, fog: false })` at the island centre, visible from far away. Hidden while docked at that island.
  - Crates: in mode 'play' when `state.sea.docked === id`, find the nearest unlooted crate within 1.8 m (xz) of the player. While one is in range show your own `<div id="rg-prompt">E: open crate</div>` (appended to `ctx.ui`, centred at 60% height). `KEYS.interact` pressed -> `lootCrate(state, id, k)` -> `sfx('loot')`.
  - Cast off: mode 'play', `KEYS.chart` pressed and `state.sea.docked` set -> `castOff(state)`, `sfx('click')`.
  - Telescope: `KEYS.telescope` pressed in 'play': if `!state.hasTelescope` -> `notify(state, 'Craft a telescope first (Tab)')`; else `state.mode = 'telescope'`, `camera.fov = TELESCOPE.fov`, `camera.updateProjectionMatrix()`, `(ctx.scene.fog as THREE.Fog).near = SEA.fogFar; .far = TELESCOPE.range` (so distant islands show), scope yaw = player facing, pitch = 0. `KEYS.telescope` pressed in 'telescope' -> 'play' and restore `camera.fov = TELESCOPE.normalFov` and fog near/far = `SEA.fogNear` / `SEA.fogFar`. If the mode leaves 'telescope' any other way, restore the same.
    - In 'telescope': `yaw -= dx * TUNING.mouseSensitivity * (TELESCOPE.fov / TELESCOPE.normalFov)`, `pitch += dy * (same factor)`, clamped to ±0.6. Camera position = player position + (0, 1.3, 0); look direction d = (sin(yaw) cos(pitch), sin(pitch), cos(yaw) cos(pitch)); `camera.lookAt(position + d)`. You run after the player system each frame, so your camera pose wins.
    - Aim: for each island within TELESCOPE.range: bearing = `Math.atan2(rel.x, rel.z)`, difference to yaw wrapped into [-π, π]; the aimed island is the one with the smallest |difference| under `TELESCOPE.aimToleranceDeg` (degrees). Aimed and not spotted: spot timer += dt (reset when the aimed island changes); at `TELESCOPE.spotSeconds` set `state.islands[id].spotted = true`, `notify(state, 'Spotted ' + name + '! Press C to chart a course.')`, `sfx('spot')`. Aimed, spotted and `KEYS.chart` pressed -> `chartCourse(state, id)`, `sfx('click')`.
    - Scope overlay: your own full-screen `<div id="rg-scope">` appended to `ctx.ui`, shown only in 'telescope': `background: radial-gradient(circle, transparent 38%, rgba(0,0,0,0.92) 40%)`, a thin crosshair, a label under the centre: aimed island name + distance in metres + 'C: chart course' when spotted; a progress % while spotting; otherwise 'Scanning the horizon...'. Plus 'T: put the telescope away'.
  - Compass: your own `<div id="rg-compass">` top-centre, shown whenever mode !== 'title': `Sailing to <name> — <dist> m` when `state.sea.course`; `Docked at <name> — C to cast off` when docked; else `Drifting...`.

## Contract
`export function createNavigation(ctx: Ctx): System` (unchanged signature). You own `state.mode` transitions in/out of 'telescope' and the camera while in it. `sfx` from './audio'.

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/navigation.ts`.

## Out of scope
Sea movement and docking (rules.ts `tickWorld` already does them), player movement, every other file.
