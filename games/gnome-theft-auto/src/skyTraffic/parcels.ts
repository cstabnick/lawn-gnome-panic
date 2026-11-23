// Pigeon-Drop parcels: a crate under a parachute, dropped from the sky. It lands on the terrain, sits for a while,
// and a gnome on foot who walks into it collects the Acorns.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { SKY } from './config';
import { heightAt } from '../terrain';

export interface ParcelDrops {
  drop(x: number, y: number, z: number, vx: number, vz: number): void;
  update(dt: number, px: number, py: number, pz: number, onFoot: boolean): number;
  readonly count: number;
  clear(): void;
}

const SCALE = 2;
const DRIFT_DECAY = 0.5;
const SWAY = 0.08;
const SWAY_RATE = 1.3;
const PICKUP_DY = 2;
// Canopy lines end at y 1.2 (prefab units, origin at the feet); the lines must meet the top of the crate.
const LINE_END_Y = 1.2;

interface Parcel {
  group: THREE.Group;
  canopy: THREE.Object3D | null;
  vx: number;
  vz: number;
  t: number;
  landed: boolean;
  life: number;
}

function buildOrEmpty(id: string, scale: number): THREE.Group {
  try {
    return buildPrefab(id, { scale });
  } catch (err) {
    console.warn(`[skyTraffic] prefab "${id}" failed to build; using an empty group`, err);
    const g = new THREE.Group();
    g.scale.setScalar(scale);
    return g;
  }
}

function buildParcel(x: number, y: number, z: number, vx: number, vz: number): Parcel {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Measured before the crate joins the positioned group, so the box is in the crate's own space (origin at the floor).
  const crate = buildOrEmpty('crate', SCALE);
  const box = new THREE.Box3().setFromObject(crate);
  const crateTop = Number.isFinite(box.max.y) && box.max.y > 0 ? box.max.y : 0.8 * SCALE;
  group.add(crate);

  const canopy = buildOrEmpty('parachute-canopy', SCALE);
  canopy.position.y = crateTop - LINE_END_Y * SCALE;
  group.add(canopy);

  return { group, canopy, vx, vz, t: Math.random() * Math.PI * 2, landed: false, life: 0 };
}

export function createParcels(scene: THREE.Scene): ParcelDrops {
  const parcels: Parcel[] = [];

  function removeAt(i: number): void {
    const p = parcels[i];
    scene.remove(p.group);
    parcels.splice(i, 1);
  }

  return {
    drop(x, y, z, vx, vz) {
      while (parcels.length >= SKY.parcelMax) removeAt(0);
      const p = buildParcel(x, y, z, vx, vz);
      parcels.push(p);
      scene.add(p.group);
    },

    update(dt, px, py, pz, onFoot) {
      if (dt <= 0) return 0;
      const decay = Math.max(0, 1 - DRIFT_DECAY * dt);
      let acorns = 0;

      for (let i = parcels.length - 1; i >= 0; i--) {
        const p = parcels[i];
        const g = p.group;
        if (!p.landed) {
          p.t += dt;
          g.position.x += p.vx * dt;
          g.position.z += p.vz * dt;
          p.vx *= decay;
          p.vz *= decay;
          g.position.y -= SKY.parcelFall * dt;
          g.rotation.z = SWAY * Math.sin(p.t * SWAY_RATE);
          const ground = heightAt(g.position.x, g.position.z);
          if (g.position.y <= ground) {
            g.position.y = ground;
            g.rotation.z = 0;
            if (p.canopy) {
              g.remove(p.canopy);
              p.canopy = null;
            }
            p.landed = true;
            p.life = SKY.parcelLife;
          }
          continue;
        }

        if (onFoot) {
          const dx = g.position.x - px;
          const dz = g.position.z - pz;
          if (Math.hypot(dx, dz) < SKY.parcelPickup && Math.abs(py - g.position.y) < PICKUP_DY) {
            acorns += SKY.parcelAcorns;
            removeAt(i);
            continue;
          }
        }

        p.life -= dt;
        if (p.life <= 0) removeAt(i);
      }
      return acorns;
    },

    get count() {
      return parcels.length;
    },

    clear() {
      for (const p of parcels) scene.remove(p.group);
      parcels.length = 0;
    },
  };
}
