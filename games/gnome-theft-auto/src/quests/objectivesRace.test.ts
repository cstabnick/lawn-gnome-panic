import { describe, expect, it, vi } from 'vitest';

vi.mock('../audio', () => ({
  play: vi.fn(),
  setEngine: vi.fn(),
  setSkid: vi.fn(),
  unlockAudio: vi.fn(),
}));
import { keepOutZones, ordinal, rankRacers } from './objectivesRace';
import { TRACKS } from '../raceTrack/tracks';

describe('ordinal', () => {
  it('gives the place suffix', () => {
    expect(ordinal(1)).toBe('1st');
    expect(ordinal(2)).toBe('2nd');
    expect(ordinal(3)).toBe('3rd');
    expect(ordinal(4)).toBe('4th');
  });

  it('handles the teens and the hundreds', () => {
    expect(ordinal(11)).toBe('11th');
    expect(ordinal(12)).toBe('12th');
    expect(ordinal(13)).toBe('13th');
    expect(ordinal(21)).toBe('21st');
    expect(ordinal(22)).toBe('22nd');
    expect(ordinal(111)).toBe('111th');
  });
});

describe('rankRacers', () => {
  it('puts finished drivers first, by finish time', () => {
    const order = rankRacers([
      { id: 'a', dist: 900, finishedAt: null },
      { id: 'b', dist: 1000, finishedAt: 42.5 },
      { id: 'c', dist: 1000, finishedAt: 40 },
    ]);
    expect(order).toEqual(['c', 'b', 'a']);
  });

  it('orders the rest by distance, furthest first', () => {
    const order = rankRacers([
      { id: 'a', dist: 10, finishedAt: null },
      { id: 'b', dist: 300, finishedAt: null },
      { id: 'c', dist: 120, finishedAt: null },
    ]);
    expect(order).toEqual(['b', 'c', 'a']);
  });

  it('ranks a mixed field: finished, then running by distance', () => {
    const order = rankRacers([
      { id: 'player', dist: 2000, finishedAt: null },
      { id: 'r0', dist: 2100, finishedAt: 80 },
      { id: 'r1', dist: 1500, finishedAt: null },
      { id: 'r2', dist: 2050, finishedAt: 95 },
    ]);
    expect(order).toEqual(['r0', 'r2', 'player', 'r1']);
  });

  it('returns an empty order for an empty field', () => {
    expect(rankRacers([])).toEqual([]);
  });
});

describe('keepOutZones', () => {
  it('puts circles on the centre line of a street track', () => {
    const track = TRACKS['kerb-row-circuit'];
    const zones = keepOutZones(track);
    expect(zones.length).toBeGreaterThan(3);
    const S = track.samples();
    for (const z of zones) {
      expect(z.r).toBe(16);
      expect(S.some((p) => p.x === z.x && p.z === z.z)).toBe(true);
    }
  });
});
