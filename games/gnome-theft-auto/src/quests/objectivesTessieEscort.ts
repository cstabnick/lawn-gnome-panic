// Objective runners for the Tessie side quest, steps 3 and 4 (Wild World Epic 7): escort the egg clutch past the HOA
// dredger, and ride Tessie back across the loch.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { LAYER, flatLayer } from '@lawn/depth';
import { TESSIE } from '../config';
import { heightAt, waterAt } from '../terrain';
import { createVehicle, removeVehicle } from '../vehicles';
import type { Blip, Vehicle } from '../types';
import type { ObjectiveDef, QuestDeps, Run } from './types';

const LOCH_SURFACE = -0.65;
const CLUTCH_COLOR = '#45e68b';
const DREDGER_COLOR = '#ff3b3b';
const NEST_COLOR = '#ff7a00';
const BEATEN_RUN_S = 10;

function surfaceAt(x: number, z: number): number {
  return waterAt(x, z)?.surface ?? LOCH_SURFACE;
}

function makeCone(color: number, y: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 1.0, 4),
    new THREE.MeshBasicMaterial({ color }),
  );
  m.rotation.x = Math.PI;
  m.position.y = y;
  return m;
}

function makeRing(radius: number, color: number): THREE.Mesh {
  const mat = flatLayer(
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.55, depthWrite: false }),
    LAYER.marker,
  );
  const m = new THREE.Mesh(new THREE.RingGeometry(Math.max(0.5, radius - 0.5), radius, 36), mat);
  m.rotation.x = -Math.PI / 2;
  return m;
}

function disposeMesh(m: THREE.Mesh): void {
  m.geometry.dispose();
  (m.material as THREE.Material).dispose();
}

/**
 * Walk `dist` metres along `route` from (x, z), currently heading for point `i`. Returns the new position, the new
 * target index, and whether the last point has been reached.
 */
export function advanceAlong(
  route: [number, number][],
  i: number,
  x: number,
  z: number,
  dist: number,
): { x: number; z: number; i: number; arrived: boolean } {
  let left = dist;
  while (i < route.length) {
    const [tx, tz] = route[i];
    const dx = tx - x;
    const dz = tz - z;
    const d = Math.hypot(dx, dz);
    if (d <= left) {
      x = tx;
      z = tz;
      left -= d;
      i++;
      continue;
    }
    x += (dx / d) * left;
    z += (dz / d) * left;
    left = 0;
    break;
  }
  return { x, z, i, arrived: i >= route.length };
}

/** True when a boat moving at `boatSpeed` m/s, `dist` metres from the dredger's centre, counts as a ram. */
export function isRam(boatSpeed: number, dist: number, boatRadius: number, ramSpeed: number): boolean {
  return Math.abs(boatSpeed) >= ramSpeed && dist <= 4.5 + boatRadius;
}

