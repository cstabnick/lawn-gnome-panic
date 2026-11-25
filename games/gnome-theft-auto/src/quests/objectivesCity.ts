// Objective runner for the Turfton city contracts (quests/cityQuests.ts): 'checkpoints', a run through gates in order
// with an optional clock, an optional ride spawned for the job, and gates that hang in the air (a Skyway deck, the
// rings round Thorne Tower). Running out of time or wrecking the ride puts the run back to gate 0; it never fails.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { pushOutOfBoxes } from '../collide';
import { VEHICLES } from '../config';
import { heightAt } from '../terrain';
import { placeOnGround } from '../terrainMesh';
import type { Blip, Vehicle } from '../types';
import { createVehicle, removeVehicle, repairVehicle, syncVehicleMesh } from '../vehicles';
import type { CheckpointDef, ObjectiveDef, QuestDeps, Run } from './types';
import { readProbe } from '../city/probes';
import { interiorById, interiorToWorld } from '../interiors/registry';
import { currentInterior } from '../interiors/runtime';

const GATE_COLOR = 0xffd23f;
const BLIP_COLOR = '#ff7a00';

/** Pure: is a body at (x, y, z) through gate `g`? `groundY` is the ground height at the gate. */
export function gateHit(g: CheckpointDef, x: number, y: number, z: number, groundY: number): boolean {
  if (Math.hypot(x - g.at[0], z - g.at[1]) > g.radius) return false;
  if (g.height === undefined) return true;
  return Math.abs(y - (groundY + g.height)) <= g.radius;
}

/** Pure: seconds left on the clock, or null when there is no clock or it has not started. May be negative. */
export function clockLeft(seconds: number | undefined, startedAt: number | null, now: number): number | null {
  if (!seconds || startedAt === null) return null;
  return seconds - (now - startedAt);
}

function disposeMesh(scene: THREE.Scene, m: THREE.Object3D | null): void {
  if (!m) return;
  scene.remove(m);
  m.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else mat?.dispose();
  });
}

/** One gate's marker: a flat ring on the ground, or a standing hoop in the air, with a beacon over it. */
function buildGate(g: CheckpointDef, from: [number, number]): THREE.Group {
  const group = new THREE.Group();
  const [x, z] = g.at;
  const ground = heightAt(x, z);
  if (g.height === undefined) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(0.6, g.radius - 0.55), g.radius, 36),
      flatLayer(new THREE.MeshBasicMaterial({ color: GATE_COLOR, side: THREE.DoubleSide, transparent: true, opacity: 0.55, depthWrite: false }), LAYER.marker),
    );
    ring.rotation.x = -Math.PI / 2;
    placeOnGround(ring, x, z, 0.08, true);
    group.add(ring);
  } else {
    const hoop = new THREE.Mesh(
      new THREE.TorusGeometry(g.radius, 0.35, 8, 40),
      new THREE.MeshBasicMaterial({ color: GATE_COLOR, transparent: true, opacity: 0.7 }),
    );
    hoop.position.set(x, ground + g.height, z);
    hoop.rotation.y = Math.atan2(x - from[0], z - from[1]);
    group.add(hoop);
  }
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 40, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: GATE_COLOR, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }),
  );
  beacon.position.set(x, ground + (g.height ?? 0) + 20, z);
  group.add(beacon);
  return group;
}

