import { describe, expect, it } from 'vitest';
import { DEX_ENTRIES } from '../prefabs/dex';
import { type Mind, type MindInput, initialMind, personalityOf, stepMind } from './character';
import { TEMPERAMENTS, type Temperament } from './temperament';

const ALL: Temperament[] = ['docile', 'curious', 'skittish', 'shy', 'territorial', 'thief', 'sentinel', 'aloof'];

/** Small seeded generator (mulberry32): same seed, same sequence. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function input(overrides: Partial<MindInput>): MindInput {
  return {
    self: { x: 0, z: 0 },
    tag: { x: 50, z: 50 },
    bait: null,
    zone: { x: 0, z: 0, radius: 5 },
    cover: [],
    dt: 0.1,
    rand: seeded(1),
    ...overrides,
  };
}

describe('personalityOf', () => {
  it('gives every temperament default traits between 0 and 1', () => {
    for (const t of ALL) {
      const p = personalityOf('no-such-species', t);
      for (const v of [p.boldness, p.curiosity, p.restlessness, p.shyness]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('returns in-range traits and a non-empty quirk for all 42 dex ids', () => {
    const ids = DEX_ENTRIES.map((e) => e.prefab.id);
    expect(ids).toHaveLength(42);
    for (const id of ids) {
      const p = personalityOf(id, TEMPERAMENTS[id] ?? 'docile');
      for (const v of [p.boldness, p.curiosity, p.restlessness, p.shyness]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
      expect(p.quirk.length).toBeGreaterThan(0);
      expect(p.quirk.length).toBeLessThan(80);
    }
  });
});

describe('stepMind', () => {
  it('a shy creature goes to hide when Tag is 5 away and cover is 3 away', () => {
    const persona = personalityOf('armadillan', 'shy');
    const cover = [{ x: 3, z: 0 }];
    const step = stepMind(
      initialMind(),
      persona,
      input({ self: { x: 0, z: 0 }, tag: { x: 5, z: 0 }, cover }),
    );
    expect(step.mind.state).toBe('hide');
    expect(step.mind.coverIndex).toBe(0);
    // Moves toward the cover at 2.5 units/s.
    expect(step.velocity.x).toBeGreaterThan(0);
  });

  it('a hidden creature stays hidden while Tag is near, then runs after 1.5 s clear', () => {
    const persona = personalityOf('armadillan', 'shy');
    const cover = [{ x: 3, z: 0 }];
    let mind: Mind = {
      state: 'hide',
      timer: 0,
      target: { x: 3, z: 0 },
      coverIndex: 0,
      clearTime: 0,
    };
    const self = { x: 3, z: 0 };
    // Tag 5 away: stays hidden for a while.
    for (let i = 0; i < 20; i++) {
      const s = stepMind(mind, persona, input({ self, tag: { x: 8, z: 0 }, cover, dt: 0.1 }));
      mind = s.mind;
      expect(mind.state).toBe('hide');
      expect(s.velocity).toEqual({ x: 0, z: 0 });
    }
    // Tag 10 away: still hidden at 1.3 s clear, runs by 1.6 s clear.
    const tagFar = { x: 13, z: 0 };
    // Count the steps spent hidden while Tag stays 10 away. 1.5 s at 0.1 s a step is 15 steps.
    let steps = 0;
    while (mind.state === 'hide' && steps < 40) {
      mind = stepMind(mind, persona, input({ self, tag: tagFar, cover, dt: 0.1 })).mind;
      steps++;
    }
    expect(mind.state).toBe('run');
    expect(steps).toBeGreaterThanOrEqual(15);
    expect(steps).toBeLessThanOrEqual(16);
    expect(mind.timer).toBeGreaterThan(1.3);
    expect(mind.timer).toBeLessThanOrEqual(1.5);
  });

  it('a roaming creature stays inside its zone for 200 steps', () => {
    const persona = personalityOf('frosthound', 'curious');
    const zone = { x: 2, z: -1, radius: 4 };
    const rand = seeded(42);
    let mind: Mind = { ...initialMind(), state: 'roam', timer: 5 };
    let self = { x: zone.x, z: zone.z };
    for (let i = 0; i < 200; i++) {
      const s = stepMind(mind, persona, input({ self, zone, dt: 0.1, rand }));
      mind = s.mind;
      self = { x: self.x + s.velocity.x * 0.1, z: self.z + s.velocity.z * 0.1 };
      const r = Math.hypot(self.x - zone.x, self.z - zone.z);
      expect(r).toBeLessThanOrEqual(zone.radius + 1e-9);
    }
  });

  it('a bold creature moves toward bait 4 away and grazes once it arrives', () => {
    const persona = personalityOf('sproutling', 'curious');
    expect(persona.boldness).toBeGreaterThan(0.4);
    const bait = { x: 4, z: 0 };
    // Start roaming: a fresh mind is already grazing, which would not chase the bait.
    let mind: Mind = { ...initialMind(), state: 'roam', timer: 10 };
    let self = { x: 0, z: 0 };
    const first = stepMind(mind, persona, input({ self, bait, tag: { x: 40, z: 0 } }));
    const toBait = bait.x - self.x;
    expect(first.velocity.x * toBait + first.velocity.z * (bait.z - self.z)).toBeGreaterThan(0);
    for (let i = 0; i < 200 && mind.state !== 'graze'; i++) {
      const s = stepMind(mind, persona, input({ self, bait, tag: { x: 40, z: 0 } }));
      mind = s.mind;
      self = { x: self.x + s.velocity.x * 0.1, z: self.z + s.velocity.z * 0.1 };
    }
    expect(mind.state).toBe('graze');
    expect(Math.hypot(bait.x - self.x, bait.z - self.z)).toBeLessThanOrEqual(0.6);
  });

  it('does not mutate its input mind', () => {
    const persona = personalityOf('armadillan', 'shy');
    const mind: Mind = {
      state: 'roam',
      timer: 2,
      target: { x: 1, z: 1 },
      coverIndex: null,
      clearTime: 0.5,
    };
    const before = JSON.stringify(mind);
    const out = stepMind(mind, persona, input({ self: { x: 0, z: 0 }, tag: { x: 30, z: 0 } }));
    expect(JSON.stringify(mind)).toBe(before);
    expect(out.mind).not.toBe(mind);
    expect(out.velocity).not.toBe(mind.target);
  });
});
