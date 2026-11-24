// The HUD's route to a waypoint along the road graph (world.roads). Pure: plain data in, a polyline out.
import type { HudRoute, RoadGraph, RoadNode } from './types';
import { isDeckNode, nearestRoadNode } from './highways/roads';
import { deckContactsAt } from './highways/deck';
import { heightAt } from './terrain';

/** A point; y (optional) is the height the route starts at, so a car on a skyway deck starts on the deck. */
export interface Pt { x: number; z: number; y?: number }

/** One route point. `level` is what the stretch from this point to the next is (unset = ordinary ground). */
export type RoutePt = HudRoute['points'][number];
type Level = RoutePt['level'];

/** Below this straight-line distance the route is just the straight line. */
export const ROUTE_DIRECT = 60;

/** Ground stretches are sampled every STEP metres to find the underpasses. */
const STEP = 4;
/** A deck this far above the land at a point makes that point an underpass ('under'). */
const UNDER_GAP = 2.5;

const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.z - b.z);

/** True when a skyway deck passes this far above the land at (x, z): the route runs beneath it. */
function isUnder(x: number, z: number): boolean {
  const contacts = deckContactsAt(x, z);
  if (contacts.length === 0) return false;
  const land = heightAt(x, z);
  return contacts.some((c) => c.surfaceY > land + UNDER_GAP);
}

/**
 * Appends a ground stretch a -> b. Its first point (a) is always appended; a step point is added wherever the
 * level changes, so every stretch has one level.
 */
function groundStretch(a: Pt, b: Pt, out: RoutePt[]): void {
  const n = Math.max(1, Math.ceil(dist(a, b) / STEP));
  let prev: Level;
  for (let k = 0; k < n; k++) {
    const x = a.x + ((b.x - a.x) * k) / n;
    const z = a.z + ((b.z - a.z) * k) / n;
    const level: Level = isUnder(x, z) ? 'under' : undefined;
    if (k === 0 || level !== prev) out.push(level ? { x, z, level } : { x, z });
    prev = level;
  }
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
export function roadRoute(graph: RoadGraph, from: Pt, to: Pt): RoutePt[] {
  const direct: RoutePt[] = [{ x: from.x, z: from.z }, { x: to.x, z: to.z }];
  const nodes = graph.nodes;
  if (nodes.length === 0 || dist(from, to) < ROUTE_DIRECT) return direct;

  // The start may be up on a deck (from.y), the goal is on the ground.
  const a = nearestRoadNode(nodes, from.x, from.z, from.y);
  const b = nearestRoadNode(nodes, to.x, to.z);
  if (!a || !b) return direct;
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

  // The leg from a raised start is on the deck; any other stretch between two deck nodes is on the deck; the rest
  // is ground, walked for underpasses.
  const elevated = from.y !== undefined && from.y > heightAt(from.x, from.z) + UNDER_GAP;
  const seq: { p: Pt; deck: boolean }[] = [
    { p: from, deck: elevated },
    ...path.map((n) => ({ p: n, deck: isDeckNode(n) })),
    { p: to, deck: false },
  ];
  const out: RoutePt[] = [];
  for (let i = 0; i < seq.length - 1; i++) {
    const { p } = seq[i];
    const { p: q, deck: qDeck } = seq[i + 1];
    const onDeck = i === 0 ? elevated : seq[i].deck && qDeck;
    if (onDeck) out.push({ x: p.x, z: p.z, level: 'deck' });
    else groundStretch(p, q, out);
  }
  out.push({ x: to.x, z: to.z });
  return out;
}
