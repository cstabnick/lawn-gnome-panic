# Gnome Theft Auto: audio, radio and map pass (lane E)

Four asks from the user, for `games/gnome-theft-auto`:

1. Engine noise that sounds like an engine, not a bug (other vehicles' spatial engines and the player's own).
2. Opening the map must not cut the music and sound (M was bound to both the big map and mute).
3. Every Turfton FM station mixed the way 108.0 Subsoil Radio is, with more songs per station, varied and written with
   sound music theory.
4. Custom icons for every point of interest on the minimap and the big map, with a legend, legible on a phone.

## What was wrong

- **Engines.** `sound/loops.ts` handed a pooled voice from one vehicle to the next while it was still sounding, so its
  pitch and pan slid across from the old vehicle to the new one (a chirp that reads as a bug). The voice was a raw
  sawtooth at 55-125 Hz with no inertia (the pitch followed speed frame by frame), a level that ignored load, a kind
  change that switched the oscillator type mid-sound, and no doppler. The player's engine (`audio.ts`) was the same
  sawtooth at one fixed level.
- **M.** `audio.ts` toggled mute on `KeyM` from a global listener and `hud.ts` opened the big map on `KeyM`: every map
  open muted the game and the radio (and closing it unmuted).
- **108 mixing** is the Subsoil set's production in `@lawn/music` `themes/undergroundSet.ts`: a master lowpass that opens
  as the music comes in; shared returns from `createFx` (reverb, a dotted-eighth ping-pong echo, a dub throw) with
  everything high-passed before the effects; a compressed drum bus; every tonal layer through one `duck` gain that dips
  under each kick (the pump); one gain per layer, ramped once a bar from one continuous energy curve (`energyAt`), so
  layers fade rather than switch; each layer entering and leaving through its own filter; mono sine sub; crashes on
  16-bar boundaries and a noise riser into the drops. The other three stations used older one-off builders
  (`buildTrickyTrack`, `buildGardenLullaby`, `buildBlackjackJazz`) with none of that, one random song per seed and
  no fixed identity per title.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (planner) | build passes; key table, engine model and voice, song spec, composer and its theory tests, wiring | done by the planner |
| 2. Fill in | `npm run build` and `npm test -w games/gnome-theft-auto` pass; smoke check on port 5305 | 6 parallel |

Epic 1 (written by the planner, verbatim code rather than issues):

- `src/keys.ts` + `keys.test.ts`: one action per key; mute moved to **U**; the test fails if any module hard-codes a
  key that is not in the table or two modules read one key for different things. `input.ts`, `hud.ts`, `audio.ts`,
  `options.ts` read it. Options > Sound gets a mute button (touch and pad can mute now).
- `src/sound/engineModel.ts` (pure: profile from any vehicle spec, revs with inertia, gears, load, doppler) and
  `src/sound/engineVoice.ts` (harmonic body, sub, exhaust noise pulsing at the firing rate, drive, two lowpasses, blade
  chop; every parameter glides). `audio.ts` `setEngine` uses both; `app.ts` passes the throttle and the spec.
- `src/radio/music/spec.ts`, `compose.ts` (pure composer with theory rules), `compose.test.ts` (theory checks),
  `songs/*.ts` (one real spec per station plus placeholders), `build.ts` (stub). `content.ts` takes its playlists from
  the song files; `player.ts` plays `RADIO_SONGS[station][songIndex]` through `buildRadioSong`.
- `types.ts`: the new place kinds on `Blip.kind`.

Online: unchanged (the radio is local; nothing here is relayed). Mobile: the mute button is the touch equivalent of U;
map icons are sized for the 96 px phone minimap.

## Epic 2

~~~~text
Epic: 2. Fill in
Issue: 2A Radio song builder with the Subsoil mix
Depends on: none

## Environment
Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af12233ca32c4611b (a git worktree; stay
in it). Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Do not run `npm install`, do not
commit, do not start a dev server. Other workers are editing other files in games/gnome-theft-auto at the same time
(song spec files, sound files, the HUD); touch only the file listed under Change.

## Goal
`games/gnome-theft-auto/src/radio/music/build.ts` plays a Turfton FM song (a `SongSpec`) with Tone.js through the
same mix as 108.0 Subsoil Radio, replacing the stub that only plays plain chords.

## Read first
- games/gnome-theft-auto/src/radio/music/spec.ts: the SongSpec type and what every voice name means.
- games/gnome-theft-auto/src/radio/music/compose.ts: `compose(spec, seed)` returns `Composition` (events with layer,
  bar, pos and len in sixteenths, midi notes, vel; `bars`, `grid`, `bpm`, `energy[]`, `breakdown[]`), `levelsAt(spec,
  comp, bar)` returns the level 0..1 of each bus ('drums' | 'bass' | 'chord' | 'pad' | 'lead' | 'texture'),
  `titleSeed(title)`.
- games/gnome-theft-auto/src/radio/music/build.ts: the stub. Keep its exports exactly.
- packages/music/src/themes/undergroundSet.ts lines 347-460 and 495-533: the mix you are copying (masterLp, mix,
  createFx, duck, drumBus, per-layer gains ramped per bar, crash, riser).
- packages/music/src/themes/clubGnome.ts lines 280-551: Tone voice recipes and the looping `T.Part` scheduling pattern
  (`schedule()` and the `mono()` guard). Copy patterns from here; do not import from it.
- packages/music/src/mix.ts: `createFx` (import it from '@lawn/music').

