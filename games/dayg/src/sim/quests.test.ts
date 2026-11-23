// Quest and notice-board tests (roadmap 7.3). Faction membership is read through the factions module; these tests mock its
// lookups to read the test's own groups, so the quest rules are checked without depending on the factions implementation.
import { describe, it, expect, vi } from 'vitest';
import type { DailyRow, Faction, FactionId, Group, Npc, PlayerRecord, RegionId, Resource, WorldState } from './types';
import { RESOURCES } from './types';
import { createRng } from './rng';
import type { NewQuest } from './quests';
import { completeQuest, deliver, questDaily, questTitle, stepQuests, takeQuest, postQuest, questsOn, questsNear } from './quests';
import { acornTotal, createWorld, hashWorld, runDays } from './world';

vi.mock('./factions', async (importOriginal) => {
  const real = await importOriginal<typeof import('./factions')>();
  return {
    ...real,
    membersOf: (w: WorldState, f: Faction): number[] =>
      w.groups.filter((g) => w.groupFaction[String(g.id)] === f.id).flatMap((g) => g.members),
    factionOf: (w: WorldState, npc: Npc): Faction | null => {
      if (npc.groupId === null) return null;
      const id = w.groupFaction[String(npc.groupId)];
      return id === undefined ? null : (w.factions[id] ?? null);
    },
    havenHolder: (w: WorldState, h: string): FactionId | null =>
      w.factions.find((f) => f.diedTick === null && f.havens.includes(h as never))?.id ?? null,
    powerOf: (_w: WorldState, f: Faction): number => f.power,
    promoteRanks: (): null => null,
  };
});

const zeroStock = (): Record<Resource, number> => Object.fromEntries(RESOURCES.map((r) => [r, 0])) as Record<Resource, number>;

function setup(seed = 3): WorldState {
  return createWorld(seed).world;
}

function addFaction(w: WorldState, id: number, home: RegionId, over: Partial<Faction> = {}): Faction {
  const f: Faction = {
    id, name: `Faction ${id}`, founder: null, hat: 0, home, leader: 0, groups: [],
    norms: { sharing: 'own', strangers: 'question', bitten: 'nurse', leadership: 'council', violence: 'never-first' },
    power: 10, morale: 0.5, stock: zeroStock(), acorns: 50, havens: [], territory: [], allies: [], enemies: [],
    plan: 'hold', planTarget: null, planSince: 0, formedTick: 0, diedTick: null, ranks: {}, done: {}, leaders: [],
    ...over,
  };
  w.factions[id] = f;
  return f;
}

function addGroup(w: WorldState, f: Faction, members: Npc[]): Group {
  const id = w.nextId.group++;
  const g: Group = { id, name: f.name, members: members.map((n) => n.id), leader: members[0].id, region: members[0].region, formedTick: 0 };
  w.groups.push(g);
  w.groupFaction[String(id)] = f.id;
  for (const n of members) n.groupId = id;
  return g;
}

function addPlayer(w: WorldState, key: string, region: RegionId): PlayerRecord {
  const p: PlayerRecord = {
    key, name: 'Tester', look: '', userId: null, region, online: true, joinedTick: 0, lastTick: 0, acorns: 0, faction: null,
    notoriety: 0, quests: [], done: 0, failed: 0, deaths: 0, skills: {}, bed: null,
  };
  w.players[key] = p;
  return p;
}

function newQuest(over: Partial<NewQuest> & Pick<NewQuest, 'goal' | 'region'>): NewQuest {
  return {
    template: 'supply-run', title: 'test', poster: 'f:0', board: null, reward: { acorns: 10, items: [], trust: 0.1 },
    postedTick: 0, deadline: 1000, rival: null, ...over,
  };
}

describe('quest postings', () => {
  it('posts a supply-run when the market food stock is low, landing on the Tap board', () => {
    const w = setup();
    w.market.stock.food = 0;
    addFaction(w, 0, 'the-tap', { havens: ['tap'] });
    stepQuests(w, createRng(1));
    const q = w.quests.find((x) => x.template === 'supply-run');
    expect(q).toBeDefined();
    expect(q?.goal).toMatchObject({ kind: 'deliver', resource: 'food', to: 'the-tap' });
    expect(q?.board).toBe('board:the-tap');
    expect(q?.state).toBe('offered');
  });

  it('lands an easy quest near the gate on the newcomer board', () => {
    const w = setup();
    w.market.stock.food = 1000;
    addFaction(w, 0, 'forecourt');
    stepQuests(w, createRng(1));
    const q = w.quests.find((x) => x.template === 'supply-run' && x.region === 'forecourt');
    expect(q).toBeDefined();
    expect(q?.board).toBe('board:gate-roof');
  });
});

