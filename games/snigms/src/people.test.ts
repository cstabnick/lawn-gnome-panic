import { describe, expect, it } from 'vitest';
import { PEOPLE, lineFor, personById, spotAt } from './people';
import { townSpotIds } from './town';

const hm = (h: number, m = 0) => h * 60 + m;

describe('neighbours', () => {
  it('have unique ids and a line to say', () => {
    expect(new Set(PEOPLE.map((p) => p.id)).size).toBe(PEOPLE.length);
    for (const p of PEOPLE) expect(p.lines.length).toBeGreaterThan(0);
  });

  it('follow their routine through the day', () => {
    const chervil = personById('chervil');
    expect(spotAt(chervil, hm(9))).toBe('cafe');
    expect(spotAt(chervil, hm(15))).toBe('square');
    expect(spotAt(chervil, hm(23))).toBe('home-chervil');
    expect(spotAt(chervil, hm(3))).toBe('home-chervil');
  });

  it('are always at a spot the town has, at every hour', () => {
    const ids = new Set(townSpotIds());
    for (const p of PEOPLE) for (let m = 0; m < 24 * 60; m += 15) expect(ids.has(spotAt(p, m))).toBe(true);
  });

  it('pick a line from their own list', () => {
    const mallow = personById('mallow');
    for (const pick of [0, 0.3, 0.6, 0.999]) expect(mallow.lines).toContain(lineFor(mallow, pick));
  });

  it('throws for an unknown neighbour', () => {
    expect(() => personById('nobody' as never)).toThrow();
  });
});
