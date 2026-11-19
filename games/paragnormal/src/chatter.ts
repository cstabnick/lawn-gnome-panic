// Spatial 3D monster chattering/muttering, adapted from gnome-blackjack's formant mutter synthesizer
// and routed through WebAudio HRTF PannerNodes positioned at each giant Gnome-Soul.
import type { MonsterKind, MonsterState, SimState } from './sim/types';
import { volume } from './volume';

// What each Gnome-Soul says. The lines hint at its habit; none of them answers what it is.
const PHRASES: Record<MonsterKind, string[]> = {
  gardener: [
    'under the table... i hear tiny boots',
    'porcelain cracks in the dark...',
    'shhh... where did the little hat go',
    'cold clay... come out and play',
    'i smell moss and lantern oil...',
  ],
  watcher: [
    'three bells... do not touch the bells',
    'tick tock... tiny gnome in the hall',
    'the door at the end... it is always open',
    'i count the little ones. i never reach the end',
  ],
  lamplighter: [
    'pretty flame... let it gutter',
    'light draws the eye, little one',
    'the wick is tired. it always goes out',
    'i snuff the small suns, one by one',
  ],
  crawler: [
    'drip... drip... under the bed',
    'i crawl where the tall ones never look',
    'scratch scratch... behind the wardrobe',
    'wet clay on the floorboards, tiny feet',
  ],
  hush: [
    'hush... hush... no one is here',
    'do not run. i can hear you running',
    'keep very still... i am very still too',
    'the clock is loud. you are quiet. good',
  ],
};

