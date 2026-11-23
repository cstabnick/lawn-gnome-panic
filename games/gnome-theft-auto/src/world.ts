// Builds the world: Turfton (the grid city of roads, sidewalks, towers, garden-object buildings and the park), the
// winding highways and the road graph, the coloured ground of the four biomes, and then calls buildBiomes for
// everything that stands out there (Fort Sandpit, the airfield, the villages and farms).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { LAYER, flatLayer } from '@lawn/depth';
import {
  AIRFIELD, AMPHITHEATER, BASE, BIOME_GROUND, BODEGA, BUILDINGS, CITY_HALF, CLAY_MART, COLORS, CULVERT_PORTALS,
  GNOMA_TRUCK, GNOMECINO, GREENHOUSE_STRIP, HIGHWAYS, HOSPITAL, LANE_OFFSET, MULCH_CLUB, PATIO_HEIGHTS,
  PAY_N_GLAZE, ROAD_LINES, ROAD_WIDTH, SIDEWALK_WIDTH, SIDE_VALVE, SPAWN, THORNE_TOWER, VIEW, WORLD_HALF, biomeAt,
} from './config';
import { insideBox } from './collide';
import { glazeShopColliders } from './glazeBay';
import { type GroundKind, TILE, groundTexture, planarUv } from './textures';
import { buildBiomes } from './biomes';
import { REGIONS, REGION_IDS } from './levels';
import { addGroundToGeometry, buildTerrainChunks, drapedRibbon } from './terrainMesh';
import { buildWaterMeshes } from './waterMesh';
import { buildWaterworks } from './waterworks';
import { placeBillboards } from './brands';
import { buildDistrictDressing } from './districts';
import { buildGardenBlocks, planGardenBlock, type GardenPlacement } from './landscaping';
import { buildScenery } from './scenery';
import { buildSettlements } from './settlements';
import { stageKeepOut } from './stageClear';
import { introScript } from './cutscene/intro';
import type { BiomeId, Box, ParkedSpot, RoadNode, VehicleKind, VendingSpot, World } from './types';

// Phones: a lighter render keeps the frame rate up (fewer pixels, a smaller shadow map).
const COARSE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

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

