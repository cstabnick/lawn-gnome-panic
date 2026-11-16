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
The HUD shows the time of day and the weather, and the title screen lists the new controls and says 'Continue' for a saved game.

## Read first
- games/gnaft/src/hud.ts: the current HUD (you extend it)
- games/gnaft/src/config.ts: `DAY`, `GameState.dayTime`, `GameState.raining`, `GameState.time`, `BUILD_COSTS`
- games/gnaft/src/rules.ts: `nightAmount`

## Change
- games/gnaft/src/hud.ts (keep everything that works):
  - Clock line at the top of the inventory panel: `${icon} Day ${day} · ${hh}:${mm}` where hours = (6 + state.dayTime * 24) % 24 (dayTime 0 is 06:00), `day = Math.floor((state.time + DAY.startTime * DAY.lengthSeconds) / DAY.lengthSeconds) + 1`, icon '☀️' by day, '🌙' when `nightAmount(state) > 0.5`, '🌧️' while `state.raining`. Add ' · Rain: grass x2' while raining. Only update the DOM when the minute changes.
  - Title controls list: add 'Shift: sprint', 'Mouse wheel: zoom', 'F: bonk a shark or seagull', 'R in build mode: turf / seeded dirt / sprinkler / flamingo', 'M: music on/off'.
  - Title button text: 'Continue' when `state.time > 0` at the moment the HUD is created (a save was loaded), else 'Click to start'.
  - Play hint line: 'LMB fish · E cut · F bonk · B build · Tab craft · Q tool · T telescope'.
  - Sprinkler and flamingo already appear in the build hint (it reads `BUILD_COSTS[state.buildKind]`); check that still works.
  - The top-right corner is now used by the minimap (`#rg-minimap`) and goals (`#rg-goals`); keep HUD elements out of the top-right 240 x 320 px.

## Contract
`export function createHud(ctx: Ctx): System` (unchanged).

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/hud.ts`.

## Out of scope
Every other file.
