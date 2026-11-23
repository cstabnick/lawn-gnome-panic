// The blockout map drawn (issue 2.3): ground with pit holes, pit walls and floors, blocks as one InstancedMesh per kind,
// path ribbons, climb routes, prop dressing and containers. Kept to a few dozen draw calls for phones.
import * as THREE from 'three';
import { flatLayer, LAYER } from '@lawn/depth';
import { buildPrefab, buildStaticPrefabs } from '@lawn/prefabs';
import { COLORS, CONTAINER_PREFAB, PREFAB_SCALE } from '../config';
import type { BlockDef, BlockKind, BlockoutMap, ClimbRouteDef, PitDef, Side } from '../world/types';
import type { Rect } from '../sim/types';
import type { WorldView } from '../game/types';

const CELL = 10;
const SINK = 0.05;          // every block's bottom goes this far below its y
const PATH_Y = 0.02;
const ROUTE_OUT = 0.15;     // ladders and ropes stand this far off the face
const PANEL_OUT = 0.08;     // ivy and carved letters
const LADDER_H = 1.6 * PREFAB_SCALE;
const OPEN_TILT = (15 * Math.PI) / 180;

const STONE_KINDS: ReadonlySet<BlockKind> = new Set(['headstone', 'kerb', 'angel', 'plinth', 'stone']);
const KIND_COLOR: Partial<Record<BlockKind, number>> = {
  hedge: COLORS.hedge, gatehouse: COLORS.wood, roof: COLORS.wood, bin: 0x3d4a3b, beam: 0x9aa0a6, wall: 0x2b2b2b, standpipe: 0x6d7378,
};

// ---------------------------------------------------------------- geometry helpers

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
    const g = new THREE.BufferGeometry();
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

// ---------------------------------------------------------------- pieces

function buildGround(map: BlockoutMap): THREE.Mesh {
  const sink = new QuadSink();
  const { x0, x1, z0, z1 } = map.bounds;
  for (let cx = x0; cx < x1; cx += CELL) {
    for (let cz = z0; cz < z1; cz += CELL) {
      const ex = Math.min(cx + CELL, x1), ez = Math.min(cz + CELL, z1);
      const hit = map.pits.filter((p) => p.rect.x0 < ex && p.rect.x1 > cx && p.rect.z0 < ez && p.rect.z1 > cz);
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
  const mesh = new THREE.Mesh(sink.build(), flatLayer(new THREE.MeshLambertMaterial({ color: COLORS.ground }), LAYER.ground));
  mesh.name = 'ground';
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
  const mesh = new THREE.Mesh(sink.build(), new THREE.MeshLambertMaterial({ color: COLORS.pit }));
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
  const box = new THREE.BoxGeometry(1, 1, 1);
  const out: THREE.Object3D[] = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const stone = new THREE.Color(COLORS.stone), moss = new THREE.Color(COLORS.mossStone), c = new THREE.Color();
  for (const [kind, list] of byKind) {
    const isStone = STONE_KINDS.has(kind);
    const mat = new THREE.MeshLambertMaterial({ color: isStone ? 0xffffff : (KIND_COLOR[kind] ?? COLORS.stone) });
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

function buildPaths(map: BlockoutMap): THREE.Object3D[] {
  const gravel = new QuadSink(), grass = new QuadSink();
  const STEP = 1;
  for (const path of map.paths) {
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
          return inAnyPit(map.pits, mx, mz, hw);
        })();
        if (k < n && !over) { if (runStart < 0) runStart = k; }
        else if (runStart >= 0) { flush(runStart, k); runStart = -1; }
      }
    }
  }
  const out: THREE.Object3D[] = [];
  if (!gravel.empty) {
    const mesh = new THREE.Mesh(gravel.build(), flatLayer(new THREE.MeshLambertMaterial({ color: COLORS.gravel }), LAYER.road));
    mesh.name = 'paths-gravel'; mesh.receiveShadow = true; out.push(mesh);
  }
  if (!grass.empty) {
    const g = new THREE.Color(COLORS.ground).offsetHSL(0, 0, 0.05);
    const mesh = new THREE.Mesh(grass.build(), flatLayer(new THREE.MeshLambertMaterial({ color: g }), LAYER.tint));
    mesh.name = 'paths-grass'; mesh.receiveShadow = true; out.push(mesh);
  }
  return out;
}

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

// ---------------------------------------------------------------- the world

