// Other online players: their own gnome (resolveLook), their mower when they drive, hands up while hurt, their name over
// their head, and a seat in someone else's mower when they ride along (seats.ts).
import * as THREE from 'three';
import { createGnomeModel, resolveLook, type GnomeModel } from '@lawn/gnome';
import { decodeLoadout, defaultLoadout } from '@lawn/glaze';
import { buildPrefab } from '@lawn/prefabs';
import { createEmotePlayer, type EmotePlayer } from '@lawn/emotes';
import { Interp } from '@lawn/mp/interp';
import type { PlayerInfo } from '@lawn/mp/protocol';
import { createAnimator, type Animator } from './anim/animator';
import { createRideAnimator, type RideAnimator, type RideInfo } from './anim/rideAuto';
import { settleOnWaves } from './boatWaves';
import { createFishPose, type FishPose } from './fishing/fishPose';
import { RODS, rodById } from './fishing/tackle';
import { clearHands, poseHands } from './driverHands';
import { poseHandsUp, randomTownLook } from './gnomes';
import { decodeGunWire } from './gunMods';
import { clearGunArms, placeInHand, poseGunArms } from './gunHold';
import { buildModdedGun } from './gunRig';
import { VEHICLE_CODES, type RemotePose } from './net';
import { ACT, type RemoteActivity } from './online/protocol';
import type { StationId } from './radio/content';
import { GUNS } from './config';
import { isClosed, passengerCount } from './seats';
import { aboveGround } from './terrain';
import type { Vehicle } from './types';
import { createVehicle, removeVehicle, seatWorld, setVehicleLook, syncVehicleMesh } from './vehicles';

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
  /** Tuned radio station of this player's vehicle, or null. */
  station: StationId | null;
  /** The gun in this player's right hand (built from their gun code), or null. */
  held: THREE.Object3D | null;
  /** The prefab id of `held`, or null. */
  heldPrefab: string | null;
  /** True while the gun pose (gunHold.ts) is on the arms. */
  gunPosed: boolean;
  /** Aim pitch shown on the gun pose, eased toward the latest pose's pitch (radians). */
  pitch: number;
  /** The latest activity (emote, rod, binoculars) sent for this player, or null. */
  act: RemoteActivity | null;
  /** Plays the activity's arm animations (anim rows by id). */
  anim: Animator;
  /** Plays the player's own @lawn/emotes ('lawn:' ids), created on first use. */
  lawn: EmotePlayer | null;
  /** The emoteSeq last started (-1 before any). */
  seq: number;
  /** The fishing pose, created on first use. */
  fish: FishPose | null;
  /** The rod id last set on `fish` ('?' before any: never a real id). */
  rodId: string;
  /** True while the fishing pose and rod are on the gnome. */
  rodOn: boolean;
  /** The fishing phase last seen, and seconds in it on this client's own clock. */
  phase: string;
  phaseT: number;
  /** The bobber in the water and the line to the rod tip, created on first use and added to the scene. */
  bobber: THREE.Mesh | null;
  line: THREE.Line | null;
  /** The seat/driver ride pose (anim/rideAuto.ts) and whether it is on. */
  ride: RideAnimator;
  riding: boolean;
  /** The info the ride pose reads, filled each frame (one object per puppet). */
  rideInfo: Omit<RideInfo, 'rideT'>;
}

/** The emote prefix for a @lawn/emotes id (see anim/playerEmote.ts). */
const LAWN_EMOTE = 'lawn:';
const tipOut = new THREE.Vector3();

