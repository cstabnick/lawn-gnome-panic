Epic: 2 Systems
Depends on: none (Epic 1 is done: the theme stub exists and is exported)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Two other workers are writing the other two themes (`fcSynergyLoop.ts`, `fcShellshore.ts`) in the same folder right now. Edit only `packages/music/src/themes/fcHoldMusic.ts` and create `packages/music/src/themes/fcHoldMusic.test.ts`. Do not edit `index.ts` or `fcShared.ts` (already done).
- Rules from `packages/music/README.md`: music is generated in code (Tone.js, no samples). A one-note voice (`Synth`, `MonoSynth`, `MembraneSynth`, `NoiseSynth`, ...) must never be triggered twice at the same instant or within ~50 ms: give chords a `PolySynth` and doublings their own voice, and use a monotonic time guard per mono voice (see `gardenLullaby.ts`'s `mono()` helper). Keep the low end (< ~220 Hz) out of reverb/delay inputs: use `createFx` from `../mix`, which high-passes its inputs. High-pass pads/leads above ~200 Hz. Wrap every note trigger in try/catch so a bad note never kills the song.

## Goal

Write **Hold Music**, the first of Nothing Left to Collect's three soundtracks: smooth bossa-lounge office muzak,
polite and a little too pleased with itself. It plays in reception, on Floor 1 and on every lift ride (muffled).

## Read first

- `packages/music/src/themes/gardenLullaby.ts`: the whole file. It is the pattern to copy: generate event lists once from `mulberry32(seed)`, schedule each voice as a looping `T.Part` in seconds, `createFx`, the `mono()` time guard.
- `packages/music/src/themes/fcShared.ts`: `FcMusicOptions`, `FcMusicHooks`.
- `packages/music/src/theory.ts` (exports only): `mulberry32`, `MODES`, `chordTones`, `voiceLead`, `midiToNote`.
- `packages/music/src/themes/gnomeFront.test.ts`: the test pattern (`lintSongGraph`, `captureNoteEvents`, `analyzeTheory`).

## Change

`packages/music/src/themes/fcHoldMusic.ts`: replace the stub body, keep the signature:

```ts
export function buildFcHoldMusic(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number, opts: FcMusicOptions = {}): FcMusicHooks
```

The music:
- 96 bpm (`T.getTransport().bpm.value = 96`), D major (tonic D3 = MIDI 50), 16 bars looping, in 4/4 with a bossa feel.
- Harmony, one chord per bar, 7th chords (`chordTones(MODES.ionian, deg, 4)`): A section `ii7 V7 Imaj7 vi7` ×2, B section `IVmaj7 iii7 ii7 V7` ×2 (degrees `[1,4,0,5]`, `[3,2,1,4]`). Voice-lead them (`voiceLead`).
- Voices:
  - **Rhodes-like comp**: `PolySynth(FMSynth)` with a soft bell-ish tone (harmonicity 3, modulationIndex ~2, short decay, low sustain), comping the chord on the bossa rhythm (eighths 0, 3, 6 of each bar's 8 eighths, plus a push on 7 every other bar), high-passed at 220 Hz, into reverb.
  - **Nylon pluck bass**: `MonoSynth` with a triangle, quick decay: root on beat 1, fifth on the "and" of 2, root on 3, approach note on 4 (classic bossa bass). Low-passed 600 Hz, dry.
  - **Melody**: a soft flute/vibes `Synth` (sine or triangle, slow-ish attack 0.03) playing a lazy, singable tune from the major pentatonic + the chord's 7th, mostly quarter and half notes with rests, answered every two bars. Generate it once from the seed, stepwise motion. Into reverb and a little delay.
  - **Kit**: rim click (`MembraneSynth` short, or a high-passed `NoiseSynth`) on the bossa clave pattern (3-2 son clave over two bars), a soft brush (pink noise, slow attack) on each quarter, a very quiet kick on 1 and the "and" of 2.
  - **Shaker**: barely there on the off-eighths.
- Mix: everything polite and quiet, nothing above about -10 dB per voice; reverb wet small.
- `opts.intensity` is not used by this track (keep the parameter).
- **Pickup hook**: create a separate vibraphone-ish `PolySynth(Synth)` (sine, 0.6 s decay). Return `{ pickup() { ... } }` that plays the next note of the D major pentatonic upward from D5 (`T.now()`), resetting to the first note when more than 1.2 s passed since the last pickup, wrapping after 8 notes. Throttle to one note per 60 ms. Wrap in try/catch.

`packages/music/src/themes/fcHoldMusic.test.ts` (new), like `gnomeFront.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { lintSongGraph } from '../analyze/graph';
import { analyzeTheory, captureNoteEvents } from '../analyze/theory';
import { buildFcHoldMusic } from './fcHoldMusic';

const build = (T: any, keep: any, out: any) => { buildFcHoldMusic(T, keep, out, 42); };
describe('Nothing Left to Collect: Hold Music', () => {
  it('has no graph problems', () => { expect(lintSongGraph(build).issues).toEqual([]); });
  it('never triggers a one-note voice twice at once', () => {
    const conflicts: string[] = [];
    captureNoteEvents(build, 120, conflicts);
    expect([...new Set(conflicts)].slice(0, 5)).toEqual([]);
  });
  it('stays in its key', () => { expect(analyzeTheory(build, 40).detectedKey.inScaleRatio).toBeGreaterThan(0.85); });
});
```
(Type the parameters as `gnomeFront.test.ts` does, with `Tone`, `Keep` and `ToneNS.Volume`, instead of `any` if the linter in tsc complains.)

## Contract

The exported signature above, unchanged. Do not export anything else from this file that `index.ts` would need.

## Done when

- `npx vitest run src/themes/fcHoldMusic.test.ts` from `packages/music` passes (only your test file; other workers' tests may be mid-edit).
- `npx tsc --noEmit -p packages/music` shows no errors in your two files.
- Optional: `npm run analyze -w packages/music -- --help` lists how to render a track; you may render yours to listen-check by reading `packages/music/tools/analyze.mjs`.

## Out of scope

Every other file in `packages/music` (especially `index.ts`, `fcShared.ts`, `fcSynergyLoop.ts`, `fcShellshore.ts`), `games/**`.
