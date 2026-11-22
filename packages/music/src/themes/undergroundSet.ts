/**
 * Theme: Underground set (4/4, 128-132 bpm). One continuous, never-restarting techno DJ set in three voices that blend
 * into each other: acid techno, dub techno and a heavy-drum, housey techno. Everything is synthesized.
 *
 * Why it is one set and not a playlist: the other stations play a fresh song each time. This one never stops. One tempo,
 * one key and one chord loop run through the whole night, and the three modes only change *which layers are up*.
 *
 * Journey (UNDERGROUND_JOURNEY): dub -> drum -> acid -> drum -> acid -> drum -> dub. The drum cuts are the hub: acid and
 * dub never touch. Dub techno firms up into house (the chords turn into stabs, the percussion fills in), house takes an
 * acid line over the top (the line comes in through a closed filter), and the way out runs the same road backwards.
 *
 * How the blend works (the "crossfade", XFADE_BARS long, always the last 8 bars of a cut, which is always a multiple of
 * 16 bars so the chord loop lines up):
 * - percussion of the next mode arrives first (it takes the first 60% of the crossfade), the old one leaves last;
 * - harmony and the acid line cross later and over a longer stretch, each entering or leaving *through its own filter*
 *   (it opens as it comes in, closes as it goes out) with the echo send up while a layer leaves;
 * - the bass swaps in a single bar at the midpoint (one bass at a time, so low end never doubles up);
 * - the kick never stops; its character (length, pitch drop, grit, darkness) morphs with the blend;
 * - energy is one continuous curve (energyAt) that every macro reads, so no layer ever jumps with the section.
 *
 * Filter change on three time scales (acid; the same ideas shape the dub chords):
 * - long (a whole cut): the base cutoff follows the energy curve, so each acid cut opens up over ~30 bars;
 * - medium (1-8 bars): a slow 2-bar wobble, a rise through the second half of every 8-bar phrase that snaps back on
 *   the downbeat, and a breakdown that closes the filter and sweeps it open into the drop;
 * - short (one note): an accent opens the note's own filter envelope wider and the resonance climbs with the energy.
 *
 * Polyrhythm: the acid riff is 12, 14 or 15 steps long and the answering ping, the rim ticks and the toms loop at 10, 12
 * or 14 steps against the 16-step bar. They restart together on every 8-bar phrase downbeat, so the cycles drift apart
 * and come back together, and the kick and clap (a straight 4/4) hold the floor.
 *
 * Harmony: every pitch is in one natural-minor key. The chord loop is four chords of four bars and always ends on the
 * tonic, so every transition lands on the home chord. The acid line is a tonic pedal; dub and house follow the chords.
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '../engine';
import { createFx, createPanner } from '../mix';
import { MODES, chordTones, midiToNote, mulberry32, voiceLead } from '../theory';

export type SetMode = 'acid' | 'dub' | 'drum';

export interface Cut {
  readonly mode: SetMode;
  /** A multiple of 16: the chord loop is 16 bars and every cut starts at its first bar. */
  readonly bars: number;
  /** Where the energy curve is heading in this cut, 0..1. */
  readonly energy: number;
  /** A breakdown: [bar of the cut it starts on, length in bars]. The drop follows it. */
  readonly brk?: readonly [number, number];
}

export const UNDERGROUND_JOURNEY: readonly Cut[] = [
  { mode: 'dub', bars: 32, energy: 0.32 },
  { mode: 'drum', bars: 32, energy: 0.7 },
  { mode: 'acid', bars: 48, energy: 0.86, brk: [24, 4] },
  { mode: 'drum', bars: 32, energy: 0.72, brk: [12, 4] },
  { mode: 'acid', bars: 48, energy: 1, brk: [24, 6] },
  { mode: 'drum', bars: 32, energy: 0.62 },
  { mode: 'dub', bars: 48, energy: 0.22 },
];

/** The last bars of every cut during which the next one comes in. */
export const XFADE_BARS = 8;
export const PHRASE_BARS = 8;
const STARTS: number[] = [];
{
  let at = 0;
  for (const c of UNDERGROUND_JOURNEY) { STARTS.push(at); at += c.bars; }
}
/** Bars in one lap of the whole journey (about 8 minutes at 130 bpm). The set then starts over, in a new arrangement. */
export const SET_BARS = UNDERGROUND_JOURNEY.reduce((s, c) => s + c.bars, 0);
/** The bar a cut begins on (its own sound is complete from here; it started coming in XFADE_BARS earlier). */
export const cutStartBar = (index: number): number => STARTS[index];

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const smooth = (v: number): number => { const t = clamp01(v); return t * t * (3 - 2 * t); };
const gate = (e: number, lo: number, hi: number): number => smooth((e - lo) / (hi - lo));
const mod = (n: number, m: number): number => ((n % m) + m) % m;

// ----------------------------------------------------------------------------------------------------------------
// The plan: where in the journey a bar is. Pure, so tests can check the shape of the set without any audio.
// ----------------------------------------------------------------------------------------------------------------

