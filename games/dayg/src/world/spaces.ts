// Spaces: who is inside which building, on which storey, and walking waypoints. Pure: no three.js, no DOM.
import type { BuildingParts, DoorInfo } from './buildingTypes';
import type { Vec3 } from './collide';

export interface Space { building: string | null; storey: number; doorway: string | null }
export interface BuildingIndex {
  readonly parts: readonly BuildingParts[];
  byId(id: string): BuildingParts | undefined;
  insideAt(x: number, y: number, z: number, inset?: number): BuildingParts | null;  // interior rect shrunk by inset (strict)
  footprintAt(x: number, y: number, z: number, pad?: number): BuildingParts | null; // footprint grown by pad (inclusive)
  storeyAt(b: BuildingParts, y: number): number;        // highest i with storeys[i] <= y + 0.5, else 0
  ceilingAt(b: BuildingParts, storey: number): number | null; // lowest y of the floor blocks of storey + 1; null on the top storey
  doorAt(x: number, z: number): DoorInfo | null;        // inside a door's rect grown by 0.5 across the wall
  spaceOf(x: number, y: number, z: number): Space;      // building = insideAt(x,y,z)?.def.id ?? null; doorway = doorAt id
  nextWaypoint(from: Vec3, to: Vec3): { x: number; z: number } | null;
}

/** Y test shared by insideAt and footprintAt: storeys[0] - 1 <= y < roofY; NaN y skips the test. */
function yInside(b: BuildingParts, y: number): boolean {
  if (Number.isNaN(y)) return true;
  return b.def.storeys[0] - 1 <= y && y < b.roofY;
}

function dist2(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}

function inRectXZ(x: number, z: number, r: { x0: number; x1: number; z0: number; z1: number }): boolean {
  return x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
}

