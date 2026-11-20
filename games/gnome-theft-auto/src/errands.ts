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
      if (n.links.length === 0) continue;
      const d = Math.hypot(n.x - p.x, n.z - p.z);
      if (d < bestD) { bestD = d; best = n.id; }
    }
    if (best >= 0) out.set(p.id, best);
  }
  return out;
}

/**
 * Shortest road route from `from` to `goal` (Dijkstra over the node graph, edge length = distance), as node ids starting
 * with `from`. `noBack` is a neighbour the first move may not go to (a driver does not U-turn on the spot) unless it is
 * the only way. Null when the goal cannot be reached.
 */
export function planRoute(nodes: readonly RoadNode[], from: number, goal: number, noBack?: number): number[] | null {
  if (from === goal) return [from];
  const byId = new Map<number, RoadNode>();
  for (const n of nodes) byId.set(n.id, n);
  const start = byId.get(from);
  if (!start) return null;

  const run = (forbidden: number | undefined): number[] | null => {
    const dist = new Map<number, number>([[from, 0]]);
    const prev = new Map<number, number>();
    const open = new Set<number>([from]);
    while (open.size > 0) {
      let cur = -1;
      let curD = Infinity;
      for (const id of open) {
        const d = dist.get(id) ?? Infinity;
        if (d < curD) { curD = d; cur = id; }
      }
      open.delete(cur);
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
          open.add(l);
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

/**
 * A new errand for a driver of `kind` who is about to reach node `from` (having come from `came`, if known). Picks a place by
 * weight, never the one it is already at; push-bikes only go to places in town. `rand` is injectable for tests.
 */
export function pickErrand(w: ErrandWorld, kind: VehicleKind, from: number, came?: number, rand: () => number = Math.random): Errand | null {
  const fromNode = w.nodes.find((n) => n.id === from);
  if (!fromNode) return null;
  const options = PLACES.filter((p) => {
    const id = w.placeNode.get(p.id);
    if (id === undefined || id === from) return false;
    if (p.far && kind === 'push-bike') return false;
    return true;
  });
  let total = 0;
  for (const p of options) total += p.weight;
  // Try a few picks: a place can be unreachable (a broken graph) or the same junction as the last one.
  for (let tries = 0; tries < 6 && total > 0; tries++) {
    let roll = rand() * total;
    let place = options[options.length - 1];
    for (const p of options) {
      roll -= p.weight;
      if (roll <= 0) { place = p; break; }
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
