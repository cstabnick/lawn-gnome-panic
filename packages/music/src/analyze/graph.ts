/**
 * Static / topology audio-graph linter for @lawn/music SongBuilders.
 * Instruments Tone.js node construction and .connect() / .fan() calls in pure Node
 * (no WebAudio context required) to catch routing anti-patterns such as:
 *   - Sending stereo-widened / panned / chorused signals into Reverb
 *   - Excessive StereoWidener width (> 0.7 cuts mid and boosts side)
 *   - Reverb without a high-pass filter
 */
import type * as ToneNS from 'tone';
import type { Keep, SongBuilder, Tone } from '../engine';
import type { MixIssue } from './dsp';

export interface GraphNodeInfo {
  id: number;
  kind: string;
  opts: unknown[];
}

export interface GraphEdge {
  from: number;
  to: number;
}

export interface GraphReport {
  ok: boolean;
  nodeCount: number;
  edgeCount: number;
  stereoIntoReverbPaths: string[][];
  issues: MixIssue[];
}

const STEREO_KINDS = new Set(['StereoWidener', 'Chorus', 'AutoPanner', 'Panner', 'Phaser']);

function isHighpassFilter(node: GraphNodeInfo): boolean {
  if (node.kind !== 'Filter') return false;
  const [arg0, arg1] = node.opts;
  if (arg1 === 'highpass') return true;
  if (arg0 && typeof arg0 === 'object' && (arg0 as { type?: string }).type === 'highpass') return true;
  return false;
}

function stereoWidenerWidth(node: GraphNodeInfo): number | null {
  if (node.kind !== 'StereoWidener') return null;
  const [arg0] = node.opts;
  if (typeof arg0 === 'number') return arg0;
  if (arg0 && typeof arg0 === 'object' && typeof (arg0 as { width?: number }).width === 'number') {
    return (arg0 as { width: number }).width;
  }
  return 0.5;
}

function reverbWet(node: GraphNodeInfo): number {
  const [arg0] = node.opts;
  if (arg0 && typeof arg0 === 'object' && typeof (arg0 as { wet?: number }).wet === 'number') {
    return (arg0 as { wet: number }).wet;
  }
  return 1;
}

/**
 * Runs a SongBuilder against an instrumented Tone proxy and checks the resulting
 * audio graph for routing issues.
 */
