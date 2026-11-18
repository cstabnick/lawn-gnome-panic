import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { buildGnomeokemon } from '../prefabs/registry';
import type { CourseId, CreatureAction } from './types';

export type CreatureBehavior = 'patrol' | 'hop' | 'orbit' | 'swoop' | 'burrow' | 'roll';

export interface LawnSpawn {
  speciesId: string;
  pos: [number, number, number];
  rotY: number;
  scale?: number;
  behavior: CreatureBehavior;
  radius: number;
  speed: number;
  phase?: number;
}

export interface WorldHandles {
  update(t: number): void;
}

export const COURSE_META: Record<CourseId, { label: string; subtitle: string }> = {
  lawn: { label: '🌿 World 1: Fescue Lawn', subtitle: 'Mossbottom, Spinning Fountains & the Shed' },
  desert: { label: '🌵 World 2: Desert Yard', subtitle: 'Cacti, Mesas, Oasis & the Adobe House' },
  depths: { label: '🌑 World 3: Drainpipe Deeps', subtitle: 'Glowing Cisterns, Brass Valves & Clogmaw' },
  kiln: { label: '🔥 World 4: The Kiln & Shed', subtitle: 'Twilight Embers, Kiln Warden & Old Rumble' },
};

export const LAWN_SPAWNS: readonly LawnSpawn[] = [
  // Mix of near, mid-range, and far/high creatures so zoom & bait shine
  { speciesId: 'sproutling', pos: [-3.2, 0, 13.4], rotY: 0.6, scale: 1.25, behavior: 'hop', radius: 1.6, speed: 1.1, phase: 0 },
  { speciesId: 'sproutling', pos: [4.8, 0, 12.2], rotY: -0.7, scale: 1.1, behavior: 'patrol', radius: 2.2, speed: 0.9, phase: 1.4 },
  { speciesId: 'mossback', pos: [-8.4, 0, 10.2], rotY: 1.1, scale: 1.35, behavior: 'patrol', radius: 1.8, speed: 0.35, phase: 0.5 },
  { speciesId: 'staghorn', pos: [-6.8, 0, 4.8], rotY: 0.8, scale: 1.35, behavior: 'orbit', radius: 1.7, speed: 0.75, phase: 2.1 },
  { speciesId: 'thimblekin', pos: [3.2, 0, 2.8], rotY: -0.9, scale: 1.25, behavior: 'patrol', radius: 2.4, speed: 1.15, phase: 0.8 },
  { speciesId: 'dewdrop', pos: [-5.6, 0, -2.0], rotY: 0.7, scale: 1.25, behavior: 'hop', radius: 1.9, speed: 1.3, phase: 0.3 },
  { speciesId: 'dewdrop', pos: [-3.4, 0, -3.2], rotY: 0.3, scale: 1.1, behavior: 'hop', radius: 1.5, speed: 1.45, phase: 2.4 },
  { speciesId: 'hoseleech', pos: [5.4, 0, -3.6], rotY: -0.7, scale: 1.35, behavior: 'orbit', radius: 2.0, speed: 0.9, phase: 1.1 },
  { speciesId: 'strawight', pos: [9.4, 0, -9.2], rotY: -1.1, scale: 1.4, behavior: 'patrol', radius: 2.3, speed: 0.65, phase: 0.2 },
  { speciesId: 'paperwasp', pos: [3.6, 1.3, -12.0], rotY: -0.5, scale: 1.3, behavior: 'swoop', radius: 3.4, speed: 1.35, phase: 1.7 },
  { speciesId: 'kilnpup', pos: [6.8, 0, -17.6], rotY: -1.0, scale: 1.3, behavior: 'orbit', radius: 2.6, speed: 1.15, phase: 0.9 },
  { speciesId: 'unfired', pos: [-4.4, 0, -19.5], rotY: 0.6, scale: 1.35, behavior: 'patrol', radius: 1.6, speed: 0.5, phase: 2.8 },
  { speciesId: 'grubthorn', pos: [-9.2, 0, -21.8], rotY: 1.0, scale: 1.45, behavior: 'burrow', radius: 1.2, speed: 0.85, phase: 0.4 },
  { speciesId: 'minimower', pos: [2.2, 0, -27.2], rotY: -0.4, scale: 1.4, behavior: 'patrol', radius: 3.5, speed: 1.4, phase: 1.2 },
];

