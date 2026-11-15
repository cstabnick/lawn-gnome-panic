// STUB (Epic 2 fills this in): draws the course's hazard vehicles (runaway mowers, THE COMBINE, golf carts) where
// hazardsAt(track, raceT) says they are.
import * as THREE from 'three';
import { hazardsAt } from '../hazards';
import type { Track } from '../track';

export interface HazardView {
  update(raceT: number, dt: number): void;
}

export function createHazardView(scene: THREE.Scene, track: Track): HazardView {
  const meshes = track.course.hazards.map((hz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(hz.radius * 1.4, 1, hz.radius * 2), new THREE.MeshStandardMaterial({ color: 0xcc3333 }));
    scene.add(m);
    return m;
  });
  return {
    update(raceT) {
      hazardsAt(track, raceT).forEach((p, i) => {
        meshes[i].position.set(p.x, 0.5, p.z);
        meshes[i].rotation.y = p.h;
      });
    },
  };
}
