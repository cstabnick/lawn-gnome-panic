import type { VolumeStore } from '@arcade/volume';

export type GsrAreaId =
  | 'velvet-keys'
  | 'bongo-basin'
  | 'chrome-kiln'
  | 'neon-birdbath'
  | 'mulch-alley'
  | 'tupperware-mall'
  | 'hoa-citadel'
  | 'subsoil-relay'
  | 'zero-hz-zenith';

export interface JingleNote {
  freq: number;
  dur: number;
  delay: number;
  type: OscillatorType;
  gain: number;
  slideTo?: number;
}

export interface JingleSpec {
  areaId: GsrAreaId;
  title: string;
  bpm: number;
  keyMode: string;
  notes: readonly JingleNote[];
}

export const AREA_JINGLES: Record<GsrAreaId, JingleSpec> = {
  'velvet-keys': {
    areaId: 'velvet-keys',
    title: 'Ivory Syndicate Turnaround',
    bpm: 162,
    keyMode: 'D Dorian',
    notes: [
      { freq: 293.66, dur: 0.16, delay: 0.0, type: 'triangle', gain: 0.18 }, // D4
      { freq: 349.23, dur: 0.16, delay: 0.11, type: 'triangle', gain: 0.18 }, // F4
      { freq: 440.0, dur: 0.16, delay: 0.22, type: 'triangle', gain: 0.2 }, // A4
      { freq: 523.25, dur: 0.18, delay: 0.34, type: 'sine', gain: 0.2 }, // C5
      { freq: 587.33, dur: 0.2, delay: 0.48, type: 'triangle', gain: 0.22 }, // D5
      { freq: 493.88, dur: 0.24, delay: 0.64, type: 'sine', gain: 0.2 }, // B4 (Dorian 6th)
      { freq: 587.33, dur: 0.42, delay: 0.84, type: 'triangle', gain: 0.22 }, // D5
      { freq: 146.83, dur: 0.5, delay: 0.84, type: 'sine', gain: 0.16 }, // D3 bass
    ],
  },
  'bongo-basin': {
    areaId: 'bongo-basin',
    title: 'Rip-Skin Polyrhythm Roll',
    bpm: 132,
    keyMode: 'A Mixolydian',
    notes: [
      { freq: 110.0, dur: 0.14, delay: 0.0, type: 'sine', gain: 0.24, slideTo: 78 }, // low conga
      { freq: 220.0, dur: 0.11, delay: 0.12, type: 'triangle', gain: 0.2, slideTo: 180 }, // high bongo
      { freq: 329.63, dur: 0.11, delay: 0.22, type: 'triangle', gain: 0.22, slideTo: 280 }, // slap
      { freq: 220.0, dur: 0.11, delay: 0.34, type: 'triangle', gain: 0.2, slideTo: 185 },
      { freq: 392.0, dur: 0.14, delay: 0.45, type: 'sawtooth', gain: 0.12 }, // G4 Mixolydian b7
      { freq: 440.0, dur: 0.22, delay: 0.58, type: 'sawtooth', gain: 0.14 }, // A4
      { freq: 554.37, dur: 0.36, delay: 0.78, type: 'triangle', gain: 0.22 }, // C#5
      { freq: 110.0, dur: 0.38, delay: 0.78, type: 'sine', gain: 0.22, slideTo: 82 },
    ],
  },
  'chrome-kiln': {
    areaId: 'chrome-kiln',
    title: 'Crucible 303 Acid Riff',
    bpm: 138,
    keyMode: 'E Phrygian Dominant',
    notes: [
      { freq: 82.41, dur: 0.15, delay: 0.0, type: 'sawtooth', gain: 0.16, slideTo: 110 }, // E2 acid
      { freq: 164.81, dur: 0.14, delay: 0.14, type: 'sawtooth', gain: 0.16 }, // E3
      { freq: 174.61, dur: 0.15, delay: 0.28, type: 'sawtooth', gain: 0.16 }, // F3 (b2)
      { freq: 207.65, dur: 0.16, delay: 0.42, type: 'sawtooth', gain: 0.17 }, // G#3 (maj3)
      { freq: 246.94, dur: 0.18, delay: 0.58, type: 'sawtooth', gain: 0.16 }, // B3
      { freq: 1046.5, dur: 0.38, delay: 0.76, type: 'triangle', gain: 0.18 }, // anvil ping C6
      { freq: 1318.51, dur: 0.44, delay: 0.78, type: 'sine', gain: 0.16 }, // anvil overtone E6
      { freq: 82.41, dur: 0.45, delay: 0.76, type: 'sawtooth', gain: 0.18 },
    ],
  },
  'neon-birdbath': {
    areaId: 'neon-birdbath',
    title: 'Lydian Mist Shimmer',
    bpm: 170,
    keyMode: 'G Lydian',
    notes: [
      { freq: 392.0, dur: 0.18, delay: 0.0, type: 'sine', gain: 0.18 }, // G4
      { freq: 493.88, dur: 0.18, delay: 0.1, type: 'sine', gain: 0.18 }, // B4
      { freq: 587.33, dur: 0.18, delay: 0.2, type: 'sine', gain: 0.18 }, // D5
      { freq: 739.99, dur: 0.2, delay: 0.3, type: 'triangle', gain: 0.18 }, // F#5
      { freq: 1108.73, dur: 0.24, delay: 0.42, type: 'sine', gain: 0.16 }, // C#6 (#4 Lydian)
      { freq: 987.77, dur: 0.3, delay: 0.58, type: 'sine', gain: 0.18 }, // B5
      { freq: 1567.98, dur: 0.52, delay: 0.78, type: 'sine', gain: 0.15 }, // G6
      { freq: 196.0, dur: 0.55, delay: 0.78, type: 'triangle', gain: 0.16 }, // G3 pad
    ],
  },
  'mulch-alley': {
    areaId: 'mulch-alley',
    title: 'Token Shark 8-Bit Coin-Up',
    bpm: 118,
    keyMode: 'C Minor',
    notes: [
      { freq: 523.25, dur: 0.09, delay: 0.0, type: 'square', gain: 0.11 }, // C5
      { freq: 622.25, dur: 0.09, delay: 0.09, type: 'square', gain: 0.11 }, // Eb5
      { freq: 783.99, dur: 0.09, delay: 0.18, type: 'square', gain: 0.11 }, // G5
      { freq: 932.33, dur: 0.12, delay: 0.27, type: 'square', gain: 0.11 }, // Bb5
      { freq: 1046.5, dur: 0.16, delay: 0.4, type: 'square', gain: 0.12 }, // C6
      { freq: 1567.98, dur: 0.38, delay: 0.54, type: 'square', gain: 0.12 }, // G6 coin sparkle
      { freq: 130.81, dur: 0.4, delay: 0.54, type: 'triangle', gain: 0.18 }, // C3 bass
    ],
  },
  'tupperware-mall': {
    areaId: 'tupperware-mall',
    title: 'Sky-Mall PA Chime & Disco Pop',
    bpm: 126,
    keyMode: 'Bb Ionian',
    notes: [
      { freq: 466.16, dur: 0.2, delay: 0.0, type: 'sine', gain: 0.18 }, // Bb4 chime
      { freq: 587.33, dur: 0.2, delay: 0.15, type: 'sine', gain: 0.18 }, // D5
      { freq: 698.46, dur: 0.24, delay: 0.3, type: 'sine', gain: 0.18 }, // F5
      { freq: 932.33, dur: 0.28, delay: 0.45, type: 'sine', gain: 0.19 }, // Bb5
      { freq: 116.54, dur: 0.12, delay: 0.7, type: 'triangle', gain: 0.2 }, // Bb2 disco octave
      { freq: 233.08, dur: 0.14, delay: 0.82, type: 'triangle', gain: 0.2 }, // Bb3
      { freq: 932.33, dur: 0.34, delay: 0.94, type: 'triangle', gain: 0.18 }, // Bb5
    ],
  },
  'hoa-citadel': {
    areaId: 'hoa-citadel',
    title: 'Bylaw Brass Citation March',
    bpm: 112,
    keyMode: 'F# Harmonic Minor',
    notes: [
      { freq: 185.0, dur: 0.18, delay: 0.0, type: 'sawtooth', gain: 0.14 }, // F#3
      { freq: 185.0, dur: 0.12, delay: 0.2, type: 'sawtooth', gain: 0.13 },
      { freq: 277.18, dur: 0.22, delay: 0.34, type: 'sawtooth', gain: 0.15 }, // C#4
      { freq: 293.66, dur: 0.18, delay: 0.58, type: 'sawtooth', gain: 0.15 }, // D4
      { freq: 277.18, dur: 0.18, delay: 0.78, type: 'sawtooth', gain: 0.15 }, // C#4
      { freq: 349.23, dur: 0.22, delay: 0.96, type: 'sawtooth', gain: 0.16 }, // E#4 (leading tone)
      { freq: 369.99, dur: 0.45, delay: 1.18, type: 'sawtooth', gain: 0.17 }, // F#4
    ],
  },
  'subsoil-relay': {
    areaId: 'subsoil-relay',
    title: '108.0 Deep-Cut Dub Swell',
    bpm: 166,
    keyMode: 'C Phrygian',
    notes: [
      { freq: 65.41, dur: 0.55, delay: 0.0, type: 'sine', gain: 0.26, slideTo: 58 }, // C2 sub
      { freq: 261.63, dur: 0.2, delay: 0.14, type: 'triangle', gain: 0.16 }, // C4 dub chord
      { freq: 277.18, dur: 0.22, delay: 0.34, type: 'triangle', gain: 0.15 }, // Db4
      { freq: 261.63, dur: 0.18, delay: 0.58, type: 'sine', gain: 0.14 }, // echo 1
      { freq: 261.63, dur: 0.24, delay: 0.82, type: 'sine', gain: 0.09 }, // echo 2
      { freq: 196.0, dur: 0.42, delay: 0.96, type: 'sawtooth', gain: 0.12 }, // G3 horn swell
    ],
  },
  'zero-hz-zenith': {
    areaId: 'zero-hz-zenith',
    title: 'Zero-Hz Harmonic Awakening',
    bpm: 158,
    keyMode: 'E Dorian',
    notes: [
      { freq: 164.81, dur: 0.35, delay: 0.0, type: 'sine', gain: 0.16 }, // E3 needle drop
      { freq: 246.94, dur: 0.28, delay: 0.22, type: 'triangle', gain: 0.16 }, // B3
      { freq: 329.63, dur: 0.28, delay: 0.4, type: 'triangle', gain: 0.16 }, // E4
      { freq: 392.0, dur: 0.32, delay: 0.56, type: 'sine', gain: 0.17 }, // G4
      { freq: 493.88, dur: 0.38, delay: 0.72, type: 'triangle', gain: 0.18 }, // B4
      { freq: 659.25, dur: 0.65, delay: 0.88, type: 'sine', gain: 0.2 }, // E5
      { freq: 880.0, dur: 0.65, delay: 0.92, type: 'sine', gain: 0.15 }, // A5
      { freq: 82.41, dur: 0.75, delay: 0.88, type: 'sine', gain: 0.22 }, // E2 root
    ],
  },
};

