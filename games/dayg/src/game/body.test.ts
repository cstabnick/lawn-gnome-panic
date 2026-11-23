import { describe, it, expect } from 'vitest';
import { createBus, type GameEvents } from './bus';
import { createBody, createBodySystem, fallBody, hitBody, stepInfection, treatChance } from './body';
import { TUNING } from '../sim/tuning';
import type { BodyState, NeedDamage } from './types';

const T = TUNING;
const constRng = (v: number) => () => v;

function collect(bus: ReturnType<typeof createBus>) {
  const events: { k: string; e: unknown }[] = [];
  const keys: (keyof GameEvents)[] = ['cracked', 'infection', 'infection-cured', 'player-shattered'];
  for (const k of keys) bus.on(k, (e) => events.push({ k, e }));
  return events;
}

describe('infection stages', () => {
  const stageAt = (hours: number, season: 'spring' | 'summer' | 'autumn' | 'winter' = 'summer', wet = 0) => {
    const b = createBody();
    b.infection = { part: 'legL', hours: 0, stage: 0 };
    const out: ReturnType<typeof stepInfection> = stepInfection(b, hours, season, wet, T);
    return { b, out };
  };

  it('moves through stages at 0.5 / 3 / 12 / 24 sun-hours in summer', () => {
    expect(stageAt(0.49).b.infection!.stage).toBe(0);
    expect(stageAt(0.5).out).toBe(1);
    expect(stageAt(2.99).b.infection!.stage).toBe(1);
    expect(stageAt(3).out).toBe(2);
    expect(stageAt(11.99).b.infection!.stage).toBe(2);
    expect(stageAt(12).out).toBe(3);
    expect(stageAt(23.99).out).toBe(3);
    expect(stageAt(24).out).toBe('turned');
  });

  it('spreads faster in spring and slower in winter', () => {
    // spring x1.5: 2 sun-hours is 3 infection-hours, so stage 2 is reached at 3 sun-hours... check 2.0 -> stage 2
    expect(stageAt(2, 'spring').out).toBe(2);
    // winter x0.5: 6 sun-hours is 3 infection-hours -> stage 2
    expect(stageAt(6, 'winter').out).toBe(2);
    expect(stageAt(6, 'summer').out).toBe(2);
    expect(stageAt(5, 'winter').out).toBe(1);
  });

  it('wet speeds the infection up', () => {
    expect(stageAt(2.5, 'summer', 1).out).toBe(2);
    expect(stageAt(2.5, 'summer', 0).out).toBe(1);
  });

  it('turning shatters the gnome with cause moss', () => {
    const { b } = stageAt(24);
    expect(b.shattered).toBe(true);
    expect(b.cause).toBe('moss');
  });
});

describe('treatment', () => {
  const infected = (stage: 0 | 1 | 2 | 3): BodyState => {
    const b = createBody();
    b.infection = { part: 'armR', hours: 0, stage };
    return b;
  };

  it('salt-wash works only at stage 0', () => {
    expect(treatChance(infected(0), 'salt-wash', T)).toBeCloseTo(0.95);
    expect(treatChance(infected(1), 'salt-wash', T)).toBe(0);
    expect(treatChance(infected(2), 'salt-wash', T)).toBe(0);
  });

  it('scrape-seal at stage 1 has chance 0.6 with glazing 0', () => {
    expect(T.infection.playerGlazing).toBe(0);
    expect(treatChance(infected(1), 'scrape-seal', T)).toBeCloseTo(0.6);
  });

  it('no infection gives chance 0', () => {
    expect(treatChance(createBody(), 'spirit', T)).toBe(0);
  });

  it('scrape-seal success clears the infection and leaves a deep crack', () => {
    const bus = createBus();
    const events = collect(bus);
    const sys = createBodySystem(bus, constRng(0), T);
    sys.state.infection = { part: 'armR', hours: 1, stage: 1 };
    expect(sys.treat('scrape-seal')).toBe(true); // rng 0 < 0.6
    expect(sys.state.infection).toBeNull();
    expect(sys.state.cracks.armR).toBe(3);
    expect(events.some((x) => x.k === 'infection-cured' && (x.e as { stage: number }).stage === 1)).toBe(true);
    expect(events.some((x) => x.k === 'cracked' && (x.e as { cause: string }).cause === 'scrape')).toBe(true);
  });

  it('a failed treatment keeps the infection', () => {
    const bus = createBus();
    const sys = createBodySystem(bus, constRng(0.99), T);
    sys.state.infection = { part: 'armR', hours: 1, stage: 1 };
    expect(sys.treat('scrape-seal')).toBe(false);
    expect(sys.state.infection).not.toBeNull();
  });
});

