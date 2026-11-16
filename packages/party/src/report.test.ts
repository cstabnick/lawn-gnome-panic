import { describe, expect, it } from 'vitest';
import { bestSeats, buildReport, checkSliceReport, formatStat, soleWinner, winnerLine } from './report';
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

describe('win info', () => {
  const time = { key: 'time', label: 'Time', format: 'time' as const, better: 'lower' as const };
  const left = { key: 'left', label: 'To pin', unit: 'yd', format: '1dp' as const, better: 'lower' as const };

  it('says who won, on what, and by how much', () => {
    const r = buildReport(meta, seats, [1, 0, 2, 3], false, { stats: [time], values: [{ time: 13.5 }, { time: 11.1 }, { time: 16 }, { time: null }] });
    expect(r.win.names).toEqual(['P1']);
    expect(r.win.decidedBy?.text).toBe('11.1s');
    expect(r.win.runnerUp?.name).toBe('P0');
    expect(r.win.margin).toBe('2.4s');
    expect(r.win.how).toBe('Time 11.1s, 2.4s ahead of P0 (13.5s).');
  });

  it('falls through to the next ranked stat when the main one does not separate them', () => {
    const r = buildReport(meta, seats, [1, 0, 2, 3], true, {
      stats: [strokes, left],
      values: [{ strokes: null, left: 9 }, { strokes: null, left: 3.5 }, { strokes: null, left: 20 }, { strokes: null, left: 30 }],
    });
    expect(r.win.decidedBy?.key).toBe('left');
    expect(r.win.how).toBe('To pin 3.5 yd, 5.5 yd better than P0 (9.0 yd).');
  });

  it('a lone finisher and a tie', () => {
    const lone = buildReport(meta, seats, [1, 0, 1, 1], false, { stats: [time], values: [{ time: null }, { time: 20 }, { time: null }, { time: null }] });
    expect(lone.win.how).toBe('Time 20.0s; nobody else posted one.');
    const tie = buildReport(meta, seats, [0, 0, 2, 3], false, { stats: [strokes], values: [{ strokes: 3 }, { strokes: 3 }, { strokes: 4 }, { strokes: 5 }] });
    expect(tie.win.how).toBe('Tied on strokes: 3.');
    expect(buildReport(meta, seats, [0, 1, 2, 3], false).win.how).toBe('');
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

describe('soleWinner', () => {
  it('is the only seat in 1st, or null on a tie', () => {
    expect(soleWinner([1, 0, 2, 3])).toBe(1);
    expect(soleWinner([0, 0, 2, 3])).toBeNull();
  });
});
