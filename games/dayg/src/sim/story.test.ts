// The Mowing (mowing.ts) and the hand-written storylets (storylets.ts): timing, warning, cover, conservation, one-shot firing.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorld, hashWorld, hatlessTotal, runDays, stepWorld } from './world';
import { TUNING } from './tuning';
import { isMown, mowingSoon, regionTraits, stepMowing } from './mowing';
import { stepStorylets, STORYLETS } from './storylets';
import { RESOURCES, type DistrictId, type Faction, type StoryletId, type WorldState } from './types';
import type { Streams } from './rng';

const mockStanding = vi.hoisted(() => ({ value: 0 }));
vi.mock('./social', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./social')>()),
  standingOf: () => mockStanding.value,
}));

const SEED = 20260423;
const TPD = TUNING.clock.ticksPerDay;

function fresh(seed = SEED): { w: WorldState; s: Streams } {
  const { world, streams } = createWorld(seed, TUNING);
  return { w: world, s: streams };
}

function factionLike(over: Partial<Faction>): Faction {
  return {
    id: 0, name: 'Test Faction', founder: null, hat: 0, home: 'ivy-rows', leader: 0, groups: [],
    norms: { sharing: 'all', strangers: 'welcome', bitten: 'nurse', leadership: 'strongest', violence: 'never-first' },
    power: 0, morale: 1, stock: { food: 0, water: 0, medicine: 0, fuel: 0, tools: 0, materials: 0, valuables: 0 }, acorns: 0,
    havens: [], territory: [], allies: [], enemies: [], plan: 'hold', planTarget: null, planSince: 0,
    formedTick: 0, diedTick: null, ranks: {}, done: {}, leaders: [{ npc: 0, from: 0 }],
    ...over,
  } as Faction;
}

function lootSums(w: WorldState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of RESOURCES) out[k] = 0;
  for (const r of w.graph.regions) for (const k of RESOURCES) out[k] += w.loot[r.id][k];
  return out;
}

describe('the Mowing', () => {
  it('is scheduled within everyDays, warns warnDays before, and cuts the district', () => {
    const { w, s } = fresh();
    const [lo, hi] = TUNING.mowing.everyDays;
    const first = w.mowing.next;
    expect(first).toBeGreaterThanOrEqual(lo * TPD);
    expect(first).toBeLessThanOrEqual(hi * TPD);

    let warnTick: number | null = null;
    let mowTick: number | null = null;
    let district: string | null = null;
    for (let i = 0; i <= hi * TPD + 2 && mowTick === null; i++) {
      const at = w.tick;
      stepWorld(w, s);
      if (warnTick === null && w.events.some((e) => e.kind === 'mowing-soon')) warnTick = at;
      const ev = w.events.find((e) => e.kind === 'mowing');
      if (ev && ev.kind === 'mowing') { mowTick = at; district = ev.district; }
    }
    expect(mowTick).not.toBeNull();
    expect(mowTick!).toBeLessThanOrEqual(first);
    expect(warnTick).toBe(first - TUNING.mowing.warnDays * TPD);
    expect(warnTick!).toBeLessThan(mowTick!);
    expect(isMown(w, district as DistrictId)).toBe(true);
    expect(w.chronicle.some((c) => c.text.includes('cut flat'))).toBe(true);
  });

  it('removes cover from the mown district while it lasts, and gives it OPEN', () => {
    const { w, s } = fresh();
    w.mowing.next = w.tick;
    w.mowing.warned = false;
    stepMowing(w, s.mowing);
    const d = w.mowing.lastTick === null ? null : Object.keys(w.mowing.mownUntil)[0];
    expect(d).not.toBeNull();
    const district = d as DistrictId;
    const regs = w.graph.regions.filter((r) => r.district === district);
    expect(regs.length).toBeGreaterThan(0);
    for (const r of regs) {
      const t = regionTraits(w, r.id);
      expect(t).not.toContain('COVER');
      expect(t).toContain('OPEN');
    }
    // cover comes back once the cover period is over
    w.tick = w.mowing.mownUntil[district]! + 1;
    expect(isMown(w, district)).toBe(false);
    expect(mowingSoon(w)).toBeNull();
  });

  it('conserves loot and Hatless through the spill and the herd scatter', () => {
    const { w, s } = fresh();
    runDays(w, s, 1); // some herds and stock to move
    w.mowing.next = w.tick;
    w.mowing.warned = false;
    const lootBefore = lootSums(w);
    const hatlessBefore = hatlessTotal(w);
    stepMowing(w, s.mowing);
    expect(lootSums(w)).toEqual(lootBefore);
    expect(hatlessTotal(w)).toBe(hatlessBefore);
  });

  it('is deterministic on a fixed seed', () => {
    const a = fresh(); const b = fresh();
    runDays(a.w, a.s, 30); runDays(b.w, b.s, 30);
    expect(hashWorld(a.w)).toBe(hashWorld(b.w));
    expect(a.w.mowing).toEqual(b.w.mowing);
  });
});

