// Talk verbs and the phrase bank (quests.md "Talking to NPCs").
import { describe, it, expect } from 'vitest';
import { createRng } from './rng';
import { talk, verbsFor } from './talk';
import { PHRASES, renderLines } from './phrases';
import { RESOURCES, TALK_VERBS, type PlayerRecord, type PhraseLine, type TalkInput, type WorldState } from './types';
import { acornTotal, createWorld, hashWorld, resourceTotals } from './world';
import { adjustTrust, entryOf, trustOf } from './social';

/** Sets the NPC's trust in the test player to an exact value (negative deltas are scaled by paranoia, so write it directly). */
function setTrust(w: WorldState, npc: number, target: number): void {
  adjustTrust(w, npc, `p:${PLAYER}`, 0);
  const e = entryOf(w, npc, `p:${PLAYER}`);
  if (e) e.trust = target;
}

const PLAYER = 'local';

function setup(seed = 7): { w: WorldState; npc: WorldState['npcs'][number] } {
  const { world: w } = createWorld(seed);
  const npc = w.npcs[0];
  npc.alive = true;
  npc.region = 'forecourt';
  const p: PlayerRecord = {
    key: PLAYER, name: 'Test', look: '', userId: null, region: 'forecourt', online: false, joinedTick: 0, lastTick: 0,
    acorns: 5, faction: null, notoriety: 0, quests: [], done: 0, failed: 0, deaths: 0, skills: {}, bed: null,
  };
  w.players[PLAYER] = p;
  return { w, npc };
}

function input(over: Partial<TalkInput> & Pick<TalkInput, 'verb'>): TalkInput {
  return { npc: 0, player: PLAYER, ...over };
}

describe('talk verbs', () => {
  it('cuts off a hostile NPC for every verb but greet', () => {
    const { w } = setup();
    setTrust(w, 0, -0.7);
    const rng = createRng(1);
    const ask = talk(w, input({ verb: 'ask', topic: { about: 'herd' } }), rng);
    expect(ask.ok).toBe(false);
    expect(ask.hostile).toBe(true);
    expect(ask.lines[0].key).toBe('talk.hostile');
    const greet = talk(w, input({ verb: 'greet' }), rng);
    expect(greet.ok).toBe(true);
    expect(greet.hostile).toBe(false);
  });

  it('reports away for an NPC in another region', () => {
    const { w } = setup();
    w.npcs[0].region = 'the-tap';
    const r = talk(w, input({ verb: 'greet' }), createRng(1));
    expect(r.ok).toBe(false);
    expect(r.lines[0].key).toBe('talk.away');
    expect(verbsFor(w, 0, PLAYER).every((v) => !v.ok)).toBe(true);
  });

  it('greets for +0.02 trust at most once per world-day', () => {
    const { w } = setup();
    const rng = createRng(1);
    const before = trustOf(w, 0, `p:${PLAYER}`);
    const first = talk(w, input({ verb: 'greet' }), rng);
    expect(first.trustDelta).toBeCloseTo(0.02);
    const second = talk(w, input({ verb: 'greet' }), rng);
    expect(second.trustDelta).toBeCloseTo(0);
    expect(trustOf(w, 0, `p:${PLAYER}`)).toBeCloseTo(before + 0.02);
    w.tick += w.tuning.clock.ticksPerDay;
    const nextDay = talk(w, input({ verb: 'greet' }), rng);
    expect(nextDay.trustDelta).toBeCloseTo(0.02);
  });

  it('trades conserve resources and acorns', () => {
    const { w, npc } = setup();
    w.market.price.food = 2;
    w.market.price.materials = 2;
    npc.traits.greed = 0;
    for (const r of RESOURCES) npc.carried[r] = 0;
    npc.carried.food = 5;
    npc.acorns = 0;
    const totals0 = resourceTotals(w);
    const given0 = { ...w.ledger.givenByPlayer };
    const removed0 = { ...w.ledger.removedByPlayer };
    const acorns0 = acornTotal(w);
    const r = talk(w, input({
      verb: 'trade', offer: { resource: 'materials', count: 1 }, want: { resource: 'food', count: 1 },
      carried: { materials: 1 },
    }), createRng(1));
    expect(r.ok).toBe(true);
    expect(r.give).toHaveLength(1);
    expect(r.take).toEqual([{ resource: 'materials', count: 1 }]);
    const totals1 = resourceTotals(w);
    for (const k of RESOURCES) {
      const moved = (totals1[k] - totals0[k]) - ((w.ledger.givenByPlayer[k] - given0[k]) - (w.ledger.removedByPlayer[k] - removed0[k]));
      expect(moved).toBe(0);
    }
    expect(acornTotal(w)).toBe(acorns0);
  });

  it('a rob sets a robbed grudge and costs trust', () => {
    const { w, npc } = setup();
    setTrust(w, 0, 0);
    npc.traits.boldness = 0;
    npc.carried.food = 3;
    talk(w, input({ verb: 'rob', carried: {} }), createRng(3));
    const entry = w.memory[0].entries.find((e) => e.s === `p:${PLAYER}`);
    expect(entry?.grudge).toBe('robbed');
    // The victim's own drop is deed.robbed; witnesses (social.ts witnessDeed) may add more.
    expect(entry?.trust ?? 0).toBeLessThan(0);
  });

  it('shares food into the NPC for trust, capped at +0.4', () => {
    const { w, npc } = setup();
    setTrust(w, 0, 0);
    npc.carried.food = 0;
    const r = talk(w, input({ verb: 'share-food', offer: { resource: 'food', count: 5 }, carried: { food: 5 } }), createRng(1));
    expect(r.ok).toBe(true);
    expect(r.take).toEqual([{ resource: 'food', count: 5 }]);
    expect(npc.carried.food).toBe(5);
    // The share itself is +0.4 (capped); witnesses (social.ts witnessDeed) may add their own deed trust on top.
    expect(r.trustDelta).toBeGreaterThanOrEqual(0.4 - 1e-9);
  });
});

