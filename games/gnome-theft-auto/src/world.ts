// Builds the world: Turfton (the grid city of roads, sidewalks, towers, garden-object buildings and the park), the
// winding highways and the road graph, the coloured ground of the four biomes, and then calls buildBiomes for
// everything that stands out there (Fort Sandpit, the airfield, the villages and farms).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildPrefab } from '@lawn/prefabs';
import {
  AIRFIELD, BASE, BIOME_GROUND, BUILDINGS, CITY_HALF, COLORS, HIGHWAYS, LANE_OFFSET, ROAD_LINES, ROAD_WIDTH,
  HOSPITAL, SIDEWALK_WIDTH, SPAWN, VIEW, WORLD_HALF, biomeAt,
} from './config';
import { insideBox } from './collide';
import { type GroundKind, TILE, groundTexture, planarUv } from './textures';
import { buildBiomes } from './biomes';
import type { BiomeId, Box, ParkedSpot, RoadNode, VehicleKind, World } from './types';

const H = WORLD_HALF;
const HALF_ROAD = ROAD_WIDTH / 2;
/** Centre of a sidewalk strip, from the road centre line. */
const SIDE_OFF = HALF_ROAD + SIDEWALK_WIDTH / 2;
const BLOCK_INSET = HALF_ROAD + SIDEWALK_WIDTH + 1.5;
/** Parked mowers sit this far from the road centre line (kerb side). */
const KERB = HALF_ROAD - 1.2;
const GAP = 0.5;
/** Blocks run between the city edge and the grid roads (the outermost ones end at the city edge). */
const EDGES: number[] = [-CITY_HALF, ...ROAD_LINES, CITY_HALF];
/** Every grid road runs the whole city. */
const CITY_SEG: Seg = [-CITY_HALF, CITY_HALF];
/** A block centre that gets the park (its centre is (-30, 30): the block between x -60..0 and z 0..60). */
const PARK_CENTRE = { x: -30, z: 30 };
/** Window texture tile: 4 x 4 windows, each window 2.5 wide and 3 tall (units). */
const WIN_W = 2.5;
const WIN_H = 3;
const TILE_W = WIN_W * 4;
const TILE_H = WIN_H * 4;
/** Highway proximity margin for boxes: half a road plus a little gap. */
const HW_MARGIN = HALF_ROAD + 1.5;
const GARDEN: [string, number][] = [
  ['flower-pot', 12], ['garden-shed', 14], ['birdbath', 10], ['mailbox', 8], ['watering-can', 12], ['wheelbarrow', 12],
  ['brick-stack', 10], ['compost-heap', 12], ['round-bush', 8], ['cone-pine', 8], ['stone-fountain', 10],
];

type Seg = [number, number];
/** 'vert': road at x = v running along z. 'horz': road at z = v running along x. */
type Axis = 'vert' | 'horz';
interface Rect { minX: number; maxX: number; minZ: number; maxZ: number }
/** A prefab measured once: its scale, its yaw and its footprint around the origin. */
interface Measure { id: string; s: number; yaw: number; hw: number; hd: number; ox: number; oz: number }

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

const overlap = (a: Rect, b: Rect, gap = 0): boolean =>
  a.minX < b.maxX + gap && a.maxX > b.minX - gap && a.minZ < b.maxZ + gap && a.maxZ > b.minZ - gap;
const inSegs = (t: number, segs: Seg[]): boolean => segs.some(([a, b]) => t >= a && t <= b);

/** Cut `cuts` out of `segs`. */
function subtract(segs: Seg[], cuts: Seg[]): Seg[] {
  let out = segs;
  for (const [c0, c1] of cuts) {
    const next: Seg[] = [];
    for (const [a, b] of out) {
      if (c1 <= a || c0 >= b) { next.push([a, b]); continue; }
      if (c0 > a) next.push([a, c0]);
      if (c1 < b) next.push([c1, b]);
    }
    out = next;
  }
  return out;
}

/** The body of every crossing road, along a road's own direction (sidewalks and centre lines stop there). */
const crossCuts = (): Seg[] => ROAD_LINES.map((w): Seg => [w - HALF_ROAD, w + HALF_ROAD]);

