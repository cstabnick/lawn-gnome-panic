import { describe, expect, it } from 'vitest';
import type { LevelDoc } from '@lawn/level';
import { loadTown, TOWN_DOC, type TownData } from './town';

function makeDoc(): LevelDoc<TownData> {
  return {
    format: 'lawn-level',
    version: 1,
    game: 'pebblecross',
    id: 'test-town',
    name: 'Test Town',
    bounds: { w: 40, d: 30 },
    stamps: [{ op: 'gauss', x: 5, z: -3, sigma: 4, amount: 2 }],
    paths: [{ id: 'main', kind: 'road', points: [[-10, 0], [10, 0]] }],
    props: [
      { prefab: 'tree', x: 8, z: 8, solidR: 1.2 },
      { prefab: 'bench', x: -8, z: 8, rot: 1, scale: 2 },
    ],
    markers: [
      { id: 'spawn', kind: 'spawn', x: 1, z: 2 },
      { id: 'bakery', kind: 'place', x: -4, z: -6, r: 2, data: { label: 'Crumb & Crock' } },
      { id: 'forage-acorn-1', kind: 'forage', x: 3, z: 4, data: { item: 'acorn', label: 'Acorn' } },
    ],
    data: {
      ground: '#7fae5a',
      ponds: [{ x: -12, z: -10, r: 3 }],
      blockers: [{ x: 0, z: 10, w: 2, d: 2 }],
      buildings: [
        { id: 'inn', label: 'Lantern Inn', x: 10, z: -8, w: 6, d: 4, h: 5, color: '#c08040', roof: '#402010' },
        { id: 'shed', label: 'Yard Shed', x: -14, z: 8, w: 4, d: 4, h: 3, color: '#a0a0a0', roof: '#303030' },
      ],
    },
  };
}

describe('loadTown', () => {
  it('converts buildings and colours', () => {
    const town = loadTown(makeDoc());
    expect(town.ground).toBe(0x7fae5a);
    expect(town.w).toBe(40);
    expect(town.d).toBe(30);
    expect(town.buildings).toHaveLength(2);
    expect(town.buildings[0]).toEqual({
      id: 'inn', label: 'Lantern Inn', x: 10, z: -8, w: 6, d: 4, h: 5, color: 0xc08040, roof: 0x402010,
    });
  });

  it('builds roads with a default width and copies ponds and props', () => {
    const town = loadTown(makeDoc());
    expect(town.roads).toEqual([{ points: [{ x: -10, z: 0 }, { x: 10, z: 0 }], width: 2.4 }]);
    expect(town.ponds).toEqual([{ x: -12, z: -10, r: 3 }]);
    expect(town.props[0]).toEqual({ prefab: 'tree', x: 8, z: 8, rot: 0, scale: 1, solidR: 1.2 });
    expect(town.props[1]).toEqual({ prefab: 'bench', x: -8, z: 8, rot: 1, scale: 2 });
    expect('solidR' in town.props[1]).toBe(false);
  });

  it('keys places and collects forage and spawn', () => {
    const town = loadTown(makeDoc());
    expect(town.spawn).toEqual({ x: 1, z: 2 });
    expect(town.places.bakery).toEqual({ id: 'bakery', kind: 'place', label: 'Crumb & Crock', x: -4, z: -6, r: 2 });
    expect(town.forage).toEqual([
      { id: 'forage-acorn-1', kind: 'forage', label: 'Acorn', x: 3, z: 4, r: 1.5, item: 'acorn' },
    ]);
  });

  it('builds the nav world from blockers, buildings, ponds and solid props', () => {
    const town = loadTown(makeDoc());
    expect(town.navWorld.w).toBe(40);
    expect(town.navWorld.d).toBe(30);
    expect(town.navWorld.boxes).toEqual([
      { x: 0, z: 10, w: 2, d: 2 },
      { x: 10, z: -8, w: 6, d: 4 },
      { x: -14, z: 8, w: 4, d: 4 },
    ]);
    expect(town.navWorld.circles).toEqual([
      { x: -12, z: -10, r: 3 },
      { x: 8, z: 8, r: 1.2 },
    ]);
  });

  it('heightAt is raised at the gauss stamp centre and flat far away', () => {
    const town = loadTown(makeDoc());
    expect(town.heightAt(5, -3)).toBeGreaterThan(0);
    expect(town.heightAt(5, -3)).toBeCloseTo(2, 5);
    expect(town.heightAt(35, 25)).toBeCloseTo(0, 5);
  });

  it('does not change its input', () => {
    const doc = makeDoc();
    const before = structuredClone(doc);
    loadTown(doc);
    expect(doc).toEqual(before);
  });

  it('loads the shipped level without throwing', () => {
    expect(() => loadTown(TOWN_DOC)).not.toThrow();
  });
});
