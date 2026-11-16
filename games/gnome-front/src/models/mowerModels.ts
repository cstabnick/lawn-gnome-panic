// src/models/mowerModels.ts: copied unchanged from games/sample-3d/src/mowerModels.ts (Lawn Gnome Panic).
import * as THREE from 'three';
import { COLORS, type MowerModel, type MowerTier } from './config';

interface Wheel { mesh: THREE.Mesh; r: number }

const UP = new THREE.Vector3(0, 1, 0);

/** A cylinder from a to b, centred between them. Used for handles and tubes. */
function bar(a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 8), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
  mesh.castShadow = true;
  return mesh;
}

/** A cylinder whose axis runs along x. */
function cylinderX(r: number, length: number): THREE.CylinderGeometry {
  const g = new THREE.CylinderGeometry(r, r, length, 16);
  g.rotateZ(Math.PI / 2);
  return g;
}

const v = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);

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
  const group = new THREE.Group();
  const mats: THREE.MeshStandardMaterial[] = [];
  const wheels: Wheel[] = [];
  let t = 0;
  let onAnimate: (dt: number, speed: number) => void = () => {};

  const mat = (color: number, extra: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
    mats.push(m);
    return m;
  };
  const mesh = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number): THREE.Mesh => {
    const obj = new THREE.Mesh(geo, m);
    obj.position.set(x, y, z);
    obj.castShadow = true;
    parent.add(obj);
    return obj;
  };
  const wheel = (r: number, width: number, m: THREE.Material, x: number, y: number, z: number): void => {
    wheels.push({ mesh: mesh(group, cylinderX(r, width), m, x, y, z), r });
  };

  if (tier === 'reel') {
    const metal = mat(COLORS.reelMetal);
    const wood = mat(COLORS.reelWood);
    const dark = mat(COLORS.mowerDark);

    wheel(0.32, 0.08, dark, -0.38, 0.32, 0);
    wheel(0.32, 0.08, dark, 0.38, 0.32, 0);

    const reel = new THREE.Group();
    reel.position.set(0, 0.3, 0.05);
    group.add(reel);
    mesh(reel, cylinderX(0.05, 0.7), metal, 0, 0, 0);
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5;
      const blade = mesh(reel, new THREE.BoxGeometry(0.7, 0.03, 0.06), metal, 0, Math.cos(a) * 0.17, Math.sin(a) * 0.17);
      blade.rotation.x = a;
    }
    mesh(group, cylinderX(0.07, 0.7), wood, 0, 0.08, -0.35);

    for (const s of [-1, 1]) {
      group.add(bar(v(s * 0.3, 0.32, -0.05), v(s * 0.2, 1.05, -0.85), 0.03, wood));
    }
    group.add(bar(v(-0.24, 1.05, -0.85), v(0.24, 1.05, -0.85), 0.035, dark));

    onAnimate = (dt, speed) => {
      reel.rotation.x += speed * dt * 3;
    };
  } else if (tier === 'combine') {
    const body = mat(COLORS.combineBody);
    const accent = mat(COLORS.combineAccent);
    const dark = mat(COLORS.mowerDark);
    const glass = mat(COLORS.combineGlass, { transparent: true, opacity: 0.7 });

    mesh(group, new THREE.BoxGeometry(2.6, 1.8, 3.4), body, 0, 1.5, -0.6);
    mesh(group, new THREE.BoxGeometry(1.3, 1.0, 1.2), body, 0, 2.9, 0.3);
    mesh(group, new THREE.BoxGeometry(1.2, 0.7, 0.05), glass, 0, 3.0, 0.92);
    mesh(group, new THREE.BoxGeometry(1.5, 0.1, 1.4), accent, 0, 3.45, 0.3);

    wheel(0.9, 0.5, dark, -1.45, 0.9, 0.2);
    wheel(0.9, 0.5, dark, 1.45, 0.9, 0.2);
    wheel(0.55, 0.4, dark, -1.25, 0.55, -1.8);
    wheel(0.55, 0.4, dark, 1.25, 0.55, -1.8);

    // Header (cutting platform) and its dividers, which point forward.
    mesh(group, new THREE.BoxGeometry(5.0, 0.4, 0.9), accent, 0, 0.45, 2.0);
    for (const s of [-1, 1]) {
      const cone = mesh(group, new THREE.ConeGeometry(0.25, 0.7, 12), accent, s * 2.5, 0.45, 2.55);
      cone.rotation.x = Math.PI / 2;
    }

    const reel = new THREE.Group();
    reel.position.set(0, 0.95, 2.1);
    group.add(reel);
    mesh(reel, cylinderX(0.08, 4.8), dark, 0, 0, 0);
    for (let i = 0; i < 6; i++) {
      const a = (i * 2 * Math.PI) / 6;
      const bat = mesh(reel, new THREE.BoxGeometry(4.8, 0.06, 0.12), body, 0, Math.cos(a) * 0.45, Math.sin(a) * 0.45);
      bat.rotation.x = a;
    }

    group.add(bar(v(1.1, 2.3, -1.5), v(2.6, 2.8, 0.5), 0.15, body));
    mesh(group, new THREE.CylinderGeometry(0.08, 0.08, 0.8, 12), dark, -0.8, 2.8, -1.6);

    onAnimate = (dt) => {
      reel.rotation.x += dt * 4;
      group.rotation.z = Math.sin(t * 20) * 0.006;
    };
  } else {
    const deckColour = tier === 'green' ? COLORS.mowerGreen : tier === 'yellow' ? COLORS.mowerYellow : COLORS.mowerRed;
    const deck = mat(deckColour);
    const dark = mat(COLORS.mowerDark);
    const engineY = 0.65;

    mesh(group, new THREE.BoxGeometry(1.4, 0.3, 1.3), deck, 0, 0.35, 0);

    // The engine group moves as one, so the cap rides on the engine.
    const engine = new THREE.Group();
    engine.position.set(0, engineY, 0.1);
    group.add(engine);
    mesh(engine, new THREE.CylinderGeometry(0.3, 0.32, 0.3, 16), dark, 0, 0, 0);
    mesh(engine, new THREE.BoxGeometry(0.2, 0.1, 0.2), deck, 0, 0.2, 0);

    for (const x of [-0.72, 0.72]) {
      for (const z of [-0.45, 0.45]) {
        wheel(0.18, 0.12, dark, x, 0.18, z);
      }
    }

    for (const s of [-1, 1]) {
      group.add(bar(v(s * 0.45, 0.5, -0.6), v(s * 0.45, 1.15, -1.35), 0.03, dark));
    }
    group.add(bar(v(-0.45, 1.15, -1.35), v(0.45, 1.15, -1.35), 0.035, dark));

    if (tier === 'red') {
      mesh(group, new THREE.BoxGeometry(0.25, 0.01, 1.31), mat(0xffffff), 0, 0.505, 0);
    }
    if (tier === 'yellow') {
      mesh(group, new THREE.BoxGeometry(1.41, 0.06, 1.31), mat(0x111111), 0, 0.25, 0);
    }

    onAnimate = (_dt, _speed) => {
      engine.position.y = engineY + Math.sin(t * 60) * 0.012;
      group.rotation.z = Math.sin(t * 45) * 0.01;
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
      for (const m of mats) {
        m.emissive.setHex(on ? 0xffffff : 0x000000);
        m.emissiveIntensity = on ? 0.7 : 0;
      }
    },
    animate(dt: number, speed: number) {
      t += dt;
      for (const w of wheels) w.mesh.rotation.x += (speed * dt) / w.r;
      onAnimate(dt, speed);
    },
  };
}
