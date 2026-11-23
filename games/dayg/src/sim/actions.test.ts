// Tests for the action layer and L0 bubbles: every Hatless moves through a bubble without being made or lost,
// every action kind books what it should, and two replays of the same envelopes end on the same world hash.
import { describe, it, expect } from 'vitest';
import { ITEM_LIST } from '../items/defs';
import { applyAction, tickWorld } from './actions';
import { absorbBubbles, bubbleIn, bubbleOf, destroyInBubble } from './bubbles';
import { DEATH_CAUSES, type ActionEnvelope, type SimAction, type WorldState } from './types';
import { createRng, STREAM_NAMES, type Rng, type Streams, type StreamName } from './rng';
import { createWorld, hashWorld, hatlessTotal } from './world';

function setup(seed = 11): { w: WorldState; s: Streams } {
  const { world, streams } = createWorld(seed);
  return { w: world, s: streams };
}
function env(w: WorldState, player: string, action: SimAction, seq = 0): ActionEnvelope {
  return { tick: w.tick, seq, player, action };
}
const ITEM = ITEM_LIST[0].id;

describe('bubbles', () => {
  it('keeps hatlessTotal unchanged across enter, handover, leave and absorb', () => {
    const { w, s } = setup();
    const [r0, r1] = w.graph.regions.map((r) => r.id);
    w.horde.density[r0] = 5;
    w.horde.density[r1] = 0;
    w.horde.herds = [];
    w.horde.herds.push({ id: 9000, region: r1, size: 7, target: null, movedTick: 0 });
    const h0 = hatlessTotal(w);

    expect(applyAction(w, s, env(w, 'a', { kind: 'player-join', name: 'A', look: '', userId: null, region: r0 })).ok).toBe(true);
    expect(hatlessTotal(w)).toBe(h0);
    expect(bubbleIn(w, r0)?.owner).toBe('a');
    expect(bubbleIn(w, r0)?.hatless).toBe(5);

    applyAction(w, s, env(w, 'b', { kind: 'player-join', name: 'B', look: '', userId: null, region: r0 }));
    expect(bubbleOf(w, 'b')?.owner).toBe('a');
    expect(hatlessTotal(w)).toBe(h0);

    // A moves on: ownership of r0 passes to B, and A's new bubble takes the herd in r1.
    applyAction(w, s, env(w, 'a', { kind: 'enter-region', region: r1, alive: 5 }));
    expect(bubbleIn(w, r0)?.owner).toBe('b');
    expect(bubbleIn(w, r0)?.viewers).toEqual([]);
    expect(bubbleIn(w, r1)?.owner).toBe('a');
    expect(bubbleIn(w, r1)?.hatless).toBe(7);
    expect(hatlessTotal(w)).toBe(h0);

    // Loose Hatless drift into the occupied regions, then get absorbed.
    w.horde.density[r0] = 3;
    w.horde.herds.push({ id: 9001, region: r0, size: 2, target: null, movedTick: 0 });
    const before = hatlessTotal(w);
    const arrivals = absorbBubbles(w);
    expect(hatlessTotal(w)).toBe(before);
    expect(arrivals.filter((a) => a.region === r0)).toEqual([{ player: 'b', region: r0, count: 5, from: null }]);
    expect(bubbleIn(w, r0)?.hatless).toBe(10);

    // The last owner leaves: the bubble's Hatless go back into the loose density.
    applyAction(w, s, env(w, 'b', { kind: 'player-leave' }));
    expect(bubbleIn(w, r0)).toBeNull();
    expect(w.horde.density[r0]).toBe(10);
    expect(hatlessTotal(w)).toBe(before);
  });

  it('books a destroyed Hatless against the bubble and the ledger', () => {
    const { w, s } = setup();
    const r0 = w.graph.regions[0].id;
    w.horde.density[r0] = 2;
    applyAction(w, s, env(w, 'a', { kind: 'player-join', name: 'A', look: '', userId: null, region: r0 }));
    const total = hatlessTotal(w);
    const destroyed = w.ledger.hatlessDestroyed;
    expect(destroyInBubble(w, r0)).toBe(true);
    expect(hatlessTotal(w)).toBe(total - 1);
    expect(w.ledger.hatlessDestroyed).toBe(destroyed + 1);
    const other = w.graph.regions[1].id;
    expect(destroyInBubble(w, other)).toBe(false);
  });
});