describe('phrase bank', () => {
  const FULL = { name: 'Ada', player: 'Pim', region: 'Forecourt', danger: 'bad', price: 3, resource: 'food', count: 2,
    size: 4, faction: 'Yarrow', title: 'Bring food to Forecourt', other: 'Brin' };

  it('has 3 to 5 variants for every key the talk verbs use', () => {
    for (const [key, options] of Object.entries(PHRASES)) {
      expect(options.length, key).toBeGreaterThanOrEqual(3);
      expect(options.length, key).toBeLessThanOrEqual(5);
    }
    for (const key of ['talk.away', 'talk.hostile', 'greet.wary', 'greet.neutral', 'greet.friendly', 'greet.close',
      'greet.hostile', 'ask.place', 'ask.gnome', 'ask.unknown', 'ask.price', 'ask.herd', 'ask.noherd', 'ask.refuse',
      'trade.accept', 'trade.refuse', 'help.quest', 'help.none', 'askhelp.give', 'askhelp.refuse', 'recruit.ok',
      'recruit.refuse', 'join.ok', 'join.refuse', 'threaten.give', 'threaten.fight', 'rob.ok', 'rob.caught',
      'share.thanks', 'warn.thanks', 'talk.short', 'warn.none']) {
      expect(PHRASES[key], key).toBeDefined();
    }
  });

  it('replaces every {var} when all vars are given', () => {
    for (const key of Object.keys(PHRASES)) {
      const lines: PhraseLine[] = PHRASES[key].map(() => ({ key, vars: FULL }));
      for (const text of renderLines(lines, 0)) expect(text).not.toMatch(/\{\w+\}/);
    }
  });

  it('determinism: 50 random verb calls on a fixed seed give the same results and world', () => {
    const run = (): { json: string; hash: string; keys: string[] } => {
      const { w } = setup(11);
      const rng = createRng(99);
      const out: unknown[] = [];
      const keys: string[] = [];
      for (let i = 0; i < 50; i++) {
        const verb = rng.pick(TALK_VERBS);
        const r = talk(w, input({
          verb, topic: { about: 'herd' }, offer: { resource: 'food', count: 1 }, want: { resource: 'water', count: 1 },
          acorns: 0, carried: { food: 2, water: 0, tools: 1 }, warnOf: rng.chance(0.2) ? 0 : undefined,
        }), rng);
        out.push(r);
        for (const l of r.lines) keys.push(l.key);
        if (i % 10 === 9) w.tick += w.tuning.clock.ticksPerDay;
      }
      return { json: JSON.stringify(out), hash: hashWorld(w), keys };
    };
    const a = run();
    const b = run();
    expect(a.json).toBe(b.json);
    expect(a.hash).toBe(b.hash);
    for (const k of a.keys) expect(PHRASES[k], `talk used ${k}`).toBeDefined();
  });
});
