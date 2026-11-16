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
Cutting grass: by hand with E, or automatically by pushing/driving an owned mower over grown tiles. Q cycles tools.

## Read first
- games/gnaft/src/config.ts: `TOOLS`, `TOOL_ORDER`, `ToolId`, `GRASS`, `KEYS`, `TILE_SIZE`
- games/gnaft/src/rules.ts: `tileAt`, `cutTile`, `toolHasFuel`, `notify`
- games/gnaft/src/mowerModels.ts: only the signature `createMowerModel(tier: MowerTier): MowerModel` (model faces +z, base at y = 0; `.group`, `.animate(dt, speed)`, `.setNight(0)`)

## Change
- games/gnaft/src/mowing.ts: implement `createMowing(ctx: Ctx): System`.
  - Tool cycle: mode 'play', `KEYS.tool` pressed -> next owned tool in `TOOL_ORDER` (`state.tools[id]` true), wrapping; set `state.equipped`; `notify(state, 'Equipped ' + TOOLS[id].name)`; `sfx('click')`.
  - Mower model: for an equipped tool with `TOOLS[id].model !== null`, lazily create one model per tool with `createMowerModel(TOOLS[id].model)`, `group.scale.setScalar(TOOLS[id].modelScale)`, `setNight(0)` once, add to the scene. Show only the equipped tool's model. Each frame place it at `player.position + forward * (0.9 * modelScale)` (forward = (sin(facing), 0, cos(facing))), `rotation.y = facing`, y = player.position.y; `animate(dt, horizontalSpeed)` (length of player.velocity x/z). For 'riding' place it at the player's own position (the gnome sits on it).
  - Hand cutting (`state.equipped === 'hands'`, mode 'play'): `KEYS.interact` pressed and `tileAt(state, pos.x, pos.z)` is a tile -> `cutTile(state, tile, TOOLS.hands.yieldMult)`. Returned > 0: `sfx('cut')`. Returned 0: `notify(state, 'Grass is not grown yet')` at most once every 2 s. No tile under the player: do nothing (E also opens island crates, handled elsewhere).
  - Mower cutting (other tools, mode 'play', horizontal speed > 0.5, `toolHasFuel(state)`): cut point = the mower model's position; for every tile in `state.tiles` whose centre `(t.i * TILE_SIZE, t.j * TILE_SIZE)` is within `TOOLS[id].radius` (xz distance) of the cut point: `const g = cutTile(state, t, TOOLS[id].yieldMult)`; if g > 0: `sfx('cut')` and `state.inv.fuel = Math.max(0, state.inv.fuel - TOOLS[id].fuelPerCut)`.
  - Out of fuel: when the equipped fuel tool has no fuel, `notify(state, TOOLS[id].name + ' is out of fuel! Switch with Q.')` once; again only after fuel was > 0 in between.
  - Engine: every frame `setEngine(level)`: if the tool's fuelPerCut > 0, fuel > 0 and mode !== 'title': 0.3 + 0.7 * min(1, speed / 5); else 0.

## Contract
`export function createMowing(ctx: Ctx): System` (unchanged signature). From './audio': `sfx(name: SfxName): void`, `setEngine(level: number): void`.

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/mowing.ts`.

## Out of scope
Crafting (craft menu is elsewhere), the gnome model, every other file.
