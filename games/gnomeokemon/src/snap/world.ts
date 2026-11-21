import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { buildGnomeokemon } from '../prefabs/registry';
import type { CourseId, CreatureAction } from './types';
import { wrapAngle } from './angle';
import { buildRailCurve, courseCreatures, courseFlags, groundHeight } from './levels';
import { buildCityEnvironment, buildSetPieces } from './set-pieces';

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
  lawn: { label: '🌿 Fescue Lawn', subtitle: 'Hedge Tunnels, Spinning Fountains & the Shed' },
  desert: { label: '🌵 Dry Yard', subtitle: 'Canyon Caves, Mesas & the Adobe House' },
  city: { label: '🏙️ Turfton Downtown', subtitle: 'Brick Blocks, Lamp-posts & the Hat Watch' },
  depths: { label: '🌑 Drainpipe Deeps', subtitle: 'Submerged Pipe Tunnels, Brass Valves & Clogmaw' },
  kiln: { label: '🔥 The Stopping Road', subtitle: 'Kiln Furnace Tunnel, Embers & Old Rumble' },
  ocean: { label: '🌊 Cistern Reef', subtitle: 'Underwater Kelp, Sunken Pipes & the Sea Mower' },
  night: { label: '🌌 The Glasshouse', subtitle: 'Bioluminescent Ferns, Glass Arches & Mythics' },
  frost: { label: '❄️ The Rime', subtitle: 'Snowy Hedges, Ice Tunnels & the Frost King' },
};

/** Ground colour of each course (the terrain mesh). */
const GROUND_COLOUR: Record<CourseId, number> = {
  lawn: 0x5c9442,
  desert: 0xd9b36c,
  depths: 0x1c4a5c,
  kiln: 0x3b2d29,
  ocean: 0x2a6668,
  night: 0x1e2c2b,
  frost: 0xeef6fa,
  city: 0x3a3d42,
};

/** The creatures of a course, as spawn records (their positions are on the terrain). */
export function getCourseSpawns(courseId: CourseId): readonly LawnSpawn[] {
  return courseCreatures(courseId).map((c) => ({
    speciesId: c.speciesId,
    pos: [c.x, groundHeight(courseId, c.x, c.z) + c.lift, c.z],
    rotY: c.rotY,
    scale: c.scale,
    behavior: c.behavior as CreatureBehavior,
    radius: c.radius,
    speed: c.speed,
    phase: c.phase,
  }));
}

/** The rail for a course: a curve over the terrain, from the course's level document. */
export function createCourseCurve(courseId: CourseId): THREE.CatmullRomCurve3 {
  return buildRailCurve(courseId);
}

/** The terrain height (y) at (x, z) on a course. */
export function courseGround(courseId: CourseId): (x: number, z: number) => number {
  return (x, z) => groundHeight(courseId, x, z);
}

/** One vertex per metre over the 80 by 100 play area, each raised to the course's ground height. */
/** Ground textures are painted once per course: a speckled base in the course colour (grass blades on the lawn). */
const groundTextures = new Map<CourseId, THREE.CanvasTexture>();
const GROUND_TILE_M = 6; // one texture tile covers 6 m of ground

