import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { buildGnomeokemon } from '../prefabs/registry';
import type { CourseId, CreatureAction } from './types';

export interface LawnSpawn {
  speciesId: string;
  pos: [number, number, number];
  rotY: number;
  scale?: number;
}

export const COURSE_META: Record<CourseId, { label: string; subtitle: string }> = {
  lawn: { label: '🌿 World 1: Fescue Lawn', subtitle: 'Mossbottom, the Hose & the Shed' },
  desert: { label: '🌵 World 2: Desert Yard', subtitle: 'Cacti, Mesas & the Adobe House' },
};

export const DESERT_SPAWNS: readonly LawnSpawn[] = [
  { speciesId: 'cactuskin', pos: [-2.6, 0, 13.8], rotY: 0.5, scale: 1.3 },
  { speciesId: 'cactuskin', pos: [2.4, 0, 12.2], rotY: -0.6, scale: 1.15 },
  { speciesId: 'armadillan', pos: [-6.4, 0, 8.8], rotY: 1.0, scale: 1.35 },
  { speciesId: 'armadillan', pos: [-5.1, 0, 7.6], rotY: 0.4, scale: 1.1 },
  { speciesId: 'tumblewight', pos: [2.2, 0, 2.8], rotY: -0.5, scale: 1.35 },
  { speciesId: 'sunlizard', pos: [-3.8, 0, -2.6], rotY: 0.8, scale: 1.35 },
  { speciesId: 'sunlizard', pos: [-2.6, 0, -3.5], rotY: 0.2, scale: 1.15 },
  { speciesId: 'kilnpup', pos: [4.2, 0, -6.8], rotY: -0.9, scale: 1.3 },
  { speciesId: 'staghorn', pos: [6.5, 0, -12.4], rotY: -1.1, scale: 1.35 },
  { speciesId: 'paperwasp', pos: [2.8, 0.3, -15.2], rotY: -0.4, scale: 1.25 },
  { speciesId: 'unfired', pos: [-4.6, 0, -20.2], rotY: 0.7, scale: 1.35 },
  { speciesId: 'armadillan', pos: [1.9, 0, -26.5], rotY: -0.5, scale: 1.4 },
];

export function getCourseSpawns(courseId: CourseId): readonly LawnSpawn[] {
  return courseId === 'desert' ? DESERT_SPAWNS : LAWN_SPAWNS;
}

export function createCourseCurve(courseId: CourseId): THREE.CatmullRomCurve3 {
  if (courseId === 'desert') {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 18),
      new THREE.Vector3(-3.8, 0, 10),
      new THREE.Vector3(-0.8, 0, 1),
      new THREE.Vector3(4.5, 0, -7),
      new THREE.Vector3(1.2, 0, -16),
      new THREE.Vector3(-3.6, 0, -23),
      new THREE.Vector3(0, 0, -29),
    ]);
  }
  return createLawnCurve();
}

export const LAWN_SPAWNS: readonly LawnSpawn[] = [
  { speciesId: 'sproutling', pos: [-2.4, 0, 13.4], rotY: 0.6, scale: 1.25 },
  { speciesId: 'sproutling', pos: [-1.4, 0, 14.3], rotY: -0.4, scale: 1.05 },
  { speciesId: 'mossback', pos: [-7.5, 0, 10.6], rotY: 1.1, scale: 1.3 },
  { speciesId: 'staghorn', pos: [-5.6, 0, 5.0], rotY: 0.8, scale: 1.35 },
  { speciesId: 'thimblekin', pos: [1.6, 0, 3.2], rotY: -0.9, scale: 1.25 },
  { speciesId: 'dewdrop', pos: [-4.2, 0, -2.0], rotY: 0.7, scale: 1.2 },
  { speciesId: 'dewdrop', pos: [-3.1, 0, -2.9], rotY: 0.3, scale: 1.05 },
  { speciesId: 'hoseleech', pos: [3.2, 0, -3.4], rotY: -0.7, scale: 1.3 },
  { speciesId: 'strawight', pos: [8.6, 0, -9.2], rotY: -1.1, scale: 1.35 },
  { speciesId: 'paperwasp', pos: [4.2, 0.25, -11.8], rotY: -0.5, scale: 1.25 },
  { speciesId: 'kilnpup', pos: [5.4, 0, -17.6], rotY: -1.0, scale: 1.25 },
  { speciesId: 'unfired', pos: [-2.4, 0, -19.5], rotY: 0.6, scale: 1.3 },
  { speciesId: 'grubthorn', pos: [-8.4, 0, -21.8], rotY: 1.0, scale: 1.4 },
  { speciesId: 'minimower', pos: [1.8, 0, -27.2], rotY: -0.4, scale: 1.35 },
];

