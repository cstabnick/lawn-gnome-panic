import * as THREE from 'three';
import type { GsrLevelDoc } from '../levels/schema';

export interface SkyTrafficSystem {
  group: THREE.Group;
  update(t: number, beatPulse: number, hype: number): void;
  dispose(): void;
}

interface OrbitItem {
  obj: THREE.Object3D;
  radius: number;
  baseY: number;
  speed: number;
  phase: number;
  bobAmp: number;
  spinRate: number;
}

export function createSkyTraffic(
  doc: GsrLevelDoc,
  track: <T extends { dispose(): void }>(x: T) => T,
): SkyTrafficSystem {
  const group = new THREE.Group();
  const items: OrbitItem[] = [];
  const area = doc.data.areaNumber;
  const accent = doc.data.accentColor;

  const hullMat = track(new THREE.MeshStandardMaterial({ color: '#24153d', roughness: 0.45 }));
  const glowMat = track(
    new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.85, roughness: 0.25 }),
  );
  const goldMat = track(
    new THREE.MeshStandardMaterial({ color: '#ffd740', emissive: '#ff9100', emissiveIntensity: 0.55, roughness: 0.3 }),
  );
  const pinkMat = track(
    new THREE.MeshStandardMaterial({ color: '#ff4ecd', emissive: '#ff4ecd', emissiveIntensity: 0.75, roughness: 0.25 }),
  );

  const count = 7;
  for (let i = 0; i < count; i++) {
    const holder = new THREE.Group();
    const radius = 64 + (i % 3) * 18;
    const baseY = 24 + (i % 4) * 6.5;
    const speed = (i % 2 === 0 ? 1 : -1) * (0.09 + (i % 3) * 0.025);
    const phase = (i / count) * Math.PI * 2;

    if (area === 1 || area === 4) {
      // Pink Aether Gondolas & Lantern Buoys
      const hull = new THREE.Mesh(track(new THREE.BoxGeometry(2.6, 0.9, 5.4)), pinkMat);
      const canopy = new THREE.Mesh(track(new THREE.BoxGeometry(2.2, 0.24, 4.2)), goldMat);
      canopy.position.y = 1.65;
      const prow = new THREE.Mesh(track(new THREE.ConeGeometry(0.9, 1.8, 6)), glowMat);
      prow.rotation.x = Math.PI / 2;
      prow.position.z = 3.4;
      holder.add(hull, canopy, prow);
    } else if (area === 2) {
      // Parcel-Gnome Freight Skiffs & Drum Beacons
      const body = new THREE.Mesh(track(new THREE.BoxGeometry(3.2, 1.3, 6.2)), hullMat);
      const crate = new THREE.Mesh(track(new THREE.BoxGeometry(2.2, 1.2, 2.4)), goldMat);
      crate.position.y = 1.25;
      const thruster = new THREE.Mesh(track(new THREE.CylinderGeometry(0.7, 0.9, 1.2, 10)), glowMat);
      thruster.rotation.x = Math.PI / 2;
      thruster.position.z = -3.4;
      holder.add(body, crate, thruster);
    } else if (area === 3) {
      // Foundry Crane Drones & Ember Motes
      const core = new THREE.Mesh(track(new THREE.OctahedronGeometry(1.7)), hullMat);
      const ring = new THREE.Mesh(track(new THREE.TorusGeometry(2.8, 0.22, 8, 18)), glowMat);
      ring.rotation.x = Math.PI / 2;
      holder.add(core, ring);
    } else if (area === 5) {
      // Arcade Blimps & CRT Cube Drones
      const blimp = new THREE.Mesh(track(new THREE.SphereGeometry(2.2, 12, 10)), hullMat);
      blimp.scale.set(1, 0.72, 2.1);
      const fin = new THREE.Mesh(track(new THREE.BoxGeometry(3.4, 0.25, 1.4)), glowMat);
      fin.position.z = -3.4;
      holder.add(blimp, fin);
    } else if (area === 6) {
      // Translucent Pastel Mall Blimps & Prisms
      const prism = new THREE.Mesh(track(new THREE.OctahedronGeometry(2.1)), glowMat);
      const banner = new THREE.Mesh(track(new THREE.BoxGeometry(4.8, 1.1, 0.3)), pinkMat);
      banner.position.y = -2.4;
      holder.add(prism, banner);
    } else if (area === 7) {
      // HOA Megaphone Patrol Drones
      const hull = new THREE.Mesh(track(new THREE.CylinderGeometry(1.6, 1.8, 1.2, 12)), hullMat);
      const cone = new THREE.Mesh(track(new THREE.ConeGeometry(1.6, 3.6, 12)), goldMat);
      cone.position.y = -2.4;
      holder.add(hull, cone);
    } else if (area === 8) {
      // 108.0 Dish Satellites
      const dish = new THREE.Mesh(track(new THREE.CylinderGeometry(2.8, 0.6, 1.4, 14)), glowMat);
      dish.rotation.x = Math.PI * 0.35;
      const orb = new THREE.Mesh(track(new THREE.SphereGeometry(0.65, 10, 10)), goldMat);
      orb.position.set(0, 1.2, 1.4);
      holder.add(dish, orb);
    } else {
      // Area 9: Orbiting Golden Vinyl Discs & 8-Band Orbs
      const disc = new THREE.Mesh(track(new THREE.CylinderGeometry(3.2, 3.2, 0.25, 20)), hullMat);
      const label = new THREE.Mesh(track(new THREE.CylinderGeometry(1.1, 1.1, 0.32, 14)), goldMat);
      disc.rotation.z = 0.25;
      label.rotation.z = 0.25;
      holder.add(disc, label);
    }

    group.add(holder);
    items.push({
      obj: holder,
      radius,
      baseY,
      speed,
      phase,
      bobAmp: 1.4 + (i % 3) * 0.6,
      spinRate: area === 9 || area === 3 ? 0.6 : 0,
    });
  }

  return {
    group,
    update(t, beatPulse, hype) {
      const boost = 1 + hype * 0.35;
      for (const it of items) {
        const ang = t * it.speed * boost + it.phase;
        it.obj.position.set(
          Math.cos(ang) * it.radius,
          it.baseY + Math.sin(t * 1.4 + it.phase) * it.bobAmp + beatPulse * 0.45,
          Math.sin(ang) * it.radius,
        );
        if (it.spinRate > 0) {
          it.obj.rotation.y = t * it.spinRate;
        } else {
          it.obj.rotation.y = -ang + (it.speed > 0 ? 0 : Math.PI);
        }
      }
    },
    dispose() {
      // Geometries and materials are tracked by parent world disposables.
    },
  };
}
