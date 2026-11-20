import { describe, it, expect } from 'vitest';
import {
  newRoom, normalizeAnswer, addPlayer, openRound, submitAnswer, shouldClose, closeRound, standings, isGameOver, tierFor,
  type Player, type Room,
} from './engine';
import { PROMPTS, shufflePromptOrder } from './prompts';
import { ROUNDS_PER_GAME, MAX_ANSWER_LEN } from './config';

const p = (n: number): Player => ({ pid: `p${n}`, name: `Gnome ${n}` });

function roomWith(n: number, windowMs = 1000): Room {
  const room = newRoom('ABCDE', p(1), windowMs, [0, 1, 2]);
  for (let i = 2; i <= n; i++) addPlayer(room, p(i));
  return room;
}

describe('normalizeAnswer', () => {
  it('gives "The Mushrooms!" and "mushroom" the same key', () => {
    expect(normalizeAnswer('The Mushrooms!')).toBe(normalizeAnswer('mushroom'));
    expect(normalizeAnswer('The Mushrooms!')).toBe('mushroom');
  });

  it('strips accents', () => {
    expect(normalizeAnswer('Café')).toBe(normalizeAnswer('cafe'));
  });

  it('collapses spaces and case', () => {
    expect(normalizeAnswer('  Garden   HOSE ')).toBe('garden hose');
  });

  it('returns an empty key for empty or punctuation-only input', () => {
    expect(normalizeAnswer('')).toBe('');
    expect(normalizeAnswer('   !!! ')).toBe('');
  });
});

describe('submitAnswer', () => {
  it('replaces an earlier answer while the round is open', () => {
    const room = roomWith(2);
    openRound(room, 'Name a pest', 0);
    expect(submitAnswer(room, 'p1', 'slug', 100)).toBe('ok');
    expect(submitAnswer(room, 'p1', 'snail', 200)).toBe('ok');
    expect(room.current!.answers.p1).toBe('snail');
  });

  it('refuses once the round has closed', () => {
    const room = roomWith(2, 1000);
    openRound(room, 'Name a pest', 0);
    expect(submitAnswer(room, 'p1', 'slug', 1000)).toBe('closed');
    expect(room.current!.answers.p1).toBeUndefined();
  });

  it('refuses a player who is not in the room', () => {
    const room = roomWith(2);
    openRound(room, 'Name a pest', 0);
    expect(submitAnswer(room, 'nobody', 'slug', 100)).toBe('unknown-player');
  });

  it('refuses an empty answer', () => {
    const room = roomWith(2);
    openRound(room, 'Name a pest', 0);
    expect(submitAnswer(room, 'p1', '   ', 100)).toBe('empty');
    expect(submitAnswer(room, 'p1', '!!!', 100)).toBe('empty');
  });

  it('reports no-round before any round is open', () => {
    const room = roomWith(2);
    expect(submitAnswer(room, 'p1', 'slug', 100)).toBe('no-round');
  });

  it('trims and caps the answer length', () => {
    const room = roomWith(2);
    openRound(room, 'Name a pest', 0);
    submitAnswer(room, 'p1', `  ${'x'.repeat(MAX_ANSWER_LEN + 20)}  `, 100);
    expect(room.current!.answers.p1).toBe('x'.repeat(MAX_ANSWER_LEN));
  });
});

describe('shouldClose', () => {
  it('is true once everyone has answered, before the window ends', () => {
    const room = roomWith(2, 1000);
    openRound(room, 'Name a pest', 0);
    submitAnswer(room, 'p1', 'slug', 10);
    expect(shouldClose(room, 20)).toBe(false);
    submitAnswer(room, 'p2', 'snail', 20);
    expect(shouldClose(room, 30)).toBe(true);
  });

  it('is true once the window has passed, even with unanswered players', () => {
    const room = roomWith(2, 1000);
    openRound(room, 'Name a pest', 0);
    submitAnswer(room, 'p1', 'slug', 10);
    expect(shouldClose(room, 999)).toBe(false);
    expect(shouldClose(room, 1000)).toBe(true);
  });

  it('is false with no open round', () => {
    expect(shouldClose(roomWith(2), 5000)).toBe(false);
  });
});

