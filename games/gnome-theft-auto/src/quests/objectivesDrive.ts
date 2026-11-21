// Objective runners for vehicle-based story missions: steal-deliver, chase-follow, and convoy-ambush.
import * as THREE from 'three';
import { angleDiff } from '../collide';
import { gnomeState, makeGnome, randomTownLook } from '../gnomes';
import type { Blip, Npc, Vehicle } from '../types';
import { collideVehicles, createVehicle, removeVehicle, repairVehicle, stepVehicle, syncVehicleMesh } from '../vehicles';
import type { ObjectiveDef, QuestDeps, Run } from './types';

const TARGET_COLOR = '#ff7a00';
const DROP_COLOR = '#45e68b';

function makeCone(color = 0xffd23f): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.7, 4),
    new THREE.MeshBasicMaterial({ color }),
  );
  m.rotation.x = Math.PI;
  m.position.y = 2.6;
  return m;
}

function makeGroundRing(scene: THREE.Scene, x: number, z: number, radius: number, color = 0x45e68b): THREE.Mesh {
  const geo = new THREE.RingGeometry(Math.max(0.5, radius - 0.5), radius, 36);
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.55, depthWrite: false });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.08, z);
  scene.add(m);
  return m;
}

function steerToward(v: Vehicle, tx: number, tz: number, speed: number, dt: number, deps: QuestDeps): void {
  const dx = tx - v.x;
  const dz = tz - v.z;
  const targetYaw = Math.atan2(dx, dz);
  const diff = angleDiff(targetYaw, v.yaw);
  const steer = Math.max(-1, Math.min(1, diff * 2.2));
  const throttle = Math.min(1, speed / Math.max(1, v.spec.maxSpeed));
  stepVehicle(v, { throttle, steer, lift: 0 }, dt, deps.world);
  syncVehicleMesh(v, dt);
}

