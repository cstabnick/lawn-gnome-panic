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
Fishing gets messages in bottles (they reveal an island), splash rings, and counts catches for the goal tracker.

## Read first
- games/gnaft/src/fishing.ts: the current fishing system (you extend it)
- games/gnaft/src/config.ts: `DebrisDef` (new optional `bottle` flag), `DEBRIS`, `GameState.stats`
- games/gnaft/src/rules.ts: `revealIsland`

## Change
- games/gnaft/src/fishing.ts (keep everything that works):
  - Bottle debris: when `def.bottle` is true, the mesh is a green translucent glass bottle (`CylinderGeometry(0.1, 0.12, 0.45)`, `MeshStandardMaterial({ color: 0x5fbf7f, transparent: true, opacity: 0.6, roughness: 0.1 })`) with a narrower neck, a brown cork, and a rolled white paper inside (small white cylinder); it floats lying on its side. Make it sparkle: a small white sprite-like sphere above it that blinks.
  - On collect: if `def.bottle`: `revealIsland(state)` and `sfx('bottle')` (no addItem, no '+0' toast). Otherwise as now. For every collected debris (bottle or not) `state.stats.caught++`.
  - Splash rings: a reusable effect: a flat `RingGeometry(0.2, 0.3, 32)` at y = 0.05 that scales from 1 to 6 and fades from opacity 0.8 to 0 over 0.8 s (white `MeshBasicMaterial`, transparent, `depthWrite: false`). Spawn one with `sfx('splash')` when a thrown hook lands in the water (not when it lands on the raft or an island: use `isWalkable`), and one at the hook when catches are collected.
  - Bobber dip: while floating with something snagged, make the bobber dip (y -0.08 every 0.6 s) to show a bite.

## Contract
`export function createFishing(ctx: Ctx): System` (unchanged). `sfx` names used: 'throw', 'reel', 'catch', 'splash', 'bottle'.

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/fishing.ts`.

## Out of scope
Every other file.
