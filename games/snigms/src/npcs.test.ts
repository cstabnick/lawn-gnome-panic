import { describe, expect, it } from 'vitest';
import { PEOPLE, spotAt, personById } from './people';
import { createNeighbours } from './npcs';
import { townSpot, townLot } from './town';
import { isWalkable } from './world';

const NOON = 12 * 60;
const fixed = () => 0.5;

describe('neighbours walking the town', () => {
  it('start on their routine spot', () => {
    const lot = townLot();
    const nb = createNeighbours(lot, NOON, fixed);
    for (const p of PEOPLE) {
      const n = nb.get(p.id);
      const t = townSpot(spotAt(p, NOON));
      expect(Math.floor(n.x)).toBe(t.tx);
      expect(Math.floor(n.z)).toBe(t.ty);
    }
  });

  it('stay on walkable tiles and on the lot while wandering', () => {
    const lot = townLot();
    let seed = 7;
    const rng = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const nb = createNeighbours(lot, NOON, rng);
    for (let i = 0; i < 4000; i++) {
      nb.update(0.1, lot, NOON + i, null);
      for (const n of nb.list()) {
        const tx = Math.floor(n.x);
        const tz = Math.floor(n.z);
        expect(tx).toBeGreaterThanOrEqual(0);
        expect(tz).toBeGreaterThanOrEqual(0);
        expect(tx).toBeLessThan(lot.w);
        expect(tz).toBeLessThan(lot.h);
        expect(isWalkable(lot, tx, tz)).toBe(true);
      }
    }
  });

  it('run about the gnome when it is in town and close', () => {
    const lot = townLot();
    const nb = createNeighbours(lot, NOON, fixed);
    const wren = nb.get('wren');
    const gnome = { x: wren.x + 0.5, z: wren.z };
    let ran = false;
    let maxDist = 0;
    for (let i = 0; i < 300; i++) {
      nb.update(0.1, lot, NOON, gnome);
      if (wren.running) ran = true;
      maxDist = Math.max(maxDist, Math.hypot(wren.x - gnome.x, wren.z - gnome.z));
    }
    expect(ran).toBe(true);
    // Runs stay within a few tiles of the gnome, not off across the town.
    expect(maxDist).toBeLessThan(9);
  });

  it('do not move while paused (a chat)', () => {
    const lot = townLot();
    const nb = createNeighbours(lot, NOON, fixed);
    const n = nb.get('nettle');
    nb.pause('nettle', 2);
    const x = n.x;
    const z = n.z;
    for (let i = 0; i < 10; i++) nb.update(0.1, lot, NOON + i, null);
    expect(n.x).toBe(x);
    expect(n.z).toBe(z);
  });

  it('finds the nearest neighbour inside a radius', () => {
    const lot = townLot();
    const nb = createNeighbours(lot, NOON, fixed);
    const m = nb.get('mallow');
    expect(nb.nearest(m.x, m.z, 0.5)?.id).toBe('mallow');
    expect(nb.nearest(-50, -50, 1)).toBeNull();
    expect(personById('mallow').name).toBe('Mallow Clayfoot');
  });

  it('move on when the routine changes the spot', () => {
    const lot = townLot();
    const nb = createNeighbours(lot, hm(9), fixed);
    // Mallow: park at 9:00, cafe at 12:00.
    const m = nb.get('mallow');
    expect(m.spot).toBe('park');
    nb.update(0.1, lot, hm(12), null);
    expect(m.spot).toBe('cafe');
  });
});

function hm(h: number): number {
  return h * 60;
}
