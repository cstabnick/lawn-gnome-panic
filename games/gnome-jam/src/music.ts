// Procedural 90s Golden-Era Hip-Hop Chop-Sample Beat Engine (WebAudio).
// Synthesizes MPC-swung boom-bap drums, tight plucked Rhodes jazz-funk chord chops
// with monophonic choke groups, round Moog/upright bass, muted funk guitar chucks,
// vibraphone counter-melodies, warm glide synth leads, classic brass stabs,
// stereo room reverb, and evolving 32-bar arrangements with mono-safe stereo imaging.

import { createStereoToMonoNode, setNodeMonoFoldDown } from './musicTestUtil';

export type BeatMode = 'chill' | 'court' | 'fire';
export type ArrangementSection = 'intro' | 'grooveA' | 'grooveB' | 'verseStrip' | 'breakdown';

interface ChordChop {
  /** MIDI notes for the warm Rhodes / jazz-funk chord voicing (call). */
  notes: readonly number[];
  /** Complementary upper-register voicing of the same chord for chop echoes. */
  echoNotes: readonly number[];
  /** Bass root MIDI note. */
  bass: number;
  /** Chord-safe bass passing tone MIDI note (used when bassPattern === 3). */
  bassPass: number;
  /** Optional funky stab/horn top notes. */
  stab?: readonly number[];
  /** Two chord-safe vibraphone counter-melody notes [primary, upperResponse]. */
  vibe: readonly [number, number];
  /** Melodic synth lead call-and-response glide [fromMidi, toMidi]. */
  lead: readonly [number, number];
}

export interface BeatTrack {
  name: string;
  bpm: number;
  swing: number; // 0..0.28 (fraction of a 16th-note pushed on odd 16ths)
  chops: readonly ChordChop[]; // 4-bar harmonic palette
  /** 16-step kick patterns (0..1 velocity). */
  kickA: readonly number[];
  kickB: readonly number[];
  kickC: readonly number[];
  /** 16-step snare patterns (0..1 velocity; <0.45 = ghost snare). */
  snareA: readonly number[];
  snareB: readonly number[];
  snareC: readonly number[];
  /** 16-step hi-hat patterns (0 = off, 1 = closed soft, 2 = closed accent, 3 = open hat). */
  hatA: readonly number[];
  hatB: readonly number[];
  hatC: readonly number[];
  /** 16-step sample-chop trigger map (-1 = silent, 0..3 = chop index offset, 4 = re-trigger stutter). */
  chopPatternA: readonly number[];
  chopPatternB: readonly number[];
  /** 16-step bass rhythm (0 = rest, 1 = root, 2 = fifth/octave bounce, 3 = passing tone). */
  bassPattern: readonly number[];
  /** 16-step muted funk guitar chuck pattern (0 = rest, 1 = tight chuck, 2 = accent). */
  guitarPattern: readonly number[];
  /** 16-step vibraphone arpeggio/counter-melody triggers (0 = rest, 1 = chord tone, 2 = upper ext). */
  vibesPattern: readonly number[];
}