export interface BarPlan {
  /** The cut whose time it is. */
  cut: number;
  mode: SetMode;
  /** Bars into that cut (fractional when asked for a fractional bar). */
  rel: number;
  /** The cut that is coming in, and how far the crossfade has got (0 outside one, up to 1). */
  next: number;
  nextMode: SetMode;
  x: number;
  /** The cut the ear is following: the next one from the middle of the crossfade. Its title is the one on the dial. */
  dominant: number;
  /** The energy curve, 0..1. */
  energy: number;
  /** Which lap of the journey (0 the first). */
  lap: number;
  /** In a breakdown: how far through it, 0..1. */
  brk: { on: boolean; prog: number; bar: number };
  /** Whole bars since the drop that ended a breakdown, or -1. */
  sinceDrop: number;
}

export function planAt(bar: number): BarPlan {
  const lap = Math.floor(bar / SET_BARS);
  const b = bar - lap * SET_BARS;
  let cut = UNDERGROUND_JOURNEY.length - 1;
  for (let i = 0; i < STARTS.length; i++) if (b >= STARTS[i]) cut = i;
  const c = UNDERGROUND_JOURNEY[cut];
  const rel = b - STARTS[cut];
  const toEnd = c.bars - rel;
  const next = (cut + 1) % UNDERGROUND_JOURNEY.length;
  const x = clamp01((XFADE_BARS - toEnd) / XFADE_BARS);
  const from = UNDERGROUND_JOURNEY[(cut + UNDERGROUND_JOURNEY.length - 1) % UNDERGROUND_JOURNEY.length].energy;
  const energy = from + (c.energy - from) * smooth(rel / (0.75 * c.bars));
  let brk = { on: false, prog: 0, bar: 0 };
  let sinceDrop = -1;
  if (c.brk) {
    const [s, len] = c.brk;
    if (rel >= s && rel < s + len) brk = { on: true, prog: (rel - s) / len, bar: Math.floor(rel - s) };
    else if (rel >= s + len && rel < s + len + 8) sinceDrop = Math.floor(rel - s - len);
  }
  return { cut, mode: c.mode, rel, next, nextMode: UNDERGROUND_JOURNEY[next].mode, x, dominant: x >= 0.5 ? next : cut, energy, lap, brk, sinceDrop };
}

/** The energy curve at a bar. Continuous across cuts (each cut starts where the last one ended). */
export const energyAt = (bar: number): number => planAt(bar).energy;

export interface Weights {
  /** How much of each mode's percussion, tonal layers (chords, stabs, acid line) is up, 0..1. */
  rhythm: Record<SetMode, number>;
  tonal: Record<SetMode, number>;
  /** Whose bass line plays: swapped in one bar at the middle of a crossfade. */
  bass: SetMode;
}

export function weightsOf(p: BarPlan): Weights {
  const r: Record<SetMode, number> = { acid: 0, dub: 0, drum: 0 };
  const t: Record<SetMode, number> = { acid: 0, dub: 0, drum: 0 };
  const x = p.x;
  // Percussion arrives first and leaves last; harmony crosses later and slower. Both overlap.
  r[p.mode] += 1 - smooth((x - 0.4) / 0.6);
  r[p.nextMode] += smooth(x / 0.6);
  t[p.mode] += 1 - smooth(x / 0.75);
  t[p.nextMode] += smooth((x - 0.25) / 0.75);
  for (const m of ['acid', 'dub', 'drum'] as const) { r[m] = Math.min(1, r[m]); t[m] = Math.min(1, t[m]); }
  return { rhythm: r, tonal: t, bass: x >= 0.5 ? p.nextMode : p.mode };
}

// ----------------------------------------------------------------------------------------------------------------
// The filters. Pure functions of the bar, so the three time scales can be tested.
// ----------------------------------------------------------------------------------------------------------------

export interface AcidState {
  energy: number;
  /** How much of the acid line is up (0..1): it opens as it enters and closes as it leaves. */
  weight: number;
  brk: { on: boolean; prog: number };
  sinceDrop: number;
}

/** The acid filter's cutoff in Hz at a bar and step (`pos` 0..15). Long + medium time scale; accents act per note. */
export function acidCutoff(bar: number, pos: number, s: AcidState): number {
  const t = bar + pos / 16;
  const long = 190 * 2 ** (clamp01((s.energy - 0.45) / 0.55) * 4.6); // ~190 Hz below half energy .. ~4.6 kHz at full energy
  let c: number;
  if (s.brk.on) {
    // Breakdown: closed down low, then swept open over the whole break, so the drop lands on a wide-open filter.
    c = long * 0.35 * 2 ** (s.brk.prog * 3);
  } else {
    const phrase = mod(t, PHRASE_BARS) / PHRASE_BARS;
    const rise = smooth((phrase - 0.5) / 0.5); // the second half of each phrase opens up, then snaps shut on the downbeat
    const medium = 2 ** (rise * (0.9 + 0.9 * s.energy));
    const wobble = 2 ** (0.35 * Math.sin((2 * Math.PI * t) / 2)); // a slow two-bar breath
    c = long * medium * wobble;
    if (s.sinceDrop >= 0) c *= 2 ** (1.2 * Math.max(0, 1 - (s.sinceDrop + pos / 16) / 4)); // the drop settles over 4 bars
  }
  c *= 2 ** (-3.2 * (1 - s.weight)); // in and out through the filter
  return Math.min(5000, Math.max(90, c));
}

/** The dub chords' cutoff: opens with the energy, breathes over eight bars, enters and leaves dark. */
export function dubCutoff(bar: number, pos: number, energy: number, weight: number): number {
  const t = bar + pos / 16;
  const base = 420 * 2 ** (energy * 3);
  const c = base * 2 ** (0.6 * Math.sin((2 * Math.PI * t) / 8)) * 2 ** (-2.5 * (1 - weight));
  return Math.min(6500, Math.max(150, c));
}