describe('take, deliver, complete', () => {
  it('pays acorns from the faction and leaves the acorn total unchanged', () => {
    const w = setup();
    addFaction(w, 0, 'the-tap', { havens: ['tap'], acorns: 50 });
    addPlayer(w, 'p1', 'the-tap');
    const id = postQuest(w, newQuest({ region: 'the-tap', goal: { kind: 'deliver', resource: 'food', count: 2, to: 'the-tap' } }));
    const before = acornTotal(w);
    expect(takeQuest(w, id, 'p1')).toBe(true);
    expect(deliver(w, id, 'p1', 'food', 5)).toBe(2);
    expect(w.market.stock.food).toBeGreaterThanOrEqual(2);
    const reward = completeQuest(w, id, 'p1');
    expect(reward?.acorns).toBe(10);
    expect(w.players.p1.acorns).toBe(10);
    expect(w.factions[0].acorns).toBe(40);
    expect(w.players.p1.done).toBe(1);
    expect(w.quests[id].state).toBe('done');
    expect(acornTotal(w)).toBe(before);
  });

  it('expires offered quests and fails taken ones past their deadline', () => {
    const w = setup();
    addFaction(w, 0, 'the-tap', { havens: ['tap'] });
    addPlayer(w, 'p1', 'the-tap');
    const a = postQuest(w, newQuest({ region: 'the-tap', goal: { kind: 'find', npc: 0, region: 'the-tap' }, deadline: 0 }));
    const b = postQuest(w, newQuest({ region: 'the-tap', goal: { kind: 'find', npc: 0, region: 'the-tap' }, deadline: 0 }));
    expect(takeQuest(w, b, 'p1')).toBe(true);
    w.tick = 6;
    stepQuests(w, createRng(1));
    expect(w.quests[a].state).toBe('expired');
    expect(w.quests[b].state).toBe('failed');
    expect(w.players.p1.failed).toBe(1);
    expect(w.players.p1.quests).not.toContain(b);
    expect(w.events.some((e) => e.kind === 'quest-failed' && e.quest === b)).toBe(true);
  });

  it('reads the quest title from the goal', () => {
    const w = setup();
    addFaction(w, 0, 'the-tap');
    const id = postQuest(w, newQuest({ region: 'the-tap', goal: { kind: 'deliver', resource: 'food', count: 2, to: 'the-tap' } }));
    expect(questTitle(w, w.quests[id])).toBe('Bring 2 food to the Tap');
    expect(questsOn(w, 'board:the-tap')).toEqual([]);
    expect(questsNear(w, 'the-tap', 0).map((q) => q.id)).toEqual([id]);
  });
});

describe('outcomes and daily measures', () => {
  it('fills consequence reach from hand-written daily rows', () => {
    const w = setup();
    w.outcomes.push({ quest: 0, template: 'supply-run', doneTick: 0, by: 'p1', reach: null });
    w.daily = [
      { day: 1, topFactions: [0, 1, 2], havenHolders: { tap: 0 }, marketInBand: true },
      { day: 2, topFactions: [1, 0, 2], havenHolders: { tap: 1 }, marketInBand: false },
    ] as unknown as DailyRow[];
    w.tick = 6 * w.tuning.clock.ticksPerDay - 1;
    stepQuests(w, createRng(1));
    expect(w.outcomes[0].reach).toEqual({ rankChange: true, havenChange: true, marketOutOfBand: true });
    const daily = questDaily(w);
    expect(daily.outcomesMeasured).toBe(1);
    expect(daily.outcomesReached).toBe(1);
  });

  it('is deterministic over 10 days', () => {
    const run = (): string => {
      const { world: w, streams } = createWorld(3);
      w.market.stock.food = 0;
      addFaction(w, 0, 'the-tap', { havens: ['tap'] });
      addFaction(w, 1, 'the-willow', { havens: ['willow'] });
      runDays(w, streams, 10);
      return hashWorld(w);
    };
    expect(run()).toBe(run());
  }, 120000);
});
