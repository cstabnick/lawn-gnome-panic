// Objective runner for 'passenger' (E20, L58): pick a character up at their home or workplace, drive them, drop them off.
// The character waits at `pickup`; the player pulls up in a ground vehicle and stops, the character walks over and takes a
// passenger seat (hidden when the vehicle has none), rides to `dropAt`, gets out and walks a few steps toward it.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import { createAnimator, type Animator } from '../anim/animator';
import { CAST } from '../cutscene/cast';
import { gnomeState, makeGnome, randomTownLook } from '../gnomes';
import { exitLocal, passengerCount, seatPos } from '../seats';
import { heightAt } from '../terrain';
import { placeOnGround } from '../terrainMesh';
import type { Blip, Vehicle, VehicleKind, VehicleSpec } from '../types';
import { VEHICLES } from '../config';
import { createVehicle, removeVehicle, syncVehicleMesh } from '../vehicles';
import { clearVehicleSpawn } from './objectivesDrive';
import { restoreVehicle } from './questPins';
import type { ObjectiveDef, QuestDeps, Run } from './types';

type PassengerObj = Extract<ObjectiveDef, { kind: 'passenger' }>;

const PICKUP_COLOR = '#ff7a00';
const DROP_COLOR = '#45e68b';
/** Below this speed (m/s) the vehicle counts as stopped for boarding and dropping off. */
export const STOP_SPEED = 2;
/** Seconds the character takes to walk to the vehicle. */
export const BOARD_SECONDS = 1;
/** Seconds the character takes to walk away from the vehicle after getting out, and how far (m). */
export const ALIGHT_SECONDS = 1.5;
export const ALIGHT_WALK = 3;
/** A parked ride is not added when a usable ground vehicle is this close to the pickup (m). */
export const RIDE_NEAR = 25;
/** On foot this close to the pickup (m) with no usable ground vehicle within RESCUE_RIDE (m): a ride is parked there. */
export const RESCUE_NEAR = 15;
export const RESCUE_RIDE = 40;
/** The toast when that ride turns up. */
export function rescueLine(name: string): string {
  return `${name}: There's a mower round the side. Take that.`;
}
/** The on-foot hint shows within this distance of the pickup, beyond `radius` (m). */
const HINT_NEAR = 12;
/** First banter line after this many seconds of riding, then one every BANTER_GAP seconds. */
export const BANTER_FIRST = 4;
export const BANTER_GAP = 10;

// ---- Pure helpers (tested in objectivesPassenger.test.ts) ----------------------------------------------------------

/** A vehicle that drives on the ground: not a plane, aircraft or boat. */
export function isGroundSpec(spec: Pick<VehicleSpec, 'flies' | 'boat' | 'air'>): boolean {
  return !spec.flies && !spec.boat && !spec.air;
}

/** The player can take the passenger on: driving a ground vehicle, within `radius` of the spot, below STOP_SPEED. */
export function canStopFor(o: { ground: boolean; dist: number; radius: number; speed: number }): boolean {
  return o.ground && o.dist <= o.radius && Math.abs(o.speed) < STOP_SPEED;
}

/** Hp lost since boarding is past `maxDamage` (0..1). No limit when maxDamage is undefined. */
export function tooRough(hpAtBoard: number, hpNow: number, maxDamage: number | undefined): boolean {
  return maxDamage !== undefined && hpAtBoard - hpNow > maxDamage;
}

/** How many banter lines are due after `rideSeconds` of riding (capped at `count`). */
export function banterDue(rideSeconds: number, count: number): number {
  if (rideSeconds < BANTER_FIRST) return 0;
  return Math.min(count, 1 + Math.floor((rideSeconds - BANTER_FIRST) / BANTER_GAP));
}

/** The character's full look: a town look, then the CAST entry's look, then the objective's override. */
export function passengerLook(who: string, look: Partial<GnomeLook> | undefined, base: GnomeLook): GnomeLook {
  return { ...base, ...(CAST[who]?.look ?? {}), ...(look ?? {}) } as GnomeLook;
}

