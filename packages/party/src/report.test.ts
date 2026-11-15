import { describe, expect, it } from 'vitest';
import { bestSeats, buildReport, checkSliceReport, formatStat, winnerLine } from './report';
import type { MinigameMeta, SeatInfo } from './types';

const meta: MinigameMeta = { id: 'golf-hole', title: 'Hole', game: 'gnome-golf', goal: 'g', controls: 'c', maxSeconds: 60 };
const seats = [0, 1, 2, 3].map((k) => ({ seat: k, name: `P${k}`, color: k, cpu: true, look: {} })) as unknown as SeatInfo[];
const strokes = { key: 'strokes', label: 'Strokes', better: 'lower' as const };

describe('buildReport', () => {
  it('sorts rows by place, names the winner and links the game', () => {
    const r = buildReport(meta, seats, [2, 0, 1, 3], false, { stats: [strokes], values: [{ strokes: 4 }, { strokes: 2 }, { strokes: 3 }, { strokes: 5 }] });
    expect(r.rows.map((x) => x.seat)).toEqual([1, 2, 0, 3]);
    expect(r.winners).toEqual([1]);
    expect(r.headline).toBe('P1 wins!');
    expect(r.links[1].href).toBe('../gnome-golf/#minigame=golf-hole');
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });

  it('a tie for 1st names both; no slice report means no stats', () => {
    const r = buildReport(meta, seats, [0, 0, 2, 3], true);
    expect(r.winners).toEqual([0, 1]);
    expect(winnerLine(r)).toBe('P0 and P1 tie for 1st!');
    expect(r.stats).toEqual([]);
    expect(r.timeUp).toBe(true);
  });

  it('marks the best value of a ranked stat', () => {
    const r = buildReport(meta, seats, [2, 0, 0, 3], false, { stats: [strokes], values: [{ strokes: 4 }, { strokes: 2 }, { strokes: 2 }, { strokes: null }] });
    expect(bestSeats(r, strokes)).toEqual([1, 2]);
    expect(bestSeats(r, { key: 'strokes', label: 'S' })).toEqual([]);
  });
});

describe('formatStat', () => {
  it('formats by the stat', () => {
    expect(formatStat({ key: 'a', label: 'A', unit: 'm', format: '1dp' }, 12.345)).toBe('12.3 m');
    expect(formatStat({ key: 'a', label: 'A', format: 'time' }, 62.34)).toBe('1:02.3');
    expect(formatStat({ key: 'a', label: 'A', format: 'time' }, 9.5)).toBe('9.5s');
    expect(formatStat({ key: 'a', label: 'A' }, 7.6)).toBe('8');
    expect(formatStat({ key: 'a', label: 'A' }, null)).toBe('—');
    expect(formatStat({ key: 'a', label: 'A' }, 'X')).toBe('X');
  });
});

describe('checkSliceReport', () => {
  it('flags values without a stat and wrong row counts', () => {
    expect(checkSliceReport({ stats: [strokes], values: [{ strokes: 1 }, {}, {}, {}] }, 4)).toEqual([]);
    expect(checkSliceReport({ stats: [strokes], values: [{ pins: 1 }] }, 4).length).toBe(2);
  });
});
