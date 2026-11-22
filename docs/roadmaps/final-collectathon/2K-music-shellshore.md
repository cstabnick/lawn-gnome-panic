Epic: 2 Systems
Depends on: none (Epic 1 is done: the theme stub exists and is exported)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Two other workers are writing the other two themes (`fcHoldMusic.ts`, `fcSynergyLoop.ts`) in the same folder right now. Edit only `packages/music/src/themes/fcShellshore.ts` and create `packages/music/src/themes/fcShellshore.test.ts`. Do not edit `index.ts` or `fcShared.ts` (already done).
- Rules from `packages/music/README.md`: music is generated in code (Tone.js, no samples). A one-note voice (`Synth`, `MonoSynth`, `MembraneSynth`, `NoiseSynth`, ...) must never be triggered twice at the same instant or within ~50 ms: give chords a `PolySynth` and doublings their own voice, and use a monotonic time guard per mono voice (see `gardenLullaby.ts`'s `mono()` helper). Keep the low end (< ~220 Hz) out of reverb/delay inputs: use `createFx` from `../mix`, which high-passes its inputs. High-pass pads/leads above ~200 Hz. Wrap every note trigger in try/catch so a bad note never kills the song. For bright major tracks avoid harsh diminished/tritone chords.

## Goal

Write **Shellshore**, the third of The Final Collectathon's soundtracks: a dreamy, slow island lullaby for the
beach planet. It starts almost empty (pads and ocean) in the silent top floor after the collecting stops, and blooms
into the full song for the flight into the sky and the beach.

## Read first

- `packages/music/src/themes/gardenLullaby.ts`: the whole file; the closest relative (slow, soft, `T.Part` per voice in seconds, `createFx`, `mono()`).
- `packages/music/src/themes/fcShared.ts`: `FcMusicOptions`, `FcMusicHooks`.
- `packages/music/src/theory.ts` (exports only) and `packages/music/src/themes/gnomeFront.test.ts` (test pattern).

## Change

`packages/music/src/themes/fcShellshore.ts`: replace the stub body, keep the signature:

```ts
export function buildFcShellshore(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number, opts: FcMusicOptions = {}): FcMusicHooks
```

The music:
- 72 bpm, A♭ major (tonic A♭2/A♭3 = MIDI 56), 16 bars looping. Chords one per bar: `Imaj7 IVmaj7 vi7 V` then `Imaj7 II (the lydian major II, i.e. a B♭ major triad over A♭) IVmaj7 Isus2` — write them as explicit MIDI sets relative to the tonic so the lydian II is exact: `II = tonic + [2, 6, 9]`.
- Voices:
  - **Warm pad**: `PolySynth(Synth)` `fattriangle`, slow attack 1.5 s, long release, low-passed ~1.6 kHz, lots of reverb. Always on.
  - **Ocean**: a `Noise('pink')` source started once, through a lowpass ~800 Hz whose gain swells slowly (a `T.LFO` at ~0.08 Hz on a `Gain`, range 0.02..0.12) — a wave washing in and out. Always on. (A continuous source, not a triggered voice; dispose it via `keep`.)
  - **Steel drum melody**: `PolySynth(FMSynth)` with a steel-pan tone (harmonicity ~3.5, modulationIndex ~5 with a quick modulation decay, sine carrier, 0.8 s decay), a gentle singable tune from the major pentatonic generated once from the seed, two-bar phrases with space between them. Into delay + reverb.
  - **Ukulele strum**: `PolySynth(PluckSynth)` is not polyphonic in Tone, so use 4 separate `PluckSynth`s (one per string) and strum each chord as 4 notes 25 ms apart (each voice its own string: no conflicts), pattern down-down-up-up-down-up on eighths. High-passed 250 Hz.
  - **Round bass**: `MonoSynth` sine, root on 1 and fifth on 3. Low-passed 400 Hz, dry.
  - **Shaker**: very soft pink-noise `NoiseSynth` on the off-eighths.
- **Intensity** (read `const x = opts.intensity?.() ?? 0` at the start of each bar inside the Part callbacks — store it in a variable updated by a 1-bar `T.Loop` — and skip a voice's notes when it is "off"): pad + ocean always; `x >= 0.5` adds the steel drum melody; `x >= 0.9` adds the strum, bass and shaker. Fade layers in over a bar by ramping each layer's own `Volume` node rather than switching hard.
- **Pickup hook**: a soft bell `PolySynth(Synth)` (sine, 1.2 s decay, into reverb). Return `{ pickup() { ... } }` that plays the next note of the A♭ major pentatonic upward from A♭5 at `T.now()`, resetting after 1.2 s, wrapping after 6 notes, throttled to one note per 80 ms, try/catch.

`packages/music/src/themes/fcShellshore.test.ts` (new), like `gnomeFront.test.ts`, building at intensities 0, 0.5
and 1 (`(T, keep, out) => { buildFcShellshore(T, keep, out, 42, { intensity: () => x }); }`): for each, no graph
problems (`lintSongGraph(build).issues` equals `[]`) and no one-note conflicts (`captureNoteEvents(build, 120,
conflicts)`, conflicts empty); at intensity 1, `analyzeTheory(build, 40).detectedKey.inScaleRatio > 0.85` (the lydian
D natural in chord II is one note in many; if the ratio falls short, keep the melody off the #4).

## Contract

The exported signature above, unchanged.

## Done when

- `npx vitest run src/themes/fcShellshore.test.ts` from `packages/music` passes (only your test file).
- `npx tsc --noEmit -p packages/music` shows no errors in your two files.

## Out of scope

Every other file in `packages/music` (especially `index.ts`, `fcShared.ts`, `fcHoldMusic.ts`, `fcSynergyLoop.ts`), `games/**`.
