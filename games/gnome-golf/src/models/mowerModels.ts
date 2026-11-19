// src/models/mowerModels.ts: copied unchanged from games/sample-3d/src/mowerModels.ts (Lawn Gnome Panic).
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { MowerModel, MowerTier } from './config';

interface Headlights {
  lamps: [number, number, number][]; // lamp centres (x, y, z)
  lampR: number;
  coneR: number;
  coneZ: number; // z of the cone's apex, at the front of the lamps
}

const POWERED_LIGHTS: Headlights = {
  lamps: [[-0.5, 0.65, 0.68], [0.5, 0.65, 0.68]],
  lampR: 0.07,
  coneR: 5,
  coneZ: 0.7,
};

const HEADLIGHTS: Record<MowerTier, Headlights> = {
  reel: { lamps: [[-0.4, 0.4, 0.4], [0.4, 0.4, 0.4]], lampR: 0.07, coneR: 5, coneZ: 0.4 },
  green: POWERED_LIGHTS,
  yellow: POWERED_LIGHTS,
  red: POWERED_LIGHTS,
  combine: {
    lamps: [[-0.9, 2.6, 0.95], [-0.3, 2.6, 0.95], [0.3, 2.6, 0.95], [0.9, 2.6, 0.95]],
    lampR: 0.25,
    coneR: 12,
    coneZ: 2.5,
  },
};

/** The prefab each tier is built from, and the scale it is shown at (the combine is half size in the library). */
const PREFAB: Record<MowerTier, { id: string; scale: number }> = {
  reel: { id: 'reel-mower', scale: 1 },
  green: { id: 'push-mower-green', scale: 1 },
  yellow: { id: 'push-mower-yellow', scale: 1 },
  red: { id: 'push-mower-red', scale: 1 },
  combine: { id: 'combine-harvester', scale: 2 },
};

const FLASH_MAT = new THREE.MeshBasicMaterial({ color: 0xffffff });

/** Geometries are built once and shared by every model that needs them. */
const sharedGeos = new Map<string, THREE.BufferGeometry>();
function sharedGeo(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = sharedGeos.get(key);
  if (!g) {
    g = make();
    sharedGeos.set(key, g);
  }
  return g;
}

/** Builds the mesh for a tier, facing +z (travel direction), base at y = 0. */
export function createMowerModel(tier: MowerTier): MowerModel {
  // Callers set group.position / rotation / scale: the prefab's own scale goes on the body, never here.
  const group = new THREE.Group();
  const { id, scale } = PREFAB[tier];
  const body = buildPrefab(id, { scale });
  group.add(body);

  // Collected before the headlights are added, so the white hit flash only covers the machine.
  const flashMeshes: { mesh: THREE.Mesh; mat: THREE.Material | THREE.Material[] }[] = [];
  body.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) flashMeshes.push({ mesh: m, mat: m.material });
  });
  // Pivot radius is the wheel's centre height in prefab units; scale it to game units.
  const wheels = body.children
    .filter((c) => c.name.startsWith('wheel-'))
    .map((w) => ({ node: w, r: w.position.y * scale }));

  let t = 0;
  let onAnimate: (dt: number, speed: number) => void = () => {};
  if (tier === 'reel') {
    const reel = body.getObjectByName('reel')!;
    onAnimate = (dt, speed) => {
      reel.rotation.x += speed * dt * 3;
    };
  } else if (tier === 'combine') {
    const reel = body.getObjectByName('reel')!;
    onAnimate = (dt) => {
      reel.rotation.x += dt * 4;
      body.rotation.z = Math.sin(t * 20) * 0.006;
    };
  } else {
    // The engine group moves as one, so the cap rides on the engine.
    const engine = body.getObjectByName('engine')!;
    onAnimate = () => {
      engine.position.y = 0.65 + Math.sin(t * 60) * 0.012;
      body.rotation.z = Math.sin(t * 45) * 0.01;
    };
  }

  // Headlights: two lamps at the front and a soft additive cone of light on the grass ahead.
  const spec = HEADLIGHTS[tier];
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff3c4 });
  const lamps: THREE.Mesh[] = spec.lamps.map(([x, y, z]) => {
    const lamp = new THREE.Mesh(
      sharedGeo(`lamp${spec.lampR}`, () => new THREE.SphereGeometry(spec.lampR, 8, 6)),
      lampMat,
    );
    lamp.position.set(x, y, z);
    lamp.visible = false;
    group.add(lamp);
    return lamp;
  });
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfff0b0,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const cone = new THREE.Mesh(
    sharedGeo(`cone${spec.coneR}`, () => {
      const g = new THREE.CircleGeometry(spec.coneR, 16, -0.35, 0.7);
      g.rotateZ(Math.PI / 2); // arc centre moves from +x to +y
      g.rotateX(Math.PI / 2); // lie flat on the ground, arc centre now points along +z
      return g;
    }),
    coneMat,
  );
  cone.position.set(0, 0.06, spec.coneZ);
  cone.visible = false;
  group.add(cone);

  return {
    group,
    setNight(night01: number) {
      for (const lamp of lamps) {
        lamp.visible = night01 > 0.05;
        lamp.scale.setScalar(night01);
      }
      cone.visible = night01 >= 0.02;
      coneMat.opacity = night01 * 0.28;
    },
    setFlash(on: boolean) {
      for (const f of flashMeshes) f.mesh.material = on ? FLASH_MAT : f.mat;
    },
    animate(dt: number, speed: number) {
      t += dt;
      for (const w of wheels) w.node.rotation.x += (speed * dt) / w.r;
      onAnimate(dt, speed);
    },
  };
}
