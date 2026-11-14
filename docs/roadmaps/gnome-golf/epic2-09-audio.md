Epic: 2 Systems · Issue 9: audio
Depends on: none

## Goal
`src/audio.ts` makes all sound in code with WebAudio: club strikes, ball landings, splashes, the cup rattle, UI ticks, the mower's engine on the ride between shots, and a calm island soundscape (waves and distant gulls). No music: this is a pure golf experience.

## Read first
- `games/gnome-golf/src/config.ts`: `SfxName`, `GameState`, `FlightEvent`, `ShotResult`
- `games/gnome-golf/src/audio.ts` (stub: keep its three exports and signatures)

## Change
- `games/gnome-golf/src/audio.ts`:
  - `startAudio()`: create the `AudioContext` on first call (from a user gesture), `resume()` it on later calls. A master `GainNode` (0.8) -> destination. A mute toggle on the M key (`window` keydown) that sets master gain 0 / 0.8.
  - `sfx(name, volume = 1)`: synthesize one-shots (oscillators + noise buffers + gain envelopes, a little randomised pitch so repeats don't sound identical):
    - 'swing': a 0.25 s band-passed noise whoosh sweeping 400 -> 2000 Hz.
    - 'hit': a crisp click (very short noise burst, high-passed at 2 kHz, 30 ms) plus a 0.12 s triangle "tock" at ~900 Hz decaying fast; louder with volume.
    - 'putt': a soft 60 ms tick (sine 1400 Hz) with a little noise.
    - 'bounce': a dull thud (sine 180 -> 90 Hz in 80 ms + low-passed noise).
    - 'sand': a 150 ms low-passed noise "pff".
    - 'splash': 0.6 s noise through a low-pass that opens then closes, plus a few short bubbly sine blips.
    - 'cup': a hollow plastic rattle: 3-4 quick tocks (sine ~600-800 Hz, 40 ms apart) decaying.
    - 'tick': 25 ms square at 1200 Hz, quiet. 'click': 35 ms square at 800 Hz.
    - 'cheer': 0.8 s of several detuned sawtooth "yay" voices sliding up (gnome crowd), through a low-pass at 2.5 kHz, quiet.
    Does nothing if the context does not exist yet.
  - `createAudioSystem(ctx)`: returns a System whose `update(dt)`:
    - **Flight events**: when `state.phase === 'flight'` and `state.flight` is set, play each event once when `state.phaseTime` passes its `t`: 'bounce' -> `sfx('bounce', min(1, speed / 40))` or `sfx('sand')` when `lie === 'sand'`; 'water' -> 'splash'; 'cup' -> 'cup'. Track the last played index per flight (reset when `state.flight` changes identity).
    - **Cheer** once when the phase becomes 'holed' and `state.scores[state.holeIndex]` is at or under par minus 1 (`HOLES[state.holeIndex].par - 1`).
    - **Mower engine**: a looping sawtooth (~55 Hz) + square sub-oscillator through a low-pass (500 Hz) with a slight LFO wobble; gain ramps to 0.12 during 'drive' and to 0 otherwise (`setTargetAtTime`, 0.15 s). Pitch rises a little with drive progress early and falls at the end. Create it lazily after `startAudio`.
    - **Ambience**: looping waves: brown-ish noise through a low-pass whose cutoff and gain swell slowly (period ~7 s), gain ~0.05; a gull "kee-ow" (two short downward-sliding sine/triangle chirps ~1800 -> 1100 Hz) at random every 8-20 s, quiet. Starts once `startAudio` has been called, in every phase.
  - Read-only on `state`.

## Contract
Keep exactly: `export function startAudio(): void`, `export function sfx(name: SfxName, volume = 1): void`, `export function createAudioSystem(ctx: Ctx): System`. Other files already call these.

## Done when
- `cd /home/user/lawn-gnome-panic/games/gnome-golf && npx tsc --noEmit -p .` shows no errors in `src/audio.ts`.
- Calling any `sfx` name before `startAudio` does not throw.

## Out of scope
Every other file.
