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
The gnome walks around the raft (and a docked island) with a third-person mouse-look camera.

## Read first
- games/gnaft/src/config.ts: `PlayerState`, `TUNING`, `TOOLS`, `KEYS`, `RAFT_TOP`, `TILE_SIZE`, `CHARACTERS`
- games/gnaft/src/rules.ts: `isWalkable`
- games/gnaft/src/gnome.ts: `createGnomeModel(look: GnomeLook): GnomeModel`. `model.update(state.player, dt)` places, rotates and animates it from PlayerState (walk cycle from velocity, front flip when `jumpsUsed` becomes 2 in the air).

## Change
- games/gnaft/src/player.ts: implement `createPlayer(ctx: Ctx): System`.
  - Model: `const model = createGnomeModel(CHARACTERS.gnorman.look)`; add `model.object` to the scene.
  - Camera angles in the closure: `yaw = 0`, `pitch = 0.35`.
  - Mode 'title': no movement; camera orbits the point (1, 0, 1) at radius 12, height 6, angle = elapsed * 0.1, looking at (1, 0.5, 1). Still call `model.update`.
  - Modes 'play' and 'build':
    - Mouse look only if `input.locked()`: `yaw -= dx * TUNING.mouseSensitivity; pitch += dy * TUNING.mouseSensitivity`, pitch clamped to [-0.15, 1.2].
    - Movement: forward = (sin(yaw), 0, cos(yaw)), right = (-cos(yaw), 0, sin(yaw)). Check the sign so D moves screen-right given the camera below. Direction from W/S/A/D (`KEYS.forward` etc.), normalised. speed = `TUNING.moveSpeed * TOOLS[state.equipped].speedMult`. Set `player.velocity.x/z` = dir * speed.
    - Collision: move x and z separately. The x step is accepted only if `isWalkable(state, newX + Math.sign(stepX) * 0.3, z)`; same for z. The gnome can never walk off into the sea.
    - Facing: turn `player.facing` smoothly toward `Math.atan2(dir.x, dir.z)` while moving (shortest angle, rate about 12/s).
    - Jump: `input.pressed(KEYS.jump)` and `jumpsUsed < 2` -> `velocity.y = TUNING.jumpSpeed`, `jumpsUsed++`, `grounded = false`. Gravity `TUNING.gravity`. Land when y <= RAFT_TOP: y = RAFT_TOP, velocity.y = 0, grounded = true, jumpsUsed = 0.
    - Safety: if grounded and `!isWalkable(state, x, z)` (e.g. the raft cast off while the gnome stood on an island), teleport to the centre of the nearest tile in `state.tiles` (`(t.i * TILE_SIZE, RAFT_TOP, t.j * TILE_SIZE)`).
    - Camera: target = position + (0, 1.2, 0); `camera.position = target + (-sin(yaw) * cos(pitch), sin(pitch), -cos(yaw) * cos(pitch)) * TUNING.cameraDistance`, y at least 0.5; `camera.lookAt(target)`.
  - Modes 'telescope' and 'craft': no movement, horizontal velocity 0 (gravity/landing still apply). Do not touch the camera in 'telescope' (another system drives it after you); in 'craft' keep the third-person camera.
  - `model.object.visible = state.mode !== 'telescope'`.
  - Call `model.update(state.player, dt)` every frame; then if `state.equipped === 'riding'` add 0.55 to `model.object.position.y` (sitting on the riding mower).

## Contract
`export function createPlayer(ctx: Ctx): System` (unchanged signature). You own `state.player` and the camera (except in telescope mode).

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/player.ts`.

## Out of scope
gnome.ts (use it, do not edit it), mower models, every other file.
