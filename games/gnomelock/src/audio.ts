// Procedural WebAudio SFX connected to @arcade/volume.
import { createVolumeStore } from '@arcade/volume';
import type { HeroId } from './sim/config';

export const volumeStore = createVolumeStore();

let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }
  return ctx;
}

function sfxGain(): number {
  return volumeStore.effective('sounds');
}

function tone(
  freqStart: number,
  freqEnd: number,
  durS: number,
  type: OscillatorType,
  gainVal: number,
  delayS = 0,
): void {
  const c = ensureCtx();
  const g = sfxGain() * gainVal;
  if (!c || g <= 0.001) return;
  const now = c.currentTime + delayS;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + durS);
  gain.gain.setValueAtTime(g, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durS);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + durS + 0.01);
}

function noiseBurst(durS: number, filterHz: number, gainVal: number): void {
  const c = ensureCtx();
  const g = sfxGain() * gainVal;
  if (!c || g <= 0.001) return;
  const len = Math.max(1, Math.floor(c.sampleRate * durS));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = filterHz;
  const gain = c.createGain();
  const now = c.currentTime;
  gain.gain.setValueAtTime(g, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durS);
  src.connect(filt);
  filt.connect(gain);
  gain.connect(c.destination);
  src.start(now);
}

export const sfx = {
  shoot(hero: HeroId): void {
    if (hero === 'bramble') {
      noiseBurst(0.14, 420, 0.24);
      tone(140, 48, 0.13, 'sawtooth', 0.22);
    } else if (hero === 'tansy') {
      tone(520, 220, 0.055, 'triangle', 0.12);
      noiseBurst(0.04, 1600, 0.08);
    } else if (hero === 'fernwick') {
      tone(340, 130, 0.09, 'square', 0.12);
      noiseBurst(0.06, 900, 0.1);
    } else {
      tone(780, 190, 0.14, 'sawtooth', 0.16);
      noiseBurst(0.08, 2200, 0.12);
    }
  },
  hitBody(): void {
    tone(290, 180, 0.045, 'triangle', 0.12);
  },
  orbConfirm(): void {
    tone(740, 1180, 0.11, 'sine', 0.2);
    tone(1180, 1560, 0.12, 'triangle', 0.16, 0.05);
  },
  orbDeny(): void {
    tone(420, 210, 0.11, 'sawtooth', 0.16);
    tone(620, 880, 0.1, 'sine', 0.14, 0.04);
  },
  jump(): void {
    tone(180, 360, 0.09, 'sine', 0.12);
  },
  doubleJump(): void {
    tone(280, 540, 0.11, 'triangle', 0.14);
  },
  wallJump(): void {
    noiseBurst(0.08, 950, 0.12);
    tone(260, 580, 0.12, 'sine', 0.16);
  },
  dash(): void {
    noiseBurst(0.14, 1200, 0.18);
    tone(320, 150, 0.12, 'triangle', 0.12);
  },
  dashJump(): void {
    noiseBurst(0.16, 1700, 0.2);
    tone(380, 760, 0.15, 'sine', 0.18);
  },
  slide(): void {
    noiseBurst(0.16, 650, 0.12);
  },
  flowTier3(): void {
    tone(523, 659, 0.12, 'sine', 0.16);
    tone(659, 987, 0.16, 'sine', 0.16, 0.08);
  },
  ability(): void {
    tone(240, 480, 0.16, 'sawtooth', 0.14);
  },
  relicSpawn(): void {
    tone(196, 192, 0.55, 'triangle', 0.26);
    tone(294, 290, 0.45, 'sine', 0.22, 0.05);
  },
  buy(): void {
    tone(660, 880, 0.09, 'sine', 0.15);
    tone(880, 1320, 0.11, 'sine', 0.14, 0.06);
  },
  kill(): void {
    tone(440, 220, 0.15, 'square', 0.15);
    tone(660, 880, 0.18, 'triangle', 0.16, 0.06);
  },
  win(victory: boolean): void {
    if (victory) {
      tone(523, 523, 0.14, 'triangle', 0.2, 0);
      tone(659, 659, 0.14, 'triangle', 0.2, 0.14);
      tone(784, 1046, 0.35, 'triangle', 0.24, 0.28);
    } else {
      tone(392, 370, 0.18, 'sawtooth', 0.16, 0);
      tone(349, 262, 0.4, 'sawtooth', 0.18, 0.18);
    }
  },
};
