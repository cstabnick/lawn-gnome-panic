// Individual Hatless (L0), issue 3.6. Each one is a makeGnome(hatlessLook(seed), { hatless: true }) model; no separate model.
// Rules: docs/design/dayg/hatless.md, "One Hatless, up close (L0)" and "Height".
import * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import { GNOME_HEIGHT, HATLESS, HATLESS_STEP, INTERIOR } from '../config';
import type { Bus } from '../game/bus';
import type { HatlessSystem, PlayerState, Vec3 } from '../game/types';
import { REGIONS } from '../sim/regions';
import type { RegionId } from '../sim/types';
import type { SpotDef } from '../world/types';
import type { Collider } from '../world/collide';
import type { BuildingIndex } from '../world/spaces';
import { hatlessLook, makeGnome } from './gnomes';

export interface HatlessDeps {
  scene: THREE.Scene;
  collider: Collider;
  bus: Bus;
  getPlayer: () => PlayerState;
  coarse: boolean;
  /** Optional: when given, Hatless route through doors and stairs, and cannot see across walls. */
  index?: BuildingIndex;
}

type Mode = 'idle' | 'drawn' | 'hunting' | 'stagger' | 'crumble';
interface XZ { x: number; z: number }
interface Pending { region: RegionId; count: number; spots: readonly SpotDef[]; from?: XZ }

interface Hatless {
  model: GnomeModel;
  pos: THREE.Vector3;          // feet
  vel: THREE.Vector3;
  facing: number;
  baseScale: number;
  mode: Mode;
  staggerBack: Mode;
  staggerLeft: number;
  hp: number;
  lastSeen: XZ;                // where the player was last seen (or the gather point while reaching)
  drawnTo: XZ | null;
  unseen: number;              // seconds hunting without seeing the player
  lungeLeft: number;
  lungeCool: number;
  scratchT: number;
  reaching: boolean;           // hunting from below a player who is out of reach: arms up
  swayT: number;
  crumbleT: number;
  fx: THREE.Group | null;
  fxMats: THREE.Material[];
}

const LUNGE_COOLDOWN = 3;      // seconds between lunges
const REACH_HEIGHT_MAX = 4;    // gm: a reaching Hatless gathers within this distance of the player's feet
const DRAWN_REACHED = 1;       // gm: a drawn Hatless arrives at the noise within this distance
const SEPARATION = 0.6;        // gm: Hatless keep this far apart
const KNOCKBACK = 1;           // gm
const SCRATCH_HEIGHT = 1.2;    // gm: the player's feet must be this close above the Hatless to be scratched
const SWAY_SPEED = 0.9;
const SWAY_ANGLE = 0.04;
const CRUMBLE_SECONDS = 1;
const ARMS_UP = -2.4;          // shoulder swing for the reaching pose (rad)
const DUST = 0x9a9286;
const CLAY = 0x8a7a66;

let shardGeo: THREE.BoxGeometry | null = null;

const clampTo = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const wrapAngle = (a: number): number => {
  let r = a;
  while (r > Math.PI) r -= 2 * Math.PI;
  while (r < -Math.PI) r += 2 * Math.PI;
  return r;
};

function debugCount(): number {
  try {
    if (typeof location === 'undefined') return 0;
    return Math.max(0, Math.floor(Number(new URLSearchParams(location.search).get('hatless')) || 0));
  } catch {
    return 0;
  }
}

/** Grey dust puff plus clay shards where a Hatless crumbled. Returns the group and its fading materials. */
function makeDust(at: THREE.Vector3): { group: THREE.Group; mats: THREE.Material[] } {
  const group = new THREE.Group();
  group.position.copy(at);
  const n = 16;
  const positions = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 0.8;
    positions[i * 3 + 1] = 0.6 + Math.random() * 1.1;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMat = new THREE.PointsMaterial({ color: DUST, size: 0.16, transparent: true, depthWrite: false });
  group.add(new THREE.Points(geo, dustMat));
  const mats: THREE.Material[] = [dustMat];
  shardGeo ??= new THREE.BoxGeometry(0.12, 0.05, 0.1);
  for (let i = 0; i < 4; i++) {
    const m = new THREE.MeshStandardMaterial({ color: CLAY, roughness: 1, transparent: true });
    const shard = new THREE.Mesh(shardGeo, m);
    const a = (i / 4) * Math.PI * 2;
    shard.position.set(Math.cos(a) * 0.5, 0.05, Math.sin(a) * 0.5);
    shard.rotation.y = Math.random() * Math.PI;
    group.add(shard);
    mats.push(m);
  }
  return { group, mats };
}

