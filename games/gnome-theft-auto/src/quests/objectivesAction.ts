// Objective runners for setpiece story missions: air-drop, survive-derby, boss-combine, and final choice.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab } from '@lawn/prefabs';
import { angleDiff } from '../collide';
import { gnomeState, makeGnome, randomTownLook } from '../gnomes';
import type { Blip, Npc, Vehicle } from '../types';
import { collideVehicles, createVehicle, removeVehicle, stepVehicle, syncVehicleMesh } from '../vehicles';
import type { ObjectiveDef, QuestDeps, QuestSave, Run } from './types';
import { heightAt } from '../terrain';
import { placeOnGround } from '../terrainMesh';
import { trackBeam } from '../questMarkerPrefs';

const TARGET_COLOR = '#ff7a00';
const ALT_COLOR = '#7cf0ff';

function makeRing(scene: THREE.Scene, x: number, z: number, radius: number, color: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(Math.max(0.6, radius - 0.55), radius, 36),
    flatLayer(new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.55, depthWrite: false }), LAYER.marker),
  );
  m.rotation.x = -Math.PI / 2;
  placeOnGround(m, x, z, 0.08, true);
  scene.add(m);
  return m;
}

function makeBeacon(scene: THREE.Scene, x: number, z: number, color: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 40, 12, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }),
  );
  m.position.set(x, heightAt(x, z) + 20, z);
  trackBeam(m, heightAt(x, z), 40);
  scene.add(m);
  return m;
}

