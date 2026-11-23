// Sim host tests (roadmap 8.5): solo sequencing, host and guest equality, desync detection, snapshot and load, hand-off,
// and worker mode run in the same thread through a fake WorkerLike.
import { describe, it, expect } from 'vitest';
import { createWorld, hashWorld } from '../sim/world';
import type { ActionEnvelope, ActionResult, RegionId, SimAction, TickResult, WorldState } from '../sim/types';
import type { Streams } from '../sim/rng';
import { createSimHost, type WorkerLike } from './simHost';
import { createWorkerHandler, type SimWorkerOut } from './simWorker';
import type { SimHost } from '../game/types';

const SEED = 7;

function newHost(seed: number, opts: { worker?: boolean; makeWorker?: () => WorkerLike; me?: string } = {}): {
  host: SimHost; world: WorldState; streams: Streams;
} {
  const { world, streams } = createWorld(seed);
  const host = createSimHost({ world, streams, worker: opts.worker ?? false, me: opts.me ?? 'g:a', makeWorker: opts.makeWorker });
  return { host, world, streams };
}

/** A deterministic action list: two players join, then they walk between regions. */
function actionAt(world: WorldState, i: number): SimAction {
  const regions = Object.keys(world.graph.byId);
  if (i === 0) return { kind: 'player-join', name: 'a', look: '', userId: null, region: null };
  if (i === 1) return { kind: 'player-join', name: 'b', look: '', userId: null, region: null };
  return { kind: 'enter-region', region: regions[i % regions.length] as RegionId, alive: 0 };
}

/** A worker that runs simWorker's handler in this thread, answering synchronously. */
function syncWorker(): WorkerLike {
  let onmsg: WorkerLike['onmessage'] = null;
  const handle = createWorkerHandler((m: SimWorkerOut) => onmsg?.({ data: m }));
  return {
    postMessage(m: unknown): void { handle(m); },
    get onmessage() { return onmsg; },
    set onmessage(f) { onmsg = f; },
    terminate(): void { /* nothing to stop */ },
  };
}

/** A worker whose replies wait in a queue until `flush()`, so a tick can be in flight. */
function queuedWorker(): WorkerLike & { flush(): void } {
  let onmsg: WorkerLike['onmessage'] = null;
  const replies: unknown[] = [];
  const handle = createWorkerHandler((m: SimWorkerOut) => replies.push(m));
  return {
    postMessage(m: unknown): void { handle(m); },
    get onmessage() { return onmsg; },
    set onmessage(f) { onmsg = f; },
    terminate(): void { /* nothing to stop */ },
    flush(): void { while (replies.length) onmsg?.({ data: replies.shift() }); },
  };
}

describe('sim host: solo', () => {
  it('sequences actions and logs them', () => {
    const { host, world } = newHost(SEED);
    const seen: ActionEnvelope[] = [];
    host.onAction((env) => seen.push(env));
    const r1 = host.apply(actionAt(world, 0)) as ActionResult;
    const r2 = host.apply(actionAt(world, 1)) as ActionResult;
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    expect(host.log().map((e) => e.seq)).toEqual([0, 1]);
    expect(seen.length).toBe(2);
    expect(host.log()[1].player).toBe('g:a');
  });

  it('ticks while the sun is past the world tick', () => {
    const { host } = newHost(SEED);
    const ticks: (TickResult & { desync: boolean })[] = [];
    host.onTick((r) => ticks.push(r));
    host.update(3.5);
    expect(ticks.map((t) => t.tick)).toEqual([1, 2, 3]);
    expect(ticks.every((t) => !t.desync)).toBe(true);
  });
});

