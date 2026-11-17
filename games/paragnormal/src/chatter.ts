// Spatial 3D monster chattering/muttering, adapted from gnome-blackjack's formant mutter synthesizer
// and routed through WebAudio HRTF PannerNodes positioned at each giant Gnome-Soul.
import type { MonsterState, SimState } from './sim/types';
import { volume } from './volume';

const PHRASES = [
  'under the table... i hear tiny boots',
  'porcelain cracks in the dark...',
  'shhh... where did the little hat go',
  'cold clay... come out and play',
  'three bells... do not touch the bells',
  'tick tock... tiny gnome in the hall',
  'i smell moss and lantern oil...',
];

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

function speakSpatialPhrase(m: MonsterState, voice: MonsterVoice, text: string): void {
  if (!ctx) return;
  const basePitch = m.state === 'chase' ? 132 : m.state === 'investigate' ? 108 : 88;
  const stepDur = m.state === 'chase' ? 0.045 : 0.062;
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

    const osc = ctx.createOscillator();
    osc.type = isVowel ? 'sawtooth' : 'triangle';
    const jitter = 0.92 + Math.random() * 0.16;
    osc.frequency.setValueAtTime(basePitch * jitter, t);
    osc.frequency.exponentialRampToValueAtTime(basePitch * jitter * 0.88, t + stepDur);

    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = formants[0] * 0.85;
    f1.Q.value = 4.5;

    const g = ctx.createGain();
    const amp = isVowel ? 0.16 : 0.08;
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(amp, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + stepDur);

    osc.connect(f1);
    f1.connect(g);
    g.connect(voice.panner);

    osc.start(t);
    osc.stop(t + stepDur + 0.01);
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
      const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
      speakSpatialPhrase(m, v, phrase);
      const cooldown = m.state === 'chase' ? 2.4 : m.state === 'investigate' ? 3.8 : 6.0;
      v.nextSpeakAt = state.time + cooldown + Math.random() * 2.5;
    }
  }
}