// ----------------------------------------------------------------------------------------------------------------
// Material: the notes and rhythms of one cut. Seeded, so a seed always plays the same set.
// ----------------------------------------------------------------------------------------------------------------

/** Euclidean rhythm: k hits spread as evenly as they go over n steps. */
export function euclid(k: number, n: number): boolean[] {
  const out = Array.from({ length: n }, () => false);
  for (let i = 0; i < k; i++) out[Math.floor((i * n) / k)] = true;
  return out;
}

const rotate = <V>(xs: readonly V[], by: number): V[] => xs.map((_, i) => xs[mod(i + by, xs.length)]);

interface RiffNote { on: boolean; semi: number; accent: boolean; slide: boolean; ghost: boolean }
const NO_NOTE: RiffNote = { on: false, semi: 0, accent: false, slide: false, ghost: false };

/** Pitches an acid line may use, in semitones above the tonic: all inside the natural minor scale, tonic-heavy. */
const ACID_POOL = [0, 0, 0, 0, 3, 5, 7, 7, 10, 12, 12, 8];

function makeRiff(rnd: () => number, len: number): RiffNote[] {
  const k = Math.round(len * (0.55 + rnd() * 0.12));
  let hits = euclid(k, len);
  const first = hits.indexOf(true);
  hits = rotate(hits, first); // the riff always starts on its first step with the root
  const riff: RiffNote[] = [];
  let prev = 0;
  for (let i = 0; i < len; i++) {
    if (!hits[i]) { riff.push({ ...NO_NOTE, ghost: rnd() < 0.2 && i > 0 }); continue; }
    let semi = 0;
    if (i > 0) {
      // Prefer small moves from the last note.
      let best = ACID_POOL[Math.floor(rnd() * ACID_POOL.length)];
      for (let tries = 0; tries < 3; tries++) {
        const cand = ACID_POOL[Math.floor(rnd() * ACID_POOL.length)];
        if (Math.abs(cand - prev) < Math.abs(best - prev)) best = cand;
      }
      semi = best;
    }
    riff.push({ on: true, semi, accent: i === 0 || rnd() < 0.3, slide: false, ghost: false });
    prev = semi;
  }
  // A slide goes into the next note when it is a step or two away and a different pitch.
  const onIdx = riff.map((n, i) => (n.on ? i : -1)).filter((i) => i >= 0);
  for (let j = 0; j < onIdx.length - 1; j++) {
    const a = riff[onIdx[j]];
    const b = riff[onIdx[j + 1]];
    if (onIdx[j + 1] - onIdx[j] <= 2 && a.semi !== b.semi && rnd() < 0.3) a.slide = true;
  }
  return riff;
}

/** One small change: one or two notes take a new pitch. The riff keeps its shape, so it evolves instead of being replaced. */
function mutateRiff(rnd: () => number, riff: readonly RiffNote[]): RiffNote[] {
  const out = riff.map((n) => ({ ...n }));
  const idx = out.map((n, i) => (n.on && i > 0 ? i : -1)).filter((i) => i >= 0);
  for (let m = 0; m < 1 + (rnd() < 0.5 ? 1 : 0) && idx.length; m++) {
    out[idx[Math.floor(rnd() * idx.length)]].semi = ACID_POOL[Math.floor(rnd() * ACID_POOL.length)];
  }
  return out;
}

interface Material {
  riffLen: number;
  riffs: RiffNote[][];
  pingLen: number;
  ping: boolean[];
  pingWalk: number[];
  chordRhythm: number[][];
  stabRhythm: number[];
  tomA: boolean[];
  tomB: boolean[];
  rim: boolean[];
}

const STAB_RHYTHMS = [[3, 6, 10, 13], [0, 3, 8, 11], [2, 3, 6, 10, 11, 14], [1, 4, 7, 10, 13]];
const CHORD_RHYTHMS: number[][][] = [[[2, 10], [2, 6, 10]], [[3, 10], [3, 11]], [[6, 14], [2, 6, 14]]];

function makeMaterial(seed: number, lap: number, cut: number): Material {
  const rnd = mulberry32(seed * 7919 + lap * 131 + cut * 17 + 1);
  const pick = <V>(xs: readonly V[]): V => xs[Math.floor(rnd() * xs.length)];
  const riffLen = pick([12, 14, 15]);
  const base = makeRiff(rnd, riffLen);
  const v1 = mutateRiff(rnd, base);
  const v2 = mutateRiff(rnd, v1);
  const v3 = mutateRiff(rnd, base);
  const pingLen = pick([10, 12, 14]);
  return {
    riffLen,
    riffs: [base, v1, v2, v3],
    pingLen,
    ping: rotate(euclid(pick([3, 4, 5]), pingLen), Math.floor(rnd() * pingLen)),
    pingWalk: pick([[0, 2, 1, 3, 2, 1], [0, 1, 2, 3, 2, 1], [3, 1, 2, 0, 2, 1]]),
    chordRhythm: pick(CHORD_RHYTHMS),
    stabRhythm: pick(STAB_RHYTHMS),
    tomA: rotate(euclid(pick([5, 7]), pick([12, 14])), Math.floor(rnd() * 4)),
    tomB: rotate(euclid(3, 8), pick([0, 2, 5])),
    rim: rotate(euclid(pick([3, 5]), pick([10, 12])), Math.floor(rnd() * 3)),
  };
}

