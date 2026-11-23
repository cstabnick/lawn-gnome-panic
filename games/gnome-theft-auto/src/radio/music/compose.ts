// Turns a SongSpec into notes. Pure (no Tone, no DOM), so the theory can be tested: every note is in the song's scale,
// every chord is diatonic and neither diminished nor augmented, the melody lands on chord tones on the strong beats and
// on anything it holds, it moves mostly by step (a leap is followed by a step back), questions end open and answers end
// on the chord's root, and the loop always lands back on the tonic.
//
// The energy curve and the layer levels follow Subsoil Radio's set (@lawn/music undergroundSet.ts): one continuous
// energy value per bar that every layer reads, so nothing jumps with the section.
import { MODES, chordTones, degreeToMidi, mulberry32, voiceLead } from '@lawn/music';
import type { BarChord, SongSpec } from './spec';

export type Layer = 'kick' | 'snare' | 'hat' | 'open' | 'bass' | 'chord' | 'pad' | 'lead';

/** One note or hit. `pos` and `len` are in sixteenths; `midi` is empty for drums. */
export interface Ev {
  layer: Layer;
  bar: number;
  pos: number;
  midi: readonly number[];
  len: number;
  vel: number;
}

export interface HalfBar {
  /** Scale degree 0..6 of the chord. */
  degree: number;
  /** Pitch classes (0..11) of its chord tones. */
  pcs: readonly number[];
}

export interface Composition {
  bpm: number;
  tonic: number;
  meter: 3 | 4;
  /** Sixteenths per bar. */
  grid: 12 | 16;
  bars: number;
  /** Pitch classes of the key. */
  scale: readonly number[];
  /** The chord at each half bar: harmony[bar * 2 + half]. */
  harmony: readonly HalfBar[];
  /** The energy curve, one value per bar, 0..1. */
  energy: readonly number[];
  /** Bars that are a breakdown (no kick, no bass). */
  breakdown: readonly boolean[];
  events: Ev[];
}

/** The mix buses a song's layers play through; levelsAt gives each one's level for a bar. */
export type Bus = 'drums' | 'bass' | 'chord' | 'pad' | 'lead' | 'texture';

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const smooth = (v: number): number => { const t = clamp01(v); return t * t * (3 - 2 * t); };
const gate = (e: number, lo: number, hi: number): number => smooth((e - lo) / (hi - lo));
const mod = (n: number, m: number): number => ((n % m) + m) % m;

