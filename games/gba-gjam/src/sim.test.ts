import { describe, expect, it, vi } from 'vitest';
import { HOOP_X, HOOP_Y } from './arena';
import { ORIGINAL_BALANCE_CONFIG } from './balance';
import { normalizeBotInput } from './ai';
import { withSeededRandom } from './ai/eval';
import { JamSimulation, type SimCallbacks } from './sim';
import { PRO_TEAMS } from './teams';
import type { AnnouncerEvent, MatchConfig } from './types';

function makeCallbacks(events: AnnouncerEvent[] = []): SimCallbacks {
  return {
    onAnnounce: (ev) => events.push(ev),
    onSound: () => {},
    onRimShake: () => {},
    onCameraPunch: () => {},
    onBurst: () => {},
    onAchievement: () => {},
    onMatchEnd: () => {},
  };
}

function makeConfig(): MatchConfig {
  const home = PRO_TEAMS[0];
  const away = PRO_TEAMS[1];
  return {
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeRoster: [home.roster[0], home.roster[1]],
    awayRoster: [away.roster[0], away.roster[1]],
    opponentMode: 'local2p',
    difficulty: 'pro',
    quarterSeconds: 60,
  };
}

const idle = () => normalizeBotInput(null);

function advanceToLive(sim: JamSimulation): void {
  for (let i = 0; i < 30; i++) {
    sim.step(0.05, idle(), idle());
    if (sim.phase === 'live') break;
  }
}

