// Stadium PA announcer using SamJs (mobile-friendly, zero-model PCM TTS)
// routed directly through WebAudio pitch-shift, compression, stadium crunch,
// and stadium reverb, with dynamic envelope shapes modulating the PA effects.
import SamJs from 'sam-js';
import type { AnnouncerEvent } from './types';

export type EnvelopeShape = 'punchy' | 'swell' | 'staccato' | 'epic';

export interface AnnouncerProfile {
  shape: EnvelopeShape;
  /** SamJs pitch parameter (higher = deeper male voice; default 64). */
  samPitch: number;
  /** SamJs speed parameter (lower = faster). */
  samSpeed: number;
  /** SamJs throat/mouth formants for a chesty male announcer timbre. */
  samThroat: number;
  samMouth: number;
  /** WebAudio playbackRate (< 1.0 pitch-shifts down further). */
  playbackRate: number;
  crunchDrive: number;
  reverbMix: number;
  hornBoostDb: number;
  duckGain: number;
}

export interface EnvelopeSample {
  amp: number;
  crunch: number;
  reverb: number;
  filterNorm: number;
}

const SAM_SAMPLE_RATE = 22050;

/** Converts an AnnouncerEvent into crisp phonetic-friendly arcade announcer text. */
export function formatAnnouncerSpeech(ev: AnnouncerEvent): string {
  const clean = (s: string): string =>
    s
      .replace(/\+(\d+)/g, 'plus $1')
      .replace(/(\d+)\s*-\s*(\d+)/g, '$1 to $2')
      .replace(/[^a-zA-Z0-9\s']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const main = clean(ev.text);
  // Keep callouts short and punchy so SAM articulates clearly
  if (ev.big || !ev.subtext) return main;
  const sub = clean(ev.subtext);
  if (!sub || sub.length > 18) return main;
  return `${main} ${sub}`;
}

/** Classifies an AnnouncerEvent into a dynamic PA envelope & male-voice pitch profile. */
export function classifyAnnouncerProfile(ev: AnnouncerEvent): AnnouncerProfile {
  const upper = `${ev.text} ${ev.subtext ?? ''}`.toUpperCase();

  if (
    upper.includes('ON FIRE') ||
    upper.includes('BUZZER BEATER') ||
    upper.includes('OVERTIME') ||
    upper.includes('METEOR')
  ) {
    return {
      shape: 'epic',
      samPitch: 78,
      samSpeed: 74,
      samThroat: 120,
      samMouth: 122,
      playbackRate: 0.93,
      crunchDrive: 0.55,
      reverbMix: 0.58,
      hornBoostDb: 4.5,
      duckGain: 0.42,
    };
  }

  if (
    ev.big ||
    upper.includes('REJECTED') ||
    upper.includes('SHOVE') ||
    upper.includes('ALLEY-OOP') ||
    upper.includes('TOMAHAWK') ||
    upper.includes('WINDMILL') ||
    upper.includes('HELICOPTER') ||
    upper.includes('FLIP')
  ) {
    return {
      shape: 'punchy',
      samPitch: 76,
      samSpeed: 72,
      samThroat: 122,
      samMouth: 124,
      playbackRate: 0.95,
      crunchDrive: 0.48,
      reverbMix: 0.44,
      hornBoostDb: 4.0,
      duckGain: 0.48,
    };
  }

  if (
    upper.includes('PICKPOCKET') ||
    upper.includes('SWATTED') ||
    upper.includes('VIOLATION') ||
    upper.includes('DOWNTOWN') ||
    upper.includes('NOTHING BUT NET')
  ) {
    return {
      shape: 'staccato',
      samPitch: 72,
      samSpeed: 68,
      samThroat: 124,
      samMouth: 126,
      playbackRate: 0.97,
      crunchDrive: 0.38,
      reverbMix: 0.34,
      hornBoostDb: 3.5,
      duckGain: 0.55,
    };
  }

  return {
    shape: 'swell',
    samPitch: 74,
    samSpeed: 74,
    samThroat: 122,
    samMouth: 124,
    playbackRate: 0.95,
    crunchDrive: 0.35,
    reverbMix: 0.48,
    hornBoostDb: 3.0,
    duckGain: 0.5,
  };
}

/** Evaluates subtle envelope shapes over normalized time t in [0, 1]. */
export function evaluateEnvelope(shape: EnvelopeShape, tNorm: number): EnvelopeSample {
  const t = Math.max(0, Math.min(1, tNorm));

  switch (shape) {
    case 'punchy': {
      const attack = t < 0.06 ? t / 0.06 : 1;
      const decay = t < 0.06 ? 1 : Math.pow(1 - (t - 0.06) / 0.94, 1.45);
      const amp = 0.55 + 0.45 * attack * decay;
      return {
        amp,
        crunch: 0.35 + 0.65 * Math.pow(attack * decay, 0.8),
        reverb: 0.35 + 0.55 * (1 - t * 0.45),
        filterNorm: 0.3 + 0.7 * (attack * decay),
      };
    }
    case 'swell': {
      const rise = t < 0.35 ? Math.sin((t / 0.35) * Math.PI * 0.5) : 1;
      const fall = t > 0.7 ? Math.cos(((t - 0.7) / 0.3) * Math.PI * 0.5) : 1;
      const shapeVal = Math.max(0, rise * fall);
      return {
        amp: 0.65 + 0.35 * shapeVal,
        crunch: 0.25 + 0.55 * shapeVal,
        reverb: 0.45 + 0.45 * Math.sin(t * Math.PI),
        filterNorm: 0.25 + 0.6 * shapeVal,
      };
    }
    case 'staccato': {
      const pulse1 = Math.exp(-Math.pow((t - 0.16) / 0.14, 2));
      const pulse2 = 0.88 * Math.exp(-Math.pow((t - 0.56) / 0.16, 2));
      const shapeVal = Math.min(1, pulse1 + pulse2);
      return {
        amp: 0.6 + 0.4 * shapeVal,
        crunch: 0.4 + 0.55 * shapeVal,
        reverb: 0.25 + 0.38 * shapeVal,
        filterNorm: 0.4 + 0.6 * shapeVal,
      };
    }
    case 'epic': {
      const attack = t < 0.07 ? t / 0.07 : 1;
      const sustain = t < 0.6 ? 0.88 + 0.12 * Math.sin((t / 0.6) * Math.PI) : 1;
      const tail = t >= 0.6 ? Math.pow(1 - (t - 0.6) / 0.4, 1.2) : 1;
      const shapeVal = attack * sustain * tail;
      return {
        amp: 0.7 + 0.3 * shapeVal,
        crunch: 0.5 + 0.5 * shapeVal,
        reverb: 0.6 + 0.4 * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.85),
        filterNorm: 0.35 + 0.65 * shapeVal,
      };
    }
  }
}

/** Synthesizes raw mono Float32Array PCM speech at 22050 Hz using SamJs. */
export function synthesizeSpeechPcm(text: string, profile: AnnouncerProfile): Float32Array | null {
  if (!text.trim()) return null;
  try {
    const sam = new SamJs({
      pitch: profile.samPitch,
      speed: profile.samSpeed,
      throat: profile.samThroat,
      mouth: profile.samMouth,
    });
    const out = sam.buf32(text);
    if (out instanceof Float32Array && out.length > 0) {
      return out;
    }
    return null;
  } catch {
    return null;
  }
}

/** Asymmetric stadium PA horn saturation curve for subtle crunch. */
export function createStadiumCrunchCurve(driveAmount: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  const k = 0.8 + driveAmount * 2.5;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    const bias = x > 0 ? 1.03 : 0.97;
    curve[i] = ((1 + k) * x * bias) / (1 + k * Math.abs(x));
  }
  return curve;
}