export const DESERT_SPAWNS: readonly LawnSpawn[] = [
  { speciesId: 'cactuskin', pos: [-3.4, 0, 13.8], rotY: 0.5, scale: 1.3, behavior: 'hop', radius: 1.5, speed: 0.8, phase: 0.2 },
  { speciesId: 'cactuskin', pos: [5.2, 0, 11.4], rotY: -0.6, scale: 1.2, behavior: 'patrol', radius: 2.0, speed: 0.7, phase: 1.5 },
  { speciesId: 'armadillan', pos: [-7.8, 0, 8.6], rotY: 1.0, scale: 1.4, behavior: 'roll', radius: 3.2, speed: 1.25, phase: 0.4 },
  { speciesId: 'armadillan', pos: [-5.2, 0, 7.2], rotY: 0.4, scale: 1.15, behavior: 'patrol', radius: 2.4, speed: 1.0, phase: 2.0 },
  { speciesId: 'tumblewight', pos: [2.4, 0, 2.2], rotY: -0.5, scale: 1.35, behavior: 'roll', radius: 4.2, speed: 1.35, phase: 0.9 },
  { speciesId: 'sunlizard', pos: [-5.4, 0, -2.6], rotY: 0.8, scale: 1.35, behavior: 'orbit', radius: 2.5, speed: 1.4, phase: 1.2 },
  { speciesId: 'sunlizard', pos: [-2.8, 0, -3.8], rotY: 0.2, scale: 1.2, behavior: 'patrol', radius: 2.2, speed: 1.5, phase: 2.7 },
  { speciesId: 'kilnpup', pos: [6.4, 0, -7.2], rotY: -0.9, scale: 1.3, behavior: 'hop', radius: 2.6, speed: 1.1, phase: 0.6 },
  { speciesId: 'staghorn', pos: [8.2, 0, -12.4], rotY: -1.1, scale: 1.35, behavior: 'orbit', radius: 2.0, speed: 0.85, phase: 1.9 },
  { speciesId: 'paperwasp', pos: [2.8, 1.4, -15.2], rotY: -0.4, scale: 1.3, behavior: 'swoop', radius: 3.8, speed: 1.4, phase: 0.1 },
  { speciesId: 'unfired', pos: [-6.6, 0, -20.2], rotY: 0.7, scale: 1.35, behavior: 'patrol', radius: 1.9, speed: 0.55, phase: 2.3 },
  { speciesId: 'armadillan', pos: [2.4, 0, -26.5], rotY: -0.5, scale: 1.45, behavior: 'roll', radius: 3.4, speed: 1.2, phase: 1.0 },
];

export const DEPTHS_SPAWNS: readonly LawnSpawn[] = [
  { speciesId: 'rustcrab', pos: [-3.2, 0, 13.6], rotY: 0.7, scale: 1.35, behavior: 'patrol', radius: 2.4, speed: 1.35, phase: 0 },
  { speciesId: 'rustcrab', pos: [4.6, 0, 11.4], rotY: -0.6, scale: 1.2, behavior: 'orbit', radius: 1.9, speed: 1.2, phase: 1.6 },
  { speciesId: 'dewdrop', pos: [-6.2, 0, 6.2], rotY: 0.9, scale: 1.25, behavior: 'hop', radius: 2.0, speed: 1.3, phase: 0.4 },
  { speciesId: 'hoseleech', pos: [3.2, 0, 1.8], rotY: -0.8, scale: 1.4, behavior: 'orbit', radius: 2.2, speed: 0.95, phase: 1.1 },
  { speciesId: 'clogmaw', pos: [-3.8, 0, -4.4], rotY: 0.4, scale: 1.5, behavior: 'hop', radius: 1.8, speed: 0.75, phase: 0.2 },
  { speciesId: 'rustcrab', pos: [6.4, 0, -9.8], rotY: -1.1, scale: 1.35, behavior: 'patrol', radius: 2.6, speed: 1.5, phase: 2.1 },
  { speciesId: 'unfired', pos: [-4.2, 0, -16.4], rotY: 0.5, scale: 1.35, behavior: 'patrol', radius: 1.6, speed: 0.55, phase: 0.7 },
  { speciesId: 'clogmaw', pos: [1.8, 0, -24.5], rotY: -0.3, scale: 1.6, behavior: 'orbit', radius: 2.2, speed: 0.8, phase: 1.9 },
];

