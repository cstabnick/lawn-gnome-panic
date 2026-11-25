import { describe, expect, it } from 'vitest';
import { createRaceSession, pickupPayout, standingsText, type RaceSessionDeps } from './session';
import type { RaceModeStart } from './types';

const rival = { name: 'R', look: {}, pace: 0.9 };

function deps(over: { busy?: boolean; acorns?: number; net?: unknown } = {}): RaceSessionDeps {
  return {
    quest: {
      cutscene: { active: false },
      player: { health: 1 },
      vehicles: [],
      economy: { state: () => ({ acorns: over.acorns ?? 50 }) },
      hud: { toast: () => undefined },
    },
    seat: () => undefined,
    store: {},
    questBusy: () => over.busy ?? false,
    net: () => (over.net ?? null) as never,
    increment: () => undefined,
  } as unknown as RaceSessionDeps;
}

const base: RaceModeStart = { kind: 'pickup', trackId: 'kerb-row-circuit', vehicle: 'hatchback' as never, laps: 1, rivals: [rival] as never, wager: 25 };

describe('helpers', () => {
  it('pays twice the wager for a win only', () => {
    expect(pickupPayout(100, 1)).toBe(200);
    expect(pickupPayout(100, 2)).toBe(0);
    expect(pickupPayout(0, 1)).toBe(0);
  });
  it('writes standings by time, DNF last', () => {
    expect(standingsText([{ name: 'B', time: 70 }, { name: 'C', time: null }, { name: 'A', time: 61.5 }])).toBe(
      '1. A 1:01.5, 2. B 1:10.0, C DNF',
    );
  });
});

describe('start refusals', () => {
  it('refuses when a quest is busy', () => {
    expect(typeof createRaceSession(deps({ busy: true })).start(base)).toBe('string');
  });
  it('refuses a wager above the Acorns', () => {
    expect(typeof createRaceSession(deps({ acorns: 10 })).start(base)).toBe('string');
  });
  it('refuses a pickup race with no rivals', () => {
    expect(typeof createRaceSession(deps()).start({ ...base, rivals: [] })).toBe('string');
  });
  it('refuses online without a net', () => {
    const s = createRaceSession(deps());
    expect(typeof s.start({ ...base, kind: 'online', rivals: undefined })).toBe('string');
    expect(s.active()).toBeNull();
  });
});