/** Chord loops (scale degrees, 4 bars each). Every loop starts and ends on the tonic, so every cut lands on home. */
const PROGRESSIONS: number[][] = [[0, 5, 6, 0], [0, 6, 5, 0], [0, 3, 6, 0], [0, 5, 3, 0]];

/** Tempo for a seed. One tempo for the whole set. */
export const bpmForSeed = (seed: number): number => 128 + (mulberry32(seed)() * 5 | 0);

// ----------------------------------------------------------------------------------------------------------------
// Levels: which layer is how loud, from the weights and the energy.
// ----------------------------------------------------------------------------------------------------------------

type Layer = 'hat' | 'ohat' | 'clap' | 'tom' | 'rim' | 'shaker' | 'acid' | 'ping' | 'chord' | 'stab' | 'pad' | 'sub';
const RHYTHM_LAYERS: Layer[] = ['hat', 'ohat', 'clap', 'tom', 'rim', 'shaker'];
const TONAL_LAYERS: Layer[] = ['acid', 'ping', 'chord', 'stab', 'pad'];
type Profile = Record<Layer, (e: number) => number>;
const PROFILE: Record<SetMode, Profile> = {
  acid: {
    hat: (e) => 0.5 * gate(e, 0.35, 0.6), ohat: (e) => 0.8 * gate(e, 0.2, 0.4), clap: (e) => 0.55 * gate(e, 0.5, 0.7),
    tom: (e) => 0.45 * gate(e, 0.85, 0.98), rim: (e) => 0.6 * gate(e, 0.4, 0.65), shaker: () => 0,
    acid: () => 1, ping: (e) => 0.6 * gate(e, 0.45, 0.7), chord: () => 0, stab: () => 0, pad: (e) => 0.35 + 0.3 * e, sub: () => 0.55,
  },
  dub: {
    hat: () => 0, ohat: () => 0.65, clap: () => 0, tom: () => 0, rim: () => 0.55, shaker: (e) => 0.3 * gate(e, 0.25, 0.5),
    acid: () => 0, ping: () => 0, chord: () => 1, stab: () => 0, pad: () => 0.85, sub: () => 0.9,
  },
  drum: {
    hat: () => 0.7, ohat: () => 0.8, clap: (e) => gate(e, 0.2, 0.35), tom: (e) => gate(e, 0.3, 0.5), rim: (e) => 0.8 * gate(e, 0.15, 0.3),
    shaker: (e) => 0.75 * gate(e, 0.15, 0.3), acid: () => 0, ping: () => 0, chord: () => 0, stab: (e) => 0.9 * gate(e, 0.1, 0.25),
    pad: () => 0.2, sub: (e) => 0.85 * gate(e, 0.2, 0.35),
  },
};

export function levelsOf(w: Weights, energy: number): Record<Layer, number> {
  const out = {} as Record<Layer, number>;
  const modes: SetMode[] = ['acid', 'dub', 'drum'];
  for (const l of RHYTHM_LAYERS) out[l] = Math.min(1, modes.reduce((s, m) => s + w.rhythm[m] * PROFILE[m][l](energy), 0));
  for (const l of TONAL_LAYERS) out[l] = Math.min(1, modes.reduce((s, m) => s + w.tonal[m] * PROFILE[m][l](energy), 0));
  out.sub = PROFILE[w.bass].sub(energy);
  return out;
}

// ----------------------------------------------------------------------------------------------------------------
// The builder.
// ----------------------------------------------------------------------------------------------------------------

export interface UndergroundOptions {
  /** The cut to start on (resume where the last drive stopped). Default 0. */
  startAt?: number;
  /** Start playback at this offset in seconds from bar 0 (for live broadcast sync). */
  offsetSeconds?: number;
  /**
   * Called when a new cut becomes the one the ear follows (from the middle of the crossfade into it), and once at the
   * start. `index` is into UNDERGROUND_JOURNEY.
   */
  onCut?: (index: number, mode: SetMode) => void;
}