function strip(into: THREE.BufferGeometry[], axis: Axis, v: number, off: number, width: number, a: number, b: number, y: number): void {
  const g = axis === 'vert' ? new THREE.PlaneGeometry(width, b - a) : new THREE.PlaneGeometry(b - a, width);
  g.rotateX(-Math.PI / 2);
  if (axis === 'vert') g.translate(v + off, y, (a + b) / 2);
  else g.translate((a + b) / 2, y, v + off);
  into.push(g);
}

/** A flat bar of `width` from (ax, az) to (bx, bz) lying on the ground at height y. */
function bar(into: THREE.BufferGeometry[], ax: number, az: number, bx: number, bz: number, width: number, y: number): void {
  const dx = bx - ax, dz = bz - az;
  const len = Math.hypot(dx, dz);
  // Three.js rotation.y maps +x to (cos, 0, -sin), so the bar's direction (dx, dz) needs yaw atan2(-dz, dx).
  const g = new THREE.PlaneGeometry(len, width)
    .rotateX(-Math.PI / 2)
    .rotateY(Math.atan2(-dz, dx))
    .translate((ax + bx) / 2, y, (az + bz) / 2);
  into.push(g);
}

function merged(geos: THREE.BufferGeometry[], color: number, offsetFactor: number, kind?: GroundKind): THREE.Mesh | null {
  if (geos.length === 0) return null;
  const geo = mergeGeometries(geos, false);
  if (!geo) return null;
  if (kind) planarUv(geo, TILE[kind]);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: kind ? 0xffffff : color, ...(kind ? { map: groundTexture(kind), roughness: 1 } : {}),
    polygonOffset: true, polygonOffsetFactor: offsetFactor, polygonOffsetUnits: offsetFactor,
  }));
  mesh.receiveShadow = true;
  return mesh;
}

/** One merged mesh of geometries sharing a material (casts and receives shadows). */
function addMerged(scene: THREE.Scene, geos: THREE.BufferGeometry[], material: THREE.Material): void {
  if (geos.length === 0) return;
  const geo = mergeGeometries(geos, false);
  if (!geo) return;
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

/** A two-triangle-or-more ground patch at height y (flat, facing up). */
function groundPoly(pts: [number, number][], y: number): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(pts.length * 3);
  const n = new Float32Array(pts.length * 3);
  pts.forEach(([x, z], i) => {
    p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z;
    n[i * 3 + 1] = 1;
  });
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  return g;
}

/**
 * Scale a box's UVs so one window tile covers TILE_W x TILE_H units whatever the box size (window size stays the same).
 * BoxGeometry builds its faces in the order px, nx, py, ny, pz, nz, four vertices each.
 */
function scaleUvs(g: THREE.BoxGeometry, w: number, h: number, d: number): THREE.BoxGeometry {
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  const sx = [d, d, w, w, w, w].map((v) => v / TILE_W);
  const sy = [h, h, d, d, h, h].map((v) => v / TILE_H);
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * sx[f], uv.getY(i) * sy[f]);
    }
  }
  uv.needsUpdate = true;
  return g;
}

/** Draw all the instances of one prefab as one InstancedMesh per part (no mesh per lamp). */
function instanceParts(scene: THREE.Scene, template: THREE.Group, placements: THREE.Matrix4[]): void {
  if (placements.length === 0) return;
  template.updateMatrixWorld(true);
  const parts: THREE.Mesh[] = [];
  template.traverse((o) => { if (o instanceof THREE.Mesh) parts.push(o); });
  for (const part of parts) {
    const inst = new THREE.InstancedMesh(part.geometry, part.material as THREE.Material, placements.length);
    const local = new THREE.Matrix4();
    placements.forEach((m, i) => {
      local.multiplyMatrices(m, part.matrixWorld);
      inst.setMatrixAt(i, local);
    });
    inst.instanceMatrix.needsUpdate = true;
    inst.castShadow = true;
    inst.receiveShadow = true;
    scene.add(inst);
  }
}

// Prefab measuring. Each prefab's local box is read once at scale 1, then the scaled, rotated footprint is worked out
// without building it, so a placement can be rejected before any mesh exists.
const protoCache = new Map<string, THREE.Box3>();
function localBox(id: string): THREE.Box3 {
  let b = protoCache.get(id);
  if (!b) {
    b = new THREE.Box3().setFromObject(buildPrefab(id, { lights: false }));
    protoCache.set(id, b);
  }
  return b;
}

