// The skyways in the road graph (docs/roadmaps/gta-skyway-traffic-gps.md). Pure: no three.js, no DOM.
//
// world.roads is 2D (RoadNode x, z). A road-kind skyway (skyways.ts kind 'road') adds its own nodes on top, marked with
// `deck` = the skyway id: a node at every control point and junction, and more so no link is longer than 40 m. A ramp
// foot (a point with h 0) is linked to the ground road it comes down beside (a new node splits that road's edge), and a
// branch's junction node is shared with its parent. Stunt and site decks (the Unfinished Span, the plank ramps) and the
// cracks are never in the graph.
//
// Levels: a ground node's height is the land (heightAt); a deck node's is its deck top. Everything that puts something
// on a road, or picks "the nearest node", must use nodeY / roadY / nearestRoadNode instead of heightAt and a 2D search,
// or a car meant for the deck ends up on the street under it. A node with no `deck` is a ground node, so any road added
// later (another region's roads) is ground level with no extra work.
import { HIGHWAYS } from '../config';
import { groundAt, heightAt } from '../terrain';
import type { RoadGraph, RoadNode } from '../types';
import { deckContactsAt, deckSamples, skywayDefs, skywayLength } from './deck';
import { kindOf, type SkywayDef } from './skyways';

/** No deck link is longer than this. */
const MAX_LINK = 40;
/** A ramp foot links to a ground road whose centre line passes within this of the point just past the foot. */
const FOOT_REACH = 30;
/** How far past the foot that point is. */
const FOOT_AHEAD = 10;
/** A foot's ground node reuses an existing node closer than this to the split point. */
const SNAP = 6;

/** True for a node on a skyway deck. */
export function isDeckNode(n: RoadNode): boolean {
  return n.deck !== undefined;
}

/** A node's height: the deck top for a deck node, the land for a ground node. */
export function nodeY(n: RoadNode): number {
  return n.deck !== undefined ? groundAt(n.x, n.z) : heightAt(n.x, n.z);
}

/**
 * Ground height at (x, z) for something driving the link a -> b: the land on a ground link (exactly heightAt, as
 * before), else the level-aware ground near the link's own height there (deck top on a deck link, the ramp on a foot).
 */
export function roadY(a: RoadNode, b: RoadNode, x: number, z: number): number {
  if (a.deck === undefined && b.deck === undefined) return heightAt(x, z);
  const dx = b.x - a.x, dz = b.z - a.z;
  const l2 = dx * dx + dz * dz;
  const t = l2 > 1e-9 ? Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2)) : 0;
  const ref = nodeY(a) + (nodeY(b) - nodeY(a)) * t;
  return groundAt(x, z, ref + 1);
}

/**
 * The road node nearest (x, z) on the level of height y: the 2D distance plus 4x the height gap, so a car on the deck
 * gets a deck node and one under it a ground node. With y omitted, ground nodes only (when there are any): every
 * caller that does not know a height is placing something on the ground. Nodes with no links are skipped. Null when
 * there is none.
 */
export function nearestRoadNode(nodes: readonly RoadNode[], x: number, z: number, y?: number): RoadNode | null {
  let best: RoadNode | null = null;
  let bestD = Infinity;
  for (const n of nodes) {
    if (n.links.length === 0) continue;
    if (y === undefined && n.deck !== undefined) continue;
    let d = Math.hypot(n.x - x, n.z - z);
    if (y !== undefined) d += Math.abs(nodeY(n) - y) * 4;
    if (d < bestD) { bestD = d; best = n; }
  }
  return best;
}

/** A ramp foot's link to the ground road it comes down beside: `foot` on the deck, `to` on the road centre line. */
export interface FootConnector { skyway: string; foot: { x: number; z: number }; to: { x: number; z: number } }

function project(x: number, z: number, ax: number, az: number, bx: number, bz: number): { x: number; z: number; d: number } {
  const vx = bx - ax, vz = bz - az;
  const l2 = vx * vx + vz * vz || 1e-9;
  const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / l2));
  const px = ax + vx * t, pz = az + vz * t;
  return { x: px, z: pz, d: Math.hypot(x - px, z - pz) };
}

/** Every road-kind ramp foot and the highway point it joins (the nearest centre-line point to just past the foot). */
export function footConnectors(): FootConnector[] {
  const out: FootConnector[] = [];
  for (const def of skywayDefs()) {
    if (kindOf(def) !== 'road') continue;
    const s = deckSamples(def.id);
    const ends = [
      { pt: def.points[0], p: s[0], sign: -1 },
      { pt: def.points[def.points.length - 1], p: s[s.length - 1], sign: 1 },
    ];
    for (const { pt, p, sign } of ends) {
      if (pt.on || pt.h !== 0) continue;
      const ax = p.x + sign * p.dirX * FOOT_AHEAD;
      const az = p.z + sign * p.dirZ * FOOT_AHEAD;
      let best: { x: number; z: number; d: number } | null = null;
      for (const h of HIGHWAYS) {
        for (let i = 0; i + 1 < h.points.length; i++) {
          const q = project(ax, az, h.points[i][0], h.points[i][1], h.points[i + 1][0], h.points[i + 1][1]);
          if (!best || q.d < best.d) best = q;
        }
      }
      if (best && best.d <= FOOT_REACH) out.push({ skyway: def.id, foot: { x: p.x, z: p.z }, to: { x: best.x, z: best.z } });
    }
  }
  return out;
}