export const KILN_SPAWNS: readonly LawnSpawn[] = [
  { speciesId: 'glowmoth', pos: [-2.8, 1.2, 13.5], rotY: 0.5, scale: 1.35, behavior: 'swoop', radius: 3.2, speed: 1.35, phase: 0.2 },
  { speciesId: 'glowmoth', pos: [3.8, 1.5, 11.8], rotY: -0.6, scale: 1.25, behavior: 'swoop', radius: 3.6, speed: 1.2, phase: 1.8 },
  { speciesId: 'kilnpup', pos: [-5.6, 0, 7.4], rotY: 0.8, scale: 1.35, behavior: 'orbit', radius: 2.4, speed: 1.25, phase: 0.5 },
  { speciesId: 'unfired', pos: [4.2, 0, 2.4], rotY: -0.9, scale: 1.35, behavior: 'patrol', radius: 1.8, speed: 0.6, phase: 1.4 },
  { speciesId: 'kilnwarden', pos: [-3.6, 0, -4.8], rotY: 0.5, scale: 1.45, behavior: 'patrol', radius: 1.6, speed: 0.55, phase: 0.1 },
  { speciesId: 'strawight', pos: [6.8, 0, -11.2], rotY: -1.0, scale: 1.4, behavior: 'patrol', radius: 2.2, speed: 0.75, phase: 2.2 },
  { speciesId: 'grubthorn', pos: [-6.4, 0, -18.5], rotY: 0.9, scale: 1.45, behavior: 'burrow', radius: 1.4, speed: 0.9, phase: 0.8 },
  { speciesId: 'minimower', pos: [1.8, 0, -26.0], rotY: -0.4, scale: 1.5, behavior: 'patrol', radius: 3.8, speed: 1.6, phase: 1.0 },
];

export function getCourseSpawns(courseId: CourseId): readonly LawnSpawn[] {
  if (courseId === 'desert') return DESERT_SPAWNS;
  if (courseId === 'depths') return DEPTHS_SPAWNS;
  if (courseId === 'kiln') return KILN_SPAWNS;
  return LAWN_SPAWNS;
}

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

export function buildCourseEnvironment(scene: THREE.Scene, courseId: CourseId): WorldHandles {
  if (courseId === 'desert') return buildDesertEnvironment(scene);
  if (courseId === 'depths') return buildDepthsEnvironment(scene);
  if (courseId === 'kiln') return buildKilnEnvironment(scene);
  return buildLawnEnvironment(scene);
}

