Epic: 2 Systems
Depends on: none (Epic 1 is done: the game builds with stubs)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Eleven other workers are filling other files right now, including the three music themes inside `packages/music/src/themes/fc*.ts` (their exported signatures are fixed and already compile). Edit only `games/final-collectathon/src/sfx.ts` and `src/music.ts`. `tsc` may show errors in other files mid-edit; only yours must be clean.
- Repo rule: audio is generated in code only (no sound files). Audio must never throw into the game: wrap WebAudio work in try/catch.

## Goal

Replace two stubs: `sfx.ts` (short WebAudio sound effects, a climbing pickup tick, and the `@lawn/mutter` speaking
voice per speaker) and `music.ts` (the controller that plays the game's three themes through `@lawn/music`).

## Read first

- `games/final-collectathon/src/sfx.ts`, `src/music.ts` (stubs) and `src/types.ts`: `Sfx`, `MusicController`, `SfxName`, `TrackId`, `Speaker`, `ItemKind`.
- `games/final-collectathon/src/config.ts`: `SPEAKERS[who].hz` (voice pitch), `MUSIC_MUTE_KEY`.
- `packages/mutter/README.md`: `createMutter({ gain: () => number })`, `voice.unlock()`, `voice.say(text, hz)` returns seconds, `voice.stop()`.
- `packages/music/src/engine.ts` (exports only): `playSong(build)`, `stopSong()`, `setMuteKey(key)`, `setMuted(m)`, `setSongMuffled(on)`; a `SongBuilder` is `(T, keep, out) => void`.
- `packages/music/src/themes/fcShared.ts`: `FcMusicOptions { intensity?: () => number }`, `FcMusicHooks { pickup(): void }`.

## Change

### `src/sfx.ts`: `createSfx(): Sfx`

- One lazily created `AudioContext` (create it in `unlock()`, which is called from the first pointerdown/keydown; also `resume()` it there). Before unlock, every call is a silent no-op. A master `GainNode` at 0.5; `setMuted(m)` sets it to 0 / 0.5 and also silences the voice.
- `play(name)`: tiny synthesized sounds with oscillators + gain envelopes (each under 0.6 s):
  - `ui`: a soft 660 Hz sine tick (40 ms).
  - `ding`: the lift bell, two sine notes 880 then 659 Hz with a 1 s decay.
  - `door`: a filtered noise whoosh, 0.4 s (noise from a 1 s `AudioBuffer` created once).
  - `toast`: a cheerful three-note triangle arpeggio up (C6 E6 G6, 60 ms apart).
  - `whoosh`: a noise sweep with a bandpass rising 400 → 3000 Hz over 0.5 s.
  - `thud`: a 70 Hz sine drop to 40 Hz, 0.3 s.
  - `denied`: two short square-wave buzzes at 180 Hz, quiet.
  - `fanfare`: a five-note brassy sawtooth (lowpass 2 kHz) flourish, 0.6 s.
  - `stamp`: a short noise burst + 120 Hz sine, 0.12 s.
- `pickup(kind, combo)`: a very short (50 ms) quiet pluck whose pitch climbs with `combo` along a major pentatonic from C6 (wrap after 10 steps, up an octave at most once). Golden acorns, stars and badges add a second note a fifth above. Throttle: at most one pickup sound every 35 ms (skip extras), because Chapter 4 picks up hundreds a second.
- `voice(who, text)`: `createMutter({ gain: () => muted ? 0 : 0.5 })` once; `return voice.say(text, SPEAKERS[who].hz)` (try/catch → 0). Before unlock return 0. `stopVoice()` → `voice.stop()`. `unlock()` also calls `voice.unlock()`.

### `src/music.ts`: `createMusic(): MusicController`

```ts
import { buildFcHoldMusic, buildFcShellshore, buildFcSynergyLoop, playSong, setMuteKey, setMuted, setSongMuffled, stopSong, type FcMusicHooks } from '@lawn/music';
```
- Call `setMuteKey(MUSIC_MUTE_KEY)` once at creation.
- State: `current: TrackId | null`, `level` (intensity, 0..1), `hooks: FcMusicHooks | null`, a numeric seed (fixed `20261122` so the music is the same every run).
- `play(track)`: if `track === current`, do nothing. Else `current = track`, `hooks = null`, and
  `playSong((T, keep, out) => { hooks = BUILDERS[track](T, keep, out, seed, { intensity: () => level }); })` with
  `BUILDERS = { 'hold-music': buildFcHoldMusic, 'synergy-loop': buildFcSynergyLoop, shellshore: buildFcShellshore }`.
- `intensity(x)`: `level = clamp(x, 0, 1)` (the themes read it through the closure; no restart).
- `pickup()`: `hooks?.pickup()` inside try/catch.
- `muffle(on)`: `setSongMuffled(on)`.
- `stop()`: `stopSong()`, `current = null`, `hooks = null`.
- `setMuted(m)`: `setMuted(m)` from `@lawn/music` (rename the import to avoid the clash, e.g. `setMuted as setMusicMuted`).
- `current()`: returns `current`.

## Contract

```ts
export function createSfx(): Sfx;            // sfx.ts
export function createMusic(): MusicController; // music.ts
```
Both exactly as in `types.ts`. `@lawn/music` exports `buildFcHoldMusic`, `buildFcSynergyLoop`, `buildFcShellshore`
with the signature `(T, keep, out, seed: number, opts?: FcMusicOptions) => FcMusicHooks`.

## Done when

- `npx tsc --noEmit -p games/final-collectathon` shows no errors in `src/sfx.ts` and `src/music.ts`.
- Neither file touches `window`/`AudioContext` at import time (only inside functions), so tests that import modules nearby never crash.

## Out of scope

`packages/music/**` (other workers write the themes), every other file under `games/final-collectathon/`.
