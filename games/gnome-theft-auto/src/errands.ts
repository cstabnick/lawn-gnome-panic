// Why an NPC driver is on the road: it has an errand (a real place from PLACES), a route to it along the road graph, and
// picks a new errand after a visit. Pure maths on the road graph, no three.js, so it is unit-tested headless.
import { PLACES, type Place } from './config';
import type { RoadNode, VehicleKind } from './types';

/** A driver's current errand: the place, and the nodes still to drive through (path[0] is the node it is heading for). */
export interface Errand {
  place: Place;
  /** Road node ids in driving order; the last one is the node nearest the place. */
  path: number[];
  /** Index into path of the node the driver is heading for now. */
  step: number;
}

/** The node nearest each place (nodes with no links are ignored). Computed once per world. */
export function placeNodes(nodes: readonly RoadNode[], places: readonly Place[] = PLACES): Map<string, number> {
  const out = new Map<string, number>();
  for (const p of places) {
    let best = -1;
    let bestD = Infinity;
    for (const n of nodes) {
      // Places are on the ground: never a skyway deck node (highways/roads.ts).
      if (n.links.length === 0 || n.deck !== undefined) continue;
      const d = Math.hypot(n.x - p.x, n.z - p.z);
      if (d < bestD) { bestD = d; best = n.id; }
    }
    if (best >= 0) out.set(p.id, best);
  }
  return out;
}

/** id -> node map per nodes array (the road graph never changes after the world is built). */
const nodeMaps = new WeakMap<readonly RoadNode[], Map<number, RoadNode>>();

function byIdFor(nodes: readonly RoadNode[]): Map<number, RoadNode> {
  let byId = nodeMaps.get(nodes);
  if (!byId) {
    byId = new Map<number, RoadNode>();
    for (const n of nodes) byId.set(n.id, n);
    nodeMaps.set(nodes, byId);
  }
  return byId;
}

/** Binary min-heap of [dist, id] pairs. */
type HeapItem = [number, number];

function heapPush(h: HeapItem[], item: HeapItem): void {
  h.push(item);
  let i = h.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (h[p][0] <= h[i][0]) break;
    [h[p], h[i]] = [h[i], h[p]];
    i = p;
  }
}

function heapPop(h: HeapItem[]): HeapItem | undefined {
  if (h.length === 0) return undefined;
  const top = h[0];
  const last = h.pop() as HeapItem;
  if (h.length > 0) {
    h[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && h[l][0] < h[m][0]) m = l;
      if (r < h.length && h[r][0] < h[m][0]) m = r;
      if (m === i) break;
      [h[m], h[i]] = [h[i], h[m]];
      i = m;
    }
  }
  return top;
}

/**
 * Shortest road route from `from` to `goal` (Dijkstra over the node graph, edge length = distance), as node ids starting
 * with `from`. `noBack` is a neighbour the first move may not go to (a driver does not U-turn on the spot) unless it is
 * the only way. Null when the goal cannot be reached.
 */
export function planRoute(nodes: readonly RoadNode[], from: number, goal: number, noBack?: number): number[] | null {
  if (from === goal) return [from];
  const byId = byIdFor(nodes);
  const start = byId.get(from);
  if (!start) return null;

  const run = (forbidden: number | undefined): number[] | null => {
    const dist = new Map<number, number>([[from, 0]]);
    const prev = new Map<number, number>();
    const open: HeapItem[] = [[0, from]];
    while (open.length > 0) {
      const [curD, cur] = heapPop(open) as HeapItem;
      if (curD > (dist.get(cur) ?? Infinity)) continue; // stale entry
      if (cur === goal) break;
      const n = byId.get(cur);
      if (!n) continue;
      for (const l of n.links) {
        if (cur === from && l === forbidden) continue;
        const m = byId.get(l);
        if (!m) continue;
        const nd = curD + Math.hypot(m.x - n.x, m.z - n.z);
        if (nd < (dist.get(l) ?? Infinity)) {
          dist.set(l, nd);
          prev.set(l, cur);
          heapPush(open, [nd, l]);
        }
      }
    }
    if (!prev.has(goal)) return null;
    const path = [goal];
    while (path[0] !== from) path.unshift(prev.get(path[0]) as number);
    return path;
  };

  return run(noBack) ?? run(undefined);
}

export interface ErrandWorld {
  nodes: readonly RoadNode[];
  /** place id -> node id, from placeNodes. */
  placeNode: ReadonlyMap<string, number>;
}

/** Kinds that never take a `far` errand: push-bikes, the bus, and the odd rides (too slow for the highways). */
const TOWN_ONLY: ReadonlySet<VehicleKind> = new Set<VehicleKind>([
  'push-bike', 'snail-coach', 'pot-rod', 'lawn-roller', 'teacup-trundler', 'barrow-buggy',
  // European rides (E29): city cars, kept to town errands.
  'deux-pots', 'wespa', 'baguette-trike', 'crepe-van',
]);

/** A place behind the driver is this much less likely to be picked as its next errand (places ahead keep their weight). */
export const ERRAND_BEHIND_WEIGHT = 0.3;

