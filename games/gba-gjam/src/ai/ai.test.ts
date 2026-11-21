import { describe, expect, it, vi } from 'vitest';
import {
  captureGameState,
  createAlleyOopExpressBot,
  createArcArchitectBot,
  createBotFromAssignment,
  createChampionV1Bot,
  createClassicBot,
  createFireFeederBot,
  createHybridAceBot,
  createLockdownCounterBot,
  createShoveHoundBot,
  normalizeBotInput,
  RemoteBotController,
  validateBotScriptSyntax,
  type BotController,
  type BotPresetId,
  type GameStateSnapshot,
} from './index';
import { runSeries, simulateMatch, sweepParameters, wrapWithReactionCadence } from './eval';
import { JamSimulation, type SimCallbacks } from '../sim';
import { PRO_TEAMS } from '../teams';
import type { MatchConfig } from '../types';

function makeNoopCallbacks(): SimCallbacks {
  return {
    onAnnounce: () => {},
    onSound: () => {},
    onRimShake: () => {},
    onCameraPunch: () => {},
    onBurst: () => {},
    onAchievement: () => {},
    onMatchEnd: () => {},
  };
}

function makeConfig(overrides: Partial<MatchConfig> = {}): MatchConfig {
  const home = PRO_TEAMS[0];
  const away = PRO_TEAMS[1];
  return {
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeRoster: [home.roster[0], home.roster[1]],
    awayRoster: [away.roster[0], away.roster[1]],
    opponentMode: 'botvsbot',
    difficulty: 'pro',
    quarterSeconds: 45,
    ...overrides,
  };
}

