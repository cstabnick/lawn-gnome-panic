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
A round radar in the top-right corner showing the raft, the gnome, props and the direction of spotted islands.

## Read first
- games/gnaft/src/config.ts: `ISLANDS`, `ISLAND_ORDER`, `TILE_SIZE`, `GameState`
- games/gnaft/src/rules.ts: `islandRelPos`, `raftExtent`

## Change
- games/gnaft/src/minimap.ts: implement `createMinimap(ctx: Ctx): System`.
  - Your own `<canvas id="rg-minimap" width="180" height="180">` appended to `ctx.ui`, `position:absolute; top:12px; right:12px; border-radius:50%; background: rgba(10,30,45,0.75); border: 2px solid rgba(255,255,255,0.5)`. Hidden in 'title' and 'telescope'.
  - Redraw 10 times a second (accumulate dt). World x maps to canvas right, world z to canvas down. Scale: the visible radius in metres = max(25, raftExtent(state) * 1.5), mapped to 80 px.
  - Draw: each tile as a square (TILE_SIZE wide) coloured from #6ab04c (short) to #2e7d32 (grown) by growth; props as dots (sprinkler blue #4fc3f7, flamingo pink #ff6fae); the player as a white triangle pointing along facing (`(sin(facing), cos(facing))` in x/z).
  - Islands: for each island with `state.islands[id].spotted`: if its distance is within the visible radius draw a sand-coloured circle of its radius; otherwise draw a yellow triangle marker on the rim at its bearing with the distance (`Math.round(d) + 'm'`) in 10 px text next to it. Unspotted islands are not drawn.
  - Course: if `state.sea.course`, draw a dashed yellow line from the centre toward that island (to the rim).
  - Clip all drawing to the circle (`ctx2d.arc` + `clip()`), except the rim markers which sit on the rim.

## Contract
`export function createMinimap(ctx: Ctx): System` (stub exists). Element id `rg-minimap`. The objectives panel sits under it at top 204px; stay within 180 x 180.

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/minimap.ts`.

## Out of scope
Every other file.
