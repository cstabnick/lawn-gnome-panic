// The sim host: the one place the game applies actions and ticks the world (roadmap 8.5). Step 0: the solo path works in-thread;
// snapshots and guest replay wait for roadmap 7.6 and 8.5.
import type { ActionEnvelope, ActionResult, PlayerKey, SimAction, TickResult, WorldState } from '../sim/types';
import type { Streams } from '../sim/rng';
import { applyAction, tickWorld } from '../sim/actions';
import type { SimHost, SimRole } from '../game/types';
import type { Snapshot } from './protocol';
import { makeSnapshot } from './snapshot';

export function createSimHost(opts: { world: WorldState; streams: Streams; worker: boolean; me: PlayerKey }): SimHost {
  let role: SimRole = 'solo';
  let me: PlayerKey = opts.me;
  let outbox: ((a: SimAction) => void) | null = null;
  let seq = 0;
  let envLog: ActionEnvelope[] = [];
  const tickFns = new Set<(r: TickResult & { desync: boolean }) => void>();
  const actionFns = new Set<(env: ActionEnvelope, r: ActionResult) => void>();

  const runTick = (): void => {
    const r = tickWorld(opts.world, opts.streams);
    for (const fn of tickFns) fn({ ...r, desync: false });
  };

  const host: SimHost = {
    world: opts.world,
    streams: opts.streams,
    get role(): SimRole { return role; },
    get me(): PlayerKey { return me; },
    setRole(r: SimRole, who: PlayerKey): void { role = r; me = who; },
    setOutbox(fn: ((a: SimAction) => void) | null): void { outbox = fn; },
    apply(a: SimAction): ActionResult | null {
      if (role === 'guest') { outbox?.(a); return null; }
      return host.applyFor(me, a);
    },
    applyFor(player: PlayerKey, a: SimAction): ActionResult {
      const env: ActionEnvelope = { tick: opts.world.tick, seq: seq++, player, action: a };
      const r = applyAction(opts.world, opts.streams, env);
      envLog.push(env);
      for (const fn of actionFns) fn(env, r);
      return r;
    },
    receive(env: ActionEnvelope): ActionResult {
      return applyAction(opts.world, opts.streams, env);
    },
    update(sunHours: number): void {
      while (Math.floor(sunHours) > opts.world.tick) runTick();
    },
    receiveTick(tick: number, hash: string): void { /* guest replay: roadmap 8.5 */ },
    onTick(fn) { tickFns.add(fn); return () => { tickFns.delete(fn); }; },
    onAction(fn) { actionFns.add(fn); return () => { actionFns.delete(fn); }; },
    log(): readonly ActionEnvelope[] { return envLog; },
    snapshot(): Snapshot {
      const snap = makeSnapshot(opts.world, opts.streams, envLog);
      envLog = [];
      return snap;
    },
    load(s: Snapshot): void { throw new Error('stub'); },
    busy(): boolean { return false; },
  };
  void opts.worker;
  return host;
}