export function checkpointsRun(
  obj: Extract<ObjectiveDef, { kind: 'checkpoints' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  const n = obj.points.length;
  /** A gate with its position in world coordinates (interior gates are local to their room). */
  const world = (g: CheckpointDef): CheckpointDef => (g.interior ? { ...g, at: interiorToWorld(g.interior, g.at[0], g.at[1]) } : g);
  let next = 0;
  let t = 0;
  let startedAt: number | null = null;
  let doneFlag = false;
  let gateMesh: THREE.Group | null = null;
  let gateFor = -1;

  // The job's ride, nudged out of any building it would stand in.
  let ride: Vehicle | null = null;
  let rideAt: [number, number, number] | null = null;
  if (obj.vehicle && deps.vehicles) {
    const [vx, vz, yaw] = obj.vehicle.at;
    const p = pushOutOfBoxes(vx, vz, VEHICLES[obj.vehicle.kind].radius + 0.5, deps.world.boxes, 0);
    rideAt = [p.x, p.z, yaw];
    ride = createVehicle(deps.scene, obj.vehicle.kind, p.x, p.z, yaw);
    deps.vehicles.push(ride);
  }

  const reset = (msg: string): void => {
    next = 0;
    startedAt = null;
    say(msg);
  };

  const showGate = (px: number, pz: number): void => {
    if (gateFor === next || doneFlag) return;
    disposeMesh(deps.scene, gateMesh);
    const prev: [number, number] = next > 0 ? world(obj.points[next - 1]).at : [px, pz];
    gateMesh = buildGate(world(obj.points[next]), prev);
    deps.scene.add(gateMesh);
    gateFor = next;
  };

  const needsRide = (): boolean => !!obj.requireVehicle && deps.player?.vehicle?.kind !== obj.requireVehicle;

  return {
    lines: () => {
      if (doneFlag) return [obj.text];
      if (needsRide()) return [obj.text, `Get in the {{${VEHICLES[obj.requireVehicle!].name}}}`];
      const left = clockLeft(obj.seconds, startedAt, t);
      const clock = left !== null ? ` · ${Math.max(0, Math.ceil(left))}s` : '';
      return [obj.text, `Next: {{${obj.points[next].label}}} (${next + 1}/${n})${clock}`];
    },
    done: () => doneFlag,
    update(dt, px, pz) {
      t += dt;
      if (doneFlag) return;
      showGate(px, pz);
      if (gateMesh) {
        for (const c of gateMesh.children) {
          const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
          if (c instanceof THREE.Mesh && c.geometry instanceof THREE.CylinderGeometry) continue;
          m.opacity = 0.5 + 0.2 * Math.sin(t * 3.5);
        }
      }

      // A wrecked (or too damaged) ride: a fresh one at the start, and the run starts over.
      if (ride && rideAt && (ride.exploded || (obj.maxDamage !== undefined && 1 - ride.hp > obj.maxDamage))) {
        if (deps.player?.vehicle === ride) {
          deps.player.exit();
          ride.driver = 'none';
        }
        repairVehicle(ride);
        ride.x = rideAt[0];
        ride.z = rideAt[1];
        ride.yaw = rideAt[2];
        ride.speed = 0;
        syncVehicleMesh(ride, 0);
        reset(obj.maxDamage !== undefined ? 'Too much damage! A fresh ride is waiting at the start.' : 'Ride wrecked! A fresh one is waiting at the start.');
        return;
      }

      const p = deps.player;
      if (!needsRide()) {
        const y = p?.vehicle ? p.vehicle.y : (p?.y ?? 0);
        const g = world(obj.points[next]);
        if (gateHit(g, px, y, pz, heightAt(g.at[0], g.at[1]))) {
          if (next === 0) {
            startedAt = t;
            if (obj.heatOnStart) deps.watch?.addHeat(obj.heatOnStart);
          }
          say(`Checkpoint: ${g.label}`);
          deps.play('whistle');
          next++;
          if (next === n) {
            doneFlag = true;
            disposeMesh(deps.scene, gateMesh);
            gateMesh = null;
            changed();
            return;
          }
        }
      }

      const left = clockLeft(obj.seconds, startedAt, t);
      if (left !== null && left <= 0) reset(`Out of time! Back to ${obj.points[0].label}.`);
    },
    onCracked() {},
    blips: (): Blip[] => {
      if (doneFlag) return [];
      if (needsRide() && ride) return [{ x: ride.x, z: ride.z, color: BLIP_COLOR, quest: ride.spec.name }];
      const g = obj.points[next];
      if (g.interior && currentInterior() !== g.interior) {
        const d = interiorById(g.interior)?.def.door;
        if (d) return [{ x: d.x, z: d.z, color: BLIP_COLOR, quest: g.label }];
      }
      const w = world(g);
      return [{ x: w.at[0], z: w.at[1], color: BLIP_COLOR, quest: g.label }];
    },
    cracked: () => [],
    cleanup() {
      disposeMesh(deps.scene, gateMesh);
      gateMesh = null;
      if (ride && deps.vehicles && deps.player?.vehicle !== ride) {
        const idx = deps.vehicles.indexOf(ride);
        if (idx >= 0) deps.vehicles.splice(idx, 1);
        removeVehicle(deps.scene, ride);
      }
      ride = null;
    },
  };
}

/** Pure: is a 'probe' objective met? `value` null (no probe) never is. */
export function probeMet(value: number | null, baseline: number, count: number, absolute: boolean): boolean {
  if (value === null) return false;
  return absolute ? value >= count : value - baseline >= count;
}

const PROBE_EVERY_S = 0.5;

/** The 'probe' objective: watch an activity number (city/probes.ts) until it rises by `count`. */
export function probeRun(
  obj: Extract<ObjectiveDef, { kind: 'probe' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  const count = obj.count ?? 1;
  const absolute = !!obj.absolute;
  const first = readProbe(obj.probe);
  const baseline = first ?? 0;
  let value = first;
  let doneFlag = false;
  let t = PROBE_EVERY_S;
  void deps;

  return {
    lines: () => {
      if (doneFlag) return [obj.text];
      if (value === null) return [obj.text, '(not available in this build)'];
      const have = Math.max(0, absolute ? value : value - baseline);
      return count > 1 ? [obj.text, `${Math.min(have, count)}/${count}`] : [obj.text];
    },
    done: () => doneFlag,
    update(dt) {
      if (doneFlag) return;
      t += dt;
      if (t < PROBE_EVERY_S) return;
      t = 0;
      value = readProbe(obj.probe);
      if (probeMet(value, baseline, count, absolute)) {
        doneFlag = true;
        say('Done!');
        changed();
      }
    },
    onCracked() {},
    blips: (): Blip[] => (doneFlag || !obj.at ? [] : [{ x: obj.at[0], z: obj.at[1], color: BLIP_COLOR, quest: obj.hint }]),
    cracked: () => [],
    cleanup() {},
  };
}
