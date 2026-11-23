import { describe, expect, it } from 'vitest';
import { BIRDS, birdById } from './species';
import { REGION_IDS } from '../levels';

describe('birding species table', () => {
  it('has 28 rows with unique kebab-case ids', () => {
    expect(BIRDS).toHaveLength(28);
    const ids = BIRDS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('looks species up by id', () => {
    expect(birdById('barn-owl')?.name).toBe('Barn Owl');
    expect(birdById('no-such-bird')).toBeUndefined();
  });

  it('has valid region weights', () => {
    const regionIds = new Set<string>(REGION_IDS);
    for (const b of BIRDS) {
      const entries = Object.entries(b.regions);
      expect(entries.length, b.id).toBeGreaterThan(0);
      for (const [region, weight] of entries) {
        expect(regionIds.has(region), `${b.id} region ${region}`).toBe(true);
        expect(weight, `${b.id} weight in ${region}`).toBeGreaterThan(0);
      }
    }
  });

  it('gives every species a time of day and a valid flock and call', () => {
    for (const b of BIRDS) {
      const times = Object.values(b.time);
      expect(times.length, b.id).toBeGreaterThan(0);
      expect(times.some((w) => (w ?? 0) > 0), b.id).toBe(true);
      expect(b.flock[0], b.id).toBeGreaterThanOrEqual(1);
      expect(b.flock[0], b.id).toBeLessThanOrEqual(b.flock[1]);
      expect(b.callEvery[0], b.id).toBeLessThan(b.callEvery[1]);
      expect(b.call.notes, b.id).toBeGreaterThanOrEqual(1);
      expect(b.call.notes, b.id).toBeLessThanOrEqual(12);
    }
  });

  it('has short, non-empty journal text', () => {
    for (const b of BIRDS) {
      expect(b.hint.length, b.id).toBeGreaterThan(0);
      expect(b.blurb.length, b.id).toBeGreaterThan(0);
      expect(b.hint.length, b.id).toBeLessThan(200);
      expect(b.blurb.length, b.id).toBeLessThan(200);
    }
  });

  it('has at least 3 species in every region', () => {
    for (const region of REGION_IDS) {
      const count = BIRDS.filter((b) => (b.regions[region] ?? 0) > 0).length;
      expect(count, region).toBeGreaterThanOrEqual(3);
    }
  });

  it('has exactly 3 owls and 2 mythic birds', () => {
    expect(BIRDS.filter((b) => b.group === 'owl')).toHaveLength(3);
    expect(BIRDS.filter((b) => b.group === 'mythic')).toHaveLength(2);
  });
});
