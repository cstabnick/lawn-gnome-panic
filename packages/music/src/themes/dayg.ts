// The Mossgrave score (DayG, docs/design/dayg/soundscape/music-ui-and-tech.md section 1). Generated in code with Tone.js.
//
// One song, one tempo, one chord loop. Everything the game needs to change is a named layer that the game ramps with
// setLayer (never a new song): the day colour (a glass tune) or the night colour (a low drone and a minor arpeggio), the
// haven's music box, and the threat tiers Uneasy (pulse), Tense (plucked ostinato) and Danger (drums and stabs). Stingers
// (dusk, dawn, a hit, the bell, a shatter, a quest) are scheduled to the next bar through the hooks, so they land on the beat.
//
// - 78-82 bpm, a key from the seed (F3..C4), an 8-bar loop: I V vi IV I V ii V.
// - Plays through the pad layer from the start; the other layers sit at 0 until the game raises them.
import type * as ToneNS from 'tone';
import { addLayer, scheduleStinger, type Keep, type Tone } from '../engine';
import { createFx } from '../mix';
import { chordTones, midiToNote, mulberry32, MODES, voiceLead } from '../theory';

export type DaygStinger = 'dusk' | 'dawn' | 'hit' | 'shatter' | 'respawn' | 'horde' | 'quest-up' | 'quest-done' | 'quest-fail'
  | 'infection' | 'bell' | 'fanfare' | 'hammer' | 'chime' | 'achievement';

/** Filled in by the score when it is built. The game calls them; each one schedules on the next bar. */
export interface DaygHooks {
  /** `arg`: the bell's survived flag (1 resolves to major, 0 to minor), or an infection stage 0..3. */
  stinger(kind: DaygStinger, arg?: number): void;
}

/** The layer names the game may set (see setLayer). */
export const DAYG_LAYERS = ['pad', 'day', 'night', 'haven', 'pulse', 'ostinato', 'drums', 'stabs', 'drip'] as const;
export type DaygLayer = (typeof DAYG_LAYERS)[number];

const MAJOR = MODES.ionian;
const MAJOR_PENT = [0, 2, 4, 7, 9];
const MINOR_PENT = [0, 3, 5, 7, 10];
const FORM = [0, 4, 5, 3, 0, 4, 1, 4];   // I V vi IV I V ii V
const LOOP_BARS = FORM.length;

type Ev<V> = [number, V];

