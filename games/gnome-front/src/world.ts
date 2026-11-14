// src/world.ts: ground, sky, lights, fences and cover.
import * as THREE from 'three';
import { ARENA_HALF, BASES, FLAGS, GRASS_COLOR, TEAM_COLORS, VEHICLE_SLOTS } from './config';
import type { Obstacle } from './config';
import { heightAt } from './terrain';

/** Builds the static battlefield into the scene and returns every piece of cover for collision and bullets. */
export function buildWorld(scene: THREE.Scene): Obstacle[] {
  buildLights(scene);
  buildGround(scene);
  buildFence(scene);

  const root = new THREE.Group();
  scene.add(root);

  const obstacles: Obstacle[] = [];
  buildLandmarks(root, obstacles);
  buildHQs(root, obstacles);
  buildCover(root, obstacles);
  return obstacles;
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cheap hash of two integers to [0, 1). */
function hash2(i: number, j: number): number {
  const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

function material(color: number, roughness = 0.85): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

/** A flat disc lying on the ground plane (used for water and ring-like decor). */
function disc(r: number, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 20), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  return m;
}

function flagXZ(id: string): { x: number; z: number } {
  const f = FLAGS.find((d) => d.id === id);
  if (!f) throw new Error(`world: no flag ${id}`);
  return { x: f.x, z: f.z };
}

// ---------------------------------------------------------------------
// Sky, ground, fence
// ---------------------------------------------------------------------

function buildLights(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight(0xdff3ff, 0x3d6b2a, 1.1));

  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(60, 120, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const cam = sun.shadow.camera;
  cam.left = -170;
  cam.right = 170;
  cam.top = 170;
  cam.bottom = -170;
  cam.near = 1;
  cam.far = 400;
  cam.updateProjectionMatrix();
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);
}

function buildGround(scene: THREE.Scene): void {
  const size = 2 * ARENA_HALF + 80;
  const geo = new THREE.PlaneGeometry(size, size, 220, 220);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const base = new THREE.Color(GRASS_COLOR);
  const tint = new THREE.Color();
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, heightAt(x, z));
    const shade = 1 + (hash2(Math.round(x * 3), Math.round(z * 3)) * 2 - 1) * 0.08;
    const stripe = ((Math.floor(x / 6) % 2) + 2) % 2 === 0 ? 1.06 : 1;
    tint.copy(base).multiplyScalar(shade * stripe);
    colors[i * 3] = tint.r;
    colors[i * 3 + 1] = tint.g;
    colors[i * 3 + 2] = tint.b;
  }
  pos.needsUpdate = true;
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  ground.receiveShadow = true;
  scene.add(ground);
}

function buildFence(scene: THREE.Scene): void {
  const H = ARENA_HALF;
  const postGeo = new THREE.BoxGeometry(0.25, 2.2, 0.25);
  const railGeo = new THREE.BoxGeometry(3.05, 0.14, 0.08);
  const fenceMat = material(0xf2efe6, 0.7);

  // Posts every 3 units along all four edges (corners once).
  const posts: { x: number; z: number }[] = [];
  for (let i = 0; i <= 100; i++) {
    const t = -H + 3 * i;
    posts.push({ x: t, z: H }, { x: t, z: -H });
  }
  for (let i = 1; i <= 99; i++) {
    const t = -H + 3 * i;
    posts.push({ x: H, z: t }, { x: -H, z: t });
  }

  // Two rails per span between posts.
  const rails: { x: number; z: number; rotY: number; dy: number }[] = [];
  for (let i = 0; i < 100; i++) {
    const mid = -H + 1.5 + 3 * i;
    for (const dy of [0.7, 1.5]) {
      rails.push({ x: mid, z: H, rotY: 0, dy }, { x: mid, z: -H, rotY: 0, dy });
      rails.push({ x: H, z: mid, rotY: Math.PI / 2, dy }, { x: -H, z: mid, rotY: Math.PI / 2, dy });
    }
  }

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0);

  const postMesh = new THREE.InstancedMesh(postGeo, fenceMat, posts.length);
  postMesh.castShadow = true;
  posts.forEach((s, k) => {
    m.makeTranslation(s.x, heightAt(s.x, s.z) + 1.1, s.z);
    postMesh.setMatrixAt(k, m);
  });
  scene.add(postMesh);

  const railMesh = new THREE.InstancedMesh(railGeo, fenceMat, rails.length);
  railMesh.castShadow = true;
  rails.forEach((r, k) => {
    p.set(r.x, heightAt(r.x, r.z) + r.dy, r.z);
    q.setFromAxisAngle(up, r.rotY);
    m.compose(p, q, one);
    railMesh.setMatrixAt(k, m);
  });
  scene.add(railMesh);
}

// ---------------------------------------------------------------------
// Landmarks at the five flags
// ---------------------------------------------------------------------

