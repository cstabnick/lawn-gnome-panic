// Parts that break off damaged mowers (fleet-damage workstream): a wheel a damage stage removes, a canopy, a bonnet, plus
// a few scrap prefabs, become real objects in the world that fly off, fall, bounce and come to rest on the ground, then
// fade after a while. fleetRuntime.ts wires vehicles.ts setPartsHooks to createDebris.
// Must not import vehicles.ts (vehicles.ts imports stripLooseParts from here).
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { heightAt } from './terrain';
import type { Vehicle } from './types';

/** Tuning. */
export const DEBRIS = {
  /** At most this many pieces in the world; the oldest goes first. */
  max: 40,
  /** Seconds a piece lies on the ground before it starts to fade, and the fade time. */
  life: 45, fade: 2,
  /** A piece that comes to rest on a road (createDebris onRoad) is tidied away after this many seconds instead. */
  roadLife: 3,
  /** Gravity, units/s^2. */
  gravity: 22,
  /** Launch: sideways pop speed and upward speed range (units/s), plus this share of the vehicle's own velocity. */
  pop: 3.5, upMin: 3, upMax: 6.5, carry: 0.6,
  /** Bounce: vertical restitution, ground friction per bounce, and below this speed a piece settles. */
  bounce: 0.35, friction: 0.6, settleSpeed: 0.6,
  /** Scrap pieces thrown on a damage level rise, and on an explosion. */
  scrapsPerLevel: 2, scrapsOnExplode: 4,
  /** Knocked parts: minimum impact speed (m/s), chance per qualifying impact, and most parts one vehicle loses before repair. */
  knockMin: 7, knockChance: 0.55, knocksPerVehicle: 6,
} as const;

/** Names of parts that can come off a vehicle on a hard impact. */
export const LOOSE_NAME = /^(canopy|mirror|exhaust|bumper|spoiler|ornament|lamp|headlight|light|siren|flag|basket|bag|grass-bag|catcher|hood|bonnet|door|grille|fender|mudflap|plate|antenna|aerial|horn|bell|cone|crate|bucket|sign)/;
/** Names that never come off, even if they match LOOSE_NAME. */
export const NEVER_LOOSE = /(wheel|steer|handle|seat|body|chassis|deck|rotor|prop|wing|hull|frame|rider|gnome)/;

/** Knocked part keys per vehicle (object name, or `<parentName>/<index>` for an unnamed glaze child). */
const lost = new WeakMap<Vehicle, string[]>();

function partKey(o: THREE.Object3D): string {
  if (o.name) return o.name;
  const parent = o.parent;
  return `${parent?.name ?? ''}/${parent ? parent.children.indexOf(o) : 0}`;
}

function isGlazeGroup(o: THREE.Object3D): boolean {
  return o.name === 'glaze-fittings' || o.name === 'glaze-lamps';
}

/**
 * The parts of v that can come off: visible named loose parts (outermost only) and the visible children of the Pay 'n'
 * Glaze fitting groups. The rider's model is skipped.
 */
export function looseParts(v: Vehicle): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  const rider = v.rider?.object;
  const walk = (o: THREE.Object3D): void => {
    if (o === rider) return;
    if (LOOSE_NAME.test(o.name) && !NEVER_LOOSE.test(o.name) && o.visible && hasVisibleMesh(o)) {
      out.push(o);
      return;
    }
    if (isGlazeGroup(o)) {
      for (const c of o.children) if (c.visible && hasVisibleMesh(c)) out.push(c);
      return;
    }
    for (const c of o.children) walk(c);
  };
  for (const c of v.object.children) walk(c);
  return out;
}

/** Hide again every part recorded as knocked off v. Call after a body rebuild. */
export function hideLostParts(v: Vehicle): void {
  const keys = lost.get(v);
  if (!keys || keys.length === 0) return;
  const rider = v.rider?.object;
  const walk = (o: THREE.Object3D): void => {
    if (o === rider) return;
    if (keys.includes(partKey(o))) o.visible = false;
    for (const c of o.children) walk(c);
  };
  walk(v.object);
}

/** Show again every part recorded as knocked off v (the inverse of hideLostParts; a repair at damage 0 does not rebuild). */
export function restoreLostParts(v: Vehicle): void {
  const keys = lost.get(v);
  if (!keys || keys.length === 0) return;
  const walk = (o: THREE.Object3D): void => {
    if (keys.includes(partKey(o))) o.visible = true;
    for (const c of o.children) walk(c);
  };
  walk(v.object);
}

