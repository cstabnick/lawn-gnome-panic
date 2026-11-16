// World: terrain, lakes, scenery, roads, walls, exits, lights and collision for the zone that is built. Seeded, so every build of a zone looks the same.
import * as THREE from 'three';
import { TUNING, type ZoneDef, type ZoneExit } from './config';
import { ZONES } from './content';
import { checkCondition } from './quests';

/** The zone currently built. Defaults to mossbottom until zones.ts builds the first one. */
let zone: ZoneDef = ZONES.mossbottom;

let ground: THREE.Mesh | null = null;
/** Everything built for the current zone lives in this group, so clearWorld can drop it in one go. */
let worldGroup: THREE.Group | null = null;
/** Exit rings and signs, so their visibility can follow each exit's `when`. */
let exitViews: { exit: ZoneExit; group: THREE.Group }[] = [];

/** Collision circles, bucketed into 8x8 cells. */
interface Circle { x: number; z: number; r: number }
let colliders = new Map<string, Circle[]>();

/** Dirt road segments: shrine to each region and to each exit. */
interface Seg { ax: number; az: number; bx: number; bz: number }
let roads: Seg[] = [];

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

function regionOf(id: string) {
  return zone.regions.find((reg) => reg.id === id);
}

/** Distance from (px, pz) to the segment (ax, az)-(bx, bz). */
function distToSeg(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

function distToRoad(x: number, z: number): number {
  let best = Infinity;
  for (const s of roads) best = Math.min(best, distToSeg(x, z, s.ax, s.az, s.bx, s.bz));
  return best;
}

function inRegion(id: string, x: number, z: number): boolean {
  const r = regionOf(id);
  return !!r && Math.hypot(x - r.x, z - r.z) <= r.r;
}

/** Ground height at (x, z). Deterministic and cheap. */
export function heightAt(x: number, z: number): number {
  const theme = zone.theme;
  let h = theme.hilliness * (1.6 * Math.sin(x * 0.045 + 1.1) * Math.cos(z * 0.038 - 0.6) + 0.8 * Math.sin((x + z) * 0.09) + 0.5 * Math.sin(x * 0.13 - z * 0.11));
  // Edge hills.
  h += 9 * smoothstep(zone.half - 28, zone.half, Math.max(Math.abs(x), Math.abs(z)));
  // Flatten each region; the burrow gets a mound with a pit in the middle.
  for (const r of zone.regions) {
    const d = Math.hypot(x - r.x, z - r.z);
    h *= smoothstep(r.r * 0.8, r.r + 10, d);
    if (r.id === 'burrow') h += 2.5 * Math.exp(-(d * d) / (9 * 9)) - 2 * Math.exp(-(d * d) / (3 * 3));
  }
  // The lakes.
  for (const lake of zone.lakes) {
    const dl = Math.hypot(x - lake.x, z - lake.z);
    h -= 4 * Math.exp(-(dl * dl) / (lake.r * lake.r * 0.6));
  }
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

/** True where a walker may not stand: outside the world, in water, or inside a house, tree, rock, wall or the shrine. */
export function isBlocked(x: number, z: number): boolean {
  if (Math.abs(x) > zone.half - 2 || Math.abs(z) > zone.half - 2) return true;
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
  for (const lake of zone.lakes) {
    if (Math.hypot(x - lake.x, z - lake.z) < lake.r * 1.5 && heightAt(x, z) < TUNING.waterLevel + 0.6) return 0xd8c78a;
  }
  if (inRegion('burrow', x, z)) return 0x6b5038;
  if (inRegion('barrows', x, z)) return 0x6f8a55;
  const t = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
  const { ground, groundAlt } = zone.theme;
  if (t < 1 / 3) return ground;
  if (t < 2 / 3) return new THREE.Color(ground).multiplyScalar(0.965).getHex();
  return groundAlt;
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

/** Trees and rocks may not sit here: near a region or a lake, in water, or (for roads) on a road. */
function clearOfFeatures(x: number, z: number, onRoads: boolean): boolean {
  if (zone.regions.some((r) => Math.hypot(x - r.x, z - r.z) < r.r + 5)) return false;
  if (onRoads && distToRoad(x, z) < 3.5) return false;
  if (zone.lakes.some((l) => Math.hypot(x - l.x, z - l.z) < l.r + 5)) return false;
  return heightAt(x, z) >= TUNING.waterLevel + 0.5;
}

/** A wall segment from (x1, z1) to (x2, z2): a box plus one r 1 collider every 1.5 m. */
function addWall(x1: number, z1: number, x2: number, z2: number, height: number, color: number, parent: THREE.Object3D): void {
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  if (len < 0.01) return;
  const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
  const wall = addMesh(new THREE.BoxGeometry(1.5, height, len), color, parent, mx, heightAt(mx, mz) + height / 2, mz);
  wall.rotation.y = Math.atan2(dx, dz);
  const n = Math.max(1, Math.ceil(len / 1.5));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    addCollider(x1 + dx * t, z1 + dz * t, 1);
  }
}

/** A canvas label for an exit sign. */
function labelTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#5a3a1e';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#fff3d0';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64, 480);
  }
  return new THREE.CanvasTexture(canvas);
}

