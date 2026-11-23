// The Pay 'n' Glaze showroom stage: a patch of dirt far off the edge of the map that the shop warps the player's vehicle to, so the
// player never sees (or is hit by) the game world while browsing. A great tilted clay pot is the "shop", a rack of spray cans stands
// behind, a giant wrench leans on the pot, and tyres, buckets, cans and dirt heaps litter the ground. Built from `glaze-stage-*` prefabs.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { heightAt } from './terrain';

/** Where the stage is: far outside the 1800 m map (the world edge is at +-900), so nothing of the world is near. */
export const STAGE_CENTRE = { x: 4000, z: 0 } as const;

export interface GlazeStage {
  /** Where the vehicle is parked, and the yaw it faces. */
  readonly spot: { x: number; y: number; z: number; yaw: number };
  setVisible(on: boolean): void;
}

/** A prop from the prefab library at (x, z) on the stage floor, turned to face the middle plus `extraYaw`. */
function prop(id: string, x: number, z: number, extraYaw = 0, facing: 'centre' | 'fixed' = 'centre', scale = 1): THREE.Group {
  const g = buildPrefab(id, { scale });
  g.position.set(x, 0, z);
  g.rotation.y = facing === 'centre' ? Math.atan2(-x, -z) + extraYaw : extraYaw;
  g.traverse((o) => { if (o instanceof THREE.Mesh) { o.castShadow = false; o.receiveShadow = false; } });
  return g;
}

/** A sky-and-horizon gradient on the inside of a big sphere: dusk purple overhead, hot pink at the rim, dirt brown below. */
function backdrop(): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false });
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const ctx = c.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#24103f');
      grad.addColorStop(0.35, '#6a2a78');
      grad.addColorStop(0.5, '#ff7eb6');
      grad.addColorStop(0.52, '#8a5a3a');
      grad.addColorStop(1, '#3a2616');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 4, 256);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      mat.map = tex;
    }
  } else {
    mat.color.set(0x6a2a78);
  }
  const m = new THREE.Mesh(new THREE.SphereGeometry(90, 24, 16), mat);
  m.renderOrder = -10;
  m.frustumCulled = false;
  return m;
}

/** The sign's name, painted on a plane in front of the plank (the prefab is the blank board). */
function signText(): THREE.Mesh | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 150;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.font = 'bold 88px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#ffffff';
  ctx.strokeText("PAY 'N' GLAZE", 256, 78);
  ctx.fillStyle = '#e0245e';
  ctx.fillText("PAY 'N' GLAZE", 256, 78);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.4), mat);
  m.position.set(0, 2.6, 0.14);
  return m;
}

export function createGlazeStage(scene: THREE.Scene): GlazeStage {
  const y0 = heightAt(STAGE_CENTRE.x, STAGE_CENTRE.z);
  const group = new THREE.Group();
  group.position.set(STAGE_CENTRE.x, y0, STAGE_CENTRE.z);
  group.visible = false;

  // Dirt floor: a wide disc plus a darker inner patch where the vehicle stands.
  const dirt = new THREE.Mesh(new THREE.CircleGeometry(38, 40), new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 1 }));
  dirt.rotation.x = -Math.PI / 2;
  dirt.position.y = 0.02;
  group.add(dirt);
  const patch = new THREE.Mesh(new THREE.CircleGeometry(7, 32), new THREE.MeshStandardMaterial({ color: 0x57391f, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  patch.rotation.x = -Math.PI / 2;
  patch.position.y = 0.03;
  group.add(patch);
  group.add(backdrop());

  // The shop (a pot on its side), the can rack behind it all, the wrench, the sign.
  group.add(prop('glaze-stage-pot', -9.5, 8.5));
  group.add(prop('glaze-stage-wrench', -4.6, 11.4, 0.5, 'fixed'));
  const rack = prop('glaze-stage-rack', 3, 16, Math.PI, 'fixed');
  group.add(rack);
  const sign = prop('glaze-stage-sign', 11, 11, Math.PI - 0.5, 'fixed');
  const text = signText();
  if (text) sign.add(text);
  group.add(sign);

  // Small things: tyres, buckets, spilled cans, heaps of dirt, work lamps.
  group.add(prop('glaze-stage-tyres', 8, -2));
  group.add(prop('glaze-stage-tyres', 9.2, -3.6, 1.2, 'fixed'));
  group.add(prop('glaze-stage-bucket', 5, 6.5, 0.4, 'fixed'));
  group.add(prop('glaze-stage-bucket', -4, -6, 2.0, 'fixed'));
  group.add(prop('glaze-stage-cans', 4, 9, 0.3, 'fixed'));
  group.add(prop('glaze-stage-cans', -6.5, -2, 1.9, 'fixed'));
  group.add(prop('glaze-stage-cans', 0.5, -8.5, 4, 'fixed'));
  for (const [x, z, s] of [[-12, 0, 1.4], [13, 4, 1.8], [-8, -10, 1.2], [6, -10, 1.5], [-14, 13, 2], [0, 22, 2.4], [20, -4, 2.2]] as const) {
    group.add(prop('glaze-stage-dirt', x, z, x, 'fixed', s));
  }
  group.add(prop('glaze-stage-lamp', 6.5, 7.5, 3.6, 'fixed'));
  group.add(prop('glaze-stage-lamp', -7, -3.5, 0.4, 'fixed'));

  // Light: a warm pool over the vehicle, a pink wash from the rack, a cool kick from the pot's doorway.
  const warm = new THREE.PointLight(0xffd9a0, 90, 60, 1.6);
  warm.position.set(0, 9, -3);
  const pink = new THREE.PointLight(0xff5fa8, 55, 50, 1.6);
  pink.position.set(3, 4, 12);
  const doorway = new THREE.PointLight(0xffe08a, 40, 28, 1.6);
  doorway.position.set(-8, 2.2, 5.8);
  group.add(warm, pink, doorway);

  scene.add(group);
  return {
    spot: { x: STAGE_CENTRE.x, y: y0, z: STAGE_CENTRE.z, yaw: 0.5 },
    setVisible(on: boolean): void { group.visible = on; },
  };
}
