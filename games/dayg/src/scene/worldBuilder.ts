// The blockout map drawn (issue 2.3): ground with pit holes, pit walls and floors, blocks as one InstancedMesh per kind,
// path ribbons, climb routes, prop dressing and containers. Kept to a few dozen draw calls for phones.
// Maps up to STREAM_ABOVE metres across are built whole; bigger maps (roadmap 8.11) build the landmarks once, a coarse
// ground plane, and stream the rest in chunks around the player (see streaming.ts).
import * as THREE from 'three';
import { flatLayer, LAYER } from '@lawn/depth';
import { buildPrefab, buildStaticPrefabs, disposeStaticBatch } from '@lawn/prefabs';
import { BUILDING_PREFIX, COLORS, CONTAINER_PREFAB, PREFAB_SCALE, STREAMING } from '../config';
import type { BlockDef, BlockKind, BlockoutMap, ClimbRouteDef, PathDef, PitDef, PropDef, Side } from '../world/types';
import type { ContainerDef, Rect } from '../sim/types';
import type { WorldView } from '../game/types';
import { STREAM_ABOVE, bucket, chunkKey, chunkOf, isLandmark, parseChunkKey, plan } from './streaming';

const CELL = 10;
const COARSE_CELL = 64;     // the streamed map's far ground plane
const SINK = 0.05;          // every block's bottom goes this far below its y
const PATH_Y = 0.02;
const ROUTE_OUT = 0.15;     // ladders and ropes stand this far off the face
const PANEL_OUT = 0.08;     // ivy and carved letters
const LADDER_H = 1.6 * PREFAB_SCALE;
const OPEN_TILT = (15 * Math.PI) / 180;

const STONE_KINDS: ReadonlySet<BlockKind> = new Set(['headstone', 'kerb', 'angel', 'plinth', 'stone']);
const KIND_COLOR: Partial<Record<BlockKind, number>> = {
  hedge: COLORS.hedge, gatehouse: COLORS.wood, roof: COLORS.wood, bin: 0x3d4a3b, beam: 0x9aa0a6, wall: 0x2b2b2b, standpipe: 0x6d7378,
  crypt: 0x6b6b6b, 'niche-wall': 0x8a8478, yew: 0x2f4d2a, pond: 0x2a4a5a, reed: 0x6f7d3a, bench: 0x7a5a36, plaque: 0xb8b2a0,
  wreath: 0x3f6b2e, heap: 0x5a4a3a, bay: 0x8a7a5a, obelisk: 0xb5b1a8, birdbath: 0xc9c4b8, spire: 0xa9a59b, chapel: 0x9b9385,
  shelf: 0x6b4f32, mower: 0xc23b22, shed: 0x5b4632, pipe: 0x4a4f54, ornament: 0xd9b44a, fence: 0x3b3327, gate: 0x2b2b2b,
};

// ---------------------------------------------------------------- geometry helpers

/** Marks a geometry or material this module made, so unloading a chunk may dispose it (prefab caches are never disposed). */
function own<T extends THREE.BufferGeometry | THREE.Material>(x: T): T { x.userData.owned = true; return x; }

/** Collects quads into one non-indexed-normal BufferGeometry. Winding is fixed so the front face points along `n`. */
class QuadSink {
  pos: number[] = []; nor: number[] = []; idx: number[] = [];
  quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, n: THREE.Vector3): void {
    const base = this.pos.length / 3;
    for (const p of [a, b, c, d]) { this.pos.push(p.x, p.y, p.z); this.nor.push(n.x, n.y, n.z); }
    const e1 = new THREE.Vector3().subVectors(b, a), e2 = new THREE.Vector3().subVectors(c, a);
    const flip = e1.cross(e2).dot(n) < 0;
    if (flip) this.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    else this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  /** A horizontal rect at height y facing up. */
  flat(x0: number, x1: number, z0: number, z1: number, y: number): void {
    this.quad(new THREE.Vector3(x0, y, z0), new THREE.Vector3(x1, y, z0), new THREE.Vector3(x1, y, z1), new THREE.Vector3(x0, y, z1), UP);
  }
  get empty(): boolean { return this.idx.length === 0; }
  build(): THREE.BufferGeometry {
    const g = own(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}
const UP = new THREE.Vector3(0, 1, 0);
const v = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);

function inRect(r: Rect, x: number, z: number): boolean { return x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1; }
function inAnyPit(pits: readonly PitDef[], x: number, z: number, pad = 0): boolean {
  return pits.some((p) => x > p.rect.x0 - pad && x < p.rect.x1 + pad && z > p.rect.z0 - pad && z < p.rect.z1 + pad);
}

/** Stable 0..1 hash of a string (visual variation only). */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10007) / 10007;
}

