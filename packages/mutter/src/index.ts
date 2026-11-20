// Animal-Crossing-style muttering (the Gnome Blackjack voice) as a reusable WebAudio engine.

export interface MutterOptions {
  /** Master gain 0..1, read each time a line starts. */
  gain: () => number;
}

export interface SayOptions {
  /** Cap on voiced letters. Blackjack uses 48. */
  maxLetters?: number;
}

export interface Mutter {
  /** Create/resume the AudioContext. Call from a user gesture. */
  unlock(): void;
  /** Speak `text` at base pitch `hz`. Returns the line's duration in seconds (0 if nothing will play). */
  say(text: string, hz: number, opts?: SayOptions): number;
  /** Duration `say` would take, without playing. */
  estimate(text: string, opts?: SayOptions): number;
  stop(): void;
}

const DEFAULT_MAX_LETTERS = 48;
const MAX_VOICES = 2;
const MASTER_LOWPASS_HZ = 2600;
const BLIP_STEP = 0.068;

/** Vowel formants [F1, F2] in Hz. */
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

export type Tok =
  | { k: 'blip'; ch: string; word: number; mul: number; vowel: boolean; f: [number, number] }
  | { k: 'gap'; dur: number };

/** Turns text into blips and pauses, with pitch multipliers for sentence endings. */
export function planMutter(text: string, maxLetters = DEFAULT_MAX_LETTERS): Tok[] {
  const toks: Tok[] = [];
  let letters = 0;
  let word = 0;
  let sentence: number[] = [];

  for (const c of text) {
    if (/[a-z]/i.test(c)) {
      if (letters >= maxLetters) break;
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
  }

  // Consonants borrow the formants of the next vowel in their word.
  let nextVowel: { word: number; f: [number, number] } | null = null;
  for (let i = toks.length - 1; i >= 0; i--) {
    const t = toks[i];
    if (t.k !== 'blip') continue;
    if (t.vowel) nextVowel = { word: t.word, f: t.f };
    else if (nextVowel && nextVowel.word === t.word) t.f = nextVowel.f;
  }
  return toks;
}

function durationOf(toks: readonly Tok[]): number {
  let t = 0.02;
  for (const tok of toks) t += tok.k === 'gap' ? tok.dur : BLIP_STEP;
  return t + 0.07;
}

/** One blip: a saw plus a square an octave down, through two formant bandpasses. */
function blip(c: AudioContext, out: AudioNode, t: number, pitch: number, f: [number, number], vowel: boolean, oscs: OscillatorNode[]): void {
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

interface Voice {
  oscs: OscillatorNode[];
  end: number;
}

function silent(): boolean {
  try {
    return typeof location !== 'undefined' && location.hash.includes('mute');
  } catch {
    return false;
  }
}

export function createMutter(options: MutterOptions): Mutter {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  const voices: Voice[] = [];

  function stopVoice(v: Voice): void {
    for (const o of v.oscs) {
      try {
        o.stop();
      } catch {
        // already stopped
      }
    }
  }

  return {
    unlock() {
      if (silent()) return;
      if (!ctx) {
        if (typeof AudioContext === 'undefined') return;
        try {
          ctx = new AudioContext();
          master = ctx.createGain();
          const lowpass = ctx.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = MASTER_LOWPASS_HZ;
          master.connect(lowpass);
          lowpass.connect(ctx.destination);
        } catch {
          ctx = null;
          return;
        }
      }
      ctx.resume().catch(() => {});
    },

    estimate(text, opts) {
      const toks = planMutter(text, opts?.maxLetters ?? DEFAULT_MAX_LETTERS);
      return toks.some((t) => t.k === 'blip') ? durationOf(toks) : 0;
    },

    say(text, hz, opts) {
      const toks = planMutter(text, opts?.maxLetters ?? DEFAULT_MAX_LETTERS);
      if (!toks.some((t) => t.k === 'blip')) return 0;
      const seconds = durationOf(toks);
      if (!ctx || !master || silent()) return 0;
      master.gain.value = options.gain();

      const now = ctx.currentTime;
      for (let i = voices.length - 1; i >= 0; i--) {
        if (voices[i].end < now) voices.splice(i, 1);
      }
      while (voices.length >= MAX_VOICES) {
        const old = voices.shift();
        if (old) stopVoice(old);
      }

      const voice: Voice = { oscs: [], end: now };
      let t = now + 0.02;
      for (const tok of toks) {
        if (tok.k === 'gap') {
          t += tok.dur;
          continue;
        }
        const code = tok.ch.charCodeAt(0);
        const pitch = hz * (1 + (((code * 7) % 12) - 6) / 45) * (0.96 + Math.random() * 0.08) * tok.mul;
        blip(ctx, master, t, pitch, tok.f, tok.vowel, voice.oscs);
        t += BLIP_STEP;
      }
      voice.end = t + 0.07;
      voices.push(voice);
      return seconds;
    },

    stop() {
      while (voices.length) {
        const v = voices.shift();
        if (v) stopVoice(v);
      }
    },
  };
}
