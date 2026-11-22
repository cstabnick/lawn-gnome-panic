// The four biomes around Turfton (desert, forest, tundra, farmland), Fort Sandpit and the airfield (issue 1I).
// world.ts owns the ground meshes, the city and the highways; this module builds what stands on the biome ground.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildPrefab, buildStaticPrefabs, type StaticPrefabPlacement } from '@lawn/prefabs';
import { LAYER, flatLayer } from '@lawn/depth';
import { AIRFIELD, BASE, CITY_HALF, COLORS, HIGHWAYS, ROAD_WIDTH, WORLD_HALF, biomeAt } from './config';
import type { Box, BiomeId, DewBarrel, ParkedSpot, VehicleKind } from './types';

export interface BiomeBuild {
  /** Static colliders of everything built here (tree trunks, rocks, fort walls, hangars, cabins...). */
  boxes: Box[];
  /** Places pedestrians wander between (villages, the fort yard, farm yards). Never inside a box. */
  walkPoints: { x: number; z: number }[];
  /** Empty mowers to steal, kerb-side or yard-side in the biomes (not the planes: those are AIRFIELD.planeSpots). */
  parked: ParkedSpot[];
  /** Shootable Black Dew barrels placed in biomes. */
  dewBarrels: DewBarrel[];
  /** Animate scenery (banners, windsock). Called every frame by world.update. */
  update(dt: number): void;
}

interface Pt { x: number; z: number }
interface Rect { minX: number; maxX: number; minZ: number; maxZ: number }
/** A prefab measured at a scale and yaw: its footprint centre sits (ox, oz) away from its origin. */
interface Measure { id: string; s: number; yaw: number; hw: number; hd: number; ox: number; oz: number; h: number }
type Batch = StaticPrefabPlacement[];

const H = WORLD_HALF;
const TWO_PI = Math.PI * 2;
/** Grid cell for the box lookup. */
const CELL = 16;
/** Keep-out grown around Fort Sandpit and the airfield. */
const GROW = 6;
/** Distance from a highway centre line that scenery keeps clear (road half width plus 4). */
const ROAD_CLEAR = ROAD_WIDTH / 2 + 4;
const WALL_T = 1.5;

// ---- Prefab measuring (read once, then the footprint is worked out without building the prefab) -----------------
const protoCache = new Map<string, THREE.Box3>();
function localBox(id: string): THREE.Box3 {
  let b = protoCache.get(id);
  if (!b) {
    b = new THREE.Box3().setFromObject(buildPrefab(id, { lights: false }));
    protoCache.set(id, b);
  }
  return b;
}

function measure(id: string, s: number, yaw: number): Measure {
  const lb = localBox(id);
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
  return {
    id, s, yaw, hw: (maxX - minX) / 2, hd: (maxZ - minZ) / 2,
    ox: -(minX + maxX) / 2, oz: -(minZ + maxZ) / 2, h: lb.max.y * s,
  };
}

/** The scale that makes the prefab's longer side `footprint` units. */
function fit(id: string, footprint: number): number {
  const lb = localBox(id);
  return footprint / Math.max(lb.max.x - lb.min.x, lb.max.z - lb.min.z);
}

function shadowed(g: THREE.Object3D): THREE.Object3D {
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  return g;
}

// ---- Geometry helpers -------------------------------------------------------------------------------------------
const inRect = (r: Rect, x: number, z: number, g: number): boolean =>
  x > r.minX - g && x < r.maxX + g && z > r.minZ - g && z < r.maxZ + g;
const overlaps = (a: Rect, b: Rect): boolean =>
  a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
const rectOf = (cx: number, cz: number, hw: number, hd: number): Rect =>
  ({ minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd });
const growRect = (r: Rect, g: number): Rect =>
  ({ minX: r.minX - g, maxX: r.maxX + g, minZ: r.minZ - g, maxZ: r.maxZ + g });

function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

/** Distance from (x, z) to the nearest highway centre line. */
function roadDist(x: number, z: number): number {
  let d = Infinity;
  for (const h of HIGHWAYS) {
    for (let i = 0; i + 1 < h.points.length; i++) {
      const [ax, az] = h.points[i];
      const [bx, bz] = h.points[i + 1];
      d = Math.min(d, segDist(x, z, ax, az, bx, bz));
    }
  }
  return d;
}

/** Axis-aligned bounds of the airfield's runway (length along yaw, width across). */
const AF_HX = Math.abs(Math.sin(AIRFIELD.yaw)) * AIRFIELD.length / 2 + Math.abs(Math.cos(AIRFIELD.yaw)) * AIRFIELD.width / 2;
const AF_HZ = Math.abs(Math.cos(AIRFIELD.yaw)) * AIRFIELD.length / 2 + Math.abs(Math.sin(AIRFIELD.yaw)) * AIRFIELD.width / 2;

