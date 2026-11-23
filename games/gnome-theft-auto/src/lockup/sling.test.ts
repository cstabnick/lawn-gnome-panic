import { describe, expect, it } from 'vitest';
import { planSling, startSling, stepSling } from './sling';
import type { DropSpot } from './types';
import { LOCKUP } from './config';

const drop: DropSpot = { x: 10, y: 2, z: -5, yaw: 0 };
const approachYaw = 0.5;
const DT = 1 / 30;

describe('sling-lift flight', () => {
  it('plans the approach at spawnDist from the drop', () => {
    const plan = planSling(drop, approachYaw);
    const d = Math.hypot(plan.fromX - drop.x, plan.fromZ - drop.z);
    expect(d).toBeCloseTo(LOCKUP.sling.spawnDist, 6);
    expect(plan.cruiseY).toBeCloseTo(drop.y + LOCKUP.sling.cruiseHeight, 6);
    expect(plan.hoverY).toBeCloseTo(drop.y + LOCKUP.sling.hoverHeight, 6);
  });

  it('releases exactly once, on the lowering to the ground, then flies off', () => {
    const plan = planSling(drop, approachYaw);
    const s = startSling(plan);
    const events: Array<'released' | 'gone'> = [];
    let releasedAt: { loadY: number; hx: number; hz: number } | null = null;
    let elapsed = 0;
    for (let i = 0; i < 60 / DT && elapsed <= 60; i++) {
      elapsed += DT;
      const ev = stepSling(s, plan, DT);
      if (ev === 'released') {
        events.push(ev);
        releasedAt = { loadY: s.loadY, hx: s.hx, hz: s.hz };
      } else if (ev === 'gone') {
        events.push(ev);
        break;
      }
    }
    expect(events).toEqual(['released', 'gone']);
    expect(releasedAt).not.toBeNull();
    expect(releasedAt!.loadY).toBe(drop.y);
    expect(Math.hypot(releasedAt!.hx - drop.x, releasedAt!.hz - drop.z)).toBeLessThan(0.5);
    expect(elapsed).toBeLessThanOrEqual(30);
  });

  it('is done after gone and stays done', () => {
    const plan = planSling(drop, approachYaw);
    const s = startSling(plan);
    let ev: 'released' | 'gone' | null = null;
    for (let i = 0; i < 60 / DT && ev !== 'gone'; i++) ev = stepSling(s, plan, DT);
    expect(ev).toBe('gone');
    expect(s.phase).toBe('done');
    expect(stepSling(s, plan, DT)).toBeNull();
  });
});