/** Disposes what a built subtree owns: static batches, and this module's geometries and materials. */
function disposeTree(obj: THREE.Object3D): void {
  obj.traverse((o) => {
    if (o.userData.prefabBatch) { disposeStaticBatch(o as THREE.Group); return; }
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mesh.geometry.userData.owned) mesh.geometry.dispose();
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) if (m.userData.owned) m.dispose();
  });
}

// ---------------------------------------------------------------- pieces

/** Flat ground over `rect`, cut by the pits that overlap it. */
function groundGeometry(pits: readonly PitDef[], rect: Rect, cell: number): THREE.BufferGeometry {
  const sink = new QuadSink();
  const { x0, x1, z0, z1 } = rect;
  for (let cx = x0; cx < x1; cx += cell) {
    for (let cz = z0; cz < z1; cz += cell) {
      const ex = Math.min(cx + cell, x1), ez = Math.min(cz + cell, z1);
      const hit = pits.filter((p) => p.rect.x0 < ex && p.rect.x1 > cx && p.rect.z0 < ez && p.rect.z1 > cz);
      if (hit.length === 0) { sink.flat(cx, ex, cz, ez, 0); continue; }
      // Split the cell along every pit edge that crosses it, keep the pieces outside all pits.
      const xs = new Set([cx, ex]), zs = new Set([cz, ez]);
      for (const p of hit) {
        if (p.rect.x0 > cx && p.rect.x0 < ex) xs.add(p.rect.x0);
        if (p.rect.x1 > cx && p.rect.x1 < ex) xs.add(p.rect.x1);
        if (p.rect.z0 > cz && p.rect.z0 < ez) zs.add(p.rect.z0);
        if (p.rect.z1 > cz && p.rect.z1 < ez) zs.add(p.rect.z1);
      }
      const xa = [...xs].sort((a, b) => a - b), za = [...zs].sort((a, b) => a - b);
      for (let i = 0; i < xa.length - 1; i++) {
        for (let j = 0; j < za.length - 1; j++) {
          const mx = (xa[i] + xa[i + 1]) / 2, mz = (za[j] + za[j + 1]) / 2;
          if (!hit.some((p) => inRect(p.rect, mx, mz))) sink.flat(xa[i], xa[i + 1], za[j], za[j + 1], 0);
        }
      }
    }
  }
  return sink.build();
}

function groundMesh(pits: readonly PitDef[], rect: Rect, cell: number, name: string): THREE.Mesh {
  const mat = flatLayer(own(new THREE.MeshLambertMaterial({ color: COLORS.ground })), LAYER.ground);
  const mesh = new THREE.Mesh(groundGeometry(pits, rect, cell), mat);
  mesh.name = name;
  mesh.receiveShadow = true;
  return mesh;
}

function buildPits(pits: readonly PitDef[]): THREE.Mesh | null {
  if (pits.length === 0) return null;
  const sink = new QuadSink();
  for (const { rect: r, depth } of pits) {
    const b = -depth;
    sink.flat(r.x0, r.x1, r.z0, r.z1, b);
    // Inner walls, each facing into the pit.
    sink.quad(v(r.x0, 0, r.z0), v(r.x1, 0, r.z0), v(r.x1, b, r.z0), v(r.x0, b, r.z0), v(0, 0, 1));
    sink.quad(v(r.x0, 0, r.z1), v(r.x1, 0, r.z1), v(r.x1, b, r.z1), v(r.x0, b, r.z1), v(0, 0, -1));
    sink.quad(v(r.x0, 0, r.z0), v(r.x0, 0, r.z1), v(r.x0, b, r.z1), v(r.x0, b, r.z0), v(1, 0, 0));
    sink.quad(v(r.x1, 0, r.z0), v(r.x1, 0, r.z1), v(r.x1, b, r.z1), v(r.x1, b, r.z0), v(-1, 0, 0));
  }
  const mesh = new THREE.Mesh(sink.build(), own(new THREE.MeshLambertMaterial({ color: COLORS.pit })));
  mesh.name = 'pits';
  mesh.receiveShadow = true;
  return mesh;
}

