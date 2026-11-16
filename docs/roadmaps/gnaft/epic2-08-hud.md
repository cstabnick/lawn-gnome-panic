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
Title screen, inventory and tool display, mode hints, toasts, and the craft menu.

## Read first
- games/gnaft/src/config.ts: `ITEMS`, `ITEM_IDS`, `TOOLS`, `RECIPES`, `RECIPE_ORDER`, `BUILD_COSTS`, `KEYS`, `GameState`
- games/gnaft/src/rules.ts: `craft`, `hasItems`, `costText`

## Change
- games/gnaft/src/hud.ts: implement `createHud(ctx: Ctx): System`. Build all DOM once; in update only touch text/visibility when it changed (cache last strings). Inline styles: white text, `text-shadow: 0 1px 3px #000`, panels `background: rgba(10,30,45,0.75); border-radius: 10px; padding: 8px 12px`, font `system-ui`.
  - Title overlay `<div id="rg-title">` (full screen, `pointer-events:auto`, translucent dark-blue background): big "GNAFT", the line "Adrift on a patch of grass. Fish junk, grow your lawn-boat, find the islands.", a controls list (WASD + mouse: move/look; Space: jump; LMB hold+release: throw hook, hold: reel; E: cut grass / open crate; Q: switch mower; B: build; Tab: craft; T: telescope; C: chart course / cast off), and a "Click to start" button. On click: `state.mode = 'play'`, `startAudio()`, `sfx('click')`, `ctx.input.requestLock()`, remove the overlay.
  - HUD root `<div id="rg-hud">` (hidden in 'title'):
    - Inventory panel bottom-left: one row per item in `ITEM_IDS` with count > 0 (grass always shown): `ITEMS[id].icon + ' ' + ITEMS[id].name + ' ' + Math.floor(state.inv[id])`; fuel with one decimal.
    - Under it: `Tool: ${TOOLS[state.equipped].name}`, `🔭 Telescope` if `state.hasTelescope`, and `Raft: ${state.tiles.size} tiles`.
    - Hint line bottom-centre (bottom 24px): 'play' -> 'LMB fish · E cut · B build · Tab craft · Q tool · T telescope'; 'build' -> `Building ${BUILD_COSTS[state.buildKind].name} (${costText(BUILD_COSTS[state.buildKind].cost)}) · R switch · B exit`; 'craft' -> 'Tab to close'; 'telescope' -> '' (another system draws the scope).
    - Crosshair: a 6 px white dot at screen centre in 'play' and 'build'.
    - If `!ctx.input.locked()` in 'play'/'build': a small centred note 'Click to look around'.
  - Toasts: each frame move every string out of `state.messages` (`state.messages.splice(0)`) into a stack on the left side, top 70px; each fades out after 3.5 s; at most 5 (drop the oldest).
  - Craft menu `<div id="rg-craft">` (centred panel, `pointer-events:auto`): `KEYS.craft` pressed in 'play' -> `state.mode = 'craft'`, `ctx.input.exitLock()`, show it. `KEYS.craft` or `'Escape'` pressed in 'craft', or a close button -> `state.mode = 'play'`, hide. One card per `RECIPE_ORDER` id: name, desc, cost list (an item in red if `state.inv[item] < amount`), and a Craft button: disabled and labelled 'Owned' if owned (telescope: `state.hasTelescope`; others: `state.tools[id]`), disabled if `!hasItems(state, RECIPES[id].cost)`. Click -> `craft(state, id) ? sfx('craft') : sfx('error')`. Refresh card states about 5 times a second while open.

## Contract
`export function createHud(ctx: Ctx): System` (unchanged signature). From './audio': `startAudio(): void`, `sfx(name: SfxName): void`. Other systems append their own `#rg-charge`, `#rg-prompt`, `#rg-scope`, `#rg-compass` to `#ui`: do not create those, and keep the top-centre free for the compass.

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/hud.ts`.

## Out of scope
Every other file.