/** Attenuates bus gain when multiple announcer lines overlap. */
export function stackGainMultiplier(activeCount: number): number {
  if (activeCount <= 1) return 1;
  return 1 / (1 + 0.55 * (activeCount - 1));
}

/** Synthesizes a 2.0s stereo stadium impulse response with arena slapback echoes. */
export function createStadiumReverbBuffer(ctx: BaseAudioContext): AudioBuffer {
  const dur = 2.0;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  const tapTimesSec = [0.036, 0.079, 0.132, 0.192];

  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const tSec = i / ctx.sampleRate;
      const tNorm = i / len;
      const attack = Math.min(1, tSec / 0.02);
      const decay = Math.pow(1 - tNorm, 2.15);
      const white = Math.random() * 2 - 1;
      lp = lp * 0.58 + white * 0.42;
      data[i] = lp * attack * decay * 0.58;
    }
    for (let k = 0; k < tapTimesSec.length; k++) {
      const idx = Math.floor((tapTimesSec[k] + ch * 0.009) * ctx.sampleRate);
      if (idx < len) {
        data[idx] += (0.45 - k * 0.08) * (ch === 0 ? 1 : -0.92);
      }
    }
  }
  return buf;
}

const ANNOUNCER_STORAGE_KEY = 'gnome-jam-announcer-enabled';

