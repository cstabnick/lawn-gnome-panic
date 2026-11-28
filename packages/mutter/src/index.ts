// Animal-Crossing-style muttering (the Gnome Blackjack voice) as a reusable WebAudio engine.

export interface MutterOptions {
  /** Master gain 0..1, read each time a line starts. */
  gain: () => number;
  /**
   * Play into someone else's audio graph instead of a private AudioContext: return the context and the node to connect
   * to (e.g. a game's "voices" gain), or null while that context does not exist yet (say() is then silent). With
   * `output`, unlock() creates nothing; the owner of the context unlocks it.
   */
  output?: () => { ctx: AudioContext; dest: AudioNode } | null;
}

/**
 * A character's voice. Only `hz` is required; every other field has a neutral default that sounds like the original
 * Blackjack mutter, so `{ hz: 88 }` and `say(text, 88)` are the same voice.
 */
export interface VoiceSpec {
  /** Base pitch in Hz (deep 60 .. squeaky 220). */
  hz: number;
  /** Talking speed: 1 = the Blackjack blip rate, 0.6 slow and deliberate .. 1.6 fast and breathless. */
  speed?: number;
  /** Main oscillator: 'saw' (default, buzzy), 'square' (hollow, reedy), 'triangle' (soft, round), 'sine' (pure, whistly). */
  wave?: 'saw' | 'square' | 'triangle' | 'sine';
  /** Level of the octave-down square under the main oscillator, 0..1 (default 0.5). 0 = thin, 1 = chesty. */
  sub?: number;
  /** Formant shift: multiplies both vowel formants. 0.8 = big, dark head .. 1.3 = small, bright head. Default 1. */
  formant?: number;
  /** Bandpass Q of the formant filters: 2 breathy and wide .. 9 nasal and sharp. Default 5. */
  q?: number;
  /** Noise mixed into each blip, 0..1 (default 0): a whisper, a rasp, an old smoker. */
  breath?: number;
  /** Pitch wobble, 0..1 (default 0): vibrato and jitter within a blip (old, nervous, theatrical). */
  wobble?: number;
  /** Melodic spread of the per-letter pitch, 0.2 monotone (a clerk) .. 2 sing-song (a showman). Default 1. */
  range?: number;
  /** Pitch movement across a sentence, -1 falls (tired, final) .. +1 rises (eager, questioning). Default 0. */
  glide?: number;
  /**
   * How text becomes blips: 'letters' (default, one blip per letter), 'syllables' (one longer blip per vowel group:
   * slower, rounder), 'words' (one grunt per word: terse, gruff).
   */
  style?: 'letters' | 'syllables' | 'words';
  /**
   * Optional syllable set the voice "speaks" instead of the real letters: a space-separated list (e.g. 'bo ba bu mm').
   * Each voiced unit borrows the formants of the syllable picked by a hash of the real letters, so the same text always
   * sounds the same. Empty = use the real letters' vowels.
   */
  syllables?: string;
  /** Brightness: the voice's own lowpass cutoff in Hz (default 2600). */
  bright?: number;
}

export interface SayOptions {
  /** Cap on voiced letters. Blackjack uses 48. */
  maxLetters?: number;
  /** Through a phone or radio: a 350..3200 Hz band and a little grit (mission comms, a call). Default false. */
  phone?: boolean;
  /**
   * Over the air (a broadcast radio host, a walkie-talkie): the phone band plus a crackle of static under the line.
   * Implies the phone band. Default false.
   */
  radio?: boolean;
  /** Extra gain for this line only, 0..1 (default 1): e.g. a distant gnome. */
  gain?: number;
  /** Stereo pan for this line only, -1..1 (default 0). */
  pan?: number;
}

export interface Mutter {
  /** Create/resume the AudioContext. Call from a user gesture. */
  unlock(): void;
  /**
   * Speak `text` in `voice` (a VoiceSpec, or just a base pitch in Hz; default 100 Hz). Returns the line's duration in
   * seconds (0 if nothing will play).
   */
  say(text: string, voice?: number | VoiceSpec, opts?: SayOptions): number;
  /**
   * Duration `say` would take, without playing. Pass the same `voice` to get the same duration as say(); without one,
   * the default voice (letters, speed 1) is assumed.
   */
  estimate(text: string, opts?: SayOptions, voice?: number | VoiceSpec): number;
  stop(): void;
}