/** Forget v's knocked parts (on repair), so the next rebuild shows them again. */
export function forgetLostParts(v: Vehicle): void {
  lost.delete(v);
}

/** Prefab part name of a piece a damage stage merely lays beside the model (damage-stages.ts fallenTyre). stripLooseParts removes them. */
export const LOOSE_PART = 'fallen-tyre';

/** Scrap prefabs (packages/prefabs/src/catalog/gta-fleet.ts). The panel takes the vehicle's tint. Missing ones are skipped. */
export const SCRAP_PREFABS = ['mower-scrap-panel', 'mower-scrap-bolt', 'mower-scrap-spring'] as const;

export interface DebrisSystem {
  /**
   * Throw the parts damage stages (fromLevel, toLevel] of v's prefab hide (hiddenBetween), found by name in `body` (the old
   * body, before setPrefabDamage rebuilds it), plus DEBRIS.scrapsPerLevel scraps. Returns how many pieces were thrown.
   */
  detach(v: Vehicle, body: THREE.Object3D, fromLevel: number, toLevel: number): number;
  /** v blew up: throw up to two of its remaining wheels (removed from the model) and DEBRIS.scrapsOnExplode scraps. Returns pieces thrown. */
  burst(v: Vehicle): number;
  /**
   * An impact on v from direction (nx, nz) (unit, from the vehicle centre toward the hit, world space) at `impact` m/s:
   * the loose part nearest that side comes off (a copy flies, the original is hidden). Returns parts knocked off (0-2).
   */
  knock(v: Vehicle, nx: number, nz: number, impact: number): number;
  /** Step every piece: fly, fall, bounce, rest on heightAt, fade and remove old ones. */
  update(dt: number): void;
  /** Pieces currently in the world. */
  count(): number;
  /** Remove every piece. */
  clear(): void;
}

interface Piece {
  object: THREE.Object3D;
  vx: number; vy: number; vz: number;
  /** Angular velocity, rad/s, about the world axes. */
  wx: number; wy: number; wz: number;
  /** Orientation when lying flat on the ground (a random yaw applied). */
  lying: THREE.Quaternion;
  /** Height of the origin above the ground when lying. */
  restY: number;
  resting: boolean;
  age: number;
  /** Cloned materials used while fading; null until the piece starts to fade. */
  fadeMats: THREE.Material[] | null;
}

const UP = new THREE.Vector3(0, 1, 0);
const TMP_QUAT = new THREE.Quaternion();
const TMP_EULER = new THREE.Euler();

function hasVisibleMesh(o: THREE.Object3D): boolean {
  let found = false;
  o.traverse((c) => { if (!found && c instanceof THREE.Mesh && c.visible) found = true; });
  return found;
}

/**
 * The orientation a piece lies in (its thinnest axis up, a random yaw about +Y) and how high its origin sits above the
 * ground then. The piece's own pose is left as it was.
 */
function restPose(obj: THREE.Object3D): { lying: THREE.Quaternion; restY: number } {
  const pos = obj.position.clone();
  const quat = obj.quaternion.clone();
  obj.position.set(0, 0, 0);
  obj.quaternion.identity();
  obj.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
  const axis = new THREE.Vector3();
  if (size.x <= size.y && size.x <= size.z) axis.set(1, 0, 0);
  else if (size.y <= size.z) axis.set(0, 1, 0);
  else axis.set(0, 0, 1);
  const base = new THREE.Quaternion().setFromUnitVectors(axis, UP);
  const yaw = new THREE.Quaternion().setFromAxisAngle(UP, Math.random() * Math.PI * 2);
  const lying = yaw.multiply(base);
  obj.quaternion.copy(lying);
  obj.updateMatrixWorld(true);
  const restY = -new THREE.Box3().setFromObject(obj).min.y;
  obj.position.copy(pos);
  obj.quaternion.copy(quat);
  obj.updateMatrixWorld(true);
  return { lying, restY };
}

