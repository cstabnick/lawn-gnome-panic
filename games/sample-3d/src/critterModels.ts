// World 2 (desert) enemies: armadillos and lizards, built from @lawn/prefabs to the same MowerModel contract as the mowers.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { MowerModel, MowerTier } from './config';

/** Prefab per tier. The combine boss is the armadillo, scaled up and recoloured in createCritterModel. */
const PREFAB: Record<MowerTier, string> = {
  reel: 'baby-gecko', green: 'armadillo', yellow: 'horned-lizard', red: 'racing-lizard', combine: 'armadillo',
};
const FLASH_MAT = new THREE.MeshBasicMaterial({ color: 0xffffff });

/**
 * World 2 enemies, built to the same MowerModel contract as the mowers: reel = baby gecko, green = armadillo,
 * yellow = horned lizard, red = racing lizard, combine = giant armadillo (boss).
 */
export function createCritterModel(tier: MowerTier): MowerModel {
  const group = new THREE.Group(); // callers scale/rotate this: the prefab and any boss scale go on `model`
  const model = tier === 'combine'
    ? buildPrefab('armadillo', { tint: 0x8a7258, trim: 0x5f4d3a })
    : buildPrefab(PREFAB[tier]);
  if (tier === 'combine') model.scale.set(2.8, 3.4, 2.8);
  group.add(model);

  const body = model.getObjectByName('body')!;
  // Legs hang from the body so they bob with it. Body sits at the origin, so positions are kept.
  const legs = model.children
    .filter((c) => c.name.startsWith('leg-'))
    .map((node) => ({ node, phase: node.name === 'leg-0' || node.name === 'leg-3' ? Math.PI : 0 }));
  for (const l of legs) body.add(l.node);
  const tail = model.getObjectByName('tail');
  if (tail) body.add(tail);

  const flash: { mesh: THREE.Mesh; mat: THREE.Material | THREE.Material[] }[] = [];
  const glows: THREE.Object3D[] = [];
  model.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    flash.push({ mesh: m, mat: m.material });
    if (m.name === 'eye-glow') {
      m.visible = false; // shown at night (see setNight)
      glows.push(m);
    }
  });

  let t = 0;
  let stride = 0;

  return {
    group,
    setNight(night01: number) {
      for (const g of glows) {
        g.visible = night01 > 0.05;
        g.scale.setScalar(night01);
      }
    },
    setFlash(on: boolean) {
      for (const f of flash) f.mesh.material = on ? FLASH_MAT : f.mat;
    },
    animate(dt: number, speed: number) {
      t += dt;
      const moving = Math.min(1, Math.abs(speed) / 2); // legs and bob settle when standing still
      stride += speed * dt * 3;
      for (const l of legs) l.node.rotation.x = Math.sin(stride + l.phase) * 0.45 * moving;
      body.position.y = Math.abs(Math.sin(stride)) * 0.025 * moving;
      if (tail) tail.rotation.y = Math.sin(t * 8) * 0.25;
    },
  };
}
