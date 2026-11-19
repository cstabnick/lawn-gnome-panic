// Builds Turfton: the grid town of roads and sidewalks, its giant garden-object buildings, and Fort Sandpit.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildPrefab } from '@lawn/prefabs';
import { AIRFIELD, BASE, COLORS, biomeAt, LANE_OFFSET, ROAD_LINES, ROAD_WIDTH, SIDEWALK_WIDTH, SPAWN, WORLD_HALF } from './config';
import { insideBox } from './collide';
import type { Box, ParkedSpot, RoadNode, VehicleKind, World } from './types';

const H = WORLD_HALF;
const HALF_ROAD = ROAD_WIDTH / 2;
/** Centre of a sidewalk strip, from the road centre line. */
const SIDE_OFF = HALF_ROAD + SIDEWALK_WIDTH / 2;
const BLOCK_INSET = HALF_ROAD + SIDEWALK_WIDTH + 1.5;
const WALL_T = 1.5;
/** Parked mowers sit this far from the road centre line (kerb side). */
const KERB = HALF_ROAD - 1.2;
const GAP = 0.5;
const EDGES: number[] = [-H, ...ROAD_LINES, H];
const BASE_GROWN = { minX: BASE.minX - 4, maxX: BASE.maxX + 4, minZ: BASE.minZ - 4, maxZ: BASE.maxZ + 4 };
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
const inBase = (x: number, z: number): boolean => x > BASE.minX && x < BASE.maxX && z > BASE.minZ && z < BASE.maxZ;
const inSegs = (t: number, segs: Seg[]): boolean => segs.some(([a, b]) => t >= a && t <= b);

/** Where a road exists along its own direction. The base cuts roads, except the x = 100 stub that ends at the gate. */
function roadSegs(axis: Axis, v: number): Seg[] {
  if (axis === 'vert') return v > BASE.minX ? [[BASE.maxZ, H]] : [[-H, H]];
  return v < BASE.maxZ ? [[-H, BASE.minX]] : [[-H, H]];
}

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

function merged(geos: THREE.BufferGeometry[], color: number, offsetFactor: number): THREE.Mesh | null {
  if (geos.length === 0) return null;
  const geo = mergeGeometries(geos, false);
  if (!geo) return null;
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color, polygonOffset: true, polygonOffsetFactor: offsetFactor, polygonOffsetUnits: offsetFactor,
  }));
  mesh.receiveShadow = true;
  return mesh;
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
const sizeOf = (id: string): THREE.Vector3 => localBox(id).getSize(new THREE.Vector3());

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

