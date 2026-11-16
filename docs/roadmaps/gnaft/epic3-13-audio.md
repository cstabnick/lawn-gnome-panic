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
Sounds for the new features: splash, thunder, gull, shark, bonk, win, bottle, chomp, and a rain loop.

## Read first
- games/gnaft/src/audio.ts: the current module (you extend it; keep `startAudio`, `sfx`, `setEngine`, `getAudio`, `setRain` exports)
- games/gnaft/src/config.ts: `SfxName` (new names: 'splash' | 'thunder' | 'gull' | 'shark' | 'bonk' | 'win' | 'bottle' | 'chomp')

## Change
- games/gnaft/src/audio.ts:
  - Add `sfx` cases (same helper style as the existing ones, all no-op before startAudio):
    - splash: bandpass noise burst 800 -> 300 Hz, 0.35 s.
    - thunder: lowpass (200 Hz) noise, 2.5 s, fast attack, long rumbling decay with a second swell at 0.4 s.
    - gull: two descending squeals: sawtooth 1400 -> 900 Hz through a bandpass, 0.18 s each, 0.1 s apart.
    - shark: ominous two low notes (the classic semitone): sawtooth 82 Hz then 87 Hz, 0.25 s each, lowpass 400 Hz.
    - bonk: sine 300 -> 120 Hz in 0.12 s plus a short noise click.
    - win: 5-note rising fanfare (square, C5 E5 G5 C6 E6), 0.12 s apart, last note held 0.5 s.
    - bottle: glassy clink: sine 2200 Hz and 3300 Hz, 0.3 s decay, then a soft cork 'pop' (sine 600 -> 200 Hz).
    - chomp: lowpass noise thump 0.12 s with a sine 90 Hz body.
  - Rate-limit 'splash', 'chomp' and 'gull' to once per 80 ms.
  - Implement `setRain(level)` (replace the stub body, keep the signature): no-op before startAudio. Lazily create a looping noise source -> highpass 1200 Hz -> lowpass 6000 Hz -> gain -> master; `gain.gain.setTargetAtTime(0.1 * level, ctx.currentTime, 0.3)`.

## Contract
```ts
export function startAudio(): void;
export function sfx(name: SfxName): void;
export function setEngine(level: number): void;
export function getAudio(): { ctx: AudioContext; master: GainNode } | null;
export function setRain(level: number): void;
```

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/audio.ts`.

## Out of scope
music.ts (another worker builds music on `getAudio()`), every other file.
