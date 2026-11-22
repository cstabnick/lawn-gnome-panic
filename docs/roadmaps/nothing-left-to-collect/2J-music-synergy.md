Epic: 2 Systems
Depends on: none (Epic 1 is done: the theme stub exists and is exported)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Two other workers are writing the other two themes (`fcHoldMusic.ts`, `fcShellshore.ts`) in the same folder right now. Edit only `packages/music/src/themes/fcSynergyLoop.ts` and create `packages/music/src/themes/fcSynergyLoop.test.ts`. Do not edit `index.ts` or `fcShared.ts` (already done).
- Rules from `packages/music/README.md`: music is generated in code (Tone.js, no samples). A one-note voice (`Synth`, `MonoSynth`, `MembraneSynth`, `NoiseSynth`, ...) must never be triggered twice at the same instant or within ~50 ms: give chords a `PolySynth` and doublings their own voice, and use a monotonic time guard per mono voice (see `gardenLullaby.ts`'s `mono()` helper). Keep the low end (< ~220 Hz) out of reverb/delay inputs: use `createFx` from `../mix`, which high-passes its inputs. High-pass pads/leads above ~200 Hz. Wrap every note trigger in try/catch so a bad note never kills the song.

## Goal

Write **Synergy Loop**, the second of Nothing Left to Collect's soundtracks: a bouncy corporate-funk collectathon
theme that escalates into absurdity as the player collects harder. It plays on Floors 2 and 2½ and in the first
phase of the top floor.

## Read first

- `packages/music/src/themes/gardenLullaby.ts`: the pattern (event lists from `mulberry32(seed)`, `T.Part` per voice, `createFx`, `mono()`).
- `packages/music/src/themes/gnomeFront.ts`: how a theme reads `opts.intensity()` while playing (layers coming in and out) — skim for the pattern only.
- `packages/music/src/themes/fcShared.ts`: `FcMusicOptions`, `FcMusicHooks`.
- `packages/music/src/theory.ts` (exports only) and `packages/music/src/themes/gnomeFront.test.ts` (test pattern).

## Change

`packages/music/src/themes/fcSynergyLoop.ts`: replace the stub body, keep the signature:

```ts
export function buildFcSynergyLoop(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number, opts: FcMusicOptions = {}): FcMusicHooks
```

The music (16-step sixteenth-note grid, 4/4):
- F major (tonic F3 = MIDI 53), chords one per bar `I vi IV V` (degrees `[0,5,3,4]`), 8-bar phrases looping.
- **Schedule on the Transport's musical time so tempo changes speed everything up**: use one `keep(new T.Loop((time) => step(time), '16n')).start(0)` with a step counter (the test harness in `packages/music/src/analyze/theory.ts` simulates `T.Loop` and `T.Part`, but NOT `scheduleRepeat`) (`bar = floor(step / 16)`, `s = step % 16`), not Parts in seconds. Read `const x = opts.intensity?.() ?? 0` once per bar (on `s === 0`).
- **Tempo**: start at 116 bpm. Once per bar set `T.getTransport().bpm.rampTo(116 + 34 * x, 2)` (150 at full intensity).
- **Layers by intensity** (decided each bar):
  - always: **marimba** ostinato (`PolySynth(FMSynth)` or `PolySynth(Synth)` with a short woody envelope) playing a bouncy chord-tone pattern on sixteenths (e.g. steps 0,3,6,8,10,12,14, generated once from the seed per chord shape) and a **slap/pluck bass** (`MonoSynth`, square or saw, filter envelope pop) syncopated on the root/octave/fifth.
  - `x >= 0.33`: **drum kit**: `MembraneSynth` kick on 0, 7, 8 (four-on-the-floor-ish with a push), `NoiseSynth` snare on 4 and 12, closed hat `NoiseSynth`/`MetalSynth` on every eighth.
  - `x >= 0.66`: **pizzicato strings** (short `PolySynth(Synth)` plucks doubling the chord on 2 and 10), **brass stabs** (`PolySynth(Synth)` sawtooth through a lowpass ~2.2 kHz, the chord on the last eighth of every other bar) and **claps** (a second `NoiseSynth` with a bandpass, on 4 and 12, layered with the snare as its own voice).
  - `x >= 0.9`: an over-the-top **lead** (a detuned `fatsawtooth` `Synth`, lowpassed, with delay) playing a triumphant melody generated once from the major scale, AND a **key change up one semitone every 16 bars** (keep a `transpose` counter added to every pitched note; cap it at +6 then fall back to 0 — the escalation that never stops).
- Mix: marimba and bass forward, drums punchy but not loud, everything under about -8 dB per voice.
- **Pickup hook**: a separate bright `PolySynth(Synth)` pluck (triangle, 0.25 s decay). Return `{ pickup() { ... } }` that plays the next note of the F major scale upward from F5 (plus the current `transpose`), at `T.now()`, resetting after 1.2 s without a pickup, wrapping after 8 notes (then start again an octave lower). Throttle to one note per 50 ms. try/catch.

`packages/music/src/themes/fcSynergyLoop.test.ts` (new), like `gnomeFront.test.ts`, building the theme at two
intensities:
```ts
const at = (x: number) => (T: Tone, keep: Keep, out: ToneNS.Volume) => { buildFcSynergyLoop(T, keep, out, 42, { intensity: () => x }); };
```
For `[['calm', 0], ['busy', 0.5], ['absurd', 1]]`: no graph problems (`lintSongGraph(build).issues` equals `[]`) and no one-note conflicts (`captureNoteEvents(build, 120, conflicts)`, conflicts empty). For `calm` only: `analyzeTheory(build, 40).detectedKey.inScaleRatio > 0.85` (the key changes at full intensity would fail a key test).

## Contract

The exported signature above, unchanged.

## Done when

- `npx vitest run src/themes/fcSynergyLoop.test.ts` from `packages/music` passes.
- `npx tsc --noEmit -p packages/music` shows no errors in your two files.

## Out of scope

Every other file in `packages/music` (especially `index.ts`, `fcShared.ts`, `fcHoldMusic.ts`, `fcShellshore.ts`), `games/**`.
