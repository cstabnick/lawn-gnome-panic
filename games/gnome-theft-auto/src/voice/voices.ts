// Every speaking character's voice, as data. A VoiceSpec (@lawn/mutter) per cast key (cutscene/cast.ts CAST keys,
// plus the speakers who have no cast preset), and a derived voice for anyone unlisted, so each speaker sounds
// recognisably different. Pure: no audio, no DOM.
import type { GnomeLook } from '@lawn/gnome';
import type { VoiceSpec } from '@lawn/mutter';

/**
 * Voices by lower-case key: a CAST key ('pip', 'big lou') or a speaker label ('narrator', 'mayor mulch').
 * Each CAST key's `hz` matches its cutscene/cast.ts entry. No two entries share (wave, style, rounded formant).
 */
export const VOICES: Readonly<Record<string, VoiceSpec>> = {
  // ---- cast (cutscene/cast.ts) ----
  pip: { hz: 126, speed: 1.35, glide: 0.4, formant: 1.15, range: 1.4 },
  tansy: { hz: 118, speed: 0.9, wave: 'square', range: 0.4, glide: -0.3 },
  vesper: { hz: 92, speed: 0.72, wave: 'sine', breath: 0.12, range: 0.5, q: 3 },
  granny: { hz: 132, speed: 0.85, wave: 'triangle', wobble: 0.35 },
  diggs: { hz: 80, style: 'words', sub: 0.9, formant: 0.85 },
  bracken: { hz: 76, speed: 0.65, wobble: 0.3, breath: 0.2, formant: 0.85 },
  loam: { hz: 84, speed: 0.8, range: 1.6, syllables: 'ah oh mm' },
  bodega: { hz: 88, speed: 0.9, style: 'syllables' },
  juniper: { hz: 116, speed: 1.15, q: 8, range: 0.7, formant: 1.05 },
  reginald: { hz: 96, speed: 1.05, wave: 'square', q: 9, range: 0.3, formant: 1.1 },
  sorrel: { hz: 122, speed: 0.85, wave: 'triangle', breath: 0.15, bright: 2000, style: 'syllables' },
  clara: { hz: 134, speed: 0.8, wave: 'sine', formant: 1.3, bright: 3600 },
  brenda: { hz: 112, speed: 0.95, range: 1.9, glide: 0.2, formant: 0.95 },
  'big lou': { hz: 78, speed: 0.7, style: 'words', sub: 1 },
  mossley: { hz: 118, speed: 1.3, breath: 0.4, wobble: 0.3, formant: 0.92 },
  burt: { hz: 102, range: 0.5, glide: -0.4, style: 'syllables', formant: 1.2 },
  driftwood: { hz: 94, wobble: 0.25, glide: -0.2, syllables: 'oo oh ah', wave: 'sine', formant: 0.9 },
  cedric: { hz: 114, speed: 1.4, range: 1.7, wave: 'square', formant: 0.9 },
  bramble: { hz: 100, style: 'syllables', speed: 0.75, formant: 0.9 },
  shelldon: { hz: 110, breath: 0.3, speed: 1.2, range: 0.6, formant: 1.2 },
  wally: { hz: 96, wave: 'square', speed: 1.2, q: 7, formant: 1.2 },
  dot: { hz: 128, wave: 'square', speed: 1.3, q: 6, formant: 1.17 },
  hedda: { hz: 124, wave: 'square', style: 'syllables', speed: 1.1, formant: 0.93 },
  nina: { hz: 136, wave: 'triangle', speed: 1.5, glide: 0.25, wobble: 0.15, formant: 1.25 },
  grout: { hz: 74, wave: 'sine', style: 'words', speed: 0.6, sub: 1, formant: 0.8 },

  // ---- speakers without a cast preset ----
  narrator: { hz: 130, wave: 'triangle', speed: 0.8, range: 0.6, glide: -0.3, bright: 2200, formant: 0.95 },
  'mayor mulch': { hz: 108, range: 1.8, speed: 1.2, wave: 'square', formant: 0.8 },
  mabel: { hz: 140, wobble: 0.4, speed: 0.9, breath: 0.1, formant: 1.25 },
  'turncoat cam': { hz: 112, speed: 1.15, range: 0.5, breath: 0.15, formant: 0.8 },
  bodyguard: { hz: 70, style: 'words', sub: 1, formant: 0.82 },
  burdock: { hz: 92, speed: 0.85, wave: 'square', range: 0.4, formant: 1.05 },
  'thermos theo': { hz: 144, speed: 1.25, wobble: 0.2, formant: 1.1 },
  'rooster weatherby': { hz: 150, speed: 1.5, wobble: 0.5, style: 'words', formant: 1.2 },
  periwinkle: { hz: 104, speed: 0.95, wave: 'triangle', formant: 1.2 },
  'lugnut lulu': { hz: 128, speed: 1.1, wave: 'square', style: 'syllables' },
  vinnie: { hz: 98, sub: 0.7, formant: 0.9 },
  dock: { hz: 90, wave: 'sine', style: 'words', speed: 0.8 },
  marigold: { hz: 124, wave: 'triangle', glide: 0.2, formant: 0.85, speed: 1.0 },
  tattler: { hz: 136, wave: 'square', speed: 1.45, glide: 0.3, formant: 1.3 },
};

