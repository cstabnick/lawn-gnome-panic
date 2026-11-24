// Rich layered procedural WebAudio SFX connected to @arcade/volume.
import { createVolumeStore } from '@arcade/volume';
import type { AbilitySlot, HeroId } from './sim/config';

export const volumeStore = createVolumeStore();

let ctx: AudioContext | null = null;
let masterBus: GainNode | null = null;

function ensureBus(): { c: AudioContext; out: AudioNode } | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 18;
    comp.ratio.value = 6;
    comp.attack.value = 0.004;
    comp.release.value = 0.14;
    masterBus = ctx.createGain();
    masterBus.connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }
  if (!masterBus) return null;
  masterBus.gain.value = volumeStore.effective('sounds');
  return { c: ctx, out: masterBus };
}

function jitter(pct = 0.04): number {
  return 1 + (Math.random() * 2 - 1) * pct;
}

function tone(
  freqStart: number,
  freqEnd: number,
  durS: number,
  type: OscillatorType,
  gainVal: number,
  delayS = 0,
): void {
  const b = ensureBus();
  if (!b || b.c.state === 'suspended' && gainVal <= 0.001) return;
  if (!b) return;
  const g = volumeStore.effective('sounds') * gainVal;
  if (g <= 0.001) return;
  const { c, out } = b;
  const now = c.currentTime + delayS;
  const j = jitter(0.035);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, freqStart * j), now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd * j), now + durS);
  gain.gain.setValueAtTime(Math.max(0.0001, gainVal), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durS);
  osc.connect(gain);
  gain.connect(out);
  osc.start(now);
  osc.stop(now + durS + 0.015);
}

function noiseBurst(
  durS: number,
  filterHz: number,
  gainVal: number,
  filterType: BiquadFilterType = 'bandpass',
  delayS = 0,
  q = 1.4,
): void {
  const b = ensureBus();
  if (!b) return;
  if (volumeStore.effective('sounds') * gainVal <= 0.001) return;
  const { c, out } = b;
  const len = Math.max(1, Math.floor(c.sampleRate * durS));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = filterType;
  filt.frequency.value = filterHz * jitter(0.05);
  filt.Q.value = q;
  const gain = c.createGain();
  const now = c.currentTime + delayS;
  gain.gain.setValueAtTime(Math.max(0.0001, gainVal), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durS);
  src.connect(filt);
  filt.connect(gain);
  gain.connect(out);
  src.start(now);
}

