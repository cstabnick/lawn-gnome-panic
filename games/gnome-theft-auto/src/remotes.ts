// Other online players: their own gnome (resolveLook), their mower when they drive, hands up while hurt, their name over
// their head, and a seat in someone else's mower when they ride along (seats.ts).
import * as THREE from 'three';
import { createGnomeModel, resolveLook, type GnomeModel } from '@lawn/gnome';
import { buildHeld, buildPrefab } from '@lawn/prefabs';
import { Interp } from '@lawn/mp/interp';
import type { PlayerInfo } from '@lawn/mp/protocol';
import { poseHandsUp, randomTownLook } from './gnomes';
import { VEHICLE_CODES, type RemotePose } from './net';
import { passengerCount } from './seats';
import type { Vehicle } from './types';
import { createVehicle, removeVehicle, seatWorld, syncVehicleMesh } from './vehicles';

interface Puppet {
  id: number;
  name: string;
  model: GnomeModel;
  /** The name over the head (a child of the model, so it moves and hides with it). */
  label: THREE.Sprite;
  interp: Interp;
  /** The interpolated [x, y, z, yaw] of this frame (per player: a rider's seat is worked out from it). */
  s: number[];
  /** Discrete fields from the latest pose (not interpolated). */
  pose: RemotePose | null;
  vehicle: Vehicle | null;
  vehCode: number;
  x: number; y: number; z: number;
  t: number;
  /** The parachute canopy, built the first time this player hangs under one; hidden otherwise. */
  canopy: THREE.Object3D | null;
}

/** Where a boarding player's vehicle and identity come from on this client. */
export interface RemotesDeps {
  /** The vehicle I am driving, or null. Passengers who ride with me are placed in it. */
  myVehicle(): Vehicle | null;
  /** My player id, or null while offline. */
  myId(): number | null;
}

export interface RideTarget {
  host: number;
  name: string;
  vehicle: Vehicle;
}

export interface Remotes {
  join(p: PlayerInfo): void;
  leave(id: number): void;
  pose(id: number, pose: RemotePose, sentAt: number): void;
  clear(): void;
  update(dt: number): void;
  /** The player whose gnome (or mower) contains the point, or null. */
  hitTest(x: number, y: number, z: number): { id: number; name: string } | null;
  blips(): { x: number; z: number; name: string }[];
  count(): number;
  /** The mower a remote player is driving, or null. */
  vehicleOf(id: number): Vehicle | null;
  /** True while `v` is still a mower some remote player drives (it goes when they get out). */
  isRemoteDriven(v: Vehicle): boolean;
  /** The nearest remote mower within `range` of (x, z) that still has a free seat, or null. */
  nearestRide(x: number, z: number, range: number): RideTarget | null;
}

const NAME_H = 0.38;
const NAME_Y = 2;

/** A name over a head: white text on a dark pill, sized to fit. Billboards toward the camera. */
function nameLabel(text: string): THREE.Sprite {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const font = '700 40px system-ui,sans-serif';
  if (!g) return new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, opacity: 0 }));
  g.font = font;
  const h = 56;
  const w = Math.ceil(g.measureText(text).width) + 36;
  c.width = w;
  c.height = h;
  // Resizing the canvas resets its context, so the font and alignment go on again.
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(0,0,0,0.55)';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff';
  g.fillText(text, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set((NAME_H * w) / h, NAME_H, 1);
  s.position.set(0, NAME_Y, 0);
  s.renderOrder = 5;
  return s;
}

