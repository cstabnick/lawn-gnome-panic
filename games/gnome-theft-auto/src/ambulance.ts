// Glaze Clinic ambulances: every cracked gnome leaves a pile of clay shards, and an ambulance drives out along the roads,
// leaves the road for the last stretch, collects the pile and drives back off. Cosmetic: the pile and the van never block
// anything and never hurt anyone.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { Fx, RoadNode, World } from './types';

const SPEED = 15;
const TURN_RATE = 5;
const SCALE = 1.6;
const PILE_SCALE = 1.3;
const MAX_PILES = 8;
const STOP_SHORT = 2.2;
const LOAD_SECONDS = 1.6;
const SPAWN_MIN = 35;
const SPAWN_MAX = 80;
const GONE_DISTANCE = 140;

interface Pile { x: number; z: number; mesh: THREE.Object3D }
interface Rig {
  mesh: THREE.Object3D;
  siren: THREE.Object3D | undefined;
  x: number; z: number; yaw: number;
  /** Waypoints still to reach, then the pile, then (after loading) the way out. */
  path: { x: number; z: number }[];
  pile: Pile;
  phase: 'in' | 'load' | 'out';
  t: number;
  out: { x: number; z: number }[];
}

export interface Ambulances {
  /** A gnome cracked at (x, z): leave shards there and send an ambulance for them. */
  dispatch(x: number, z: number): void;
  update(dt: number, playerX: number, playerZ: number): void;
}

export function createAmbulances(scene: THREE.Scene, world: World, fx: Fx): Ambulances {
  const piles: Pile[] = [];
  const rigs: Rig[] = [];
  const byId = new Map<number, RoadNode>();
  for (const n of world.roads.nodes) byId.set(n.id, n);

  function nearestNode(x: number, z: number): RoadNode | null {
    let best: RoadNode | null = null;
    let bd = Infinity;
    for (const n of world.roads.nodes) {
      if (n.links.length === 0) continue;
      const d = Math.hypot(n.x - x, n.z - z);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  /** A road node 35..80 from (x, z), else the farthest-but-near one; null when the world has no roads. */
  function spawnNode(x: number, z: number): RoadNode | null {
    const ring: RoadNode[] = [];
    for (const n of world.roads.nodes) {
      if (n.links.length === 0) continue;
      const d = Math.hypot(n.x - x, n.z - z);
      if (d >= SPAWN_MIN && d <= SPAWN_MAX) ring.push(n);
    }
    if (ring.length > 0) return ring[Math.floor(Math.random() * ring.length)];
    return nearestNode(x, z);
  }

  /** Breadth-first road path from node a to node b (inclusive); just [a] when none is found. */
  function route(a: RoadNode, b: RoadNode): RoadNode[] {
    const prev = new Map<number, number>();
    const q = [a.id];
    prev.set(a.id, -1);
    for (let i = 0; i < q.length && !prev.has(b.id); i++) {
      const cur = byId.get(q[i]);
      if (!cur) continue;
      for (const l of cur.links) {
        if (!prev.has(l)) {
          prev.set(l, cur.id);
          q.push(l);
        }
      }
    }
    if (!prev.has(b.id)) return [a];
    const out: RoadNode[] = [];
    for (let id = b.id; id !== -1; id = prev.get(id) ?? -1) {
      const n = byId.get(id);
      if (n) out.push(n);
    }
    return out.reverse();
  }

  function removePile(p: Pile): void {
    scene.remove(p.mesh);
    const i = piles.indexOf(p);
    if (i >= 0) piles.splice(i, 1);
  }

  function removeRig(r: Rig): void {
    scene.remove(r.mesh);
    const i = rigs.indexOf(r);
    if (i >= 0) rigs.splice(i, 1);
  }

  return {
    dispatch(x: number, z: number): void {
      const mesh = buildPrefab('gta-clay-pile', { scale: PILE_SCALE });
      mesh.position.set(x, 0, z);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      scene.add(mesh);
      const pile: Pile = { x, z, mesh };
      piles.push(pile);
      // Too many piles: the oldest is tidied away at once.
      while (piles.length > MAX_PILES) {
        const old = piles[0];
        const r = rigs.find((g) => g.pile === old);
        if (r) removeRig(r);
        removePile(old);
      }

      const start = spawnNode(x, z);
      const end = nearestNode(x, z);
      if (!start || !end) {
        // No roads: the pile is swept up on the next update.
        return;
      }
      const nodes = route(start, end);
      const path = nodes.map((n) => ({ x: n.x, z: n.z }));
      const body = buildPrefab('gta-ambulance', { scale: SCALE });
      const first = path[0];
      body.position.set(first.x, 0, first.z);
      scene.add(body);
      rigs.push({
        mesh: body, siren: body.getObjectByName('siren') ?? undefined,
        x: first.x, z: first.z, yaw: 0,
        path: [...path, { x, z }], pile, phase: 'in', t: 0,
        out: [...path].reverse(),
      });
    },

    update(dt: number, playerX: number, playerZ: number): void {
      for (const r of [...rigs]) {
        r.t += dt;
        if (r.siren) r.siren.rotation.y += dt * 9;
        if (r.phase === 'load') {
          if (r.t >= LOAD_SECONDS) {
            fx.spark(r.pile.x, 0.5, r.pile.z);
            removePile(r.pile);
            r.phase = 'out';
            r.path = r.out;
          }
          continue;
        }
        const wp = r.path[0];
        if (!wp) {
          if (r.phase === 'in') {
            r.phase = 'load';
            r.t = 0;
          } else {
            removeRig(r);
          }
          continue;
        }
        const dx = wp.x - r.x;
        const dz = wp.z - r.z;
        const d = Math.hypot(dx, dz);
        const isPile = r.phase === 'in' && r.path.length === 1;
        const stopAt = isPile ? STOP_SHORT : 0.8;
        if (d <= stopAt) {
          r.path.shift();
          continue;
        }
        const want = Math.atan2(dx, dz);
        let diff = want - r.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        r.yaw += Math.max(-TURN_RATE * dt, Math.min(TURN_RATE * dt, diff));
        const step = Math.min(SPEED * dt, d - stopAt + 0.01);
        r.x += Math.sin(r.yaw) * step;
        r.z += Math.cos(r.yaw) * step;
        r.mesh.position.set(r.x, 0, r.z);
        r.mesh.rotation.y = r.yaw;
        // Far behind the player and leaving: tidy up.
        if (r.phase === 'out' && Math.hypot(r.x - playerX, r.z - playerZ) > GONE_DISTANCE) removeRig(r);
      }
      // A pile that nobody is coming for (its van was tidied away) is swept up.
      for (const p of [...piles]) {
        if (!rigs.some((g) => g.pile === p)) removePile(p);
      }
    },
  };
}
