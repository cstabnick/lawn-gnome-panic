import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../audio', () => ({ play: vi.fn(), setEngine: vi.fn(), setSkid: vi.fn(), unlockAudio: vi.fn() }));
import { TESSIE } from '../config';
import { GIVERS, QUESTS, questById } from './defs';
import { SIDE_QUESTS } from './sideQuests';
import { WINTER_QUESTS } from './winterQuests';
import { GOLF_QUESTS } from './golfQuests';
import { SPORTS_QUESTS } from './sportsQuests';
import { ROOTWELL_QUESTS_DEFS } from './rootwellQuests';
import { COUNTRY_QUESTS_DEFS } from './countryQuests';
import { LOAMDEEP_QUESTS } from './loamdeepQuests';
import { SOCIETY_QUEST_DEFS } from './societyQuests';
import { OUTSKIRTS_QUESTS } from './outskirtsQuests';
import { CITY_QUESTS } from './cityQuests';
import { NEWCOMER_QUESTS } from './newcomerQuests';
import { COAST_QUEST_DEFS } from './coastQuests';
import { RACE_QUESTS } from './races';
import { DIRT_QUESTS } from './dirtRaces';
import { STREET_QUESTS } from './streetRaces';
import { DEWDROP_QUESTS } from './dewdropQuests';
import { GLAZE_QUESTS } from './glazeQuests';
import { beatsDone, sidePacing } from './pacing';
import { OFFER_WINDOW, STORY_ROWS, offerCap } from './storyRows';
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
      ...DIRT_QUESTS.map((q) => q.id),
      ...STREET_QUESTS.map((q) => q.id),
      ...OUTSKIRTS_QUESTS.map((q) => q.id),
      ...NEWCOMER_QUESTS.map((q) => q.id),
      ...COAST_QUEST_DEFS.map((q) => q.id),
      ...WINTER_QUESTS.map((q) => q.id),
      ...GOLF_QUESTS.map((q) => q.id),
      ...SPORTS_QUESTS.map((q) => q.id),
      ...ROOTWELL_QUESTS_DEFS.map((q) => q.id),
      ...COUNTRY_QUESTS_DEFS.map((q) => q.id),
      ...LOAMDEEP_QUESTS.map((q) => q.id),
      ...SOCIETY_QUEST_DEFS.map((q) => q.id),
      ...DEWDROP_QUESTS.map((q) => q.id),
      ...GLAZE_QUESTS.map((q) => q.id),
    ]) {
      expect(ids.filter((x) => x === id).length, id).toBe(1);
    }
    expect(ids.length).toBe(SIDE_QUESTS.length + CITY_QUESTS.length + 1 + RACE_QUESTS.length + DIRT_QUESTS.length + STREET_QUESTS.length + OUTSKIRTS_QUESTS.length + NEWCOMER_QUESTS.length + COAST_QUEST_DEFS.length + WINTER_QUESTS.length + GOLF_QUESTS.length + ROOTWELL_QUESTS_DEFS.length + COUNTRY_QUESTS_DEFS.length + SPORTS_QUESTS.length + LOAMDEEP_QUESTS.length + SOCIETY_QUEST_DEFS.length + DEWDROP_QUESTS.length + GLAZE_QUESTS.length);
  });

  it('every beat is a built main quest with a spine row; every planned beat is a spine row not built yet', () => {
    // When E20-E22 build a planned row, this fails until the unlock's `after` is moved onto it (then drop `planned`).
    for (const u of SIDE_UNLOCKS) {
      const after = QUESTS.find((q) => q.id === u.after);
      expect(after?.chapter, u.after).toBeDefined();
      expect(STORY_ROWS[u.after], `${u.after} has a spine row`).toBeDefined();
      if (u.planned) {
        expect(STORY_ROWS[u.planned], `${u.questId} planned ${u.planned}`).toBeDefined();
        expect(questById(u.planned), `${u.planned} is built: move ${u.questId} onto it`).toBeUndefined();
      }
    }
    for (const q of QUESTS) if (q.chapter !== undefined) expect(STORY_ROWS[q.id], `${q.id} is in storyRows.ts`).toBeDefined();
  });

  it('chains have no cycle and a follow-up never unlocks before the quest it needs', () => {
    const side = new Set(SIDE_UNLOCKS.map((u) => u.questId));
    for (const u of SIDE_UNLOCKS) {
      const seen = new Set<string>();
      let q = questById(u.questId);
      while (q?.prereq && side.has(q.prereq)) {
        expect(seen.has(q.id), `cycle at ${q.id}`).toBe(false);
        seen.add(q.id);
        const pre = unlockRule(q.prereq)!;
        expect(STORY_ROWS[unlockRule(q.id)!.after], `${q.id} after ${q.prereq}`).toBeGreaterThanOrEqual(STORY_ROWS[pre.after]);
        q = questById(q.prereq);
      }
    }
  });

  it('a player who plays the story and no side quests is never offered more than the act cap', () => {
    const mains = QUESTS.filter((q) => q.chapter !== undefined).sort((a, b) => STORY_ROWS[a.id] - STORY_ROWS[b.id]);
    const saves: Record<string, QuestSave> = {};
    const everOffered = new Set<string>();
    for (const m of mains) {
      saves[m.id] = { state: 'done', step: 0, cracked: [] };
      const p = sidePacing(saves, QUESTS);
      expect(p.offered.length, `after ${m.id}`).toBeLessThanOrEqual(offerCap(STORY_ROWS[m.id]));
      expect(p.cap).toBe(offerCap(STORY_ROWS[m.id]));
      for (const id of p.offered) everOffered.add(id);
      // Nothing is both offered and shelved.
      expect(new Set([...p.offered, ...p.later]).size).toBe(p.offered.length + p.later.length);
    }
    // Nothing is lost: at the end every root side quest is offered or on the Later shelf, and a good share of them were
    // offered at some point (the rest are taken from the shelf; taking quests frees slots for the queue).
    const side = new Set(SIDE_UNLOCKS.map((u) => u.questId));
    const roots = SIDE_UNLOCKS.filter((u) => { const pre = questById(u.questId)?.prereq; return !pre || !side.has(pre); });
    const end = sidePacing(saves, QUESTS);
    // (Tessie's prereq is its unlock pseudo-entry, which the engine sets when the beat is done: not set in this pure run.)
    for (const r of roots.filter((u) => u.questId !== TESSIE.questId)) expect([...end.offered, ...end.later], r.questId).toContain(r.questId);
    expect(everOffered.size).toBeGreaterThanOrEqual(18);
  });

  it('a save far into the story sees a short offer list and the rest on the Later shelf', () => {
    const saves: Record<string, QuestSave> = {};
    for (const q of QUESTS) if (q.chapter !== undefined && STORY_ROWS[q.id] <= 23) saves[q.id] = { state: 'done', step: 0, cracked: [] };
    const p = sidePacing(saves, QUESTS);
    expect(p.row).toBe(23);
    expect(p.offered.length).toBeLessThanOrEqual(4);
    expect(p.later.length).toBeGreaterThan(5);
    // The oldest act-I quests are shelved, not offered.
    expect(p.offered).not.toContain('sq-grid-truthers');
    expect(p.later).toContain('sq-grid-truthers');
  });

  it('taking a side quest frees its slot, and a chain follow-up is offered for OFFER_WINDOW beats from its prereq', () => {
    const done = (doneAt?: number): QuestSave => ({ state: 'done', step: 0, cracked: [], ...(doneAt !== undefined ? { doneAt } : {}) });
    const saves: Record<string, QuestSave> = {};
    for (const q of QUESTS) if (q.chapter !== undefined && STORY_ROWS[q.id] <= 1) saves[q.id] = done();
    expect(sidePacing(saves, QUESTS).offered).toContain('sq-grid-truthers');
    saves['sq-grid-truthers'] = { state: 'active', step: 0, cracked: [] };
    expect(sidePacing(saves, QUESTS).offered).not.toContain('sq-grid-truthers');

    // The Fizz Cup: rookie done (at the beat count it was finished), derby unlocked -> offered first, then shelved.
    const story: Record<string, QuestSave> = {};
    const mains = QUESTS.filter((q) => q.chapter !== undefined).sort((a, b) => STORY_ROWS[a.id] - STORY_ROWS[b.id]);
    for (const m of mains) if (STORY_ROWS[m.id] <= STORY_ROWS[unlockRule('race-lowrider-derby')!.after]) story[m.id] = done();
    story['race-rookie-mowdown'] = done(beatsDone(story, QUESTS));
    expect(sidePacing(story, QUESTS).offered[0]).toBe('race-lowrider-derby');
    for (const m of mains.filter((q) => !story[q.id]).slice(0, OFFER_WINDOW)) story[m.id] = done();
    const p = sidePacing(story, QUESTS);
    expect(p.offered).not.toContain('race-lowrider-derby');
    expect(p.later).toContain('race-lowrider-derby');
  });

  it('a fresh save offers no side quest and no Tessie quest, but the first story quests', () => {
    const saves: Record<string, QuestSave> = {};
    for (const q of [...SIDE_QUESTS, questById(TESSIE.questId)!]) {
      expect(isQuestAvailable(q, saves), q.id).toBe(false);
    }
    expect(isQuestAvailable(questById('prologue-fresh-kiln')!, saves)).toBe(true);
    expect(isQuestAvailable(questById('first-contract')!, saves)).toBe(false); // E20: after A Roof on Credit (row 2)
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

  it('marks the offered side giver and records doneAt when the story quest finishes', () => {
    const engine = createQuests(makeDeps(vi.fn()), [pipQ, gridQ], givers);
    expect(engine.interact(0, 0)).toBe(true);
    engine.update(0.1, 10, 0);
    const side = engine.blips().find((b) => b.x === 30);
    expect(side?.kind).toBe('side');
    const saved = JSON.parse(storage.getItem(SAVE_KEY) as string) as Record<string, { doneAt?: number }>;
    expect(saved['prologue-fresh-kiln'].doneAt).toBe(1);
  });

  it('the real defs give every side quest a giver with a colour', () => {
    for (const q of SIDE_QUESTS) expect(GIVERS[q.giver], q.id).toBeDefined();
    expect(sideColor('strangers')).toBe('#3ad1c4');
  });
});