function paintGroundTexture(courseId: CourseId, colour: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d')!;
  g.fillStyle = `#${colour.toString(16).padStart(6, '0')}`;
  g.fillRect(0, 0, size, size);
  let seed = 7919 + courseId.length * 977 + (colour % 1000);
  const rand = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const specks = courseId === 'lawn' ? 1400 : 900;
  for (let i = 0; i < specks; i++) {
    g.fillStyle = rand() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
    g.beginPath();
    g.arc(rand() * size, rand() * size, 0.6 + rand() * 1.6, 0, Math.PI * 2);
    g.fill();
  }
  if (courseId === 'lawn') {
    g.strokeStyle = 'rgba(20,60,15,0.28)';
    g.lineWidth = 1;
    for (let i = 0; i < 500; i++) {
      const x = rand() * size;
      const y = rand() * size;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (rand() - 0.5) * 2, y - 3 - rand() * 3);
      g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function groundMaterial(courseId: CourseId): THREE.MeshLambertMaterial {
  let tex = groundTextures.get(courseId);
  if (!tex) {
    tex = paintGroundTexture(courseId, courseFlags(courseId).city ? 0x3a3d42 : GROUND_COLOUR[courseId]);
    groundTextures.set(courseId, tex);
  }
  return new THREE.MeshLambertMaterial({ color: 0xffffff, map: tex });
}

function buildGroundMesh(courseId: CourseId): THREE.Mesh {
  const cols = 80;
  const rows = 100;
  const positions = new Float32Array((cols + 1) * (rows + 1) * 3);
  let p = 0;
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const x = -cols / 2 + i;
      const z = -rows / 2 + j;
      positions[p++] = x;
      positions[p++] = groundHeight(courseId, x, z);
      positions[p++] = z;
    }
  }
  const index: number[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i;
      const b = a + 1;
      const c = a + (cols + 1);
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(index);
  // Texture coordinates: the ground tiles every GROUND_TILE_M metres.
  const uv = new Float32Array((positions.length / 3) * 2);
  for (let k = 0; k < positions.length / 3; k++) {
    uv[2 * k] = positions[3 * k] / GROUND_TILE_M;
    uv[2 * k + 1] = positions[3 * k + 2] / GROUND_TILE_M;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, groundMaterial(courseId));
  mesh.name = 'ground';
  mesh.receiveShadow = true;
  return mesh;
}

export function buildCourseEnvironment(scene: THREE.Scene, courseId: CourseId): WorldHandles {
  const ground = courseGround(courseId);
  const flags = courseFlags(courseId);
  const before = new Set<THREE.Object3D>(scene.children);
  scene.add(buildGroundMesh(courseId));
  const handles = flags.city ? buildCityEnvironment(scene) : buildCourseDecor(scene, courseId);
  // The builders place their pieces as if the ground were flat (y is the height above it). Lift each one to the
  // terrain under it. Lights and the ground itself are not moved; the hose is one mesh at the origin.
  for (const child of scene.children) {
    if (before.has(child) || child instanceof THREE.Light || child.name === 'ground' || child.name === 'hose') continue;
    child.position.y += ground(child.position.x, child.position.z);
  }
  // Set pieces (water, lava, islands, platforms, walls, props, cave roof, street) know their own heights.
  const pieces = buildSetPieces(scene, courseId, ground);
  return {
    update(t: number) {
      handles.update(t);
      pieces.update(t);
    },
  };
}

function buildCourseDecor(scene: THREE.Scene, courseId: CourseId): WorldHandles {
  if (courseId === 'desert') return buildDesertEnvironment(scene);
  if (courseId === 'depths') return buildDepthsEnvironment(scene);
  if (courseId === 'kiln') return buildKilnEnvironment(scene);
  if (courseId === 'ocean') return buildOceanEnvironment(scene);
  if (courseId === 'night') return buildNightEnvironment(scene);
  if (courseId === 'frost') return buildFrostEnvironment(scene);
  return buildLawnEnvironment(scene);
}

/**
 * Builds an open-ended tunnel of arches along a section of the dog rail,
 * blocking long sightlines so new areas feel hidden until you ride through!
 */
function buildTunnelAlongCurve(
  scene: THREE.Scene,
  curve: THREE.CatmullRomCurve3,
  tStart: number,
  tEnd: number,
  radius: number,
  color: number,
  count = 10,
): void {
  const mat = new THREE.MeshLambertMaterial({ color, flatShading: true });
  const pt = new THREE.Vector3();
  const tan = new THREE.Vector3();
  for (let i = 0; i <= count; i++) {
    const u = tStart + (tEnd - tStart) * (i / count);
    curve.getPointAt(u, pt);
    curve.getTangentAt(u, tan);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.72, 6, 12, Math.PI), mat);
    arch.position.set(pt.x, 0, pt.z);
    arch.rotation.y = Math.atan2(tan.x, tan.z);
    scene.add(arch);
  }
}

