import type { GsrArenaShape, GsrBillboard, GsrBuilding, GsrSatelliteIsland } from './schema';

export const ROUND_BUILDING_ARCHES = new Set<NonNullable<GsrBuilding['arch']>>([
  'vinyl-tower',
  'cafe-terrace',
  'rotunda-dome',
  'drum-silo',
  'kiln-chimney',
]);

/**
 * Exact 2D polygon outline for each arenaShape, shared between the 3D ground/curb
 * generator and the skater perimeter collision so visuals and hitboxes always match.
 */
export function buildArenaOutline2D(
  shape: GsrArenaShape | undefined,
  halfW: number,
  halfD: number,
): [number, number][] {
  let pts: [number, number][];

  if (shape === 'octagonal-plaza') {
    const c = 0.28;
    const cx = halfW * (1 - c);
    const cz = halfD * (1 - c);
    pts = [
      [halfW, -cz],
      [halfW, cz],
      [cx, halfD],
      [-cx, halfD],
      [-halfW, cz],
      [-halfW, -cz],
      [-cx, -halfD],
      [cx, -halfD],
    ];
  } else if (shape === 's-curve-viaduct') {
    pts = [];
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const u = -1 + (2 * i) / steps;
      const z = u * halfD;
      const x = halfW * (0.68 + 0.28 * Math.sin(u * Math.PI));
      pts.push([x, z]);
    }
    for (let i = steps; i >= 0; i--) {
      const u = -1 + (2 * i) / steps;
      const z = u * halfD;
      const x = -halfW * (0.68 - 0.28 * Math.sin(u * Math.PI));
      pts.push([x, z]);
    }
  } else if (shape === 'crucible-ring') {
    const a = 0.45;
    const b = 0.76;
    pts = [
      [halfW, -a * halfD],
      [halfW, a * halfD],
      [b * halfW, a * halfD],
      [b * halfW, b * halfD],
      [a * halfW, b * halfD],
      [a * halfW, halfD],
      [-a * halfW, halfD],
      [-a * halfW, b * halfD],
      [-b * halfW, b * halfD],
      [-b * halfW, a * halfD],
      [-halfW, a * halfD],
      [-halfW, -a * halfD],
      [-b * halfW, -a * halfD],
      [-b * halfW, -b * halfD],
      [-a * halfW, -b * halfD],
      [-a * halfW, -halfD],
      [a * halfW, -halfD],
      [a * halfW, -b * halfD],
      [b * halfW, -b * halfD],
      [b * halfW, -a * halfD],
    ];
  } else if (shape === 'spiral-spire') {
    const count = 20;
    pts = [];
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const r = 0.92 + 0.08 * Math.cos(ang * 5);
      pts.push([Math.cos(ang) * halfW * r, -Math.sin(ang) * halfD * r]);
    }
  } else if (shape === 'canyon-alley') {
    pts = [
      [0.68 * halfW, -halfD],
      [0.68 * halfW, -0.52 * halfD],
      [0.52 * halfW, -0.38 * halfD],
      [0.52 * halfW, -0.18 * halfD],
      [0.92 * halfW, -0.1 * halfD],
      [0.92 * halfW, 0.1 * halfD],
      [0.52 * halfW, 0.18 * halfD],
      [0.52 * halfW, 0.38 * halfD],
      [0.68 * halfW, 0.52 * halfD],
      [0.68 * halfW, halfD],
      [-0.68 * halfW, halfD],
      [-0.68 * halfW, 0.52 * halfD],
      [-0.52 * halfW, 0.38 * halfD],
      [-0.52 * halfW, 0.18 * halfD],
      [-0.92 * halfW, 0.1 * halfD],
      [-0.92 * halfW, -0.1 * halfD],
      [-0.52 * halfW, -0.18 * halfD],
      [-0.52 * halfW, -0.38 * halfD],
      [-0.68 * halfW, -0.52 * halfD],
      [-0.68 * halfW, -halfD],
    ];
  } else if (shape === 'dome-atrium') {
    const count = 24;
    pts = [];
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      pts.push([Math.cos(ang) * halfW, -Math.sin(ang) * halfD]);
    }
  } else if (shape === 'hedged-diamond') {
    const tip = 0.22;
    pts = [
      [halfW, -tip * halfD],
      [halfW, tip * halfD],
      [tip * halfW, halfD],
      [-tip * halfW, halfD],
      [-halfW, tip * halfD],
      [-halfW, -tip * halfD],
      [-tip * halfW, -halfD],
      [tip * halfW, -halfD],
    ];
  } else if (shape === 'relay-cross') {
    const a = 0.46;
    pts = [
      [halfW, -a * halfD],
      [halfW, a * halfD],
      [a * halfW, a * halfD],
      [a * halfW, halfD],
      [-a * halfW, halfD],
      [-a * halfW, a * halfD],
      [-halfW, a * halfD],
      [-halfW, -a * halfD],
      [-a * halfW, -a * halfD],
      [-a * halfW, -halfD],
      [a * halfW, -halfD],
      [a * halfW, -a * halfD],
    ];
  } else if (shape === 'vinyl-disc') {
    const count = 28;
    pts = [];
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      pts.push([Math.cos(ang) * halfW, -Math.sin(ang) * halfD]);
    }
  } else {
    pts = [
      [halfW, -halfD],
      [halfW, halfD],
      [-halfW, halfD],
      [-halfW, -halfD],
    ];
  }

  // Ensure consistent winding (negative signed area in XZ so (0, p_i, p_{i+1}) faces +Y)
  let area2 = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!;
    const q = pts[(i + 1) % pts.length]!;
    area2 += p[0] * q[1] - q[0] * p[1];
  }
  if (area2 > 0) pts.reverse();
  return pts;
}

