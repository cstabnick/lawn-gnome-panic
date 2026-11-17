// Procedural horror music for Paragnormal using @lawn/music (Tone.js).
// Layers: deep dread drone/clusters, reverberating hollow bells, auto-panned breathing noise,
// and unsettling detuned scrapes/knocks.
import {
  createAmbientFx,
  createAutoPanner,
  playSong,
  setMuted,
  setMusicVolume,
  setMuteKey,
  type Keep,
  type Tone,
} from '@lawn/music';
import type * as ToneNS from 'tone';
import { volume } from './volume';

const MUTE_KEY = 'paragnormal-music-muted';

function urlMuted(): boolean {
  try {
    return location.hash.toLowerCase().includes('mute');
  } catch {
    return false;
  }
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildParagnormalHorror(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void {
  const rng = mulberry32(seed);
  const bpm = 54 + Math.floor(rng() * 8);
  T.getTransport().bpm.value = bpm;

  const BAR = 240 / bpm;
  const BEAT = BAR / 4;
  const LOOP_BARS = 16;
  const LOOP = LOOP_BARS * BAR;

  // Huge cavernous reverb + dark echo return + distant hallway sweep
  const fx = createAmbientFx(T, keep, out, {
    reverbDecay: 10.5,
    reverbLp: 4200,
    echoTime: '4n.',
    echoFeedback: 0.48,
  });

  // 1. Deep Subterranean Dread Pad (dissonant minor-2nd / tritone clusters)
  const padFilter = keep(new T.Filter(380, 'lowpass'));
  padFilter.connect(fx.rev);
  padFilter.connect(out);

  const pad = keep(
    new T.PolySynth(T.FMSynth, {
      harmonicity: 1.5,
      modulationIndex: 3.2,
      oscillator: { type: 'sawtooth' },
      modulation: { type: 'sine' },
      envelope: { attack: 2.2, decay: 1.5, sustain: 0.7, release: 3.8 },
      modulationEnvelope: { attack: 1.8, decay: 1.0, sustain: 0.5, release: 2.5 },
    }),
  );
  pad.volume.value = -16;
  pad.connect(padFilter);

  const dreadChords = [
    ['D2', 'Eb2', 'A2'],
    ['C#2', 'G2', 'Ab2'],
    ['D2', 'F2', 'B2'],
    ['Bb1', 'E2', 'F2'],
  ];
  const padEvents: Array<[number, { notes: string[]; dur: number }]> = [];
  for (let bar = 0; bar < LOOP_BARS; bar += 4) {
    const chord = dreadChords[(bar / 4 + Math.floor(rng() * 2)) % dreadChords.length];
    padEvents.push([bar * BAR, { notes: chord, dur: 3.8 * BAR }]);
  }
  const padPart = keep(
    new T.Part((time, v) => {
      pad.triggerAttackRelease(v.notes, v.dur, time, 0.55);
    }, padEvents),
  );
  padPart.loop = true;
  padPart.loopEnd = LOOP;
  padPart.start(0);

  // 2. Reverberating Hollow Bells (tolling irregularly into the cavern)
  const bellPan = createAutoPanner(T, keep, fx.rev, { frequency: 0.11, depth: 0.75 });
  bellPan.connect(fx.delay);

  const bell = keep(
    new T.MetalSynth({
      envelope: { attack: 0.015, decay: 3.2, release: 2.4 },
      harmonicity: 5.1,
      modulationIndex: 18,
      resonance: 3400,
      octaves: 1.4,
    }),
  );
  bell.volume.value = -19;
  bell.connect(bellPan);

  const chime = keep(
    new T.FMSynth({
      harmonicity: 3.01,
      modulationIndex: 7,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 2.6, sustain: 0.05, release: 2.8 },
    }),
  );
  chime.volume.value = -16;
  chime.connect(fx.rev);
  chime.connect(fx.delay);

  const bellNotes = ['D4', 'Eb4', 'G#4', 'A4', 'C5', 'F4'];
  const bellEvents: Array<[number, { note: string; metallic: boolean }]> = [];
  for (let bar = 0; bar < LOOP_BARS; bar++) {
    if (rng() < 0.52) {
      const offset = (rng() * 2.5 + 0.25) * BEAT;
      const note = bellNotes[Math.floor(rng() * bellNotes.length)];
      bellEvents.push([bar * BAR + offset, { note, metallic: rng() < 0.45 }]);
    }
  }
  const bellPart = keep(
    new T.Part((time, v) => {
      if (v.metallic) {
        bell.triggerAttackRelease(v.note, '2n', time, 0.4 + rng() * 0.3);
      } else {
        chime.triggerAttackRelease(v.note, '1n', time, 0.35 + rng() * 0.25);
      }
    }, bellEvents),
  );
  bellPart.loop = true;
  bellPart.loopEnd = LOOP;
  bellPart.start(0);

  // 3. Eerie Breathing / Whispering Wind (filtered pink noise panning around your head)
  const breathPan = createAutoPanner(T, keep, fx.sweepSend, { frequency: 0.17, depth: 0.85 });
  breathPan.connect(out);
  const breathFilter = keep(new T.Filter(620, 'bandpass'));
  breathFilter.Q.value = 3.2;
  breathFilter.connect(breathPan);

  const breath = keep(
    new T.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.65, decay: 0.55, sustain: 0.15, release: 1.1 },
    }),
  );
  breath.volume.value = -21;
  breath.connect(breathFilter);

  const breathEvents: Array<[number, { freq: number; dur: number }]> = [];
  for (let bar = 0; bar < LOOP_BARS; bar += 2) {
    // Inhale-exhale pair
    breathEvents.push([bar * BAR + 0.3 * BEAT, { freq: 480 + rng() * 220, dur: 1.1 }]);
    breathEvents.push([bar * BAR + 2.4 * BEAT, { freq: 340 + rng() * 140, dur: 1.4 }]);
  }
  const breathPart = keep(
    new T.Part((time, v) => {
      breathFilter.frequency.setValueAtTime(v.freq, time);
      breathFilter.frequency.exponentialRampToValueAtTime(Math.max(180, v.freq * 0.65), time + v.dur);
      breath.triggerAttackRelease(v.dur, time, 0.5);
    }, breathEvents),
  );
  breathPart.loop = true;
  breathPart.loopEnd = LOOP;
  breathPart.start(0);

  // 4. Unsettling "fuckery": detuned porcelain scrapes & distant floorboard knocks
  const scrape = keep(
    new T.AMSynth({
      harmonicity: 2.37,
      oscillator: { type: 'triangle' },
      modulation: { type: 'sawtooth' },
      envelope: { attack: 0.35, decay: 0.9, sustain: 0.1, release: 1.4 },
    }),
  );
  scrape.volume.value = -23;
  scrape.connect(fx.delay);
  scrape.connect(fx.rev);

  const knock = keep(
    new T.MembraneSynth({
      pitchDecay: 0.04,
      octaves: 3.5,
      envelope: { attack: 0.004, decay: 0.16, sustain: 0, release: 0.12 },
    }),
  );
  knock.volume.value = -18;
  knock.connect(fx.rev);

  const oddEvents: Array<[number, { kind: 'scrape' | 'knock'; note: string }]> = [];
  for (let bar = 1; bar < LOOP_BARS; bar += 3) {
    oddEvents.push([bar * BAR + 1.5 * BEAT, { kind: 'scrape', note: rng() < 0.5 ? 'F#5' : 'C#5' }]);
    if (rng() < 0.7) {
      oddEvents.push([bar * BAR + 3.1 * BEAT, { kind: 'knock', note: 'G1' }]);
      oddEvents.push([bar * BAR + 3.45 * BEAT, { kind: 'knock', note: 'F1' }]);
    }
  }
  const oddPart = keep(
    new T.Part((time, v) => {
      if (v.kind === 'scrape') {
        scrape.triggerAttackRelease(v.note, '2n', time, 0.4);
      } else {
        knock.triggerAttackRelease(v.note, '16n', time, 0.55);
      }
    }, oddEvents),
  );
  oddPart.loop = true;
  oddPart.loopEnd = LOOP;
  oddPart.start(0);

  T.getTransport().start();
}