export function createLawnCurve(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 18),
    new THREE.Vector3(-4.5, 0, 11),
    new THREE.Vector3(-1.5, 0, 2),
    new THREE.Vector3(5.2, 0, -6),
    new THREE.Vector3(2.0, 0, -15),
    new THREE.Vector3(-5.2, 0, -22),
    new THREE.Vector3(0, 0, -29),
  ]);
}

export function buildLawnEnvironment(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0x87c7e8);
  scene.fog = new THREE.Fog(0x87c7e8, 22, 62);

  scene.add(new THREE.HemisphereLight(0xf6fff0, 0x3b592c, 1.75));
  const sun = new THREE.DirectionalLight(0xfff4d6, 2.1);
  sun.position.set(14, 24, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 70;
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 34;
  sun.shadow.camera.bottom = -34;
  scene.add(sun);

  // Main lawn grass
  const lawn = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 90),
    new THREE.MeshLambertMaterial({ color: 0x5c9442 }),
  );
  lawn.rotation.x = -Math.PI / 2;
  lawn.receiveShadow = true;
  scene.add(lawn);

  // Winding dirt trail under the dog rail
  const curve = createLawnCurve();
  const pathMat = new THREE.MeshLambertMaterial({ color: 0x8b6b47 });
  for (let i = 0; i <= 48; i++) {
    const pt = curve.getPoint(i / 48);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.03, 10), pathMat);
    pad.position.set(pt.x, 0.015, pt.z);
    pad.receiveShadow = true;
    scene.add(pad);
  }

  // White picket fence along outer borders
  const postMat = new THREE.MeshLambertMaterial({ color: 0xf0ede2, flatShading: true });
  for (let z = -34; z <= 24; z += 3.2) {
    for (const x of [-16, 16]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.2, 0.25), postMat);
      post.position.set(x, 1.6, z);
      post.castShadow = true;
      scene.add(post);
    }
  }
  for (const x of [-16, 16]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 60), postMat);
    rail.position.set(x, 2.2, -5);
    scene.add(rail);
  }

  // Pond / puddle near Dewdrops
  const pond = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.6, 0.04, 20),
    new THREE.MeshLambertMaterial({ color: 0x3b8ec4 }),
  );
  pond.position.set(-3.8, 0.02, -2.5);
  pond.receiveShadow = true;
  scene.add(pond);

  // Great Green Garden Hose crossing the middle
  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-14, 0.16, -4.5),
    new THREE.Vector3(-5, 0.16, -1.2),
    new THREE.Vector3(3.5, 0.16, -4.2),
    new THREE.Vector3(14, 0.16, -2.2),
  ]);
  const hose = new THREE.Mesh(
    new THREE.TubeGeometry(hoseCurve, 28, 0.16, 8, false),
    new THREE.MeshLambertMaterial({ color: 0x3f8f3a, flatShading: true }),
  );
  hose.castShadow = true;
  scene.add(hose);

  // Fallen log mound near Staghorn
  const log = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.48, 2.6, 10),
    new THREE.MeshLambertMaterial({ color: 0x5e3d22, flatShading: true }),
  );
  log.rotation.z = Math.PI / 2;
  log.rotation.y = 0.4;
  log.position.set(-6.8, 0.42, 4.4);
  log.castShadow = true;
  scene.add(log);

  // Cloverfield straw bale near Strawight
  const bale = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.0, 1.1),
    new THREE.MeshLambertMaterial({ color: 0xd9ba5b, flatShading: true }),
  );
  bale.position.set(10.0, 0.5, -10.2);
  bale.rotation.y = -0.3;
  bale.castShadow = true;
  scene.add(bale);

  // Rockery stones & molehill
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x7c7870, flatShading: true });
  for (const [sx, sy, sz, sr] of [
    [-3.8, 0.5, -20.5, 1.1],
    [6.6, 0.6, -18.8, 1.2],
    [-9.2, 0.35, -22.2, 1.3],
  ] as const) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(sr, 0), stoneMat);
    rock.position.set(sx, sy, sz);
    rock.castShadow = true;
    scene.add(rock);
  }

  // Grass tufts & clover dots for scale
  const tuftMat = new THREE.MeshLambertMaterial({ color: 0x457a2e, flatShading: true });
  for (let i = 0; i < 40; i++) {
    const angle = i * 2.399;
    const tx = Math.sin(angle) * 12;
    const tz = 18 - i * 1.2;
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 5), tuftMat);
    tuft.position.set(tx, 0.22, tz);
    scene.add(tuft);
  }

  // The Shed at the Verge (far end)
  const shed = new THREE.Mesh(
    new THREE.BoxGeometry(9, 6, 5),
    new THREE.MeshLambertMaterial({ color: 0x7a3428, flatShading: true }),
  );
  shed.position.set(0, 3, -36);
  shed.castShadow = true;
  scene.add(shed);

  // Lawn-gnome-themed props from @lawn/prefabs
  const placeProp = (id: string, x: number, y: number, z: number, rotY = 0, scale = 1.6): void => {
    const prop = buildPrefab(id, { lights: false });
    prop.position.set(x, y, z);
    prop.rotation.y = rotY;
    if (scale !== 1) prop.scale.setScalar(scale);
    scene.add(prop);
  };

  // Mossbottom Glade props (start)
  placeProp('signpost', 2.4, 0, 15.5, -0.5, 1.8);
  placeProp('mailbox', 2.9, 0, 14.0, -0.8, 1.7);
  placeProp('mushroom-lamp', -3.6, 0, 14.8, 0.2, 1.8);
  placeProp('mushroom-lamp', -6.8, 0, 11.4, -0.4, 1.9);
  placeProp('toadstool-seat', -8.4, 0, 9.6, 0.7, 1.7);
  placeProp('village-well', -9.2, 0, 13.0, 0.4, 2.0);
  placeProp('flower-pot', 2.4, 0, 3.8, 0.3, 1.8);
  placeProp('flower-pot', 2.9, 0, 2.6, -0.2, 1.5);

  // Trail & Thatchford props
  placeProp('tree-stump', -4.8, 0, 6.4, 0.5, 1.8);
  placeProp('campfire', -3.6, 0, 7.2, 0, 1.6);
  placeProp('wooden-chest', -5.4, 0, 7.8, 0.9, 1.6);
  placeProp('wheelbarrow', 4.6, 0, 1.2, -0.6, 1.8);
  placeProp('market-stall', 7.6, 0, -2.5, -1.2, 1.9);
  placeProp('stepping-stone', -1.8, 0, -0.5, 0.2, 1.6);
  placeProp('stepping-stone', -2.6, 0, -1.2, 0.7, 1.5);

  // Cloverfield & Hedgewood props
  placeProp('hay-bale', 9.2, 0, -7.4, 0.3, 1.8);
  placeProp('hay-bale', 10.6, 0, -8.8, -0.4, 1.7);
  placeProp('picket-fence', 11.2, 0, -11.5, -1.1, 1.9);
  placeProp('tree-stump', 3.4, 0, -11.2, 0.2, 1.7);

  // Rockery & Verge props
  placeProp('glaze-shrine', -4.2, 0, -18.2, 0.6, 1.9);
  placeProp('garden-rock', -1.4, 0, -20.8, 0.4, 1.9);
  placeProp('garden-rock', 4.2, 0, -18.5, -0.7, 1.8);
  placeProp('mushroom-lamp', 3.2, 0, -25.8, -0.5, 1.8);
}