describe('applyAction', () => {
  it('returns ok for valid input on the real callees', () => {
    const { w, s } = setup();
    const rids = w.graph.regions.map((r) => r.id);
    const r0 = rids[0];
    const r1 = rids[1];
    const cid = Object.keys(w.containers)[0];
    const ok = (a: SimAction): boolean => applyAction(w, s, env(w, 'a', a)).ok;

    w.horde.density[r1] = 3;
    expect(ok({ kind: 'player-join', name: 'A', look: '', userId: null, region: r0 })).toBe(true);
    expect(ok({ kind: 'enter-region', region: r1, alive: 0 })).toBe(true);
    expect(w.players.a.region).toBe(r1);
    expect(ok({ kind: 'hatless-destroyed', region: r1 })).toBe(true);
    expect(ok({ kind: 'noise', region: r1, amount: 10 })).toBe(true);
    expect(w.horde.noise[r1]).toBeGreaterThanOrEqual(10);
    expect(ok({ kind: 'open-container', id: cid })).toBe(true);
    expect(ok({ kind: 'player-take', stack: { def: ITEM, count: 1, condition: 1 } })).toBe(true);
    expect(ok({ kind: 'set-skills', skills: { melee: 2 } })).toBe(true);
    expect(w.players.a.skills.melee).toBe(2);
    expect(ok({ kind: 'ring-bell', region: r0 })).toBe(true);
    expect(w.bellTick).toBe(w.tick);
    expect(ok({ kind: 'light-lantern', id: 'lamp-1' })).toBe(true);
    expect(w.lanterns['lamp-1']).toBe(true);
    expect(ok({ kind: 'build', piece: { kind: 'plank-wall', region: r0, x: 0, y: 0, z: 0, rotY: 0 } })).toBe(true);
    expect(ok({ kind: 'player-died', cause: DEATH_CAUSES[0], region: r0, carried: [{ def: ITEM, count: 2, condition: 1 }] })).toBe(true);
    expect(w.containers[`body-a-${w.tick}`].contents[0].count).toBe(2);
    expect(w.players.a.deaths).toBe(1);
    expect(ok({ kind: 'respawn', at: 'waystation', teacher: null })).toBe(true);
    expect(ok({ kind: 'player-leave' })).toBe(true);
    expect(w.players.a.online).toBe(false);
    expect(ok({ kind: 'player-join', name: 'A', look: '', userId: null, region: r0 })).toBe(true);
    expect(w.players.a.online).toBe(true);
  });

  it('refuses bad input without changing the world', () => {
    const { w, s } = setup();
    const before = hashWorld(w);
    expect(applyAction(w, s, env(w, 'ghost', { kind: 'player-leave' })).ok).toBe(false);
    expect(applyAction(w, s, env(w, 'a', { kind: 'open-container', id: 'nope' })).ok).toBe(false);
    expect(hashWorld(w)).toBe(before);
  });
});

describe('replay', () => {
  function script(w: WorldState): ActionEnvelope[] {
    const rids = w.graph.regions.map((r) => r.id);
    const cids = Object.keys(w.containers);
    const pick = <T,>(arr: readonly T[], i: number): T => arr[i % arr.length];
    const actions: { player: string; action: SimAction }[] = [
      { player: 'p1', action: { kind: 'player-join', name: 'One', look: '', userId: null, region: rids[0] } },
      { player: 'p2', action: { kind: 'player-join', name: 'Two', look: '', userId: null, region: rids[0] } },
      { player: 'p3', action: { kind: 'player-join', name: 'Three', look: '', userId: null, region: rids[1] } },
    ];
    for (let i = 3; actions.length < 30; i++) {
      const player = pick(['p1', 'p2', 'p3'], i);
      const region = pick(rids, i * 7);
      const kinds: SimAction[] = [
        { kind: 'noise', region, amount: 25 },
        { kind: 'enter-region', region, alive: i % 4 },
        { kind: 'open-container', id: pick(cids, i) },
        { kind: 'ring-bell', region },
        { kind: 'hatless-destroyed', region },
        { kind: 'set-skills', skills: { melee: i % 5 } },
        { kind: 'light-lantern', id: `lamp-${i % 3}` },
        { kind: 'player-leave' },
        { kind: 'player-join', name: player, look: '', userId: null, region },
      ];
      actions.push({ player, action: kinds[i % kinds.length] });
    }
    const total = 3 * w.tuning.clock.ticksPerDay;
    return actions.map((a, i) => ({ tick: Math.floor((i * total) / 30), seq: i, player: a.player, action: a.action }));
  }

  function run(w: WorldState, s: Streams, envs: ActionEnvelope[]): { hash: string; oks: boolean[] } {
    const end = 3 * w.tuning.clock.ticksPerDay;
    const oks: boolean[] = [];
    for (const e of envs) {
      while (w.tick < e.tick) tickWorld(w, s);
      oks.push(applyAction(w, s, e).ok);
    }
    let last = '';
    while (w.tick < end) last = tickWorld(w, s).hash;
    return { hash: last || hashWorld(w), oks };
  }

  it('gives equal hashes for two copies given the same envelopes over 3 days', () => {
    const { w, s } = setup(2024);
    const envs = script(w);
    const copyW: WorldState = structuredClone(w);
    const copyS = {} as Streams;
    for (const n of STREAM_NAMES) copyS[n as StreamName] = createRng(s[n as StreamName].state()) as Rng;

    const a = run(w, s, envs);
    const b = run(copyW, copyS, envs);
    expect(b.hash).toBe(a.hash);
    expect(b.oks).toEqual(a.oks);
    expect(a.oks.filter(Boolean).length).toBeGreaterThanOrEqual(5);
    expect(hashWorld(copyW)).toBe(hashWorld(w));
  });
});