/** Spawn a target vehicle, optionally apply heat/damage limits, and deliver it to `dropAt`. */
export function stealDeliverRun(
  obj: Extract<ObjectiveDef, { kind: 'steal-deliver' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  const target = createVehicle(deps.scene, obj.vehicleKind, obj.spawnAt[0], obj.spawnAt[1], obj.spawnAt[2]);
  deps.vehicles?.push(target);
  const marker = makeCone(0xffd23f);
  target.object.add(marker);
  const ring = makeGroundRing(deps.scene, obj.dropAt[0], obj.dropAt[1], obj.radius);

  let heatApplied = false;
  let delivered = false;
  let t = 0;

  return {
    lines: () => [
      deps.player?.vehicle === target
        ? `Deliver the ${target.spec.name} to {{${obj.hint}}}.`
        : `${obj.text} ({{${obj.hint}}})`,
    ],
    done: () => delivered,
    update(dt) {
      t += dt;
      marker.rotation.y = t * 2.4;
      marker.position.y = 2.6 + Math.sin(t * 3) * 0.16;
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + 0.2 * Math.sin(t * 3.5);

      const driving = deps.player?.vehicle === target;
      marker.visible = !driving;
      if (driving && !heatApplied && obj.heatOnEnter) {
        heatApplied = true;
        deps.watch?.addHeat(obj.heatOnEnter);
      }
      if (obj.maxDamage !== undefined && (1 - target.hp > obj.maxDamage || target.exploded)) {
        repairVehicle(target);
        target.x = obj.spawnAt[0];
        target.z = obj.spawnAt[1];
        target.yaw = obj.spawnAt[2];
        target.speed = 0;
        if (driving && deps.player) {
          deps.player.exit();
          target.driver = 'none';
        }
        syncVehicleMesh(target, 0);
        say('Too damaged! Respawned at pickup.');
      }
      if (driving && Math.hypot(target.x - obj.dropAt[0], target.z - obj.dropAt[1]) <= obj.radius) {
        delivered = true;
        say('Delivery complete!');
        changed();
      }
    },
    onCracked() {},
    blips: (): Blip[] => {
      if (delivered) return [];
      if (deps.player?.vehicle === target) {
        return [{ x: obj.dropAt[0], z: obj.dropAt[1], color: DROP_COLOR, quest: obj.hint }];
      }
      return [{ x: target.x, z: target.z, color: TARGET_COLOR, quest: target.spec.name }];
    },
    cracked: () => [],
    cleanup() {
      target.object.remove(marker);
      deps.scene.remove(ring);
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      if (deps.vehicles && deps.player?.vehicle !== target) {
        const idx = deps.vehicles.indexOf(target);
        if (idx >= 0) deps.vehicles.splice(idx, 1);
        removeVehicle(deps.scene, target);
      }
    },
  };
}

/** Spawn an NPC leader driving through `waypoints`; player must stay within `maxDist` until the end. */
export function chaseFollowRun(
  obj: Extract<ObjectiveDef, { kind: 'chase-follow' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  const start = obj.waypoints[0] ?? [0, 0];
  const next = obj.waypoints[1] ?? start;
  const startYaw = Math.atan2(next[0] - start[0], next[1] - start[1]);
  const leader = createVehicle(deps.scene, obj.leaderKind, start[0], start[1], startYaw);
  const look = randomTownLook();
  const rider = makeGnome(leader.object, look);
  rider.object.position.set(...leader.spec.seat);
  rider.update(gnomeState(0, 0, 0, 0, 0, true), 0);
  leader.rider = rider;
  leader.riderLook = look;
  leader.driver = 'npc';
  deps.vehicles?.push(leader);

  const marker = makeCone(0x7cf0ff);
  leader.object.add(marker);

  let wpIdx = 1;
  let completed = false;
  let warnCool = 0;
  let t = 0;

  return {
    lines: () => [obj.text, `Stay within ${obj.maxDist}m of {{${obj.leaderName}}}.`],
    done: () => completed,
    update(dt, px, pz) {
      t += dt;
      warnCool = Math.max(0, warnCool - dt);
      marker.rotation.y = t * 2.5;
      if (completed) return;

      const wp = obj.waypoints[wpIdx];
      if (!wp) {
        completed = true;
        changed();
        return;
      }
      const distPlayer = Math.hypot(leader.x - px, leader.z - pz);
      if (distPlayer > obj.maxDist * 1.4) {
        leader.speed *= Math.max(0, 1 - 3 * dt);
        syncVehicleMesh(leader, dt);
        if (warnCool <= 0) {
          say(`Catch up to ${obj.leaderName}!`);
          warnCool = 4;
        }
        return;
      }
      steerToward(leader, wp[0], wp[1], obj.speed, dt, deps);
      if (Math.hypot(leader.x - wp[0], leader.z - wp[1]) < 6) {
        wpIdx++;
        if (wpIdx >= obj.waypoints.length) {
          if (distPlayer <= obj.maxDist) {
            completed = true;
            say(`Arrived with ${obj.leaderName}!`);
            changed();
          } else {
            wpIdx = obj.waypoints.length - 1;
          }
        }
      }
    },
    onCracked() {},
    blips: (): Blip[] => (completed ? [] : [{ x: leader.x, z: leader.z, color: TARGET_COLOR, quest: obj.leaderName }]),
    cracked: () => [],
    cleanup() {
      leader.object.remove(marker);
      if (deps.vehicles) {
        const idx = deps.vehicles.indexOf(leader);
        if (idx >= 0) deps.vehicles.splice(idx, 1);
      }
      removeVehicle(deps.scene, leader);
    },
  };
}

/** Spawn an HOA Dew-Hauler convoy and escorts along `route`; clear escorts and deliver hauler to `dropAt`. */
export function convoyAmbushRun(
  obj: Extract<ObjectiveDef, { kind: 'convoy-ambush' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  const start = obj.route[0] ?? [0, 260];
  const next = obj.route[1] ?? start;
  const yaw = Math.atan2(next[0] - start[0], next[1] - start[1]);
  const hauler = createVehicle(deps.scene, 'ride-on', start[0], start[1], yaw, 0xf08a24);
  const driverLook = randomTownLook({ hat: 0x141414, shirt: 0x3b3528 });
  const rider = makeGnome(hauler.object, driverLook);
  rider.object.position.set(...hauler.spec.seat);
  rider.update(gnomeState(0, 0, 0, 0, 0, true), 0);
  hauler.rider = rider;
  hauler.riderLook = driverLook;
  hauler.driver = 'npc';
  deps.vehicles?.push(hauler);

  const marker = makeCone(0xffd23f);
  hauler.object.add(marker);
  const ring = makeGroundRing(deps.scene, obj.dropAt[0], obj.dropAt[1], 12);

  const escortOffsets: [number, number][] = [];
  for (let i = 0; i < obj.escorts; i++) {
    const side = i % 2 === 0 ? -4 : 4;
    const back = -5 - Math.floor(i / 2) * 4;
    escortOffsets.push([start[0] + side, start[1] + back]);
  }
  const escorts: Npc[] = deps.watch?.spawnSquad('hoa', escortOffsets) ?? [];
  const crackedSet = new Set<Npc>();

  let wpIdx = 1;
  let doneFlag = false;
  let t = 0;

  return {
    lines: () => {
      const remainingEscorts = escorts.filter((e) => !crackedSet.has(e) && e.state !== 'ragdoll').length;
      return [
        obj.text,
        remainingEscorts > 0
          ? `HOA Escorts remaining: ${remainingEscorts}`
          : `Drive the Dew-Hauler to {{${obj.hint}}}.`,
      ];
    },
    done: () => doneFlag,
    update(dt) {
      t += dt;
      marker.rotation.y = t * 2.5;
      if (doneFlag) return;

      const wp = obj.route[wpIdx];
      if (hauler.driver === 'npc' && wp) {
        steerToward(hauler, wp[0], wp[1], 11, dt, deps);
        if (deps.vehicles) collideVehicles(deps.vehicles);
        if (Math.hypot(hauler.x - wp[0], hauler.z - wp[1]) < 8) {
          wpIdx = (wpIdx + 1) % obj.route.length;
        }
      }
      if (deps.player?.vehicle === hauler) {
        marker.visible = false;
        if (Math.hypot(hauler.x - obj.dropAt[0], hauler.z - obj.dropAt[1]) <= 12) {
          doneFlag = true;
          say('Convoy hijacked and delivered!');
          changed();
        }
      } else {
        marker.visible = true;
      }
    },
    onCracked(npc) {
      if (escorts.includes(npc)) crackedSet.add(npc);
    },
    blips: (): Blip[] => {
      if (doneFlag) return [];
      if (deps.player?.vehicle === hauler) {
        return [{ x: obj.dropAt[0], z: obj.dropAt[1], color: DROP_COLOR, quest: obj.hint }];
      }
      return [{ x: hauler.x, z: hauler.z, color: TARGET_COLOR, quest: 'Dew-Hauler' }];
    },
    cracked: () => [],
    cleanup() {
      hauler.object.remove(marker);
      deps.scene.remove(ring);
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      if (deps.vehicles && deps.player?.vehicle !== hauler) {
        const idx = deps.vehicles.indexOf(hauler);
        if (idx >= 0) deps.vehicles.splice(idx, 1);
        removeVehicle(deps.scene, hauler);
      }
    },
  };
}