function buildBlocks(blocks: readonly BlockDef[]): THREE.Object3D[] {
  const byKind = new Map<BlockKind, BlockDef[]>();
  for (const b of blocks) {
    const list = byKind.get(b.kind);
    if (list) list.push(b); else byKind.set(b.kind, [b]);
  }
  const box = own(new THREE.BoxGeometry(1, 1, 1));
  const out: THREE.Object3D[] = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const stone = new THREE.Color(COLORS.stone), moss = new THREE.Color(COLORS.mossStone), c = new THREE.Color();
  for (const [kind, list] of byKind) {
    const isStone = STONE_KINDS.has(kind);
    const mat = own(new THREE.MeshLambertMaterial({ color: isStone ? 0xffffff : (KIND_COLOR[kind] ?? COLORS.stone) }));
    const mesh = new THREE.InstancedMesh(box, mat, list.length);
    mesh.name = `blocks-${kind}`;
    list.forEach((b, i) => {
      const h = b.h + SINK;
      p.set((b.x0 + b.x1) / 2, b.y - SINK + h / 2, (b.z0 + b.z1) / 2);
      s.set(b.x1 - b.x0, h, b.z1 - b.z0);
      mesh.setMatrixAt(i, m.compose(p, q, s));
      if (isStone) mesh.setColorAt(i, c.copy(stone).lerp(moss, hash01(b.id) * 0.8));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    out.push(mesh);
  }
  return out;
}

function buildPaths(paths: readonly PathDef[], pits: readonly PitDef[]): THREE.Object3D[] {
  const gravel = new QuadSink(), grass = new QuadSink();
  const STEP = 1;
  for (const path of paths) {
    const sink = path.kind === 'gravel' ? gravel : grass;
    const hw = path.width / 2;
    for (let i = 0; i < path.points.length - 1; i++) {
      const [ax, az] = path.points[i], [bx, bz] = path.points[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      if (len < 1e-6) continue;
      const dx = (bx - ax) / len, dz = (bz - az) / len, nx = -dz * hw, nz = dx * hw;
      const n = Math.max(1, Math.ceil(len / STEP));
      // Pieces along the segment; pieces over a pit are skipped, contiguous kept pieces become one quad.
      let runStart = -1;
      const flush = (from: number, to: number): void => {
        const t0 = (from / n) * len, t1 = (to / n) * len;
        const p0x = ax + dx * t0, p0z = az + dz * t0, p1x = ax + dx * t1, p1z = az + dz * t1;
        sink.quad(v(p0x + nx, PATH_Y, p0z + nz), v(p1x + nx, PATH_Y, p1z + nz), v(p1x - nx, PATH_Y, p1z - nz), v(p0x - nx, PATH_Y, p0z - nz), UP);
      };
      for (let k = 0; k <= n; k++) {
        const over = k < n && (() => {
          const t = ((k + 0.5) / n) * len, mx = ax + dx * t, mz = az + dz * t;
          return inAnyPit(pits, mx, mz, hw);
        })();
        if (k < n && !over) { if (runStart < 0) runStart = k; }
        else if (runStart >= 0) { flush(runStart, k); runStart = -1; }
      }
    }
  }
  const out: THREE.Object3D[] = [];
  if (!gravel.empty) {
    const mesh = new THREE.Mesh(gravel.build(), flatLayer(own(new THREE.MeshLambertMaterial({ color: COLORS.gravel })), LAYER.road));
    mesh.name = 'paths-gravel'; mesh.receiveShadow = true; out.push(mesh);
  }
  if (!grass.empty) {
    const g = new THREE.Color(COLORS.ground).offsetHSL(0, 0, 0.05);
    const mesh = new THREE.Mesh(grass.build(), flatLayer(own(new THREE.MeshLambertMaterial({ color: g })), LAYER.tint));
    mesh.name = 'paths-grass'; mesh.receiveShadow = true; out.push(mesh);
  }
  return out;
}

// ---------------------------------------------------------------- climb routes

/** Where a route stands: a point `out` off the face, the outward normal, and the face's span. */
interface FaceSpot { x: number; z: number; nx: number; nz: number; fromY: number; topY: number }
function faceSpot(map: BlockoutMap, route: ClimbRouteDef, out: number): FaceSpot | null {
  const block = map.blocks.find((b) => b.id === route.block);
  const pit = block ? undefined : map.pits.find((p) => p.id === route.block);
  const r: Rect | undefined = block ?? pit?.rect;
  if (!r) return null;
  const inv = pit ? -1 : 1;   // a pit's walls face inward
  const side: Side = route.side;
  let x = 0, z = 0, nx = 0, nz = 0;
  if (side === 'n') { nz = -1 * inv; z = r.z0 + nz * out; x = r.x0 + route.at; }
  else if (side === 's') { nz = 1 * inv; z = r.z1 + nz * out; x = r.x0 + route.at; }
  else if (side === 'w') { nx = -1 * inv; x = r.x0 + nx * out; z = r.z0 + route.at; }
  else { nx = 1 * inv; x = r.x1 + nx * out; z = r.z0 + route.at; }
  const fromY = block ? block.y : -(pit as PitDef).depth;
  const topY = block ? block.y + block.h : 0;
  return { x, z, nx, nz, fromY, topY };
}

function panel(sink: QuadSink, f: FaceSpot, halfW: number, y0: number, y1: number): void {
  const tx = -f.nz, tz = f.nx;   // along the face
  const n = v(f.nx, 0, f.nz);
  sink.quad(v(f.x - tx * halfW, y0, f.z - tz * halfW), v(f.x + tx * halfW, y0, f.z + tz * halfW),
    v(f.x + tx * halfW, y1, f.z + tz * halfW), v(f.x - tx * halfW, y1, f.z - tz * halfW), n);
}

/** A ladder or rope climbing from `fromY` to `topY` off one face, into `group`. */
function addClimb(group: THREE.Group, map: BlockoutMap, route: ClimbRouteDef, fromY: number, topY: number): void {
  const f = faceSpot(map, route, ROUTE_OUT);
  if (!f || topY <= fromY) return;
  const yaw = Math.atan2(f.nx, f.nz);   // prefab front (+z) turned to face out from the wall
  if (route.kind === 'ladder') {
    const count = Math.max(1, Math.ceil((topY - fromY) / LADDER_H - 0.05));
    const placements = [];
    for (let i = 0; i < count; i++) placements.push({ id: 'ladder', x: f.x, y: fromY + i * LADDER_H, z: f.z, yaw, scale: PREFAB_SCALE });
    // The stack is static: merged into one batch rather than `count` separate buildPrefab groups (draw calls).
    group.add(buildStaticPrefabs(placements, { name: `ladder-${route.id}`, lights: false }));
  } else if (route.kind === 'rope') {
    const h = topY - fromY;
    const rope = new THREE.Mesh(own(new THREE.CylinderGeometry(0.035, 0.035, h, 6)), own(new THREE.MeshLambertMaterial({ color: 0x7a5a36 })));
    rope.name = `rope-${route.id}`;
    rope.position.set(f.x, fromY + h / 2, f.z);
    rope.castShadow = true;
    group.add(rope);
    const coil = buildPrefab('rope-coil', { scale: PREFAB_SCALE });
    // On the top edge, just behind the face (on the block top, or the ground at a pit's rim).
    coil.position.set(f.x - f.nx * (ROUTE_OUT + 0.4), topY, f.z - f.nz * (ROUTE_OUT + 0.4));
    coil.rotation.y = yaw;
    group.add(coil);
  }
}

/** Climb routes, ivy and carved letters for `routes`, as one group. */
function routeSet(map: BlockoutMap, routes: readonly ClimbRouteDef[], name: string): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  const ivy = new QuadSink(), letters = new QuadSink();
  for (const route of routes) {
    if (route.kind === 'ivy' || route.kind === 'letters') {
      const f = faceSpot(map, route, PANEL_OUT);
      if (!f) continue;
      const span = f.topY - f.fromY;
      if (route.kind === 'ivy') panel(ivy, f, 0.7, f.fromY + 0.02, f.topY - 0.02);
      else {
        // Three carved rectangles stacked up the face.
        for (let i = 0; i < 3; i++) {
          const yc = f.fromY + span * (0.25 + i * 0.25), hh = Math.min(0.5, span * 0.08);
          panel(letters, f, 0.6 - i * 0.08, yc - hh, yc + hh);
        }
      }
    } else {
      const f = faceSpot(map, route, ROUTE_OUT);
      if (f) addClimb(group, map, route, f.fromY, f.topY);
    }
  }
  if (!ivy.empty) {
    const mat = flatLayer(own(new THREE.MeshLambertMaterial({ color: 0x3f6b2e, side: THREE.DoubleSide })), LAYER.decal);
    const mesh = new THREE.Mesh(ivy.build(), mat);
    mesh.name = 'routes-ivy'; mesh.receiveShadow = true; group.add(mesh);
  }
  if (!letters.empty) {
    const mat = flatLayer(own(new THREE.MeshLambertMaterial({ color: 0x2e2c29, side: THREE.DoubleSide })), LAYER.decal);
    const mesh = new THREE.Mesh(letters.build(), mat);
    mesh.name = 'routes-letters'; group.add(mesh);
  }
  return group;
}

// ---------------------------------------------------------------- containers

interface Ctx { containerObjects: Map<string, THREE.Object3D>; opened: Set<string> }

/** Darkens an opened container. The clones are this module's, so unloading may dispose them. */
function applyOpen(o: THREE.Object3D): void {
  o.rotation.x = OPEN_TILT;
  o.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    // Clone once (prefab materials are shared between copies), then darken the clone.
    const darken = (mat: THREE.Material): THREE.Material => {
      const m = own(mat.clone());
      const col = (m as THREE.MeshStandardMaterial).color;
      if (col) col.multiplyScalar(0.55);
      return m;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(darken) : darken(mesh.material);
  });
}

// ---------------------------------------------------------------- the world

interface Content { blocks: BlockDef[]; paths: PathDef[]; props: PropDef[]; containers: ContainerDef[] }

/** One piece of the world: ground (when `ground` is given), pits, blocks, paths, routes, props and containers. */
function buildPieces(
  ctx: Ctx, c: Content, routes: readonly ClimbRouteDef[], pits: readonly PitDef[],
  ground: { rect: Rect; cell: number } | null, map: BlockoutMap, name: string,
): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  const ids: string[] = [];
  if (ground) group.add(groundMesh(map.pits, ground.rect, ground.cell, 'ground'));
  const pitMesh = buildPits(pits);
  if (pitMesh) group.add(pitMesh);
  for (const o of buildBlocks(c.blocks)) group.add(o);
  for (const o of buildPaths(c.paths, map.pits)) group.add(o);
  group.add(routeSet(map, routes, 'routes'));
  if (c.props.length > 0) {
    group.add(buildStaticPrefabs(
      c.props.map((p) => ({ id: p.prefab, x: p.x, y: p.y, z: p.z, yaw: p.rotY ?? 0, scale: p.scale ?? PREFAB_SCALE })),
      { name: 'props' },
    ));
  }
  const containersRoot = new THREE.Group();
  containersRoot.name = 'containers';
  for (const cd of c.containers) {
    const o = buildPrefab(CONTAINER_PREFAB[cd.type], { scale: PREFAB_SCALE });
    o.position.set(cd.x, cd.y, cd.z);
    o.rotation.y = hash01(cd.id) * Math.PI * 2;
    o.name = `container-${cd.id}`;
    containersRoot.add(o);
    ctx.containerObjects.set(cd.id, o);
    if (ctx.opened.has(cd.id)) applyOpen(o);
    ids.push(cd.id);
  }
  group.add(containersRoot);
  group.userData.containerIds = ids;
  return group;
}

