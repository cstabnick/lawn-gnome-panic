// expandBuilding: turns a BuildingDef into blockout parts (roadmap 10, issue 1.1). Pure data: no three.js.
// Every block is a solid box. Boxes that touch overlap by 0.1 instead of sharing a face (docs/rendering.md).
import { BUILDING_PREFIX, DOOR, STAIR_RISE } from '../config';
import type { ContainerDef, Rect } from '../sim/types';
import type { BuildingDef, BuildingParts, BuildingRole, DoorInfo, OpeningDef, StairInfo } from './buildingTypes';
import type { BlockDef, ClimbRouteDef, PitDef, Side, SpotDef } from './types';

type Axis = 'x' | 'z';
interface Box { x0: number; x1: number; z0: number; z1: number; y: number; h: number }
/** An opening on a wall, in absolute coordinates along the wall: g0..g1, from sill up to top (sill + height). */
interface Gap { id: string; g0: number; g1: number; sill: number; top: number }

const OPPOSITE: Record<Side, Side> = { n: 's', s: 'n', w: 'e', e: 'w' };

/** A box long along `axis` from a0 to a1, short side from c0 to c1, from y0 to y1. */
function strip(axis: Axis, a0: number, a1: number, c0: number, c1: number, y0: number, y1: number): Box {
  return axis === 'x'
    ? { x0: a0, x1: a1, z0: c0, z1: c1, y: y0, h: y1 - y0 }
    : { x0: c0, x1: c1, z0: a0, z1: a1, y: y0, h: y1 - y0 };
}

/** Openings on one wall, positioned from `base` (the wall's start), sorted along the wall. */
function gapsOf(openings: OpeningDef[], base: number): Gap[] {
  return openings
    .map((o) => ({ id: o.id, g0: base + o.at, g1: base + o.at + o.width, sill: o.sill ?? 0, top: (o.sill ?? 0) + o.height }))
    .sort((a, b) => a.g0 - b.g0);
}

function clip(h: Rect, r: Rect): Rect {
  return { x0: Math.max(h.x0, r.x0), x1: Math.min(h.x1, r.x1), z0: Math.max(h.z0, r.z0), z1: Math.min(h.z1, r.z1) };
}

function sortedUnique(v: number[]): number[] {
  return [...new Set(v)].sort((a, b) => a - b);
}

/** The step-0 result: an empty building, as drafts expand to. */
function emptyParts(def: BuildingDef): BuildingParts {
  const t = def.shell.thick;
  const f = def.footprint;
  return {
    def,
    blocks: [],
    role: {},
    layer: {},
    routes: [],
    pits: [],
    containers: [],
    spots: [],
    props: [],
    interior: { x0: f.x0 + t, x1: f.x1 - t, z0: f.z0 + t, z1: f.z1 - t },
    roofY: def.shell.height - 0.2,
    doors: [],
    stairs: [],
    cut: def.storeys.map(() => []),
  };
}

/** The point just outside the footprint on side `side`, 1 gm from the wall's face centre. */
function beyond(r: Rect, side: Side): [number, number] {
  const cx = (r.x0 + r.x1) / 2;
  const cz = (r.z0 + r.z1) / 2;
  if (side === 'n') return [cx, r.z0 - 1];
  if (side === 's') return [cx, r.z1 + 1];
  if (side === 'w') return [r.x0 - 1, cz];
  return [r.x1 + 1, cz];
}

