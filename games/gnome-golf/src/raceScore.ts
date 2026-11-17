// GNOME W FRIENDS (race) scoring, Super Battle Golf style: points per hole, most points wins.
// Each hole is scored on its own: stroke points for how well you played it, plus a speed bonus for how fast you
// holed out, ranked against everyone else's time on that same hole (not the total round time).
// Pure: no DOM, no Ctx.
import { HOLES, ROUND } from './config';

/** Speed bonus by finishing place on a hole: 1st, 2nd, 3rd. */
export const SPEED_BONUS = [3, 2, 1] as const;

/** Stroke points for a hole: par 5, each stroke under par +1, each over -1 (never below 1); a hole in one 8; picked up 0. */
export function strokePoints(strokes: number, par: number): number {
  if (strokes >= ROUND.maxStrokes) return 0;
  if (strokes === 1) return 8;
  return Math.max(1, Math.min(8, 5 - (strokes - par)));
}

/**
 * Speed places on one hole: times[k] is golfer k's seconds to hole out (null = not holed out or picked up).
 * Returns each golfer's place (0 = fastest) or null; equal times share a place.
 */
export function speedPlaces(times: readonly (number | null)[]): (number | null)[] {
  return times.map((t) => (t === null ? null : times.filter((o) => o !== null && o < t).length));
}

/** The speed bonus for a place (null or 4th and later: none). */
export function speedBonus(place: number | null): number {
  return place === null ? 0 : (SPEED_BONUS[place] ?? 0);
}

export interface RacePlayer {
  /** Strokes per hole, null if not played. */
  scores: readonly (number | null)[];
  /** Seconds from the first aim on a hole to holing out, per hole; null if not holed out (or picked up). */
  times: readonly (number | null)[];
}

export interface RaceHole {
  strokes: number | null;
  stroke: number;
  /** Speed place on this hole among everyone who holed it out (0 = fastest), or null. */
  place: number | null;
  bonus: number;
  points: number;
}

/** Every player's per-hole breakdown and total points. */
export function raceTable(players: readonly RacePlayer[]): { holes: RaceHole[]; total: number }[] {
  const places = HOLES.map((_, i) => speedPlaces(players.map((p) => (p.scores[i] == null ? null : (p.times[i] ?? null)))));
  return players.map((p, k) => {
    const holes = HOLES.map((h, i): RaceHole => {
      const s = p.scores[i] ?? null;
      if (s === null) return { strokes: null, stroke: 0, place: null, bonus: 0, points: 0 };
      const stroke = strokePoints(s, h.par);
      const place = places[i][k];
      const bonus = speedBonus(place);
      return { strokes: s, stroke, place, bonus, points: stroke + bonus };
    });
    return { holes, total: holes.reduce((a, h) => a + h.points, 0) };
  });
}
