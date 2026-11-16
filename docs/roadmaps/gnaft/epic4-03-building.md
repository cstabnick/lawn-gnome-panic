Epic: 4. Swim, grab, planks and sheds
Depends on: none

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
Build mode can place plank floors, plank walls and plank roofs to make a little shed on the grass, plus rubber duck and garden gnome decorations; right click removes a piece for a partial refund. All shed pieces are drawn in every mode.

## Read first
- games/gnaft/src/building.ts: the current build mode and prop rendering (you extend it; keep tiles, sprinkler, flamingo, hints, ghosts)
- games/gnaft/src/config.ts: `BUILD_COSTS` (field is now `on: BuildPlace`, not `onTile`), `BUILD_ORDER`, `BuildKind`, `StructKind`, `Structure`, `SHED`, `REFUND`, `PropKind` (now also 'duck', 'statue'), `GameState.structures`, `TILE_SIZE`, `RAFT_TOP`
- games/gnaft/src/rules.ts: `canBuild`, `placeTile`, `deconstruct`, `wallCentre`, `floorAt`, `ceilingAt`, `cellAt`, `costText`, `hasItems`, `notify`

## Change
- games/gnaft/src/building.ts:
  1. **Targeting by `BUILD_COSTS[kind].on`.** Keep the ray from the screen centre to the plane `y = RAFT_TOP` and the REACH limit. Then:
     - 'water': as now (aimed empty cell next to the raft, forgiving neighbours).
     - 'tile', 'floor', 'ceiling': the aimed cell `cellAt(hit.x, hit.z)` itself, if `canBuild(state, i, j, kind)`. (Roofs are aimed at the ground cell they will cover.)
     - 'edge' (wall): the edge of the aimed cell nearest the hit point. With `fx = hit.x / TILE_SIZE - i` and `fz = hit.z / TILE_SIZE - j` (each in -0.5..0.5): if `|fx| >= |fz|` it is an x edge: `fx > 0 ? (i, j, 'x') : (i - 1, j, 'x')`; otherwise a z edge: `fz > 0 ? (i, j, 'z') : (i, j - 1, 'z')`. Valid if `canBuild(state, wi, wj, 'wall', dir)`.
     - Place on left click (pointer locked) with `placeTile(state, i, j, kind, dir)`; `sfx('place')` on success, `sfx('error')` otherwise.
  2. **Ghosts** (same green/red affordability colours and pulse as now): floor = box `TILE_SIZE x SHED.FLOOR_THICK x TILE_SIZE` with centre y `RAFT_TOP + FLOOR_THICK / 2`; wall = box `WALL_THICK x WALL_HEIGHT x TILE_SIZE` for dir 'x' (rotate 90° about y for dir 'z') at `wallCentre(i, j, dir)` and centre y `RAFT_TOP + WALL_HEIGHT / 2`; roof = box `TILE_SIZE x ROOF_THICK x TILE_SIZE` at centre y `RAFT_TOP + WALL_HEIGHT + ROOF_THICK / 2`. Tile and prop ghosts as now. Water hints only while a 'water' kind is selected.
  3. **Rendering shed pieces** in every mode, synced from `state.structures` like `syncProps` (key `` `${kind}:${i},${j},${dir ?? ''}` ``; create missing, remove stale). Plank look, colour around 0xb07a45 with per-board variation (0xa06a38, 0xc08a55) and thin dark gaps; `castShadow` and `receiveShadow` true:
     - floor: 4 boards side by side covering the cell, `FLOOR_THICK` thick, top at `RAFT_TOP + FLOOR_THICK`.
     - wall: 4 horizontal boards stacked to `WALL_HEIGHT`, `WALL_THICK` thick, `TILE_SIZE` long, standing on `RAFT_TOP` at `wallCentre`, plus a darker vertical post at each end.
     - roof: 4 boards, `ROOF_THICK` thick, underside at `RAFT_TOP + WALL_HEIGHT`.
     - Roofs fade when the gnome is under one: if `ceilingAt(state, cellAt(player.x, player.z))` exists, set every roof material's opacity to 0.2 (transparent), otherwise 1. Give roofs their own material instances for this.
  4. **New props** in `makeProp`: 'duck' — a big yellow (0xffd23f) rubber duck about 0.5 m tall (flattened sphere body, sphere head, orange cone beak, black eyes) that bobs gently; 'statue' — a garden gnome statue about 0.7 m tall (blue cylinder body, brown boots, skin sphere face, white cone beard, red cone hat). Same placement/yaw style as the flamingo.
  5. **Remove with right click.** In build mode, on `input.mousePressed(2)` (pointer locked): raycast from the screen centre (`raycaster.setFromCamera(centre, camera)`) against the rendered shed pieces and placed props (`intersectObjects(list, true)`, nearest hit within REACH of the player). Store the state object on each rendered root as `userData.piece`; walk up `parent` from the hit mesh to find it. Call `deconstruct(state, piece)`; on success `sfx('place')` and `notify(state, 'Removed ' + BUILD_COSTS[piece.kind].name)`.
  6. Build mode enter message: `'Build mode: click to place, right click to remove, R to switch, B to exit'`.

## Contract
`export function createBuilding(ctx: Ctx): System` (unchanged signature).
Rules (already implemented, do not edit rules.ts or config.ts):
```ts
canBuild(s: GameState, i: number, j: number, kind: BuildKind, dir?: 'x' | 'z'): boolean
placeTile(s: GameState, i: number, j: number, kind: BuildKind, dir?: 'x' | 'z'): boolean
deconstruct(s: GameState, piece: Structure | Prop): boolean   // piece must be the object from state.structures / state.props
wallCentre(i: number, j: number, dir: 'x' | 'z'): { x: number; z: number }   // dir 'x': wall runs along z; 'z': runs along x
floorAt / ceilingAt(s: GameState, i: number, j: number): Structure | undefined
// config: SHED = { FLOOR_THICK: 0.12, WALL_HEIGHT: 2.4, WALL_THICK: 0.12, ROOF_THICK: 0.12 }
// Structure = { kind: 'floor' | 'wall' | 'ceiling'; i: number; j: number; dir?: 'x' | 'z' }
```

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/building.ts`.
- `grep -n onTile games/gnaft/src/building.ts` finds nothing.

## Out of scope
rules.ts, config.ts, player.ts, fishing.ts, raft.ts, every other file.