export function buildLawnEnvironment(scene: THREE.Scene): WorldHandles {
  scene.background = new THREE.Color(0x87c7e8);
  scene.fog = new THREE.Fog(0x87c7e8, 24, 66);

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
    new THREE.PlaneGeometry(80, 100),
    new THREE.MeshLambertMaterial({ color: 0x5c9442 }),
  );
  lawn.rotation.x = -Math.PI / 2;
  lawn.receiveShadow = true;
  scene.add(lawn);

  // Rolling lawn mounds / hedges on the sides
  const hillMat = new THREE.MeshLambertMaterial({ color: 0x4b8036, flatShading: true });
  for (const [hx, hz, hr] of [[-14, 8, 4], [14, -2, 5], [-15, -16, 4.5], [15, -24, 5]] as const) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(hr, 10, 6), hillMat);
    hill.scale.set(1.3, 0.45, 1.4);
    hill.position.set(hx, 0, hz);
    scene.add(hill);
  }

  // Winding dirt trail
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

  // Birdbath Keep silhouette in the distance
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x8d887e, flatShading: true });
  const keepPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.3, 4.8, 10), stoneMat);
  keepPedestal.position.set(-14, 2.4, -12);
  scene.add(keepPedestal);
  const keepBasin = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 1.2, 0.9, 12), stoneMat);
  keepBasin.position.set(-14, 5.1, -12);
  scene.add(keepBasin);

  // Pond + animated ripple ring
  const pond = new THREE.Mesh(
    new THREE.CylinderGeometry(3.1, 3.1, 0.04, 20),
    new THREE.MeshLambertMaterial({ color: 0x3b8ec4 }),
  );
  pond.position.set(-4.2, 0.02, -2.5);
  pond.receiveShadow = true;
  scene.add(pond);

  const ripple = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 0.42, 20),
    new THREE.MeshBasicMaterial({ color: 0xbfe6ef, side: THREE.DoubleSide, transparent: true, opacity: 0.65 }),
  );
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.set(-4.2, 0.05, -2.5);
  scene.add(ripple);

  // Great Green Garden Hose
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

  // Spinning Sprinkler Fountains!
  const sprinklers: THREE.Group[] = [];
  const waterDrops: { mesh: THREE.Mesh; base: THREE.Vector3; phase: number }[] = [];
  for (const [sx, sz] of [[-7.2, 1.2], [7.8, -5.8]] as const) {
    const sp = new THREE.Group();
    sp.position.set(sx, 0, sz);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.25, 8), new THREE.MeshLambertMaterial({ color: 0xc9a23f }));
    base.position.y = 0.125;
    sp.add(base);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), new THREE.MeshLambertMaterial({ color: 0xdfe6ec }));
    arm.position.y = 0.3;
    arm.name = 'sprinkler-arm';
    sp.add(arm);
    scene.add(sp);
    sprinklers.push(sp);

    for (let i = 0; i < 6; i++) {
      const drop = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 5),
        new THREE.MeshBasicMaterial({ color: 0x99dcff }),
      );
      scene.add(drop);
      waterDrops.push({ mesh: drop, base: new THREE.Vector3(sx, 0.35, sz), phase: (i / 6) * Math.PI * 2 });
    }
  }

  // Fallen log, straw bale, Rockery stones, Shed
  const log = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.48, 2.6, 10),
    new THREE.MeshLambertMaterial({ color: 0x5e3d22, flatShading: true }),
  );
  log.rotation.z = Math.PI / 2;
  log.rotation.y = 0.4;
  log.position.set(-7.5, 0.42, 4.4);
  log.castShadow = true;
  scene.add(log);

  const bale = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.0, 1.1),
    new THREE.MeshLambertMaterial({ color: 0xd9ba5b, flatShading: true }),
  );
  bale.position.set(10.5, 0.5, -10.2);
  bale.rotation.y = -0.3;
  bale.castShadow = true;
  scene.add(bale);

  for (const [sx, sy, sz, sr] of [
    [-4.8, 0.5, -20.5, 1.1],
    [7.2, 0.6, -18.8, 1.2],
    [-9.8, 0.35, -22.2, 1.3],
  ] as const) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(sr, 0), stoneMat);
    rock.position.set(sx, sy, sz);
    rock.castShadow = true;
    scene.add(rock);
  }

  // Drifting fireflies / pollen motes
  const motes: { mesh: THREE.Mesh; base: THREE.Vector3; phase: number }[] = [];
  const moteMat = new THREE.MeshBasicMaterial({ color: 0xfff59d });
  for (let i = 0; i < 20; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), moteMat);
    const bx = ((i * 7) % 22) - 11;
    const bz = 16 - i * 2.1;
    const by = 1.1 + (i % 4) * 0.45;
    m.position.set(bx, by, bz);
    scene.add(m);
    motes.push({ mesh: m, base: new THREE.Vector3(bx, by, bz), phase: i * 0.9 });
  }

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

  placeProp('signpost', 2.4, 0, 15.5, -0.5, 1.8);
  placeProp('mailbox', 2.9, 0, 14.0, -0.8, 1.7);
  placeProp('mushroom-lamp', -3.8, 0, 14.8, 0.2, 1.8);
  placeProp('mushroom-lamp', -7.2, 0, 11.4, -0.4, 1.9);
  placeProp('toadstool-seat', -8.8, 0, 9.6, 0.7, 1.7);
  placeProp('village-well', -9.8, 0, 13.0, 0.4, 2.0);
  placeProp('flower-pot', 2.6, 0, 3.8, 0.3, 1.8);
  placeProp('flower-pot', 3.1, 0, 2.4, -0.2, 1.5);
  placeProp('tree-stump', -4.8, 0, 6.4, 0.5, 1.8);
  placeProp('campfire', -3.6, 0, 7.2, 0, 1.6);
  placeProp('wooden-chest', -5.4, 0, 7.8, 0.9, 1.6);
  placeProp('wheelbarrow', 4.8, 0, 1.2, -0.6, 1.8);
  placeProp('market-stall', 8.2, 0, -2.5, -1.2, 1.9);
  placeProp('stepping-stone', -1.8, 0, -0.5, 0.2, 1.6);
  placeProp('stepping-stone', -2.6, 0, -1.2, 0.7, 1.5);
  placeProp('hay-bale', 9.2, 0, -7.4, 0.3, 1.8);
  placeProp('hay-bale', 10.6, 0, -8.8, -0.4, 1.7);
  placeProp('picket-fence', 11.2, 0, -11.5, -1.1, 1.9);
  placeProp('tree-stump', 3.4, 0, -11.2, 0.2, 1.7);
  placeProp('glaze-shrine', -4.2, 0, -18.2, 0.6, 1.9);
  placeProp('garden-rock', -1.4, 0, -20.8, 0.4, 1.9);
  placeProp('garden-rock', 4.2, 0, -18.5, -0.7, 1.8);
  placeProp('mushroom-lamp', 3.4, 0, -25.8, -0.5, 1.8);

  return {
    update(t: number) {
      for (const sp of sprinklers) {
        const arm = sp.getObjectByName('sprinkler-arm');
        if (arm) arm.rotation.y = t * 5.0;
      }
      for (const d of waterDrops) {
        const cyc = (t * 1.4 + d.phase) % 1;
        const ang = d.phase * 3 + t * 5.0;
        d.mesh.position.set(
          d.base.x + Math.cos(ang) * cyc * 2.2,
          d.base.y + Math.sin(cyc * Math.PI) * 1.4,
          d.base.z + Math.sin(ang) * cyc * 2.2,
        );
      }
      const rScale = 1 + ((t * 0.7) % 1) * 4.5;
      ripple.scale.setScalar(rScale);
      (ripple.material as THREE.MeshBasicMaterial).opacity = 0.65 * (1 - ((t * 0.7) % 1));
      for (const m of motes) {
        m.mesh.position.y = m.base.y + Math.sin(t * 2.2 + m.phase) * 0.35;
        m.mesh.position.x = m.base.x + Math.cos(t * 1.3 + m.phase) * 0.4;
      }
    },
  };
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

