// Off-screen traffic sim: lane geometry, ghost stepping (gaps, visits, junction turns), visibility and spot picking.
import { describe, expect, it } from 'vitest';
import { TRAFFIC } from './config';
import type { RoadNode } from './types';
import {
  createGhost, hiddenFromAll, inView, laneT, lanePose, pickSpot, placeGhost, roadLengthNear, segLength, simGraph,
  stepGhosts, targetPopulation, type Ghost, type Spot,
} from './trafficSim';

/** The 7x7 city grid (60 apart) plus a long spur out east, like the real road graph. */
function gridNodes(): RoadNode[] {
  const lines = [-180, -120, -60, 0, 60, 120, 180];
  const nodes: RoadNode[] = [];
  const at = (x: number, z: number): number => nodes.findIndex((n) => n.x === x && n.z === z);
  for (const x of lines) for (const z of lines) nodes.push({ id: nodes.length, x, z, links: [] });
  const link = (a: number, b: number): void => { nodes[a].links.push(b); nodes[b].links.push(a); };
  for (const x of lines) for (const z of lines) {
    if (x < 180) link(at(x, z), at(x + 60, z));
    if (z < 180) link(at(x, z), at(x, z + 60));
  }
  let prev = at(180, 0);
  for (const x of [240, 300, 374]) { nodes.push({ id: nodes.length, x, z: 0, links: [] }); link(prev, nodes.length - 1); prev = nodes.length - 1; }
  return nodes;
}

/** Deterministic random numbers in [0, 1) (mulberry32). */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = s;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const idAt = (nodes: readonly RoadNode[], x: number, z: number): number => nodes.find((n) => n.x === x && n.z === z)?.id ?? -1;

describe('lane geometry', () => {
  it('puts the lane on the right of the segment and projects back', () => {
    const nodes = gridNodes();
    const g = simGraph(nodes, 2.5);
    const from = idAt(nodes, 0, 0);
    const to = idAt(nodes, 0, 60);
    const pose = lanePose(g, from, to, 10);
    expect(pose.x).toBeCloseTo(-2.5);
    expect(pose.z).toBeCloseTo(10);
    expect(pose.yaw).toBeCloseTo(0);
    expect(laneT(g, from, to, pose.x, pose.z)).toBeCloseTo(10);
    expect(lanePose(g, from, to, 999).z).toBeCloseTo(60);
    expect(segLength(g, from, to)).toBeCloseTo(60);
  });

  it('lists each undirected segment once', () => {
    const nodes = gridNodes();
    const g = simGraph(nodes, 2.5);
    const keys = new Set(g.segs.map((s) => `${s.a}>${s.b}`));
    expect(keys.size).toBe(g.segs.length);
    for (const s of g.segs) expect(s.a).toBeLessThan(s.b);
    let linkSum = 0;
    for (const n of nodes) for (const l of n.links) {
      const m = nodes[l];
      linkSum += Math.hypot(m.x - n.x, m.z - n.z);
    }
    expect(roadLengthNear(g, 0, 0, 1e6)).toBeCloseTo(linkSum / 2);
  });
});

describe('ghost stepping', () => {
  it('keeps 30 ghosts moving, apart, and parking for visits over three minutes', () => {
    const nodes = gridNodes();
    const g = simGraph(nodes, 2.5);
    const rand = seeded(7);
    const spots: Spot[] = [];
    const ghosts: Ghost[] = [];
    for (let i = 0; i < 30; i++) {
      const spot = pickSpot(g, { x: 0, z: 0, minDist: 0, maxDist: 400, viewers: [], avoid: spots, clear: 10 }, rand);
      expect(spot).not.toBeNull();
      if (!spot) return;
      spots.push(spot);
      ghosts.push(createGhost(g, spot, 'ride-on', 0, 12, 6, rand));
    }

    const dt = 1 / 30;
    const covered = new Array<number>(ghosts.length).fill(0);
    const parked = new Array<boolean>(ghosts.length).fill(false);
    let passes = 0;
    let uturns = 0;
    for (let step = 1; step <= 180 * 30; step++) {
      const before = ghosts.map((gh) => ({ from: gh.from, to: gh.to }));
      stepGhosts(ghosts, dt, g, rand);
      ghosts.forEach((gh, i) => {
        covered[i] += gh.speed * dt;
        if (gh.dwellT > 0) parked[i] = true;
        if (gh.from !== before[i].from && (nodes[gh.from]?.links.length ?? 0) >= 2) {
          passes++;
          if (gh.to === before[i].from) uturns++;
        }
      });
      if (step % 30 === 0) {
        const moving = ghosts.filter((gh) => gh.dwellT === 0);
        for (let i = 0; i < moving.length; i++) {
          for (let j = i + 1; j < moving.length; j++) {
            const a = moving[i];
            const b = moving[j];
            const sameSeg = (a.from === b.from && a.to === b.to) || (a.from === b.to && a.to === b.from);
            if (!sameSeg) continue;
            expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThanOrEqual(TRAFFIC.ghostGap * 0.5 - 0.01);
          }
        }
      }
    }
    for (const c of covered) expect(c).toBeGreaterThan(300);
    expect(passes).toBeGreaterThan(0);
    expect(uturns / passes).toBeLessThan(0.03);
    expect(parked.filter(Boolean).length).toBeGreaterThanOrEqual(Math.ceil(ghosts.length * 0.7));
  });
});