export function buildWorld(scene: THREE.Scene, _renderer: THREE.WebGLRenderer): World {
  const rnd = mulberry32(7);
  const boxes: Box[] = [];
  const walkPoints: { x: number; z: number }[] = [];
  const banners: THREE.Group[] = [];

  // ---- Sky and light ------------------------------------------------------------------------------------------
  scene.background = new THREE.Color(COLORS.sky);
  scene.fog = new THREE.Fog(COLORS.sky, 90, 230);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a6b3a, 0.9));
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.6);
  sun.position.set(60, 100, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -140; sc.right = 140; sc.top = 140; sc.bottom = -140; sc.near = 1; sc.far = 300;
  sc.updateProjectionMatrix();
  scene.add(sun);

  // ---- Ground -------------------------------------------------------------------------------------------------
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(H * 2, H * 2).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: COLORS.grass }),
  );
  ground.receiveShadow = true;
  scene.add(ground);

  // ---- Roads, sidewalks and centre lines (merged per colour) ---------------------------------------------------
  const roadGeos: THREE.BufferGeometry[] = [];
  const sidewalkGeos: THREE.BufferGeometry[] = [];
  const lineGeos: THREE.BufferGeometry[] = [];
  for (const axis of ['vert', 'horz'] as Axis[]) {
    for (const v of ROAD_LINES) {
      const segs = roadSegs(axis, v);
      const clear = subtract(segs, crossCuts());
      for (const [a, b] of segs) strip(roadGeos, axis, v, 0, ROAD_WIDTH, a, b, 0.02);
      for (const side of [-1, 1]) {
        for (const [a, b] of clear) strip(sidewalkGeos, axis, v, side * SIDE_OFF, SIDEWALK_WIDTH, a, b, 0.03);
      }
      for (const [a, b] of clear) {
        for (let t = a; t + 3 <= b; t += 6) strip(lineGeos, axis, v, 0, 0.25, t, t + 3, 0.04);
      }
    }
  }
  for (const mesh of [
    merged(roadGeos, COLORS.road, -1),
    merged(sidewalkGeos, COLORS.sidewalk, -2),
    merged(lineGeos, COLORS.roadLine, -3),
  ]) {
    if (mesh) scene.add(mesh);
  }

  // ---- Road graph ---------------------------------------------------------------------------------------------
  const nodes: RoadNode[] = [];
  const nodeAt = new Map<string, number>();
  const key = (i: number, j: number) => `${i},${j}`;
  ROAD_LINES.forEach((x, i) => {
    ROAD_LINES.forEach((z, j) => {
      if (x > BASE.minX && z < BASE.maxZ) return; // inside Fort Sandpit
      nodeAt.set(key(i, j), nodes.length);
      nodes.push({ id: nodes.length, x, z, links: [] });
    });
  });
  ROAD_LINES.forEach((_x, i) => {
    ROAD_LINES.forEach((_z, j) => {
      const id = nodeAt.get(key(i, j));
      if (id === undefined) return;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const other = nodeAt.get(key(i + di, j + dj));
        if (other !== undefined) nodes[id].links.push(other);
      }
    });
  });

  // ---- Blocks: buildings and the park -------------------------------------------------------------------------
  /** The park block (centre -25, 25): fountain, picnic tables and bushes. Its walk points are added at the end. */
  const buildPark = (): void => {
    boxes.push(boxOf(instantiate(scene, measure('stone-fountain', { footprint: 8 }, 0), -25, 25)));
    for (const [x, z] of [[-34, 15], [-16, 15], [-34, 35], [-16, 35]]) {
      boxes.push(boxOf(instantiate(scene, measure('picnic-table', { scale: 1.6 }, 0), x, z)));
    }
    for (const [x, z] of [[-35, 26], [-14, 26]]) {
      instantiate(scene, measure('round-bush', { footprint: 4 }, 0), x, z);
    }
  };
  const parkWalkPoints = (): void => {
    for (const [x, z] of [[-25, 12], [-38, 22], [-12, 22], [-38, 32], [-12, 32], [-25, 38], [-28, 16], [-22, 36]]) {
      if (walkPoints.filter((p) => p.x > -41 && p.x < -9 && p.z > 9 && p.z < 41).length >= 6) break;
      if (!insideBox(x, 0.5, z, boxes)) walkPoints.push({ x, z });
    }
  };
  const placeBuilding = (block: Rect): void => {
    const [id, footprint] = GARDEN[Math.floor(rnd() * GARDEN.length)];
    const m = measure(id, { footprint }, Math.floor(rnd() * 4) * (Math.PI / 2));
    const x0 = block.minX + m.hw, x1 = block.maxX - m.hw;
    const z0 = block.minZ + m.hd, z1 = block.maxZ - m.hd;
    if (x1 < x0 || z1 < z0) return;
    for (let attempt = 0; attempt < 20; attempt++) {
      const cx = x0 + rnd() * (x1 - x0);
      const cz = z0 + rnd() * (z1 - z0);
      const r: Rect = { minX: cx - m.hw, maxX: cx + m.hw, minZ: cz - m.hd, maxZ: cz + m.hd };
      if (boxes.some((b) => overlap(r, b, GAP))) continue;
      boxes.push(boxOf(instantiate(scene, m, cx, cz)));
      return;
    }
  };
  for (let i = 0; i < EDGES.length - 1; i++) {
    for (let j = 0; j < EDGES.length - 1; j++) {
      const block: Rect = {
        minX: EDGES[i] + BLOCK_INSET, maxX: EDGES[i + 1] - BLOCK_INSET,
        minZ: EDGES[j] + BLOCK_INSET, maxZ: EDGES[j + 1] - BLOCK_INSET,
      };
      if (overlap(block, BASE_GROWN)) continue;
      const cx = (EDGES[i] + EDGES[i + 1]) / 2;
      const cz = (EDGES[j] + EDGES[j + 1]) / 2;
      if (cx === -25 && cz === 25) { buildPark(); continue; }
      const count = 1 + Math.floor(rnd() * 4);
      for (let k = 0; k < count; k++) placeBuilding(block);
    }
  }

  // Street lamps: every 25 units along the outer edge of each sidewalk (no box).
  for (const axis of ['vert', 'horz'] as Axis[]) {
    for (const v of ROAD_LINES) {
      const segs = roadSegs(axis, v);
      const clear = subtract(segs, crossCuts());
      for (const side of [-1, 1]) {
        for (let k = 0; k < 10; k++) {
          const t = -112.5 + 25 * k;
          if (!inSegs(t, clear)) continue;
          const off = v + side * (HALF_ROAD + SIDEWALK_WIDTH);
          const x = axis === 'vert' ? off : t;
          const z = axis === 'vert' ? t : off;
          if (inBase(x, z)) continue;
          const lamp = buildPrefab('mushroom-lamp', { scale: 1.4, lights: false });
          lamp.position.set(x, 0, z);
          scene.add(lamp);
        }
      }
    }
  }

  // ---- Fort Sandpit -------------------------------------------------------------------------------------------
  const sandW = BASE.maxX - BASE.minX;
  const sandD = BASE.maxZ - BASE.minZ;
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(sandW, sandD).rotateX(-Math.PI / 2).translate((BASE.minX + BASE.maxX) / 2, 0.025, (BASE.minZ + BASE.maxZ) / 2),
    new THREE.MeshStandardMaterial({ color: COLORS.sand }),
  );
  sand.receiveShadow = true;
  scene.add(sand);

  const wallH = BASE.wallHeight;
  const tileSize = sizeOf('sandbag-wall');
  const tileS = wallH / tileSize.y;
  const tileLongX = tileSize.x >= tileSize.z;
  const tileLen = Math.max(tileSize.x, tileSize.z) * tileS;
  /** One wall run along x at z, from x0 to x1 (tiled, then one box). */
  const wallAlongX = (z: number, x0: number, x1: number): void => {
    const n = Math.max(1, Math.ceil((x1 - x0) / tileLen));
    const step = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      instantiate(scene, measure('sandbag-wall', { scale: tileS }, tileLongX ? 0 : Math.PI / 2), x0 + step * (i + 0.5), z);
    }
    boxes.push({ minX: x0, maxX: x1, minZ: z - WALL_T / 2, maxZ: z + WALL_T / 2, h: wallH });
  };
  /** One wall run along z at x, from z0 to z1. */
  const wallAlongZ = (x: number, z0: number, z1: number): void => {
    const n = Math.max(1, Math.ceil((z1 - z0) / tileLen));
    const step = (z1 - z0) / n;
    for (let i = 0; i < n; i++) {
      instantiate(scene, measure('sandbag-wall', { scale: tileS }, tileLongX ? Math.PI / 2 : 0), x, z0 + step * (i + 0.5));
    }
    boxes.push({ minX: x - WALL_T / 2, maxX: x + WALL_T / 2, minZ: z0, maxZ: z1, h: wallH });
  };
  wallAlongX(BASE.minZ, BASE.minX, BASE.maxX);
  wallAlongX(BASE.maxZ, BASE.minX, BASE.gateX - BASE.gateWidth / 2);
  wallAlongX(BASE.maxZ, BASE.gateX + BASE.gateWidth / 2, BASE.maxX);
  wallAlongZ(BASE.minX, BASE.minZ, BASE.maxZ);
  wallAlongZ(BASE.maxX, BASE.minZ, BASE.maxZ);

  const towerM = measure('watch-tower', { scale: 7 / sizeOf('watch-tower').y }, 0);
  for (const dx of [-9, 9]) boxes.push(boxOf(instantiate(scene, towerM, BASE.gateX + dx, BASE.maxZ - 4)));

  for (const [x, z] of [[70, -80], [75, -112], [112, -78]]) {
    boxes.push(boxOf(instantiate(scene, measure('hq-tent', { footprint: 8 }, Math.floor(rnd() * 4) * (Math.PI / 2)), x, z)));
  }

  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 0.06, 40),
    new THREE.MeshStandardMaterial({ color: 0x3a3d42 }),
  );
  pad.position.set(BASE.padX, 0.03, BASE.padZ);
  pad.receiveShadow = true;
  scene.add(pad);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(3.6, 4.2, 48).rotateX(-Math.PI / 2).translate(BASE.padX, 0.065, BASE.padZ),
    new THREE.MeshStandardMaterial({ color: 0xf2c230 }),
  );
  scene.add(ring);

  const crateM = measure('crate', { footprint: 2 }, 0);
  for (const [x, z] of [[62, -80], [62, -83], [84, -104], [84, -108]]) {
    boxes.push(boxOf(instantiate(scene, crateM, x, z)));
  }

  const bannerM = measure('team-banner', { scale: 3 }, 0);
  for (const [x, z] of [[120, -88], [84, -120]]) {
    banners.push(instantiate(scene, bannerM, x, z, 0x556b2f));
  }

  // ---- Walk points on sidewalks (every 8 units, the middle of the strip) -------------------------------------------
  for (const axis of ['vert', 'horz'] as Axis[]) {
    for (const v of ROAD_LINES) {
      const segs = roadSegs(axis, v);
      const cuts = crossCuts();
      for (const side of [-1, 1]) {
        for (let t = -128; t <= 128; t += 8) {
          if (!inSegs(t, segs) || cuts.some(([a, b]) => t >= a && t <= b)) continue;
          const off = v + side * SIDE_OFF;
          const x = axis === 'vert' ? off : t;
          const z = axis === 'vert' ? t : off;
          if (inBase(x, z) || Math.abs(x) > H - 2 || Math.abs(z) > H - 2) continue;
          if (insideBox(x, 0.5, z, boxes)) continue;
          walkPoints.push({ x, z });
        }
      }
    }
  }
  parkWalkPoints();

  // ---- Parked mowers (kerb side, not in the base, not in a box, 6+ apart) -------------------------------------------
  const parked: ParkedSpot[] = [
    { x: -3.8, z: 22, yaw: 0, kind: 'ride-on' },
    { x: -3.8, z: 34, yaw: 0, kind: 'zero-turn' },
  ];
  const restKinds: VehicleKind[] = [
    'ride-on', 'ride-on', 'ride-on', 'push-bike', 'push-bike', 'zero-turn', 'combine',
  ];
  const validSpot = (s: ParkedSpot, axis: Axis): boolean => {
    const nearBase = s.x > BASE.minX - 3 && s.x < BASE.maxX + 3 && s.z > BASE.minZ - 3 && s.z < BASE.maxZ + 3;
    if (nearBase) return false;
    if (insideBox(s.x, 0.5, s.z, boxes)) return false;
    const along = axis === 'vert' ? s.z : s.x;
    if (ROAD_LINES.some((w) => Math.abs(along - w) < 8)) return false;
    if (Math.abs(along) > H - 8) return false;
    return parked.every((p) => Math.hypot(p.x - s.x, p.z - s.z) >= 6);
  };
  for (const kind of restKinds) {
    for (let tries = 0; tries < 400; tries++) {
      let spot: ParkedSpot;
      let axis: Axis;
      if (kind === 'combine') {
        // The x = -100 road, 6 units wide, on the road itself.
        axis = 'vert';
        const z = -H + 15 + rnd() * (2 * H - 30);
        spot = { x: -101.5, z, yaw: rnd() < 0.5 ? 0 : Math.PI, kind };
      } else {
        axis = rnd() < 0.5 ? 'vert' : 'horz';
        const v = ROAD_LINES[Math.floor(rnd() * ROAD_LINES.length)];
        const side = rnd() < 0.5 ? -1 : 1;
        const segs = roadSegs(axis, v);
        const [a, b] = segs[Math.floor(rnd() * segs.length)];
        if (b - a < 16) continue;
        const t = a + 8 + rnd() * (b - a - 16);
        if (axis === 'vert') spot = { x: v + side * KERB, z: t, yaw: rnd() < 0.5 ? 0 : Math.PI, kind };
        else spot = { x: t, z: v + side * KERB, yaw: rnd() < 0.5 ? Math.PI / 2 : -Math.PI / 2, kind };
      }
      if (validSpot(spot, axis)) { parked.push(spot); break; }
    }
  }

  let time = 0;
  return {
    boxes,
    roads: { nodes, laneOffset: LANE_OFFSET },
    walkPoints,
    spawn: { ...SPAWN },
    parked,
    base: {
      minX: BASE.minX, maxX: BASE.maxX, minZ: BASE.minZ, maxZ: BASE.maxZ,
      padX: BASE.padX, padZ: BASE.padZ, gateX: BASE.gateX, gateZ: BASE.gateZ,
      guardPosts: BASE.guardPosts.map((p) => ({ ...p })),
    },
    half: H,
    biomeAt,
    airfield: { ...AIRFIELD, planeSpots: AIRFIELD.planeSpots.map((p) => ({ ...p })) },
    update(dt: number, _focusX: number, _focusZ: number) {
      time += dt;
      banners.forEach((g, i) => { g.rotation.z = Math.sin(time * 1.6 + i * 1.3) * 0.06; });
    },
  };
}