describe('GBA GJAM mechanics', () => {
  it('rebounds loose balls off the backboard', () => {
    const sim = new JamSimulation(makeConfig(), makeCallbacks());
    advanceToLive(sim);

    sim.ball.carrier = null;
    sim.ball.mode = 'loose';
    sim.ball.pos.set(HOOP_X + 0.3, HOOP_Y + 0.3, 0);
    sim.ball.vel.set(6, 1, 0);

    sim.step(0.016, idle(), idle());

    expect(sim.ball.vel.x).toBeLessThan(0);
    sim.dispose();
  });

  it('supports alley-oop lobs to a teammate near the hoop', () => {
    const events: AnnouncerEvent[] = [];
    const sim = new JamSimulation(makeConfig(), makeCallbacks(events));
    advanceToLive(sim);

    // Place P0 with ball at perimeter, P1 near the hoop
    sim.ball.carrier = 0;
    sim.ball.mode = 'held';
    sim.players[0].pos.set(3, 0, 0);
    sim.players[1].pos.set(HOOP_X - 2.2, 0, 0.5);
    sim.players[2].pos.set(-5, 0, 2);
    sim.players[3].pos.set(-5, 0, -2);

    // P0 presses Turbo + Pass to throw alley-oop lob
    sim.step(0.016, { ...idle(), turbo: true, passPressed: true }, idle());
    expect(sim.ball.mode).toBe('pass');
    expect(sim.ball.isAlleyOop).toBe(true);
    expect(events.some((e) => e.text.includes('ALLEY-OOP'))).toBe(true);

    // Step until P1 catches and dunks
    let sawAlleyOopDunk = false;
    for (let i = 0; i < 50; i++) {
      sim.step(0.02, idle(), idle());
      if (sim.players[1].dunk?.style === 'alleyOop') {
        sawAlleyOopDunk = true;
        break;
      }
    }
    expect(sawAlleyOopDunk).toBe(true);
    sim.dispose();
  });

  it('supports self-lob off the backboard and spike-against-backboard dunk', () => {
    const events: AnnouncerEvent[] = [];
    const sim = new JamSimulation(makeConfig(), makeCallbacks(events));
    advanceToLive(sim);

    // P0 drives near hoop while teammate P1 is back near half-court
    sim.ball.carrier = 0;
    sim.ball.mode = 'held';
    sim.players[0].pos.set(HOOP_X - 3.0, 0, 0);
    sim.players[1].pos.set(-2, 0, 0);
    sim.players[2].pos.set(-6, 0, 2);
    sim.players[3].pos.set(-6, 0, -2);

    sim.step(0.016, { ...idle(), turbo: true, passPressed: true }, idle());
    expect(sim.ball.mode).toBe('pass');
    expect(sim.ball.isBackboardLob).toBe(true);
    expect(events.some((e) => e.text.includes('OFF THE GLASS'))).toBe(true);

    // Step until P0 catches the backboard rebound mid-air and triggers backboard dunk
    let sawBackboardDunk = false;
    for (let i = 0; i < 60; i++) {
      sim.step(0.02, idle(), idle());
      if (sim.players[0].dunk?.style === 'backboard') {
        sawBackboardDunk = true;
        break;
      }
    }
    expect(sawBackboardDunk).toBe(true);
    sim.dispose();
  });

  it('supports partner-assisted launch dunk', () => {
    const events: AnnouncerEvent[] = [];
    const sim = new JamSimulation(makeConfig(), makeCallbacks(events));
    advanceToLive(sim);

    // P0 has ball outside normal solo dunk range, P1 is right next to P0
    sim.ball.carrier = 0;
    sim.ball.mode = 'held';
    sim.players[0].pos.set(HOOP_X - 6.5, 0, 0);
    sim.players[1].pos.set(HOOP_X - 7.5, 0, 0.2);

    sim.step(0.016, { ...idle(), turbo: true, shootPressed: true, shootDown: true }, idle());

    expect(sim.players[0].dunk?.style).toBe('partnerLaunch');
    expect(sim.players[0].dunk?.launcherIdx).toBe(1);
    expect(events.some((e) => e.text.includes('PARTNER LAUNCH'))).toBe(true);
    sim.dispose();
  });

  it('is deterministic with the original balance for a fixed seed', () => {
    const playOnce = () =>
      withSeededRandom(7, () => {
        const sim = new JamSimulation(
          { ...makeConfig(), opponentMode: 'botvsbot', quarterSeconds: 20, balance: ORIGINAL_BALANCE_CONFIG },
          makeCallbacks(),
        );
        for (let i = 0; i < 3000; i++) sim.step(1 / 60, idle(), idle());
        const score = [...sim.score];
        sim.dispose();
        return score;
      });
    const first = playOnce();
    expect(first[0] + first[1]).toBeGreaterThan(0);
    expect(playOnce()).toEqual(first);
  });

  it('moveSpeedScale slows player movement', () => {
    const distanceCovered = (scale: number) => {
      const sim = new JamSimulation(
        { ...makeConfig(), balance: { ...ORIGINAL_BALANCE_CONFIG, moveSpeedScale: scale } },
        makeCallbacks(),
      );
      advanceToLive(sim);
      sim.ball.carrier = 2;
      sim.ball.mode = 'held';
      sim.players[2].pos.set(6, 0, 6);
      sim.players[0].pos.set(-6, 0, 0);
      sim.players[0].vel.set(0, 0, 0);
      const startX = sim.players[0].pos.x;
      for (let i = 0; i < 60; i++) sim.step(1 / 60, { ...idle(), moveX: 1 }, idle());
      const covered = sim.players[0].pos.x - startX;
      sim.dispose();
      return covered;
    };
    expect(distanceCovered(0.5)).toBeLessThan(distanceCovered(1.0));
  });

  it('a contested dunk with a defender nearby does not score', () => {
    // Every random roll returns 0, so the contest roll (0 < chance) always fails the dunk.
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const events: AnnouncerEvent[] = [];
      const sim = new JamSimulation(
        {
          ...makeConfig(),
          balance: { ...ORIGINAL_BALANCE_CONFIG, dunkContestFailChance: 1, dunkContestRadius: 5 },
        },
        makeCallbacks(events),
      );
      advanceToLive(sim);
      sim.ball.carrier = 0;
      sim.ball.mode = 'held';
      sim.players[0].pos.set(HOOP_X - 1.5, 0, 0);
      sim.players[1].pos.set(-5, 0, 0);
      sim.players[2].pos.set(HOOP_X - 3, 0, 1.0);
      sim.players[3].pos.set(-5, 0, -2);
      const scoreBefore = sim.score[0];

      sim.step(0.016, { ...idle(), shootPressed: true, shootDown: true }, idle());
      expect(sim.players[0].dunk).not.toBeNull();
      for (let i = 0; i < 80 && sim.players[0].dunk; i++) sim.step(0.016, idle(), idle());

      expect(events.some((e) => e.text === 'REJECTED!')).toBe(true);
      expect(sim.score[0]).toBe(scoreBefore);
      sim.dispose();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('side fairness', () => {
  it('mirror matches between identical bots do not favour the home side', async () => {
    const { simulateMatch } = await import('./ai/eval');
    const { createShoveHoundBot } = await import('./ai/bots');
    const bot = { id: 'sh', name: 'sh', create: () => createShoveHoundBot() };
    let home = 0;
    let away = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const t = simulateMatch({ homeBot: bot, awayBot: bot, seed, quarterSeconds: 20 });
      home += t.homeScore;
      away += t.awayScore;
    }
    // Before alternating the update order the home side scored ~1.6x the away side.
    expect(home / away).toBeGreaterThan(0.78);
    expect(home / away).toBeLessThan(1.28);
  });
});

describe('steal, inbound and fake rules', () => {
  const setup = (balance = {}) => {
    const sim = new JamSimulation({ ...makeConfig(), balance }, makeCallbacks());
    advanceToLive(sim);
    sim.ball.carrier = 0;
    sim.ball.mode = 'held';
    sim.players[0].pos.set(0, 0, 0);
    sim.players[1].pos.set(-6, 0, 3);
    sim.players[2].pos.set(1.0, 0, 0);
    sim.players[3].pos.set(6, 0, 3);
    for (const p of sim.players) {
      p.stealCooldown = 0;
      p.stunTimer = 0;
    }
    return sim;
  };
  const poke = (sim: JamSimulation) => {
    sim.step(0.016, idle(), { ...idle(), passPressed: true });
  };

  it('cannot steal from the inbound ball-holder while protected', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const sim = setup({ inboundProtectSec: 3, stealBaseChance: 1 });
      sim.inboundProtectT = 2;
      poke(sim);
      expect(sim.ball.carrier).toBe(0);
      sim.inboundProtectT = 0;
      sim.players[2].stealCooldown = 0;
      poke(sim);
      expect(sim.ball.carrier).toBe(2);
    } finally {
      spy.mockRestore();
    }
  });

  it('a missed pickpocket leaves the defender off balance', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    try {
      const sim = setup({ inboundProtectSec: 0, stealBaseChance: 0.1, stealWhiffStunSec: 0.5 });
      sim.inboundProtectT = 0;
      poke(sim);
      expect(sim.ball.carrier).toBe(0);
      expect(sim.players[2].stunTimer).toBeGreaterThan(0.3);
    } finally {
      spy.mockRestore();
    }
  });

  it('a defender who bites on a fake is stunned and the shooter gets an open look', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const sim = setup({ inboundProtectSec: 0, fakeBiteBaseChance: 1 });
      sim.inboundProtectT = 0;
      sim.step(0.016, { ...idle(), fakePressed: true }, idle());
      expect(sim.players[0].fakeTimer).toBeGreaterThan(0);
      poke(sim);
      expect(sim.players[2].stunTimer).toBeGreaterThan(0.3);
      expect(sim.players[0].openLookTimer).toBeGreaterThan(0);
      expect(sim.ball.carrier).toBe(0);
    } finally {
      spy.mockRestore();
    }
  });

  it('a defender who reads a fake gets a better steal chance', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    try {
      const sim = setup({ inboundProtectSec: 0, fakeBiteBaseChance: 0, fakeBiteDefenseScale: 0, stealBaseChance: 0.1, fakeReadStealBonus: 0.6 });
      sim.inboundProtectT = 0;
      sim.step(0.016, { ...idle(), fakePressed: true }, idle());
      poke(sim);
      expect(sim.ball.carrier).toBe(2);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('pass interception', () => {
  it('a defender standing on the pass line can pick it off; with it off the pass completes', () => {
    const run = (passInterceptChance: number) => {
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0);
      try {
        const sim = new JamSimulation(
          { ...makeConfig(), balance: { inboundProtectSec: 0, passInterceptChance, passInterceptRadius: 1.5 } },
          makeCallbacks(),
        );
        advanceToLive(sim);
        sim.ball.carrier = 0;
        sim.ball.mode = 'held';
        sim.players[0].pos.set(-4, 0, 0);
        sim.players[1].pos.set(4, 0, 0);
        sim.players[2].pos.set(0, 0, 0.3);
        sim.players[3].pos.set(8, 0, 6);
        sim.step(0.016, { ...idle(), passPressed: true }, idle());
        let result: number | null = null;
        for (let i = 0; i < 80; i++) {
          sim.step(0.016, idle(), idle());
          if ((sim.ball.mode as string) !== 'pass') {
            result = sim.ball.carrier;
            break;
          }
        }
        return result;
      } finally {
        spy.mockRestore();
      }
    };
    expect(run(0)).toBe(1);
    expect(run(0.9)).toBe(2);
  });
});