/** Merged flat ground geometry on a draw layer (LAYER in @lawn/depth), so overlapping ground pieces never z-fight. */
function merged(geos: THREE.BufferGeometry[], color: number, layer: number, kind?: GroundKind): THREE.Mesh | null {
  if (geos.length === 0) return null;
  const geo = mergeGeometries(geos, false);
  if (!geo) return null;
  if (kind) planarUv(geo, TILE[kind]);
  const mesh = new THREE.Mesh(geo, flatLayer(new THREE.MeshStandardMaterial({
    color: kind ? 0xffffff : color, ...(kind ? { map: groundTexture(kind), roughness: 1 } : {}),
  }), layer));
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

/** A flat ground polygon at height y (any simple polygon, either winding), triangulated, facing up. */
function groundPoly(pts: [number, number][], y: number): THREE.BufferGeometry {
  const tris = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), []);
  const p: number[] = [];
  const n: number[] = [];
  for (const [ia, ib, ic] of tris) {
    const a = pts[ia], b = pts[ib], c = pts[ic];
    // Wind each triangle so it faces +y (a downward-facing triangle renders almost black, see the ground block below).
    const up = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const order = up > 0 ? [a, c, b] : [a, b, c];
    for (const [x, z] of order) {
      p.push(x, y, z);
      n.push(0, 1, 0);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
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
function instanceParts(
  scene: THREE.Scene,
  template: THREE.Group,
  placements: THREE.Matrix4[],
): { meshes: THREE.InstancedMesh[]; partMatrices: THREE.Matrix4[] } {
  const meshes: THREE.InstancedMesh[] = [];
  const partMatrices: THREE.Matrix4[] = [];
  if (placements.length === 0) return { meshes, partMatrices };
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
    meshes.push(inst);
    partMatrices.push(part.matrixWorld.clone());
  }
  return { meshes, partMatrices };
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

/** Instantiate a prefab if registered in @lawn/prefabs; returns null if not yet available. */
export function tryInstantiate(
  scene: THREE.Scene, id: string, how: { scale: number } | { footprint: number },
  cx: number, cz: number, yaw: number, tint?: number,
): THREE.Group | null {
  if (!getPrefab(id)) return null;
  return instantiate(scene, measure(id, how, yaw), cx, cz, tint);
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

/** The highway samples filed by 16 m cell, so nearHighway checks only the cells a rectangle touches. */
const HW_CELL = 16;
const highwayCells: Map<string, [number, number][]> = (() => {
  const m = new Map<string, [number, number][]>();
  for (const p of highwaySamples) {
    const k = `${Math.floor(p[0] / HW_CELL)},${Math.floor(p[1] / HW_CELL)}`;
    const list = m.get(k);
    if (list) list.push(p); else m.set(k, [p]);
  }
  return m;
})();

/** True when a rectangle (grown by margin) comes within reach of a highway's centre line. */
function nearHighway(r: Rect, margin: number): boolean {
  const x0 = r.minX - margin, x1 = r.maxX + margin, z0 = r.minZ - margin, z1 = r.maxZ + margin;
  for (let cx = Math.floor(x0 / HW_CELL); cx <= Math.floor(x1 / HW_CELL); cx++) {
    for (let cz = Math.floor(z0 / HW_CELL); cz <= Math.floor(z1 / HW_CELL); cz++) {
      for (const [x, z] of highwayCells.get(`${cx},${cz}`) ?? []) {
        if (x > x0 && x < x1 && z > z0 && z < z1) return true;
      }
    }
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

/** Thorne Lawn & Order HQ: obsidian-and-gold monolithic skyscraper rising to THORNE_TOWER.height (86). */
function buildThorneTower(scene: THREE.Scene, boxes: Box[], rnd: () => number): void {
  const { x: cx, z: cz, footprint, height } = THORNE_TOWER;
  const baseGroup = tryInstantiate(scene, 'gta-thorne-tower', { footprint }, cx, cz, 0);
  const obsidianTex = windowTexture(rnd, '#12131a', '#ffd25a', '#1b1f2b', '#c9a227');
  const obsidianMat = new THREE.MeshStandardMaterial({ map: obsidianTex, roughness: 0.35, metalness: 0.25 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.3, metalness: 0.7 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0xffe07a, emissive: 0xc99622 });

  const mainW = 18, mainD = 18, mainH = 56;
  const upperW = 13, upperD = 13, upperH = 16;
  const crownY = mainH + upperH;
  const pentW = 8, pentD = 8, pentH = 5;
  const spireBaseY = crownY + pentH;
  const spireH = height - spireBaseY - 0.8;

  addMerged(scene, [
    scaleUvs(new THREE.BoxGeometry(mainW, mainH, mainD).translate(cx, mainH / 2, cz), mainW, mainH, mainD),
    scaleUvs(new THREE.BoxGeometry(upperW, upperH, upperD).translate(cx, mainH + upperH / 2, cz), upperW, upperH, upperD),
    scaleUvs(new THREE.BoxGeometry(pentW, pentH, pentD).translate(cx, crownY + pentH / 2, cz), pentW, pentH, pentD),
  ], obsidianMat);

  const goldGeos: THREE.BufferGeometry[] = [
    new THREE.BoxGeometry(upperW + 1.2, 1.1, upperD + 1.2).translate(cx, crownY + 0.55, cz),
    new THREE.BoxGeometry(pentW + 0.8, 0.7, pentD + 0.8).translate(cx, spireBaseY, cz),
    new THREE.CylinderGeometry(0.18, 0.9, spireH, 8).translate(cx, spireBaseY + spireH / 2, cz),
  ];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      // 0.15 taller than the block so the column tops do not share the roof's plane, and 1.2 wide so their faces
      // stand clear of the base prefab's (both z-fight otherwise).
      goldGeos.push(new THREE.BoxGeometry(1.2, mainH + 0.15, 1.2).translate(cx + sx * (mainW / 2), (mainH + 0.15) / 2, cz + sz * (mainD / 2)));
    }
  }
  addMerged(scene, goldGeos, goldMat);
  addMerged(scene, [new THREE.SphereGeometry(0.75, 10, 8).translate(cx, height - 0.4, cz)], glowMat);

  const hw = footprint / 2;
  const box: Box = baseGroup
    ? { ...boxOf(baseGroup), h: height }
    : { minX: cx - hw, maxX: cx + hw, minZ: cz - hw, maxZ: cz + hw, h: height };
  box.minX = Math.min(box.minX, cx - mainW / 2);
  box.maxX = Math.max(box.maxX, cx + mainW / 2);
  box.minZ = Math.min(box.minZ, cz - mainD / 2);
  box.maxZ = Math.max(box.maxZ, cz + mainD / 2);
  boxes.push(box);
}

/** Turfton Amphitheater: sunken plaza, raised covered stage, and 4 stepped seating tiers inside (-90, -90). */
function buildAmphitheater(scene: THREE.Scene, boxes: Box[]): void {
  const { x: cx, z: cz } = AMPHITHEATER;
  const stoneGeos: THREE.BufferGeometry[] = [
    new THREE.CylinderGeometry(14.8, 15.2, 0.14, 24).translate(cx, 0.07, cz),
    new THREE.BoxGeometry(13, 1.2, 5.2).translate(cx, 0.6, cz - 8.5),
    new THREE.BoxGeometry(14, 5.2, 1.2).translate(cx, 2.6, cz - 12),
  ];
  for (const sx of [-1, 1]) {
    stoneGeos.push(new THREE.CylinderGeometry(0.55, 0.65, 5.5, 8).translate(cx + sx * 6.2, 2.75, cz - 6.5));
  }
  boxes.push({ minX: cx - 7, maxX: cx + 7, minZ: cz - 12.6, maxZ: cz - 11.4, h: 5.2 });
  boxes.push({ minX: cx - 6.5, maxX: cx + 6.5, minZ: cz - 11.1, maxZ: cz - 5.9, h: 1.2 });

  const tierRadii = [8.2, 10.1, 12.0, 13.9];
  const tierHeights = [0.65, 1.3, 1.95, 2.6];
  const segCount = 7;
  for (let t = 0; t < tierRadii.length; t++) {
    const r = tierRadii[t];
    const h = tierHeights[t];
    const segW = (Math.PI * r) / segCount + 0.35;
    for (let k = 0; k < segCount; k++) {
      const a = 0.16 + ((Math.PI - 0.32) * (k + 0.5)) / segCount;
      const sx = cx + Math.cos(a) * r;
      const sz = cz + Math.sin(a) * r;
      stoneGeos.push(
        new THREE.BoxGeometry(segW, h, 1.85)
          .rotateY(-a + Math.PI / 2)
          .translate(sx, h / 2, sz),
      );
      if (t === tierRadii.length - 1) {
        boxes.push({ minX: sx - 1.4, maxX: sx + 1.4, minZ: sz - 1.4, maxZ: sz + 1.4, h });
      }
    }
  }
  addMerged(scene, stoneGeos, new THREE.MeshStandardMaterial({ color: 0xc4b59b, roughness: 0.88 }));
  addMerged(scene, [
    new THREE.BoxGeometry(14.8, 0.5, 7.2).rotateX(0.14).translate(cx, 5.7, cz - 9.1),
  ], new THREE.MeshStandardMaterial({ color: 0x8a2c24, roughness: 0.6 }));
  addMerged(scene, [
    new THREE.SphereGeometry(0.4, 8, 6).translate(cx - 4.5, 5.2, cz - 6.4),
    new THREE.SphereGeometry(0.4, 8, 6).translate(cx + 4.5, 5.2, cz - 6.4),
  ], new THREE.MeshStandardMaterial({ color: 0xffe49a, emissive: 0xffc844 }));
}

/** Patio Heights: walled flagstone compound inside block (150, -150), leaving x = 180 and z = -180 clear. */
function buildPatioHeights(scene: THREE.Scene, boxes: Box[]): void {
  const minX = 130, maxX = 170, minZ = -170, maxZ = -130;
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  const gateMinX = 146, gateMaxX = 154;

  // 0.2 in from each side: the edges sit inside the 0.7 m walls instead of flush with the wall ends (z-fighting).
  addMerged(scene, [new THREE.BoxGeometry(maxX - minX - 0.4, 0.16, maxZ - minZ - 0.4).translate(cx, 0.08, cz)],
    new THREE.MeshStandardMaterial({ color: 0xbcbcc4, roughness: 0.85 }));
  addMerged(scene, [new THREE.BoxGeometry(26, 0.06, 26).translate(cx, 0.19, cz)],
    new THREE.MeshStandardMaterial({ color: 0x4ca64a, roughness: 0.9 }));

  const wallGeos: THREE.BufferGeometry[] = [];
  const ironGeos: THREE.BufferGeometry[] = [];
  const addFenceSeg = (ax: number, az: number, bx: number, bz: number): void => {
    const len = Math.hypot(bx - ax, bz - az);
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    const isX = Math.abs(bx - ax) >= Math.abs(bz - az);
    const w = isX ? len : 0.7, d = isX ? 0.7 : len;
    wallGeos.push(new THREE.BoxGeometry(w, 0.55, d).translate(mx, 0.275, mz));
    ironGeos.push(new THREE.BoxGeometry(isX ? len : 0.18, 0.12, isX ? 0.18 : len).translate(mx, 1.75, mz));
    ironGeos.push(new THREE.BoxGeometry(isX ? len : 0.14, 0.1, isX ? 0.14 : len).translate(mx, 1.1, mz));
    const posts = Math.max(2, Math.round(len / 4));
    for (let i = 0; i <= posts; i++) {
      const t = i / posts;
      ironGeos.push(new THREE.BoxGeometry(0.22, 1.35, 0.22).translate(ax + (bx - ax) * t, 1.2, az + (bz - az) * t));
    }
    boxes.push({ minX: mx - w / 2, maxX: mx + w / 2, minZ: mz - d / 2, maxZ: mz + d / 2, h: 1.9 });
  };
  addFenceSeg(minX, minZ, maxX, minZ);
  addFenceSeg(minX, minZ, minX, maxZ);
  addFenceSeg(maxX, minZ, maxX, maxZ);
  addFenceSeg(minX, maxZ, gateMinX, maxZ);
  addFenceSeg(gateMaxX, maxZ, maxX, maxZ);

  // Gate pillars and Gate-Guard Gary's sentry box.
  for (const gx of [gateMinX - 0.5, gateMaxX + 0.5]) {
    wallGeos.push(new THREE.BoxGeometry(1.1, 2.5, 1.1).translate(gx, 1.25, maxZ));
    boxes.push({ minX: gx - 0.55, maxX: gx + 0.55, minZ: maxZ - 0.55, maxZ: maxZ + 0.55, h: 2.5 });
  }
  wallGeos.push(new THREE.BoxGeometry(2.0, 2.6, 2.0).translate(142.5, 1.3, maxZ - 1.8));
  boxes.push({ minX: 141.5, maxX: 143.5, minZ: maxZ - 2.8, maxZ: maxZ - 0.8, h: 2.6 });

  addMerged(scene, wallGeos, new THREE.MeshStandardMaterial({ color: 0x8e8f96, roughness: 0.8 }));
  addMerged(scene, ironGeos, new THREE.MeshStandardMaterial({ color: 0x222328, roughness: 0.5, metalness: 0.5 }));
  addMerged(scene, [
    new THREE.SphereGeometry(0.35, 8, 6).translate(gateMinX - 0.5, 2.75, maxZ),
    new THREE.SphereGeometry(0.35, 8, 6).translate(gateMaxX + 0.5, 2.75, maxZ),
  ], new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.7, roughness: 0.3 }));
}

/** Greenhouse Strip: glass-arch grow-lamp canopies arching over x = 60 at y >= 8.5, clear of z = 0. */
function buildGreenhouseStrip(scene: THREE.Scene, boxes: Box[]): void {
  const spans: [number, number][] = [[-50, -10], [10, 50]];
  const ironGeos: THREE.BufferGeometry[] = [];
  const glassGeos: THREE.BufferGeometry[] = [];
  const pinkGlowGeos: THREE.BufferGeometry[] = [];
  const amberGlowGeos: THREE.BufferGeometry[] = [];
  const leftX = 52.5, rightX = 67.5, midX = 60;
  const springY = 8.5, archRise = 6.0, halfSpan = (rightX - leftX) / 2;

  for (const [z0, z1] of spans) {
    const spanLen = z1 - z0;
    const zMid = (z0 + z1) / 2;
    const ribZs = [z0 + 2, z0 + 14, z0 + 26, z1 - 2];
    for (const pz of ribZs) {
      for (const px of [leftX, rightX]) {
        ironGeos.push(new THREE.BoxGeometry(0.7, springY, 0.7).translate(px, springY / 2, pz));
        ironGeos.push(new THREE.BoxGeometry(1.0, 0.5, 1.0).translate(px, 0.25, pz));
        boxes.push({ minX: px - 0.45, maxX: px + 0.45, minZ: pz - 0.45, maxZ: pz + 0.45, h: springY + archRise });
      }
      // Arch rib facets over x = 60.
      const segs = 6;
      for (let k = 0; k < segs; k++) {
        const a0 = (Math.PI * k) / segs, a1 = (Math.PI * (k + 1)) / segs;
        const x0 = midX - Math.cos(a0) * halfSpan, y0 = springY + Math.sin(a0) * archRise;
        const x1 = midX - Math.cos(a1) * halfSpan, y1 = springY + Math.sin(a1) * archRise;
        const segLen = Math.hypot(x1 - x0, y1 - y0);
        const ang = Math.atan2(y1 - y0, x1 - x0);
        ironGeos.push(
          new THREE.BoxGeometry(segLen + 0.15, 0.35, 0.45)
            .rotateZ(ang)
            .translate((x0 + x1) / 2, (y0 + y1) / 2, pz),
        );
      }
    }
    // Continuous glass barrel vault + longitudinal grow-lamp tubes over the span.
    const segs = 6;
    for (let k = 0; k < segs; k++) {
      const a0 = (Math.PI * k) / segs, a1 = (Math.PI * (k + 1)) / segs;
      const x0 = midX - Math.cos(a0) * halfSpan, y0 = springY + Math.sin(a0) * archRise;
      const x1 = midX - Math.cos(a1) * halfSpan, y1 = springY + Math.sin(a1) * archRise;
      const segLen = Math.hypot(x1 - x0, y1 - y0);
      const ang = Math.atan2(y1 - y0, x1 - x0);
      glassGeos.push(
        new THREE.BoxGeometry(segLen, 0.12, spanLen)
          .rotateZ(ang)
          .translate((x0 + x1) / 2, (y0 + y1) / 2, zMid),
      );
    }
    pinkGlowGeos.push(new THREE.BoxGeometry(0.45, 0.25, spanLen - 4).translate(midX - 3.6, springY + 3.4, zMid));
    pinkGlowGeos.push(new THREE.BoxGeometry(0.45, 0.25, spanLen - 4).translate(midX + 3.6, springY + 3.4, zMid));
    amberGlowGeos.push(new THREE.BoxGeometry(0.5, 0.25, spanLen - 4).translate(midX, springY + 4.8, zMid));
  }

  addMerged(scene, ironGeos, new THREE.MeshStandardMaterial({ color: 0x2a5648, roughness: 0.5, metalness: 0.4 }));
  const glassGeo = mergeGeometries(glassGeos, false);
  if (glassGeo) {
    scene.add(new THREE.Mesh(
      glassGeo,
      new THREE.MeshStandardMaterial({ color: 0x99ebd8, transparent: true, opacity: 0.34, roughness: 0.18, side: THREE.DoubleSide }),
    ));
  }
  addMerged(scene, pinkGlowGeos, new THREE.MeshStandardMaterial({ color: 0xff66cc, emissive: 0xd936a8 }));
  addMerged(scene, amberGlowGeos, new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xd99b26 }));
}

