import * as THREE from 'three';
import type { MonsterState } from '../sim/types';

export interface MonsterMesh {
  root: THREE.Group;
  head: THREE.Group;
  eyeMat: THREE.MeshBasicMaterial;
  auraLight: THREE.PointLight;
  motes: THREE.Mesh[];
}

export function createMonsterMesh(m: MonsterState): MonsterMesh {
  const root = new THREE.Group();
  root.position.set(m.x, 0, m.z);

  const cloakMat = new THREE.MeshLambertMaterial({ color: 0x1b1e26, flatShading: true });
  const porcelainMat = new THREE.MeshLambertMaterial({ color: 0x8f8a82, flatShading: true });
  const hatMat = new THREE.MeshLambertMaterial({ color: 0x2c1b24, flatShading: true });
  const beardMat = new THREE.MeshLambertMaterial({ color: 0x454852, flatShading: true });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x6ce5ff });

  // Towering tattered cloak (2.4m tall)
  const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.82, 2.5, 9, 1, true), cloakMat);
  cloak.position.y = 1.25;
  cloak.castShadow = true;
  root.add(cloak);

  // Inner dark void core
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.55, 2.2, 8), new THREE.MeshBasicMaterial({ color: 0x050608 }));
  core.position.y = 1.15;
  root.add(core);

  // Hunched shoulders
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.56, 8, 6), cloakMat);
  shoulders.scale.set(1.25, 0.75, 0.85);
  shoulders.position.y = 2.25;
  root.add(shoulders);

  // Head group (tracks player slightly)
  const head = new THREE.Group();
  head.position.set(0, 2.72, 0.08);
  root.add(head);

  // Hollow porcelain face
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.4, 9, 7), porcelainMat);
  face.scale.set(0.92, 1.08, 0.88);
  head.add(face);

  // Dark beard wisps
  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.9, 7), beardMat);
  beard.rotation.x = Math.PI;
  beard.position.set(0, -0.45, 0.16);
  head.add(beard);

  // Hollow eye sockets + glowing soul-eyes
  const eyeGeo = new THREE.SphereGeometry(0.07, 6, 5);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.14, 0.06, 0.34);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.14, 0.06, 0.34);
  head.add(leftEye, rightEye);

  // Giant crooked gnome hat
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.54, 1.35, 9), hatMat);
  hat.position.set(0, 0.78, -0.04);
  hat.rotation.z = 0.14;
  hat.rotation.x = -0.08;
  hat.castShadow = true;
  head.add(hat);

  // Eerie soul-glow aura
  const auraLight = new THREE.PointLight(0x5ac8fa, 1.4, 9.5, 1.8);
  auraLight.position.set(0, 2.4, 0.35);
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

  return { root, head, eyeMat, auraLight, motes };
}

export function updateMonsterMesh(mesh: MonsterMesh, m: MonsterState, time: number): void {
  const hover = Math.sin(time * 2.6 + m.id * 2.1) * 0.12;
  mesh.root.position.set(m.x, hover, m.z);
  mesh.root.rotation.y = m.yaw;

  // Color shift by alert state
  if (m.state === 'chase') {
    mesh.eyeMat.color.setHex(0xff4a38);
    mesh.auraLight.color.setHex(0xff4a38);
    mesh.auraLight.intensity = 2.2 + Math.sin(time * 16) * 0.4;
  } else if (m.state === 'investigate') {
    mesh.eyeMat.color.setHex(0xffb84d);
    mesh.auraLight.color.setHex(0xffb84d);
    mesh.auraLight.intensity = 1.6;
  } else {
    mesh.eyeMat.color.setHex(0x6ce5ff);
    mesh.auraLight.color.setHex(0x5ac8fa);
    mesh.auraLight.intensity = 1.25;
  }

  mesh.head.rotation.z = Math.sin(time * 1.7 + m.id) * 0.08;
  mesh.motes.forEach((mote, i) => {
    const a = time * 1.8 + i * 1.57 + m.id;
    mote.position.set(Math.cos(a) * 0.85, 1.2 + (i % 3) * 0.55 + Math.sin(a * 1.3) * 0.18, Math.sin(a) * 0.85);
  });
}