export function buildLawnEnvironment(scene: THREE.Scene): WorldHandles {
  scene.background = new THREE.Color(0x87c7e8);
  scene.fog = new THREE.Fog(0x87c7e8, 18, 60);

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

  // Rolling lawn mounds / hedges on the sides
  const hillMat = new THREE.MeshLambertMaterial({ color: 0x4b8036, flatShading: true });
  for (const [hx, hz, hr] of [[-14, 8, 4], [14, -2, 5], [-15, -16, 4.5], [15, -24, 5]] as const) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(hr, 10, 6), hillMat);
    hill.scale.set(1.3, 0.45, 1.4);
    hill.position.set(hx, 0, hz);
    scene.add(hill);
  }

  // Winding dirt trail + Hedge Tunnel & Hollow Log Tunnel so you can't see the whole world from start
  const curve = createCourseCurve('lawn');
  buildTunnelAlongCurve(scene, curve, 0.04, 0.14, 3.8, 0x2f6e2a, 7);
  buildTunnelAlongCurve(scene, curve, 0.56, 0.68, 3.8, 0x5e3d22, 8);
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
  const keepBirdbath = buildPrefab('birdbath', { lights: false });
  keepBirdbath.position.set(-14, 0, -12);
  keepBirdbath.scale.setScalar(7.4);
  scene.add(keepBirdbath);

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
  hose.name = 'hose';
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
      waterDrops.push({ mesh: drop, base: new THREE.Vector3(sx, 0.35 + groundHeight('lawn', sx, sz), sz), phase: (i / 6) * Math.PI * 2 });
    }
  }

  // Fallen log, straw bale, Rockery stones, Shed
  const log = buildPrefab('timber-log', { lights: false });
  log.position.set(-7.5, 0, 4.4);
  log.rotation.y = 0.4;
  log.scale.setScalar(9);
  scene.add(log);

  const bale = buildPrefab('hay-bale', { lights: false });
  bale.position.set(10.5, 0, -10.2);
  bale.rotation.y = -0.3;
  bale.scale.setScalar(3);
  scene.add(bale);

  for (const [sx, sz, sr] of [
    [-4.8, -20.5, 1.1],
    [7.2, -18.8, 1.2],
    [-9.8, -22.2, 1.3],
  ] as const) {
    const rock = buildPrefab('garden-rock', { lights: false });
    rock.position.set(sx, 0, sz);
    rock.scale.setScalar(sr * 3);
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
    motes.push({ mesh: m, base: new THREE.Vector3(bx, by + groundHeight('lawn', bx, bz), bz), phase: i * 0.9 });
  }

  const shed = buildPrefab('garden-shed', { lights: false });
  shed.position.set(0, 0, -36);
  shed.scale.setScalar(4.5);
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
  scene.fog = new THREE.Fog(0xf0c98d, 10, 32);

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

  for (const [bx, bz] of [[-4.2, 11.5], [5.8, 4.5], [-6.8, -8.5], [4.4, -18.5]] as const) {
    const barrel = buildPrefab('barrel', { lights: false });
    barrel.position.set(bx, 0, bz);
    barrel.scale.setScalar(1.5);
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
  scene.fog = new THREE.Fog(0x16242b, 9, 28);

  scene.add(new THREE.HemisphereLight(0x7be0ff, 0x1a2c2e, 1.65));
  const lamp = new THREE.DirectionalLight(0xa2f0ff, 1.6);
  lamp.position.set(8, 18, 10);
  lamp.castShadow = true;
  scene.add(lamp);

  // Dark cistern water floor + dry stone ledges

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
  scene.fog = new THREE.Fog(0x1f162b, 10, 30);

  scene.add(new THREE.HemisphereLight(0xffb380, 0x2c1b29, 1.6));
  const kilnGlow = new THREE.DirectionalLight(0xff8442, 2.0);
  kilnGlow.position.set(10, 20, -14);
  kilnGlow.castShadow = true;
  scene.add(kilnGlow);

  // Scorched Verge earth & stone trail

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

function buildOceanEnvironment(scene: THREE.Scene): WorldHandles {
  scene.background = new THREE.Color(0x0b3847);
  scene.fog = new THREE.Fog(0x0b3847, 8, 28);

  scene.add(new THREE.HemisphereLight(0x7be8ff, 0x0a2933, 1.75));
  const caustics = new THREE.DirectionalLight(0x88f4ff, 1.8);
  caustics.position.set(8, 24, 10);
  caustics.castShadow = true;
  scene.add(caustics);

  // Sandy sea-basin floor

  const curve = createCourseCurve('ocean');
  const pathMat = new THREE.MeshLambertMaterial({ color: 0x4b8783 });
  for (let i = 0; i <= 48; i++) {
    const pt = curve.getPoint(i / 48);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.03, 10), pathMat);
    pad.position.set(pt.x, 0.015, pt.z);
    pad.receiveShadow = true;
    scene.add(pad);
  }

  // Swaying underwater kelp stalks
  const kelpMat = new THREE.MeshLambertMaterial({ color: 0x2fd07a, flatShading: true });
  const kelps: { mesh: THREE.Mesh; phase: number }[] = [];
  for (let i = 0; i < 24; i++) {
    const h = 3.2 + (i % 4) * 0.9;
    const k = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, h, 6), kelpMat);
    const side = i % 2 === 0 ? -1 : 1;
    k.position.set(side * (6.5 + (i % 5) * 1.4), h / 2, 16 - i * 2.0);
    scene.add(k);
    kelps.push({ mesh: k, phase: i * 0.7 });
  }

  // Rising silver air bubbles
  const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xbfe6ef, transparent: true, opacity: 0.7 });
  const bubbles: { mesh: THREE.Mesh; x: number; z: number; phase: number }[] = [];
  for (let i = 0; i < 24; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.11 + (i % 3) * 0.04, 6, 5), bubbleMat);
    const x = ((i * 7) % 18) - 9;
    const z = 16 - i * 1.9;
    scene.add(b);
    bubbles.push({ mesh: b, x, z, phase: i * 0.4 });
  }

  // Sunken Birdbath ruins at the end
  const sunkenKeep = buildPrefab('birdbath', { lights: false });
  sunkenKeep.position.set(0, 0, -36);
  sunkenKeep.scale.setScalar(6.5);
  scene.add(sunkenKeep);

  const placeProp = (id: string, x: number, y: number, z: number, rotY = 0, scale = 1.6): void => {
    const prop = buildPrefab(id, { lights: false });
    prop.position.set(x, y, z);
    prop.rotation.y = rotY;
    if (scale !== 1) prop.scale.setScalar(scale);
    scene.add(prop);
  };
  placeProp('wooden-chest', -4.8, 0, 10.5, 0.5, 1.8);
  placeProp('glaze-shrine', 4.8, 0, 4.5, -0.5, 2.0);
  placeProp('garden-rock', -5.6, 0, -8.5, 0.3, 2.1);
  placeProp('mushroom-lamp', 4.6, 0, -18.5, -0.4, 1.9);

  return {
    update(t: number) {
      for (const kp of kelps) {
        kp.mesh.rotation.z = Math.sin(t * 1.4 + kp.phase) * 0.14;
      }
      for (const bb of bubbles) {
        const cyc = (t * 0.4 + bb.phase) % 1;
        bb.mesh.position.set(bb.x + Math.sin(t * 2.5 + bb.phase) * 0.25, cyc * 8.0, bb.z);
      }
    },
  };
}