export type SpeechStyle = 'letters' | 'syllables' | 'words';

/** A voice with every default filled in. `syllables` is '' when the voice speaks the real letters. */
export type ResolvedVoice = Required<Omit<VoiceSpec, 'syllables'>> & { syllables: string };

const DEFAULT_MAX_LETTERS = 48;
const MAX_VOICES = 2;
const MASTER_LOWPASS_HZ = 2600;
const BLIP_STEP = 0.068;
const LEAD_IN = 0.02;
const TAIL = 0.07;
const SYLLABLE_LEN = 1.6;
const WORD_LEN = 2.2;
const PHONE_HIGHPASS_HZ = 350;
const PHONE_LOWPASS_HZ = 3200;
const PHONE_CLIP = 4;
const RADIO_HIGHPASS_HZ = 450;
const RADIO_LOWPASS_HZ = 2800;
const RADIO_CLIP = 6;
const RADIO_STATIC_HZ = 2200;
const RADIO_STATIC_GAIN = 0.035;
const WOBBLE_RATE_HZ = 5.5;

/** Fills the defaults of a VoiceSpec (a bare base pitch in Hz is the same as `{ hz }`). */
export function resolveVoice(voice: number | VoiceSpec): ResolvedVoice {
  const s: VoiceSpec = typeof voice === 'number' ? { hz: voice } : voice;
  return {
    hz: s.hz,
    speed: s.speed && s.speed > 0 ? s.speed : 1,
    wave: s.wave ?? 'saw',
    sub: s.sub ?? 0.5,
    formant: s.formant ?? 1,
    q: s.q ?? 5,
    breath: s.breath ?? 0,
    wobble: s.wobble ?? 0,
    range: s.range ?? 1,
    glide: s.glide ?? 0,
    style: s.style ?? 'letters',
    syllables: s.syllables ?? '',
    bright: s.bright ?? MASTER_LOWPASS_HZ,
  };
}

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
  | { k: 'blip'; ch: string; word: number; mul: number; vowel: boolean; f: [number, number]; len: number }
  | { k: 'gap'; dur: number };

type Blip = Extract<Tok, { k: 'blip' }>;

/** A token plus the real letters it stands for (used to pick a syllable from the set). */
interface Item {
  tok: Tok;
  src: string;
}