export class StadiumAnnouncer {
  private readonly getSfxGain: () => number;
  private readonly onDuckMusic?: (mult: number) => void;

  private enabled = true;
  private lastSpeakMs = 0;
  private activeSources = new Set<AudioBufferSourceNode>();

  // Stadium PA WebAudio graph
  private ctx: AudioContext | null = null;
  private paInput: GainNode | null = null;
  private hornPresence: BiquadFilterNode | null = null;
  private hornLp: BiquadFilterNode | null = null;
  private crunchDrive: GainNode | null = null;
  private reverbSend: GainNode | null = null;
  private paMaster: GainNode | null = null;

  constructor(getSfxGain: () => number, onDuckMusic?: (mult: number) => void) {
    this.getSfxGain = getSfxGain;
    this.onDuckMusic = onDuckMusic;
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem(ANNOUNCER_STORAGE_KEY) === 'false') {
        this.enabled = false;
      }
    } catch {
      // ignore storage access errors
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stop();
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ANNOUNCER_STORAGE_KEY, enabled ? 'true' : 'false');
      }
    } catch {
      // ignore storage access errors
    }
  }

  /** Kept for lifecycle symmetry with JamAudio.unlock(). */
  async init(): Promise<boolean> {
    return true;
  }

  private ensureGraph(ctx: AudioContext): void {
    if (this.paInput && this.ctx === ctx) return;
    this.ctx = ctx;

    this.paInput = ctx.createGain();
    this.paInput.gain.value = 1.0;

    // PA Horn EQ: tight low cut, arena horn presence, rolled-off top
    const hornHp = ctx.createBiquadFilter();
    hornHp.type = 'highpass';
    hornHp.frequency.value = 165;

    this.hornPresence = ctx.createBiquadFilter();
    this.hornPresence.type = 'peaking';
    this.hornPresence.frequency.value = 1750;
    this.hornPresence.Q.value = 1.35;
    this.hornPresence.gain.value = 4.5;

    this.hornLp = ctx.createBiquadFilter();
    this.hornLp.type = 'lowpass';
    this.hornLp.frequency.value = 5200;

    // Broadcast/PA compressor
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 6;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.14;

    // Subtle stadium crunch stage
    this.crunchDrive = ctx.createGain();
    this.crunchDrive.gain.value = 0.85;

    const crunchShaper = ctx.createWaveShaper();
    crunchShaper.curve = createStadiumCrunchCurve(0.32);
    crunchShaper.oversample = '2x';

    const crunchMakeup = ctx.createGain();
    crunchMakeup.gain.value = 0.55;

    // Dry + Stadium Reverb parallel buses (dry stays upfront for intelligibility)
    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.92;

    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.42;

    const convolver = ctx.createConvolver();
    convolver.buffer = createStadiumReverbBuffer(ctx);

    const revHp = ctx.createBiquadFilter();
    revHp.type = 'highpass';
    revHp.frequency.value = 240;

    const revLp = ctx.createBiquadFilter();
    revLp.type = 'lowpass';
    revLp.frequency.value = 3200;

    const revReturn = ctx.createGain();
    revReturn.gain.value = 0.24;

    this.paMaster = ctx.createGain();
    this.paMaster.gain.value = Math.max(0, Math.min(1, this.getSfxGain())) * 0.21;

    this.paInput.connect(hornHp);
    hornHp.connect(this.hornPresence);
    this.hornPresence.connect(this.hornLp);
    this.hornLp.connect(compressor);
    compressor.connect(this.crunchDrive);
    this.crunchDrive.connect(crunchShaper);
    crunchShaper.connect(crunchMakeup);

    crunchMakeup.connect(dryGain);
    dryGain.connect(this.paMaster);

    crunchMakeup.connect(this.reverbSend);
    this.reverbSend.connect(convolver);
    convolver.connect(revHp);
    revHp.connect(revLp);
    revLp.connect(revReturn);
    revReturn.connect(this.paMaster);

    this.paMaster.connect(ctx.destination);
  }

  private updateMasterGain(ctx: AudioContext, vol: number): void {
    if (!this.paMaster) return;
    const target = vol * 0.21 * stackGainMultiplier(this.activeSources.size);
    this.paMaster.gain.setTargetAtTime(target, ctx.currentTime, 0.015);
  }

  private applyDynamicEnvelope(ctx: AudioContext, profile: AnnouncerProfile, durSec: number, vol: number): void {
    if (!this.paInput || !this.crunchDrive || !this.reverbSend || !this.hornPresence || !this.hornLp || !this.paMaster) {
      return;
    }

    const now = ctx.currentTime;
    this.updateMasterGain(ctx, vol);

    const steps = 14;
    this.paInput.gain.cancelScheduledValues(now);
    this.crunchDrive.gain.cancelScheduledValues(now);
    this.reverbSend.gain.cancelScheduledValues(now);
    this.hornPresence.gain.cancelScheduledValues(now);
    this.hornLp.frequency.cancelScheduledValues(now);

    for (let i = 0; i <= steps; i++) {
      const tNorm = i / steps;
      const t = now + tNorm * durSec;
      const env = evaluateEnvelope(profile.shape, tNorm);
      const inVal = 0.8 + env.amp * 0.35;
      const driveVal = 0.72 + env.crunch * profile.crunchDrive * 0.55;
      const revVal = 0.16 + env.reverb * profile.reverbMix * 0.75;
      const hornDb = 1.0 + env.filterNorm * profile.hornBoostDb;
      const lpHz = 3400 + env.filterNorm * 2200;

      if (i === 0) {
        this.paInput.gain.setValueAtTime(inVal, t);
        this.crunchDrive.gain.setValueAtTime(driveVal, t);
        this.reverbSend.gain.setValueAtTime(revVal, t);
        this.hornPresence.gain.setValueAtTime(hornDb, t);
        this.hornLp.frequency.setValueAtTime(lpHz, t);
      } else {
        this.paInput.gain.linearRampToValueAtTime(inVal, t);
        this.crunchDrive.gain.linearRampToValueAtTime(driveVal, t);
        this.reverbSend.gain.linearRampToValueAtTime(revVal, t);
        this.hornPresence.gain.linearRampToValueAtTime(hornDb, t);
        this.hornLp.frequency.linearRampToValueAtTime(lpHz, t);
      }
    }
  }

  /** Synthesizes and plays an announcer event through the stadium PA WebAudio graph. */
  announce(ctx: AudioContext | null, ev: AnnouncerEvent): void {
    if (!this.enabled) return;
    const sfx = this.getSfxGain();
    if (!ctx || sfx <= 0.001) return;

    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (!ev.big && nowMs - this.lastSpeakMs < 420) return;
    this.lastSpeakMs = nowMs;

    const profile = classifyAnnouncerProfile(ev);
    const text = formatAnnouncerSpeech(ev);
    const pcm = synthesizeSpeechPcm(text, profile);
    if (!pcm) return;

    if (ev.big && this.activeSources.size > 0) {
      this.stop();
    }

    this.ensureGraph(ctx);
    if (!this.paInput) return;

    const audioBuf = ctx.createBuffer(1, pcm.length, SAM_SAMPLE_RATE);
    audioBuf.getChannelData(0).set(pcm);

    const src = ctx.createBufferSource();
    src.buffer = audioBuf;
    src.playbackRate.value = profile.playbackRate;

    this.activeSources.add(src);
    const durSec = audioBuf.duration / profile.playbackRate;
    this.applyDynamicEnvelope(ctx, profile, durSec, sfx);

    this.onDuckMusic?.(profile.duckGain);
    src.onended = () => {
      this.activeSources.delete(src);
      this.updateMasterGain(ctx, this.getSfxGain());
      if (this.activeSources.size === 0) {
        this.onDuckMusic?.(1.0);
      }
    };

    src.connect(this.paInput);
    src.start(ctx.currentTime);
  }

  stop(): void {
    for (const src of this.activeSources) {
      try {
        src.stop();
      } catch {
        // ignore
      }
    }
    this.activeSources.clear();
    if (this.ctx) {
      this.updateMasterGain(this.ctx, this.getSfxGain());
    }
    this.onDuckMusic?.(1.0);
  }
}
