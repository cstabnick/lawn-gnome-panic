// World: terrain, lake, scenery, lights and collision for walkers. Seeded, so every load looks the same.
import * as THREE from 'three';
import { TUNING, REGIONS, LAKE, HOUSES, WELL } from './config';

let ground: THREE.Mesh | null = null;

/** Collision circles, bucketed into 8x8 cells. */
interface Circle { x: number; z: number; r: number }
let colliders = new Map<string, Circle[]>();

/** Lambert materials, one per colour (flat-shaded). Rebuilt on each buildWorld. */
let mats = new Map<number, THREE.MeshLambertMaterial>();

function mulberry32(a: number): () => number {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function regionById(id: string) {
  const r = REGIONS.find((reg) => reg.id === id);
  if (!r) throw new Error(`no region ${id}`);
  return r;
}

/** Distance from (px, pz) to the segment (ax, az)-(bx, bz). */
function distToSeg(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

/** Dirt roads: village centre to each other region. */
const ROADS = REGIONS.filter((r) => r.id !== 'village').map((r) => ({ ax: 0, az: 0, bx: r.x, bz: r.z }));

function distToRoad(x: number, z: number): number {
  let best = Infinity;
  for (const s of ROADS) best = Math.min(best, distToSeg(x, z, s.ax, s.az, s.bx, s.bz));
  return best;
}

function inRegion(id: string, x: number, z: number): boolean {
  const r = regionById(id);
  return Math.hypot(x - r.x, z - r.z) <= r.r;
}

/** Ground height at (x, z). Deterministic and cheap. */
export function heightAt(x: number, z: number): number {
  let h = 1.6 * Math.sin(x * 0.045 + 1.1) * Math.cos(z * 0.038 - 0.6) + 0.8 * Math.sin((x + z) * 0.09) + 0.5 * Math.sin(x * 0.13 - z * 0.11);
  // Edge hills.
  h += 9 * smoothstep(TUNING.worldHalf - 28, TUNING.worldHalf, Math.max(Math.abs(x), Math.abs(z)));
  // Flatten each region; the burrow gets a mound with a pit in the middle.
  for (const r of REGIONS) {
    const d = Math.hypot(x - r.x, z - r.z);
    h *= smoothstep(r.r * 0.8, r.r + 10, d);
    if (r.id === 'burrow') h += 2.5 * Math.exp(-(d * d) / (9 * 9)) - 2 * Math.exp(-(d * d) / (3 * 3));
  }
  // The lake.
  const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
  h -= 4 * Math.exp(-(dl * dl) / (LAKE.r * LAKE.r * 0.6));
  return h;
}

function addCollider(x: number, z: number, r: number): void {
  for (let i = Math.floor((x - r) / 8); i <= Math.floor((x + r) / 8); i++) {
    for (let j = Math.floor((z - r) / 8); j <= Math.floor((z + r) / 8); j++) {
      const key = `${i},${j}`;
      let list = colliders.get(key);
      if (!list) { list = []; colliders.set(key, list); }
      list.push({ x, z, r });
    }
  }
}

/** True where a walker may not stand: outside the world, in water, or inside a house, tree, rock or the well. */
export function isBlocked(x: number, z: number): boolean {
  if (Math.abs(x) > TUNING.worldHalf - 2 || Math.abs(z) > TUNING.worldHalf - 2) return true;
  if (heightAt(x, z) < TUNING.waterLevel + 0.1) return true;
  const list = colliders.get(`${Math.floor(x / 8)},${Math.floor(z / 8)}`);
  if (list) {
    for (const c of list) {
      const dx = x - c.x, dz = z - c.z;
      if (dx * dx + dz * dz < c.r * c.r) return true;
    }
  }
  return false;
}

/** Ground colour for the triangle centred at (x, z). */
function groundColour(x: number, z: number): number {
  if (distToRoad(x, z) < 2.2) return 0x9b7a4c;
  // Sand only on the lake shore (flattened regions sit near 0, which is under the threshold too).
  if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r * 1.5 && heightAt(x, z) < TUNING.waterLevel + 0.6) return 0xd8c78a;
  if (inRegion('burrow', x, z)) return 0x6b5038;
  if (inRegion('barrows', x, z)) return 0x6f8a55;
  const t = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
  return t < 1 / 3 ? 0x5f9e3f : t < 2 / 3 ? 0x5a963b : 0x67a745;
}

function lambert(color: number): THREE.MeshLambertMaterial {
  let m = mats.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: true });
    mats.set(color, m);
  }
  return m;
}

