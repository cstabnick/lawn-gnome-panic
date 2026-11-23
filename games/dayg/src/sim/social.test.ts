import { describe, it, expect } from 'vitest';
import { createRng } from './rng';
import { TUNING, withOverrides } from './tuning';
import type { Faction, Group, WorldState } from './types';
import { emptyResources, createWorld, hashWorld, runDays } from './world';
import {
  adjustTrust, entryOf, knownBy, standingOf, startRumour, stepSocial, subjectOfNpc, trustOf, witnessDeed,
} from './social';

const PLAYER = 'alice';
const SUBJ = `p:${PLAYER}`;

function fresh(seed = 11): WorldState {
  return createWorld(seed).world;
}
function neutral(w: WorldState, ids: number[]): void {
  for (const id of ids) {
    w.npcs[id].alive = true;
    w.npcs[id].traits = { ...w.npcs[id].traits, paranoia: 0.5, loyalty: 0.5 };
  }
}
function withCap(cap: number): WorldState {
  const w = fresh();
  w.tuning = withOverrides(TUNING, { social: { memoryCap: cap } });
  return w;
}

describe('adjustTrust', () => {
  it('clamps to -1..1 and creates the entry with the defaults', () => {
    const w = fresh();
    neutral(w, [0]);
    adjustTrust(w, 0, SUBJ, 2);
    expect(trustOf(w, 0, SUBJ)).toBe(1);
    adjustTrust(w, 0, SUBJ, -5);
    expect(trustOf(w, 0, SUBJ)).toBe(-1);
    const e = entryOf(w, 0, SUBJ);
    expect(e && e.debt).toBe(0);
    expect(e && e.grudge).toBeNull();
  });

  it('scales negative deltas by clamp(1 + paranoia - loyalty, 0.25, 2) and leaves positive ones alone', () => {
    const w = fresh();
    w.npcs[0].traits = { ...w.npcs[0].traits, paranoia: 1, loyalty: 0 };
    adjustTrust(w, 0, SUBJ, -0.2);
    expect(trustOf(w, 0, SUBJ)).toBeCloseTo(-0.4);
    w.npcs[1].traits = { ...w.npcs[1].traits, paranoia: 0, loyalty: 1 };
    adjustTrust(w, 1, SUBJ, -0.2);
    expect(trustOf(w, 1, SUBJ)).toBeCloseTo(-0.05);
    adjustTrust(w, 0, 'p:bob', 0.2);
    expect(trustOf(w, 0, 'p:bob')).toBeCloseTo(0.2);
  });

  it('ignores the NPC itself', () => {
    const w = fresh();
    adjustTrust(w, 0, subjectOfNpc(0), 0.5);
    expect(entryOf(w, 0, subjectOfNpc(0))).toBeNull();
  });

  it('evicts the weakest entry when over the cap, never the one just changed', () => {
    const w = withCap(3);
    neutral(w, [0]);
    adjustTrust(w, 0, 'p:a', 0.5);
    adjustTrust(w, 0, 'p:b', 0.6);
    adjustTrust(w, 0, 'p:c', 0.7);
    adjustTrust(w, 0, 'p:d', 0.05);
    const subs = w.memory[0].entries.map((e) => e.s).sort();
    expect(subs).toEqual(['p:b', 'p:c', 'p:d']);
  });
});

describe('witnessDeed', () => {
  it('reaches only the NPCs in the region, sets grudges, and starts a rumour for a strong deed', () => {
    const w = fresh();
    const a = 'forecourt' as const;
    const far = w.graph.regions.find((r) => r.id !== a && !w.graph.neighbours[a].some((n) => n.to === r.id))!.id;
    neutral(w, [0, 1, 2]);
    w.npcs[0].region = a; w.npcs[1].region = a; w.npcs[2].region = far;
    witnessDeed(w, SUBJ, 'stole', a, createRng(1));
    expect(trustOf(w, 0, SUBJ)).toBeCloseTo(-0.4);
    expect(trustOf(w, 1, SUBJ)).toBeCloseTo(-0.4);
    expect(entryOf(w, 2, SUBJ)).toBeNull();
    expect(entryOf(w, 0, SUBJ)?.grudge).toBe('theft');
    expect(w.rumours.length).toBe(1);
    expect(w.rumours[0].at).toEqual([a]);
  });

  it('a weak deed does not start a rumour', () => {
    const w = fresh();
    neutral(w, [0]);
    w.npcs[0].region = 'forecourt';
    witnessDeed(w, SUBJ, 'helped', 'forecourt', createRng(1));
    expect(trustOf(w, 0, SUBJ)).toBeCloseTo(0.15);
    expect(w.rumours.length).toBe(0);
  });
});

