// Cracked gnomes stay where they fell: a body of clay pieces (the oldest are tidied away past MAX_BODIES). When the player
// is cracked, a Glaze Clinic ambulance also drives out along the roads, leaves the road for the last stretch, collects the
// player's body and drives off. Cosmetic: bodies and the van never block anything and never hurt anyone.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { Fx, RoadNode, World } from './types';
import { groundAt, heightAt } from './terrain';
import { nearestRoadNode, nodeY } from './highways/roads';

const SPEED = 15;
const TURN_RATE = 5;
const SCALE = 1.6;
const PILE_SCALE = 1.5;
const MAX_BODIES = 60;
/** The cracked-gnome patterns (prefab ids): one is picked at random for every body. */
const PATTERNS = ['gta-cracked-1', 'gta-cracked-2', 'gta-cracked-3', 'gta-cracked-4'] as const;
/** Seconds the pieces take to fly out and settle, and the longest stagger before a piece starts. */
const CRUMBLE_SECONDS = 0.75;
const CRUMBLE_STAGGER = 0.12;
const STOP_SHORT = 2.2;
const LOAD_SECONDS = 1.6;
const SPAWN_MIN = 35;
const SPAWN_MAX = 80;
const GONE_DISTANCE = 140;

/** One flying piece: its group node, where it ends up, where it starts, how it tumbles. */
interface Flier { node: THREE.Object3D; rest: THREE.Vector3; from: THREE.Vector3; lift: number; spin: THREE.Vector3; delay: number }
interface Crumble { fliers: Flier[]; t: number }

interface Pile { x: number; y: number; z: number; mesh: THREE.Object3D }
interface Rig {
  mesh: THREE.Object3D;
  siren: THREE.Object3D | undefined;
  x: number; y: number; z: number; yaw: number;
  /** Waypoints still to reach, then the pile, then (after loading) the way out. */
  path: { x: number; z: number }[];
  pile: Pile;
  phase: 'in' | 'load' | 'out';
  t: number;
  out: { x: number; z: number }[];
}

export interface Ambulances {
  /** A gnome cracked at (x, z): leave its body there (coat colour `coat`) and send an ambulance for it when `ambulance`. */
  dispatch(x: number, z: number, coat?: number, ambulance?: boolean, y?: number): void;
  update(dt: number, playerX: number, playerZ: number): void;
  /** Where each ambulance is right now (world sound plays their sirens). */
  sirens(): { x: number; z: number }[];
}

export function createAmbulances(scene: THREE.Scene, world: World, fx: Fx): Ambulances {
  const piles: Pile[] = [];
  const bodies: Pile[] = [];
  const rigs: Rig[] = [];
  const crumbles: Crumble[] = [];
  const byId = new Map<number, RoadNode>();
  for (const n of world.roads.nodes) byId.set(n.id, n);

  /**
   * A road node 35..80 from (x, z) at about the pile's height (within 3), else a ground node in that ring, else null
   * (the caller falls back to the end node).
   */
  function spawnNode(x: number, z: number, y: number): RoadNode | null {
    const ring: RoadNode[] = [];
    for (const n of world.roads.nodes) {
      if (n.links.length === 0) continue;
      const d = Math.hypot(n.x - x, n.z - z);
      if (d >= SPAWN_MIN && d <= SPAWN_MAX) ring.push(n);
    }
    const level = ring.filter((n) => Math.abs(nodeY(n) - y) < 3);
    if (level.length > 0) return level[Math.floor(Math.random() * level.length)];
    const ground = ring.filter((n) => n.deck === undefined);
    if (ground.length > 0) return ground[Math.floor(Math.random() * ground.length)];
    return null;
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
    sirens() {
      return rigs.map((r) => ({ x: r.x, z: r.z }));
    },
    dispatch(x: number, z: number, coat?: number, ambulance = false, y?: number): void {
      const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
      const mesh = buildPrefab(pattern, { scale: PILE_SCALE, ...(coat !== undefined ? { tint: coat } : {}) });
      // On a skyway deck (y given: the gnome's height) the pile lies on the deck top, not the street under it.
      const pileY = y === undefined ? heightAt(x, z) : groundAt(x, z, y + 0.3);
      mesh.position.set(x, pileY, z);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      if (Math.random() < 0.5) mesh.scale.x *= -1;
      scene.add(mesh);
      // Every piece (a named group p0, p1, ...) starts bunched at the torso and flies out to where it lies.
      const fliers: Flier[] = [];
      for (const node of mesh.children) {
        if (!/^p\d+$/.test(node.name)) continue;
        const rest = node.position.clone();
        const from = new THREE.Vector3(rest.x * 0.15, 0.55, rest.z * 0.15);
        const r = () => (Math.random() - 0.5) * 2;
        fliers.push({ node, rest, from, lift: 0.4 + Math.random() * 0.7, spin: new THREE.Vector3(r() * 7, r() * 7, r() * 7), delay: Math.random() * CRUMBLE_STAGGER });
        node.position.copy(from);
      }
      if (fliers.length > 0) crumbles.push({ fliers, t: 0 });
      const pile: Pile = { x, y: pileY, z, mesh };
      if (!ambulance) {
        bodies.push(pile);
        while (bodies.length > MAX_BODIES) {
          const old = bodies.shift();
          if (old) scene.remove(old.mesh);
        }
        return;
      }
      piles.push(pile);

      const end = nearestRoadNode(world.roads.nodes, x, z, pileY);
      if (!end) {
        // No roads: the pile is swept up on the next update.
        return;
      }
      const start = spawnNode(x, z, pileY) ?? end;
      const nodes = route(start, end);
      const path = nodes.map((n) => ({ x: n.x, z: n.z }));
      const body = buildPrefab('gta-ambulance', { scale: SCALE });
      const first = path[0];
      const startY = nodeY(start);
      body.position.set(first.x, startY, first.z);
      scene.add(body);
      rigs.push({
        mesh: body, siren: body.getObjectByName('siren') ?? undefined,
        x: first.x, y: startY, z: first.z, yaw: 0,
        path: [...path, { x, z }], pile, phase: 'in', t: 0,
        out: [...path].reverse(),
      });
    },

    update(dt: number, playerX: number, playerZ: number): void {
      for (const c of [...crumbles]) {
        c.t += dt;
        let allDone = true;
        for (const f of c.fliers) {
          const u = Math.min(1, Math.max(0, (c.t - f.delay) / CRUMBLE_SECONDS));
          if (u < 1) allDone = false;
          const e = 1 - (1 - u) ** 3;
          f.node.position.lerpVectors(f.from, f.rest, e);
          f.node.position.y += f.lift * 4 * u * (1 - u) * (1 - u * 0.4);
          const k = 1 - e;
          f.node.rotation.set(f.spin.x * k, f.spin.y * k, f.spin.z * k);
        }
        if (allDone) crumbles.splice(crumbles.indexOf(c), 1);
      }
      for (const r of [...rigs]) {
        r.t += dt;
        if (r.siren) r.siren.rotation.y += dt * 9;
        if (r.phase === 'load') {
          if (r.t >= LOAD_SECONDS) {
            fx.spark(r.pile.x, r.pile.y + 0.5, r.pile.z);
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
        r.y = groundAt(r.x, r.z, r.y + 0.3);
        r.mesh.position.set(r.x, r.y, r.z);
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