export function lintSongGraph(build: SongBuilder): GraphReport {
  const nodes: GraphNodeInfo[] = [];
  const edges: GraphEdge[] = [];
  const nodeIdSym = Symbol('nodeId');

  const makeParamProxy = (): unknown => {
    const fn = () => undefined;
    return new Proxy(fn, {
      get(_t, prop) {
        if (prop === 'value') return 0;
        if (prop === 'connect' || prop === 'fan') return () => makeParamProxy();
        return (..._args: unknown[]) => makeParamProxy();
      },
      set() { return true; },
    });
  };

  const makeNodeProxy = (kind: string, opts: unknown[]): unknown => {
    const id = nodes.length;
    nodes.push({ id, kind, opts });

    const self: Record<PropertyKey, unknown> = {
      [nodeIdSym]: id,
      maxPolyphony: 16,
      volume: makeParamProxy(),
      frequency: makeParamProxy(),
      Q: makeParamProxy(),
      gain: makeParamProxy(),
      detune: makeParamProxy(),
      playbackRate: makeParamProxy(),
      connect(dest: unknown) {
        const destId = dest && typeof dest === 'object' ? (dest as Record<PropertyKey, unknown>)[nodeIdSym] : undefined;
        if (typeof destId === 'number') edges.push({ from: id, to: destId });
        return proxy;
      },
      fan(...dests: unknown[]) {
        for (const d of dests) {
          const destId = d && typeof d === 'object' ? (d as Record<PropertyKey, unknown>)[nodeIdSym] : undefined;
          if (typeof destId === 'number') edges.push({ from: id, to: destId });
        }
        return proxy;
      },
      toDestination() { return proxy; },
      start() { return proxy; },
      stop() { return proxy; },
      dispose() { return proxy; },
      sync() { return proxy; },
    };

    const proxy: unknown = new Proxy(self, {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop === 'symbol') return undefined;
        return makeParamProxy();
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
    });
    return proxy;
  };

  const timeObj = (val: unknown) => ({
    toSeconds: () => {
      if (typeof val === 'number') return val;
      if (val === '16n') return 0.09;
      if (val === '8n') return 0.18;
      if (val === '8n.') return 0.27;
      if (val === '4n') return 0.36;
      if (val === '4n.') return 0.54;
      if (val === '2n') return 0.72;
      if (val === '1m') return 1.44;
      return 0.25;
    },
    toMilliseconds: () => 250,
    toBarsBeatsSixteenths: () => '0:0:0',
  });

  const transport = {
    bpm: { value: 120, rampTo: () => undefined },
    swing: 0,
    swingSubdivision: '16n',
    start: () => undefined,
    stop: () => undefined,
    pause: () => undefined,
    cancel: () => undefined,
    schedule: () => 0,
    scheduleRepeat: () => 0,
    clear: () => undefined,
  };

  const toneProxy = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'getTransport') return () => transport;
      if (prop === 'getContext') return () => ({ state: 'running', currentTime: 0, rawContext: {} });
      if (prop === 'Time') return timeObj;
      if (prop === 'Frequency') return (v: unknown) => ({ toFrequency: () => (typeof v === 'number' ? v : 440), toMidi: () => 60, toNote: () => 'C4' });
      if (prop === 'Midi') return (v: unknown) => ({ toFrequency: () => 440, toNote: () => 'C4', toMidi: () => (typeof v === 'number' ? v : 60) });
      if (prop === 'now') return () => 0;
      if (prop === 'start') return () => Promise.resolve();
      if (typeof prop === 'string' && /^[A-Z]/.test(prop)) {
        const kind = prop;
        return class {
          constructor(...args: unknown[]) {
            return makeNodeProxy(kind, args) as object;
          }
        };
      }
      return () => undefined;
    },
  }) as unknown as Tone;

  const keep: Keep = (x) => x;
  const out = makeNodeProxy('MasterOut', []) as ToneNS.Volume;
  build(toneProxy, keep, out);

  // Build adjacency lists
  const adj = new Map<number, number[]>();
  const revAdj = new Map<number, number[]>();
  for (const e of edges) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push(e.to);
    if (!revAdj.has(e.to)) revAdj.set(e.to, []);
    revAdj.get(e.to)!.push(e.from);
  }

  const issues: MixIssue[] = [];
  const stereoIntoReverbPaths: string[][] = [];

  // 1. Check stereo nodes feeding into Reverb
  const reverbIds = new Set(nodes.filter((n) => n.kind === 'Reverb').map((n) => n.id));
  for (const node of nodes) {
    if (!STEREO_KINDS.has(node.kind)) continue;
    // BFS from this stereo node to any Reverb
    const visited = new Set<number>([node.id]);
    const parent = new Map<number, number>();
    const queue = [node.id];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (reverbIds.has(cur)) {
        const path: string[] = [];
        let p: number | undefined = cur;
        while (p !== undefined) {
          path.unshift(`${nodes[p].kind}#${p}`);
          p = parent.get(p);
        }
        stereoIntoReverbPaths.push(path);
        break;
      }
      for (const next of adj.get(cur) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          parent.set(next, cur);
          queue.push(next);
        }
      }
    }
  }

  if (stereoIntoReverbPaths.length > 0) {
    for (const p of stereoIntoReverbPaths) {
      issues.push({
        severity: 'error',
        code: 'stereo-into-reverb',
        message: `Stereo processor feeds into Reverb (${p.join(' -> ')}); send mono to Reverb and apply stereo after`,
      });
    }
  }

  // 2. Check StereoWidener widths
  for (const node of nodes) {
    const w = stereoWidenerWidth(node);
    if (w === null) continue;
    if (w > 0.7) {
      issues.push({
        severity: 'error',
        code: 'excessive-stereo-width',
        message: `StereoWidener#${node.id} width=${w} (> 0.7) cuts mid energy and over-boosts side`,
      });
    } else if (w > 0.65) {
      issues.push({
        severity: 'warn',
        code: 'wide-stereo',
        message: `StereoWidener#${node.id} width=${w} is quite wide (> 0.65)`,
      });
    }
  }

  // 3. Check Reverb has a high-pass filter upstream or downstream
  for (const revId of reverbIds) {
    const checkSide = (start: number, graph: Map<number, number[]>): boolean => {
      const seen = new Set<number>([start]);
      const q = [start];
      while (q.length > 0) {
        const cur = q.shift()!;
        if (cur !== revId && isHighpassFilter(nodes[cur])) return true;
        for (const nxt of graph.get(cur) ?? []) {
          if (!seen.has(nxt)) {
            seen.add(nxt);
            q.push(nxt);
          }
        }
      }
      return false;
    };
    const hasHp = checkSide(revId, adj) || checkSide(revId, revAdj);
    if (!hasHp && reverbWet(nodes[revId]) > 0.1) {
      issues.push({
        severity: 'warn',
        code: 'reverb-missing-highpass',
        message: `Reverb#${revId} has no high-pass filter on its input or return; low frequencies may muddy the tail`,
      });
    }
  }

  return {
    ok: issues.every((i) => i.severity !== 'error'),
    nodeCount: nodes.length,
    edgeCount: edges.length,
    stereoIntoReverbPaths,
    issues,
  };
}