function disposeModel(model: GnomeModel): void {
  model.object.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.geometry.dispose();
    const list = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of list) m.dispose();
  });
}

function disposeFx(group: THREE.Group): void {
  group.traverse((o) => {
    if (o instanceof THREE.Points) o.geometry.dispose();
    if (o instanceof THREE.Points || o instanceof THREE.Mesh) {
      const list = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of list) m.dispose();
    }
  });
}

export function createHatlessSystem(deps: HatlessDeps): HatlessSystem {
  const { scene, collider, bus, getPlayer, coarse, index } = deps;
  const all: Hatless[] = [];
  const pending: Pending[] = [];
  const out: Vec3 = { x: 0, y: 0, z: 0 };
  let debugLeft = debugCount();

  // Hearing: a Hatless within the noise's radius that is not already hunting is drawn to it.
  // Noise from inside a building reaches a Hatless in a different space muffled.
  bus.on('noise', (e) => {
    const noiseIn = index?.insideAt(e.x, NaN, e.z)?.def.id ?? null;
    for (const h of all) {
      if (h.mode !== 'idle' && h.mode !== 'drawn') continue;
      let radius = e.radius;
      if (index) {
        const hatlessIn = index.insideAt(h.pos.x, h.pos.y, h.pos.z)?.def.id ?? null;
        if (noiseIn !== hatlessIn) radius *= INTERIOR.muffle;
      }
      if (Math.hypot(h.pos.x - e.x, h.pos.z - e.z) > radius) continue;
      h.mode = 'drawn';
      h.drawnTo = { x: e.x, z: e.z };
    }
  });

  const budget = (): number => (coarse ? HATLESS.maxL0Phone : HATLESS.maxL0Desktop);
  const visibleCount = (): number => {
    let n = 0;
    for (const h of all) if (h.mode !== 'crumble') n++;
    return n;
  };
  const heldBack = (): number => {
    let n = 0;
    for (const r of pending) n += r.count;
    return n;
  };

  /** Collider-checked move in xz; keeps the feet on whatever is under the new spot. Returns the id that blocked it, or null. */
  const moveBy = (h: Hatless, dx: number, dz: number): string | null => {
    const id = collider.move(h.pos, dx, dz, HATLESS.radius, GNOME_HEIGHT, HATLESS_STEP, out);
    h.pos.x = out.x;
    h.pos.z = out.z;
    h.pos.y = collider.groundAt(h.pos.x, h.pos.z, h.pos.y);
    return id;
  };

  /** Walks toward (tx, tz) at speed, turning to face it. Velocity is kept for the walk animation.
   *  ty is the target's height (NaN when unknown); with a building index the walk follows its waypoints. */
  const walk = (h: Hatless, tx0: number, tz0: number, speed: number, dt: number, ty = NaN): string | null => {
    const wp = index?.nextWaypoint(h.pos, { x: tx0, y: ty, z: tz0 }) ?? null;
    const tx = wp ? wp.x : tx0;
    const tz = wp ? wp.z : tz0;
    const dx = tx - h.pos.x, dz = tz - h.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 1e-3) { h.vel.set(0, 0, 0); return null; }
    h.facing = Math.atan2(dx, dz);
    const step = Math.min(d, speed * dt);
    const ox = h.pos.x, oz = h.pos.z;
    const id = moveBy(h, (dx / d) * step, (dz / d) * step);
    h.vel.set(dt > 0 ? (h.pos.x - ox) / dt : 0, 0, dt > 0 ? (h.pos.z - oz) / dt : 0);
    return id;
  };

  const sees = (h: Hatless, p: PlayerState, ctx: { night: boolean; fog: boolean }): boolean => {
    if (!p.alive) return false;
    if (collider.havenAt(p.pos.x, p.pos.y, p.pos.z) !== null) return false;
    const dx = p.pos.x - h.pos.x, dz = p.pos.z - h.pos.z;
    let range = HATLESS.sightRange;
    if (ctx.night || ctx.fog) range *= 0.5;
    if (p.stance === 'crouch') range *= 0.6;
    if (Math.hypot(dx, dz) > range) return false;
    if (!sameSpace(h, p, Math.hypot(dx, dz))) return false;
    return Math.abs(wrapAngle(Math.atan2(dx, dz) - h.facing)) <= HATLESS.sightHalfAngle;
  };

  /** Walls block sight: the Hatless and the player share a building, or either stands in a doorway close by. */
  const sameSpace = (h: Hatless, p: PlayerState, dist: number): boolean => {
    if (!index) return true;
    const a = index.spaceOf(h.pos.x, h.pos.y, h.pos.z);
    const b = index.spaceOf(p.pos.x, p.pos.y, p.pos.z);
    if (a.building === b.building) return true;
    return (a.doorway !== null || b.doorway !== null) && dist <= INTERIOR.doorSight;
  };

  const stagger = (h: Hatless, fromX: number, fromZ: number): void => {
    if (h.mode !== 'stagger') h.staggerBack = h.mode === 'crumble' ? 'idle' : h.mode;
    h.mode = 'stagger';
    h.staggerLeft = HATLESS.staggerSeconds;
    h.lungeLeft = 0;
    const dx = h.pos.x - fromX, dz = h.pos.z - fromZ;
    const d = Math.hypot(dx, dz);
    if (d > 1e-4) moveBy(h, (dx / d) * KNOCKBACK, (dz / d) * KNOCKBACK);
  };

  const destroy = (h: Hatless): void => {
    h.mode = 'crumble';
    h.crumbleT = CRUMBLE_SECONDS;
    h.vel.set(0, 0, 0);
    const { group, mats } = makeDust(h.pos);
    h.fx = group;
    h.fxMats = mats;
    scene.add(group);
    bus.emit('hatless-destroyed', { region: collider.regionAt(h.pos.x, h.pos.z) });
  };

  const removeHatless = (h: Hatless): void => {
    scene.remove(h.model.object);
    disposeModel(h.model);
    if (h.fx) {
      scene.remove(h.fx);
      disposeFx(h.fx);
    }
  };

  /** A spot inside the region rect (jittered around a hatless spot when one exists), or the region's edge point nearest `from`. */
  const placeOne = (req: Pending): Hatless | null => {
    const def = REGIONS.find((r) => r.id === req.region);
    if (!def) return null;
    const r = def.rect;
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    const spots = req.spots.filter((s) => s.kind === 'hatless' && s.region === req.region);
    let x = 0, z = 0, y = def.floorY;
    let drawnTo: XZ | null = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      if (req.from) {
        x = clampTo(req.from.x, r.x0 + 0.5, r.x1 - 0.5);
        z = clampTo(req.from.z, r.z0 + 0.5, r.z1 - 0.5);
        const dx = cx - x, dz = cz - z;
        const d = Math.hypot(dx, dz);
        if (d > 1e-3) {
          const nudge = Math.min(2, d);
          x += (dx / d) * nudge;
          z += (dz / d) * nudge;
        }
        drawnTo = { x: cx, z: cz };
        y = collider.groundAt(x, z, def.floorY);
      } else if (spots.length > 0) {
        const s = spots[Math.floor(Math.random() * spots.length)];
        x = clampTo(s.x + (Math.random() * 2 - 1) * 2, r.x0 + 0.5, r.x1 - 0.5);
        z = clampTo(s.z + (Math.random() * 2 - 1) * 2, r.z0 + 0.5, r.z1 - 0.5);
        y = collider.groundAt(x, z, s.y);
      } else {
        x = r.x0 + 0.5 + Math.random() * (r.x1 - r.x0 - 1);
        z = r.z0 + 0.5 + Math.random() * (r.z1 - r.z0 - 1);
        y = collider.groundAt(x, z, def.floorY);
      }
      // Zero-length move reports whether the spot itself is inside a block; retry a few times.
      if (collider.move({ x, y, z }, 0, 0, HATLESS.radius, GNOME_HEIGHT, HATLESS_STEP, out) === null) break;
    }
    const model = makeGnome(hatlessLook(Math.floor(Math.random() * 100000)), { hatless: true });
    scene.add(model.object);
    model.object.position.set(x, y, z);
    return {
      model,
      pos: new THREE.Vector3(x, y, z),
      vel: new THREE.Vector3(),
      facing: Math.random() * Math.PI * 2,
      baseScale: model.object.scale.x,
      mode: drawnTo ? 'drawn' : 'idle',
      staggerBack: 'idle',
      staggerLeft: 0,
      hp: HATLESS.coreHp,
      lastSeen: { x, z },
      drawnTo,
      unseen: 0,
      lungeLeft: 0,
      lungeCool: 0,
      scratchT: 0,
      reaching: false,
      swayT: Math.random() * 10,
      crumbleT: 0,
      fx: null,
      fxMats: [],
    };
  };

  /** Places pending Hatless while there is budget. Requests over the budget stay held back. */
  const fill = (): void => {
    while (pending.length > 0 && visibleCount() < budget()) {
      const req = pending[0];
      const h = placeOne(req);
      req.count--;
      if (req.count <= 0) pending.shift();
      if (h) all.push(h);
    }
  };

  const tick = (h: Hatless, dt: number, ctx: { night: boolean; fog: boolean }, p: PlayerState): void => {
    h.swayT += dt;
    h.reaching = false;
    if (h.lungeCool > 0) h.lungeCool -= dt;
    if (h.mode === 'stagger') {
      h.staggerLeft -= dt;
      if (h.staggerLeft <= 0) h.mode = h.staggerBack;
      return;
    }
    const inHaven = collider.havenAt(p.pos.x, p.pos.y, p.pos.z) !== null;
    const above = p.pos.y - h.pos.y;
    const reachable = above <= HATLESS.pileReach;
    const seen = reachable && !inHaven && sees(h, p, ctx);
    if (seen) {
      h.mode = 'hunting';
      h.unseen = 0;
      h.lastSeen = { x: p.pos.x, z: p.pos.z };
      h.drawnTo = null;
    } else if (h.mode === 'hunting') {
      if (inHaven) h.mode = 'idle';
      h.unseen += dt;
      if (h.unseen > HATLESS.giveUpSeconds) h.mode = 'idle';
    }

    if (h.mode === 'hunting') {
      const gather = !reachable && !inHaven;
      if (gather) { h.lastSeen = { x: p.pos.x, z: p.pos.z }; }
      const dist = Math.hypot(p.pos.x - h.pos.x, p.pos.z - h.pos.z);
      h.reaching = gather && dist <= REACH_HEIGHT_MAX;
      let speed: number = HATLESS.shamble;
      if (h.lungeLeft > 0) {
        h.lungeLeft -= dt;
        speed = HATLESS.lunge;
      } else if (seen && dist <= HATLESS.lungeRange && h.lungeCool <= 0 && !h.reaching) {
        h.lungeLeft = HATLESS.lungeSeconds;
        h.lungeCool = LUNGE_COOLDOWN;
        speed = HATLESS.lunge;
      }
      const hit = walk(h, h.lastSeen.x, h.lastSeen.z, speed, dt, p.pos.y);
      if (hit && h.lungeLeft > 0) h.lungeLeft = 0;
      if (dist <= HATLESS.grabRange && above < SCRATCH_HEIGHT && p.alive) {
        h.scratchT -= dt;
        if (h.scratchT <= 0) {
          h.scratchT = HATLESS.scratchEvery;
          let others = 0;
          for (const o of all) {
            if (o !== h && o.mode !== 'crumble' && Math.hypot(o.pos.x - h.pos.x, o.pos.z - h.pos.z) <= 2) others++;
          }
          bus.emit('player-hit', { strength: Math.min(1, 0.5 + 0.1 * others), from: { x: h.pos.x, z: h.pos.z } });
        }
      } else {
        h.scratchT = 0;
      }
    } else if (h.mode === 'drawn' && h.drawnTo) {
      const d = Math.hypot(h.drawnTo.x - h.pos.x, h.drawnTo.z - h.pos.z);
      if (d <= DRAWN_REACHED) {
        h.mode = 'idle';
        h.drawnTo = null;
        h.vel.set(0, 0, 0);
      } else {
        walk(h, h.drawnTo.x, h.drawnTo.z, HATLESS.shamble, dt);
      }
    } else {
      h.vel.set(0, 0, 0);
    }
  };

  const separate = (): void => {
    const live = all.filter((h) => h.mode !== 'crumble');
    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i], b = live[j];
        const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
        const d = Math.hypot(dx, dz);
        if (d >= SEPARATION || d < 1e-4) continue;
        const push = (SEPARATION - d) / 2;
        const ux = (dx / d) * push, uz = (dz / d) * push;
        moveBy(a, -ux, -uz);
        moveBy(b, ux, uz);
      }
    }
  };

  /** Poses the model for this frame: walk animation, idle sway, reaching arms. */
  const pose = (h: Hatless, dt: number): void => {
    h.model.update({ position: h.pos, velocity: h.vel, facing: h.facing, grounded: true, jumpsUsed: 0 }, dt);
    h.model.object.rotation.z = h.mode === 'idle' ? Math.sin(h.swayT * SWAY_SPEED) * SWAY_ANGLE : 0;
    if (h.reaching) {
      h.model.arms.left.rotation.x = ARMS_UP;
      h.model.arms.right.rotation.x = ARMS_UP;
    }
  };

  const crumble = (h: Hatless, dt: number): void => {
    h.crumbleT -= dt;
    const t = Math.max(0, h.crumbleT / CRUMBLE_SECONDS);
    h.model.object.position.set(h.pos.x, h.pos.y - (1 - t) * 0.6, h.pos.z);
    h.model.object.scale.setScalar(h.baseScale * (0.3 + 0.7 * t));
    if (h.fx) h.fx.position.y += dt * 0.5;
    for (const m of h.fxMats) {
      m.opacity = t;
    }
  };

  return {
    exportState() { return []; },
    applyRemote() {},
    setAuthority() {},
    drainStrikes() { return []; },
    setExtraTargets() {},
    onRemoteScratch() {},
    setHazards() {},
    spawn(region, count, spots, from) {
      if (count <= 0) return;
      pending.push({ region, count, spots, from });
      fill();
    },
    despawnAll() {
      const n = visibleCount() + heldBack();
      for (const h of all) removeHatless(h);
      all.length = 0;
      pending.length = 0;
      return n;
    },
    update(dt, ctx) {
      const p = getPlayer();
      if (debugLeft > 0) {
        pending.push({ region: collider.regionAt(p.pos.x, p.pos.z) ?? 'forecourt', count: debugLeft, spots: [] });
        debugLeft = 0;
      }
      for (const h of all) {
        if (h.mode === 'crumble') crumble(h, dt);
        else tick(h, dt, ctx, p);
      }
      separate();
      for (const h of all) if (h.mode !== 'crumble') pose(h, dt);
      for (let i = all.length - 1; i >= 0; i--) {
        const h = all[i];
        if (h.mode === 'crumble' && h.crumbleT <= 0) {
          removeHatless(h);
          all.splice(i, 1);
        }
      }
      fill();
    },
    strike(origin, facing, reach, damage) {
      const fx = Math.sin(facing), fz = Math.cos(facing);
      let best: Hatless | null = null;
      let bestD = Infinity;
      for (const h of all) {
        if (h.mode === 'crumble') continue;
        const dx = h.pos.x - origin.x, dz = h.pos.z - origin.z;
        const d = Math.hypot(dx, dz);
        if (d > reach || d < 1e-4) continue;
        if (Math.acos(clampTo((dx * fx + dz * fz) / d, -1, 1)) > Math.PI / 3) continue;
        if (d < bestD) { best = h; bestD = d; }
      }
      if (!best) return 0;
      best.hp -= damage;
      if (best.hp <= 0) destroy(best);
      else stagger(best, origin.x, origin.z);
      return 1;
    },
    aliveCount: () => visibleCount() + heldBack(),
    nearCount(pos, radius) {
      let n = 0;
      for (const h of all) {
        if (h.mode !== 'crumble' && Math.hypot(h.pos.x - pos.x, h.pos.z - pos.z) <= radius) n++;
      }
      return n;
    },
  };
}