/** The map's water: standpipes and rain catchers as prefabs, puddles as one flat mesh. */
function buildWater(map: BlockoutMap): THREE.Group {
  const water = new THREE.Group();
  water.name = 'water';
  const puddleGeos: THREE.BufferGeometry[] = [];
  for (const w of map.water) {
    if (w.kind === 'rain-catcher') {
      const o = buildPrefab('rain-catcher', { scale: PREFAB_SCALE });
      o.position.set(w.x, w.y, w.z);
      water.add(o);
    } else if (w.kind === 'standpipe') {
      const o = buildPrefab('standpipe', { scale: 3 });
      o.position.set(w.x, w.y, w.z);
      water.add(o);
    } else {
      const g = new THREE.CircleGeometry(1.6, 16);
      g.rotateX(-Math.PI / 2);
      g.translate(w.x, w.y + PATH_Y, w.z);
      puddleGeos.push(g);
    }
  }
  if (puddleGeos.length > 0) {
    const sink = new QuadSink();   // merge the discs by hand (non-indexed concat)
    const pos: number[] = [], nor: number[] = [], idx: number[] = [];
    for (const g of puddleGeos) {
      const base = pos.length / 3;
      pos.push(...(g.getAttribute('position').array as ArrayLike<number> as number[]));
      nor.push(...(g.getAttribute('normal').array as ArrayLike<number> as number[]));
      const gi = g.getIndex();
      if (gi) for (let i = 0; i < gi.count; i++) idx.push(base + gi.getX(i));
      g.dispose();
    }
    sink.pos = pos; sink.nor = nor; sink.idx = idx;
    const mat = flatLayer(own(new THREE.MeshLambertMaterial({ color: 0x2a3b52 })), LAYER.area);
    const mesh = new THREE.Mesh(sink.build(), mat);
    mesh.name = 'puddles';
    water.add(mesh);
  }
  return water;
}

