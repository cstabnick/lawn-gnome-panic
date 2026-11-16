Epic: 3 Trees, music, cigarillos and golf water · Issue 2: relaxing ambient golf music
Depends on: none

## Goal
Gnome Golf gets slow, relaxing ambient music, generated in code with Tone.js in the shared `@lawn/music` package (the same approach as the other games' music): soft pads, gentle electric piano, a lazy bass, light brushed percussion at most, lots of reverb. Think a calm golf broadcast or a sunny clubhouse lounge. It loops forever and never gets busy.

## Read first
- `packages/music/README.md` and `packages/music/src/engine.ts` (how `playSong`, `SongBuilder`, `Keep`, `setMuteKey`, `isMuted`, `setMuted` work)
- `packages/music/src/menuTheme.ts` (a composed track: how parts are built with `keep(new T.X(...))`, connected to `out`, and scheduled with `T.getTransport()`, `T.Loop`/`T.Part`/`transport.scheduleRepeat`)
- `packages/music/src/mix.ts` (`createFx`: reverb and delay returns) and `packages/music/src/theory.ts` (`mulberry32`, `midiToNote`, `MODES`, `chordTones`, voice leading helper)
- `packages/music/src/golfAmbient.ts` (stub) and `games/gnome-golf/src/music.ts` (stub)

## Change
- `packages/music/src/golfAmbient.ts`: implement `export function buildGolfAmbient(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void`.
  - Tempo 68-76 BPM (pick by seed). Key and mode by seed from major-ish modes: `MODES.lydian`, `MODES.mixolydian`, or major (`[0, 2, 4, 5, 7, 9, 11]`, declare it locally), tonic between D and A.
  - Harmony: a bank of 4 slow 4-chord progressions (scale degrees, 2 bars per chord), 7th and 9th chords via `chordTones`, voice-led (reuse theory.ts helpers). Pick 2 progressions by seed for sections A and B; form A A B A, looped.
  - Parts (all through `keep`, all quiet; `out` is already at -12 dB):
    - Pad: `PolySynth(Synth)` fatsine/fattriangle, attack ~2 s, release ~4 s, through a low-pass ~1500 Hz and a big reverb send (createFx with reverbDecay ~8). Holds each chord.
    - Electric piano: `PolySynth(FMSynth)` (soft, like the menu theme's keys) playing sparse broken-chord arpeggios: 3-5 notes per bar on a gentle, slightly swung 8th grid, many rests; velocity 0.3-0.5 humanized. Light tremolo, delay send.
    - Bass: sine `MonoSynth`, chord roots on beat 1 and sometimes beat 3, long notes, low-passed.
    - Melody: an occasional soft bell or flute-like voice (sine/triangle with slow attack) playing a short phrase from the chord tones every 4 bars, rests otherwise; seeded, never random per loop (generate the phrases once).
    - Percussion (optional, very light): a brushed noise "swish" on 2 and 4 and a soft rim click, high-passed, at -30 dB or quieter. Leave it out of the first A section.
    - Nature touch: none (the game's audio already has waves and gulls).
  - Keep the CPU light: at most ~16 voices total, no more than one reverb (from createFx).
  - All notes come from seeded generation (`mulberry32(seed)`) done once at build time; the loop replays them.
- `packages/music/src/index.ts`: already exports `buildGolfAmbient` (do not touch).
- `packages/music/README.md`: add one bullet describing the golf ambient track and that `games/gnome-golf` uses it.
- `games/gnome-golf/src/music.ts`: implement `export function createMusic(ctx: Ctx): System`:
  - `setMuteKey('gnome-golf-music-muted')` at create.
  - Start the song once, the first frame `ctx.state.phase !== 'title'` (the TEE OFF tap is the user gesture): `playSong((T, keep, out) => buildGolfAmbient(T, keep, out, seed))` with a random seed. Also start it on the title screen after any first pointerdown (so the title has music); just never start it twice.
  - A small round music toggle button `<button id="gmu-btn">` (44px, ♪ when on, ♪ with a strike / 🔇 when muted, `rgba(10,30,20,0.55)` background, white) appended (inside your own `<div id="gmu-root">`) to `ctx.ui`, placed top-right just under the minimap: `top: calc(env(safe-area-inset-top) + 176px); right: calc(env(safe-area-inset-right) + 10px)`, `pointer-events:auto`, `pointerdown` toggles `setMuted(!isMuted())`. Key N also toggles. Visible in every phase.
  - Import from `'@lawn/music'` (`playSong`, `setMuteKey`, `isMuted`, `setMuted`, `buildGolfAmbient`). The dependency is already in games/gnome-golf/package.json and installed.

## Contract
- `export function buildGolfAmbient(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void` in packages/music/src/golfAmbient.ts.
- `export function createMusic(ctx: Ctx): System` in games/gnome-golf/src/music.ts. Element ids start with `gmu-`.

## Done when
- `cd /home/user/lawn-gnome-panic && npm run typecheck -w packages/music` passes.
- `cd /home/user/lawn-gnome-panic/games/gnome-golf && npx tsc --noEmit -p .` shows no errors in `src/music.ts`.
- Do not edit any other file in packages/music besides golfAmbient.ts and README.md (other games use it).

## Out of scope
Every other file, including the other tracks in packages/music and games/gnome-golf/src/audio.ts (sound effects).