export const TRACKS: readonly BeatTrack[] = [
  {
    // Warm D Dorian / Pete Rock & ATCQ style Rhodes soul chop (Dm9 -> G13 -> Fmaj9 -> Am11)
    name: 'Gnomerena Soul',
    bpm: 93,
    swing: 0.22,
    chops: [
      {
        notes: [62, 65, 69, 72, 76],
        echoNotes: [65, 69, 72, 76, 79],
        bass: 38,
        bassPass: 45,
        stab: [69, 72, 76],
        vibe: [76, 81],
        lead: [72, 74],
      }, // Dm9
      {
        notes: [62, 65, 67, 71, 76],
        echoNotes: [65, 67, 71, 74, 76],
        bass: 43,
        bassPass: 47,
        stab: [71, 74, 79],
        vibe: [74, 79],
        lead: [74, 76],
      }, // G13
      {
        notes: [60, 64, 67, 69, 72],
        echoNotes: [64, 67, 69, 72, 76],
        bass: 41,
        bassPass: 45,
        stab: [69, 72, 76],
        vibe: [76, 79],
        lead: [76, 72],
      }, // Fmaj9
      {
        notes: [64, 67, 69, 72, 74],
        echoNotes: [67, 69, 72, 76, 79],
        bass: 45,
        bassPass: 43,
        stab: [67, 72, 76],
        vibe: [79, 76],
        lead: [74, 72],
      }, // Am11
    ],
    kickA:  [1, 0, 0, 0, 0, 0, 0, 0.7, 0, 0, 0.9, 0, 0, 0, 0.45, 0],
    kickB:  [1, 0, 0, 0.55, 0, 0, 0, 0.75, 0, 0, 0.92, 0, 0, 0.45, 0, 0],
    kickC:  [1, 0, 0.45, 0, 0, 0, 0.65, 0, 0.8, 0, 0.9, 0, 0, 0.5, 0, 0],
    snareA: [0, 0, 0, 0, 0.95, 0, 0, 0.25, 0, 0.22, 0, 0, 1, 0, 0, 0.28],
    snareB: [0, 0, 0, 0, 0.95, 0, 0, 0.3, 0, 0.28, 0, 0, 1, 0, 0.32, 0],
    snareC: [0, 0, 0, 0.2, 0.95, 0, 0, 0, 0, 0.32, 0, 0.22, 1, 0, 0.28, 0.22],
    hatA:   [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3, 1],
    hatB:   [2, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 2, 2, 1, 3, 1],
    hatC:   [2, 0, 2, 1, 2, 1, 3, 0, 2, 1, 2, 1, 2, 0, 3, 1],
    chopPatternA: [0, -1, -1, 0, -1, -1, 1, -1, -1, -1, 0, -1, -1, -1, 1, -1],
    chopPatternB: [0, -1, 0, -1, -1, -1, 1, -1, 0, -1, -1, 1, -1, -1, 4, -1],
    bassPattern:   [1, 0, 0, 1, 0, 0, 2, 0, 0, 0, 1, 0, 0, 3, 0, 0],
    guitarPattern: [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 0, 1, 0],
    vibesPattern:  [0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 1, 0, 2, 0],
  },
  {
    // Funky F minor / 90s East Coast bounce (Fm9 -> Bb13 -> Dbmaj9 -> C7#9)
    name: 'Hardwood Bounce',
    bpm: 96,
    swing: 0.24,
    chops: [
      {
        notes: [60, 63, 67, 68, 72],
        echoNotes: [63, 67, 68, 72, 75],
        bass: 41,
        bassPass: 48,
        stab: [68, 72, 75],
        vibe: [75, 79],
        lead: [72, 75],
      }, // Fm9
      {
        notes: [62, 65, 67, 68, 72],
        echoNotes: [65, 67, 68, 72, 74],
        bass: 46,
        bassPass: 41,
        stab: [68, 72, 74],
        vibe: [77, 79],
        lead: [74, 77],
      }, // Bb13
      {
        notes: [60, 63, 65, 68, 72],
        echoNotes: [63, 65, 68, 72, 75],
        bass: 37,
        bassPass: 41,
        stab: [68, 72, 77],
        vibe: [77, 80],
        lead: [75, 77],
      }, // Dbmaj9
      {
        notes: [60, 64, 67, 70, 75],
        echoNotes: [64, 67, 70, 75, 79],
        bass: 36,
        bassPass: 43,
        stab: [67, 70, 75],
        vibe: [79, 82],
        lead: [75, 72],
      }, // C7#9
    ],
    kickA:  [1, 0, 0, 0, 0, 0, 0.65, 0, 0, 0.85, 0.9, 0, 0, 0, 0, 0],
    kickB:  [1, 0, 0.45, 0, 0, 0, 0.7, 0, 0, 0.85, 0, 0.65, 0, 0, 0.5, 0],
    kickC:  [1, 0, 0, 0.5, 0, 0, 0.72, 0, 0.82, 0, 0, 0.6, 0, 0.45, 0, 0],
    snareA: [0, 0, 0, 0, 1, 0, 0, 0.24, 0, 0, 0, 0.22, 0.95, 0, 0, 0.3],
    snareB: [0, 0, 0, 0, 1, 0, 0, 0.3, 0, 0.26, 0, 0, 1, 0, 0.35, 0.25],
    snareC: [0, 0, 0.2, 0, 1, 0, 0, 0.25, 0, 0.3, 0, 0.24, 1, 0, 0, 0.28],
    hatA:   [2, 0, 2, 1, 2, 1, 2, 0, 2, 1, 2, 1, 2, 0, 3, 1],
    hatB:   [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3, 1],
    hatC:   [2, 1, 1, 2, 2, 1, 3, 1, 2, 1, 1, 2, 2, 1, 3, 0],
    chopPatternA: [0, -1, -1, -1, -1, -1, 0, -1, -1, 1, -1, -1, -1, -1, 1, -1],
    chopPatternB: [0, -1, -1, 1, -1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 4, -1],
    bassPattern:   [1, 0, 0, 0, 0, 0, 1, 0, 0, 2, 1, 0, 0, 0, 3, 0],
    guitarPattern: [0, 1, 0, 0, 0, 0, 2, 0, 0, 1, 0, 1, 0, 0, 2, 0],
    vibesPattern:  [0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0],
  },
  {
    // Laid-back E minor / classic 90s jazz-hop lounge chop (Em9 -> A13 -> Cmaj9 -> B7#9)
    name: 'Downtown Smooth',
    bpm: 90,
    swing: 0.2,
    chops: [
      {
        notes: [62, 66, 67, 71, 74],
        echoNotes: [66, 67, 71, 74, 76],
        bass: 40,
        bassPass: 47,
        stab: [67, 71, 74],
        vibe: [74, 79],
        lead: [71, 74],
      }, // Em9
      {
        notes: [61, 64, 66, 67, 71],
        echoNotes: [64, 66, 67, 71, 73],
        bass: 45,
        bassPass: 40,
        stab: [67, 71, 73],
        vibe: [76, 78],
        lead: [73, 76],
      }, // A13
      {
        notes: [60, 64, 67, 71, 74],
        echoNotes: [64, 67, 71, 74, 76],
        bass: 36,
        bassPass: 40,
        stab: [67, 71, 76],
        vibe: [76, 79],
        lead: [76, 74],
      }, // Cmaj9
      {
        notes: [63, 66, 69, 71, 74],
        echoNotes: [66, 69, 71, 74, 78],
        bass: 35,
        bassPass: 42,
        stab: [69, 71, 75],
        vibe: [78, 81],
        lead: [74, 71],
      }, // B7#9
    ],
    kickA:  [1, 0, 0, 0, 0, 0, 0, 0.72, 0, 0, 0.85, 0, 0, 0.5, 0, 0],
    kickB:  [1, 0, 0, 0, 0, 0, 0.55, 0.75, 0, 0, 0.9, 0, 0, 0, 0.5, 0],
    kickC:  [1, 0, 0.4, 0, 0, 0, 0.6, 0, 0.75, 0, 0.88, 0, 0, 0.52, 0, 0],
    snareA: [0, 0, 0, 0, 0.92, 0, 0, 0.2, 0, 0.2, 0, 0, 0.95, 0, 0, 0.24],
    snareB: [0, 0, 0, 0, 0.92, 0, 0, 0.25, 0, 0.22, 0, 0, 0.95, 0, 0.28, 0],
    snareC: [0, 0, 0, 0, 0.92, 0, 0.2, 0, 0, 0.26, 0, 0.2, 0.95, 0, 0.3, 0.22],
    hatA:   [2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 3, 1],
    hatB:   [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3, 1],
    hatC:   [2, 0, 2, 1, 2, 1, 1, 2, 2, 0, 2, 1, 2, 1, 3, 0],
    chopPatternA: [0, -1, -1, 0, -1, -1, -1, 1, -1, -1, 0, -1, -1, -1, -1, -1],
    chopPatternB: [0, -1, -1, 0, -1, 1, -1, -1, 0, -1, -1, 1, -1, -1, 4, -1],
    bassPattern:   [1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 3, 0, 0],
    guitarPattern: [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 0, 0],
    vibesPattern:  [0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 1, 0, 2, 0],
  },
];

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Gentle soft-clip curve for subtle MPC/tape warmth without harsh saturation. */
function makeWarmCurve(amount = 5): Float32Array<ArrayBuffer> {
  const n = 512;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  const k = amount * 0.08;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

/** Synthesizes a warm, stereo room impulse response for subtle spatial depth. */
function createReverbBuffer(ctx: BaseAudioContext): AudioBuffer {
  const dur = 0.95;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      // Smooth exponential decay with gentle early-reflection swell
      const env = Math.sin(Math.min(1, t * 18) * Math.PI * 0.5) * Math.pow(1 - t, 2.8);
      const white = Math.random() * 2 - 1;
      // One-pole lowpass so the tail is warm, never metallic or hissy
      lp = lp * 0.62 + white * 0.38;
      data[i] = lp * env * 0.6;
    }
  }
  return buf;
}

