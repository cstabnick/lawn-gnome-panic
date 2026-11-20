import { describe, expect, it, vi } from 'vitest';
import {
  captureGameState,
  createClassicBot,
  normalizeBotInput,
  RemoteBotController,
  validateBotScriptSyntax,
  type BotController,
  type GameStateSnapshot,
} from './index';
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
});
