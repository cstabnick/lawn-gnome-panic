/**
 * The menu theme: a composed, fixed piece (not generated) in the same old-school jungle world as
 * the run tracks, but more polished: liquid-style chords, a written melody, and arranged sections.
 *
 * - A minor, 170 bpm. The progression is Fmaj7 - G6 - Em7 - Am9 (VI - VII - v - i), 2 bars each.
 *   Voicings are written by hand for smooth voice leading. The Am9 is rootless (G B C E) and the bass plays the A.
 * - Form (bars): intro 8 | A 16 | B 16 | breakdown 8 | A2 16 | then loop back to A.
 *   - intro: keys and pad, then drums fade in through an opening low-pass filter, with a noise riser.
 *   - A: the Amen played straight with a written edit and fill, sub bass line, keys comping.
 *   - B: switches to the Think break and brings in the lead melody (call, then answer).
 *   - breakdown: drums out, held chords, melody over the top, then a snare build and riser.
 *   - A2: back to the Amen with a shaker on top, and the answer phrase in the second half.
 * - Polish over the run track: a light swing on the off-beat hats, deterministic velocity humanizing,
 *   crash on section starts, and gentler grit and ducking.
 * - Timing: all triggers use the Loop's `time`, never Tone.now().
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from './engine';
import { barOf, breakByName, createKit, withFill, type Slice } from './drums';
import { createFx } from './mix';
import { midiToNote } from './theory';

const BPM = 170;

// ----- harmony (MIDI note numbers) -----
/** Keys voicings, one per 2-bar chord: Fmaj7, G6, Em7, Am9 (rootless). */
const KEYS: number[][] = [
  [53, 57, 60, 64], // F3 A3 C4 E4
  [55, 59, 62, 64], // G3 B3 D4 E4
  [52, 55, 59, 62], // E3 G3 B3 D4
  [55, 59, 60, 64], // G3 B3 C4 E4 over A
];
/** Bass roots: F2 G2 E2 A2 (the sub plays an octave lower). */
const ROOTS = [41, 43, 40, 45];

/** Keys comping over a 2-bar chord: [start step (0-31), length in 16ths]. */
const KEYS_COMP: [number, number][] = [[0, 10], [10, 6], [22, 4], [28, 4]];
/** Bass line over a 2-bar chord: [start step, length, semitones above the root]. */
const BASS_LINE: [number, number, number][] = [[0, 12, 0], [14, 2, 12], [18, 6, 0], [26, 6, 7]];

// ----- melody: [bar in phrase (0-7), step, MIDI note, length in 16ths] -----
const CALL: [number, number, number, number][] = [
  [0, 0, 76, 6], [0, 6, 72, 4], [0, 10, 69, 6],
  [1, 0, 67, 4], [1, 4, 69, 4], [1, 8, 72, 8],
  [2, 0, 74, 6], [2, 6, 71, 4], [2, 10, 67, 6],
  [3, 0, 76, 8], [3, 8, 74, 4], [3, 12, 71, 4],
  [4, 0, 71, 6], [4, 6, 67, 4], [4, 10, 64, 6],
  [5, 0, 74, 4], [5, 4, 71, 4], [5, 8, 67, 8],
  [6, 0, 72, 6], [6, 6, 71, 2], [6, 8, 69, 8],
  [7, 0, 76, 12],
];
/** The answer: same opening, then it climbs and resolves high on A. */
const ANSWER: [number, number, number, number][] = [
  ...CALL.filter(([bar]) => bar < 6 && bar !== 1),
  [1, 0, 67, 4], [1, 4, 69, 4], [1, 8, 72, 4], [1, 12, 74, 4],
  [6, 0, 72, 4], [6, 4, 74, 4], [6, 8, 76, 8],
  [7, 0, 79, 6], [7, 6, 76, 4], [7, 10, 81, 6],
];
const toLookup = (m: [number, number, number, number][]) => new Map(m.map(([b, s, n, l]) => [b * 16 + s, [n, l] as const]));
const CALL_AT = toLookup(CALL);
const ANSWER_AT = toLookup(ANSWER);

// ----- arrangement -----
type SectionId = 'intro' | 'A' | 'B' | 'breakdown' | 'A2';
const SECTIONS: { id: SectionId; bars: number }[] = [
  { id: 'intro', bars: 8 }, { id: 'A', bars: 16 }, { id: 'B', bars: 16 }, { id: 'breakdown', bars: 8 }, { id: 'A2', bars: 16 },
];
const LOOP_FROM = 1; // after the intro, loop A..A2

/** Which section a bar falls in, and the bar within it. */
function locate(bar: number): { id: SectionId; sb: number } {
  let b = bar;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = pass === 0 ? 0 : LOOP_FROM; i < SECTIONS.length; i++) {
      if (b < SECTIONS[i].bars) return { id: SECTIONS[i].id, sb: b };
      b -= SECTIONS[i].bars;
    }
    const loopBars = SECTIONS.slice(LOOP_FROM).reduce((n, s) => n + s.bars, 0);
    b %= loopBars;
  }
  return { id: 'A', sb: 0 };
}

