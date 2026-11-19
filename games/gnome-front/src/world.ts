// src/world.ts: ground, sky, lights, fences and cover.
import * as THREE from 'three';
import { buildPrefab, buildPrefabInstances } from '@lawn/prefabs';
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

/** A prefab built with its root at (x, y, z). */
function propAt(id: string, opts: { scale?: number; tint?: number }, x: number, y: number, z: number): THREE.Group {
  const g = buildPrefab(id, opts);
  g.position.set(x, y, z);
  return g;
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

function buildLandmarks(root: THREE.Group, out: Obstacle[]): void {
  // A: Birdbath at the flag centre.
  {
    const { x, z } = flagXZ('A');
    const g = heightAt(x, z);
    const bath = buildPrefab('birdbath', { scale: 2.0 });
    bath.position.set(x, g, z);
    root.add(bath);
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
      const plot = buildPrefab('veggie-bed', { scale: 4 });
      plot.position.set(cx, g, cz);
      if (!bed.alongZ) plot.rotation.y = Math.PI / 2;
      root.add(plot);
      for (const t of [-2.8, 0, 2.8]) {
        const px = bed.alongZ ? cx : cx + t;
        const pz = bed.alongZ ? cz + t : cz;
        out.push({ x: px, z: pz, r: 1.0, h: 0.8 });
      }
    }
  }

  // C: Fountain at the flag centre.
  {
    const { x, z } = flagXZ('C');
    const g = heightAt(x, z);
    root.add(propAt('stone-fountain', { scale: 2 }, x, g, z));
    out.push({ x, z, r: 2.5, h: 1.2 });
  }

  // D: Shed, 11 units west of the flag.
  {
    const f = flagXZ('D');
    const sx = f.x - 11;
    const sz = f.z;
    const g = heightAt(sx, sz);
    root.add(propAt('garden-shed', { scale: 4 }, sx, g, sz));
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
    root.add(propAt('compost-heap', { scale: 3 }, ex, g, ez));
    out.push({ x: ex, z: ez, r: 3, h: 2 });
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

  // Bushes. Sunk a little so the lowest leaf ball sits in the turf.
  scatter(70, (x, z, g) => {
    root.add(propAt('round-bush', { scale: 2 }, x, g - 0.25, z));
    return { x, z, r: 1.6, h: 2.2 };
  });

  // Stones.
  scatter(30, (x, z, g) => {
    const m = buildPrefab('garden-rock', { scale: 3.0 });
    m.position.set(x, g, z);
    m.rotation.y = rand() * Math.PI * 2;
    root.add(m);
    return { x, z, r: 1.2, h: 1.4 };
  });

  // Flower pots.
  scatter(20, (x, z, g) => {
    const pot = buildPrefab('flower-pot', { scale: 4.5 });
    pot.position.set(x, g, z);
    root.add(pot);
    return { x, z, r: 0.9, h: 1.3 };
  });

  // Tree stumps.
  scatter(15, (x, z, g) => {
    const stump = buildPrefab('tree-stump', { scale: 3.2 });
    stump.position.set(x, g, z);
    root.add(stump);
    return { x, z, r: 1.1, h: 1.0 };
  });

  // Trees: trunk is the obstacle, crown is decor.
  scatter(8, (x, z, g) => {
    root.add(propAt('cone-pine', { scale: 5 }, x, g, z));
    return { x, z, r: 1.0, h: 12 };
  });
}