/** Bail out of a plane, parachute onto `dropZone`, and optionally board `targetVehicle`. */
export function airDropRun(
  obj: Extract<ObjectiveDef, { kind: 'air-drop' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  let spawnedPlane: Vehicle | null = null;
  if (obj.planeAt && deps.vehicles) {
    spawnedPlane = createVehicle(deps.scene, 'plane', obj.planeAt[0], obj.planeAt[1], 0);
    deps.vehicles.push(spawnedPlane);
  }
  const ring = makeRing(deps.scene, obj.dropZone[0], obj.dropZone[2], obj.radius, 0xffd23f);
  const beacon = makeBeacon(deps.scene, obj.dropZone[0], obj.dropZone[2], 0xffd23f);

  let wasAirborne = false;
  let landedInZone = false;
  let doneFlag = false;
  let t = 0;

  return {
    lines: () => [
      !wasAirborne
        ? `${obj.text} (Fly high & bail over {{${obj.hint}}})`
        : !landedInZone
          ? `Land inside the {{${obj.hint}}} drop zone!`
          : obj.targetVehicle
            ? `Board the {{${obj.targetVehicle}}}!`
            : 'Drop complete!',
    ],
    done: () => doneFlag,
    update(dt, px, pz) {
      t += dt;
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.2 * Math.sin(t * 3);
      if (doneFlag) return;

      const p = deps.player;
      if (p?.airborne || (p?.vehicle?.spec.flies && p.vehicle.y > 4)) {
        wasAirborne = true;
      }
      const inZone = Math.hypot(px - obj.dropZone[0], pz - obj.dropZone[2]) <= obj.radius;
      if (wasAirborne && p && !p.airborne && !p.vehicle && p.y <= 1.2 && inZone && !landedInZone) {
        landedInZone = true;
        if (obj.heatOnLand) deps.watch?.addHeat(obj.heatOnLand);
        if (!obj.targetVehicle) {
          doneFlag = true;
          say('Touchdown!');
          changed();
          return;
        }
        say(`Landed! Now board the ${obj.targetVehicle}!`);
      }
      if (landedInZone && obj.targetVehicle && p?.vehicle?.kind === obj.targetVehicle) {
        if (obj.heatOnBoard) deps.watch?.addHeat(obj.heatOnBoard);
        doneFlag = true;
        say(`Secured ${p.vehicle.spec.name}!`);
        changed();
      }
    },
    onCracked() {},
    blips: (): Blip[] => (doneFlag ? [] : [{ x: obj.dropZone[0], z: obj.dropZone[2], color: TARGET_COLOR, quest: obj.hint }]),
    cracked: () => [],
    cleanup() {
      deps.scene.remove(ring, beacon);
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      beacon.geometry.dispose();
      (beacon.material as THREE.Material).dispose();
      if (spawnedPlane && deps.vehicles && deps.player?.vehicle !== spawnedPlane) {
        const idx = deps.vehicles.indexOf(spawnedPlane);
        if (idx >= 0) deps.vehicles.splice(idx, 1);
        removeVehicle(deps.scene, spawnedPlane);
      }
    },
  };
}

/** Survive inside `arena` against `attackers` hostile derby mowers for `seconds`. */
export function surviveDerbyRun(
  obj: Extract<ObjectiveDef, { kind: 'survive-derby' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  const ring = makeRing(deps.scene, obj.arena[0], obj.arena[1], obj.radius, 0xff4b4b);
  const attackers: Vehicle[] = [];
  for (let i = 0; i < obj.attackers; i++) {
    const a = (i / Math.max(1, obj.attackers)) * Math.PI * 2;
    const r = obj.radius * 0.72;
    const vx = obj.arena[0] + Math.cos(a) * r;
    const vz = obj.arena[1] + Math.sin(a) * r;
    const v = createVehicle(deps.scene, i % 2 === 0 ? 'hoa-van' : 'ride-on', vx, vz, a + Math.PI, 0x222226);
    const look = randomTownLook({ hat: 0x141414, shirt: 0x3b3528 });
    const rider = makeGnome(v.object, look);
    rider.object.position.set(...v.spec.seat);
    rider.update(gnomeState(0, 0, 0, 0, 0, true), 0);
    v.rider = rider;
    v.riderLook = look;
    v.driver = 'npc';
    v.questOwned = true;
    attackers.push(v);
    deps.vehicles?.push(v);
  }

  let remaining = obj.seconds;
  let doneFlag = false;

  return {
    lines: () => [
      obj.text,
      `Survive: {{${Math.ceil(Math.max(0, remaining))}s}} remaining in {{${obj.hint}}}.`,
    ],
    done: () => doneFlag,
    update(dt, px, pz) {
      if (doneFlag) return;
      const inArena = Math.hypot(px - obj.arena[0], pz - obj.arena[1]) <= obj.radius + 10;
      if (inArena && (deps.player?.health ?? 1) > 0) {
        remaining = Math.max(0, remaining - dt);
      }
      for (const v of attackers) {
        if (v.exploded || v.driver !== 'npc') continue;
        const dx = px - v.x;
        const dz = pz - v.z;
        const diff = angleDiff(Math.atan2(dx, dz), v.yaw);
        stepVehicle(v, { throttle: 0.9, steer: Math.max(-1, Math.min(1, -diff * 2.5)), lift: 0 }, dt, deps.world);
        syncVehicleMesh(v, dt);
      }
      if (deps.vehicles) collideVehicles(deps.vehicles);
      if (remaining <= 0) {
        doneFlag = true;
        say('Derby survived!');
        changed();
      }
    },
    onCracked() {},
    blips: (): Blip[] => (doneFlag ? [] : [{ x: obj.arena[0], z: obj.arena[1], color: TARGET_COLOR, quest: obj.hint }]),
    cracked: () => [],
    cleanup() {
      deps.scene.remove(ring);
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      for (const v of attackers) {
        if (deps.vehicles && deps.player?.vehicle !== v) {
          const idx = deps.vehicles.indexOf(v);
          if (idx >= 0) deps.vehicles.splice(idx, 1);
          removeVehicle(deps.scene, v);
        }
      }
    },
  };
}

/** Finale setpiece: Grand Combine rolling down x = 0 with Porcelain Guards and front intake Stopping Stone jam. */
export function bossCombineRun(
  obj: Extract<ObjectiveDef, { kind: 'boss-combine' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  const bossMesh = buildPrefab('grand-combine-boss', { lights: false });
  bossMesh.scale.setScalar(5);
  let bossZ = obj.startZ;
  bossMesh.position.set(0, heightAt(0, bossZ), bossZ);
  deps.scene.add(bossMesh);

  const intakeRing = makeRing(deps.scene, 0, bossZ + 8, 4.5, 0xffd23f);
  const guards: Npc[] = obj.phase === 'jam' ? [] : deps.watch?.spawnSquad('porcelain', [
    [-2.5, bossZ],
    [2.5, bossZ],
    [0, bossZ - 3],
  ]) ?? [];
  const crackedGuards = new Set<Npc>();
  let jammed = false;
  let t = 0;

  return {
    lines: () => {
      const alive = guards.filter((g) => !crackedGuards.has(g) && g.state !== 'ragdoll').length;
      return alive > 0
        ? [obj.text, `Crack Vesper's Porcelain Guards (${alive} left).`]
        : [obj.text, `Jam the Grand Combine's front intake at {{${obj.hint}}}!`];
    },
    // E22: the 'guards' phase ends once the Porcelain Guard is down (the jam is the next part's objective).
    done: () => jammed || (obj.phase === 'guards' && guards.every((g) => crackedGuards.has(g) || g.state === 'ragdoll')),
    update(dt, px, pz) {
      t += dt;
      if (jammed) return;
      const dir = Math.sign(obj.endZ - bossZ);
      if (Math.abs(obj.endZ - bossZ) > 0.5) {
        bossZ += dir * 2.2 * dt;
      }
      bossMesh.position.set(0, heightAt(0, bossZ), bossZ);
      const intakeZ = bossZ + (dir >= 0 ? 8 : -8);
      intakeRing.position.set(0, heightAt(0, intakeZ) + 0.1, intakeZ);
      (intakeRing.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.25 * Math.sin(t * 4);

      for (let i = 0; i < guards.length; i++) {
        const g = guards[i];
        if (crackedGuards.has(g) || g.state === 'ragdoll') continue;
        if (Math.abs(g.z - bossZ) > 10) {
          g.z += dir * 2.2 * dt;
          g.model.object.position.set(g.x, heightAt(g.x, g.z), g.z);
        }
      }

      const alive = guards.filter((g) => !crackedGuards.has(g) && g.state !== 'ragdoll').length;
      if (alive === 0 && Math.hypot(px, pz - intakeZ) <= 5) {
        jammed = true;
        deps.fx?.explode(0, 2, intakeZ);
        deps.fx?.confetti(0, 4, intakeZ);
        say('The Stopping Stone jams the Grand Combine!');
        changed();
      }
    },
    onCracked(npc) {
      if (guards.includes(npc)) crackedGuards.add(npc);
    },
    blips: (): Blip[] => (jammed ? [] : [{ x: 0, z: bossZ, color: TARGET_COLOR, quest: 'Grand Combine' }]),
    cracked: () => [],
    cleanup() {
      deps.watch?.despawnSquad?.(guards);
      deps.scene.remove(bossMesh, intakeRing);
      intakeRing.geometry.dispose();
      (intakeRing.material as THREE.Material).dispose();
    },
  };
}

/** Two glowing decision beacons (Option A & Option B); walking into either ends the mission with that epilogue. */
export function choiceRun(
  obj: Extract<ObjectiveDef, { kind: 'choice' }>,
  deps: QuestDeps,
  save: QuestSave,
  changed: () => void,
  say: (t: string) => void,
): Run {
  const ringA = makeRing(deps.scene, obj.optionA.at[0], obj.optionA.at[1], 3.8, 0xffd23f);
  const beaconA = makeBeacon(deps.scene, obj.optionA.at[0], obj.optionA.at[1], 0xffd23f);
  const ringB = makeRing(deps.scene, obj.optionB.at[0], obj.optionB.at[1], 3.8, 0x7cf0ff);
  const beaconB = makeBeacon(deps.scene, obj.optionB.at[0], obj.optionB.at[1], 0x7cf0ff);

  let chosen = false;
  let ending: string | undefined;

  return {
    outro: () => ending,
    lines: () => [
      obj.text,
      `Gold: {{${obj.optionA.label}}}  |  Cyan: {{${obj.optionB.label}}}`,
    ],
    done: () => chosen,
    update(_dt, px, pz) {
      if (chosen) return;
      if (Math.hypot(px - obj.optionA.at[0], pz - obj.optionA.at[1]) <= 4.5) {
        chosen = true;
        ending = obj.optionA.outro;
        save.ending = 'A';
        const bonus = obj.optionA.bonusAcorns ?? 0;
        if (bonus > 0) deps.economy?.earn(bonus, obj.optionA.label);
        if (obj.optionA.achievement) deps.unlock(obj.optionA.achievement);
        say(bonus > 0 ? `${obj.optionA.endingText} (+${bonus} Acorns)` : obj.optionA.endingText);
        changed();
      } else if (Math.hypot(px - obj.optionB.at[0], pz - obj.optionB.at[1]) <= 4.5) {
        chosen = true;
        ending = obj.optionB.outro;
        save.ending = 'B';
        const bonus = obj.optionB.bonusAcorns ?? 0;
        if (bonus > 0) deps.economy?.earn(bonus, obj.optionB.label);
        if (obj.optionB.achievement) deps.unlock(obj.optionB.achievement);
        say(bonus > 0 ? `${obj.optionB.endingText} (+${bonus} Acorns)` : obj.optionB.endingText);
        changed();
      }
    },
    onCracked() {},
    blips: (): Blip[] =>
      chosen
        ? []
        : [
            { x: obj.optionA.at[0], z: obj.optionA.at[1], color: TARGET_COLOR, quest: obj.optionA.label },
            { x: obj.optionB.at[0], z: obj.optionB.at[1], color: ALT_COLOR, quest: obj.optionB.label },
          ],
    cracked: () => [],
    cleanup() {
      deps.scene.remove(ringA, beaconA, ringB, beaconB);
      for (const m of [ringA, beaconA, ringB, beaconB]) {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      }
    },
  };
}
