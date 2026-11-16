// WebAudio sounds generated in code (no files).
// The AudioContext is created lazily in start(): browsers block audio until a user gesture.

export interface RaceAudio {
  /** Create/resume the AudioContext; call from a user gesture (the menu's Start click). */
  start(): void;
  /** Every frame: engine hum pitched by speed01 (0..1 of top speed); rougher when offTrack (long grass). */
  engine(speed01: number, offTrack: boolean): void;
  /** Countdown beep; final = the higher GO beep. */
  beep(final: boolean): void;
  boost(): void;
  bump(): void;
  lap(): void;
  finish(): void;
  /** Silence the engine (menu/results). */
  stopEngine(): void;
  /** Little hop (drift press). */
  hop(): void;
  /** Picked up an item box. */
  pickup(): void;
  /** Threw an acorn. */
  throwAcorn(): void;
  /** Hit by an acorn, or spun out by a background vehicle (big = the hazard). */
  hit(big: boolean): void;
}

/** Time constant for parameter smoothing (seconds). */
const SMOOTH = 0.05;
/** Near-zero value for exponential ramps (they cannot target 0). */
const TINY = 0.0001;

interface Engine {
  saw: OscillatorNode;
  square: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  lfoDepth: GainNode;
}

/** Schedule a short enveloped oscillator blip into dest; the nodes are left to garbage collection. */
function blip(
  c: AudioContext,
  dest: AudioNode,
  type: OscillatorType,
  freq: number,
  t: number,
  dur: number,
  vol: number,
): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(TINY, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(TINY, t + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** A one-second buffer of white noise, created once and reused by every noise one-shot. */
function makeNoise(c: AudioContext): AudioBuffer {
  const buf = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export function createAudio(): RaceAudio {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let eng: Engine | null = null;
  let noise: AudioBuffer | null = null;
  let muted = false;

  return {
    hop(): void {
      const c = ctx;
      if (!c || !master) return;
      const t = c.currentTime;
      // Little "boing": sine sweeping 300 -> 600 Hz over 0.08 s, gain 0.15, 0.12 s total.
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(600, t + 0.08);
      const g = c.createGain();
      g.gain.setValueAtTime(TINY, t);
      g.gain.exponentialRampToValueAtTime(0.15, t + 0.01);
      g.gain.exponentialRampToValueAtTime(TINY, t + 0.12);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + 0.14);
    },

    pickup(): void {
      const c = ctx;
      const m = master;
      if (!c || !m) return;
      const t = c.currentTime;
      // Sparkly arpeggio: triangle E6 G6 B6 E7, 0.05 s each.
      const notes = [1318.51, 1567.98, 1975.53, 2637.02];
      notes.forEach((freq, i) => {
        blip(c, m, 'triangle', freq, t + i * 0.05, 0.05, 0.25);
      });
    },

    throwAcorn(): void {
      const c = ctx;
      if (!c || !master || !noise) return;
      const t = c.currentTime;
      // "Fwip": noise through a bandpass sweeping 2000 -> 600 Hz over 0.15 s.
      const src = c.createBufferSource();
      src.buffer = noise;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(2000, t);
      bp.frequency.exponentialRampToValueAtTime(600, t + 0.15);
      const g = c.createGain();
      g.gain.setValueAtTime(TINY, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.01);
      g.gain.exponentialRampToValueAtTime(TINY, t + 0.15);
      src.connect(bp);
      bp.connect(g);
      g.connect(master);
      src.start(t);
      src.stop(t + 0.15);
    },

    hit(big: boolean): void {
      const c = ctx;
      if (!c || !master || !noise) return;
      const t = c.currentTime;
      // Cartoon bonk: square 220 -> 80 Hz over 0.2 s.
      const osc = c.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
      const og = c.createGain();
      og.gain.setValueAtTime(0.25, t);
      og.gain.exponentialRampToValueAtTime(TINY, t + 0.2);
      osc.connect(og);
      og.connect(master);
      osc.start(t);
      osc.stop(t + 0.22);
      // Noise thud on top, low-passed.
      const src = c.createBufferSource();
      src.buffer = noise;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 400;
      const ng = c.createGain();
      ng.gain.setValueAtTime(0.35, t);
      ng.gain.exponentialRampToValueAtTime(TINY, t + 0.15);
      src.connect(lp);
      lp.connect(ng);
      ng.connect(master);
      src.start(t);
      src.stop(t + 0.15);
      if (big) {
        // Slide whistle down: sine 1200 -> 300 Hz over 0.6 s.
        const w = c.createOscillator();
        w.type = 'sine';
        w.frequency.setValueAtTime(1200, t);
        w.frequency.exponentialRampToValueAtTime(300, t + 0.6);
        const wg = c.createGain();
        wg.gain.setValueAtTime(TINY, t);
        wg.gain.exponentialRampToValueAtTime(0.2, t + 0.03);
        wg.gain.exponentialRampToValueAtTime(TINY, t + 0.6);
        w.connect(wg);
        wg.connect(master);
        w.start(t);
        w.stop(t + 0.62);
      }
    },

    start(): void {
      if (typeof location !== 'undefined' && location.hash.includes('mute')) {
        muted = true;
        return;
      }
      if (muted) return;
      if (ctx) {
        void ctx.resume();
        return;
      }

      const c = new AudioContext();
      ctx = c;
      void c.resume();

      const out = c.createGain();
      out.gain.value = 0.6;
      out.connect(c.destination);
      master = out;

      // Engine: sawtooth + square an octave down, through a lowpass, into a gain.
      const gain = c.createGain();
      gain.gain.value = 0;
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      filter.connect(gain);
      gain.connect(out);

      const saw = c.createOscillator();
      saw.type = 'sawtooth';
      saw.frequency.value = 45;
      saw.connect(filter);
      saw.start();

      const square = c.createOscillator();
      square.type = 'square';
      square.frequency.value = 22.5;
      square.connect(filter);
      square.start();

      // Rough flutter off track: an 18 Hz LFO modulating the engine gain.
      const lfo = c.createOscillator();
      lfo.frequency.value = 18;
      const lfoDepth = c.createGain();
      lfoDepth.gain.value = 0;
      lfo.connect(lfoDepth);
      lfoDepth.connect(gain.gain);
      lfo.start();

      eng = { saw, square, filter, gain, lfoDepth };
      noise = makeNoise(c);
    },

    engine(speed01: number, offTrack: boolean): void {
      const c = ctx;
      const e = eng;
      if (!c || !e) return;
      const s = Math.min(1, Math.max(0, speed01));
      const t = c.currentTime;
      const f = 45 + s * 110;
      e.saw.frequency.setTargetAtTime(f, t, SMOOTH);
      e.square.frequency.setTargetAtTime(f / 2, t, SMOOTH);
      e.filter.frequency.setTargetAtTime(500 + s * 1400, t, SMOOTH);
      e.gain.gain.setTargetAtTime(0.05 + s * 0.06, t, SMOOTH);
      e.lfoDepth.gain.setTargetAtTime(offTrack ? 0.04 : 0, t, SMOOTH);
    },

    beep(final: boolean): void {
      const c = ctx;
      if (!c || !master) return;
      const t = c.currentTime;
      if (final) blip(c, master, 'sine', 990, t, 0.35, 0.3);
      else blip(c, master, 'sine', 660, t, 0.15, 0.3);
    },

    boost(): void {
      const c = ctx;
      if (!c || !master || !noise) return;
      const t = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = noise;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(400, t);
      bp.frequency.linearRampToValueAtTime(2500, t + 0.4);
      const g = c.createGain();
      g.gain.setValueAtTime(TINY, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.05);
      g.gain.exponentialRampToValueAtTime(TINY, t + 0.4);
      src.connect(bp);
      bp.connect(g);
      g.connect(master);
      src.start(t);
      src.stop(t + 0.4);
    },

    bump(): void {
      const c = ctx;
      if (!c || !master || !noise) return;
      const t = c.currentTime;
      // Thud: sine dropping 120 -> 60 Hz in 0.12 s.
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
      const g = c.createGain();
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(TINY, t + 0.12);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + 0.14);
      // A little noise on top.
      const src = c.createBufferSource();
      src.buffer = noise;
      const ng = c.createGain();
      ng.gain.setValueAtTime(0.15, t);
      ng.gain.exponentialRampToValueAtTime(TINY, t + 0.08);
      src.connect(ng);
      ng.connect(master);
      src.start(t);
      src.stop(t + 0.08);
    },

    lap(): void {
      const c = ctx;
      if (!c || !master) return;
      const t = c.currentTime;
      blip(c, master, 'sine', 660, t, 0.12, 0.3);
      blip(c, master, 'sine', 990, t + 0.14, 0.12, 0.3);
    },

    finish(): void {
      const c = ctx;
      const m = master;
      if (!c || !m) return;
      const t = c.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const last = i === notes.length - 1;
        blip(c, m, 'square', freq, t + i * 0.12, last ? 0.4 : 0.12, 0.12);
      });
    },

    stopEngine(): void {
      const c = ctx;
      const e = eng;
      if (!c || !e) return;
      const t = c.currentTime;
      e.gain.gain.setTargetAtTime(0, t, SMOOTH);
      e.lfoDepth.gain.setTargetAtTime(0, t, SMOOTH);
    },
  };
}
