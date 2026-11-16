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
Rain showers come and go. While it rains, grass grows twice as fast (rules.ts already does that from `state.raining`); you see rain streaks, hear rain and occasional thunder.

## Read first
- games/gnaft/src/config.ts: `WEATHER`, `GameState.raining`
- games/gnaft/src/audio.ts: exports `sfx(name)` and `setRain(level: number)` (call every frame)

## Change
- games/gnaft/src/weather.ts: implement `createWeather(ctx: Ctx): System`.
  - Timer: start clear for a random time in [WEATHER.clearMin, clearMax] s; then rain for [rainMin, rainMax] s; repeat. Only count time when `state.mode !== 'title'`. On start of rain: `state.raining = true`, `notify(state, 'Rain! Your grass grows twice as fast.')`. On stop: `state.raining = false`, `notify(state, 'The rain stops.')`.
  - Rain visual amount r: smooth toward 1/0 at 0.4 per second.
  - Rain streaks: one `THREE.LineSegments` of 1500 drops (each drop a 0.5 m vertical segment), `LineBasicMaterial({ color: 0xaebfd0, transparent: true, opacity: 0.55 * r })`, in a box 50 x 25 x 50 m centred on the player (x/z) and from y 0 to 25. Each frame move drops down at 25 m/s and slightly with wind (2 m/s along x); wrap to the top when below y 0; wrap x/z to stay inside the box around the player. `visible = r > 0.01`. Update the position attribute in place (`needsUpdate = true`).
  - Splash rings are not needed.
  - Thunder: while raining, every 12-25 s (random): `sfx('thunder')` and a flash: your own full-screen `<div id="rg-flash">` in `ctx.ui` (white, `pointer-events:none`) whose opacity jumps to 0.6 and fades to 0 over 0.3 s.
  - Audio: every frame `setRain(r)`.

## Contract
`export function createWeather(ctx: Ctx): System` (stub exists). You own `state.raining`. Lighting/sky dimming in rain is done by the day/night system, not you.

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/weather.ts`.

## Out of scope
Lights, sky colour, audio.ts, every other file.
