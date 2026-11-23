import { describe, it, expect } from 'vitest';
import { TUNING } from '../sim/tuning';
import { createBus } from './bus';
import { createNeedsSystem, needsEffects, stepNeeds } from './needs';
import { ITEM_LIST } from '../items/defs';
import type { Needs, NeedsEnv } from './types';

const calm: NeedsEnv = {
  night: false, weather: 'clear', tempC: 14, nearFire: false, inHaven: false,
  hatlessNear: 0, exertion: 0, wet: 0, altitude: 0, infectionStage: null,
};
const fresh = (): Needs => ({ warmth: 80, water: 85, food: 75, calm: 70 });

describe('needs', () => {
  it('water runs out in about 60-72 sun-hours at rest', () => {
    const n = fresh();
    let h = 0;
    while (n.water > 0 && h < 200) { stepNeeds(n, calm, 0.1, TUNING); h += 0.1; }
    expect(h).toBeGreaterThan(60);
    expect(h).toBeLessThan(72);
  });

  it('a storm with no fire takes warmth from 100 to 0 in about 3-4 sun-hours', () => {
    const n = { ...fresh(), warmth: 100 };
    const storm: NeedsEnv = { ...calm, weather: 'storm', tempC: 8 };
    let h = 0;
    while (n.warmth > 0 && h < 20) { stepNeeds(n, storm, 0.05, TUNING); h += 0.05; }
    expect(h).toBeGreaterThan(3);
    expect(h).toBeLessThan(4);
  });

  it('a fire stops that warmth loss', () => {
    const n = { ...fresh(), warmth: 100 };
    const storm: NeedsEnv = { ...calm, weather: 'storm', tempC: 8, nearFire: true };
    stepNeeds(n, storm, 1, TUNING);
    expect(n.warmth).toBe(100);
  });

  it('calm falls with 3 Hatless near and rises in a haven', () => {
    const n = fresh();
    stepNeeds(n, { ...calm, hatlessNear: 3 }, 1, TUNING);
    expect(n.calm).toBeLessThan(70);

    const h = fresh();
    stepNeeds(h, { ...calm, inHaven: true }, 1, TUNING);
    expect(h.calm).toBeGreaterThan(70);
  });

  it('damage lists thirst at water 0', () => {
    const eff = needsEffects({ warmth: 50, water: 0, food: 50, calm: 50 }, TUNING);
    expect(eff.damage.map(d => d.cause)).toContain('thirst');
    expect(needsEffects(fresh(), TUNING).damage).toEqual([]);
  });

  it('eat and drink raise the needs', () => {
    const bus = createBus();
    const sys = createNeedsSystem(bus, TUNING);
    sys.state.food = 40;
    sys.state.water = 40;
    const bread = ITEM_LIST.find(i => i.id === 'bread-loaf');
    if (!bread) throw new Error('bread-loaf missing');
    sys.eat(bread);
    expect(sys.state.food).toBe(60);
    sys.drink(0.5, true);
    expect(sys.state.water).toBe(70);
  });
});
