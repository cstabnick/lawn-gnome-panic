// Tiny Web Audio synth for UI and life sounds. No files.
import type { SfxId } from './types';

export interface Sfx {
  /** Browsers need a user gesture first: call on the first pointerdown. */
  unlock(): void;
  play(id: SfxId): void;
  setMuted(m: boolean): void;
  readonly muted: boolean;
}

const MUTED_KEY = 'snigms.muted';

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(m: boolean): void {
  try {
    localStorage.setItem(MUTED_KEY, m ? '1' : '0');
  } catch {
    // Storage blocked: the setting lasts for this page only.
  }
}

/** A short envelope: quick attack to peak, exponential decay to silence at t0 + dur. */
function envelope(c: AudioContext, t0: number, dur: number, peak: number, attack = 0.005): GainNode {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  return g;
}

function tone(
  c: AudioContext,
  out: AudioNode,
  t0: number,
  dur: number,
  peak: number,
  type: OscillatorType,
  f0: number,
  f1: number = f0,
  attack?: number,
): void {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  const g = envelope(c, t0, dur, peak, attack);
  o.connect(g);
  g.connect(out);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(
  c: AudioContext,
  out: AudioNode,
  buf: AudioBuffer,
  t0: number,
  dur: number,
  peak: number,
  filter: BiquadFilterType,
  f0: number,
  f1: number = f0,
  q = 1,
  attack?: number,
): void {
  const src = c.createBufferSource();
  src.buffer = buf;
  const bq = c.createBiquadFilter();
  bq.type = filter;
  bq.Q.value = q;
  bq.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) bq.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  const g = envelope(c, t0, dur, peak, attack);
  src.connect(bq);
  bq.connect(g);
  g.connect(out);
  src.start(t0, Math.random() * 0.5, dur);
  src.stop(t0 + dur + 0.02);
}

type Synth = (c: AudioContext, out: AudioNode, buf: AudioBuffer, t: number) => void;

const SOUNDS: Record<SfxId, Synth> = {
  // Tick of a button.
  click: (c, out, _b, t) => tone(c, out, t, 0.04, 0.12, 'sine', 1800, 1500),
  // Wooden thunk of a placed item.
  place: (c, out, b, t) => {
    tone(c, out, t, 0.12, 0.2, 'triangle', 220, 110);
    noise(c, out, b, t, 0.05, 0.08, 'lowpass', 900);
  },
  // Two rising pings: a sale.
  sell: (c, out, _b, t) => {
    tone(c, out, t, 0.12, 0.15, 'sine', 523, 659);
    tone(c, out, t + 0.09, 0.16, 0.15, 'sine', 784, 988);
  },
  // Deposit into the purse: higher, brighter pings.
  coin: (c, out, _b, t) => {
    tone(c, out, t, 0.1, 0.12, 'triangle', 1319);
    tone(c, out, t + 0.06, 0.18, 0.12, 'triangle', 1760, 2093);
  },
  // Low buzz for a refusal.
  deny: (c, out, _b, t) => tone(c, out, t, 0.25, 0.12, 'sawtooth', 140, 110, 0.02),
  // Scrape then thud of a wall.
  wall: (c, out, b, t) => {
    noise(c, out, b, t, 0.18, 0.1, 'bandpass', 400, 200, 2);
    tone(c, out, t + 0.1, 0.15, 0.18, 'sine', 90, 60);
  },
  // Filtered noise sweep of a flush.
  flush: (c, out, b, t) => noise(c, out, b, t, 0.5, 0.14, 'bandpass', 300, 2500, 1.5, 0.05),
  // Quick noise burst of water.
  splash: (c, out, b, t) => noise(c, out, b, t, 0.25, 0.18, 'bandpass', 1200, 900, 0.8, 0.003),
  // Slow falling tone of a yawn.
  yawn: (c, out, _b, t) => tone(c, out, t, 0.55, 0.15, 'sine', 420, 180, 0.15),
  // Bell: a tone with a soft octave above.
  ding: (c, out, _b, t) => {
    tone(c, out, t, 0.5, 0.15, 'sine', 1047);
    tone(c, out, t, 0.35, 0.05, 'sine', 2093);
  },
  // Two knocks on a door.
  door: (c, out, _b, t) => {
    tone(c, out, t, 0.09, 0.18, 'sine', 160, 80);
    tone(c, out, t + 0.18, 0.09, 0.18, 'sine', 160, 80);
  },
};

type AudioWindow = { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };

export function createSfx(): Sfx {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noiseBuf: AudioBuffer | null = null;
  let muted = readMuted();

  return {
    unlock() {
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        return;
      }
      try {
        const w = window as unknown as AudioWindow;
        const Ctor = w.AudioContext ?? w.webkitAudioContext;
        if (!Ctor) return;
        const c = new Ctor();
        const m = c.createGain();
        m.gain.value = 1;
        m.connect(c.destination);
        const b = c.createBuffer(1, c.sampleRate, c.sampleRate);
        const data = b.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        ctx = c;
        master = m;
        noiseBuf = b;
        if (c.state === 'suspended') c.resume().catch(() => {});
      } catch {
        ctx = null;
      }
    },

    play(id: SfxId) {
      if (!ctx || !master || !noiseBuf || muted || ctx.state !== 'running') return;
      const synth = SOUNDS[id];
      if (!synth) return;
      try {
        synth(ctx, master, noiseBuf, ctx.currentTime + 0.01);
      } catch {
        // Audio must never break the game.
      }
    },

    setMuted(m: boolean) {
      muted = m;
      writeMuted(m);
    },

    get muted() {
      return muted;
    },
  };
}
