import { describe, it, expect, vi } from 'vitest';
import type { PartyState, Seat } from '../config';
import { createFlow, newParty } from './flow';

// The board rules are another worker's; these fakes keep the flow's behaviour under test.
vi.mock('../board/rules', () => ({
  newBoard: (_rng: () => number, rounds: number) => ({
    spaces: [],
    starAt: 12,
    players: [0, 1, 2, 3].map(() => ({ space: 0, coins: 10, stars: 0 })),
    round: 1,
    rounds,
    turn: 0,
  }),
  rollDie: () => 3,
  moveSteps: () => [{ e: 'hop', to: 1 }, { e: 'hop', to: 2 }, { e: 'hop', to: 3 }],
  awardMinigame: () => [10, 5, 2, 0],
  advanceTurn: (b: { turn: number }) => {
    if (b.turn < 3) { b.turn += 1; return 'move'; }
    return 'minigame';
  },
  afterMinigame: (b: { round: number; rounds: number; turn: number }) => {
    if (b.round >= b.rounds) return 'over';
    b.round += 1;
    b.turn = 0;
    return 'move';
  },
  standings: () => [0, 1, 2, 3],
}));

vi.mock('../minigames', () => ({
  pickMinigame: () => ({ meta: { id: 'mash' } }),
}));

function makeSeats(humanSeat: number | null): Seat[] {
  return [0, 1, 2, 3].map((i) => ({
    seat: i as Seat['seat'],
    name: `Gn${i}`,
    look: {} as Seat['look'],
    color: 0xffffff,
    cpu: i !== humanSeat,
    playerId: i === humanSeat ? 1 : null,
  }));
}

/** Runs update(0.1) until the phase is `p` (or fails after a long time). */
function runUntil(flow: { update(dt: number): void; state: PartyState }, p: PartyState['phase']['p']): void {
  for (let i = 0; i < 5000 && flow.state.phase.p !== p; i++) flow.update(0.1);
  expect(flow.state.phase.p).toBe(p);
}

describe('party flow', () => {
  it('runs 4 CPUs over one round: intro, mini, results, final', () => {
    const flow = createFlow(newParty(makeSeats(null), 1, 42), () => {});
    runUntil(flow, 'intro');
    runUntil(flow, 'mini');
    flow.miniFinished([0, 1, 2, 3]);
    expect(flow.state.phase.p).toBe('results');
    const res = flow.state.phase;
    if (res.p === 'results') {
      expect(res.coins).toEqual([10, 5, 2, 0]);
      expect(res.places).toEqual([0, 1, 2, 3]);
    }
    expect(flow.state.recent).toEqual(['mash']);
    runUntil(flow, 'final');
  });

  it('waits for a human in roll until roll(seat) or rollAutoS passes', () => {
    const flow = createFlow(newParty(makeSeats(0), 1, 42), () => {});
    flow.update(9.5);
    expect(flow.state.phase).toMatchObject({ p: 'roll', seat: 0 });
    flow.roll(1); // wrong seat: ignored
    expect(flow.state.phase).toMatchObject({ p: 'roll', seat: 0 });
    flow.roll(0);
    expect(flow.state.phase.p).toBe('move');

    const auto = createFlow(newParty(makeSeats(0), 1, 42), () => {});
    auto.update(9.5);
    expect(auto.state.phase.p).toBe('roll');
    auto.update(0.6);
    expect(auto.state.phase.p).toBe('move');
  });

  it('bumps v on every changed state and never goes back', () => {
    const seen: PartyState[] = [];
    const flow = createFlow(newParty(makeSeats(null), 1, 42), (s) => seen.push(s));
    runUntil(flow, 'intro');
    flow.update(0); // no phase change: only a resend may happen, with the same v
    runUntil(flow, 'mini');
    flow.miniFinished([0, 1, 2, 3]);
    runUntil(flow, 'final');
    let last = 0;
    for (const s of seen) {
      expect(s.v).toBeGreaterThanOrEqual(last);
      last = s.v;
    }
    const versions = [...new Set(seen.map((s) => s.v))];
    expect(versions).toEqual([...versions].sort((a, b) => a - b));
    for (let i = 1; i < versions.length; i++) expect(versions[i]).toBe(versions[i - 1] + 1);
  });

  it('setCpu turns a human seat into a CPU and keeps the name', () => {
    const flow = createFlow(newParty(makeSeats(0), 1, 42), () => {});
    flow.setCpu(0);
    expect(flow.state.seats[0]).toMatchObject({ cpu: true, playerId: null, name: 'Gn0' });
    flow.update(0.1);
    flow.update(1.0);
    expect(flow.state.phase.p).toBe('move');
  });

  it('continues from a mid-party state', () => {
    const init: PartyState = {
      ...newParty(makeSeats(null), 1, 9),
      phase: { p: 'results', mini: 'mash', places: [0, 1, 2, 3], coins: [10, 5, 2, 0], left: 1 },
      recent: ['mash'],
    };
    const flow = createFlow(init, () => {});
    expect(flow.state.v).toBe(init.v);
    flow.update(1.1);
    expect(flow.state.phase.p).toBe('final');
  });
});