export function expandBuilding(def: BuildingDef): BuildingParts {
  if (def.draft) return emptyParts(def);

  const p = `${BUILDING_PREFIX}${def.id}-`;
  const f = def.footprint;
  const t = def.shell.thick;
  const H = def.shell.height;
  const A = DOOR.approach;

  const blocks: BlockDef[] = [];
  const role: Record<string, BuildingRole> = {};
  const layer: Record<string, number> = {};

  /** Highest storey whose floor top is at or below y + 0.5 (0 if none). */
  const storeyAt = (y: number): number => {
    let L = 0;
    def.storeys.forEach((s, i) => { if (s <= y + 0.5) L = i; });
    return L;
  };
  const add = (id: string, r: BuildingRole, b: Box, L = storeyAt(b.y)): void => {
    blocks.push({ id, kind: r === 'roof' ? 'roof' : 'wall', x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1, y: b.y, h: b.h });
    role[id] = r;
    layer[id] = L;
  };

  /**
   * One wall: full-height pieces between the gaps (ids `${idBase}-${i}`), a lintel above each gap
   * (`${idBase}-l-${id}`) and a sill below it (`${idBase}-s-${id}`). Lintels and sills are inset 0.1 on both faces.
   */
  const wallRun = (idBase: string, axis: Axis, a0: number, a1: number, c0: number, c1: number,
    y0: number, top: number, gaps: Gap[], r: BuildingRole): void => {
    const pieces: [number, number][] = [];
    let cursor = a0;
    for (const g of gaps) { pieces.push([cursor, g.g0]); cursor = g.g1; }
    pieces.push([cursor, a1]);
    pieces.filter(([s, e]) => e - s >= 0.05)
      .forEach(([s, e], i) => add(`${idBase}-${i}`, r, strip(axis, s, e, c0, c1, y0, top)));
    for (const g of gaps) {
      const lo = g.g0 - 0.1;
      const hi = g.g1 + 0.1;
      const ic0 = c0 + 0.1;
      const ic1 = c1 - 0.1;
      if (g.top < top - 0.05) add(`${idBase}-l-${g.id}`, 'lintel', strip(axis, lo, hi, ic0, ic1, g.top, top + 0.1));
      if (g.sill > 0.05) add(`${idBase}-s-${g.id}`, 'lintel', strip(axis, lo, hi, ic0, ic1, y0, y0 + g.sill));
    }
  };

  // 1. Shell. n and s are "through" walls: 0.1 longer each end and 0.1 taller.
  const shell: Record<Side, { axis: Axis; a0: number; a1: number; c0: number; c1: number; top: number; base: number }> = {
    n: { axis: 'x', a0: f.x0 - 0.1, a1: f.x1 + 0.1, c0: f.z0, c1: f.z0 + t, top: H + 0.1, base: f.x0 },
    s: { axis: 'x', a0: f.x0 - 0.1, a1: f.x1 + 0.1, c0: f.z1 - t, c1: f.z1, top: H + 0.1, base: f.x0 },
    w: { axis: 'z', a0: f.z0 + t - 0.1, a1: f.z1 - t + 0.1, c0: f.x0, c1: f.x0 + t, top: H, base: f.z0 },
    e: { axis: 'z', a0: f.z0 + t - 0.1, a1: f.z1 - t + 0.1, c0: f.x1 - t, c1: f.x1, top: H, base: f.z0 },
  };
  for (const side of ['n', 's', 'w', 'e'] as Side[]) {
    const s = shell[side];
    const gaps = gapsOf(def.shell.openings.filter((o) => o.side === side), s.base);
    wallRun(`${p}wall-${side}`, s.axis, s.a0, s.a1, s.c0, s.c1, 0, s.top, gaps, 'wall');
  }

  // 2. Inner walls: base y = wall.y, long along x when x1 - x0 >= z1 - z0.
  for (const w of def.walls) {
    const alongX = w.x1 - w.x0 >= w.z1 - w.z0;
    const a0 = alongX ? w.x0 : w.z0;
    const a1 = alongX ? w.x1 : w.z1;
    const c0 = alongX ? w.z0 : w.x0;
    const c1 = alongX ? w.z1 : w.x1;
    wallRun(`${p}${w.id}`, alongX ? 'x' : 'z', a0, a1, c0, c1, w.y, w.y + w.h, gapsOf(w.openings, a0), 'inner');
  }

  // 3. Floors: the rect minus its holes, cut into a grid and merged into runs along x.
  const floorCount: Record<number, number> = {};
  for (const fl of def.floors) {
    const thick = fl.thick ?? 0.4;
    const y = def.storeys[fl.storey] - thick;
    const r = fl.rect;
    const holes = (fl.holes ?? []).map((h) => clip(h, r)).filter((h) => h.x1 > h.x0 && h.z1 > h.z0);
    const xs = sortedUnique([r.x0, r.x1, ...holes.flatMap((h) => [h.x0, h.x1])]);
    const zs = sortedUnique([r.z0, r.z1, ...holes.flatMap((h) => [h.z0, h.z1])]);
    for (let j = 0; j + 1 < zs.length; j++) {
      const cz = (zs[j] + zs[j + 1]) / 2;
      const runs: [number, number][] = [];
      let start = -1;
      for (let i = 0; i + 1 < xs.length; i++) {
        const cx = (xs[i] + xs[i + 1]) / 2;
        const kept = !holes.some((h) => cx > h.x0 && cx < h.x1 && cz > h.z0 && cz < h.z1);
        if (kept && start < 0) start = i;
        if (!kept && start >= 0) { runs.push([xs[start], xs[i]]); start = -1; }
      }
      if (start >= 0) runs.push([xs[start], xs[xs.length - 1]]);
      for (const [x0, x1] of runs) {
        const k = floorCount[fl.storey] ?? 0;
        floorCount[fl.storey] = k + 1;
        add(`${p}floor${fl.storey}-${k}`, 'floor', { x0, x1, z0: zs[j], z1: zs[j + 1], y, h: thick }, fl.storey);
      }
    }
  }

  // 4. Stairs: solid steps; step 0 is the low one, at the end the stair climbs from.
  const stairs: StairInfo[] = [];
  for (const st of def.stairs) {
    const r = st.rect;
    const rise = st.toY - 0.1 - st.fromY;
    const n = Math.ceil(rise / STAIR_RISE);
    const alongZ = st.up === 'n' || st.up === 's';
    const seg = (alongZ ? r.z1 - r.z0 : r.x1 - r.x0) / n;
    for (let k = 0; k < n; k++) {
      const h = rise * (k + 1) / n;
      let b: Box;
      if (st.up === 'n') b = { x0: r.x0, x1: r.x1, z0: r.z1 - (k + 1) * seg, z1: r.z1 - k * seg, y: st.fromY, h };
      else if (st.up === 's') b = { x0: r.x0, x1: r.x1, z0: r.z0 + k * seg, z1: r.z0 + (k + 1) * seg, y: st.fromY, h };
      else if (st.up === 'w') b = { x0: r.x1 - (k + 1) * seg, x1: r.x1 - k * seg, z0: r.z0, z1: r.z1, y: st.fromY, h };
      else b = { x0: r.x0 + k * seg, x1: r.x0 + (k + 1) * seg, z0: r.z0, z1: r.z1, y: st.fromY, h };
      add(`${p}${st.id}-${k}`, 'stair', b);
    }
    const opposite = OPPOSITE[st.up];
    const [topX, topZ] = beyond(r, st.up);
    const [footX, footZ] = beyond(r, opposite);
    stairs.push({ id: st.id, rect: r, fromY: st.fromY, toY: st.toY, footX, footZ, topX, topZ });
  }

  // 5. Boxes: one block each.
  for (const bx of def.boxes) {
    add(`${p}${bx.id}`, bx.role, { x0: bx.x0, x1: bx.x1, z0: bx.z0, z1: bx.z1, y: bx.y, h: bx.h });
  }

  // 6. Roof, and the ridge along the long side (middle 40% of the short side).
  const roofY = H - 0.2;
  const eaves = def.roof.eaves;
  const cx = (f.x0 + f.x1) / 2;
  const cz = (f.z0 + f.z1) / 2;
  const roofLayer = def.storeys.length;
  add(`${p}roof`, 'roof', { x0: f.x0 - eaves, x1: f.x1 + eaves, z0: f.z0 - eaves, z1: f.z1 + eaves, y: roofY, h: def.roof.thick }, roofLayer);
  if (def.roof.ridge !== undefined) {
    const fw = f.x1 - f.x0;
    const fd = f.z1 - f.z0;
    const ridge = fw >= fd
      ? { x0: f.x0, x1: f.x1, z0: cz - 0.2 * fd, z1: cz + 0.2 * fd }
      : { x0: cx - 0.2 * fw, x1: cx + 0.2 * fw, z0: f.z0, z1: f.z1 };
    add(`${p}ridge`, 'roof', { ...ridge, y: roofY + def.roof.thick - 0.1, h: def.roof.ridge }, roofLayer);
  }

  const interior: Rect = { x0: f.x0 + t, x1: f.x1 - t, z0: f.z0 + t, z1: f.z1 - t };

  // 7. Sunk ground floor: a pit inside the interior.
  const pits: PitDef[] = def.sunk
    ? [{ id: `${p}pit`, rect: { x0: interior.x0 + 0.2, x1: interior.x1 - 0.2, z0: interior.z0 + 0.2, z1: interior.z1 - 0.2 }, depth: def.sunk }]
    : [];

  // 8. Routes, containers, spots, props.
  const routes: ClimbRouteDef[] = def.routes.map((rt, i) => ({
    id: `r-${def.id}-${i}`, block: `${p}${rt.block}`, side: rt.side, kind: rt.kind, at: rt.at,
  }));
  const containers: ContainerDef[] = def.containers.map((c) => ({ ...c, id: `c-${def.id}-${c.id}`, region: def.region }));
  const spots: SpotDef[] = def.spots.map((s) => ({
    id: s.kind === 'hatless' ? `h-${def.id}-${s.id}` : s.kind === 'npc' ? `n-${def.id}-${s.id}` : `${s.kind}-${def.id}-${s.id}`,
    kind: s.kind, region: def.region, x: s.x, y: s.y, z: s.z,
  }));
  const props = def.props.map((pr) => ({ ...pr }));

  // 9. Doors: shell openings marked door.
  const doors: DoorInfo[] = [];
  for (const o of def.shell.openings) {
    if (!o.door) continue;
    const side = o.side;
    const s = shell[side];
    const g0 = s.base + o.at;
    const g1 = g0 + o.width;
    const mid = (g0 + g1) / 2;
    const alongX = side === 'n' || side === 's';
    const wallC = side === 'n' ? f.z0 + t / 2 : side === 's' ? f.z1 - t / 2 : side === 'w' ? f.x0 + t / 2 : f.x1 - t / 2;
    const faceIn = side === 'n' ? f.z0 + t + A : side === 's' ? f.z1 - t - A : side === 'w' ? f.x0 + t + A : f.x1 - t - A;
    const faceOut = side === 'n' ? f.z0 - A : side === 's' ? f.z1 + A : side === 'w' ? f.x0 - A : f.x1 + A;
    doors.push({
      id: o.id, building: def.id, side,
      x: alongX ? mid : wallC, z: alongX ? wallC : mid,
      y: o.sill ?? 0, width: o.width, height: o.height,
      rect: alongX
        ? { x0: g0, x1: g1, z0: wallC - t / 2, z1: wallC + t / 2 }
        : { x0: wallC - t / 2, x1: wallC + t / 2, z0: g0, z1: g1 },
      inX: alongX ? mid : faceIn, inZ: alongX ? faceIn : mid,
      outX: alongX ? mid : faceOut, outZ: alongX ? faceOut : mid,
    });
  }

  // 10. Hidden blocks per storey: floors above the storey and the roof.
  const ids = blocks.map((b) => b.id);
  const cut = def.storeys.map((_, s) => ids.filter((id) => (role[id] === 'floor' || role[id] === 'roof') && layer[id] > s));

  return { def, blocks, role, layer, routes, pits, containers, spots, props, interior, roofY, doors, stairs, cut };
}