describe('closeRound', () => {
  it('buckets a 5-player room with 4 distinct answers and one pair into the right tiers', () => {
    const room = roomWith(5);
    openRound(room, 'Name a pest', 0);
    submitAnswer(room, 'p1', 'Slug', 10);
    submitAnswer(room, 'p2', 'slugs', 10);
    submitAnswer(room, 'p3', 'Snail', 10);
    submitAnswer(room, 'p4', 'Beetle', 10);
    submitAnswer(room, 'p5', 'Mole', 10);

    const closed = closeRound(room)!;
    expect(closed.buckets).toHaveLength(4);
    expect(room.current).toBeNull();
    expect(room.history).toHaveLength(1);

    const pair = closed.buckets.find((b) => b.key === 'slug')!;
    expect(pair.pids.sort()).toEqual(['p1', 'p2']);
    expect(pair.tier).toBe('shrimp'); // 2 of 5 = 40%
    expect(pair.points).toBe(40);

    const singles = closed.buckets.filter((b) => b.key !== 'slug');
    expect(singles).toHaveLength(3);
    for (const b of singles) {
      expect(b.pids).toHaveLength(1);
      expect(b.tier).toBe('krillion'); // one of a kind, 4+ answered
      expect(b.points).toBe(100);
    }

    // Best bucket first.
    expect(closed.buckets[0].points).toBe(100);
    expect(closed.buckets[closed.buckets.length - 1]).toBe(pair);
  });

  it('shows the most common spelling as the display text', () => {
    const room = roomWith(3);
    openRound(room, 'Name a pest', 0);
    submitAnswer(room, 'p1', 'slugs', 10);
    submitAnswer(room, 'p2', 'slug', 10);
    submitAnswer(room, 'p3', 'slug', 10);
    const closed = closeRound(room)!;
    expect(closed.buckets).toHaveLength(1);
    expect(closed.buckets[0].display).toBe('slug');
  });

  it('lists unanswered players when the window ran out', () => {
    const room = roomWith(3);
    openRound(room, 'Name a pest', 0);
    submitAnswer(room, 'p1', 'slug', 10);
    const closed = closeRound(room)!;
    expect(closed.unanswered.sort()).toEqual(['p2', 'p3']);
  });

  it('returns null with no open round', () => {
    expect(closeRound(roomWith(2))).toBeNull();
  });
});

describe('tierFor', () => {
  it('keeps a one-of-a-kind answer at Squid when fewer than 4 answered', () => {
    expect(tierFor(1, 3)).toBe('squid');
  });

  it('makes a one-of-a-kind answer One in a Gnomillion at 4+ answers', () => {
    expect(tierFor(1, 4)).toBe('krillion');
  });

  it('gives a crowd answer Plankton', () => {
    expect(tierFor(2, 2)).toBe('plankton');
  });
});

describe('standings', () => {
  it('totals points over closed rounds, best first, ties broken by name', () => {
    const room = roomWith(3);
    const play = (answers: Record<string, string>, t: number) => {
      openRound(room, 'Name a pest', t);
      for (const [pid, text] of Object.entries(answers)) submitAnswer(room, pid, text, t + 1);
      closeRound(room);
    };
    play({ p1: 'apple', p2: 'apple', p3: 'apple' }, 0); // all 3 agree: Plankton (10) each
    play({ p1: 'pear', p2: 'pear', p3: 'fig' }, 10);    // p1, p2 agree: Plankton (10); p3 alone: Squid (60)

    const s = standings(room);
    expect(s.map((x) => [x.pid, x.total])).toEqual([['p3', 70], ['p1', 20], ['p2', 20]]);
    expect(s[0].best).toBe('squid');
    expect(s[1].best).toBe('plankton');
  });

  it('lists every player at zero before any round closes', () => {
    const s = standings(roomWith(2));
    expect(s.map((x) => x.total)).toEqual([0, 0]);
    expect(s.every((x) => x.best === null)).toBe(true);
  });
});

describe('isGameOver', () => {
  it('ends after totalRounds closed rounds, and not before', () => {
    const room = roomWith(2, 1000);
    expect(room.totalRounds).toBe(ROUNDS_PER_GAME);
    for (let n = 1; n <= ROUNDS_PER_GAME; n++) {
      expect(isGameOver(room)).toBe(false);
      expect(openRound(room, 'Name a pest', n * 10_000)).toBe(true);
      submitAnswer(room, 'p1', `answer ${n}`, n * 10_000 + 1);
      submitAnswer(room, 'p2', `other ${n}`, n * 10_000 + 1);
      closeRound(room);
    }
    expect(room.history).toHaveLength(ROUNDS_PER_GAME);
    expect(isGameOver(room)).toBe(true);
    expect(openRound(room, 'Name a pest', 999_999)).toBe(false);
  });

  it('is false while a round is still open on the last slot', () => {
    const room = roomWith(2, 1000);
    for (let n = 1; n < ROUNDS_PER_GAME; n++) {
      openRound(room, 'Name a pest', n * 10_000);
      closeRound(room);
    }
    openRound(room, 'Name a pest', 500_000);
    expect(isGameOver(room)).toBe(false);
  });
});

describe('PROMPTS', () => {
  it('has at least 100 prompts', () => {
    expect(PROMPTS.length).toBeGreaterThanOrEqual(100);
  });

  it('has no duplicates', () => {
    expect(new Set(PROMPTS).size).toBe(PROMPTS.length);
  });

  it('is all open-ended "Name ..." or "Something you\'d find ..." prompts', () => {
    for (const prompt of PROMPTS) {
      expect(prompt.trim()).toBe(prompt);
      expect(/^(Name |Something you'd find )/.test(prompt)).toBe(true);
    }
  });
});

describe('shufflePromptOrder', () => {
  it('returns every prompt index exactly once', () => {
    const order = shufflePromptOrder(() => 0.42);
    expect(order).toHaveLength(PROMPTS.length);
    expect([...order].sort((a, b) => a - b)).toEqual(PROMPTS.map((_, i) => i));
  });

  it('is deterministic for a fixed rand', () => {
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const a = shufflePromptOrder(rand);
    seed = 7;
    expect(shufflePromptOrder(rand)).toEqual(a);
  });

  it('actually moves things around', () => {
    let seed = 1;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const order = shufflePromptOrder(rand);
    expect(order).not.toEqual(PROMPTS.map((_, i) => i));
  });
});
