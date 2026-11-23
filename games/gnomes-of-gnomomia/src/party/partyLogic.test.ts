import { describe, expect, it } from 'vitest';
import { enemyGoldRange } from '../economy';
import {
  PARTY,
  PARTY_LINES,
  helperLevel,
  helperReplyKind,
  helpersToDismiss,
  killShare,
  nextLeader,
  pickAssistTarget,
  rollPersonalLoot,
  followSlot,
  wouldJoin,
  type AssistCandidate,
} from './partyLogic';

describe('killShare', () => {
  it('matches the worked examples', () => {
    expect(killShare(1, 0)).toBe(1);
    expect(killShare(2, 0)).toBeCloseTo(0.65, 6);
    expect(killShare(1, 1)).toBeCloseTo(0.8, 6);
    expect(killShare(1, 3)).toBeCloseTo(0.5714, 3);
    expect(killShare(4, 0)).toBeCloseTo(0.475, 6);
    expect(killShare(0, 0)).toBe(1);
  });
});

describe('helperLevel', () => {
  it('is one below the player, at least 1', () => {
    expect(helperLevel(1)).toBe(1);
    expect(helperLevel(10)).toBe(9);
  });
});

describe('wouldJoin', () => {
  it('tryhards refuse a gnome more than one level below them', () => {
    const rng = () => 0.5;
    expect(wouldJoin('tryhard', 10, 8, rng)).toBe(false);
    expect(wouldJoin('tryhard', 10, 9, rng)).toBe(true);
  });

  it('loot goblins say yes 80% of the time', () => {
    expect(wouldJoin('lootgoblin', 5, 5, () => 0.9)).toBe(false);
    expect(wouldJoin('lootgoblin', 5, 5, () => 0.1)).toBe(true);
  });

  it('helpers always join', () => {
    expect(wouldJoin('helper', 50, 1, () => 0.99)).toBe(true);
  });
});

describe('followSlot', () => {
  it('stands PARTY.followDist behind the player when facing 0', () => {
    const s = followSlot(0, 0, 0, 0);
    expect(s.x).toBeCloseTo(0, 6);
    expect(s.z).toBeCloseTo(-2.6, 6);
  });

  it('fans helpers 1 and 2 out as mirror images in x', () => {
    const a = followSlot(0, 0, 0, 1);
    const b = followSlot(0, 0, 0, 2);
    expect(a.x).toBeCloseTo(-b.x, 6);
    expect(a.z).toBeCloseTo(b.z, 6);
  });
});

describe('pickAssistTarget', () => {
  const enemy = (id: number, x: number, z: number, extra: Partial<AssistCandidate> = {}): AssistCandidate =>
    ({ id, x, z, dead: false, inCombat: false, enemy: true, ...extra });

  it('prefers the player target when it is in range', () => {
    const cands = [enemy(1, 2, 0, { inCombat: true }), enemy(2, 5, 0)];
    expect(pickAssistTarget(0, 0, 2, cands)).toBe(2);
  });

  it('falls back to the nearest in-combat enemy', () => {
    const cands = [enemy(1, 8, 0, { inCombat: true }), enemy(2, 3, 0, { inCombat: true })];
    expect(pickAssistTarget(0, 0, null, cands)).toBe(2);
  });

  it('ignores dead, non-enemy, not-in-combat and far enemies', () => {
    const cands: AssistCandidate[] = [
      enemy(1, 1, 0, { inCombat: true, dead: true }),
      enemy(2, 1, 0, { inCombat: true, enemy: false }),
      enemy(3, 1, 0, { inCombat: false }),
      enemy(4, 50, 0, { inCombat: true }),
    ];
    expect(pickAssistTarget(0, 0, null, cands)).toBeNull();
    expect(pickAssistTarget(0, 0, null, [])).toBeNull();
  });

  it('uses PARTY.assistRadius by default', () => {
    expect(pickAssistTarget(0, 0, null, [enemy(1, PARTY.assistRadius - 1, 0, { inCombat: true })])).toBe(1);
    expect(pickAssistTarget(0, 0, null, [enemy(1, PARTY.assistRadius + 1, 0, { inCombat: true })])).toBeNull();
  });
});

describe('rollPersonalLoot', () => {
  it('drops every drop with chance > 0 at rng 0 and halves gold', () => {
    const def = {
      level: 1,
      gold: [10, 20] as const,
      loot: [
        { item: 'a', chance: 0.5 },
        { item: 'b', chance: 0, count: 3 },
        { item: 'c', chance: 1, count: 2 },
      ],
    };
    const r = rollPersonalLoot(def, 0.5, () => 0);
    expect(r.items).toEqual([
      { item: 'a', count: 1 },
      { item: 'c', count: 2 },
    ]);
    const [lo] = enemyGoldRange(def);
    expect(r.gold).toBe(Math.round(lo * 0.5));
  });
});

describe('nextLeader', () => {
  it('picks the lowest remaining id, or null below two members', () => {
    expect(nextLeader([3, 5, 9], 3)).toBe(5);
    expect(nextLeader([3, 5], 3)).toBeNull();
  });
});

describe('helpersToDismiss', () => {
  it('keeps the party size rule', () => {
    expect(helpersToDismiss(1, [4, 2, 5], true)).toEqual([]);
    expect(helpersToDismiss(2, [4, 2, 5], true)).toEqual([5]);
    expect(helpersToDismiss(3, [4, 2, 5], true)).toEqual([2, 5]);
    expect(helpersToDismiss(2, [4, 2], false)).toEqual([4, 2]);
  });
});

describe('helperReplyKind', () => {
  it('classifies party chat lines', () => {
    expect(helperReplyKind('follow me')).toBe('follow');
    expect(helperReplyKind('Help!')).toBe('help');
    expect(helperReplyKind('gg')).toBe('thanks');
    expect(helperReplyKind('hello')).toBeNull();
  });
});

describe('PARTY_LINES', () => {
  it('has a non-empty list for every personality and kind', () => {
    for (const lines of Object.values(PARTY_LINES)) {
      for (const list of Object.values(lines)) expect(list.length).toBeGreaterThan(0);
    }
  });
});
