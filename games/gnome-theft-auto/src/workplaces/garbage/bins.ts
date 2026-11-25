// E25 garbage: the round's wheelie bins in the world (prefab gta-wheelie-bin at each stop), the lorry's arm and the bin
// riding it during a lift, and litter left by a spill. Prefabs are guarded: a missing one is skipped, never thrown.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { LAYER, flatLayer } from '@lawn/depth';
import type { Vehicle } from '../../types';
import { heightAt } from '../../terrain';
import { ARM, type BinRound, type BinStop, type LiftState } from './types';

export interface BinView {
  /** Place a bin at every stop of `round` (clears the previous round's bins first; spilled litter stays until clear()). */
  show(round: BinRound): void;
  /** Remove every bin and all litter. */
  clear(): void;
  /**
   * During a lift (every frame): pose the lorry's arm from `s.tilt` and carry `stop`'s bin on the claw (grab phase:
   * the bin slides from the kerb to the claw as the swing settles). s = null: put the arm back to rest.
   */
  pose(stop: BinStop | null, s: LiftState | null, lorry: Vehicle | null): void;
  /** After a lift: the bin back on the kerb at its stop, turned by (1 - neat) * 0.6 rad and shifted up to 0.5 m. */
  setDown(stop: BinStop, neat: number): void;
  /** A spill: litter scattered round the stop (flat litter prefab on a draw layer, a couple of bags). */
  spill(stop: BinStop): void;
  /** Every frame (lid wobble, a fly or two over spilled litter). */
  update(dt: number): void;
}

