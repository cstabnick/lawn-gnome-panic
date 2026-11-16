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
Junk floats past the raft; the gnome throws a hook on a line, snags debris and reels it in for items.

## Read first
- games/gnaft/src/config.ts: `FISHING`, `DEBRIS`, `DebrisDef`, `ITEMS`, `ItemId`, `RAFT_TOP`
- games/gnaft/src/rules.ts: `pickDebris`, `raftVelocity`, `addItem`, `notify`, `isWalkable`

## Change
- games/gnaft/src/fishing.ts: implement `createFishing(ctx: Ctx): System`.
  - Flow: `flow = FISHING.current - raftVelocity(state)` (x/z, m/s). Everything floating moves by `flow * dt`.
  - Debris list: `{ mesh: THREE.Object3D, def: DebrisDef, pos: THREE.Vector3, phase: number, snagged: boolean }[]`. One small mesh per item kind (about 0.5-0.8 m): grass = 3 green cones on a brown disc; dirt = brown squashed sphere (a sack); seed = small yellow box (a packet); scrap = 3 grey boxes at odd angles (metalness 0.6); fuel = red cylinder can; parts = yellow `TorusGeometry` gear. Spin slowly around y.
  - Spawning (all modes, including 'title'): every `FISHING.debrisSpawnSeconds` while fewer than `FISHING.debrisMax` exist, spawn `pickDebris(state)` at `upstream * FISHING.spawnDistance + perp * (Math.random() - 0.5) * FISHING.spawnSpread`, where upstream = -normalize(flow) (if |flow| < 0.1 use -normalize(FISHING.current)) and perp = upstream rotated 90 degrees in xz. At creation, pre-spawn 6 debris along the flow line (random signed distance up to spawnDistance) but at least 6 m from the origin.
  - Float: y = 0.05 + sin(t * 2 + phase) * 0.08. Remove debris farther than `FISHING.despawnDistance` from the origin that is moving away (dot(pos, flow) > 0).
  - Hook state machine (acts only in mode 'play'; if the mode is anything else while the hook is out, reset to idle and release snagged debris):
    - idle: `input.mousePressed(0) && input.locked()` -> charging, charge = 0.
    - charging: charge = min(1, charge + dt / FISHING.chargeSeconds). On `input.mouseReleased(0)`: dist = minThrow + (maxThrow - minThrow) * charge; dir = `camera.getWorldDirection(v)` with y zeroed, normalised; land point = player xz + dir * dist, y = 0. -> flying for 0.6 s along a parabola (peak +3 m) from the hand (player position + (0, 1.1, 0)). `sfx('throw')`.
    - flying done -> floating: the hook drifts with flow. `input.mouseDown(0)` -> reeling.
    - reeling: while `mouseDown(0)` move the hook toward the player xz at `FISHING.reelSpeed`; on release go back to floating. `sfx('reel')` every 0.25 s while reeling.
    - In floating and reeling: unsnagged debris within `FISHING.hookRadius` (xz) of the hook becomes snagged and follows the hook (keep its offset, clamped to 0.6 m).
    - Hook within `FISHING.collectDistance` (xz) of the player: for each snagged debris `addItem(state, def.item, def.amount)`, `notify(state, '+' + def.amount + ' ' + ITEMS[def.item].name)`, `sfx('catch')`, remove it; hook -> idle.
    - Hook farther than `FISHING.despawnDistance` from the player: `notify(state, 'The line snapped!')`, release snagged, -> idle.
    - Hook y: RAFT_TOP + 0.1 where `isWalkable(state, x, z)`, else 0.05 + bob.
  - Visuals: hook = small red bobber sphere (r 0.12), hidden in idle/charging. Line = `THREE.Line` with a 12-point `BufferGeometry` from the hand to the hook, sagging slightly; update positions each frame (`attributes.position.needsUpdate = true`); hidden in idle/charging.
  - Charge bar: your own `<div id="rg-charge">` appended to `ctx.ui`, bottom-centre (bottom 90px), 160x10 px, white border, inner fill width = charge %, shown only while charging.

## Contract
`export function createFishing(ctx: Ctx): System` (unchanged signature). `sfx` from './audio' with names 'throw', 'reel', 'catch'.

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/fishing.ts`.

## Out of scope
Island crates, building, HUD, every other file.