/** A glowing ring on the ground at the exit, with a signpost beside it. Hidden while the exit's `when` is false. */
function buildExit(exit: ZoneExit, parent: THREE.Object3D): void {
  const group = new THREE.Group();
  group.position.set(exit.x, heightAt(exit.x, exit.z), exit.z);
  parent.add(group);
  const ringMat = new THREE.MeshLambertMaterial({ color: 0x7ff7ff, emissive: 0x2ac8ff, emissiveIntensity: 0.9, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(exit.r * 0.75, exit.r, 32).rotateX(-Math.PI / 2), ringMat);
  ring.position.y = 0.12;
  group.add(ring);
  const sx = exit.r + 1.4;
  addMesh(new THREE.BoxGeometry(0.15, 1.8, 0.15), 0x8b6a3e, group, sx, 0.9, 0);
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.8),
    new THREE.MeshBasicMaterial({ map: labelTexture(exit.label), side: THREE.DoubleSide }),
  );
  board.position.set(sx, 1.9, 0);
  group.add(board);
  exitViews.push({ exit, group });
}

/** Shows or hides each exit ring and sign by its `when` condition. Called every frame by zones.ts. */
export function updateExitVisibility(): void {
  for (const v of exitViews) v.group.visible = checkCondition(v.exit.when);
}

/** One house, with a door on the side that faces its yaw. */
function buildHouse(h: (typeof zone.houses)[number], parent: THREE.Object3D): void {
  const r = h.r;
  const g = new THREE.Group();
  g.position.set(h.x, heightAt(h.x, h.z), h.z);
  parent.add(g);
  let windowed = true;
  switch (h.style) {
    case 'mushroom': {
      addMesh(new THREE.CylinderGeometry(r * 0.7, r * 0.85, 3, 10), 0xf2e6c8, g, 0, 1.5, 0);
      const cap = addMesh(new THREE.SphereGeometry(r * 1.35, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xc8352e, g, 0, 2.8, 0);
      cap.scale.y = 0.8;
      // Eight white spots on the cap.
      const R = r * 1.35 * 1.02;
      const th = 0.7;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        addMesh(new THREE.SphereGeometry(0.25, 6, 4), 0xffffff, g, R * Math.sin(th) * Math.cos(a), 2.8 + 0.8 * R * Math.cos(th), R * Math.sin(th) * Math.sin(a));
      }
      break;
    }
    case 'thatch':
      addMesh(new THREE.CylinderGeometry(r * 0.85, r * 0.95, 2.6, 10), 0xd9b56a, g, 0, 1.3, 0);
      addMesh(new THREE.ConeGeometry(r * 1.15, 2.4, 10), 0xb8862e, g, 0, 3.8, 0);
      break;
    case 'stone':
      addMesh(new THREE.CylinderGeometry(r * 0.9, r * 0.95, 2.8, 8), 0x9a9a92, g, 0, 1.4, 0);
      addMesh(new THREE.ConeGeometry(r * 1.1, 1.4, 8), 0x6e6e68, g, 0, 3.5, 0);
      break;
    case 'log': {
      addMesh(new THREE.BoxGeometry(r * 1.6, 2.4, r * 1.6), 0x8b5a2b, g, 0, 1.2, 0);
      const roof = addMesh(new THREE.ConeGeometry(r * 1.2, 1.6, 4), 0x5a3a1e, g, 0, 3.2, 0);
      roof.rotation.y = Math.PI / 4;
      break;
    }
    case 'tent':
      addMesh(new THREE.ConeGeometry(r * 1.2, 3.2, 6), 0xc8b07a, g, 0, 1.6, 0);
      windowed = false;
      break;
    case 'pot':
      addMesh(new THREE.CylinderGeometry(r * 0.55, r * 0.8, 2.4, 12), 0xb5562f, g, 0, 1.2, 0);
      addMesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.35, 12), 0xc96a3c, g, 0, 2.5, 0);
      windowed = false;
      break;
  }
  // Door faces the house's yaw.
  const door = addMesh(new THREE.BoxGeometry(1, 1.6, 0.2), 0x5a3a1e, g, Math.sin(h.yaw) * r * 0.86, 0.8, Math.cos(h.yaw) * r * 0.86);
  door.rotation.y = h.yaw;
  if (windowed) {
    const wy = h.yaw + Math.PI / 2;
    const win = new THREE.Mesh(new THREE.CircleGeometry(0.35, 12), new THREE.MeshBasicMaterial({ color: 0xfff2a8 }));
    win.position.set(Math.sin(wy) * r * 0.86, 2.0, Math.cos(wy) * r * 0.86);
    win.rotation.y = wy;
    g.add(win);
  }
  addCollider(h.x, h.z, r * 0.9);
}