export function buildCourseEnvironment(scene: THREE.Scene, courseId: CourseId): void {
  if (courseId === 'desert') {
    buildDesertEnvironment(scene);
  } else {
    buildLawnEnvironment(scene);
  }
}

function buildSaguaro(x: number, z: number, height: number): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0x4f8f4a, flatShading: true });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, height, 8), mat);
  trunk.position.y = height / 2;
  trunk.castShadow = true;
  g.add(trunk);

  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, height * 0.45, 7), mat);
  armL.position.set(-0.52, height * 0.62, 0);
  g.add(armL);
  const joinL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.22), mat);
  joinL.position.set(-0.26, height * 0.44, 0);
  g.add(joinL);

  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, height * 0.38, 7), mat);
  armR.position.set(0.52, height * 0.72, 0);
  g.add(armR);
  const joinR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.22), mat);
  joinR.position.set(0.26, height * 0.56, 0);
  g.add(joinR);

  g.position.set(x, 0, z);
  return g;
}

function buildDesertEnvironment(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0xf0c98d);
  scene.fog = new THREE.Fog(0xf0c98d, 24, 65);

  scene.add(new THREE.HemisphereLight(0xfff6dc, 0x8f5b34, 1.85));
  const sun = new THREE.DirectionalLight(0xffe9b8, 2.3);
  sun.position.set(16, 26, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 70;
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 34;
  sun.shadow.camera.bottom = -34;
  scene.add(sun);

  // Desert sand ground
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 100),
    new THREE.MeshLambertMaterial({ color: 0xd9b36c }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.receiveShadow = true;
  scene.add(sand);

  // Packed red-clay trail
  const curve = createCourseCurve('desert');
  const pathMat = new THREE.MeshLambertMaterial({ color: 0xb57245 });
  for (let i = 0; i <= 48; i++) {
    const pt = curve.getPoint(i / 48);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.03, 10), pathMat);
    pad.position.set(pt.x, 0.015, pt.z);
    pad.receiveShadow = true;
    scene.add(pad);
  }

  // Distant red-rock mesas
  const mesaMat = new THREE.MeshLambertMaterial({ color: 0xb85c38, flatShading: true });
  for (const [mx, mh, mz, mr] of [
    [-22, 8, -12, 6.5],
    [24, 10, -18, 7.5],
    [-20, 7, 10, 5.5],
    [22, 9, 6, 6.0],
    [-16, 11, -38, 8.0],
    [18, 9, -38, 7.0],
  ] as const) {
    const mesa = new THREE.Mesh(new THREE.CylinderGeometry(mr * 0.72, mr, mh, 7), mesaMat);
    mesa.position.set(mx, mh / 2, mz);
    scene.add(mesa);
  }

  // Saguaro & barrel cacti
  for (const [cx, cz, ch] of [
    [-10, 14, 3.6],
    [9, 10, 4.1],
    [-11, 2, 3.4],
    [10, -4, 4.4],
    [-10, -14, 3.8],
    [9, -20, 3.5],
    [-11, -27, 4.2],
  ] as const) {
    scene.add(buildSaguaro(cx, cz, ch));
  }

  const barrelMat = new THREE.MeshLambertMaterial({ color: 0x5c9648, flatShading: true });
  for (const [bx, bz] of [[-4.2, 11.5], [5.8, 4.5], [-6.8, -8.5], [4.4, -18.5]] as const) {
    const barrel = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), barrelMat);
    barrel.scale.set(1, 0.85, 1);
    barrel.position.set(bx, 0.36, bz);
    barrel.castShadow = true;
    scene.add(barrel);
  }

  // Adobe House at the far end (World 2 landmark)
  const adobe = new THREE.Mesh(
    new THREE.BoxGeometry(10, 5.5, 5.5),
    new THREE.MeshLambertMaterial({ color: 0xd99b66, flatShading: true }),
  );
  adobe.position.set(0, 2.75, -36);
  adobe.castShadow = true;
  scene.add(adobe);
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 3.0, 0.25),
    new THREE.MeshLambertMaterial({ color: 0x5e3d22, flatShading: true }),
  );
  door.position.set(0, 1.5, -33.2);
  scene.add(door);

  // Desert-fitting @lawn/prefabs props
  const placeProp = (id: string, x: number, y: number, z: number, rotY = 0, scale = 1.6): void => {
    const prop = buildPrefab(id, { lights: false });
    prop.position.set(x, y, z);
    prop.rotation.y = rotY;
    if (scale !== 1) prop.scale.setScalar(scale);
    scene.add(prop);
  };

  placeProp('signpost', 2.4, 0, 15.5, -0.5, 1.8);
  placeProp('garden-rock', -4.4, 0, 15.2, 0.4, 2.0);
  placeProp('flower-pot', 3.4, 0, 11.6, 0.2, 1.8);
  placeProp('wooden-chest', -7.2, 0, 6.2, 0.8, 1.7);
  placeProp('campfire', -4.2, 0, 5.4, 0, 1.6);
  placeProp('wheelbarrow', 4.6, 0, 0.8, -0.7, 1.8);
  placeProp('hay-bale', 7.2, 0, -5.2, 0.4, 1.7);
  placeProp('garden-rock', -5.2, 0, -4.4, -0.3, 2.1);
  placeProp('picket-fence', 8.8, 0, -11.5, -1.2, 1.9);
  placeProp('glaze-shrine', -5.6, 0, -18.8, 0.5, 1.9);
  placeProp('garden-rock', 4.4, 0, -24.2, 0.8, 2.0);
}

