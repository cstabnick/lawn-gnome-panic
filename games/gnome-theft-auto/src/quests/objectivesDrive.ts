// Objective runners for vehicle-based story missions: steal-deliver, chase-follow, and convoy-ambush.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { angleDiff, pushOutOfBoxes } from '../collide';
import { VEHICLES } from '../config';
import { planRoute } from '../errands';
import { gnomeState, makeGnome, randomTownLook } from '../gnomes';
import type { Blip, Box, Npc, Vehicle } from '../types';
import { normalizeLoadout } from '@lawn/glaze';
import { collideVehicles, createVehicle, removeVehicle, repairVehicle, setVehicleLook, syncVehicleMesh } from '../vehicles';
import { stepNpcCar } from '../npcChassis';
import { createFollowWatchdog, setFollowStats } from './followWatchdog';
import type { ObjectiveDef, QuestDeps, Run } from './types';
import { heightAt } from '../terrain';
import { placeOnGround } from '../terrainMesh';

const TARGET_COLOR = '#ff7a00';
const DROP_COLOR = '#45e68b';

function makeCone(color = 0xffd23f): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 1.0, 4),
    new THREE.MeshBasicMaterial({ color }),
  );
  m.rotation.x = Math.PI;
  m.position.y = 2.9;
  return m;
}

export function clearVehicleSpawn(
  x: number,
  z: number,
  radius: number,
  world: QuestDeps['world'],
): [number, number] {
  const boxes = world.boxes;
  if (!boxes || boxes.length === 0) return [x, z];
  let px = x;
  let pz = z;
  let hit = false;
  for (let i = 0; i < 4; i++) {
    const p = pushOutOfBoxes(px, pz, radius + 1.0, boxes, 0);
    px = p.x;
    pz = p.z;
    hit = p.hit;
    if (!hit) break;
  }
  // If still pinched between two buildings, fall back to the nearest road node kerb.
  if (hit && world.roads?.nodes?.length) {
    let best = world.roads.nodes[0];
    let bestD = Infinity;
    for (const n of world.roads.nodes) {
      if (n.deck !== undefined) continue;
      const d = Math.hypot(n.x - x, n.z - z);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    const kerb = pushOutOfBoxes(best.x + 3.5, best.z, radius + 1.0, boxes, 0);
    return [kerb.x, kerb.z];
  }
  return [px, pz];
}

function makeGroundRing(scene: THREE.Scene, x: number, z: number, radius: number, color = 0x45e68b): THREE.Mesh {
  const geo = new THREE.RingGeometry(Math.max(0.5, radius - 0.5), radius, 36);
  const mat = flatLayer(new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.55, depthWrite: false }), LAYER.marker);
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  placeOnGround(m, x, z, 0.08, true);
  scene.add(m);
  return m;
}

function steerToward(v: Vehicle, tx: number, tz: number, speed: number, dt: number, deps: QuestDeps): void {
  const dx = tx - v.x;
  const dz = tz - v.z;
  const targetYaw = Math.atan2(dx, dz);
  const diff = angleDiff(targetYaw, v.yaw);
  const steer = Math.max(-1, Math.min(1, -diff * 2.2));
  const turnScale = Math.abs(diff) > 0.45 ? 0.55 : 1;
  const throttle = Math.min(1, (speed * turnScale) / Math.max(1, v.spec.maxSpeed));
  stepNpcCar(v, { throttle, steer, lift: 0 }, dt, deps.world);
  syncVehicleMesh(v, dt);
}