function buildNightEnvironment(scene: THREE.Scene): WorldHandles {
  scene.background = new THREE.Color(0x090d1f);
  scene.fog = new THREE.Fog(0x090d1f, 9, 30);

  scene.add(new THREE.HemisphereLight(0x8ba8ff, 0x161b33, 1.55));
  const moon = new THREE.DirectionalLight(0xc7d8ff, 1.7);
  moon.position.set(-10, 22, 10);
  moon.castShadow = true;
  scene.add(moon);

  // Midnight greenhouse flagstones

  const curve = createCourseCurve('night');
  const pathMat = new THREE.MeshLambertMaterial({ color: 0x3d4b59 });
  for (let i = 0; i <= 48; i++) {
    const pt = curve.getPoint(i / 48);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.03, 10), pathMat);
    pad.position.set(pt.x, 0.015, pt.z);
    pad.receiveShadow = true;
    scene.add(pad);
  }

  // Bioluminescent spores floating in the night air
  const sporeMat = new THREE.MeshBasicMaterial({ color: 0x80ffdb });
  const spores: { mesh: THREE.Mesh; base: THREE.Vector3; phase: number }[] = [];
  for (let i = 0; i < 28; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), sporeMat);
    const bx = ((i * 7) % 20) - 10;
    const bz = 16 - i * 1.75;
    const by = 0.8 + (i % 5) * 0.55;
    s.position.set(bx, by, bz);
    scene.add(s);
    spores.push({ mesh: s, base: new THREE.Vector3(bx, by + groundHeight('night', bx, bz), bz), phase: i * 0.7 });
  }

  // Moonlit Glaze Shrine at the end
  const placeProp = (id: string, x: number, y: number, z: number, rotY = 0, scale = 1.6): void => {
    const prop = buildPrefab(id, { lights: false });
    prop.position.set(x, y, z);
    prop.rotation.y = rotY;
    if (scale !== 1) prop.scale.setScalar(scale);
    scene.add(prop);
  };
  placeProp('mushroom-lamp', -3.6, 0, 14.0, 0.4, 2.0);
  placeProp('flower-pot', 3.8, 0, 9.2, -0.3, 1.8);
  placeProp('mushroom-lamp', -5.2, 0, -2.5, 0.2, 2.1);
  placeProp('glaze-shrine', 0, 0, -32.5, 0, 2.4);

  return {
    update(t: number) {
      for (const sp of spores) {
        sp.mesh.position.y = sp.base.y + Math.sin(t * 1.8 + sp.phase) * 0.4;
        sp.mesh.position.x = sp.base.x + Math.cos(t * 1.1 + sp.phase) * 0.35;
      }
    },
  };
}

