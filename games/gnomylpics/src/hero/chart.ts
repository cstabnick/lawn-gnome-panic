// Gnome Hero's chart: a random, beat-driven 4-lane note list from a seed (pure: no DOM, no three).
// The same seed always gives the same chart, so every seat judges the same notes.
import { mulberry32 } from '@lawn/party';

export type Lane = 0 | 1 | 2 | 3;
export interface Note { t: number; lane: Lane }
export interface Chart { bpm: number; beat: number; leadS: number; songS: number; notes: Note[] }

/** Song seconds before the first note (the drums and the highway start here). */
export const LEAD_S = 2;

const BPM_MIN = 96;
const BPM_STEPS = 8;
const BPM_STEP = 4;
const SONG_TARGET_S = 38;
const MAX_CACHED = 4;

function round4(x: number): number {
  return Math.round(x * 1e4) / 1e4;
}

export function makeChart(seed: number): Chart {
  const rng = mulberry32(seed);
  const bpm = BPM_MIN + Math.floor(rng() * BPM_STEPS) * BPM_STEP;
  const beat = 60 / bpm;
  const bars = Math.floor(SONG_TARGET_S / (4 * beat));

  const notes: Note[] = [];
  let lane = 1;
  let prev = -1;
  let prev2 = -1;

  const pickLane = (): Lane => {
    let next: number;
    if (rng() < 0.15) {
      next = Math.floor(rng() * 4);
    } else {
      next = lane + (rng() < 0.5 ? -1 : 1) * (rng() < 0.7 ? 1 : 0);
    }
    next = Math.min(3, Math.max(0, next));
    // Never the same lane three times in a row: nudge it one step towards the middle.
    if (next === prev && next === prev2) next = next < 1.5 ? next + 1 : next - 1;
    prev2 = prev;
    prev = next;
    lane = next;
    return next as Lane;
  };

  for (let b = 0; b <= bars - 2; b++) {
    const sec = b / bars;
    for (let i = 0; i < 8; i++) {
      const chance = i % 2 === 0 ? Math.min(0.95, 0.75 + 0.25 * sec) : 0.25 + 0.45 * sec;
      if (rng() < chance) {
        notes.push({ t: round4(LEAD_S + ((b * 8 + i) * beat) / 2), lane: pickLane() });
      }
    }
  }
  // Last bar: one note on its first beat.
  notes.push({ t: round4(LEAD_S + (bars - 1) * 4 * beat), lane: pickLane() });

  return { bpm, beat, leadS: LEAD_S, songS: LEAD_S + bars * 4 * beat, notes };
}

const cache = new Map<number, Chart>();

/** makeChart, memoised for the last few seeds. */
export function chartFor(seed: number): Chart {
  const hit = cache.get(seed);
  if (hit) return hit;
  const chart = makeChart(seed);
  cache.set(seed, chart);
  if (cache.size > MAX_CACHED) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return chart;
}
