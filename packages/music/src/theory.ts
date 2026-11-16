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
  aeolian:  [0, 2, 3, 5, 7, 8, 10],
  dorian:   [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  harmonic: [0, 2, 3, 5, 7, 8, 11], // harmonic minor: the raised 7th gives a major V
  lydian:     [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
} as const;
export type ModeName = keyof typeof MODES;

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
