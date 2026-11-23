import { describe, expect, it } from 'vitest';
import { runFarm } from './farm';

describe('farm model', () => {
  it('water beetle at level 8: 15 XP a kill, 189 kills to level 9 (2829 XP)', () => {
    const r = runFarm({ enemy: 'water-beetle', level: 8 });
    expect(r.xpPerKillStart).toBe(15);
    expect(r.killsToNextStart).toBe(189);
  });

  it('assisted kills raise the level reached', () => {
    // Not asserted: skill-ups per hour. Assisted levels raise the skill cap, so more own uses fall under the
    // catch-up threshold (0.8 x cap) and count double (8/h assisted vs 6/h solo over 2 h). Assists add no uses.
    const solo = runFarm({ enemy: 'water-beetle', level: 8, hours: 2 });
    const assisted = runFarm({ enemy: 'water-beetle', level: 8, hours: 2, assistKillsPerMinute: 3 });
    expect(assisted.levelEnd).toBeGreaterThan(solo.levelEnd);
  });

  it('water beetle at level 11 (five levels above it) pays nothing', () => {
    const r = runFarm({ enemy: 'water-beetle', level: 11 });
    expect(r.xpPerKillStart).toBe(0);
  });
});
