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
A day/night cycle: the sun moves, the sky and fog change colour (sunset orange, night navy), stars and a moon come out, and rain makes the day greyer.

## Read first
- games/gnaft/src/config.ts: `DAY`, `COLORS.sky`, `Ctx.lights`, `GameState.dayTime`, `GameState.raining`
- games/gnaft/src/rules.ts: `sunHeight`, `nightAmount`
- games/gnaft/src/main.ts: how the sun (DirectionalLight, castShadow, shadow camera ±30) and hemi light are created

## Change
- games/gnaft/src/daynight.ts: implement `createDayNight(ctx: Ctx): System`.
  - Sun: angle a = `state.dayTime * 2π`; `ctx.lights.sun.position.set(Math.cos(a) * 60, Math.max(Math.sin(a), -0.2) * 60 + 5, 20)` (target stays at the origin). Sun intensity = 2.2 * clamp(sunHeight * 2.5 + 0.1, 0, 1), times (1 - 0.55 * rainAmount). Sun colour: white at noon, warm 0xffb070 when |sunHeight| < 0.25.
  - Hemi light intensity: lerp 0.25 (night) to 1.2 (day) by (1 - nightAmount), times (1 - 0.3 * rainAmount). Night hemi sky colour 0x3a4a7a.
  - Sky: day 0x7fc8f0, sunset 0xf4a261 (blend in when |sunHeight| < 0.2, strongest at 0), night 0x0b1d3a (by nightAmount), then lerp toward grey 0x8a99a6 by rainAmount * 0.6. Write the result into `(ctx.scene.background as THREE.Color).copy(...)` and `(ctx.scene.fog as THREE.Fog).color.copy(...)`. Do not change fog near/far (the telescope changes those).
  - rainAmount: smooth 0..1 toward `state.raining ? 1 : 0` at 0.3 per second.
  - Stars: `THREE.Points` with 900 random points on the upper half of a sphere of radius 1500, `PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, fog: false, depthWrite: false })`, opacity = nightAmount * (1 - rainAmount). Keep the points centred on the camera position each frame.
  - Moon: a `SphereGeometry(30)` with `MeshBasicMaterial({ color: 0xf4f1de, fog: false })` placed 1200 m from the camera in the direction opposite the sun, visible while nightAmount > 0.05.
  - In 'title' still animate (state.dayTime is frozen there, which is fine).

## Contract
`export function createDayNight(ctx: Ctx): System` (signature exists as a stub). You own the two lights, scene.background and fog colour.

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/daynight.ts`.

## Out of scope
Rain particles and rain sounds (weather.ts), fog near/far, every other file.
