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
Build mode gets two props that stand on existing tiles: a Sprinkler (doubles growth nearby) and a Lawn Flamingo (decoration). R cycles all four build kinds. Props are drawn.

## Read first
- games/gnaft/src/building.ts: the current build mode (you extend it)
- games/gnaft/src/config.ts: `BUILD_ORDER`, `BUILD_COSTS` (now has `onTile`), `BuildKind`, `Prop`, `SPRINKLER`, `GameState.props`
- games/gnaft/src/rules.ts: `canBuild`, `canPlace`, `canPlaceProp`, `placeTile` (now also places props when `BUILD_COSTS[kind].onTile`), `cellAt`

## Change
- games/gnaft/src/building.ts:
  - R (`KEYS.buildKind`) in 'build' cycles `state.buildKind` through `BUILD_ORDER` (turf -> seeded -> sprinkler -> flamingo -> turf), same notify/sfx as now.
  - Targeting: for kinds with `BUILD_COSTS[kind].onTile`, the target is the hit cell itself if `canBuild(state, i, j, kind)`, no neighbour search. For tile kinds keep the current logic but use `canBuild` instead of `canPlace`.
  - Ghost: tile kinds keep the box ghost. Prop kinds show a small preview instead: a translucent cylinder (radius 0.35, height 0.8) on the tile top (y = RAFT_TOP + 0.4) with the same green/red affordability colours.
  - Edge hints: show them only while a tile kind is selected.
  - Placing works as now (`placeTile` handles props); `sfx('place')` on success.
  - Prop rendering (every mode, including 'title'): keep a `Map<string, THREE.Object3D>` keyed `${kind}:${i},${j}`; each frame add objects for new entries of `state.props` and remove objects whose prop is gone (a shark can remove tiles and their props). Place at `(i*TILE_SIZE, RAFT_TOP, j*TILE_SIZE)`.
    - Sprinkler: grey metal base disc + short pipe + a head that spins (rotation.y += 6 dt) with two little arms; spray: 16 small translucent light-blue spheres (`opacity 0.6`) that fly out from the head in an arc (each with its own phase, a 1.2 s loop, landing about `SPRINKLER.radius` m away), only while the game is not in 'title'. Plus a faint translucent blue disc (`opacity 0.08`, radius `SPRINKLER.radius`) just above the grass while in build mode, showing its reach.
    - Flamingo (about 0.9 m tall): pink (0xff6fae) body (stretched sphere), S-shaped neck from 3 thin tilted cylinders, small head sphere, a bent beak (pink cone with black tip), two thin dark-pink legs. Give it a random yaw from its cell (deterministic, e.g. `(i * 7 + j * 13) % 8 * Math.PI / 4`).

## Contract
`export function createBuilding(ctx: Ctx): System` (unchanged). Props live in `state.props`; you only render them and place them via `placeTile`.

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/building.ts`.

## Out of scope
Growth rules (rules.ts already applies `SPRINKLER`), raft.ts, every other file.
