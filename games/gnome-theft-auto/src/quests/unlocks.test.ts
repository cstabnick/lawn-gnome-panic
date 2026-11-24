import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../audio', () => ({ play: vi.fn(), setEngine: vi.fn(), setSkid: vi.fn(), unlockAudio: vi.fn() }));
import { TESSIE } from '../config';
import { GIVERS, QUESTS, questById } from './defs';
import { SIDE_QUESTS } from './sideQuests';
import { OUTSKIRTS_QUESTS } from './outskirtsQuests';
import { CITY_QUESTS } from './cityQuests';
import { NEWCOMER_QUESTS } from './newcomerQuests';
import { RACE_QUESTS } from './races';
import { createQuests, isQuestAvailable, SAVE_KEY } from './quests';
import { MAIN_COLOR, SIDE_UNLOCKS, sideColor, unlockMet, unlockRule } from './unlocks';
import type { GiverDef, QuestDef, QuestDeps, QuestSave } from './types';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
  };
}

describe('side unlock table', () => {
  it('lists every side quest, the city contracts, the Tessie quest, the Speedway races and the Pebblewick quests exactly once', () => {
    const ids = SIDE_UNLOCKS.map((u) => u.questId);
    for (const id of [
      ...SIDE_QUESTS.map((q) => q.id),
      ...CITY_QUESTS.map((q) => q.id),
      TESSIE.questId,
      ...RACE_QUESTS.map((q) => q.id),
      ...OUTSKIRTS_QUESTS.map((q) => q.id),
      ...NEWCOMER_QUESTS.map((q) => q.id),
    ]) {
      expect(ids.filter((x) => x === id).length, id).toBe(1);
    }
    expect(ids.length).toBe(SIDE_QUESTS.length + CITY_QUESTS.length + 1 + RACE_QUESTS.length + OUTSKIRTS_QUESTS.length + NEWCOMER_QUESTS.length);
  });

  it('every beat is a chapter quest, no beat opens more than 2 side quests, and 8 or more beats are used', () => {
    // The Newcomers' Card tutorials (nc-*) are short teaching jobs: counted on their own, at most 2 per beat too.
    const counts = new Map<string, number>();
    const tutorials = new Map<string, number>();
    for (const u of SIDE_UNLOCKS) {
      const after = QUESTS.find((q) => q.id === u.after);
      expect(after?.chapter, u.after).toBeDefined();
      const m = u.questId.startsWith('nc-') ? tutorials : counts;
      m.set(u.after, (m.get(u.after) ?? 0) + 1);
    }
    for (const n of counts.values()) expect(n).toBeLessThanOrEqual(2);
    for (const n of tutorials.values()) expect(n).toBeLessThanOrEqual(2);
    expect(counts.size).toBeGreaterThanOrEqual(8);
  });

  it('a fresh save offers no side quest and no Tessie quest, but the first story quests', () => {
    const saves: Record<string, QuestSave> = {};
    for (const q of [...SIDE_QUESTS, questById(TESSIE.questId)!]) {
      expect(isQuestAvailable(q, saves), q.id).toBe(false);
    }
    expect(isQuestAvailable(questById('prologue-fresh-kiln')!, saves)).toBe(true);
    expect(isQuestAvailable(questById('first-contract')!, saves)).toBe(true);
  });

  it('unlockMet follows the story beat, keeps started quests open, and Tessie uses its own entry', () => {
    const rule = unlockRule('sq-grid-truthers')!;
    expect(unlockMet('sq-grid-truthers', {})).toBe(false);
    expect(unlockMet('sq-grid-truthers', { [rule.after]: { state: 'done', step: 1, cracked: [] } })).toBe(true);
    expect(unlockMet('sq-grid-truthers', { 'sq-grid-truthers': { state: 'active', step: 0, cracked: [] } })).toBe(true);
    const tessie = unlockRule(TESSIE.questId)!;
    expect(unlockMet(TESSIE.questId, { [tessie.after]: { state: 'active', step: 0, cracked: [] } })).toBe(false);
    expect(unlockMet(TESSIE.questId, { [TESSIE.unlockKey]: { state: 'done', step: 0, cracked: [] } })).toBe(true);
  });
});