/** Centre-line distances where a road skyway needs a node: its control points, its branches' junctions, and fill-ins. */
function nodeAlongs(def: SkywayDef): number[] {
  const s = deckSamples(def.id, 1000);
  const at = new Set<number>(s.map((p) => Math.round(p.along * 100) / 100));
  for (const child of skywayDefs()) {
    if (kindOf(child) !== 'road') continue;
    for (const pt of [child.points[0], child.points[child.points.length - 1]]) {
      if (pt.on !== def.id) continue;
      const c = deckContactsAt(pt.x, pt.z).find((q) => q.skyway.id === def.id);
      if (c) at.add(Math.round(c.along * 100) / 100);
    }
  }
  const sorted = [...at].sort((a, b) => a - b);
  const out: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const gap = sorted[i] - sorted[i - 1];
      const n = Math.ceil(gap / MAX_LINK);
      for (let k = 1; k < n; k++) out.push(sorted[i - 1] + (gap * k) / n);
    }
    out.push(sorted[i]);
  }
  return out;
}

/** The point `along` metres down a skyway's centre line. */
function pointAlong(id: string, along: number): { x: number; z: number } {
  const len = skywayLength(id);
  const a = Math.max(0, Math.min(len, along));
  // deckSamples with a step bigger than any leg returns exactly the control points; walk them.
  const s = deckSamples(id, 1e6);
  for (let i = 0; i + 1 < s.length; i++) {
    if (a <= s[i + 1].along + 1e-9) {
      const span = s[i + 1].along - s[i].along || 1e-9;
      const t = (a - s[i].along) / span;
      return { x: s[i].x + (s[i + 1].x - s[i].x) * t, z: s[i].z + (s[i + 1].z - s[i].z) * t };
    }
  }
  const last = s[s.length - 1];
  return { x: last.x, z: last.z };
}

/**
 * Add every road skyway to a built road graph (installSkyways calls it once, before traffic and the rest are made):
 * deck nodes linked along each deck, branches sharing their junction node with the parent, and each ramp foot linked to
 * the ground road it meets (splitting that road's edge). Appends nodes (id = index) and edits links in place; existing
 * node ids never change.
 */
export function addSkywayRoads(graph: RoadGraph): void {
  const nodes = graph.nodes;
  const ground = nodes.filter((n) => n.deck === undefined);
  const add = (x: number, z: number, deck?: string): RoadNode => {
    const n: RoadNode = deck === undefined ? { id: nodes.length, x, z, links: [] } : { id: nodes.length, x, z, links: [], deck };
    nodes.push(n);
    return n;
  };
  const link = (a: RoadNode, b: RoadNode): void => {
    if (a === b) return;
    if (!a.links.includes(b.id)) a.links.push(b.id);
    if (!b.links.includes(a.id)) b.links.push(a.id);
  };
  const unlink = (a: RoadNode, b: RoadNode): void => {
    a.links = a.links.filter((l) => l !== b.id);
    b.links = b.links.filter((l) => l !== a.id);
  };
  /** Deck nodes per skyway, in order along it, with their along. */
  const chains = new Map<string, { along: number; node: RoadNode }[]>();
  const nodeOn = (id: string, x: number, z: number): RoadNode | null => {
    const chain = chains.get(id);
    if (!chain) return null;
    let best: RoadNode | null = null;
    let bestD = Infinity;
    for (const c of chain) {
      const d = Math.hypot(c.node.x - x, c.node.z - z);
      if (d < bestD) { bestD = d; best = c.node; }
    }
    return bestD < 0.5 ? best : null;
  };

  for (const def of skywayDefs()) {
    if (kindOf(def) !== 'road') continue;
    const chain: { along: number; node: RoadNode }[] = [];
    for (const along of nodeAlongs(def)) {
      const p = pointAlong(def.id, along);
      // A junction point on a parent deck reuses the parent's node there.
      const first = along < 1e-6 && def.points[0].on ? nodeOn(def.points[0].on, p.x, p.z) : null;
      const lastPt = def.points[def.points.length - 1];
      const last = Math.abs(along - skywayLength(def.id)) < 1e-6 && lastPt.on ? nodeOn(lastPt.on, p.x, p.z) : null;
      const node = first ?? last ?? add(p.x, p.z, def.id);
      if (chain.length > 0) link(chain[chain.length - 1].node, node);
      chain.push({ along, node });
    }
    chains.set(def.id, chain);
  }

  // Ramp feet onto the ground roads.
  for (const c of footConnectors()) {
    const foot = nodeOn(c.skyway, c.foot.x, c.foot.z);
    if (!foot) continue;
    // The ground edge the join point lies on.
    let edge: [RoadNode, RoadNode] | null = null;
    let bestD = 0.75;
    for (const a of ground) {
      for (const l of a.links) {
        const b = nodes[l];
        if (!b || b.deck !== undefined || b.id < a.id) continue;
        const q = project(c.to.x, c.to.z, a.x, a.z, b.x, b.z);
        if (q.d < bestD) { bestD = q.d; edge = [a, b]; }
      }
    }
    if (!edge) continue;
    const [a, b] = edge;
    let join: RoadNode;
    if (Math.hypot(a.x - c.to.x, a.z - c.to.z) < SNAP) join = a;
    else if (Math.hypot(b.x - c.to.x, b.z - c.to.z) < SNAP) join = b;
    else {
      join = add(c.to.x, c.to.z);
      unlink(a, b);
      link(a, join);
      link(join, b);
      ground.push(join);
    }
    link(foot, join);
  }
}
