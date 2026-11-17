import type { SimEvent, SimState } from './sim/types';
import { volume } from './volume';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let droneOsc: OscillatorNode | null = null;
let droneGain: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

let nextHeartbeatAt = 0;
let lastStepPhase = 0;

function effectiveGain(): number {
  return 0.55 * volume.effective('sounds');
}

function applyVolume(): void {
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(effectiveGain(), ctx.currentTime, 0.02);
}

volume.subscribe(applyVolume);

export function initAudio(): void {
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
    master.gain.value = effectiveGain();
    master.connect(ctx.destination);

    // Subtle low subterranean house drone
    droneOsc = ctx.createOscillator();
    droneGain = ctx.createGain();
    droneOsc.type = 'triangle';
    droneOsc.frequency.value = 46;
    droneGain.gain.value = 0.08;
    droneOsc.connect(droneGain);
    droneGain.connect(master);
    droneOsc.start();
  } catch {
    ctx = null;
    master = null;
  }
}

function tone(
  f0: number,
  f1: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  delay = 0,
): void {
  if (!ctx || !master) return;
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, f0), now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + dur);
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(now);
  osc.stop(now + dur);
}

function noiseBurst(dur: number, vol: number, lowpass = 900): void {
  if (!ctx || !master) return;
  if (!noiseBuf) {
    const len = Math.floor(ctx.sampleRate * 0.4);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  const now = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start(now);
  src.stop(now + dur);
}

function playEvent(ev: SimEvent): void {
  switch (ev.kind) {
    case 'shard_pickup':
      tone(540, 920, 0.22, 'sine', 0.16);
      tone(810, 1220, 0.24, 'triangle', 0.1, 0.06);
      break;
    case 'kiln_shatter':
      noiseBurst(0.35, 0.34, 2400);
      tone(320, 95, 0.4, 'sawtooth', 0.18);
      break;
    case 'acorn_pickup':
      tone(220, 310, 0.14, 'triangle', 0.16);
      break;
    case 'snare_sprung':
      noiseBurst(0.22, 0.38, 1800);
      tone(190, 55, 0.25, 'square', 0.2);
      break;
    case 'snare_hurt':
      noiseBurst(0.25, 0.42, 2000);
      tone(160, 48, 0.3, 'sawtooth', 0.24);
      break;
    case 'bell_rung':
      tone(660, 654, 1.1, 'sine', 0.22);
      tone(990, 982, 0.9, 'sine', 0.12, 0.02);
      break;
    case 'exit_unlocked':
      tone(440, 660, 0.35, 'sine', 0.18);
      tone(660, 880, 0.45, 'sine', 0.16, 0.14);
      break;
    case 'escaped':
      tone(523, 784, 0.4, 'triangle', 0.2);
      tone(784, 1046, 0.6, 'sine', 0.18, 0.18);
      break;
    case 'monster_alert':
      tone(110, 290, 0.42, 'sawtooth', 0.16);
      tone(118, 275, 0.45, 'triangle', 0.12, 0.04);
      break;
    case 'hurt':
    case 'caught':
      noiseBurst(0.28, 0.35, 1100);
      tone(140, 45, 0.35, 'sawtooth', 0.25);
      break;
    case 'lantern_toggle':
      tone(ev.detail === 'on' ? 420 : 240, ev.detail === 'on' ? 580 : 140, 0.08, 'triangle', 0.1);
      break;
  }
}

export function updateAudio(state: SimState): void {
  if (!ctx || !master || ctx.state !== 'running') return;

  for (const ev of state.events) {
    playEvent(ev);
  }

  // Modulate drone with Director tension & Dream Drag
  if (droneOsc && droneGain) {
    const targetFreq = 44 + state.director.tension * 22 - state.director.dreamDrag * 10;
    const targetVol = 0.05 + state.director.tension * 0.12;
    droneOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
    droneGain.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.1);
  }

  // Heartbeat driven by Director heartbeatRate
  if (state.director.tension > 0.25 && state.time >= nextHeartbeatAt) {
    const period = 60 / Math.max(55, state.director.heartbeatRate);
    nextHeartbeatAt = state.time + period;
    const vol = Math.min(0.26, 0.06 + state.director.tension * 0.2);
    tone(68, 36, 0.12, 'sine', vol);
    tone(58, 32, 0.1, 'sine', vol * 0.7, 0.14);
  }

  // Soft floorboard footstep on stepPhase wrap
  const stepCount = Math.floor(state.player.stepPhase / Math.PI);
  if (stepCount !== lastStepPhase) {
    lastStepPhase = stepCount;
    noiseBurst(0.06, state.player.crouching ? 0.03 : 0.07, 420);
  }
}