export function createRemotes(scene: THREE.Scene, deps: RemotesDeps): Remotes {
  const puppets = new Map<number, Puppet>();
  const seat = new THREE.Vector3();
  const state = {
    position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0,
    grounded: true, jumpsUsed: 0, sitting: false,
  };

  function drop(p: Puppet): void {
    scene.remove(p.model.object);
    p.label.material.map?.dispose();
    p.label.material.dispose();
    if (p.vehicle) removeVehicle(scene, p.vehicle);
  }

  /** The mower a player rides in: mine when I am driving it, else the puppet of the remote driver. */
  function hostVehicle(id: number): Vehicle | null {
    if (id === deps.myId()) return deps.myVehicle();
    return puppets.get(id)?.vehicle ?? null;
  }

  /** Seat `s` of driver `host` is taken by some remote rider. */
  function seatTaken(host: number, s: number): boolean {
    for (const p of puppets.values()) {
      if (p.pose?.ride && p.pose.ride.host === host && p.pose.ride.seat === s) return true;
    }
    return false;
  }

  /** A player on foot, or driving their own mower, as the pose says. */
  function updateDriver(p: Puppet, dt: number, x: number, y: number, z: number, yaw: number): void {
    const pose = p.pose!;
    // Swap the mower model when they get in or out, or change mowers.
    if (pose.veh !== p.vehCode) {
      if (p.vehicle) removeVehicle(scene, p.vehicle);
      p.vehicle = null;
      p.vehCode = pose.veh;
      const kind = VEHICLE_CODES[p.vehCode];
      if (kind) {
        p.vehicle = createVehicle(scene, kind, x, z, yaw, pose.tint);
        p.vehicle.driver = 'remote';
      }
    }
    const moved = Math.hypot(x - p.x, z - p.z) / Math.max(dt, 1e-3);
    p.x = x; p.y = y; p.z = z;
    const onFoot = !p.vehicle;
    // The canopy is built on first use, then shown only while the sender hangs under it on foot.
    if (pose.chute && onFoot && !p.canopy) {
      try {
        p.canopy = buildPrefab('parachute-canopy');
        p.model.object.add(p.canopy);
      } catch { /* prefab missing: no canopy */ }
    }
    if (p.canopy) p.canopy.visible = pose.chute && onFoot;
    if (p.vehicle) {
      const v = p.vehicle;
      v.x = x; v.y = y; v.z = z; v.yaw = yaw;
      v.speed = pose.moving ? moved : 0;
      // syncVehicleMesh places the mesh, tilts a flyer and spins its wheels and rotor, as for the local vehicle.
      syncVehicleMesh(v, dt);
      seatWorld(v, seat);
      state.position.copy(seat);
      state.velocity.set(0, 0, 0);
      state.sitting = true;
    } else {
      state.position.set(x, y, z);
      // Under a canopy the gnome drifts and does not walk.
      const s = pose.moving && !pose.chute ? Math.min(moved, 8) : 0;
      state.velocity.set(Math.sin(yaw) * s, 0, Math.cos(yaw) * s);
      state.sitting = false;
    }
    state.facing = yaw;
    state.grounded = y < 0.05 || !!p.vehicle;
    p.model.update(state, dt);
    // update() does not reset the sideways arm angle, so clear it before a pose below sets it again.
    p.model.arms.left.rotation.z = 0;
    p.model.arms.right.rotation.z = 0;
    if (onFoot && pose.chute) {
      // Both arms up on the canopy's straps.
      p.model.arms.left.rotation.x = -2.9;
      p.model.arms.right.rotation.x = -2.9;
    } else if (pose.hurt && onFoot) poseHandsUp(p.model, p.t);
    else if (onFoot && y > 2) {
      // Airborne without a canopy: arms out.
      p.model.arms.left.rotation.z = 1.3;
      p.model.arms.right.rotation.z = -1.3;
    } else if (pose.aiming) p.model.arms.right.rotation.x = -Math.PI / 2;
  }

  /** A passenger: sits in their seat of the host's mower. With no such mower on this client, they stand where they are. */
  function updateRider(p: Puppet, dt: number, x: number, y: number, z: number, yaw: number): void {
    const pose = p.pose!;
    const ride = pose.ride!;
    if (p.vehicle) {
      removeVehicle(scene, p.vehicle);
      p.vehicle = null;
    }
    p.vehCode = -1;
    const host = hostVehicle(ride.host);
    if (p.canopy) p.canopy.visible = false;
    if (host) {
      seatWorld(host, seat, ride.seat);
      p.x = seat.x; p.y = seat.y; p.z = seat.z;
      state.position.copy(seat);
      state.facing = host.yaw;
    } else {
      p.x = x; p.y = y; p.z = z;
      state.position.set(x, y, z);
      state.facing = yaw;
    }
    state.velocity.set(0, 0, 0);
    state.grounded = true;
    state.sitting = !!host;
    p.model.update(state, dt);
    p.model.arms.left.rotation.z = 0;
    p.model.arms.right.rotation.z = 0;
    if (pose.hurt && !host) poseHandsUp(p.model, p.t);
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
      const label = nameLabel(info.name);
      model.object.add(label);
      scene.add(model.object);
      puppets.set(info.id, {
        id: info.id, name: info.name, model, label,
        interp: new Interp({ angles: [3], pos: [0, 1, 2], snapDist: 25 }),
        s: [0, 0, 0, 0],
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
      // Drivers first, so a rider sits in a mower that has already moved this frame.
      for (const p of puppets.values()) {
        if (!p.pose || !p.interp.sample(p.s)) { p.model.object.visible = false; continue; }
        p.model.object.visible = true;
        if (p.pose.ride) continue;
        p.t += dt;
        updateDriver(p, dt, p.s[0], p.s[1], p.s[2], p.s[3]);
      }
      for (const p of puppets.values()) {
        if (!p.pose?.ride || !p.model.object.visible) continue;
        updateRider(p, dt, p.s[0], p.s[1], p.s[2], p.s[3]);
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
      return [...puppets.values()].filter((p) => p.pose).map((p) => ({ x: p.x, z: p.z, name: p.name }));
    },
    count: () => puppets.size,
    vehicleOf(id) {
      return puppets.get(id)?.vehicle ?? null;
    },
    isRemoteDriven(v) {
      for (const p of puppets.values()) if (p.vehicle === v) return true;
      return false;
    },
    nearestRide(x, z, range) {
      let best: RideTarget | null = null;
      let bestD = range;
      for (const p of puppets.values()) {
        const v = p.vehicle;
        if (!v || !p.pose || p.pose.ride || passengerCount(v.spec) === 0) continue;
        if (Math.abs(v.y - p.y) > 2) continue;
        const d = Math.hypot(v.x - x, v.z - z) - (v.spec.radius - 1);
        if (d >= bestD) continue;
        let free = false;
        for (let s = 1; s <= passengerCount(v.spec); s++) {
          if (!seatTaken(p.id, s)) { free = true; break; }
        }
        if (!free) continue;
        bestD = d;
        best = { host: p.id, name: p.name, vehicle: v };
      }
      return best;
    },
  };
}

