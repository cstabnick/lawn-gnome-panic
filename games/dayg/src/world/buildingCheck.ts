// checkBuilding: problems with one expanded building (empty = fine). Pure: no three.js, no DOM.
// Each problem is `${def.id}: ` plus a message containing its keyword in single quotes ('door', 'walk-in', ...).
import { DOOR, PLAYER_HEIGHT, PLAYER_RADIUS, STEP_UP, VAULT_MAX } from '../config';
import { REGIONS, regionAt } from '../sim/regions';
import type { Rect } from '../sim/types';
import { createCollider, type Collider, type Vec3 } from './collide';
import type { BuildingParts } from './buildingTypes';
import type { BlockDef, BlockoutMap, Side } from './types';

const EPS = 1e-6;
const GRID = 0.5;          // flood-fill grid, gm
const GROW = 3;            // flood-fill area: footprint grown by this
const NODE_CAP = 200000;
const CONTAINER_REACH_XZ = 1.5;
const CONTAINER_REACH_Y = 2.4;
const EXIT_REACH = 1.0;

type FaceKey = 'x0' | 'x1' | 'z0' | 'z1' | 'bottom' | 'top';
interface Face { plane: number; u0: number; u1: number; v0: number; v1: number }
const FACE_KEYS: readonly FaceKey[] = ['x0', 'x1', 'z0', 'z1', 'bottom', 'top'];

const rectOf = (b: Rect): Rect => ({ x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 });
const grow = (r: Rect, g: number): Rect => ({ x0: r.x0 - g, x1: r.x1 + g, z0: r.z0 - g, z1: r.z1 + g });
const overlapArea = (a: Rect, b: Rect): number => {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
  return w > 0 && h > 0 ? w * h : 0;
};
const inRectXZ = (r: Rect, x: number, z: number): boolean => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

function facesOf(b: BlockDef): Record<FaceKey, Face> {
  const y0 = b.y - 0.05, y1 = b.y + b.h;
  return {
    x0: { plane: b.x0, u0: b.z0, u1: b.z1, v0: y0, v1: y1 },
    x1: { plane: b.x1, u0: b.z0, u1: b.z1, v0: y0, v1: y1 },
    z0: { plane: b.z0, u0: b.x0, u1: b.x1, v0: y0, v1: y1 },
    z1: { plane: b.z1, u0: b.x0, u1: b.x1, v0: y0, v1: y1 },
    bottom: { plane: y0, u0: b.x0, u1: b.x1, v0: b.z0, v1: b.z1 },
    top: { plane: y1, u0: b.x0, u1: b.x1, v0: b.z0, v1: b.z1 },
  };
}

interface FaceAt { fx: number; fz: number; nx: number; nz: number }
function faceOf(b: BlockDef, side: Side, at: number): FaceAt {
  switch (side) {
    case 'n': return { fx: b.x0 + at, fz: b.z0, nx: 0, nz: -1 };
    case 's': return { fx: b.x0 + at, fz: b.z1, nx: 0, nz: 1 };
    case 'w': return { fx: b.x0, fz: b.z0 + at, nx: -1, nz: 0 };
    case 'e': return { fx: b.x1, fz: b.z0 + at, nx: 1, nz: 0 };
  }
}

interface GNode { ix: number; iz: number; x: number; y: number; z: number }

