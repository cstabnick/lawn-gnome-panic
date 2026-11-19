// Other online players: their own gnome (resolveLook), their mower when they drive, hands up while soaked.
import * as THREE from 'three';
import { createGnomeModel, resolveLook, type GnomeModel } from '@lawn/gnome';
import { buildHeld, buildPrefab } from '@lawn/prefabs';
import { Interp } from '@lawn/mp/interp';
import type { PlayerInfo } from '@lawn/mp/protocol';
import { poseHandsUp, randomTownLook } from './gnomes';
import { VEHICLE_CODES, type RemotePose } from './net';
import type { Vehicle } from './types';
import { createVehicle, removeVehicle, seatWorld, syncVehicleMesh } from './vehicles';

interface Puppet {
  id: number;
  name: string;
  model: GnomeModel;
  interp: Interp;
  /** Discrete fields from the latest pose (not interpolated). */
  pose: RemotePose | null;
  vehicle: Vehicle | null;
  vehCode: number;
  x: number; y: number; z: number;
  t: number;
  /** The parachute canopy, built the first time this player hangs under one; hidden otherwise. */
  canopy: THREE.Object3D | null;
}

export interface Remotes {
  join(p: PlayerInfo): void;
  leave(id: number): void;
  pose(id: number, pose: RemotePose, sentAt: number): void;
  clear(): void;
  update(dt: number): void;
  /** The player whose gnome (or mower) contains the point, or null. */
  hitTest(x: number, y: number, z: number): { id: number; name: string } | null;
  blips(): { x: number; z: number }[];
  count(): number;
}

export function createRemotes(scene: THREE.Scene): Remotes {
  const puppets = new Map<number, Puppet>();
  const out: number[] = [0, 0, 0, 0];
  const seat = new THREE.Vector3();
  const state = {
    position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0,
    grounded: true, jumpsUsed: 0, sitting: false,
  };

  function drop(p: Puppet): void {
    scene.remove(p.model.object);
    if (p.vehicle) removeVehicle(scene, p.vehicle);
  }

  return {
    join(info) {
      if (puppets.has(info.id)) return;
      const look = resolveLook(info) ?? randomTownLook();
      const model = createGnomeModel({ ...look, hat: info.color }, { overrideEquipment: ['hand'] });
      model.object.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
      try {
        const gun = buildHeld('squirt-pistol');
        gun.position.set(0, -0.32, 0.02);
        gun.rotation.x = Math.PI;
        model.arms.right.add(gun);
      } catch { /* prefab missing: no gun */ }
      scene.add(model.object);
      puppets.set(info.id, {
        id: info.id, name: info.name, model,
        interp: new Interp({ angles: [3], pos: [0, 1, 2], snapDist: 25 }),
        pose: null, vehicle: null, vehCode: -1, x: 0, y: 0, z: 0, t: 0, canopy: null,
      });
    },
    leave(id) {
      const p = puppets.get(id);
      if (!p) return;
      drop(p);
      puppets.delete(id);
    },
    pose(id, pose, sentAt) {
      const p = puppets.get(id);
      if (!p) return;
      p.interp.push([pose.x, pose.y, pose.z, pose.yaw], sentAt);
      p.pose = pose;
    },
    clear() {
      for (const p of puppets.values()) drop(p);
      puppets.clear();
    },
    update(dt) {
      for (const p of puppets.values()) {
        if (!p.pose || !p.interp.sample(out)) { p.model.object.visible = false; continue; }
        p.model.object.visible = true;
        p.t += dt;
        const [x, y, z, yaw] = out;
        // Swap the mower model when they get in or out, or change mowers.
        if (p.pose.veh !== p.vehCode) {
          if (p.vehicle) removeVehicle(scene, p.vehicle);
          p.vehicle = null;
          p.vehCode = p.pose.veh;
          const kind = VEHICLE_CODES[p.vehCode];
          if (kind) {
            p.vehicle = createVehicle(scene, kind, x, z, yaw, p.pose.tint);
            p.vehicle.driver = 'remote';
          }
        }
        const moved = Math.hypot(x - p.x, z - p.z) / Math.max(dt, 1e-3);
        p.x = x; p.y = y; p.z = z;
        const onFoot = !p.vehicle;
        // The canopy is built on first use, then shown only while the sender hangs under it on foot.
        if (p.pose.chute && onFoot && !p.canopy) {
          try {
            p.canopy = buildPrefab('parachute-canopy');
            p.model.object.add(p.canopy);
          } catch { /* prefab missing: no canopy */ }
        }
        if (p.canopy) p.canopy.visible = p.pose.chute && onFoot;
        if (p.vehicle) {
          const v = p.vehicle;
          v.x = x; v.y = y; v.z = z; v.yaw = yaw;
          v.speed = p.pose.moving ? moved : 0;
          // syncVehicleMesh places the mesh, tilts a flyer and spins its wheels and rotor, as for the local vehicle.
          syncVehicleMesh(v, dt);
          seatWorld(v, seat);
          state.position.copy(seat);
          state.velocity.set(0, 0, 0);
          state.sitting = true;
        } else {
          state.position.set(x, y, z);
          // Under a canopy the gnome drifts and does not walk.
          const s = p.pose.moving && !p.pose.chute ? Math.min(moved, 8) : 0;
          state.velocity.set(Math.sin(yaw) * s, 0, Math.cos(yaw) * s);
          state.sitting = false;
        }
        state.facing = yaw;
        state.grounded = y < 0.05 || !!p.vehicle;
        p.model.update(state, dt);
        // update() does not reset the sideways arm angle, so clear it before a pose below sets it again.
        p.model.arms.left.rotation.z = 0;
        p.model.arms.right.rotation.z = 0;
        if (onFoot && p.pose.chute) {
          // Both arms up on the canopy's straps.
          p.model.arms.left.rotation.x = -2.9;
          p.model.arms.right.rotation.x = -2.9;
        } else if (p.pose.soaked && onFoot) poseHandsUp(p.model, p.t);
        else if (onFoot && y > 2) {
          // Airborne without a canopy: arms out.
          p.model.arms.left.rotation.z = 1.3;
          p.model.arms.right.rotation.z = -1.3;
        } else if (p.pose.aiming) p.model.arms.right.rotation.x = -Math.PI / 2;
      }
    },
    hitTest(x, y, z) {
      for (const p of puppets.values()) {
        if (!p.pose) continue;
        const r = p.vehicle ? p.vehicle.spec.radius : 0.5;
        const top = p.vehicle ? p.y + 2 : p.y + 1.2;
        if (y >= p.y - 0.1 && y <= top && Math.hypot(x - p.x, z - p.z) < r) return { id: p.id, name: p.name };
      }
      return null;
    },
    blips() {
      return [...puppets.values()].filter((p) => p.pose).map((p) => ({ x: p.x, z: p.z }));
    },
    count: () => puppets.size,
  };
}
