import { describe, expect, it } from 'vitest';
import { createPatrolState, SERVER_SPECS, stepPatrol } from './ambience';

describe('bar ambience patrol', () => {
  it('advances smoothly along waypoints and loops without NaN', () => {
    for (const spec of SERVER_SPECS) {
      const p = createPatrolState(spec.route);
      for (let i = 0; i < 600; i++) {
        stepPatrol(p, spec.route, spec.speed, 1 / 30);
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.z)).toBe(true);
        expect(Number.isFinite(p.facing)).toBe(true);
        // Must stay clear of the dealer (z = -1.4) and the half-disc table + seats (r = 2.55 around (0, -0.9))
        const behindDealer = p.z <= -2.1;
        const distFromTable = Math.hypot(p.x, p.z + 0.9);
        expect(behindDealer || distFromTable > 2.8).toBe(true);
      }
    }
  });

  it('includes both waitresses and waiters', () => {
    const roles = new Set(SERVER_SPECS.map((s) => s.role));
    expect(roles.has('waitress')).toBe(true);
    expect(roles.has('waiter')).toBe(true);
  });
});
