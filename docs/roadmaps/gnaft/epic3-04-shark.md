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
The Lawn Shark: a fin circles the raft and every so often chews on an edge tile. Get there and bonk it (F) or lose the tile.

## Read first
- games/gnaft/src/config.ts: `SHARK`, `KEYS.bonk`, `TILE_SIZE`, `RAFT_TOP`, `GameState.stats`
- games/gnaft/src/rules.ts: `edgeTiles`, `removeTile`, `raftExtent`, `tileKey`, `notify`

## Change
- games/gnaft/src/shark.ts: implement `createShark(ctx: Ctx): System`.
  - Model: dark grey (0x56606b) dorsal fin (a `ConeGeometry(0.5, 1.2, 3)` flattened along x to look like a blade, or an extruded triangle) sticking out of the water, plus a body (long squashed sphere, 3 m) just below the surface (y -0.4), and a tail fin. A small white wake: 6 white flattened spheres trailing behind the fin, fading.
  - States: `circling` -> `approach` -> `biting` -> `fleeing` -> `circling`.
    - `circling`: swim around the origin at radius `raftExtent(state) + SHARK.circleRadius * 0.5` (at least 6 m), angular speed so it moves about 4 m/s; face along the path; bob the fin. Attack timer: first attack when `state.time >= SHARK.firstAfter`, then every random [intervalMin, intervalMax] s. Timers only advance when `state.mode !== 'title'` and `!state.sea.docked`. Do not attack if `state.tiles.size <= SHARK.minTiles`. When attacking: pick a random tile from `edgeTiles(state)`; the bite point is that tile's centre moved 1.6 m outward toward a missing neighbour side. -> `approach`, `sfx('shark')`, `notify(state, 'The lawn shark is chewing your raft! Get over there and press F!')`.
    - `approach`: swim to the bite point at 6 m/s, then -> `biting` with timer = `SHARK.biteSeconds`.
    - `biting`: shake the body side to side, the fin lunges toward the tile; `sfx('chomp')` every 1 s; spawn small white/green splash bits. If the player is within `SHARK.bonkDistance` (xz) of the bite point and `input.pressed(KEYS.bonk)`: `sfx('bonk')`, `state.stats.sharksBonked++`, `notify(state, 'BONK! The shark swims off.')`, -> `fleeing`. If the timer runs out: `removeTile(state, i, j, SHARK.minTiles)`; if it returned true `notify(state, 'The shark ate a tile!')`; -> `fleeing`. If the tile no longer exists, -> `circling`.
    - `fleeing`: swim straight away from the raft at 8 m/s for 5 s (fin dips under: y lower), then back to `circling` at its current angle.
  - Show a pulsing red ring (flat `RingGeometry(1, 1.3, 32)`, `MeshBasicMaterial({ color: 0xff3333, transparent: true })`) on the water at the bite point while biting, so the player can find it.

## Contract
`export function createShark(ctx: Ctx): System` (stub exists).

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/shark.ts`.

## Out of scope
Tile rendering (raft.ts removes the tile's mesh by itself when it disappears from state.tiles), every other file.