function buildDesertEnvironment(scene: THREE.Scene): WorldHandles {
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

  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 100),
    new THREE.MeshLambertMaterial({ color: 0xd9b36c }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.receiveShadow = true;
  scene.add(sand);

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

  // Desert Oasis puddle
  const oasis = new THREE.Mesh(
    new THREE.CylinderGeometry(2.8, 2.8, 0.04, 18),
    new THREE.MeshLambertMaterial({ color: 0x3fa7d6 }),
  );
  oasis.position.set(-4.2, 0.02, -3.2);
  oasis.receiveShadow = true;
  scene.add(oasis);

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

  // Drifting ambient tumbleweeds
  const tumbleProps: { mesh: THREE.Mesh; z: number; speed: number; phase: number }[] = [];
  const tumbleMat = new THREE.MeshLambertMaterial({ color: 0xb8964f, wireframe: true });
  for (const [tz, sp, ph] of [[6, 0.7, 0], [-9, 0.9, 2.1], [-21, 0.6, 4.0]] as const) {
    const tw = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 1), tumbleMat);
    tw.position.set(-10, 0.45, tz);
    scene.add(tw);
    tumbleProps.push({ mesh: tw, z: tz, speed: sp, phase: ph });
  }

  // Adobe House at the far end
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

  return {
    update(t: number) {
      for (const tw of tumbleProps) {
        const x = (((t * tw.speed * 2.5 + tw.phase) % 24) - 12);
        tw.mesh.position.x = x;
        tw.mesh.position.y = 0.45 + Math.abs(Math.sin(t * 4 + tw.phase)) * 0.22;
        tw.mesh.rotation.z = -t * 3.5;
      }
    },
  };
}

