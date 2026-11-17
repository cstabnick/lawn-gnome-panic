Epic: 2 (all modules, in parallel)
Depends on: none

(First read `docs/roadmaps/aether-board/_env.md`: environment and repo rules.)

## Goal
`src/audio.ts`: the sound of flow. Wind that rises with speed, board hiss while carving, crisp pops, punchy landings
(sparkly on perfect ones), grind grit, shimmering ley-lines, bails, boost sweeps, a warp swell, and a generated drum &
bass track underneath. All WebAudio / `@lawn/music`, no files.

## Read first
- `games/aether-board/src/audio.ts`: the stub you replace (keep `Audio`, `createAudio`).
- `games/aether-board/src/config.ts`: `Player` (vel, mode, boosting, grind), `PhysEvent`.
- `games/aether-board/src/volume.ts`: `volume.effective('sounds' | 'music')` (0..1) and `volume.subscribe(fn)`.
- `packages/music/src/index.ts` and `packages/music/src/engine.ts` lines 30-60 and 205-250: `playSong`, `setMuteKey`,
  `setMusicVolume(gain)`, `buildRunTrack(T, keep, out, seed)`. `games/gnome-creator/src/music.ts` is a working example
  of a game using them.
- `games/aether-board/src/app.ts`: `unlock()` is called from the click/pad press that starts the game; `update` every
  frame with that frame's events.

## Change
- `src/audio.ts`:
  - Nothing at import time. `unlock()`: create one `AudioContext` (resume it), master `GainNode` → `DynamicsCompressor`
    → destination. Master gain = `volume.effective('sounds')`, kept in sync via `volume.subscribe`. Start the music once:
    `setMuteKey('aether-board-music-muted')`, `setMusicVolume(volume.effective('music'))` (and on subscribe),
    `playSong((T, keep, out) => buildRunTrack(T, keep, out, (Date.now() & 0xffff) + 1))`. `location.hash` containing
    `mute` silences everything (skip music too).
  - **Loops** (started in unlock, gains driven in `update`, smoothed with `setTargetAtTime(…, 0.05)`):
    - wind: a 2 s looping white-noise buffer → bandpass (frequency `300 + speed * 22`, Q 0.8) → gain
      `0.5 * clamp(speed / 50) ** 1.5`, ×1.4 in the air.
    - board hiss: noise → highpass 1800 → gain `0.18 * clamp(speed / 30)` only on the ground, + a little more when the
      speed drops fast (braking).
    - grind: noise → bandpass 2800 (Q 3) + a 90 Hz sawtooth through lowpass 400, gain 0.25 while `p.mode === 'grind'`;
      on ley-lines instead a shimmering pair of sines (659 Hz and 988 Hz) with 7 Hz tremolo, gain 0.12.
  - **One-shots** (from `events`): 'pop' → 30 ms noise click (bandpass 1800) + a 140 → 70 Hz sine thump (80 ms);
    'land' → sine thump 90 → 40 Hz over 0.18 s with gain by `impact / 25` (0.2..0.8), and if `perfect` a bright triangle
    arpeggio (880, 1320, 1760 Hz, 50 ms apart); 'trickDone' → a short airy "whoosh-ding" (filtered noise sweep + a sine
    ding pitched by the trick); 'grabStart' → soft cloth swish; 'bail' → crunchy noise burst + a falling "wah"
    (sawtooth 400 → 90 Hz through a lowpass sweep); 'boostStart' → rising filtered sawtooth sweep (200 → 1600 Hz, 0.35 s);
    'warp' → a big major-chord swell of detuned saws with a slow attack (1 s) through a lowpass opening up; 'grindStart'
    → metallic clank (two short square blips 1200/1700 Hz).
  - Keep it mixed: one-shots peak around 0.3-0.5 before the master; nothing clips the compressor hard.

## Contract
```ts
export interface Audio { unlock(): void; update(p: Player, dt: number, events: PhysEvent[]): void }
export function createAudio(): Audio;
```

## Done when
- `npx tsc --noEmit -p games/aether-board` passes for your file.
- `grep -n "AudioContext" games/aether-board/src/audio.ts` shows it created only inside `unlock`.

## Out of scope
Every other file in `games/aether-board/src`, and `packages/`.
