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
An endless-looking animated sea and some sky dressing.

## Read first
- games/gnaft/src/config.ts: `COLORS`, `SEA`, `Ctx`, `System`
- games/gnaft/src/rules.ts: `raftVelocity`

## Change
- games/gnaft/src/ocean.ts: implement `createOcean(ctx: Ctx): System`.
  - Water: `PlaneGeometry(400, 400, 160, 160)` rotated `-Math.PI / 2` about x (`geo.rotateX`), at the origin, `MeshStandardMaterial({ color: COLORS.water, roughness: 0.35, metalness: 0.1, flatShading: true })`, `receiveShadow = true`. Each frame, set every vertex's y to a sum of 3 sines of `(x + state.sea.x, z + state.sea.z, time)` so the waves scroll past as the raft sails. Amplitude: total <= 0.08 within 12 m of the origin (waves must never reach RAFT_TOP = 0.3 on the raft), ramping up to 0.35 beyond 30 m. Then `position.needsUpdate = true` and `computeVertexNormals()`.
  - Horizon: a flat `CircleGeometry(2900, 64)` rotated flat at y = -0.15, colour `COLORS.waterDeep`, so the sea reaches the camera's far plane.
  - Clouds: 14 clouds, each 3-5 white flattened spheres (`MeshStandardMaterial({ color: 0xffffff, roughness: 1 })`), at y 70-110, scattered within 500 m of the origin. They drift by `-raftVelocity * 0.3 * dt` plus a slow wind of (0.5, 0, 0.2) m/s and wrap to the opposite side when beyond 500 m.
  - Keep time inside the closure (`t += dt`). Animate in every mode, including 'title'.

## Contract
`export function createOcean(ctx: Ctx): System` (unchanged signature).

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/ocean.ts`.

## Out of scope
Lights, fog and scene.background (main.ts owns them). Every other file.
