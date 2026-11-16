/**
 * The in-run track: a new old-school (90s/00s) jungle / drum & bass track for every run,
 * fully generated from one seed.
 *
 * Design decisions, and why:
 *
 * - Breaks: one of four classic breaks (Amen, Think, Funky Drummer, Apache, see drums.ts) for the A and C
 *   sections and a different one for B, as rhythm templates only (no samples).
 *
 * - Chopping was first fully random every bar, which played back as "too random". Now each run
 *   chops a handful of bars once and repeats them. Swaps keep the downbeat and backbeat and only
 *   take a slice from the same spot in another beat. chopBar()'s `amount` is the knob: 0 = straight.
 *
 * - Song form is A B A C, 16 bars per section, looped. The first A opens with the straight break, and the bass
 *   comes in at bar 8. B has its own progression, bass riff, stab rhythm and harder chops.
 *   C starts with an 8-bar breakdown (drums out, pad + held reese, hats creeping back), then the beat drops back in. A snare-roll fill
 *   comes every 8 bars, and a dub echo "throw" catches the last snare of every 4th bar.
 *
 * - Harmony is chord-memory style, inspired by the Cthulhu plugin: a bank of PRESETS, each a minor
 *   mode plus two 4-chord progressions written as scale degrees. Chords are stacked in thirds
 *   inside the mode (7ths for the pad, 9ths for the stabs), and voiceLead() picks the inversion that moves least
 *   from the previous chord. This replaced random root jumps, which sounded messy. The bass plays chord roots near the tonic.
 *
 * - Mix: the tonal parts sit on a bus that ducks on each kick (fake sidechain). Stabs, pad and reese
 *   are high-passed so the sine sub owns the low end. Stabs feed a ping-pong delay into a hall reverb, and the pad feeds the reverb.
 *
 * - Fills: a snare roll at the 8-bar midpoint. On the last bar of each section, one of four
 *   transition fills (roll, cut, stutter, syncopated) from its own seeded stream, never the same twice running,
 *   so the transitions vary without getting busy.
 *
 * - Swing: off-beat 16th hats are pushed late by 6-16% of a 16th, varying per run (its own seeded stream).
 *
 * - All triggers use the `time` passed to the Loop callback, never Tone.now(), or the break flams.
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from './engine';
import { BREAKS, TRANSITION_FILLS, chopBar, createKit, transitionFill, withFill, type Slice, type TransitionFill } from './drums';
import { createFx } from './mix';
import { MODES, NOTE_NAMES, chordTones, midiToNote, mulberry32, voiceLead, type ModeName } from './theory';

/** A preset: a mode and two 4-chord progressions (scale degrees, 0 = i), one for A sections and one for B. */
interface ChordPreset { name: string; mode: ModeName; a: number[]; b: number[] }
const PRESETS: ChordPreset[] = [
  { name: 'Aeolian Liquid',    mode: 'aeolian',  a: [0, 5, 2, 6], b: [3, 5, 6, 6] }, // i VI III VII | iv VI VII VII
  { name: 'Aeolian Rave',      mode: 'aeolian',  a: [0, 6, 5, 6], b: [0, 3, 5, 4] }, // i VII VI VII | i iv VI v
  { name: 'Dorian Roller',     mode: 'dorian',   a: [0, 3, 0, 3], b: [1, 3, 6, 0] }, // i IV i IV   | ii IV VII i
  { name: 'Dorian Soul',       mode: 'dorian',   a: [0, 1, 2, 1], b: [3, 2, 1, 0] }, // i ii III ii | IV III ii i
  { name: 'Phrygian Dread',    mode: 'phrygian', a: [0, 1, 0, 1], b: [0, 6, 5, 1] }, // i II i II   | i vii VI II
  { name: 'Phrygian Steppers', mode: 'phrygian', a: [0, 0, 6, 1], b: [5, 6, 1, 0] },
  { name: 'Harmonic Tension',  mode: 'harmonic', a: [0, 3, 4, 0], b: [5, 3, 4, 4] }, // i iv V i    | VI iv V V
  { name: 'Harmonic Noir',     mode: 'harmonic', a: [0, 5, 3, 4], b: [0, 1, 5, 4] },
];

type Section = 'A' | 'B' | 'C';
const SONG: Section[] = ['A', 'B', 'A', 'C'];
const SECTION_BARS = 16;

