// Synergy Loop (The Final Collectathon, Floors 2 and 2½, the start of Floor ∞): bouncy corporate-funk
// collectathon music that escalates into absurdity the harder the player collects.
// Generated in code with Tone.js.
//
// - F major (F3 = MIDI 53), I vi IV V one chord per bar, 8-bar phrases, 16-step sixteenth grid in 4/4.
// - Scheduled on the Transport's musical time (one T.Loop on '16n'), so the tempo ramp speeds everything up:
//   116 bpm at intensity 0, 150 at intensity 1.
// - Layers by opts.intensity(), read once per bar:
//     always   marimba ostinato + slap bass
//     >= 0.33  drum kit (kick, snare, closed hat)
//     >= 0.66  pizzicato strings, brass stabs, claps
//     >= 0.9   an over-the-top lead, and a key change up a semitone every 16 bars (up to +6, then back to 0)
// - pickup(): a bright pluck climbing the F major scale from F5 (plus the current key change).
// - Patterns and the lead tune are generated once from mulberry32(seed).
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '../engine';
import { createFx } from '../mix';
import { chordTones, degreeToMidi, midiToNote, mulberry32, MODES, voiceLead } from '../theory';
import type { FcMusicHooks, FcMusicOptions } from './fcShared';

const MAJOR = MODES.ionian;
const TONIC = 53; // F3
const PROG = [0, 5, 3, 4]; // I vi IV V
const PHRASE_BARS = 8;
const MARIMBA_STEPS = [0, 3, 6, 8, 10, 12, 14];
const BASE_BPM = 116;
const BPM_RANGE = 34;
const KEY_CHANGE_BARS = 16;
const MAX_TRANSPOSE = 6;

interface Hit { step: number; idx: number; vel: number }
interface BassHit { step: number; kind: 'root' | 'oct' | 'fifth'; len: number; vel: number }
interface LeadNote { step: number; deg: number; len: number }

