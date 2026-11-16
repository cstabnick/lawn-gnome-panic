Epic: 3 - Feature round 1 (all issues run in parallel)
Depends on: none (contracts for this round are already in config.ts, rules.ts, input.ts, audio.ts and main.ts; every new file exists as a stub)

## Environment
- Repo: `C:\Users\cpsai\cstabnick\lawn-gnome-panic` (Windows, Git Bash). Game: `games/gnaft` (Vite + TypeScript strict + three@0.187.0). If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not run `npm install` or add packages.
- **Other workers are editing other files in `games/gnaft/src` at the same time.** Edit ONLY the file(s) listed under Change. Never edit `config.ts`, `rules.ts`, `input.ts`, `main.ts`, `gnome.ts`, `mowerModels.ts` or another system's file unless your Change section lists it. A constant you need that is not in config.ts: declare it as a local `const` at the top of your file.
- Keep every existing exported function name and signature in your file exactly.
- Do not run `vite build`, `npm run dev`, or start any server. Do not `git commit`.
- All art is generated in code from three.js primitives (`MeshStandardMaterial`, `BoxGeometry`, `CylinderGeometry`, `ConeGeometry`, `SphereGeometry`, ...). No external assets. Set `castShadow = true` on solid meshes above the water.
- UI rule: if you create DOM, append your own container to `ctx.ui` (the shared `#ui` element) and style only your own elements inline. Never restyle, hide or clear `#ui` itself. `#ui` has `pointer-events:none`; set `pointer-events:auto` on your own clickable elements only.

## World conventions (read config.ts and rules.ts for the exact types)
- Each system is `createX(ctx: Ctx): System` with `System = { update(dt: number): void }`. `main.ts` calls, every frame and in this order: ocean, daynight, weather, raft, player, mowing, fishing, building, seagull, shark, navigation, minimap, objectives, music, save, hud; then `input.endFrame()`, then renders. `tickWorld` (day time, grass growth with rain/sprinkler multipliers, sea movement, docking) is already called by main before the systems, except in 'title'.
- Other state worth knowing (config.ts `GameState`): `dayTime` (0 sunrise, 0.25 noon, 0.5 sunset, 0.75 midnight), `raining`, `props` (sprinklers/flamingos on tiles), `stats` (cut, caught, tilesLost, gullsScared, sharksBonked), `won`, `time` (seconds played). Helpers in rules.ts: `sunHeight`, `nightAmount`, `edgeTiles`, `removeTile`, `revealIsland`, `raftExtent`, `tileAt`, `propAt`, `canBuild`.
- The raft never moves in the 3D scene: it stays around the origin and the sea moves past it. Raft tile (i, j) has its centre at world `(i * TILE_SIZE, RAFT_TOP, j * TILE_SIZE)`, TILE_SIZE = 2, RAFT_TOP = 0.3. Water surface is y = 0. The raft's velocity through the sea is `raftVelocity(state)` (rules.ts); things floating in the water move at `FISHING.current - raftVelocity`. Islands are drawn at `islandRelPos(state, id)`.
- `state.mode`: `'title' | 'play' | 'build' | 'telescope' | 'craft'`. A system only switches into its own mode from `'play'` and back to `'play'`.
- Player: `state.player.position` (feet, THREE.Vector3), `.velocity`, `.facing` (rotation.y; facing direction is `(Math.sin(facing), 0, Math.cos(facing))`).
- Input (`ctx.input`, src/input.ts): `down(code)`, `pressed(code)`, `mouseDown(0)`, `mousePressed(0)`, `mouseReleased(0)`, `look()` -> `{dx, dy}` pixel deltas (only while pointer-locked), `locked()`, `requestLock()`, `exitLock()`. Key codes are in `KEYS` in config.ts.
- Messages: `notify(state, text)` from rules.ts shows a toast. Sounds: `import { sfx, setEngine, startAudio } from './audio'`; `sfx(name: SfxName)`.
- Type-check: `npx tsc --noEmit -p games/gnaft`. Only errors in YOUR file(s) matter; errors elsewhere may be other workers mid-edit.

## Goal
Make the lawn-raft look loved: mowing stripes on freshly cut tiles, daisies on fully grown tiles, and white foam where raft edges meet the water.

## Read first
- games/gnaft/src/raft.ts: the current tile rendering (you extend it)
- games/gnaft/src/config.ts: `TILE_SIZE`, `RAFT_TOP`, `COLORS`

## Change
- games/gnaft/src/raft.ts (keep everything that works):
  - Mow stripes: create once a `THREE.CanvasTexture` from a 64 x 64 canvas with 4 alternating bands of light (#8bd06a) and dark (#4f9a3a) green. Each tile gets a thin plane (`PlaneGeometry(TILE_SIZE * 0.98, TILE_SIZE * 0.98)` rotated flat) 0.005 above its turf top, with its own `MeshStandardMaterial({ map: stripes, transparent: true })`. Opacity = clamp((0.5 - growth) * 2.5, 0, 0.85): visible right after a cut, fading as the grass regrows. Rotate the plane 90° on tiles where `(i + j)` is odd so stripes alternate like a real lawn. Hide when opacity is 0.
  - Daisies: each tile gets 3 small flowers at seeded random spots (reuse the per-tile LCG): white petals (a flattened `SphereGeometry(0.07)` scaled (1, 0.3, 1)) with a yellow centre (`SphereGeometry(0.03)`), on a thin green stem, standing about 0.25 m tall. Scale them from 0 to 1 as growth goes from 0.9 to 1 (hidden below 0.9). Shared geometries/materials.
  - Edge foam: for each side of a tile that has no neighbour tile, a white box strip (`TILE_SIZE` long, 0.12 wide, 0.04 tall) at y = 0.03 along that edge, slightly outside it, `MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })` shared. Pulse the shared material's opacity between 0.45 and 0.8 over time. Rebuild a tile's foam strips whenever the tile count changes (neighbours may have appeared or vanished).
  - Grass sway: rotate each tile's blade InstancedMesh slightly: `blades.rotation.z = Math.sin(t * 1.3 + i * 0.7 + j * 0.4) * 0.03` and `rotation.x` likewise with a different phase. Keep it subtle.

## Contract
`export function createRaft(ctx: Ctx): System` (unchanged). Read-only use of state.

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/raft.ts`.

## Out of scope
Props (building.ts draws sprinklers/flamingos), every other file.