/**
 * A new errand for a driver of `kind` who is about to reach node `from` (having come from `came`, if known). Picks a place by
 * weight, never the one it is already at; push-bikes only go to places in town; places behind the driver are less likely.
 * `rand` is injectable for tests.
 */
export function pickErrand(w: ErrandWorld, kind: VehicleKind, from: number, came?: number, rand: () => number = Math.random): Errand | null {
  const fromNode = w.nodes.find((n) => n.id === from);
  if (!fromNode) return null;
  const cameNode = came === undefined ? undefined : w.nodes.find((n) => n.id === came);
  // Heading: the way the driver is moving (from - came). Without it, every place keeps its weight.
  const hx = cameNode ? fromNode.x - cameNode.x : 0;
  const hz = cameNode ? fromNode.z - cameNode.z : 0;
  const options = PLACES.filter((p) => {
    const id = w.placeNode.get(p.id);
    if (id === undefined || id === from) return false;
    if (p.far && TOWN_ONLY.has(kind)) return false;
    return true;
  });
  const weights = options.map((p) => {
    const behind = cameNode !== undefined && (p.x - fromNode.x) * hx + (p.z - fromNode.z) * hz < 0;
    return behind ? p.weight * ERRAND_BEHIND_WEIGHT : p.weight;
  });
  let total = 0;
  for (const wt of weights) total += wt;
  // Try a few picks: a place can be unreachable (a broken graph) or the same junction as the last one.
  for (let tries = 0; tries < 6 && total > 0; tries++) {
    let roll = rand() * total;
    let place = options[options.length - 1];
    for (let i = 0; i < options.length; i++) {
      roll -= weights[i];
      if (roll <= 0) { place = options[i]; break; }
    }
    const goal = w.placeNode.get(place.id);
    if (goal === undefined) continue;
    const path = planRoute(w.nodes, from, goal, came);
    if (path && path.length >= 1) return { place, path, step: 0 };
  }
  return null;
}

/** The place a driver is bound for, or null with no errand. */
export const errandReason = (e: Errand | null | undefined): string | null => (e ? e.place.reason : null);

/** City bus loop stops for the Snail-Coach transit coach. */
export const BUS_ROUTE_PLACES = ['downtown', 'gnomecino', 'hospital', 'clay-mart'] as const;

/** Pick the next Snail-Coach bus stop along the city loop: the stop after the one the bus is at, round the loop. */
export function pickBusErrand(w: ErrandWorld, from: number, came?: number): Errand | null {
  const n = BUS_ROUTE_PLACES.length;
  const here = BUS_ROUTE_PLACES.findIndex((id) => w.placeNode.get(id) === from);
  const start = here >= 0 ? here + 1 : 0;
  for (let k = 0; k < n; k++) {
    const stopId = BUS_ROUTE_PLACES[(start + k) % n];
    const goal = w.placeNode.get(stopId);
    if (goal !== undefined && goal !== from) {
      const place = PLACES.find((p) => p.id === stopId);
      const path = planRoute(w.nodes, from, goal, came);
      if (place && path && path.length >= 1) return { place, path, step: 0 };
    }
  }
  return pickErrand(w, 'snail-coach', from, came);
}

/** A fresh errand for a driver of `kind` heading for node `to` from node `from` (a new car, or the end of a visit): path[0] === to. */
export function freshErrand(w: ErrandWorld, kind: VehicleKind, to: number, from: number, rand: () => number = Math.random): Errand | null {
  return kind === 'snail-coach' ? pickBusErrand(w, to, from) : pickErrand(w, kind, to, from, rand);
}

/** Where a driver goes next after reaching a node: the errand it keeps (or its next one), the node to drive to, and the one after. */
export interface Leg { errand: Errand | null; to: number; next: number | null }

/**
 * A driver of `kind` reached node `arrive`, coming from node `came`. Steps its errand on (picking the next errand when the
 * route is used up) and returns the next segment. With no errand it takes a random link other than the one it came down,
 * and only turns back at a dead end. Shared by the live drivers (traffic.ts) and the off-screen ones (trafficSim.ts).
 */
export function nextLeg(
  w: ErrandWorld, kind: VehicleKind, errand: Errand | null, arrive: number, came: number, rand: () => number = Math.random,
): Leg {
  let e = errand;
  if (e) {
    e.step++;
    if (e.step >= e.path.length) {
      // Arrived without a visit (a re-routed driver): the next errand from here.
      e = kind === 'snail-coach' ? pickBusErrand(w, arrive, came) : pickErrand(w, kind, arrive, came, rand);
      if (e) e.step = 1;
    }
  }
  let to: number | undefined = e ? e.path[e.step] : undefined;
  if (to === undefined) {
    e = null;
    const node = byIdFor(w.nodes).get(arrive);
    const options = node ? node.links.filter((l) => l !== came) : [];
    to = options.length > 0 ? options[Math.floor(rand() * options.length)] : came;
  }
  const next = e && e.step + 1 < e.path.length ? e.path[e.step + 1] : null;
  return { errand: e, to, next };
}
