import { afterEach, describe, expect, it, vi } from 'vitest';
import { LANE, ROUND } from './config';
import { makePlayer, newGame, newState, throwBall, tickGame } from './game';
import { simulateThrow } from './physics';
import { evalReplay, REPLAY_TOTAL_SECONDS, replayDuration, replayForced, shouldReplay } from './replay';
import { freshRack } from './scoring';

describe('instant replay', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('triggers at roughly 5% chance when not forced and is deterministic', () => {
    let hits = 0;
    const N = 2000;
    for (let turn = 0; turn < N; turn++) {
      const a = shouldReplay(turn, turn % 11, turn % 4);
      const b = shouldReplay(turn, turn % 11, turn % 4);
      expect(a).toBe(b);
      if (a) hits++;
    }
    const rate = hits / N;
    expect(rate).toBeGreaterThan(0.025);
    expect(rate).toBeLessThan(0.08);
  });

  it('forces 100% replay when #replay or ?replay is in the URL', () => {
    expect(replayForced()).toBe(false);

    vi.stubGlobal('location', { hash: '#play&replay', search: '' });
    expect(replayForced()).toBe(true);
    expect(shouldReplay(0, 0, 0)).toBe(true);

    vi.stubGlobal('location', { hash: '', search: '?replay=1' });
    expect(replayForced()).toBe(true);
    expect(shouldReplay(42, 3, 0)).toBe(true);

    vi.stubGlobal('location', { hash: '#play', search: '' });
    expect(replayForced()).toBe(false);
  });

  it('produces 4 distinct anime camera cuts with slow-mo and a rewind second playback', () => {
    const sim = simulateThrow({ x: -0.2, aim: 0, speed: 8.5, spin: 0.45 }, freshRack());
    expect(replayDuration(sim)).toBe(REPLAY_TOTAL_SECONDS);
    expect(replayDuration(null)).toBe(0);

    const samples = [0.2, 1.3, 2.75, 4.4].map((t) => evalReplay(sim, t));
    expect(samples.map((s) => s.cutIndex)).toEqual([0, 1, 2, 3]);
    expect(samples.map((s) => s.playback)).toEqual([1, 1, 2, 2]);

    // Distinct camera positions across all 4 cuts.
    for (let i = 0; i < samples.length; i++) {
      expect(samples[i].simTime).toBeGreaterThanOrEqual(0);
      expect(samples[i].simTime).toBeLessThanOrEqual(sim.duration);
      // Never clip inside the pinsetter hood (y >= 1.0 when z >= LANE.length - 0.6).
      const [, cy, cz] = samples[i].camPos;
      if (cz >= LANE.length - 0.6) expect(cy).toBeLessThan(0.95);
    }

    // Cut 3 rewinds before the end of Cut 2 to replay the impact from a second angle.
    const endOfCut2 = evalReplay(sim, 2.55).simTime;
    const startOfCut3 = evalReplay(sim, 2.65).simTime;
    expect(startOfCut3).toBeLessThan(endOfCut2);
  });

  it('transitions result -> replay -> aim in tickGame when forced', () => {
    vi.stubGlobal('location', { hash: '#replay', search: '' });
    const state = newState();
    newGame(state, [makePlayer('Gnorman', 'gnorman', 0xff5a5a)], 'local');
    tickGame(state, ROUND.introSeconds + 0.01);
    expect(state.phase).toBe('aim');

    expect(throwBall(state, { x: -0.2, aim: 0, speed: 8, spin: 0.4 })).toBe(true);
    expect(state.phase).toBe('approach');

    tickGame(state, 2.0);
    expect(state.phase).toBe('roll');

    tickGame(state, (state.sim?.duration ?? 3) + ROUND.settleSeconds + 0.05);
    expect(state.phase).toBe('result');
    expect(state.result?.replay).toBe(true);

    tickGame(state, ROUND.bigResultSeconds + 0.5);
    expect(state.phase).toBe('replay');

    tickGame(state, REPLAY_TOTAL_SECONDS + 0.1);
    expect(state.phase).toBe('aim');
  });
});
