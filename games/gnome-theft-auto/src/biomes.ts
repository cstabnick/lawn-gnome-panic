// The four biomes around Turfton (desert, forest, tundra, farmland), Fort Sandpit and the airfield (issue 1I).
// world.ts owns the ground meshes, the city and the highways; this module builds what stands on the biome ground.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildPrefab, buildStaticPrefabs, type StaticPrefabPlacement } from '@lawn/prefabs';
import { AIRFIELD, BASE, CITY_HALF, COLORS, HIGHWAYS, ROAD_WIDTH, WORLD_HALF, biomeAt } from './config';
import type { Box, BiomeId, ParkedSpot, VehicleKind } from './types';

export interface BiomeBuild {
  /** Static colliders of everything built here (tree trunks, rocks, fort walls, hangars, cabins...). */
  boxes: Box[];
  /** Places pedestrians wander between (villages, the fort yard, farm yards). Never inside a box. */
  walkPoints: { x: number; z: number }[];
  /** Empty mowers to steal, kerb-side or yard-side in the biomes (not the planes: those are AIRFIELD.planeSpots). */
  parked: ParkedSpot[];
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
  let sock: THREE.Object3D | null = null;
  /** Zones scenery stays out of (fort, airfield, villages, yards, fields), grown where they need clearance. */
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

  // ============================================================================================================
  // Fort Sandpit (desert)
  // ============================================================================================================
  const fortFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(BASE.maxX - BASE.minX, BASE.maxZ - BASE.minZ)
      .rotateX(-Math.PI / 2)
      .translate((BASE.minX + BASE.maxX) / 2, 0.025, (BASE.minZ + BASE.maxZ) / 2),
    new THREE.MeshStandardMaterial({ color: COLORS.sand }),
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
    new THREE.MeshStandardMaterial({ color: 0x3a3d42 }),
  );
  pad.position.set(BASE.padX, 0.03, BASE.padZ);
  pad.receiveShadow = true;
  scene.add(pad);
  scene.add(new THREE.Mesh(
    new THREE.RingGeometry(3.6, 4.2, 48).rotateX(-Math.PI / 2).translate(BASE.padX, 0.065, BASE.padZ),
    new THREE.MeshStandardMaterial({ color: 0xf2c230 }),
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
  /** Merged flat geometry; polygon offset by `layer` keeps coplanar stripes from z-fighting. */
  const flat = (geos: THREE.BufferGeometry[], color: number, layer: number): THREE.Mesh => {
    const mesh = new THREE.Mesh(
      mergeGeometries(geos, false) ?? new THREE.BufferGeometry(),
      new THREE.MeshStandardMaterial({ color, polygonOffset: true, polygonOffsetFactor: -layer, polygonOffsetUnits: -layer }),
    );
    mesh.receiveShadow = true;
    return mesh;
  };
  const runwayGeos = [onRunway(W, L, 0, 0, 0.02)];
  const lineGeos: THREE.BufferGeometry[] = [];
  for (let lz = -L / 2 + 14; lz <= L / 2 - 14; lz += 6) lineGeos.push(onRunway(0.4, 3, 0, lz, 0.03));
  for (const lz of [-L / 2 + 6, L / 2 - 6]) lineGeos.push(onRunway(W - 4, 2, 0, lz, 0.03));
  scene.add(flat(runwayGeos, 0x3b3d40, 1));
  scene.add(flat(lineGeos, 0xf2f2f2, 3));
  scene.add(flat([new THREE.PlaneGeometry(apron.maxX - apron.minX, apron.maxZ - apron.minZ)
    .rotateX(-Math.PI / 2)
    .translate((apron.minX + apron.maxX) / 2, 0.02, (apron.minZ + apron.maxZ) / 2)], 0x8c9196, 1));

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
  // Desert: villages, cacti, rocks, mesas, parked mowers
  // ============================================================================================================
  const D = batches.desert;
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
  const F = batches.forest;
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
  const T = batches.tundra;
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
      new THREE.MeshStandardMaterial({ color: 0xbfe6f5, roughness: 0.2 }),
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
  const Fm = batches.farm;
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
    update(dt: number) {
      time += dt;
      banners.forEach((g, i) => { g.rotation.z = Math.sin(time * 1.6 + i * 1.3) * 0.06; });
      if (sock) sock.rotation.y = Math.sin(time * 0.9) * 0.5;
    },
  };
}
