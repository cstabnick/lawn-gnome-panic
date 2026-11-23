// The HUD's route to a waypoint along the road graph (world.roads). Pure: plain data in, a polyline out.
import type { RoadGraph, RoadNode } from './types';

export interface Pt { x: number; z: number }

/** Below this straight-line distance the route is just the straight line. */
export const ROUTE_DIRECT = 60;

const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.z - b.z);

function nearest(nodes: RoadNode[], p: Pt): RoadNode {
  let best = nodes[0];
  let bestD = Infinity;
  for (const n of nodes) {
    const d = dist(n, p);
    if (d < bestD) { bestD = d; best = n; }
  }
  return best;
}

/** A* over the road links. Returns the node path start..goal, or null when they are not connected. */
function astar(byId: Map<number, RoadNode>, start: RoadNode, goal: RoadNode): RoadNode[] | null {
  if (start.id === goal.id) return [start];
  const g = new Map<number, number>([[start.id, 0]]);
  const came = new Map<number, number>();
  const closed = new Set<number>();
  const open: number[] = [start.id];
  const inOpen = new Set<number>([start.id]);

  while (open.length > 0) {
    let bi = 0;
    let bestF = Infinity;
    for (let i = 0; i < open.length; i++) {
      const n = byId.get(open[i])!;
      const f = g.get(open[i])! + dist(n, goal);
      if (f < bestF) { bestF = f; bi = i; }
    }
    const cur = open[bi];
    open.splice(bi, 1);
    inOpen.delete(cur);

    if (cur === goal.id) {
      const ids = [cur];
      let c = cur;
      while (came.has(c)) { c = came.get(c)!; ids.push(c); }
      ids.reverse();
      return ids.map((id) => byId.get(id)!);
    }

    closed.add(cur);
    const cn = byId.get(cur)!;
    for (const nid of cn.links) {
      const nb = byId.get(nid);
      if (!nb || closed.has(nid)) continue;
      const ng = g.get(cur)! + dist(cn, nb);
      if (ng < (g.get(nid) ?? Infinity)) {
        g.set(nid, ng);
        came.set(nid, cur);
        if (!inOpen.has(nid)) { inOpen.add(nid); open.push(nid); }
      }
    }
  }
  return null;
}

/**
 * A route from `from` to `to` along the roads: [from, ...road nodes, to]. Falls back to the straight line [from, to]
 * when the graph is empty, the two points are close (ROUTE_DIRECT units), or no road path joins them.
 */
export function roadRoute(graph: RoadGraph, from: Pt, to: Pt): Pt[] {
  const direct: Pt[] = [{ x: from.x, z: from.z }, { x: to.x, z: to.z }];
  const nodes = graph.nodes;
  if (nodes.length === 0 || dist(from, to) < ROUTE_DIRECT) return direct;

  const a = nearest(nodes, from);
  const b = nearest(nodes, to);
  // Walking to the road and back off it costs more than going straight: no road helps.
  if (dist(from, a) + dist(b, to) > dist(from, to)) return direct;

  const byId = new Map<number, RoadNode>(nodes.map((n) => [n.id, n] as const));
  let path = astar(byId, a, b);
  if (!path) return direct;

  // Drop road nodes the player has already passed, so the line does not double back.
  if (path.length >= 2 && dist(from, path[1]) < dist(a, path[1])) path = path.slice(1);
  if (path.length >= 2) {
    const last = path[path.length - 1];
    const prev = path[path.length - 2];
    if (dist(to, prev) < dist(last, prev)) path = path.slice(0, -1);
  }

  return [
    { x: from.x, z: from.z },
    ...path.map((n) => ({ x: n.x, z: n.z })),
    { x: to.x, z: to.z },
  ];
}
