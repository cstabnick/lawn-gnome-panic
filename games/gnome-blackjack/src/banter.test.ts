import { describe, it, expect } from 'vitest';
import { banterFor, LINES, GENERIC, type Topic } from './banter';
import { DEALER, type Seat, type TableEvent, type TableState } from './config';

const seat = (name: string, character: string, cpu: boolean): Seat => ({
  id: cpu ? -1 : 0, name, cpu, character, color: 0xffffff, chips: 100, bet: 0, ready: true, hand: null, voice: 100,
});

// Hand-built fixture (table.ts is not imported): 3 CPUs, 1 human, 1 empty seat.
function table(): TableState {
  return {
    t: 0, phase: 'playing', phaseT: 0, turn: 0, timer: 0,
    seats: [
      seat('Gnorbert', 'gnorbert', true),
      seat('Gnadine', 'gnadine', true),
      seat('Lil Pebble', 'pebble', true),
      seat('Robin', '', false),
      null,
    ],
    dealer: [], holeHidden: false, shoe: [], seed: 1, round: 1,
    bubbles: [], nextBubbleId: 1, idleIn: 10, cpuIn: 0, lowSent: false, dealerShot: null,
  };
}

// Small seeded LCG: deterministic r() in [0, 1).
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const EVENTS: TableEvent[] = [
  { e: 'roundStart' }, { e: 'deal' },
  { e: 'turn', seat: 0 }, { e: 'turn', seat: 3 },
  { e: 'hit', seat: 0, total: 12 }, { e: 'hit', seat: 3, total: 12 },
  { e: 'stand', seat: 1, total: 17 }, { e: 'stand', seat: 3, total: 17 },
  { e: 'double', seat: 2 }, { e: 'double', seat: 3 },
  { e: 'bust', seat: 0, total: 23 }, { e: 'bust', seat: 3, total: 23 },
  { e: 'blackjack', seat: 1 }, { e: 'blackjack', seat: 3 },
  { e: 'timeLow', seat: 0 }, { e: 'timeLow', seat: 3 },
  { e: 'timeout', seat: 2 }, { e: 'timeout', seat: 3 },
  { e: 'dealerReveal', total: 18 }, { e: 'dealerBust', total: 24 }, { e: 'dealerBlackjack' },
  { e: 'result', seat: 0, result: 'win', delta: 30 }, { e: 'result', seat: 3, result: 'win', delta: 25 },
  { e: 'result', seat: 1, result: 'lose', delta: -10 }, { e: 'result', seat: 3, result: 'lose', delta: -10 },
  { e: 'broke', seat: 2 }, { e: 'broke', seat: 3 },
  { e: 'join', seat: 1 }, { e: 'join', seat: 3 },
  { e: 'leave', seat: 0 }, { e: 'leave', seat: 3 },
  { e: 'idle' },
];

describe('banterFor', () => {
  it('only CPU gnomes and the dealer speak, with clean short text', () => {
    const st = table();
    EVENTS.forEach((ev, i) => {
      const r = lcg(1000 + i);
      for (let n = 0; n < 200; n++) {
        const line = banterFor(st, ev, r);
        if (line === null) continue;
        expect(line.seat === DEALER || line.seat === 0 || line.seat === 1 || line.seat === 2).toBe(true);
        expect(line.seat).not.toBe(3);
        expect(line.text.length).toBeGreaterThan(0);
        expect(line.text.length).toBeLessThanOrEqual(90);
        expect(line.text).not.toContain('{');
      }
    });
  });

  it('idle usually produces a line when CPUs are seated', () => {
    const st = table();
    const r = lcg(7);
    let hits = 0;
    for (let n = 0; n < 200; n++) if (banterFor(st, { e: 'idle' }, r)) hits++;
    expect(hits).toBe(200);
  });

  it('idle returns null with no CPU seated', () => {
    const st = table();
    st.seats[0] = seat('Robin', '', false);
    st.seats[1] = null;
    st.seats[2] = null;
    const r = lcg(3);
    for (let n = 0; n < 50; n++) expect(banterFor(st, { e: 'idle' }, r)).toBeNull();
    expect(banterFor(st, { e: 'dealerBust', total: 24 }, lcg(4))).toBeNull();
  });

  it('a human blackjack is never spoken by the human', () => {
    const st = table();
    st.seats[1] = null;
    const r = lcg(9);
    for (let n = 0; n < 100; n++) {
      const line = banterFor(st, { e: 'blackjack', seat: 3 }, r);
      expect(line).not.toBeNull();
      expect(line!.seat).not.toBe(3);
    }
  });
});

describe('banter lines', () => {
  const speakers = Object.keys(LINES);
  it('every character has at least 8 idle lines and 4 per topic it has', () => {
    for (const who of speakers) {
      const topics = LINES[who];
      if (who !== 'dealer') expect(topics.idle?.length ?? 0).toBeGreaterThanOrEqual(8);
      for (const [topic, lines] of Object.entries(topics) as [Topic, string[]][]) {
        expect(lines.length, `${who}.${topic}`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('every template is at most 70 characters', () => {
    const all = [...Object.values(LINES).flatMap(t => Object.values(t).flat()), ...Object.values(GENERIC).flat()];
    for (const t of all) expect(t.length, t).toBeLessThanOrEqual(70);
  });

  it('GENERIC covers every topic', () => {
    for (const topic of ['idle', 'ownBust', 'ownBlackjack', 'ownWin', 'ownLose', 'ownDouble', 'ownHit', 'ownStand',
      'tease', 'cheer', 'nag', 'jealous', 'dealerBust', 'hello', 'turn', 'timeout', 'welcome', 'leave', 'broke',
      'roundStart', 'reveal', 'gloat'] as Topic[]) {
      expect(GENERIC[topic].length, topic).toBeGreaterThanOrEqual(4);
    }
  });
});
