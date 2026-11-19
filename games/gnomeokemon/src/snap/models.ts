import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';

/**
 * The Giant Fetch Dog's prefab (`giant-fetch-dog` in packages/prefabs) is authored at 0.7 of its game size.
 * Built at this scale it matches the size the game has always used.
 */
const GIANT_DOG_PREFAB_SCALE = 1 / 0.7;

/**
 * Giant Goofy Fetch Dog from Gnome Company: carries the player on rails through Fescue.
 * Front faces +z, stands on y = 0. Built from the `giant-fetch-dog` prefab; the head, tail and legs are its pivots.
 */
export function createGiantDog(): THREE.Group {
  const dog = new THREE.Group();
  const body = buildPrefab('giant-fetch-dog');
  body.scale.setScalar(GIANT_DOG_PREFAB_SCALE);
  dog.add(body);
  return dog;
}

export function animateGiantDog(dog: THREE.Group, t: number, moving: boolean): void {
  const tail = dog.getObjectByName('dog-tail');
  if (tail) tail.rotation.z = Math.sin(t * (moving ? 14 : 6)) * 0.45;
  const head = dog.getObjectByName('dog-head');
  if (head) head.rotation.z = Math.sin(t * 3.5) * 0.05;

  const legNames = ['leg-fl', 'leg-fr', 'leg-bl', 'leg-br'];
  legNames.forEach((name, idx) => {
    const leg = dog.getObjectByName(name);
    if (!leg) return;
    const phase = idx === 0 || idx === 3 ? 0 : Math.PI;
    leg.rotation.x = moving ? Math.sin(t * 10 + phase) * 0.42 : 0;
  });
}

/**
 * Gnome Jesus: robed, bearded, haloed clay-gnome grader for the Snap Scale.
 */
export function createGnomeJesus(): THREE.Group {
  const g = new THREE.Group();
  const robe = new THREE.MeshLambertMaterial({ color: 0xf4f4f0, flatShading: true });
  const sash = new THREE.MeshLambertMaterial({ color: 0xc8352f, flatShading: true });
  const clay = new THREE.MeshLambertMaterial({ color: 0xd9814f, flatShading: true });
  const beardMat = new THREE.MeshLambertMaterial({ color: 0xefe6d6, flatShading: true });
  const gold = new THREE.MeshBasicMaterial({ color: 0xffcc33 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.56, 10), robe);
  body.position.y = 0.28;
  g.add(body);

  const sashMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.52, 0.42), sash);
  sashMesh.position.set(0.06, 0.28, 0.02);
  sashMesh.rotation.z = 0.22;
  g.add(sashMesh);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), clay);
  head.position.y = 0.68;
  g.add(head);

  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.26, 8), beardMat);
  beard.position.set(0, 0.52, 0.12);
  beard.rotation.x = Math.PI;
  g.add(beard);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), clay);
  nose.position.set(0, 0.67, 0.17);
  g.add(nose);

  for (const ex of [-0.06, 0.06]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), new THREE.MeshBasicMaterial({ color: 0x1d1d22 }));
    eye.position.set(ex, 0.71, 0.15);
    g.add(eye);
  }

  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.34, 10), robe);
  hat.position.set(0, 0.94, 0);
  g.add(hat);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 24), gold);
  halo.position.set(0, 0.9, -0.14);
  halo.rotation.x = 0.2;
  g.add(halo);

  return g;
}
