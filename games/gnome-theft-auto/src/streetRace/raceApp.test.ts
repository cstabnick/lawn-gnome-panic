import { describe, expect, it } from 'vitest';
import { fmtTime, trackRows } from './raceApp';
import { TRACKS } from '../raceTrack/tracks';
import type { RacingSave } from './save';

function storeWith(best: RacingSave['best']): { data(): RacingSave } {
  return { data: () => ({ best, runs: {}, pickupWins: 0, onlineWins: 0, wagerWon: 0 }) };
}

describe('Race Club helpers', () => {
  it('formats times as m:ss.s, with an em dash for none', () => {
    expect(fmtTime(null)).toBe('—');
    expect(fmtTime(undefined)).toBe('—');
    expect(fmtTime(59.94)).toBe('0:59.9');
    expect(fmtTime(61.25)).toBe('1:01.3');
    expect(fmtTime(125)).toBe('2:05.0');
  });

  it('lists street routes first, each group in registry order, with best times', () => {
    const rows = trackRows(storeWith({ 'skyway-sprint': 42.5, rutbottom: 77 }));
    const ids = rows.map((r) => r.id);
    expect(ids.slice(0, 5)).toEqual([
      'kerb-row-circuit', 'skyway-sprint', 'ring-road-run', 'pardonlin-boucle', 'saltbucket-dash',
    ]);
    expect(ids.slice(5)).toEqual(['lost-and-found', 'rutbottom', 'capwood-run']);
    expect(rows.find((r) => r.id === 'skyway-sprint')?.best).toBe(42.5);
    expect(rows.find((r) => r.id === 'kerb-row-circuit')?.best).toBeNull();
    expect(rows.find((r) => r.id === 'skyway-sprint')?.street).toBe(true);
    expect(rows.find((r) => r.id === 'rutbottom')?.street).toBe(false);
  });

  it('gives closed circuits two laps and open routes one', () => {
    for (const r of trackRows(storeWith({}))) {
      expect(r.closed).toBe(TRACKS[r.id].closed);
      expect(r.laps).toBe(r.closed ? 2 : 1);
    }
  });
});
