import { describe, expect, it } from 'vitest';
import { newBoard, stepBoard, boardSpeed, skateTuning } from './board';
import { SKATE } from './types';
import type { BoardState, SkateEvent, SkateGround, SkateInput, SkateRail } from './types';

const DT = 1 / 60;
const NONE: SkateInput = { steer: 0, push: 0, brake: 0, ollie: false, flip: false, grab: false, stick: { x: 0, y: 0 } };
const inp = (p: Partial<SkateInput> = {}): SkateInput => ({ ...NONE, ...p });

function ground(h: (x: number, z: number) => number, paved = true, rails: SkateRail[] = []): SkateGround {
  return { height: h, paved: () => paved, rails };
}
const flat = ground(() => 0);
const rough = ground(() => 0, false);
const stepG = ground((x) => (x > 6 ? 0.4 : 0));
const quarter = ground((x) => Math.min(2.5, Math.max(0, x - 5) ** 2 * 0.4));
const railG = ground(() => 0, true, [{ id: 'r', ax: 5, ay: 0.47, az: 0, bx: 9, by: 0.47, bz: 0 }]);

/** A board at (x, 0) heading east (+x, yaw pi/2) at speed v. */
function rider(g: SkateGround, x: number, v: number): BoardState {
  const b = newBoard(x, 0, Math.PI / 2, g);
  b.vx = v;
  return b;
}

function run(b: BoardState, g: SkateGround, secs: number, input: SkateInput = NONE): SkateEvent[] {
  const ev: SkateEvent[] = [];
  for (let i = 0; i < Math.round(secs / DT); i++) ev.push(...stepBoard(b, input, g, DT));
  return ev;
}
const kinds = (ev: SkateEvent[]): string[] => ev.map((e) => e.e);