/** How fast a remote player's shown aim pitch catches up with the wire (per second; ~60 ms to close most of a step). */
const PITCH_EASE = 16;
/** Ease `shown` toward `target` over dt seconds, frame-rate independent. */
export function easePitch(shown: number, target: number, dt: number): number {
  return shown + (target - shown) * (1 - Math.exp(-PITCH_EASE * dt));
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
  blips(): { x: number; z: number; name: string; id: number }[];
  count(): number;
  /** The mower a remote player is driving, or null. */
  vehicleOf(id: number): Vehicle | null;
  /** True while `v` is still a mower some remote player drives (it goes when they get out). */
  isRemoteDriven(v: Vehicle): boolean;
  /** The nearest remote mower within `range` of (x, z) that still has a free seat, or null. */
  nearestRide(x: number, z: number, range: number): RideTarget | null;
  /** Store a remote player's tuned radio station. */
  setRadio(id: number, station: StationId | null): void;
  /** Store what a remote player's vehicle wears (an encodeLoadout code, null = stock) and dress their vehicle in it. */
  setLook(id: number, code: string | null): void;
  /** Store the gun a remote player holds (an encodeGunWire code, null = stock pistol) and put it in their gnome's hand. */
  setGun(id: number, code: string | null): void;
  /** Get a remote player's tuned radio station. */
  stationOf(id: number): StationId | null;
  /** Get a remote player's display name. */
  nameOf(id: number): string | null;
  /** What a remote player is doing with their hands (emote, rod, binoculars; online/actSync.ts), null = nothing. */
  setActivity(id: number, a: RemoteActivity | null): void;
  /** The activity last set for a remote player (tests and the two-client check), or null. */
  activityOf(id: number): RemoteActivity | null;
  /** Nearest remote vehicle with an active radio within maxDist. */
  nearestRadioVehicle(
    x: number,
    y: number,
    z: number,
    maxDist: number,
  ): { x: number; y: number; z: number; station: StationId; dist: number } | null;
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
  /** What each remote player's vehicle wears (an encodeLoadout code, or null for stock), by player id. */
  const looks = new Map<number, string | null>();
  /** The gun each remote player holds (an encodeGunWire code, or null for the stock pistol), by player id. */
  const guns = new Map<number, string | null>();
  /** What each remote player is doing with their hands (emote, rod, binoculars), by player id. */
  const acts = new Map<number, RemoteActivity>();
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
    p.fish?.clear(p.model);
    if (p.bobber) {
      scene.remove(p.bobber);
      p.bobber.geometry.dispose();
      (p.bobber.material as THREE.Material).dispose();
      p.bobber = null;
    }
    if (p.line) {
      scene.remove(p.line);
      p.line.geometry.dispose();
      (p.line.material as THREE.Material).dispose();
      p.line = null;
    }
  }

  /** Hide the fishing bobber and line (they are built on first use, so either may be missing). */
  function hideBobber(p: Puppet): void {
    if (p.bobber) p.bobber.visible = false;
    if (p.line) p.line.visible = false;
  }

  /** The rod comes off: the arms go back and the bobber and line go. */
  function clearRod(p: Puppet): void {
    if (p.rodOn) p.fish?.clear(p.model);
    p.rodOn = false;
    hideBobber(p);
  }

  /** Stop any emote and the rod pose at once (in a vehicle, under a chute, or as a rider). */
  function cancelAct(p: Puppet): void {
    if (p.anim.active) p.anim.cancel(p.model);
    if (p.lawn?.current) { p.lawn.stop(); p.lawn.update(1, false); }
    clearRod(p);
  }

  /** Show the bobber at `bob` (world space) with the line from the rod tip to it; hide both when there is none. */
  function showBobber(p: Puppet, bob: { x: number; y: number; z: number } | null): void {
    if (!bob || !p.fish) { hideBobber(p); return; }
    if (!p.bobber) {
      p.bobber = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      scene.add(p.bobber);
    }
    if (!p.line) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(6, 3));
      p.line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x222222 }));
      scene.add(p.line);
    }
    p.bobber.position.set(bob.x, bob.y, bob.z);
    p.bobber.visible = true;
    const tip = p.fish.tip(p.model, tipOut);
    const pos = p.line.geometry.getAttribute('position') as THREE.BufferAttribute;
    pos.setXYZ(0, tip.x, tip.y, tip.z);
    pos.setXYZ(1, bob.x, bob.y, bob.z);
    pos.needsUpdate = true;
    p.line.geometry.computeBoundingSphere();
    p.line.visible = true;
  }

  /** Emote, fishing rod and binoculars for a player on foot, on the ground and not hurt (`a` null: none). */
  function actPose(p: Puppet, a: RemoteActivity | null, dt: number): void {
    const pose = p.pose!;
    if (a?.emote && a.emoteSeq !== p.seq) {
      p.seq = a.emoteSeq;
      if (a.emote.startsWith(LAWN_EMOTE)) {
        p.anim.cancel(p.model);
        p.lawn ??= createEmotePlayer(p.model);
        p.lawn.play(a.emote.slice(LAWN_EMOTE.length));
      } else {
        p.lawn?.stop();
        p.anim.play(a.emote);
      }
    } else if (!a?.emote && (p.anim.active || p.lawn?.current)) {
      p.anim.stop();
      p.lawn?.stop();
    }
    p.anim.apply(p.model, dt);
    p.lawn?.update(dt, pose.moving);

    if (a?.mode === ACT.rod) {
      if (!p.fish) { p.fish = createFishPose(); p.rodId = '?'; }
      if (a.rod !== p.rodId) { p.rodId = a.rod; p.fish.setRod(rodById(a.rod) ?? RODS[0]); }
      if (a.phase !== p.phase) { p.phase = a.phase; p.phaseT = 0; }
      p.phaseT += dt;
      p.fish.apply(p.model, a.phase, p.phaseT, a.charge, dt);
      p.rodOn = true;
      showBobber(p, a.bobber);
    } else if (p.rodOn) {
      clearRod(p);
    }

    if (a?.mode === ACT.scope) {
      p.model.arms.left.rotation.x = -2.3;
      p.model.arms.right.rotation.x = -2.3;
      p.model.arms.left.rotation.z = -0.35;
      p.model.arms.right.rotation.z = 0.35;
    }
  }

  /** Fill the ride info of a seated puppet (the same fields player.ts gives the local rider). */
  function fillRide(info: Omit<RideInfo, 'rideT'>, v: Vehicle, seat: number, seed: number): void {
    info.kind = v.kind;
    info.flies = v.spec.flies;
    info.fixedWing = !!v.spec.fixedWing;
    info.boat = !!v.spec.boat;
    info.closed = isClosed(v.spec);
    info.seat = seat;
    info.speedFrac = Math.min(1, Math.abs(v.speed) / Math.max(1, v.spec.maxSpeed));
    info.seed = seed;
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

  /** Dress a remote vehicle in a look (null or unreadable: stock). Vehicles with no glaze rig ignore looks. */
  function dress(v: Vehicle, code: string | null | undefined): void {
    if (!v.rig) return;
    const look = code ? decodeLoadout(code) : null;
    setVehicleLook(v, look ?? defaultLoadout(v.tint));
  }

  /** Put the gun a player holds in their right hand, replacing the one there. Stock pistol when the code is missing or unreadable. */
  function holdGun(p: Puppet, code: string | null | undefined): void {
    if (p.held) {
      p.model.arms.right.remove(p.held);
      p.held = null;
      p.heldPrefab = null;
    }
    try {
      const d = code ? decodeGunWire(code) : null;
      const kind = d?.gun ?? 'pistol';
      const gun = buildModdedGun(kind, d?.loadout ?? {});
      placeInHand(gun, GUNS[kind].prefab, p.model.arms.right);
      p.held = gun;
      p.heldPrefab = GUNS[kind].prefab;
    } catch { /* prefab missing: no gun */ }
  }

  /** A player on foot, or driving their own mower, as the pose says. */
  function updateDriver(p: Puppet, dt: number, x: number, y: number, z: number, yaw: number): void {
    const pose = p.pose!;
    const hadVehicle = p.vehicle !== null;
    // Swap the mower model when they get in or out, or change mowers.
    if (pose.veh !== p.vehCode) {
      if (p.vehicle) removeVehicle(scene, p.vehicle);
      p.vehicle = null;
      p.vehCode = pose.veh;
      const kind = VEHICLE_CODES[p.vehCode];
      if (kind) {
        p.vehicle = createVehicle(scene, kind, x, z, yaw, pose.tint);
        p.vehicle.driver = 'remote';
        // A look that arrived before they got in (or while on foot) is worn from the start.
        dress(p.vehicle, looks.get(p.id));
      }
    }
    const moved = Math.hypot(x - p.x, z - p.z) / Math.max(dt, 1e-3);
    p.x = x; p.y = y; p.z = z;
    const onFoot = !p.vehicle;
    // Out of the vehicle on this frame: let go of the wheel.
    if (onFoot && hadVehicle) clearHands(p.model);
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
      // An aircraft pitches and rolls as its pilot's does (eased, so a step in the wire does not snap).
      if (v.air) {
        const k = 1 - Math.exp(-10 * dt);
        v.air.pitch += ((pose.tilt?.pitch ?? 0) - v.air.pitch) * k;
        v.air.roll += ((pose.tilt?.roll ?? 0) - v.air.roll) * k;
      }
      // A remote boat rides the local waves (boatWaves.ts); syncVehicleMesh places the mesh, tilts a flyer and spins its
      // wheels and rotor, as for the local vehicle.
      if (v.spec.boat) settleOnWaves(v, dt);
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
    state.grounded = aboveGround(x, y, z) < 0.05 || !!p.vehicle;
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
    }
    // Activities (online/actSync.ts) only on foot, on the ground and not hurt; an emote or the rod takes the hands, so no gun.
    const free = onFoot && !pose.chute && !pose.hurt && y <= 2;
    const a = free ? p.act : null;
    const handsBusy = !!a && (!!a.emote || a.mode === ACT.rod);
    // Guns: the same pose as the local player (gunHold.ts): at the ready on foot, raised along their aim pitch while aiming.
    p.pitch = easePitch(p.pitch, pose.aiming ? pose.pitch : 0, dt);
    const gunPose = free && !!p.held && !handsBusy;
    if (p.held) p.held.visible = !handsBusy;
    if (gunPose) { poseGunArms(p.model, p.heldPrefab, { aiming: pose.aiming, pitch: p.pitch }, p.held); p.gunPosed = true; }
    else if (p.gunPosed) { clearGunArms(p.model, p.held); p.gunPosed = false; }
    if (free) actPose(p, a, dt);
    else cancelAct(p);
    // Driving: the hands follow the wheel. Runs last so it wins over the arm poses above.
    if (p.vehicle) poseHands(p.model, p.vehicle, 0, dt);
    // The seat pose of the driver (their personality, on top of the hands); off when they get out.
    if (p.vehicle) {
      fillRide(p.rideInfo, p.vehicle, 0, p.id);
      p.ride.update(p.model, p.rideInfo, dt);
      p.riding = true;
    } else if (p.riding) {
      p.ride.cancel(p.model);
      p.riding = false;
    }
  }

  /** A passenger: sits in their seat of the host's mower. With no such mower on this client, they stand where they are. */
  function updateRider(p: Puppet, dt: number, x: number, y: number, z: number, yaw: number): void {
    const pose = p.pose!;
    const ride = pose.ride!;
    if (p.vehicle) {
      removeVehicle(scene, p.vehicle);
      p.vehicle = null;
      // Passengers do not hold the wheel: let go of it.
      clearHands(p.model);
    }
    p.vehCode = -1;
    const host = hostVehicle(ride.host);
    if (p.canopy) p.canopy.visible = false;
    // No emote or rod in a seat.
    cancelAct(p);
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
    // The seat pose, from the seat the rider has in the host's mower (none without that mower here: stand).
    if (host) {
      fillRide(p.rideInfo, host, ride.seat, p.id);
      p.ride.update(p.model, p.rideInfo, dt);
      p.riding = true;
    } else if (p.riding) {
      p.ride.cancel(p.model);
      p.riding = false;
    }
  }

  return {
    join(info) {
      if (puppets.has(info.id)) return;
      const look = resolveLook(info) ?? randomTownLook();
      const model = createGnomeModel({ ...look, hat: info.color }, { overrideEquipment: ['hand'] });
      model.object.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
      const label = nameLabel(info.name);
      model.object.add(label);
      scene.add(model.object);
      const p: Puppet = {
        id: info.id, name: info.name, model, label,
        interp: new Interp({ angles: [3], pos: [0, 1, 2], snapDist: 25 }),
        s: [0, 0, 0, 0],
        pose: null, vehicle: null, vehCode: -1, x: 0, y: 0, z: 0, t: 0, canopy: null, station: null, held: null, heldPrefab: null, gunPosed: false, pitch: 0,
        act: acts.get(info.id) ?? null, anim: createAnimator(), lawn: null, seq: -1,
        fish: null, rodId: '?', rodOn: false, phase: '', phaseT: 0, bobber: null, line: null,
        ride: createRideAnimator(), riding: false,
        rideInfo: { kind: '', flies: false, fixedWing: false, boat: false, closed: false, seat: 0, speedFrac: 0, seed: 0 },
      };
      holdGun(p, guns.get(info.id));
      puppets.set(info.id, p);
    },
    leave(id) {
      looks.delete(id);
      guns.delete(id);
      acts.delete(id);
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
      looks.clear();
      guns.clear();
      acts.clear();
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
      return [...puppets.values()].filter((p) => p.pose).map((p) => ({ x: p.x, z: p.z, name: p.name, id: p.id }));
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
    setLook(id, code) {
      looks.set(id, code);
      const p = puppets.get(id);
      if (p?.vehicle) dress(p.vehicle, code);
    },
    setGun(id, code) {
      guns.set(id, code);
      const p = puppets.get(id);
      if (p) holdGun(p, code);
    },
    setRadio(id, station) {
      const p = puppets.get(id);
      if (p) p.station = station;
    },
    stationOf(id) {
      return puppets.get(id)?.station ?? null;
    },
    nameOf(id) {
      return puppets.get(id)?.name ?? null;
    },
    setActivity(id, a) {
      if (a) acts.set(id, a); else acts.delete(id);
      const p = puppets.get(id);
      if (p) p.act = a;
    },
    activityOf(id) {
      return acts.get(id) ?? null;
    },
    nearestRadioVehicle(x, y, z, maxDist) {
      let best: { x: number; y: number; z: number; station: StationId; dist: number } | null = null;
      let bestD = maxDist;
      for (const p of puppets.values()) {
        if (!p.vehicle || !p.station) continue;
        const d = Math.hypot(p.vehicle.x - x, p.vehicle.y - y, p.vehicle.z - z);
        if (d < bestD) {
          bestD = d;
          best = { x: p.vehicle.x, y: p.vehicle.y, z: p.vehicle.z, station: p.station, dist: d };
        }
      }
      return best;
    },
  };
}

