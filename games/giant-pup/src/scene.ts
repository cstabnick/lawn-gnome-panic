// STUB: the yard (lights, lawn, fence, doghouse, bowls) and the player's gnome. Filled in by its own issue; keep these signatures.
import * as THREE from 'three';
import type { GnomeModel, PlayerState } from '@lawn/gnome';

export interface Yard {
  scene: THREE.Scene;
  /** The lawn mesh (raycast target for tapping the ground). */
  ground: THREE.Mesh;
  /** Show or hide the kibble in the food bowl and the water in the water bowl. */
  setBowls(food: boolean, water: boolean): void;
  /** The player's gnome, standing at GNOME_POS. */
  gnome: GnomeModel;
  gnomeState: PlayerState;
  /** Per frame: idle sway of trees/flowers, gnome model update. */
  update(t: number, dt: number): void;
}

export function createYard(): Yard {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fd3f0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x447733, 2));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x5fae4b }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const object = new THREE.Group();
  const gnome = {
    object, arms: { left: new THREE.Group(), right: new THREE.Group() }, rig: new THREE.Group(),
    update() {}, setDead() {},
  } as GnomeModel;
  const gnomeState: PlayerState = {
    position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0,
  };
  return { scene, ground, setBowls: () => {}, gnome, gnomeState, update: () => {} };
}