function buildDepthsEnvironment(scene: THREE.Scene): WorldHandles {
  scene.background = new THREE.Color(0x16242b);
  scene.fog = new THREE.Fog(0x16242b, 16, 56);

  scene.add(new THREE.HemisphereLight(0x7be0ff, 0x1a2c2e, 1.65));
  const lamp = new THREE.DirectionalLight(0xa2f0ff, 1.6);
  lamp.position.set(8, 18, 10);
  lamp.castShadow = true;
  scene.add(lamp);

  // Dark cistern water floor + dry stone ledges
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 100),
    new THREE.MeshLambertMaterial({ color: 0x1c4a5c }),
  );
  water.rotation.x = -Math.PI / 2;
  water.receiveShadow = true;
  scene.add(water);

  // Stone walkway under the dog rail
  const curve = createCourseCurve('depths');
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x4d5866, flatShading: true });
  for (let i = 0; i <= 50; i++) {
    const pt = curve.getPoint(i / 50);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, 0.08, 10), stoneMat);
    pad.position.set(pt.x, 0.04, pt.z);
    pad.receiveShadow = true;
    scene.add(pad);
  }

  // Drainpipe arches & glowing cyan cistern crystals
  const archMat = new THREE.MeshLambertMaterial({ color: 0x35424d, flatShading: true });
  const crystalMat = new THREE.MeshBasicMaterial({ color: 0x5ce6ff });
  for (let z = 14; z >= -30; z -= 8) {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(11, 0.9, 6, 16, Math.PI), archMat);
    arch.position.set(0, 0, z);
    scene.add(arch);

    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), crystalMat);
    crystal.position.set(z % 16 === 0 ? -7.5 : 7.5, 1.8, z);
    scene.add(crystal);
  }

  // Dripping pipe droplets
  const drips: { mesh: THREE.Mesh; x: number; z: number; phase: number }[] = [];
  const dropMat = new THREE.MeshBasicMaterial({ color: 0x99efff });
  for (let i = 0; i < 12; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 5), dropMat);
    const x = ((i * 5) % 14) - 7;
    const z = 14 - i * 3.5;
    scene.add(d);
    drips.push({ mesh: d, x, z, phase: i * 0.45 });
  }

  const placeProp = (id: string, x: number, y: number, z: number, rotY = 0, scale = 1.6): void => {
    const prop = buildPrefab(id, { lights: false });
    prop.position.set(x, y, z);
    prop.rotation.y = rotY;
    if (scale !== 1) prop.scale.setScalar(scale);
    scene.add(prop);
  };
  placeProp('mushroom-lamp', -3.4, 0, 12.2, 0.4, 1.9);
  placeProp('wooden-chest', 4.8, 0, 7.5, -0.5, 1.7);
  placeProp('glaze-shrine', -5.8, 0, -2.5, 0.7, 2.0);
  placeProp('mushroom-lamp', 5.2, 0, -12.0, -0.3, 1.9);
  placeProp('garden-rock', -4.8, 0, -20.5, 0.2, 2.1);

  return {
    update(t: number) {
      for (const dr of drips) {
        const cyc = (t * 0.9 + dr.phase) % 1;
        dr.mesh.position.set(dr.x, 7.5 * (1 - cyc * cyc), dr.z);
      }
    },
  };
}

