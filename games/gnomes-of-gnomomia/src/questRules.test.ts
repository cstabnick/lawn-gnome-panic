import { describe, expect, it } from 'vitest';
import { NPCS, QUESTS } from './content';
import type { QuestDef } from './config';
import { companionMayTake, defendWaveTotal, encounterKey, type DefendObjective } from './questRules';

function syntheticQuest(extra: Partial<QuestDef> = {}, stages: QuestDef['stages'] = [
  { text: 'Kill one water beetle.', objective: { type: 'kill', enemy: 'water-beetle', count: 1 } },
]): QuestDef {
  return {
    id: 'test-synthetic', name: 'Test', giver: 'burlap', zone: 'thatchford', level: 1, tier: 'side',
    stages, reward: { gold: 0, items: [] }, ...extra,
  };
}

describe('questRules', () => {
  it('companionMayTake is false for the Calling trials and the calling quest, true for the tremor tally', () => {
    for (const id of ['c2-trial-warden', 'c2-trial-slinger', 'c2-trial-mage', 'c2-calling']) {
      expect(companionMayTake(QUESTS[id], NPCS), id).toBe(false);
    }
    expect(companionMayTake(QUESTS['c2-tremor-tally'], NPCS)).toBe(true);
  });

  it('companionMayTake respects solo, and rejects escort stages', () => {
    expect(companionMayTake(syntheticQuest(), NPCS)).toBe(true);
    expect(companionMayTake(syntheticQuest({ solo: true }), NPCS)).toBe(false);
    const escort = syntheticQuest({}, [
      { text: 'Walk them home.', objective: { type: 'escort', npc: 'burlap', zone: 'thatchford', x: 0, z: 0, r: 3 } },
    ]);
    expect(companionMayTake(escort, NPCS)).toBe(false);
  });

  it('encounterKey tags a quest stage', () => {
    expect(encounterKey('c2-trial-warden', 0)).toBe('c2-trial-warden#0');
  });

  it('defendWaveTotal sums the waves of the Warden defend stage', () => {
    const o = QUESTS['c2-trial-warden'].stages[0].objective as DefendObjective;
    expect(o.type).toBe('defend');
    const expected = o.waves.reduce((n, w) => n + w.count, 0);
    expect(defendWaveTotal(o)).toBe(expected);
  });
});
