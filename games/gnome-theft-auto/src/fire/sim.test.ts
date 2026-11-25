import { describe, it, expect } from 'vitest';
import { createFireField, ignite, douse, stepFires, burningCount, nearestBurning, clearFires, fuelPoint } from './sim';
import { FIRE } from './types';

/** Step until `done` or the time limit; returns all events. */
function run(field: ReturnType<typeof createFireField>, seconds: number, dt = 0.1, fuel = [] as ReturnType<typeof fuelPoint>[]) {
  const events = [];
  for (let t = 0; t < seconds; t += dt) events.push(...stepFires(field, dt, fuel));
  return events;
}

describe('fire sim', () => {
  it('grows toward 1 and burns out as burnt when its fuel ends', () => {
    const field = createFireField();
    const f = ignite(field, 0, 0, 0, { fuel: 2 });
    const events = run(field, 5);
    expect(f.heat).toBeGreaterThan(FIRE.startHeat);
    expect(f.heat).toBeLessThanOrEqual(1);
    expect(events.some((e) => e.t === 'burnt' && e.id === f.id)).toBe(true);
    expect(f.state).toBe('burnt');
  });

  it('water puts a fire out, then it is gone after smokeS', () => {
    const field = createFireField();
    const f = ignite(field, 0, 0, 0, { fuel: 500 });
    const removed = douse(field, 0, 0, 0.5, 10);
    expect(removed).toBeGreaterThan(0);
    const events = run(field, 0.1);
    expect(f.state).toBe('out');
    expect(events.some((e) => e.t === 'out' && e.id === f.id)).toBe(true);
    const later = run(field, FIRE.smokeS + 1);
    expect(later.some((e) => e.t === 'gone' && e.id === f.id)).toBe(true);
    expect(field.fires.includes(f)).toBe(false);
  });

  it('wet fires grow slower', () => {
    const field = createFireField();
    const dry = ignite(field, 0, 0, 0, { heat: 0.3 });
    const wet = ignite(field, 10, 0, 10, { heat: 0.3 });
    wet.wet = 0.8;
    run(field, 2);
    expect(wet.heat).toBeLessThan(dry.heat);
  });

  it('douse splits water between two fires in range and ignores one out of range', () => {
    const field = createFireField();
    const a = ignite(field, 0, 0, 0, { heat: 0.8 });
    const b = ignite(field, 1, 0, 0, { heat: 0.8 });
    const far = ignite(field, 50, 0, 50, { heat: 0.8 });
    const removed = douse(field, 0.5, 0, 0.5, 4);
    const each = (4 / 2) * FIRE.douseHeatPerLitre;
    expect(a.heat).toBeCloseTo(0.8 - each);
    expect(b.heat).toBeCloseTo(0.8 - each);
    expect(removed).toBeCloseTo(each * 2);
    expect(far.heat).toBe(0.8);
    expect(far.wet).toBe(0);
  });

  it('a fuel point next to a hot fire catches after spreadAfterS (event spread)', () => {
    const field = createFireField();
    ignite(field, 0, 0, 0, { heat: 0.9, fuel: 500 });
    const p = fuelPoint(1.5, 0, 0, 0.5, 'hedge', 60, 'g1');
    const events = run(field, FIRE.spreadAfterS + 0.5, 0.1, [p]);
    const spread = events.find((e) => e.t === 'spread');
    expect(spread).toBeDefined();
    expect(p.lit).toBe(true);
    expect(field.fires.some((f) => f.id === (spread as { id: number }).id && f.group === 'g1' && f.kind === 'hedge')).toBe(true);
  });

  it('a fuel point does not catch if the fire is doused first', () => {
    const field = createFireField();
    ignite(field, 0, 0, 0, { heat: 0.9, fuel: 500 });
    douse(field, 0, 0, 0.5, 20);
    const p = fuelPoint(1.5, 0, 0, 0.5, 'hedge');
    const events = run(field, FIRE.spreadAfterS + 2, 0.1, [p]);
    expect(events.some((e) => e.t === 'spread')).toBe(false);
    expect(p.lit).toBe(false);
  });

  it('maxFires is respected, dropping a non-burning fire first', () => {
    const field = createFireField();
    const out = ignite(field, 100, 0, 100);
    out.state = 'out';
    for (let i = 1; i < FIRE.maxFires; i++) ignite(field, i, 0, 0);
    expect(field.fires.length).toBe(FIRE.maxFires);
    ignite(field, -5, 0, -5);
    expect(field.fires.length).toBe(FIRE.maxFires);
    expect(field.fires.includes(out)).toBe(false);
  });

  it('groups clear separately', () => {
    const field = createFireField();
    ignite(field, 0, 0, 0, { group: 'a' });
    ignite(field, 5, 0, 0, { group: 'b' });
    expect(burningCount(field, 'a')).toBe(1);
    expect(burningCount(field)).toBe(2);
    clearFires(field, 'a');
    expect(burningCount(field, 'a')).toBe(0);
    expect(burningCount(field, 'b')).toBe(1);
    expect(nearestBurning(field, 4, 0)?.group).toBe('b');
    clearFires(field);
    expect(field.fires.length).toBe(0);
    expect(nearestBurning(field, 0, 0)).toBeNull();
  });
});
