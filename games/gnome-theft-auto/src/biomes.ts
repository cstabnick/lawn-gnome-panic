// The four biomes around Turfton (desert, forest, tundra, farmland), Fort Sandpit and the airfield (issue 1I).
// world.ts owns the ground meshes, the city and the highways; this module builds what stands on the biome ground.
// Hand-placed things (props, setpieces, barrels, banners, the windsock, walk points, reserved zones) come from the
// region documents in src/data/levels/ through levels.ts. The scatter is a seeded generator per region: each one
// continues the PRNG stream from its document's base.seed, and nothing else draws random numbers.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildPrefab, type StaticPrefabPlacement } from '@lawn/prefabs';
import { buildStaticCells } from './cull';
import { LAYER, flatLayer } from '@lawn/depth';
import { mulberry32 } from '@lawn/level';
import { AIRFIELD, BASE, CITY_HALF, COLORS, HIGHWAYS, ROAD_WIDTH, WORLD_HALF, biomeAt, type Highway } from './config';
import { GENERATORS, LAYOUT, REGION_IDS, REGIONS, markerNum, markersOf, waterBodies, waterPaths, type GtaProp, type Region, type RegionId, type WorldMarker } from './levels';
import { reservedRects } from './sites';
import type { Box, BiomeId, DewBarrel, ParkedSpot, VehicleKind } from './types';
import { heightAt, waterAt, withGround } from './terrain';
import { addGroundToGeometry, placeOnGround } from './terrainMesh';
import { onWaterCourse } from './water';

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

/** The highest ground under a rectangle: sampled every 4 m, corners and centre included. */
const maxGround = (r: Rect): number => {
  const nx = Math.max(1, Math.ceil((r.maxX - r.minX) / 4));
  const nz = Math.max(1, Math.ceil((r.maxZ - r.minZ) / 4));
  let top = heightAt((r.minX + r.maxX) / 2, (r.minZ + r.maxZ) / 2);
  for (let i = 0; i <= nx; i++) {
    for (let j = 0; j <= nz; j++) {
      top = Math.max(top, heightAt(r.minX + ((r.maxX - r.minX) * i) / nx, r.minZ + ((r.maxZ - r.minZ) * j) / nz));
    }
  }
  return top;
};
/** Absolute top of a box `height` above the ground: the highest ground under a long box (over 8 m), the centre's otherwise. */
const topOf = (r: Rect, height: number): number => {
  const long = Math.max(r.maxX - r.minX, r.maxZ - r.minZ) > 8;
  return (long ? maxGround(r) : heightAt((r.minX + r.maxX) / 2, (r.minZ + r.maxZ) / 2)) + height;
};
/** A collider over rectangle r whose top is `height` above the ground under it. */
const boxAt = (r: Rect, height: number): Box =>
  ({ minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ, h: topOf(r, height) });

/** The most the ground under a building's footprint may vary (centre and corners), in metres. */
const LEVEL_TOL = 1.0;
/** A solid prefab whose collider's shorter side is at least this is a building and must stand on level ground. */
const BUILDING_SIDE = 2.5;
/** True when the ground at the rectangle's centre and 4 corners varies by at most LEVEL_TOL. */
const levelEnough = (r: Rect): boolean => {
  const cx = (r.minX + r.maxX) / 2, cz = (r.minZ + r.maxZ) / 2;
  const hs = [heightAt(cx, cz), heightAt(r.minX, r.minZ), heightAt(r.maxX, r.minZ), heightAt(r.minX, r.maxZ), heightAt(r.maxX, r.maxZ)];
  return Math.max(...hs) - Math.min(...hs) <= LEVEL_TOL;
};
/** A solid prefab `m` centred on p may stand there: buildings (collider min side >= BUILDING_SIDE) need level ground. */
const sitable = (m: Measure, p: Pt, solid: boolean): boolean =>
  !solid || 2 * Math.min(m.hw, m.hd) < BUILDING_SIDE || levelEnough(rectOf(p.x, p.z, m.hw, m.hd));

function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

