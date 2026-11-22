import { describe, expect, it } from 'vitest';
import { ENEMIES, NPCS, OBJECTS, QUESTS, SPAWNS, ZONES } from './content';
import {
  PERSONALITIES,
  STROLL_MIN_DIST,
  TOWN_STROLLERS,
  createCompanionRoster,
  nextStrollWaypoint,
  nextZoneExit,
  pickTownStrollers,
  resolveStageTarget,
  selectQuestPools,
} from './companionLogic';
import type { QuestProgress } from './state';

describe('companionLogic', () => {
  it('creates a roster with distinct personalities and wire-safe unique names', () => {
    const roster = createCompanionRoster(6, () => 0.25);
    expect(roster).toHaveLength(6);

    const names = new Set(roster.map((r) => r.name));
    expect(names.size).toBe(6);
    for (const r of roster) {
      expect(r.name.length).toBeGreaterThan(0);
      expect(r.name.length).toBeLessThanOrEqual(24);
      expect(PERSONALITIES[r.personality.id].names).toContain(r.name);
    }

    const personalities = new Set(roster.map((r) => r.personality.id));
    expect(personalities.size).toBe(5);
  });

  it('selects active quests for current pool and recent completed quests for prior pool', () => {
    const playerQuests: Record<string, QuestProgress> = {
      'slime-time': { stage: 2, count: 0, done: true },
      'feral-trouble': { stage: 2, count: 0, done: true },
      shells: { stage: 2, count: 0, done: true },
      'mole-king': { stage: 2, count: 0, done: true },
      'mb-trowel-like-yours': { stage: 2, count: 0, done: true },
      'mb-what-moles-know': { stage: 1, count: 0, done: false },
    };

    const pools = selectQuestPools(QUESTS, playerQuests, 'thatchford', 7, 4);
    expect(pools.current).toEqual(['mb-what-moles-know']);
    expect(pools.prior).toHaveLength(4);
    // Most recent completed quests come first.
    expect(pools.prior[0]).toBe('mb-trowel-like-yours');
    expect(pools.prior).toContain('mole-king');
    expect(pools.prior).not.toContain('mb-what-moles-know');
  });

  it('falls back to local zone quests when the player has no active or completed quests', () => {
    const pools = selectQuestPools(QUESTS, {}, 'mossbottom', 1, 4);
    expect(pools.current.length).toBeGreaterThan(0);
    for (const id of pools.current) {
      expect(QUESTS[id].zone).toBe('mossbottom');
    }
    expect(pools.prior.length).toBeGreaterThan(0);
  });

  it('resolves kill, collect, talk, and interact stages from live game content', () => {
    const tables = { quests: QUESTS, npcs: NPCS, objects: OBJECTS, spawns: SPAWNS, enemies: ENEMIES };

    const collectTarget = resolveStageTarget('slime-time', 0, tables);
    expect(collectTarget).not.toBeNull();
    expect(collectTarget?.kind).toBe('enemy');
    expect(collectTarget?.zone).toBe('mossbottom');

    const talkTarget = resolveStageTarget('slime-time', 1, tables);
    expect(talkTarget).not.toBeNull();
    expect(talkTarget?.kind).toBe('npc');
    expect(talkTarget?.npcId).toBe('fernwick');

    const killTarget = resolveStageTarget('feral-trouble', 0, tables);
    expect(killTarget).not.toBeNull();
    expect(killTarget?.kind).toBe('enemy');
    expect(killTarget?.enemyId).toBe('feral-gnome');

    const interactTarget = resolveStageTarget('mb-trowel-like-yours', 0, tables);
    expect(interactTarget).not.toBeNull();
    expect(interactTarget?.kind).toBe('object');
    expect(interactTarget?.objectId).toBe('mb-moss-statue');
  });

  it('routes between outdoor zones via zone exits', () => {
    const step1 = nextZoneExit('mossbottom', 'keep', ZONES);
    expect(step1?.to).toBe('thatchford');

    const stepBack = nextZoneExit('thatchford', 'mossbottom', ZONES);
    expect(stepBack?.to).toBe('mossbottom');

    expect(nextZoneExit('mossbottom', 'mossbottom', ZONES)).toBeNull();
  });
});

/** Small deterministic rng (mulberry32). */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('town strollers', () => {
  it('picks TOWN_STROLLERS companions, preferring the prior role', () => {
    const roles = ['current', 'current', 'current', 'prior', 'prior', 'prior'] as const;
    const picked = pickTownStrollers(roles);
    expect(TOWN_STROLLERS).toBe(2);
    expect(picked).toEqual([3, 4]);
  });

  it('falls back to current companions and handles fewer companions', () => {
    expect(pickTownStrollers(['current', 'prior', 'current'])).toEqual([1, 0]);
    expect(pickTownStrollers(['current'])).toEqual([0]);
    expect(pickTownStrollers([])).toEqual([]);
    expect(pickTownStrollers(['prior', 'prior', 'prior'], 3)).toEqual([0, 1, 2]);
  });
});

describe('nextStrollWaypoint', () => {
  const wps = [
    { id: 'a', x: 0, z: 0 },
    { id: 'b', x: 3, z: 0 },
    { id: 'c', x: 10, z: 0 },
    { id: 'd', x: 0, z: 12 },
    { id: 'e', x: -20, z: 5 },
  ];

  it('returns null when the town has no waypoints', () => {
    expect(nextStrollWaypoint([], 0, 0, [], Math.random)).toBeNull();
  });

  it('never picks a waypoint closer than the minimum distance when a farther one exists', () => {
    const rng = seeded(7);
    for (let i = 0; i < 200; i++) {
      const w = nextStrollWaypoint(wps, 0, 0, [], rng)!;
      expect(Math.hypot(w.x, w.z)).toBeGreaterThanOrEqual(STROLL_MIN_DIST);
    }
  });

  it('avoids recently visited ids', () => {
    const rng = seeded(11);
    for (let i = 0; i < 200; i++) {
      expect(nextStrollWaypoint(wps, 0, 0, ['c', 'd'], rng)!.id).toBe('e');
    }
  });

  it('is deterministic with a seeded rng', () => {
    const run = (): string[] => {
      const rng = seeded(42);
      return Array.from({ length: 20 }, () => nextStrollWaypoint(wps, 0, 0, [], rng)!.id);
    };
    expect(run()).toEqual(run());
  });

  it('still returns something when every waypoint is near or recent', () => {
    expect(nextStrollWaypoint(wps.slice(0, 2), 0, 0, ['a', 'b'], () => 0)).not.toBeNull();
  });
});