/** A shadow-casting mesh with a flat-shaded colour, added to parent at (x, y, z). */
function addMesh(geo: THREE.BufferGeometry, color: number, parent: THREE.Object3D, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, lambert(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/** Trees and rocks may not sit here: near a region or the lake, in water, or (for trees) on a road. */
function clearOfFeatures(x: number, z: number, roads: boolean): boolean {
  if (REGIONS.some((r) => Math.hypot(x - r.x, z - r.z) < r.r + 5)) return false;
  if (roads && distToRoad(x, z) < 3.5) return false;
  if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 5) return false;
  return heightAt(x, z) >= TUNING.waterLevel + 0.5;
}

/** Builds the ground, water, scenery, sky colour, fog and lights into the scene. Call once. */
export function buildWorld(scene: THREE.Scene): void {
  colliders = new Map();
  mats = new Map();
  const rng = mulberry32(7);
  const half = TUNING.worldHalf;

  // Sky, fog and light.
  scene.background = new THREE.Color(0x9fd0f0);
  scene.fog = new THREE.Fog(0x9fd0f0, 70, 170);
  scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x4a6b2a, 1.4));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sun.position.set(60, 90, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.left = -130;
  sun.shadow.camera.bottom = -130;
  sun.shadow.camera.right = 130;
  sun.shadow.camera.top = 130;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 300;
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  scene.add(sun.target);
  sun.target.position.set(0, 0, 0);

  // Terrain: one colour per triangle.
  const geo = new THREE.PlaneGeometry(240, 240, 160, 160).rotateX(-Math.PI / 2);
  const grid = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < grid.count; i++) grid.setY(i, heightAt(grid.getX(i), grid.getZ(i)));
  const flat = geo.toNonIndexed();
  const pos = flat.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i += 3) {
    const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
    const cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    c.setHex(groundColour(cx, cz));
    for (let k = 0; k < 3; k++) {
      colors[(i + k) * 3] = c.r;
      colors[(i + k) * 3 + 1] = c.g;
      colors[(i + k) * 3 + 2] = c.b;
    }
  }
  flat.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  flat.computeVertexNormals();
  ground = new THREE.Mesh(flat, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  ground.receiveShadow = true;
  scene.add(ground);

  // Lake.
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(LAKE.r * 1.4, 40).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x3f7fbf, transparent: true, opacity: 0.8 }),
  );
  water.position.set(LAKE.x, TUNING.waterLevel, LAKE.z);
  scene.add(water);

  // Trees.
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 1.6, 6);
  const pineGeos = [new THREE.ConeGeometry(1.6, 2, 7), new THREE.ConeGeometry(1.25, 2, 7), new THREE.ConeGeometry(0.9, 2, 7)];
  const pineYs = [1.8, 2.8, 3.7];
  const broadGeo = new THREE.IcosahedronGeometry(1.7, 0);
  for (let n = 0; n < 320; n++) {
    const x = (rng() * 2 - 1) * (half - 6);
    const z = (rng() * 2 - 1) * (half - 6);
    if (!clearOfFeatures(x, z, true)) continue;
    const pine = rng() < 0.5;
    const g = new THREE.Group();
    g.position.set(x, heightAt(x, z), z);
    g.rotation.y = rng() * Math.PI * 2;
    const s = 0.9 + rng() * 0.8;
    g.scale.setScalar(s);
    addMesh(trunkGeo, 0x6b4a2e, g, 0, 0.8, 0);
    if (pine) pineGeos.forEach((pg, i) => addMesh(pg, 0x2f6b2f, g, 0, pineYs[i], 0));
    else addMesh(broadGeo, 0x3f8f3a, g, 0, 3, 0);
    scene.add(g);
    addCollider(x, z, 0.6 * s);
  }

  // Rocks: random ones, then six on the lake shore.
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const placeRock = (x: number, z: number, s: number) => {
    const m = addMesh(rockGeo, 0x8a8a80, scene, x, heightAt(x, z), z);
    m.scale.set(s, s * 0.7, s);
    m.rotation.y = rng() * Math.PI * 2;
    addCollider(x, z, 0.8 * s);
  };
  for (let n = 0; n < 70; n++) {
    const x = (rng() * 2 - 1) * (half - 6);
    const z = (rng() * 2 - 1) * (half - 6);
    if (!clearOfFeatures(x, z, false)) continue;
    placeRock(x, z, 0.4 + rng() * 1.0);
  }
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3;
    const rr = LAKE.r + 1;
    placeRock(LAKE.x + Math.cos(a) * rr, LAKE.z + Math.sin(a) * rr, 0.6 + rng() * 0.4);
  }

  // Mossbottom: mushroom houses.
  const dotGeo = new THREE.SphereGeometry(0.25, 6, 4);
  const doorGeo = new THREE.BoxGeometry(1, 1.6, 0.2);
  const windowGeo = new THREE.CircleGeometry(0.35, 12);
  for (const h of HOUSES) {
    const r = h.r;
    const g = new THREE.Group();
    g.position.set(h.x, heightAt(h.x, h.z), h.z);
    scene.add(g);
    addMesh(new THREE.CylinderGeometry(r * 0.7, r * 0.85, 3, 10), 0xf2e6c8, g, 0, 1.5, 0);
    const cap = addMesh(new THREE.SphereGeometry(r * 1.35, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xc8352e, g, 0, 2.8, 0);
    cap.scale.y = 0.8;
    // Eight white spots on the cap.
    const R = r * 1.35 * 1.02;
    const th = 0.7;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      addMesh(dotGeo, 0xffffff, g, R * Math.sin(th) * Math.cos(a), 2.8 + 0.8 * R * Math.cos(th), R * Math.sin(th) * Math.sin(a));
    }
    // Door faces the house's yaw; window on the side.
    const door = addMesh(doorGeo, 0x5a3a1e, g, Math.sin(h.yaw) * r * 0.86, 0.8, Math.cos(h.yaw) * r * 0.86);
    door.rotation.y = h.yaw;
    const wy = h.yaw + Math.PI / 2;
    const win = new THREE.Mesh(windowGeo, new THREE.MeshBasicMaterial({ color: 0xfff2a8 }));
    win.position.set(Math.sin(wy) * r * 0.86, 2.0, Math.cos(wy) * r * 0.86);
    win.rotation.y = wy;
    g.add(win);
    addCollider(h.x, h.z, r * 0.9);
  }

  // The well.
  const wg = new THREE.Group();
  wg.position.set(WELL.x, heightAt(WELL.x, WELL.z), WELL.z);
  scene.add(wg);
  addMesh(new THREE.CylinderGeometry(1.2, 1.3, 0.9, 12, 1, true), 0x8d8d8d, wg, 0, 0.45, 0);
  addMesh(new THREE.CircleGeometry(1.1, 12).rotateX(-Math.PI / 2), 0x1d3a52, wg, 0, 0.5, 0);
  addMesh(new THREE.BoxGeometry(0.15, 1.8, 0.15), 0x8b6a3e, wg, -1.1, 0.9, 0);
  addMesh(new THREE.BoxGeometry(0.15, 1.8, 0.15), 0x8b6a3e, wg, 1.1, 0.9, 0);
  addMesh(new THREE.ConeGeometry(1.5, 0.9, 4), 0x8b4a2b, wg, 0, 2.25, 0);
  addCollider(WELL.x, WELL.z, WELL.r);

  // Village flowers (no collider).
  const flowerGeo = new THREE.SphereGeometry(0.15, 6, 4);
  const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4);
  const flowerColours = [0xff6fa8, 0xffe14f, 0xb36bff, 0xffffff];
  let flowers = 0;
  for (let tries = 0; flowers < 40 && tries < 2000; tries++) {
    const a = rng() * Math.PI * 2;
    const d = 20 * Math.sqrt(rng());
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (HOUSES.some((h) => Math.hypot(x - h.x, z - h.z) < h.r + 0.8)) continue;
    if (Math.hypot(x - WELL.x, z - WELL.z) < WELL.r + 0.8) continue;
    const y = heightAt(x, z);
    addMesh(stemGeo, 0x3f8f3a, scene, x, y + 0.25, z);
    addMesh(flowerGeo, flowerColours[Math.floor(rng() * flowerColours.length)], scene, x, y + 0.55, z);
    flowers++;
  }

  // Feral camp: three tents round a campfire.
  const camp = regionById('camp');
  const campY = heightAt(camp.x, camp.z);
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI * 2) / 3 + 0.5;
    const tx = camp.x + 8 * Math.cos(a);
    const tz = camp.z + 8 * Math.sin(a);
    addMesh(new THREE.ConeGeometry(2.2, 3, 6), k % 2 ? 0x6a5a40 : 0x7d6a4f, scene, tx, heightAt(tx, tz) + 1.5, tz);
    addCollider(tx, tz, 2);
  }
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    const log = addMesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 5), 0x5a3a1e, scene, camp.x + 0.5 * Math.cos(a), campY + 0.12, camp.z + 0.5 * Math.sin(a));
    log.rotation.set(0, a, Math.PI / 2);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 6), new THREE.MeshBasicMaterial({ color: 0xff8a1e }));
  flame.position.set(camp.x, campY + 0.6, camp.z);
  scene.add(flame);
  const fireLight = new THREE.PointLight(0xff9a3c, 3, 14);
  fireLight.position.set(camp.x, campY + 1.2, camp.z);
  scene.add(fireLight);
  addCollider(camp.x, camp.z, 1);

  // Beetle Barrows: standing stones in a ring, and two grassy mounds.
  const barrows = regionById('barrows');
  const stoneGeo = new THREE.BoxGeometry(1.2, 3.5, 0.8);
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    const sx = barrows.x + 13 * Math.cos(a);
    const sz = barrows.z + 13 * Math.sin(a);
    const stone = addMesh(stoneGeo, 0x7f7f78, scene, sx, heightAt(sx, sz) + 1.75, sz);
    stone.rotation.set(0, rng() * Math.PI, (rng() - 0.5) * 0.1);
    addCollider(sx, sz, 0.9);
  }
  for (const a of [0, Math.PI]) {
    const mx = barrows.x + 6 * Math.cos(a);
    const mz = barrows.z + 6 * Math.sin(a);
    const mound = addMesh(new THREE.SphereGeometry(4, 10, 6), 0x6f8a55, scene, mx, heightAt(mx, mz), mz);
    mound.scale.y = 0.35;
    addCollider(mx, mz, 3.2);
  }

  // Grubthorn's Burrow: dirt heaps round a black pit.
  const burrow = regionById('burrow');
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    const hx = burrow.x + 10 * Math.cos(a);
    const hz = burrow.z + 10 * Math.sin(a);
    addMesh(new THREE.ConeGeometry(2.2, 2, 7), 0x6b5038, scene, hx, heightAt(hx, hz) + 1, hz);
    addCollider(hx, hz, 1.8);
  }
  addMesh(new THREE.CircleGeometry(2.2, 16).rotateX(-Math.PI / 2), 0x1a120c, scene, burrow.x, heightAt(burrow.x, burrow.z) + 0.05, burrow.z);

  // Signposts at the middle of each road.
  for (const r of REGIONS) {
    if (r.id === 'village') continue;
    const mx = r.x / 2;
    const mz = r.z / 2;
    const my = heightAt(mx, mz);
    addMesh(new THREE.BoxGeometry(0.15, 1.6, 0.15), 0x8b6a3e, scene, mx, my + 0.8, mz);
    const board = addMesh(new THREE.BoxGeometry(1.2, 0.35, 0.08), 0x8b6a3e, scene, mx, my + 1.4, mz);
    board.rotation.y = Math.atan2(r.x, r.z);
    addCollider(mx, mz, 0.3);
  }
}

/** The ground mesh, for raycasting clicks. */
export function getGroundMesh(): THREE.Object3D {
  if (!ground) throw new Error('buildWorld first');
  return ground;
}

/** Name of the region containing (x, z), or 'the Wilds'. */
export function regionNameAt(x: number, z: number): string {
  for (const r of REGIONS) {
    if (Math.hypot(x - r.x, z - r.z) <= r.r + 6) return r.name;
  }
  return 'the Wilds';
}