/** Where a bin stands on the kerb. */
interface Rest {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

interface Fly {
  mesh: THREE.Mesh;
  cx: number;
  cy: number;
  cz: number;
  a: number;
}

/** Seconds for the arm to ease back to rest. */
const ARM_RETURN_S = 0.3;
/** Lid angle when open (radians). */
const LID_OPEN = 0.3;
/** The bin origin sits this far below the claw, in the bin's own up. */
const CLAW_TO_BIN = 0.45;

/** Deterministic -1 or +1 from a stop id (so a set-down always looks the same). */
function signFor(id: number): number {
  return ((id * 9301 + 49297) % 233280) / 233280 < 0.5 ? -1 : 1;
}

export function createBinView(scene: THREE.Scene): BinView {
  const bins = new Map<number, THREE.Object3D>();
  const rests = new Map<number, Rest>();
  const litter: THREE.Object3D[] = [];
  const bags: THREE.Object3D[] = [];
  const flies: Fly[] = [];
  const ownMaterials: THREE.Material[] = [];
  let flyGeo: THREE.SphereGeometry | null = null;
  let flyMat: THREE.MeshBasicMaterial | null = null;

  /** The bin being carried (set by pose, released by pose(null) or setDown). */
  let held: BinStop | null = null;
  /** The arm last posed, eased back to rest when no lift is running. */
  let lastArm: THREE.Object3D | null = null;
  let armActive = false;

  function armOf(lorry: Vehicle | null): THREE.Object3D | null {
    if (!lorry) return null;
    return lorry.object.getObjectByName(ARM.pivot) ?? null;
  }

  function lidOf(bin: THREE.Object3D): THREE.Object3D | null {
    return bin.getObjectByName('lid') ?? null;
  }

  function placeAtRest(bin: THREE.Object3D, r: Rest, lean = 0): void {
    bin.position.set(r.x, r.y, r.z);
    bin.rotation.set(0, r.yaw, lean);
  }

  function ensureFly(): { geo: THREE.SphereGeometry; mat: THREE.MeshBasicMaterial } {
    if (!flyGeo) flyGeo = new THREE.SphereGeometry(0.05, 6, 4);
    if (!flyMat) flyMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    return { geo: flyGeo, mat: flyMat };
  }

  function removeBins(): void {
    for (const bin of bins.values()) scene.remove(bin);
    bins.clear();
    rests.clear();
    held = null;
  }

  function show(round: BinRound): void {
    removeBins();
    for (const stop of round.stops) {
      if (!getPrefab('gta-wheelie-bin')) break;
      const bin = buildPrefab('gta-wheelie-bin', { tint: stop.tint });
      const r: Rest = { x: stop.x, y: heightAt(stop.x, stop.z), z: stop.z, yaw: stop.yaw };
      placeAtRest(bin, r);
      scene.add(bin);
      bins.set(stop.id, bin);
      rests.set(stop.id, r);
      if (stop.heavy && getPrefab('bin-bag')) {
        // Garden waste: a bag poking out from under the lid (a child, so it moves with the bin).
        const bag = buildPrefab('bin-bag');
        bag.position.set(0, 0.82, 0.12);
        bag.rotation.y = stop.id * 0.7;
        bin.add(bag);
      }
    }
  }

  function clear(): void {
    removeBins();
    for (const o of litter) scene.remove(o);
    for (const o of bags) scene.remove(o);
    for (const f of flies) scene.remove(f.mesh);
    litter.length = 0;
    bags.length = 0;
    flies.length = 0;
    for (const m of ownMaterials) m.dispose();
    ownMaterials.length = 0;
    flyGeo?.dispose();
    flyMat?.dispose();
    flyGeo = null;
    flyMat = null;
    lastArm = null;
    armActive = false;
  }

  function pose(stop: BinStop | null, s: LiftState | null, lorry: Vehicle | null): void {
    const arm = armOf(lorry);
    if (!stop || !s) {
      // Released: arm eases back in update(), the bin goes back to the kerb.
      if (arm) lastArm = arm;
      armActive = false;
      if (held) {
        const bin = bins.get(held.id);
        const r = rests.get(held.id);
        if (bin && r) {
          placeAtRest(bin, r);
          const lid = lidOf(bin);
          if (lid) lid.rotation.x = 0;
        }
        held = null;
      }
      return;
    }

    if (arm) {
      arm.rotation.z = ARM.max * s.tilt;
      arm.rotation.x = s.phase === 'grab' ? 0.25 * s.swing : 0;
      lastArm = arm;
      armActive = true;
    }
    if (!lorry) return;
    const bin = bins.get(stop.id);
    const r = rests.get(stop.id);
    if (!bin || !r) return;
    held = stop;

    if (s.phase === 'grab' || !arm) {
      // Still on the kerb, leaning toward the lorry as the claw sways.
      placeAtRest(bin, r, 0.15 * s.swing);
      const lid = lidOf(bin);
      if (lid) lid.rotation.x = 0;
      return;
    }

    lorry.object.updateMatrixWorld(true);
    const claw = arm.localToWorld(new THREE.Vector3(ARM.tip[0], ARM.tip[1], ARM.tip[2]));
    // The bin turns with the arm about the lorry's forward (z) axis, plus the lower-phase sway.
    const angle = ARM.max * s.tilt + (s.phase === 'lower' ? 0.3 * s.swing : 0);
    const lorryQ = lorry.object.getWorldQuaternion(new THREE.Quaternion());
    const qWorld = lorryQ.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle));
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(qWorld);
    const origin = claw.clone().addScaledVector(up, -CLAW_TO_BIN);
    const parent = bin.parent;
    if (parent) {
      const parentQ = parent.getWorldQuaternion(new THREE.Quaternion());
      bin.position.copy(parent.worldToLocal(origin));
      bin.quaternion.copy(parentQ.invert().multiply(qWorld));
    } else {
      bin.position.copy(origin);
      bin.quaternion.copy(qWorld);
    }
    const lid = lidOf(bin);
    if (lid) lid.rotation.x = s.tilt > 0.6 ? LID_OPEN : 0;
  }

  function setDown(stop: BinStop, neat: number): void {
    const bin = bins.get(stop.id);
    const r = rests.get(stop.id);
    if (!bin || !r) return;
    const sign = signFor(stop.id);
    const off = (1 - neat) * 0.5 * sign;
    const yaw = stop.yaw + (1 - neat) * 0.6 * sign;
    // Along the kerb: perpendicular to the facing direction (sin yaw, cos yaw).
    const x = stop.x + Math.cos(stop.yaw) * off;
    const z = stop.z - Math.sin(stop.yaw) * off;
    const next: Rest = { x, y: heightAt(x, z), z, yaw };
    placeAtRest(bin, next);
    const lid = lidOf(bin);
    if (lid) lid.rotation.x = 0;
    rests.set(stop.id, next);
    if (held?.id === stop.id) held = null;
  }

  function spill(stop: BinStop): void {
    const x = stop.x;
    const z = stop.z;
    const y = heightAt(x, z);
    if (getPrefab('bin-litter-scatter')) {
      const scatter = buildPrefab('bin-litter-scatter');
      scatter.position.set(x, y + 0.015, z);
      scatter.rotation.y = stop.yaw;
      scatter.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        // Prefab materials are shared: clone each one before moving it onto the marking layer.
        const list = Array.isArray(m.material) ? m.material : [m.material];
        const cloned = list.map((mat) => flatLayer(mat.clone(), LAYER.marking));
        ownMaterials.push(...cloned);
        m.material = Array.isArray(m.material) ? cloned : cloned[0];
      });
      scene.add(scatter);
      litter.push(scatter);
    }
    if (getPrefab('bin-bag')) {
      const count = 1 + (stop.id % 2);
      for (let i = 0; i < count; i++) {
        const bag = buildPrefab('bin-bag');
        const ang = stop.yaw + 1.3 * (i + 1) + stop.id;
        const d = 0.8 + 0.6 * i;
        const bx = x + Math.cos(ang) * d;
        const bz = z + Math.sin(ang) * d;
        bag.position.set(bx, heightAt(bx, bz) + 0.15, bz);
        bag.rotation.set(0, ang, Math.PI / 2);
        scene.add(bag);
        bags.push(bag);
      }
    }
    // A fly or two circling the mess.
    const { geo, mat } = ensureFly();
    for (let i = 0; i < 2; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      flies.push({ mesh, cx: x, cy: y + 0.6, cz: z, a: i * Math.PI });
    }
  }

  function update(dt: number): void {
    // Ease the arm back to rest when no lift is running.
    if (!armActive && lastArm) {
      const step = (dt * ARM.max) / ARM_RETURN_S;
      lastArm.rotation.z = Math.max(0, lastArm.rotation.z - step);
      lastArm.rotation.x = Math.abs(lastArm.rotation.x) <= step ? 0 : lastArm.rotation.x - Math.sign(lastArm.rotation.x) * step;
      if (lastArm.rotation.z === 0 && lastArm.rotation.x === 0) lastArm = null;
    }
    for (const f of flies) {
      f.a += dt * 4;
      f.mesh.position.set(f.cx + Math.cos(f.a) * 0.9, f.cy + Math.sin(f.a * 2) * 0.1, f.cz + Math.sin(f.a) * 0.9);
    }
  }

  return { show, clear, pose, setDown, spill, update };
}
