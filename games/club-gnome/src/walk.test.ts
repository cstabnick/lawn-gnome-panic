import { describe, it, expect } from 'vitest';
import type { MapDef } from './config';
import { WALK } from './config';
import { counterNear, isBlocked, newWalker, nearestWalkable, portalAt, seatNear, spotNear, stepWalker, type Walker } from './walk';

const DT = 1 / 60;

describe('seatNear', () => {
  it('finds a seat only inside its circle', () => {
    const seatMap = {
      ...map,
      seats: [{ id: 'bench', label: 'Sit on the bench', x: 3, z: 3, r: 1, facing: 0, y: 0.5 }],
    };
    expect(seatNear(seatMap, 3.5, 3)?.id).toBe('bench');
    expect(seatNear(seatMap, 5, 3)).toBeNull();
    expect(seatNear(map, 3, 3)).toBeNull();
  });
});

// A small test map: 20 x 20, one building at (0, -5) 4 wide and 2 deep, one blocker, one portal, two overlapping spots.
const map: MapDef = {
  id: 'town',
  w: 20,
  d: 20,
  ground: 0x88aa66,
  indoor: false,
  spawn: { x: 0, z: 0 },
  buildings: [
    { id: 'shop', label: 'Shop', x: 0, z: -5, w: 4, d: 2, h: 3, color: 0xccaa88, roof: 0x663322 },
  ],
  props: [],
  seats: [],
  counters: [{ id: 'till', label: 'Pay', x: 6, z: 6, r: 1.5, panel: 'market' }],
  blockers: [{ x: 6, z: 6, w: 2, d: 2 }],
  portals: [
    { id: 'to-gnomecino', label: 'Enter the Gnomecino', x: -7, z: -7, r: 1, to: 'gnomecino', spawnX: 0, spawnZ: 0 },
  ],
  spots: [
    { id: 'bj', label: 'Play Blackjack', x: -6, z: 6, r: 1.5, game: 'blackjack' },
    { id: 'golf', label: 'Play Golf', x: -5.5, z: 6, r: 1.5, game: 'golf' },
  ],
  signs: [],
};

/** Steps the walker until it reports stopped. Returns the elapsed seconds, or -1 if it never stopped. */
function run(w: Walker, maxS: number): number {
  let t = 0;
  while (t < maxS) {
    t += DT;
    if (stepWalker(w, DT, map)) return t;
  }
  return -1;
}

describe('isBlocked', () => {
  it('blocks outside the bounds less the edge margin', () => {
    const lim = map.w / 2 - WALK.edge;
    expect(isBlocked(map, lim - 0.01, 0)).toBe(false);
    expect(isBlocked(map, lim + 0.01, 0)).toBe(true);
    expect(isBlocked(map, -lim + 0.01, 0)).toBe(false);
    expect(isBlocked(map, -lim - 0.01, 0)).toBe(true);
    expect(isBlocked(map, 0, lim + 0.01)).toBe(true);
    expect(isBlocked(map, 0, -lim - 0.01)).toBe(true);
  });

  it('blocks inside a building grown by the gnome radius', () => {
    expect(isBlocked(map, 0, -5)).toBe(true);
    expect(isBlocked(map, 2 + WALK.radius - 0.01, -5)).toBe(true);
    expect(isBlocked(map, 2 + WALK.radius + 0.01, -5)).toBe(false);
  });
});

describe('stepWalker', () => {
  it('with no target stays still and reports false', () => {
    const w = newWalker(1, 1);
    expect(stepWalker(w, DT, map)).toBe(false);
    expect(w.moving).toBe(false);
  });

  it('walks across open ground and arrives in about dist / speed seconds', () => {
    const w = newWalker(-8, 8);
    w.target = { x: -8, z: 2 };
    const dist = 6;
    const t = run(w, 10);
    expect(t).toBeGreaterThan(0);
    expect(t).toBeCloseTo(dist / WALK.speed, 1);
    expect(w.x).toBeCloseTo(-8, 5);
    expect(w.z).toBeCloseTo(2, 5);
    expect(w.target).toBeNull();
    expect(w.moving).toBe(false);
  });

  it('walking into a building never ends inside a blocked point', () => {
    const w = newWalker(-5, -5);
    w.target = { x: 5, z: -5 };
    const t = run(w, 10);
    expect(t).toBeGreaterThan(0);
    expect(isBlocked(map, w.x, w.z)).toBe(false);
    // It stops at the building's west face (x = -2 - radius), not inside it.
    expect(w.x).toBeLessThan(-2 - WALK.radius + 0.01);
  });

  it('slides along a building when the target is past its face', () => {
    const w = newWalker(-1, -2);
    w.target = { x: 1, z: -8 };
    const t = run(w, 10);
    expect(t).toBeGreaterThan(0);
    expect(isBlocked(map, w.x, w.z)).toBe(false);
    // It moved sideways along the front face rather than stopping at the first contact.
    expect(w.x).toBeGreaterThan(-0.45);
  });

  it('turns to face +x when walking right', () => {
    const w = newWalker(-8, 8);
    w.target = { x: -2, z: 8 };
    const t = run(w, 10);
    expect(t).toBeGreaterThan(0);
    expect(w.facing).toBeCloseTo(Math.PI / 2, 1);
  });
});

describe('nearestWalkable', () => {
  it('pushes a point inside the building out to a free point', () => {
    const p = nearestWalkable(map, 0, -5);
    expect(isBlocked(map, p.x, p.z)).toBe(false);
  });

  it('clamps a point outside the bounds', () => {
    const lim = map.w / 2 - WALK.edge;
    const p = nearestWalkable(map, 50, 0);
    expect(p.x).toBeCloseTo(lim, 5);
    expect(isBlocked(map, p.x, p.z)).toBe(false);
  });

  it('leaves an already free point alone', () => {
    const p = nearestWalkable(map, 3, 3);
    expect(p).toEqual({ x: 3, z: 3 });
  });
});

describe('portalAt and spotNear', () => {
  it('portalAt finds a portal inside its radius only', () => {
    expect(portalAt(map, -7, -7)?.id).toBe('to-gnomecino');
    expect(portalAt(map, -7, -8.5)).toBeNull();
    expect(portalAt(map, 0, 0)).toBeNull();
  });

  it('spotNear picks the nearest of two overlapping spots, not the first in the list', () => {
    expect(spotNear(map, -5.4, 6)?.id).toBe('golf');
    expect(spotNear(map, -6.4, 6)?.id).toBe('bj');
  });

  it('spotNear returns null outside every spot', () => {
    expect(spotNear(map, 0, 0)).toBeNull();
  });
});

describe('counterNear', () => {
  it('finds a counter within its radius, and nothing outside', () => {
    expect(counterNear(map, 6.5, 6.5)?.id).toBe('till');
    expect(counterNear(map, 9, 9)).toBeNull();
  });
});
