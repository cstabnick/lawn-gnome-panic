import { describe, it, expect } from 'vitest';
import { DECKS, TURN_S, type Card, type TableEvent, type TableState } from './config';
import { handTotal, newShoe } from './cards';
import { applyInput, fillCpus, newTable, removeHuman, seatHuman, snapshot, tickTable } from './table';

const c = (r: number, s: Card['s'] = 'S'): Card => ({ r, s });
const DT = 1 / 30;

describe('handTotal', () => {
  it('counts aces soft when that does not bust', () => {
    expect(handTotal([c(1), c(13)])).toEqual({ total: 21, soft: true });
    expect(handTotal([c(1), c(1), c(9)])).toEqual({ total: 21, soft: true });
    expect(handTotal([c(13), c(12), c(5)])).toEqual({ total: 25, soft: false });
    expect(handTotal([c(1), c(6)])).toEqual({ total: 17, soft: true });
  });
});

describe('newShoe', () => {
  it('has DECKS * 52 cards and the same seed gives the same order', () => {
    const a = newShoe({ seed: 42 });
    const b = newShoe({ seed: 42 });
    expect(a.length).toBe(DECKS * 52);
    expect(a).toEqual(b);
  });
});

/** Ticks the table; calls onEvents for each batch. Stops after `seconds` simulated seconds. */
function run(st: TableState, seconds: number, onEvents: (ev: TableEvent[], st: TableState) => void = () => {}): void {
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) onEvents(tickTable(st, DT), st);
}

describe('table simulation', () => {
  it('five CPUs play 600 seconds without errors and reach every phase', () => {
    const st = newTable(7);
    fillCpus(st);
    const phases = new Set<string>();
    run(st, 600, (_ev, s) => {
      phases.add(s.phase);
      for (const seat of s.seats) {
        if (!seat) continue;
        expect(Number.isFinite(seat.chips)).toBe(true);
        expect(seat.chips).toBeGreaterThanOrEqual(0);
      }
    });
    expect(st.round).toBeGreaterThanOrEqual(8);
    expect(['betting', 'dealing', 'playing', 'dealer', 'payout'].every((p) => phases.has(p))).toBe(true);
  });

  it('a seated human who never sends input sits out', () => {
    const st = newTable(11);
    fillCpus(st);
    const { seat } = seatHuman(st, 1, 'Quiet', '', 0xffffff);
    expect(seat).toBeGreaterThanOrEqual(0);
    let sawDealing = false;
    run(st, 60, (_ev, s) => {
      if (s.phase === 'dealing' && !sawDealing) {
        sawDealing = true;
        expect(s.seats[seat]?.hand).toBeNull();
      }
    });
    expect(sawDealing).toBe(true);
  });

  it('a human who is ready and then idles stands on timeout', () => {
    const st = newTable(3);
    fillCpus(st);
    const { seat } = seatHuman(st, 1, 'Idle', '', 0xffffff);
    const seen: TableEvent[] = [];
    let timedOut = false;
    run(st, 600, (ev, s) => {
      if (!timedOut) {
        seen.push(...ev);
        if (s.phase === 'betting' && !s.seats[seat]?.ready) applyInput(s, seat, { k: 'ready' });
      }
      if (ev.some((e) => e.e === 'timeout' && 'seat' in e && e.seat === seat)) timedOut = true;
    });
    expect(timedOut).toBe(true);
    expect(seen).toContainEqual({ e: 'timeLow', seat });
    expect(seen).toContainEqual({ e: 'timeout', seat });
    expect(TURN_S).toBeGreaterThan(5);
  });

  it('seatHuman replaces the highest CPU and removeHuman brings a CPU back', () => {
    const st = newTable(5);
    fillCpus(st);
    expect(st.seats[4]?.cpu).toBe(true);
    const joined = seatHuman(st, 9, 'Me', '', 0xffffff);
    expect(joined.seat).toBe(4);
    expect(joined.events).toContainEqual({ e: 'leave', seat: 4 });
    expect(joined.events).toContainEqual({ e: 'join', seat: 4 });
    expect(st.seats[4]?.cpu).toBe(false);
    expect(st.seats[4]?.id).toBe(9);
    const left = removeHuman(st, 9);
    expect(left).toContainEqual({ e: 'leave', seat: 4 });
    expect(left).toContainEqual({ e: 'join', seat: 4 });
    expect(st.seats[4]?.cpu).toBe(true);
  });

  it('snapshot has an empty shoe and is a copy', () => {
    const st = newTable(9);
    fillCpus(st);
    for (let i = 0; i < 60 / DT && st.phase === 'betting'; i++) tickTable(st, DT);
    expect(st.phase).not.toBe('betting');
    expect(st.shoe.length).toBeGreaterThan(0);
    const snap = snapshot(st);
    expect(snap.shoe).toEqual([]);
    expect(snap).not.toBe(st);
    snap.t = -1;
    expect(st.t).not.toBe(-1);
  });

  it('musicSeed stays fixed for the lobby across ticks and snapshots', () => {
    const st = newTable(42);
    const initialMusicSeed = st.musicSeed;
    expect(typeof initialMusicSeed).toBe('number');
    fillCpus(st);
    for (let i = 0; i < 30 / DT; i++) tickTable(st, DT);
    expect(st.musicSeed).toBe(initialMusicSeed);
    expect(snapshot(st).musicSeed).toBe(initialMusicSeed);
  });

  it('shoot knocks the dealer flat for 10-15 s before rising back up', () => {
    const st = newTable(12);
    const { seat } = seatHuman(st, 1, 'Blaster', '', 0xffffff);
    fillCpus(st);
    const shotEv = applyInput(st, seat, { k: 'shoot' });
    expect(shotEv).toEqual([{ e: 'dealerShot', seat }]);
    expect(st.dealerShot).not.toBeNull();
    const downFor = st.dealerShot!.until - st.dealerShot!.at;
    expect(downFor).toBeGreaterThanOrEqual(10);
    expect(downFor).toBeLessThanOrEqual(15);
    expect(applyInput(st, seat, { k: 'shoot' })).toEqual([]);

    const seen: TableEvent[] = [];
    run(st, 16, (ev) => seen.push(...ev));
    expect(seen).toContainEqual({ e: 'dealerRise' });
    expect(st.dealerShot).toBeNull();
  });
});
