import { describe, expect, it } from 'vitest';
import { getBaselineRoster } from './baseline';
import { recordMatch } from './events';

function classicPair() {
  const classic = getBaselineRoster().find((b) => b.id === 'classic');
  if (!classic) throw new Error('classic bot missing from baseline roster');
  return { homeBot: classic, awayBot: classic };
}

describe('recordMatch', () => {
  it('last score matches the final telemetry score', () => {
    const { telemetry, events } = recordMatch({ ...classicPair(), quarterSeconds: 10, seed: 1 });
    const last = events.scores[events.scores.length - 1];
    if (last) {
      expect(last.homeScore).toBe(telemetry.homeScore);
      expect(last.awayScore).toBe(telemetry.awayScore);
    } else {
      expect(telemetry.homeScore + telemetry.awayScore).toBe(0);
    }
    expect(events.seed).toBe(1);
    expect(events.totalSec).toBeGreaterThan(0);
  });

  it('same seed gives deep-equal events', () => {
    const a = recordMatch({ ...classicPair(), quarterSeconds: 10, seed: 1 });
    const b = recordMatch({ ...classicPair(), quarterSeconds: 10, seed: 1 });
    expect(a.events).toEqual(b.events);
    expect(a.telemetry.homeScore).toBe(b.telemetry.homeScore);
  });

  it('possessions are well-formed and shots are counted pooled', () => {
    const { events } = recordMatch({ ...classicPair(), quarterSeconds: 10, seed: 2 });
    for (const p of events.possessions) {
      expect(p.endTick).toBeGreaterThanOrEqual(p.startTick);
      expect(p.passes).toBeGreaterThanOrEqual(0);
    }
    for (const s of events.shotsOnFire) {
      expect(s.made).toBeLessThanOrEqual(s.att);
    }
  });
});
