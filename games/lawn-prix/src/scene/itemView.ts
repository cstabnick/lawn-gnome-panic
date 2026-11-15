// STUB (Epic 2 fills this in): item boxes (spinning, hidden while respawning) and acorns in flight, from RaceState.
import * as THREE from 'three';
import type { RaceState } from '../config';
import { boxSpots } from '../items';
import type { Track } from '../track';

export interface ItemView {
  update(race: Readonly<RaceState>, dt: number): void;
  dispose(): void;
}

export function createItemView(scene: THREE.Scene, track: Track): ItemView {
  const group = new THREE.Group();
  scene.add(group);
  const boxes = boxSpots(track).map((p) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xffcc33 }));
    m.position.set(p.x, 0.7, p.z);
    group.add(m);
    return m;
  });
  return {
    update(race) {
      boxes.forEach((m, i) => { m.visible = race.boxes[i] <= race.t; });
    },
    dispose() { scene.remove(group); },
  };
}
