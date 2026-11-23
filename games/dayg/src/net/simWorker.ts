// Worker side of the sim host (roadmap 8.5). The worker holds its own copy of the world and streams and answers
// `tick` with the world JSON (without graph, tuning, tuningBase), the stream states and the TickResult. The handler is
// exported so tests can run it in the same thread through a fake WorkerLike.
import type { ActionEnvelope, TickResult, Tuning, WorldState } from '../sim/types';
import { STREAM_NAMES, type StreamName, type Streams } from '../sim/rng';
import { applyAction, tickWorld } from '../sim/actions';
import { restoreSnapshot } from './snapshot';
import type { Snapshot } from './protocol';

export type SimWorkerIn =
  | { t: 'init'; snap: Snapshot; tuning: Tuning }
  | { t: 'act'; env: ActionEnvelope }
  | { t: 'tick' };
export type SimWorkerOut = { t: 'ticked'; world: string; streams: Record<StreamName, number>; result: TickResult };

export function createWorkerHandler(post: (m: SimWorkerOut) => void): (data: unknown) => void {
  let world: WorldState | null = null;
  let streams: Streams | null = null;
  return (data: unknown): void => {
    const m = data as SimWorkerIn;
    if (m.t === 'init') {
      const r = restoreSnapshot(m.snap, m.tuning);
      world = r.world;
      streams = r.streams;
      return;
    }
    if (!world || !streams) return;
    if (m.t === 'act') {
      applyAction(world, streams, m.env);
      return;
    }
    if (m.t === 'tick') {
      const result = tickWorld(world, streams);
      const { graph: _graph, tuning: _tuning, tuningBase: _base, ...rest } = world;
      const states = {} as Record<StreamName, number>;
      for (const n of STREAM_NAMES) states[n] = streams[n].state();
      post({ t: 'ticked', world: JSON.stringify(rest), streams: states, result });
    }
  };
}

// In a browser module worker `self` is the worker scope; in Node (tests) it is not, so nothing is wired.
const scope = globalThis as unknown as { window?: unknown; postMessage?: (m: unknown) => void; onmessage: unknown };
if (typeof scope.window === 'undefined' && typeof scope.postMessage === 'function') {
  const handle = createWorkerHandler((m) => scope.postMessage?.(m));
  scope.onmessage = (e: { data: unknown }) => handle(e.data);
}