function hashLetters(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Groups one word's letters into syllables: each run of vowels is one blip, consonants before it fold into it. */
function syllableItems(run: Blip[]): Item[] {
  const clusters: Blip[][] = [];
  let cur: Blip[] = [];
  for (let n = 0; n < run.length; n++) {
    const b = run[n];
    cur.push(b);
    const next = run[n + 1];
    if (b.vowel && !(next && next.vowel)) {
      clusters.push(cur);
      cur = [];
    }
  }
  if (cur.length) {
    // Trailing consonants fold into the last syllable; a word with no vowel is one blip.
    if (clusters.length) clusters[clusters.length - 1].push(...cur);
    else clusters.push(cur);
  }
  return clusters.map((c) => {
    const vowel = c.find((b) => b.vowel);
    const lead = vowel ?? c[0];
    return {
      tok: {
        k: 'blip',
        ch: lead.ch,
        word: c[0].word,
        mul: Math.max(...c.map((b) => b.mul)),
        vowel: !!vowel,
        f: lead.f,
        len: SYLLABLE_LEN,
      },
      src: c.map((b) => b.ch).join(''),
    };
  });
}

/** One blip for the whole word, with the formants of its first vowel. */
function wordItem(run: Blip[]): Item {
  const vowel = run.find((b) => b.vowel);
  const lead = vowel ?? run[0];
  return {
    tok: {
      k: 'blip',
      ch: lead.ch,
      word: run[0].word,
      mul: Math.max(...run.map((b) => b.mul)),
      vowel: !!vowel,
      f: lead.f,
      len: WORD_LEN,
    },
    src: run.map((b) => b.ch).join(''),
  };
}

function restyle(toks: Tok[], style: SpeechStyle): Item[] {
  if (style === 'letters') return toks.map((tok) => ({ tok, src: tok.k === 'blip' ? tok.ch : '' }));
  const out: Item[] = [];
  let i = 0;
  while (i < toks.length) {
    const t = toks[i];
    if (t.k === 'gap') {
      out.push({ tok: t, src: '' });
      i++;
      continue;
    }
    const run: Blip[] = [];
    let j = i;
    while (j < toks.length) {
      const u = toks[j];
      if (u.k !== 'blip' || u.word !== t.word) break;
      run.push(u);
      j++;
    }
    i = j;
    if (style === 'words') out.push(wordItem(run));
    else out.push(...syllableItems(run));
  }
  return out;
}

/** Every blip speaks with the formants of one syllable from the set (picked by a hash of its real letters). */
function borrowSyllables(items: Item[], set: string[]): Tok[] {
  return items.map(({ tok, src }) => {
    if (tok.k !== 'blip') return tok;
    const syl = set[hashLetters(src) % set.length];
    let f: [number, number] | null = null;
    for (const c of syl) {
      f = vowelFormants(c);
      if (f) break;
    }
    return { ...tok, f: f ?? [500, 1400], vowel: f !== null };
  });
}

/**
 * Turns text into blips and pauses, with pitch multipliers for sentence endings. `style` regroups the letters into
 * blips; `syllables` (a space-separated set) replaces the formants of each blip with a syllable's.
 */
export function planMutter(
  text: string,
  maxLetters = DEFAULT_MAX_LETTERS,
  style: SpeechStyle = 'letters',
  syllables = '',
): Tok[] {
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
      toks.push({ k: 'blip', ch, word, mul: 1, vowel, f: vowelFormants(ch) ?? [500, 1400], len: 1 });
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

  const items = restyle(toks, style);
  const set = syllables.toLowerCase().split(/\s+/).filter(Boolean);
  return set.length ? borrowSyllables(items, set) : items.map((i) => i.tok);
}

interface Placed {
  blip: Blip;
  /** Seconds from the start of the line. */
  at: number;
  /** Position across the line, 0..1. */
  pos: number;
}

/** Where every blip goes in time, and how long the line lasts. Shared by say() and estimate(). */
function layout(toks: readonly Tok[], speed: number): { placed: Placed[]; end: number } {
  const blipCount = toks.filter((t) => t.k === 'blip').length;
  const placed: Placed[] = [];
  let t = LEAD_IN;
  let end = 0;
  for (const tok of toks) {
    if (tok.k === 'gap') {
      t += tok.dur / speed;
      continue;
    }
    const pos = blipCount > 1 ? placed.length / (blipCount - 1) : 0.5;
    placed.push({ blip: tok, at: t, pos });
    end = Math.max(end, t + (TAIL * tok.len) / speed);
    t += (BLIP_STEP * tok.len) / speed;
  }
  return { placed, end: Math.max(end, t + TAIL / speed) };
}

interface BlipParams {
  t: number;
  pitch: number;
  f: [number, number];
  vowel: boolean;
  /** Length multiplier already divided by speed. */
  len: number;
  q: number;
  sub: number;
  wave: OscillatorType;
  breath: number;
  wobble: number;
  noise: AudioBuffer | null;
}

/** One blip: a main oscillator plus a square an octave down, through two formant bandpasses. */
function blip(c: AudioContext, out: AudioNode, p: BlipParams, oscs: AudioScheduledSourceNode[]): void {
  const { t, pitch, f, vowel, len: k } = p;
  const dur = TAIL * k;

  const saw = c.createOscillator();
  saw.type = p.wave;
  saw.frequency.setValueAtTime(pitch, t);
  const sq = c.createOscillator();
  sq.type = 'square';
  sq.frequency.setValueAtTime(pitch / 2, t);
  const sqGain = c.createGain();
  sqGain.gain.value = p.sub;
  sq.connect(sqGain);

  if (p.wobble > 0) {
    const lfo = c.createOscillator();
    lfo.frequency.value = WOBBLE_RATE_HZ;
    const sawDepth = c.createGain();
    sawDepth.gain.value = pitch * 0.03 * p.wobble;
    const sqDepth = c.createGain();
    sqDepth.gain.value = pitch * 0.015 * p.wobble;
    lfo.connect(sawDepth);
    sawDepth.connect(saw.frequency);
    lfo.connect(sqDepth);
    sqDepth.connect(sq.frequency);
    lfo.start(t);
    lfo.stop(t + dur);
    oscs.push(lfo);
  }

  const env = c.createGain();
  const peak = vowel ? 0.22 : 0.14;
  const decay = (vowel ? 0.02 : 0.012) * k;
  const end = (vowel ? 0.055 : 0.04) * k;
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + 0.008 * k);
  env.gain.setValueAtTime(peak, t + decay);
  env.gain.linearRampToValueAtTime(0, t + end);
  env.connect(out);

  let noiseGain: GainNode | null = null;
  if (p.breath > 0 && p.noise) {
    const src = c.createBufferSource();
    src.buffer = p.noise;
    noiseGain = c.createGain();
    noiseGain.gain.value = p.breath * 0.6;
    src.connect(noiseGain);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur);
    oscs.push(src);
  }

  for (const hz of f) {
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = hz;
    bp.Q.value = p.q;
    saw.connect(bp);
    sqGain.connect(bp);
    if (noiseGain) noiseGain.connect(bp);
    bp.connect(env);
  }

  saw.start(t);
  sq.start(t);
  saw.stop(t + dur);
  sq.stop(t + dur);
  oscs.push(saw, sq);
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