## Change
- games/gnome-theft-auto/src/radio/music/build.ts: replace the body of `buildRadioSong`. Imports allowed:
  `import type * as ToneNS from 'tone'`, `import type { Keep, Tone } from '@lawn/music'`,
  `import { createFx, midiToNote } from '@lawn/music'`, and from './compose' and './spec'. Wrap every node in `keep(...)`.

  1. `const comp = compose(spec, titleSeed(spec.title))`; `T.getTransport().bpm.value = comp.bpm`.
     `six = 15 / comp.bpm` (one sixteenth, s); `barS = six * comp.grid`; `loopEnd = comp.bars * barS`.
     Time of an event: `ev.bar * barS + ev.pos * six + (ev.pos % 4 === 2 ? spec.swing * 2 * six : 0)`.
  2. Mix chain (the Subsoil mix):
     - `masterLp = keep(new T.Filter({ frequency: 18000, type: 'lowpass', rolloff: -12, Q: 0.5 })).connect(out)`
     - `mix = keep(new T.Gain(1)).connect(masterLp)`
     - `fx = createFx(T, keep, mix, { reverbDecay: spec.reverb, reverbHp: 350, snareSend: 0.12, echoTime: spec.echo,
       echoFeedback: 0.38, echoLp: 3200, delayDry: 0.6, delayRevSend: 0.3 })`
     - `duck = keep(new T.Gain(1)).connect(mix)`: every tonal bus goes through it.
     - `drumBus = keep(new T.Compressor({ threshold: spec.kit === 'break' ? -20 : -16, ratio: spec.kit === 'break' ? 5 :
       3.5, attack: 0.006, release: 0.12 })).connect(mix)`
     - Bus gains, all starting at 0: `drums -> drumBus`, `bass -> duck`, `chord`, `pad`, `lead` each through their own
       lowpass `busLp[bus] = keep(new T.Filter({ frequency: 18000, type: 'lowpass', rolloff: -12 }))` then the bus gain,
       then `duck`; `texture -> mix`.
     - Before a tonal voice reaches its bus lowpass, high-pass it: `keep(new T.Filter(hz, 'highpass'))` with hz = 100
       for the 'crunch' chord voice, 200 for every other chord, pad and lead voice. No high-pass on bass or drums.
     - Sends: a helper `send = (amount, to) => keep(new T.Gain(amount)).connect(to)`; take sends from after the voice's
       own filter, as clubGnome does with `.fan(...)`. Reverb send 0.15-0.35 per voice (more for pads, strings, flute,
       musicBox), delay send 0.1-0.25 for leads, musicBox, open hats.
  3. Pump: when `spec.pump > 0`, on every 'kick' event at its time t: `duck.gain.setValueAtTime(1 - 0.5 * spec.pump, t)`
     then `duck.gain.linearRampToValueAtTime(1, t + 0.17)`.
  4. Levels per bar: a looping `T.Part` with one event per bar b at `b * barS`. At each: `const lv = levelsAt(spec, comp,
     b + 1)`; for each bus `gains[bus].gain.rampTo(lv[bus], barS, time)`; for chord, pad and lead also
     `busLp[bus].frequency.rampTo(Math.min(16000, 250 * 2 ** (lv[bus] * 6)), barS, time)` (a layer comes in and leaves
     through its own filter). Crash: when `b % 4 === 0 && b > 0 && spec.kit !== 'none' && comp.energy[b] >
     comp.energy[b - 1] + 0.03`, trigger the crash. Riser: a white `T.Noise` through a bandpass (600 Hz, Q 1.2) into
     `fx.rev` and `mix` with its own gain; in a breakdown bar (`comp.breakdown[b]`) ramp that gain to 0.03 + 0.05 x (how
     far into the breakdown, 0..1) and the bandpass to 500 + 4000 x the same; otherwise ramp the gain to 0. Start the
     noise sources once (`.start()`).
  5. Start state: `startBar = Math.floor((opts.offsetSeconds ?? 0) / barS) % comp.bars`. Set every bus gain and bus
     lowpass straight to `levelsAt(spec, comp, startBar)` values (`.gain.value = ...`, `.frequency.value = ...`). When
     `(opts.offsetSeconds ?? 0) < barS` (the song is starting), open the master: `masterLp.frequency.setValueAtTime(500,
     T.now())` and `exponentialRampToValueAtTime(18000, T.now() + barS * 2)`.
  6. Voices (Tone 15 classes; numbers are starting points, keep each voice's `volume.value` so no voice dominates):
     Chord (`spec.chord`), a `PolySynth` (`maxPolyphony = 10`) unless noted:
     - crunch: `T.Synth` sawtooth, envelope a 0.003 d 0.25 s 0.3 r 0.08 -> `T.Distortion(0.6)` -> lowpass 2800. vol -20.
     - brass: `T.Synth` `{ type: 'fatsawtooth', count: 3, spread: 20 }`, a 0.02 d 0.15 s 0.4 r 0.12 -> lowpass 3200. vol -18.
     - organ: `T.Synth` `{ type: 'custom', partials: [1, 0.6, 0.35, 0, 0.25, 0, 0.12] }` a 0.01 d 0.1 s 0.9 r 0.12. vol -22.
     - rhodes: `T.FMSynth` harmonicity 2, modulationIndex 1.4 (as clubGnome) -> `T.Tremolo(4, 0.3).start()`. vol -14.
     - piano: `T.FMSynth` harmonicity 3, modulationIndex 0.8, a 0.005 d 1.2 s 0.1 r 0.8. vol -14.
     - strings: `T.Synth` `{ type: 'fatsawtooth', count: 3, spread: 25 }` a 0.5 d 0.3 s 0.8 r 1.2 -> lowpass 1800. vol -24.
     - musicBox: `T.FMSynth` harmonicity 4, modulationIndex 2, a 0.001 d 0.9 s 0 r 0.9 -> lowpass 6000. vol -16.
     - nylon: `T.Synth` triangle a 0.003 d 0.7 s 0 r 0.5 -> lowpass 2400. vol -13.
     Pad (only when `spec.pad`): as clubGnome's pad (fattriangle, a 0.8, lowpass 1300), vol -22, reverb send 0.5.
     Bass (`spec.bass`), monophonic, guarded with `mono()`:
     - sub: `T.Synth` sine a 0.02 d 0.3 s 0.8 r 0.3. vol -10.
     - upright: as clubGnome's 'upright' MonoSynth (triangle) -> lowpass 700. vol -8.
     - picked: `T.MonoSynth` sawtooth, filter Q 2, filterEnvelope baseFrequency 200 octaves 2.5, a 0.005 d 0.2 s 0.5 r 0.1. vol -12.
     - acid: as undergroundSet's acid `T.MonoSynth` (sawtooth, Q 8, rolloff -24, filterEnvelope baseFrequency 250
       octaves 3), `portamento = 0.04`, -> `T.Distortion(0.25)`. vol -15.
     Lead (`spec.lead`; nothing for 'none'), monophonic, guarded with `mono()`:
     - sax: `T.Synth` sawtooth a 0.04 d 0.2 s 0.7 r 0.2 -> bandpass 1200 Q 1.2 -> lowpass 3200; vibrato `T.LFO({
       frequency: 5, min: -12, max: 12 }).connect(synth.detune).start()`. vol -12.
     - vibes, flute, whistle: as clubGnome's (vibes via a PolySynth FMSynth is fine). bell: clubGnome's 'glock'.
     - guitar: `T.Synth` sawtooth a 0.005 d 0.3 s 0.6 r 0.15 -> `T.Distortion(0.5)` -> lowpass 3000; vibrato 5.5 Hz
       +-15 cents. vol -18.
     - clarinet: `T.Synth` square a 0.03 d 0.1 s 0.8 r 0.15 -> lowpass 1800 (Q 1); vibrato 4.5 Hz +-8 cents. vol -18.
     Drums (`spec.kit`; nothing for 'none'), all into the drums bus, each monophonic voice guarded with `mono()`:
     - break: kick `T.MembraneSynth` pitchDecay 0.05 octaves 5 decay 0.3 -> `T.Distortion(0.15)`, vol -4, note 'C1';
       snare `T.NoiseSynth` white decay 0.16 through a 1500 Hz bandpass (also into `fx.snareSend`), plus a body
       `T.MembraneSynth` on 'E3' at vol -12; hat white NoiseSynth decay 0.03 -> highpass 8000; open white NoiseSynth decay
       0.18 -> highpass 7000 (+ delay send 0.15).
     - rock: like break but kick decay 0.35 and no distortion; open is a crash-like NoiseSynth decay 0.5 -> highpass 5000.
     - brush: kick MembraneSynth octaves 3 decay 0.25 vol -16; snare pink NoiseSynth attack 0.012 decay 0.22 -> bandpass
       2500 vol -20; hat pink NoiseSynth decay 0.12 -> highpass 5000 vol -24; open = ride: `T.MetalSynth({ envelope: {
       attack: 0.001, decay: 0.6, release: 0.2 }, harmonicity: 5.1, modulationIndex: 16, resonance: 5000, octaves: 1.2
       })` vol -32, triggered with `triggerAttackRelease(300, 0.3, time, vel)`.
     - soft: kick MembraneSynth octaves 2 decay 0.2 vol -18; snare (a rim) white NoiseSynth decay 0.02 -> bandpass 3000 Q
       4 vol -20; hat (a shaker) white NoiseSynth decay 0.05 -> bandpass 7500 vol -24; open: the same shaker, decay 0.12.
     Crash (used by step 4 when the kit is not 'none'): white NoiseSynth decay 1.4 -> highpass 3500, fanned to `mix` and
     `fx.rev`, vol -16.
     Texture (`spec.texture`) into the texture bus, started once: vinyl = `T.Noise('brown')` -> highpass 900 at vol -30
     plus a `T.Loop` every '16n' that, with probability 0.12, triggers a white NoiseSynth (decay 0.006) at vol -26 (the
     crackle); tape = `T.Noise('pink')` -> highpass 3000 at vol -34; air = `T.Noise('pink')` -> `T.AutoFilter({ frequency:
     0.05, baseFrequency: 400, octaves: 3 }).start()` at vol -30.
  7. Schedule: group `comp.events` by layer and play each layer with one looping `T.Part` (`part.loop = true; part.loopEnd
     = loopEnd; part.start(0)`) like clubGnome's `schedule()`, wrapping each trigger in try/catch. Note names:
     `ev.midi.map(midiToNote)`; durations `ev.len * six * 0.92` seconds. Chord and pad events are chords (several midi
     notes, PolySynth); bass and lead events have one note.
  8. Never throw out of `buildRadioSong` (the music must never break the game).

