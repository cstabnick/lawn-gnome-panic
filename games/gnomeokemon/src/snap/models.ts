import * as THREE from 'three';

/**
 * Giant Goofy Fetch Dog from Gnome Company: carries the player on rails through Fescue.
 * Front faces +z, stands on y = 0.
 */
export function createGiantDog(): THREE.Group {
  const g = new THREE.Group();
  const furMat = new THREE.MeshLambertMaterial({ color: 0xd97706, flatShading: true });
  const spotMat = new THREE.MeshLambertMaterial({ color: 0x78350f, flatShading: true });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x111827, flatShading: true });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 2.3), furMat);
  torso.position.y = 1.45;
  torso.castShadow = true;
  g.add(torso);

  // Saddle blanket for the gnome photographer
  const saddle = new THREE.Mesh(
    new THREE.BoxGeometry(1.36, 0.14, 1.15),
    new THREE.MeshLambertMaterial({ color: 0xb91c1c, flatShading: true }),
  );
  saddle.position.set(0, 2.02, -0.1);
  g.add(saddle);

  const headGroup = new THREE.Group();
  headGroup.name = 'dog-head';
  headGroup.position.set(0, 2.15, 1.25);
  g.add(headGroup);

  const head = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.95, 1.1), furMat);
  head.castShadow = true;
  headGroup.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.46, 0.65), furMat);
  snout.position.set(0, -0.2, 0.7);
  headGroup.add(snout);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), darkMat);
  nose.position.set(0, -0.07, 1.03);
  headGroup.add(nose);

  const tongue = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.08, 0.42),
    new THREE.MeshBasicMaterial({ color: 0xf472b6 }),
  );
  tongue.position.set(0.1, -0.43, 0.85);
  tongue.rotation.x = 0.45;
  headGroup.add(tongue);

  for (const ex of [-0.56, 0.56]) {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.45), spotMat);
    ear.position.set(ex, -0.05, -0.1);
    ear.rotation.z = ex > 0 ? -0.25 : 0.25;
    headGroup.add(ear);
  }

  for (const ex of [-0.26, 0.26]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    w.position.set(ex, 0.17, 0.56);
    headGroup.add(w);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: 0x111827 }));
    p.position.set(ex, 0.17, 0.65);
    headGroup.add(p);
  }

  const legs: [string, number, number][] = [
    ['leg-fl', -0.45, 0.85],
    ['leg-fr', 0.45, 0.85],
    ['leg-bl', -0.45, -0.85],
    ['leg-br', 0.45, -0.85],
  ];
  for (const [name, lx, lz] of legs) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.95, 0.34), furMat);
    leg.name = name;
    leg.position.set(lx, 0.48, lz);
    leg.castShadow = true;
    g.add(leg);
  }

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.8), spotMat);
  tail.name = 'dog-tail';
  tail.position.set(0, 1.85, -1.35);
  tail.rotation.x = 0.6;
  g.add(tail);

  return g;
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
