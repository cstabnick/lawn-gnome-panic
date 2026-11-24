// The Kerbside Exchange board's pure rules: which rows show, their state, sort order and locked notes, and the
// city-fixture check. Run from games/gnome-theft-auto: npx vitest run src/city/exchangeApp.test.ts
import { describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { GiverDef, QuestDef, QuestSave } from '../quests/types';

installFakeDom();
const { exchangeRows, allCityDone } = await import('./exchangeApp');
const { CITY_QUESTS } = await import('../quests/cityQuests');

const giver = (id: string, name: string, x: number, z: number): GiverDef => ({
  id,
  name,
  label: `Talk to ${name}`,
  x,
  z,
  exit: { x, z: z + 2, yaw: 0 },
  room: 'street',
});

const quest = (id: string, title: string, giverId: string, extra: Partial<QuestDef> = {}): QuestDef => ({
  id,
  title,
  giver: giverId,
  objectives: [],
  doneText: 'Done.',
  ...extra,
});

const givers: Record<string, GiverDef> = {
  g1: giver('g1', 'Giver One', 0, 0),
  g2: giver('g2', 'Giver Two', 200, 200),
};

const quests: QuestDef[] = [
  quest('sq-a', 'Side A', 'g1', { rewardAcorns: 120 }),
  quest('sq-b', 'Side B', 'g2', { prereq: 'sq-a' }),
  quest('ch1-story', 'Story Job', 'g1', { chapter: 1 }),
  quest('sq-c', 'Side C', 'g1'),
  quest('sq-done', 'Side Done', 'g2', { rewardAcorns: 90 }),
];

const doneSave = (): QuestSave => ({ state: 'done', step: 1, cracked: [] });

describe('exchangeRows', () => {
  it('leaves out story quests (those with a chapter)', () => {
    const rows = exchangeRows(quests, givers, {}, null);
    expect(rows.map((r) => r.questId)).not.toContain('ch1-story');
  });

  it('gives each row a state: active, done, open or locked', () => {
    const saves: Record<string, QuestSave> = { 'sq-done': { state: 'done', step: 1, cracked: [] } };
    const rows = exchangeRows(quests, givers, saves, 'sq-a');
    const state = (id: string) => rows.find((r) => r.questId === id)?.state;
    expect(state('sq-a')).toBe('active');
    expect(state('sq-done')).toBe('done');
    expect(state('sq-c')).toBe('open');
    expect(state('sq-b')).toBe('locked');
  });

  it('a finished quest stays done even when it is no longer the active one', () => {
    const saves: Record<string, QuestSave> = { 'sq-c': { state: 'done', step: 1, cracked: [] } };
    const rows = exchangeRows(quests, givers, saves, null);
    expect(rows.find((r) => r.questId === 'sq-c')?.state).toBe('done');
  });

  it('a locked row names the quest it waits on, and done rows say Done', () => {
    const saves: Record<string, QuestSave> = { 'sq-done': { state: 'done', step: 1, cracked: [] } };
    const rows = exchangeRows(quests, givers, saves, null);
    expect(rows.find((r) => r.questId === 'sq-b')?.note).toBe('After "Side A"');
    expect(rows.find((r) => r.questId === 'sq-done')?.note).toBe('Done');
  });

  it('an open quest with a perk shows the perk name', () => {
    const perkQuests = [quest('sq-grid-truthers', 'Grid Truthers', 'g1')];
    const saves: Record<string, QuestSave> = { 'prologue-fresh-kiln': doneSave() };
    const rows = exchangeRows(perkQuests, givers, saves, null);
    expect(rows[0].state).toBe('open');
    expect(rows[0].note).toBe('Perk: Datum Map');
  });

  it('takes the reward from rewardAcorns, defaulting to 250, and carries the giver id', () => {
    const rows = exchangeRows(quests, givers, {}, null);
    expect(rows.find((r) => r.questId === 'sq-a')).toMatchObject({ reward: 120, giverId: 'g1' });
    expect(rows.find((r) => r.questId === 'sq-c')?.reward).toBe(250);
  });

  it('sorts active, then open, then locked, then done', () => {
    const saves: Record<string, QuestSave> = { 'sq-done': { state: 'done', step: 1, cracked: [] } };
    const order = exchangeRows(quests, givers, saves, 'sq-a').map((r) => r.state);
    const rank = { active: 0, open: 1, locked: 2, done: 3 } as const;
    const ranks = order.map((s) => rank[s]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(order[0]).toBe('active');
    expect(order[order.length - 1]).toBe('done');
  });

  it('marks the city contracts and lists them first among their state', () => {
    const cityId = CITY_QUESTS[0].id;
    const all = [...quests, quest(cityId, 'City Job', 'kerb-exchange')];
    const saves: Record<string, QuestSave> = { 'ch1-mowers-keepers': doneSave() };
    const rows = exchangeRows(all, { ...givers, 'kerb-exchange': giver('kerb-exchange', 'Dot', 9, 9) }, saves, null);
    const open = rows.filter((r) => r.state === 'open');
    expect(open[0].questId).toBe(cityId);
    expect(open[0].city).toBe(true);
    expect(rows.find((r) => r.questId === 'sq-a')?.city).toBe(false);
  });
});

describe('allCityDone', () => {
  it('is false with no saves', () => {
    expect(allCityDone({})).toBe(false);
  });

  it('is false while one city contract is still open', () => {
    const saves: Record<string, QuestSave> = {};
    for (const q of CITY_QUESTS.slice(1)) saves[q.id] = doneSave();
    expect(allCityDone(saves)).toBe(false);
  });

  it('is true once every city contract is done', () => {
    const saves: Record<string, QuestSave> = {};
    for (const q of CITY_QUESTS) saves[q.id] = doneSave();
    expect(allCityDone(saves)).toBe(true);
  });
});
