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
The game autosaves to localStorage and continues where you left off; a 'New raft' button on the title screen starts over.

## Read first
- games/gnaft/src/config.ts: `GameState` and every type it uses (`Tile`, `Prop`, `Stats`, `IslandState`, `ItemId`, `ToolId`, `BuildKind`)
- games/gnaft/src/rules.ts: `newState`, `tileKey`
- games/gnaft/src/save.ts: the stub (two exports to keep)

## Change
- games/gnaft/src/save.ts: implement both exports. Key: `'gnaft-save-v1'`. Wrap every localStorage access in try/catch (it can throw).
  - Saved JSON (`version: 1`): `time, inv, tools, equipped, hasTelescope, tiles` (array of `[i, j, growth]`), `tilesBuilt, buildKind, player` (`[x, y, z]` and `facing`), `sea` (all fields), `islands, dayTime, props, stats, won`. Do not save `mode`, `messages`, `raining` or player velocity.
  - `loadGame(state)`: read and parse; if missing, unparseable or version mismatch return false. Otherwise copy each field into the existing state object (keep `state.player.position` the same Vector3: use `.set`; rebuild `state.tiles` as a new Map with `tileKey`). Merge objects field by field over the defaults so a save missing a newer field still loads (e.g. `Object.assign(state.stats, saved.stats ?? {})`). Leave `state.mode` as 'title'. If there are no tiles after loading, return false and keep defaults. Return true.
  - `createSave(ctx)`: only when `location.hash === ''` (debug runs must not overwrite saves). Every 10 s while `state.mode !== 'title'`, write the save. Also save on `window` 'beforeunload' and on `document` 'visibilitychange' when hidden (not in 'title').
  - New game button: your own `<button id="rg-newgame">New raft</button>` appended to `ctx.ui`, `position:absolute; right:16px; bottom:16px; pointer-events:auto`, styled like a small dark translucent panel with white text. Shown only while `state.mode === 'title'` and a save exists in localStorage. Click: `confirm('Start a new raft? Your saved game will be lost.')`, then remove the key and `location.reload()`.

## Contract
```ts
export function loadGame(state: GameState): boolean; // main.ts calls it before creating systems
export function createSave(ctx: Ctx): System;
```

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/save.ts`.

## Out of scope
main.ts (it already calls `loadGame(state)` when there is no URL hash), every other file.
