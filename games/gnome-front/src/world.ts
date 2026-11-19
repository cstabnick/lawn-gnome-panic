// src/world.ts: ground, sky, lights, fences and cover.
import * as THREE from 'three';
import { buildPrefab, buildPrefabInstances } from '@lawn/prefabs';
import { ARENA_HALF, BASES, FLAGS, GRASS_COLOR, TEAM_COLORS, VEHICLE_SLOTS } from './config';
import type { Obstacle } from './config';
import { heightAt } from './terrain';
import { ARENA_DOC } from './levelDoc';

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

  // One picket-fence section (3 units wide, scale 3) per 3-unit span on each of the four edges, centred on the span.
  // The section's rails sit at about the old rail heights once lifted 0.25.
  const FENCE_SCALE = 3;
  const LIFT = 0.25;
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3(FENCE_SCALE, FENCE_SCALE, FENCE_SCALE);
  const up = new THREE.Vector3(0, 1, 0);
  const matrices: THREE.Matrix4[] = [];
  const place = (x: number, z: number, rotY: number): void => {
    p.set(x, heightAt(x, z) + LIFT, z);
    q.setFromAxisAngle(up, rotY);
    matrices.push(new THREE.Matrix4().compose(p, q, s));
  };
  for (let i = 0; i < 100; i++) {
    const mid = -H + 1.5 + 3 * i;
    place(mid, H, 0);
    place(mid, -H, 0);
    place(H, mid, Math.PI / 2);
    place(-H, mid, Math.PI / 2);
  }
  scene.add(buildPrefabInstances('picket-fence', matrices));
}

// ---------------------------------------------------------------------
// Landmarks at the five flags
// ---------------------------------------------------------------------

/** The landmarks at the flags, in the order the document lists them (object and obstacle order both matter). */
function buildLandmarks(root: THREE.Group, out: Obstacle[]): void {
  for (const L of ARENA_DOC.data.landmarks) {
    const f = flagXZ(L.at);
    const x = f.x + L.dx;
    const z = f.z + L.dz;
    const obj = buildPrefab(L.prefab, { scale: L.scale });
    obj.position.set(x, heightAt(x, z), z);
    obj.rotation.y = L.rotY;
    root.add(obj);
    for (const o of L.obstacles) out.push({ x: f.x + o.dx, z: f.z + o.dz, r: o.r, h: o.h });
  }
}

// ---------------------------------------------------------------------
// Team headquarters
// ---------------------------------------------------------------------

function buildHQs(root: THREE.Group, out: Obstacle[]): void {
  for (const team of [0, 1] as const) {
    const base = BASES[team];
    const outward = Math.sign(base.z); // away from the map centre
    const tz = base.z + outward * 14;
    const g = heightAt(0, tz);

    const tent = buildPrefab('hq-tent', { scale: 4, tint: TEAM_COLORS[team] });
    tent.position.set(0, g, tz);
    tent.rotation.y = outward > 0 ? Math.PI : 0; // door faces the map centre
    root.add(tent);
    out.push({ x: 0, z: tz, r: 4, h: 5 });

    for (const px of [-6, 6]) {
      const banner = buildPrefab('team-banner', { scale: 3, tint: TEAM_COLORS[team] });
      banner.position.set(px, g, tz);
      banner.rotation.y = px < 0 ? Math.PI : 0; // flag streams outward, away from the tent
      root.add(banner);
    }
  }
}

// ---------------------------------------------------------------------
// Scattered cover
// ---------------------------------------------------------------------

/** A spot is free if it is clear of flags, bases, vehicle slots, other cover and the fence. */
function isFree(x: number, z: number, placed: readonly Obstacle[], avoid: { flag: number; base: number; slot: number; cover: number }, edge: number): boolean {
  if (ARENA_HALF - Math.max(Math.abs(x), Math.abs(z)) < edge) return false;
  for (const f of FLAGS) if (Math.hypot(x - f.x, z - f.z) < avoid.flag) return false;
  for (const b of BASES) if (Math.hypot(x - b.x, z - b.z) < avoid.base) return false;
  for (const s of VEHICLE_SLOTS) if (Math.hypot(x - s.x, z - s.z) < avoid.slot) return false;
  for (const o of placed) if (Math.hypot(x - o.x, z - o.z) < avoid.cover) return false;
  return true;
}

/** Scattered cover, one layer of the document at a time. The seeded generator is order-sensitive: two draws per
 * try, and one more per placed object on a spin layer. */
function buildCover(root: THREE.Group, placed: Obstacle[]): void {
  const C = ARENA_DOC.data.cover;
  const rand = mulberry32(C.seed);

  for (const layer of C.layers) {
    let n = 0;
    for (let k = 0; k < C.tries && n < layer.count; k++) {
      const x = (rand() * 2 - 1) * (ARENA_HALF - C.edge);
      const z = (rand() * 2 - 1) * (ARENA_HALF - C.edge);
      if (!isFree(x, z, placed, C.avoid, C.edge)) continue;
      const obj = buildPrefab(layer.prefab, { scale: layer.scale });
      obj.position.set(x, heightAt(x, z) - (layer.sink ?? 0), z);
      if (layer.spin) obj.rotation.y = rand() * 2 * Math.PI;
      root.add(obj);
      placed.push({ x, z, r: layer.obstacle.r, h: layer.obstacle.h });
      n++;
    }
  }
}