export function checkBuilding(parts: BuildingParts, others: readonly BlockDef[]): string[] {
  const def = parts.def;
  if (def.draft) return [];
  const problems: string[] = [];
  const bad = (msg: string): void => { problems.push(`${def.id}: ${msg}`); };
  const f = def.footprint;
  const near = grow(f, 1);
  const blockById = new Map(parts.blocks.map((b) => [b.id, b] as const));

  // 1. region
  const regionRect = REGIONS.find((r) => r.id === def.region)?.rect;
  if (!regionRect || f.x0 < regionRect.x0 || f.x1 > regionRect.x1 || f.z0 < regionRect.z0 || f.z1 > regionRect.z1) {
    bad(`'region' footprint is not inside ${def.region}`);
  }
  for (const c of parts.containers) if (regionAt(c.x, c.z) !== def.region) bad(`'region' container ${c.id} is outside ${def.region}`);
  for (const s of parts.spots) if (regionAt(s.x, s.z) !== def.region) bad(`'region' spot ${s.id} is outside ${def.region}`);

  // 2. door and openings
  if (parts.doors.length === 0) bad(`'door' there is no door`);
  for (const d of parts.doors) {
    const sill = def.shell.openings.find((o) => o.door && o.side === d.side)?.sill ?? 0;
    if (d.width < DOOR.minWidth || d.height < DOOR.minHeight || sill !== 0) bad(`'door' ${d.id} is narrower than ${DOOR.minWidth}, lower than ${DOOR.minHeight}, or has a sill`);
  }
  const t = def.shell.thick;
  const sideLen = (s: Side): number => (s === 'n' || s === 's' ? f.x1 - f.x0 : f.z1 - f.z0);
  const ops = def.shell.openings;
  for (const o of ops) {
    if (o.at < t + 0.5 || o.at + o.width > sideLen(o.side) - t - 0.5) bad(`'opening' ${o.id} is too close to a corner`);
  }
  for (let i = 0; i < ops.length; i++) {
    for (let j = i + 1; j < ops.length; j++) {
      const a = ops[i], b = ops[j];
      if (a.side === b.side && a.at < b.at + b.width && b.at < a.at + a.width) bad(`'opening' ${a.id} and ${b.id} overlap`);
    }
  }

  // 3. storeys
  const st = def.storeys;
  for (let i = 1; i < st.length; i++) {
    if (st[i] - st[i - 1] < 3.2 - EPS) bad(`'storey' ${st[i]} is less than 3.2 above ${st[i - 1]}`);
  }
  if (st.length === 0 || st[0] !== (def.sunk ? -def.sunk : 0)) bad(`'storey' ground floor must be at ${def.sunk ? -def.sunk : 0}`);
  const topStorey = st.length ? st[st.length - 1] : 0;
  if (def.shell.height < topStorey + 3) bad(`'storey' shell is under 3 gm above the top storey`);

  // 4. containers and spots stand on ground or a block top, and are not inside a block
  const baseAt = (x: number, z: number): number => {
    let d = 0;
    for (const p of parts.pits) if (inRectXZ(p.rect, x, z)) d = Math.max(d, p.depth);
    return -d;
  };
  const checkPlaced = (label: string, id: string, x: number, y: number, z: number): void => {
    for (const b of parts.blocks) {
      if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && y > b.y + EPS && y < b.y + b.h - EPS) {
        bad(`'inside block' ${label} ${id} is inside ${b.id}`);
        return;
      }
    }
    const standing = Math.abs(y - baseAt(x, z)) < 0.01
      || parts.blocks.some((b) => inRectXZ(b, x, z) && Math.abs(y - (b.y + b.h)) < 0.01);
    if (!standing) bad(`'floats' ${label} ${id} is not standing on the ground or a block top`);
  };
  for (const c of parts.containers) checkPlaced('container', c.id, c.x, c.y, c.z);
  for (const s of parts.spots) checkPlaced('spot', s.id, s.x, s.y, s.z);

  // 5. coplanar faces (boxes drawn with their bottom 0.05 lower)
  const boxes: { id: string; faces: Record<FaceKey, Face> }[] = [];
  for (const b of [...parts.blocks, ...others.filter((o) => overlapArea(rectOf(o), near) > 0)]) {
    boxes.push({ id: b.id, faces: facesOf(b) });
  }
  // Bottom faces at or below ground level are exempt: ground boxes all sit on the ground and overlap in xz by design.
  const groundTop = Math.max(0, -(def.sunk ?? 0)) + 0.1;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      for (const key of FACE_KEYS) {
        const fa = boxes[i].faces[key], fb = boxes[j].faces[key];
        if (Math.abs(fa.plane - fb.plane) >= 0.005) continue;
        if (key === 'bottom' && fa.plane <= groundTop) continue;
        const w = Math.min(fa.u1, fb.u1) - Math.max(fa.u0, fb.u0);
        const h = Math.min(fa.v1, fb.v1) - Math.max(fa.v0, fb.v0);
        if (w > 0 && h > 0 && w * h > 1e-4) bad(`'coplanar' ${boxes[i].id} and ${boxes[j].id} share a ${key} face`);
      }
    }
  }
  for (const b of parts.blocks) {
    if (Math.abs(b.y + b.h) >= 0.02) continue;
    let area = (b.x1 - b.x0) * (b.z1 - b.z0);
    for (const p of parts.pits) area -= overlapArea(rectOf(b), p.rect);
    if (area > 1e-4) bad(`'ground' ${b.id} is at ground level outside the pits`);
  }

  // 6. clash with the map
  for (const o of others) if (overlapArea(rectOf(o), near) > 0) bad(`'clash' ${o.id} overlaps the footprint`);

  // Collider for walk-in and the flood fill: the building plus nearby map blocks.
  const nearby = others.filter((o) => overlapArea(rectOf(o), grow(f, 4)) > 0);
  const firstDoor = parts.doors[0];
  const map: BlockoutMap = {
    bounds: grow(f, 4),
    blocks: [...parts.blocks, ...nearby],
    routes: parts.routes,
    pits: parts.pits,
    spots: [], havens: [], water: [], paths: [], props: [], containers: [],
    playerSpawn: { x: firstDoor?.outX ?? f.x0, y: 0, z: firstDoor?.outZ ?? f.z0 },
  };
  const collider: Collider = createCollider(map);
  const pos: Vec3 = { x: 0, y: 0, z: 0 };
  const out: Vec3 = { x: 0, y: 0, z: 0 };

  // 7. walk-in: each door can be walked through from outside to inside
  for (const d of parts.doors) {
    pos.x = d.outX; pos.z = d.outZ; pos.y = collider.groundAt(d.outX, d.outZ, d.y);
    const dx = d.inX - d.outX, dz = d.inZ - d.outZ;
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.25));
    let blocked: string | null = null;
    for (let i = 0; i < n && blocked === null; i++) {
      blocked = collider.move(pos, dx / n, dz / n, PLAYER_RADIUS, PLAYER_HEIGHT, STEP_UP, out);
      pos.x = out.x; pos.z = out.z;
      pos.y = collider.groundAt(pos.x, pos.z, pos.y);
    }
    if (blocked !== null) bad(`'walk-in' ${d.id} cannot be walked through (blocked by ${blocked})`);
  }

  // 8. headroom over stair steps
  for (const s of parts.blocks) {
    if (parts.role[s.id] !== 'stair') continue;
    const stepTop = s.y + s.h;
    const shrunk: Rect = { x0: s.x0 + 0.15, x1: s.x1 - 0.15, z0: s.z0 + 0.15, z1: s.z1 - 0.15 };
    for (const b of parts.blocks) {
      if (parts.role[b.id] === 'stair') continue;
      if (overlapArea(shrunk, rectOf(b)) > 0 && b.y < stepTop + PLAYER_HEIGHT + 0.1 && b.y + b.h > stepTop) {
        bad(`'headroom' ${b.id} is too low over stair step ${s.id}`);
      }
    }
  }

  // 9. routes sit on their block's face
  for (const r of parts.routes) {
    const b = blockById.get(r.block);
    if (!b) { bad(`'route' ${r.id} is on ${r.block}, which is not in this building`); continue; }
    const len = r.side === 'n' || r.side === 's' ? b.x1 - b.x0 : b.z1 - b.z0;
    if (r.at < 0 || r.at > len) bad(`'route' ${r.id} is off the ${r.side} face of ${b.id}`);
  }

  // 10. reachability: flood fill from each door on a grid, with route links both ways
  if (parts.doors.length > 0) {
    const ox = f.x0 - GROW, oz = f.z0 - GROW;
    const nx = Math.round((f.x1 - f.x0 + 2 * GROW) / GRID), nz = Math.round((f.z1 - f.z0 + 2 * GROW) / GRID);
    const keyOf = (n: GNode): string => `${n.ix},${n.iz},${n.y.toFixed(3)}`;
    const nodeAt = (ix: number, iz: number, y: number): GNode => ({ ix, iz, x: ox + ix * GRID, y, z: oz + iz * GRID });
    const fits = (x: number, y: number, z: number): boolean => collider.move({ x, y, z }, 0, 0, PLAYER_RADIUS, PLAYER_HEIGHT, STEP_UP, out) === null;

    /** Nearest grid node to (x, z) at height y that fits; tries the 8 around it if the nearest does not. */
    const snap = (x: number, z: number, y: number): GNode | null => {
      const ix0 = Math.round((x - ox) / GRID), iz0 = Math.round((z - oz) / GRID);
      for (const [di, dj] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const ix = ix0 + di, iz = iz0 + dj;
        if (ix < 0 || iz < 0 || ix > nx || iz > nz) continue;
        const n = nodeAt(ix, iz, y);
        if (fits(n.x, n.y, n.z)) return n;
      }
      return null;
    };

    const links = new Map<string, GNode[]>();
    const addLink = (a: GNode, b: GNode): void => {
      const la = links.get(keyOf(a)); if (la) la.push(b); else links.set(keyOf(a), [b]);
      const lb = links.get(keyOf(b)); if (lb) lb.push(a); else links.set(keyOf(b), [a]);
    };
    for (const r of parts.routes) {
      const b = blockById.get(r.block);
      if (!b) continue;
      const { fx, fz, nx: Nx, nz: Nz } = faceOf(b, r.side, r.at);
      const bx = fx + 0.7 * Nx, bz = fz + 0.7 * Nz;
      const baseNode = snap(bx, bz, collider.groundAt(bx, bz, b.y + 0.4));
      const topNode = snap(fx - 0.7 * Nx, fz - 0.7 * Nz, b.y + b.h);
      if (baseNode && topNode) addLink(baseNode, topNode);
    }

    const neighbours = (n: GNode): GNode[] => {
      const res: GNode[] = [];
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ix = n.ix + di, iz = n.iz + dj;
        if (ix < 0 || iz < 0 || ix > nx || iz > nz) continue;
        const x = ox + ix * GRID, z = oz + iz * GRID;
        const y = collider.groundAt(x, z, n.y + VAULT_MAX - STEP_UP);
        if (fits(x, y, z)) res.push(nodeAt(ix, iz, y));
      }
      return res.concat(links.get(keyOf(n)) ?? []);
    };
    const flood = (starts: GNode[]): Map<string, GNode> => {
      const seen = new Map<string, GNode>();
      const queue: GNode[] = [];
      for (const s of starts) {
        const k = keyOf(s);
        if (!seen.has(k)) { seen.set(k, s); queue.push(s); }
      }
      for (let qi = 0; qi < queue.length && seen.size < NODE_CAP; qi++) {
        for (const m of neighbours(queue[qi])) {
          const k = keyOf(m);
          if (!seen.has(k)) { seen.set(k, m); queue.push(m); }
        }
      }
      return seen;
    };

    const starts = parts.doors.map((d) => {
      const ix = Math.min(nx, Math.max(0, Math.round((d.outX - ox) / GRID)));
      const iz = Math.min(nz, Math.max(0, Math.round((d.outZ - oz) / GRID)));
      return nodeAt(ix, iz, collider.groundAt(ox + ix * GRID, oz + iz * GRID, d.y));
    });
    const visited = [...flood(starts).values()];
    const reachNodes = (c: { x: number; y: number; z: number }, from: GNode[]): GNode[] =>
      from.filter((n) => Math.hypot(n.x - c.x, n.z - c.z) <= CONTAINER_REACH_XZ && Math.abs(n.y - c.y) < CONTAINER_REACH_Y);

    for (const c of parts.containers) {
      const near0 = reachNodes(c, visited);
      if (near0.length === 0) { bad(`'unreachable' container ${c.id} cannot be reached`); continue; }
      const exits = [...flood(near0).values()];
      const out2 = parts.doors.some((d) => exits.some((n) => Math.hypot(n.x - d.outX, n.z - d.outZ) <= EXIT_REACH));
      if (!out2) bad(`'no way out' from container ${c.id}`);
    }
  }

  return problems;
}