export function isPointInPolygon(x: number, z: number, poly: readonly [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i]![0];
    const zi = poly[i]![1];
    const xj = poly[j]![0];
    const zj = poly[j]![1];
    const intersect = (zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function clampPointToPolygon(
  x: number,
  z: number,
  poly: readonly [number, number][],
): { clamped: boolean; x: number; z: number; nx: number; nz: number } {
  if (isPointInPolygon(x, z, poly)) {
    return { clamped: false, x, z, nx: 0, nz: 0 };
  }
  let bestDistSq = Infinity;
  let bestX = x;
  let bestZ = z;
  let bestNx = 0;
  let bestNz = 0;

  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const abx = b[0] - a[0];
    const abz = b[1] - a[1];
    const lenSq = abx * abx + abz * abz;
    if (lenSq < 1e-8) continue;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * abx + (z - a[1]) * abz) / lenSq));
    const px = a[0] + abx * t;
    const pz = a[1] + abz * t;
    const dSq = (x - px) * (x - px) + (z - pz) * (z - pz);
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestX = px;
      bestZ = pz;
      const dx = px - x;
      const dz = pz - z;
      const d = Math.hypot(dx, dz);
      if (d > 1e-4) {
        bestNx = dx / d;
        bestNz = dz / d;
      } else {
        const len = Math.sqrt(lenSq);
        bestNx = abz / len;
        bestNz = -abx / len;
      }
    }
  }

  return { clamped: true, x: bestX, z: bestZ, nx: bestNx, nz: bestNz };
}

export interface BuildingHit {
  x: number;
  z: number;
  nx: number;
  nz: number;
  axisAligned: boolean;
}