/** Cleanly chokes a voice gain node without value-snap clicks. */
function safeChoke(gainNode: GainNode | null, time: number, tau = 0.012): void {
  if (!gainNode) return;
  try {
    const g = gainNode.gain as AudioParam & { cancelAndHoldAtTime?: (t: number) => AudioParam };
    if (typeof g.cancelAndHoldAtTime === 'function') {
      g.cancelAndHoldAtTime(time);
    } else {
      g.cancelScheduledValues(time);
    }
    g.setTargetAtTime(0.0001, time, tau);
  } catch {
    // ignore
  }
}

/** Computes the 32-bar arrangement section for a given bar index. */
export function getArrangementSection(bar: number): ArrangementSection {
  const b = ((bar % 32) + 32) % 32;
  if (b < 4) return 'intro';
  if (b < 12) return 'grooveA';
  if (b < 20) return 'grooveB';
  if (b < 28) return 'verseStrip';
  return 'breakdown';
}

export class HipHopBeatEngine {
  private ctx: AudioContext | null = null;
  private getGain: () => number;
  private masterGain: GainNode | null = null;
  private monoFoldNode: GainNode | null = null;
  private busFilter: BiquadFilterNode | null = null;
  private busLimiter: DynamicsCompressorNode | null = null;
  private reverbSend: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private vinylNode: AudioBufferSourceNode | null = null;
  private vinylGain: GainNode | null = null;

