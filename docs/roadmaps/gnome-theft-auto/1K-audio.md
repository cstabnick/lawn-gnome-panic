Epic: 1 (parallel modules)
Depends on: none

## Environment

- Repo root: `/home/user/lawn-gnome-panic` (Linux). Run commands from there. Dependencies are installed: do not run `npm install`. Do not commit.
- Game: `games/gnome-theft-auto` (three.js 0.187 + TypeScript + Vite). It already builds: every module exists as a STUB with its final exported signature. Your job is to replace ONE stub (or the files named below) with the real thing.
- About ten other workers are editing the other files of this game at the same time. Edit only the files your issue names. Keep every exported name and signature of your file exactly as in its stub, so other files keep compiling.
- The contracts are in `games/gnome-theft-auto/src/types.ts` (read it first, do not edit it) and all tuning numbers are in `games/gnome-theft-auto/src/config.ts` (read, do not edit). `src/collide.ts` (box collision, `angleDiff`) and `src/gnomes.ts` (town looks, names, `makeGnome`, `poseHandsUp`, `clearHandsUp`, `gnomeState`) are shared helpers: use them, do not edit them. `src/main.ts` is the wiring that calls your module; read it to see how you are called, do not edit it.
- Conventions: y up, 1 unit = one gnome's height (a gnome model is about 1.1 tall). Yaw 0 faces +z; forward = `(Math.sin(yaw), 0, Math.cos(yaw))`; the gnome's right = `(-Math.cos(yaw), 0, Math.sin(yaw))`. Turning right DECREASES yaw. Prefab models from `@lawn/prefabs` stand on y = 0 and face +z.
- `buildPrefab(id, { scale, tint })` (from `@lawn/prefabs`) returns a `THREE.Group`; it throws `Unknown prefab` for an id that does not exist yet. The new ids `squirt-pistol`, `super-soaker`, `zero-turn-mower`, `whirligig-mower`, `sandbag-wall`, `watch-tower` are being added by another worker right now; you may reference them, they will exist when the epic is done.
- Lore (Gnome Theft Auto is a parody set in the town of Turfton): no gore, nothing bleeds or dies; water guns only; soaked gnomes put their hands up and run. Gnomes are fired clay. No humans ever appear.
- Mobile matters: anything a player does must work by touch too (only the input/HUD issues build UI).
- Check: `npx tsc --noEmit -p games/gnome-theft-auto` must show no errors in YOUR files (errors in another worker's file mean they are mid-edit: ignore those). Do NOT run `vite build`, `npm run build` or a dev server: other workers share the folder and the port.

## Goal
`games/gnome-theft-auto/src/audio.ts`: synthesized Web Audio sound effects (no files) and a mower engine hum that follows speed, with a rotor flutter for the flying mower.

## Read first
- `games/gnome-theft-auto/src/types.ts`: `Sfx` (`'squirt' | 'splash' | 'steal' | 'door' | 'alarm' | 'whistle' | 'washed' | 'bump'`).
- `games/gnome-theft-auto/src/audio.ts`: the stub. Keep `unlockAudio()`, `play(s: Sfx)`, `setEngine(on, speed01, flying)`, `setMuted(m)`.
- `games/gnome-theft-auto/src/main.ts`: `play('squirt')` can be called ~8 times a second; `setEngine` every frame.

## Change
`games/gnome-theft-auto/src/audio.ts` only.

- `unlockAudio()`: create the `AudioContext` on the first call (from a user gesture), `resume()` it. Everything else does nothing until then. A master `GainNode` at 0.5; `setMuted(m)` sets it to 0 / 0.5. Also toggle mute with the `KeyM` key (add one keydown listener at module load) and remember it in `localStorage` key `gta.muted` (wrap storage in try/catch).
- One shared white-noise `AudioBuffer` (1 s) built once.
- Sounds (each a few nodes, released after they end):
  - `squirt`: 60 ms noise through a bandpass at 2500 Hz, quick decay, gain 0.25. Skip if another squirt played less than 50 ms ago.
  - `splash`: 180 ms noise through a lowpass sweeping 3000 → 400 Hz, gain 0.3.
  - `steal`: two square-wave notes 440 then 660 Hz, 90 ms each, gain 0.15.
  - `door`: 40 ms click (noise, highpass 1500 Hz) + 80 ms sine 180 Hz thunk.
  - `alarm`: 1.2 s sawtooth whose frequency wobbles 600↔900 Hz at 3 Hz, through a lowpass 2000 Hz, gain 0.12.
  - `whistle`: 0.5 s sine around 2200 Hz with 25 Hz vibrato (a referee-style trill), gain 0.12.
  - `washed`: 0.8 s sine sliding 600 → 120 Hz plus a short splash.
  - `bump`: 120 ms sine 90 → 45 Hz, gain 0.4.
- Engine: one persistent sawtooth oscillator → lowpass (600 Hz) → gain, created lazily. `setEngine(on, speed01, flying)`: target frequency `55 + 95 * speed01` (`setTargetAtTime`, 0.08 s), gain target 0.07 when on, 0 when off. When `flying`, an LFO at 18 Hz modulates the engine gain (depth 0.04) for a rotor flutter; when not flying, the LFO depth is 0. Only call `setTargetAtTime` when a value changed noticeably (it is called every frame).

## Contract
The four exports keep the stub's signatures.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/audio.ts`.

## Out of scope
Every other file.