export function buildDaygScore(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number, hooks: Partial<DaygHooks>): void {
  const rng = mulberry32(seed);
  const bpm = 78 + Math.floor(rng() * 5);
  const tonic = 53 + Math.floor(rng() * 8);   // F3..C4
  T.getTransport().bpm.value = bpm;
  const BEAT = 60 / bpm;
  const BAR = 4 * BEAT;
  const EIGHTH = BEAT / 2;
  const LOOP = LOOP_BARS * BAR;

  // ----- harmony: the chord of each bar, voice led, and its root in the bass register -----
  const chords: number[][] = [];
  const roots: number[] = [];
  let prev: number[] | null = null;
  for (let bar = 0; bar < LOOP_BARS; bar++) {
    const deg = FORM[bar];
    const abs = chordTones(MAJOR, deg, 4).map((t) => tonic + t);
    const notes = voiceLead(abs, 60, prev);
    prev = notes;
    chords.push([...notes].sort((a, b) => a - b));
    let root = tonic + MAJOR[deg];
    while (root > 48) root -= 12;
    while (root < 36) root += 12;
    roots.push(root);
  }

  // ----- events, one list per layer -----
  const padEv: Ev<{ notes: string[]; dur: number }>[] = [];
  const dayEv: Ev<{ note: string; dur: number; vel: number }>[] = [];
  const nightDroneEv: Ev<{ note: string; dur: number }>[] = [];
  const nightArpEv: Ev<{ note: string; dur: number; vel: number }>[] = [];
  const boxEv: Ev<{ note: string; dur: number; vel: number }>[] = [];
  const pulseEv: Ev<{ note: string }>[] = [];
  const ostEv: Ev<{ note: string; dur: number }>[] = [];
  const kickEv: Ev<{ vel: number }>[] = [];
  const hatEv: Ev<{ vel: number }>[] = [];
  const stabEv: Ev<{ notes: string[]; dur: number }>[] = [];

  let melody = 2;   // pentatonic index, kept stepwise so the tune is singable
  for (let bar = 0; bar < LOOP_BARS; bar++) {
    const t0 = bar * BAR;
    const chord = chords[bar];
    const root = roots[bar];

    padEv.push([t0, { notes: chord.map((n) => midiToNote(n - 12)), dur: BAR * 0.97 }]);

    // Day: a glass tune, two notes a bar, answered every other bar.
    if (bar % 2 === 0) {
      for (let i = 0; i < 2; i++) {
        const step = rng() < 0.7 ? (rng() < 0.5 ? -1 : 1) : (rng() < 0.5 ? -2 : 2);
        melody = Math.min(7, Math.max(2, melody + step));
        const pi = melody % MAJOR_PENT.length;
        const oct = Math.floor(melody / MAJOR_PENT.length);
        dayEv.push([t0 + i * 2 * BEAT, { note: midiToNote(tonic + 12 + MAJOR_PENT[pi] + 12 * oct), dur: 1.8 * BEAT, vel: 0.4 }]);
      }
    }

    // Night: a low drone on the root, and a sparse minor arpeggio on the odd bars.
    nightDroneEv.push([t0, { note: midiToNote(root - 12), dur: BAR * 0.97 }]);
    if (bar % 2 === 1) {
      for (let i = 0; i < 4; i++) {
        const idx = (i * 2 + bar) % MINOR_PENT.length;
        nightArpEv.push([t0 + i * BEAT, { note: midiToNote(tonic + 12 + MINOR_PENT[idx]), dur: 0.9 * BEAT, vel: 0.3 }]);
      }
    }

    // Haven: a music box arpeggio over the chord, eighths, as in the lullaby.
    [0, 1, 2, 1, 3, 2, 1, 2].forEach((idx, i) => {
      const note = chord[idx % chord.length] + (idx === 3 ? 12 : 0);
      boxEv.push([t0 + i * EIGHTH, { note: midiToNote(note), dur: EIGHTH * 1.6, vel: i % 2 === 0 ? 0.42 : 0.28 }]);
    });

    // Uneasy: a sub pulse on every beat. Tense: the plucked bass eighths. Danger: kick, hats, and stabs on 1 and 3.
    for (let b = 0; b < 4; b++) {
      pulseEv.push([t0 + b * BEAT, { note: midiToNote(root - 12) }]);
      hatEv.push([t0 + b * BEAT + EIGHTH, { vel: 0.35 }]);
    }
    kickEv.push([t0, { vel: 0.9 }], [t0 + 2 * BEAT, { vel: 0.8 }]);
    [0, 1, 2, 3, 4, 5, 6, 7].forEach((i) => {
      const note = i % 3 === 2 ? root + 7 : root;
      ostEv.push([t0 + i * EIGHTH, { note: midiToNote(note - 12), dur: EIGHTH * 0.9 }]);
    });
    stabEv.push([t0, { notes: chord.map((n) => midiToNote(n)), dur: BEAT * 1.6 }]);
    stabEv.push([t0 + 2 * BEAT, { notes: chord.map((n) => midiToNote(n)), dur: BEAT * 1.6 }]);
  }

  // Drip: sparse pitched clicks in the wet districts (MOSSY, FLOODS), from the minor pentatonic.
  const dripEv: Ev<{ note: string }>[] = [];
  for (let bar = 0; bar < LOOP_BARS; bar++) {
    for (let i = 0; i < 8; i++) {
      if (rng() < 0.35) dripEv.push([bar * BAR + i * EIGHTH, { note: midiToNote(tonic + 24 + MINOR_PENT[(i + bar) % MINOR_PENT.length]) }]);
    }
  }

  // ----- layers and instruments (each layer is one gain; instruments feed their layer) -----
  const pad = addLayer(T, keep, 'pad', out, 1);
  const day = addLayer(T, keep, 'day', out, 1);
  const night = addLayer(T, keep, 'night', out, 0);
  const haven = addLayer(T, keep, 'haven', out, 0);
  const pulse = addLayer(T, keep, 'pulse', out, 0);
  const ostinato = addLayer(T, keep, 'ostinato', out, 0);
  const drums = addLayer(T, keep, 'drums', out, 0);
  const stabs = addLayer(T, keep, 'stabs', out, 0);
  const drip = addLayer(T, keep, 'drip', out, 0);

  const fx = createFx(T, keep, out, { reverbDecay: 5, echoTime: '8n.', echoFeedback: 0.25 });
  const send = (amount: number, to: ToneNS.InputNode) => keep(new T.Gain(amount)).connect(to);

  const padPoly = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'fattriangle', count: 2, spread: 10 },
    envelope: { attack: 1.2, decay: 0.5, sustain: 0.8, release: 3 },
  })).connect(keep(new T.Filter(1300, 'lowpass')).fan(pad, send(0.5, fx.rev)));
  padPoly.maxPolyphony = 8;
  padPoly.volume.value = -19;

  const glass = keep(new T.PolySynth(T.FMSynth, {
    harmonicity: 2, modulationIndex: 1.5,
    oscillator: { type: 'sine' }, modulation: { type: 'sine' },
    envelope: { attack: 0.005, decay: 1.2, sustain: 0.05, release: 1.4 },
    modulationEnvelope: { attack: 0.005, decay: 0.4, sustain: 0, release: 0.4 },
  })).connect(keep(new T.Filter(5200, 'lowpass')).fan(day, send(0.35, fx.delay), send(0.3, fx.rev)));
  glass.maxPolyphony = 4;
  glass.volume.value = -12;

  const drone = keep(new T.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 1.5, decay: 0.5, sustain: 0.9, release: 2.5 } }))
    .connect(keep(new T.Filter(240, 'lowpass')).fan(night, send(0.25, fx.rev)));
  drone.volume.value = -15;
  const nightArp = keep(new T.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.8, sustain: 0.05, release: 1.2 },
  })).connect(keep(new T.Filter(1800, 'lowpass')).fan(night, send(0.5, fx.delay)));
  nightArp.volume.value = -16;

  const box = keep(new T.PolySynth(T.FMSynth, {
    harmonicity: 3, modulationIndex: 1.2,
    oscillator: { type: 'sine' }, modulation: { type: 'sine' },
    envelope: { attack: 0.002, decay: 0.7, sustain: 0, release: 0.8 },
    modulationEnvelope: { attack: 0.002, decay: 0.3, sustain: 0, release: 0.3 },
  })).connect(keep(new T.Filter(5000, 'lowpass')).fan(haven, send(0.35, fx.delay), send(0.3, fx.rev)));
  box.maxPolyphony = 6;
  box.volume.value = -13;

  const sub = keep(new T.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.2 } }))
    .connect(keep(new T.Filter(130, 'lowpass')).connect(pulse));
  sub.volume.value = -10;

  const pluck = keep(new T.MonoSynth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.003, decay: 0.18, sustain: 0.1, release: 0.15 },
    filterEnvelope: { attack: 0.002, decay: 0.15, sustain: 0.2, release: 0.2, baseFrequency: 200, octaves: 2 },
  })).connect(keep(new T.Filter(900, 'lowpass')).connect(ostinato));
  pluck.volume.value = -10;

  const kick = keep(new T.MembraneSynth({ pitchDecay: 0.05, octaves: 6, envelope: { attack: 0.001, decay: 0.35, sustain: 0 } }))
    .connect(drums);
  kick.volume.value = -8;
  const hat = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 } }))
    .connect(keep(new T.Filter(7000, 'highpass')).connect(drums));
  hat.volume.value = -26;

  const stab = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 },
  })).connect(keep(new T.Filter({ frequency: 1100, type: 'lowpass', Q: 2 })).connect(stabs));
  stab.maxPolyphony = 6;
  stab.volume.value = -14;

  // Stinger voices: one shared output, always on (a stinger is not a layer).
  const dripSyn = keep(new T.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.1 } }))
    .connect(keep(new T.Filter(3000, 'lowpass')).connect(drip));
  dripSyn.volume.value = -18;

  const sting = keep(new T.Gain(1)).connect(out);
  const bell = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 5, sustain: 0, release: 4 },
  })).connect(keep(new T.Filter(5000, 'lowpass')).fan(sting, send(0.4, fx.rev)));
  bell.maxPolyphony = 12;
  bell.volume.value = -14;
  const tone = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'triangle' }, envelope: { attack: 0.02, decay: 1, sustain: 0.15, release: 1.8 },
  })).connect(keep(new T.Filter(4000, 'lowpass')).fan(sting, send(0.35, fx.rev)));
  tone.maxPolyphony = 8;
  tone.volume.value = -12;
  const thud = keep(new T.MembraneSynth({ pitchDecay: 0.08, octaves: 4, envelope: { attack: 0.001, decay: 0.45, sustain: 0 } }))
    .connect(sting);
  thud.volume.value = -6;

  // ----- schedule: one looping Part per voice, in seconds -----
  const schedule = <V>(events: Ev<V>[], fn: (time: number, v: V) => void): void => {
    const part = keep(new T.Part<Ev<V>>((time, v) => {
      try { fn(time, v); } catch { /* skip this note */ }
    }, events));
    part.loop = true;
    part.loopEnd = LOOP;
    part.start(0);
  };
  // Tone needs strictly increasing start times on one mono voice: keep each one a hair after the last.
  const mono = (): ((t: number) => number) => {
    let last = -1;
    return (t) => (last = t > last ? t : last + 0.001);
  };
  const pluckT = mono();
  const kickT = mono();
  const subT = mono();
  const dripT = mono();

  schedule(padEv, (time, e) => padPoly.triggerAttackRelease(e.notes, e.dur, time, 0.4));
  schedule(dayEv, (time, e) => glass.triggerAttackRelease(e.note, e.dur, time, e.vel));
  schedule(nightDroneEv, (time, e) => drone.triggerAttackRelease(e.note, e.dur, time, 0.5));
  schedule(nightArpEv, (time, e) => nightArp.triggerAttackRelease(e.note, e.dur, time, e.vel));
  schedule(boxEv, (time, e) => box.triggerAttackRelease(e.note, e.dur, time, e.vel));
  schedule(pulseEv, (time, e) => sub.triggerAttackRelease(e.note, 0.2, subT(time), 0.5));
  schedule(ostEv, (time, e) => pluck.triggerAttackRelease(e.note, e.dur, pluckT(time), 0.6));
  schedule(kickEv, (time, e) => kick.triggerAttackRelease('C1', 0.3, kickT(time), e.vel));
  schedule(hatEv, (time, e) => hat.triggerAttackRelease(0.04, time, e.vel));
  schedule(stabEv, (time, e) => stab.triggerAttackRelease(e.notes, e.dur, time, 0.35));
  schedule(dripEv, (time, e) => dripSyn.triggerAttackRelease(e.note, 0.15, dripT(time), 0.6));

  // ----- stingers: each schedules on the next bar, in key -----
  // The bell's four partials: sines at inharmonic ratios, one voice each, built once.
  const partials = [0, 1, 2, 3].map((i) => {
    const s = keep(new T.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 6, sustain: 0, release: 4 } })).connect(sting);
    s.volume.value = -10 - i * 4;
    return s;
  });
  const at = (fn: (t: number) => void): void => scheduleStinger(fn, 1);
  const midi = (n: number): number => T.Frequency(n, 'midi').toFrequency();
  if (hooks) {
    hooks.stinger = (kind, arg = 0) => {
      switch (kind) {
        case 'dusk':   // a rising bell phrase
          at((t) => [0, 2, 4, 7].forEach((d, i) => bell.triggerAttackRelease(midiToNote(tonic + 12 + d), 2.5, t + i * 0.2, 0.35)));
          break;
        case 'dawn':   // a warm major chord
          at((t) => tone.triggerAttackRelease([midiToNote(tonic + 12), midiToNote(tonic + 16), midiToNote(tonic + 19)], 2.5, t, 0.3));
          break;
        case 'hit':    // a low thud and three heartbeats
          at((t) => [0, 0.32, 0.7, 1.0].forEach((d) => thud.triggerAttackRelease('C1', 0.25, t + d, d === 0 ? 0.9 : 0.6)));
          break;
        case 'shatter': // a five-note descent (the game fades the song right after)
          at((t) => [12, 10, 7, 5, 3].forEach((d, i) => tone.triggerAttackRelease(midiToNote(tonic + d), 1.2, t + i * 0.3, 0.35)));
          break;
        case 'respawn': // a soft wake chord
          at((t) => tone.triggerAttackRelease([midiToNote(tonic + 12), midiToNote(tonic + 16), midiToNote(tonic + 19)], 3, t, 0.22));
          break;
        case 'horde':  // a low, distant drum roll
          at((t) => { for (let i = 0; i < 8; i++) thud.triggerAttackRelease('C1', 0.2, t + i * 0.12, 0.25 + i * 0.04); });
          break;
        case 'quest-up':   // two notes up
          at((t) => [0, 4].forEach((d, i) => tone.triggerAttackRelease(midiToNote(tonic + 12 + d), 0.6, t + i * 0.18, 0.3)));
          break;
        case 'quest-done': // three notes up
          at((t) => [0, 4, 7].forEach((d, i) => tone.triggerAttackRelease(midiToNote(tonic + 12 + d), 0.7, t + i * 0.16, 0.3)));
          break;
        case 'quest-fail': // two notes down, a minor second
          at((t) => [4, 3].forEach((d, i) => tone.triggerAttackRelease(midiToNote(tonic + 12 + d), 0.8, t + i * 0.2, 0.28)));
          break;
        case 'infection':  // two notes a semitone apart, one per stage (0..3), detuned
          at((t) => {
            const base = tonic + 3 + arg * 2;
            bell.triggerAttackRelease([midiToNote(base), midiToNote(base + 1)], 1.4, t, 0.22);
          });
          break;
        case 'fanfare':  // a two-bar horn-like call up the chord; a higher rank (arg) adds a note
          at((t) => [0, 4, 7, 12].slice(0, 3 + Math.min(1, arg)).forEach((d, i) => tone.triggerAttackRelease(midiToNote(tonic + d), 0.9, t + i * 0.45, 0.32)));
          break;
        case 'hammer':   // a hammer on a bell, two bars: a knock and a short ring
          at((t) => { thud.triggerAttackRelease('G2', 0.12, t, 0.5); bell.triggerAttackRelease([midiToNote(tonic + 12)], 2, t + 0.05, 0.25); });
          break;
        case 'chime':    // a single lantern chime
          at((t) => bell.triggerAttackRelease([midiToNote(tonic + 24)], 1.8, t, 0.22));
          break;
        case 'achievement': // a one-second arpeggio in key
          at((t) => [0, 4, 7, 12].forEach((d, i) => tone.triggerAttackRelease(midiToNote(tonic + 12 + d), 0.5, t + i * 0.12, 0.28)));
          break;
        case 'bell':   // the chapel bell: inharmonic partials; resolves to major when survived, minor when not
          at((t) => {
            const f0 = midi(tonic + 12);
            [1, 2, 2.76, 4.07].forEach((r, i) => {
              partials[i].triggerAttackRelease(f0 * r, 6, t, 0.5);
            });
            tone.triggerAttackRelease([midiToNote(tonic + 12 + (arg ? 4 : 3))], 3, t + 3, 0.2);
          });
          break;
      }
    };
  }
}