export function buildFcSynergyLoop(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number, opts: FcMusicOptions = {}): FcMusicHooks {
  const rng = mulberry32(seed);
  const transport = T.getTransport();
  transport.bpm.value = BASE_BPM;

  // ----- harmony: one voiced chord per progression slot
  let prev: number[] | null = null;
  const chords = PROG.map((deg) => {
    const abs = chordTones(MAJOR, deg, 3).map((t) => TONIC + t);
    const v = voiceLead(abs, 67, prev).sort((a, b) => a - b);
    prev = v;
    return v;
  });
  const bassRoots = PROG.map((deg) => {
    let r = TONIC + MAJOR[deg] - 12;
    while (r > 45) r -= 12;
    while (r < 36) r += 12;
    return r; // F2..A2 region
  });

  // ----- patterns, generated once
  // Marimba: one bouncy shape per chord, chord-tone indices (3 = the root an octave up).
  const marimba: Hit[][] = PROG.map(() => MARIMBA_STEPS.map((step, i) => ({
    step,
    idx: i === 0 ? 0 : Math.floor(rng() * 4),
    vel: (step % 4 === 0 ? 0.75 : 0.55) + 0.1 * rng(),
  })));
  // Slap bass: syncopated root / octave / fifth, two variants (bars alternate).
  const bassPatterns: BassHit[][] = [0, 1].map(() => {
    const hits: BassHit[] = [{ step: 0, kind: 'root', len: 2, vel: 0.95 }];
    const slots = [3, 6, 8, 10, 11, 14];
    for (const step of slots) {
      if (step !== 8 && rng() < 0.35) continue;
      const r = rng();
      const kind: BassHit['kind'] = step === 8 ? 'root' : r < 0.45 ? 'oct' : r < 0.8 ? 'fifth' : 'root';
      hits.push({ step, kind, len: 1, vel: kind === 'oct' ? 0.85 : 0.75 });
    }
    hits.sort((a, b) => a.step - b.step);
    return hits;
  });
  // Lead: an 8-bar triumphant tune from the major scale, around F4..F5, mostly stepwise, landing on chord tones.
  const lead: LeadNote[][] = [];
  let deg = 7; // F4 + one octave in degrees from F3
  for (let bar = 0; bar < PHRASE_BARS; bar++) {
    const notes: LeadNote[] = [];
    const rhythm = bar % 2 === 0 ? [0, 4, 6, 8, 12] : [0, 3, 6, 10];
    const chordDegs = [0, 2, 4].map((k) => PROG[bar % 4] + k);
    rhythm.forEach((step, i) => {
      if (i === 0) {
        // Land on the nearest chord tone on the downbeat.
        let best = deg;
        let bestD = 99;
        for (const cd of chordDegs) for (const o of [7, 14]) {
          const d = Math.abs(cd + o - deg);
          if (d < bestD) { bestD = d; best = cd + o; }
        }
        deg = best;
      } else {
        const r = rng();
        deg += r < 0.35 ? 1 : r < 0.6 ? -1 : r < 0.8 ? 2 : -2;
      }
      deg = Math.min(15, Math.max(7, deg));
      const next = rhythm[i + 1] ?? 16;
      notes.push({ step, deg, len: next - step });
    });
    lead.push(notes);
  }
  // A big held finish on the tonic at the end of the phrase.
  lead[PHRASE_BARS - 1] = [{ step: 0, deg: 14, len: 6 }, { step: 6, deg: 11, len: 2 }, { step: 8, deg: 14, len: 8 }];

  // ----- instruments
  const fx = createFx(T, keep, out, { reverbDecay: 2.2, reverbHp: 300, snareSend: 0.08, echoTime: '8n.', echoFeedback: 0.28, echoLp: 3800 });
  const send = (amount: number, to: ToneNS.InputNode): ToneNS.Gain => keep(new T.Gain(amount)).connect(to);

  // Marimba: short woody FM.
  const marHp = keep(new T.Filter(180, 'highpass')).fan(out, send(0.18, fx.rev));
  const mar = keep(new T.PolySynth(T.FMSynth, {
    harmonicity: 4, modulationIndex: 2.2,
    oscillator: { type: 'sine' }, modulation: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.32, sustain: 0, release: 0.25 },
    modulationEnvelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.05 },
  })).connect(marHp);
  mar.maxPolyphony = 8;
  mar.volume.value = -10;

  // Slap bass: square through a popping filter envelope. Dry only (no low end into the FX).
  const bassLp = keep(new T.Filter(1800, 'lowpass')).connect(out);
  const bass = keep(new T.MonoSynth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.003, decay: 0.18, sustain: 0.35, release: 0.08 },
    filter: { Q: 2, type: 'lowpass', rolloff: -24 },
    filterEnvelope: { attack: 0.002, decay: 0.12, sustain: 0.2, release: 0.1, baseFrequency: 140, octaves: 3.2 },
  })).connect(bassLp);
  bass.volume.value = -11;

  // Drum kit.
  const kick = keep(new T.MembraneSynth({ pitchDecay: 0.03, octaves: 5, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.05 } })).connect(out);
  kick.volume.value = -11;
  const snareHp = keep(new T.Filter(1200, 'highpass')).fan(out, fx.snareSend);
  const snare = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.14, sustain: 0, release: 0.03 } })).connect(snareHp);
  snare.volume.value = -18;
  const hatHp = keep(new T.Filter(7000, 'highpass')).connect(out);
  const hat = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.035, sustain: 0, release: 0.01 } })).connect(hatHp);
  hat.volume.value = -27;
  const clapBp = keep(new T.Filter({ frequency: 1400, type: 'bandpass', Q: 1.4 })).fan(out, send(0.2, fx.rev));
  const clap = keep(new T.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.003, decay: 0.18, sustain: 0, release: 0.05 } })).connect(clapBp);
  clap.volume.value = -19;

  // Pizzicato strings: tiny plucks, high-passed.
  const pizzHp = keep(new T.Filter(250, 'highpass')).fan(out, send(0.3, fx.rev));
  const pizz = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.08 },
  })).connect(pizzHp);
  pizz.maxPolyphony = 8;
  pizz.volume.value = -17;

  // Brass stabs: sawtooth through a ~2.2 kHz lowpass.
  const brassLp = keep(new T.Filter({ frequency: 2200, type: 'lowpass', rolloff: -12 })).fan(out, send(0.25, fx.rev));
  const brassHp = keep(new T.Filter(220, 'highpass')).connect(brassLp);
  const brass = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'fatsawtooth', count: 2, spread: 16 },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.12 },
  })).connect(brassHp);
  brass.maxPolyphony = 8;
  brass.volume.value = -17;

  // Lead: detuned fat saw, lowpassed, with delay. Over the top on purpose.
  const leadLp = keep(new T.Filter({ frequency: 3200, type: 'lowpass', rolloff: -12 })).fan(out, send(0.3, fx.delay), send(0.2, fx.rev));
  const leadHp = keep(new T.Filter(240, 'highpass')).connect(leadLp);
  const leadSyn = keep(new T.Synth({
    oscillator: { type: 'fatsawtooth', count: 3, spread: 28 },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.15 },
  })).connect(leadHp);
  leadSyn.volume.value = -16;

  // Pickup pluck: bright triangle, 0.25 s decay.
  const pickHp = keep(new T.Filter(300, 'highpass')).fan(out, send(0.25, fx.rev));
  const pick = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.1 },
  })).connect(pickHp);
  pick.maxPolyphony = 6;
  pick.volume.value = -12;

  // ----- the sequencer
  const mono = (): ((t: number) => number) => {
    let last = -1;
    return (t) => (last = t > last ? t : last + 0.001);
  };
  const bassT = mono();
  const kickT = mono();
  const snareT = mono();
  const hatT = mono();
  const clapT = mono();
  const leadT = mono();
  const play = (fn: () => void): void => {
    try { fn(); } catch { /* skip this note */ }
  };
  const n = (midi: number): string => midiToNote(midi);

  let step = 0;
  let x = 0;
  let transpose = 0;
  let fullBars = 0; // bars played at >= 0.9, for the key changes
  let s16 = 60 / BASE_BPM / 4;

  keep(new T.Loop((time) => {
    const bar = Math.floor(step / 16);
    const s = step % 16;
    step++;

    if (s === 0) {
      x = Math.min(1, Math.max(0, opts.intensity?.() ?? 0));
      // Ramp shorter than one bar (1.6 s at 150 bpm): overlapping ramps crash Tone's tick scheduler.
      play(() => transport.bpm.rampTo(BASE_BPM + BPM_RANGE * x, 1));
      const bpmNow = transport.bpm.value;
      s16 = 60 / (Number.isFinite(bpmNow) && bpmNow > 20 ? bpmNow : BASE_BPM) / 4;
      if (x >= 0.9) {
        if (fullBars > 0 && fullBars % KEY_CHANGE_BARS === 0) transpose = transpose >= MAX_TRANSPOSE ? 0 : transpose + 1;
        fullBars++;
      } else if (bar % PHRASE_BARS === 0) {
        // Calmer again: settle back into F at the next phrase.
        transpose = 0;
        fullBars = 0;
      }
    }

    const slot = bar % 4;
    const chord = chords[slot].map((m) => m + transpose);
    const root = bassRoots[slot] + transpose;
    const drums = x >= 0.33;
    const strings = x >= 0.66;
    const absurd = x >= 0.9;

    // Marimba ostinato.
    for (const h of marimba[slot]) {
      if (h.step !== s) continue;
      const m = h.idx === 3 ? chord[0] + 12 : chord[h.idx];
      play(() => mar.triggerAttackRelease(n(m), s16 * 1.6, time, h.vel));
    }

    // Slap bass.
    for (const h of bassPatterns[bar % 2]) {
      if (h.step !== s) continue;
      const m = h.kind === 'oct' ? root + 12 : h.kind === 'fifth' ? root + 7 : root;
      play(() => bass.triggerAttackRelease(n(m), s16 * h.len * 0.85, bassT(time), h.vel));
    }

    if (drums) {
      if (s === 0 || s === 7 || s === 8) play(() => kick.triggerAttackRelease('F1', s16 * 1.5, kickT(time), s === 7 ? 0.65 : 0.95));
      if (s === 4 || s === 12) play(() => snare.triggerAttackRelease(s16, snareT(time), 0.8));
      if (s % 2 === 0) play(() => hat.triggerAttackRelease(s16 * 0.4, hatT(time), s % 4 === 0 ? 0.5 : 0.75));
    }

    if (strings) {
      if (s === 2 || s === 10) play(() => pizz.triggerAttackRelease(chord.map((m) => n(m + 12)), s16 * 0.8, time, 0.6));
      if (s === 4 || s === 12) play(() => clap.triggerAttackRelease(s16 * 1.2, clapT(time), 0.75));
      if (bar % 2 === 1 && s === 14) play(() => brass.triggerAttackRelease(chord.map(n), s16 * 1.8, time, 0.8));
    }

    if (absurd) {
      for (const ln of lead[bar % PHRASE_BARS]) {
        if (ln.step !== s) continue;
        const m = degreeToMidi(TONIC, MAJOR, ln.deg) + transpose;
        play(() => leadSyn.triggerAttackRelease(n(m), s16 * ln.len * 0.9, leadT(time), 0.75));
      }
    }
  }, '16n')).start(0);

  // ----- the pickup combo
  let pickIdx = 0;
  let lastPick = -Infinity;
  return {
    pickup(): void {
      try {
        const now = T.now();
        if (now - lastPick < 0.05) return;
        if (now - lastPick > 1.2) pickIdx = 0;
        lastPick = now;
        const m = degreeToMidi(TONIC + 24, MAJOR, pickIdx % 8) + transpose; // F5 upward
        pickIdx = (pickIdx + 1) % 8;
        pick.triggerAttackRelease(n(m), 0.25, now, 0.8);
      } catch {
        // Music must never break the game.
      }
    },
  };
}
