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
Build mode: aim at the water next to the raft and click to add a grass tile (turf, or dirt + seed).

## Read first
- games/gnaft/src/config.ts: `BUILD_COSTS`, `BuildKind`, `KEYS`, `TILE_SIZE`, `RAFT_TOP`
- games/gnaft/src/rules.ts: `cellAt`, `canPlace`, `placeTile`, `hasItems`, `costText`, `notify`

## Change
- games/gnaft/src/building.ts: implement `createBuilding(ctx: Ctx): System`.
  - Toggle: `KEYS.build` pressed: in 'play' -> `state.mode = 'build'` and `notify(state, 'Build mode: click to place, R to switch tile, B to exit')`; in 'build' -> 'play'. Ignore in other modes.
  - In 'build', `KEYS.buildKind` pressed -> toggle `state.buildKind` between 'turf' and 'seeded', `notify(state, BUILD_COSTS[kind].name + ': ' + costText(BUILD_COSTS[kind].cost))`, `sfx('click')`.
  - Aim: `raycaster.setFromCamera(new THREE.Vector2(0, 0), ctx.camera)`, then `raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -RAFT_TOP), hit)`. No hit, or hit farther than 14 m (xz) from the player -> no target. Target cell = `cellAt(hit.x, hit.z)`. If that cell fails `canPlace`, try its 4 neighbours and take the one closest to the hit point that passes `canPlace` (forgiving aim at the edge).
  - Ghost: one translucent box `BoxGeometry(TILE_SIZE * 0.98, 0.35, TILE_SIZE * 0.98)` at `(i * TILE_SIZE, RAFT_TOP - 0.15, j * TILE_SIZE)`, `MeshStandardMaterial({ transparent: true, opacity: 0.45, depthWrite: false })`; colour 0x66ff66 if `hasItems(state, BUILD_COSTS[state.buildKind].cost)`, else 0xff5555. Pulse the opacity gently. Hidden with no valid target or outside 'build'.
  - Edge hints: in 'build', show a very transparent flat plane (opacity 0.15, white) on every cell that `canPlace` allows (check cells next to existing tiles). Recompute only when `state.tiles.size` changes. Hide them outside build mode.
  - Place: in 'build', `input.mousePressed(0) && input.locked()` with a valid target -> `placeTile(state, i, j, state.buildKind)`; success -> `sfx('place')`, failure -> `sfx('error')` (placeTile already notifies the cost).

## Contract
`export function createBuilding(ctx: Ctx): System` (unchanged signature). `sfx` from './audio'.

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/building.ts`.

## Out of scope
Rendering existing tiles (raft.ts), player, every other file.
