import { describe, expect, it } from 'vitest';
import { CLASSIC_3BAR } from './catalog';
import { evaluateReels, newSlotState, setSlotBet, startSpin, tickSlots } from './engine';

describe('Classic 3-Bar slot engine', () => {
  it('evaluates all winning combinations and mixed bars', () => {
    expect(evaluateReels(CLASSIC_3BAR, ['7', '7', '7'], 10)).toEqual({
      win: 500, multiplier: 50, label: 'TRIPLE SEVENS!', jackpot: true,
    });
    expect(evaluateReels(CLASSIC_3BAR, ['BAR3', 'BAR3', 'BAR3'], 10)).toEqual({
      win: 250, multiplier: 25, label: 'TRIPLE 3×BAR!', jackpot: true,
    });
    expect(evaluateReels(CLASSIC_3BAR, ['BAR', 'BAR', 'BAR'], 10)).toEqual({
      win: 150, multiplier: 15, label: 'THREE BARS!', jackpot: false,
    });
    expect(evaluateReels(CLASSIC_3BAR, ['BAR3', 'BAR', 'BAR3'], 10)).toEqual({
      win: 80, multiplier: 8, label: 'MIXED BARS', jackpot: false,
    });
    expect(evaluateReels(CLASSIC_3BAR, ['CHERRY', 'LEMON', 'CHERRY'], 10)).toEqual({
      win: 20, multiplier: 2, label: 'DOUBLE CHERRIES', jackpot: false,
    });
    expect(evaluateReels(CLASSIC_3BAR, ['LEMON', 'BELL', 'BAR'], 10)).toEqual({
      win: 0, multiplier: 0, label: '', jackpot: false,
    });
  });

  it('rejects spin when chips are below bet and deducts bet on valid spin', () => {
    const st = newSlotState('slot-1', 'classic-3bar', 42);
    expect(startSpin(st, 2)).toEqual({ ok: false, cost: 0, events: [] });
    const res = startSpin(st, 100);
    expect(res.ok).toBe(true);
    expect(res.cost).toBe(5);
    expect(st.phase).toBe('spinning');
    expect(st.stopped).toEqual([false, false, false]);
  });

  it('stops reels sequentially and resolves payout', () => {
    const st = newSlotState('slot-1', 'classic-3bar', 12345);
    setSlotBet(st, 10, 100);
    startSpin(st, 100);

    const seenStops: number[] = [];
    let resolved = false;
    for (let i = 0; i < 40; i++) {
      const { events, payout } = tickSlots(st, 0.1);
      for (const ev of events) {
        if (ev.e === 'reel-stop') seenStops.push(ev.reel);
        if (ev.e === 'win' || ev.e === 'lose') {
          resolved = true;
          expect(payout).toBe(st.lastWin);
        }
      }
      if (resolved) break;
    }
    expect(seenStops).toEqual([0, 1, 2]);
    expect(resolved).toBe(true);
    expect(st.phase).toBe('payout');

    // Advances back to idle after payout display
    for (let i = 0; i < 20; i++) tickSlots(st, 0.1);
    expect(st.phase).toBe('idle');
  });

  it('adds anticipation delay when the first two reels match', () => {
    // Find a seed whose first two symbols match
    let seed = 1;
    let st = newSlotState('slot-1', 'classic-3bar', seed);
    for (; seed < 500; seed++) {
      st = newSlotState('slot-1', 'classic-3bar', seed);
      startSpin(st, 100);
      if (st.reels[0] === st.reels[1]) break;
    }
    expect(st.reels[0]).toBe(st.reels[1]);

    let sawAnticipation = false;
    for (let i = 0; i < 30; i++) {
      const { events } = tickSlots(st, 0.1);
      if (events.some((e) => e.e === 'anticipation')) sawAnticipation = true;
    }
    expect(sawAnticipation).toBe(true);
  });
});