export function buildWorld(scene: THREE.Scene, map: BlockoutMap): WorldView {
  const root = new THREE.Group();
  root.name = 'dayg-world';

  root.add(buildGround(map));
  const pits = buildPits(map.pits);
  if (pits) root.add(pits);
  for (const o of buildBlocks(map.blocks)) root.add(o);
  for (const o of buildPaths(map)) root.add(o);

  // ---- climb routes: ivy and carved letters merged into one mesh each
  const ivy = new QuadSink(), letters = new QuadSink();
  const panel = (sink: QuadSink, f: FaceSpot, halfW: number, y0: number, y1: number): void => {
    const tx = -f.nz, tz = f.nx;   // along the face
    const n = v(f.nx, 0, f.nz);
    sink.quad(v(f.x - tx * halfW, y0, f.z - tz * halfW), v(f.x + tx * halfW, y0, f.z + tz * halfW),
      v(f.x + tx * halfW, y1, f.z + tz * halfW), v(f.x - tx * halfW, y1, f.z - tz * halfW), n);
  };

  const routesRoot = new THREE.Group();
  routesRoot.name = 'routes';
  root.add(routesRoot);
  const ropeMat = new THREE.MeshLambertMaterial({ color: 0x7a5a36 });

  function addRoute(route: ClimbRouteDef, fromY: number, topY: number): void {
    const f = faceSpot(map, route, ROUTE_OUT);
    if (!f || topY <= fromY) return;
    const yaw = Math.atan2(f.nx, f.nz);   // prefab front (+z) turned to face out from the wall
    if (route.kind === 'ladder') {
      const count = Math.max(1, Math.ceil((topY - fromY) / LADDER_H - 0.05));
      const placements = [];
      for (let i = 0; i < count; i++) placements.push({ id: 'ladder', x: f.x, y: fromY + i * LADDER_H, z: f.z, yaw, scale: PREFAB_SCALE });
      // The stack is static: merged into one batch rather than `count` separate buildPrefab groups (draw calls).
      const stack = buildStaticPrefabs(placements, { name: `ladder-${route.id}`, lights: false });
      routesRoot.add(stack);
    } else if (route.kind === 'rope') {
      const h = topY - fromY;
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, h, 6), ropeMat);
      rope.name = `rope-${route.id}`;
      rope.position.set(f.x, fromY + h / 2, f.z);
      rope.castShadow = true;
      routesRoot.add(rope);
      const coil = buildPrefab('rope-coil', { scale: PREFAB_SCALE });
      // On the top edge, just behind the face (on the block top, or the ground at a pit's rim).
      coil.position.set(f.x - f.nx * (ROUTE_OUT + 0.4), topY, f.z - f.nz * (ROUTE_OUT + 0.4));
      coil.rotation.y = yaw;
      routesRoot.add(coil);
    }
  }

  for (const route of map.routes) {
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
      if (f) addRoute(route, f.fromY, f.topY);
    }
  }
  if (!ivy.empty) {
    const mesh = new THREE.Mesh(ivy.build(), flatLayer(new THREE.MeshLambertMaterial({ color: 0x3f6b2e, side: THREE.DoubleSide }), LAYER.decal));
    mesh.name = 'routes-ivy'; mesh.receiveShadow = true; root.add(mesh);
  }
  if (!letters.empty) {
    const mesh = new THREE.Mesh(letters.build(), flatLayer(new THREE.MeshLambertMaterial({ color: 0x2e2c29, side: THREE.DoubleSide }), LAYER.decal));
    mesh.name = 'routes-letters'; root.add(mesh);
  }

  // ---- props: one static batch
  if (map.props.length > 0) {
    root.add(buildStaticPrefabs(
      map.props.map((p) => ({ id: p.prefab, x: p.x, y: p.y, z: p.z, yaw: p.rotY ?? 0, scale: p.scale ?? PREFAB_SCALE })),
      { name: 'props' },
    ));
  }

  // ---- water
  const puddles = new THREE.Group();
  const puddleGeos: THREE.BufferGeometry[] = [];
  for (const w of map.water) {
    if (w.kind === 'rain-catcher') {
      const o = buildPrefab('rain-catcher', { scale: PREFAB_SCALE });
      o.position.set(w.x, w.y, w.z);
      root.add(o);
    } else if (w.kind === 'standpipe') {
      const o = buildPrefab('standpipe', { scale: 3 });
      o.position.set(w.x, w.y, w.z);
      root.add(o);
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
    const mesh = new THREE.Mesh(sink.build(), flatLayer(new THREE.MeshLambertMaterial({ color: 0x2a3b52 }), LAYER.area));
    mesh.name = 'puddles';
    puddles.add(mesh);
    root.add(puddles);
  }

  // ---- containers
  const containerObjects = new Map<string, THREE.Object3D>();
  const containersRoot = new THREE.Group();
  containersRoot.name = 'containers';
  root.add(containersRoot);
  for (const c of map.containers) {
    const o = buildPrefab(CONTAINER_PREFAB[c.type], { scale: PREFAB_SCALE });
    o.position.set(c.x, c.y, c.z);
    o.rotation.y = hash01(c.id) * Math.PI * 2;
    o.name = `container-${c.id}`;
    containersRoot.add(o);
    containerObjects.set(c.id, o);
  }
  const opened = new Set<string>();
  function setContainerOpened(id: string): void {
    const o = containerObjects.get(id);
    if (!o || opened.has(id)) return;
    opened.add(id);
    o.rotation.x = OPEN_TILT;
    o.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      // Clone once (prefab materials are shared between copies), then darken the clone.
      const darken = (mat: THREE.Material): THREE.Material => {
        const m = mat.clone();
        const col = (m as THREE.MeshStandardMaterial).color;
        if (col) col.multiplyScalar(0.55);
        return m;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(darken) : darken(mesh.material);
    });
  }

  scene.add(root);
  let meshes = 0;
  root.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes++; });
  console.info(`[dayg] world: ${meshes} meshes under root`);

  return { root, containerObjects, addRoute, setContainerOpened };
}