/** One shared white-noise buffer per context, made on first use. */
function noiseBufferFor(c: AudioContext): AudioBuffer {
  let buf = noiseBuffers.get(c);
  if (!buf) {
    buf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(c, buf);
  }
  return buf;
}

function softClipCurve(k: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const curve: Float32Array<ArrayBuffer> = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / (n - 1) - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

/**
 * Per-line chain: gain, then either the voice's brightness lowpass (with pan before it) or the phone band
 * (highpass, lowpass, soft clip, pan), into `out`. A radio line uses a narrower band and adds a static
 * source (`hiss`) that the caller starts with the line.
 */
function buildLine(
  c: AudioContext,
  out: AudioNode,
  opts: SayOptions | undefined,
  v: ResolvedVoice,
): { input: AudioNode; nodes: AudioNode[]; hiss?: AudioBufferSourceNode } {
  const gain = c.createGain();
  gain.gain.value = opts?.gain ?? 1;
  const pan = typeof c.createStereoPanner === 'function' ? c.createStereoPanner() : null;
  if (pan) pan.pan.value = Math.max(-1, Math.min(1, opts?.pan ?? 0));
  const radio = !!opts?.radio;

  const stages: AudioNode[] = [];
  if (!opts?.phone && !radio) {
    if (pan) stages.push(pan);
    const bright = c.createBiquadFilter();
    bright.type = 'lowpass';
    bright.frequency.value = v.bright;
    stages.push(bright);
  } else {
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = radio ? RADIO_HIGHPASS_HZ : PHONE_HIGHPASS_HZ;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = radio ? RADIO_LOWPASS_HZ : PHONE_LOWPASS_HZ;
    const clip = c.createWaveShaper();
    clip.curve = softClipCurve(radio ? RADIO_CLIP : PHONE_CLIP);
    stages.push(hp, lp, clip);
    if (pan) stages.push(pan);
  }

  const nodes: AudioNode[] = [gain, ...stages];
  let tail: AudioNode = gain;
  for (const n of stages) {
    tail.connect(n);
    tail = n;
  }
  tail.connect(out);
  if (!radio) return { input: gain, nodes };

  // static: looping noise through a bandpass, panned like the line, joining the output beside it
  const hiss = c.createBufferSource();
  hiss.buffer = noiseBufferFor(c);
  hiss.loop = true;
  const band = c.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = RADIO_STATIC_HZ;
  band.Q.value = 0.8;
  const hissGain = c.createGain();
  hissGain.gain.value = RADIO_STATIC_GAIN * (opts?.gain ?? 1);
  hiss.connect(band);
  band.connect(hissGain);
  nodes.push(hiss, band, hissGain);
  if (pan) {
    const hissPan = c.createStereoPanner();
    hissPan.pan.value = pan.pan.value;
    hissGain.connect(hissPan);
    hissPan.connect(out);
    nodes.push(hissPan);
  } else {
    hissGain.connect(out);
  }
  return { input: gain, nodes, hiss };
}

function silent(): boolean {
  try {
    return typeof location !== 'undefined' && location.hash.includes('mute');
  } catch {
    return false;
  }
}

interface Voice {
  oscs: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  end: number;
}

export function createMutter(options: MutterOptions): Mutter {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  const voices: Voice[] = [];

  /** Silences a line and drops its per-line chain. */
  function releaseVoice(v: Voice): void {
    for (const o of v.oscs) {
      try {
        o.stop();
      } catch {
        // already stopped
      }
    }
    for (const n of v.nodes) {
      try {
        n.disconnect();
      } catch {
        // already disconnected
      }
    }
  }

  /** With options.output: (re)build the master chain inside the host's context whenever it appears or changes. */
  function hostChain(): boolean {
    if (!options.output) return !!ctx && !!master;
    const o = options.output();
    if (!o) return false;
    if (ctx === o.ctx && master) return true;
    ctx = o.ctx;
    master = ctx.createGain();
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = MASTER_LOWPASS_HZ;
    master.connect(lowpass);
    lowpass.connect(o.dest);
    return true;
  }

  return {
    unlock() {
      if (silent()) return;
      if (options.output) {
        hostChain();
        return;
      }
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

    estimate(text, opts, voice) {
      const v = voice === undefined ? null : resolveVoice(voice);
      const toks = planMutter(text, opts?.maxLetters ?? DEFAULT_MAX_LETTERS, v?.style ?? 'letters', v?.syllables ?? '');
      return toks.some((t) => t.k === 'blip') ? layout(toks, v?.speed ?? 1).end : 0;
    },

    say(text, voiceIn, opts) {
      const v = resolveVoice(voiceIn ?? 100);
      const toks = planMutter(text, opts?.maxLetters ?? DEFAULT_MAX_LETTERS, v.style, v.syllables);
      if (!toks.some((t) => t.k === 'blip')) return 0;
      const lay = layout(toks, v.speed);
      if (!hostChain() || !ctx || !master || silent()) return 0;
      master.gain.value = options.gain();

      const now = ctx.currentTime;
      for (let i = voices.length - 1; i >= 0; i--) {
        if (voices[i].end < now) releaseVoice(voices.splice(i, 1)[0]);
      }
      while (voices.length >= MAX_VOICES) {
        const old = voices.shift();
        if (old) releaseVoice(old);
      }

      const line = buildLine(ctx, master, opts, v);
      const voice: Voice = { oscs: [], nodes: line.nodes, end: now + lay.end };
      if (line.hiss) {
        line.hiss.start(now);
        line.hiss.stop(now + lay.end);
        voice.oscs.push(line.hiss);
      }
      const noise = v.breath > 0 ? noiseBufferFor(ctx) : null;
      for (const p of lay.placed) {
        const code = p.blip.ch.charCodeAt(0);
        const melody = 1 + ((((code * 7) % 12) - 6) / 45) * v.range;
        const glide = 1 + v.glide * 0.25 * (p.pos - 0.5);
        const jitter = (0.96 + Math.random() * 0.08) * (1 + (Math.random() * 2 - 1) * v.wobble * 0.04);
        const pitch = v.hz * melody * jitter * p.blip.mul * glide;
        blip(
          ctx,
          line.input,
          {
            t: now + p.at,
            pitch,
            f: [p.blip.f[0] * v.formant, p.blip.f[1] * v.formant],
            vowel: p.blip.vowel,
            len: p.blip.len / v.speed,
            q: v.q,
            sub: v.sub,
            wave: v.wave === 'saw' ? 'sawtooth' : v.wave,
            breath: v.breath,
            wobble: v.wobble,
            noise,
          },
          voice.oscs,
        );
      }
      voices.push(voice);
      return lay.end;
    },

    stop() {
      while (voices.length) {
        const v = voices.shift();
        if (v) releaseVoice(v);
      }
    },
  };
}
