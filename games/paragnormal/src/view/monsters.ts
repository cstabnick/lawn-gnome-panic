import * as THREE from 'three';
import type { MonsterKind, MonsterState } from '../sim/types';

export interface MonsterMesh {
  root: THREE.Group;
  head: THREE.Group;
  eyeMat: THREE.MeshBasicMaterial;
  auraLight: THREE.PointLight;
  motes: THREE.Mesh[];
  /** Eye and aura colours when calm; alert colours are shared by every kind. */
  calmEye: number;
  calmAura: number;
  /** How far the body bobs in the air. The Dripping Nanny crawls, so it does not hover. */
  hoverAmp: number;
  /** Legs of the crawler, swung as it moves. Empty for the upright kinds. */
  legs: THREE.Mesh[];
}

const CALM: Record<MonsterKind, { eye: number; aura: number; porcelain: number; cloak: number }> = {
  gardener: { eye: 0x6ce5ff, aura: 0x5ac8fa, porcelain: 0x8f8a82, cloak: 0x1b1e26 },
  watcher: { eye: 0x6ce5ff, aura: 0x5ac8fa, porcelain: 0x8f8a82, cloak: 0x1b1e26 },
  // A brass-and-amber thing that carries a flame it cannot keep lit
  lamplighter: { eye: 0xffb84d, aura: 0xffb84d, porcelain: 0x9a8a72, cloak: 0x2a1f1a },
  // Wet clay and dark cloth, low to the floor
  crawler: { eye: 0x7ef0c0, aura: 0x49c79a, porcelain: 0x6f7a72, cloak: 0x161d1b },
  // Pale and very still, with its eyes shut
  hush: { eye: 0x9fb4c8, aura: 0xdfe9f5, porcelain: 0xc8d4de, cloak: 0x23293a },
};

