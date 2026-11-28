import { describe, expect, it } from 'vitest';
import { CRITTER_SPECS } from '../critters';
import { regionAt } from '../levels';
import { reservedRects } from '../sites';
import { bandsLife } from './bands';

const ALLOWED = new Set(['hare', 'hedgehog', 'fox', 'frog', 'duck', 'crab', 'butterfly', 'dragonfly', 'squirrel']);
const GROW = 20;

describe('bands wildlife', () => {
  it('each group centre is inside its own region', () => {
    for (const g of bandsLife.groups) expect(regionAt(g.x, g.z), g.id).toBe(g.region);
  });

  it('every kind exists in CRITTER_SPECS and is a small wild kind (no deer)', () => {
    for (const g of bandsLife.groups) {
      expect(CRITTER_SPECS[g.kind], g.id).toBeDefined();
      expect(ALLOWED.has(g.kind), g.id).toBe(true);
      expect(g.kind as string).not.toBe('deer');
    }
  });

  it('has 35 to 70 critters in groups of 2 to 5, with unique ids', () => {
    const total = bandsLife.groups.reduce((n, g) => n + g.count, 0);
    expect(total).toBeGreaterThanOrEqual(35);
    expect(total).toBeLessThanOrEqual(70);
    for (const g of bandsLife.groups) {
      expect(g.count).toBeGreaterThanOrEqual(2);
      expect(g.count).toBeLessThanOrEqual(5);
    }
    expect(new Set(bandsLife.groups.map((g) => g.id)).size).toBe(bandsLife.groups.length);
  });

  it('no group centre sits in a reserved rect grown by 20 m (crabs may use the beach)', () => {
    const bad: string[] = [];
    for (const g of bandsLife.groups) {
      for (const r of reservedRects()) {
        if (g.kind === 'crab' && r.id === 'beach') continue;
        const inside = g.x >= r.minX - GROW && g.x <= r.maxX + GROW && g.z >= r.minZ - GROW && g.z <= r.maxZ + GROW;
        if (inside) bad.push(`${g.id} in ${r.id} (${r.minX},${r.maxX},${r.minZ},${r.maxZ})`);
      }
    }
    expect(bad).toEqual([]);
  });
});