  /** Active monophonic chop & open-hat voices (choked cleanly when the next hit lands). */
  private activeChopGain: GainNode | null = null;
  private activeHatGain: GainNode | null = null;

  private timerId: number | null = null;
  private running = false;
  private nextStepTime = 0;
  private stepInBar = 0; // 0..15
  private barIndex = 0;  // 0..31
  private cycleCount = 0;
  private trackIndex = 0;
  private mode: BeatMode = 'chill';
  private monoMix = false;

  constructor(getGain: () => number) {
    this.getGain = getGain;
  }

  currentTrackName(): string {
    return TRACKS[this.trackIndex % TRACKS.length].name;
  }

  /** Toggle stereo->mono fold-down on the live music bus (music testing utility). */
  setMonoMix(enabled: boolean): void {
    this.monoMix = enabled;
    if (this.monoFoldNode) {
      setNodeMonoFoldDown(this.monoFoldNode, enabled);
    }
  }

  isMonoMix(): boolean {
    return this.monoMix;
  }

  setMode(mode: BeatMode): void {
    this.mode = mode;
    if (this.ctx && this.busFilter) {
      const targetHz = mode === 'chill' ? 2100 : mode === 'fire' ? 6000 : 4400;
      this.busFilter.frequency.setTargetAtTime(targetHz, this.ctx.currentTime, 0.25);
    }
  }

  nextTrack(): void {
    this.trackIndex = (this.trackIndex + 1) % TRACKS.length;
    this.barIndex = 0;
    this.stepInBar = 0;
  }

  start(ctx: AudioContext, mode: BeatMode = 'court'): void {
    this.ctx = ctx;
    this.mode = mode;
    this.ensureGraph(ctx);
    this.setMode(mode);

    if (this.running) return;
    this.running = true;
    this.nextStepTime = ctx.currentTime + 0.06;
    this.stepInBar = 0;
    this.barIndex = 0;
    this.startVinylDust(ctx);

    this.timerId = window.setInterval(() => this.scheduler(), 35);
  }

  stop(): void {
    this.running = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.stopVinylDust();
  }

  private ensureGraph(ctx: AudioContext): void {
    if (this.masterGain) return;

    this.busFilter = ctx.createBiquadFilter();
    this.busFilter.type = 'lowpass';
    this.busFilter.frequency.value = 4400;
    this.busFilter.Q.value = 0.65;

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeWarmCurve(5);
    shaper.oversample = 'none';

    this.busLimiter = ctx.createDynamicsCompressor();
    this.busLimiter.threshold.value = -8;
    this.busLimiter.knee.value = 8;
    this.busLimiter.ratio.value = 6;
    this.busLimiter.attack.value = 0.004;
    this.busLimiter.release.value = 0.12;

    this.monoFoldNode = createStereoToMonoNode(ctx);
    setNodeMonoFoldDown(this.monoFoldNode, this.monoMix);

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.getGain();

    // Dry bus: busFilter -> shaper -> busLimiter -> monoFoldNode -> masterGain -> destination
    this.busFilter.connect(shaper);
    shaper.connect(this.busLimiter);
    this.busLimiter.connect(this.monoFoldNode);
    this.monoFoldNode.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);

    // Stereo reverb send bus (kept clean of sub-bass mud)
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 1.0;

    const convolver = ctx.createConvolver();
    convolver.buffer = createReverbBuffer(ctx);

    const revHp = ctx.createBiquadFilter();
    revHp.type = 'highpass';
    revHp.frequency.value = 180;

    const revLp = ctx.createBiquadFilter();
    revLp.type = 'lowpass';
    revLp.frequency.value = 3200;

    const revReturn = ctx.createGain();
    revReturn.gain.value = 0.22;

    this.reverbSend.connect(convolver);
    convolver.connect(revHp);
    revHp.connect(revLp);
    revLp.connect(revReturn);
    revReturn.connect(this.busLimiter);