/** The shrine: a well for mossbottom, otherwise a small stone shrine. */
function buildShrine(parent: THREE.Object3D): void {
  const s = zone.shrine;
  const wg = new THREE.Group();
  wg.position.set(s.x, heightAt(s.x, s.z), s.z);
  parent.add(wg);
  if (zone.id === 'mossbottom') {
    addMesh(new THREE.CylinderGeometry(1.2, 1.3, 0.9, 12, 1, true), 0x8d8d8d, wg, 0, 0.45, 0);
    addMesh(new THREE.CircleGeometry(1.1, 12).rotateX(-Math.PI / 2), 0x1d3a52, wg, 0, 0.5, 0);
    addMesh(new THREE.BoxGeometry(0.15, 1.8, 0.15), 0x8b6a3e, wg, -1.1, 0.9, 0);
    addMesh(new THREE.BoxGeometry(0.15, 1.8, 0.15), 0x8b6a3e, wg, 1.1, 0.9, 0);
    addMesh(new THREE.ConeGeometry(1.5, 0.9, 4), 0x8b4a2b, wg, 0, 2.25, 0);
  } else {
    addMesh(new THREE.BoxGeometry(1.8, 0.5, 1.8), 0x8f8f88, wg, 0, 0.25, 0);
    addMesh(new THREE.BoxGeometry(1.1, 1.6, 1.1), 0x9c9c94, wg, 0, 1.3, 0);
    addMesh(new THREE.BoxGeometry(1.6, 0.35, 1.6), 0x7a7a72, wg, 0, 2.27, 0);
    addMesh(new THREE.SphereGeometry(0.25, 8, 6), 0x9fe6ff, wg, 0, 2.7, 0);
  }
  addCollider(s.x, s.z, 1.2);
}

/** Scatters flora over `n` attempts across the map; `place` runs wherever the spot is clear. */
function scatter(n: number, rng: () => number, onRoads: boolean, place: (x: number, z: number) => void): void {
  const half = zone.half;
  for (let i = 0; i < n; i++) {
    const x = (rng() * 2 - 1) * (half - 6);
    const z = (rng() * 2 - 1) * (half - 6);
    if (!clearOfFeatures(x, z, onRoads)) continue;
    place(x, z);
  }
}