/** Part and group names that damage stages fromLevel+1 .. toLevel of prefab `prefabId` hide (DamageStage.hide), in order, no repeats. */
export function hiddenBetween(prefabId: string, fromLevel: number, toLevel: number): string[] {
  const stages = getPrefab(prefabId)?.damage ?? [];
  const out: string[] = [];
  const end = Math.min(toLevel, stages.length);
  for (let i = Math.max(0, fromLevel); i < end; i++) {
    for (const name of stages[i].hide ?? []) if (!out.includes(name)) out.push(name);
  }
  return out;
}

/** Remove every object named LOOSE_PART (and its '-mirror' twin) from a rebuilt prefab body. Returns how many it removed. */
export function stripLooseParts(body: THREE.Object3D): number {
  const found: THREE.Object3D[] = [];
  body.traverse((o) => { if (o.name === LOOSE_PART || o.name === `${LOOSE_PART}-mirror`) found.push(o); });
  for (const o of found) o.removeFromParent();
  return found.length;
}

/** `onRoad` (optional): true on a road surface; pieces never stay lying there (they fade after DEBRIS.roadLife). */
export function createDebris(scene: THREE.Scene, onRoad?: (x: number, z: number) => boolean): DebrisSystem {
  const pieces: Piece[] = [];

  function dropPiece(p: Piece): void {
    p.object.removeFromParent();
    for (const m of p.fadeMats ?? []) m.dispose();
  }

  /** Give every mesh under the piece its own copy of its material(s), so the copies can fade without touching shared ones. */
  function makeFadeable(p: Piece): void {
    const mats: THREE.Material[] = [];
    p.object.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const src = Array.isArray(o.material) ? o.material : [o.material];
      const copies = src.map((m) => {
        const c = m.clone();
        c.transparent = true;
        c.needsUpdate = true;
        mats.push(c);
        return c;
      });
      o.material = Array.isArray(o.material) ? copies : copies[0];
    });
    p.fadeMats = mats;
  }

  /** Start a piece (already at its world pose) flying away from the vehicle v. */
  function throwPiece(obj: THREE.Object3D, v: Vehicle): void {
    obj.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
    scene.add(obj);
    const dx = obj.position.x - v.x;
    const dz = obj.position.z - v.z;
    const len = Math.hypot(dx, dz);
    let ox: number;
    let oz: number;
    if (len < 0.01) {
      const a = Math.random() * Math.PI * 2;
      ox = Math.sin(a);
      oz = Math.cos(a);
    } else {
      ox = dx / len;
      oz = dz / len;
    }
    const push = DEBRIS.pop * (0.7 + 0.6 * Math.random());
    const { lying, restY } = restPose(obj);
    pieces.push({
      object: obj,
      vx: Math.sin(v.yaw) * v.speed * DEBRIS.carry + ox * push,
      vy: DEBRIS.upMin + Math.random() * (DEBRIS.upMax - DEBRIS.upMin),
      vz: Math.cos(v.yaw) * v.speed * DEBRIS.carry + oz * push,
      wx: -6 + Math.random() * 12,
      wy: -6 + Math.random() * 12,
      wz: -6 + Math.random() * 12,
      lying, restY,
      resting: false,
      age: 0,
      fadeMats: null,
    });
    while (pieces.length > DEBRIS.max) dropPiece(pieces.shift()!);
  }

  /** Throw a clone of one of the vehicle's parts, at the part's current world pose. */
  function throwPart(o: THREE.Object3D, v: Vehicle): void {
    const clone = o.clone(true);
    o.matrixWorld.decompose(clone.position, clone.quaternion, clone.scale);
    throwPiece(clone, v);
  }

  /** Throw one scrap prefab from above the vehicle. Returns false when no scrap prefab is registered. */
  function throwScrap(v: Vehicle, tint: number): boolean {
    const id = SCRAP_PREFABS[Math.floor(Math.random() * SCRAP_PREFABS.length)];
    if (!getPrefab(id)) return false;
    const obj = buildPrefab(id, { scale: v.spec.scale, tint });
    obj.position.set(v.x, v.y + 0.5 * v.spec.scale, v.z);
    throwPiece(obj, v);
    return true;
  }

  return {
    detach(v, body, fromLevel, toLevel) {
      v.object.updateMatrixWorld(true);
      let thrown = 0;
      for (const name of hiddenBetween(v.spec.prefab, fromLevel, toLevel)) {
        const o = body.getObjectByName(name);
        if (!o || !hasVisibleMesh(o)) continue;
        throwPart(o, v);
        thrown++;
      }
      for (let i = 0; i < DEBRIS.scrapsPerLevel; i++) if (throwScrap(v, v.tint)) thrown++;
      return thrown;
    },

    burst(v) {
      const body = v.object.children[0] as THREE.Object3D | undefined;
      if (!body) return 0;
      v.object.updateMatrixWorld(true);
      const names = ['wheel-0', 'wheel-1', 'wheel-2', 'wheel-3'].filter((n) => {
        const o = body.getObjectByName(n);
        return !!o && hasVisibleMesh(o);
      });
      // Random pick of at most two: shuffle, then take the first two.
      for (let i = names.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [names[i], names[j]] = [names[j], names[i]];
      }
      let thrown = 0;
      for (const name of names.slice(0, 2)) {
        const o = body.getObjectByName(name);
        if (!o) continue;
        throwPart(o, v);
        o.removeFromParent();
        thrown++;
      }
      for (let i = 0; i < DEBRIS.scrapsOnExplode; i++) if (throwScrap(v, 0x151515)) thrown++;
      return thrown;
    },

    knock(v, nx, nz, impact) {
      if (impact < DEBRIS.knockMin) return 0;
      const done = lost.get(v) ?? [];
      if (done.length >= DEBRIS.knocksPerVehicle) return 0;
      if (Math.random() >= DEBRIS.knockChance) return 0;
      v.object.updateMatrixWorld(true);
      const ranked = looseParts(v)
        .map((o) => {
          const w = new THREE.Vector3();
          o.getWorldPosition(w);
          return { o, d: (w.x - v.x) * nx + (w.z - v.z) * nz };
        })
        .sort((a, b) => b.d - a.d);
      const want = impact > 2 * DEBRIS.knockMin ? 2 : 1;
      const count = Math.min(want, ranked.length, DEBRIS.knocksPerVehicle - done.length);
      let knocked = 0;
      for (let i = 0; i < count; i++) {
        const o = ranked[i].o;
        const key = partKey(o);
        throwPart(o, v);
        o.visible = false;
        done.push(key);
        knocked++;
      }
      if (knocked > 0) lost.set(v, done);
      // Nothing left to knock off this side (or a model without named loose parts): a scrap panel flies off instead.
      if (knocked === 0 && throwScrap(v, v.tint)) knocked = 1;
      return knocked;
    },

    update(rawDt) {
      const dt = Math.min(Math.max(0, rawDt), 0.1);
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        const o = p.object;
        if (!p.resting) {
          p.vy -= DEBRIS.gravity * dt;
          o.position.x += p.vx * dt;
          o.position.y += p.vy * dt;
          o.position.z += p.vz * dt;
          TMP_QUAT.setFromEuler(TMP_EULER.set(p.wx * dt, p.wy * dt, p.wz * dt));
          o.quaternion.multiply(TMP_QUAT);
          const ground = heightAt(o.position.x, o.position.z);
          if (o.position.y <= ground + p.restY) {
            o.position.y = ground + p.restY;
            p.vy = -p.vy * DEBRIS.bounce;
            p.vx *= DEBRIS.friction;
            p.vz *= DEBRIS.friction;
            p.wx *= 0.5;
            p.wy *= 0.5;
            p.wz *= 0.5;
            if (Math.abs(p.vy) < DEBRIS.settleSpeed && Math.hypot(p.vx, p.vz) < DEBRIS.settleSpeed) {
              p.resting = true;
              // Landed on the road: tidied away soon, so the road never fills with parts.
              if (onRoad?.(o.position.x, o.position.z)) p.age = Math.max(p.age, DEBRIS.life - DEBRIS.roadLife);
            }
          }
        } else {
          o.quaternion.slerp(p.lying, Math.min(1, 8 * dt));
          o.position.y = heightAt(o.position.x, o.position.z) + p.restY;
        }

        p.age += dt;
        if (p.age > DEBRIS.life) {
          if (!p.fadeMats) makeFadeable(p);
          const t = (p.age - DEBRIS.life) / DEBRIS.fade;
          if (t >= 1) {
            dropPiece(p);
            pieces.splice(i, 1);
            continue;
          }
          for (const m of p.fadeMats ?? []) m.opacity = 1 - t;
        }
      }
    },

    count() {
      return pieces.length;
    },

    clear() {
      for (const p of pieces) dropPiece(p);
      pieces.length = 0;
    },
  };
}