// The Lantern Hymn (DayG's title and room menu): a slow major hymn, the same key family as the score, one song with no layers.
// It is a scene change, so the game starts it with playSong when a menu opens and the score comes back when it closes.
export function buildDaygTitle(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void {
  const rng = mulberry32(seed);
  const tonic = 53 + Math.floor(rng() * 8);
  const bpm = 66;
  T.getTransport().bpm.value = bpm;
  const BEAT = 60 / bpm;
  const BAR = 4 * BEAT;
  const HYMN_BARS = 4;
  const LOOP = HYMN_BARS * BAR;
  const FORM = [0, 3, 4, 0];                 // I IV V I
  const MOTIF = [0, 2, 4, 5, 4, 2, 1, 0];    // scale degrees; each bar plays two half notes from it

  const fx = createFx(T, keep, out, { reverbDecay: 7, echoTime: '4n', echoFeedback: 0.2 });
  const send = (amount: number, to: ToneNS.InputNode) => keep(new T.Gain(amount)).connect(to);

  const padLp = keep(new T.Filter(1200, 'lowpass')).fan(out, send(0.5, fx.rev));
  const pad = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'fattriangle', count: 2, spread: 8 },
    envelope: { attack: 1.5, decay: 0.5, sustain: 0.8, release: 3.5 },
  })).connect(padLp);
  pad.maxPolyphony = 8;
  pad.volume.value = -18;

  const melodyLp = keep(new T.Filter(4000, 'lowpass')).fan(out, send(0.4, fx.rev));
  const melody = keep(new T.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.03, decay: 1.2, sustain: 0.2, release: 1.6 } }))
    .connect(melodyLp);
  melody.volume.value = -11;

  const bass = keep(new T.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.1, decay: 0.8, sustain: 0.6, release: 1.5 } }))
    .connect(keep(new T.Filter(300, 'lowpass')).connect(out));
  bass.volume.value = -12;

  const padEv: Ev<{ notes: string[]; dur: number }>[] = [];
  const melEv: Ev<{ note: string; dur: number }>[] = [];
  const bassEv: Ev<{ note: string; dur: number }>[] = [];
  for (let bar = 0; bar < HYMN_BARS; bar++) {
    const deg = FORM[bar];
    const chord = chordTones(MAJOR, deg, 3).map((t) => tonic + 12 + t);
    padEv.push([bar * BAR, { notes: chord.map((n) => midiToNote(n - 12)), dur: BAR * 0.97 }]);
    bassEv.push([bar * BAR, { note: midiToNote(tonic + MAJOR[deg] - 12), dur: BAR * 0.9 }]);
    for (let half = 0; half < 2; half++) {
      const d = MOTIF[(bar * 2 + half) % MOTIF.length];
      const note = tonic + 12 + MAJOR[d % 7] + 12 * Math.floor(d / 7);
      melEv.push([bar * BAR + half * 2 * BEAT, { note: midiToNote(note), dur: 1.9 * BEAT }]);
    }
  }

  const schedule = <V>(events: Ev<V>[], fn: (time: number, v: V) => void): void => {
    const part = keep(new T.Part<Ev<V>>((time, v) => {
      try { fn(time, v); } catch { /* skip this note */ }
    }, events));
    part.loop = true;
    part.loopEnd = LOOP;
    part.start(0);
  };
  schedule(padEv, (time, e) => pad.triggerAttackRelease(e.notes, e.dur, time, 0.4));
  schedule(melEv, (time, e) => melody.triggerAttackRelease(e.note, e.dur, time, 0.45));
  schedule(bassEv, (time, e) => bass.triggerAttackRelease(e.note, e.dur, time, 0.6));
}