export function createBuildingIndex(parts: readonly BuildingParts[]): BuildingIndex {
  const storeyAt = (b: BuildingParts, y: number): number => {
    const s = b.def.storeys;
    for (let i = s.length - 1; i >= 0; i--) if (s[i] <= y + 0.5) return i;
    return 0;
  };

  const insideAt = (x: number, y: number, z: number, inset = 0): BuildingParts | null => {
    for (const b of parts) {
      if (!yInside(b, y)) continue;
      const r = b.interior;
      if (x > r.x0 + inset && x < r.x1 - inset && z > r.z0 + inset && z < r.z1 - inset) return b;
    }
    return null;
  };

  const footprintAt = (x: number, y: number, z: number, pad = 0): BuildingParts | null => {
    for (const b of parts) {
      if (!yInside(b, y)) continue;
      const r = b.def.footprint;
      if (x >= r.x0 - pad && x <= r.x1 + pad && z >= r.z0 - pad && z <= r.z1 + pad) return b;
    }
    return null;
  };

  const ceilingAt = (b: BuildingParts, storey: number): number | null => {
    if (storey + 1 >= b.def.storeys.length) return null;
    let low: number | null = null;
    for (const blk of b.blocks) {
      if (b.role[blk.id] !== 'floor' || b.layer[blk.id] !== storey + 1) continue;
      if (low === null || blk.y < low) low = blk.y;
    }
    return low;
  };

  const doorAt = (x: number, z: number): DoorInfo | null => {
    for (const b of parts) {
      for (const d of b.doors) {
        const r = d.rect;
        // grow across the wall: n/s walls run along x, so their thickness is along z
        const pad = d.side === 'n' || d.side === 's' ? { x: 0, z: 0.5 } : { x: 0.5, z: 0 };
        if (x >= r.x0 - pad.x && x <= r.x1 + pad.x && z >= r.z0 - pad.z && z <= r.z1 + pad.z) return d;
      }
    }
    return null;
  };

  const spaceOf = (x: number, y: number, z: number): Space => {
    const b = insideAt(x, y, z);
    const doorway = doorAt(x, z)?.id ?? null;
    return { building: b?.def.id ?? null, storey: b ? storeyAt(b, y) : 0, doorway };
  };

  /** Stair rule: one step from storey fromSt toward toSt inside building b. */
  const stairStep = (b: BuildingParts, from: Vec3, fromSt: number, toSt: number): { x: number; z: number } | null => {
    if (fromSt === toSt) return null;
    const next = fromSt + Math.sign(toSt - fromSt);
    const lo = Math.min(fromSt, next);
    const hi = Math.max(fromSt, next);
    const s = b.stairs.find((st) => storeyAt(b, st.fromY) === lo && storeyAt(b, st.toY) === hi);
    if (!s) return null;
    const foot = { x: s.footX, z: s.footZ };
    const top = { x: s.topX, z: s.topZ };
    if (next > fromSt) {
      // going up: walk to the top when on the foot or inside the stair, else walk to the foot
      const near = inRectXZ(from.x, from.z, s.rect) || dist2(from.x, from.z, foot.x, foot.z) <= 1.0;
      return near ? top : foot;
    }
    // going down: the reverse
    const near = inRectXZ(from.x, from.z, s.rect) || dist2(from.x, from.z, top.x, top.z) <= 1.0;
    return near ? foot : top;
  };

  const nextWaypoint = (from: Vec3, to: Vec3): { x: number; z: number } | null => {
    const A = spaceOf(from.x, from.y, from.z);
    const B = spaceOf(to.x, to.y, to.z);

    // 1. standing in a doorway: go through it
    const here = doorAt(from.x, from.z);
    if (here) {
      return B.building === here.building
        ? { x: here.inX, z: here.inZ }
        : { x: here.outX, z: here.outZ };
    }

    // 2. same building (or both outside): stairs between storeys, else nothing to route
    if (A.building === B.building) {
      if (A.building === null) return null;
      const b = parts.find((p) => p.def.id === A.building);
      if (!b || A.storey === B.storey) return null;
      return stairStep(b, from, storeyAt(b, from.y), storeyAt(b, to.y));
    }

    // 3. inside building X (not the target's): leave by the door
    if (A.building !== null) {
      const X = parts.find((p) => p.def.id === A.building);
      if (!X || X.doors.length === 0) return null;
      let best: DoorInfo = X.doors[0];
      let bestCost = Infinity;
      for (const d of X.doors) {
        const cost = dist2(from.x, from.z, d.inX, d.inZ) + dist2(d.outX, d.outZ, to.x, to.z);
        if (cost < bestCost) { bestCost = cost; best = d; }
      }
      const doorSt = storeyAt(X, best.y);
      const aSt = storeyAt(X, from.y);
      if (aSt > doorSt) return stairStep(X, from, aSt, doorSt);
      return dist2(from.x, from.z, best.inX, best.inZ) > 1.0
        ? { x: best.inX, z: best.inZ }
        : { x: best.outX, z: best.outZ };
    }

    // 4. outside, target inside building Y: enter by its door
    if (B.building !== null) {
      const Y = parts.find((p) => p.def.id === B.building);
      if (!Y || Y.doors.length === 0) return null;
      let best: DoorInfo = Y.doors[0];
      let bestCost = Infinity;
      for (const d of Y.doors) {
        const cost = dist2(from.x, from.z, d.outX, d.outZ) + dist2(d.inX, d.inZ, to.x, to.z);
        if (cost < bestCost) { bestCost = cost; best = d; }
      }
      return dist2(from.x, from.z, best.outX, best.outZ) > 1.0
        ? { x: best.outX, z: best.outZ }
        : { x: best.inX, z: best.inZ };
    }
    return null;
  };

  return {
    parts,
    byId: (id) => parts.find((p) => p.def.id === id),
    insideAt,
    footprintAt,
    storeyAt,
    ceilingAt,
    doorAt,
    spaceOf,
    nextWaypoint,
  };
}