/** The part of chunk (cx, cz) inside the map bounds, or null when the chunk lies outside them. */
function clipToBounds(cx: number, cz: number, b: Rect): Rect | null {
  const s = STREAMING.chunk;
  const r = { x0: Math.max(cx * s, b.x0), x1: Math.min((cx + 1) * s, b.x1), z0: Math.max(cz * s, b.z0), z1: Math.min((cz + 1) * s, b.z1) };
  return r.x1 > r.x0 && r.z1 > r.z0 ? r : null;
}

export function buildWorld(scene: THREE.Scene, map: BlockoutMap): WorldView {
  const root = new THREE.Group();
  root.name = 'dayg-world';
  const ctx: Ctx = { containerObjects: new Map(), opened: new Set() };
  const b = map.bounds;
  const span = Math.max(b.x1 - b.x0, b.z1 - b.z0);
  const streamed = span > STREAM_ABOVE;
  const blocks = map.blocks.filter((bl) => !bl.id.startsWith(BUILDING_PREFIX));

  root.add(buildWater(map));

  // Dynamic routes (placed by the player) live outside the chunks: never unloaded.
  const dynamicRoutes = new THREE.Group();
  dynamicRoutes.name = 'dynamic-routes';
  root.add(dynamicRoutes);

  let update: (focus: { x: number; y: number; z: number }) => void = () => {};
  if (!streamed) {
    root.add(buildPieces(ctx, { blocks, paths: map.paths, props: map.props, containers: map.containers }, map.routes, map.pits,
      { rect: b, cell: CELL }, map, 'content'));
  } else {
    update = streamWorld(root, ctx, map, blocks).update;
  }

  scene.add(root);
  let meshes = 0;
  root.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes++; });
  console.info(`[dayg] world: ${meshes} meshes under root${streamed ? ' (streamed)' : ''}`);

  return {
    root,
    containerObjects: ctx.containerObjects,
    addRoute(route, fromY, topY) { addClimb(dynamicRoutes, map, route, fromY, topY); },
    setContainerOpened(id) {
      if (ctx.opened.has(id)) return;
      ctx.opened.add(id);
      const o = ctx.containerObjects.get(id);
      if (o) applyOpen(o);
    },
    update(focus) { update(focus); },
  };
}

