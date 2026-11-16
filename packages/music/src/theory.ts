// Music theory helpers shared by the run track and the menu theme.

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export function midiToNote(m: number): string {
  return `${NOTE_NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
}

/** Scale steps of each mode, in semitones from the tonic. */
export const MODES = {
  aeolian:    [0, 2, 3, 5, 7, 8, 10],
  dorian:     [0, 2, 3, 5, 7, 9, 10],
  phrygian:   [0, 1, 3, 5, 7, 8, 10],
  harmonic:   [0, 2, 3, 5, 7, 8, 11], // harmonic minor: the raised 7th gives a major V
  ionian:     [0, 2, 4, 5, 7, 9, 11], // natural major
  lydian:     [0, 2, 4, 6, 7, 9, 11], // bright, open film-score major (#4)
  mixolydian: [0, 2, 4, 5, 7, 9, 10], // warm folk/fanfare major (b7)
} as const;
export type ModeName = keyof typeof MODES;

/** Converts an arbitrary diatonic scale degree (negative or >= 7 allowed) to a MIDI note. */
export function degreeToMidi(root: number, mode: readonly number[], deg: number): number {
  const len = mode.length;
  const oct = Math.floor(deg / len);
  const idx = ((deg % len) + len) % len;
  return root + mode[idx] + 12 * oct;
}

/** A single note in a bar-relative motif, using diatonic scale degrees. */
export interface MotifNote {
  bar: number;
  step: number;
  deg: number;
  len: number;
  vel?: number;
}

/** Shifts a motif diatonically by `degShift` scale degrees (great for call-and-answer riffs). */
export function transposeMotif(motif: readonly MotifNote[], degShift: number, velScale = 1): MotifNote[] {
  return motif.map((n) => ({ ...n, deg: n.deg + degShift, vel: (n.vel ?? 1) * velScale }));
}

/** Inverts a motif diatonically around `pivotDeg` so upward leaps become downward leaps. */
export function invertMotif(motif: readonly MotifNote[], pivotDeg: number): MotifNote[] {
  return motif.map((n) => ({ ...n, deg: 2 * pivotDeg - n.deg }));
}

/**
 * Riffs on a motif by adding occasional diatonic passing tones or gentle rhythmic echoes
 * without crowding the space.
 */
export function ornamentMotif(motif: readonly MotifNote[], rnd: () => number, stepsPerBar = 16): MotifNote[] {
  const out: MotifNote[] = [];
  for (let i = 0; i < motif.length; i++) {
    const n = motif[i];
    out.push(n);
    const next = motif[i + 1];
    const gap = next ? (next.bar - n.bar) * stepsPerBar + (next.step - n.step) : n.len;
    if (n.len >= 6 && gap >= 6 && rnd() < 0.45) {
      const stepOffset = Math.min(n.len - 2, 4);
      const absStep = n.step + stepOffset;
      const dir = next && next.deg !== n.deg ? Math.sign(next.deg - n.deg) : (rnd() < 0.5 ? 1 : -1);
      out.push({
        bar: n.bar + Math.floor(absStep / stepsPerBar),
        step: absStep % stepsPerBar,
        deg: n.deg + dir,
        len: 2,
        vel: (n.vel ?? 1) * 0.72,
      });
    }
  }
  return out;
}

/** Small deterministic velocity variation so repeated phrases breathe naturally. */
export function humanize(step: number, amount = 0.1): number {
  const x = Math.sin(step * 12.9898) * 43758.5453;
  return (1 - amount) + amount * (x - Math.floor(x));
}

/** Chord tones for a scale degree, stacked in thirds inside the mode (size 4 = 7th chord, 5 = 9th). */
export function chordTones(mode: readonly number[], degree: number, size: number): number[] {
  const out: number[] = [];
  for (let k = 0; k < size; k++) {
    const idx = degree + 2 * k;
    out.push(mode[idx % 7] + 12 * Math.floor(idx / 7));
  }
  return out;
}

/** Picks the inversion/octave of `tones` (around `center`) that moves least from `prev`. */
export function voiceLead(tones: number[], center: number, prev: number[] | null): number[] {
  const candidates: number[][] = [];
  for (let inv = 0; inv < tones.length; inv++) {
    const v = tones.map((t, i) => t + (i < inv ? 12 : 0)).sort((x, y) => x - y);
    for (let oct = -2; oct <= 2; oct++) {
      const shifted = v.map((t) => t + 12 * oct);
      const mid = (shifted[0] + shifted[shifted.length - 1]) / 2;
      if (Math.abs(mid - center) <= 7) candidates.push(shifted);
    }
  }
  if (!prev) return candidates.reduce((best, c) => {
    const d = (x: number[]) => Math.abs((x[0] + x[x.length - 1]) / 2 - center);
    return d(c) < d(best) ? c : best;
  });
  const cost = (c: number[]) => c.reduce((sum, t, i) => sum + Math.abs(t - prev[Math.min(i, prev.length - 1)]), 0);
  return candidates.reduce((best, c) => (cost(c) < cost(best) ? c : best));
}