type Wave = NonNullable<VoiceSpec['wave']>;
type Style = NonNullable<VoiceSpec['style']>;

const round = (x: number, d = 2): number => {
  const p = 10 ** d;
  return Math.round(x * p) / p;
};

/** 32-bit FNV-1a hash of a string. */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: a small seeded PRNG returning floats in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lower-case words of a label, single-spaced and padded, so a key matches on whole words only. */
function wordsOf(s: string): string {
  return ` ${s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
}

/** Family traits, matched on whole words in the label (applied in this order). */
const CLERKS = ['hoa', 'auditor', 'enforcer', 'bailiff', 'welder', 'plow', 'inspector'];
const HEAVIES = ['guard', 'bouncer', 'wrangler', 'bookie'];
const PORCELAIN = ['refugee', 'porcelain'];

/** A stable voice for any label nobody has written a voice for. */
function derivedVoice(label: string): VoiceSpec {
  const r = mulberry32(hash32(label.toLowerCase()));
  // Fixed draw order: adding a field later would reshuffle every derived voice.
  const hzR = r(), speedR = r(), waveR = r(), subR = r(), formantR = r(), qR = r();
  const breathR = r(), wobbleR = r(), rangeR = r(), glideR = r(), styleR = r();
  const waves: Wave[] = ['saw', 'square', 'triangle'];
  const v: VoiceSpec = {
    hz: round(82 + hzR * 68, 1),
    speed: round(0.85 + speedR * 0.4),
    wave: waves[Math.floor(waveR * waves.length)],
    sub: round(0.2 + subR * 0.7),
    formant: round(0.88 + formantR * 0.3),
    q: round(3 + qR * 5),
    breath: round(breathR * 0.2),
    wobble: round(wobbleR * 0.25),
    range: round(0.6 + rangeR * 0.9),
    glide: round(-0.3 + glideR * 0.6),
    style: (styleR < 0.7 ? 'letters' : 'syllables') as Style,
  };

  const words = new Set(label.toLowerCase().split(/[^a-z0-9]+/));
  const has = (list: string[]) => list.some((w) => words.has(w));
  if (has(CLERKS)) {
    v.range = 0.3;
    v.wave = 'square';
    v.q = 8;
  }
  if (has(HEAVIES)) {
    v.style = 'words';
    v.sub = 0.9;
    v.formant = 0.85;
  }
  if (has(PORCELAIN)) {
    v.wave = 'sine';
    v.formant = 1.28;
    v.bright = 3600;
  }
  return v;
}

/**
 * The voice for a speaker label or cast key ("Pip Potsworth", "pip", "HOA Enforcer", "Refugee"). Exact key first, then
 * the longest VOICES key contained in the label as whole words, else a voice derived from a hash of the label (stable,
 * distinct). `hz`, when given, overrides the pitch (a scene's per-line or per-actor `hz`). Always a fresh copy.
 */
export function voiceFor(label: string, hz?: number): VoiceSpec {
  const lower = label.toLowerCase().trim();
  let base: VoiceSpec | undefined;
  if (Object.prototype.hasOwnProperty.call(VOICES, lower)) {
    base = VOICES[lower];
  } else {
    const padded = wordsOf(label);
    const key = Object.keys(VOICES)
      .filter((k) => padded.includes(wordsOf(k)))
      .sort((a, b) => b.length - a.length)[0];
    if (key !== undefined) base = VOICES[key];
  }
  const v = base ? { ...base } : derivedVoice(label);
  if (hz !== undefined) v.hz = hz;
  return v;
}

/** The player's own voice, derived from their gnome look (so two players' gnomes sound different). Always plain. */
export function playerVoice(look?: GnomeLook | null): VoiceSpec {
  const r = mulberry32(hash32(JSON.stringify(look ?? {})));
  const hzR = r(), speedR = r(), formantR = r(), rangeR = r();
  return {
    hz: round(96 + hzR * 28, 1),
    speed: round(0.95 + speedR * 0.15),
    wave: 'saw',
    sub: 0.5,
    formant: round(0.95 + formantR * 0.15),
    range: round(0.8 + rangeR * 0.3),
    breath: 0,
    wobble: 0,
    style: 'letters',
  };
}