export function buildUndergroundSet(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number, opts: UndergroundOptions = {}): void {
  const rnd = mulberry32(seed);
  const transport = T.getTransport();
  transport.bpm.value = bpmForSeed(seed);
  const step16 = T.Time('16n').toSeconds();
  const barS = step16 * 16;
  const root = [31, 33, 33, 34, 29][Math.floor(rnd() * 5)]; // G1, A1, A#1, F1: the tonic
  const prog = PROGRESSIONS[Math.floor(rnd() * PROGRESSIONS.length)];
  const aeolian = MODES.aeolian;
  const startCut = opts.offsetSeconds !== undefined ? 0 : Math.min(UNDERGROUND_JOURNEY.length - 1, Math.max(0, Math.floor(opts.startAt ?? 0)));
  const startBar = opts.offsetSeconds !== undefined ? 0 : STARTS[startCut];
  console.info(`[music] underground set in ${midiToNote(root)} minor, ${Math.round(transport.bpm.value)} bpm, from cut ${startCut}`);

  // ----- bus: everything -> master lowpass (opens on the way in) -> out
  const masterLp = keep(new T.Filter({ frequency: 18000, type: 'lowpass', rolloff: -12, Q: 0.5 })).connect(out);
  const mix = keep(new T.Gain(1)).connect(masterLp);
  const fx = createFx(T, keep, mix, { reverbDecay: 3.2, reverbHp: 350, snareSend: 0.1, echoTime: '8n.', echoFeedback: 0.5, echoLp: 3000, delayDry: 0.7, delayRevSend: 0.35 });
  const duck = keep(new T.Gain(1)).connect(mix); // everything tonal ducks under the kick
  const drumBus = keep(new T.Compressor({ threshold: -16, ratio: 3.5, attack: 0.006, release: 0.12 })).connect(mix);

  const layer = (dest: ToneNS.InputNode): ToneNS.Gain => keep(new T.Gain(0)).connect(dest);
  const gains: Record<Layer, ToneNS.Gain> = {
    hat: layer(drumBus), ohat: layer(drumBus), clap: layer(drumBus), tom: layer(drumBus),
    rim: layer(drumBus), shaker: layer(drumBus), acid: layer(duck), ping: layer(duck),
    chord: layer(duck), stab: layer(duck), pad: layer(duck), sub: layer(duck),
  };

  // ----- kick: one voice whose character morphs with the blend (round and dark for dub, hard and gritty for acid)
  const kickGrit = keep(new T.Distortion(0.1)).connect(drumBus);
  const kickLp = keep(new T.Filter(18000, 'lowpass')).connect(kickGrit);
  const kick = keep(new T.MembraneSynth({ pitchDecay: 0.03, octaves: 6, envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.05 } })).connect(kickLp);
  kick.volume.value = -3;
  const punch = keep(new T.MembraneSynth({ pitchDecay: 0.05, octaves: 4, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.05 } })).connect(drumBus);
  punch.volume.value = -10;

  // ----- percussion
  const clapBp = keep(new T.Filter({ frequency: 1500, type: 'bandpass', Q: 0.8 })).fan(gains.clap, fx.snareSend);
  const clap = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.05 } })).connect(clapBp);
  clap.volume.value = -4;
  const snareBody = keep(new T.MembraneSynth({ pitchDecay: 0.012, octaves: 2, envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.02 } })).connect(gains.clap);
  snareBody.volume.value = -10;
  const hatHp = keep(new T.Filter(7500, 'highpass')).connect(gains.hat);
  const hat = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.035, sustain: 0, release: 0.01 } })).connect(hatHp);
  hat.volume.value = -11;
  const ohatHp = keep(new T.Filter(7000, 'highpass')).fan(gains.ohat, fx.delay);
  const ohat = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.03 } })).connect(ohatHp);
  ohat.volume.value = -12;
  const shakerBp = keep(new T.Filter({ frequency: 7500, type: 'bandpass', Q: 1.2 })).connect(gains.shaker);
  const shaker = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.004, decay: 0.05, sustain: 0, release: 0.02 } })).connect(shakerBp);
  shaker.volume.value = -13;
  const rimEcho = keep(new T.Gain(0.3)).connect(fx.delay);
  const rimBp = keep(new T.Filter({ frequency: 2600, type: 'bandpass', Q: 5 })).fan(gains.rim, rimEcho);
  const rim = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 } })).connect(rimBp);
  rim.volume.value = -4;
  // Toms are tuned to the key (tonic and fifth), so the busiest part of the kit still sits in the harmony.
  const tomPan = createPanner(T, keep, -0.25, gains.tom);
  const tomA = keep(new T.MembraneSynth({ pitchDecay: 0.04, octaves: 2.5, envelope: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.05 } })).connect(tomPan);
  tomA.volume.value = -4;
  const tomPanB = createPanner(T, keep, 0.3, gains.tom);
  const tomB = keep(new T.MembraneSynth({ pitchDecay: 0.03, octaves: 2, envelope: { attack: 0.001, decay: 0.16, sustain: 0, release: 0.05 } })).connect(tomPanB);
  tomB.volume.value = -5;
  const crashHp = keep(new T.Filter(3500, 'highpass')).fan(mix, fx.rev);
  const crash = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 1.4, sustain: 0, release: 0.4 } })).connect(crashHp);
  crash.volume.value = -13;

  // ----- acid: a resonant saw with an accent-driven filter envelope (the cutoff base is set note by note) and slides
  const acidEcho = keep(new T.Gain(0.12)).connect(fx.delay);
  const acidDrive = keep(new T.Distortion(0.28)).fan(gains.acid, acidEcho);
  const acid = keep(new T.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.003, decay: 0.18, sustain: 0.35, release: 0.06 },
    filter: { Q: 8, type: 'lowpass', rolloff: -24 },
    filterEnvelope: { attack: 0.003, decay: 0.16, sustain: 0.15, release: 0.1, baseFrequency: 300, octaves: 2.4 },
  })).connect(acidDrive);
  acid.volume.value = -13;
  const pingEcho = keep(new T.Gain(0.45)).connect(fx.delay);
  const pingLp = keep(new T.Filter(4800, 'lowpass')).fan(gains.ping, pingEcho);
  const pingHp = keep(new T.Filter(300, 'highpass')).connect(pingLp);
  const ping = keep(new T.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.002, decay: 0.16, sustain: 0, release: 0.12 } })).connect(pingHp);
  ping.volume.value = -14;

  // ----- dub: chord stabs through a filter that breathes, into a long echo and a big room
  const chordEcho = keep(new T.Gain(0.4)).connect(fx.delay);
  const chordRev = keep(new T.Gain(0.25)).connect(fx.rev);
  const chordLp = keep(new T.Filter({ frequency: 1200, type: 'lowpass', Q: 2.5, rolloff: -24 })).fan(gains.chord, chordEcho, chordRev, fx.throwSend);
  const chordHp = keep(new T.Filter(200, 'highpass')).connect(chordLp);
  const chord = keep(new T.PolySynth(T.Synth, { oscillator: { type: 'fatsawtooth', count: 2, spread: 14 }, envelope: { attack: 0.006, decay: 0.38, sustain: 0, release: 0.4 } })).connect(chordHp);
  chord.volume.value = 0;
  // House stabs: short and dry, a little echo.
  const stabEcho = keep(new T.Gain(0.15)).connect(fx.delay);
  const stabLp = keep(new T.Filter(4200, 'lowpass')).fan(gains.stab, stabEcho);
  const stabHp = keep(new T.Filter(260, 'highpass')).connect(stabLp);
  const stab = keep(new T.PolySynth(T.Synth, { oscillator: { type: 'square' }, envelope: { attack: 0.004, decay: 0.13, sustain: 0.02, release: 0.1 } })).connect(stabHp);
  stab.volume.value = -10;

  // ----- bass: one sub voice, so the swap between modes is a clean hand-off
  const sub = keep(new T.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.008, decay: 0.15, sustain: 0.85, release: 0.1 } })).connect(gains.sub);
  sub.volume.value = -12;

  // ----- texture: a bed of band-passed noise (dust and air) and a riser for the builds
  const padBp = keep(new T.Filter({ frequency: 900, type: 'bandpass', Q: 2.5 })).fan(gains.pad, fx.rev);
  const padNoise = keep(new T.Noise('pink')).connect(padBp);
  padNoise.volume.value = -27;
  padNoise.start();
  const riserBp = keep(new T.Filter({ frequency: 600, type: 'bandpass', Q: 1.2 })).fan(mix, fx.rev);
  const riserGain = keep(new T.Gain(0)).connect(riserBp);
  const riser = keep(new T.Noise('white')).connect(riserGain);
  riser.volume.value = -8;
  riser.start();

  // ----- material, built the first time a cut is needed
  const mats = new Map<number, Material>();
  const matOf = (lap: number, cut: number): Material => {
    const key = lap * 100 + cut;
    let m = mats.get(key);
    if (!m) { m = makeMaterial(seed, lap, cut); mats.set(key, m); }
    return m;
  };
  /** The material that owns a mode's layers right now, and how many bars into its phrases it is (the next cut counts from 0 at the start of the crossfade). */
  const ownerOf = (p: BarPlan, mode: SetMode): { mat: Material; u: number } | null => {
    if (p.mode === mode) return { mat: matOf(p.lap, p.cut), u: p.rel + XFADE_BARS };
    if (p.x > 0 && p.nextMode === mode) {
      const lap = p.next === 0 ? p.lap + 1 : p.lap;
      return { mat: matOf(lap, p.next), u: Math.floor(p.x * XFADE_BARS + 1e-6) };
    }
    return null;
  };

  // ----- the sequencer
  type State = { p: BarPlan; w: Weights; lv: Record<Layer, number>; wNow: Weights };
  let st: State | null = null;
  let step = opts.offsetSeconds !== undefined ? Math.max(0, Math.floor(opts.offsetSeconds / step16)) : 0;
  let lastDominant = -1;
  let pingCount = 0;
  let chordVoice: number[] | null = null;
  let stabVoice: number[] | null = null;
  const chordSemis = (bar: number): number => aeolian[prog[Math.floor(mod(bar, 16) / 4)] % 7];
  const chordDegree = (bar: number): number => prog[Math.floor(mod(bar, 16) / 4)];

  const draw = (T as unknown as { Draw?: { schedule?: (cb: () => void, time: number) => void } }).Draw;
  const announce = (index: number, mode: SetMode, time: number): void => {
    const cb = opts.onCut;
    if (!cb) return;
    const fire = (): void => { try { cb(index, mode); } catch { /* the radio must never break the music */ } };
    if (draw && typeof draw.schedule === 'function') draw.schedule(fire, time);
    else fire();
  };

  const onBar = (bar: number, time: number, first: boolean): void => {
    const p = planAt(bar);
    const pn = planAt(bar + 1); // levels are set for the end of this bar and ramped to over the bar
    const w = weightsOf(pn);
    const lv = levelsOf(w, pn.energy);
    lv.sub = levelsOf(weightsOf(p), p.energy).sub; // the bass swaps on the bar line, so it follows this bar, not the next
    st = { p, w, lv, wNow: weightsOf(p) };
    const lvNow = first ? levelsOf(weightsOf(p), p.energy) : null;
    for (const l of Object.keys(gains) as Layer[]) {
      if (lvNow) gains[l].gain.setValueAtTime(lvNow[l], time);
      gains[l].gain.rampTo(lv[l], barS, time);
    }
    if (p.dominant !== lastDominant) {
      lastDominant = p.dominant;
      announce(p.dominant, UNDERGROUND_JOURNEY[p.dominant].mode, time);
    }
    // Echo and room: deeper while dub chords are present or on their way out, and when the energy is low.
    const wDub = w.tonal.dub;
    chordEcho.gain.rampTo(0.3 + 0.3 * (1 - pn.energy) + 0.4 * (1 - wDub), barS, time);
    chordRev.gain.rampTo(0.2 + 0.25 * (1 - pn.energy), barS, time);
    padBp.frequency.rampTo(450 * 2 ** (pn.energy * 2 + 0.8 * Math.sin(bar / 4)), barS, time);
    // Riser: up through a breakdown, and over the way into an acid cut; a falling sweep over the way out of one.
    let rg = 0;
    let rf = 600;
    const nextAcid = pn.x > 0.4 && pn.nextMode === 'acid';
    const leavingAcid = pn.x > 0.15 && pn.mode === 'acid';
    if (pn.brk.on || (p.brk.on && !pn.brk.on)) { rg = 0.02 + 0.07 * p.brk.prog; rf = 500 + 4500 * p.brk.prog; }
    else if (nextAcid) { rg = 0.03 + 0.04 * pn.x; rf = 700 + 2800 * pn.x; }
    else if (leavingAcid) { rg = 0.05 * (1 - pn.x); rf = 4000 - 3200 * pn.x; }
    else if (bar % PHRASE_BARS === PHRASE_BARS - 1 && pn.energy > 0.6) { rg = 0.025; rf = 2500; }
    riserGain.gain.rampTo(rg, barS, time);
    riserBp.frequency.rampTo(rf, barS, time);
    // Arrival marks: a crash on every 16-bar boundary, bigger when a cut's own sound arrives.
    if (bar % 16 === 0 && !first) crash.triggerAttackRelease(1.2, time, p.rel === 0 ? 0.55 : 0.3);
    if (first) {
      masterLp.frequency.setValueAtTime(500, time);
      masterLp.frequency.exponentialRampToValueAtTime(18000, time + barS * 3);
    }
  };

  const loop = keep(new T.Loop((time) => {
    const g = step++;
    const bar = startBar + Math.floor(g / 16);
    const pos = g % 16;
    if (pos === 0) onBar(bar, time, g === 0);
    const s = st;
    if (!s) return;
    const { p, w, lv } = s;
    const E = p.energy;
    const brkOn = p.brk.on;
    const ow = { acid: ownerOf(p, 'acid'), dub: ownerOf(p, 'dub'), drum: ownerOf(p, 'drum') };
    const rhythmNow = s.wNow.rhythm;
    const wsum = rhythmNow.acid + rhythmNow.dub + rhythmNow.drum || 1;
    const soft = rhythmNow.dub / wsum;
    const hard = rhythmNow.acid / wsum;
    const houseLike = rhythmNow.drum / wsum;
    const phraseBar = mod(bar, PHRASE_BARS);
    const inPhrase = phraseBar * 16 + pos; // steps since the phrase downbeat: the polymeter restarts here
    const swing = (0.04 + 0.1 * houseLike) * step16;
    const lastOfPhrase = phraseBar === PHRASE_BARS - 1;
    const dubOut = p.mode === 'dub' && p.x === 0 && mod(bar, 16) === 15 && p.rel >= 16;
    const kickOff = brkOn || dubOut;

    // Kick: four on the floor, always, except in a breakdown or a dub drop-out.
    if (pos % 4 === 0 && !kickOff) {
      kick.set({ pitchDecay: 0.03 + 0.02 * soft, octaves: 6 - 2.5 * soft, envelope: { decay: 0.22 + 0.16 * soft } });
      kickLp.frequency.setValueAtTime(18000 - soft * 14500, time);
      kickGrit.distortion = 0.05 + 0.3 * hard;
      kick.triggerAttackRelease('C1', '8n', time, 0.95 - 0.2 * soft);
      if (hard + houseLike > 0.5 && pos === 0) punch.triggerAttackRelease('C1', '8n', time, 0.7);
      const depth = 0.7 - 0.2 * (hard + houseLike);
      duck.gain.setValueAtTime(depth, time);
      duck.gain.linearRampToValueAtTime(1, time + 0.17);
    }
    if (p.sinceDrop === 0 && pos === 0 && mod(bar, 16) !== 0) crash.triggerAttackRelease(1.6, time, 0.7);

    // Percussion. The straight 4/4 elements (clap, hats, shaker) hold the floor.
    const fill = lastOfPhrase && E > 0.5 && !brkOn && p.x === 0 && p.mode !== 'dub';
    const dubTss = pos % 4 === 2;
    if (lv.clap > 0.03 && !brkOn) {
      if (pos === 4 || pos === 12) { clap.triggerAttackRelease('16n', time, 0.85); snareBody.triggerAttackRelease('E3', '32n', time, 0.6); }
      if (fill && pos >= 14) { clap.triggerAttackRelease('32n', time, 0.4 + 0.1 * (pos - 14)); }
    }
    if (lv.ohat > 0.03 && dubTss && !brkOn) ohat.triggerAttackRelease('8n', time, 0.5);
    if (lv.hat > 0.03 && pos % 2 === 1 && !brkOn && !dubOut) hat.triggerAttackRelease('32n', time + swing, pos % 4 === 3 ? 0.55 : 0.35);
    if (lv.hat > 0.03 && p.brk.on && p.mode === 'drum' && pos % 2 === 1) hat.triggerAttackRelease('32n', time + swing, 0.3);
    if (lv.shaker > 0.03 && !dubOut) shaker.triggerAttackRelease('32n', time + (pos % 2 === 1 ? swing : 0), pos % 4 === 3 ? 0.55 : 0.28);
    const drumOwner = ow.drum ?? ow.acid ?? ow.dub;
    if (drumOwner) {
      const m = drumOwner.mat;
      if (lv.rim > 0.03 && !dubOut && m.rim[inPhrase % m.rim.length]) rim.triggerAttackRelease('32n', time, 0.6);
      if (lv.tom > 0.03) {
        const hitA = m.tomA[inPhrase % m.tomA.length];
        const hitB = m.tomB[inPhrase % m.tomB.length] && pos % 2 === 0;
        if (fill && pos >= 12) {
          (pos % 2 === 0 ? tomA : tomB).triggerAttackRelease(midiToNote(root + 24 + (pos >= 14 ? 7 : 0)), '16n', time, 0.6 + 0.08 * (pos - 12));
        } else {
          if (hitA && pos % 4 !== 0) tomA.triggerAttackRelease(midiToNote(root + 24), '16n', time, 0.75);
          else if (hitB && pos % 4 !== 0) tomB.triggerAttackRelease(midiToNote(root + 31), '16n', time, 0.65);
        }
      }
    }

    // Acid line: a tonic pedal riff, its own length against the bar, through the macro filter.
    const acidOwner = ow.acid;
    if (acidOwner && lv.acid > 0.03) {
      const m = acidOwner.mat;
      const n = m.riffs[Math.floor(acidOwner.u / PHRASE_BARS) % m.riffs.length][inPhrase % m.riffLen];
      if (n.on || (n.ghost && E > 0.75)) {
        const cutoff = acidCutoff(bar, pos, { energy: E, weight: w.tonal.acid, brk: p.brk, sinceDrop: p.sinceDrop });
        const accent = n.on && n.accent;
        acid.filterEnvelope.baseFrequency = cutoff;
        // The envelope opens the note's own filter above the base; keep the peak under the audible top.
        acid.filterEnvelope.octaves = Math.min(accent ? 3.4 : 2.2, Math.max(0.3, Math.log2(15000 / cutoff)));
        acid.filter.Q.value = 5 + 8 * E;
        acid.portamento = n.slide ? 0.06 : 0;
        acid.triggerAttackRelease(midiToNote(root + 12 + n.semi), step16 * (n.slide ? 1.6 : 0.85), time, n.on ? (accent ? 1 : 0.65) : 0.3);
      }
      // The ping answers on its own cycle, walking the current chord.
      if (lv.ping > 0.03 && m.ping[inPhrase % m.pingLen]) {
        if (inPhrase === 0) pingCount = 0;
        const tones = chordTones(aeolian, chordDegree(bar), 4);
        const idx = m.pingWalk[pingCount++ % m.pingWalk.length];
        ping.triggerAttackRelease(midiToNote(root + 36 + tones[idx % tones.length] + (idx > 2 ? 12 : 0)), '16n', time, 0.7);
      }
    }

    // Dub chords: a few stabs a bar, voiced without the root (the sub plays it), through the breathing filter.
    const dubOwner = ow.dub;
    if (dubOwner && lv.chord > 0.03) {
      const rhythm = dubOwner.mat.chordRhythm[bar % 2];
      const k = rhythm.indexOf(pos);
      if (k >= 0) {
        const tones = chordTones(aeolian, chordDegree(bar), 5).slice(1);
        chordVoice = voiceLead(tones, 28, chordVoice);
        chordLp.frequency.setValueAtTime(dubCutoff(bar, pos, E, w.tonal.dub), time);
        const throwIt = mod(bar, 4) === 3 && k === rhythm.length - 1;
        if (throwIt) { fx.throwSend.gain.setValueAtTime(0.5, time); fx.throwSend.gain.setValueAtTime(0, time + step16 * 2); }
        chord.triggerAttackRelease(chordVoice.map((t) => midiToNote(root + t)), step16 * 2.5, time, k === 0 ? 0.8 : 0.6);
      }
    }

    // House stabs: syncopated minor 7ths, only with energy.
    const stabOwner = ow.drum;
    if (stabOwner && lv.stab > 0.03 && !dubOut && stabOwner.mat.stabRhythm.includes(pos)) {
      const tones = chordTones(aeolian, chordDegree(bar), 4);
      stabVoice = voiceLead(tones, 26, stabVoice);
      stab.triggerAttackRelease(stabVoice.map((t) => midiToNote(root + 12 + t)), step16 * 0.9, time, pos === stabOwner.mat.stabRhythm[0] ? 0.85 : 0.6);
    }

    // Bass: one voice, whose pattern is the pattern of whichever mode owns the low end.
    if (lv.sub > 0.03 && !brkOn) {
      const bm = s.wNow.bass;
      const bn = (semi: number): string => midiToNote(root + semi);
      const cs = chordSemis(bar);
      if (bm === 'dub') {
        if (pos === 0) sub.triggerAttackRelease(bn(cs), step16 * 6, time, 0.9);
        else if (pos === 10 && mod(bar, 2) === 1) sub.triggerAttackRelease(bn(cs), step16 * 3, time, 0.6);
      } else if (bm === 'drum') {
        if (pos % 4 === 2) sub.triggerAttackRelease(bn(cs + (pos === 14 && mod(bar, 4) === 3 ? 12 : 0)), step16 * 2.2, time, pos % 8 === 2 ? 0.9 : 0.7);
      } else if (pos === 0) {
        sub.triggerAttackRelease(bn(0), step16 * 14, time, 0.75);
      }
    }
  }, '16n'));
  loop.start(0);
}
