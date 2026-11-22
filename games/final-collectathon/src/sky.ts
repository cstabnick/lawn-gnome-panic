// The sky: the Annex roof, the flight up through the clouds, and Shellshore, the beach planet.
// The sky dome, clouds, planet, sand, roof and town below are terrain/effects built here from three.js primitives;
// the beach props (palm trees, beach ball, shells, deckchair) come from @lawn/prefabs.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { flatLayer, LAYER } from '@lawn/depth';
import type { Box, Floor, FloorLayout } from './types';

export const SKY_LAYOUT: FloorLayout = {
  id: 'sky', title: 'Sky', w: 40, d: 40, floorColor: 0xe8d6a0, wallColor: 0xffffff,
  walls: [], props: [], npcs: [], spawn: { x: 0, z: 4, facing: Math.PI }, elevatorX: 0,
  areas: { beach: { x0: -17, z0: -277, x1: 17, z1: -243 } }, interactables: [],
};
/** Waypoints of the flight from the Annex roof to Shellshore's beach: fly to `to` over `seconds`. */
export const FLIGHT: readonly { to: [number, number, number]; seconds: number }[] = [
  { to: [0, 8, -6], seconds: 2.5 },
  { to: [-6, 40, -40], seconds: 5 },
  { to: [8, 90, -100], seconds: 6 },
  { to: [-4, 150, -170], seconds: 6 },
  { to: [0, 215, -240], seconds: 4.5 },
  { to: [0, 200.02, -252], seconds: 2 },
];
/** Where the gnome stands after landing on the beach. */
export const BEACH_SPAWN = { x: 0, y: 200.02, z: -252, facing: 0 };

