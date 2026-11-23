// Factions: seeding, falls, determinism, conservation, joining and rank promotion.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FOUNDERS, joinFaction, promoteRanks, rankOf, stepFactions, membersOf, powerOf, factionDaily } from './factions';
import { createRng } from './rng';
import { standingOf } from './social';
import { TUNING } from './tuning';
import { RESOURCES, type PlayerRecord, type WorldState } from './types';
import { acornTotal, createWorld, hashWorld, resourceTotals, runWorld, runDays } from './world';

// Standing comes from social.ts; pin it here so the join and rank checks are hand-set.
vi.mock('./social', async (importOriginal) => {
  const m = await importOriginal<typeof import('./social')>();
  return { ...m, standingOf: vi.fn(() => 0) };
});

function player(key: string, faction: number | null = null): PlayerRecord {
  return {
    key, name: key, look: '', userId: null, region: 'the-tap', online: true, joinedTick: 0, lastTick: 0, acorns: 0,
    faction, notoriety: 0, quests: [], done: 0, failed: 0, deaths: 0, skills: {}, bed: null,
  };
}

function conservationErrors(w: WorldState): string[] {
  const errs: string[] = [];
  const L = w.ledger;
  const tot = resourceTotals(w);
  for (const k of RESOURCES) {
    const want = L.lootStart[k] + L.foraged[k] - L.consumed[k] - L.removedByPlayer[k];
    if (tot[k] !== want) errs.push(`${k}: ${tot[k]} != ${want}`);
  }
  const ac = acornTotal(w);
  if (ac !== L.acornsStart) errs.push(`acorns: ${ac} != ${L.acornsStart}`);
  return errs;
}

beforeEach(() => {
  vi.mocked(standingOf).mockReset();
  vi.mocked(standingOf).mockReturnValue(0);
});

describe('seeding', () => {
  it('seed 1 on the slice: the Truce holds the Tap and 2-4 founders lead their factions', () => {
    const { world: w } = createWorld(1);
    const truce = w.factions.find((f) => f.name === 'the Truce of the Tap');
    expect(truce).toBeDefined();
    expect(truce!.havens).toContain('tap');
    const founders = w.factions.filter((f) => f.founder !== null);
    expect(founders.length).toBeGreaterThanOrEqual(2);
    expect(founders.length).toBeLessThanOrEqual(4);
    for (const f of founders) {
      const def = FOUNDERS.find((d) => d.id === f.founder)!;
      expect(f.name).toBe(def.faction);
      expect(w.npcs[f.leader].name).toBe(def.name);
    }
    expect(w.factions.some((f) => f.name === 'the Willow Folk')).toBe(false);
  });

  it('the full map seeds the Willow Folk and the Shelf Wrights', () => {
    const { world: w } = createWorld(1, TUNING, undefined, { map: 'full' });
    const willow = w.factions.find((f) => f.name === 'the Willow Folk');
    const shelves = w.factions.find((f) => f.name === 'the Shelf Wrights');
    expect(willow?.havens).toContain('willow');
    expect(shelves?.havens).toContain('shelves');
  });
});

describe('falls and groups', () => {
  it('a faction with no members falls', () => {
    const { world: w } = createWorld(1);
    const f = w.factions.find((x) => x.founder !== null)!;
    f.groups = [];
    stepFactions(w, createRng(7));
    expect(f.diedTick).not.toBeNull();
    expect(f.havens).toEqual([]);
    expect(factionDaily(w).factions).toBe(w.factions.filter((x) => x.diedTick === null).length);
  });
});

describe('a 30-day run', () => {
  it('keeps at least one faction alive, is deterministic and conserves resources and acorns', () => {
    const a = runWorld(1, 30);
    const b = runWorld(1, 30);
    expect(a.world.factions.some((f) => f.diedTick === null)).toBe(true);
    expect(hashWorld(a.world)).toBe(hashWorld(b.world));
    expect(conservationErrors(a.world)).toEqual([]);
  });

  it('conserves over 30 days when run step by step', () => {
    const { world: w, streams } = createWorld(3);
    runDays(w, streams, 30);
    expect(conservationErrors(w)).toEqual([]);
  });
});

describe('players', () => {
  it('joins with a hand-set standing, then promotes on hand-set done count and trust', () => {
    const { world: w } = createWorld(1);
    const truce = w.factions.find((f) => f.name === 'the Truce of the Tap')!;
    w.players.p1 = player('p1');
    vi.mocked(standingOf).mockReturnValue(50);
    expect(joinFaction(w, truce.id, 'p1')).toBe(true);
    expect(rankOf(w, truce.id, 'p1')).toBe('stray');
    expect(w.players.p1.faction).toBe(truce.id);
    expect(joinFaction(w, truce.id, 'p1')).toBe(false);

    truce.done.p1 = 0;
    expect(promoteRanks(w, 'p1')).toBeNull();
    truce.done.p1 = 1;
    vi.mocked(standingOf).mockReturnValue(10);
    expect(promoteRanks(w, 'p1')).toBeNull();
    vi.mocked(standingOf).mockReturnValue(30);
    expect(promoteRanks(w, 'p1')).toBe('hand');
    expect(rankOf(w, truce.id, 'p1')).toBe('hand');
  });

  it('refuses a stranger to a turn-away faction below standing 40', () => {
    const { world: w } = createWorld(1);
    const crypt = w.factions.find((f) => f.founder !== null)!;
    crypt.norms.strangers = 'turn-away';
    w.players.p2 = player('p2');
    vi.mocked(standingOf).mockReturnValue(20);
    expect(joinFaction(w, crypt.id, 'p2')).toBe(false);
    vi.mocked(standingOf).mockReturnValue(40);
    expect(joinFaction(w, crypt.id, 'p2')).toBe(true);
  });

  it('powerOf is zero for a faction with no members', () => {
    const { world: w } = createWorld(1);
    const f = w.factions[0];
    f.groups = [];
    expect(membersOf(w, f)).toEqual([]);
    expect(powerOf(w, f)).toBe(0);
  });
});