function buildKilnEnvironment(scene: THREE.Scene): WorldHandles {
  scene.background = new THREE.Color(0x1f162b);
  scene.fog = new THREE.Fog(0x1f162b, 18, 60);

  scene.add(new THREE.HemisphereLight(0xffb380, 0x2c1b29, 1.6));
  const kilnGlow = new THREE.DirectionalLight(0xff8442, 2.0);
  kilnGlow.position.set(10, 20, -14);
  kilnGlow.castShadow = true;
  scene.add(kilnGlow);

  // Scorched Verge earth & stone trail
  const earth = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 100),
    new THREE.MeshLambertMaterial({ color: 0x3b2d29 }),
  );
  earth.rotation.x = -Math.PI / 2;
  earth.receiveShadow = true;
  scene.add(earth);

  const curve = createCourseCurve('kiln');
  const pathMat = new THREE.MeshLambertMaterial({ color: 0x615d57 });
  for (let i = 0; i <= 48; i++) {
    const pt = curve.getPoint(i / 48);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.03, 10), pathMat);
    pad.position.set(pt.x, 0.015, pt.z);
    pad.receiveShadow = true;
    scene.add(pad);
  }

  // Glowing Kiln Furnace Arch & Stopping Stone obelisks
  const brickMat = new THREE.MeshLambertMaterial({ color: 0x8f4428, flatShading: true });
  const kilnArch = new THREE.Mesh(new THREE.TorusGeometry(6.5, 1.2, 6, 12, Math.PI), brickMat);
  kilnArch.position.set(0, 0, -10);
  scene.add(kilnArch);

  const emberMat = new THREE.MeshBasicMaterial({ color: 0xff6b1a });
  const embers: { mesh: THREE.Mesh; x: number; z: number; phase: number }[] = [];
  for (let i = 0; i < 24; i++) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.09, 5, 4), emberMat);
    const x = ((i * 7) % 20) - 10;
    const z = 14 - i * 1.9;
    scene.add(e);
    embers.push({ mesh: e, x, z, phase: i * 0.5 });
  }

  // Giant Mower silhouette at the far end ("Old Rumble")
  const mowerBody = new THREE.Mesh(
    new THREE.BoxGeometry(8, 3.2, 7),
    new THREE.MeshLambertMaterial({ color: 0xa62620, flatShading: true }),
  );
  mowerBody.position.set(0, 1.8, -36);
  scene.add(mowerBody);
  const heartspark = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 1.6, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff2a0 }),
  );
  heartspark.position.set(0, 4.1, -34.5);
  scene.add(heartspark);

  const placeProp = (id: string, x: number, y: number, z: number, rotY = 0, scale = 1.6): void => {
    const prop = buildPrefab(id, { lights: false });
    prop.position.set(x, y, z);
    prop.rotation.y = rotY;
    if (scale !== 1) prop.scale.setScalar(scale);
    scene.add(prop);
  };
  placeProp('campfire', -3.6, 0, 12.0, 0, 1.8);
  placeProp('campfire', 4.5, 0, 6.2, 0, 1.8);
  placeProp('glaze-shrine', -5.4, 0, -2.5, 0.5, 2.1);
  placeProp('garden-rock', 5.8, 0, -8.5, -0.4, 2.2);
  placeProp('signpost', -3.2, 0, -16.2, 0.3, 1.9);

  return {
    update(t: number) {
      for (const em of embers) {
        const cyc = (t * 0.45 + em.phase) % 1;
        em.mesh.position.set(em.x + Math.sin(t * 2 + em.phase) * 0.4, cyc * 6.5, em.z);
      }
    },
  };
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