/** Distance from (x, z) to the nearest centre line of `roads` (every highway by default). */
function roadDist(x: number, z: number, roads: readonly { points: [number, number][] }[] = HIGHWAYS): number {
  let d = Infinity;
  for (const h of roads) {
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

export function buildBiomes(scene: THREE.Scene): BiomeBuild {
  const noRandom = (): number => { throw new Error('biomes: random numbers are only drawn inside a scatter generator'); };
  let rnd: () => number = noRandom;
  const boxes: Box[] = [];
  const walkPoints: Pt[] = [];
  const parked: ParkedSpot[] = [];
  const banners: THREE.Group[] = [];
  const steamPuffs: { mesh: THREE.Mesh; baseX: number; baseY: number; baseZ: number; phase: number; speed: number; maxH: number }[] = [];
  const flickers: { mat: THREE.MeshStandardMaterial; base: number; amp: number; speed: number }[] = [];
  let sock: THREE.Object3D | null = null;
  /** Zones scenery stays out of (fort, airfield, villages, yards, fields, landmarks), grown where they need clearance. */
  const reserved: Rect[] = [];
  const batches: Record<'desert' | 'forest' | 'tundra' | 'farm' | 'highland' | 'coast' | 'campus' | 'estate', Batch> = {
    desert: [], forest: [], tundra: [], farm: [], highland: [], coast: [], campus: [], estate: [],
  };

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
  // What the running generator sees of the world. Version 2 biome scatters first replay version 1 exactly, so for that
  // part startGenerator sets these from base.params: the old world half (600), the old fence line (595, which was a
  // collider then) and only the highways that existed (the first `roads` of LAYOUT.highways).
  let half = H;
  let oldFence: number | null = null;
  let genRoads: readonly Highway[] = HIGHWAYS;
  /** True when one of the old perimeter fence's four colliders (at |x| or |z| = oldFence) comes within r of (x, z). */
  const oldFenceNear = (x: number, z: number, r: number): boolean => {
    if (oldFence === null) return false;
    const e = oldFence;
    const box = (minX: number, maxX: number, minZ: number, maxZ: number) =>
      x > minX - r && x < maxX + r && z > minZ - r && z < maxZ + r;
    return box(-e - 0.8, -e + 0.8, -e, e) || box(e - 0.8, e + 0.8, -e, e)
      || box(-e, e, -e - 0.8, -e + 0.8) || box(-e, e, e - 0.8, e + 0.8);
  };
  const anywhere = (): Pt => ({ x: uni(-half + 14, half - 14), z: uni(-half + 14, half - 14) });

  /** A spot an object of radius `margin` can stand on: in the world, off Turfton and the highways, outside the reserved zones, clear of boxes. */
  const free = (x: number, z: number, margin: number): boolean => {
    if (Math.abs(x) > half - 12 || Math.abs(z) > half - 12) return false;
    if (Math.abs(x) <= CITY_HALF + margin && Math.abs(z) <= CITY_HALF + margin) return false;
    if (roadDist(x, z, genRoads) < ROAD_CLEAR + margin) return false;
    if (reserved.some((r) => inRect(r, x, z, margin))) return false;
    return !boxNear(x, z, margin) && !oldFenceNear(x, z, margin);
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
    if (onWaterCourse(p.x, p.z, Math.max(m.hw, m.hd) + 3)) return;
    batch.push(withGround({ id: m.id, x: p.x + m.ox, z: p.z + m.oz, yaw: m.yaw, scale: m.s }));
    if (solid) addBox(boxAt({ minX: p.x - m.hw, maxX: p.x + m.hw, minZ: p.z - m.hd, maxZ: p.z + m.hd }, m.h));
  };

  /** One prefab on a random free spot of `biome`. Returns the spot, or null. */
  const scatter = (
    batch: Batch, id: string, biome: BiomeId, scale: number, solid: boolean,
    pick: () => Pt = anywhere, ok?: (p: Pt) => boolean,
  ): Pt | null => {
    const m = measure(id, scale, uni(0, TWO_PI));
    const p = findSpot(pick, Math.max(m.hw, m.hd, 0.5), biome, 200, (q) => sitable(m, q, solid) && (!ok || ok(q)));
    if (p) drop(batch, m, p, solid);
    return p;
  };

  /** One prefab at a fixed point, if the spot is free. */
  const placeAt = (batch: Batch, id: string, scale: number, yaw: number, solid: boolean, p: Pt): boolean => {
    const m = measure(id, scale, yaw);
    if (!free(p.x, p.z, Math.max(m.hw, m.hd, 0.5)) || !sitable(m, p, solid)) return false;
    drop(batch, m, p, solid);
    return true;
  };

  /** Registers a box collider only if its bounding radius stays clear of every highway leg. */
  /** `b.h` is the box's height above the ground (not an absolute top). */
  const addSafeBox = (b: Box, extraRoadClear = 1): boolean => {
    const cx = (b.minX + b.maxX) / 2;
    const cz = (b.minZ + b.maxZ) / 2;
    const r = Math.hypot((b.maxX - b.minX) / 2, (b.maxZ - b.minZ) / 2);
    if (roadDist(cx, cz) < ROAD_CLEAR + r + extraRoadClear) return false;
    addBox(boxAt(b, b.h));
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

  /** Merges world-space geometries (built at their absolute heights) onto the ground. */
  const addWorld = (
    geos: THREE.BufferGeometry[], material: THREE.Material, castShadow = true, receiveShadow = true,
  ): THREE.Mesh | null => addMerged(geos.map((g) => addGroundToGeometry(g)), material, castShadow, receiveShadow);

  /** Trunk half-size. The giant oak's trunk radius is 0.225 per unit of scale (0.9 at its full scale of 4). */
  const trunkOf = (id: string, scale: number): number => (id === 'giant-oak' ? 0.225 * scale : 0.5);
  /** A tree is drawn at its trunk; only the trunk is solid (flyers pass over the crown). */
  const tree = (batch: Batch, id: string, scale: number, p: Pt): void => {
    const t = trunkOf(id, scale);
    const yaw = uni(0, TWO_PI);
    if (onWaterCourse(p.x, p.z, t + 3)) return;
    batch.push(withGround({ id, x: p.x, z: p.z, yaw, scale }));
    addBox(boxAt({ minX: p.x - t, maxX: p.x + t, minZ: p.z - t, maxZ: p.z + t }, localBox(id).max.y * scale));
  };
  const treeAt = (batch: Batch, id: string, biome: BiomeId, scale: number, ok?: (p: Pt) => boolean): Pt | null => {
    const t = trunkOf(id, scale);
    // A trunk is a solid collider: a giant oak's (min side at least BUILDING_SIDE) must stand on level ground too.
    const p = findSpot(anywhere, t + 0.1, biome, 200, (q) => (2 * t < BUILDING_SIDE || levelEnough(rectOf(q.x, q.z, t, t))) && (!ok || ok(q)));
    if (p) tree(batch, id, scale, p);
    return p;
  };

  const walk = (x: number, z: number): void => {
    if (Math.abs(x) < half - 2 && Math.abs(z) < half - 2 && !boxNear(x, z, 0.6) && !oldFenceNear(x, z, 0.6) && !onWaterCourse(x, z, 2)) walkPoints.push({ x, z });
  };

  /** A village centre near `want`: the first nearby point of `biome` at least 30 from every highway. */
  const siteFor = (biome: BiomeId, want: Pt, radius: number): Pt | null => {
    const offs = [[0, 0], [0, 40], [0, -40], [40, 0], [-40, 0], [30, 30], [-30, -30], [30, -30], [-30, 30]];
    for (const [dx, dz] of offs) {
      const p = { x: want.x + dx, z: want.z + dz };
      if (biomeAt(p.x, p.z) === biome && roadDist(p.x, p.z, genRoads) >= 30 && free(p.x, p.z, radius)) return p;
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
      if (!free(p.x, p.z, Math.max(m.hw, m.hd, 0.5)) || !sitable(m, p, true)) continue;
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
  // Every reserve marker and every slot (sites.ts): later epics' ground stays clear.
  for (const r of reservedRects()) reserved.push({ minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ });

  // ============================================================================================================
  // Fort Sandpit (desert)
  // ============================================================================================================
  const fortFloor = new THREE.Mesh(
    addGroundToGeometry(new THREE.PlaneGeometry(BASE.maxX - BASE.minX, BASE.maxZ - BASE.minZ)
      .rotateX(-Math.PI / 2)
      .translate((BASE.minX + BASE.maxX) / 2, 0.015, (BASE.minZ + BASE.maxZ) / 2)),
    flatLayer(new THREE.MeshStandardMaterial({ color: COLORS.sand }), LAYER.area),
  );
  fortFloor.receiveShadow = true;
  scene.add(fortFloor);

  // Sandbag walls: tiled with sandbag-wall prefabs, one box per straight run. Runs are axis-aligned.
  const wallH = BASE.wallHeight;
  const wallRun = (x0: number, z0: number, x1: number, z1: number): void => {
    const alongX = z0 === z1;
    const r: Rect = alongX
      ? { minX: x0, maxX: x1, minZ: z0 - WALL_T / 2, maxZ: z0 + WALL_T / 2 }
      : { minX: x0 - WALL_T / 2, maxX: x0 + WALL_T / 2, minZ: z0, maxZ: z1 };
    addBox(boxAt(r, wallH));
  };
  const gateL = BASE.gateX - BASE.gateWidth / 2;
  const gateR = BASE.gateX + BASE.gateWidth / 2;
  wallRun(BASE.minX, BASE.minZ, BASE.maxX, BASE.minZ);   // south
  wallRun(BASE.minX, BASE.maxZ, gateL, BASE.maxZ);       // north, west of the gate
  wallRun(gateR, BASE.maxZ, BASE.maxX, BASE.maxZ);       // north, east of the gate
  wallRun(BASE.minX, BASE.minZ, BASE.minX, BASE.maxZ);   // west
  wallRun(BASE.maxX, BASE.minZ, BASE.maxX, BASE.maxZ);   // east

  // The Whirligig pad: a dark disc and a yellow ring. Drawn as plain meshes (it is a pad, not a prop).
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 0.06, 40),
    flatLayer(new THREE.MeshStandardMaterial({ color: 0x3a3d42 }), LAYER.road),
  );
  placeOnGround(pad, BASE.padX, BASE.padZ, 0.03);
  pad.receiveShadow = true;
  scene.add(pad);
  scene.add(new THREE.Mesh(
    addGroundToGeometry(new THREE.RingGeometry(3.6, 4.2, 48).rotateX(-Math.PI / 2).translate(BASE.padX, 0.065, BASE.padZ)),
    flatLayer(new THREE.MeshStandardMaterial({ color: 0xf2c230 }), LAYER.marking),
  ));

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
      mergeGeometries(geos.map((g) => addGroundToGeometry(g)), false) ?? new THREE.BufferGeometry(),
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

  // ============================================================================================================
  // Hand-placed props, from the region documents (one placement per prop, in region then document order).
  // ============================================================================================================
  const dewBarrels: DewBarrel[] = [];
  const placeDewBarrel = (x: number, z: number, s: number, yaw: number): void => {
    const m = measure('gta-dew-barrel', s, yaw);
    const mesh = buildPrefab('gta-dew-barrel', { lights: false });
    mesh.scale.setScalar(s);
    placeOnGround(mesh, x, z);
    mesh.rotation.y = yaw;
    scene.add(mesh);
    boxes.push(boxAt({ minX: x + m.ox - m.hw, maxX: x + m.ox + m.hw, minZ: z + m.oz - m.hd, maxZ: z + m.oz + m.hd }, m.h));
    dewBarrels.push({ x, y: heightAt(x, z) + 0.6, z, mesh, blown: false });
  };

  const batchByName: Record<string, Batch> = {
    'desert-scenery': batches.desert, 'forest-scenery': batches.forest, 'tundra-scenery': batches.tundra, 'farm-scenery': batches.farm,
    'highland-scenery': batches.highland, 'coast-scenery': batches.coast, 'campus-scenery': batches.campus, 'estate-scenery': batches.estate,
  };
  /** A hand-placed prefab from a region document. x, z is the prefab's origin (not its footprint centre). */
  const placeProp = (region: Region, p: GtaProp): void => {
    if (p.prefab === 'team-banner') {
      const b = shadowed(buildPrefab('team-banner', { lights: false, ...(p.tint ? { tint: parseInt(p.tint.slice(1), 16) } : {}) }));
      b.scale.setScalar(p.scale ?? 1);
      placeOnGround(b, p.x, p.z);
      b.rotation.y = p.rot ?? 0;
      scene.add(b);
      banners.push(b as THREE.Group);
      return;
    }
    if (p.prefab === 'windsock') {
      const w = shadowed(buildPrefab('windsock', { lights: false }));
      w.scale.setScalar(p.scale ?? 1);
      placeOnGround(w, p.x, p.z);
      w.rotation.y = p.rot ?? 0;
      scene.add(w);
      sock = w.getObjectByName('sock') ?? null;
      return;
    }
    if (p.prefab === 'gta-dew-barrel') { placeDewBarrel(p.x, p.z, p.scale ?? 1, p.rot ?? 0); return; }
    const batch = region.data.batch ? batchByName[region.data.batch] : undefined;
    if (!batch) throw new Error(`biomes: region ${region.id} has no scenery batch for prop ${p.prefab}`);
    const m = measure(p.prefab, p.scale ?? 1, p.rot ?? 0);
    // A solid prop whose collider is building-sized must stand on level ground: on a slope it is skipped (its spot is fixed).
    if (!sitable(m, { x: p.x - m.ox, z: p.z - m.oz }, !!p.solid)) return;
    batch.push(withGround({ id: m.id, x: p.x, z: p.z, yaw: m.yaw, scale: m.s }));
    if (p.solid) {
      const cx = p.x - m.ox, cz = p.z - m.oz;
      addBox(boxAt({ minX: cx - m.hw, maxX: cx + m.hw, minZ: cz - m.hd, maxZ: cz + m.hd }, m.h));
    }
  };
  for (const id of REGION_IDS) for (const p of REGIONS[id].props) placeProp(REGIONS[id], p);

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
      const px = x + (i % 3 - 1) * 0.45, pz = z + (Math.floor(i / 3) - 0.5) * 0.45;
      const baseY = heightAt(px, pz);
      m.position.set(px, baseY + 0.4, pz);
      scene.add(m);
      steamPuffs.push({ mesh: m, baseX: px, baseY, baseZ: pz, phase: (i / count) * TWO_PI, speed: 0.9 + (i % 3) * 0.25, maxH });
    }
  };

  /** Builders for the code-built landmarks. Each takes its setpiece marker: the marker's position is the anchor. */
  const SETPIECES: Record<string, (m: WorldMarker) => void> = {
    // 1. The Compost Heap.
    'compost-heap': (m) => {
      const cx = m.x, cz = m.z;
      const heapPad = new THREE.Mesh(
        addGroundToGeometry(new THREE.CircleGeometry(19, 28).rotateX(-Math.PI / 2).translate(cx, 0.015, cz)),
        flatLayer(new THREE.MeshStandardMaterial({ color: 0x4b3b23, roughness: 1 }), LAYER.area),
      );
      heapPad.receiveShadow = true;
      scene.add(heapPad);

      // Steaming mulch mounds (the mounds themselves are props).
      for (const [mx, mz] of [[cx - 10, cz - 8], [cx + 11, cz - 7], [cx - 9, cz + 10], [cx + 9, cz + 11]] as [number, number][]) {
        addSteam(mx, mz, 2, 4.5);
      }

      // Rusted wheelbarrow cranes.
      const rustGeos: THREE.BufferGeometry[] = [];
      const steelGeos: THREE.BufferGeometry[] = [];
      for (const [kx, kz, ry] of [[cx - 7, cz + 3, 0.5], [cx + 8, cz - 3, -2.4]] as [number, number, number][]) {
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
      const tx = cx, tz = cz - 12;
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
      addWorld([
        cylGeo(1.66, 1.66, 0.45, 14, tx - 2.6, 2.1, tz, 0, 0, Math.PI / 2),
        cylGeo(1.66, 1.66, 0.45, 14, tx + 2.6, 2.1, tz, 0, 0, Math.PI / 2),
      ], amberBands);
      addWorld(rustGeos, new THREE.MeshStandardMaterial({ color: 0x8a4726, roughness: 0.9 }));
      addWorld(steelGeos, new THREE.MeshStandardMaterial({ color: 0x4b4f54, roughness: 0.65, metalness: 0.35 }));

      // Glowing steam-vent pad (non-solid so bikes/mowers can roll straight across).
      const vx = cx, vz = cz + 4;
      const grate = new THREE.Mesh(
        addGroundToGeometry(new THREE.CylinderGeometry(3.1, 3.4, 0.08, 24).translate(vx, 0.04, vz)),
        new THREE.MeshStandardMaterial({ color: 0x2f3338, roughness: 0.7 }),
      );
      grate.receiveShadow = true;
      scene.add(grate);
      const ventMat = flatLayer(new THREE.MeshStandardMaterial({ color: 0x8bf5cc, emissive: 0x35c998, emissiveIntensity: 0.85 }), LAYER.marking);
      scene.add(new THREE.Mesh(addGroundToGeometry(new THREE.RingGeometry(1.4, 2.4, 24).rotateX(-Math.PI / 2).translate(vx, 0.085, vz)), ventMat));
      flickers.push({ mat: ventMat, base: 0.85, amp: 0.25, speed: 3.4 });
      addSteam(vx, vz, 5, 6.2);
    },

    // 2a. The Unmowed's ring clearing (its stones, toadstools, campfire, seats and lamps are props).
    'unmowed-ring': (m) => {
      const ux = m.x, uz = m.z;
      const clearing = new THREE.Mesh(
        addGroundToGeometry(new THREE.CircleGeometry(13, 28).rotateX(-Math.PI / 2).translate(ux, 0.015, uz)),
        flatLayer(new THREE.MeshStandardMaterial({ color: 0x4ca34b, roughness: 1 }), LAYER.area),
      );
      clearing.receiveShadow = true;
      scene.add(clearing);
    },

    // 2b. Abandoned Chapel of Mulch van.
    'chapel-van': (m) => {
      const vx = m.x, vz = m.z, vyaw = markerNum(m, 'yaw');
      const vanBody = addMerged([
        boxGeo(2.5, 2.0, 4.6, 0, 1.35, -0.3),
        boxGeo(2.3, 1.35, 1.5, 0, 1.0, 2.4),
      ], new THREE.MeshStandardMaterial({ color: 0x7b8c74, roughness: 0.88 }));
      if (vanBody) { placeOnGround(vanBody, vx, vz); vanBody.rotation.set(0.06, vyaw, -0.14); }
      const vanTrim = addMerged([
        boxGeo(2.7, 0.5, 3.2, 0, 0.85, -0.5), // 10 cm proud of the body: 2 cm z-fights at range
        boxGeo(2.1, 0.65, 0.12, 0, 1.5, 2.08),
        cylGeo(0.45, 0.45, 0.3, 12, 1.2, 0.45, 1.8, 0, 0, Math.PI / 2),
        cylGeo(0.45, 0.45, 0.3, 12, -1.2, 0.45, 1.8, 0, 0, Math.PI / 2),
        cylGeo(0.45, 0.45, 0.3, 12, 1.2, 0.45, -1.5, 0, 0, Math.PI / 2),
        cylGeo(0.45, 0.45, 0.3, 12, -1.9, 0.16, -2.0, Math.PI / 2, 0, 0),
      ], new THREE.MeshStandardMaterial({ color: 0x5c3621, roughness: 0.9 }));
      if (vanTrim) { placeOnGround(vanTrim, vx, vz); vanTrim.rotation.set(0.06, vyaw, -0.14); }
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
        placeOnGround(sign, vx + Math.cos(vyaw) * 1.32, vz - Math.sin(vyaw) * 1.32, 1.45);
        sign.rotation.set(0, vyaw + Math.PI / 2, 0);
        scene.add(sign);
      }
      addSafeBox({ minX: vx - 3.1, maxX: vx + 3.1, minZ: vz - 3.1, maxZ: vz + 3.1, h: 2.5 });
    },

    // 2c. Boarded-up oversized Tall House Porch (its lanterns and pencil are props).
    'tall-house-porch': (m) => {
      const px = m.x, pz = m.z;
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
      addWorld(porchWood, new THREE.MeshStandardMaterial({ color: 0x69503a, roughness: 0.92 }));
      addWorld([
        boxGeo(0.4, 9.0, 5.2, px - 6.7, 6.8, pz),             // dark doorway recess
      ], new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 1 }));
      addWorld([
        boxGeo(0.35, 0.9, 6.4, px - 6.3, 5.2, pz, 0, 0.25),   // boarding plank 1
        boxGeo(0.35, 0.9, 6.4, px - 6.3, 7.2, pz, 0, -0.22),  // boarding plank 2
        boxGeo(0.35, 0.9, 6.4, px - 6.3, 9.1, pz, 0, 0.14),   // boarding plank 3
      ], new THREE.MeshStandardMaterial({ color: 0x4b3421, roughness: 0.95 }));
      addSafeBox({ minX: px - 9.2, maxX: px + 5.0, minZ: pz - 9.2, maxZ: pz + 9.2, h: 12.6 });
      addSafeBox({ minX: px + 5.0, maxX: px + 6.5, minZ: pz - 4.4, maxZ: pz + 4.4, h: 1.8 });

      const haloMat = new THREE.MeshStandardMaterial({ color: 0xfff0b8, emissive: 0xffc654, emissiveIntensity: 0.8, transparent: true, opacity: 0.45 });
      for (const lz of [pz - 5.2, pz + 5.2]) {
        const halo = new THREE.Mesh(new THREE.SphereGeometry(0.95, 10, 8), haloMat);
        placeOnGround(halo, px + 6.8, lz, 1.0);
        scene.add(halo);
      }
      flickers.push({ mat: haloMat, base: 0.8, amp: 0.35, speed: 6.0 });
    },

    // 3a. Frozen Birdbath Basin derby arena (its torches and seats are props).
    'birdbath-basin': (m) => {
      const bx = m.x, bz = m.z;
      const basinFloor = new THREE.Mesh(
        addGroundToGeometry(new THREE.CircleGeometry(12.2, 40).rotateX(-Math.PI / 2).translate(bx, 0.025, bz)),
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
      addWorld(rimGeos, new THREE.MeshStandardMaterial({ color: 0x899299, roughness: 0.85 }));
    },

    // 3b. Kiln-Resin Shrine behind the northern snowbank (the shrine, campfire and torches are props).
    'kiln-shrine': (m) => {
      const sx = m.x, sz = m.z;
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
      addWorld(bankGeos, new THREE.MeshStandardMaterial({ color: 0xedf4fa, roughness: 0.95 }));
      addSafeBox({ minX: sx - 8.2, maxX: sx - 4.0, minZ: sz - 7.5, maxZ: sz + 7.5, h: 2.2 });
      const hearth = new THREE.Mesh(
        addGroundToGeometry(new THREE.CylinderGeometry(4.2, 4.8, 0.22, 18).translate(sx, 0.11, sz)),
        new THREE.MeshStandardMaterial({ color: 0x6b6661, roughness: 0.9 }),
      );
      hearth.receiveShadow = true;
      scene.add(hearth);
      const resinPool = new THREE.Mesh(
        addGroundToGeometry(new THREE.CylinderGeometry(0.8, 0.9, 0.35, 12).translate(sx + 0.6, 0.25, sz + 2.1)),
        new THREE.MeshStandardMaterial({ color: 0xffa82e, emissive: 0xd96b00, emissiveIntensity: 0.75 }),
      );
      scene.add(resinPool);
    },

    // 3c. Glowing blue Aether Ley-Line Ramp (its crystals and piton are props).
    'ley-ramp': (m) => {
      const ax = m.x, az = m.z;
      const leyMat = new THREE.MeshStandardMaterial({ color: 0x52e5ff, emissive: 0x1aa8e8, emissiveIntensity: 0.9 });
      flickers.push({ mat: leyMat, base: 0.9, amp: 0.25, speed: 2.6 });
      // The crack lies on the ground, so it gets its own copy of the glow on a draw layer (the rails are 3D).
      const crackMat = flatLayer(leyMat.clone(), LAYER.decal);
      flickers.push({ mat: crackMat, base: 0.9, amp: 0.25, speed: 2.6 });
      const leyCrack = new THREE.Mesh(addGroundToGeometry(new THREE.PlaneGeometry(2.8, 16).rotateX(-Math.PI / 2).translate(ax, 0.02, az + 6)), crackMat);
      scene.add(leyCrack);
      // Sloped ramp wedge (low entry at +z = az + 6, launch lip at -z = az - 6, height 3.2).
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
      addGroundToGeometry(wedge);
      wedge.computeVertexNormals();
      const rampMesh = new THREE.Mesh(wedge, new THREE.MeshStandardMaterial({
        color: 0x2b5d7a, roughness: 0.45, metalness: 0.2, side: THREE.DoubleSide,
      }));
      rampMesh.castShadow = true;
      rampMesh.receiveShadow = true;
      scene.add(rampMesh);
      // Glowing blue side rails on the ramp (visual edge strips).
      addWorld([
        boxGeo(0.28, 0.18, 12.4, ax - hw + 0.2, yTop / 2 + 0.12, az, 0, 0.26),
        boxGeo(0.28, 0.18, 12.4, ax + hw - 0.2, yTop / 2 + 0.12, az, 0, 0.26),
      ], leyMat);
    },

    // 4a. Granny Gnertrude's Farmhouse & Barn: only the prize pumpkins and their box (the buildings are props).
    'granny-farm': (m) => {
      const gx = m.x, gz = m.z;
      const pGeos: THREE.BufferGeometry[] = [];
      for (const [px, pz] of [[gx - 11, gz - 5], [gx - 13, gz - 6], [gx - 11, gz - 7.5]] as [number, number][]) {
        const s = new THREE.SphereGeometry(0.95, 10, 8);
        s.scale(1.1, 0.8, 1.1);
        s.translate(px, 0.75, pz);
        pGeos.push(s);
      }
      addWorld(pGeos, new THREE.MeshStandardMaterial({ color: 0xe6731e, roughness: 0.75 }));
      addSafeBox({ minX: gx - 14.2, maxX: gx - 9.8, minZ: gz - 8.7, maxZ: gz - 4.0, h: 1.6 });
    },

    // 4b. Biscuit's Nap: the muddy pawprint crater (the squeaky hot dog is a prop).
    'biscuits-nap': (m) => {
      const nx = m.x, nz = m.z;
      const rim = new THREE.Mesh(
        addGroundToGeometry(new THREE.RingGeometry(17.5, 20.5, 36).rotateX(-Math.PI / 2).translate(nx, 0.015, nz)),
        flatLayer(new THREE.MeshStandardMaterial({ color: 0x7a5b38, roughness: 1 }), LAYER.area),
      );
      rim.receiveShadow = true;
      scene.add(rim);
      const pawPad = (x: number, z: number, rx: number, rz: number): THREE.BufferGeometry => {
        const g = new THREE.CircleGeometry(1, 24);
        g.rotateX(-Math.PI / 2);
        g.scale(rx, 1, rz);
        return addGroundToGeometry(g.translate(x, 0.022, z));
      };
      addMerged([
        pawPad(nx, nz + 3, 11.5, 9.5),       // palm pad
        pawPad(nx - 11, nz - 9, 4.0, 4.8),   // toe 1
        pawPad(nx - 4, nz - 13, 4.0, 4.8),   // toe 2
        pawPad(nx + 4, nz - 13, 4.0, 4.8),   // toe 3
        pawPad(nx + 11, nz - 9, 4.0, 4.8),   // toe 4
      ], flatLayer(new THREE.MeshStandardMaterial({ color: 0x543a20, roughness: 0.95 }), LAYER.decal), false, true);
    },

    // 4c (canal). Southern Drainage Canal: the two channels either side of the south highway, at z = the marker.
    // The carved canal (terrain.ts) is the bed and waterMesh.ts the water; the road bridge is a waterworks prefab.
    // Only the four retaining curbs stay here, as the canal's concrete lips.
    'drainage-canal': (m) => {
      const cx = m.x, canalZ = m.z;
      const concreteGeos: THREE.BufferGeometry[] = [
        // Retaining curbs along north and south banks.
        boxGeo(174, 0.9, 1.0, cx - 103, 0.45, canalZ - 5.2),
        boxGeo(174, 0.9, 1.0, cx - 103, 0.45, canalZ + 5.2),
        boxGeo(174, 0.9, 1.0, cx + 103, 0.45, canalZ - 5.2),
        boxGeo(174, 0.9, 1.0, cx + 103, 0.45, canalZ + 5.2),
      ];
      addWorld(concreteGeos, flatLayer(new THREE.MeshStandardMaterial({ color: 0x7d8084, roughness: 0.9 }), LAYER.area));
    },

    // 4c (throne). Baroness Brenda's lawn-chair throne on the north canal bank (its chairs are props).
    'brenda-throne': (m) => {
      const brx = m.x, brz = m.z;
      addWorld([
        boxGeo(4.4, 0.5, 4.0, brx, 0.25, brz),
        boxGeo(2.8, 0.9, 2.6, brx, 0.95, brz),
        boxGeo(1.9, 1.4, 1.8, brx, 2.1, brz),
        boxGeo(1.8, 1.5, 0.35, brx, 3.2, brz - 0.8),
        cylGeo(0.08, 0.08, 4.6, 8, brx + 1.2, 2.3, brz - 0.5, 0, 0, -0.12),
      ], new THREE.MeshStandardMaterial({ color: 0xd98a2b, roughness: 0.75 }));
      addWorld([
        boxGeo(1.6, 0.25, 1.5, brx, 2.85, brz + 0.1),
        boxGeo(1.6, 1.3, 0.25, brx, 3.35, brz - 0.6),
      ], new THREE.MeshStandardMaterial({ color: 0xeb5e91, roughness: 0.7 }));
      addSafeBox({ minX: brx - 2.3, maxX: brx + 2.3, minZ: brz - 2.1, maxZ: brz + 2.1, h: 4.5 });
    },

    // 4c (raft). Driftwood's turf-raft in the east canal channel (its message bottle is a prop).
    // The raft floats on the canal: its base (0.045 above the ground) is moved to 0.05 below the water surface. addWorld
    // lifts geometry onto the carved bed, so the shift is measured from the bed under the raft's centre (dy); the
    // collider's top moves with it. Keeps today's heights where there is no water.
    'driftwood-raft': (m) => {
      const drx = m.x, drz = m.z;
      const surface = waterAt(drx, drz)?.surface;
      const dy = surface == null ? 0 : surface - 0.05 - 0.045 - heightAt(drx, drz);
      addWorld([
        boxGeo(5.2, 0.35, 3.2, drx, 0.22 + dy, drz, 0.18),
        cylGeo(0.1, 0.12, 3.8, 8, drx - 0.5, 2.1 + dy, drz),
        boxGeo(0.15, 0.15, 2.2, drx - 0.5, 3.3 + dy, drz, 0.18),
      ], new THREE.MeshStandardMaterial({ color: 0x8d6741, roughness: 0.9 }));
      addWorld([
        boxGeo(4.4, 0.16, 2.5, drx, 0.44 + dy, drz, 0.18),
      ], new THREE.MeshStandardMaterial({ color: 0x5ca64c, roughness: 0.95 }));
      addWorld([
        boxGeo(0.08, 1.8, 1.8, drx - 0.4, 2.6 + dy, drz, 0.3),
      ], new THREE.MeshStandardMaterial({ color: 0xd9cbb0, roughness: 0.95 }));
      addSafeBox({ minX: drx - 2.8, maxX: drx + 2.8, minZ: drz - 1.8, maxZ: drz + 1.8, h: 3.8 + dy });
    },

    // 5 (knot-hole). The glowing knot-hole overlook in the perimeter fence (its crate and pail are props).
    'knot-hole': (m) => {
      const kx = m.x, kz = m.z;
      const knotMat = new THREE.MeshStandardMaterial({ color: 0xffe68a, emissive: 0xd9a826, emissiveIntensity: 0.9 });
      flickers.push({ mat: knotMat, base: 0.9, amp: 0.2, speed: 1.8 });
      scene.add(new THREE.Mesh(
        addGroundToGeometry(new THREE.CircleGeometry(1.2, 20).rotateY(Math.PI / 2).translate(kx - 4.4, 4.1, kz)),
        knotMat,
      ));
      scene.add(new THREE.Mesh(
        addGroundToGeometry(new THREE.RingGeometry(1.2, 1.75, 20).rotateY(Math.PI / 2).translate(kx - 4.35, 4.1, kz)),
        new THREE.MeshStandardMaterial({ color: 0x3a2616, roughness: 0.95 }),
      ));
    },

    // 6. Roadside Black Dew stations beside the east and south highway junctions (the pump and barrels are props).
    'dew-station': (m) => {
      const s = { x: m.x, z: m.z, yaw: markerNum(m, 'yaw') };
      const slab = new THREE.Mesh(
        addGroundToGeometry(new THREE.PlaneGeometry(9, 7).rotateX(-Math.PI / 2).translate(s.x, 0.02, s.z)),
        flatLayer(new THREE.MeshStandardMaterial({ color: 0x676b70, roughness: 0.9 }), LAYER.area),
      );
      slab.receiveShadow = true;
      scene.add(slab);
    },
  };
  for (const m of markersOf('setpiece')) {
    const build = SETPIECES[String(m.data?.builder)];
    if (!build) throw new Error(`biomes: no setpiece builder "${String(m.data?.builder)}" (marker ${m.id})`);
    build(m);
  }

  // ---- The perimeter fence (not a setpiece): posts and rails on |x| = fenceEdge and |z| = fenceEdge -----------------
  // Plus the Old Fence panel: the stretch of the pre-expansion fence line (|x| = the biome generators' params.fence)
  // that still stands around the glowing knot-hole (the knot-hole setpiece marker), five bays long.
  {
    const fenceEdge = LAYOUT.fenceEdge;
    const postGeos: THREE.BufferGeometry[] = [];
    const railGeos: THREE.BufferGeometry[] = [];
    const plankStep = 15;
    const fenceH = 9.5;
    /** One fence bay from t to t + plankStep along x (z fixed at `at`) or along z (x fixed at `at`), with its post at t. */
    const bay = (alongX: boolean, at: number, t: number, knot: boolean): void => {
      const mid = t + plankStep / 2;
      const P = (w: number, h: number, d: number, a: number, y: number, b: number) =>
        alongX ? boxGeo(w, h, d, a, y, b) : boxGeo(d, h, w, b, y, a);
      postGeos.push(P(1.3, fenceH + 1.2, 1.3, t, (fenceH + 1.2) / 2, at));
      if (knot) {
        // A narrow window for the glowing knot-hole panel.
        postGeos.push(
          P((plankStep - 4.0) / 2, fenceH, 0.45, mid - (plankStep + 1.4) / 4, fenceH / 2, at),
          P((plankStep - 4.0) / 2, fenceH, 0.45, mid + (plankStep + 1.4) / 4, fenceH / 2, at),
          P(4.0, 2.8, 0.45, mid, 1.4, at),
          P(4.0, 4.2, 0.45, mid, 7.4, at),
        );
      } else {
        postGeos.push(P(plankStep - 1.3, fenceH, 0.45, mid, fenceH / 2, at));
      }
      railGeos.push(P(plankStep, 0.55, 0.85, mid, 2.6, at), P(plankStep, 0.55, 0.85, mid, 7.6, at));
    };
    for (const side of [-1, 1]) {
      for (let t = -fenceEdge; t < fenceEdge; t += plankStep) {
        bay(true, side * fenceEdge, t, false);
        bay(false, side * fenceEdge, t, false);
      }
      postGeos.push(boxGeo(1.3, fenceH + 1.2, 1.3, fenceEdge, (fenceH + 1.2) / 2, side * fenceEdge));
    }
    const knot = markersOf('setpiece').find((m) => m.data?.builder === 'knot-hole');
    const oldEdge = Number(REGIONS['mossy-wood'].base.params.fence);
    if (knot && Number.isFinite(oldEdge)) {
      // The old fence's bays started at -oldEdge every plankStep; keep the two either side of the knot-hole's bay.
      const knotT = -oldEdge + Math.floor((knot.z + oldEdge) / plankStep) * plankStep;
      for (let k = -2; k <= 2; k++) bay(false, -oldEdge, knotT + k * plankStep, k === 0);
      postGeos.push(boxGeo(1.3, fenceH + 1.2, 1.3, -oldEdge, (fenceH + 1.2) / 2, knotT + 3 * plankStep));
      addBox(boxAt({ minX: -oldEdge - 0.8, maxX: -oldEdge + 0.8, minZ: knotT - 2 * plankStep, maxZ: knotT + 3 * plankStep }, fenceH + 1));
    }
    addWorld(postGeos, new THREE.MeshStandardMaterial({ color: 0x735236, roughness: 0.92 }));
    addWorld(railGeos, new THREE.MeshStandardMaterial({ color: 0x523924, roughness: 0.92 }));
    addBox(boxAt({ minX: -fenceEdge - 0.8, maxX: -fenceEdge + 0.8, minZ: -fenceEdge, maxZ: fenceEdge }, fenceH + 1));
    addBox(boxAt({ minX: fenceEdge - 0.8, maxX: fenceEdge + 0.8, minZ: -fenceEdge, maxZ: fenceEdge }, fenceH + 1));
    addBox(boxAt({ minX: -fenceEdge, maxX: fenceEdge, minZ: -fenceEdge - 0.8, maxZ: -fenceEdge + 0.8 }, fenceH + 1));
    addBox(boxAt({ minX: -fenceEdge, maxX: fenceEdge, minZ: fenceEdge - 0.8, maxZ: fenceEdge + 0.8 }, fenceH + 1));
  }

  // Walk points: the hand-placed ones from the region documents (pushed directly, not through walk(), which re-checks boxes).
  for (const m of markersOf('walk')) walkPoints.push({ x: m.x, z: m.z });

  /** Starts a region's scatter generator: checks its id and version, then continues the PRNG stream from its seed. */
  const startGenerator = (id: RegionId): void => {
    const base = REGIONS[id].base;
    const want = GENERATORS[id];
    if (base.id !== want.id || base.version !== want.version) {
      throw new Error(`biomes: ${id} wants generator ${base.id} v${base.version}; this code is ${want.id} v${want.version}`);
    }
    rnd = mulberry32(base.seed ?? 0);
    // The version 1 part of a version 2 scatter: the old world, as that code saw it.
    half = Number(base.params.half);
    oldFence = Number(base.params.fence);
    genRoads = HIGHWAYS.slice(0, Number(base.params.roads));
  };
  /** Starts a batch-3 band's scatter (E01): the whole 2800 map, every highway, a PRNG stream from the document's seed. */
  const startBand = (id: RegionId): void => {
    const base = REGIONS[id].base;
    const want = GENERATORS[id];
    if (base.id !== want.id || base.version !== want.version) {
      throw new Error(`biomes: ${id} wants generator ${base.id} v${base.version}; this code is ${want.id} v${want.version}`);
    }
    rnd = mulberry32(base.seed ?? 0);
    half = H;
    oldFence = null;
    genRoads = HIGHWAYS;
  };
  /**
   * Starts a region's outer-ring pass: the world as it was when the pass was written (base.params.outerHalf, 900: the
   * 1800 x 1800 map, so the batch-3 bands round it do not change what it draws), and a PRNG stream of its own
   * (base.params.outerSeed).
   */
  const startOuter = (id: RegionId): void => {
    half = Number(REGIONS[id].base.params.outerHalf ?? H);
    oldFence = null;
    genRoads = HIGHWAYS;
    rnd = mulberry32(Number(REGIONS[id].base.params.outerSeed));
  };

  // ============================================================================================================
  // Desert: villages, cacti, rocks, mesas, parked mowers
  // ============================================================================================================
  startGenerator('dust-flats');
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
  startGenerator('mossy-wood');
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
  startGenerator('frostbite-fells');
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
      addGroundToGeometry(new THREE.CircleGeometry(r, 32).rotateX(-Math.PI / 2).translate(p.x, 0.02, p.z)),
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
  startGenerator('cloverfield-farms');
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
        Fm.push(withGround({ id: 'wheat-patch', x: x + wheatM.ox, z: z + wheatM.oz, yaw: 0, scale: 2 }));
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
  // Outer ring (generator version 2): the land the map grew by (outside |x|, |z| <= the old half, 600). Runs after
  // every version 1 part, so nothing here can change what those placed.
  // ============================================================================================================
  /** Lighter scatter for one biome's outer ring: its villages, trees, rocks and yards, kept off the new land's water. */
  const outerRing = (id: 'dust-flats' | 'mossy-wood' | 'frostbite-fells' | 'cloverfield-farms'): void => {
    // Water the outer ring keeps clear of: the river centre lines (plus half their width and 8) and the still ponds (8 out).
    const rivers = waterPaths();
    const ponds = waterBodies();
    const outerOk = (p: Pt): boolean => {
      if (Math.max(Math.abs(p.x), Math.abs(p.z)) <= 606) return false;
      for (const w of rivers) {
        for (let i = 0; i + 1 < w.points.length; i++) {
          const [ax, az] = w.points[i];
          const [bx, bz] = w.points[i + 1];
          if (segDist(p.x, p.z, ax, az, bx, bz) < w.width / 2 + 8) return false;
        }
      }
      return !ponds.some((b) => inRect(b, p.x, p.z, 8));
    };
    /** parkOuter: a parked machine near `near`, on a spot outerOk allows (the same rules as park). */
    const parkOuter = (kind: VehicleKind, biome: BiomeId, near: Pt, margin: number, reach: number): void => {
      for (let t = 0; t < 200; t++) {
        const p = { x: near.x + uni(-reach, reach), z: near.z + uni(-reach, reach) };
        if (biomeAt(p.x, p.z) !== biome || !free(p.x, p.z, margin) || !outerOk(p)) continue;
        if (parked.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < 6)) continue;
        parked.push({ x: p.x, z: p.z, yaw: uni(0, TWO_PI), kind });
        return;
      }
    };

    if (id === 'dust-flats') {
      const c = siteFor('desert', { x: 760, z: -300 }, 16);
      if (c && outerOk(c)) {
        village(D, c, 'adobe-hut', 1, 4, 11, 'palm-tree');
        parkOuter('zero-turn', 'desert', c, 3, 36);
      }
      for (let i = 0; i < 90; i++) {
        const cid = rnd() < 0.5 ? 'tall-cactus' : 'barrel-cactus';
        scatter(D, cid, 'desert', uni(0.9, 1.3), true, anywhere, outerOk);
      }
      for (let i = 0; i < 12; i++) {
        scatter(D, 'garden-rock', 'desert', fit('garden-rock', uni(1.5, 3)), true, anywhere, outerOk);
      }
      for (let i = 0; i < 5; i++) {
        scatter(D, 'desert-mesa', 'desert', uni(0.8, 1.4), true, anywhere, outerOk);
      }
    } else if (id === 'mossy-wood') {
      for (let i = 0; i < 220; i++) {
        const r = rnd();
        const tid = r < 0.6 ? 'broadleaf-tree' : r < 0.9 ? 'cone-pine' : 'giant-oak';
        const s = tid === 'giant-oak' ? 4 * uni(0.9, 1.5) : uni(0.85, 1.25);
        treeAt(F, tid, 'forest', s, outerOk);
      }
      for (let i = 0; i < 15; i++) {
        const r = rnd();
        if (r < 0.34) scatter(F, 'fallen-log', 'forest', 2 * uni(0.9, 1.1), true, anywhere, outerOk);
        else if (r < 0.67) scatter(F, 'tree-stump', 'forest', uni(0.8, 1.1), true, anywhere, outerOk);
        else scatter(F, 'garden-rock', 'forest', fit('garden-rock', uni(1.5, 2.5)), true, anywhere, outerOk);
      }
      for (let i = 0; i < 30; i++) {
        scatter(F, rnd() < 0.5 ? 'fern-clump' : 'round-bush', 'forest', uni(0.8, 1.2), false, anywhere, outerOk);
      }
    } else if (id === 'frostbite-fells') {
      const c = siteFor('tundra', { x: 350, z: -760 }, 14);
      if (c && outerOk(c)) {
        village(T, c, 'snow-lodge', 1, 4, 13, null);
        parkOuter('push-bike', 'tundra', c, 3, 36);
      }
      for (let i = 0; i < 200; i++) {
        treeAt(T, 'snow-pine', 'tundra', uni(0.85, 1.2), outerOk);
      }
      for (let i = 0; i < 25; i++) {
        scatter(T, 'ice-rock', 'tundra', fit('ice-rock', uni(1.5, 3)), true, anywhere, outerOk);
      }
      for (let i = 0; i < 6; i++) {
        scatter(T, 'snowman', 'tundra', uni(0.9, 1.1), true, anywhere, outerOk);
      }
    } else {
      const c = findSpot(anywhere, 22, 'farmland', 400, outerOk);
      if (c) {
        placeAt(Fm, 'barn', 5, 0, true, { x: c.x - 10, z: c.z - 8 });
        placeAt(Fm, 'silo', 5, 0, true, { x: c.x + 16, z: c.z - 8 });
        placeAt(Fm, 'haystack', 1, 0, true, { x: c.x + 8, z: c.z + 8 });
        placeAt(Fm, 'haystack', 1, 0, true, { x: c.x - 10, z: c.z + 10 });
        placeAt(Fm, 'scarecrow', 1, 0, true, { x: c.x - 2, z: c.z + 6 });
        walk(c.x, c.z);
        walk(c.x, c.z + 14);
        // Parked before the yard is reserved: its own 22-unit reserve would otherwise cover every spot the combine can reach.
        parkOuter('combine', 'farmland', c, 6, 14);
        reserved.push(rectOf(c.x, c.z, 22, 22));
      }
      for (let i = 0; i < 80; i++) {
        treeAt(Fm, 'broadleaf-tree', 'farmland', uni(0.9, 1.2), outerOk);
      }
      for (let i = 0; i < 20; i++) {
        scatter(Fm, 'hay-bale', 'farmland', 1, true, anywhere, outerOk);
      }
    }
  };
  for (const id of ['dust-flats', 'mossy-wood', 'frostbite-fells', 'cloverfield-farms'] as const) {
    startOuter(id);
    outerRing(id);
  }

  // ============================================================================================================
  // Batch 3 bands (E01): a light scatter per band, each on its own PRNG stream, after every earlier generator.
  // ============================================================================================================
  {
    const Hl = batches.highland;
    startBand('north-highlands');
    for (let i = 0; i < 160; i++) treeAt(Hl, rnd() < 0.6 ? 'cone-pine' : 'snow-pine', 'highland', uni(0.8, 1.2));
    for (let i = 0; i < 40; i++) scatter(Hl, 'garden-rock', 'highland', fit('garden-rock', uni(1.5, 3.5)), true);
    for (let i = 0; i < 12; i++) scatter(Hl, 'stone-cairn', 'highland', uni(0.9, 1.3), true);
  }
  {
    const C = batches.coast;
    const ok = (p: Pt): boolean => p.z < 1140;
    startBand('south-shore');
    for (let i = 0; i < 70; i++) treeAt(C, 'palm-tree', 'coast', uni(0.9, 1.2), ok);
    for (let i = 0; i < 30; i++) scatter(C, 'garden-rock', 'coast', fit('garden-rock', uni(1.2, 2.5)), true, anywhere, ok);
    for (let i = 0; i < 40; i++) scatter(C, 'round-bush', 'coast', uni(0.7, 1.1), false, anywhere, ok);
  }
  {
    const Cp = batches.campus;
    startBand('east-campus');
    for (let i = 0; i < 140; i++) treeAt(Cp, 'broadleaf-tree', 'campus', uni(0.9, 1.3));
    for (let i = 0; i < 50; i++) scatter(Cp, 'round-bush', 'campus', uni(0.8, 1.2), false);
  }
  {
    const Es = batches.estate;
    startBand('west-estates');
    for (let i = 0; i < 140; i++) treeAt(Es, 'broadleaf-tree', 'estate', uni(0.9, 1.4));
    for (let i = 0; i < 30; i++) scatter(Es, 'topiary-cone', 'estate', uni(0.9, 1.2), true);
    for (let i = 0; i < 40; i++) scatter(Es, 'round-bush', 'estate', uni(0.8, 1.2), false);
  }

  rnd = noRandom;
  half = H;

  // ============================================================================================================
  // Static batches: one merged group per biome.
  // ============================================================================================================
  const groups: [string, Batch][] = [
    ['desert-scenery', batches.desert],
    ['forest-scenery', batches.forest],
    ['tundra-scenery', batches.tundra],
    ['farm-scenery', batches.farm],
    ['highland-scenery', batches.highland],
    ['coast-scenery', batches.coast],
    ['campus-scenery', batches.campus],
    ['estate-scenery', batches.estate],
  ];
  for (const [name, batch] of groups) {
    // One batch per cell (cull.ts), not per region: a region-wide mesh is never culled and is drawn twice from anywhere.
    scene.add(buildStaticCells(batch, { lights: false, name }));
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
        p.mesh.position.set(p.baseX + Math.sin(time * 1.7 + p.phase) * 0.35, p.baseY + 0.4 + t * p.maxH, p.baseZ);
        p.mesh.scale.setScalar(0.6 + t * 1.1);
        (p.mesh.material as THREE.MeshStandardMaterial).opacity = (1 - t) * 0.42;
      }
      for (const f of flickers) {
        f.mat.emissiveIntensity = f.base + Math.sin(time * f.speed) * f.amp;
      }
    },
  };
}