describe('visibility and spots', () => {
  const facingNorth = { x: 0, z: 0, dirX: 0, dirZ: 1 };

  it('hides cars outside the view cone and beyond hideDistance', () => {
    expect(inView(facingNorth, 0, 100)).toBe(true);
    expect(inView(facingNorth, 0, -100)).toBe(false);
    expect(inView(facingNorth, 0, 450)).toBe(false);
    expect(inView(facingNorth, 0, -20)).toBe(true);
    expect(inView({ x: 0, z: 0, dirX: 0, dirZ: 0 }, 0, -100)).toBe(true);
  });

  it('picks only spots hidden from the viewer, within range', () => {
    const g = simGraph(gridNodes(), 2.5);
    const rand = seeded(11);
    let found = 0;
    for (let i = 0; i < 200; i++) {
      const spot = pickSpot(g, { x: 0, z: 0, minDist: 100, maxDist: 350, viewers: [facingNorth], avoid: [], clear: 0 }, rand);
      if (!spot) continue;
      found++;
      expect(hiddenFromAll([facingNorth], spot.x, spot.z)).toBe(true);
      const d = Math.hypot(spot.x, spot.z);
      expect(d).toBeGreaterThanOrEqual(100);
      expect(d).toBeLessThanOrEqual(350);
    }
    expect(found).toBeGreaterThan(0);
    const unknownFacing = { x: 0, z: 0, dirX: 0, dirZ: 0 };
    expect(pickSpot(g, { x: 0, z: 0, minDist: 100, maxDist: 350, viewers: [unknownFacing], avoid: [], clear: 0 }, rand)).toBeNull();
  });

  it('keeps the target population within the car limits, and the minimum far off the map', () => {
    const g = simGraph(gridNodes(), 2.5);
    const n = targetPopulation(g, 0, 0);
    expect(n).toBeGreaterThanOrEqual(TRAFFIC.minCars);
    expect(n).toBeLessThanOrEqual(TRAFFIC.maxCars);
    expect(targetPopulation(g, 5000, 0)).toBe(TRAFFIC.minCars);
  });

  it('placeGhost resets parking, live state, speed and the smoothed pose', () => {
    const nodes = gridNodes();
    const g = simGraph(nodes, 2.5);
    const rand = seeded(3);
    const first: Spot = { from: idAt(nodes, 0, 0), to: idAt(nodes, 0, 60), t: 10, x: -2.5, z: 10, yaw: 0 };
    const ghost = createGhost(g, first, 'push-bike', 0, 8, 4, rand);
    ghost.dwellT = 5;
    ghost.live = true;
    ghost.speed = 0;
    ghost.rx = 999;
    const next: Spot = { from: idAt(nodes, 60, 0), to: idAt(nodes, 120, 0), t: 20, x: 20 - 2.5, z: 0, yaw: Math.PI / 2 };
    placeGhost(g, ghost, next, rand);
    expect(ghost.dwellT).toBe(0);
    expect(ghost.live).toBe(false);
    expect(ghost.speed).toBe(8);
    expect(ghost.from).toBe(next.from);
    expect(ghost.rx).toBe(next.x);
    expect(ghost.rz).toBe(next.z);
    expect(ghost.ryaw).toBe(next.yaw);
  });
});