export function spawnLawnCreature(spawn: LawnSpawn): THREE.Group {
  const g = buildGnomeokemon(spawn.speciesId);
  g.position.set(spawn.pos[0], spawn.pos[1], spawn.pos[2]);
  g.rotation.y = spawn.rotY;
  if (spawn.scale && spawn.scale !== 1) g.scale.setScalar(spawn.scale);
  return g;
}

export function animateLawnCreature(
  group: THREE.Group,
  action: CreatureAction,
  t: number,
  baseY: number,
  baseRotY: number,
): void {
  const head = group.getObjectByName('head');
  const tail = group.getObjectByName('tail');
  const wings = group.getObjectByName('wings');
  const blade = group.getObjectByName('blade');
  const sprout = group.getObjectByName('sprout');
  const core = group.getObjectByName('core');

  if (wings) wings.rotation.x = Math.sin(t * 28) * 0.25;
  if (blade) blade.rotation.y = t * (action === 'startled' ? 24 : 10);

  if (action === 'eating') {
    group.position.y = baseY + Math.abs(Math.sin(t * 9)) * 0.08;
    if (head) head.rotation.x = 0.25 + Math.sin(t * 12) * 0.18;
    if (tail) tail.rotation.y = Math.sin(t * 10) * 0.5;
  } else if (action === 'startled') {
    group.position.y = baseY + Math.abs(Math.sin(t * 14)) * 0.18;
    group.rotation.y = baseRotY + Math.sin(t * 22) * 0.15;
    if (head) head.rotation.x = -0.2;
    if (core) core.scale.setScalar(1.35 + Math.sin(t * 16) * 0.2);
  } else if (action === 'dancing') {
    group.position.y = baseY + Math.abs(Math.sin(t * 8)) * 0.14;
    group.rotation.y = baseRotY + t * 4.5;
    if (sprout) sprout.rotation.z = Math.sin(t * 10) * 0.3;
    if (head) head.rotation.y = Math.sin(t * 8) * 0.25;
  } else {
    group.position.y = baseY + Math.sin(t * 2.1) * 0.015;
    if (head) {
      head.rotation.y = Math.sin(t * 1.4) * 0.12;
      head.rotation.x = 0;
    }
    if (tail) tail.rotation.y = Math.sin(t * 4) * 0.22;
    if (sprout) sprout.rotation.z = Math.sin(t * 2.2) * 0.1;
    if (core) core.scale.setScalar(1 + Math.sin(t * 4) * 0.1);
  }
}
