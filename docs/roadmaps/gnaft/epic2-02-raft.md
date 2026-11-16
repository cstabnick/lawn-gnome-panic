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
The grass raft is drawn from `state.tiles`, with grass that visibly grows taller and gets cut.

## Read first
- games/gnaft/src/config.ts: `Tile`, `GameState.tiles`, `TILE_SIZE`, `RAFT_TOP`, `COLORS.grass`, `COLORS.grassTall`, `COLORS.dirt`
- games/gnaft/src/rules.ts: `tileKey`

## Change
- games/gnaft/src/raft.ts: implement `createRaft(ctx: Ctx): System`.
  - One `THREE.Group` per tile, kept in a `Map<string, ...>` keyed by `tileKey(i, j)`. Each frame: create groups for keys in `state.tiles` that have none; remove groups whose key is gone.
  - Tile group at `(i * TILE_SIZE, 0, j * TILE_SIZE)` containing:
    - dirt clod: `BoxGeometry(TILE_SIZE * 0.98, 0.7, TILE_SIZE * 0.98)` coloured `COLORS.dirt`, centre y = RAFT_TOP - 0.38 (bottom under water: good).
    - turf top: `BoxGeometry(TILE_SIZE * 0.98, 0.06, TILE_SIZE * 0.98)` with its top at y = RAFT_TOP, its own material whose colour = COLORS.grass lerped to COLORS.grassTall by growth (`mat.color.setHex(COLORS.grass).lerp(tallColor, growth)`).
    - blades: an `InstancedMesh` of 28 thin cones (`ConeGeometry(0.06, 1, 4)`, then `geo.translate(0, 0.5, 0)` so the base is at 0), green material, random positions inside the tile from a tiny per-tile seeded random (e.g. LCG seeded with `(i * 73856093) ^ (j * 19349663)`) so they never jump; base at y = RAFT_TOP. Blade height = 0.08 + growth * 0.55 (instance matrix scale y; use `THREE.Matrix4().compose(pos, quat, scale)`). Rebuild matrices only when growth changed by more than 0.02 since the last rebuild, then `instanceMatrix.needsUpdate = true`.
  - Geometries and the dirt/blade materials are created once and shared by all tiles.
  - Cut effect: if a tile's growth dropped by more than 0.2 since last frame (it was cut), spawn 10 small green boxes (0.08 m) at the tile top that fly up/outward (random velocity, gravity 9) and shrink away over 0.6 s, then are removed.
  - Do not move or bob the raft (the player's feet are at exactly RAFT_TOP).

## Contract
`export function createRaft(ctx: Ctx): System` (unchanged signature). Read-only use of state.

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/raft.ts`.

## Out of scope
Cutting rules (rules.ts `cutTile`, called by another system), building, every other file.