describe('skate board', () => {
  it('uses the SKATE tuning', () => {
    expect(skateTuning().jumpV).toBe(SKATE.ollieV);
    expect(skateTuning().muOther).toBe(SKATE.muRough);
  });

  it('pushing on flat paved ground reaches pushMax and no more than maxSpeed', () => {
    const b = newBoard(0, 0, Math.PI / 2, flat);
    let top = 0;
    const ev: SkateEvent[] = [];
    for (let i = 0; i < 240; i++) {
      ev.push(...stepBoard(b, inp({ push: 1 }), flat, DT));
      top = Math.max(top, boardSpeed(b));
    }
    expect(boardSpeed(b)).toBeGreaterThan(0.8 * SKATE.pushMax);
    expect(top).toBeLessThanOrEqual(SKATE.pushMax + 0.2);
    expect(top).toBeLessThanOrEqual(SKATE.maxSpeed);
    expect(kinds(ev).filter((k) => k === 'push')).toHaveLength(1);
  });

  it('rough ground stops a 6 m/s board within 3 s', () => {
    const b = rider(rough, 0, 6);
    run(b, rough, 3);
    expect(boardSpeed(b)).toBeLessThan(0.1);
  });

  it('an ollie peaks 0.6 to 0.9 m up and lands: takeoff, pop, land', () => {
    const b = rider(flat, 0, 4);
    const ev = stepBoard(b, inp({ ollie: true }), flat, DT);
    let apex = 0;
    for (let i = 0; i < 120; i++) {
      ev.push(...stepBoard(b, NONE, flat, DT));
      apex = Math.max(apex, b.y);
    }
    expect(apex).toBeGreaterThan(0.6);
    expect(apex).toBeLessThan(0.9);
    expect(kinds(ev)).toEqual(['takeoff', 'pop', 'land']);
    expect(ev[0]).toMatchObject({ e: 'takeoff', ollie: true });
    expect(ev[1]).toMatchObject({ e: 'pop', trick: 'ollie' });
    expect(b.mode).toBe('ground');
  });

  it('a flip after the ollie finishes and lands; a flip just before touchdown bails', () => {
    const b = rider(flat, 0, 4);
    const ev = stepBoard(b, inp({ ollie: true }), flat, DT);
    ev.push(...stepBoard(b, inp({ flip: true }), flat, DT));
    ev.push(...run(b, flat, 1));
    expect(kinds(ev)).toEqual(['takeoff', 'pop', 'pop', 'trickDone', 'land']);
    expect(ev[2]).toMatchObject({ e: 'pop', trick: 'kickflip' });
    expect(ev[3]).toMatchObject({ e: 'trickDone', trick: 'kickflip' });

    const c = rider(flat, 0, 4);
    const ev2 = stepBoard(c, inp({ ollie: true }), flat, DT);
    let flipped = false;
    for (let i = 0; i < 120 && c.mode === 'air'; i++) {
      const falling: boolean = c.vy < 0 && c.y < 0.1 && !flipped;
      flipped = flipped || falling;
      ev2.push(...stepBoard(c, falling ? inp({ flip: true }) : NONE, flat, DT));
    }
    run(c, flat, 0.1);
    expect(ev2.find((e) => e.e === 'bail')).toEqual({ e: 'bail', reason: 'trick' });
    expect(kinds(ev2)).not.toContain('land');
  });

  it('a held grab at touchdown bails, a released one ends cleanly', () => {
    const b = rider(flat, 0, 4);
    const ev = stepBoard(b, inp({ ollie: true }), flat, DT);
    ev.push(...run(b, flat, 0.2, inp({ grab: true })));
    ev.push(...run(b, flat, 0.1));
    expect(kinds(ev)).toEqual(['takeoff', 'pop', 'grabStart', 'grabEnd']);
    ev.push(...run(b, flat, 0.5));
    expect(kinds(ev)).toContain('land');
  });

  it('riding into a 0.4 m step stops at 6 m/s, bails at 9 m/s', () => {
    const b = rider(stepG, 0, 6);
    const ev = run(b, stepG, 3);
    expect(kinds(ev)).toContain('wall');
    expect(kinds(ev)).not.toContain('bail');
    expect(boardSpeed(b)).toBeLessThan(0.5);
    expect(b.x).toBeLessThan(6.1);

    const c = rider(stepG, 0, 9);
    const ev2 = run(c, stepG, 2);
    expect(ev2.find((e) => e.e === 'bail')).toEqual({ e: 'bail', reason: 'wall' });
    expect(c.mode === 'bail' || c.mode === 'ground').toBe(true);
  });

  it('a steep quarter-pipe throws the board up and it lands back down the transition', () => {
    const b = rider(quarter, 2, 13);
    const ev: SkateEvent[] = [];
    let launchX = -1;
    for (let i = 0; i < 300; i++) {
      const was = b.mode;
      ev.push(...stepBoard(b, NONE, quarter, DT));
      if (was === 'ground' && b.mode === 'air') launchX = b.x;
    }
    expect(launchX).toBeGreaterThan(0);
    expect(kinds(ev)).toContain('takeoff');
    expect(ev.find((e) => e.e === 'takeoff')).toMatchObject({ ollie: false });
    expect(b.x).toBeLessThan(launchX + 0.5);
  });

  it('an ollie onto a rail grinds it, and the far end gives fullRail', () => {
    const b = rider(railG, 3.9, 4);
    const ev = stepBoard(b, inp({ ollie: true }), railG, DT);
    ev.push(...run(b, railG, 0.8));
    expect(kinds(ev)).toContain('grindStart');
    expect(b.mode).toBe('grind');
    ev.push(...run(b, railG, 2));
    expect(kinds(ev)).toContain('grindEnd');
    expect(kinds(ev)).toContain('fullRail');
    expect(ev.find((e) => e.e === 'fullRail')).toEqual({ e: 'fullRail', rail: 0 });
  });

  it('a bail lies down, slows to a stop, then rides again', () => {
    const b = rider(stepG, 0, 9);
    run(b, stepG, 0.5);
    expect(['bail', 'ground']).toContain(b.mode);
    run(b, stepG, 2);
    expect(b.mode).toBe('ground');
    expect(boardSpeed(b)).toBeLessThan(0.5);
  });
});