/** Builds the zone's flora, chosen by theme.flora and scaled by floraDensity. */
function buildFlora(root: THREE.Group, rng: () => number): void {
  const density = zone.theme.floraDensity;
  const n = (base: number) => Math.round(base * density);
  switch (zone.theme.flora) {
    case 'mushroom': {
      const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 1.6, 6);
      const pineGeos = [new THREE.ConeGeometry(1.6, 2, 7), new THREE.ConeGeometry(1.25, 2, 7), new THREE.ConeGeometry(0.9, 2, 7)];
      const pineYs = [1.8, 2.8, 3.7];
      const broadGeo = new THREE.IcosahedronGeometry(1.7, 0);
      scatter(n(320), rng, true, (x, z) => {
        const pine = rng() < 0.5;
        const g = new THREE.Group();
        g.position.set(x, heightAt(x, z), z);
        g.rotation.y = rng() * Math.PI * 2;
        const s = 0.9 + rng() * 0.8;
        g.scale.setScalar(s);
        addMesh(trunkGeo, 0x6b4a2e, g, 0, 0.8, 0);
        if (pine) pineGeos.forEach((pg, i) => addMesh(pg, 0x2f6b2f, g, 0, pineYs[i], 0));
        else addMesh(broadGeo, 0x3f8f3a, g, 0, 3, 0);
        root.add(g);
        addCollider(x, z, 0.6 * s);
      });
      break;
    }
    case 'grass': {
      const bladeGeo = new THREE.ConeGeometry(0.07, 0.9, 3);
      scatter(n(900), rng, true, (x, z) => {
        const y = heightAt(x, z);
        for (let k = 0; k < 4; k++) {
          const a = rng() * Math.PI * 2;
          const d = rng() * 0.3;
          addMesh(bladeGeo, 0x7fb84a, root, x + Math.cos(a) * d, y + 0.45, z + Math.sin(a) * d);
        }
      });
      break;
    }
    case 'clover': {
      const leafGeo = new THREE.IcosahedronGeometry(0.28, 0).scale(1, 0.35, 1);
      scatter(n(500), rng, true, (x, z) => {
        const y = heightAt(x, z);
        const turn = rng() * Math.PI * 2;
        for (let k = 0; k < 3; k++) {
          const a = turn + (k / 3) * Math.PI * 2;
          addMesh(leafGeo, 0x3f9a45, root, x + Math.cos(a) * 0.18, y + 0.1, z + Math.sin(a) * 0.18);
        }
      });
      break;
    }
    case 'hedge': {
      const hedgeGeo = new THREE.BoxGeometry(2.4, 1.5, 2.2);
      scatter(n(120), rng, true, (x, z) => {
        const m = addMesh(hedgeGeo, 0x2d5e2b, root, x, heightAt(x, z) + 0.75, z);
        m.rotation.y = rng() * Math.PI;
        addCollider(x, z, 1.2);
      });
      break;
    }
    case 'rock': {
      const boulderGeo = new THREE.DodecahedronGeometry(1, 0);
      scatter(n(160), rng, true, (x, z) => {
        const s = 1.2 + rng() * 1.0;
        const m = addMesh(boulderGeo, 0x8f8f88, root, x, heightAt(x, z) + s * 0.5, z);
        m.scale.set(s, s * 0.8, s);
        m.rotation.y = rng() * Math.PI * 2;
        addCollider(x, z, 0.9 * s);
      });
      break;
    }
    case 'pipe': {
      const pipeGeo = new THREE.CylinderGeometry(0.35, 0.35, 4, 8);
      scatter(n(160), rng, true, (x, z) => {
        addMesh(pipeGeo, 0x8a4a2a, root, x, heightAt(x, z) + 2, z);
        addCollider(x, z, 0.5);
      });
      break;
    }
    case 'stubble': {
      const tuftGeo = new THREE.ConeGeometry(0.1, 0.5, 3);
      scatter(n(700), rng, true, (x, z) => {
        const y = heightAt(x, z);
        for (let k = 0; k < 5; k++) {
          const a = rng() * Math.PI * 2;
          const d = rng() * 0.25;
          addMesh(tuftGeo, 0xd9c35a, root, x + Math.cos(a) * d, y + 0.25, z + Math.sin(a) * d);
        }
      });
      break;
    }
  }
}