/** The egg clutch floats along obj.route to obj.nest while the player stays near; an HOA dredger tries to suck it up. */
export function tessieEscortRun(
  obj: Extract<ObjectiveDef, { kind: 'tessie-escort' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  const start = obj.route[0];
  let cx = start[0];
  let cz = start[1];
  let routeI = 0;
  let home = false;
  let done = false;

  const clutch = buildPrefab('turtle-egg-clutch', { scale: 2 });
  clutch.position.set(cx, surfaceAt(cx, cz) - 0.1, cz);
  deps.scene.add(clutch);
  const cone = makeCone(0xffd23f, 0);
  cone.position.y = 0;
  deps.scene.add(cone);

  const dredger = buildPrefab('hoa-dredger', { scale: 3 });
  let dx = obj.dredgerAt[0];
  let dz = obj.dredgerAt[1];
  dredger.position.set(dx, surfaceAt(dx, dz) - 0.4, dz);
  deps.scene.add(dredger);

  let rams = 0;
  let stunT = 0;
  let beaten = false;
  let beatenT = 0;
  let t = 0;

  const dredgerActive = (): boolean => !beaten && !home;
  const distToClutch = (): number => Math.hypot(cx - dx, cz - dz);
  const playerNear = (px: number, pz: number): boolean => Math.hypot(px - cx, pz - cz) <= TESSIE.escortLeash;

  const finish = (): void => {
    done = true;
    home = true;
    deps.play('whistle');
    say('The clutch is safe in the nest!');
    changed();
  };

  return {
    lines: () => {
      if (done) return [obj.text];
      const boat = deps.player?.vehicle;
      if (!boat || boat.spec.boat !== true) {
        return ['Take a boat out from the {{Loch Moss dock}}.', obj.text];
      }
      if (!playerNear(boat.x, boat.z)) return [obj.text, 'The clutch waits for you. Stay close.'];
      if (beaten) return [obj.text, 'Bring the clutch to {{' + obj.hint + '}}.'];
      return [obj.text, 'Ram the {{HOA dredger}} (' + rams + '/' + TESSIE.rams + ') before it sucks up the eggs!'];
    },
    done: () => done,
    update(dt, px, pz) {
      if (done) return;
      t += dt;

      // 1. The clutch rafts along its route while the player is near.
      if (playerNear(px, pz)) {
        const prevI = Math.min(routeI, obj.route.length - 1);
        const r = advanceAlong(obj.route, routeI, cx, cz, TESSIE.escortSpeed * dt);
        cx = r.x;
        cz = r.z;
        routeI = r.i;
        if (r.arrived) {
          // Home: onto the nest.
          [cx, cz] = obj.nest;
          clutch.position.set(cx, heightAt(cx, cz), cz);
          cone.position.set(cx, heightAt(cx, cz) + 2.9, cz);
          dredger.visible = false;
          finish();
          return;
        }
        const target = obj.route[prevI];
        const hx = target[0] - cx;
        const hz = target[1] - cz;
        if (Math.hypot(hx, hz) > 0.01) clutch.rotation.y = Math.atan2(hx, hz);
      }

      // 2. The dredger chugs at the clutch, or fights on after a ram stun, or steams off east once beaten.
      if (beaten) {
        beatenT += dt;
        dx += dt * TESSIE.dredgerSpeed;
        dredger.rotation.y = Math.PI / 2;
        if (beatenT >= BEATEN_RUN_S) dredger.visible = false;
      } else if (stunT > 0) {
        stunT = Math.max(0, stunT - dt);
      } else {
        const ex = cx - dx;
        const ez = cz - dz;
        const d = Math.hypot(ex, ez);
        if (d > 0.01) {
          const step = Math.min(d, TESSIE.dredgerSpeed * dt);
          dx += (ex / d) * step;
          dz += (ez / d) * step;
          dredger.rotation.y = Math.atan2(ex, ez);
        }
      }
      dredger.position.set(dx, surfaceAt(dx, dz) - 0.4, dz);

      // 3. Suction: the clutch is drawn toward the dredger while it is within dredgerPull (not while stunned, never once beaten).
      if (!beaten && stunT <= 0 && distToClutch() < TESSIE.dredgerPull) {
        const ex = dx - cx;
        const ez = dz - cz;
        const d = Math.hypot(ex, ez);
        if (d > 0.01) {
          const step = Math.min(d, TESSIE.dredgerPullSpeed * dt);
          cx += (ex / d) * step;
          cz += (ez / d) * step;
        }
      }

      // 4. Swallowed: back to the start.
      if (dredgerActive() && distToClutch() < TESSIE.dredgerSwallow) {
        say('The dredger sucked up the clutch! Back to the start.');
        deps.play('alarm');
        cx = start[0];
        cz = start[1];
        routeI = 0;
        dx = obj.dredgerAt[0];
        dz = obj.dredgerAt[1];
        stunT = 0;
        dredger.rotation.y = 0;
      }

      // 5. Ramming by the player's boat.
      const boat: Vehicle | null | undefined = deps.player?.vehicle;
      if (
        dredgerActive() &&
        stunT <= 0 &&
        boat &&
        boat.spec.boat === true &&
        isRam(boat.speed, Math.hypot(boat.x - dx, boat.z - dz), boat.spec.radius, TESSIE.ramSpeed)
      ) {
        rams++;
        stunT = TESSIE.stunS;
        let ux = dx - boat.x;
        let uz = dz - boat.z;
        const ud = Math.hypot(ux, uz);
        if (ud < 0.01) {
          ux = 1;
          uz = 0;
        } else {
          ux /= ud;
          uz /= ud;
        }
        dx += ux * 8;
        dz += uz * 8;
        dredger.position.set(dx, surfaceAt(dx, dz) - 0.4, dz);
        boat.speed = -boat.speed * 0.3;
        deps.play('bump');
        deps.fx?.waterJet?.(dx, surfaceAt(dx, dz) + 0.5, dz);
        say('Rammed the dredger! ' + rams + ' of ' + TESSIE.rams);
        if (rams >= TESSIE.rams) {
          beaten = true;
          beatenT = 0;
          stunT = 0;
          dredger.rotation.y = Math.PI / 2;
          say('The dredger gives up and heads for the weir.');
        }
      }

      // Place the clutch and its marker.
      const surf = surfaceAt(cx, cz);
      const bob = Math.sin(t * 2.2) * 0.05;
      clutch.position.set(cx, surf - 0.1 + bob, cz);
      cone.position.set(cx, surf + 2.9 + Math.sin(t * 3) * 0.16, cz);
      cone.rotation.y = t * 2.4;
    },
    onCracked() {},
    blips: () => {
      if (done) return [];
      const out: Blip[] = [{ x: cx, z: cz, color: CLUTCH_COLOR, quest: 'Egg clutch' }];
      if (dredgerActive()) out.push({ x: dx, z: dz, color: DREDGER_COLOR, quest: 'HOA dredger' });
      out.push({ x: obj.nest[0], z: obj.nest[1], color: NEST_COLOR, quest: obj.hint });
      return out;
    },
    cracked: () => [],
    cleanup() {
      deps.scene.remove(clutch);
      deps.scene.remove(dredger);
      deps.scene.remove(cone);
      disposeMesh(cone);
    },
  };
}

/** Tessie surfaces at obj.spawnAt; climb aboard (she is a 'tessie' boat vehicle) and ride her to obj.to. */
export function tessieRideRun(
  obj: Extract<ObjectiveDef, { kind: 'tessie-ride' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  const tessie = createVehicle(deps.scene, 'tessie', obj.spawnAt[0], obj.spawnAt[1], obj.spawnAt[2]);
  tessie.questOwned = true;
  deps.vehicles?.push(tessie);

  deps.play('splash');
  deps.fx?.waterJet?.(tessie.x, surfaceAt(tessie.x, tessie.z) + 0.5, tessie.z);
  say('Tessie surfaces beside the island. Swim out and climb aboard!');

  const marker = makeCone(0xffd23f, 4);
  tessie.object.add(marker);

  const ring = makeRing(obj.radius, 0x45e68b);
  const ringY = surfaceAt(obj.to[0], obj.to[1]) + 0.05;
  ring.position.set(obj.to[0], ringY, obj.to[1]);
  deps.scene.add(ring);

  let done = false;
  let t = 0;

  const aboard = (): boolean => deps.player?.vehicle === tessie;

  return {
    lines: () => (aboard() ? ['Ride Tessie to {{' + obj.hint + '}}.'] : ['Swim out to {{Tessie}} and climb aboard (Enter).']),
    done: () => done,
    update(dt) {
      if (done) return;
      t += dt;
      const onboard = aboard();
      marker.visible = !onboard;
      marker.rotation.y = t * 2.4;
      marker.position.y = 4 + Math.sin(t * 3) * 0.16;
      ring.visible = onboard;
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.2 * Math.sin(t * 3.5);

      if (onboard && Math.hypot(tessie.x - obj.to[0], tessie.z - obj.to[1]) <= obj.radius) {
        done = true;
        say('Tessie glides up to the dock and waits for you to hop off.');
        deps.play('whistle');
        changed();
      }
    },
    onCracked() {},
    blips: () => {
      if (done) return [];
      if (aboard()) return [{ x: obj.to[0], z: obj.to[1], color: '#45e68b', quest: obj.hint }];
      return [{ x: tessie.x, z: tessie.z, color: '#ff7a00', quest: 'Tessie' }];
    },
    cracked: () => [],
    cleanup() {
      tessie.object.remove(marker);
      disposeMesh(marker);
      deps.scene.remove(ring);
      disposeMesh(ring);
      if (!aboard()) {
        const list = deps.vehicles;
        if (list) {
          const i = list.indexOf(tessie);
          if (i >= 0) list.splice(i, 1);
        }
        removeVehicle(deps.scene, tessie);
      }
    },
  };
}
