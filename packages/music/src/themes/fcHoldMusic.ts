// Hold Music (Nothing Left to Collect): smooth bossa-lounge office muzak, polite and a little too
// pleased with itself. Plays in reception, on Floor 1 and (muffled, by the game) on every lift ride.
// Generated in code with Tone.js.
//
// - 96 bpm, D major (tonic D3), 16 bars looping in 4/4 with a bossa feel.
// - A: ii7 V7 Imaj7 vi7 twice, B: IVmaj7 iii7 ii7 V7 twice, voice-led.
// - Rhodes-ish FM comp on the bossa rhythm, nylon pluck bass (root, fifth, root, approach),
//   a lazy flute/vibes tune (call and answer every two bars), rim clave (3-2 son), brushes,
//   a whisper of kick and a barely-there shaker.
// - Everything is generated once from mulberry32(seed) and replayed every loop.
// - pickup(): a vibraphone climbing the D major pentatonic from D5.
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '../engine';
import { createFx } from '../mix';
import { chordTones, midiToNote, mulberry32, MODES, voiceLead } from '../theory';
import type { FcMusicHooks, FcMusicOptions } from './fcShared';

const MAJOR = MODES.ionian;
const PENTA = [0, 2, 4, 7, 9]; // major pentatonic, from the tonic
const PROG_A = [1, 4, 0, 5]; // ii7 V7 Imaj7 vi7
const PROG_B = [3, 2, 1, 4]; // IVmaj7 iii7 ii7 V7
const FORM = [PROG_A, PROG_A, PROG_B, PROG_B];
const TOTAL_BARS = FORM.length * 4;
const TONIC = 50; // D3
const BPM = 96;
// 3-2 son clave over two bars, in eighths (16 per two bars).
const CLAVE = [0, 3, 6, 10, 12];

type Ev<V> = [number, V];
interface NoteEv { note: string; dur: number; vel: number }

const degreeAt = (bar: number): number => FORM[Math.floor(bar / 4) % FORM.length][bar % 4];

/** Pull a MIDI note into [lo, lo + 12). */
const into = (m: number, lo: number): number => {
  let n = m;
  while (n >= lo + 12) n -= 12;
  while (n < lo) n += 12;
  return n;
};

