import { describe, expect, it, vi } from 'vitest';

vi.mock('../audio', () => ({ play: vi.fn(), setEngine: vi.fn(), setSkid: vi.fn(), unlockAudio: vi.fn() }));
import { TESSIE } from '../config';
import { mergeQuestSaves, isQuestAvailable } from './quests';
import { questById } from './defs';
import { allBeats, beatReached, BEAT_QUESTS, checkUnlock, ensureBeat, rollBeat, tessieUnlocked } from './tessieUnlock';
import { unlockRule } from './unlocks';
import type { QuestSave } from './types';

const first = BEAT_QUESTS[0];
const tableAfter = unlockRule(TESSIE.questId)!.after;

describe('tessie unlock', () => {
  it('beats cover every chapter 1-4 objective and the roll picks one of them', () => {
    const beats = allBeats();
    expect(beats.length).toBe(BEAT_QUESTS.reduce((n, q) => n + q.objectives.length, 0));
    expect(BEAT_QUESTS.every((q) => (q.chapter ?? 1) <= 4)).toBe(true);
    expect(rollBeat(() => 0)).toBe(beats[0]);
    expect(rollBeat(() => 0.999999)).toBe(beats[beats.length - 1]);
  });

  it('a new save rolls no beat; only ?tessie=now (force) rolls one, and only once', () => {
    const saves: Record<string, QuestSave> = {};
    expect(ensureBeat(saves, () => 0.5)).toBe(false);
    saves[first.id] = { state: 'active', step: 0, cracked: [] };
    expect(ensureBeat(saves, () => 0.5)).toBe(false);
    expect(saves[TESSIE.unlockKey]).toBeUndefined();
    expect(ensureBeat(saves, () => 0.5, true)).toBe(true);
    const beat = saves[TESSIE.unlockKey].beat;
    expect(beat).toBeTruthy();
    expect(ensureBeat(saves, () => 0, true)).toBe(false);
    expect(saves[TESSIE.unlockKey].beat).toBe(beat);
  });

  it('a legacy rolled beat still unlocks when its objective is finished', () => {
    const saves: Record<string, QuestSave> = { [first.id]: { state: 'active', step: 0, cracked: [] } };
    ensureBeat(saves, () => 0, true); // beat = first quest, objective 0
    expect(beatReached(saves, `${first.id}#0`)).toBe(false);
    expect(checkUnlock(saves)).toBe(false);
    saves[first.id].step = 1;
    expect(checkUnlock(saves)).toBe(true);
    expect(tessieUnlocked(saves)).toBe(true);
    expect(checkUnlock(saves)).toBe(false);
  });

  it('the table beat unlocks Tessie once its story quest is done', () => {
    const saves: Record<string, QuestSave> = { [tableAfter]: { state: 'active', step: 2, cracked: [] } };
    expect(checkUnlock(saves)).toBe(false);
    expect(tessieUnlocked(saves)).toBe(false);
    saves[tableAfter] = { state: 'done', step: 3, cracked: [] };
    expect(checkUnlock(saves)).toBe(true);
    expect(tessieUnlocked(saves)).toBe(true);
    expect(saves[TESSIE.unlockKey]).toEqual({ state: 'done', step: 0, cracked: [] });
  });

  it('a done unlock stays done and keeps its rolled beat', () => {
    const saves: Record<string, QuestSave> = {
      [TESSIE.unlockKey]: { state: 'done', step: 0, cracked: [], beat: 'a#1' },
    };
    expect(checkUnlock(saves)).toBe(false);
    expect(checkUnlock(saves, true)).toBe(false);
    expect(saves[TESSIE.unlockKey].state).toBe('done');
  });

  it('the quest is offered only after the unlock; ?tessie=now forces it', () => {
    const q = questById(TESSIE.questId)!;
    expect(q).toBeDefined();
    const saves: Record<string, QuestSave> = {};
    expect(isQuestAvailable(q, saves)).toBe(false);
    ensureBeat(saves, Math.random, true);
    expect(checkUnlock(saves, true)).toBe(true);
    expect(isQuestAvailable(q, saves)).toBe(true);
  });

  it('cloud merge keeps the local beat and the unlock', () => {
    const local = JSON.stringify({ [TESSIE.unlockKey]: { state: 'active', step: 0, cracked: [], beat: 'a#1' } });
    const remote = JSON.stringify({ [TESSIE.unlockKey]: { state: 'done', step: 0, cracked: [], beat: 'b#2' } });
    const out = JSON.parse(mergeQuestSaves(local, remote));
    expect(out[TESSIE.unlockKey]).toEqual({ state: 'done', step: 0, cracked: [], beat: 'a#1' });
    const onlyRemote = JSON.parse(mergeQuestSaves(JSON.stringify({ [TESSIE.unlockKey]: { state: 'active', step: 0, cracked: [] } }), remote));
    expect(onlyRemote[TESSIE.unlockKey].beat).toBe('b#2');
  });
});
