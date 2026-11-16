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
A seagull pest: now and then a gull flies in, lands on your tallest grass and eats it until you chase it off.

## Read first
- games/gnaft/src/config.ts: `SEAGULL`, `KEYS.bonk`, `TILE_SIZE`, `RAFT_TOP`, `GameState.stats`
- games/gnaft/src/rules.ts: `tileKey`, `addItem`, `notify`

## Change
- games/gnaft/src/seagull.ts: implement `createSeagull(ctx: Ctx): System`.
  - Model (about 0.7 m long): white squashed-sphere body, small white head sphere, orange cone beak, two grey flattened-box wings on pivots that flap (`rotation.z = ±sin(t*14) * 0.8` when flying, folded when landed), small orange legs. One gull at a time.
  - States: `away` -> `flyIn` -> `eating` -> `flee` -> `away`.
    - `away`: waits; first gull after `state.time >= SEAGULL.firstAfter`, then random [intervalMin, intervalMax] s after the last one left. Only advance timers when `state.mode !== 'title'` and `!state.sea.docked`. Pick the tile with the highest growth (needs growth >= 0.3, else wait 5 s and retry). Spawn 40 m from the origin in a random direction at y 12.
    - `flyIn`: fly straight to the tile centre `(i*TILE_SIZE, RAFT_TOP, j*TILE_SIZE)` at `SEAGULL.flySpeed`, descending; face the movement direction. On arrival -> `eating`, `sfx('gull')`, `notify(state, 'A seagull is eating your lawn! Walk up to it or press F.')` (only for the first gull of the game use this long text; later ones: 'Seagull!').
    - `eating`: peck animation (body pitches down and up). Each frame `tile.growth = Math.max(0, tile.growth - SEAGULL.eatRate * dt)` (look the tile up again each frame with `state.tiles.get(tileKey(i, j))`; if it is gone, -> `flee` without reward). `sfx('gull')` every 3-5 s. When the tile is below 0.05, hop to the most-grown tile within 3 tiles (growth >= 0.3) or -> `flee` if none.
    - Scare: in `flyIn` or `eating`, if the player is within `SEAGULL.scareDistance` (xz), or within 4 m and `input.pressed(KEYS.bonk)`: -> `flee`, `sfx('gull')`, `state.stats.gullsScared++`, `addItem(state, 'seed', 1)`, `notify(state, 'Shoo! The gull dropped a grass seed.')`.
    - `flee`: fly up and away from the player at 14 m/s for 4 s, then `away` (hidden).
  - Hide the model in `away`.

## Contract
`export function createSeagull(ctx: Ctx): System` (stub exists).

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/seagull.ts`.

## Out of scope
The shark (also uses KEYS.bonk; that is fine), every other file.