/** Under-Deck storm-drain culvert entrance props at downtown (-10, -10) and SW canal (-195, 195). */
function buildCulvertPortals(scene: THREE.Scene, boxes: Box[]): void {
  const brickGeos: THREE.BufferGeometry[] = [];
  const metalGeos: THREE.BufferGeometry[] = [];
  const darkGeos: THREE.BufferGeometry[] = [];
  const glowGeos: THREE.BufferGeometry[] = [];
  const bollardGeos: THREE.BufferGeometry[] = [];

  for (const [cx, cz, yaw] of [
    [CULVERT_PORTALS.downtown.x, CULVERT_PORTALS.downtown.z, 0],
    [CULVERT_PORTALS.canal.x, CULVERT_PORTALS.canal.z, Math.PI / 4],
  ] as const) {
    const place = (g: THREE.BufferGeometry, lx: number, ly: number, lz: number): THREE.BufferGeometry =>
      g.translate(lx, ly, lz).rotateY(yaw).translate(cx, 0, cz);
    brickGeos.push(place(new THREE.BoxGeometry(4.4, 0.1, 4.4), 0, 0.05, 0));
    brickGeos.push(place(new THREE.BoxGeometry(0.7, 2.7, 2.8), -1.65, 1.35, -0.3));
    brickGeos.push(place(new THREE.BoxGeometry(0.7, 2.7, 2.8), 1.65, 1.35, -0.3));
    brickGeos.push(place(new THREE.BoxGeometry(4.0, 0.7, 2.8), 0, 2.7, -0.3));
    metalGeos.push(place(new THREE.CylinderGeometry(1.3, 1.3, 2.4, 12, 1, false, 0, Math.PI)
      .rotateZ(Math.PI / 2).rotateY(Math.PI / 2), 0, 1.3, -0.25));
    darkGeos.push(place(new THREE.BoxGeometry(2.4, 2.3, 0.25), 0, 1.15, -1.4));
    glowGeos.push(place(new THREE.SphereGeometry(0.24, 8, 6), 1.1, 2.15, 0.95));
    bollardGeos.push(place(new THREE.CylinderGeometry(0.16, 0.18, 0.9, 8), -1.8, 0.45, 1.5));
    bollardGeos.push(place(new THREE.CylinderGeometry(0.16, 0.18, 0.9, 8), 1.8, 0.45, 1.5));

    // Wing-wall boxes only so the central culvert portal mouth remains passable.
    for (const side of [-1, 1]) {
      const wx = cx + Math.cos(yaw) * side * 1.65;
      const wz = cz - Math.sin(yaw) * side * 1.65;
      boxes.push({ minX: wx - 0.5, maxX: wx + 0.5, minZ: wz - 0.8, maxZ: wz + 0.8, h: 3.0 });
    }
  }

  addMerged(scene, brickGeos, new THREE.MeshStandardMaterial({ color: 0x7c6a5c, roughness: 0.9 }));
  addMerged(scene, metalGeos, new THREE.MeshStandardMaterial({ color: 0x626b73, roughness: 0.5, metalness: 0.5 }));
  addMerged(scene, darkGeos, new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 1 }));
  addMerged(scene, glowGeos, new THREE.MeshStandardMaterial({ color: 0x7dff9c, emissive: 0x2ec955 }));
  addMerged(scene, bollardGeos, new THREE.MeshStandardMaterial({ color: 0xf2b724, roughness: 0.5 }));
}