/** Builds the zone into one group: ground, water, flora, roads, houses, shrine, walls, exits, sky, fog and lights. zones.ts calls clearWorld first. */
export function buildWorld(scene: THREE.Scene, def: ZoneDef): void {
  clearWorld(scene);
  zone = def;
  colliders = new Map();
  mats = new Map();
  exitViews = [];
  const rng = mulberry32(7);
  const half = zone.half;
  const shrine = zone.shrine;
  const root = new THREE.Group();
  worldGroup = root;
  scene.add(root);

  // Roads: shrine to each region and to each exit (skipping anything on top of the shrine).
  const far = (x: number, z: number) => Math.hypot(x - shrine.x, z - shrine.z) > 1;
  roads = [
    ...zone.regions.filter((r) => far(r.x, r.z)).map((r) => ({ ax: shrine.x, az: shrine.z, bx: r.x, bz: r.z })),
    ...zone.exits.filter((e) => far(e.x, e.z)).map((e) => ({ ax: shrine.x, az: shrine.z, bx: e.x, bz: e.z })),
  ];

  // Sky, fog and light. Indoor zones get dim ambient light and no sun.
  scene.background = new THREE.Color(zone.theme.sky);
  scene.fog = new THREE.Fog(zone.theme.fog, 70, 170);
  if (zone.indoor) {
    root.add(new THREE.HemisphereLight(0x8a8aa0, 0x222222, 0.45));
  } else {
    root.add(new THREE.HemisphereLight(0xcfe8ff, 0x4a6b2a, 1.4));
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
    root.add(sun);
    root.add(sun.target);
    sun.target.position.set(0, 0, 0);
  }

  // Terrain: one colour per triangle, about 1.5 m per cell.
  const segs = Math.round((half * 2) / 1.5);
  const geo = new THREE.PlaneGeometry(half * 2, half * 2, segs, segs).rotateX(-Math.PI / 2);
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
  root.add(ground);

  // Lakes.
  for (const lake of zone.lakes) {
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(lake.r * 1.4, 40).rotateX(-Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0x3f7fbf, transparent: true, opacity: 0.8 }),
    );
    water.position.set(lake.x, TUNING.waterLevel, lake.z);
    root.add(water);
  }

  // Flora (by theme), then the scattered boulders and the shore rocks.
  buildFlora(root, rng);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const placeRock = (x: number, z: number, s: number) => {
    const m = addMesh(rockGeo, 0x8a8a80, root, x, heightAt(x, z), z);
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
  for (const lake of zone.lakes) {
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.3;
      const rr = lake.r + 1;
      placeRock(lake.x + Math.cos(a) * rr, lake.z + Math.sin(a) * rr, 0.6 + rng() * 0.4);
    }
  }

  // Houses and the shrine.
  for (const h of zone.houses) buildHouse(h, root);
  buildShrine(root);

  // Village flowers round the shrine (no collider). Not in indoor zones.
  if (!zone.indoor) {
    const flowerGeo = new THREE.SphereGeometry(0.15, 6, 4);
    const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4);
    const flowerColours = [0xff6fa8, 0xffe14f, 0xb36bff, 0xffffff];
    let flowers = 0;
    for (let tries = 0; flowers < 40 && tries < 2000; tries++) {
      const a = rng() * Math.PI * 2;
      const d = 20 * Math.sqrt(rng());
      const x = shrine.x + Math.cos(a) * d;
      const z = shrine.z + Math.sin(a) * d;
      if (zone.houses.some((h) => Math.hypot(x - h.x, z - h.z) < h.r + 0.8)) continue;
      if (Math.hypot(x - shrine.x, z - shrine.z) < 1.2 + 0.8) continue;
      const y = heightAt(x, z);
      addMesh(stemGeo, 0x3f8f3a, root, x, y + 0.25, z);
      addMesh(flowerGeo, flowerColours[Math.floor(rng() * flowerColours.length)], root, x, y + 0.55, z);
      flowers++;
    }
  }

  // Feral camp (if this zone has one): three tents round a campfire.
  const camp = regionOf('camp');
  if (camp) {
    const campY = heightAt(camp.x, camp.z);
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI * 2) / 3 + 0.5;
      const tx = camp.x + 8 * Math.cos(a);
      const tz = camp.z + 8 * Math.sin(a);
      addMesh(new THREE.ConeGeometry(2.2, 3, 6), k % 2 ? 0x6a5a40 : 0x7d6a4f, root, tx, heightAt(tx, tz) + 1.5, tz);
      addCollider(tx, tz, 2);
    }
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const log = addMesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 5), 0x5a3a1e, root, camp.x + 0.5 * Math.cos(a), campY + 0.12, camp.z + 0.5 * Math.sin(a));
      log.rotation.set(0, a, Math.PI / 2);
    }
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 6), new THREE.MeshBasicMaterial({ color: 0xff8a1e }));
    flame.position.set(camp.x, campY + 0.6, camp.z);
    root.add(flame);
    const fireLight = new THREE.PointLight(0xff9a3c, 3, 14);
    fireLight.position.set(camp.x, campY + 1.2, camp.z);
    root.add(fireLight);
    addCollider(camp.x, camp.z, 1);
  }

  // Beetle Barrows (if this zone has one): standing stones in a ring, and two grassy mounds.
  const barrows = regionOf('barrows');
  if (barrows) {
    const stoneGeo = new THREE.BoxGeometry(1.2, 3.5, 0.8);
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      const sx = barrows.x + 13 * Math.cos(a);
      const sz = barrows.z + 13 * Math.sin(a);
      const stone = addMesh(stoneGeo, 0x7f7f78, root, sx, heightAt(sx, sz) + 1.75, sz);
      stone.rotation.set(0, rng() * Math.PI, (rng() - 0.5) * 0.1);
      addCollider(sx, sz, 0.9);
    }
    for (const a of [0, Math.PI]) {
      const mx = barrows.x + 6 * Math.cos(a);
      const mz = barrows.z + 6 * Math.sin(a);
      const mound = addMesh(new THREE.SphereGeometry(4, 10, 6), 0x6f8a55, root, mx, heightAt(mx, mz), mz);
      mound.scale.y = 0.35;
      addCollider(mx, mz, 3.2);
    }
  }

  // Grubthorn's Burrow (if this zone has one): dirt heaps round a black pit.
  const burrow = regionOf('burrow');
  if (burrow) {
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      const hx = burrow.x + 10 * Math.cos(a);
      const hz = burrow.z + 10 * Math.sin(a);
      addMesh(new THREE.ConeGeometry(2.2, 2, 7), 0x6b5038, root, hx, heightAt(hx, hz) + 1, hz);
      addCollider(hx, hz, 1.8);
    }
    addMesh(new THREE.CircleGeometry(2.2, 16).rotateX(-Math.PI / 2), 0x1a120c, root, burrow.x, heightAt(burrow.x, burrow.z) + 0.05, burrow.z);
  }

  // Signposts at the middle of each road.
  for (const r of zone.regions) {
    if (!far(r.x, r.z)) continue;
    const mx = (shrine.x + r.x) / 2;
    const mz = (shrine.z + r.z) / 2;
    const my = heightAt(mx, mz);
    addMesh(new THREE.BoxGeometry(0.15, 1.6, 0.15), 0x8b6a3e, root, mx, my + 0.8, mz);
    const board = addMesh(new THREE.BoxGeometry(1.2, 0.35, 0.08), 0x8b6a3e, root, mx, my + 1.4, mz);
    board.rotation.y = Math.atan2(r.x - shrine.x, r.z - shrine.z);
    addCollider(mx, mz, 0.3);
  }

  // Blocking walls, and the ring round an indoor zone.
  const wallColour = zone.indoor ? 0x8b4a3a : 0x8a8a84;
  for (const w of zone.walls ?? []) addWall(w.x1, w.z1, w.x2, w.z2, 4, wallColour, root);
  if (zone.indoor) {
    const h = half - 0.75;
    addWall(-h, -h, h, -h, 8, 0x8b4a3a, root);
    addWall(h, -h, h, h, 8, 0x8b4a3a, root);
    addWall(h, h, -h, h, 8, 0x8b4a3a, root);
    addWall(-h, h, -h, -h, 8, 0x8b4a3a, root);
  }

  // Exits: glowing rings and signs.
  for (const exit of zone.exits) buildExit(exit, root);
  updateExitVisibility();
}

function disposeMaterial(mat: THREE.Material): void {
  const map = (mat as THREE.MeshBasicMaterial).map;
  if (map) map.dispose();
  mat.dispose();
}

/** Removes the built zone's group from the scene and disposes its geometry, materials and colliders. Safe when nothing is built. */
export function clearWorld(scene: THREE.Scene): void {
  if (worldGroup) {
    scene.remove(worldGroup);
    worldGroup.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => disposeMaterial(x));
      else if (mat) disposeMaterial(mat);
    });
    worldGroup = null;
  }
  ground = null;
  colliders = new Map();
  mats = new Map();
  exitViews = [];
  roads = [];
}

/** The ground mesh, for raycasting clicks. */
export function getGroundMesh(): THREE.Object3D {
  if (!ground) throw new Error('buildWorld first');
  return ground;
}

/** Name of the region containing (x, z), or 'the Wilds'. */
export function regionNameAt(x: number, z: number): string {
  for (const r of zone.regions) {
    if (Math.hypot(x - r.x, z - r.z) <= r.r + 6) return r.name;
  }
  return 'the Wilds';
}