/** A stable seed from a song title, so a song always sounds the same. */
export function titleSeed(title: string): number {
  let h = 2166136261;
  for (let i = 0; i < title.length; i++) {
    h ^= title.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 999983 + 1;
}

/** The quality of the triad on a scale degree. */
export function triadQuality(mode: readonly number[], degree: number): 'major' | 'minor' | 'dim' | 'aug' {
  const [r, t, f] = chordTones(mode, mod(degree, 7), 3);
  const third = t - r;
  const fifth = f - r;
  if (third === 4 && fifth === 7) return 'major';
  if (third === 3 && fifth === 7) return 'minor';
  if (third === 3 && fifth === 6) return 'dim';
  return 'aug';
}

const halves = (c: BarChord): [number, number] => (typeof c === 'number' ? [c, c] : [c[0], c[1]]);

/** Everything wrong with a spec, as readable lines (empty when it is fine). */
export function checkSpec(spec: SongSpec): string[] {
  const out: string[] = [];
  const mode = MODES[spec.mode];
  const grid = spec.meter === 3 ? 12 : 16;
  if (!mode) return [`unknown mode ${spec.mode}`];
  if (!(spec.bpm >= 56 && spec.bpm <= 170)) out.push(`bpm ${spec.bpm} is outside 56..170`);
  if (!(spec.tonic >= 43 && spec.tonic <= 57)) out.push(`tonic ${spec.tonic} is outside 43..57`);
  if (!(spec.swing >= 0 && spec.swing <= 0.34)) out.push(`swing ${spec.swing} is outside 0..0.34`);
  if (!(spec.pump >= 0 && spec.pump <= 1)) out.push(`pump ${spec.pump} is outside 0..1`);
  if (spec.form.length < 6 || spec.form.length > 12) out.push(`form has ${spec.form.length} parts (6..12)`);
  for (const [name, prog] of Object.entries(spec.progressions)) {
    if (prog.length !== 4) out.push(`progression ${name} has ${prog.length} bars (4)`);
    for (const c of prog) {
      for (const d of halves(c)) {
        if (!Number.isInteger(d) || d < 0 || d > 6) { out.push(`progression ${name}: degree ${d} is not 0..6`); continue; }
        const q = triadQuality(mode, d);
        if (q === 'dim' || q === 'aug') out.push(`progression ${name}: degree ${d} is a ${q} chord in ${spec.mode}`);
      }
    }
  }
  for (const p of spec.form) if (!spec.progressions[p.s]) out.push(`form uses unknown progression ${p.s}`);
  const last = spec.progressions[spec.form[spec.form.length - 1]?.s];
  if (last && halves(last[3])[1] !== 0) out.push('the last part does not end on the tonic (0)');
  for (const [k, row] of Object.entries(spec.drums)) {
    if (row !== undefined && row.length !== grid) out.push(`drum row ${k} is ${row.length} long (${grid})`);
  }
  for (const s of spec.comp.steps) if (s < 0 || s >= grid) out.push(`comp step ${s} is outside the bar`);
  for (const [pos] of spec.bassPat) if (pos < 0 || pos >= grid) out.push(`bass step ${pos} is outside the bar`);
  if (!(spec.melody.lo >= -3 && spec.melody.hi <= 12 && spec.melody.lo < spec.melody.hi)) out.push('melody range must be lo -3..hi 12, lo < hi');
  if (spec.melody.lens.some((l) => l < 1 || l > grid)) out.push('melody note lengths must be 1..bar');
  const seconds = spec.form.length * 4 * spec.meter * (60 / spec.bpm);
  if (seconds < 40 || seconds > 130) out.push(`the loop is ${seconds.toFixed(0)} s long (40..130)`);
  return out;
}

/** Is a sixteenth a strong beat (where the melody must sit on a chord tone)? The downbeat, and beat 3 in 4/4. */
export const isStrong = (pos: number, grid: number): boolean => pos === 0 || (grid === 16 && pos === 8);

/** The scale degree nearest `deg` whose pitch class is one of `targets` (degrees mod 7). */
function snapTo(deg: number, targets: readonly number[]): number {
  let best = deg;
  let bestD = Infinity;
  for (let d = deg - 3; d <= deg + 3; d++) {
    if (!targets.includes(mod(d, 7))) continue;
    const dist = Math.abs(d - deg);
    if (dist < bestD) { best = d; bestD = dist; }
  }
  return best;
}

interface MelNote { bar: number; pos: number; len: number; deg: number }

/** A two-bar rhythm, [position in two bars, length] in sixteenths. Strong beats are never rests. */
function makeRhythm(rnd: () => number, spec: SongSpec, grid: number): [number, number][] {
  const out: [number, number][] = [];
  for (let b = 0; b < 2; b++) {
    let pos = 0;
    while (pos < grid) {
      let len = spec.melody.lens[Math.floor(rnd() * spec.melody.lens.length)];
      // Never ring across a strong beat: the next strong beat starts a new note.
      const nextStrong = pos < 8 && grid === 16 ? 8 : grid;
      if (pos + len > nextStrong && pos < nextStrong) len = nextStrong - pos;
      if (pos + len > grid) len = grid - pos;
      const rest = !isStrong(pos, grid) && rnd() < spec.melody.rest;
      if (!rest) out.push([b * grid + pos, len]);
      pos += len;
    }
  }
  return out;
}

/**
 * One four-bar phrase over `chords` (degrees per half bar, 8 entries): a question over bars 0-1 and an answer over 2-3
 * on the same rhythm. Strong beats, chord changes and held notes (a beat or longer) take chord tones; the line moves by
 * step, leaps at most a fifth and steps back after a leap. The question ends on a third or fifth, the answer on a root.
 */
function composePhrase(rnd: () => number, spec: SongSpec, grid: number, chords: readonly number[], rhythm: [number, number][], endOnTonic: boolean): MelNote[] {
  const out: MelNote[] = [];
  const { lo, hi } = spec.melody;
  let cur = Math.round((lo + hi) / 2);
  let lastMove = 0;
  const chordAt = (bar: number, pos: number): number => chords[bar * 2 + (pos >= grid / 2 ? 1 : 0)];
  for (let half = 0; half < 2; half++) {
    rhythm.forEach(([p, l], i) => {
      const bar = half * 2 + Math.floor(p / grid);
      const pos = p % grid;
      const deg = chordAt(bar, pos);
      const tones = [deg, deg + 2, deg + 4].map((d) => mod(d, 7));
      let move: number;
      if (Math.abs(lastMove) >= 3) move = -Math.sign(lastMove); // after a leap, step back
      else {
        const r = rnd();
        move = r < 0.15 ? 0 : r < 0.5 ? 1 : r < 0.85 ? -1 : (rnd() < 0.5 ? 3 : -3);
      }
      let next = cur + move;
      const changes = pos === 0 || (pos === grid / 2 && chordAt(bar, 0) !== deg);
      if (isStrong(pos, grid) || changes || l >= 4) next = snapTo(next, tones);
      const isLast = i === rhythm.length - 1;
      if (isLast) {
        // The question ends open (the chord's third or fifth), the answer on the chord's root. The song's last phrase
        // ends on the tonic, which is its last chord's root (checkSpec makes sure).
        next = snapTo(next, half === 0 ? [mod(deg + 2, 7), mod(deg + 4, 7)] : [endOnTonic ? 0 : mod(deg, 7)]);
      }
      // Keep in range by octaves of chord-tone-safe steps: fold back inside, staying on the same pitch class.
      while (next > hi) next -= 7;
      while (next < lo) next += 7;
      if (Math.abs(next - cur) > 4) next += next > cur ? -7 : 7; // no leap wider than a fifth
      while (next > hi) next -= 7;
      while (next < lo) next += 7;
      lastMove = next - cur;
      cur = next;
      out.push({ bar, pos, len: isLast ? Math.max(l, Math.min(grid - pos, grid / 2)) : l, deg: next });
    });
  }
  return out;
}

export function compose(spec: SongSpec, seed: number): Composition {
  const rnd = mulberry32(seed);
  const mode = MODES[spec.mode];
  const grid: 12 | 16 = spec.meter === 3 ? 12 : 16;
  const tonic = spec.tonic;
  const bars = spec.form.length * 4;
  const scale = mode.map((s) => mod(tonic + s, 12));

  // Harmony per half bar.
  const harmony: HalfBar[] = [];
  const degsByProg = new Map<string, number[]>();
  for (const [name, prog] of Object.entries(spec.progressions)) degsByProg.set(name, prog.flatMap(halves));
  for (const part of spec.form) {
    for (const d of degsByProg.get(part.s) ?? [0, 0, 0, 0, 0, 0, 0, 0]) {
      harmony.push({ degree: d, pcs: chordTones(mode, d, spec.chordSize).map((t) => mod(tonic + t, 12)) });
    }
  }

  // Energy: each part eases from the last part's value to its own over its four bars (the loop wraps).
  const energy: number[] = [];
  const breakdown: boolean[] = [];
  spec.form.forEach((part, i) => {
    const from = spec.form[mod(i - 1, spec.form.length)].e;
    for (let b = 0; b < 4; b++) {
      energy.push(from + (part.e - from) * smooth((b + 1) / 4));
      breakdown.push(!!part.brk);
    }
  });

  const events: Ev[] = [];
  const push = (layer: Layer, bar: number, pos: number, midi: number[], len: number, vel: number): void => {
    events.push({ layer, bar, pos, midi, len, vel: Math.min(1, Math.max(0.05, vel)) });
  };
  const human = (bar: number, pos: number): number => {
    const x = Math.sin((bar * 16 + pos) * 12.9898 + seed) * 43758.5453;
    return 0.9 + 0.1 * (x - Math.floor(x));
  };

  // Melody: one phrase per progression, composed once, so a section sounds the same each time it comes round.
  const phrases = new Map<string, MelNote[]>();
  const lastName = spec.form[spec.form.length - 1].s;
  for (const name of Object.keys(spec.progressions)) {
    phrases.set(name, composePhrase(rnd, spec, grid, degsByProg.get(name)!, makeRhythm(rnd, spec, grid), name === lastName));
  }

  let prevVoicing: number[] | null = null;
  spec.form.forEach((part, pi) => {
    const degs = degsByProg.get(part.s)!;
    const phraseEnergy = part.e;
    for (let b = 0; b < 4; b++) {
      const bar = pi * 4 + b;
      const brk = !!part.brk;
      const fill = b === 3 && phraseEnergy >= 0.5 && !brk && spec.kit !== 'none';

      // Chords: voiced near the middle of the keyboard, each moving as little as it can from the last.
      for (const pos of spec.comp.steps) {
        const deg = degs[b * 2 + (pos >= grid / 2 ? 1 : 0)];
        const strong = isStrong(pos, grid);
        const len = Math.max(1, Math.min(spec.comp.len, grid - pos));
        if (spec.chord === 'crunch') {
          // A power chord: root, fifth, octave (the fifth of a major or minor chord is always perfect).
          let root = degreeToMidi(tonic, mode, deg);
          while (root > 52) root -= 12;
          while (root < 40) root += 12;
          push('chord', bar, pos, [root, root + 7, root + 12], len, (strong ? 0.85 : 0.62) * human(bar, pos));
          continue;
        }
        const tones = chordTones(mode, deg, spec.chordSize).map((t) => tonic + t);
        const voiced = voiceLead(tones, 62, prevVoicing);
        prevVoicing = voiced;
        const sorted = [...voiced].sort((a, c) => a - c);
        if (spec.comp.arp) {
          const order = [0, 1, 2, 3, 2, 1];
          const k = spec.comp.steps.indexOf(pos);
          push('chord', bar, pos, [sorted[order[k % order.length] % sorted.length]], len, (strong ? 0.6 : 0.45) * human(bar, pos));
        } else {
          push('chord', bar, pos, sorted, len, (strong ? 0.6 : 0.46) * human(bar, pos));
        }
      }
      if (spec.pad) {
        for (const half of grid === 16 && degs[b * 2] !== degs[b * 2 + 1] ? [0, 1] : [0]) {
          const deg = degs[b * 2 + half];
          const tones = chordTones(mode, deg, 3).map((t) => tonic + t);
          const len = grid === 16 && degs[b * 2] !== degs[b * 2 + 1] ? grid / 2 : grid;
          push('pad', bar, half * (grid / 2), voiceLead(tones, 57, null), len, 0.4);
        }
      }

      // Bass: under the chord's root, kept in the bass range; no bass in a breakdown.
      if (!brk) {
        for (const [pos, kind, len] of spec.bassPat) {
          const deg = degs[b * 2 + (pos >= grid / 2 ? 1 : 0)];
          const place = (m: number): number => {
            while (m > 50) m -= 12;
            while (m < 33) m += 12;
            return m;
          };
          const root = place(degreeToMidi(tonic, mode, deg));
          let m = root;
          if (kind === 'f') m = root + (degreeToMidi(tonic, mode, deg + 4) - degreeToMidi(tonic, mode, deg));
          else if (kind === 'o') m = root + 12;
          else if (kind === 't') m = root + (degreeToMidi(tonic, mode, deg + 2) - degreeToMidi(tonic, mode, deg));
          else if (kind === 'a') {
            const nextDeg = degs[mod(b * 2 + 2, 8)];
            const target = place(degreeToMidi(tonic, mode, nextDeg));
            const step = rnd() < 0.5 ? 1 : -1;
            m = place(degreeToMidi(tonic, mode, nextDeg + step));
            if (Math.abs(m - target) > 2) m = place(degreeToMidi(tonic, mode, nextDeg - step));
          }
          push('bass', bar, pos, [m], Math.max(1, Math.min(len, grid - pos)), (pos === 0 ? 0.85 : 0.68) * human(bar, pos));
        }
      }

      // Drums: the grid, with a snare fill into the next part when the energy is up; no kick in a breakdown.
      if (spec.kit !== 'none') {
        const vel = (c: string | undefined): number => (c === 'x' ? 0.9 : c === 'o' ? 0.45 : 0);
        for (let pos = 0; pos < grid; pos++) {
          const h = human(bar, pos);
          if (!brk && vel(spec.drums.k?.[pos])) push('kick', bar, pos, [], 1, vel(spec.drums.k?.[pos]) * h);
          if (fill && pos >= grid - 4) push('snare', bar, pos, [], 1, (0.45 + 0.12 * (pos - grid + 4)) * h);
          else if (vel(spec.drums.s?.[pos])) push('snare', bar, pos, [], 1, vel(spec.drums.s?.[pos]) * h);
          if (vel(spec.drums.h?.[pos])) push('hat', bar, pos, [], 1, vel(spec.drums.h?.[pos]) * h);
          if (vel(spec.drums.o?.[pos])) push('open', bar, pos, [], 2, vel(spec.drums.o?.[pos]) * h);
        }
      }
    }

    // Melody: only in parts with the energy for it.
    if (spec.lead !== 'none' && part.e >= 0.4) {
      for (const n of phrases.get(part.s)!) {
        const base = degreeToMidi(tonic + 12, mode, n.deg);
        const midi = part.up && base + 12 <= 88 ? base + 12 : base;
        push('lead', pi * 4 + n.bar, n.pos, [midi], n.len, (isStrong(n.pos, grid) ? 0.82 : 0.66) * human(pi * 4 + n.bar, n.pos));
      }
    }
  });

  events.sort((a, b) => a.bar - b.bar || a.pos - b.pos);
  return { bpm: spec.bpm, tonic, meter: spec.meter, grid, bars, scale, harmony, energy, breakdown, events };
}

/**
 * Each bus's level for a bar, 0..1, from the energy curve (the Subsoil way: gates on one continuous energy, so layers
 * fade in and out rather than switch). Build ramps every bus to these over the bar and opens each tonal bus's filter
 * with its level, so a layer arrives through its own filter.
 */
export function levelsAt(spec: SongSpec, comp: Composition, bar: number): Record<Bus, number> {
  const b = mod(bar, comp.bars);
  const e = comp.energy[b];
  const brk = comp.breakdown[b];
  return {
    drums: spec.kit === 'none' ? 0 : brk ? 0.35 : 0.35 + 0.65 * gate(e, 0.15, 0.45),
    bass: brk ? 0 : 0.4 + 0.6 * gate(e, 0.05, 0.3),
    chord: 0.6 + 0.4 * gate(e, 0, 0.4),
    pad: spec.pad ? 0.45 + 0.55 * (1 - e) : 0,
    lead: spec.lead === 'none' ? 0 : gate(e, 0.3, 0.5),
    texture: spec.texture === 'none' ? 0 : 0.5 + 0.5 * (1 - e),
  };
}
