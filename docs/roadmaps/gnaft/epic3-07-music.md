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
Gentle generative sea-shanty background music, synthesised with WebAudio, that changes mood at night and in rain. M toggles it.

## Read first
- games/gnaft/src/audio.ts: `getAudio(): { ctx: AudioContext; master: GainNode } | null` (null until the player clicks start)
- games/gnaft/src/config.ts: `KEYS.music`, `GameState.raining`
- games/gnaft/src/rules.ts: `nightAmount`, `notify`

## Change
- games/gnaft/src/music.ts: implement `createMusic(ctx: Ctx): System`.
  - Each update, if `getAudio()` is null do nothing. Otherwise create once: a music `GainNode` (0.12) -> `master`.
  - Lookahead scheduler: keep `nextNoteTime` (AudioContext time); in update, while `nextNoteTime < audio.ctx.currentTime + 0.3`, schedule the next 8th note and advance by one 8th at 84 BPM in 6/8 (an 8th = 60 / 84 / 2 s). If the scheduler fell behind (nextNoteTime < currentTime), reset it to currentTime + 0.05.
  - Harmony: 2 bars per chord, progression I - IV - V - I in C major by day; A minor (i - iv - v - i) while `state.raining`. Bass: triangle oscillator, root on beat 1 and fifth on beat 4 of each bar, 0.35 s, gentle envelope. Melody: sine (or soft square through a 1200 Hz lowpass) random walk on the pentatonic scale of the current key (C D E G A / A C D E G) mostly in steps, octave 5, 60% of 8ths sounding, notes 0.2-0.4 s with an exponential decay. A soft 'squeezebox' chord pad: two detuned sawtooths through a 900 Hz lowpass, very quiet (0.02), held for each bar.
  - Mood: at night (`nightAmount(state) > 0.5`) drop the melody one octave and halve its density. Stop and disconnect every node after it ends (`osc.stop(t)` and `onended` disconnect).
  - Mute: `input.pressed(KEYS.music)` toggles; ramp the music gain to 0 or 0.12 over 0.5 s; `notify(state, muted ? 'Music off (M)' : 'Music on (M)')`.
  - Do not play in 'title' (the context may already exist after a restart).

## Contract
`export function createMusic(ctx: Ctx): System` (stub exists). Read only `getAudio` from audio.ts; do not edit audio.ts.

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/music.ts`.

## Out of scope
audio.ts (another worker is editing it), every other file.
