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
Sound effects, an ocean ambience and a mower engine hum, all synthesised with WebAudio (no files).

## Read first
- games/gnaft/src/audio.ts: the stub (signatures to keep)
- games/gnaft/src/config.ts: `SfxName`
- games/sample-3d/src/audio.ts: an existing WebAudio sfx module in this repo, for style (read only, never edit)

## Change
- games/gnaft/src/audio.ts: implement the three exports.
  - `startAudio()`: create the `AudioContext` once (or `resume()` it), a master `GainNode` (0.6) to destination, and start the ambience: a looping white-noise `AudioBufferSourceNode` (2 s buffer, `loop = true`) -> `BiquadFilterNode` lowpass about 500 Hz -> ambience gain (base 0.07) whose `gain` AudioParam is modulated by an `OscillatorNode` LFO at 0.12 Hz through a GainNode of 0.04, so it swells like waves.
  - `sfx(name)`: no-op before `startAudio()`. Short synth sounds (< 0.5 s) from oscillators/noise with an exponential gain envelope: throw = rising noise whoosh; reel = tiny tick; catch = two-note rising chime (square 660 then 990 Hz); place = soft thump (sine 120 -> 60 Hz); cut = short filtered noise snip; craft = 3-note arpeggio; spot = bright bell (sine 1320 Hz, 0.4 s decay); dock = low horn (sawtooth 110 Hz, lowpass); loot = coin-like blips; error = low buzz (square 90 Hz); click = 5 ms tick. Rate-limit 'cut' and 'reel' to once per 60 ms.
  - `setEngine(level)`: no-op before `startAudio()`. Lazily create a sawtooth oscillator ~55 Hz plus a square at 110 Hz -> lowpass 600 Hz -> gain. On each call `gain.gain.setTargetAtTime(0.08 * level, ctx.currentTime, 0.1)` and the frequencies `setTargetAtTime(55 + 25 * level, ...)` (square at double). Level 0 = silent (oscillators keep running).

## Contract
```ts
export function startAudio(): void;
export function sfx(name: SfxName): void;
export function setEngine(level: number): void;
```

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/audio.ts`.

## Out of scope
Every other file, including games/sample-3d.