describe('rumours', () => {
  it('reach a neighbouring region within 3 world-days with rumourChance 1', () => {
    const w = fresh(7);
    w.tuning = withOverrides(TUNING, { social: { rumourChance: 1 } });
    const origin = 'forecourt' as const;
    const nbs = w.graph.neighbours[origin].map((n) => n.to);
    neutral(w, nbs.map((_, i) => i));
    nbs.forEach((r, i) => { w.npcs[i].region = r; });
    startRumour(w, { kind: 'deed', who: SUBJ, deed: 'stole' }, origin);
    const rng = createRng(3);
    const tpd = w.tuning.clock.ticksPerDay;
    for (let t = 0; t < 3 * tpd; t++) { w.tick = t; stepSocial(w, rng); }
    // the first region reached (one hop out) hears it at full discount, so its NPC ends up distrusting the deed
    const at = w.rumours[0].at;
    expect(at.length).toBeGreaterThan(1);
    const i = nbs.indexOf(at[1]);
    expect(i).toBeGreaterThanOrEqual(0);
    expect(trustOf(w, i, SUBJ)).toBeLessThan(0);
    expect(entryOf(w, i, SUBJ)?.heard).toBe(true);
  });

  it('is dropped after rumourMaxDays', () => {
    const w = fresh(7);
    startRumour(w, { kind: 'herd', size: 3 }, 'forecourt');
    w.tick = w.tuning.social.rumourMaxDays * w.tuning.clock.ticksPerDay + 1;
    stepSocial(w, createRng(3));
    expect(w.rumours.length).toBe(0);
  });
});

describe('forgetting', () => {
  it('moves trust toward 0 once per day and drops empty small entries', () => {
    const w = fresh();
    neutral(w, [0]);
    adjustTrust(w, 0, 'p:keep', 0.5);
    adjustTrust(w, 0, 'p:tiny', 0.005);
    adjustTrust(w, 0, 'p:owed', 0.005);
    entryOf(w, 0, 'p:owed')!.debt = 2;
    w.tick = 0;
    stepSocial(w, createRng(1));
    expect(trustOf(w, 0, 'p:keep')).toBeCloseTo(0.5 - TUNING.social.forgetPerDay);
    expect(entryOf(w, 0, 'p:tiny')).toBeNull();
    expect(entryOf(w, 0, 'p:owed')).not.toBeNull();
  });
});

describe('standingOf', () => {
  function factionWith(w: WorldState, members: number[], leader: number): number {
    const g: Group = { id: 900, name: 'test', members, leader, region: 'forecourt', formedTick: 0 };
    w.groups.push(g);
    const f: Faction = {
      id: w.factions.length, name: 'the Test Spades', founder: null, hat: 0, home: 'forecourt', leader, groups: [900],
      norms: { sharing: 'own', strangers: 'rob', bitten: 'shatter', leadership: 'strongest', violence: 'outsiders' },
      power: 0, morale: 0.5, stock: emptyResources(), acorns: 0, havens: [], territory: [], allies: [], enemies: [],
      plan: 'hold', planTarget: null, planSince: 0, formedTick: 0, diedTick: null, ranks: {}, done: {}, leaders: [],
    };
    w.factions.push(f);
    return f.id;
  }

  it('pulls the mean toward the leader trust, scaled to -100..100', () => {
    const w = fresh();
    neutral(w, [0, 1, 2]);
    adjustTrust(w, 0, SUBJ, 0.8);
    adjustTrust(w, 1, SUBJ, 0.2);
    const fid = factionWith(w, [0, 1, 2], 0);
    // mean 0.5, leader 0.8, pull 0.3 -> 0.59
    expect(standingOf(w, fid, PLAYER)).toBeCloseTo(59);
  });

  it('is 0 when nobody knows the player, for an unknown faction, and for a dead one', () => {
    const w = fresh();
    neutral(w, [0]);
    const fid = factionWith(w, [0], 0);
    expect(standingOf(w, fid, PLAYER)).toBe(0);
    expect(standingOf(w, 999, PLAYER)).toBe(0);
    adjustTrust(w, 0, SUBJ, 0.5);
    w.factions[fid].diedTick = 5;
    expect(standingOf(w, fid, PLAYER)).toBe(0);
  });
});

describe('knownBy', () => {
  it('lists alive NPCs with an entry, strongest first, then id', () => {
    const w = fresh();
    neutral(w, [0, 1, 2]);
    adjustTrust(w, 2, SUBJ, 0.1);
    adjustTrust(w, 1, SUBJ, 0.5);
    adjustTrust(w, 0, SUBJ, -0.5);
    expect(knownBy(w, PLAYER).map((k) => k.npc)).toEqual([0, 1, 2]);
  });
});

describe('determinism', () => {
  it('two 5-day runs with a rumour hash equal', () => {
    const run = (): string => {
      const { world, streams } = createWorld(5);
      startRumour(world, { kind: 'deed', who: SUBJ, deed: 'betrayed' }, 'forecourt');
      runDays(world, streams, 5);
      return hashWorld(world);
    };
    expect(run()).toBe(run());
  });
});
