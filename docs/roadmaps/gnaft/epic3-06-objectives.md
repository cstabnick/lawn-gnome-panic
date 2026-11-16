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
A goal tracker that walks the player through the whole progression, ending in a victory screen.

## Read first
- games/gnaft/src/config.ts: `GameState` (`stats`, `tilesBuilt`, `hasTelescope`, `tools`, `islands`, `won`, `time`, `tiles`)
- games/gnaft/src/rules.ts: `notify`

## Change
- games/gnaft/src/objectives.ts: implement `createObjectives(ctx: Ctx): System`.
  - Objectives, in order, each `{ text: string; done: (s: GameState) => boolean }`:
    1. 'Cut some grass (E on a grown tile)' — `s.stats.cut >= 1`
    2. 'Fish up 3 pieces of junk (hold LMB, release, hold to reel)' — `s.stats.caught >= 3`
    3. 'Expand the raft by 3 tiles (B)' — `s.tilesBuilt >= 3`
    4. 'Craft a telescope (Tab)' — `s.hasTelescope`
    5. 'Spot an island through the telescope (T)' — any island spotted
    6. 'Land on Scrapyard Isle (C in the telescope to chart a course)' — `s.islands.scrapyard.visited`
    7. 'Craft a push mower' — `s.tools.push`
    8. 'Land on Fuel Depot Key' — `s.islands.fuelDepot.visited`
    9. 'Craft a gas mower' — `s.tools.gas`
    10. 'Land on the Mower Graveyard' — `s.islands.mowerGraveyard.visited`
    11. 'Craft the riding mower' — `s.tools.riding`
    12. 'Grow your raft to 40 tiles' — `s.tiles.size >= 40`
  - The current objective is the first one not done (computed every frame, so a loaded save is right). When the index increases during play: `notify(state, 'Goal complete: ' + text)` and `sfx('loot')`. Do not notify for jumps that happen in the first frame (e.g. after loading a save).
  - Panel: your own `<div id="rg-goals">` appended to `ctx.ui`, `position:absolute; top:204px; right:12px; width:220px`, dark translucent panel like `background: rgba(10,30,45,0.75); border-radius:10px; padding:8px 12px`, white text with `text-shadow: 0 1px 3px #000`, font system-ui 14px. Content: 'GOAL n/12' small caps line, then the objective text. Hidden in 'title' and 'telescope'. Only touch the DOM when text changes.
  - Victory: when all 12 are done and `!state.won`: `state.won = true`, `sfx('win')`, show your own centred overlay `<div id="rg-win">` (`pointer-events:auto`): 'LAWN OF THE SEAS', 'You built a riding-mower-powered lawn empire adrift at sea.', stats: time played (mm:ss from `state.time`), `stats.cut` tiles mowed, `stats.caught` junk fished, raft size, `stats.gullsScared` gulls shooed, `stats.sharksBonked` sharks bonked, `stats.tilesLost` tiles lost to sharks; and a 'Keep mowing' button that hides it and calls `ctx.input.requestLock()`. Call `ctx.input.exitLock()` when it appears. If the game was loaded already won, do not show it again.

## Contract
`export function createObjectives(ctx: Ctx): System` (stub exists). You own `state.won`. `sfx` from './audio' with names 'loot' and 'win'.

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/objectives.ts`.

## Out of scope
Every other file.