describe('sim host: host and guest', () => {
  it('a guest fed the host envelopes and ticks stays equal through 20 actions and 48 ticks', () => {
    const a = newHost(SEED, { me: 'g:a' });
    const b = newHost(SEED, { me: 'g:b' });
    b.host.setRole('guest', 'g:b');
    a.host.setRole('host', 'g:a');
    const desyncs: boolean[] = [];
    a.host.onAction((env) => b.host.receive(env));
    b.host.onTick((r) => desyncs.push(r.desync));
    a.host.onTick((r) => b.host.receiveTick(r.tick, r.hash));
    for (let k = 0; k < 48; k++) {
      if (k < 20) a.host.apply(actionAt(a.world, k));
      a.host.update(k + 1);
    }
    expect(a.world.tick).toBe(48);
    expect(b.world.tick).toBe(48);
    expect(hashWorld(b.world)).toBe(hashWorld(a.world));
    expect(desyncs.some((d) => d)).toBe(false);
    expect(a.host.log().length).toBe(20);
  });

  it('a tampered guest world flags desync', () => {
    const a = newHost(SEED);
    const b = newHost(SEED);
    b.world.bellTick = (b.world.bellTick ?? 0) + 1;
    b.host.setRole('guest', 'g:b');
    a.host.setRole('host', 'g:a');
    const flags: boolean[] = [];
    b.host.onTick((r) => flags.push(r.desync));
    a.host.onTick((r) => b.host.receiveTick(r.tick, r.hash));
    a.host.update(2);
    expect(flags).toContain(true);
  });

  it('snapshot, then load and replay, equals the source', () => {
    const a = newHost(SEED);
    for (let k = 0; k < 10; k++) {
      if (k < 5) a.host.apply(actionAt(a.world, k));
      a.host.update(k + 1);
    }
    const snap = a.host.snapshot();
    expect(a.host.log().length).toBe(0);
    for (let k = 10; k < 30; k++) {
      if (k < 15) a.host.apply(actionAt(a.world, k));
      a.host.update(k + 1);
    }
    const log = a.host.log().slice();
    const b = newHost(SEED, { me: 'g:b' });
    b.host.setRole('guest', 'g:b');
    b.host.load({ ...snap, log });
    expect(b.world.tick).toBe(log[log.length - 1].tick);
    b.host.receiveTick(a.world.tick, hashWorld(a.world));
    expect(b.world.tick).toBe(30);
    expect(hashWorld(b.world)).toBe(hashWorld(a.world));
  });

  it('after hand-off the new host keeps sequencing from the highest seq it received', () => {
    const a = newHost(SEED);
    const b = newHost(SEED, { me: 'g:b' });
    b.host.setRole('guest', 'g:b');
    a.host.setRole('host', 'g:a');
    a.host.onAction((env) => b.host.receive(env));
    for (let k = 0; k < 5; k++) a.host.apply(actionAt(a.world, k));
    expect(b.host.log().map((e) => e.seq)).toEqual([0, 1, 2, 3, 4]);
    const sent: ActionEnvelope[] = [];
    b.host.onAction((env) => sent.push(env));
    b.host.setRole('host', 'g:b');
    b.host.apply({ kind: 'enter-region', region: null, alive: 0 });
    expect(sent[0].seq).toBe(5);
    expect(b.host.receive({ ...sent[0], seq: 5 })).toEqual({ ok: false, error: 'seen' });
  });
});

describe('sim host: worker mode', () => {
  it('a worker that runs the same handler in-thread gives the same hashes as in-thread mode', () => {
    const inThread = newHost(SEED);
    const viaWorker = newHost(SEED, { worker: true, makeWorker: syncWorker });
    const hashesA: string[] = [];
    const hashesB: string[] = [];
    inThread.host.onTick((r) => hashesA.push(r.hash));
    viaWorker.host.onTick((r) => hashesB.push(r.hash));
    for (let k = 0; k < 20; k++) {
      inThread.host.apply(actionAt(inThread.world, k));
      viaWorker.host.apply(actionAt(viaWorker.world, k));
      inThread.host.update(k + 1);
      viaWorker.host.update(k + 1);
    }
    expect(hashesB.length).toBe(20);
    expect(hashesB).toEqual(hashesA);
    expect(hashWorld(viaWorker.world)).toBe(hashWorld(inThread.world));
  });

  it('a tick in flight makes busy() true until the reply arrives', () => {
    const w = queuedWorker();
    const { host, world } = newHost(SEED, { worker: true, makeWorker: () => w });
    const ticks: number[] = [];
    host.onTick((r) => ticks.push(r.tick));
    host.update(1);
    expect(host.busy()).toBe(true);
    expect(world.tick).toBe(0);
    host.apply(actionAt(world, 0));
    w.flush();
    expect(host.busy()).toBe(false);
    expect(world.tick).toBe(1);
    expect(ticks).toEqual([1]);
  });
});