describe('side unlock engine', () => {
  const pipQ: QuestDef = {
    id: 'prologue-fresh-kiln',
    title: 'Pip Test',
    giver: 'pip',
    chapter: 1,
    doneText: 'done',
    objectives: [{ kind: 'visit', text: 'Go to Pip', at: [10, 0], radius: 3, hint: 'East' }],
  };
  const gridQ: QuestDef = {
    id: 'sq-grid-truthers',
    title: 'Grid Truthers',
    giver: 'strangers',
    doneText: 'done',
    objectives: [{ kind: 'visit', text: 'Go west', at: [-10, 0], radius: 3, hint: 'West' }],
  };
  const givers: Record<string, GiverDef> = {
    pip: { id: 'pip', name: 'Pip Shed', label: 'Talk to Pip', x: 0, z: 0, exit: { x: 2, z: 0, yaw: 0 }, room: 'street' },
    strangers: { id: 'strangers', name: 'Strangers Stoop', label: 'Talk', x: 30, z: 0, exit: { x: 32, z: 0, yaw: 0 }, room: 'street' },
  };

  let storage: ReturnType<typeof memoryStorage>;
  beforeEach(() => {
    storage = memoryStorage();
    vi.stubGlobal('localStorage', storage);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function makeDeps(onSideUnlock: QuestDeps['onSideUnlock']): QuestDeps {
    return {
      scene: new THREE.Scene(),
      world: { walkPoints: [{ x: 0, z: 0 }] } as QuestDeps['world'],
      npcs: { list: [], spawnNamed: vi.fn(), scare: vi.fn() } as unknown as QuestDeps['npcs'],
      hud: { setWorld: vi.fn(), set: vi.fn(), toast: vi.fn(), banner: vi.fn(), setObjective: vi.fn(), setVisible: vi.fn() },
      cutscene: { active: false, play: (_req, onDone) => onDone(), update: vi.fn(), skip: vi.fn() },
      placePlayer: vi.fn(),
      unlock: vi.fn(),
      play: vi.fn(),
      onSideUnlock,
    };
  }

  it('offers the side job after its beat, notices it once, and pins its giver as the waypoint', () => {
    const onSideUnlock = vi.fn();
    const engine = createQuests(makeDeps(onSideUnlock), [pipQ, gridQ], givers);
    const questBlips = () => engine.blips().filter((b) => b.quest);

    expect(questBlips().length).toBe(1);
    expect(questBlips()[0].kind).toBe('main');
    expect(questBlips()[0].color).toBe(MAIN_COLOR);
    expect(engine.blips().some((b) => b.x === 30)).toBe(false);

    expect(engine.interact(0, 0)).toBe(true);
    engine.update(0.1, 10, 0); // visit reached: the story quest is done
    expect(onSideUnlock).not.toHaveBeenCalled();
    engine.update(5, 10, 0);
    engine.update(5, 10, 0);
    expect(onSideUnlock).toHaveBeenCalledTimes(1);
    expect(onSideUnlock.mock.calls[0][0]).toBe(gridQ);

    const side = questBlips().find((b) => b.kind === 'side');
    expect(side?.color).toBe(sideColor('strangers'));
    expect(side?.x).toBe(30);

    engine.pinGiver('strangers');
    const wp = engine.waypoint();
    expect(wp && [wp.x, wp.z]).toEqual([30, 0]);
    expect(wp?.label).toBe('Strangers Stoop');
    expect(engine.getJournal().pinned).toBe('strangers');
    engine.pinGiver(null);
    expect(engine.waypoint()).toBeNull();
  });

  it('an unlock already open at load is not announced', () => {
    storage.setItem(SAVE_KEY, JSON.stringify({ 'prologue-fresh-kiln': { state: 'done', step: 1, cracked: [] } }));
    const onSideUnlock = vi.fn();
    const engine = createQuests(makeDeps(onSideUnlock), [pipQ, gridQ], givers);
    engine.update(5, 0, 0);
    expect(onSideUnlock).not.toHaveBeenCalled();
    expect(engine.blips().some((b) => b.kind === 'side')).toBe(true);
  });

  it('the real defs give every side quest a giver with a colour', () => {
    for (const q of SIDE_QUESTS) expect(GIVERS[q.giver], q.id).toBeDefined();
    expect(sideColor('strangers')).toBe('#3ad1c4');
  });
});