function expandRoadWaypoints(raw: [number, number][], deps: QuestDeps): [number, number][] {
  const nodes = deps.world.roads?.nodes;
  if (!nodes || nodes.length === 0 || raw.length < 2) return raw;
  const nearestNode = (x: number, z: number): number => {
    let best = -1;
    let bestD = Infinity;
    for (const n of nodes) {
      // Quest waypoints are on the ground: never snap to a skyway deck node above them.
      if (n.links.length === 0 || n.deck !== undefined) continue;
      const d = Math.hypot(n.x - x, n.z - z);
      if (d < bestD) { bestD = d; best = n.id; }
    }
    return best;
  };
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out: [number, number][] = [raw[0]];
  const pushPoint = (pt: [number, number]): void => {
    const prev = out[out.length - 1];
    if (prev && Math.hypot(prev[0] - pt[0], prev[1] - pt[1]) < 2) return;
    out.push(pt);
    // Strip immediate backtracks (A -> B -> C where A and C are close or B reverses direction along the same road).
    while (out.length >= 3) {
      const a = out[out.length - 3];
      const b = out[out.length - 2];
      const c = out[out.length - 1];
      if (Math.hypot(a[0] - c[0], a[1] - c[1]) < 6) {
        out.splice(out.length - 2, 1);
        continue;
      }
      const abx = b[0] - a[0], abz = b[1] - a[1];
      const bcx = c[0] - b[0], bcz = c[1] - b[1];
      const abLen = Math.hypot(abx, abz);
      const bcLen = Math.hypot(bcx, bcz);
      if (abLen > 0.1 && bcLen > 0.1 && (abx * bcx + abz * bcz) / (abLen * bcLen) < -0.92) {
        out.splice(out.length - 2, 1);
        continue;
      }
      break;
    }
  };
  for (let i = 0; i < raw.length - 1; i++) {
    const a = raw[i];
    const b = raw[i + 1];
    const fromId = nearestNode(a[0], a[1]);
    const toId = nearestNode(b[0], b[1]);
    const route = fromId >= 0 && toId >= 0 ? planRoute(nodes, fromId, toId) : null;
    if (route && route.length > 0) {
      for (let k = 0; k < route.length; k++) {
        const nd = byId.get(route[k]);
        if (nd) pushPoint([nd.x, nd.z]);
      }
    }
  }
  pushPoint(raw[raw.length - 1]);
  return out;
}

