// Snapshot, replay and interest tests (roadmap 7.6). Pure: no DOM.
import { describe, it, expect } from 'vitest';
import { createRng } from '../sim/rng';
import { TUNING, withOverrides } from '../sim/tuning';
import { createWorld, hashWorld, runDays } from '../sim/world';
import { applyAction, tickWorld } from '../sim/actions';
import type { ActionEnvelope, PlayerRecord, WorldState } from '../sim/types';
import { makeSnapshot, restoreSnapshot, packSnapshot, unpackSnapshot, toBase64, fromBase64, chunk, replay, tuningHash } from './snapshot';
import { interestedPlayers, bubbleViewers, newsSince, regionSummary } from './interest';

const join = (tick: number, seq: number, player: string, region: string): ActionEnvelope => ({
  tick, seq, player,
  action: { kind: 'player-join', name: player, look: '', userId: null, region } as ActionEnvelope['action'],
});

function rec(key: string, region: string | null, online: boolean): PlayerRecord {
  return {
    key, name: key, look: '', userId: null, region, online, joinedTick: 0, lastTick: 0, acorns: 0, faction: null,
    notoriety: 0, quests: [], done: 0, failed: 0, deaths: 0, skills: {}, bed: null,
  } as unknown as PlayerRecord;
}

describe('snapshots', () => {
  it('restore of a 2-day slice world keeps the hash, and both copies stay equal after 1 more day', () => {
    const { world: w, streams: s } = createWorld(21);
    runDays(w, s, 2);
    const snap = makeSnapshot(w, s, []);
    const r = restoreSnapshot(snap);
    expect(hashWorld(r.world)).toBe(snap.hash);
    expect(hashWorld(r.world)).toBe(hashWorld(w));
    runDays(w, s, 1);
    runDays(r.world, r.streams, 1);
    expect(hashWorld(r.world)).toBe(hashWorld(w));
  });

  it('pack and unpack round trip', async () => {
    const { world: w, streams: s } = createWorld(3);
    runDays(w, s, 1);
    const snap = makeSnapshot(w, s, [join(0, 1, 'g:1', 'leaning-rows')]);
    const bytes = await packSnapshot(snap);
    expect(await unpackSnapshot(bytes)).toEqual(snap);
  });

  it('base64 round trip of random bytes, including lengths not divisible by 3', () => {
    const rng = createRng(99);
    for (const len of [0, 1, 2, 3, 4, 5, 7, 100, 1001, 40001]) {
      const b = new Uint8Array(len);
      for (let i = 0; i < len; i++) b[i] = rng.int(0, 255);
      expect(Array.from(fromBase64(toBase64(b)))).toEqual(Array.from(b));
    }
  });

  it('chunk and join round trip', () => {
    const text = 'abcdefghij'.repeat(37);
    const parts = chunk(text, 64);
    expect(parts.every((p) => p.length <= 64)).toBe(true);
    expect(parts.join('')).toBe(text);
  });

  it('replay of a recorded log from a snapshot equals the original world hash', () => {
    const log = [join(0, 1, 'g:1', 'leaning-rows'), join(3, 2, 'g:2', 'leaning-rows')];
    const { world: orig, streams: so } = createWorld(5);
    replay(orig, so, log, 6);

    const { world: w0, streams: s0 } = createWorld(5);
    const snap = makeSnapshot(w0, s0, log);
    const r = restoreSnapshot(snap);
    replay(r.world, r.streams, snap.log, 6);
    expect(r.world.tick).toBe(6);
    expect(hashWorld(r.world)).toBe(hashWorld(orig));
    expect(Object.keys(orig.players).sort()).toEqual(['g:1', 'g:2']);
  });

  it('a tuning mismatch throws', () => {
    const { world: w, streams: s } = createWorld(4);
    const snap = makeSnapshot(w, s, []);
    const other = withOverrides(TUNING, { horde: { threatNorm: 12345 } });
    expect(tuningHash(other)).not.toBe(snap.tuningHash);
    expect(() => restoreSnapshot(snap, other)).toThrow('tuning mismatch');
  });

  it('a 30-day slice snapshot packs under 4 MiB, and a full-map one is logged', async () => {
    const slice = createWorld(7);
    runDays(slice.world, slice.streams, 30);
    const sliceBytes = await packSnapshot(makeSnapshot(slice.world, slice.streams, []));
    console.log(`slice 30-day snapshot: ${sliceBytes.length} bytes packed`);
    expect(sliceBytes.length).toBeLessThan(4 * 1024 * 1024);

    const full = createWorld(7, TUNING, undefined, { map: 'full' });
    runDays(full.world, full.streams, 30);
    const fullBytes = await packSnapshot(makeSnapshot(full.world, full.streams, []));
    console.log(`full-map 30-day snapshot: ${fullBytes.length} bytes packed`);
  }, 120000);
});

describe('interest', () => {
  function withPlayers(w: WorldState, players: Record<string, PlayerRecord>): WorldState {
    w.players = players;
    return w;
  }

  it('interestedPlayers: online players in my region or a neighbour, excluding me, sorted', () => {
    const { world: w } = createWorld(1);
    const mine = 'leaning-rows';
    const nb = w.graph.neighbours[mine][0].to;
    const far = w.graph.regions.find((r) => r.id !== mine && !w.graph.neighbours[mine].some((n) => n.to === r.id))!.id;
    withPlayers(w, {
      'g:me': rec('g:me', mine, true),
      'g:b': rec('g:b', nb, true),
      'g:a': rec('g:a', mine, true),
      'g:off': rec('g:off', nb, false),
      'g:far': rec('g:far', far, true),
      'g:none': rec('g:none', null, true),
    });
    expect(interestedPlayers(w, 'g:me')).toEqual(['g:a', 'g:b']);
    const farNear = new Set<string>([far, ...w.graph.neighbours[far].map((n) => n.to)]);
    expect(interestedPlayers(w, 'g:far')).toEqual(['g:a', 'g:b', 'g:me'].filter((k) => farNear.has(w.players[k].region!)));
    w.players['g:me'].region = null;
    expect(interestedPlayers(w, 'g:me')).toEqual([]);
  });

  it('bubbleViewers, newsSince and regionSummary read the world', () => {
    const { world: w } = createWorld(2);
    w.bubbles = [{ owner: 'g:o', region: 'leaning-rows', hatless: 3, viewers: ['g:v1', 'g:v2'] }];
    expect(bubbleViewers(w, 'g:o')).toEqual(['g:v1', 'g:v2']);
    expect(bubbleViewers(w, 'g:x')).toEqual([]);
    w.chronicle = Array.from({ length: 25 }, (_, i) => ({ tick: i, text: `line ${i}` }));
    expect(newsSince(w, 20)).toEqual(['line 20', 'line 21', 'line 22', 'line 23', 'line 24']);
    expect(newsSince(w, 0)).toHaveLength(20);
    const sum = regionSummary(w, 'leaning-rows');
    expect(sum.region).toBe('leaning-rows');
    expect(sum.hatless).toBeGreaterThanOrEqual(3);
    expect([0, 1, 2, 3]).toContain(sum.danger);
  });
});

describe('stepping helpers', () => {
  it('applyAction and tickWorld advance a world by one tick', () => {
    const { world: w, streams: s } = createWorld(8);
    applyAction(w, s, join(0, 1, 'g:1', 'leaning-rows'));
    const t = tickWorld(w, s);
    expect(t.tick).toBe(1);
    expect(t.hash).toBe(hashWorld(w));
  });
});
