// Short synthesized WebAudio sound effects, the climbing pickup tick, and the @lawn/mutter voices.
// Nothing touches window/AudioContext until unlock() (called from the first user gesture), and every
// WebAudio call is wrapped so audio can never throw into the game.
import { createMutter, type Mutter } from '@lawn/mutter';
import { SPEAKERS } from './config';
import type { ItemKind, Sfx, SfxName, Speaker } from './types';

const MASTER = 0.5;
const PICKUP_GAP_MS = 35;
/** Major pentatonic semitone steps from C6. */
const PENTA = [0, 2, 4, 7, 9];
const C6 = 1046.5;
const C6_E6_G6 = [1046.5, 1318.5, 1568];
const SPARKLY: ReadonlySet<ItemKind> = new Set<ItemKind>(['golden-acorn', 'star', 'badge']);

export function createSfx(): Sfx {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let muted = false;
  let voice: Mutter | null = null;
  let lastPickup = -Infinity;

  function getVoice(): Mutter {
    if (!voice) voice = createMutter({ gain: () => (muted ? 0 : MASTER) });
    return voice;
  }

  function noiseBuffer(c: AudioContext): AudioBuffer {
    if (!noise) {
      noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noise;
  }

  /** One oscillator note with an attack/exponential-decay envelope. */
  function tone(type: OscillatorType, hz: number, start: number, dur: number, peak: number, dest?: AudioNode, endHz?: number): void {
    if (!ctx || !master) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(hz, start);
    if (endHz) o.frequency.exponentialRampToValueAtTime(endHz, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + Math.min(0.01, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(dest ?? master);
    o.start(start);
    o.stop(start + dur + 0.02);
  }

  /** A burst of noise through a filter; the filter is returned so callers can sweep it. */
  function noiseBurst(start: number, dur: number, peak: number, filterType: BiquadFilterType, hz: number, q = 1): BiquadFilterNode | null {
    if (!ctx || !master) return null;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.setValueAtTime(hz, start);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(f).connect(g).connect(master);
    src.start(start);
    src.stop(start + dur + 0.02);
    return f;
  }

  function playNow(name: SfxName): void {
    if (!ctx || !master) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'ui':
        tone('sine', 660, t, 0.04, 0.25);
        break;
      case 'ding':
        tone('sine', 880, t, 1.0, 0.35);
        tone('sine', 659, t + 0.35, 1.0, 0.35);
        break;
      case 'door':
        noiseBurst(t, 0.4, 0.3, 'lowpass', 900, 0.7);
        break;
      case 'toast':
        C6_E6_G6.forEach((hz, i) => tone('triangle', hz, t + i * 0.06, 0.18, 0.2));
        break;
      case 'whoosh': {
        const f = noiseBurst(t, 0.5, 0.3, 'bandpass', 400, 2);
        f?.frequency.exponentialRampToValueAtTime(3000, t + 0.5);
        break;
      }
      case 'thud':
        tone('sine', 70, t, 0.3, 0.6, undefined, 40);
        break;
      case 'denied':
        tone('square', 180, t, 0.08, 0.08);
        tone('square', 180, t + 0.12, 0.08, 0.08);
        break;
      case 'fanfare': {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2000;
        lp.connect(master);
        const notes = [523.25, 659.25, 784, 659.25, 1046.5];
        const steps = [0, 0.08, 0.16, 0.24, 0.32];
        notes.forEach((hz, i) => tone('sawtooth', hz, t + steps[i], i === notes.length - 1 ? 0.28 : 0.1, 0.15, lp));
        break;
      }
      case 'stamp':
        noiseBurst(t, 0.12, 0.35, 'lowpass', 2500, 0.7);
        tone('sine', 120, t, 0.12, 0.5);
        break;
    }
  }

  return {
    play(name) {
      try { playNow(name); } catch { /* audio never throws into the game */ }
    },
    pickup(kind, combo) {
      if (!ctx || !master) return;
      try {
        const now = performance.now();
        if (now - lastPickup < PICKUP_GAP_MS) return;
        lastPickup = now;
        const n = Math.max(0, Math.floor(combo));
        const step = n % 10;
        const semis = PENTA[step % 5] + 12 * Math.floor(step / 5);
        const hz = C6 * Math.pow(2, semis / 12);
        const t = ctx.currentTime;
        tone('triangle', hz, t, 0.05, 0.1);
        if (SPARKLY.has(kind)) tone('sine', hz * 1.5, t + 0.015, 0.05, 0.07);
      } catch { /* ignore */ }
    },
    voice(who: Speaker, text: string) {
      if (!ctx) return 0;
      try { return getVoice().say(text, SPEAKERS[who].hz); } catch { return 0; }
    },
    stopVoice() {
      try { voice?.stop(); } catch { /* ignore */ }
    },
    unlock() {
      try {
        if (!ctx) {
          const AC: typeof AudioContext | undefined = window.AudioContext
            ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (AC) {
            ctx = new AC();
            master = ctx.createGain();
            master.gain.value = muted ? 0 : MASTER;
            master.connect(ctx.destination);
          }
        }
        if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => {});
      } catch { /* ignore */ }
      try { getVoice().unlock(); } catch { /* ignore */ }
    },
    setMuted(m) {
      muted = m;
      try { if (master && ctx) master.gain.setValueAtTime(m ? 0 : MASTER, ctx.currentTime); } catch { /* ignore */ }
      if (m) { try { voice?.stop(); } catch { /* ignore */ } }
    },
  };
}