export function buildingHorizontalCollision(
  b: GsrBuilding,
  x: number,
  z: number,
  y: number,
  r: number,
): BuildingHit | null {
  const top = b.yBase + b.h;
  const isSteppedUpper = b.arch === 'stepped-monolith' && y >= top - 0.1 && y < top + 1.6;
  const isCantileverLedge =
    b.arch === 'cantilever-tower' && y >= b.yBase + b.h * 0.45 && y < b.yBase + b.h * 0.65;

  if (!isSteppedUpper && (y < b.yBase - 0.8 || y >= top - 0.85)) {
    return null;
  }

  if (b.arch && ROUND_BUILDING_ARCHES.has(b.arch)) {
    const rad = Math.max(b.w, b.d) * 0.5 + r;
    const dx = x - b.x;
    const dz = z - b.z;
    const d = Math.hypot(dx, dz);
    if (d < rad) {
      const nx = d > 1e-4 ? dx / d : 1;
      const nz = d > 1e-4 ? dz / d : 0;
      return { x: b.x + nx * rad, z: b.z + nz * rad, nx, nz, axisAligned: false };
    }
    return null;
  }

  const cx = b.x;
  const cz = isCantileverLedge ? b.z + 1.1 : b.z;
  const halfW = (isSteppedUpper ? b.w * 0.68 : isCantileverLedge ? b.w + 1.6 : b.w) * 0.5 + r;
  const halfD = (isSteppedUpper ? b.d * 0.68 : isCantileverLedge ? b.d + 2.6 : b.d) * 0.5 + r;

  const dx = x - cx;
  const dz = z - cz;
  if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
    const penX = halfW - Math.abs(dx);
    const penZ = halfD - Math.abs(dz);
    if (penX < penZ) {
      const nx = Math.sign(dx || 1);
      return { x: cx + nx * halfW, z, nx, nz: 0, axisAligned: true };
    }
    const nz = Math.sign(dz || 1);
    return { x, z: cz + nz * halfD, nx: 0, nz, axisAligned: true };
  }
  return null;
}

export function billboardObbCollision(
  bb: GsrBillboard,
  x: number,
  z: number,
  y: number,
  r: number,
): { x: number; z: number; nx: number; nz: number } | null {
  if (y < bb.y - 0.5 || y > bb.y + bb.h + 0.35) return null;
  const dx = x - bb.x;
  const dz = z - bb.z;
  // Three.js rotation.y = bb.yaw maps local +X -> (cos, -sin) and local +Z -> (sin, cos)
  const c = Math.cos(bb.yaw);
  const s = Math.sin(bb.yaw);
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;

  const halfW = bb.w * 0.5 + r;
  const halfD = 0.42 + r;
  if (Math.abs(lx) >= halfW || Math.abs(lz) >= halfD) return null;

  const penX = halfW - Math.abs(lx);
  const penZ = halfD - Math.abs(lz);
  let outLx = lx;
  let outLz = lz;
  let lnx = 0;
  let lnz = 0;
  if (penX < penZ) {
    lnx = Math.sign(lx || 1);
    outLx = lnx * halfW;
  } else {
    lnz = Math.sign(lz || 1);
    outLz = lnz * halfD;
  }

  return {
    x: bb.x + outLx * c + outLz * s,
    z: bb.z - outLx * s + outLz * c,
    nx: lnx * c + lnz * s,
    nz: -lnx * s + lnz * c,
  };
}

export function getPropCollisionRadius(prefab: string, scale = 1): number {
  if (
    prefab === 'street-lamp' ||
    prefab === 'gsr-jazz-lamp' ||
    prefab === 'flower-pot' ||
    prefab === 'candelabra' ||
    prefab === 'gsr-hoa-flamingo-plinth'
  ) {
    return 0.38 * scale;
  }
  if (
    prefab === 'gsr-piano-fountain' ||
    prefab === 'gnome-statue' ||
    prefab === 'gsr-tea-pergola' ||
    prefab === 'gsr-glaze-vat' ||
    prefab === 'gsr-lotus-basin' ||
    prefab === 'gsr-hoa-gazebo-hedge'
  ) {
    return 1.1 * scale;
  }
  if (
    prefab === 'gsr-cafe-table' ||
    prefab === 'picnic-table' ||
    prefab === 'gsr-mist-bench' ||
    prefab === 'gsr-postcard-kiosk' ||
    prefab === 'gsr-dj-booth'
  ) {
    return 0.78 * scale;
  }
  return 0.58 * scale;
}

export function satelliteSurfaceAt(
  satellites: readonly GsrSatelliteIsland[] | undefined,
  x: number,
  z: number,
  feetY: number,
): number | null {
  if (!satellites || satellites.length === 0) return null;
  let best: number | null = null;
  for (const sat of satellites) {
    if (Math.hypot(x - sat.x, z - sat.z) <= sat.r + 0.35 && feetY >= sat.y - 0.85) {
      if (best === null || sat.y > best) best = sat.y;
    }
  }
  return best;
}