export function buildBiomes(scene: THREE.Scene, rnd: () => number): BiomeBuild {
  const boxes: Box[] = [];
  const walkPoints: Pt[] = [];
  const parked: ParkedSpot[] = [];
  const banners: THREE.Group[] = [];
  const steamPuffs: { mesh: THREE.Mesh; baseX: number; baseZ: number; phase: number; speed: number; maxH: number }[] = [];
  const flickers: { mat: THREE.MeshStandardMaterial; base: number; amp: number; speed: number }[] = [];
  let sock: THREE.Object3D | null = null;
  /** Zones scenery stays out of (fort, airfield, villages, yards, fields, landmarks), grown where they need clearance. */
  const reserved: Rect[] = [];
  const batches: Record<'desert' | 'forest' | 'tundra' | 'farm', Batch> = { desert: [], forest: [], tundra: [], farm: [] };

  // Box lookup: a grid of cells, so clearance checks do not scan every box.
  const grid = new Map<string, Box[]>();
  const cellKey = (i: number, j: number): string => `${i},${j}`;
  const addBox = (b: Box): void => {
    boxes.push(b);
    for (let i = Math.floor(b.minX / CELL); i <= Math.floor(b.maxX / CELL); i++) {
      for (let j = Math.floor(b.minZ / CELL); j <= Math.floor(b.maxZ / CELL); j++) {
        const k = cellKey(i, j);
        const list = grid.get(k);
        if (list) list.push(b); else grid.set(k, [b]);
      }
    }
  };
  /** True when a box comes within r of (x, z). */
  const boxNear = (x: number, z: number, r: number): boolean => {
    for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++) {
      for (let j = Math.floor((z - r) / CELL); j <= Math.floor((z + r) / CELL); j++) {
        for (const b of grid.get(cellKey(i, j)) ?? []) {
          if (x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r) return true;
        }
      }
    }
    return false;
  };

  const uni = (a: number, b: number): number => a + rnd() * (b - a);
  const anywhere = (): Pt => ({ x: uni(-H + 14, H - 14), z: uni(-H + 14, H - 14) });

  /** A spot an object of radius `margin` can stand on: in the world, off Turfton and the highways, outside the reserved zones, clear of boxes. */
  const free = (x: number, z: number, margin: number): boolean => {
    if (Math.abs(x) > H - 12 || Math.abs(z) > H - 12) return false;
    if (Math.abs(x) <= CITY_HALF + margin && Math.abs(z) <= CITY_HALF + margin) return false;
    if (roadDist(x, z) < ROAD_CLEAR + margin) return false;
    if (reserved.some((r) => inRect(r, x, z, margin))) return false;
    return !boxNear(x, z, margin);
  };

  /** A free point of `biome` that `pick` proposes, or null after `tries` attempts. */
  const findSpot = (pick: () => Pt, margin: number, biome: BiomeId, tries: number, ok?: (p: Pt) => boolean): Pt | null => {
    for (let t = 0; t < tries; t++) {
      const p = pick();
      if (biomeAt(p.x, p.z) === biome && free(p.x, p.z, margin) && (!ok || ok(p))) return p;
    }
    return null;
  };

  /** Adds a measured prefab centred on footprint point p; a solid one also gets its box. */
  const drop = (batch: Batch, m: Measure, p: Pt, solid: boolean): void => {
    batch.push({ id: m.id, x: p.x + m.ox, z: p.z + m.oz, yaw: m.yaw, scale: m.s });
    if (solid) addBox({ minX: p.x - m.hw, maxX: p.x + m.hw, minZ: p.z - m.hd, maxZ: p.z + m.hd, h: m.h });
  };

  /** One prefab on a random free spot of `biome`. Returns the spot, or null. */
  const scatter = (
    batch: Batch, id: string, biome: BiomeId, scale: number, solid: boolean,
    pick: () => Pt = anywhere, ok?: (p: Pt) => boolean,
  ): Pt | null => {
    const m = measure(id, scale, uni(0, TWO_PI));
    const p = findSpot(pick, Math.max(m.hw, m.hd, 0.5), biome, 200, ok);
    if (p) drop(batch, m, p, solid);
    return p;
  };

  /** One prefab at a fixed point, if the spot is free. */
  const placeAt = (batch: Batch, id: string, scale: number, yaw: number, solid: boolean, p: Pt): boolean => {
    const m = measure(id, scale, yaw);
    if (!free(p.x, p.z, Math.max(m.hw, m.hd, 0.5))) return false;
    drop(batch, m, p, solid);
    return true;
  };

  /** Places a landmark prefab inside a pre-reserved zone, still enforcing world, city, highway and box clearance. */
  const placeSetpiece = (
    batch: Batch, id: string, scale: number, yaw: number, solid: boolean, p: Pt, extraRoadClear = 1,
  ): boolean => {
    const m = measure(id, scale, yaw);
    const margin = Math.max(m.hw, m.hd, 0.5);
    if (Math.abs(p.x) > H - 12 || Math.abs(p.z) > H - 12) return false;
    if (Math.abs(p.x) <= CITY_HALF + margin && Math.abs(p.z) <= CITY_HALF + margin) return false;
    if (roadDist(p.x, p.z) < ROAD_CLEAR + margin + extraRoadClear) return false;
    if (boxNear(p.x, p.z, margin)) return false;
    drop(batch, m, p, solid);
    return true;
  };

  /** Registers a box collider only if its bounding radius stays clear of every highway leg. */
  const addSafeBox = (b: Box, extraRoadClear = 1): boolean => {
    const cx = (b.minX + b.maxX) / 2;
    const cz = (b.minZ + b.maxZ) / 2;
    const r = Math.hypot((b.maxX - b.minX) / 2, (b.maxZ - b.minZ) / 2);
    if (roadDist(cx, cz) < ROAD_CLEAR + r + extraRoadClear) return false;
    addBox(b);
    return true;
  };

  /** Merges non-empty geometries into one scene mesh. */
  const addMerged = (
    geos: THREE.BufferGeometry[], material: THREE.Material, castShadow = true, receiveShadow = true,
  ): THREE.Mesh | null => {
    if (geos.length === 0) return null;
    const geo = mergeGeometries(geos, false);
    if (!geo) return null;
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    scene.add(mesh);
    return mesh;
  };

  /** Trunk half-size. The giant oak's trunk radius is 0.225 per unit of scale (0.9 at its full scale of 4). */
  const trunkOf = (id: string, scale: number): number => (id === 'giant-oak' ? 0.225 * scale : 0.5);
  /** A tree is drawn at its trunk; only the trunk is solid (flyers pass over the crown). */
  const tree = (batch: Batch, id: string, scale: number, p: Pt): void => {
    const t = trunkOf(id, scale);
    batch.push({ id, x: p.x, z: p.z, yaw: uni(0, TWO_PI), scale });
    addBox({ minX: p.x - t, maxX: p.x + t, minZ: p.z - t, maxZ: p.z + t, h: localBox(id).max.y * scale });
  };
  const treeAt = (batch: Batch, id: string, biome: BiomeId, scale: number, ok?: (p: Pt) => boolean): Pt | null => {
    const p = findSpot(anywhere, trunkOf(id, scale) + 0.1, biome, 200, ok);
    if (p) tree(batch, id, scale, p);
    return p;
  };

  const walk = (x: number, z: number): void => {
    if (Math.abs(x) < H - 2 && Math.abs(z) < H - 2 && !boxNear(x, z, 0.6)) walkPoints.push({ x, z });
  };

  /** A village centre near `want`: the first nearby point of `biome` at least 30 from every highway. */
  const siteFor = (biome: BiomeId, want: Pt, radius: number): Pt | null => {
    const offs = [[0, 0], [0, 40], [0, -40], [40, 0], [-40, 0], [30, 30], [-30, -30], [30, -30], [-30, 30]];
    for (const [dx, dz] of offs) {
      const p = { x: want.x + dx, z: want.z + dz };
      if (biomeAt(p.x, p.z) === biome && roadDist(p.x, p.z) >= 30 && free(p.x, p.z, radius)) return p;
    }
    return null;
  };

  /** A ring of `count` huts around c, each facing the middle, then walk points between them. Reserves the village. */
  const village = (batch: Batch, c: Pt, id: string, scale: number, count: number, ring: number, palm: string | null): void => {
    const huts: Pt[] = [];
    const a0 = uni(0, TWO_PI);
    for (let k = 0; k < count; k++) {
      const ang = a0 + ((k + 0.3 + rnd() * 0.4) * TWO_PI) / count;
      const r = ring * uni(0.85, 1.15);
      const p = { x: c.x + Math.cos(ang) * r, z: c.z + Math.sin(ang) * r };
      const m = measure(id, scale, Math.atan2(c.x - p.x, c.z - p.z));
      if (!free(p.x, p.z, Math.max(m.hw, m.hd, 0.5))) continue;
      drop(batch, m, p, true);
      huts.push(p);
    }
    if (palm) {
      tree(batch, palm, 1, { x: c.x - 2, z: c.z + 2 });
      tree(batch, palm, 1, { x: c.x + 2, z: c.z - 2 });
    }
    walk(c.x, c.z);
    huts.forEach((a, k) => {
      const b = huts[(k + 1) % huts.length];
      walk((a.x + b.x) / 2, (a.z + b.z) / 2);
    });
    const span = ring * 1.4 + 6;
    reserved.push(rectOf(c.x, c.z, span, span));
  };

  /** A parked mower of `kind` on a free spot of `biome`, near `near` when given. */
  const park = (kind: VehicleKind, biome: BiomeId, near: Pt | null, margin = 3, reach = 24): void => {
    for (let t = 0; t < 200; t++) {
      const p = near ? { x: near.x + uni(-reach, reach), z: near.z + uni(-reach, reach) } : anywhere();
      if (biomeAt(p.x, p.z) !== biome || !free(p.x, p.z, margin)) continue;
      if (parked.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < 6)) continue;
      parked.push({ x: p.x, z: p.z, yaw: uni(0, TWO_PI), kind });
      return;
    }
  };

  // ============================================================================================================
  // Reserve the fixed zones first, so nothing scattered lands on them.
  // ============================================================================================================
  reserved.push(growRect({ minX: BASE.minX, maxX: BASE.maxX, minZ: BASE.minZ, maxZ: BASE.maxZ }, GROW));
  reserved.push(growRect(rectOf(AIRFIELD.x, AIRFIELD.z, AF_HX, AF_HZ), GROW));
  const planeX = AIRFIELD.planeSpots.map((p) => p.x);
  const planeZ = AIRFIELD.planeSpots.map((p) => p.z);
  const apron: Rect = {
    minX: Math.min(...planeX) - 8, maxX: Math.max(...planeX) + 8,
    minZ: Math.min(...planeZ) - 8, maxZ: Math.max(...planeZ) + 8,
  };
  reserved.push(growRect(apron, GROW));
  // Outer-biome landmark zones: reserved upfront so villages, ponds, farms and random clutter never spawn inside them.
  reserved.push(
    rectOf(-255, -60, 22, 22),     // The Compost Heap
    rectOf(-360, 40, 16, 16),      // Unmowed's ring clearing
    rectOf(-290, -28, 9, 9),       // Chapel of Mulch van
    rectOf(-560, 40, 15, 15),      // Tall House Porch
    rectOf(-590, -120, 8, 8),      // Fence-Line Knot-Hole Overlook
    rectOf(0, -350, 15, 15),       // Frozen Birdbath Basin
    rectOf(-52, -520, 10, 10),     // Kiln-Resin Shrine (west of north highway leg)
    rectOf(40, -540, 12, 12),      // Aether Ley-Line Ramp
    rectOf(-80, 340, 20, 20),      // Granny Gnertrude's Farmhouse & Barn
    rectOf(80, 380, 22, 22),       // Biscuit's Nap Crater
    rectOf(-104, 230, 86, 11),     // Southern Drainage Canal (west channel)
    rectOf(104, 230, 86, 11),      // Southern Drainage Canal (east channel)
    rectOf(-48, 222, 9, 9),        // Baroness Brenda's lawn-chair throne
    rectOf(374, 88, 9, 9),         // East Black Dew station (fort-gate junction)
    rectOf(452, 88, 9, 9),         // East Black Dew station (airfield-spur junction)
    rectOf(78, 466, 9, 9),         // South Black Dew station (south/ring-se junction)
    rectOf(20, 282, 9, 9),         // South Black Dew station (south highway)
  );

  // ============================================================================================================
  // Fort Sandpit (desert)
  // ============================================================================================================
  const fortFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(BASE.maxX - BASE.minX, BASE.maxZ - BASE.minZ)
      .rotateX(-Math.PI / 2)
      .translate((BASE.minX + BASE.maxX) / 2, 0.015, (BASE.minZ + BASE.maxZ) / 2),
    flatLayer(new THREE.MeshStandardMaterial({ color: COLORS.sand }), LAYER.area),
  );
  fortFloor.receiveShadow = true;
  scene.add(fortFloor);

  // Sandbag walls: tiled with sandbag-wall prefabs, one box per straight run. Runs are axis-aligned.
  const wallH = BASE.wallHeight;
  const tile = localBox('sandbag-wall');
  const tileW = tile.max.x - tile.min.x;
  const tileD = tile.max.z - tile.min.z;
  const tileS = wallH / (tile.max.y - tile.min.y);
  const tileLongX = tileW >= tileD;
  const tileLen = Math.max(tileW, tileD) * tileS;
  const wallRun = (x0: number, z0: number, x1: number, z1: number): void => {
    const alongX = z0 === z1;
    const len = alongX ? x1 - x0 : z1 - z0;
    const n = Math.max(1, Math.ceil(len / tileLen));
    const yaw = alongX === tileLongX ? 0 : Math.PI / 2;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      drop(batches.desert, measure('sandbag-wall', tileS, yaw), { x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t }, false);
    }
    addBox(alongX
      ? { minX: x0, maxX: x1, minZ: z0 - WALL_T / 2, maxZ: z0 + WALL_T / 2, h: wallH }
      : { minX: x0 - WALL_T / 2, maxX: x0 + WALL_T / 2, minZ: z0, maxZ: z1, h: wallH });
  };
  const gateL = BASE.gateX - BASE.gateWidth / 2;
  const gateR = BASE.gateX + BASE.gateWidth / 2;
  wallRun(BASE.minX, BASE.minZ, BASE.maxX, BASE.minZ);   // south
  wallRun(BASE.minX, BASE.maxZ, gateL, BASE.maxZ);       // north, west of the gate
  wallRun(gateR, BASE.maxZ, BASE.maxX, BASE.maxZ);       // north, east of the gate
  wallRun(BASE.minX, BASE.minZ, BASE.minX, BASE.maxZ);   // west
  wallRun(BASE.maxX, BASE.minZ, BASE.maxX, BASE.maxZ);   // east

  // Watch towers beside the gate, 7 tall.
  const towerScale = 7 / (localBox('watch-tower').max.y - localBox('watch-tower').min.y);
  for (const dx of [-9, 9]) {
    drop(batches.desert, measure('watch-tower', towerScale, 0), { x: BASE.gateX + dx, z: BASE.maxZ - 4 }, true);
  }
  // HQ tents, crates (inside the fort, clear of the gate and the Whirligig pad).
  for (const [x, z] of [[390, 14], [398, -8], [346, -10]]) {
    drop(batches.desert, measure('hq-tent', fit('hq-tent', 8), Math.floor(rnd() * 4) * (Math.PI / 2)), { x, z }, true);
  }
  for (const [x, z] of [[346, 24], [347, 27], [402, 24], [404, 28]]) {
    drop(batches.desert, measure('crate', fit('crate', 2), 0), { x, z }, true);
  }
  // The Whirligig pad: a dark disc and a yellow ring. Drawn as plain meshes (it is a pad, not a prop).
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 0.06, 40),
    flatLayer(new THREE.MeshStandardMaterial({ color: 0x3a3d42 }), LAYER.road),
  );
  pad.position.set(BASE.padX, 0.03, BASE.padZ);
  pad.receiveShadow = true;
  scene.add(pad);
  scene.add(new THREE.Mesh(
    new THREE.RingGeometry(3.6, 4.2, 48).rotateX(-Math.PI / 2).translate(BASE.padX, 0.065, BASE.padZ),
    flatLayer(new THREE.MeshStandardMaterial({ color: 0xf2c230 }), LAYER.marking),
  ));
  // Two team banners (animated in update, so built outside the static batch).
  for (const [x, z] of [[344, -28], [396, 26]]) {
    const b = shadowed(buildPrefab('team-banner', { lights: false, tint: 0x556b2f }));
    b.scale.setScalar(3);
    b.position.set(x, 0, z);
    scene.add(b);
    banners.push(b as THREE.Group);
  }

  // ============================================================================================================
  // The airfield (desert): runway, apron, hangar, windsock, props
  // ============================================================================================================
  const L = AIRFIELD.length, W = AIRFIELD.width, yaw = AIRFIELD.yaw;
  /** A flat piece in the runway's frame: `w` across, `d` along, centred at local (lx, lz), at height y. */
  const onRunway = (w: number, d: number, lx: number, lz: number, y: number): THREE.BufferGeometry =>
    new THREE.PlaneGeometry(w, d)
      .rotateX(-Math.PI / 2)
      .translate(lx, y, lz)
      .rotateY(yaw)
      .translate(AIRFIELD.x, 0, AIRFIELD.z);
  /** Merged flat geometry on a draw layer, so coplanar stripes and the ground never z-fight. */
  const flat = (geos: THREE.BufferGeometry[], color: number, layer: number): THREE.Mesh => {
    const mesh = new THREE.Mesh(
      mergeGeometries(geos, false) ?? new THREE.BufferGeometry(),
      flatLayer(new THREE.MeshStandardMaterial({ color }), layer),
    );
    mesh.receiveShadow = true;
    return mesh;
  };
  const runwayGeos = [onRunway(W, L, 0, 0, 0.02)];
  const lineGeos: THREE.BufferGeometry[] = [];
  for (let lz = -L / 2 + 14; lz <= L / 2 - 14; lz += 6) lineGeos.push(onRunway(0.4, 3, 0, lz, 0.03));
  for (const lz of [-L / 2 + 6, L / 2 - 6]) lineGeos.push(onRunway(W - 4, 2, 0, lz, 0.03));
  scene.add(flat(runwayGeos, 0x3b3d40, LAYER.road));
  scene.add(flat(lineGeos, 0xf2f2f2, LAYER.marking));
  scene.add(flat([new THREE.PlaneGeometry(apron.maxX - apron.minX, apron.maxZ - apron.minZ)
    .rotateX(-Math.PI / 2)
    .translate((apron.minX + apron.maxX) / 2, 0.02, (apron.minZ + apron.maxZ) / 2)], 0x8c9196, LAYER.area));

  // Hangar with its open front (+z in the prefab) turned to the apron, which lies on the -z side.
  placeAt(batches.desert, 'hangar', 1, Math.PI, true, { x: 428, z: -64 });
  for (const p of [{ x: 412, z: -54 }, { x: 414, z: -50 }, { x: 410, z: -48 }]) {
    placeAt(batches.desert, 'crate', fit('crate', 2), 0, true, p);
  }
  // Windsock by the runway's east end, swung gently in update.
  const windsock = shadowed(buildPrefab('windsock', { lights: false }));
  windsock.position.set(AIRFIELD.x + L / 2 - 13, 0, AIRFIELD.z - W / 2 - 5);
  scene.add(windsock);
  sock = windsock.getObjectByName('sock') ?? null;

  // ============================================================================================================
  // Outer-Biome Setpieces (reserved above; built before random biome scattering so colliders stay respected)
  // ============================================================================================================
  const D = batches.desert;
  const F = batches.forest;
  const T = batches.tundra;
  const Fm = batches.farm;

  const boxGeo = (w: number, h: number, d: number, x: number, y: number, z: number, ry = 0, rx = 0, rz = 0): THREE.BufferGeometry => {
    const g = new THREE.BoxGeometry(w, h, d);
    if (rx) g.rotateX(rx);
    if (rz) g.rotateZ(rz);
    if (ry) g.rotateY(ry);
    return g.translate(x, y, z);
  };
  const cylGeo = (rt: number, rb: number, h: number, seg: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): THREE.BufferGeometry => {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg);
    if (rx) g.rotateX(rx);
    if (rz) g.rotateZ(rz);
    if (ry) g.rotateY(ry);
    return g.translate(x, y, z);
  };
  const addSteam = (x: number, z: number, count: number, maxH: number): void => {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: 0xe8f3ed, transparent: true, opacity: 0.42, roughness: 1 });
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.55 + (i % 2) * 0.2, 8, 6), mat);
      m.position.set(x + (i % 3 - 1) * 0.45, 0.4, z + (Math.floor(i / 3) - 0.5) * 0.45);
      scene.add(m);
      steamPuffs.push({ mesh: m, baseX: m.position.x, baseZ: m.position.z, phase: (i / count) * TWO_PI, speed: 0.9 + (i % 3) * 0.25, maxH });
    }
  };

  const dewBarrels: DewBarrel[] = [];
  const placeDewBarrel = (x: number, z: number, s: number, yaw: number): void => {
    const m = measure('gta-dew-barrel', s, yaw);
    const mesh = buildPrefab('gta-dew-barrel', { lights: false });
    mesh.scale.setScalar(s);
    mesh.position.set(x, 0, z);
    mesh.rotation.y = yaw;
    scene.add(mesh);
    boxes.push({ minX: x + m.ox - m.hw, maxX: x + m.ox + m.hw, minZ: z + m.oz - m.hd, maxZ: z + m.oz + m.hd, h: m.h });
    dewBarrels.push({ x, y: 0.6, z, mesh, blown: false });
  };

  // ---- 1. The Compost Heap (x: -255, z: -60) -----------------------------------------------------------------
  {
    const cx = -255, cz = -60;
    const heapPad = new THREE.Mesh(
      new THREE.CircleGeometry(19, 28).rotateX(-Math.PI / 2).translate(cx, 0.015, cz),
      flatLayer(new THREE.MeshStandardMaterial({ color: 0x4b3b23, roughness: 1 }), LAYER.area),
    );
    heapPad.receiveShadow = true;
    scene.add(heapPad);

    // Steaming mulch mounds & compost bins.
    for (const [mx, mz, yaw] of [[-265, -68, 0.4], [-244, -67, -0.6], [-264, -50, 1.2], [-246, -49, -1.5]] as [number, number, number][]) {
      placeSetpiece(F, 'compost-heap', fit('compost-heap', 6), yaw, true, { x: mx, z: mz });
      addSteam(mx, mz, 2, 4.5);
    }
    placeSetpiece(F, 'compost-bin', fit('compost-bin', 3.4), 0.3, true, { x: -259, z: -62 });
    placeSetpiece(F, 'compost-bin', fit('compost-bin', 3.4), -0.4, true, { x: -250, z: -53 });

    // Rusted wheelbarrow cranes.
    const rustGeos: THREE.BufferGeometry[] = [];
    const steelGeos: THREE.BufferGeometry[] = [];
    for (const [kx, kz, ry] of [[-262, -57, 0.5], [-247, -63, -2.4]] as [number, number, number][]) {
      rustGeos.push(
        boxGeo(1.1, 8.2, 1.1, kx, 4.1, kz, ry),
        boxGeo(0.7, 0.7, 6.2, kx + Math.sin(ry) * 2.2, 7.6, kz + Math.cos(ry) * 2.2, ry, -0.25),
      );
      steelGeos.push(
        cylGeo(0.06, 0.06, 3.6, 6, kx + Math.sin(ry) * 4.4, 5.4, kz + Math.cos(ry) * 4.4),
        boxGeo(1.4, 0.9, 1.9, kx + Math.sin(ry) * 4.4, 3.3, kz + Math.cos(ry) * 4.4, ry),
      );
      addSafeBox({ minX: kx - 0.9, maxX: kx + 0.9, minZ: kz - 0.9, maxZ: kz + 0.9, h: 8.4 });
    }
    // Black Dew refinery tanks at the north side of the heap.
    const tx = -255, tz = -72;
    steelGeos.push(
      cylGeo(1.6, 1.6, 7.2, 14, tx - 2.6, 2.1, tz, 0, 0, Math.PI / 2),
      cylGeo(1.6, 1.6, 7.2, 14, tx + 2.6, 2.1, tz, 0, 0, Math.PI / 2),
      cylGeo(1.1, 1.3, 6.5, 12, tx, 3.25, tz - 2.4),
      boxGeo(9.2, 0.4, 0.4, tx, 4.2, tz - 1.2),
    );
    rustGeos.push(
      boxGeo(1.2, 1.2, 3.4, tx - 3.6, 0.6, tz),
      boxGeo(1.2, 1.2, 3.4, tx + 3.6, 0.6, tz),
    );
    addSafeBox({ minX: tx - 6.4, maxX: tx + 6.4, minZ: tz - 3.6, maxZ: tz + 2.0, h: 6.5 });
    const amberBands = new THREE.MeshStandardMaterial({ color: 0xe39424, emissive: 0x703b00, emissiveIntensity: 0.45 });
    addMerged([
      cylGeo(1.66, 1.66, 0.45, 14, tx - 2.6, 2.1, tz, 0, 0, Math.PI / 2),
      cylGeo(1.66, 1.66, 0.45, 14, tx + 2.6, 2.1, tz, 0, 0, Math.PI / 2),
    ], amberBands);
    addMerged(rustGeos, new THREE.MeshStandardMaterial({ color: 0x8a4726, roughness: 0.9 }));
    addMerged(steelGeos, new THREE.MeshStandardMaterial({ color: 0x4b4f54, roughness: 0.65, metalness: 0.35 }));

    for (const [bx, bz] of [[-259, -68], [-257, -68], [-251, -68], [-249, -68]] as [number, number][]) {
      placeDewBarrel(bx, bz, fit('gta-dew-barrel', 1.25), 0);
    }
    placeSetpiece(F, 'wheelbarrow', fit('wheelbarrow', 2.4), 0.7, true, { x: -259, z: -54 });
    placeSetpiece(F, 'wheelbarrow', fit('wheelbarrow', 2.4), -1.1, true, { x: -250, z: -61 });

    // Glowing steam-vent pad (non-solid so bikes/mowers can roll straight across).
    const vx = -255, vz = -56;
    const grate = new THREE.Mesh(
      new THREE.CylinderGeometry(3.1, 3.4, 0.08, 24).translate(vx, 0.04, vz),
      new THREE.MeshStandardMaterial({ color: 0x2f3338, roughness: 0.7 }),
    );
    grate.receiveShadow = true;
    scene.add(grate);
    const ventMat = flatLayer(new THREE.MeshStandardMaterial({ color: 0x8bf5cc, emissive: 0x35c998, emissiveIntensity: 0.85 }), LAYER.marking);
    scene.add(new THREE.Mesh(new THREE.RingGeometry(1.4, 2.4, 24).rotateX(-Math.PI / 2).translate(vx, 0.085, vz), ventMat));
    flickers.push({ mat: ventMat, base: 0.85, amp: 0.25, speed: 3.4 });
    addSteam(vx, vz, 5, 6.2);
    walk(-255, -50); walk(-260, -64); walk(-249, -58);
    park('push-bike', 'forest', { x: -255, z: -47 }, 2.5, 5);
  }

  // ---- 2. Mossy Wood Landmarks -------------------------------------------------------------------------------
  {
    // 2a. The Unmowed's ring clearing at (-360, 40).
    const ux = -360, uz = 40;
    const clearing = new THREE.Mesh(
      new THREE.CircleGeometry(13, 28).rotateX(-Math.PI / 2).translate(ux, 0.015, uz),
      flatLayer(new THREE.MeshStandardMaterial({ color: 0x4ca34b, roughness: 1 }), LAYER.area),
    );
    clearing.receiveShadow = true;
    scene.add(clearing);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TWO_PI + 0.2;
      placeSetpiece(F, 'standing-stone', fit('standing-stone', 2.5), a + Math.PI, true, {
        x: ux + Math.cos(a) * 11, z: uz + Math.sin(a) * 11,
      });
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TWO_PI + 0.7;
      placeSetpiece(F, 'giant-spotted-toadstool', fit('giant-spotted-toadstool', 3.4), a, true, {
        x: ux + Math.cos(a) * 9.5, z: uz + Math.sin(a) * 9.5,
      });
    }
    placeSetpiece(F, 'campfire', fit('campfire', 2.1), 0, true, { x: ux, z: uz });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TWO_PI + 0.35;
      placeSetpiece(F, 'toadstool-seat', fit('toadstool-seat', 1.2), a + Math.PI, true, {
        x: ux + Math.cos(a) * 3.8, z: uz + Math.sin(a) * 3.8,
      });
    }
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TWO_PI;
      placeSetpiece(F, 'mushroom-lamp', 1.2, a, false, { x: ux + Math.cos(a) * 6.5, z: uz + Math.sin(a) * 6.5 });
    }
    walk(ux, uz - 5); walk(ux + 5, uz + 3); walk(ux - 5, uz + 3);

    // 2b. Abandoned Chapel of Mulch van at (-290, -28), clear of [-250, -20] -> [-320, 20].
    const vx = -290, vz = -28, vyaw = 0.45;
    const vanBody = addMerged([
      boxGeo(2.5, 2.0, 4.6, 0, 1.35, -0.3),
      boxGeo(2.3, 1.35, 1.5, 0, 1.0, 2.4),
    ], new THREE.MeshStandardMaterial({ color: 0x7b8c74, roughness: 0.88 }));
    if (vanBody) { vanBody.position.set(vx, 0, vz); vanBody.rotation.set(0.06, vyaw, -0.14); }
    const vanTrim = addMerged([
      boxGeo(2.7, 0.5, 3.2, 0, 0.85, -0.5), // 10 cm proud of the body: 2 cm z-fights at range
      boxGeo(2.1, 0.65, 0.12, 0, 1.5, 2.08),
      cylGeo(0.45, 0.45, 0.3, 12, 1.2, 0.45, 1.8, 0, 0, Math.PI / 2),
      cylGeo(0.45, 0.45, 0.3, 12, -1.2, 0.45, 1.8, 0, 0, Math.PI / 2),
      cylGeo(0.45, 0.45, 0.3, 12, 1.2, 0.45, -1.5, 0, 0, Math.PI / 2),
      cylGeo(0.45, 0.45, 0.3, 12, -1.9, 0.16, -2.0, Math.PI / 2, 0, 0),
    ], new THREE.MeshStandardMaterial({ color: 0x5c3621, roughness: 0.9 }));
    if (vanTrim) { vanTrim.position.set(vx, 0, vz); vanTrim.rotation.set(0.06, vyaw, -0.14); }
    if (typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 64;
      const g = c.getContext('2d');
      if (g) {
        g.fillStyle = '#d9cfb2';
        g.fillRect(0, 0, 256, 64);
        g.strokeStyle = '#4e3722';
        g.lineWidth = 4;
        g.strokeRect(2, 2, 252, 60);
        g.fillStyle = '#332214';
        g.font = 'bold 18px sans-serif';
        g.textAlign = 'center';
        g.fillText('CHAPEL OF MULCH', 128, 28);
        g.font = '14px sans-serif';
        g.fillText('QUOTA DUE FRIDAY', 128, 50);
      }
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 0.8),
        new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(c), roughness: 0.9 }),
      );
      sign.position.set(vx + Math.cos(vyaw) * 1.32, 1.45, vz - Math.sin(vyaw) * 1.32);
      sign.rotation.set(0, vyaw + Math.PI / 2, 0);
      scene.add(sign);
    }
    addSafeBox({ minX: vx - 3.1, maxX: vx + 3.1, minZ: vz - 3.1, maxZ: vz + 3.1, h: 2.5 });
    placeSetpiece(F, 'compost-bin', fit('compost-bin', 1.8), 0.4, true, { x: vx - 3.8, z: vz + 2.8 });
    placeSetpiece(F, 'crate', fit('crate', 1.4), 0.8, true, { x: vx + 3.8, z: vz - 2.6 });
    placeSetpiece(F, 'fern-clump', 1.1, 0, false, { x: vx + 4.4, z: vz + 2.2 });
    placeSetpiece(F, 'mushroom-lamp', 1.0, 0, false, { x: vx - 4.2, z: vz - 2.5 });
    walk(vx + 5, vz + 1);

    // 2c. Boarded-up oversized Tall House Porch at (-560, 40) with porcelain-lantern & tall-one-pencil.
    const px = -560, pz = 40;
    const porchWood: THREE.BufferGeometry[] = [
      boxGeo(14, 0.8, 18, px - 2, 2.2, pz),                 // main deck
      boxGeo(2.5, 12, 18, px - 8, 6.0, pz),                 // Tall House back wall
      boxGeo(2, 2.4, 2, px + 4, 1.2, pz - 8),               // front-north pier
      boxGeo(2, 2.4, 2, px + 4, 1.2, pz + 8),               // front-south pier
      boxGeo(1.1, 9.5, 1.1, px + 4, 7.2, pz - 7.8),         // porch column
      boxGeo(1.1, 9.5, 1.1, px + 4, 7.2, pz + 7.8),         // porch column
      boxGeo(14.5, 0.9, 18.6, px - 2, 12.2, pz),            // overhang roof
      boxGeo(1.4, 0.85, 8.5, px + 5.7, 0.425, pz),          // bottom step
      boxGeo(1.4, 1.7, 8.5, px + 4.3, 0.85, pz),            // top step
    ];
    addMerged(porchWood, new THREE.MeshStandardMaterial({ color: 0x69503a, roughness: 0.92 }));
    addMerged([
      boxGeo(0.4, 9.0, 5.2, px - 6.7, 6.8, pz),             // dark doorway recess
    ], new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 1 }));
    addMerged([
      boxGeo(0.35, 0.9, 6.4, px - 6.3, 5.2, pz, 0, 0.25),   // boarding plank 1
      boxGeo(0.35, 0.9, 6.4, px - 6.3, 7.2, pz, 0, -0.22),  // boarding plank 2
      boxGeo(0.35, 0.9, 6.4, px - 6.3, 9.1, pz, 0, 0.14),   // boarding plank 3
    ], new THREE.MeshStandardMaterial({ color: 0x4b3421, roughness: 0.95 }));
    addSafeBox({ minX: px - 9.2, maxX: px + 5.0, minZ: pz - 9.2, maxZ: pz + 9.2, h: 12.6 });
    addSafeBox({ minX: px + 5.0, maxX: px + 6.5, minZ: pz - 4.4, maxZ: pz + 4.4, h: 1.8 });

    const lanternLb = localBox('porcelain-lantern');
    const lanternScale = 1.8 / Math.max(0.1, lanternLb.max.y - lanternLb.min.y);
    placeSetpiece(F, 'porcelain-lantern', lanternScale, Math.PI / 2, false, { x: px + 6.8, z: pz - 5.2 });
    placeSetpiece(F, 'porcelain-lantern', lanternScale, Math.PI / 2, false, { x: px + 6.8, z: pz + 5.2 });
    const haloMat = new THREE.MeshStandardMaterial({ color: 0xfff0b8, emissive: 0xffc654, emissiveIntensity: 0.8, transparent: true, opacity: 0.45 });
    for (const lz of [pz - 5.2, pz + 5.2]) {
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.95, 10, 8), haloMat);
      halo.position.set(px + 6.8, 1.0, lz);
      scene.add(halo);
    }
    flickers.push({ mat: haloMat, base: 0.8, amp: 0.35, speed: 6.0 });

    const pencilLb = localBox('tall-one-pencil');
    const pencilScale = 13 / Math.max(0.1, pencilLb.max.y - pencilLb.min.y);
    placeSetpiece(F, 'tall-one-pencil', pencilScale, 0.35, true, { x: px + 8.5, z: pz + 10.5 });
    walk(px + 9, pz);
  }

  // ---- 3. Frostbite Fells Landmarks --------------------------------------------------------------------------
  {
    // 3a. Frozen Birdbath Basin derby arena at (0, -350), radius <= 16 so north highway remains unobstructed.
    const bx = 0, bz = -350;
    const basinFloor = new THREE.Mesh(
      new THREE.CircleGeometry(12.2, 40).rotateX(-Math.PI / 2).translate(bx, 0.025, bz),
      flatLayer(new THREE.MeshStandardMaterial({ color: 0x9edbf0, roughness: 0.12, metalness: 0.1 }), LAYER.area),
    );
    basinFloor.receiveShadow = true;
    scene.add(basinFloor);

    const rimGeos: THREE.BufferGeometry[] = [
      cylGeo(1.1, 1.5, 2.4, 12, bx, 1.2, bz), // centre finial obstacle
    ];
    addSafeBox({ minX: bx - 1.4, maxX: bx + 1.4, minZ: bz - 1.4, maxZ: bz + 1.4, h: 2.4 });
    const rimR = 12.9;
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * TWO_PI;
      // Leave wide derby entry/exit gaps at south (+z), west (-x), and north-west.
      if (Math.abs(ang - Math.PI / 2) < 0.32 || Math.abs(ang - Math.PI) < 0.32 || Math.abs(ang - 4.1) < 0.32) continue;
      const rx = bx + Math.cos(ang) * rimR;
      const rz = bz + Math.sin(ang) * rimR;
      if (roadDist(rx, rz) < ROAD_CLEAR + 1.8) continue;
      rimGeos.push(boxGeo(1.4, 1.5, 3.6, rx, 0.75, rz, -ang));
      addSafeBox({ minX: rx - 0.9, maxX: rx + 0.9, minZ: rz - 0.9, maxZ: rz + 0.9, h: 1.5 });
    }
    addMerged(rimGeos, new THREE.MeshStandardMaterial({ color: 0x899299, roughness: 0.85 }));
    placeSetpiece(T, 'torch', 1.6, 0, false, { x: bx - 3.6, z: bz + 12.6 });
    placeSetpiece(T, 'torch', 1.6, 0, false, { x: bx + 3.6, z: bz + 12.6 });
    park('zero-turn', 'tundra', { x: bx - 6, z: bz }, 2.5, 4);
    walk(bx - 5, bz + 6); walk(bx + 4, bz - 5);

    // 3b. Kiln-Resin Shrine at (-52, -520), behind the northern snowbank clear of [-40, -470] -> [-20, -570].
    const sx = -52, sz = -520;
    const bankGeos: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * 0.55 + (i / 4) * Math.PI * 0.9;
      const mx = sx + Math.cos(a) * 6.5;
      const mz = sz + Math.sin(a) * 6.5;
      const s = new THREE.SphereGeometry(2.6, 10, 8);
      s.scale(1.2, 0.7, 1.2);
      s.translate(mx, 0.7, mz);
      bankGeos.push(s);
    }
    addMerged(bankGeos, new THREE.MeshStandardMaterial({ color: 0xedf4fa, roughness: 0.95 }));
    addSafeBox({ minX: sx - 8.2, maxX: sx - 4.0, minZ: sz - 7.5, maxZ: sz + 7.5, h: 2.2 });
    const hearth = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.8, 0.22, 18).translate(sx, 0.11, sz),
      new THREE.MeshStandardMaterial({ color: 0x6b6661, roughness: 0.9 }),
    );
    hearth.receiveShadow = true;
    scene.add(hearth);
    placeSetpiece(T, 'glaze-shrine', fit('glaze-shrine', 4.2), Math.PI / 2, true, { x: sx - 1.5, z: sz });
    placeSetpiece(T, 'campfire', fit('campfire', 2.0), 0, true, { x: sx + 2.2, z: sz });
    placeSetpiece(T, 'torch', 1.7, 0, false, { x: sx + 3.2, z: sz - 3.2 });
    placeSetpiece(T, 'torch', 1.7, 0, false, { x: sx + 3.2, z: sz + 3.2 });
    const resinPool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.9, 0.35, 12).translate(sx + 0.6, 0.25, sz + 2.1),
      new THREE.MeshStandardMaterial({ color: 0xffa82e, emissive: 0xd96b00, emissiveIntensity: 0.75 }),
    );
    scene.add(resinPool);
    walk(sx + 4.5, sz);

    // 3c. Glowing blue Aether Ley-Line Ramp at (40, -540).
    const ax = 40, az = -540;
    const leyMat = new THREE.MeshStandardMaterial({ color: 0x52e5ff, emissive: 0x1aa8e8, emissiveIntensity: 0.9 });
    flickers.push({ mat: leyMat, base: 0.9, amp: 0.25, speed: 2.6 });
    // The crack lies on the ground, so it gets its own copy of the glow on a draw layer (the rails are 3D).
    const crackMat = flatLayer(leyMat.clone(), LAYER.decal);
    flickers.push({ mat: crackMat, base: 0.9, amp: 0.25, speed: 2.6 });
    const leyCrack = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 16).rotateX(-Math.PI / 2).translate(ax, 0.02, az + 6), crackMat);
    scene.add(leyCrack);
    // Sloped ramp wedge (low entry at +z = -534, launch lip at -z = -546, height 3.2).
    const wedge = new THREE.BufferGeometry();
    const hw = 3.0, z0 = az + 6, z1 = az - 6, yTop = 3.2;
    const verts = new Float32Array([
      // top slope (2 tris)
      ax - hw, 0.03, z0, ax + hw, 0.03, z0, ax + hw, yTop, z1,
      ax - hw, 0.03, z0, ax + hw, yTop, z1, ax - hw, yTop, z1,
      // back face
      ax - hw, 0, z1, ax - hw, yTop, z1, ax + hw, yTop, z1,
      ax - hw, 0, z1, ax + hw, yTop, z1, ax + hw, 0, z1,
      // left side
      ax - hw, 0, z0, ax - hw, 0, z1, ax - hw, yTop, z1,
      // right side
      ax + hw, 0, z0, ax + hw, yTop, z1, ax + hw, 0, z1,
    ]);
    wedge.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    wedge.computeVertexNormals();
    const rampMesh = new THREE.Mesh(wedge, new THREE.MeshStandardMaterial({
      color: 0x2b5d7a, roughness: 0.45, metalness: 0.2, side: THREE.DoubleSide,
    }));
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    scene.add(rampMesh);
    // Glowing blue side rails on the ramp (visual edge strips).
    addMerged([
      boxGeo(0.28, 0.18, 12.4, ax - hw + 0.2, yTop / 2 + 0.12, az, 0, 0.26),
      boxGeo(0.28, 0.18, 12.4, ax + hw - 0.2, yTop / 2 + 0.12, az, 0, 0.26),
    ], leyMat);
    placeSetpiece(T, 'aether-crystal', fit('aether-crystal', 2.4), 0.3, true, { x: ax - 4.6, z: az - 5 });
    placeSetpiece(T, 'aether-crystal', fit('aether-crystal', 2.4), -0.4, true, { x: ax + 4.6, z: az - 5 });
    placeSetpiece(T, 'piton', fit('piton', 1.2), 0.2, false, { x: ax + 11, z: az - 10 });
    walk(ax, az + 9);
  }

  // ---- 4. Cloverfield Farms Landmarks ------------------------------------------------------------------------
  {
    // 4a. Granny Gnertrude's Farmhouse & Barn at (-80, 340), west of south highway.
    const gx = -80, gz = 340;
    placeSetpiece(Fm, 'log-cabin', 3, Math.PI / 2, true, { x: gx - 8, z: gz + 2 });
    placeSetpiece(Fm, 'barn', 5, 0, true, { x: gx + 8, z: gz + 6 });
    placeSetpiece(Fm, 'silo', 4.5, 0, true, { x: gx + 15, z: gz + 6 });
    placeSetpiece(Fm, 'haystack', 1, 0, true, { x: gx + 6, z: gz - 5 });
    placeSetpiece(Fm, 'scarecrow', 1, 0, true, { x: gx - 6, z: gz - 7 });
    placeDewBarrel(gx - 2, gz - 6, fit('gta-dew-barrel', 1.3), 0);
    placeDewBarrel(gx, gz - 6, fit('gta-dew-barrel', 1.3), 0.7);
    // Granny's load-bearing prize pumpkins.
    const pGeos: THREE.BufferGeometry[] = [];
    for (const [px, pz] of [[gx - 11, gz - 5], [gx - 13, gz - 6], [gx - 11, gz - 7.5]] as [number, number][]) {
      const s = new THREE.SphereGeometry(0.95, 10, 8);
      s.scale(1.1, 0.8, 1.1);
      s.translate(px, 0.75, pz);
      pGeos.push(s);
    }
    addMerged(pGeos, new THREE.MeshStandardMaterial({ color: 0xe6731e, roughness: 0.75 }));
    addSafeBox({ minX: gx - 14.2, maxX: gx - 9.8, minZ: gz - 8.7, maxZ: gz - 4.0, h: 1.6 });
    park('combine', 'farmland', { x: gx + 5, z: gz - 8 }, 5, 6);
    walk(gx, gz - 1); walk(gx + 3, gz - 4); walk(gx - 3, gz - 4);

    // 4b. Biscuit's Nap: 40-unit muddy pawprint crater at (80, 380) with submerged squeaky-hotdog-giant.
    const nx = 80, nz = 380;
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(17.5, 20.5, 36).rotateX(-Math.PI / 2).translate(nx, 0.015, nz),
      flatLayer(new THREE.MeshStandardMaterial({ color: 0x7a5b38, roughness: 1 }), LAYER.area),
    );
    rim.receiveShadow = true;
    scene.add(rim);
    const pawPad = (x: number, z: number, rx: number, rz: number): THREE.BufferGeometry => {
      const g = new THREE.CircleGeometry(1, 24);
      g.rotateX(-Math.PI / 2);
      g.scale(rx, 1, rz);
      return g.translate(x, 0.022, z);
    };
    addMerged([
      pawPad(nx, nz + 3, 11.5, 9.5),       // palm pad
      pawPad(nx - 11, nz - 9, 4.0, 4.8),   // toe 1
      pawPad(nx - 4, nz - 13, 4.0, 4.8),   // toe 2
      pawPad(nx + 4, nz - 13, 4.0, 4.8),   // toe 3
      pawPad(nx + 11, nz - 9, 4.0, 4.8),   // toe 4
    ], flatLayer(new THREE.MeshStandardMaterial({ color: 0x543a20, roughness: 0.95 }), LAYER.decal), false, true);
    placeSetpiece(Fm, 'squeaky-hotdog-giant', fit('squeaky-hotdog-giant', 8.5), 0.4, true, { x: nx + 2, z: nz + 3 });
    walk(nx - 6, nz + 8); walk(nx + 7, nz - 4);

    // 4c. Southern Drainage Canal strip at z = 230 with clear road bridge/gap around x = 0.
    const canalZ = 230;
    const concreteGeos: THREE.BufferGeometry[] = [
      // West and east concrete channel beds (gap at x in [-16, 16] for the south highway).
      boxGeo(174, 0.03, 10, -103, 0.015, canalZ),
      boxGeo(174, 0.03, 10, 103, 0.015, canalZ),
      // Retaining curbs along north and south banks.
      boxGeo(174, 0.9, 1.0, -103, 0.45, canalZ - 5.2),
      boxGeo(174, 0.9, 1.0, -103, 0.45, canalZ + 5.2),
      boxGeo(174, 0.9, 1.0, 103, 0.45, canalZ - 5.2),
      boxGeo(174, 0.9, 1.0, 103, 0.45, canalZ + 5.2),
      // Road-bridge curb parapets outside ROAD_CLEAR (|x| = 12.5 >= 9 + 3.5).
      boxGeo(1.0, 1.0, 11.4, -12.5, 0.5, canalZ),
      boxGeo(1.0, 1.0, 11.4, 12.5, 0.5, canalZ),
    ];
    // The channel beds are only 3 cm tall, so the concrete takes a draw layer to stay over the farmland at range.
    addMerged(concreteGeos, flatLayer(new THREE.MeshStandardMaterial({ color: 0x7d8084, roughness: 0.9 }), LAYER.area));
    addSafeBox({ minX: -13.0, maxX: -12.0, minZ: canalZ - 5.7, maxZ: canalZ + 5.7, h: 1.0 });
    addSafeBox({ minX: 12.0, maxX: 13.0, minZ: canalZ - 5.7, maxZ: canalZ + 5.7, h: 1.0 });
    // Water strips in the west and east channels.
    const waterGeos: THREE.BufferGeometry[] = [
      new THREE.PlaneGeometry(173, 8.2).rotateX(-Math.PI / 2).translate(-103, 0.032, canalZ),
      new THREE.PlaneGeometry(173, 8.2).rotateX(-Math.PI / 2).translate(103, 0.032, canalZ),
    ];
    // Water 2 mm over the beds: one layer above them.
    addMerged(waterGeos, flatLayer(new THREE.MeshStandardMaterial({ color: 0x3b7d72, roughness: 0.25, metalness: 0.1 }), LAYER.area + 1), false, true);

    // Baroness Brenda's lawn-chair throne on the north canal bank at (-48, 221).
    const brx = -48, brz = 221;
    addMerged([
      boxGeo(4.4, 0.5, 4.0, brx, 0.25, brz),
      boxGeo(2.8, 0.9, 2.6, brx, 0.95, brz),
      boxGeo(1.9, 1.4, 1.8, brx, 2.1, brz),
      boxGeo(1.8, 1.5, 0.35, brx, 3.2, brz - 0.8),
      cylGeo(0.08, 0.08, 4.6, 8, brx + 1.2, 2.3, brz - 0.5, 0, 0, -0.12),
    ], new THREE.MeshStandardMaterial({ color: 0xd98a2b, roughness: 0.75 }));
    addMerged([
      boxGeo(1.6, 0.25, 1.5, brx, 2.85, brz + 0.1),
      boxGeo(1.6, 1.3, 0.25, brx, 3.35, brz - 0.6),
    ], new THREE.MeshStandardMaterial({ color: 0xeb5e91, roughness: 0.7 }));
    addSafeBox({ minX: brx - 2.3, maxX: brx + 2.3, minZ: brz - 2.1, maxZ: brz + 2.1, h: 4.5 });
    placeSetpiece(Fm, 'chair', 1.2, 0.4, true, { x: brx - 3.6, z: brz - 1 });
    placeSetpiece(Fm, 'chair', 1.2, -0.5, true, { x: brx + 3.6, z: brz - 1 });
    park('push-bike', 'farmland', { x: brx - 6, z: brz - 2 }, 2, 4);
    walk(brx, brz - 4); walk(brx + 4, brz + 1);

    // Driftwood's turf-raft in the east canal channel at (55, 230).
    const drx = 55, drz = 230;
    addMerged([
      boxGeo(5.2, 0.35, 3.2, drx, 0.22, drz, 0.18),
      cylGeo(0.1, 0.12, 3.8, 8, drx - 0.5, 2.1, drz),
      boxGeo(0.15, 0.15, 2.2, drx - 0.5, 3.3, drz, 0.18),
    ], new THREE.MeshStandardMaterial({ color: 0x8d6741, roughness: 0.9 }));
    addMerged([
      boxGeo(4.4, 0.16, 2.5, drx, 0.44, drz, 0.18),
    ], new THREE.MeshStandardMaterial({ color: 0x5ca64c, roughness: 0.95 }));
    addMerged([
      boxGeo(0.08, 1.8, 1.8, drx - 0.4, 2.6, drz, 0.3),
    ], new THREE.MeshStandardMaterial({ color: 0xd9cbb0, roughness: 0.95 }));
    addSafeBox({ minX: drx - 2.8, maxX: drx + 2.8, minZ: drz - 1.8, maxZ: drz + 1.8, h: 3.8 });
    placeSetpiece(Fm, 'message-bottle', 1.3, 0.5, false, { x: drx, z: drz - 7 });
    walk(drx, drz - 7);
  }

  // ---- 5. The Fence-Line Overlook (|x| = 595, |z| = 595, merged geometry) ------------------------------------
  {
    const fenceEdge = 595;
    const postGeos: THREE.BufferGeometry[] = [];
    const railGeos: THREE.BufferGeometry[] = [];
    const plankStep = 15;
    const fenceH = 9.5;
    // Build posts & slats along all four perimeter edges (1 merged mesh for wood boards/posts, 1 for rails).
    for (const side of [-1, 1]) {
      const zWall = side * fenceEdge;
      const xWall = side * fenceEdge;
      for (let t = -fenceEdge; t < fenceEdge; t += plankStep) {
        const mid = t + plankStep / 2;
        // North / South walls (along x)
        postGeos.push(boxGeo(1.3, fenceH + 1.2, 1.3, t, (fenceH + 1.2) / 2, zWall));
        postGeos.push(boxGeo(plankStep - 1.3, fenceH, 0.45, mid, fenceH / 2, zWall));
        railGeos.push(
          boxGeo(plankStep, 0.55, 0.85, mid, 2.6, zWall),
          boxGeo(plankStep, 0.55, 0.85, mid, 7.6, zWall),
        );
        // East / West walls (along z); skip one narrow bay at (-595, -120) for the glowing knot-hole panel.
        postGeos.push(boxGeo(1.3, fenceH + 1.2, 1.3, xWall, (fenceH + 1.2) / 2, t));
        if (side === -1 && Math.abs(mid - -120) < plankStep * 0.6) {
          postGeos.push(
            boxGeo(0.45, fenceH, (plankStep - 4.0) / 2, xWall, fenceH / 2, mid - (plankStep + 1.4) / 4),
            boxGeo(0.45, fenceH, (plankStep - 4.0) / 2, xWall, fenceH / 2, mid + (plankStep + 1.4) / 4),
            boxGeo(0.45, 2.8, 4.0, xWall, 1.4, mid),
            boxGeo(0.45, 4.2, 4.0, xWall, 7.4, mid),
          );
        } else {
          postGeos.push(boxGeo(0.45, fenceH, plankStep - 1.3, xWall, fenceH / 2, mid));
        }
        railGeos.push(
          boxGeo(0.85, 0.55, plankStep, xWall, 2.6, mid),
          boxGeo(0.85, 0.55, plankStep, xWall, 7.6, mid),
        );
      }
      postGeos.push(boxGeo(1.3, fenceH + 1.2, 1.3, fenceEdge, (fenceH + 1.2) / 2, zWall));
    }
    addMerged(postGeos, new THREE.MeshStandardMaterial({ color: 0x735236, roughness: 0.92 }));
    addMerged(railGeos, new THREE.MeshStandardMaterial({ color: 0x523924, roughness: 0.92 }));
    addBox({ minX: -fenceEdge - 0.8, maxX: -fenceEdge + 0.8, minZ: -fenceEdge, maxZ: fenceEdge, h: fenceH + 1 });
    addBox({ minX: fenceEdge - 0.8, maxX: fenceEdge + 0.8, minZ: -fenceEdge, maxZ: fenceEdge, h: fenceH + 1 });
    addBox({ minX: -fenceEdge, maxX: fenceEdge, minZ: -fenceEdge - 0.8, maxZ: -fenceEdge + 0.8, h: fenceH + 1 });
    addBox({ minX: -fenceEdge, maxX: fenceEdge, minZ: fenceEdge - 0.8, maxZ: fenceEdge + 0.8, h: fenceH + 1 });

    // Glowing knot-hole overlook at (-590, -120).
    const kx = -590, kz = -120;
    const knotMat = new THREE.MeshStandardMaterial({ color: 0xffe68a, emissive: 0xd9a826, emissiveIntensity: 0.9 });
    flickers.push({ mat: knotMat, base: 0.9, amp: 0.2, speed: 1.8 });
    scene.add(new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 20).rotateY(Math.PI / 2).translate(-594.4, 4.1, kz),
      knotMat,
    ));
    scene.add(new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.75, 20).rotateY(Math.PI / 2).translate(-594.35, 4.1, kz),
      new THREE.MeshStandardMaterial({ color: 0x3a2616, roughness: 0.95 }),
    ));
    // Overlook thimble-stool and crate step (placed within world bounds; placeSetpiece allows up to |x| = 588, so use drop + addSafeBox).
    drop(F, measure('crate', fit('crate', 2.2), 0), { x: kx - 2.2, z: kz }, true);
    drop(F, measure('tin-pail', 1.4, 0), { x: kx, z: kz + 1.6 }, true);
    walk(kx + 2, kz);
  }

  // ---- 6. Roadside Black Dew™ Stations beside east & south highway junctions ----------------------------------
  {
    const stations: { batch: Batch; x: number; z: number; yaw: number }[] = [
      { batch: D, x: 374, z: 88, yaw: Math.PI },      // east highway / fort-gate junction
      { batch: D, x: 452, z: 88, yaw: Math.PI },      // east highway / airfield-spur junction
      { batch: Fm, x: 78, z: 466, yaw: -Math.PI / 2 }, // south highway / ring-se junction
      { batch: Fm, x: 20, z: 282, yaw: -Math.PI / 2 }, // south highway south of canal
    ];
    for (const s of stations) {
      const slab = new THREE.Mesh(
        new THREE.PlaneGeometry(9, 7).rotateX(-Math.PI / 2).translate(s.x, 0.02, s.z),
        flatLayer(new THREE.MeshStandardMaterial({ color: 0x676b70, roughness: 0.9 }), LAYER.area),
      );
      slab.receiveShadow = true;
      scene.add(slab);
      placeSetpiece(s.batch, 'gta-dew-pump', fit('gta-dew-pump', 3.6), s.yaw, true, { x: s.x, z: s.z }, 4);
      placeDewBarrel(s.x - 3.2, s.z + 1.5, fit('gta-dew-barrel', 1.2), 0);
      placeDewBarrel(s.x - 3.2, s.z - 0.5, fit('gta-dew-barrel', 1.2), 0.7);
      placeDewBarrel(s.x + 3.2, s.z + 1.0, fit('gta-dew-barrel', 1.2), 1.4);
    }
  }

  // ============================================================================================================
  // Desert: villages, cacti, rocks, mesas, parked mowers
  // ============================================================================================================
  const desertSites: Pt[] = [];
  for (const want of [{ x: 330, z: 140 }, { x: 400, z: 220 }]) {
    const c = siteFor('desert', want, 16);
    if (!c) continue;
    village(D, c, 'adobe-hut', 1, 4 + Math.floor(rnd() * 3), 11, 'palm-tree');
    desertSites.push(c);
  }
  for (let i = 0; i < 150; i++) {
    const id = rnd() < 0.5 ? 'tall-cactus' : 'barrel-cactus';
    scatter(D, id, 'desert', uni(0.9, 1.3), true);
  }
  for (let i = 0; i < 20; i++) {
    scatter(D, 'garden-rock', 'desert', fit('garden-rock', uni(1.5, 3)), true);
  }
  for (let i = 0; i < 8; i++) {
    const p = scatter(D, 'desert-mesa', 'desert', uni(0.8, 1.4), true);
    if (p && rnd() < 0.4) {
      for (let k = 0; k < 2; k++) {
        scatter(D, 'desert-mesa', 'desert', uni(0.8, 1.4), true, () => ({ x: p.x + uni(-16, 16), z: p.z + uni(-16, 16) }));
      }
    }
  }
  park('zero-turn', 'desert', desertSites[0] ?? null);
  park('zero-turn', 'desert', desertSites[1] ?? null);
  park('push-bike', 'desert', desertSites[0] ?? null);

  // ============================================================================================================
  // Forest (west): villages in clearings, dense trees, logs, ferns
  // ============================================================================================================
  /** Low-frequency noise: patches with trees and clearings between them. */
  const clumpy = (p: Pt): boolean =>
    Math.sin(p.x * 0.021 + 0.7) * Math.cos(p.z * 0.018 - 1.3) + 0.6 * Math.sin((p.x - p.z) * 0.013 + 2.1) > -0.4;
  const forestSites: Pt[] = [];
  for (const want of [{ x: -330, z: 80 }, { x: -420, z: -90 }]) {
    const c = siteFor('forest', want, 14);
    if (!c) continue;
    village(F, c, 'log-cabin', 3, 4 + Math.floor(rnd() * 3), 12, null);
    forestSites.push(c);
  }
  for (let i = 0; i < 650; i++) {
    const r = rnd();
    const id = r < 0.6 ? 'broadleaf-tree' : r < 0.9 ? 'cone-pine' : 'giant-oak';
    const s = id === 'giant-oak' ? 4 * uni(0.9, 1.5) : uni(0.85, 1.25);
    treeAt(F, id, 'forest', s, clumpy);
  }
  for (let i = 0; i < 40; i++) {
    const r = rnd();
    if (r < 0.34) scatter(F, 'fallen-log', 'forest', 2 * uni(0.9, 1.1), true, anywhere, clumpy);
    else if (r < 0.67) scatter(F, 'tree-stump', 'forest', uni(0.8, 1.1), true, anywhere, clumpy);
    else scatter(F, 'garden-rock', 'forest', fit('garden-rock', uni(1.5, 2.5)), true, anywhere, clumpy);
  }
  for (let i = 0; i < 80; i++) {
    scatter(F, rnd() < 0.5 ? 'fern-clump' : 'round-bush', 'forest', uni(0.8, 1.2), false, anywhere, clumpy);
  }
  for (let i = 0; i < 6; i++) {
    scatter(F, 'mushroom-lamp', 'forest', 1.2, false, anywhere, clumpy);
  }
  park('ride-on', 'forest', forestSites[0] ?? null);
  park('ride-on', 'forest', forestSites[0] ?? null);
  park('ride-on', 'forest', forestSites[1] ?? null);

  // ============================================================================================================
  // Tundra (north): snow-pines, ice, snowmen, lodge villages, frozen ponds
  // ============================================================================================================
  const tundraSites: Pt[] = [];
  for (const want of [{ x: -60, z: -340 }, { x: 90, z: -420 }]) {
    const c = siteFor('tundra', want, 14);
    if (!c) continue;
    village(T, c, 'snow-lodge', 1, 4 + Math.floor(rnd() * 3), 13, null);
    tundraSites.push(c);
  }
  for (let i = 0; i < 3; i++) {
    const r = uni(10, 20);
    const p = findSpot(anywhere, r * 0.6, 'tundra', 300);
    if (!p) continue;
    const pond = new THREE.Mesh(
      new THREE.CircleGeometry(r, 32).rotateX(-Math.PI / 2).translate(p.x, 0.02, p.z),
      flatLayer(new THREE.MeshStandardMaterial({ color: 0xbfe6f5, roughness: 0.2 }), LAYER.area),
    );
    pond.receiveShadow = true;
    scene.add(pond);
    reserved.push(rectOf(p.x, p.z, r, r));
  }
  for (let i = 0; i < 450; i++) {
    treeAt(T, 'snow-pine', 'tundra', uni(0.85, 1.2));
  }
  for (let i = 0; i < 60; i++) {
    scatter(T, 'ice-rock', 'tundra', fit('ice-rock', uni(1.5, 3)), true);
  }
  for (let i = 0; i < 12; i++) {
    scatter(T, 'snowman', 'tundra', uni(0.9, 1.1), true);
  }
  park('push-bike', 'tundra', tundraSites[0] ?? null);
  park('push-bike', 'tundra', tundraSites[1] ?? null);

  // ============================================================================================================
  // Farmland (south): three farmyards, six fields with fences, trees along the edges
  // ============================================================================================================
  const yardSites: Pt[] = [];
  for (let y = 0; y < 3; y++) {
    const c = findSpot(anywhere, 22, 'farmland', 400);
    if (!c) continue;
    placeAt(Fm, 'barn', 5, Math.floor(rnd() * 4) * (Math.PI / 2), true, { x: c.x - 10, z: c.z - 8 });
    placeAt(Fm, 'silo', 5, 0, true, { x: c.x + 16, z: c.z - 8 });
    placeAt(Fm, 'haystack', 1, 0, true, { x: c.x + 8, z: c.z + 8 });
    placeAt(Fm, 'haystack', 1, 0, true, { x: c.x - 10, z: c.z + 10 });
    if (rnd() < 0.6) placeAt(Fm, 'haystack', 1, 0, true, { x: c.x + 15, z: c.z + 12 });
    placeAt(Fm, 'scarecrow', 1, 0, true, { x: c.x - 2, z: c.z + 6 });
    // Walk points around the yard (never inside a box).
    for (const [dx, dz] of [[0, 0], [0, 14], [-14, 0], [14, -2]]) walk(c.x + dx, c.z + dz);
    // Parked machines: a combine and a ride-on in the first two yards. Combines keep 6 clear of boxes.
    if (y < 2) {
      park('combine', 'farmland', c, 6, 14);
      park('ride-on', 'farmland', c, 6, 14);
    }
    yardSites.push(c);
    reserved.push(rectOf(c.x, c.z, 22, 22));
  }

  /** A field may sit on this rectangle: its perimeter is free and it overlaps no reserved zone. */
  const fieldOk = (r: Rect): boolean => {
    for (let x = r.minX; x <= r.maxX; x += 5) {
      for (const z of [r.minZ, r.maxZ]) {
        if (biomeAt(x, z) !== 'farmland' || !free(x, z, 3)) return false;
      }
    }
    for (let z = r.minZ; z <= r.maxZ; z += 5) {
      for (const x of [r.minX, r.maxX]) {
        if (!free(x, z, 3)) return false;
      }
    }
    return !reserved.some((q) => overlaps(q, r));
  };
  // Wheat and fences are authored small: scale 2. Steps follow the measured sizes so rows and sections touch.
  const wheatM = measure('wheat-patch', 2, 0);
  const fenceX = measure('wooden-fence', 2, 0);
  const fenceZ = measure('wooden-fence', 2, Math.PI / 2);
  const wheatStep = 2 * Math.max(wheatM.hw, wheatM.hd);
  const fenceStepX = 2 * fenceX.hw;
  const fenceStepZ = 2 * fenceZ.hd;
  let fields = 0;
  for (let t = 0; t < 600 && fields < 6; t++) {
    const c = anywhere();
    const swap = rnd() < 0.5;
    const r = rectOf(c.x, c.z, swap ? 20 : 25, swap ? 25 : 20);
    if (!fieldOk(r)) continue;
    fields++;
    reserved.push(growRect(r, 2));
    // Rows of wheat.
    for (let x = r.minX + wheatStep / 2; x < r.maxX; x += wheatStep) {
      for (let z = r.minZ + wheatStep / 2; z < r.maxZ; z += wheatStep) {
        Fm.push({ id: 'wheat-patch', x: x + wheatM.ox, z: z + wheatM.oz, yaw: 0, scale: 2 });
      }
    }
    // Wooden fence around the edge, one box per section.
    for (let x = r.minX + fenceX.hw; x < r.maxX; x += fenceStepX) {
      drop(Fm, fenceX, { x, z: r.minZ }, true);
      drop(Fm, fenceX, { x, z: r.maxZ }, true);
    }
    for (let z = r.minZ + fenceZ.hd; z < r.maxZ; z += fenceStepZ) {
      drop(Fm, fenceZ, { x: r.minX, z }, true);
      drop(Fm, fenceZ, { x: r.maxX, z }, true);
    }
    // A few broadleaf trees along the field edges, outside the fence.
    for (let k = 0; k < 3; k++) {
      const p = findSpot(() => ({ x: uni(r.minX - 8, r.maxX + 8), z: uni(r.minZ - 8, r.maxZ + 8) }), 0.6, 'farmland', 60);
      if (p) tree(Fm, 'broadleaf-tree', uni(0.9, 1.2), p);
    }
  }

  // ============================================================================================================
  // Static batches: one merged group per biome.
  // ============================================================================================================
  const groups: [string, Batch][] = [
    ['desert-scenery', batches.desert],
    ['forest-scenery', batches.forest],
    ['tundra-scenery', batches.tundra],
    ['farm-scenery', batches.farm],
  ];
  for (const [name, batch] of groups) {
    scene.add(buildStaticPrefabs(batch, { lights: false, name }));
  }

  let time = 0;
  return {
    boxes,
    walkPoints,
    parked,
    dewBarrels,
    update(dt: number) {
      time += dt;
      banners.forEach((g, i) => { g.rotation.z = Math.sin(time * 1.6 + i * 1.3) * 0.06; });
      if (sock) sock.rotation.y = Math.sin(time * 0.9) * 0.5;
      for (const p of steamPuffs) {
        const t = ((time * p.speed + p.phase) % p.maxH) / p.maxH;
        p.mesh.position.set(p.baseX + Math.sin(time * 1.7 + p.phase) * 0.35, 0.4 + t * p.maxH, p.baseZ);
        p.mesh.scale.setScalar(0.6 + t * 1.1);
        (p.mesh.material as THREE.MeshStandardMaterial).opacity = (1 - t) * 0.42;
      }
      for (const f of flickers) {
        f.mat.emissiveIntensity = f.base + Math.sin(time * f.speed) * f.amp;
      }
    },
  };
}