export function buildRunTrack(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void {
  const rnd = mulberry32(seed);
  const pick = <V>(xs: V[]): V => xs[Math.floor(rnd() * xs.length)];

  const transport = T.getTransport();
  transport.bpm.value = 162 + Math.floor(rnd() * 14);

  const fx = createFx(T, keep, out);
  // Swing: off-beat 16th hats land late by 6-16% of a 16th. It comes from its own random stream,
  // so adding it did not change any other choice a seed makes.
  const swing = 0.06 + 0.1 * mulberry32((seed ^ 0x5bd1e995) >>> 0)();
  const kit = createKit(T, keep, out, fx, { snarePitch: pick(['D3', 'E3', 'F#3']), swing });

  // ----- music bus: everything tonal ducks under the kick (simple sidechain pump) -----
  const duck = keep(new T.Gain(1)).connect(out);

  // Reese: fat detuned saws, swept lowpass, high-passed so the sub owns the low end.
  const reeseHp = keep(new T.Filter(90, 'highpass')).connect(duck);
  const reeseFilter = keep(new T.Filter(500, 'lowpass')).connect(reeseHp);
  keep(new T.LFO(0.08 + rnd() * 0.15, 250, 1100)).connect(reeseFilter.frequency).start();
  const reese = keep(new T.MonoSynth({ oscillator: { type: 'fatsawtooth', count: 3, spread: 25 }, envelope: { attack: 0.02, decay: 0.3, sustain: 0.8, release: 0.2 }, filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 1, release: 0.2, baseFrequency: 2000, octaves: 0 } })).connect(reeseFilter);
  reese.volume.value = -14;
  const sub = keep(new T.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.1 } })).connect(duck);
  sub.volume.value = -6;

  // Stab and pad: high-passed, mostly into the effects.
  const stabHp = keep(new T.Filter(250, 'highpass')).fan(duck, fx.delay);
  const stab = keep(new T.PolySynth(T.Synth, { oscillator: { type: pick(['fatsawtooth', 'fatsquare'] as const) }, envelope: { attack: 0.003, decay: 0.18, sustain: 0, release: 0.15 } })).connect(stabHp);
  stab.volume.value = -20;
  const padFilter = keep(new T.Filter(900, 'lowpass'));
  const padHp = keep(new T.Filter(200, 'highpass')).fan(duck, fx.rev);
  padFilter.connect(padHp);
  const pad = keep(new T.PolySynth(T.Synth, { oscillator: { type: 'fatsawtooth', count: 2, spread: 20 }, envelope: { attack: 1.2, decay: 0.5, sustain: 0.7, release: 2 } })).connect(padFilter);
  pad.volume.value = -26;

  // ----- song material: A and B get their own chords, bass riff and stab rhythm -----
  const root = 33 + Math.floor(rnd() * 12); // tonic, A1..G#2
  const preset = pick(PRESETS);
  const mode = MODES[preset.mode];
  console.info(`[music] ${preset.name} in ${NOTE_NAMES[root % 12]} ${preset.mode}, ${Math.round(transport.bpm.value)} bpm, swing ${Math.round(swing * 100)}%`);
  // Pre-voice every chord of both progressions once, voice-leading through the whole loop.
  const voiceProg = (prog: number[], size: number, center: number): number[][] => {
    let prev: number[] | null = null;
    return prog.map((deg) => (prev = voiceLead(chordTones(mode, deg, size), center, prev)));
  };
  const padA = voiceProg(preset.a, 4, 7), padB = voiceProg(preset.b, 4, 7);   // 7ths, mid register
  const stabA7 = voiceProg(preset.a, 5, 16), stabB7 = voiceProg(preset.b, 5, 16); // 9ths, higher up
  const bassNote = (deg: number) => { const t = mode[deg % 7]; return t > 7 ? t - 12 : t; }; // keep the bass near the tonic
  const bassRiffs: [number, number][][] = [
    [[0, 6], [10, 4]],
    [[0, 3], [3, 3], [10, 6]],
    [[0, 12], [14, 2]],
    [[0, 4], [6, 4], [11, 5]],
  ];
  const riffA = pick(bassRiffs);
  const riffB = pick(bassRiffs);
  const stabRhythms = [[0, 6], [3, 10], [6, 14], [0, 3, 10]];
  const stabA = pick(stabRhythms);
  const stabB = pick(stabRhythms);
  const chordBars = 2;

  // Break bars: A (and C) chop the main break lightly; B switches to a second break, chopped harder.
  const mainIdx = Math.floor(rnd() * BREAKS.length);
  const mainBreak = BREAKS[mainIdx].steps;
  const altBreak = BREAKS[(mainIdx + 1 + Math.floor(rnd() * (BREAKS.length - 1))) % BREAKS.length];
  const alt = altBreak.steps;
  const straight = [chopBar(rnd, mainBreak, 0, 0), chopBar(rnd, mainBreak, 1, 0)];
  const drumsA = [chopBar(rnd, mainBreak, 0, 0.15), chopBar(rnd, mainBreak, 1, 0.2), chopBar(rnd, mainBreak, 0, 0.15), chopBar(rnd, mainBreak, 1, 0.3)];
  const drumsB = [chopBar(rnd, alt, 0, 0.35), chopBar(rnd, alt, 1, 0.4), chopBar(rnd, alt, 0, 0.35), chopBar(rnd, alt, 1, 0.5)];
  console.info(`[music] breaks: ${BREAKS[mainIdx].name} (A/C), ${altBreak.name} (B)`);
  const fillA = withFill(drumsA[3], rnd() < 0.5 ? 12 : 8);
  const fillB = withFill(drumsB[3], rnd() < 0.5 ? 12 : 8);

  // Section-end fills: picked as the song plays from their own seeded stream, never the same kind
  // twice in a row. Mid-section (bar 8) fills stay the plain roll.
  const fillRnd = mulberry32((seed ^ 0x27d4eb2d) >>> 0);
  let lastFill: TransitionFill | null = null;
  const nextFill = (): TransitionFill => {
    const options = TRANSITION_FILLS.filter((f) => f !== lastFill);
    return (lastFill = options[Math.floor(fillRnd() * options.length)]);
  };

  const step16 = T.Time('16n').toSeconds();
  let step = 0;
  let pattern: Slice[] | null = null;
  const loop = keep(new T.Loop((time) => {
    const bar = Math.floor(step / 16);
    const pos = step % 16;
    step++;
    const sectionIdx = Math.floor(bar / SECTION_BARS);
    const section = SONG[sectionIdx % SONG.length];
    const sb = bar % SECTION_BARS; // bar within section
    const intro = sectionIdx === 0;
    const breakdown = section === 'C' && sb < 8;

    if (pos === 0) {
      const lastOfEight = sb % 8 === 7;
      const lastOfSection = sb === SECTION_BARS - 1;
      if (lastOfSection) pattern = transitionFill(section === 'B' ? drumsB[3] : drumsA[3], nextFill());
      else if (breakdown) pattern = sb >= 6 ? straight[sb % 2].map((s) => (s.h ? { h: 1 as const } : {})) : null; // hats creep back in
      else if (intro && sb < 8) pattern = lastOfEight ? fillA : straight[sb % 2];
      else if (section === 'B') pattern = lastOfEight ? fillB : drumsB[sb % 4];
      else pattern = lastOfEight ? fillA : drumsA[sb % 4];
    }
    // Dub throw: the last snare of every 4th bar echoes off into the reverb.
    if (pos === 12) fx.throwSend.gain.setValueAtTime(sb % 4 === 3 ? 0.5 : 0, time);
    if (pos === 0) fx.throwSend.gain.setValueAtTime(0, time);

    const isB = section === 'B';
    const ci = Math.floor(sb / chordBars) % 4;
    const chordRoot = root + bassNote((isB ? preset.b : preset.a)[ci]);
    const padChord = (isB ? padB : padA)[ci];
    const stabChord = (isB ? stabB7 : stabA7)[ci];

    const sl = pattern?.[pos];
    if (sl && kit.hit(sl, time, pos)) {
      duck.gain.setValueAtTime(0.5, time);
      duck.gain.linearRampToValueAtTime(1, time + 0.15);
    }

    // Bass: enters halfway through the intro; in the breakdown only long held roots.
    if (!(intro && sb < 8)) {
      if (breakdown) {
        if (pos === 0 && sb % 2 === 0) reese.triggerAttackRelease(midiToNote(chordRoot), 32 * step16 * 0.95, time, 0.6);
      } else {
        for (const [at, len] of isB ? riffB : riffA) {
          if (pos !== at) continue;
          const dur = len * step16 * 0.95;
          reese.triggerAttackRelease(midiToNote(chordRoot), dur, time, 0.8);
          sub.triggerAttackRelease(midiToNote(chordRoot - 12), dur, time, 0.9);
        }
      }
    }
    // Stabs: from the first B on, not in the breakdown.
    if (sectionIdx >= 1 && !breakdown && (isB ? stabB : stabA).includes(pos)) {
      stab.triggerAttackRelease(stabChord.map((i) => midiToNote(root + 24 + i)), '16n', time, 0.7);
    }
    // Pad: always, one chord per 2 bars.
    if (pos === 0 && sb % chordBars === 0) {
      pad.triggerAttackRelease(padChord.map((i) => midiToNote(root + 24 + i)), chordBars * 16 * step16 * 0.95, time, breakdown ? 0.8 : 0.5);
    }
  }, '16n'));
  loop.start(0);
}
