import { describe, expect, it, vi } from 'vitest';
import { testMinigame } from '@lawn/party/testkit';
import type { SeatInfo } from '@lawn/party';
import { minigames } from '.';
import { THROW } from '../config';
import { NPCS, NPC_ORDER, npcThrow } from '../npc';
import bowlFrame from './bowl-frame';

vi.mock('../npc', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../npc')>();
  return { ...actual, npcThrow: vi.fn(actual.npcThrow) };
});

for (const m of minigames) testMinigame(m);

const STEP = 1 / 60;
type Input = { x: number; aim: number; speed: number; spin: number; shots: number };

/** Seats with no look: init only counts them. */
const seats = (n: number, cpu: boolean): SeatInfo[] =>
  Array.from({ length: n }, (_, k) => ({ seat: k, name: `s${k}`, look: {}, color: 0, cpu })) as unknown as SeatInfo[];

describe('bowl-frame', () => {
  it('a strike ends that lane after one ball', () => {
    const def = bowlFrame;
    const s = def.init(seats(4, false), () => 0.5);
    // A right-handed pocket ball that knocks all ten from a full rack (see physics.test.ts).
    const pocket: Input = { x: -0.25, aim: 0, speed: 9, spin: 0.6, shots: 1 };
    const inputs = [pocket, null, null, null];
    for (let i = 0; i < 45 * 60 && def.result(s, false) === null; i++) def.step(s, inputs, STEP, () => 0.5);
    const lane = s.lanes[0];
    expect(lane.strike).toBe(true);
    expect(lane.total).toBe(10);
    expect(lane.ball).toBe(2);
    expect(lane.lastShots).toBe(1);
    expect(lane.flight).toBeNull();
  });

  it('a gutter ball at the range limits scores 0', () => {
    const def = bowlFrame;
    const s = def.init(seats(4, false), () => 0.5);
    const gutter: Input = { x: THROW.xRange, aim: THROW.aimRange, speed: 9, spin: 0, shots: 1 };
    const inputs = [gutter, null, null, null];
    for (let i = 0; i < 20 * 60 && s.lanes[0].ball === 0; i++) def.step(s, inputs, STEP, () => 0.5);
    expect(s.lanes[0].ball).toBe(1);
    expect(s.lanes[0].total).toBe(0);
    expect(s.lanes[0].standing.every(Boolean)).toBe(true);
  });

  it('a shots counter that does not grow causes no throw', () => {
    const def = bowlFrame;
    const s = def.init(seats(4, false), () => 0.5);
    const idle: Input = { x: 0, aim: 0, speed: 9, spin: 0, shots: 0 };
    for (let i = 0; i < 10 * 60; i++) def.step(s, [idle, idle, idle, idle], STEP, () => 0.5);
    expect(s.lanes.every((l) => l.flight === null && l.ball === 0)).toBe(true);
  });

  it('npcThrow is called at most twice per lane in a full run', () => {
    const def = bowlFrame;
    const rng = () => 0.5;
    const s = def.init(seats(4, true), rng);
    vi.mocked(npcThrow).mockClear();
    for (let i = 0; i < 45 * 60 && def.result(s, false) === null; i++) {
      const inputs = [0, 1, 2, 3].map((seat) => def.cpu(s, seat as 0 | 1 | 2 | 3, rng));
      def.step(s, inputs, STEP, rng);
    }
    expect(def.result(s, true)).not.toBeNull();
    const calls = vi.mocked(npcThrow).mock.calls;
    for (let seat = 0; seat < 4; seat++) {
      const profile = NPCS[NPC_ORDER[seat]];
      expect(calls.filter((c) => c[0] === profile).length).toBeLessThanOrEqual(2);
    }
  });
});