    // Pre-generate 1.5s white noise buffer for snares, hi-hats & shakers
    const len = Math.floor(ctx.sampleRate * 1.5);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  }

  private connectPanned(node: AudioNode, pan: number, reverbAmt = 0): void {
    if (!this.ctx || !this.busFilter) return;
    const clampedPan = Math.max(-0.85, Math.min(0.85, pan));
    if (Math.abs(clampedPan) > 0.01 && typeof this.ctx.createStereoPanner === 'function') {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = clampedPan;
      node.connect(panner);
      panner.connect(this.busFilter);
      if (reverbAmt > 0 && this.reverbSend) {
        const send = this.ctx.createGain();
        send.gain.value = reverbAmt;
        panner.connect(send);
        send.connect(this.reverbSend);
      }
    } else {
      node.connect(this.busFilter);
      if (reverbAmt > 0 && this.reverbSend) {
        const send = this.ctx.createGain();
        send.gain.value = reverbAmt;
        node.connect(send);
        send.connect(this.reverbSend);
      }
    }
  }

  private startVinylDust(ctx: AudioContext): void {
    if (this.vinylNode || !this.monoFoldNode) return;
    const dur = 3.0;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      let s = (Math.random() * 2 - 1) * 0.012;
      if (Math.random() < 0.00045) s += (Math.random() * 2 - 1) * 0.22;
      data[i] = s;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 3000;
    hp.Q.value = 0.8;

    const g = ctx.createGain();
    g.gain.value = 0.11;

    src.connect(hp).connect(g).connect(this.monoFoldNode);
    src.start();
    this.vinylNode = src;
    this.vinylGain = g;
  }

  private stopVinylDust(): void {
    if (this.vinylNode) {
      try {
        this.vinylNode.stop();
        this.vinylNode.disconnect();
      } catch {
        // ignore
      }
      this.vinylNode = null;
    }
    this.vinylGain?.disconnect();
    this.vinylGain = null;
  }

  private scheduler(): void {
    if (!this.running || !this.ctx || !this.masterGain) return;
    const vol = this.getGain();
    this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    if (vol <= 0.001) {
      this.nextStepTime = Math.max(this.nextStepTime, this.ctx.currentTime + 0.05);
      return;
    }

    const track = TRACKS[this.trackIndex % TRACKS.length];
    const base16th = 60 / track.bpm / 4;
    const lookahead = 0.14;

    while (this.nextStepTime < this.ctx.currentTime + lookahead) {
      const swingOffset = this.stepInBar % 2 === 1 ? base16th * track.swing : 0;
      const playTime = this.nextStepTime + swingOffset;

      this.scheduleStep(track, this.barIndex, this.stepInBar, playTime, base16th);

      this.nextStepTime += base16th;
      this.stepInBar++;
      if (this.stepInBar >= 16) {
        this.stepInBar = 0;
        this.barIndex++;
        if (this.barIndex >= 32) {
          this.barIndex = 0;
          this.cycleCount++;
          this.trackIndex = (this.trackIndex + 1) % TRACKS.length;
        }
      }
    }
  }

  private scheduleStep(
    track: BeatTrack,
    bar: number,
    step: number,
    time: number,
    stepDur: number,
  ): void {
    if (!this.ctx || !this.busFilter) return;

    // 32-bar evolving arrangement:
    //   Bars  0.. 3: INTRO       (Rhodes chops + soft hats; vibes join on cycle 2+)
    //   Bars  4..11: GROOVE A    (Boom-bap pocket; muted guitar mixes in on bars 8..11)
    //   Bars 12..19: GROOVE B    (Pattern C drums + shaker/rimshot + stabs + vibes/lead)
    //   Bars 20..27: VERSE STRIP (Rhodes drops out 20..23 -> Muted Guitar + Vibes + Bass;
    //                             Rhodes + Synth Lead return 24..27!)
    //   Bars 28..31: BREAKDOWN   (2 bars drums out + ghost fill, 2 bars build back to top)
    const section = getArrangementSection(bar);
    const altCycle = this.cycleCount % 2 === 1;

    const chordIdx = bar % track.chops.length;
    const chop = track.chops[chordIdx];
    const nextChop = track.chops[(chordIdx + 1) % track.chops.length];
    const isTurnaroundBar = bar % 4 === 3;

    // Mix voices in & out across sections so it never feels static
    const rhodesActive =
      section !== 'verseStrip' || bar >= 24 || altCycle;
    const guitarActive =
      (section === 'grooveA' && bar >= 8) ||
      section === 'grooveB' ||
      section === 'verseStrip';
    const vibesActive =
      (section === 'intro' && (altCycle || bar >= 2)) ||
      section === 'grooveB' ||
      (section === 'verseStrip' && bar < 24) ||
      section === 'breakdown';
    const leadActive =
      (section === 'grooveB' && (altCycle || bar >= 16)) ||
      (section === 'verseStrip' && bar >= 24) ||
      this.mode === 'fire';

    // 1. SAMPLE CHOPS (Tight, plucky, filtered Rhodes with space between hits)
    if (rhodesActive) {
      const useChopB = section === 'grooveB' || (section === 'grooveA' && bar % 2 === 1);
      const chopPat = useChopB ? track.chopPatternB : track.chopPatternA;
      const chopCode = chopPat[step];
      if (chopCode >= 0) {
        if (chopCode === 4 && isTurnaroundBar) {
          this.playRhodesChop(time, nextChop.notes, stepDur * 1.15, 0.14);
        } else {
          // chopCode === 1 plays an upper-register echo of the current chord so it never clashes with the bass
          const chosenNotes = chopCode === 1 ? chop.echoNotes : chop.notes;
          const holdDur =
            section === 'intro' || section === 'breakdown'
              ? stepDur * 2.6
              : stepDur * 1.85;
          this.playRhodesChop(time, chosenNotes, holdDur, 0.155);
        }
      }
    }

    // 2. WARM MOOG / UPRIGHT BASS (dead center for mono solidity)
    const bassCode = track.bassPattern[step];
    if (bassCode > 0 && (section !== 'intro' || bar >= 2)) {
      let note = chop.bass;
      if (bassCode === 2) note += 7;
      else if (bassCode === 3) note = chop.bassPass;
      const bassVol = section === 'breakdown' ? 0.22 : section === 'verseStrip' ? 0.29 : 0.27;
      this.playBass(time, note, stepDur * (bassCode === 1 ? 2.2 : 1.35), bassVol);
    }

    // 3. MUTED FUNK GUITAR / CLAV CHUCKS (panned left)
    if (guitarActive) {
      const gCode = track.guitarPattern[step];
      if (gCode > 0) {
        const gNotes = chop.notes.slice(-3);
        const gVol = gCode === 2 ? 0.085 : 0.06;
        this.playMutedGuitar(time, gNotes, stepDur * 0.75, gVol);
      }
    }

    // 4. VIBRAPHONE / BELL COUNTER-MELODY (panned right, chord-safe call & response)
    if (vibesActive) {
      const vCode = track.vibesPattern[step];
      if (vCode > 0) {
        const vNote = vCode === 2 ? chop.vibe[1] : chop.vibe[0];
        this.playVibes(time, vNote, stepDur * 2.2, 0.075);
      }
    }

    // 5. WARM GLIDE SYNTH LEAD (call-and-response melodic phrases in Groove B / Verse Lift / Fire)
    if (leadActive && (step === 2 || step === 10) && bar % 2 === 1) {
      const [fromNote, toNote] = step === 2 ? chop.lead : [chop.lead[1], chop.lead[0]];
      this.playSynthLead(time, fromNote, toNote, stepDur * 2.8, 0.065);
    }

    // 6. FUNKY 90s BRASS / CLAVINET STABS
    if (chop.stab && (section === 'grooveB' || this.mode === 'fire')) {
      const stabHit =
        (step === 0 && bar % 2 === 0) ||
        (step === 10 && isTurnaroundBar) ||
        (this.mode === 'fire' && step === 6);
      if (stabHit) {
        this.playFunkStab(time, chop.stab, stepDur * 1.4, this.mode === 'fire' ? 0.1 : 0.075);
      }
    }

    // 7. BOOM-BAP DRUMS WITH STRUCTURAL VARIATION (A / B / C pockets)
    const drumsDropOut =
      section === 'intro' ||
      (section === 'breakdown' && bar < 30);

    const useC = section === 'grooveB' || (section === 'verseStrip' && bar % 2 === 1);
    const useB = !useC && (section === 'grooveA' && bar % 2 === 1);

    if (!drumsDropOut) {
      const kickPat = useC ? track.kickC : useB ? track.kickB : track.kickA;
      const kickVel = kickPat[step];
      // Brief 2-beat dropout on bar 19 right before verseStrip
      const preDropMute = bar === 19 && step >= 12;
      if (kickVel > 0 && !preDropMute) {
        this.playKick(time, kickVel * 0.44);
      }

      const snarePat = useC ? track.snareC : useB ? track.snareB : track.snareA;
      const snareVel = snarePat[step];
      if (snareVel > 0) {
        this.playSnare(time, snareVel * 0.34);
      }

      // Syncopated rimshot / clave accent in Groove B & Verse Strip
      if ((section === 'grooveB' || section === 'verseStrip') && (step === 3 || step === 11)) {
        if ((bar + step) % 2 === 1) {
          this.playRimshot(time, 0.085);
        }
      }
    } else if (section === 'breakdown' && bar === 29 && step >= 12) {
      const ramp = 0.22 + ((step - 12) / 4) * 0.55;
      this.playSnare(time, ramp * 0.32);
    }

    // Swung hi-hats + optional shaker texture
    const hatPat = useC ? track.hatC : useB ? track.hatB : track.hatA;
    const hatCode = hatPat[step];
    if (hatCode > 0) {
      const hatMul =
        section === 'intro'
          ? 0.55
          : section === 'breakdown' && bar < 30
            ? 0.45
            : 1.0;
      const isOpen = hatCode === 3 && !drumsDropOut;
      const vel = (hatCode === 2 ? 0.125 : hatCode === 3 ? 0.14 : 0.068) * hatMul;
      this.playHiHat(time, isOpen, vel);
    }

    if ((section === 'grooveB' || section === 'verseStrip') && step % 2 === 1) {
      this.playShaker(time, step % 4 === 3 ? 0.048 : 0.032);
    }
  }

  /**
   * Monophonic MPC-style Rhodes chord chop:
   * tighter low-pass filter, pluckier attack/decay, less saturation, more space, stereo spread.
   */
  private playRhodesChop(time: number, midiNotes: readonly number[], dur: number, vol: number): void {
    if (!this.ctx || !this.busFilter) return;
    const ctx = this.ctx;

    safeChoke(this.activeChopGain, time, 0.01);

    const chopGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 1.45;
    // Plucky filter transient: crisp snap down from 1650 Hz -> 860 Hz -> 420 Hz
    filter.frequency.setValueAtTime(1650, time);
    filter.frequency.exponentialRampToValueAtTime(860, time + Math.min(0.065, dur * 0.3));
    filter.frequency.exponentialRampToValueAtTime(420, time + dur);

    // Plucky amplitude envelope with tighter decay
    const pluckTime = time + Math.min(0.08, dur * 0.35);
    chopGain.gain.setValueAtTime(0.0001, time);
    chopGain.gain.linearRampToValueAtTime(vol, time + 0.004);
    chopGain.gain.exponentialRampToValueAtTime(vol * 0.26, pluckTime);
    chopGain.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.025);

    filter.connect(chopGain);
    this.connectPanned(chopGain, -0.1, 0.38);
    this.activeChopGain = chopGain;

    const perVoice = 0.85 / Math.sqrt(midiNotes.length);
    for (let i = 0; i < midiNotes.length; i++) {
      const hz = midiToHz(midiNotes[i]);
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(hz, time);
      osc.detune.setValueAtTime((i - 2) * 3.0, time);

      const vg = ctx.createGain();
      vg.gain.value = perVoice;

      // Subtle per-note stereo spread (equal-power panning sums cleanly to mono)
      if (typeof ctx.createStereoPanner === 'function') {
        const vp = ctx.createStereoPanner();
        const norm = midiNotes.length > 1 ? (i / (midiNotes.length - 1)) * 2 - 1 : 0;
        vp.pan.value = norm * 0.22;
        osc.connect(vg).connect(vp).connect(filter);
      } else {
        osc.connect(vg).connect(filter);
      }

      osc.start(time);
      osc.stop(time + dur + 0.04);
    }
  }

  /** Round 90s Moog / upright-style sub-bass (centered, dry). */
  private playBass(time: number, midi: number, dur: number, vol: number): void {
    if (!this.ctx || !this.busFilter) return;
    const ctx = this.ctx;
    const hz = midiToHz(midi);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(hz * 1.012, time);
    osc.frequency.exponentialRampToValueAtTime(hz, time + 0.022);

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(hz, time);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(480, time);
    lp.frequency.exponentialRampToValueAtTime(190, time + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(lp);
    sub.connect(lp);
    lp.connect(g);
    this.connectPanned(g, 0, 0);

    osc.start(time);
    sub.start(time);
    osc.stop(time + dur + 0.02);
    sub.stop(time + dur + 0.02);
  }

  /** Tight percussive muted funk guitar / clavinet chuck (panned left). */
  private playMutedGuitar(time: number, notes: readonly number[], dur: number, vol: number): void {
    if (!this.ctx || !this.busFilter) return;
    const ctx = this.ctx;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2200, time);
    bp.frequency.exponentialRampToValueAtTime(750, time + Math.min(0.055, dur));
    bp.Q.value = 1.8;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    bp.connect(g);
    this.connectPanned(g, -0.36, 0.25);

    const scale = 1 / Math.sqrt(Math.max(1, notes.length));
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(midiToHz(notes[i]), time);
      const vg = ctx.createGain();
      vg.gain.value = scale;
      osc.connect(vg).connect(bp);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    }
  }

  /** Warm vibraphone / bell counter-melody (panned right, sent to reverb). */
  private playVibes(time: number, midi: number, dur: number, vol: number): void {
    if (!this.ctx || !this.busFilter) return;
    const ctx = this.ctx;
    const hz = midiToHz(midi);

    const fund = ctx.createOscillator();
    fund.type = 'sine';
    fund.frequency.setValueAtTime(hz, time);

    const over = ctx.createOscillator();
    over.type = 'sine';
    over.frequency.setValueAtTime(hz * 2, time);

    const og = ctx.createGain();
    og.gain.setValueAtTime(0.28, time);
    og.gain.exponentialRampToValueAtTime(0.01, time + Math.min(0.09, dur * 0.4));

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    fund.connect(g);
    over.connect(og).connect(g);
    this.connectPanned(g, 0.32, 0.42);

    fund.start(time);
    over.start(time);
    fund.stop(time + dur + 0.02);
    over.stop(time + dur + 0.02);
  }

  /** Smooth 90s G-funk / jazz-hop portamento synth lead. */
  private playSynthLead(
    time: number,
    fromMidi: number,
    toMidi: number,
    dur: number,
    vol: number,
  ): void {
    if (!this.ctx || !this.busFilter) return;
    const ctx = this.ctx;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(midiToHz(fromMidi), time);
    osc.frequency.exponentialRampToValueAtTime(midiToHz(toMidi), time + Math.min(0.09, dur * 0.3));

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1900, time);
    lp.frequency.exponentialRampToValueAtTime(1100, time + dur);
    lp.Q.value = 1.1;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.025);
    g.gain.setTargetAtTime(vol * 0.7, time + dur * 0.45, 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(lp).connect(g);
    this.connectPanned(g, 0.22, 0.38);

    osc.start(time);
    osc.stop(time + dur + 0.03);
  }

  /** Funky 90s muted brass / clavinet stab (scaled to prevent clipping). */
  private playFunkStab(time: number, notes: readonly number[], dur: number, vol: number): void {
    if (!this.ctx || !this.busFilter) return;
    const ctx = this.ctx;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, time);
    filter.frequency.exponentialRampToValueAtTime(820, time + dur);
    filter.Q.value = 1.5;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    filter.connect(g);
    this.connectPanned(g, -0.34, 0.35);

    const perVoice = 0.9 / Math.sqrt(Math.max(1, notes.length));
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(midiToHz(notes[i]), time);
      osc.detune.setValueAtTime((i - 1) * 5, time);
      const vg = ctx.createGain();
      vg.gain.value = perVoice;
      osc.connect(vg).connect(filter);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    }
  }

  /** Punchy 90s boom-bap vinyl kick (anti-click attack ramp, centered). */
  private playKick(time: number, vol: number): void {
    if (!this.ctx || !this.busFilter) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.085);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0008, time + 0.21);

    osc.connect(g);
    this.connectPanned(g, 0, 0);
    osc.start(time);
    osc.stop(time + 0.23);
  }

  /** Crisp 90s dusty snare (body + bandpass noise snap, subtle reverb). */
  private playSnare(time: number, vol: number): void {
    if (!this.ctx || !this.busFilter || !this.noiseBuf) return;
    const ctx = this.ctx;

    const body = ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.setValueAtTime(200, time);
    body.frequency.exponentialRampToValueAtTime(122, time + 0.055);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.0001, time);
    bg.gain.linearRampToValueAtTime(vol * 0.62, time + 0.003);
    bg.gain.exponentialRampToValueAtTime(0.0008, time + 0.11);
    body.connect(bg);
    this.connectPanned(bg, -0.04, 0.18);
    body.start(time);
    body.stop(time + 0.12);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2050, time);
    bp.Q.value = 0.95;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, time);
    ng.gain.linearRampToValueAtTime(vol * 0.85, time + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0008, time + 0.14);

    noise.connect(bp).connect(ng);
    this.connectPanned(ng, -0.04, 0.26);
    noise.start(time, Math.random() * 0.4, 0.15);
  }

  /** Crisp wooden rimshot / clave accent (panned right). */
  private playRimshot(time: number, vol: number): void {
    if (!this.ctx || !this.busFilter) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(840, time);
    osc.frequency.exponentialRampToValueAtTime(520, time + 0.025);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0005, time + 0.045);

    osc.connect(g);
    this.connectPanned(g, 0.34, 0.28);
    osc.start(time);
    osc.stop(time + 0.055);
  }

  /** Swung closed / open vinyl hi-hat with clean open-hat choke (panned right). */
  private playHiHat(time: number, open: boolean, vol: number): void {
    if (!this.ctx || !this.busFilter || !this.noiseBuf) return;
    const ctx = this.ctx;

    if (!open) {
      safeChoke(this.activeHatGain, time, 0.008);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(6900, time);

    const dur = open ? 0.22 : 0.045;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0006, time + dur);

    noise.connect(hp).connect(g);
    this.connectPanned(g, open ? 0.3 : 0.22, open ? 0.15 : 0.06);
    noise.start(time, Math.random() * 0.5, dur + 0.02);
    if (open) this.activeHatGain = g;
  }

  /** Soft swung shaker texture (panned left, balances hi-hats). */
  private playShaker(time: number, vol: number): void {
    if (!this.ctx || !this.busFilter || !this.noiseBuf) return;
    const ctx = this.ctx;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(5400, time);
    bp.Q.value = 1.4;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0005, time + 0.055);

    noise.connect(bp).connect(g);
    this.connectPanned(g, -0.28, 0.08);
    noise.start(time, Math.random() * 0.5, 0.065);
  }
}
