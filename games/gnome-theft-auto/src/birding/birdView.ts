// Birding: instanced bird meshes. Per species, one InstancedMesh per body mesh and per wing mesh of its prefab,
// so a whole flock costs about three draw calls.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { Bird, BirdSpecies, Flock } from './types';

export interface BirdView {
  /** Every frame after the simulation: draws every member of every flock. */
  update(flocks: readonly Flock[]): void;
  /** Species with meshes built, and birds drawn last frame. */
  stats(): { species: number; drawn: number };
}

/** One InstancedMesh of a species. wing: -1 = body, 0 / 1 = wing-0 / wing-1. */
interface Part {
  mesh: THREE.InstancedMesh;
  local: THREE.Matrix4;
  pivot: THREE.Vector3;
  wing: -1 | 0 | 1;
}

interface SpeciesEntry {
  species: BirdSpecies;
  parts: Part[];
  count: number;
  broken: boolean;
}

// Module-level scratch: no allocation in the per-frame path.
const posV = new THREE.Vector3();
const eulerE = new THREE.Euler();
const quatQ = new THREE.Quaternion();
const scaleV = new THREE.Vector3();
const bodyM = new THREE.Matrix4();
const pivotM = new THREE.Matrix4();
const rollM = new THREE.Matrix4();
const tmpM = new THREE.Matrix4();

/** `capacity` = most birds of one species drawn at once. */
export function createBirdView(scene: THREE.Scene, capacity = 32): BirdView {
  const entries = new Map<string, SpeciesEntry>();
  let drawn = 0;

  function build(s: BirdSpecies): SpeciesEntry {
    const entry: SpeciesEntry = { species: s, parts: [], count: 0, broken: false };
    let root: THREE.Group;
    try {
      root = buildPrefab(s.prefab, { tint: s.tint, trim: s.trim, shadows: false, lights: false });
    } catch (err) {
      console.warn(`birding: cannot build ${s.id} (${s.prefab})`, err);
      entry.broken = true;
      return entry;
    }
    root.updateMatrixWorld(true);

    const add = (mesh: THREE.Mesh, wing: -1 | 0 | 1, pivot: THREE.Vector3) => {
      const inst = new THREE.InstancedMesh(mesh.geometry, mesh.material, capacity);
      inst.frustumCulled = false;
      inst.castShadow = false;
      inst.receiveShadow = false;
      inst.count = 0;
      inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      inst.name = `birds:${s.id}`;
      scene.add(inst);
      entry.parts.push({ mesh: inst, local: mesh.matrix.clone(), pivot, wing });
    };

    for (const child of root.children) {
      if (child instanceof THREE.Mesh) add(child, -1, new THREE.Vector3());
    }
    for (const k of [0, 1] as const) {
      const g = root.getObjectByName(`wing-${k}`);
      if (!g) continue;
      for (const child of g.children) {
        if (child instanceof THREE.Mesh) add(child, k, g.position.clone());
      }
    }
    return entry;
  }

  function entryFor(s: BirdSpecies): SpeciesEntry {
    let entry = entries.get(s.id);
    if (!entry) {
      entry = build(s);
      entries.set(s.id, entry);
    }
    return entry;
  }

  function drawBird(bird: Bird, entry: SpeciesEntry): void {
    const n = entry.count;
    posV.set(bird.x, bird.y, bird.z);
    eulerE.set(bird.pitch, bird.yaw, bird.bank, 'YXZ');
    quatQ.setFromEuler(eulerE);
    scaleV.setScalar(entry.species.scale);
    bodyM.compose(posV, quatQ, scaleV);

    for (const part of entry.parts) {
      if (part.wing < 0) {
        part.mesh.setMatrixAt(n, tmpM.multiplyMatrices(bodyM, part.local));
      } else {
        // Wing k: positive wingAngle raises both tips, so wing-0 (at -x) takes the negated angle.
        const angle = part.wing === 0 ? -bird.wingAngle : bird.wingAngle;
        pivotM.makeTranslation(part.pivot.x, part.pivot.y, part.pivot.z);
        rollM.makeRotationZ(angle);
        tmpM.multiplyMatrices(bodyM, pivotM).multiply(rollM).multiply(part.local);
        part.mesh.setMatrixAt(n, tmpM);
      }
    }
    entry.count++;
  }

  return {
    update(flocks) {
      for (const entry of entries.values()) entry.count = 0;
      drawn = 0;

      for (const flock of flocks) {
        for (const bird of flock.members) {
          const entry = entryFor(bird.species);
          if (entry.broken || entry.count >= capacity) continue;
          drawBird(bird, entry);
          drawn++;
        }
      }

      for (const entry of entries.values()) {
        for (const part of entry.parts) {
          part.mesh.count = entry.count;
          part.mesh.visible = entry.count > 0;
          if (entry.count > 0) part.mesh.instanceMatrix.needsUpdate = true;
        }
      }
    },
    stats() {
      let species = 0;
      for (const entry of entries.values()) if (entry.parts.length > 0) species++;
      return { species, drawn };
    },
  };
}