/** Scatter Acorn-Cola and Dandelion Fizz vending machines along downtown sidewalks. */
function scatterVendingMachines(scene: THREE.Scene, boxes: Box[]): VendingSpot[] {
  const out: VendingSpot[] = [];
  const spots: { x: number; z: number; yaw: number; id: string }[] = [
    { x: -7.0, z: -22, yaw: Math.PI / 2, id: 'gta-vending-cola' },
    { x: 7.0, z: -20, yaw: -Math.PI / 2, id: 'gta-vending-fizz' },
    { x: -7.0, z: 32, yaw: Math.PI / 2, id: 'gta-vending-fizz' },
    { x: 7.0, z: -46, yaw: -Math.PI / 2, id: 'gta-vending-cola' },
    { x: -24, z: 7.0, yaw: 0, id: 'gta-vending-cola' },
    { x: 24, z: -7.0, yaw: Math.PI, id: 'gta-vending-fizz' },
    { x: -46, z: -7.0, yaw: Math.PI, id: 'gta-vending-fizz' },
    { x: 46, z: 7.0, yaw: 0, id: 'gta-vending-cola' },
    { x: -53.0, z: 24, yaw: -Math.PI / 2, id: 'gta-vending-cola' },
    { x: 53.0, z: -18, yaw: Math.PI / 2, id: 'gta-vending-fizz' },
    { x: -67.0, z: 32, yaw: Math.PI / 2, id: 'gta-vending-fizz' },
    { x: 67.0, z: 18, yaw: -Math.PI / 2, id: 'gta-vending-cola' },
  ];
  for (const s of spots) {
    if (Math.hypot(s.x - SPAWN.x, s.z - SPAWN.z) < 6) continue;
    if (Math.hypot(s.x - HOSPITAL.respawn.x, s.z - HOSPITAL.respawn.z) < 5) continue;
    if (insideBox(s.x, 0.5, s.z, boxes)) continue;
    const g = tryInstantiate(scene, s.id, { footprint: 1.2 }, s.x, s.z, s.yaw);
    if (!g) continue;
    const box = boxOf(g);
    boxes.push(box);
    out.push({ x: s.x, z: s.z, yaw: s.yaw, brand: s.id === 'gta-vending-fizz' ? 'fizz' : 'cola', object: g, box });
  }
  return out;
}