function measure(id: string, how: { scale: number } | { footprint: number }, yaw: number): Measure {
  const lb = localBox(id);
  const sx = lb.max.x - lb.min.x;
  const sz = lb.max.z - lb.min.z;
  const s = 'scale' in how ? how.scale : how.footprint / Math.max(sx, sz);
  const c = Math.cos(yaw);
  const sn = Math.sin(yaw);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const x0 of [lb.min.x, lb.max.x]) {
    for (const z0 of [lb.min.z, lb.max.z]) {
      const x = x0 * s;
      const z = z0 * s;
      // Three.js rotation.y: x' = c*x + s*z, z' = -s*x + c*z.
      const rx = c * x + sn * z;
      const rz = -sn * x + c * z;
      minX = Math.min(minX, rx); maxX = Math.max(maxX, rx);
      minZ = Math.min(minZ, rz); maxZ = Math.max(maxZ, rz);
    }
  }
  return { id, s, yaw, hw: (maxX - minX) / 2, hd: (maxZ - minZ) / 2, ox: -(minX + maxX) / 2, oz: -(minZ + maxZ) / 2 };
}

/** Build a measured prefab with its footprint centred on (cx, cz). */
function instantiate(scene: THREE.Scene, m: Measure, cx: number, cz: number, tint?: number, lights = true): THREE.Group {
  const g = buildPrefab(m.id, { lights, ...(tint !== undefined ? { tint } : {}) });
  g.scale.setScalar(m.s);
  g.rotation.y = m.yaw;
  g.position.set(cx + m.ox, 0, cz + m.oz);
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  scene.add(g);
  return g;
}

function boxOf(g: THREE.Group): Box {
  g.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(g);
  return { minX: bb.min.x, maxX: bb.max.x, minZ: bb.min.z, maxZ: bb.max.z, h: bb.max.y };
}

/** Points sampled every half unit along every highway leg: a cheap way to ask "is this near a highway?". */
const highwaySamples: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (const hw of HIGHWAYS) {
    for (let k = 0; k + 1 < hw.points.length; k++) {
      const [ax, az] = hw.points[k];
      const [bx, bz] = hw.points[k + 1];
      const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.5));
      for (let s = 0; s <= steps; s++) out.push([ax + ((bx - ax) * s) / steps, az + ((bz - az) * s) / steps]);
    }
  }
  return out;
})();

/** True when a rectangle (grown by margin) comes within reach of a highway's centre line. */
function nearHighway(r: Rect, margin: number): boolean {
  for (const [x, z] of highwaySamples) {
    if (x > r.minX - margin && x < r.maxX + margin && z > r.minZ - margin && z < r.maxZ + margin) return true;
  }
  return false;
}

