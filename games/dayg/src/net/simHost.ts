// The sim host: the one place the game applies actions and ticks the world (roadmap 8.5). Solo and host sequence
// actions and ticks; a guest applies what the host sends and checks the hash of every tick. Solo and host may step the
// world in a Web Worker, so a frame never waits for the sim: the main-thread replica is replaced from the worker's
// copy after each tick, and actions sequenced while a tick is in flight are re-applied after it.
import type { ActionEnvelope, ActionResult, PlayerKey, SimAction, TickResult, WorldState } from '../sim/types';
import { createRng, STREAM_NAMES, type Streams } from '../sim/rng';
import { applyAction, tickWorld } from '../sim/actions';
import { hashWorld } from '../sim/world';
import type { SimHost, SimRole } from '../game/types';
import type { Snapshot } from './protocol';
import { makeSnapshot, replay, restoreSnapshot } from './snapshot';
import type { SimWorkerIn, SimWorkerOut } from './simWorker';

export interface WorkerLike {
  postMessage(m: unknown): void;
  onmessage: ((e: { data: unknown }) => void) | null;
  terminate(): void;
}

type Loose = Record<string, unknown>;

/** Replace a world's fields in place (the object stays the same); `keep` names the fields that stay as they are. */
function assignWorld(target: WorldState, source: object, keep: readonly string[]): void {
  const t = target as unknown as Loose;
  const src = source as Loose;
  for (const k of Object.keys(t)) if (!keep.includes(k) && !(k in src)) delete t[k];
  for (const k of Object.keys(src)) if (!keep.includes(k)) t[k] = src[k];
}

export function createSimHost(opts: {
  world: WorldState; streams: Streams; worker: boolean; me: PlayerKey; makeWorker?: () => WorkerLike;
}): SimHost {
  let role: SimRole = 'solo';
  let me: PlayerKey = opts.me;
  let outbox: ((a: SimAction) => void) | null = null;
  let maxSeq = -1;                         // highest envelope seq sequenced or received; the next one is maxSeq + 1
  let envLog: ActionEnvelope[] = [];
  const tickFns = new Set<(r: TickResult & { desync: boolean }) => void>();
  const actionFns = new Set<(env: ActionEnvelope, r: ActionResult) => void>();

  let worker: WorkerLike | null = null;
  let busy = false;                        // a worker tick is in flight
  let queued: ActionEnvelope[] = [];       // envelopes sequenced while busy: re-applied and sent after the tick

  const makeWorker = (): WorkerLike => opts.makeWorker
    ? opts.makeWorker()
    : new Worker(new URL('./simWorker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike;

  const stopWorker = (): void => {
    worker?.terminate();
    worker = null;
    busy = false;
    queued = [];
  };

  const onWorkerMessage = (w: WorkerLike, m: SimWorkerOut): void => {
    if (w !== worker || m.t !== 'ticked') return;
    busy = false;
    assignWorld(opts.world, JSON.parse(m.world) as object, ['graph', 'tuning', 'tuningBase']);
    for (const n of STREAM_NAMES) Object.assign(opts.streams[n], createRng(m.streams[n]));
    const pending = queued;
    queued = [];
    for (const env of pending) {
      applyAction(opts.world, opts.streams, env);
      w.postMessage({ t: 'act', env } satisfies SimWorkerIn);
    }
    for (const fn of tickFns) fn({ ...m.result, desync: false });
  };

  /** (Re)start the worker from the replica's current state. */
  const startWorker = (): void => {
    stopWorker();
    const w = makeWorker();
    worker = w;
    w.onmessage = (e) => onWorkerMessage(w, e.data as SimWorkerOut);
    w.postMessage({
      t: 'init', snap: makeSnapshot(opts.world, opts.streams, []), tuning: opts.world.tuningBase,
    } satisfies SimWorkerIn);
  };

  const runTick = (): void => {
    const r = tickWorld(opts.world, opts.streams);
    for (const fn of tickFns) fn({ ...r, desync: false });
  };

  const host: SimHost = {
    world: opts.world,
    streams: opts.streams,
    get role(): SimRole { return role; },
    get me(): PlayerKey { return me; },
    setRole(r: SimRole, who: PlayerKey): void {
      role = r;
      me = who;
      if (r === 'guest') stopWorker();
      else if (opts.worker && !worker) startWorker();
    },
    setOutbox(fn: ((a: SimAction) => void) | null): void { outbox = fn; },
    apply(a: SimAction): ActionResult | null {
      if (role === 'guest') { outbox?.(a); return null; }
      return host.applyFor(me, a);
    },
    applyFor(player: PlayerKey, a: SimAction): ActionResult {
      if (role === 'guest') throw new Error('a guest cannot sequence actions');
      // While a tick is in flight the action lands on the tick after it (the worker runs it after that tick).
      const env: ActionEnvelope = { tick: opts.world.tick + (busy ? 1 : 0), seq: ++maxSeq, player, action: a };
      const r = applyAction(opts.world, opts.streams, env);
      envLog.push(env);
      if (worker) {
        if (busy) queued.push(env);
        else worker.postMessage({ t: 'act', env } satisfies SimWorkerIn);
      }
      for (const fn of actionFns) fn(env, r);
      return r;
    },
    receive(env: ActionEnvelope): ActionResult {
      if (env.seq <= maxSeq) return { ok: false, error: 'seen' };
      maxSeq = env.seq;
      const r = applyAction(opts.world, opts.streams, env);
      envLog.push(env);
      for (const fn of actionFns) fn(env, r);
      return r;
    },
    update(sunHours: number): void {
      if (role === 'guest') return;
      while (Math.floor(sunHours) > opts.world.tick && !busy) {
        if (worker) {
          busy = true;
          worker.postMessage({ t: 'tick' } satisfies SimWorkerIn);
        } else {
          runTick();
        }
      }
    },
    receiveTick(tick: number, hash: string): void {
      const arrivals: TickResult['arrivals'] = [];
      let last: TickResult | null = null;
      while (opts.world.tick < tick) {
        last = tickWorld(opts.world, opts.streams);
        arrivals.push(...last.arrivals);
      }
      const h = last ? last.hash : hashWorld(opts.world);
      const desync = h !== hash;
      for (const fn of tickFns) fn({ tick: opts.world.tick, arrivals, hash: h, desync });
    },
    onTick(fn) { tickFns.add(fn); return () => { tickFns.delete(fn); }; },
    onAction(fn) { actionFns.add(fn); return () => { actionFns.delete(fn); }; },
    log(): readonly ActionEnvelope[] { return envLog; },
    snapshot(): Snapshot {
      const snap = makeSnapshot(opts.world, opts.streams, []);
      envLog = [];
      return snap;
    },
    load(s: Snapshot): void {
      const r = restoreSnapshot(s, opts.world.tuningBase);
      assignWorld(opts.world, r.world, ['graph', 'tuningBase']);
      for (const n of STREAM_NAMES) Object.assign(opts.streams[n], r.streams[n]);
      const toTick = s.log.reduce((m, e) => Math.max(m, e.tick), s.tick);
      replay(opts.world, opts.streams, s.log, toTick);
      envLog = s.log.slice();
      const lastSeq = s.log.length ? s.log[s.log.length - 1].seq : -1;
      maxSeq = Math.max(maxSeq, lastSeq);
      if (worker) startWorker();
      const h = hashWorld(opts.world);
      for (const fn of tickFns) fn({ tick: opts.world.tick, arrivals: [], hash: h, desync: false });
    },
    busy(): boolean { return busy; },
  };
  if (opts.worker) startWorker();
  return host;
}
