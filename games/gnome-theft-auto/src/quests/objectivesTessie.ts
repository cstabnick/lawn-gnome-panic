// Objective runners for the Tessie side quest, steps 1 and 2 (Wild World Epic 7): sightings by boat at dusk, and
// sonar buoys dropped unseen by the HOA patrol boat.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab } from '@lawn/prefabs';
import { TESSIE } from '../config';
import { waterAt } from '../terrain';
import { loopRoute, steerToward } from '../boatTraffic';
import { createVehicle, removeVehicle, stepVehicle } from '../vehicles';
import type { Blip } from '../types';
import type { ObjectiveDef, QuestDeps, Run } from './types';

const TARGET_COLOR = '#ff7a00';
const PATROL_COLOR = '#ff3b3b';
const CLOSE_WARN_T = 6;
const PATROL_WARN_T = 8;
const PATROL_GRACE_T = 6;
const PATROL_REACH = 10;
const HUMP_RISE_T = 1.2;
const HUMP_HOLD_T = 1.5;
const HUMP_SINK_T = 1.5;
const HUMP_HEIGHT = 1.2;
/** How far under the surface the hump's mesh starts (only the top of the shell shows). */
const HUMP_SUBMERGE = 3.2;
const BUOY_BOB_HZ = 0.8;
const BUOY_BOB_M = 0.06;
const RIPPLES = 3;
const RIPPLE_T = 2.4;

const surfaceAt = (x: number, z: number): number => waterAt(x, z)?.surface ?? 0;
const inBoat = (deps: QuestDeps): boolean => deps.player?.vehicle?.spec.boat === true;

/** True when (px, pz) is within r of (bx, bz). Used for sighting points, buoy points and the patrol's spotting range. */
export function withinRange(px: number, pz: number, bx: number, bz: number, r: number): boolean {
  return Math.hypot(px - bx, pz - bz) <= r;
}

/** Smooth 0..1 ease for the hump's rise and sink. */
export function smoothstep(p: number): number {
  const q = Math.min(1, Math.max(0, p));
  return q * q * (3 - 2 * q);
}

/** A ring and a faint beacon standing on the water at (x, z); optionally ripples that grow and fade inside the ring. */
interface WaterMark {
  x: number;
  z: number;
  y: number;
  ring: THREE.Mesh;
  beacon: THREE.Mesh;
  ripples: THREE.Mesh[];
}

function makeWaterMark(
  scene: THREE.Scene,
  x: number,
  z: number,
  radius: number,
  color: number,
  rippleGeom: THREE.BufferGeometry | null,
): WaterMark {
  const y = surfaceAt(x, z);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(Math.max(0.6, radius - 0.6), radius, 36),
    flatLayer(new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.55, depthWrite: false }), LAYER.marker),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, y + 0.05, z);
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 40, 12, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }),
  );
  beacon.position.set(x, y + 20, z);
  scene.add(ring, beacon);

  const ripples: THREE.Mesh[] = [];
  if (rippleGeom) {
    for (let i = 0; i < RIPPLES; i++) {
      const r = new THREE.Mesh(
        rippleGeom,
        flatLayer(new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false }), LAYER.marker),
      );
      r.rotation.x = -Math.PI / 2;
      r.position.set(x, y + 0.07, z);
      r.visible = false;
      scene.add(r);
      ripples.push(r);
    }
  }
  return { x, z, y, ring, beacon, ripples };
}

function setMarkVisible(m: WaterMark, visible: boolean): void {
  m.ring.visible = visible;
  m.beacon.visible = visible;
  for (const r of m.ripples) r.visible = visible;
}

function animateRipples(m: WaterMark, t: number, radius: number): void {
  m.ripples.forEach((r, i) => {
    const p = (t / RIPPLE_T + i / RIPPLES) % 1;
    r.scale.setScalar(radius * (0.25 + 0.75 * p));
    (r.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - p);
  });
}

function disposeMark(scene: THREE.Scene, m: WaterMark): void {
  scene.remove(m.ring, m.beacon, ...m.ripples);
  m.ring.geometry.dispose();
  (m.ring.material as THREE.Material).dispose();
  m.beacon.geometry.dispose();
  (m.beacon.material as THREE.Material).dispose();
  for (const r of m.ripples) (r.material as THREE.Material).dispose();
}