describe('GBA GJAM Bot AI framework', () => {
  it('captures a pure JSON-serializable GameStateSnapshot', () => {
    const sim = new JamSimulation(makeConfig(), makeNoopCallbacks());
    const snap = captureGameState(sim);

    expect(snap.players).toHaveLength(4);
    expect(snap.court.hoopX).toBeGreaterThan(0);
    expect(snap.score).toEqual([0, 0]);
    expect(snap.phase).toBe('tipoff');

    const roundTrip = JSON.parse(JSON.stringify(snap)) as GameStateSnapshot;
    expect(roundTrip.players[0].stats).toEqual(snap.players[0].stats);
    expect(roundTrip.ball.pos).toEqual(snap.ball.pos);
    sim.dispose();
  });

  it('normalizes partial and out-of-range bot inputs safely', () => {
    const empty = normalizeBotInput(undefined);
    expect(empty).toEqual({
      moveX: 0,
      moveZ: 0,
      turbo: false,
      shootDown: false,
      shootPressed: false,
      shootReleased: false,
      passPressed: false,
      fakePressed: false,
    });

    const clamped = normalizeBotInput({
      moveX: 10,
      moveZ: 10,
      turbo: true,
      shootPressed: true,
    });
    expect(Math.hypot(clamped.moveX, clamped.moveZ)).toBeCloseTo(1, 5);
    expect(clamped.turbo).toBe(true);
    expect(clamped.shootPressed).toBe(true);
    expect(clamped.passPressed).toBe(false);
  });

  it('runs custom BotController instances in JamSimulation botvsbot mode', () => {
    const sim = new JamSimulation(makeConfig(), makeNoopCallbacks());
    const seenTicks: number[] = [];

    const spyBot: BotController = {
      id: 'spy',
      name: 'Spy Bot',
      decide(state, ctx) {
        seenTicks.push(state.tick);
        expect(ctx.playerIndex).toBe(0);
        return { moveX: 1, moveZ: 0, turbo: true };
      },
    };
    sim.setBot(0, spyBot);

    const idle = normalizeBotInput(null);
    // Advance past tipoff (1.0s) into live play
    for (let i = 0; i < 40; i++) {
      sim.step(0.05, idle, idle);
    }

    expect(seenTicks.length).toBeGreaterThan(10);
    expect(sim.phase).toBe('live');
    expect(sim.clockSec).toBeLessThan(45);
    sim.dispose();
  });

  it('classicBot makes valid decisions for offense and defense', () => {
    const sim = new JamSimulation(makeConfig(), makeNoopCallbacks());
    const classic = createClassicBot();
    const idle = normalizeBotInput(null);
    for (let i = 0; i < 25; i++) sim.step(0.05, idle, idle);

    const snap = sim.getSnapshot();
    const out0 = normalizeBotInput(
      classic.decide(snap, {
        playerIndex: 0,
        role: 'solo',
        difficulty: 'pro',
        dt: 0.016,
        humanInput: null,
      }),
    );
    const out2 = normalizeBotInput(
      classic.decide(snap, {
        playerIndex: 2,
        role: 'opponent',
        difficulty: 'allstar',
        dt: 0.016,
        humanInput: null,
      }),
    );

    expect(Math.hypot(out0.moveX, out0.moveZ)).toBeLessThanOrEqual(1.0001);
    expect(Math.hypot(out2.moveX, out2.moveZ)).toBeLessThanOrEqual(1.0001);
    sim.dispose();
  });

  it('validates bot script syntax without executing code', () => {
    expect(validateBotScriptSyntax('function decide(state, ctx) { return { moveX: 1 }; }')).toBeNull();
    expect(validateBotScriptSyntax('function decide( {')).not.toBeNull();
    expect(validateBotScriptSyntax('   ')).toBe('Script is empty.');
  });

  it('RemoteBotController posts state and handles responses/errors gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ moveX: 0.5, moveZ: -0.5, shootPressed: true }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const sim = new JamSimulation(makeConfig(), makeNoopCallbacks());
    const remote = new RemoteBotController({ url: 'http://127.0.0.1:8765/decide' });
    const action = await remote.decideAsync(sim.getSnapshot(), {
      playerIndex: 2,
      role: 'opponent',
      difficulty: 'pro',
      dt: 0.016,
      humanInput: null,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(action).toMatchObject({ moveX: 0.5, moveZ: -0.5, shootPressed: true });

    vi.unstubAllGlobals();
    remote.dispose();
    sim.dispose();
  });

  it('creates all built-in strategic bot presets and produces valid normalized inputs', () => {
    const presets: BotPresetId[] = [
      'classic',
      'shove-hound',
      'arc-architect',
      'fire-feeder',
      'alley-oop-express',
      'lockdown-counter',
      'hybrid-ace',
      'champion-v1',
    ];
    const sim = new JamSimulation(makeConfig(), makeNoopCallbacks());
    const idle = normalizeBotInput(null);
    for (let i = 0; i < 25; i++) sim.step(0.05, idle, idle);
    const snap = sim.getSnapshot();

    for (const preset of presets) {
      const bot = createBotFromAssignment({ preset });
      const out = normalizeBotInput(
        bot.decide(snap, {
          playerIndex: 0,
          role: 'solo',
          difficulty: 'pro',
          dt: 1 / 60,
          humanInput: null,
        }),
      );
      expect(Math.hypot(out.moveX, out.moveZ)).toBeLessThanOrEqual(1.0001);
      bot.dispose?.();
    }
    sim.dispose();
  });

  it('headless evaluation harness is deterministic for a fixed seed and side-swaps in series', () => {
    const botA = { id: 'shove-hound', name: 'Shove Hound', create: () => createShoveHoundBot() };
    const botB = { id: 'hybrid-ace', name: 'Hybrid Ace', create: () => createHybridAceBot() };

    const m1 = simulateMatch({ homeBot: botA, awayBot: botB, quarterSeconds: 15, seed: 4242 });
    const m2 = simulateMatch({ homeBot: botA, awayBot: botB, quarterSeconds: 15, seed: 4242 });

    expect(m1.homeScore).toBe(m2.homeScore);
    expect(m1.awayScore).toBe(m2.awayScore);
    expect(m1.ticks).toBe(m2.ticks);
    expect(m1.home.steals).toBe(m2.home.steals);

    const series = runSeries(botA, botB, { games: 2, quarterSeconds: 15, baseSeed: 777 });
    expect(series.matches).toHaveLength(2);
    expect(series.matches[0].homeBotId).toBe('shove-hound');
    expect(series.matches[1].homeBotId).toBe('hybrid-ace');
    expect(series.botA.games).toBe(2);
    expect(series.botB.games).toBe(2);
  });

  it('all new bot factories instantiate cleanly with distinct ids', () => {
    const bots = [
      createShoveHoundBot(),
      createArcArchitectBot(),
      createFireFeederBot(),
      createAlleyOopExpressBot(),
      createLockdownCounterBot(),
      createHybridAceBot(),
      createChampionV1Bot(),
    ];
    const ids = new Set(bots.map((b) => b.id));
    expect(ids.size).toBe(bots.length);
  });

  it('tracks possession telemetry, median/IQR diff, 150ms human-fair cadence, and parameter sweeps', () => {
    const botA = { id: 'shove-hound', name: 'Shove Hound', create: () => createShoveHoundBot() };
    const botB = { id: 'hybrid-ace', name: 'Hybrid Ace', create: () => createHybridAceBot() };

    // 1. Reaction cadence wrapper holds continuous move and clears edge pulses between decision ticks
    let calls = 0;
    const pulseBot: BotController = {
      id: 'pulse',
      name: 'Pulse',
      decide() {
        calls++;
        return { moveX: 1, turbo: true, passPressed: true };
      },
    };
    const wrapped = wrapWithReactionCadence(pulseBot, 3);
    const sim = new JamSimulation(makeConfig(), makeNoopCallbacks());
    const snap = sim.getSnapshot();
    const ctx = { playerIndex: 0, role: 'solo' as const, difficulty: 'pro' as const, dt: 1 / 60, humanInput: null };
    const r1 = wrapped.decide(snap, ctx);
    const r2 = wrapped.decide(snap, ctx);
    const r3 = wrapped.decide(snap, ctx);
    const r4 = wrapped.decide(snap, ctx);
    expect(calls).toBe(2);
    expect(r1.passPressed).toBe(true);
    expect(r2.passPressed).toBeUndefined();
    expect(r2.moveX).toBe(1);
    expect(r3.moveX).toBe(1);
    expect(r4.passPressed).toBe(true);
    sim.dispose();

    // 2. Possession telemetry + median/IQR + Human-Fair 150ms series
    const fairSeries = runSeries(botA, botB, {
      games: 2,
      quarterSeconds: 15,
      baseSeed: 901,
      decisionCadenceMs: 150,
    });
    expect(fairSeries.matches[0].decisionCadenceMs).toBe(150);
    expect(fairSeries.botA.avgPossessions).toBeGreaterThan(0);
    expect(fairSeries.botA.ppp).toBeGreaterThanOrEqual(0);
    expect(fairSeries.botA.iqrDiff[0]).toBeLessThanOrEqual(fairSeries.botA.iqrDiff[1]);
    expect(fairSeries.botA.avgShovesSuffered).toBeCloseTo(fairSeries.botB.avgShoveTurnovers, 5);

    // 3. Automated parameter sweep returns ranked candidates
    const sweep = sweepParameters({
      candidates: [
        { label: 'passive', params: 'passive' as const },
        { label: 'relentless', params: 'relentless-shove' as const },
      ],
      createBot: (mode, label) => ({
        id: `sweep-${label}`,
        name: label,
        create: () => {
          const inner = createHybridAceBot({ defenseMode: mode });
          return { id: `sweep-${label}`, name: label, decide: (s, c) => inner.decide(s, c) };
        },
      }),
      opponents: [botB],
      series: { games: 2, quarterSeconds: 15, baseSeed: 950 },
    });
    expect(sweep).toHaveLength(2);
    expect(sweep[0].stats.games).toBe(2);
  });

  it('does not emit player achievements in botvsbot mode', () => {
    const onAchievement = vi.fn();
    const sim = new JamSimulation(makeConfig({ quarterSeconds: 10 }), {
      ...makeNoopCallbacks(),
      onAchievement,
    });
    sim.setBot(0, createChampionV1Bot());
    sim.setBot(1, createChampionV1Bot());
    sim.setBot(2, createClassicBot());
    sim.setBot(3, createClassicBot());

    const idle = normalizeBotInput(null);
    for (let i = 0; i < 60 * 120 && sim.phase !== 'finished'; i++) {
      sim.step(1 / 60, idle, idle);
    }

    expect(sim.phase).toBe('finished');
    expect(sim.score[0]).toBeGreaterThan(0);
    expect(onAchievement).not.toHaveBeenCalled();
    sim.dispose();
  });
});
