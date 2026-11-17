// Synthesized WebAudio sound effects for classic 3-bar slot machines.
// Respects the shared @arcade/volume 'sounds' channel and #mute hash.
import { volume } from '../volume';

interface AudioEngine {
  ctx: AudioContext;
  master: GainNode;
}

let engine: AudioEngine | null = null;

function isMuted(): boolean {
  try {
    return typeof location !== 'undefined' && location.hash.includes('mute');
  } catch {
    return false;
  }
}

function getEngine(): AudioEngine | null {
  if (isMuted() || typeof AudioContext === 'undefined') return null;
  if (!engine) {
    try {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.connect(ctx.destination);
      engine = { ctx, master };
    } catch {
      return null;
    }
  }
  if (engine.ctx.state === 'suspended') {
    engine.ctx.resume().catch(() => {});
  }
  engine.master.gain.value = volume.effective('sounds');
  return engine;
}

function tone(
  e: AudioEngine,
  freq: number,
  endFreq: number,
  dur: number,
  type: OscillatorType,
  gainPeak: number,
  delay = 0,
): void {
  const t = e.ctx.currentTime + delay;
  const osc = e.ctx.createOscillator();
  const g = e.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gainPeak, t + Math.min(0.012, dur * 0.25));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(e.master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noiseBurst(e: AudioEngine, dur: number, filterHz: number, q: number, gainPeak: number, delay = 0): void {
  const t = e.ctx.currentTime + delay;
  const len = Math.max(1, Math.floor(e.ctx.sampleRate * dur));
  const buf = e.ctx.createBuffer(1, len, e.ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  const src = e.ctx.createBufferSource();
  src.buffer = buf;
  const filt = e.ctx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.setValueAtTime(filterHz, t);
  filt.Q.value = q;
  const g = e.ctx.createGain();
  g.gain.setValueAtTime(gainPeak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filt);
  filt.connect(g);
  g.connect(e.master);
  src.start(t);
}

function coinClink(e: AudioEngine, delay = 0, gain = 0.14): void {
  tone(e, 2400, 2360, 0.09, 'sine', gain, delay);
  tone(e, 3680, 3620, 0.07, 'triangle', gain * 0.6, delay + 0.012);
}

export const slotSfx = {
  /** Heavy mechanical arm pull + spring ratchet release. */
  leverPull(): void {
    const e = getEngine();
    if (!e) return;
    // Ratchet teeth clicks as arm pulls down
    for (let i = 0; i < 4; i++) {
      noiseBurst(e, 0.02, 1100 + i * 160, 4, 0.14, i * 0.035);
      tone(e, 260 + i * 35, 190, 0.03, 'square', 0.06, i * 0.035);
    }
    // Spring latch snap at the bottom
    tone(e, 145, 75, 0.11, 'triangle', 0.22, 0.15);
    noiseBurst(e, 0.06, 650, 2.5, 0.2, 0.15);
  },

  /** Metallic coin drop into the slot chute. */
  coinIn(): void {
    const e = getEngine();
    if (!e) return;
    coinClink(e, 0, 0.15);
    coinClink(e, 0.07, 0.11);
  },

  /** Soft mechanical click while reels are spinning. */
  reelTick(): void {
    const e = getEngine();
    if (!e) return;
    noiseBurst(e, 0.016, 1800, 5, 0.055);
    tone(e, 520, 320, 0.018, 'triangle', 0.035);
  },

  /** Heavy mechanical clunk + pitched chime as reel 0, 1, or 2 locks in. */
  reelStop(reelIndex: number, matchSoFar: boolean): void {
    const e = getEngine();
    if (!e) return;
    // Mechanical stop thud
    tone(e, 130, 52, 0.09, 'sine', 0.26);
    noiseBurst(e, 0.045, 480, 1.8, 0.22);
    // Escalating bell chime per reel
    const base = [523.25, 659.25, 783.99][reelIndex] ?? 659.25; // C5, E5, G5
    tone(e, base, base, 0.16, 'triangle', 0.14, 0.01);
    if (matchSoFar) {
      tone(e, base * 1.5, base * 1.5, 0.2, 'sine', 0.12, 0.035);
    }
  },

  /** Rising shimmer when first two reels match and the third is still spinning. */
  anticipation(): void {
    const e = getEngine();
    if (!e) return;
    const notes = [523.25, 587.33, 659.25, 783.99, 880, 987.77];
    notes.forEach((f, i) => {
      tone(e, f, f * 1.02, 0.11, 'sine', 0.08 + i * 0.01, i * 0.075);
    });
  },

  /** Classic arcade win arpeggio + coin cascade. */
  win(multiplier: number): void {
    const e = getEngine();
    if (!e) return;
    const arp = multiplier >= 10
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98]
      : [523.25, 659.25, 783.99, 1046.5];
    arp.forEach((f, i) => {
      tone(e, f, f, 0.2, 'triangle', 0.16, i * 0.07);
      tone(e, f * 2, f * 2, 0.14, 'sine', 0.06, i * 0.07);
    });
    const coins = Math.min(8, Math.max(3, Math.floor(multiplier / 2)));
    for (let i = 0; i < coins; i++) {
      coinClink(e, 0.18 + i * 0.065, 0.11);
    }
  },

  /** Big celebratory jackpot bell + brass fanfare + coin shower. */
  jackpot(): void {
    const e = getEngine();
    if (!e) return;
    const fanfare = [
      { f: 523.25, d: 0.0 },
      { f: 659.25, d: 0.09 },
      { f: 783.99, d: 0.18 },
      { f: 1046.5, d: 0.27 },
      { f: 783.99, d: 0.38 },
      { f: 1046.5, d: 0.48 },
      { f: 1318.5, d: 0.58 },
      { f: 1567.98, d: 0.72 },
    ];
    for (const n of fanfare) {
      tone(e, n.f, n.f, 0.28, 'sawtooth', 0.08, n.d);
      tone(e, n.f, n.f, 0.32, 'triangle', 0.16, n.d);
      tone(e, n.f * 2, n.f * 2, 0.22, 'sine', 0.07, n.d);
    }
    for (let i = 0; i < 14; i++) {
      coinClink(e, 0.25 + i * 0.06, 0.12);
    }
  },

  /** Subtle low settle on a non-winning spin. */
  lose(): void {
    const e = getEngine();
    if (!e) return;
    tone(e, 180, 120, 0.12, 'triangle', 0.08);
  },
};