const PLANET_R = 40;
const PLANET_C = new THREE.Vector3(0, 160, -260);
const SAND_R = 18;
const SAND_TOP = 200.02;
const BEACH_WALK_R = 17.5;
const EDGE_R = 17.8;
const EDGE_N = 48;
/** How far a cloud drifts either way along x. */
const CLOUD_DRIFT = 8;
/** Clear air between the flight line and the nearest cloud lump at full drift (covers the path's own x wander). */
const CLOUD_CLEAR = 6;

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSkyFloor(scene: THREE.Scene): Floor {
  const group = new THREE.Group();
  group.name = 'floor-sky';
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  const texs: THREE.Texture[] = [];
  const geo = <G extends THREE.BufferGeometry>(g: G): G => { geos.push(g); return g; };
  const mat = <M extends THREE.Material>(m: M): M => { mats.push(m); return m; };
  const tex = <X extends THREE.Texture>(t: X): X => { texs.push(t); return t; };
  const colliders: Box[] = [];
  const rand = mulberry(0x5e11);

  const boxMesh = (min: [number, number, number], max: [number, number, number], m: THREE.Material | THREE.Material[]): THREE.Mesh => {
    const mesh = new THREE.Mesh(geo(new THREE.BoxGeometry(max[0] - min[0], max[1] - min[1], max[2] - min[2])), m);
    mesh.position.set((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // ---------- sky ----------
  scene.background = new THREE.Color(0x9fd3f0);
  scene.fog = new THREE.Fog(0xcfe8f7, 120, 700);
  const domeGeo = geo(new THREE.SphereGeometry(900, 32, 16));
  {
    const pos = domeGeo.getAttribute('position');
    const low = new THREE.Color(0xe6f4fc), high = new THREE.Color(0x3f8fd6);
    const c = new THREE.Color();
    const cols = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const k = Math.max(0, Math.min(1, pos.getY(i) / 900));
      c.copy(low).lerp(high, Math.pow(k, 0.6));
      cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    }
    domeGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  }
  const dome = new THREE.Mesh(domeGeo, mat(new THREE.MeshBasicMaterial({
    vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false,
  })));
  dome.position.set(0, 80, -130);
  dome.renderOrder = -1;
  group.add(dome);

  // ---------- lights ----------
  const hemi = new THREE.HemisphereLight(0xffffff, 0xe8d6a0, 1.8);
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.6);
  sun.position.set(25, SAND_TOP + 40, -240);
  sun.target.position.set(0, SAND_TOP, -260);
  sun.castShadow = true;
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -24;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 120;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  group.add(hemi, sun, sun.target);

  // ---------- the Annex roof ----------
  const roofMat = mat(new THREE.MeshStandardMaterial({ color: 0xd8d0c4, roughness: 0.9 }));
  boxMesh([-7, -1, -6], [7, 0, 6], roofMat).castShadow = false;
  // The roof door hut (sunk 5 cm into the roof so no faces touch).
  const hutMat = mat(new THREE.MeshStandardMaterial({ color: 0xbfb6a8, roughness: 0.85 }));
  boxMesh([-5, -0.05, -5], [-3, 2.4, -3], hutMat);
  boxMesh([-5.1, 2.3, -5.1], [-2.9, 2.55, -2.9], roofMat);
  const doorMat = mat(new THREE.MeshStandardMaterial({ color: 0x6b5a48, roughness: 0.7 }));
  boxMesh([-4.45, -0.05, -3.1], [-3.55, 2.0, -2.95], doorMat);
  colliders.push({ min: [-5.1, 0, -5.1], max: [-2.9, 2.55, -2.9] });
  // The sign on the front edge.
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024; signCanvas.height = 192;
  {
    const g = signCanvas.getContext('2d')!;
    g.fillStyle = '#f4ecdc';
    g.fillRect(0, 0, 1024, 192);
    g.strokeStyle = '#3b2a1a';
    g.lineWidth = 10;
    g.strokeRect(8, 8, 1008, 176);
    g.fillStyle = '#3b2a1a';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = "bold 104px Georgia, 'Times New Roman', serif";
    g.fillText('BUCKETWORTH & SONS', 512, 100, 960);
  }
  const signTex = tex(new THREE.CanvasTexture(signCanvas));
  signTex.colorSpace = THREE.SRGBColorSpace;
  const signPlain = mat(new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.8 }));
  const signFace = mat(new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.8 }));
  // BoxGeometry material order: +x, -x, +y, -y, +z, -z. The lettered face looks out (+z) and back in (-z).
  boxMesh([-3, 0.6, 5.62], [3, 1.7, 5.76], [signPlain, signPlain, signPlain, signPlain, signFace, signFace]);
  const postMat = mat(new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.8 }));
  for (const sx of [-1, 1]) boxMesh([sx * 2.7 - 0.06, -0.05, 5.5], [sx * 2.7 + 0.06, 0.65, 5.6], postMat);
  colliders.push({ min: [-3, 0, 5.5], max: [3, 1.7, 5.76] });

  // ---------- Club Gnome's town square, far below ----------
  const townY = -40;
  const grassMat = mat(new THREE.MeshLambertMaterial({ color: 0x7bb35a }));
  const grass = new THREE.Mesh(geo(new THREE.CylinderGeometry(70, 70, 1, 48)), grassMat);
  grass.position.set(0, townY - 0.5, -10);
  group.add(grass);
  const townCols = [0xe07a5f, 0xf2cc8f, 0x81b29a, 0x9ab8e0, 0xd4a5c9, 0xf4f1de];
  const townMats = townCols.map((c) => mat(new THREE.MeshLambertMaterial({ color: c })));
  const roofMats = [0x8a3b2e, 0x4a5a6a, 0x6b4a2e].map((c) => mat(new THREE.MeshLambertMaterial({ color: c })));
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const r = 14 + rand() * 44;
    const x = Math.cos(a) * r, z = -10 + Math.sin(a) * r;
    const w = 4 + rand() * 5, d = 4 + rand() * 5, h = 3 + rand() * 6;
    boxMesh([x - w / 2, townY - 0.05, z - d / 2], [x + w / 2, townY + h, z + d / 2], townMats[i % townMats.length]!).castShadow = false;
    // A slightly overhanging roof slab (its bottom sits 30 cm inside the house, sides 15 cm out).
    boxMesh([x - w / 2 - 0.15, townY + h - 0.3,z - d / 2 - 0.15], [x + w / 2 + 0.15, townY + h + 0.6, z + d / 2 + 0.15], roofMats[i % roofMats.length]!).castShadow = false;
  }
  const stoneMat = mat(new THREE.MeshLambertMaterial({ color: 0xc9c2b4 }));
  const waterMat = mat(new THREE.MeshLambertMaterial({ color: 0x5ab0e8 }));
  const basin = new THREE.Mesh(geo(new THREE.CylinderGeometry(6, 6.4, 1.2, 32)), stoneMat);
  basin.position.set(0, townY + 0.55, -10);
  group.add(basin);
  const water = new THREE.Mesh(geo(new THREE.CylinderGeometry(5.4, 5.4, 1.2, 32)), waterMat);
  water.position.set(0, townY + 0.3, -10); // top 5 cm above the basin rim, bottom sunk into the ground
  group.add(water);
  const spout = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.5, 0.7, 3, 12)), stoneMat);
  spout.position.set(0, townY + 1.4, -10);
  group.add(spout);

  // ---------- clouds ----------
  const lumpGeo = geo(new THREE.SphereGeometry(1, 14, 10));
  // A soft emissive lift keeps the undersides white instead of taking the hemisphere light's sandy ground colour.
  const cloudMat = mat(new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x8a96a6 }));
  const path: THREE.Vector3[] = [new THREE.Vector3(SKY_LAYOUT.spawn.x, 0, SKY_LAYOUT.spawn.z), ...FLIGHT.map((l) => new THREE.Vector3(...l.to))];
  const pointOnPath = (k: number): THREE.Vector3 => {
    // k in 0..1 over the first four legs (the climb), by leg count.
    const legs = 4;
    const f = Math.max(0, Math.min(legs - 1e-6, k * legs));
    const i = Math.floor(f);
    return path[i]!.clone().lerp(path[i + 1]!, f - i);
  };
  const clouds: { obj: THREE.Group; baseX: number; speed: number; phase: number }[] = [];
  for (let i = 0; i < 30; i++) {
    let p = pointOnPath(rand());
    for (let tries = 0; tries < 8 && (p.y < 20 || p.y > 150); tries++) p = pointOnPath(rand());
    const y = Math.max(20, Math.min(150, p.y + (rand() - 0.5) * 16));
    const side = rand() < 0.5 ? -1 : 1;
    const z = p.z + (rand() - 0.5) * 30;
    const cloud = new THREE.Group();
    const lumps = 4 + Math.floor(rand() * 4);
    const size = 2.5 + rand() * 3;
    let halfW = 0;
    for (let j = 0; j < lumps; j++) {
      const m = new THREE.Mesh(lumpGeo, cloudMat);
      const s = size * (0.6 + rand() * 0.6);
      m.scale.set(s * 1.25, s * 0.8, s);
      m.position.set((j - (lumps - 1) / 2) * size * 0.9 + (rand() - 0.5) * size * 0.5, (rand() - 0.3) * size * 0.5, (rand() - 0.5) * size * 0.8);
      halfW = Math.max(halfW, Math.abs(m.position.x) + s * 1.25);
      cloud.add(m);
    }
    // The flight camera rides straight behind the gnome (same x), so every lump stays CLOUD_CLEAR metres to the
    // side of the flight line even at the far end of its drift: no cloud swallows the camera or hides the gnome.
    const x = p.x + side * (halfW + CLOUD_DRIFT + CLOUD_CLEAR + rand() * 24);
    cloud.position.set(x, y, z);
    group.add(cloud);
    clouds.push({ obj: cloud, baseX: x, speed: 0.4 + rand() * 0.8, phase: rand() * 100 });
  }

  // ---------- Shellshore ----------
  const seaMat = mat(new THREE.MeshStandardMaterial({ color: 0x4aa8e8, roughness: 0.35, metalness: 0.05 }));
  const planet = new THREE.Mesh(geo(new THREE.SphereGeometry(PLANET_R, 64, 48)), seaMat);
  planet.position.copy(PLANET_C);
  planet.receiveShadow = true;
  planet.name = 'shellshore';
  group.add(planet);
  // The sand: a disc whose top is at SAND_TOP. It reaches down into the sphere (the sphere's surface is ~4 m lower
  // at the disc's rim), so its sides meet the sea with no gap and no coplanar faces.
  const sandH = 6;
  const sandMat = mat(new THREE.MeshStandardMaterial({ color: 0xe8d6a0, roughness: 0.95 }));
  const sand = new THREE.Mesh(geo(new THREE.CylinderGeometry(SAND_R, SAND_R, sandH, 40)), sandMat);
  sand.position.set(PLANET_C.x, SAND_TOP - sandH / 2, PLANET_C.z);
  sand.receiveShadow = true;
  group.add(sand);

  // Beach props (prefabs: only removed, never disposed).
  const beachProps: THREE.Object3D[] = [];
  const place = (id: string, x: number, z: number, opts: { scale?: number; rot?: number; tint?: number } = {}): THREE.Object3D => {
    let obj: THREE.Object3D;
    try {
      obj = buildPrefab(id, { scale: opts.scale, tint: opts.tint });
    } catch (err) {
      console.warn(`[final-collectathon] unknown prefab "${id}"`, err);
      obj = new THREE.Group();
    }
    obj.position.set(x, SAND_TOP, z);
    obj.rotation.y = opts.rot ?? 0;
    obj.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    group.add(obj);
    beachProps.push(obj);
    return obj;
  };
  for (const [x, z, rot] of [[-11, -264, 0.4], [12, -266, 2.1], [-6, -273, 4.0], [9, -250, 5.3]] as const) {
    place('palm-tree', x, z, { scale: 2.2, rot });
    colliders.push({ min: [x - 0.35, SAND_TOP, z - 0.35], max: [x + 0.35, SAND_TOP + 8, z + 0.35] });
  }
  place('beach-ball', -4, -257);
  for (const [x, z, rot] of [[6, -262, 0.3], [-9, -255, 1.7], [3, -270, 2.9], [-13, -260, 4.4], [14, -258, 5.6]] as const) {
    place('snail-shell', x, z, { rot, scale: 1.8 });
  }
  const chair = place('chair', 4.5, -256, { rot: 0 });
  chair.updateMatrixWorld(true);
  {
    const bb = new THREE.Box3().setFromObject(chair);
    if (!bb.isEmpty()) colliders.push({ min: [bb.min.x + 0.05, bb.min.y, bb.min.z + 0.05], max: [bb.max.x - 0.05, bb.max.y, bb.max.z - 0.05] });
  }
  // The beach towel: a thin striped box lying on the sand, on the decal layer.
  const towelCanvas = document.createElement('canvas');
  towelCanvas.width = 64; towelCanvas.height = 128;
  {
    const g = towelCanvas.getContext('2d')!;
    const stripes = ['#e8505b', '#ffffff', '#f9a03f', '#ffffff'];
    for (let i = 0; i < 8; i++) { g.fillStyle = stripes[i % stripes.length]!; g.fillRect(0, i * 16, 64, 16); }
  }
  const towelTex = tex(new THREE.CanvasTexture(towelCanvas));
  towelTex.colorSpace = THREE.SRGBColorSpace;
  const towelMat = mat(flatLayer(new THREE.MeshStandardMaterial({ map: towelTex, roughness: 1 }), LAYER.decal));
  const towel = new THREE.Mesh(geo(new THREE.BoxGeometry(1.2, 0.02, 2)), towelMat);
  towel.position.set(2, SAND_TOP + 0.01, -255);
  towel.receiveShadow = true;
  group.add(towel);

  // The edge of the beach: thin boxes around the sand's rim (axis-aligned bounds of short chords).
  for (let i = 0; i < EDGE_N; i++) {
    const a0 = (i / EDGE_N) * Math.PI * 2, a1 = ((i + 1) / EDGE_N) * Math.PI * 2;
    const x0 = PLANET_C.x + Math.cos(a0) * EDGE_R, z0 = PLANET_C.z + Math.sin(a0) * EDGE_R;
    const x1 = PLANET_C.x + Math.cos(a1) * EDGE_R, z1 = PLANET_C.z + Math.sin(a1) * EDGE_R;
    const t = 0.15;
    colliders.push({
      min: [Math.min(x0, x1) - t, SAND_TOP - 1, Math.min(z0, z1) - t],
      max: [Math.max(x0, x1) + t, SAND_TOP + 2, Math.max(z0, z1) + t],
    });
  }

  scene.add(group);

  let time = 0;
  const floor: Floor = {
    id: 'sky',
    layout: SKY_LAYOUT,
    group,
    colliders,
    props: [],
    npcs: {},
    groundAt(x: number, z: number) {
      const dx = x - PLANET_C.x, dz = z - PLANET_C.z;
      if (dx * dx + dz * dz <= BEACH_WALK_R * BEACH_WALK_R) return SAND_TOP;
      if (Math.abs(x) <= 7 && Math.abs(z) <= 6) return 0;
      return -1000;
    },
    update(dt: number) {
      time += dt;
      for (const c of clouds) {
        c.obj.position.x = c.baseX + Math.sin((time + c.phase) * 0.05 * c.speed) * CLOUD_DRIFT;
        c.obj.position.y += Math.sin((time + c.phase) * 0.3) * 0.002;
      }
    },
    setElevatorOpen() {},
    setFrontDoorOpen() {},
    removeProp() {},
    dispose() {
      scene.remove(group);
      for (const p of beachProps) p.removeFromParent();
      sun.dispose();
      scene.fog = null;
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
      for (const x of texs) x.dispose();
      geos.length = 0; mats.length = 0; texs.length = 0;
    },
  };
  return floor;
}
