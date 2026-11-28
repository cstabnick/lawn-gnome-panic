// The Flock's people (E17 B6): a crowd inside the camp, none pink, none standing on the door or the circle centre.
import { describe, expect, it } from 'vitest';
import { WADERS_REST } from '../config';
import { FLOCK_PEOPLE } from './life';

const isPink = (c: number | undefined): boolean => {
  if (c === undefined) return false;
  const r = (c >> 16) & 0xff;
  const g = (c >> 8) & 0xff;
  return r > 200 && g < 150;
};

const dist = (ax: number, az: number, bx: number, bz: number): number => Math.hypot(ax - bx, az - bz);

describe('the Flock of the One Leg (people)', () => {
  it('has at least ten people', () => {
    expect(FLOCK_PEOPLE.length).toBeGreaterThanOrEqual(10);
  });

  it('keeps everyone inside the camp site', () => {
    const s = WADERS_REST.site;
    for (const p of FLOCK_PEOPLE) {
      expect(p.x, p.id).toBeGreaterThanOrEqual(s.minX);
      expect(p.x, p.id).toBeLessThanOrEqual(s.maxX);
      expect(p.z, p.id).toBeGreaterThanOrEqual(s.minZ);
      expect(p.z, p.id).toBeLessThanOrEqual(s.maxZ);
    }
  });

  it('wears no pink (the Lady only)', () => {
    for (const p of FLOCK_PEOPLE) {
      expect(isPink(p.look.hat), `${p.id} hat`).toBe(false);
      expect(isPink(p.look.shirt), `${p.id} shirt`).toBe(false);
    }
  });

  it('does not stand on the tent door or the circle centre', () => {
    const door = WADERS_REST.tentDoor;
    const centre = WADERS_REST.circle;
    for (const p of FLOCK_PEOPLE) {
      expect(dist(p.x, p.z, door.x, door.z), `${p.id} at door`).toBeGreaterThan(1.2);
      expect(dist(p.x, p.z, centre.x, centre.z), `${p.id} at centre`).toBeGreaterThan(1.2);
    }
  });
});