export interface JinglePlayer {
  play(areaId: GsrAreaId): void;
  unlock(): void;
  dispose(): void;
}

export function createJinglePlayer(volume: VolumeStore): JinglePlayer {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;

  const getVol = (): number => volume.effective('sounds');

  const unsub = volume.subscribe(() => {
    if (ctx && master) {
      master.gain.setTargetAtTime(getVol(), ctx.currentTime, 0.03);
    }
  });

  function ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = getVol();
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    return ctx;
  }

  return {
    unlock() {
      ensureCtx();
    },
    play(areaId) {
      const c = ensureCtx();
      if (!c || !master) return;
      const spec = AREA_JINGLES[areaId];
      if (!spec) return;
      const base = c.currentTime + 0.02;
      for (const n of spec.notes) {
        const t = base + n.delay;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = n.type;
        osc.frequency.setValueAtTime(Math.max(20, n.freq), t);
        if (n.slideTo && n.slideTo !== n.freq) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(20, n.slideTo), t + n.dur);
        }
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(n.gain, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
        osc.connect(g).connect(master);
        osc.start(t);
        osc.stop(t + n.dur + 0.03);
      }
    },
    dispose() {
      unsub();
      if (ctx) {
        void ctx.close();
        ctx = null;
      }
    },
  };
}
