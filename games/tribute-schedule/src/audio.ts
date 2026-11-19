import type { SimState } from './sim/types';

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let coneOsc: OscillatorNode | null = null;
let coneGain: GainNode | null = null;
let muted = false;

const FRIDGE_NOTES = [261.63, 293.66, 329.63, 246.94, 220.0, 293.66, 392.0];

export function initAudio(): void {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  ctx = new AudioCtx();
  masterGain = ctx.createGain();
  masterGain.gain.value = muted ? 0 : 0.35;
  masterGain.connect(ctx.destination);

  // Continuous low cone hum
  coneOsc = ctx.createOscillator();
  coneOsc.type = 'sawtooth';
  coneOsc.frequency.value = 54;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 140;

  coneGain = ctx.createGain();
  coneGain.gain.value = 0.08;
  coneOsc.connect(filter);
  filter.connect(coneGain);
  coneGain.connect(masterGain);
  coneOsc.start();
}

export function setMuted(m: boolean): void {
  muted = m;
  if (masterGain && ctx) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 0.35, ctx.currentTime, 0.05);
  }
}

export function isMuted(): boolean {
  return muted;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.2): void {
  if (!ctx || !masterGain || muted) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function updateAudio(sim: SimState): void {
  if (!ctx || !coneGain || !coneOsc) return;

  // Cone hum stops dead during the sacred pause
  const targetConeGain = sim.cone.pausedTimer > 0 ? 0 : 0.05 + sim.cone.rpm * 0.03;
  coneGain.gain.setTargetAtTime(targetConeGain, ctx.currentTime, 0.08);
  coneOsc.frequency.setTargetAtTime(48 + sim.cone.rpm * 8, ctx.currentTime, 0.1);

  if (sim.events.fridgeNoteIndex >= 0) {
    const freq = FRIDGE_NOTES[sim.events.fridgeNoteIndex % FRIDGE_NOTES.length];
    playTone(freq, 0.38, 'triangle', 0.22);
  }
  if (sim.events.smokeChirp) {
    playTone(2850, 0.09, 'square', 0.18);
    setTimeout(() => playTone(2850, 0.09, 'square', 0.18), 160);
  }
  if (sim.events.chirpPerformed) {
    playTone(2400, 0.08, 'sine', 0.16);
  }
  if (sim.events.nodPerformed) {
    playTone(180, 0.07, 'triangle', 0.15);
  }
  if (sim.events.toasterPop) {
    playTone(620, 0.11, 'square', 0.12);
  }
  if (sim.events.printerJam) {
    playTone(135, 0.28, 'sawtooth', 0.14);
  }
  if (sim.events.tributeAccepted) {
    playTone(330, 0.25, 'sine', 0.18);
    setTimeout(() => playTone(440, 0.35, 'sine', 0.15), 110);
  }
  if (sim.events.tributeRejected) {
    playTone(110, 0.45, 'sawtooth', 0.22);
  }
}