/** Spawn a target vehicle, optionally apply heat/damage limits, and deliver it to `dropAt`. */
export function stealDeliverRun(
  obj: Extract<ObjectiveDef, { kind: 'steal-deliver' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  const [spawnX, spawnZ] = clearVehicleSpawn(obj.spawnAt[0], obj.spawnAt[1], VEHICLES[obj.vehicleKind].radius, deps.world);
  const target = createVehicle(deps.scene, obj.vehicleKind, spawnX, spawnZ, obj.spawnAt[2]);
  if (obj.loadout && target.look) setVehicleLook(target, normalizeLoadout({ ...target.look, ...obj.loadout }, target.tint));
  // The objective's vehicle is the quest's: traffic, parking and the ambient street leave it where it was set down.
  target.questOwned = true;
  deps.vehicles?.push(target);
  const marker = makeCone(0xffd23f);
  target.object.add(marker);
  const pickupRing = makeGroundRing(deps.scene, spawnX, spawnZ, 3.2, 0xff7a00);
  const ring = makeGroundRing(deps.scene, obj.dropAt[0], obj.dropAt[1], obj.radius);

  let heatApplied = false;
  let delivered = false;
  let squeakCool = 2;
  let banterIdx = 0;
  let banterCool = 4;
  let t = 0;

  return {
    lines: () => [
      deps.player?.vehicle === target
        ? `Deliver the ${target.spec.name} to {{${obj.hint}}}.`
        : `Get in the ${target.spec.name} (orange marker) — ${obj.text}`,
    ],
    done: () => delivered,
    update(dt) {
      t += dt;
      marker.rotation.y = t * 2.4;
      marker.position.y = 2.9 + Math.sin(t * 3) * 0.16;
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + 0.2 * Math.sin(t * 3.5);

      const driving = deps.player?.vehicle === target;
      marker.visible = !driving;
      pickupRing.position.set(target.x, heightAt(target.x, target.z) + 0.08, target.z);
      pickupRing.visible = !driving;
      (pickupRing.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.25 * Math.sin(t * 4);
      ring.visible = driving;
      if (driving && !heatApplied && obj.heatOnEnter) {
        heatApplied = true;
        deps.watch?.addHeat(obj.heatOnEnter);
      }
      if (driving && obj.squeakPulse && Math.abs(target.speed) > 4) {
        squeakCool -= dt;
        if (squeakCool <= 0) {
          squeakCool = 5;
          deps.play('whistle');
          say('*SQUEAK!* Nearby gnomes panic and scatter!');
          for (const n of deps.npcs.list) {
            if (Math.hypot(n.x - target.x, n.z - target.z) < 18) deps.npcs.scare(n, target.x, target.z);
          }
          if (deps.watch && deps.watch.heat > 0 && deps.watch.heat < 2) deps.watch.clear();
        }
      }
      if (driving && obj.banter && banterIdx < obj.banter.length) {
        banterCool -= dt;
        if (banterCool <= 0) {
          say(obj.banter[banterIdx++]);
          banterCool = 6;
        }
      }
      if (target.exploded || (obj.maxDamage !== undefined && 1 - target.hp > obj.maxDamage)) {
        repairVehicle(target);
        target.x = spawnX;
        target.z = spawnZ;
        target.yaw = obj.spawnAt[2];
        target.speed = 0;
        if (driving && deps.player) {
          deps.player.exit();
          target.driver = 'none';
        }
        syncVehicleMesh(target, 0);
        say(obj.maxDamage !== undefined ? 'Too damaged! Respawned at pickup.' : 'Mission vehicle wrecked! A fresh one is ready at the pickup.');
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
      target.questOwned = false;
      target.object.remove(marker);
      deps.scene.remove(pickupRing);
      pickupRing.geometry.dispose();
      (pickupRing.material as THREE.Material).dispose();
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
  const path = expandRoadWaypoints(obj.waypoints, deps);
  const start = path[0] ?? [0, 0];
  const next = path[1] ?? start;
  const startYaw = Math.atan2(next[0] - start[0], next[1] - start[1]);
  const leader = createVehicle(deps.scene, obj.leaderKind, start[0], start[1], startYaw);
  const look = { ...randomTownLook(), ...(obj.leaderLook ?? {}) };
  const attachRider = () => {
    if (leader.rider) return;
    const rider = makeGnome(leader.object, look);
    rider.object.position.set(...leader.spec.seat);
    rider.update(gnomeState(0, 0, 0, 0, 0, true), 0);
    leader.rider = rider;
    leader.riderLook = look;
  };
  attachRider();
  leader.driver = 'npc';
  leader.questOwned = true;
  deps.vehicles?.push(leader);

  const marker = makeCone(0x7cf0ff);
  leader.object.add(marker);

  let wpIdx = 1;
  let completed = false;
  let warnCool = 0;
  let t = 0;
  const watchdog = createFollowWatchdog();
  let waiting = false;
  let waitT = 0; // continuous seconds the leader has waited for the player
  let waitedTotal = 0;
  let graceGiven = false; // after 20 s of waiting the leash grows by 50%
  let arrived = false;
  let endWait = 0;

  const groundNodes = (): { x: number; z: number }[] =>
    (deps.world.roads?.nodes ?? []).filter((n) => n.links.length > 0 && n.deck === undefined);
  const clearLeader = (): void => {
    const boxes = deps.world.boxes;
    if (boxes && boxes.length > 0) {
      for (let i = 0; i < 4; i++) {
        const p = pushOutOfBoxes(leader.x, leader.z, 2.4, boxes, 0);
        if (!p.hit) break;
        leader.x = p.x;
        leader.z = p.z;
      }
    }
    leader.speed = 0;
    syncVehicleMesh(leader, 0);
  };
  const faceAim = (ax: number, az: number): void => {
    leader.yaw = Math.atan2(ax - leader.x, az - leader.z);
  };
  /** Put the leader on the ground road node near it that is closest to the aim point. */
  const snapToRoad = (ax: number, az: number): void => {
    const nodes = groundNodes();
    const here = Math.hypot(leader.x - ax, leader.z - az);
    let best: { x: number; z: number } | null = null;
    let bestD = Infinity;
    let nearest: { x: number; z: number } | null = null;
    let nearestD = Infinity;
    for (const n of nodes) {
      const dl = Math.hypot(n.x - leader.x, n.z - leader.z);
      if (dl < 3) continue;
      if (dl < nearestD) { nearestD = dl; nearest = n; }
      const da = Math.hypot(n.x - ax, n.z - az);
      if (dl <= 40 && da < here && da < bestD) { bestD = da; best = n; }
    }
    const pick = best ?? nearest;
    if (!pick) return;
    leader.x = pick.x;
    leader.z = pick.z;
    faceAim(ax, az);
    clearLeader();
  };

  setFollowStats(() => ({ maxStall: watchdog.maxStall(), waited: waitedTotal }));

  return {
    lines: () => [
      obj.text,
      waiting ? `{{${obj.leaderName}}} is waiting for you` : `Stay within ${obj.maxDist}m of {{${obj.leaderName}}}.`,
    ],
    done: () => completed,
    followStats: () => ({ maxStall: watchdog.maxStall(), waited: waitedTotal }),
    update(dt, px, pz) {
      t += dt;
      warnCool = Math.max(0, warnCool - dt);
      marker.rotation.y = t * 2.5;
      if (completed) return;

      // Recover if leader was blown up or knocked off/stolen.
      if (leader.exploded || leader.driver !== 'npc') {
        const respawnPt = path[Math.max(0, wpIdx - 1)] ?? start;
        const targetPt = path[Math.min(wpIdx, path.length - 1)] ?? respawnPt;
        if (deps.player?.vehicle === leader) deps.player.exit();
        repairVehicle(leader);
        leader.x = respawnPt[0];
        leader.z = respawnPt[1];
        leader.yaw = Math.atan2(targetPt[0] - respawnPt[0], targetPt[1] - respawnPt[1]);
        leader.speed = 0;
        leader.driver = 'npc';
        attachRider();
        syncVehicleMesh(leader, 0);
        say(`${obj.leaderName} got knocked off! Regrouping on the road...`);
        return;
      }

      const distPlayer = Math.hypot(leader.x - px, leader.z - pz);
      const effMax = graceGiven ? obj.maxDist * 1.5 : obj.maxDist;
      const tooFar = distPlayer > effMax * 1.05;
      const wasWaiting = waiting;
      waiting = tooFar || (arrived && distPlayer > effMax);
      if (waiting) {
        waitT += dt;
        waitedTotal += dt;
        if (!graceGiven && waitT >= 20) {
          graceGiven = true;
          say(`${obj.leaderName} slows down so you can catch up.`);
        }
      } else {
        waitT = 0;
      }
      if (waiting !== wasWaiting) changed();

      if (arrived) {
        leader.speed *= Math.max(0, 1 - 3 * dt);
        syncVehicleMesh(leader, dt);
        if (distPlayer <= effMax || (endWait >= 10 && distPlayer <= obj.maxDist * 2)) {
          completed = true;
          say(`Arrived with ${obj.leaderName}!`);
          changed();
        } else {
          endWait += dt;
        }
        return;
      }

      const wp = path[wpIdx];
      if (!wp) {
        arrived = true;
        return;
      }
      const prevWp = path[Math.max(0, wpIdx - 1)] ?? start;
      const isFinalLeg = wpIdx >= path.length - 1;
      const segDx = wp[0] - prevWp[0];
      const segDz = wp[1] - prevWp[1];
      const segLen = Math.hypot(segDx, segDz) || 1;
      // Right-of-center lane offset on road legs, 0 on the final driveway approach.
      const laneOff = isFinalLeg ? 0 : 2.0;
      const aimX = wp[0] - (segDz / segLen) * laneOff;
      const aimZ = wp[1] + (segDx / segLen) * laneOff;

      const action = watchdog.step(dt, {
        leaderX: leader.x,
        leaderZ: leader.z,
        aimX,
        aimZ,
        playerDist: distPlayer,
        maxDist: effMax,
        waiting: tooFar,
      });

      if (tooFar) {
        leader.speed *= Math.max(0, 1 - 3 * dt);
        syncVehicleMesh(leader, dt);
        if (warnCool <= 0) {
          say(`Wait up! Catch up to ${obj.leaderName}.`);
          warnCool = 4;
        }
        return;
      }

      if (action === 'nudge') {
        leader.x -= Math.sin(leader.yaw) * 2;
        leader.z -= Math.cos(leader.yaw) * 2;
        faceAim(aimX, aimZ);
        clearLeader();
      } else if (action === 'snap-road') {
        snapToRoad(aimX, aimZ);
      } else if (action === 'skip-waypoint') {
        if (isFinalLeg) {
          leader.x = wp[0];
          leader.z = wp[1];
          clearLeader();
        } else {
          wpIdx++;
          return;
        }
      }

      const diff = angleDiff(Math.atan2(aimX - leader.x, aimZ - leader.z), leader.yaw);
      const pace = distPlayer > effMax * 0.65 ? obj.speed * 0.55 : obj.speed;
      const cornerPace = Math.abs(diff) > 0.35 ? pace * 0.6 : pace;
      steerToward(leader, aimX, aimZ, cornerPace, dt, deps);

      if (Math.hypot(leader.x - aimX, leader.z - aimZ) < 6) {
        wpIdx++;
        if (wpIdx >= path.length) arrived = true;
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
  hauler.questOwned = true;
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
  let warnCool = 0;
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
      warnCool = Math.max(0, warnCool - dt);
      marker.rotation.y = t * 2.5;
      if (doneFlag) return;

      const wp = obj.route[wpIdx];
      if (hauler.exploded) {
        if (deps.player?.vehicle === hauler) deps.player.exit();
        repairVehicle(hauler);
        hauler.x = start[0];
        hauler.z = start[1];
        hauler.yaw = yaw;
        hauler.speed = 0;
        hauler.driver = 'none';
        syncVehicleMesh(hauler, 0);
        say('Dew-Hauler wrecked! A fresh tanker is ready on Route South.');
        return;
      }
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
          const remainingEscorts = escorts.filter((e) => !crackedSet.has(e) && e.state !== 'ragdoll').length;
          if (remainingEscorts > 0) {
            if (warnCool <= 0) {
              say(`Clear the remaining ${remainingEscorts} HOA escort(s) first!`);
              warnCool = 3;
            }
          } else {
            doneFlag = true;
            say('Convoy hijacked and delivered!');
            changed();
          }
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
      deps.watch?.despawnSquad?.(escorts);
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
