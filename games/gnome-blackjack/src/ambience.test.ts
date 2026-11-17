import { describe, expect, it } from 'vitest';
import {
  createServerAgent,
  SERVER_RADIUS,
  SERVER_SPECS,
  STATIC_OBSTACLES,
  stepServers,
} from './ambience';

describe('bar ambience servers', () => {
  it('enter from offscreen, mingle, exit, and never collide with each other or the table', () => {
    const agents = SERVER_SPECS.map(createServerAgent);
    const seenPhases = new Set<string>();

    for (let step = 0; step < 900; step++) {
      stepServers(agents, SERVER_SPECS, STATIC_OBSTACLES, 1 / 30);

      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        seenPhases.add(a.phase);
        expect(Number.isFinite(a.x)).toBe(true);
        expect(Number.isFinite(a.z)).toBe(true);
        expect(Number.isFinite(a.facing)).toBe(true);
        if (!a.visible) continue;

        // Must stay clear of the blackjack table centre (0, -0.9) and dealer (0, -1.4)
        const behindDealer = a.z <= -2.1;
        const distFromTable = Math.hypot(a.x, a.z + 0.9);
        expect(behindDealer || distFromTable > 2.7).toBe(true);

        // Must not collide with any other visible server
        for (let j = i + 1; j < agents.length; j++) {
          const b = agents[j];
          if (!b.visible) continue;
          const pairDist = Math.hypot(a.x - b.x, a.z - b.z);
          expect(pairDist).toBeGreaterThanOrEqual(SERVER_RADIUS * 2 - 0.001);
        }
      }
    }

    expect(seenPhases.has('offscreen')).toBe(true);
    expect(seenPhases.has('enter')).toBe(true);
    expect(seenPhases.has('mingle')).toBe(true);
    expect(seenPhases.has('exit')).toBe(true);
  });

  it('includes both waitresses and waiters', () => {
    const roles = new Set(SERVER_SPECS.map((s) => s.role));
    expect(roles.has('waitress')).toBe(true);
    expect(roles.has('waiter')).toBe(true);
  });
});
