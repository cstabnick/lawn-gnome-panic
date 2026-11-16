// src/audio.ts
import type { SfxName } from './config';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let engineGain: GainNode | null = null;
let engineOsc1: OscillatorNode | null = null;
let engineOsc2: OscillatorNode | null = null;

function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  try {
    // Fixed 48 kHz: at a 192 kHz device rate the default context does 4x the work (see packages/music/src/engine.ts).
    try { ctx = new AudioContext({ sampleRate: 48000 }); } catch { ctx = new AudioContext(); }
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
    master = null;
  }
  return ctx;
}

function tone(
  f0: number,
  f1: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  delay = 0,
): void {
  const c = ctx;
  const out = master;
  if (!c || !out) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, now + delay);
  osc.frequency.exponentialRampToValueAtTime(f1, now + delay + dur);
  gain.gain.setValueAtTime(vol, now + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
  osc.connect(gain);
  gain.connect(out);
  osc.start(now + delay);
  osc.stop(now + delay + dur);
}

function noiseBurst(vol = 0.25): void {
  const c = ctx;
  const out = master;
  if (!c || !out) return;
  if (!noiseBuffer) {
    const length = Math.floor(c.sampleRate * 0.3);
    noiseBuffer = c.createBuffer(1, length, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }
  const now = c.currentTime;
  const src = c.createBufferSource();
  const gain = c.createGain();
  src.buffer = noiseBuffer;
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  src.connect(gain);
  gain.connect(out);
  src.start(now);
  src.stop(now + 0.3);
}

/** Minimum gap between two plays of the same sound, in ms. */
const SFX_MIN_GAP_MS: Partial<Record<SfxName, number>> = {
  enemyHit: 60,
  xp: 40,
  enemyDie: 30,
  shoot: 50,
};
const sfxLastPlayed: Partial<Record<SfxName, number>> = {};

export function playSfx(name: SfxName): void {
  try {
    const c = ensureContext();
    if (!c) return;
    const gap = SFX_MIN_GAP_MS[name];
    if (gap !== undefined) {
      const now = performance.now();
      const last = sfxLastPlayed[name];
      if (last !== undefined && now - last < gap) return;
      sfxLastPlayed[name] = now;
    }
    if (c.state === 'suspended') void c.resume();
    switch (name) {
      case 'start':
        tone(330, 660, 0.15, 'square', 0.08);
        tone(495, 990, 0.15, 'square', 0.06, 0.12);
        break;
      case 'jump':
        tone(300, 600, 0.12, 'triangle', 0.12);
        break;
      case 'pickup':
        tone(880, 1320, 0.08, 'square', 0.07);
        tone(1320, 1760, 0.1, 'square', 0.05, 0.06);
        break;
      case 'hit':
        tone(180, 40, 0.5, 'sawtooth', 0.2);
        noiseBurst();
        break;
      case 'hurt':
        tone(400, 150, 0.25, 'square', 0.12);
        break;
      case 'shoot':
        tone(700, 300, 0.06, 'triangle', 0.05);
        break;
      case 'enemyHit':
        tone(220, 160, 0.05, 'square', 0.04);
        break;
      case 'enemyDie':
        tone(300, 60, 0.18, 'sawtooth', 0.08);
        noiseBurst(0.08);
        break;
      case 'xp':
        tone(1200 + Math.random() * 200, 1600, 0.05, 'sine', 0.04);
        break;
      case 'levelUp': {
        const notes = [523, 659, 784, 1047];
        const delays = [0, 0.08, 0.16, 0.24];
        notes.forEach((f1, i) => tone(f1 * 0.98, f1, 0.12, 'square', 0.07, delays[i]));
        break;
      }
      case 'bossWarning':
        tone(300, 600, 0.4, 'sawtooth', 0.1, 0);
        tone(600, 300, 0.4, 'sawtooth', 0.1, 0.4);
        tone(300, 600, 0.4, 'sawtooth', 0.1, 0.8);
        tone(600, 300, 0.4, 'sawtooth', 0.1, 1.2);
        break;
      case 'buy':
        tone(660, 990, 0.08, 'square', 0.07);
        tone(990, 1320, 0.1, 'square', 0.06, 0.07);
        break;
      case 'splash':
        tone(900, 200, 0.2, 'sine', 0.06);
        noiseBurst(0.06);
        break;
      case 'boom':
        tone(120, 30, 0.5, 'sawtooth', 0.2);
        noiseBurst(0.2);
        break;
      case 'victory':
        tone(523, 523, 0.12, 'square', 0.07, 0);
        tone(659, 659, 0.12, 'square', 0.07, 0.12);
        tone(784, 784, 0.12, 'square', 0.07, 0.24);
        tone(1047, 1047, 0.5, 'square', 0.07, 0.36);
        break;
    }
  } catch {
    // Audio must never break the game.
  }
}

/** 0 = silent, 1 = a mower is right next to the player. */
export function setEngineLevel(level: number): void {
  try {
    const lvl = Math.min(1, Math.max(0, level));
    if (!engineGain) {
      if (lvl <= 0) return;
      const c = ensureContext();
      const out = master;
      if (!c || !out) return;
      const now = c.currentTime;
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      engineGain = c.createGain();
      engineGain.gain.value = 0;
      filter.connect(engineGain);
      engineGain.connect(out);

      engineOsc1 = c.createOscillator();
      engineOsc1.type = 'sawtooth';
      engineOsc1.frequency.value = 55;
      engineOsc1.connect(filter);

      engineOsc2 = c.createOscillator();
      engineOsc2.type = 'square';
      engineOsc2.frequency.value = 56.5;
      engineOsc2.connect(filter);

      engineOsc1.start(now);
      engineOsc2.start(now);
    }
    const c = ctx;
    if (!c || !engineGain || !engineOsc1 || !engineOsc2) return;
    const now = c.currentTime;
    engineGain.gain.setTargetAtTime(lvl * lvl * 0.12, now, 0.08);
    engineOsc1.frequency.setTargetAtTime(50 + lvl * 35, now, 0.1);
    engineOsc2.frequency.setTargetAtTime(50 + lvl * 35 + 1.5, now, 0.1);
  } catch {
    // Audio must never break the game.
  }
}