## Contract
Keep exactly: `export interface BuildOpts { offsetSeconds?: number }` and
`export function buildRadioSong(T: Tone, keep: Keep, out: ToneNS.Volume, spec: SongSpec, opts: BuildOpts = {}): void`.
player.ts calls `playSong((T, keep, out) => buildRadioSong(T, keep, out, spec, { offsetSeconds }), { offsetSeconds })`;
playSong starts the transport at `offsetSeconds`, so looping Parts started at 0 pick up mid-song by themselves.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes (run from the repo root).
- `npx vitest run src/radio/music` in games/gnome-theft-auto runs (two variety tests may fail while other workers write
  the song files; that is expected and not yours).
- Every SongSpec voice name in spec.ts (ChordVoice, BassVoice, LeadVoice, DrumKit, Texture) has a case in build.ts.

## Out of scope
compose.ts, spec.ts, songs/*.ts, player.ts, content.ts, and everything outside src/radio/music/build.ts.
~~~~

~~~~text
Epic: 2. Fill in
Issue: 2B The Blade's songs (99.3, mower rock through a big-beat mixer)
Depends on: none

## Environment
Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af12233ca32c4611b (a git worktree; stay
in it). Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Do not run `npm install`, do not
commit, do not start a dev server. Other workers are writing the other stations' song files and the Tone builder at
the same time; touch only games/gnome-theft-auto/src/radio/music/songs/blade.ts.

## Goal
`songs/blade.ts` holds at least 12 real, distinct songs for 99.3 The Blade, each a SongSpec written with sound music
theory, replacing the placeholders (`stub(...)`), so the station sounds like loud mower rock and never the same song
twice.

## Read first
- games/gnome-theft-auto/src/radio/music/spec.ts: every SongSpec field.
- games/gnome-theft-auto/src/radio/music/songs/blade.ts: the first song (`BORN_TO_BE_MOWED`) is a finished example.
- games/gnome-theft-auto/src/radio/music/compose.test.ts: the checks your songs must pass.
- docs/lore/entries/apocrypha/turfton-fm.md: the station and its tone.

## Change
- songs/blade.ts: keep the 8 existing titles and artists exactly (they are the station's playlist), give each its own
  spec, and add at least 4 new songs (12 or more in all). Delete the `stub` helper.

Station identity (the test enforces the first three):
- chord voice: 'crunch' (power chords), 'brass' (big-beat stabs) or 'organ'. kit: 'break' or 'rock'. bpm 96..160.
- bass: 'picked' or 'acid' (an acid line suits big beat), sometimes 'sub'. lead: 'guitar', 'whistle', 'sax' (a honking
  rock sax), 'clarinet' or 'none'. pump 0.2..0.5. texture 'none' or 'vinyl'. reverb 1.2..2.2. swing 0..0.12.

Variety (the test enforces): bpm spread at least 20, at least 5 different keys (tonic % 12), at least 3 modes, at
least 5 different chord/lead/bass combinations, and no two songs with the same progressions. Also vary meter-feel
through drum grids (a straight rock beat, a funky break with ghost notes 'o', a half-time feel), comp rhythms and form
(where the breakdown falls, how long the intro is).

Music theory rules (checkSpec and the tests enforce most of them):
- Degrees are 0..6 in the song's mode. Only major or minor triads: never use these degrees, which are diminished or
  augmented: ionian 6; dorian 5; mixolydian 2; aeolian 1; lydian 3; harmonic (minor) 1, 2 and 6; phrygian 4.
- Usable chords, by mode: ionian I ii iii IV V vi = 0 1 2 3 4 5. mixolydian I ii IV v vi bVII = 0 1 3 4 5 6.
  dorian i ii bIII IV v bVII = 0 1 2 3 4 6. aeolian i bIII iv v bVI bVII = 0 2 3 4 5 6.
- Write progressions a rock player would: I-bVII-IV-I (mixolydian 0 6 3 0), i-bVII-bVI-bVII (aeolian 0 6 5 6),
  i-IV (dorian 0 3), I-IV-V-IV (ionian 0 3 4 3), I-V-vi-IV (0 4 5 3), a twelve-bar-ish I I IV I / V IV I I split over
  three 4-bar progressions. Two chords in a bar are written `[a, b]`.
- The form is 6..12 parts of 4 bars; the loop is 40..130 s long (parts x 4 x 4 beats x 60 / bpm). The LAST part's
  progression must end on 0 (the tonic) so the loop lands home. Start low (e 0.2-0.35), build, put one breakdown
  (`brk: true`, e about 0.4) before the biggest part (e 0.9-1, maybe `up: true`), and end lower.
- tonic 43..57 (G2..A3). Melody range `lo`..`hi` in scale degrees (-3..12): for a guitar lead about 0..9.
- `chordSize` 3 for crunch and brass (power chords and triads), 3 or 4 for organ.
- Drum strings are exactly 16 characters ('x' hit, 'o' ghost, '.' rest) for meter 4. The Blade is 4/4.
- comp steps and bassPat positions are 0..15.

Names (lore rules): titles are lawn, mower, garden and gnome puns; artists are invented bands or the existing ones on
the station (Lou & the Gravel Boys, The Velvet Toadstools, Dock Hoewright & the Pull Cords, The Greenhouse Strip Five,
Hob & the Glaze, Burnet Gravelwright, Ivy Snailwood). Nothing gets wet, soaked, dripping or bloody; clay cracks and is
glued back. Before using a new name, run `npm run lore -- find <word>` from the repo root for its main word and do
not reuse a name that already belongs to someone else. Titles must not repeat any other station's titles.

## Contract
`export const BLADE_SONGS: readonly SongSpec[]` (the first 8 entries keep today's titles in today's order; new songs
after them). Import only `import type { SongSpec } from '../spec';`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes (from the repo root).
- In games/gnome-theft-auto, `npx vitest run src/radio/music` shows no failure that names The Blade or one of its
  titles (failures naming 'fpr', 'beats' or their titles belong to other workers still writing them).

## Out of scope
compose.ts, spec.ts, build.ts, compose.test.ts, the other songs files, content.ts, docs/lore.
~~~~

~~~~text
Epic: 2. Fill in
Issue: 2C Fescue Public Radio's songs (88.7, slow and careful)
Depends on: none

## Environment
Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af12233ca32c4611b (a git worktree; stay
in it). Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Do not run `npm install`, do not
commit, do not start a dev server. Other workers are writing the other stations' song files and the Tone builder at
the same time; touch only games/gnome-theft-auto/src/radio/music/songs/fpr.ts.

## Goal
`songs/fpr.ts` holds at least 12 real, distinct songs for 88.7 Fescue Public Radio, each a SongSpec written with sound
music theory, replacing the placeholders (`stub(...)`): slow, careful, a little sad, never the same song twice.

## Read first
- games/gnome-theft-auto/src/radio/music/spec.ts: every SongSpec field.
- games/gnome-theft-auto/src/radio/music/songs/fpr.ts: the first song (`RAIN_ON_TERRACOTTA`) is a finished example.
- games/gnome-theft-auto/src/radio/music/compose.test.ts: the checks your songs must pass.
- docs/lore/entries/apocrypha/turfton-fm.md: the station and its tone.

## Change
- songs/fpr.ts: keep the 8 existing titles and artists exactly (they are the station's playlist), give each its own
  spec, and add at least 4 new songs (12 or more in all). Delete the `stub` helper.

Station identity (the test enforces the first three):
- chord voice: 'musicBox' (arpeggiated: `comp.arp: true`), 'strings', 'piano' or 'nylon' (arpeggiated). kit: 'soft' or
  'none'. bpm 56..96.
- bass: 'sub' or 'upright'. lead: 'flute', 'bell', 'clarinet', 'whistle', 'vibes' or 'none'. pad: often true. pump 0
  (no pump on this station). texture 'tape' or 'air'. reverb 3..6. swing 0..0.15.

Variety (the test enforces): bpm spread at least 20, at least 5 different keys (tonic % 12), at least 3 modes, at
least 5 different chord/lead/bass combinations, and no two songs with the same progressions. Mix waltzes (meter 3)
and slow 4/4 (meter 4). "The Fence Creaks in B Minor" must be in B minor: tonic 47 (B2), mode 'aeolian' or
'dorian'.

Music theory rules (checkSpec and the tests enforce most of them):
- Degrees are 0..6 in the song's mode. Only major or minor triads: never use these degrees, which are diminished or
  augmented: ionian 6; dorian 5; aeolian 1; lydian 3; mixolydian 2; harmonic (minor) 1, 2 and 6; phrygian 4.
- Usable chords, by mode: ionian I ii iii IV V vi = 0 1 2 3 4 5. lydian I II iii V vi vii = 0 1 2 4 5 6.
  dorian i ii bIII IV v bVII = 0 1 2 3 4 6. aeolian i bIII iv v bVI bVII = 0 2 3 4 5 6.
- Gentle progressions: I-vi-IV-V (0 5 3 4), I-IV-I-V, I-iii-vi-IV, lydian I-II-I-V (0 1 0 4), aeolian i-bVI-bIII-bVII
  (0 5 2 6), dorian i-IV (0 3). Two chords in a bar are written `[a, b]` (4/4 only: in 3/4 use one chord per bar).
- The form is 6..12 parts of 4 bars; the loop is 40..130 s long (parts x 4 bars x meter beats x 60 / bpm). The LAST
  part's progression must end on 0 (the tonic) so the loop lands home. Keep energy low to medium (e 0.1..0.7): start
  very quiet, let the tune in around the middle (the tune plays only in parts with e >= 0.4), end quiet. No breakdowns.
- tonic 43..57 (G2..A3). Melody range `lo`..`hi` in scale degrees (-3..12): about 2..9 for a flute or bell.
- `chordSize` 3 or 4 (piano and strings can take 4).
- Drum strings are exactly as long as the bar: 12 characters for meter 3, 16 for meter 4 ('x' hit, 'o' soft hit,
  '.' rest). Soft kits use mostly 'o'.
- comp steps and bassPat positions are inside the bar (0..11 in 3/4, 0..15 in 4/4); note lengths in `melody.lens` are
  at most the bar length.

Names (lore rules): titles are quiet, wistful garden, Fescue and Mossy Wood pictures; artists are invented ensembles or
the existing ones on the station (Fescue Public Radio Ambience Dept., Sorrel Tillbrook, The Mossy Wood Choir, the
Pipewrights' Youth Band, Ivy Snailwood, The Unmowed Strings, Clay Pot Quartet). Nothing gets wet, soaked, dripping or
bloody; clay cracks and is glued back. Before using a new name, run `npm run lore -- find <word>` from the repo root
for its main word and do not reuse a name that already belongs to someone else. Titles must not repeat any other
station's titles.

## Contract
`export const FPR_SONGS: readonly SongSpec[]` (the first 8 entries keep today's titles in today's order; new songs
after them). Import only `import type { SongSpec } from '../spec';`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes (from the repo root).
- In games/gnome-theft-auto, `npx vitest run src/radio/music` shows no failure that names 'fpr' or one of its titles
  (failures naming 'blade', 'beats' or their titles belong to other workers still writing them).

## Out of scope
compose.ts, spec.ts, build.ts, compose.test.ts, the other songs files, content.ts, docs/lore.
~~~~

~~~~text
Epic: 2. Fill in
Issue: 2D Compliance Beats' songs (104.1, smooth jazz)
Depends on: none

## Environment
Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af12233ca32c4611b (a git worktree; stay
in it). Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Do not run `npm install`, do not
commit, do not start a dev server. Other workers are writing the other stations' song files and the Tone builder at
the same time; touch only games/gnome-theft-auto/src/radio/music/songs/beats.ts.

## Goal
`songs/beats.ts` holds at least 12 real, distinct songs for 104.1 HOA Compliance Beats, each a SongSpec written with
sound jazz harmony, replacing the placeholders (`stub(...)`): smooth jazz to trim your edges to, never the same song
twice.

## Read first
- games/gnome-theft-auto/src/radio/music/spec.ts: every SongSpec field.
- games/gnome-theft-auto/src/radio/music/songs/beats.ts: the first song (`VERGE_WALK`) is a finished example.
- games/gnome-theft-auto/src/radio/music/compose.test.ts: the checks your songs must pass.
- docs/lore/entries/apocrypha/turfton-fm.md: the station and its tone.

## Change
- songs/beats.ts: keep the 8 existing titles and artists exactly (they are the station's playlist), give each its own
  spec, and add at least 4 new songs (12 or more in all). Delete the `stub` helper.

Station identity (the test enforces the first three):
- chord voice: 'rhodes', 'piano', 'organ' or 'nylon'. kit: 'brush' or 'soft'. bpm 64..124.
- bass: 'upright' (walking: `[[0,'r',4],[4,'t',4],[8,'f',4],[12,'a',4]]` or variations) or 'sub'. lead: 'sax',
  'vibes', 'clarinet', 'flute' or 'none'. chordSize 4 or 5 (seventh and ninth chords). pump 0..0.15. texture 'vinyl'
  or 'none'. reverb 2..3.5. swing 0.2..0.33 for swing tunes, 0..0.1 for a bossa or a ballad.

Variety (the test enforces): bpm spread at least 20, at least 5 different keys (tonic % 12), at least 3 modes, at
least 5 different chord/lead/bass combinations, and no two songs with the same progressions. "Compliance Waltz" is in
3/4 (meter 3, 12-character drum strings, a bassPat like `[[0,'r',4],[4,'f',4],[8,'f',4]]`); add a bossa (straight,
swing 0, a nylon comp on off-beats) and a minor ballad. Use the jazz-friendly flat keys (F, Bb, Eb, Ab, Db) as well as
C and G.

Music theory rules (checkSpec and the tests enforce most of them):
- Degrees are 0..6 in the song's mode. Only major or minor triads at the chord's root: never use these degrees, which
  are diminished or augmented: ionian 6; dorian 5; mixolydian 2; aeolian 1; harmonic (minor) 1, 2 and 6; lydian 3.
- Usable chords, by mode: ionian Imaj7 ii7 iii7 IVmaj7 V7 vi7 = 0 1 2 3 4 5. dorian i7 ii7 bIIImaj7 IV7 v7 bVIImaj7 =
  0 1 2 3 4 6. mixolydian I7 ii7 IVmaj7 v7 vi7 bVIImaj7 = 0 1 3 4 5 6. aeolian i7 bIIImaj7 iv7 v7 bVImaj7 bVII7 =
  0 2 3 4 5 6. harmonic minor i iv V bVI = 0 3 4 5 (V is major here: a strong minor cadence).
- Jazz progressions: ii-V-I (ionian `[1, 4], 0` or `1, 4, 0, 0`), I-vi-ii-V turnarounds (0 5 1 4, but the LAST part
  must end on 0), iii-vi-ii-V-I, IV-iii-ii-I, dorian i7-IV7 vamps (0 3), minor i-iv-V-i (harmonic 0 3 4 0).
  Two chords in a bar are written `[a, b]` (4/4 only).
- The form is 6..12 parts of 4 bars; the loop is 40..130 s long (parts x 4 bars x meter beats x 60 / bpm). The LAST
  part's progression must end on 0 (the tonic) so the loop lands home. Energy stays smooth: 0.3..0.8, no breakdowns,
  the head (the tune) in parts with e >= 0.4, a quieter intro and outro.
- tonic 43..57 (G2..A3). Melody range `lo`..`hi` in scale degrees (-3..12): about 0..9 for a sax.
- Drum strings are exactly as long as the bar: 16 characters for meter 4, 12 for meter 3. Brushes: a ride ('o' row)
  on 1, 2, the swung "and" of 2, 3, 4, the "and" of 4 (`x...x.x.x...x.x.`), the brush snare soft on 2 and 4, a
  feathered kick ('o').
- comp steps and bassPat positions are inside the bar; note lengths in `melody.lens` are at most the bar length.

Names (lore rules): titles are HOA, bylaw, verge, permit and beige puns; artists are invented combos or the existing
ones on the station (The Thorne Lawn Trio, Cress Caliper & Friends, Juniper Vance, The Gravel Quintet, Obsidian
Brass, Reginald "Quarter-Inch" Vance, The Municipal Strings, Cress Caliper). Nothing gets wet, soaked, dripping or
bloody; clay cracks and is glued back. Before using a new name, run `npm run lore -- find <word>` from the repo root
for its main word and do not reuse a name that already belongs to someone else. Titles must not repeat any other
station's titles.

## Contract
`export const BEATS_SONGS: readonly SongSpec[]` (the first 8 entries keep today's titles in today's order; new songs
after them). Import only `import type { SongSpec } from '../spec';`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes (from the repo root).
- In games/gnome-theft-auto, `npx vitest run src/radio/music` shows no failure that names 'beats' or one of its
  titles (failures naming 'blade', 'fpr' or their titles belong to other workers still writing them).

## Out of scope
compose.ts, spec.ts, build.ts, compose.test.ts, the other songs files, content.ts, docs/lore.
~~~~

~~~~text
Epic: 2. Fill in
Issue: 2E Other vehicles' engines: an engine pool with no chirps and doppler
Depends on: none

## Environment
Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af12233ca32c4611b (a git worktree; stay
in it). Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Do not run `npm install`, do not
commit, do not start a dev server. Other workers are editing other files in games/gnome-theft-auto at the same time
(radio files, hud.ts, app.ts); touch only the files under Change.

## Goal
Other vehicles' engines play through a new engine pool that uses the shared engine voice (sound/engineVoice.ts) and
engine model (sound/engineModel.ts): revs with inertia, load, doppler, distance muffling, and no pitch or pan chirp
when a voice moves from one vehicle to another. Sirens and bees keep the old loop pool, which also stops handing a
voice over while it still sounds.

## Read first
- games/gnome-theft-auto/src/sound/engineModel.ts: `engineProfile(spec)`, `targetRevs(speed01, throttle, gears)`,
  `newEngineState()`, `stepEngine(st, target, throttle, dt)`, `firingHz(profile, revs)`, `dopplerRatio(...)`.
- games/gnome-theft-auto/src/sound/engineVoice.ts: `createEngineVoice(ctx, dest)` returns `{ output, set(p, now, tau?),
  snap(p, now), stop(now) }` with `EngineParams` `{ hz, load, level, bright, rough, chop?, maxCutoff? }`.
- games/gnome-theft-auto/src/sound/loops.ts: the current pool (voice assignment, sleeping, `glide`).
- games/gnome-theft-auto/src/sound/watchVehicles.ts: where vehicle engine and siren sources are made.
- games/gnome-theft-auto/src/sound/spatial.ts: `spatial(sx, sz, lx, lz, yaw, maxDist)` -> `{ gain, pan, cutoff, dist }`.
- games/gnome-theft-auto/src/sound/loops.test.ts: how tests stub `./bus`.

## Change
- games/gnome-theft-auto/src/sound/enginePool.ts (new):
  ```ts
  export interface EngineSource {
    key: string; x: number; z: number;
    /** Velocity, world units per second (forward is (sin yaw, cos yaw) x speed). */
    vx: number; vz: number;
    /** |speed| / maxSpeed, 0..1, and throttle -1..1. */
    speed01: number; throttle: number;
    profile: EngineProfile;
    /** Audible range, metres (default 75; planes 220). */
    maxDist?: number;
  }
  export interface EnginePool { update(sources: readonly EngineSource[], dt: number): void; active(): number }
  export interface VoiceSlot { key: string | null; free: boolean }
  export function planVoices(slots: readonly VoiceSlot[], wanted: readonly string[]): (string | null)[];
  export function createEnginePool(size: number): EnginePool;
  ```
  - `planVoices` (pure): a slot keeps its key when the key is still wanted; each other wanted key (in order) goes to a
    slot with `key === null && free === true`; a slot that is not free and lost its key gets null; never the same key
    twice; one entry per slot. A key with no free slot waits (it is simply not placed this frame).
  - Engine state per key (`Map<string, { st: EngineState; seen: number }>`), stepped every frame for every source with
    `stepEngine(st, targetRevs(src.speed01, src.throttle, src.profile.gears), src.throttle, dt)`, kept across voice
    changes, dropped when unseen for 3 s.
  - Listener velocity from the listener position frame to frame (`getListener()` from './bus'), smoothed (one pole,
    0.2 s); a jump faster than 80 units/s (a teleport) counts as 0.
  - Per frame: `s = spatial(src.x, src.z, l.x, l.z, l.yaw, src.maxDist ?? 75)`; keep sources with `s.gain >= 0.01`, sort
    by gain, take the top `size`: these are `wanted`. Params for a source: `hz = firingHz(profile, st.revs) x
    dopplerRatio(src.x, src.z, src.vx, src.vz, l.x, l.z, lvx, lvz)`, `level = 0.11 x profile.gain x s.gain x (0.7 + 0.3
    x st.load + 0.15 x st.revs)`, `load = st.load`, `bright`, `rough`, `chop` from the profile, `maxCutoff = s.cutoff`.
  - Voices: `{ ev: EngineVoice; panner: StereoPannerNode | null; key: string | null; releasedAt: number; idle: number }`
    or null (asleep). Build each with `createEngineVoice(out.ctx, panner ?? out.world)` where `out = busOut()` and the
    panner (`out.ctx.createStereoPanner()` when it exists) connects to `out.world`. Rebuild everything when `out.ctx`
    changes (as loops.ts does). A slot is free when it is asleep, or its key is null and `now - releasedAt >= 0.15`.
  - A voice that loses its key: `ev.set({ ...its last params, level: 0 }, now, 0.03)`, `releasedAt = now`. A voice idle
    over 1.5 s: `ev.stop(now)`, slot null.
  - A voice that gets a NEW key (it was free, so silent): `ev.snap(params, now)` and set the panner straight to the
    pan (`pan.cancelScheduledValues(now); pan.setValueAtTime(s.pan, now)`), then `ev.set(params, now, 0.06)` (fades in).
    A voice that keeps its key: `ev.set(params, now)` and glide the pan (`setTargetAtTime(s.pan, now, 0.08)`, only when
    it moved by more than 0.02).
- games/gnome-theft-auto/src/sound/enginePool.test.ts (new): tests for `planVoices` (keeps keys; fills only free empty
  slots; a slot still fading is not reused even when a new key wants it; no duplicates; one entry per slot). Stub
  './bus' with `vi.mock` like loops.test.ts.
- games/gnome-theft-auto/src/sound/loops.ts: add an optional third parameter `busy?: readonly boolean[]` to
  `assignVoices`: a voice with `busy[i]` true and no kept key gets null (it is not handed a new key). In the pool, a
  voice is busy for 0.15 s after it lost its key (store `releasedAt` on the Voice). Existing loops.test.ts must still
  pass; add a test for `busy`.
- games/gnome-theft-auto/src/sound/watchVehicles.ts:
  - Make an engine pool `createEnginePool(COARSE ? 3 : 5)` and keep the loop pool for sirens only
    (`createLoopPool(COARSE ? 2 : 3)`).
  - For each nearby moving vehicle with `loopKindFor(v) !== null` (keep that function and its test), push an
    EngineSource instead of `addSource(engineKey, kind, ...)`: `profile` from `engineProfile(v.spec)` (cache it on the
    Mem), `vx = Math.sin(v.yaw) * v.speed`, `vz = Math.cos(v.yaw) * v.speed`, `speed01 = Math.min(1, Math.abs(v.speed) /
    maxSpeed)`, `throttle` = the smoothed acceleration `((|v.speed| - |m.lastSpeed|) / dt) / v.spec.accel` clamped to
    -1..1 (store it on the Mem, one-pole 0.25 s; 0.3 minimum while it moves, so cruising engines still work),
    `maxDist = v.spec.flies ? 220 : 75`. Reuse EngineSource objects from a pool array as addSource does.
  - Call `enginePool.update(engineSources, dt)` every frame (with an empty list too, so voices fade out).
  - Sirens and ambulances stay on the loop pool, unchanged.

## Contract
watchVehicles.ts keeps `createVehicleSounds(): VehicleSounds`, `VehicleSoundFrame`, `crashKind`, `hornFor`,
`loopKindFor`, `wrapAngle` as they are (sound/index.ts and watchVehicles.test.ts use them).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes (from the repo root).
- In games/gnome-theft-auto: `npx vitest run src/sound` passes.

## Out of scope
engineModel.ts, engineVoice.ts, audio.ts, bus.ts, spatial.ts, sound/index.ts, everything outside src/sound/.
~~~~

~~~~text
Epic: 2. Fill in
Issue: 2F Map icons for every place, on the minimap and the big map, with a legend
Depends on: none

## Environment
Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af12233ca32c4611b (a git worktree; stay
in it). Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Do not run `npm install`, do not
commit, do not start a dev server. Other workers are editing other files in games/gnome-theft-auto at the same time
(radio and sound files); touch only the files under Change. Mobile rule: every icon must read on the 96 px phone
minimap.

## Goal
Every point of interest has its own icon (a coloured round badge with a white glyph) on the minimap and the big map,
and the big map's legend lists them: Ammu-Gnation, Pay 'n' Glaze, the Glaze Clinic Hospital, Side-Valve Salvage, the
Lost & Found Speedway, the Whirligig, The Gnomecino, Clay-Mart, Thorne Tower, the Turfton Amphitheater and the
airfield.

## Read first
- games/gnome-theft-auto/src/hud.ts lines 282-600 (the map constants, `drawMarker`, `drawPlace`, `LEGEND`,
  `drawLegend`) and 894-1130 (`drawMap` and `drawBig`, which draw blips).
- games/gnome-theft-auto/src/types.ts: `Blip` (its `kind` union already has the new place kinds).
- games/gnome-theft-auto/src/app.ts lines 1455-1470: the HUD blips list.
- games/gnome-theft-auto/src/config.ts lines 104-145: HOSPITAL, SIDE_VALVE, GNOMECINO, THORNE_TOWER, CLAY_MART,
  AMPHITHEATER (and AIRFIELD at line 91), each with `x` and `z`.

## Change
- games/gnome-theft-auto/src/mapIcons.ts (new), canvas only, no DOM at import time:
  ```ts
  import type { Blip } from './types';
  export type PlaceKind = 'shop' | 'speedway' | 'glaze' | 'hospital' | 'salvage' | 'whirligig' | 'casino' | 'mart'
    | 'tower' | 'stage' | 'airfield';
  /** Legend name and badge colour per place. */
  export const PLACE_STYLE: Readonly<Record<PlaceKind, { name: string; color: string }>>;
  /** Places that pin to the minimap's rim when they are off it (services you drive to). */
  export const RIM_PLACES: ReadonlySet<PlaceKind>; // shop, glaze, hospital, salvage
  export function isPlace(b: Blip): b is Blip & { kind: PlaceKind };
  /** A round badge of radius r centred on (x, y): the place's colour, a 1.5 px dark outline (#0c0f13), a white glyph. */
  export function drawPlaceIcon(g: CanvasRenderingContext2D, x: number, y: number, r: number, kind: PlaceKind): void;
  ```
  Styles (name, colour, glyph drawn with paths in white, line width at least 1.5 px, filling about 60% of the badge):
  shop "Ammu-Gnation (gun mods)" #4b5d2a with an #ff7a1a ring, a pistol side view (barrel, grip); glaze "Pay 'n' Glaze"
  #ff3b9a, a spray can (body, cap, three spray dots); hospital "Glaze Clinic Hospital" #e53935, a plus cross; salvage
  "Side-Valve Salvage" #f08a24, a wrench; speedway "Lost & Found Speedway" #222222, a chequered flag; whirligig "The
  Whirligig" #ff4fd8, a three-blade propeller; casino "The Gnomecino" #1f7a4a, a poker chip (ring with four notches and
  a centre dot); mart "Clay-Mart" #2f6fd6, a shopping bag (body and handle arc); tower "Thorne Tower" #8a7f6a, a tall
  tower with window dots; stage "Turfton Amphitheater" #7b4bd6, a music note; airfield "Airfield" #3aa7e0, a plane seen
  from above.
- games/gnome-theft-auto/src/mapPois.ts (new):
  `export function placeBlips(): Blip[]` returning the fixed places with `kind` and `label`: hospital (HOSPITAL x/z,
  label 'Glaze Clinic Hospital'), salvage (SIDE_VALVE.bay, 'Side-Valve Salvage'), casino (GNOMECINO, 'The Gnomecino'),
  mart (CLAY_MART, 'Clay-Mart'), tower (THORNE_TOWER, 'Thorne Tower'), stage (AMPHITHEATER, 'Turfton Amphitheater'),
  airfield (AIRFIELD, 'Airfield'). `color` = the PLACE_STYLE colour.
- games/gnome-theft-auto/src/app.ts: in the HUD blips list only, replace the hospital line and the SIDE_VALVE line with
  `...placeBlips(),`, and give the Whirligig blip `kind: 'whirligig', label: 'The Whirligig'`. Import `placeBlips` from
  './mapPois'. No other app.ts change.
- games/gnome-theft-auto/src/hud.ts:
  - `drawMarker`: any place (`isPlace(b)`) draws `drawPlaceIcon(g, x, y, r, b.kind)` (the old speedway/glaze/shop drawing
    goes; delete `drawPlace` and the 'shop' branch).
  - `drawMap` (minimap): places use radius `size < 110 ? 6 : 7`. Places on the map draw where they are; a place in
    RIM_PLACES that is off the map pins to the rim like the other-player dots (scale dx, dz so the larger is MAP_RANGE
    - 8) at radius 4.5 and `globalAlpha` 0.75; other places off the map are not drawn. Draw places before quest blips
    so objectives stay on top.
  - `drawBig` (big map): places at radius 9 with their `label` under them (as now), for every place kind (today the
    shop label is skipped; show it too, its label is 'Ammu-Gnation'). If gunStore's blip has no label, use
    PLACE_STYLE.shop.name.
  - Legend: rebuild LEGEND as: Story mission, Side quest, Current objective, Turfton Taxi, Route to waypoint, then one
    row per PlaceKind from PLACE_STYLE (drawn with drawPlaceIcon at radius 6), then 'Parked vehicle' (dot #ffd23f) and
    'Other player' (dot #7cf0ff). When the rows do not fit in 60% of the map's height, lay the legend out in two
    columns. Keep font sizes (10 px under 360 px, else 11 px) and keep it in the bottom-left.
  - Phone check: the minimap is 96 px wide under 420 px window width; the icons above must stay distinct there.

## Contract
`Blip.kind` (types.ts) is
`'main' | 'side' | 'objective' | 'taxi' | 'shop' | 'speedway' | 'glaze' | 'hospital' | 'salvage' | 'whirligig' |
'casino' | 'mart' | 'tower' | 'stage' | 'airfield'`; do not change types.ts. gunStore.ts and raceTrack/index.ts already
send 'shop', 'speedway' and 'glaze' blips: leave those files alone.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes (from the repo root).
- games/gnome-theft-auto/src/mapIcons.test.ts (new): PLACE_STYLE has an entry for every PlaceKind with a distinct
  colour and name; `isPlace` is true for each place kind and false for 'main', 'side', 'objective', 'taxi' and no kind;
  `placeBlips()` returns seven blips with distinct kinds and labels. Run `npx vitest run src/mapIcons.test.ts` in
  games/gnome-theft-auto. (If importing config.ts needs a DOM, use `installFakeDom()` from './testing/fakeDom' as
  layout.golden.test.ts does.)

## Out of scope
types.ts, gunStore.ts, raceTrack/, input.ts, options.ts, audio.ts, radio/, sound/. hud.ts outside the map code.
~~~~