/** A window-grid texture: a 4 x 4 tile of windows, each lit or dark at random (seeded), shared by all towers. */
function windowTexture(rnd: () => number, wall: string, lit: string, dark: string, frame: string): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const c = cv.getContext('2d');
  if (c) {
    c.fillStyle = wall;
    c.fillRect(0, 0, 256, 256);
    // Wall: speckle, faint panel seams and soot streaks under every window.
    for (let i = 0; i < 1800; i++) {
      c.globalAlpha = 0.12 + rnd() * 0.12;
      c.fillStyle = rnd() < 0.5 ? '#000' : '#fff';
      c.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    c.globalAlpha = 0.18;
    c.fillStyle = '#000';
    for (let y = 0; y < 256; y += 32) c.fillRect(0, y, 256, 1);
    c.globalAlpha = 1;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = col * 64, y = row * 64;
        // Frame, then the glass as a gradient (a lit room glows warm at the bottom, a dark one reflects the sky), a
        // cross of mullions, a sill and a soot streak below.
        c.fillStyle = frame;
        c.fillRect(x + 4, y + 4, 56, 56);
        const isLit = rnd() < 0.45;
        const gr = c.createLinearGradient(0, y + 10, 0, y + 54);
        if (isLit) { gr.addColorStop(0, lit); gr.addColorStop(1, '#e0a14a'); } else { gr.addColorStop(0, '#6f8fa8'); gr.addColorStop(1, dark); }
        c.fillStyle = gr;
        c.fillRect(x + 10, y + 10, 44, 44);
        if (!isLit) {
          c.globalAlpha = 0.25;
          c.fillStyle = '#fff';
          c.beginPath();
          c.moveTo(x + 10, y + 10); c.lineTo(x + 30, y + 10); c.lineTo(x + 10, y + 34);
          c.closePath();
          c.fill();
          c.globalAlpha = 1;
        }
        c.fillStyle = frame;
        c.fillRect(x + 31, y + 10, 2, 44);
        c.fillRect(x + 10, y + 31, 44, 2);
        c.fillStyle = '#00000033';
        c.fillRect(x + 4, y + 60, 56, 3);
        c.globalAlpha = 0.14;
        c.fillStyle = '#000';
        c.fillRect(x + 14 + rnd() * 20, y + 63, 3 + rnd() * 4, 1);
        c.globalAlpha = 1;
      }
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildWorld(scene: THREE.Scene, _renderer: THREE.WebGLRenderer): World {
  const rnd = mulberry32(7);
  const boxes: Box[] = [];
  const walkPoints: { x: number; z: number }[] = [];

  // ---- Sky, fog and light -------------------------------------------------------------------------------------------
  scene.background = new THREE.Color(COLORS.sky);
  scene.fog = new THREE.Fog(COLORS.sky, VIEW.fogNear, VIEW.fogFar);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a6b3a, 0.9));
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.6);
  sun.position.set(SPAWN.x + 60, 100, SPAWN.z + 40);
  sun.target.position.set(SPAWN.x, 0, SPAWN.z);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -140; sc.right = 140; sc.top = 140; sc.bottom = -140; sc.near = 1; sc.far = 300;
  sc.updateProjectionMatrix();
  scene.add(sun);
  scene.add(sun.target);

  // ---- Ground: the city colour everywhere, then one triangle per biome, then the city square on top -----------------
  // Layers (y, polygonOffset): base 0; biome triangles 0.004; city square 0.008 (-1); roads 0.02 (-2); sidewalks
  // 0.03 (-3); centre lines 0.04 (-4). Each layer sits over the one below, so nothing z-fights.
  const baseGeo = new THREE.PlaneGeometry(H * 2, H * 2).rotateX(-Math.PI / 2);
  planarUv(baseGeo, TILE.grass);
  const base = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, map: groundTexture('grass'), roughness: 1 }));
  base.receiveShadow = true;
  // Well below the biome wedges (0.004): at 300+ units away a smaller gap z-fights and the grass shows through them.
  base.position.y = -0.12;
  scene.add(base);
  const biomeTris: [BiomeId, [number, number][]][] = [
    ['desert', [[0, 0], [H, -H], [H, H]]],
    ['forest', [[0, 0], [-H, H], [-H, -H]]],
    ['tundra', [[0, 0], [-H, -H], [H, -H]]],
    ['farmland', [[0, 0], [H, H], [-H, H]]],
  ];
  // The wedges are wound facing up (+y) so they are lit like the rest of the ground; a downward-facing triangle gets
  // flipped normals and renders almost black (the forest did).
  for (const [biome, pts] of biomeTris) {
    const [a, b, c] = pts;
    const up = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const kind: GroundKind = { desert: 'sand', forest: 'forest', tundra: 'snow', farmland: 'farm', city: 'grass' }[biome] as GroundKind;
    const mesh = merged([groundPoly(up > 0 ? [a, c, b] : pts, 0.004)], BIOME_GROUND[biome], -0.5, kind);
    if (mesh) scene.add(mesh);
  }
  const citySquare = merged([
    new THREE.PlaneGeometry(CITY_HALF * 2, CITY_HALF * 2).rotateX(-Math.PI / 2).translate(0, 0.008, 0),
  ], BIOME_GROUND.city, -1, 'grass');
  if (citySquare) scene.add(citySquare);

  // ---- Roads: city grid, highways (merged per colour) -------------------------------------------------------------
  const roadGeos: THREE.BufferGeometry[] = [];
  const sidewalkGeos: THREE.BufferGeometry[] = [];
  const lineGeos: THREE.BufferGeometry[] = [];
  for (const axis of ['vert', 'horz'] as Axis[]) {
    for (const v of ROAD_LINES) {
      const clear = subtract([CITY_SEG], crossCuts());
      strip(roadGeos, axis, v, 0, ROAD_WIDTH, -CITY_HALF, CITY_HALF, 0.02);
      for (const side of [-1, 1]) {
        for (const [a, b] of clear) strip(sidewalkGeos, axis, v, side * SIDE_OFF, SIDEWALK_WIDTH, a, b, 0.03);
      }
      for (const [a, b] of clear) {
        for (let t = a; t + 3 <= b; t += 6) strip(lineGeos, axis, v, 0, 0.25, t, t + 3, 0.04);
      }
    }
  }
  for (const hw of HIGHWAYS) {
    for (const [x, z] of hw.points) {
      // Round cap at every vertex so the corners look joined.
      roadGeos.push(new THREE.CircleGeometry(HALF_ROAD, 16).rotateX(-Math.PI / 2).translate(x, 0.02, z));
    }
    for (let k = 0; k + 1 < hw.points.length; k++) {
      const [ax, az] = hw.points[k];
      const [bx, bz] = hw.points[k + 1];
      bar(roadGeos, ax, az, bx, bz, ROAD_WIDTH, 0.02);
      const len = Math.hypot(bx - ax, bz - az);
      const ux = (bx - ax) / len, uz = (bz - az) / len;
      for (let t = 0; t + 3 <= len; t += 6) {
        bar(lineGeos, ax + ux * t, az + uz * t, ax + ux * (t + 3), az + uz * (t + 3), 0.25, 0.04);
      }
    }
  }
  for (const mesh of [
    merged(roadGeos, COLORS.road, -2, 'asphalt'),
    merged(sidewalkGeos, COLORS.sidewalk, -3, 'pavement'),
    merged(lineGeos, COLORS.roadLine, -4),
  ]) {
    if (mesh) scene.add(mesh);
  }

  // ---- Road graph ---------------------------------------------------------------------------------------------------
  const nodes: RoadNode[] = [];
  const nodeAt = new Map<string, number>();
  const keyOf = (x: number, z: number): string => `${Math.round(x * 100)},${Math.round(z * 100)}`;
  const nodeId = (x: number, z: number): number => {
    const k = keyOf(x, z);
    let id = nodeAt.get(k);
    if (id === undefined) {
      id = nodes.length;
      nodeAt.set(k, id);
      nodes.push({ id, x, z, links: [] });
    }
    return id;
  };
  const link = (a: number, b: number): void => {
    if (a === b) return;
    if (!nodes[a].links.includes(b)) nodes[a].links.push(b);
    if (!nodes[b].links.includes(a)) nodes[b].links.push(a);
  };
  // The 49 grid crossings, linked to their grid neighbours.
  ROAD_LINES.forEach((x, i) => {
    ROAD_LINES.forEach((z, j) => {
      const id = nodeId(x, z);
      if (i > 0) link(id, nodeId(ROAD_LINES[i - 1], z));
      if (j > 0) link(id, nodeId(x, ROAD_LINES[j - 1]));
    });
  });
  // Highways: a node at every vertex, and extra nodes so no leg is longer than 40 units.
  for (const hw of HIGHWAYS) {
    let prev = nodeId(hw.points[0][0], hw.points[0][1]);
    for (let k = 0; k + 1 < hw.points.length; k++) {
      const [ax, az] = hw.points[k];
      const [bx, bz] = hw.points[k + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 40));
      for (let s = 1; s <= n; s++) {
        const id = s === n ? nodeId(bx, bz) : nodeId(ax + ((bx - ax) * s) / n, az + ((bz - az) * s) / n);
        link(prev, id);
        prev = id;
      }
    }
  }

  // ---- Blocks: towers downtown, garden-object buildings elsewhere, and the park --------------------------------------
  const towerGeos: THREE.BufferGeometry[][] = [[], [], [], []];
  const roofGeos: THREE.BufferGeometry[] = [];
  const detailGeos: THREE.BufferGeometry[] = [];
  const lightGeos: THREE.BufferGeometry[] = [];

  /** The park: fountain, picnic tables and bushes (the old layout shifted to the park block). */
  const buildPark = (): void => {
    const { x: px, z: pz } = PARK_CENTRE;
    boxes.push(boxOf(instantiate(scene, measure('stone-fountain', { footprint: 8 }, 0), px, pz)));
    for (const [x, z] of [[-39, 20], [-21, 20], [-39, 40], [-21, 40]]) {
      boxes.push(boxOf(instantiate(scene, measure('picnic-table', { scale: 1.6 }, 0), x, z)));
    }
    for (const [x, z] of [[-40, 31], [-19, 31]]) {
      instantiate(scene, measure('round-bush', { footprint: 4 }, 0), x, z);
    }
  };
  const parkWalkPoints = (): void => {
    for (const [x, z] of [[-30, 17], [-43, 27], [-17, 27], [-43, 37], [-17, 37], [-30, 43], [-33, 21], [-27, 41]]) {
      if (walkPoints.filter((p) => p.x > -46 && p.x < -14 && p.z > 14 && p.z < 46).length >= 6) break;
      if (!insideBox(x, 0.5, z, boxes)) walkPoints.push({ x, z });
    }
  };
  const placeBuilding = (block: Rect): void => {
    const [id] = GARDEN[Math.floor(rnd() * GARDEN.length)];
    const footprint = BUILDINGS.gardenMinFootprint + rnd() * (BUILDINGS.gardenMaxFootprint - BUILDINGS.gardenMinFootprint);
    const m = measure(id, { footprint }, Math.floor(rnd() * 4) * (Math.PI / 2));
    const x0 = block.minX + m.hw, x1 = block.maxX - m.hw;
    const z0 = block.minZ + m.hd, z1 = block.maxZ - m.hd;
    if (x1 < x0 || z1 < z0) return;
    for (let attempt = 0; attempt < 20; attempt++) {
      const cx = x0 + rnd() * (x1 - x0);
      const cz = z0 + rnd() * (z1 - z0);
      const r: Rect = { minX: cx - m.hw, maxX: cx + m.hw, minZ: cz - m.hd, maxZ: cz + m.hd };
      if (boxes.some((b) => overlap(r, b, GAP))) continue;
      if (nearHighway(r, HW_MARGIN)) continue;
      boxes.push(boxOf(instantiate(scene, m, cx, cz)));
      return;
    }
  };
  /** One tower body (stepped or not), its roof slab and maybe a water tank or an antenna with a red light. */
  const addTower = (tx: number, tz: number, w: number, d: number, h: number): void => {
    const pal = Math.floor(rnd() * 4);
    const stepped = rnd() < 0.35;
    const bodyH = stepped ? h * 0.7 : h;
    towerGeos[pal].push(scaleUvs(new THREE.BoxGeometry(w, bodyH, d).translate(tx, bodyH / 2, tz), w, bodyH, d));
    let top = bodyH;
    let roofW = w, roofD = d;
    if (stepped) {
      const uw = w * 0.6, ud = d * 0.6, uh = h - bodyH;
      towerGeos[pal].push(scaleUvs(new THREE.BoxGeometry(uw, uh, ud).translate(tx, bodyH + uh / 2, tz), uw, uh, ud));
      top = h;
      roofW = uw;
      roofD = ud;
    }
    roofGeos.push(new THREE.BoxGeometry(roofW + 1.2, 1, roofD + 1.2).translate(tx, top + 0.5, tz));
    const r = rnd();
    if (r < 0.35) {
      detailGeos.push(new THREE.CylinderGeometry(1.4, 1.4, 3, 10).translate(tx + roofW * 0.25, top + 2.5, tz - roofD * 0.25));
    } else if (r < 0.7) {
      detailGeos.push(new THREE.CylinderGeometry(0.12, 0.12, 6, 6).translate(tx, top + 4, tz));
      lightGeos.push(new THREE.SphereGeometry(0.35, 8, 6).translate(tx, top + 7.2, tz));
    }
    boxes.push({ minX: tx - w / 2, maxX: tx + w / 2, minZ: tz - d / 2, maxZ: tz + d / 2, h });
  };
  /** 1 or 2 towers in a downtown block: one centred, or two side by side in the block's two halves. */
  const placeTowers = (block: Rect): void => {
    const bw = block.maxX - block.minX, bd = block.maxZ - block.minZ;
    const cx = (block.minX + block.maxX) / 2, cz = (block.minZ + block.maxZ) / 2;
    const n = 1 + Math.floor(rnd() * 2);
    for (let k = 0; k < n; k++) {
      const maxW = n === 1 ? bw - 4 : bw / 2 - 2;
      const f = BUILDINGS.towerMinFootprint + rnd() * (BUILDINGS.towerMaxFootprint - BUILDINGS.towerMinFootprint);
      const w = Math.min(f, maxW);
      const d = Math.min(f, bd - 4);
      const tx = n === 1 ? cx : cx + (k === 0 ? -bw / 4 : bw / 4);
      const h = BUILDINGS.towerMinHeight + rnd() * (BUILDINGS.towerMaxHeight - BUILDINGS.towerMinHeight);
      addTower(tx, cz, w, d, h);
    }
  };

  for (let i = 0; i < EDGES.length - 1; i++) {
    for (let j = 0; j < EDGES.length - 1; j++) {
      const block: Rect = {
        minX: EDGES[i] + BLOCK_INSET, maxX: EDGES[i + 1] - BLOCK_INSET,
        minZ: EDGES[j] + BLOCK_INSET, maxZ: EDGES[j + 1] - BLOCK_INSET,
      };
      const cx = (EDGES[i] + EDGES[i + 1]) / 2;
      const cz = (EDGES[j] + EDGES[j + 1]) / 2;
      if (cx === PARK_CENTRE.x && cz === PARK_CENTRE.z) { buildPark(); continue; }
      if (cx === HOSPITAL.x && cz === HOSPITAL.z) {
        boxes.push(boxOf(instantiate(scene, measure('gta-hospital', { footprint: HOSPITAL.footprint }, -Math.PI / 2), cx, cz)));
        continue;
      }
      if (Math.hypot(cx, cz) <= BUILDINGS.downtownRadius) { placeTowers(block); continue; }
      const count = 1 + Math.floor(rnd() * 3);
      for (let k = 0; k < count; k++) placeBuilding(block);
    }
  }
  const tex = [
    windowTexture(rnd, '#a8553a', '#ffe7a3', '#3b2d2a', '#7a3b2a'), // warm brick
    windowTexture(rnd, '#3f7fb5', '#dff6ff', '#1d3f5e', '#2b5a80'), // glass blue
    windowTexture(rnd, '#9aa0a6', '#fff8dc', '#4a4f55', '#7b8086'), // concrete grey
    windowTexture(rnd, '#d9c08b', '#fff3c4', '#6e5a3c', '#b89f6a'), // sandstone
  ];
  tex.forEach((t, pal) => addMerged(scene, towerGeos[pal], new THREE.MeshStandardMaterial({ map: t })));
  addMerged(scene, roofGeos, new THREE.MeshStandardMaterial({ color: 0x6e6e74 }));
  addMerged(scene, detailGeos, new THREE.MeshStandardMaterial({ color: 0x9aa0a6 }));
  addMerged(scene, lightGeos, new THREE.MeshStandardMaterial({ color: 0xd93636, emissive: 0x551010 }));

  // Street lamps: every 25 units along the outer edge of each sidewalk, one instanced mesh per lamp part.
  const lampTemplate = buildPrefab('mushroom-lamp', { scale: 1.4, lights: false });
  const lampPlacements: THREE.Matrix4[] = [];
  for (const axis of ['vert', 'horz'] as Axis[]) {
    for (const v of ROAD_LINES) {
      const clear = subtract([CITY_SEG], crossCuts());
      for (const side of [-1, 1]) {
        for (let k = 0; k < 18; k++) {
          const t = -212.5 + 25 * k;
          if (!inSegs(t, clear)) continue;
          const off = v + side * (HALF_ROAD + SIDEWALK_WIDTH);
          const x = axis === 'vert' ? off : t;
          const z = axis === 'vert' ? t : off;
          lampPlacements.push(new THREE.Matrix4().makeTranslation(x, 0, z));
        }
      }
    }
  }
  instanceParts(scene, lampTemplate, lampPlacements);

  // ---- The biomes: everything that stands on the biome ground (Fort Sandpit, the airfield, villages, farms) ----------
  const biomes = buildBiomes(scene, rnd);
  for (const b of biomes.boxes) boxes.push(b);

  // ---- Walk points on sidewalks (every 8 units, the middle of the strip) --------------------------------------------
  for (const axis of ['vert', 'horz'] as Axis[]) {
    for (const v of ROAD_LINES) {
      for (const side of [-1, 1]) {
        for (let t = -CITY_HALF + 1; t < CITY_HALF; t += 8) {
          if (!inSegs(t, [CITY_SEG]) || crossCuts().some(([a, b]) => t >= a && t <= b)) continue;
          const off = v + side * SIDE_OFF;
          const x = axis === 'vert' ? off : t;
          const z = axis === 'vert' ? t : off;
          if (Math.abs(x) > CITY_HALF || Math.abs(z) > CITY_HALF) continue;
          if (insideBox(x, 0.5, z, boxes)) continue;
          walkPoints.push({ x, z });
        }
      }
    }
  }
  parkWalkPoints();
  for (const p of biomes.walkPoints) walkPoints.push(p);

  // ---- Parked mowers (kerb side, not in a box, not on a highway, 6+ apart) -----------------------------------------
  const parked: ParkedSpot[] = [
    { x: -3.8, z: 22, yaw: 0, kind: 'ride-on' },
    { x: -3.8, z: 34, yaw: 0, kind: 'zero-turn' },
  ];
  for (const p of biomes.parked) parked.push(p);
  const restKinds: VehicleKind[] = [
    'ride-on', 'ride-on', 'ride-on', 'push-bike', 'push-bike', 'zero-turn', 'combine',
  ];
  const validSpot = (s: ParkedSpot, axis: Axis): boolean => {
    if (insideBox(s.x, 0.5, s.z, boxes)) return false;
    if (nearHighway({ minX: s.x, maxX: s.x, minZ: s.z, maxZ: s.z }, HALF_ROAD + 2)) return false;
    const along = axis === 'vert' ? s.z : s.x;
    if (ROAD_LINES.some((w) => Math.abs(along - w) < 8)) return false;
    if (Math.abs(along) > CITY_HALF - 8) return false;
    return parked.every((p) => Math.hypot(p.x - s.x, p.z - s.z) >= 6);
  };
  for (const kind of restKinds) {
    for (let tries = 0; tries < 400; tries++) {
      let spot: ParkedSpot;
      let axis: Axis;
      if (kind === 'combine') {
        // A combine sits on a city road line itself (the road is 10 wide, the combine is 6).
        axis = 'vert';
        const v = ROAD_LINES[Math.floor(rnd() * ROAD_LINES.length)];
        const z = -CITY_HALF + 15 + rnd() * (2 * CITY_HALF - 30);
        spot = { x: v, z, yaw: rnd() < 0.5 ? 0 : Math.PI, kind };
      } else {
        axis = rnd() < 0.5 ? 'vert' : 'horz';
        const v = ROAD_LINES[Math.floor(rnd() * ROAD_LINES.length)];
        const side = rnd() < 0.5 ? -1 : 1;
        const [a, b] = CITY_SEG;
        const t = a + 8 + rnd() * (b - a - 16);
        if (axis === 'vert') spot = { x: v + side * KERB, z: t, yaw: rnd() < 0.5 ? 0 : Math.PI, kind };
        else spot = { x: t, z: v + side * KERB, yaw: rnd() < 0.5 ? Math.PI / 2 : -Math.PI / 2, kind };
      }
      if (validSpot(spot, axis)) { parked.push(spot); break; }
    }
  }

  // ---- Road graph output and the World ------------------------------------------------------------------------------
  const world: World = {
    boxes,
    roads: { nodes, laneOffset: LANE_OFFSET },
    walkPoints,
    spawn: { ...SPAWN },
    hospital: { ...HOSPITAL.respawn },
    parked,
    base: {
      minX: BASE.minX, maxX: BASE.maxX, minZ: BASE.minZ, maxZ: BASE.maxZ,
      padX: BASE.padX, padZ: BASE.padZ, gateX: BASE.gateX, gateZ: BASE.gateZ,
      guardPosts: BASE.guardPosts.map((p) => ({ ...p })),
    },
    half: H,
    biomeAt,
    airfield: { ...AIRFIELD, planeSpots: AIRFIELD.planeSpots.map((p) => ({ ...p })) },
    update(dt: number, focusX: number, focusZ: number) {
      sun.target.position.set(focusX, 0, focusZ);
      sun.position.set(focusX + 60, 100, focusZ + 40);
      biomes.update(dt);
    },
  };
  return world;
}
