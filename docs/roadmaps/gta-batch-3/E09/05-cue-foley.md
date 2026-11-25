Epic: E09 step 1 (sound, voice, animation, direction)
Depends on: none
Worker: Haiku

## Environment
Read `docs/roadmaps/gta-batch-3/E09/_env.md` first.

## Goal
L46 "more sound in cutscenes": the 22 new cutscene foley sounds and the character-intro stinger make real sounds (today
they are silent stubs in `src/cutscene/cueFoley.ts`).

## Read first
- `games/gnome-theft-auto/src/cutscene/cueFoley.ts`: the `FOLEY: Record<FoleySfx, Synth>` table of stubs and
  `INTRO_STINGER`. `Synth = (c: AudioContext, out: AudioNode, t: number) => void`.
- `games/gnome-theft-auto/src/cutscene/cueSynth.ts`: the helpers to build with: `noiseBurst(c, out, t, dur, type, f0,
  f1, peak)`, `ping(c, out, oscType, t, dur, f0, f1, peak)`, `note(c, out, oscType, t, dur, midi, peak)`,
  `noiseSource`, `biquad`, `swell`, `decay`, `release`.
- `games/gnome-theft-auto/src/cutscene/cueAudio.ts` lines ~531-600 (`SYNTH`): the style of the existing extras
  (`footsteps`, `door-creak`, `glass`, `cash`, `knock`) to match their level (peaks 0.1..0.6).
- `games/gnome-theft-auto/src/cutscene/script.ts`: the `FoleySfx` doc comment says what each id is.
- `games/gnome-theft-auto/src/sound/testing/fakeAudio.ts`: `createFakeAudio()` returns `{ ctx, sources }`; each source
  records `started` / `stopped` times.

## Change
- `src/cutscene/cueFoley.ts`: replace every stub with a short procedural sound, each finished (every source stopped) by
  `t + 2.4`. Ideas (keep them small, a few nodes each):
  cloth = two soft bandpass noise swishes 900->600 Hz; paper = 3-4 tiny highpass crackles 3-5 kHz; pour = a bandpass
  noise gliding 500->1400 Hz over 0.9 s with a slight tremolo (several short bursts); clink = two sine pings 2.6 kHz and
  3.4 kHz; chair = a sawtooth scrape 140->90 Hz through a bandpass, 0.35 s; keys = 5-6 random high pings 3-6 kHz over
  0.3 s; zip = a fast series (12) of highpass ticks rising in rate; bell = a two-partial ding 1800/2700 Hz, 1.2 s decay;
  crunch = 3 lowpass noise bursts 1200 Hz quick; creak = a slow sawtooth 70->110 Hz through a narrow bandpass (Q 6);
  thunder = a long lowpass noise 180->60 Hz swell over 2.2 s plus a ping 50 Hz; gulp = a sine 300->160 Hz blip 0.12 s;
  tap = 4 lowpass knocks 0.11 s apart, quiet; pop = a sine 600->250 Hz 0.06 s plus a highpass click; clatter = 6 random
  pings 900-2500 Hz over 0.5 s; latch = two clicks 0.07 s apart (highpass 2 kHz bursts); squeak = a sine 1200->1700->1300
  Hz 0.18 s (the clay squeak); shovel = a lowpass noise thud 400 Hz plus a short crunch; flutter = 8 bandpass noise flaps
  0.05 s apart 1500 Hz; static = a 0.6 s bandpass crackle 2.2 kHz with random gaps (several short bursts); snap = a camera
  shutter: a highpass click, a 0.08 s gap, a second click; rustle = a 0.6 s highpass 2.5 kHz noise swell.
  Use `Math.random()` for small per-play variation (pitch +-8 %).
- `INTRO_STINGER`: a camera-flash freeze plus a title flourish, under 2 s: the `snap` sound at `t`, then at `t + 0.12` a
  bright rising arpeggio of the main theme's chord (MIDI 62, 66, 69, 74 as `note(c, out, 'triangle', t + 0.12 + i *
  0.06, 0.9, m, 0.12)`), and a soft highpass shimmer (`noiseBurst(c, out, t + 0.12, 1.0, 'highpass', 6000, 4000, 0.05)`).
- New `src/cutscene/cueFoley.test.ts`: for every id in `FOLEY_SFX` (exported from `./script`) and for `INTRO_STINGER`:
  run it on `createFakeAudio()` at `t = 1`; expect at least one source, every source started, and every source stopped
  by `1 + 2.4 + 0.05`.

## Contract
`export const FOLEY: Record<FoleySfx, Synth>` and `export const INTRO_STINGER: Synth` keep their names and types (cueAudio
imports them).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/cutscene/cueFoley.test.ts` passes.
- `npx tsc --noEmit -p .` passes.

## Out of scope
`cueAudio.ts`, `cueSynth.ts`, `cueBeds.ts` (issue 06), `script.ts`.