describe('falls', () => {
  it('a 30 gm fall can shatter', () => {
    const b = createBody();
    const r = fallBody(b, 30, constRng(0), T); // chance 0.75, rng 0 shatters
    expect(r.shattered).toBe(true);
    expect(b.cause).toBe('fall');
  });

  it('a 30 gm fall without the roll leaves a deep crack and a chest chip', () => {
    const b = createBody();
    const r = fallBody(b, 30, constRng(0.99), T);
    expect(r.shattered).toBe(false);
    expect(b.cracks.chest).toBe(1);
    expect([b.cracks.legL, b.cracks.legR]).toContain(3);
  });

  it('a short fall does nothing', () => {
    const b = createBody();
    fallBody(b, 2, constRng(0), T);
    expect(Object.values(b.cracks).every((v) => v === 0)).toBe(true);
  });
});

describe('hits', () => {
  it('a head or chest at level 3 raised again shatters with cause hatless', () => {
    const b = createBody();
    b.cracks.head = 3;
    const r = hitBody(b, 1, constRng(0), T); // head pick needs rng small: first part is head
    expect(r.part).toBe('head');
    expect(b.shattered).toBe(true);
    expect(b.cause).toBe('hatless');
  });

  it('glaze drops by the hit loss', () => {
    const b = createBody();
    hitBody(b, 0, constRng(0.99), T);
    expect(b.glaze).toBeCloseTo(1 - T.body.glazeLossPerHit);
  });
});

describe('wear and shattering', () => {
  it('wear 100 shatters with the cause of the largest damage', () => {
    const bus = createBus();
    const events = collect(bus);
    const sys = createBodySystem(bus, constRng(0.5), T);
    sys.state.wear = 99;
    const damage: NeedDamage[] = [{ cause: 'cold', perHour: 2 }, { cause: 'hunger', perHour: 0.5 }];
    sys.update(1, { damage, season: 'winter', wet: 0 });
    expect(sys.state.shattered).toBe(true);
    expect(sys.state.cause).toBe('cold');
    expect(events.filter((x) => x.k === 'player-shattered')).toHaveLength(1);
  });

  it('player-shattered fires exactly once', () => {
    const bus = createBus();
    const events = collect(bus);
    const sys = createBodySystem(bus, constRng(0), T);
    sys.state.wear = 99;
    const damage: NeedDamage[] = [{ cause: 'thirst', perHour: 5 }];
    sys.update(1, { damage, season: 'summer', wet: 0 });
    sys.update(1, { damage, season: 'summer', wet: 0 });
    bus.emit('player-hit', { strength: 1, from: { x: 0, z: 0 } });
    bus.emit('fell', { height: 40 });
    expect(events.filter((x) => x.k === 'player-shattered')).toHaveLength(1);
    expect(sys.state.cause).toBe('thirst');
  });

  it('every 25 wear raises a random part with cause cold', () => {
    const bus = createBus();
    const events = collect(bus);
    const sys = createBodySystem(bus, constRng(0), T);
    sys.update(10, { damage: [{ cause: 'cold', perHour: 3 }], season: 'winter', wet: 0 });
    expect(sys.state.wear).toBe(30);
    const cracked = events.filter((x) => x.k === 'cracked');
    expect(cracked.length).toBeGreaterThan(0);
    expect(cracked.every((x) => (x.e as { cause: string }).cause === 'cold')).toBe(true);
  });
});

describe('effects and mend', () => {
  it('limp, aim shake and hat slip follow cracks and stage 3', () => {
    const bus = createBus();
    const sys = createBodySystem(bus, constRng(0), T);
    sys.state.cracks.legL = 3;
    sys.state.cracks.armR = 3;
    const e = sys.effects();
    expect(e.limp).toBeCloseTo(1);
    expect(e.aimShake).toBeCloseTo(1);
    expect(e.hatSlips).toBe(false);
    sys.state.infection = { part: 'chest', hours: 13, stage: 3 };
    expect(sys.effects().hatSlips).toBe(true);
    expect(sys.effects().aimShake).toBeCloseTo(1.4);
  });

  it('mend lowers the worst part and restores glaze, false when nothing to mend', () => {
    const bus = createBus();
    const sys = createBodySystem(bus, constRng(0), T);
    expect(sys.mend()).toBe(false);
    sys.state.cracks.chest = 2;
    sys.state.glaze = 0.4;
    expect(sys.mend()).toBe(true);
    expect(sys.state.cracks.chest).toBe(1);
    expect(sys.state.glaze).toBe(1);
  });

  it('a new body is clean', () => {
    const b = createBody();
    expect(b.glaze).toBe(1);
    expect(b.wear).toBe(0);
    expect(b.infection).toBeNull();
    expect(b.shattered).toBe(false);
  });
});
