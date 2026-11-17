import { describe, expect, it } from 'vitest';
import { testMinigame } from '@lawn/party/testkit';
import { mulberry32 } from '@lawn/party';
import type { SeatInfo } from '@lawn/party';
import { minigames } from '.';
import bjSprint from './bj-sprint';

for (const m of minigames) testMinigame(m);

const STEP = 1 / 60;
const seats = (cpu: boolean): SeatInfo[] =>
  Array.from({ length: 4 }, (_, k) => ({
    seat: k,
    name: `Gnome ${k}`,
    look: {},
    color: 0xffffff,
    cpu,
  })) as unknown as SeatInfo[];

describe('bj-sprint', () => {
  it('allows simultaneous human actions in playing phase and finishes 3 hands', () => {
    const rng = mulberry32(42);
    const s = bjSprint.init(seats(false), rng);
    const seqs = [0, 0, 0, 0];

    // Advance past dealing into playing.
    for (let i = 0; i < 90 && s.table.phase === 'dealing'; i++) {
      bjSprint.step(s, [null, null, null, null], STEP, rng);
    }
    expect(s.table.phase).toBe('playing');

    // All 4 seats stand simultaneously on their first action.
    const standInputs = [0, 1, 2, 3].map((k) => ({ act: 'stand' as const, seq: ++seqs[k] }));
    bjSprint.step(s, standInputs, STEP, rng);
    expect(s.table.phase).toBe('dealer');

    // Step with idle inputs until all 3 hands finish (auto-standing on remaining hands).
    for (let i = 0; i < 60 * 60 && bjSprint.result(s, false) === null; i++) {
      bjSprint.step(s, [null, null, null, null], STEP, rng);
    }
    const places = bjSprint.result(s, false);
    expect(places).not.toBeNull();
    expect(s.handNum).toBe(3);
  });
});
