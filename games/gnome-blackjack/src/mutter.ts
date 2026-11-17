// Deep Animal-Crossing-style muttering and small sound effects, all WebAudio.
import { volume } from './volume';

export type Sfx = 'card' | 'chip' | 'tick' | 'win' | 'lose' | 'shotgun';

const MAX_LETTERS = 48;
const MAX_VOICES = 2;
const MASTER_LOWPASS_HZ = 2600;

interface Engine {
  ctx: AudioContext;
  master: GainNode;
}

interface Voice {
  oscs: OscillatorNode[];
  end: number;
}

let engine: Engine | null = null;
const voices: Voice[] = [];

// Muted when the URL hash contains "mute".
function silent(): boolean {
  try {
    return typeof location !== 'undefined' && location.hash.includes('mute');
  } catch {
    return false;
  }
}

// The engine if it exists and sound is allowed; also sets the master gain.
function ready(): Engine | null {
  if (!engine || silent()) return null;
  engine.master.gain.value = volume.effective('sounds');
  return engine;
}

export function unlockAudio(): void {
  if (silent()) return;
  if (!engine) {
    if (typeof AudioContext === 'undefined') return;
    try {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = MASTER_LOWPASS_HZ;
      master.connect(lowpass);
      lowpass.connect(ctx.destination);
      engine = { ctx, master };
    } catch {
      return;
    }
  }
  engine.ctx.resume().catch(() => {});
}

// Vowel formants [F1, F2] in Hz.
function vowelFormants(ch: string): [number, number] | null {
  switch (ch) {
    case 'a': return [750, 1150];
    case 'e': return [420, 1900];
    case 'i':
    case 'y': return [300, 2200];
    case 'o': return [460, 800];
    case 'u': return [330, 700];
    default: return null;
  }
}

type Tok =
  | { k: 'blip'; ch: string; word: number; mul: number; vowel: boolean; f: [number, number] }
  | { k: 'gap'; dur: number };

// Turns text into blips and pauses, with pitch multipliers for sentence endings.
function plan(text: string): Tok[] {
  const toks: Tok[] = [];
  let letters = 0;
  let word = 0;
  let sentence: number[] = []; // token indexes of blips in the current sentence

  for (const c of text) {
    if (/[a-z]/i.test(c)) {
      if (letters >= MAX_LETTERS) break;
      letters++;
      const ch = c.toLowerCase();
      const vowel = vowelFormants(ch) !== null;
      sentence.push(toks.length);
      toks.push({ k: 'blip', ch, word, mul: 1, vowel, f: vowelFormants(ch) ?? [500, 1400] });
      continue;
    }
    word++;
    if (c === ' ') toks.push({ k: 'gap', dur: 0.04 });
    else if (c === ',') toks.push({ k: 'gap', dur: 0.12 });
    else if (c === '.' || c === '!' || c === '?') {
      toks.push({ k: 'gap', dur: 0.18 });
      const last = sentence.slice(-3);
      if (c === '?') {
        last.forEach((ti, i) => {
          const b = toks[ti];
          if (b.k === 'blip') b.mul *= 1 + (0.25 * (i + 1)) / last.length;
        });
      } else if (c === '!') {
        for (const ti of last) {
          const b = toks[ti];
          if (b.k === 'blip') b.mul *= 1.15;
        }
      }
      sentence = [];
    }
    // other characters are skipped
  }

  // Consonants borrow the formants of the next vowel in their word.
  let nextVowel: { word: number; f: [number, number] } | null = null;
  for (let i = toks.length - 1; i >= 0; i--) {
    const t = toks[i];
    if (t.k !== 'blip') continue;
    if (t.vowel) {
      nextVowel = { word: t.word, f: t.f };
    } else if (nextVowel && nextVowel.word === t.word) {
      t.f = nextVowel.f;
    }
  }
  return toks;
}