// ---- The runner ----------------------------------------------------------------------------------------------------

function makeGroundRing(scene: THREE.Scene, x: number, z: number, radius: number, color: number): THREE.Mesh {
  const geo = new THREE.RingGeometry(Math.max(0.5, radius - 0.5), radius, 36);
  const mat = flatLayer(new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.55, depthWrite: false }), LAYER.marker);
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  placeOnGround(m, x, z, 0.08, true);
  scene.add(m);
  return m;
}

function freeModel(model: GnomeModel): void {
  model.object.removeFromParent();
  model.object.traverse((o) => {
    const g = (o as THREE.Mesh).geometry;
    if (g) g.dispose();
  });
}

type Phase = 'wait' | 'boarding' | 'riding' | 'alighting' | 'done' | 'failed';

export function passengerRun(
  obj: PassengerObj,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  const [px0, pz0] = obj.pickup;
  const [dx, dz] = obj.dropAt;
  const look = passengerLook(obj.who, obj.look, randomTownLook());

  // Face the road: toward the nearest ground road node (or the drop-off when there is no road graph).
  let faceYaw = Math.atan2(dx - px0, dz - pz0);
  {
    let bestD = Infinity;
    for (const n of deps.world.roads?.nodes ?? []) {
      if (n.deck !== undefined) continue;
      const d = Math.hypot(n.x - px0, n.z - pz0);
      if (d > 1 && d < bestD) {
        bestD = d;
        faceYaw = Math.atan2(n.x - px0, n.z - pz0);
      }
    }
  }

  let model: GnomeModel | null = makeGnome(deps.scene, look);
  let animator: Animator | null = null;
  // Where the model stands in the world while on foot.
  let gx = px0;
  let gz = pz0;
  let gyaw = faceYaw;
  const pose = (dt: number, speed: number): void => {
    if (!model) return;
    model.update(gnomeState(gx, heightAt(gx, gz), gz, gyaw, speed), dt);
  };
  pose(0, 0);

  const ring = makeGroundRing(deps.scene, px0, pz0, obj.radius, 0xff7a00);

  // A ride parked near the pickup: when asked and none is close, or later when the player turns up on foot with no ride.
  let parked: Vehicle | null = null;
  let parkedAt: [number, number, number] | null = null;
  const usableNear = (within: number): boolean => (deps.vehicles ?? []).some((v) =>
    isGroundSpec(v.spec) && !v.exploded && !v.sunk && (v.driver === 'none' || v.driver === 'player')
    && Math.hypot(v.x - px0, v.z - pz0) <= within);
  const parkRide = (kind: VehicleKind, x: number, z: number, yaw: number): void => {
    const [vx, vz] = clearVehicleSpawn(x, z, VEHICLES[kind].radius, deps.world);
    parked = createVehicle(deps.scene, kind, vx, vz, yaw);
    parked.questOwned = true;
    parkedAt = [vx, vz, yaw];
    deps.vehicles?.push(parked);
  };
  /** Put the parked ride back on its spot, whole and stopped. */
  const resetParked = (): void => {
    if (!parked || !parkedAt) return;
    restoreVehicle(parked);
    parked.x = parkedAt[0];
    parked.z = parkedAt[1];
    parked.y = heightAt(parkedAt[0], parkedAt[1]);
    parked.yaw = parkedAt[2];
    parked.driver = 'none';
    syncVehicleMesh(parked, 0);
  };
  if (obj.vehicle && !usableNear(RIDE_NEAR)) parkRide(obj.vehicle.kind, obj.vehicle.at[0], obj.vehicle.at[1], obj.vehicle.at[2]);

  let phase: Phase = 'wait';
  let ride: Vehicle | null = null;
  let seat = 0;
  let hpAtBoard = 1;
  let phaseT = 0;
  let rideT = 0;
  let banterIdx = 0;
  let failReason: string | null = null;
  let fromX = 0;
  let fromZ = 0;
  let toX = 0;
  let toZ = 0;
  let t = 0;

  const dropModel = (): void => {
    if (model) {
      if (animator) animator.cancel(model);
      freeModel(model);
    }
    model = null;
    animator = null;
  };

  const playerGroundVehicle = (): Vehicle | null => {
    const v = deps.player?.vehicle ?? null;
    return v && isGroundSpec(v.spec) && !v.exploded && (deps.player?.seat ?? 0) === 0 ? v : null;
  };

  /** Put the walking model into its seat on `v` (or hide it when the vehicle has no passenger seat). */
  const takeSeat = (v: Vehicle): void => {
    if (!model) return;
    seat = passengerCount(v.spec) > 0 ? 1 : 0;
    if (seat > 0) {
      const [sx, sy, sz] = seatPos(v.spec, seat);
      v.object.add(model.object);
      model.update(gnomeState(sx, sy, sz, 0, 0, true), 0);
      animator = createAnimator();
      animator.play(v.spec.flies ? 'plane-passenger' : 'golf-cart-passenger', { loop: true });
    } else {
      deps.scene.remove(model.object);
      model.object.visible = false;
    }
  };

  /** Take the model out of `v` and stand it beside the vehicle (the seat's exit side). */
  const leaveSeat = (v: Vehicle): void => {
    if (!model) return;
    if (animator) animator.cancel(model);
    animator = null;
    model.object.removeFromParent();
    model.object.visible = true;
    deps.scene.add(model.object);
    const local = exitLocal(v.spec, seat);
    const c = Math.cos(v.yaw);
    const s = Math.sin(v.yaw);
    gx = v.x + local.x * c + local.z * s;
    gz = v.z - local.x * s + local.z * c;
    fromX = gx;
    fromZ = gz;
    const d = Math.hypot(dx - gx, dz - gz) || 1;
    const walk = Math.min(ALIGHT_WALK, d);
    toX = gx + ((dx - gx) / d) * walk;
    toZ = gz + ((dz - gz) / d) * walk;
    gyaw = Math.atan2(toX - gx, toZ - gz);
    pose(0, 0);
  };

  return {
    lines: () => {
      if (phase === 'riding' || phase === 'alighting') return [obj.text, `Drop ${obj.name} at {{${obj.hint}}}`];
      const p = deps.player;
      const out = [obj.text, `Pick up ${obj.name}: pull up and stop`];
      if (p && !p.vehicle && Math.hypot(p.x - px0, p.z - pz0) <= obj.radius + HINT_NEAR) out.push(`Bring a ride: ${obj.name} won't walk.`);
      return out;
    },
    done: () => phase === 'done',
    failed: () => failReason,
    update(dt) {
      t += dt;
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.2 * Math.sin(t * 3.5);
      const p = deps.player;

      // A parked ride wrecked before the pickup: put a fresh one back where it was.
      if (parked && parkedAt && phase === 'wait' && (parked.exploded || parked.sunk) && p?.vehicle !== parked) resetParked();

      // The player came on foot (their ride wrecked, or none): a ride turns up beside the pickup.
      const wrecked = !!p?.vehicle && (p.vehicle.exploded || p.vehicle.sunk);
      if (phase === 'wait' && p && (!p.vehicle || wrecked) && Math.hypot(p.x - px0, p.z - pz0) <= RESCUE_NEAR && !usableNear(RESCUE_RIDE)) {
        if (parked) resetParked();
        else parkRide(obj.vehicle?.kind ?? 'ride-on', px0 + 4 * Math.cos(faceYaw), pz0 - 4 * Math.sin(faceYaw), faceYaw);
        say(rescueLine(obj.name));
      }

      if (phase === 'wait') {
        pose(dt, 0);
        const v = playerGroundVehicle();
        if (v && !v.exploded && !v.sunk && canStopFor({ ground: true, dist: Math.hypot(v.x - px0, v.z - pz0), radius: obj.radius, speed: v.speed })) {
          ride = v;
          phase = 'boarding';
          phaseT = 0;
          fromX = gx;
          fromZ = gz;
        }
        return;
      }

      if (phase === 'boarding' && ride) {
        // E22 (fuzz): the ride was wrecked, or the player drove off or got out, while the passenger walked to it: they
        // walk back to the pickup and wait for the next stop (a fresh ride is found or parked by the 'wait' phase).
        if (ride.exploded || p?.vehicle !== ride) {
          ride = null;
          phase = 'wait';
          gx = px0;
          gz = pz0;
          return;
        }
        phaseT += dt;
        // Walk toward the vehicle's side (it may have rolled a little).
        const side = exitLocal(ride.spec, passengerCount(ride.spec) > 0 ? 1 : 0);
        const c = Math.cos(ride.yaw);
        const s = Math.sin(ride.yaw);
        toX = ride.x + side.x * c + side.z * s;
        toZ = ride.z - side.x * s + side.z * c;
        const k = Math.min(1, phaseT / BOARD_SECONDS);
        gx = fromX + (toX - fromX) * k;
        gz = fromZ + (toZ - fromZ) * k;
        gyaw = Math.atan2(toX - fromX, toZ - fromZ);
        pose(dt, Math.hypot(toX - fromX, toZ - fromZ) / BOARD_SECONDS);
        if (k >= 1) {
          takeSeat(ride);
          hpAtBoard = ride.hp;
          phase = 'riding';
          rideT = 0;
          ring.position.set(dx, heightAt(dx, dz) + 0.08, dz);
          (ring.material as THREE.MeshBasicMaterial).color.set(0x45e68b);
          say(obj.onBoard ?? `${obj.name} climbs in.`);
        }
        return;
      }

      if (phase === 'riding' && ride) {
        if (model && animator && seat > 0) {
          const [sx, sy, sz] = seatPos(ride.spec, seat);
          model.update(gnomeState(sx, sy, sz, 0, 0, true), dt);
          animator.apply(model, dt);
        }
        if (ride.exploded || tooRough(hpAtBoard, ride.hp, obj.maxDamage)) {
          failReason = `${obj.name} got out: too rough`;
          phase = 'failed';
          dropModel();
          return;
        }
        const driving = p?.vehicle === ride;
        if (!driving) return; // the passenger waits in the vehicle
        rideT += dt;
        const banter = obj.banter ?? [];
        while (banterIdx < banterDue(rideT, banter.length)) say(banter[banterIdx++]);
        if (canStopFor({ ground: true, dist: Math.hypot(ride.x - dx, ride.z - dz), radius: obj.radius, speed: ride.speed })) {
          leaveSeat(ride);
          phase = 'alighting';
          phaseT = 0;
        }
        return;
      }

      if (phase === 'alighting') {
        phaseT += dt;
        const k = Math.min(1, phaseT / ALIGHT_SECONDS);
        gx = fromX + (toX - fromX) * k;
        gz = fromZ + (toZ - fromZ) * k;
        pose(dt, k < 1 ? ALIGHT_WALK / ALIGHT_SECONDS : 0);
        if (k >= 1) {
          phase = 'done';
          say(obj.onDrop ?? `${obj.name} hops out. Thanks for the lift!`);
          changed();
        }
      }
    },
    onCracked() {},
    blips: (): Blip[] => {
      if (phase === 'done' || phase === 'failed') return [];
      if (phase === 'riding' || phase === 'alighting') return [{ x: dx, z: dz, color: DROP_COLOR, quest: obj.hint }];
      return [{ x: px0, z: pz0, color: PICKUP_COLOR, quest: obj.name }];
    },
    cracked: () => [],
    cleanup() {
      dropModel();
      deps.scene.remove(ring);
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      if (parked) {
        parked.questOwned = false;
        if (deps.vehicles && deps.player?.vehicle !== parked) {
          const idx = deps.vehicles.indexOf(parked);
          if (idx >= 0) deps.vehicles.splice(idx, 1);
          removeVehicle(deps.scene, parked);
        }
        parked = null;
      }
    },
  };
}