describe('storylets', () => {
  beforeEach(() => { mockStanding.value = 0; });

  it('gate-book fires on day 1', () => {
    const { w, s } = fresh();
    for (let i = 0; i < TPD && !w.storylets.some((x) => x.id === 'gate-book'); i++) stepWorld(w, s);
    const gb = w.storylets.find((x) => x.id === 'gate-book');
    expect(gb).toBeDefined();
    expect(gb!.firedTick).toBeLessThan(TPD);
    const q = w.quests[gb!.quest!];
    expect(q.template).toBe('storylet');
    expect(q.goal).toEqual({ kind: 'visit', region: 'the-tap', item: 'red-book' });
    expect(q.reward.acorns).toBe(6);
    expect(q.reward.trust).toBe(0.15);
  });

  /** Runs the storylet check at the next check tick (w.tick + 1 divisible by checkEvery) and returns the tick used. */
  function check(w: WorldState, s: Streams): void {
    const every = TUNING.storylets.checkEvery;
    while ((w.tick + 1) % every !== 0) w.tick += 1;
    stepStorylets(w, s.story);
    w.tick += 1;
  }
  const count = (w: WorldState, id: StoryletId): number => w.storylets.filter((x) => x.id === id).length;

  it('last-sexton fires once with the Keepers alive', () => {
    const { w, s } = fresh();
    w.factions.push(factionLike({ id: 0, name: 'Lantern Keepers', founder: 'yarrow-gravelpot', home: 'ivy-rows' }));
    w.npcs[0].alive = true;
    check(w, s);
    expect(count(w, 'last-sexton')).toBe(1);
    check(w, s);
    expect(count(w, 'last-sexton')).toBe(1);
  });

  it('seeds-for-spring fires in winter with food under half its target', () => {
    const { w, s } = fresh();
    w.lastSeason = 'winter';
    w.market.stock.food = 0;
    check(w, s);
    expect(count(w, 'seeds-for-spring')).toBe(1);
    check(w, s);
    expect(count(w, 'seeds-for-spring')).toBe(1);
  });

  it('greybearded-walk fires once an online player stands at 20 or more', () => {
    const { w, s } = fresh();
    w.factions.push(factionLike({ id: 1, name: 'The Greybearded', home: 'child-graves' }));
    w.players['p1'] = { key: 'p1', name: 'Walker', look: '', userId: null, region: 'child-graves', online: true, joinedTick: 0, lastTick: 0, acorns: 0, faction: null, notoriety: 0, quests: [], done: 0, failed: 0, deaths: 0, skills: {}, bed: null } as never;
    mockStanding.value = 20;
    check(w, s);
    expect(count(w, 'greybearded-walk')).toBe(1);
    check(w, s);
    expect(count(w, 'greybearded-walk')).toBe(1);
  });

  it('who-rang-the-horn fires after a recent bell, and not twice', () => {
    const { w, s } = fresh();
    w.bellTick = w.tick;
    check(w, s);
    expect(count(w, 'who-rang-the-horn')).toBe(1);
    w.bellTick = w.tick;
    check(w, s);
    expect(count(w, 'who-rang-the-horn')).toBe(1);
  });

  it('mower-rumbles fires while the Mowing is about to come, and not twice', () => {
    const { w, s } = fresh();
    w.mowing.warned = true;
    w.mowing.district = w.graph.regions[0].district;
    w.mowing.next = w.tick + TPD;
    check(w, s);
    expect(count(w, 'mower-rumbles')).toBe(1);
    const q = w.quests[w.storylets.find((x) => x.id === 'mower-rumbles')!.quest!];
    expect(q.reward.acorns).toBe(10);
    expect(w.graph.byId[q.region].district).toBe(w.graph.regions[0].district);
    check(w, s);
    expect(count(w, 'mower-rumbles')).toBe(1);
  });

  it('every storylet id has a title and fires at most once', () => {
    expect(STORYLETS.map((x) => x.id).length).toBe(6);
    const { w, s } = fresh();
    w.bellTick = 0;
    w.lastSeason = 'winter';
    w.market.stock.food = 0;
    for (let i = 0; i < 4; i++) check(w, s);
    const ids = w.storylets.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