/** The big-map build: landmarks and a coarse ground once, then chunks loaded and unloaded around the focus. */
function streamWorld(root: THREE.Group, ctx: Ctx, map: BlockoutMap, blocks: BlockDef[]): { update(focus: { x: number; y: number; z: number }): void } {
  const b = map.bounds;
  const landmarkBlocks = blocks.filter(isLandmark);
  const landmarkIds = new Set(landmarkBlocks.map((bl) => bl.id));
  const landmarkRoutes = map.routes.filter((r) => landmarkIds.has(r.block));
  root.add(buildPieces(ctx, { blocks: landmarkBlocks, paths: [], props: [], containers: [] }, landmarkRoutes, [], null, map, 'landmarks'));

  // The far plane: the whole map at coarse cells, pushed back so a loaded chunk's ground wins where they overlap.
  const coarseMat = new THREE.MeshLambertMaterial({ color: COLORS.ground });
  coarseMat.polygonOffset = true;
  coarseMat.polygonOffsetFactor = 1;
  coarseMat.polygonOffsetUnits = 1;
  coarseMat.userData.owned = true;
  const coarse = new THREE.Mesh(groundGeometry(map.pits, b, COARSE_CELL), coarseMat);
  coarse.name = 'ground-coarse';
  root.add(coarse);

  const chunkRoot = new THREE.Group();
  chunkRoot.name = 'chunks';
  root.add(chunkRoot);

  // Chunk indexes: contents by chunk, the climb routes by the chunk of their face, pits by the chunk of their centre.
  const buckets = bucket({ ...map, blocks });
  const routesByChunk = new Map<string, ClimbRouteDef[]>();
  for (const r of map.routes) {
    if (landmarkIds.has(r.block)) continue;
    const f = faceSpot(map, r, ROUTE_OUT);
    if (!f) continue;
    const c = chunkOf(f.x, f.z);
    const key = chunkKey(c.cx, c.cz);
    const list = routesByChunk.get(key);
    if (list) list.push(r); else routesByChunk.set(key, [r]);
  }
  const pitsByChunk = new Map<string, PitDef[]>();
  for (const p of map.pits) {
    const c = chunkOf((p.rect.x0 + p.rect.x1) / 2, (p.rect.z0 + p.rect.z1) / 2);
    const key = chunkKey(c.cx, c.cz);
    const list = pitsByChunk.get(key);
    if (list) list.push(p); else pitsByChunk.set(key, [p]);
  }

  const loaded = new Map<string, THREE.Group>();
  /** Builds one chunk. Returns true when it cost a build (it has ground), false for a chunk outside the map. */
  function loadChunk(key: string): boolean {
    const { cx, cz } = parseChunkKey(key);
    const rect = clipToBounds(cx, cz, b);
    const bk = buckets.get(key);
    const content: Content = {
      blocks: (bk?.blocks ?? []).map((i) => blocks[i]).filter((bl) => !isLandmark(bl)),
      paths: (bk?.paths ?? []).map((i) => map.paths[i]),
      props: (bk?.props ?? []).map((i) => map.props[i]),
      containers: (bk?.containers ?? []).map((i) => map.containers[i]),
    };
    const group = buildPieces(ctx, content, routesByChunk.get(key) ?? [], pitsByChunk.get(key) ?? [],
      rect ? { rect, cell: CELL } : null, map, `chunk-${key}`);
    chunkRoot.add(group);
    loaded.set(key, group);
    return rect !== null;
  }
  function unloadChunk(key: string): void {
    const group = loaded.get(key);
    if (!group) return;
    chunkRoot.remove(group);
    for (const id of group.userData.containerIds as string[]) ctx.containerObjects.delete(id);
    disposeTree(group);
    loaded.delete(key);
  }

  let focusKey = '';
  let queue: string[] = [];
  return {
    update(focus) {
      const f = chunkOf(focus.x, focus.z);
      const key = chunkKey(f.cx, f.cz);
      if (key !== focusKey) {
        focusKey = key;
        const p = plan(focus, new Set(loaded.keys()), STREAMING.radius);
        for (const k of p.unload) unloadChunk(k);
        queue = p.load;
      }
      let budget = STREAMING.maxBuildPerFrame;
      while (budget > 0 && queue.length > 0) {
        const k = queue.shift() as string;
        if (loaded.has(k)) continue;
        if (loadChunk(k)) budget--;
      }
    },
  };
}