/** Small deterministic velocity variation so repeats don't sound mechanical. */
const humanize = (step: number): number => {
  const x = Math.sin(step * 12.9898) * 43758.5453;
  return 0.9 + 0.1 * (x - Math.floor(x));
};

export function buildMenuTheme(T: Tone, keep: Keep, out: ToneNS.Volume): void {
  T.getTransport().bpm.value = BPM;
  const step16 = T.Time('16n').toSeconds();
  const barS = 16 * step16;
  const hold = (steps: number) => steps * step16 * 0.98;

  const fx = createFx(T, keep, out, { reverbDecay: 5, snareSend: 0.12 });
  const send = (amount: number, to: ToneNS.InputNode) => keep(new T.Gain(amount)).connect(to);

  // ----- drums: kit through a low-pass that the intro and the build sweep open -----
  const drumFilter = keep(new T.Filter({ frequency: 18000, type: 'lowpass', rolloff: -24 })).connect(out);
  const kit = createKit(T, keep, drumFilter, fx, { grit: 0.08, snarePitch: 'E3', swing: 0.12 });
  const shakerBp = keep(new T.Filter({ frequency: 7000, type: 'bandpass', Q: 1 })).connect(drumFilter);
  const shaker = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.002, decay: 0.04, sustain: 0, release: 0.02 } })).connect(shakerBp);
  shaker.volume.value = -24;
  const crashHp = keep(new T.Filter(4000, 'highpass')).fan(drumFilter, send(0.3, fx.rev));
  const crash = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 1.6, sustain: 0, release: 0.4 } })).connect(crashHp);
  crash.volume.value = -24;
  const riserBp = keep(new T.Filter({ frequency: 300, type: 'bandpass', Q: 3 })).fan(out, send(0.4, fx.rev));
  const riser = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 2 * barS, decay: 0.05, sustain: 1, release: 0.2 } })).connect(riserBp);
  riser.volume.value = -28;

  // ----- tonal parts on a bus that ducks gently under the kick -----
  const duck = keep(new T.Gain(1)).connect(out);
  const sub = keep(new T.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.15 } })).connect(duck);
  sub.volume.value = -8;
  const bassMid = keep(new T.MonoSynth({
    oscillator: { type: 'sawtooth' }, filter: { Q: 1, type: 'lowpass' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.15 },
    filterEnvelope: { attack: 0.01, decay: 0.25, sustain: 0.3, release: 0.2, baseFrequency: 160, octaves: 1.6 },
  })).connect(duck);
  bassMid.volume.value = -22;

  // Electric-piano-ish FM keys with tremolo.
  const keysLp = keep(new T.Filter(3500, 'lowpass')).fan(duck, send(0.35, fx.rev));
  const trem = keep(new T.Tremolo(3.5, 0.35)).connect(keysLp).start();
  const keys = keep(new T.PolySynth(T.FMSynth, {
    harmonicity: 2, modulationIndex: 1.8,
    oscillator: { type: 'sine' }, modulation: { type: 'sine' },
    envelope: { attack: 0.003, decay: 1.6, sustain: 0.2, release: 1.4 },
    modulationEnvelope: { attack: 0.002, decay: 0.6, sustain: 0.1, release: 0.8 },
  })).connect(trem);
  keys.volume.value = -6;

  const padHp = keep(new T.Filter(250, 'highpass')).fan(duck, send(0.6, fx.rev));
  const padLp = keep(new T.Filter(1200, 'lowpass')).connect(padHp);
  const pad = keep(new T.PolySynth(T.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 24 }, envelope: { attack: 1.5, decay: 0.5, sustain: 0.8, release: 2.5 } })).connect(padLp);
  pad.volume.value = -22;

  // Lead: an FM bell with a soft triangle underneath for body, into the echo and reverb.
  const leadLp = keep(new T.Filter(6000, 'lowpass')).fan(duck, send(0.3, fx.delay), send(0.3, fx.rev));
  const bell = keep(new T.FMSynth({
    harmonicity: 3.01, modulationIndex: 6,
    envelope: { attack: 0.002, decay: 1.0, sustain: 0.1, release: 1.0 },
    modulationEnvelope: { attack: 0.002, decay: 0.25, sustain: 0, release: 0.3 },
  })).connect(leadLp);
  bell.volume.value = -18;
  const body = keep(new T.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.6 } })).connect(leadLp);
  body.volume.value = -24;

  // ----- drum phrases -----
  const amen = breakByName('Amen'), think = breakByName('Think');
  const a0 = barOf(amen, 0), a1 = barOf(amen, 1), t0 = barOf(think, 0), t1 = barOf(think, 1);
  const edit: Slice[] = a0.slice(0, 14).concat([{ g: 1 }, { s: 1 }]);
  const PHRASE_A = [a0, a1, a0, edit, a0, a1, a0, withFill(a1, 12)];
  const PHRASE_B = [t0, t1, t0, t1, t0, t1, t0, withFill(t1, 8)];
  const hatsOnly = (bar: Slice[]) => bar.map((s): Slice => (s.h ? { h: 1 } : {}));

  console.info(`[music] menu theme, A minor, ${BPM} bpm`);
  let step = 0;
  const loop = keep(new T.Loop((time) => {
    const bar = Math.floor(step / 16);
    const pos = step % 16;
    const vel = humanize(step);
    step++;
    const { id, sb } = locate(bar);
    const ci = Math.floor(sb / 2) % 4;
    const s32 = (sb % 2) * 16 + pos; // position within the 2-bar chord
    const p8 = sb % 8;               // bar within the 8-bar phrase

    // --- section starts: crash, filter moves, risers ---
    if (pos === 0) {
      if (sb === 0 && (id === 'A' || id === 'B' || id === 'A2')) crash.triggerAttackRelease(1.6, time, 0.8);
      if (id === 'intro' && sb === 0) drumFilter.frequency.setValueAtTime(400, time);
      if (id === 'intro' && sb === 4) {
        // Ramps start from the previous event, so pin the start value here or it sweeps from bar 0.
        drumFilter.frequency.setValueAtTime(400, time);
        drumFilter.frequency.exponentialRampToValueAtTime(18000, time + 4 * barS);
      }
      if ((id === 'intro' || id === 'breakdown') && sb === 6) {
        riser.triggerAttackRelease(2 * barS, time, 0.8);
        riserBp.frequency.setValueAtTime(300, time);
        riserBp.frequency.exponentialRampToValueAtTime(9000, time + 2 * barS);
      }
      if (id === 'breakdown' && sb === 6) {
        drumFilter.frequency.setValueAtTime(800, time);
        drumFilter.frequency.exponentialRampToValueAtTime(18000, time + 2 * barS);
      }
    }

    // --- drums ---
    let pattern: Slice[] | null = null;
    if (id === 'intro') pattern = sb < 4 ? null : sb < 6 ? hatsOnly(a0) : sb === 7 ? withFill(a1, 12) : a0;
    else if (id === 'A' || id === 'A2') pattern = PHRASE_A[p8];
    else if (id === 'B') pattern = PHRASE_B[p8];
    if (pattern && kit.hit(pattern[pos], time, pos, vel)) {
      duck.gain.setValueAtTime(0.65, time);
      duck.gain.linearRampToValueAtTime(1, time + 0.12);
    }
    if (id === 'breakdown' && sb >= 6) {
      // Snare build: 8ths, then 16ths, getting louder.
      const every = sb === 6 ? 2 : 1;
      if (pos % every === 0) kit.snareHit(time, 0.25 + 0.6 * ((sb - 6) * 16 + pos) / 32);
    }
    if (id === 'A2') shaker.triggerAttackRelease('32n', time + (pos % 2 ? 0.12 * step16 : 0), (pos % 4 === 2 ? 0.7 : 0.4) * vel);

    // --- bass ---
    const root = ROOTS[ci];
    if (id === 'A' || id === 'B' || id === 'A2') {
      for (const [at, len, off] of BASS_LINE) {
        if (s32 !== at) continue;
        sub.triggerAttackRelease(midiToNote(root - 12 + off), hold(len), time, 0.9);
        bassMid.triggerAttackRelease(midiToNote(root + off), hold(len), time, 0.7 * vel);
      }
    } else if (id === 'breakdown' && s32 === 0) {
      sub.triggerAttackRelease(midiToNote(root - 12), hold(32), time, 0.6);
    }

    // --- keys: held chords in the intro and breakdown, comping elsewhere ---
    const chord = KEYS[ci].map(midiToNote);
    if (id === 'intro' || id === 'breakdown') {
      if (s32 === 0) keys.triggerAttackRelease(chord, hold(32), time, 0.8);
    } else {
      for (const [at, len] of KEYS_COMP) if (s32 === at) keys.triggerAttackRelease(chord, hold(len), time, (at === 0 ? 0.65 : 0.5) * vel);
    }

    // --- pad: one chord per 2 bars, an octave above the keys ---
    if (s32 === 0) {
      const padVel = id === 'intro' ? 0.5 : id === 'breakdown' ? 0.7 : 0.35;
      pad.triggerAttackRelease(KEYS[ci].map((n) => midiToNote(n + 12)), hold(32), time, padVel);
    }

    // --- lead melody ---
    let melody: typeof CALL_AT | null = null;
    if (id === 'B') melody = sb < 8 ? CALL_AT : ANSWER_AT;
    else if (id === 'breakdown') melody = CALL_AT;
    else if (id === 'A2' && sb >= 8) melody = ANSWER_AT;
    const note = melody?.get(p8 * 16 + pos);
    if (note) {
      const [n, len] = note;
      const v = (id === 'breakdown' ? 0.6 : 0.8) * vel;
      bell.triggerAttackRelease(midiToNote(n), hold(len), time, v);
      body.triggerAttackRelease(midiToNote(n), hold(len), time, v * 0.8);
    }
  }, '16n'));
  loop.start(0);
}