export function buildWorld(scene: THREE.Scene, _renderer: THREE.WebGLRenderer): World {
  const rnd = mulberry32(REGIONS.turfton.base.seed ?? 7);
  const boxes: Box[] = [];
  const walkPoints: { x: number; z: number }[] = [];

  // ---- Sky, fog and light -------------------------------------------------------------------------------------------
  scene.background = new THREE.Color(COLORS.sky);
  scene.fog = new THREE.Fog(COLORS.sky, VIEW.fogNear, VIEW.fogFar);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x4a6b3a, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.6);
  sun.position.set(SPAWN.x + 60, 100, SPAWN.z + 40);
  sun.target.position.set(SPAWN.x, 0, SPAWN.z);
  sun.castShadow = true;
  const shadowSize = COARSE ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  const sc = sun.shadow.camera;
  sc.left = -140; sc.right = 140; sc.top = 140; sc.bottom = -140; sc.near = 1; sc.far = 300;
  sc.updateProjectionMatrix();
  scene.add(sun);
  scene.add(sun.target);

  // ---- Ground: the city colour everywhere, then one polygon per region (data.border), then the city square on top ------
  // Draw layers (@lawn/depth LAYER, a polygon offset that holds at any distance) and small lifts in the same order:
  // base ground -0.12; region polygons tint 0.004; city square area 0.008; roads 0.02; sidewalks edge 0.03;
  // centre lines marking 0.04. Anything else laid flat on the ground takes a layer too (see docs/rendering.md).
  // With hills (terrain.ts not flat) the ground is the chunked terrain mesh instead (terrainMesh.ts, LAYER.ground; Turfton
  // stays at exactly 0 there, so the city pieces below sit on it unchanged).
  const terrain = buildTerrainChunks(scene);
  if (!terrain) {
  const baseGeo = new THREE.PlaneGeometry(H * 2, H * 2).rotateX(-Math.PI / 2);
  planarUv(baseGeo, TILE.grass);
  const base = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, map: groundTexture('grass'), roughness: 1 }));
  base.receiveShadow = true;
    // Well below the region polygons (0.004): at 300+ units away a smaller gap z-fights and the grass shows through them.
  base.position.y = -0.12;
  scene.add(base);
    const regionKind: Record<BiomeId, GroundKind> = {
      desert: 'sand', forest: 'forest', tundra: 'snow', farmland: 'farm', city: 'grass', loch: 'moss', parkland: 'meadow',
    };
    // Each region's border is a simple (possibly L-shaped) polygon; the borders tile the world square without overlap.
    for (const id of REGION_IDS) {
      if (id === 'turfton') continue;
      const r = REGIONS[id];
      const mesh = merged([groundPoly(r.border, 0.004)], BIOME_GROUND[r.data.region], LAYER.tint, regionKind[r.data.region]);
    if (mesh) scene.add(mesh);
  }
  const citySquare = merged([
    new THREE.PlaneGeometry(CITY_HALF * 2, CITY_HALF * 2).rotateX(-Math.PI / 2).translate(0, 0.008, 0),
  ], BIOME_GROUND.city, LAYER.area, 'grass');
  if (citySquare) scene.add(citySquare);
  }

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
    if (terrain) {
      // Hills: one ribbon draped on the ground per highway (mitred joins instead of round caps), dashes lifted onto it.
      roadGeos.push(drapedRibbon(hw.points, ROAD_WIDTH, 0.02));
      for (let k = 0; k + 1 < hw.points.length; k++) {
        const [ax, az] = hw.points[k];
        const [bx, bz] = hw.points[k + 1];
        const len = Math.hypot(bx - ax, bz - az);
        const ux = (bx - ax) / len, uz = (bz - az) / len;
        const dashes: THREE.BufferGeometry[] = [];
        for (let t = 0; t + 3 <= len; t += 6) {
          bar(dashes, ax + ux * t, az + uz * t, ax + ux * (t + 3), az + uz * (t + 3), 0.25, 0.04);
        }
        for (const d of dashes) lineGeos.push(addGroundToGeometry(d));
      }
      continue;
    }
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
    merged(roadGeos, COLORS.road, LAYER.road, 'asphalt'),
    merged(sidewalkGeos, COLORS.sidewalk, LAYER.edge, 'pavement'),
    merged(lineGeos, COLORS.roadLine, LAYER.marking),
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
  /** Garden blocks (landscaping.ts): their plans, built in one batch after the block loop. */
  const gardenPlans: GardenPlacement[] = [];
  const stageRects = stageKeepOut();
  /** Fixed props built after the block loop (the culvert portals, the food truck): gardens keep clear of them. */
  const laterProps: Rect[] = [CULVERT_PORTALS.downtown, CULVERT_PORTALS.canal, GNOMA_TRUCK]
    .map((p) => ({ minX: p.x - 4, maxX: p.x + 4, minZ: p.z - 4, maxZ: p.z + 4 }));
  /** The intro flyover's camera path (cutscene/intro.ts), sampled every few metres. */
  const introPath: [number, number, number][] = [];
  for (const st of introScript(SPAWN).steps) {
    const shot = (st as { shot?: { kind: string; from?: [number, number, number]; to?: [number, number, number] } }).shot;
    if (shot?.kind !== 'dolly' || !shot.from || !shot.to) continue;
    const [a, b] = [shot.from, shot.to];
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 3);
    for (let i = 0; i <= n; i++) introPath.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n, a[2] + ((b[2] - a[2]) * i) / n]);
  }
  const gardenBlocked = (r: Rect): boolean =>
    boxes.some((b) => overlap(r, b, GAP)) || nearHighway(r, HW_MARGIN) || stageRects.some((b) => overlap(r, b, GAP))
    || laterProps.some((b) => overlap(r, b, GAP));
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
      // A tower never stands on a cutscene spot: shrink it (towards its centre) until it clears them.
      let tw = w, td = d;
      const onStage = (): boolean => stageRects.some((b) =>
        overlap({ minX: tx - tw / 2, maxX: tx + tw / 2, minZ: cz - td / 2, maxZ: cz + td / 2 }, b, GAP));
      while (onStage() && Math.min(tw, td) > 10) { tw *= 0.85; td *= 0.85; }
      // ...and never into the intro flyover's camera path: a tower under it stops 6 m below the camera.
      let th = h;
      for (const c of introPath) {
        if (Math.abs(c[0] - tx) < tw / 2 + 4 && Math.abs(c[2] - cz) < td / 2 + 4) th = Math.min(th, c[1] - 6);
      }
      if (!onStage() && th >= BUILDINGS.towerMinHeight * 0.5) addTower(tx, cz, tw, td, th);
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
      if (cx === MULCH_CLUB.x && cz === MULCH_CLUB.z) {
        boxes.push(boxOf(instantiate(scene, measure('gta-mulch-club', { footprint: MULCH_CLUB.footprint }, Math.PI / 2), cx, cz)));
        continue;
      }
      if (cx === HOSPITAL.x && cz === HOSPITAL.z) {
        boxes.push(boxOf(instantiate(scene, measure('gta-hospital', { footprint: HOSPITAL.footprint }, -Math.PI / 2), cx, cz)));
        continue;
      }
      if (cx === BODEGA.x && cz === BODEGA.z) {
        const g = tryInstantiate(scene, 'gta-bodega', { footprint: BODEGA.footprint }, cx, cz, Math.PI / 2);
        if (g) boxes.push(boxOf(g));
        continue;
      }
      if (cx === SIDE_VALVE.x && cz === SIDE_VALVE.z) {
        const g = tryInstantiate(scene, 'gta-side-valve', { footprint: SIDE_VALVE.footprint }, cx, cz, Math.PI);
        if (g) boxes.push(boxOf(g));
        continue;
      }
      if (cx === PAY_N_GLAZE.x && cz === PAY_N_GLAZE.z) {
        const g = tryInstantiate(scene, 'gta-pay-n-glaze', { footprint: PAY_N_GLAZE.footprint }, cx, cz, 0);
        if (g) boxes.push(...glazeShopColliders(g));
        continue;
      }
      if (cx === GNOMECINO.x && cz === GNOMECINO.z) {
        const g = tryInstantiate(scene, 'gta-gnomecino', { footprint: GNOMECINO.footprint }, cx, cz, -Math.PI / 2);
        if (g) boxes.push(boxOf(g));
        continue;
      }
      if (cx === THORNE_TOWER.x && cz === THORNE_TOWER.z) {
        buildThorneTower(scene, boxes, rnd);
        continue;
      }
      if (cx === CLAY_MART.x && cz === CLAY_MART.z) {
        const g = tryInstantiate(scene, 'gta-clay-mart', { footprint: CLAY_MART.footprint }, cx, cz, Math.PI / 2);
        if (g) boxes.push(boxOf(g));
        continue;
      }
      if (cx === AMPHITHEATER.x && cz === AMPHITHEATER.z) {
        buildAmphitheater(scene, boxes);
        continue;
      }
      if (cx === 150 && cz === -150) {
        buildPatioHeights(scene, boxes);
        continue;
      }
      if (Math.hypot(cx, cz) <= BUILDINGS.downtownRadius) { placeTowers(block); continue; }
      // Ordinary blocks are gardens (landscaping.ts), not 1-3 random giant garden objects.
      gardenPlans.push(...planGardenBlock(block, rnd, gardenBlocked));
    }
  }
  buildGardenBlocks(scene, boxes, gardenPlans);
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
  const lampSpots: {
    x: number;
    z: number;
    index: number;
    intact: boolean;
    resetT: number;
    baseMatrix: THREE.Matrix4;
  }[] = [];
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
          const baseMatrix = new THREE.Matrix4().makeTranslation(x, 0, z);
          lampSpots.push({
            x,
            z,
            index: lampPlacements.length,
            intact: true,
            resetT: 0,
            baseMatrix,
          });
          lampPlacements.push(baseMatrix);
        }
      }
    }
  }
  const { meshes: lampMeshes, partMatrices: lampPartMatrices } = instanceParts(scene, lampTemplate, lampPlacements);
  const LAMP_HIDDEN = new THREE.Matrix4().makeScale(0, 0, 0);
  const lampRestoreMat = new THREE.Matrix4();
  const flyingLamps: {
    mesh: THREE.Group;
    vx: number;
    vy: number;
    vz: number;
    spinX: number;
    spinY: number;
    spinZ: number;
    life: number;
  }[] = [];

  function knockLamp(
    lamp: (typeof lampSpots)[number],
    vx: number,
    vy: number,
    vz: number,
    fx?: import('./types').Fx,
    play?: (sfx: import('./types').Sfx) => void,
  ): void {
    lamp.intact = false;
    lamp.resetT = 35;
    for (const inst of lampMeshes) {
      inst.setMatrixAt(lamp.index, LAMP_HIDDEN);
      inst.instanceMatrix.needsUpdate = true;
    }
    play?.('smash');
    fx?.smash?.(lamp.x, 1.0, lamp.z, 0xd93636);
    if (flyingLamps.length >= 16) {
      const oldest = flyingLamps.shift();
      if (oldest) scene.remove(oldest.mesh);
    }
    const mesh = buildPrefab('mushroom-lamp', { scale: 1.4, lights: false });
    mesh.position.set(lamp.x, 0, lamp.z);
    scene.add(mesh);
    flyingLamps.push({
      mesh,
      vx,
      vy,
      vz,
      spinX: (Math.random() - 0.5) * 14,
      spinY: (Math.random() - 0.5) * 14,
      spinZ: (Math.random() - 0.5) * 14,
      life: 5.5,
    });
  }

  // ---- District props, food truck, vending machines, Under-Deck portals, and billboards -----------------------------
  const gnomaTruck = tryInstantiate(scene, 'gta-gnoma-truck', { footprint: 5.5 }, GNOMA_TRUCK.x, GNOMA_TRUCK.z, GNOMA_TRUCK.yaw);
  if (gnomaTruck) boxes.push(boxOf(gnomaTruck));
  buildGreenhouseStrip(scene, boxes);
  buildCulvertPortals(scene, boxes);
  const vending = scatterVendingMachines(scene, boxes);
  const dressing = buildDistrictDressing(scene, boxes);

  // ---- The biomes: everything that stands on the biome ground (Fort Sandpit, the airfield, villages, farms) ----------
  const biomes = buildBiomes(scene);
  for (const b of biomes.boxes) boxes.push(b);
  // ---- Countryside landscaping (scenery.ts): tree belts on the hills, hedgerows and walls along the country roads --------
  // ---- Outer-region settlements (settlements.ts): house clusters along the outer roads, in each region's theme -------
  buildSettlements(scene, boxes);
  buildScenery(scene, boxes);
  // ---- Water (Epic 4): river, canal, loch and sea surfaces; bridges, docks, locks and their moored boats -------------
  const water = buildWaterMeshes(scene);
  const waterworks = buildWaterworks(scene, boxes);
  placeBillboards(scene, boxes);

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
    { x: -134, z: 68, yaw: 0, kind: 'lowrider' },
    { x: -16, z: 34, yaw: Math.PI / 2, kind: 'mulch-spreader' },
    { x: -72, z: -72, yaw: 0, kind: 'boot-float' },
  ];
  for (const p of biomes.parked) parked.push(p);
  for (const p of waterworks.boats) parked.push(p);
  const restKinds: VehicleKind[] = [
    'ride-on', 'ride-on', 'ride-on', 'push-bike', 'push-bike', 'zero-turn',
  ];
  // Park an off-road combine in the industrial yard if clear of boxes (never on city roads).
  const yardCombine: ParkedSpot = { x: -172, z: 134, yaw: Math.PI / 2, kind: 'combine' };
  if (!insideBox(yardCombine.x, 0.5, yardCombine.z, boxes) && !nearHighway({ minX: yardCombine.x - 3, maxX: yardCombine.x + 3, minZ: yardCombine.z - 3, maxZ: yardCombine.z + 3 }, HALF_ROAD + 2)) {
    parked.push(yardCombine);
  }
  const validSpot = (s: ParkedSpot, axis: Axis): boolean => {
    if (insideBox(s.x, 0.5, s.z, boxes)) return false;
    if (nearHighway({ minX: s.x, maxX: s.x, minZ: s.z, maxZ: s.z }, HALF_ROAD + 2)) return false;
    const along = axis === 'vert' ? s.z : s.x;
    if (ROAD_LINES.some((w) => Math.abs(along - w) < 8)) return false;
    if (Math.abs(along) > CITY_HALF - 8) return false;
    return parked.every((p) => Math.hypot(p.x - s.x, p.z - s.z) >= 6);
  };
  const kerbRnd = mulberry32(REGIONS.turfton.data.kerbSeed ?? 0);
  for (const kind of restKinds) {
    for (let tries = 0; tries < 400; tries++) {
      let spot: ParkedSpot;
      const axis: Axis = kerbRnd() < 0.5 ? 'vert' : 'horz';
      const v = ROAD_LINES[Math.floor(kerbRnd() * ROAD_LINES.length)];
      const side = kerbRnd() < 0.5 ? -1 : 1;
      const [a, b] = CITY_SEG;
      const t = a + 8 + kerbRnd() * (b - a - 16);
      if (axis === 'vert') spot = { x: v + side * KERB, z: t, yaw: kerbRnd() < 0.5 ? 0 : Math.PI, kind };
      else spot = { x: t, z: v + side * KERB, yaw: kerbRnd() < 0.5 ? Math.PI / 2 : -Math.PI / 2, kind };
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
    dewBarrels: biomes.dewBarrels,
    vending,
    sun,
    hemi,
    update(dt: number, focusX: number, focusZ: number, nightFactor = 0) {
      sun.target.position.set(focusX, 0, focusZ);
      sun.position.set(focusX + 60, 100, focusZ + 40);
      biomes.update(dt);
      dressing.update(dt, nightFactor);
      water.update(dt, focusX, focusZ);
      waterworks.update(dt);
      terrain?.update(focusX, focusZ);
    },
    updateLamps(dt, vehicles, playerX, playerZ, fx, play) {
      for (let i = flyingLamps.length - 1; i >= 0; i--) {
        const f = flyingLamps[i];
        f.life -= dt;
        f.vy -= 20 * dt;
        f.mesh.position.x += f.vx * dt;
        f.mesh.position.y += f.vy * dt;
        f.mesh.position.z += f.vz * dt;
        f.mesh.rotation.x += f.spinX * dt;
        f.mesh.rotation.y += f.spinY * dt;
        f.mesh.rotation.z += f.spinZ * dt;
        if (f.mesh.position.y < 0.25) {
          f.mesh.position.y = 0.25;
          f.vy = Math.abs(f.vy) * 0.42;
          f.vx *= 0.78;
          f.vz *= 0.78;
          f.spinX *= 0.7;
          f.spinY *= 0.7;
          f.spinZ *= 0.7;
        }
        if (f.life <= 0) {
          scene.remove(f.mesh);
          flyingLamps.splice(i, 1);
        }
      }

      for (const lamp of lampSpots) {
        if (!lamp.intact) {
          lamp.resetT -= dt;
          if (lamp.resetT <= 0 && Math.hypot(playerX - lamp.x, playerZ - lamp.z) > 80) {
            lamp.intact = true;
            for (let p = 0; p < lampMeshes.length; p++) {
              lampRestoreMat.multiplyMatrices(lamp.baseMatrix, lampPartMatrices[p]);
              lampMeshes[p].setMatrixAt(lamp.index, lampRestoreMat);
              lampMeshes[p].instanceMatrix.needsUpdate = true;
            }
          }
          continue;
        }
        for (const v of vehicles) {
          if (v.y >= 2.2 || Math.abs(v.speed) <= 3.5) continue;
          const dx = lamp.x - v.x;
          const dz = lamp.z - v.z;
          const reach = v.spec.radius + 0.55;
          if (dx * dx + dz * dz > reach * reach) continue;
          const d = Math.hypot(dx, dz) || 1;
          const spd = Math.abs(v.speed);
          const fwdX = Math.sin(v.yaw) * v.speed;
          const fwdZ = Math.cos(v.yaw) * v.speed;
          knockLamp(
            lamp,
            (dx / d) * Math.max(4.5, spd * 0.65) + fwdX * 0.5 + (Math.random() - 0.5) * 2.5,
            4.5 + Math.min(7.5, spd * 0.24),
            (dz / d) * Math.max(4.5, spd * 0.65) + fwdZ * 0.5 + (Math.random() - 0.5) * 2.5,
            fx,
            play,
          );
          break;
        }
      }
    },
    hitLamp(x, y, z, fx, play) {
      if (y > 2.4) return false;
      for (const lamp of lampSpots) {
        if (!lamp.intact) continue;
        const dx = lamp.x - x;
        const dz = lamp.z - z;
        if (dx * dx + dz * dz <= 0.65 * 0.65) {
          knockLamp(
            lamp,
            (Math.random() - 0.5) * 6,
            5.5,
            (Math.random() - 0.5) * 6,
            fx,
            play,
          );
          return true;
        }
      }
      return false;
    },
  };
  return world;
}