function buildLandmarks(root: THREE.Group, out: Obstacle[]): void {
  const stone = material(0xbdbdbd);
  const water = material(0x5ec8f2, 0.2);
  const soil = material(0x5a3b22, 1);
  const cabbage = material(0x7fc24a, 0.8);

  // A: Birdbath at the flag centre.
  {
    const { x, z } = flagXZ('A');
    const g = heightAt(x, z);
    root.add(mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.0, 10), stone, x, g + 0.5, z));
    root.add(mesh(new THREE.CylinderGeometry(1.0, 0.6, 0.35, 16), stone, x, g + 1.2, z));
    root.add(disc(0.9, water, x, g + 1.38, z));
    out.push({ x, z, r: 1.2, h: 1.6 });
  }

  // B: Veggie Patch. Four beds about 6 units out, each with three obstacles.
  {
    const { x, z } = flagXZ('B');
    const beds: { dx: number; dz: number; alongZ: boolean }[] = [
      { dx: 6, dz: 0, alongZ: true },
      { dx: -6, dz: 0, alongZ: true },
      { dx: 0, dz: 6, alongZ: false },
      { dx: 0, dz: -6, alongZ: false },
    ];
    for (const bed of beds) {
      const cx = x + bed.dx;
      const cz = z + bed.dz;
      const g = heightAt(cx, cz);
      const geo = bed.alongZ
        ? new THREE.BoxGeometry(1.5, 0.8, 8)
        : new THREE.BoxGeometry(8, 0.8, 1.5);
      root.add(mesh(geo, soil, cx, g + 0.4, cz));
      for (const t of [-2.8, 0, 2.8]) {
        const px = bed.alongZ ? cx : cx + t;
        const pz = bed.alongZ ? cz + t : cz;
        const pg = heightAt(px, pz);
        root.add(mesh(new THREE.SphereGeometry(0.45, 8, 6), cabbage, px, pg + 0.95, pz));
        out.push({ x: px, z: pz, r: 1.0, h: 0.8 });
      }
    }
  }

  // C: Fountain at the flag centre.
  {
    const { x, z } = flagXZ('C');
    const g = heightAt(x, z);
    root.add(mesh(new THREE.CylinderGeometry(2.5, 2.2, 1.2, 24), stone, x, g + 0.6, z));
    root.add(disc(2.3, water, x, g + 1.21, z));
    root.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8), stone, x, g + 1.9, z));
    root.add(mesh(new THREE.SphereGeometry(0.25, 10, 8), water, x, g + 2.7, z));
    out.push({ x, z, r: 2.5, h: 1.2 });
  }

  // D: Shed, 11 units west of the flag.
  {
    const f = flagXZ('D');
    const sx = f.x - 11;
    const sz = f.z;
    const g = heightAt(sx, sz);
    const wood = material(0x8b5a2b);
    const roof = material(0x6b3f1f);
    const door = material(0x4a3018);
    root.add(mesh(new THREE.BoxGeometry(8, 3.2, 6), wood, sx, g + 1.6, sz));
    for (const side of [1, -1]) {
      const panel = mesh(new THREE.BoxGeometry(8.4, 0.25, 3.6), roof, sx, g + 3.9, sz + side * 1.8);
      panel.rotation.x = side * 0.45;
      root.add(panel);
    }
    root.add(mesh(new THREE.BoxGeometry(1.4, 2.2, 0.1), door, sx, g + 1.1, sz + 3.05));
    for (const ox of [-2.5, 2.5]) {
      for (const oz of [-1.5, 1.5]) {
        out.push({ x: sx + ox, z: sz + oz, r: 2.0, h: 4 });
      }
    }
  }

  // E: Compost Heap, 12 units east of the flag.
  {
    const f = flagXZ('E');
    const ex = f.x + 12;
    const ez = f.z;
    const g = heightAt(ex, ez);
    const dirt = material(0x6b4a2a, 1);
    const mound = mesh(new THREE.SphereGeometry(3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), dirt, ex, g, ez);
    mound.scale.set(1, 0.67, 1);
    root.add(mound);
    out.push({ x: ex, z: ez, r: 3, h: 2 });
  }
}

// ---------------------------------------------------------------------
// Team headquarters
// ---------------------------------------------------------------------

function buildHQs(root: THREE.Group, out: Obstacle[]): void {
  const wood = material(0x8b5a2b);
  const door = material(0x222222, 1);
  for (const team of [0, 1] as const) {
    const base = BASES[team];
    const outward = Math.sign(base.z); // away from the map centre
    const tz = base.z + outward * 14;
    const g = heightAt(0, tz);

    const cone = new THREE.ConeGeometry(4.5, 5, 4);
    cone.rotateY(Math.PI / 4);
    root.add(mesh(cone, material(TEAM_COLORS[team], 0.9), 0, g + 2.5, tz));
    root.add(mesh(new THREE.BoxGeometry(1.2, 2, 0.1), door, 0, g + 1, tz - outward * 3.1));
    out.push({ x: 0, z: tz, r: 4, h: 5 });

    const cloth = material(TEAM_COLORS[team], 0.9);
    cloth.side = THREE.DoubleSide;
    for (const px of [-6, 6]) {
      root.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 6.5, 6), wood, px, g + 3.25, tz));
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), cloth);
      flag.position.set(px + Math.sign(px) * 0.8, g + 5.6, tz);
      root.add(flag);
    }
  }
}

