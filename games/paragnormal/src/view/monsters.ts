import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
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

/** The prefab for each kind. Each is authored at half size, so the body is built at this scale. */
const MONSTER_PREFAB: Record<MonsterKind, string> = {
  gardener: 'monster-hollow-gardener',
  watcher: 'monster-porcelain-watcher',
  lamplighter: 'monster-the-lamplighter',
  crawler: 'monster-dripping-nanny',
  hush: 'monster-the-hush',
};
const MONSTER_SCALE = 2;

export function createMonsterMesh(m: MonsterState): MonsterMesh {
  const root = new THREE.Group();
  root.position.set(m.x, 0, m.z);
  const look = CALM[m.kind];

  // The body comes from @lawn/prefabs. The root stays unscaled so the aura, motes and hover are in game units.
  const body = buildPrefab(MONSTER_PREFAB[m.kind], { tint: look.cloak, trim: look.porcelain, scale: MONSTER_SCALE });
  root.add(body);

  // Eyes get their own material so the game can recolour them per state without touching shared prefab materials.
  const eyeMat = new THREE.MeshBasicMaterial({ color: look.eye });
  const legs: THREE.Mesh[] = [];
  body.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const part = String(o.userData.part ?? '');
    if (part.startsWith('eye')) o.material = eyeMat;
    if (part.startsWith('leg-')) legs.push(o);
  });
  const head = body.getObjectByName('head') as THREE.Group;

  // Eerie soul-glow aura (game effect)
  const auraLight = new THREE.PointLight(look.aura, 1.4, 9.5, 1.8);
  auraLight.position.set(0, m.kind === 'crawler' ? 1.1 : 2.4, 0.35);
  root.add(auraLight);

  // Orbiting soul motes (game effect)
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
    hoverAmp: m.kind === 'crawler' ? 0 : 0.12,
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
