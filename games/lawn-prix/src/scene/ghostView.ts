// The ghost on screen: the recorded run's gnome and mower, drawn translucent, placed from the run each frame.
import * as THREE from 'three';
import { GNORMAN_LOOK, resolveLook } from '@lawn/gnome';
import type { KartState } from '../config';
import { poseAt, type GhostRun } from '../ghost';
import { createRacer, type Racer } from './racer';

export interface GhostView {
  /** Place the ghost where it was at race time t. */
  update(t: number, dt: number): void;
  dispose(): void;
}

const GHOST_OPACITY = 0.4;

/** Swaps every material under obj for a translucent copy (the originals were never drawn, so there is nothing to free). */
function fade(obj: THREE.Object3D): void {
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const ghosted = (mat: THREE.Material): THREE.Material => {
      const c = mat.clone();
      c.transparent = true;
      c.opacity = GHOST_OPACITY;
      c.depthWrite = false;
      return c;
    };
    m.material = Array.isArray(m.material) ? m.material.map(ghosted) : ghosted(m.material);
    m.castShadow = false;
  });
}

export function createGhostView(scene: THREE.Scene, run: GhostRun, template: KartState): GhostView {
  const look = (run.gnome ? resolveLook({ id: 0, character: run.gnome }) : null) ?? GNORMAN_LOOK;
  const racer: Racer = createRacer(scene, look, run.vehicle, run.color);
  fade(racer.object);
  // poseAt fills this; it starts as a copy of a real kart so every field the racer reads exists.
  const pose: KartState = { ...template };
  return {
    update(t, dt) {
      racer.update(poseAt(run, t, pose), dt);
    },
    dispose() {
      racer.dispose();
    },
  };
}
