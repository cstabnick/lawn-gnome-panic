import { describe, expect, it } from 'vitest';
import type { GnomeLook } from '@lawn/gnome';
import {
  JamSimulation,
  createClassicBot,
  mulberry32,
  normalizeBotInput,
  setBotFactory,
  type GnomePlayerProfile,
  type MatchConfig,
  type MatchResult,
  type SimCallbacks,
} from './index';

function profile(id: string, stats: number): GnomePlayerProfile {
  return {
    id,
    name: id,
    nickname: id,
    number: 1,
    look: {} as GnomeLook,
    stats: { speed: stats, threePt: stats, dunk: stats, defense: stats },
  };
}

const config: MatchConfig = {
  homeTeamId: 'h',
  awayTeamId: 'a',
  homeRoster: [profile('h1', 75), profile('h2', 75)],
  awayRoster: [profile('a1', 75), profile('a2', 75)],
  opponentMode: 'botvsbot',
  difficulty: 'pro',
  quarterSeconds: 15,
};

function play(): { res: MatchResult[]; ticks: number; sim: JamSimulation } {
  const res: MatchResult[] = [];
  const noop = () => {};
  const cb: SimCallbacks = {
    onAnnounce: noop,
    onSound: noop,
    onRimShake: noop,
    onCameraPunch: noop,
    onBurst: noop,
    onAchievement: noop,
    onMatchEnd: (r) => res.push(r),
  };
  const sim = new JamSimulation(config, cb);
  const idle = normalizeBotInput(null);
  let ticks = 0;
  while (sim.phase !== 'finished' && ticks < 60 * 400) {
    sim.step(1 / 60, idle, idle);
    ticks++;
  }
  return { res, ticks, sim };
}

describe('@lawn/jam headless sim', () => {
  it('builds in plain Node (no window, no Worker)', () => {
    expect(typeof (globalThis as { window?: unknown }).window).toBe('undefined');
    expect(typeof (globalThis as { Worker?: unknown }).Worker).toBe('undefined');
    expect(() => play().sim.dispose()).not.toThrow();
  });

  it('plays a full match with the default classic bots and ends once', () => {
    setBotFactory(null);
    const orig = Math.random;
    Math.random = mulberry32(5);
    try {
      const { res, sim } = play();
      expect(sim.phase).toBe('finished');
      expect(res).toHaveLength(1);
      expect(res[0].boxScore).toHaveLength(4);
    } finally {
      Math.random = orig;
    }
  });

  it('is deterministic under a seeded Math.random', () => {
    const run = () => {
      const orig = Math.random;
      Math.random = mulberry32(9);
      try {
        const { res, ticks } = play();
        return { score: [res[0].homeScore, res[0].awayScore], ticks, box: res[0].boxScore };
      } finally {
        Math.random = orig;
      }
    };
    expect(run()).toEqual(run());
  });

  it('uses a registered bot factory for slots', () => {
    let calls = 0;
    setBotFactory((a, o) => {
      calls++;
      void o;
      void a;
      return createClassicBot();
    });
    try {
      play();
      expect(calls).toBe(4);
    } finally {
      setBotFactory(null);
    }
  });
});
