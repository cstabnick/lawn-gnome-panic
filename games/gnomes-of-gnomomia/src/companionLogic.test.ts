import { describe, expect, it } from 'vitest';
import { ENEMIES, NPCS, OBJECTS, QUESTS, SPAWNS, ZONES } from './content';
import {
  PERSONALITIES,
  createCompanionRoster,
  nextZoneExit,
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