// ---------------------------------------------------------------------
// Scattered cover
// ---------------------------------------------------------------------

/** A spot is free if it is clear of flags, bases, vehicle slots, other cover and the fence. */
function isFree(x: number, z: number, placed: readonly Obstacle[]): boolean {
  if (ARENA_HALF - Math.max(Math.abs(x), Math.abs(z)) < 8) return false;
  for (const f of FLAGS) if (Math.hypot(x - f.x, z - f.z) < 14) return false;
  for (const b of BASES) if (Math.hypot(x - b.x, z - b.z) < 26) return false;
  for (const s of VEHICLE_SLOTS) if (Math.hypot(x - s.x, z - s.z) < 6) return false;
  for (const o of placed) if (Math.hypot(x - o.x, z - o.z) < 8) return false;
  return true;
}

function buildCover(root: THREE.Group, placed: Obstacle[]): void {
  const rand = mulberry32(1234);

  const unitSphere = new THREE.SphereGeometry(1, 10, 8);
  const bushMat = material(0x2f7a2f, 0.95);
  const blob = (mat: THREE.Material, x: number, y: number, z: number, r: number): void => {
    const m = mesh(unitSphere, mat, x, y, z);
    m.scale.setScalar(r);
    root.add(m);
  };

  const stoneGeo = new THREE.DodecahedronGeometry(1.2, 0);
  const stoneMat = material(0x9e9e9e, 0.9);

  const potGeo = new THREE.CylinderGeometry(0.75, 0.9, 1.3, 14);
  const potMat = material(0xc0613b, 0.8);
  const petalGeo = new THREE.SphereGeometry(0.28, 8, 6);
  const petalMat = material(0xe03a3a, 0.7);
  const centreGeo = new THREE.SphereGeometry(0.12, 6, 5);
  const centreMat = material(0xffd23a, 0.7);

  const stumpGeo = new THREE.CylinderGeometry(1.1, 1.2, 1.0, 14);
  const stumpMat = material(0x7a5230, 0.95);

  const trunkGeo = new THREE.CylinderGeometry(0.45, 0.6, 5, 8);
  const trunkMat = material(0x6b4a2e, 0.9);
  const crownGeo = new THREE.ConeGeometry(3.2, 7, 10);
  const crownMat = material(0x2e8b3a, 0.9);

  const scatter = (count: number, build: (x: number, z: number, g: number) => Obstacle): void => {
    let n = 0;
    for (let k = 0; k < 5000 && n < count; k++) {
      const x = (rand() * 2 - 1) * (ARENA_HALF - 8);
      const z = (rand() * 2 - 1) * (ARENA_HALF - 8);
      if (!isFree(x, z, placed)) continue;
      const o = build(x, z, heightAt(x, z));
      placed.push(o);
      n++;
    }
  };

  // Bushes: clusters of spheres.
  scatter(70, (x, z, g) => {
    blob(bushMat, x, g + 1.2, z, 1.0);
    blob(bushMat, x + 0.9, g + 0.6, z + 0.4, 0.8);
    blob(bushMat, x - 0.7, g + 0.6, z - 0.5, 0.85);
    return { x, z, r: 1.6, h: 2.2 };
  });

  // Stones.
  scatter(30, (x, z, g) => {
    const m = mesh(stoneGeo, stoneMat, x, g + 0.7, z);
    m.scale.set(1, 0.6, 1);
    m.rotation.y = rand() * Math.PI;
    root.add(m);
    return { x, z, r: 1.2, h: 1.4 };
  });

  // Flower pots.
  scatter(20, (x, z, g) => {
    root.add(mesh(potGeo, potMat, x, g + 0.65, z));
    root.add(mesh(petalGeo, petalMat, x, g + 1.45, z));
    root.add(mesh(centreGeo, centreMat, x, g + 1.62, z));
    return { x, z, r: 0.9, h: 1.3 };
  });

  // Tree stumps.
  scatter(15, (x, z, g) => {
    root.add(mesh(stumpGeo, stumpMat, x, g + 0.5, z));
    return { x, z, r: 1.1, h: 1.0 };
  });

  // Trees: trunk is the obstacle, crown is decor.
  scatter(8, (x, z, g) => {
    root.add(mesh(trunkGeo, trunkMat, x, g + 2.5, z));
    root.add(mesh(crownGeo, crownMat, x, g + 8.5, z));
    return { x, z, r: 1.0, h: 12 };
  });
}