export interface HorrorMusicController {
  start(): void;
  setSeed(seed: number): void;
}

export function initMusic(initialSeed = 1337): HorrorMusicController {
  setMuteKey(MUTE_KEY);
  let seed = initialSeed >>> 0;
  let activeSeed: number | null = null;
  let started = false;

  const sync = (): void => {
    const gain = urlMuted() ? 0 : volume.effective('music');
    setMusicVolume(gain);
    setMuted(gain <= 0.0001);
  };
  sync();
  volume.subscribe(sync);

  const playCurrent = (): void => {
    if (urlMuted()) return;
    activeSeed = seed;
    const s = seed;
    playSong((T, keep, out) => buildParagnormalHorror(T, keep, out, s));
  };

  const start = (): void => {
    if (started || urlMuted()) return;
    started = true;
    playCurrent();
  };

  const setSeed = (nextSeed: number): void => {
    const normalized = nextSeed >>> 0;
    if (normalized === seed && (!started || activeSeed === normalized)) return;
    seed = normalized;
    if (started && activeSeed !== seed) playCurrent();
  };

  window.addEventListener('pointerdown', start, { once: true });
  window.addEventListener('keydown', (e) => {
    start();
    if (e.repeat) return;
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return;
    if (e.key === 'n' || e.key === 'N') volume.toggleMute('music');
    else if (e.key === 'm' || e.key === 'M') volume.toggleMute('master');
  });

  return { start, setSeed };
}