// One blip: a saw plus a square an octave down, through two formant bandpasses.
function blip(
  c: AudioContext,
  out: AudioNode,
  t: number,
  pitch: number,
  f: [number, number],
  vowel: boolean,
  oscs: OscillatorNode[],
): void {
  const saw = c.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.setValueAtTime(pitch, t);
  const sq = c.createOscillator();
  sq.type = 'square';
  sq.frequency.setValueAtTime(pitch / 2, t);
  const sqGain = c.createGain();
  sqGain.gain.value = 0.5;
  sq.connect(sqGain);

  const env = c.createGain();
  const peak = vowel ? 0.22 : 0.14;
  const decay = vowel ? 0.02 : 0.012;
  const end = vowel ? 0.055 : 0.04;
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + 0.008);
  env.gain.setValueAtTime(peak, t + decay);
  env.gain.linearRampToValueAtTime(0, t + end);
  env.connect(out);

  for (const hz of f) {
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = hz;
    bp.Q.value = 5;
    saw.connect(bp);
    sqGain.connect(bp);
    bp.connect(env);
  }

  saw.start(t);
  sq.start(t);
  saw.stop(t + 0.07);
  sq.stop(t + 0.07);
  oscs.push(saw, sq);
}

function stopVoice(v: Voice): void {
  for (const o of v.oscs) {
    try {
      o.stop();
    } catch {
      // already stopped
    }
  }
}

export function mutter(text: string, voiceHz: number): void {
  const e = ready();
  if (!e) return;
  const c = e.ctx;

  const now = c.currentTime;
  for (let i = voices.length - 1; i >= 0; i--) {
    if (voices[i].end < now) voices.splice(i, 1);
  }
  while (voices.length >= MAX_VOICES) {
    const old = voices.shift();
    if (old) stopVoice(old);
  }

  const toks = plan(text);
  if (!toks.some((t) => t.k === 'blip')) return;

  const voice: Voice = { oscs: [], end: now };
  let t = now + 0.02;
  for (const tok of toks) {
    if (tok.k === 'gap') {
      t += tok.dur;
      continue;
    }
    const code = tok.ch.charCodeAt(0);
    const pitch =
      voiceHz *
      (1 + (((code * 7) % 12) - 6) / 45) *
      (0.96 + Math.random() * 0.08) *
      tok.mul;
    blip(c, e.master, t, pitch, tok.f, tok.vowel, voice.oscs);
    t += 0.068;
  }
  voice.end = t + 0.07;
  voices.push(voice);
}

// One short oscillator note with a click-free envelope.
function tone(
  c: AudioContext,
  out: AudioNode,
  type: OscillatorType,
  freq: number,
  t: number,
  dur: number,
  peak: number,
): void {
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.004);
  g.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(g);
  g.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

// 40 ms of white noise through a bandpass, quick decay.
function cardNoise(c: AudioContext, out: AudioNode, t: number): void {
  const len = Math.round(c.sampleRate * 0.04);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3200;
  bp.Q.value = 1.5;
  const g = c.createGain();
  g.gain.setValueAtTime(0.25, t);
  g.gain.linearRampToValueAtTime(0, t + 0.04);
  src.connect(bp);
  bp.connect(g);
  g.connect(out);
  src.start(t);
  src.stop(t + 0.04);
}

function shotgunBlast(c: AudioContext, out: AudioNode, t: number): void {
  const dur = 0.24;
  const len = Math.round(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp((-i / len) * 4.5);
  const src = c.createBufferSource();
  src.buffer = buf;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(2400, t);
  lp.frequency.exponentialRampToValueAtTime(220, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.65, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(lp);
  lp.connect(g);
  g.connect(out);
  src.start(t);
  src.stop(t + dur);

  // Low chest-thump punch.
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(38, t + 0.14);
  const og = c.createGain();
  og.gain.setValueAtTime(0.55, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.16);
}

export function sfx(kind: Sfx): void {
  const e = ready();
  if (!e) return;
  const c = e.ctx;
  const out = e.master;
  const t = c.currentTime + 0.01;
  switch (kind) {
    case 'card':
      cardNoise(c, out, t);
      break;
    case 'chip':
      tone(c, out, 'sine', 2100, t, 0.025, 0.25);
      tone(c, out, 'sine', 2700, t + 0.03, 0.025, 0.25);
      break;
    case 'tick':
      tone(c, out, 'sine', 1200, t, 0.03, 0.25);
      break;
    case 'win':
      [523, 659, 784].forEach((f, i) => tone(c, out, 'triangle', f, t + i * 0.09, 0.09, 0.25));
      break;
    case 'lose':
      [330, 247].forEach((f, i) => tone(c, out, 'triangle', f, t + i * 0.16, 0.16, 0.25));
      break;
    case 'shotgun':
      shotgunBlast(c, out, t);
      shotgunBlast(c, out, t + 0.09);
      break;
  }
}