interface MonsterVoice {
  panner: PannerNode;
  nextSpeakAt: number;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const voices = new Map<number, MonsterVoice>();

function applyVolume(): void {
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(0.42 * volume.effective('sounds'), ctx.currentTime, 0.03);
}

volume.subscribe(applyVolume);

export function initSpatialChatter(): void {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  try {
    try {
      ctx = new AudioContext({ sampleRate: 48000 });
    } catch {
      ctx = new AudioContext();
    }
    master = ctx.createGain();
    master.gain.value = 0.42 * volume.effective('sounds');

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2100;
    master.connect(lp);
    lp.connect(ctx.destination);
  } catch {
    ctx = null;
    master = null;
  }
}

function vowelFormants(ch: string): [number, number] | null {
  switch (ch) {
    case 'a': return [720, 1120];
    case 'e': return [410, 1820];
    case 'i':
    case 'y': return [290, 2100];
    case 'o': return [450, 780];
    case 'u': return [320, 680];
    default: return null;
  }
}

function getOrCreateVoice(m: MonsterState, now: number): MonsterVoice | null {
  if (!ctx || !master) return null;
  let v = voices.get(m.id);
  if (!v) {
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 2.2;
    panner.maxDistance = 26;
    panner.rolloffFactor = 1.35;
    panner.connect(master);
    v = { panner, nextSpeakAt: now + 1.5 + m.id * 2.2 };
    voices.set(m.id, v);
  }
  return v;
}

let whisperBuf: AudioBuffer | null = null;

function whisperSource(): AudioBufferSourceNode | null {
  if (!ctx) return null;
  if (!whisperBuf) {
    const len = Math.floor(ctx.sampleRate * 0.3);
    whisperBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = whisperBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = whisperBuf;
  src.loop = true;
  return src;
}

function speakSpatialPhrase(m: MonsterState, voice: MonsterVoice, text: string): void {
  if (!ctx) return;
  const alert = m.state === 'chase' ? 1 : m.state === 'investigate' ? 0.6 : 0;
  // Each kind has its own voice: the Dripping Nanny is a wet low gurgle, the Lamplighter a thin bright rasp,
  // and the Hush has no voice at all, only breath shaped into the vowels.
  const basePitch =
    m.kind === 'lamplighter' ? 150 + alert * 20 : m.kind === 'crawler' ? 70 + alert * 14 : 88 + alert * 44;
  const stepDur = m.state === 'chase' ? 0.045 : 0.062;
  const whisper = m.kind === 'hush';
  let t = ctx.currentTime + 0.02;
  let letters = 0;

  for (const raw of text) {
    if (letters >= 28) break;
    if (raw === ' ' || raw === '.') {
      t += raw === '.' ? 0.11 : 0.04;
      continue;
    }
    const ch = raw.toLowerCase();
    const formants = vowelFormants(ch) ?? [480, 1320];
    const isVowel = vowelFormants(ch) !== null;
    letters++;

    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = whisper ? formants[1] * 0.9 : formants[0] * 0.85;
    f1.Q.value = whisper ? 2.5 : 4.5;

    const g = ctx.createGain();
    const amp = whisper ? (isVowel ? 0.09 : 0.05) : isVowel ? 0.16 : 0.08;
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(amp, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + stepDur);

    let source: AudioScheduledSourceNode | null;
    if (whisper) {
      source = whisperSource();
    } else {
      const o = ctx.createOscillator();
      o.type = m.kind === 'crawler' ? 'triangle' : isVowel ? 'sawtooth' : 'triangle';
      const jitter = 0.92 + Math.random() * 0.16;
      o.frequency.setValueAtTime(basePitch * jitter, t);
      o.frequency.exponentialRampToValueAtTime(basePitch * jitter * 0.88, t + stepDur);
      source = o;
    }
    if (!source) continue;

    source.connect(f1);
    f1.connect(g);
    g.connect(voice.panner);

    source.start(t);
    source.stop(t + stepDur + 0.01);
    t += stepDur * 0.88;
  }
}

export function updateSpatialChatter(state: SimState): void {
  if (!ctx || !master || ctx.state !== 'running') return;

  // Update 3D AudioListener from player camera pose
  const p = state.player;
  const listener = ctx.listener;
  const fwdX = -Math.sin(p.yaw);
  const fwdZ = -Math.cos(p.yaw);

  if (listener.positionX) {
    listener.positionX.setTargetAtTime(p.x, ctx.currentTime, 0.02);
    listener.positionY.setTargetAtTime(p.y, ctx.currentTime, 0.02);
    listener.positionZ.setTargetAtTime(p.z, ctx.currentTime, 0.02);
    listener.forwardX.setTargetAtTime(fwdX, ctx.currentTime, 0.02);
    listener.forwardY.setTargetAtTime(0, ctx.currentTime, 0.02);
    listener.forwardZ.setTargetAtTime(fwdZ, ctx.currentTime, 0.02);
    listener.upX.setTargetAtTime(0, ctx.currentTime, 0.02);
    listener.upY.setTargetAtTime(1, ctx.currentTime, 0.02);
    listener.upZ.setTargetAtTime(0, ctx.currentTime, 0.02);
  } else {
    listener.setPosition(p.x, p.y, p.z);
    listener.setOrientation(fwdX, 0, fwdZ, 0, 1, 0);
  }

  for (const m of state.monsters) {
    const v = getOrCreateVoice(m, state.time);
    if (!v) continue;

    if (v.panner.positionX) {
      v.panner.positionX.setTargetAtTime(m.x, ctx.currentTime, 0.03);
      v.panner.positionY.setTargetAtTime(2.4, ctx.currentTime, 0.03);
      v.panner.positionZ.setTargetAtTime(m.z, ctx.currentTime, 0.03);
    } else {
      v.panner.setPosition(m.x, 2.4, m.z);
    }

    const dist = Math.hypot(m.x - p.x, m.z - p.z);
    if (state.time >= v.nextSpeakAt && dist < 20) {
      const lines = PHRASES[m.kind];
      const phrase = lines[Math.floor(Math.random() * lines.length)];
      speakSpatialPhrase(m, v, phrase);
      const cooldown = m.state === 'chase' ? 2.4 : m.state === 'investigate' ? 3.8 : 6.0;
      v.nextSpeakAt = state.time + cooldown + Math.random() * 2.5;
    }
  }
}