function buildFrostEnvironment(scene: THREE.Scene): WorldHandles {
  scene.background = new THREE.Color(0xc5e1f0);
  scene.fog = new THREE.Fog(0xc5e1f0, 9, 30);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x5c7c94, 1.9));
  const winterSun = new THREE.DirectionalLight(0xfff8eb, 1.9);
  winterSun.position.set(12, 22, 10);
  winterSun.castShadow = true;
  scene.add(winterSun);


  const curve = createCourseCurve('frost');
  const pathMat = new THREE.MeshLambertMaterial({ color: 0x9ab3c4 });
  for (let i = 0; i <= 48; i++) {
    const pt = curve.getPoint(i / 48);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.03, 10), pathMat);
    pad.position.set(pt.x, 0.015, pt.z);
    pad.receiveShadow = true;
    scene.add(pad);
  }

  // Drifting snowflakes
  const flakeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const flakes: { mesh: THREE.Mesh; x: number; z: number; phase: number }[] = [];
  for (let i = 0; i < 32; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 4), flakeMat);
    const x = ((i * 7) % 22) - 11;
    const z = 16 - i * 1.6;
    scene.add(f);
    flakes.push({ mesh: f, x, z, phase: i * 0.45 });
  }

  // Frozen Birdbath Keep at the end
  const keepBirdbath = buildPrefab('birdbath', { lights: false });
  keepBirdbath.position.set(0, 0, -36);
  keepBirdbath.scale.setScalar(7.3);
  scene.add(keepBirdbath);

  const placeProp = (id: string, x: number, y: number, z: number, rotY = 0, scale = 1.6): void => {
    const prop = buildPrefab(id, { lights: false });
    prop.position.set(x, y, z);
    prop.rotation.y = rotY;
    if (scale !== 1) prop.scale.setScalar(scale);
    scene.add(prop);
  };
  placeProp('signpost', 2.4, 0, 15.0, -0.5, 1.8);
  placeProp('campfire', -4.0, 0, 9.5, 0, 1.8);
  placeProp('wooden-chest', 4.6, 0, 4.0, -0.6, 1.7);
  placeProp('glaze-shrine', -5.2, 0, -12.5, 0.5, 2.0);
  placeProp('mushroom-lamp', 4.4, 0, -19.5, -0.4, 1.9);

  return {
    update(t: number) {
      for (const fl of flakes) {
        const cyc = (t * 0.35 + fl.phase) % 1;
        fl.mesh.position.set(fl.x + Math.sin(t * 1.6 + fl.phase) * 0.5, 7.5 * (1 - cyc), fl.z);
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
  lookYaw = 0,
): void {
  const head = group.getObjectByName('head');
  const tail = group.getObjectByName('tail');
  const wings = group.getObjectByName('wings');
  const blade = group.getObjectByName('blade');
  const prop = group.getObjectByName('prop');
  const sprout = group.getObjectByName('sprout');
  const core = group.getObjectByName('core');

  if (wings) wings.rotation.x = Math.sin(t * 28) * 0.25;
  if (blade) blade.rotation.y = t * (action === 'startled' ? 24 : 10);
  if (prop) prop.rotation.z = t * (action === 'startled' ? 22 : 12);

  // Hide squashes the body in y; remember the species' own y scale once so
  // every other action can undo the squash.
  if (group.userData.baseScaleY === undefined) group.userData.baseScaleY = group.scale.y;
  if (action !== 'hide') group.scale.y = group.userData.baseScaleY as number;

  if (action === 'run') {
    group.position.y = baseY + Math.abs(Math.sin(t * 16)) * 0.12;
    if (tail) tail.rotation.y = Math.sin(t * 18) * 0.7;
    if (head) head.rotation.x = 0.15;
  } else if (action === 'hide') {
    group.position.y = baseY - 0.35;
    group.scale.y = (group.userData.baseScaleY as number) * 0.7;
    if (head) {
      head.rotation.x = 0;
      head.rotation.y = 0;
    }
  } else if (action === 'graze') {
    group.position.y = baseY;
    if (head) head.rotation.x = 0.6 + Math.sin(t * 3) * 0.12;
    if (tail) tail.rotation.y = 0;
  } else if (action === 'look') {
    group.position.y = baseY;
    if (head) {
      head.rotation.x = 0;
      head.rotation.y = wrapAngle(lookYaw - baseRotY);
    }
  } else if (action === 'eating') {
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