/** Reach each of obj.points in a boat (player.vehicle?.spec.boat); a hump surfaces at each. Holds the sky at golden hour. */
export function tessieSightingsRun(
  obj: Extract<ObjectiveDef, { kind: 'tessie-sightings' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  const total = obj.points.length;
  const prevMode = deps.atmosphere?.getMode();
  deps.atmosphere?.setMode('golden');

  const rippleGeom = new THREE.RingGeometry(0.9, 1, 32);
  const marks = obj.points.map(([x, z]) => makeWaterMark(deps.scene, x, z, obj.radius, 0xff7a00, rippleGeom));
  const hump = buildPrefab('tessie', { scale: 3 });
  hump.visible = false;
  deps.scene.add(hump);

  let cur = 0;
  let stage: 'idle' | 'rise' | 'hold' | 'sink' = 'idle';
  let humpT = 0;
  let warnT = 0;
  let t = 0;
  let doneFlag = false;

  const showCurrent = (): void => {
    marks.forEach((m, i) => setMarkVisible(m, i === cur && stage === 'idle' && !doneFlag));
  };
  showCurrent();

  return {
    lines: () => {
      if (doneFlag) return [obj.text, 'All ' + total + ' sightings logged.'];
      return inBoat(deps)
        ? [obj.text, 'Sighting ' + (cur + 1) + ' of ' + total + ': {{' + obj.hint + '}}']
        : ['Take a boat out from the {{Loch Moss dock}}.', obj.text];
    },
    done: () => doneFlag,
    update(dt, px, pz) {
      t += dt;
      warnT = Math.max(0, warnT - dt);
      for (const m of marks) if (m.ripples.length && m.ripples[0].visible) animateRipples(m, t, obj.radius * 0.9);
      if (doneFlag) return;

      const m = marks[cur];
      if (stage === 'idle') {
        if (!withinRange(px, pz, m.x, m.z, obj.radius)) return;
        if (!inBoat(deps)) {
          if (warnT <= 0) {
            say('Too close to the shore to see. Take a boat out.');
            warnT = CLOSE_WARN_T;
          }
          return;
        }
        stage = 'rise';
        humpT = 0;
        hump.position.set(m.x, m.y - HUMP_SUBMERGE, m.z);
        hump.visible = true;
        showCurrent();
        deps.play('splash');
        deps.fx?.waterJet?.(m.x, m.y + 0.3, m.z);
        say('Sighting ' + (cur + 1) + ' of ' + total + '! Something big rolls under the surface and is gone.');
        return;
      }

      humpT += dt;
      if (stage === 'rise' && humpT >= HUMP_RISE_T) {
        humpT -= HUMP_RISE_T;
        stage = 'hold';
      }
      if (stage === 'hold' && humpT >= HUMP_HOLD_T) {
        humpT -= HUMP_HOLD_T;
        stage = 'sink';
      }
      if (stage === 'sink' && humpT >= HUMP_SINK_T) {
        hump.visible = false;
        stage = 'idle';
        humpT = 0;
        cur++;
        if (cur >= total) {
          doneFlag = true;
          changed();
        }
        showCurrent();
        return;
      }
      const lift =
        stage === 'rise' ? smoothstep(humpT / HUMP_RISE_T) : stage === 'hold' ? 1 : 1 - smoothstep(humpT / HUMP_SINK_T);
      hump.position.y = m.y - HUMP_SUBMERGE + HUMP_HEIGHT * lift;
    },
    onCracked() {},
    blips: (): Blip[] => {
      if (doneFlag || stage !== 'idle') return [];
      const p = obj.points[cur];
      return [{ x: p[0], z: p[1], color: TARGET_COLOR, quest: obj.hint }];
    },
    cracked: () => [],
    cleanup() {
      for (const m of marks) disposeMark(deps.scene, m);
      rippleGeom.dispose();
      deps.scene.remove(hump);
      if (deps.atmosphere && prevMode) deps.atmosphere.setMode(prevMode);
    },
  };
}

interface Buoy {
  group: THREE.Group;
  baseY: number;
  phase: number;
}

/** Drop a sonar buoy at each of obj.points from a boat while an HOA patrol boat circles; being spotted fishes them out. */
export function tessieBuoysRun(
  obj: Extract<ObjectiveDef, { kind: 'tessie-buoys' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  const total = obj.points.length;
  const route = loopRoute('water/loch-moss', TESSIE.patrolScale, TESSIE.patrolPoints);
  const start = route[0];
  const second = route[1 % route.length];
  const patrol = createVehicle(deps.scene, 'hoa-patrol-boat', start.x, start.z, Math.atan2(second.x - start.x, second.z - start.z));
  patrol.driver = 'npc';
  patrol.questOwned = true;
  deps.vehicles?.push(patrol);
  let wp = 1 % route.length;

  const marks = obj.points.map(([x, z]) => makeWaterMark(deps.scene, x, z, obj.radius, 0xff7a00, null));
  const buoys: (Buoy | null)[] = obj.points.map(() => null);
  const droppedCount = (): number => buoys.filter((b) => b !== null).length;
  const syncMarks = (): void => marks.forEach((m, i) => setMarkVisible(m, buoys[i] === null));
  syncMarks();

  const patrolDriving = (): boolean => patrol.driver === 'npc' && !patrol.exploded;
  let graceT = 0;
  let warnT = 0;
  let t = 0;
  let doneFlag = false;

  return {
    lines: () => {
      const base = [obj.text, droppedCount() + ' of ' + total + ' buoys down. Keep {{' + obj.spotRadius + ' m}} from the HOA patrol boat.'];
      return inBoat(deps) ? base : ['Take a boat out from the {{Loch Moss dock}}.', ...base];
    },
    done: () => doneFlag,
    update(dt, px, pz) {
      t += dt;
      graceT = Math.max(0, graceT - dt);
      warnT = Math.max(0, warnT - dt);
      for (const b of buoys) {
        if (b) b.group.position.y = b.baseY + BUOY_BOB_M * Math.sin(2 * Math.PI * BUOY_BOB_HZ * t + b.phase);
      }
      if (doneFlag) return;

      if (patrolDriving()) {
        if (Math.hypot(route[wp].x - patrol.x, route[wp].z - patrol.z) < PATROL_REACH) wp = (wp + 1) % route.length;
        const target = route[wp];
        stepVehicle(patrol, { throttle: TESSIE.patrolThrottle, steer: steerToward(patrol, target.x, target.z), lift: 0 }, dt, deps.world);
      }

      if (inBoat(deps)) {
        for (let i = 0; i < total; i++) {
          if (buoys[i]) continue;
          const [x, z] = obj.points[i];
          if (!withinRange(px, pz, x, z, obj.radius)) continue;
          const group = buildPrefab('sonar-buoy', { scale: 1.5 });
          const baseY = surfaceAt(x, z) - 0.2;
          group.position.set(x, baseY, z);
          deps.scene.add(group);
          buoys[i] = { group, baseY, phase: i * 1.7 };
          const k = droppedCount();
          deps.play('splash');
          say('Buoy ' + k + ' of ' + total + ' down. Its lamp blinks.');
          syncMarks();
          if (k >= total) doneFlag = true;
          changed();
          if (doneFlag) return;
        }
      }

      const dPatrol = Math.hypot(px - patrol.x, pz - patrol.z);
      if (patrolDriving() && inBoat(deps) && graceT <= 0 && droppedCount() > 0 && withinRange(px, pz, patrol.x, patrol.z, obj.spotRadius)) {
        buoys.forEach((b, i) => {
          if (!b) return;
          deps.scene.remove(b.group);
          buoys[i] = null;
        });
        graceT = PATROL_GRACE_T;
        deps.play('alarm');
        say('The HOA patrol spotted you and fished out your buoys! Keep your distance.');
        syncMarks();
      } else if (patrolDriving() && graceT <= 0 && dPatrol <= obj.spotRadius + 15 && warnT <= 0) {
        say('HOA patrol boat nearby. Keep clear.');
        warnT = PATROL_WARN_T;
      }
    },
    onCracked() {},
    blips: (): Blip[] => {
      const out: Blip[] = [];
      if (doneFlag) return out;
      obj.points.forEach(([x, z], i) => {
        if (!buoys[i]) out.push({ x, z, color: TARGET_COLOR, quest: 'Sonar buoy' });
      });
      if (patrolDriving()) out.push({ x: patrol.x, z: patrol.z, color: PATROL_COLOR, quest: 'HOA patrol boat' });
      return out;
    },
    cracked: () => [],
    cleanup() {
      for (const m of marks) disposeMark(deps.scene, m);
      for (const b of buoys) if (b) deps.scene.remove(b.group);
      if (deps.vehicles && deps.player?.vehicle !== patrol) {
        const idx = deps.vehicles.indexOf(patrol);
        if (idx >= 0) deps.vehicles.splice(idx, 1);
        removeVehicle(deps.scene, patrol);
      }
    },
  };
}