export function createMonsterMesh(m: MonsterState): MonsterMesh {
  const root = new THREE.Group();
  root.position.set(m.x, 0, m.z);
  const look = CALM[m.kind];
  const legs: THREE.Mesh[] = [];

  const cloakMat = new THREE.MeshLambertMaterial({ color: look.cloak, flatShading: true });
  const porcelainMat = new THREE.MeshLambertMaterial({ color: look.porcelain, flatShading: true });
  const hatMat = new THREE.MeshLambertMaterial({ color: 0x2c1b24, flatShading: true });
  const beardMat = new THREE.MeshLambertMaterial({ color: 0x454852, flatShading: true });
  const eyeMat = new THREE.MeshBasicMaterial({ color: look.eye });

  const tall = m.kind === 'lamplighter' || m.kind === 'hush';
  const low = m.kind === 'crawler';

  // Towering tattered cloak (2.4m tall; thinner for the tall kinds, wide and low for the crawler)
  const cloakR = low ? 1.0 : m.kind === 'hush' ? 0.5 : m.kind === 'lamplighter' ? 0.62 : 0.82;
  const cloakH = low ? 1.7 : m.kind === 'hush' ? 2.7 : m.kind === 'lamplighter' ? 2.8 : 2.5;
  const cloak = new THREE.Mesh(new THREE.ConeGeometry(cloakR, cloakH, 9, 1, true), cloakMat);
  cloak.position.y = cloakH / 2;
  cloak.castShadow = true;
  root.add(cloak);

  // Inner dark void core
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.55, 2.2, 8),
    new THREE.MeshBasicMaterial({ color: 0x050608 }),
  );
  core.position.y = low ? 0.7 : 1.15;
  if (low) core.scale.set(1.3, 0.55, 1.3);
  root.add(core);

  // Hunched shoulders
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.56, 8, 6), cloakMat);
  shoulders.scale.set(1.25, 0.75, 0.85);
  shoulders.position.y = low ? 1.25 : 2.25;
  root.add(shoulders);

  // Head group (tracks player slightly)
  const head = new THREE.Group();
  head.position.set(0, low ? 1.6 : tall ? 2.95 : 2.72, low ? 0.45 : 0.08);
  root.add(head);

  // Hollow porcelain face
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.4, 9, 7), porcelainMat);
  face.scale.set(0.92, 1.08, 0.88);
  head.add(face);

  // Dark beard wisps (not the Hush, which keeps its mouth shut)
  if (m.kind !== 'hush') {
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.9, 7), beardMat);
    beard.rotation.x = Math.PI;
    beard.position.set(0, -0.45, 0.16);
    head.add(beard);
  } else {
    // One long finger held to where the lips would be
    const finger = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.07), porcelainMat);
    finger.position.set(0, -0.14, 0.4);
    head.add(finger);
  }

  // Eyes: glowing soul-eyes, or shut slits for the Hush
  const eyeGeo = new THREE.SphereGeometry(0.07, 6, 5);
  if (m.kind === 'hush') {
    const slitGeo = new THREE.BoxGeometry(0.16, 0.025, 0.04);
    const l = new THREE.Mesh(slitGeo, eyeMat);
    const r = new THREE.Mesh(slitGeo, eyeMat);
    l.position.set(-0.14, 0.06, 0.36);
    r.position.set(0.14, 0.06, 0.36);
    head.add(l, r);
  } else {
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.14, 0.06, 0.34);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.14, 0.06, 0.34);
    head.add(leftEye, rightEye);
  }

  // Hat (a crooked gnome hat; the Lamplighter's is a tall snuffer's cap)
  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(m.kind === 'lamplighter' ? 0.42 : 0.54, m.kind === 'lamplighter' ? 1.7 : 1.35, 9),
    hatMat,
  );
  hat.position.set(0, m.kind === 'lamplighter' ? 0.95 : 0.78, -0.04);
  hat.rotation.z = 0.14;
  hat.rotation.x = -0.08;
  hat.castShadow = true;
  head.add(hat);

  if (m.kind === 'lamplighter') {
    // A long brass snuffer pole with a cup on the end, held out to one side
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6),
      new THREE.MeshLambertMaterial({ color: 0xc9a24a, flatShading: true }),
    );
    pole.position.set(0.72, 1.45, 0.2);
    pole.rotation.z = -0.08;
    const cup = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.22, 8, 1, true),
      new THREE.MeshLambertMaterial({ color: 0xc9a24a, flatShading: true, side: THREE.DoubleSide }),
    );
    cup.position.set(0.72, 2.7, 0.2);
    root.add(pole, cup);
  }

  if (low) {
    // Four jointed legs that splay out under the cloak
    const legMat = new THREE.MeshLambertMaterial({ color: look.porcelain, flatShading: true });
    const legGeo = new THREE.CylinderGeometry(0.045, 0.03, 1.1, 5);
    for (const [x, z, rz] of [
      [-0.55, 0.45, 0.7],
      [0.55, 0.45, -0.7],
      [-0.6, -0.4, 0.8],
      [0.6, -0.4, -0.8],
    ] as const) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, 0.45, z);
      leg.rotation.z = rz;
      leg.castShadow = true;
      root.add(leg);
      legs.push(leg);
    }
  }

  // Eerie soul-glow aura
  const auraLight = new THREE.PointLight(look.aura, 1.4, 9.5, 1.8);
  auraLight.position.set(0, low ? 1.1 : 2.4, 0.35);
  root.add(auraLight);

  // Orbiting soul motes
  const motes: THREE.Mesh[] = [];
  const moteGeo = new THREE.SphereGeometry(0.055, 5, 4);
  for (let i = 0; i < 4; i++) {
    const mote = new THREE.Mesh(moteGeo, eyeMat);
    mote.position.set(Math.cos(i * 1.57) * 0.8, 1.4 + i * 0.35, Math.sin(i * 1.57) * 0.8);
    root.add(mote);
    motes.push(mote);
  }

  return {
    root,
    head,
    eyeMat,
    auraLight,
    motes,
    calmEye: look.eye,
    calmAura: look.aura,
    hoverAmp: low ? 0 : 0.12,
    legs,
  };
}

export function updateMonsterMesh(mesh: MonsterMesh, m: MonsterState, time: number): void {
  const hover = Math.sin(time * 2.6 + m.id * 2.1) * mesh.hoverAmp;
  mesh.root.position.set(m.x, hover, m.z);
  mesh.root.rotation.y = m.yaw;

  // Colour shift by alert state
  if (m.state === 'chase') {
    mesh.eyeMat.color.setHex(0xff4a38);
    mesh.auraLight.color.setHex(0xff4a38);
    mesh.auraLight.intensity = 2.2 + Math.sin(time * 16) * 0.4;
  } else if (m.state === 'investigate') {
    mesh.eyeMat.color.setHex(0xffb84d);
    mesh.auraLight.color.setHex(0xffb84d);
    mesh.auraLight.intensity = 1.6;
  } else {
    mesh.eyeMat.color.setHex(mesh.calmEye);
    mesh.auraLight.color.setHex(mesh.calmAura);
    mesh.auraLight.intensity = m.kind === 'hush' ? 0.9 : 1.25;
  }

  mesh.head.rotation.z = Math.sin(time * 1.7 + m.id) * 0.08;

  // The crawler's legs work in a slow scuttle while it moves
  const moving = m.speed > 0.3 ? 1 : 0.2;
  mesh.legs.forEach((leg, i) => {
    leg.rotation.x = Math.sin(time * 9 * moving + i * 1.6) * 0.25 * moving;
  });

  mesh.motes.forEach((mote, i) => {
    const a = time * 1.8 + i * 1.57 + m.id;
    mote.position.set(Math.cos(a) * 0.85, 1.2 + (i % 3) * 0.55 + Math.sin(a * 1.3) * 0.18, Math.sin(a) * 0.85);
  });
}