export function buildFcHoldMusic(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number, opts: FcMusicOptions = {}): FcMusicHooks {
  void opts; // intensity is not used by this track
  const rng = mulberry32(seed);
  T.getTransport().bpm.value = BPM;
  const BAR = 240 / BPM;
  const EIGHTH = BAR / 8;
  const LOOP = TOTAL_BARS * BAR;

  // ----- events -----
  const compEv: Ev<{ notes: string[]; dur: number; vel: number }>[] = [];
  const bassEv: Ev<NoteEv>[] = [];
  const melEv: Ev<NoteEv>[] = [];
  const rimEv: Ev<{ vel: number }>[] = [];
  const brushEv: Ev<{ vel: number }>[] = [];
  const kickEv: Ev<{ vel: number }>[] = [];
  const shakeEv: Ev<{ vel: number }>[] = [];

  // Melody rhythms for one bar, in eighths: [start, length]. Quarters and halves with rests.
  const CALL_RHYTHMS: [number, number][][] = [
    [[0, 2], [2, 2], [4, 4]],
    [[0, 3], [4, 2], [6, 2]],
    [[0, 2], [2, 4], [6, 2]],
    [[1, 2], [3, 2], [5, 3]],
  ];
  const TAIL_RHYTHMS: [number, number][][] = [
    [[0, 4]],
    [[0, 2], [2, 4]],
    [[0, 6]],
    [[2, 4]],
  ];
  let lastMel = 66; // F#4, kept stepwise so the tune is singable

  let prev: number[] | null = null;
  for (let bar = 0; bar < TOTAL_BARS; bar++) {
    const deg = degreeAt(bar);
    const nextDeg = degreeAt((bar + 1) % TOTAL_BARS);
    const abs = chordTones(MAJOR, deg, 4).map((t) => TONIC + t);
    const notes = voiceLead(abs, 64, prev);
    prev = notes;
    const sorted = [...notes].sort((a, b) => a - b);
    const t0 = bar * BAR;

    // Rhodes comp: the bossa rhythm, eighths 0, 3, 6 (+ a push on 7 every other bar).
    const slots = bar % 2 === 1 ? [0, 3, 6, 7] : [0, 3, 6];
    for (const s of slots) {
      const len = s === 7 ? 1 : s === 6 ? 1.5 : 2;
      compEv.push([t0 + s * EIGHTH, {
        notes: sorted.map(midiToNote),
        dur: EIGHTH * len * 0.9,
        vel: (s === 0 ? 0.5 : 0.38) + 0.08 * rng(),
      }]);
    }

    // Nylon bass: root on 1, fifth on the "and" of 2, root on 3, approach on 4.
    const root = into(TONIC + MAJOR[deg], 38); // D2..C#3
    const fifth = into(TONIC + MAJOR[(deg + 4) % 7], root); // diatonic fifth above the root
    const nextRoot = into(TONIC + MAJOR[nextDeg], 38);
    const above = rng() < 0.5;
    const approachPc = TONIC + MAJOR[(nextDeg + (above ? 1 : 6)) % 7];
    let approach = into(approachPc, nextRoot - 6);
    if (approach === nextRoot) approach += above ? 2 : -2;
    bassEv.push([t0, { note: midiToNote(root), dur: EIGHTH * 2.6, vel: 0.62 }]);
    bassEv.push([t0 + 3 * EIGHTH, { note: midiToNote(fifth), dur: EIGHTH * 0.9, vel: 0.48 }]);
    bassEv.push([t0 + 4 * EIGHTH, { note: midiToNote(root), dur: EIGHTH * 1.8, vel: 0.55 }]);
    bassEv.push([t0 + 6 * EIGHTH, { note: midiToNote(approach), dur: EIGHTH * 1.8, vel: 0.45 }]);

    // Melody: a two-bar call, answered by the next two bars. Pentatonic + this chord's 7th.
    const seventhPc = ((MAJOR[(deg + 6) % 7]) % 12 + 12) % 12;
    const pcs = new Set([...PENTA, seventhPc]);
    const pool: number[] = [];
    for (let m = 62; m <= 79; m++) if (pcs.has(((m - TONIC) % 12 + 12) % 12)) pool.push(m);
    const second = bar % 2 === 1; // second bar of the two-bar phrase: settle
    const answer = Math.floor(bar / 2) % 2 === 1;
    const rhythms = second ? TAIL_RHYTHMS : CALL_RHYTHMS;
    const rhythm = rhythms[Math.floor(rng() * rhythms.length)];
    let idx = pool.reduce((best, m, i) => (Math.abs(m - lastMel) < Math.abs(pool[best] - lastMel) ? i : best), 0);
    rhythm.forEach(([pos, len], i) => {
      if (!second && i > 0 && rng() < 0.15) return; // breathe
      // Calls lean upward, answers lean back down.
      const r = rng();
      const dir = r < 0.6 ? (answer ? -1 : 1) : r < 0.85 ? (answer ? 1 : -1) : 0;
      const jump = rng() < 0.15 ? 2 : 1;
      idx = Math.max(0, Math.min(pool.length - 1, idx + dir * jump));
      // Land the end of an answer on a chord tone.
      if (second && answer && i === rhythm.length - 1) {
        const target = pool.reduce((b, m, k) => (sorted.some((c) => (c - m) % 12 === 0) && Math.abs(k - idx) < Math.abs(b - idx) ? k : b), idx);
        idx = target;
      }
      lastMel = pool[idx];
      melEv.push([t0 + pos * EIGHTH, {
        note: midiToNote(pool[idx]),
        dur: Math.min(len * EIGHTH * 0.92, BAR - pos * EIGHTH - 0.03),
        vel: 0.42 + 0.12 * rng(),
      }]);
    });

    // Kit.
    const half = bar % 2;
    for (const c of CLAVE) {
      const s = c - half * 8;
      if (s >= 0 && s < 8) rimEv.push([t0 + s * EIGHTH, { vel: 0.5 + 0.1 * rng() }]);
    }
    for (let q = 0; q < 4; q++) brushEv.push([t0 + q * 2 * EIGHTH, { vel: (q % 2 === 0 ? 0.45 : 0.6) + 0.1 * rng() }]);
    kickEv.push([t0, { vel: 0.55 }]);
    kickEv.push([t0 + 3 * EIGHTH, { vel: 0.4 }]);
    for (let s = 1; s < 8; s += 2) shakeEv.push([t0 + s * EIGHTH, { vel: 0.3 + 0.1 * rng() }]);
  }

  // ----- instruments -----
  const fx = createFx(T, keep, out, { reverbDecay: 2.8, echoTime: '8n.', echoFeedback: 0.22, snareSend: 0 });
  const send = (amount: number, to: ToneNS.InputNode) => keep(new T.Gain(amount)).connect(to);

  // Rhodes-like comp: soft bell FM, high-passed at 220 Hz, a touch of reverb.
  const compHp = keep(new T.Filter(220, 'highpass'));
  const compLp = keep(new T.Filter(3200, 'lowpass')).fan(out, send(0.25, fx.rev));
  compHp.connect(compLp);
  const comp = keep(new T.PolySynth(T.FMSynth, {
    harmonicity: 3, modulationIndex: 2,
    oscillator: { type: 'sine' }, modulation: { type: 'sine' },
    envelope: { attack: 0.004, decay: 0.5, sustain: 0.15, release: 0.6 },
    modulationEnvelope: { attack: 0.002, decay: 0.25, sustain: 0.05, release: 0.3 },
  })).connect(compHp);
  comp.maxPolyphony = 12;
  comp.volume.value = -17;

  // Nylon pluck bass: triangle, quick decay, low-passed, dry.
  const bassLp = keep(new T.Filter(600, 'lowpass')).connect(out);
  const bass = keep(new T.MonoSynth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.004, decay: 0.35, sustain: 0.2, release: 0.25 },
    filterEnvelope: { attack: 0.003, decay: 0.15, sustain: 0.3, release: 0.2, baseFrequency: 200, octaves: 1.5 },
  })).connect(bassLp);
  bass.volume.value = -12;

  // Melody: soft flute/vibes, a little reverb and delay.
  const melHp = keep(new T.Filter(250, 'highpass'));
  const melLp = keep(new T.Filter(4000, 'lowpass')).fan(out, send(0.3, fx.rev), send(0.2, fx.delay));
  melHp.connect(melLp);
  const mel = keep(new T.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.03, decay: 0.4, sustain: 0.55, release: 0.7 },
  })).connect(melHp);
  mel.volume.value = -13;

  // Rim click: high-passed white noise, very short.
  const rimHp = keep(new T.Filter(2200, 'highpass')).connect(out);
  const rim = keep(new T.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 },
  })).connect(rimHp);
  rim.volume.value = -24;

  // Brush: pink noise, slow attack.
  const brushHp = keep(new T.Filter(1800, 'highpass')).connect(out);
  const brush = keep(new T.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.06, decay: 0.18, sustain: 0, release: 0.12 },
  })).connect(brushHp);
  brush.volume.value = -32;

  // Kick: a very quiet thump.
  const kickLp = keep(new T.Filter(180, 'lowpass')).connect(out);
  const kick = keep(new T.MembraneSynth({
    pitchDecay: 0.03, octaves: 3,
    envelope: { attack: 0.002, decay: 0.25, sustain: 0, release: 0.1 },
  })).connect(kickLp);
  kick.volume.value = -22;

  // Shaker: barely there.
  const shHp = keep(new T.Filter(5500, 'highpass')).connect(out);
  const shaker = keep(new T.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.01, decay: 0.05, sustain: 0, release: 0.03 },
  })).connect(shHp);
  shaker.volume.value = -38;

  // Pickup vibraphone: its own voice, out of the song's loop.
  const vibeHp = keep(new T.Filter(300, 'highpass'));
  const vibeLp = keep(new T.Filter(5000, 'lowpass')).fan(out, send(0.3, fx.rev));
  vibeHp.connect(vibeLp);
  const vibe = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.003, decay: 0.6, sustain: 0, release: 0.4 },
  })).connect(vibeHp);
  vibe.maxPolyphony = 6;
  vibe.volume.value = -12;

  // ----- schedule: one looping Part per voice, in seconds -----
  const schedule = <V>(events: Ev<V>[], fn: (time: number, v: V) => void): void => {
    const part = keep(new T.Part<Ev<V>>((time, v) => {
      try { fn(time, v); } catch { /* skip this note */ }
    }, events));
    part.loop = true;
    part.loopEnd = LOOP;
    part.start(0);
  };
  const mono = (): ((t: number) => number) => {
    let last = -1;
    return (t) => (last = t > last ? t : last + 0.001);
  };
  const bassT = mono();
  const melT = mono();
  const rimT = mono();
  const brushT = mono();
  const kickT = mono();
  const shakeT = mono();
  schedule(compEv, (time, e) => comp.triggerAttackRelease(e.notes, e.dur, time, e.vel));
  schedule(bassEv, (time, e) => bass.triggerAttackRelease(e.note, e.dur, bassT(time), e.vel));
  schedule(melEv, (time, e) => mel.triggerAttackRelease(e.note, e.dur, melT(time), e.vel));
  schedule(rimEv, (time, e) => rim.triggerAttackRelease(0.03, rimT(time), e.vel));
  schedule(brushEv, (time, e) => brush.triggerAttackRelease(0.2, brushT(time), e.vel));
  schedule(kickEv, (time, e) => kick.triggerAttackRelease('D1', 0.2, kickT(time), e.vel));
  schedule(shakeEv, (time, e) => shaker.triggerAttackRelease(0.05, shakeT(time), e.vel));

  // ----- pickup hook -----
  const PICKUP = [74, 76, 78, 81, 83, 86, 88, 90]; // D5 E5 F#5 A5 B5 D6 E6 F#6
  let step = 0;
  let lastAt = -Infinity;
  return {
    pickup() {
      try {
        const now = T.now();
        if (now - lastAt < 0.06) return;
        if (now - lastAt > 1.2) step = 0;
        lastAt = now;
        vibe.triggerAttackRelease(midiToNote(PICKUP[step]), 0.5, now, 0.55);
        step = (step + 1) % PICKUP.length;
      } catch { /* a missed pickup note is fine */ }
    },
  };
}