export const sfx = {
  shoot(hero: HeroId, overdrive = false): void {
    if (hero === 'bramble' || hero === 'loam') {
      // Heavy pinecone blunderbuss: sub punch + wide crack + wood clack
      tone(135, 42, 0.16, 'sine', 0.34);
      noiseBurst(0.15, 460, 0.28, 'bandpass', 0, 0.9);
      tone(290, 120, 0.05, 'triangle', 0.16, 0.01);
    } else if (hero === 'tansy' || hero === 'buckshot') {
      // Snappy seed sprayer + harmonic overdrive sheen
      tone(580, 210, 0.06, 'triangle', 0.15);
      noiseBurst(0.045, 1950, 0.11, 'highpass', 0, 1.0);
      if (overdrive) {
        tone(940, 1220, 0.05, 'sawtooth', 0.08);
      }
    } else if (hero === 'fernwick' || hero === 'hookwort') {
      // Tight acorn rifle + kiln metallic ping
      tone(360, 115, 0.1, 'sawtooth', 0.16);
      noiseBurst(0.075, 1150, 0.14, 'bandpass', 0, 1.6);
      tone(1120, 740, 0.05, 'sine', 0.08, 0.01);
    } else {
      // High-velocity pea-shooter sniper crack
      tone(860, 165, 0.14, 'sawtooth', 0.2);
      noiseBurst(0.09, 2600, 0.16, 'bandpass', 0, 1.8);
      tone(1420, 620, 0.07, 'sine', 0.09, 0.02);
    }
  },
  reload(): void {
    tone(320, 220, 0.05, 'triangle', 0.12, 0);
    tone(480, 660, 0.06, 'triangle', 0.14, 0.14);
  },
  hitBody(): void {
    tone(310, 175, 0.045, 'triangle', 0.15);
    noiseBurst(0.03, 1800, 0.06, 'highpass');
  },
  lastHit(): void {
    noiseBurst(0.04, 2200, 0.14, 'bandpass');
    tone(784, 1046, 0.09, 'sine', 0.22, 0);
    tone(1175, 1568, 0.12, 'triangle', 0.18, 0.035);
    tone(1568, 2093, 0.14, 'sine', 0.12, 0.07);
  },
  orbConfirm(): void {
    tone(740, 1108, 0.1, 'sine', 0.22, 0);
    tone(1108, 1480, 0.11, 'triangle', 0.18, 0.045);
    tone(1480, 1975, 0.14, 'sine', 0.14, 0.09);
  },
  orbDeny(): void {
    tone(440, 200, 0.12, 'sawtooth', 0.18, 0);
    tone(660, 988, 0.12, 'triangle', 0.18, 0.045);
  },
  jump(): void {
    tone(175, 370, 0.09, 'sine', 0.14);
    noiseBurst(0.05, 800, 0.05, 'highpass');
  },
  doubleJump(): void {
    tone(290, 580, 0.11, 'triangle', 0.16);
    noiseBurst(0.07, 1300, 0.07, 'highpass');
  },
  wallJump(): void {
    tone(140, 85, 0.06, 'sine', 0.18);
    noiseBurst(0.08, 980, 0.14);
    tone(280, 620, 0.12, 'sine', 0.18, 0.02);
  },
  dash(): void {
    noiseBurst(0.15, 1350, 0.2, 'bandpass', 0, 1.1);
    tone(340, 140, 0.12, 'triangle', 0.14);
  },
  dashJump(): void {
    noiseBurst(0.17, 1800, 0.22, 'bandpass', 0, 1.3);
    tone(400, 840, 0.16, 'sine', 0.2);
    tone(840, 1260, 0.1, 'triangle', 0.12, 0.05);
  },
  slide(): void {
    noiseBurst(0.18, 720, 0.14, 'bandpass', 0, 0.8);
  },
  flowTier3(): void {
    tone(523, 659, 0.12, 'sine', 0.18, 0);
    tone(659, 784, 0.14, 'sine', 0.18, 0.06);
    tone(784, 1046, 0.2, 'triangle', 0.2, 0.12);
  },
  ability(hero: HeroId, slot: AbilitySlot): void {
    if (hero === 'loam' && slot === 'X') {
      // Black Hole gravity drop + cosmic shimmer
      tone(98, 28, 0.75, 'sawtooth', 0.3, 0);
      tone(196, 56, 0.65, 'sine', 0.24, 0.04);
      noiseBurst(0.55, 380, 0.18, 'lowpass', 0.05, 2.0);
      tone(660, 440, 0.45, 'triangle', 0.12, 0.12);
      return;
    }
    if (hero === 'hookwort' && slot === 'Q') {
      // Metallic hook latch + zipping reel
      tone(820, 1320, 0.08, 'square', 0.14, 0);
      noiseBurst(0.14, 1800, 0.15, 'bandpass', 0.04, 2.2);
      tone(220, 95, 0.14, 'triangle', 0.2, 0.12);
      return;
    }
    if (hero === 'buckshot') {
      // Mechanical gun rack / overdrive rev
      tone(240, 480, 0.12, 'sawtooth', 0.16, 0);
      tone(480, 720, 0.14, 'triangle', 0.14, 0.05);
      return;
    }
    if (hero === 'thistle') {
      // Crisp nature-caster chime / snap
      tone(520, 780, 0.09, 'triangle', 0.15, 0);
      if (slot === 'X') tone(780, 1170, 0.18, 'sine', 0.18, 0.06);
      return;
    }
    tone(250, 510, 0.16, 'sawtooth', 0.16);
    noiseBurst(0.1, 1100, 0.1);
  },
  towerDown(): void {
    tone(110, 38, 0.45, 'sawtooth', 0.28, 0);
    noiseBurst(0.4, 320, 0.24, 'lowpass', 0, 1.0);
    tone(330, 220, 0.25, 'triangle', 0.16, 0.08);
  },
  relicSpawn(): void {
    tone(196, 192, 0.6, 'triangle', 0.28, 0);
    tone(294, 290, 0.5, 'sine', 0.24, 0.05);
    tone(392, 390, 0.45, 'sine', 0.16, 0.1);
  },
  buy(): void {
    tone(660, 880, 0.09, 'sine', 0.16, 0);
    tone(880, 1320, 0.12, 'sine', 0.16, 0.06);
  },
  kill(): void {
    noiseBurst(0.14, 1500, 0.16);
    tone(440, 220, 0.16, 'square', 0.16, 0);
    tone(660, 990, 0.18, 'triangle', 0.18, 0.06);
  },
  win(victory: boolean): void {
    if (victory) {
      tone(523, 523, 0.15, 'triangle', 0.22, 0);
      tone(659, 659, 0.15, 'triangle', 0.22, 0.14);
      tone(784, 1046, 0.38, 'triangle', 0.26, 0.28);
    } else {
      tone(392, 370, 0.2, 'sawtooth', 0.18, 0);
      tone(349, 262, 0.45, 'sawtooth', 0.2, 0.18);
    }
  },
};
