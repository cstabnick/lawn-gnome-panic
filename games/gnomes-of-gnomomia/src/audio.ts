// WebAudio sound effects, a quiet lute-like ambience, and the mute toggle (key M).
// The AudioContext is made on the first click or key press, since browsers block sound before that.
import { PLAYER_ID } from './config';
import { bus, type GameEvents } from './events';
import { onSettingsChange, settings, updateSettings } from './settings';

const AMBIENCE_NOTES = [220, 261.6, 293.7, 329.6, 392, 440]; // A minor pentatonic

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambienceTimer: number | null = null;

function applyGain(): void {
  if (master) master.gain.value = settings.muted ? 0 : settings.volume;
}

/** Creates the context and master gain once. Called from a user gesture. */
function ensureContext(): void {
  if (ctx) return;
  try {
    ctx = new AudioContext();
    master = ctx.createGain();
    applyGain();
    master.connect(ctx.destination);
    startAmbience();
  } catch {
    ctx = null;
    master = null;
  }
}

/** The live context and master gain, or null before the first gesture or while muted. */
function out(): { c: AudioContext; m: GainNode } | null {
  if (!ctx || !master || settings.muted) return null;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return { c: ctx, m: master };
}

/** One oscillator through a gain envelope: quick attack, exponential decay, frequency sweep. */
function tone(
  freq: number,
  endFreq: number,
  seconds: number,
  type: OscillatorType,
  volume: number,
  delay = 0,
): void {
  const o = out();
  if (!o) return;
  const { c, m } = o;
  const start = c.currentTime + delay;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(endFreq, start + seconds);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);

  osc.connect(gain);
  gain.connect(m);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

/** A short burst of white noise through a lowpass filter. */
function noise(seconds: number, filterFreq: number, volume: number): void {
  const o = out();
  if (!o) return;
  const { c, m } = o;
  const now = c.currentTime;

  const len = Math.max(1, Math.floor(c.sampleRate * seconds));
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(m);
  src.start(now);
  src.stop(now + seconds);
}

/** Subscribe to a bus event; a failing sound must never break the game. */
function onEvent<K extends keyof GameEvents>(type: K, fn: (payload: GameEvents[K]) => void): void {
  bus.on(type, (payload) => {
    try {
      fn(payload);
    } catch {
      // Audio must never break the game.
    }
  });
}

function startAmbience(): void {
  if (ambienceTimer !== null) return;
  ambienceTimer = window.setInterval(() => {
    if (Math.random() < 0.45) {
      const note = AMBIENCE_NOTES[Math.floor(Math.random() * AMBIENCE_NOTES.length)];
      tone(note, note, 1.2, 'triangle', 0.04);
    }
  }, 700);
}

function toggleMute(): void {
  updateSettings({ muted: !settings.muted });
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function initAudio(): void {
  onSettingsChange(applyGain);
  // Sounds for game events.
  onEvent('hit', (e) => {
    if (e.spell) noise(0.3, 900, 0.4); // spell whoosh
    else if (e.target === PLAYER_ID) tone(110, 50, 0.15, 'square', 0.3); // lower thud
    else if (e.attacker === PLAYER_ID) {
      noise(0.08, 1800, 0.5); // thwack
      tone(160, 80, 0.1, 'square', 0.2);
    }
  });
  onEvent('miss', () => noise(0.12, 600, 0.2));
  onEvent('skill-up', () => {
    tone(660, 660, 0.15, 'sine', 0.15);
    tone(990, 990, 0.15, 'sine', 0.15, 0.15);
  });
  onEvent('level-up', () => {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.3, 'triangle', 0.2, i * 0.12));
  });
  onEvent('item-added', () => tone(880, 1200, 0.07, 'sine', 0.15));
  onEvent('enemy-killed', () => tone(300, 90, 0.35, 'sawtooth', 0.15));
  onEvent('player-died', () => tone(400, 60, 1.2, 'triangle', 0.3));
  onEvent('heal', () => tone(400, 900, 0.4, 'sine', 0.2));
  onEvent('quest-updated', () => {
    tone(784, 784, 0.15, 'triangle', 0.2);
    tone(1046, 1046, 0.25, 'triangle', 0.2, 0.15);
  });

  // The first click or key press creates the context. Key M also toggles mute.
  window.addEventListener('pointerdown', ensureContext);
  window.addEventListener('keydown', (e) => {
    ensureContext();
    if ((e.key === 'm' || e.key === 'M') && !e.repeat && !isTyping(e.target)) toggleMute();
  });
}
