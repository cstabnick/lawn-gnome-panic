// E33: the mountain roads in the road graph (traffic, police and the GPS read world.roads). Every route of kind 'road'
// adds ground nodes along its centre line and joins both ends to the highway it starts on. Pure: no three.js, no DOM.
import type { RoadGraph, RoadNode } from '../types';
import { routesOfKind, ROUTES } from './routes';

/** A ground end must join a band road whose centre line passes within this of the end point. */
const JOIN_REACH = 4;
/** A join reuses an existing node closer than this to the projected point. */
const SNAP = 6;

function project(x: number, z: number, ax: number, az: number, bx: number, bz: number): { x: number; z: number; d: number } {
  const vx = bx - ax, vz = bz - az;
  const l2 = vx * vx + vz * vz || 1e-9;
  const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / l2));
  const px = ax + vx * t, pz = az + vz * t;
  return { x: px, z: pz, d: Math.hypot(x - px, z - pz) };
}

/** Add every 'road' mountain route to a built road graph (highways/install.ts calls it once, after the skyways). */
export function addMountainRoads(graph: RoadGraph): void {
  const nodes = graph.nodes;
  const add = (x: number, z: number): RoadNode => {
    const n: RoadNode = { id: nodes.length, x, z, links: [] };
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
  const isGround = (n: RoadNode): boolean => n.deck === undefined && n.ring === undefined;

  /**
   * The graph node an end of a route joins at (x, z). Splits the nearest ground edge when no node is close enough.
   * Returns the node the route's end must link to.
   */
  const joinEnd = (id: string, which: 'start' | 'end', x: number, z: number): RoadNode => {
    let edge: [RoadNode, RoadNode] | null = null;
    let to = { x, z };
    let bestD = JOIN_REACH;
    for (const a of nodes) {
      if (!isGround(a)) continue;
      for (const l of a.links) {
        const b = nodes[l];
        if (!b || !isGround(b) || b.id < a.id) continue;
        const q = project(x, z, a.x, a.z, b.x, b.z);
        if (q.d < bestD) { bestD = q.d; edge = [a, b]; to = { x: q.x, z: q.z }; }
      }
    }
    if (!edge) throw new Error(`mountain road '${id}': no band road within ${JOIN_REACH} m of its ${which}`);
    const [a, b] = edge;
    if (Math.hypot(a.x - to.x, a.z - to.z) < SNAP) return a;
    if (Math.hypot(b.x - to.x, b.z - to.z) < SNAP) return b;
    const join = add(to.x, to.z);
    unlink(a, b);
    link(a, join);
    link(join, b);
    return join;
  };

  for (const id of routesOfKind('road')) {
    const track = ROUTES[id];
    const S = track.samples();
    if (S.length < 2) continue;
    const last = S.length - 1;

    // The step from a node: 5 m while the next 10 m bends, else 12 m.
    const stepFrom = (k: number): number => {
      for (let j = k; j <= last && S[j].s - S[k].s <= 10; j++) if (Math.abs(S[j].curv) > 0.03) return 5;
      return 12;
    };
    const idx = [0];
    let k = 0;
    for (;;) {
      const step = stepFrom(k);
      let j = k + 1;
      while (j <= last && S[j].s - S[k].s < step - 1e-9) j++;
      if (j > last) break;
      idx.push(j);
      k = j;
    }
    if (idx[idx.length - 1] !== last) {
      if (S[last].s - S[idx[idx.length - 1]].s < 1 && idx.length > 1) idx[idx.length - 1] = last;
      else idx.push(last);
    }

    const startJoin = joinEnd(id, 'start', S[0].x, S[0].z);
    const endJoin = joinEnd(id, 'end', S[last].x, S[last].z);

    // The route's nodes are the last run added (the joins above were added first).
    const run: RoadNode[] = idx.map((i) => add(S[i].x, S[i].z));
    for (let i = 1; i < run.length; i++) link(run[i - 1], run[i]);
    link(run[0], startJoin);
    link(run[run.length - 1], endJoin);
  }
}
