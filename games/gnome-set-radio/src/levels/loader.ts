import { applyStamps } from '@lawn/level';
import velvetKeysRaw from '../data/levels/velvet-keys.level.json';
import bongoBasinRaw from '../data/levels/bongo-basin.level.json';
import chromeKilnRaw from '../data/levels/chrome-kiln.level.json';
import neonBirdbathRaw from '../data/levels/neon-birdbath.level.json';
import mulchAlleyRaw from '../data/levels/mulch-alley.level.json';
import tupperwareMallRaw from '../data/levels/tupperware-mall.level.json';
import hoaCitadelRaw from '../data/levels/hoa-citadel.level.json';
import subsoilRelayRaw from '../data/levels/subsoil-relay.level.json';
import zeroHzZenithRaw from '../data/levels/zero-hz-zenith.level.json';
import { getPerimeterAdSpecs } from '../view/ads';
import { ROUND_BUILDING_ARCHES, satelliteSurfaceAt } from './collision';
import type { GsrBuilding, GsrLevelDoc, GsrRail, GsrRamp } from './schema';

export type GsrLevelId =
  | 'velvet-keys'
  | 'bongo-basin'
  | 'chrome-kiln'
  | 'neon-birdbath'
  | 'mulch-alley'
  | 'tupperware-mall'
  | 'hoa-citadel'
  | 'subsoil-relay'
  | 'zero-hz-zenith';

export const LEVEL_ORDER: readonly GsrLevelId[] = [
  'velvet-keys',
  'bongo-basin',
  'chrome-kiln',
  'neon-birdbath',
  'mulch-alley',
  'tupperware-mall',
  'hoa-citadel',
  'subsoil-relay',
  'zero-hz-zenith',
];

export const LEVELS: Record<GsrLevelId, GsrLevelDoc> = {
  'velvet-keys': velvetKeysRaw as unknown as GsrLevelDoc,
  'bongo-basin': bongoBasinRaw as unknown as GsrLevelDoc,
  'chrome-kiln': chromeKilnRaw as unknown as GsrLevelDoc,
  'neon-birdbath': neonBirdbathRaw as unknown as GsrLevelDoc,
  'mulch-alley': mulchAlleyRaw as unknown as GsrLevelDoc,
  'tupperware-mall': tupperwareMallRaw as unknown as GsrLevelDoc,
  'hoa-citadel': hoaCitadelRaw as unknown as GsrLevelDoc,
  'subsoil-relay': subsoilRelayRaw as unknown as GsrLevelDoc,
  'zero-hz-zenith': zeroHzZenithRaw as unknown as GsrLevelDoc,
};

export function getLevelDoc(id: string | null | undefined): GsrLevelDoc {
  if (id && id in LEVELS) return LEVELS[id as GsrLevelId];
  return LEVELS['velvet-keys'];
}

export function groundHeightAt(doc: GsrLevelDoc, x: number, z: number): number {
  return applyStamps(0, doc.stamps, x, z);
}

/** Height on a sloped ramp if (x, z) is inside its footprint; else null. */
export function rampHeightAt(ramp: GsrRamp, x: number, z: number): number | null {
  const dx = x - ramp.x;
  const dz = z - ramp.z;
  const c = Math.cos(-ramp.yaw);
  const s = Math.sin(-ramp.yaw);
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  if (Math.abs(lx) > ramp.w * 0.5 + 0.15 || Math.abs(lz) > ramp.length * 0.5 + 0.15) return null;
  const t = Math.max(0, Math.min(1, (lz + ramp.length * 0.5) / ramp.length));
  return ramp.yBottom + (ramp.yTop - ramp.yBottom) * t;
}

/** Building roof height if (x, z) is inside footprint and skater's feet are near/above roof. */
export function buildingRoofAt(b: GsrBuilding, x: number, z: number, feetY: number): number | null {
  const top = b.yBase + b.h;
  if (b.arch === 'stepped-monolith') {
    const upperHalfW = b.w * 0.34 + 0.2;
    const upperHalfD = b.d * 0.34 + 0.2;
    const upperTop = top + 1.8;
    if (Math.abs(x - b.x) <= upperHalfW && Math.abs(z - b.z) <= upperHalfD && feetY >= upperTop - 0.85) {
      return upperTop;
    }
  } else if (b.arch === 'cantilever-tower') {
    const ledgeHalfW = (b.w + 1.6) * 0.5 + 0.2;
    const ledgeHalfD = (b.d + 2.6) * 0.5 + 0.2;
    const ledgeTop = b.yBase + b.h * 0.54;
    if (
      Math.abs(x - b.x) <= ledgeHalfW &&
      Math.abs(z - (b.z + 1.1)) <= ledgeHalfD &&
      feetY >= ledgeTop - 0.85 &&
      feetY < top - 0.85
    ) {
      return ledgeTop;
    }
  }

  if (b.arch && ROUND_BUILDING_ARCHES.has(b.arch)) {
    const rad = Math.max(b.w, b.d) * 0.5 + 0.25;
    if (Math.hypot(x - b.x, z - b.z) > rad) return null;
  } else {
    const halfW = b.w * 0.5 + 0.2;
    const halfD = b.d * 0.5 + 0.2;
    if (Math.abs(x - b.x) > halfW || Math.abs(z - b.z) > halfD) return null;
  }
  if (feetY >= top - 0.85) return top;
  return null;
}

/**
 * Returns the highest walkable/skateable surface beneath `feetY + 0.85`.
 */
export function sampleSurfaceHeight(doc: GsrLevelDoc, x: number, z: number, feetY: number): number {
  let best = groundHeightAt(doc, x, z);
  const satY = satelliteSurfaceAt(doc.data.satellites, x, z, feetY);
  if (satY !== null && satY > best) best = satY;
  for (const r of doc.data.ramps) {
    const rh = rampHeightAt(r, x, z);
    if (rh !== null && rh <= feetY + 1.1 && rh > best) best = rh;
  }
  for (const b of doc.data.buildings) {
    const bh = buildingRoofAt(b, x, z, feetY);
    if (bh !== null && bh > best) best = bh;
  }
  return best;
}

/** Nearest point on a 3D rail polyline, used for snapping onto ley-line grinds. */
export function nearestRailPoint(
  rails: readonly GsrRail[],
  x: number,
  y: number,
  z: number,
): { rail: GsrRail; segIdx: number; t: number; px: number; py: number; pz: number; dist: number; tx: number; ty: number; tz: number } | null {
  let best: {
    rail: GsrRail;
    segIdx: number;
    t: number;
    px: number;
    py: number;
    pz: number;
    dist: number;
    tx: number;
    ty: number;
    tz: number;
  } | null = null;

  for (const rail of rails) {
    for (let i = 0; i < rail.points.length - 1; i++) {
      const a = rail.points[i];
      const b = rail.points[i + 1];
      const abx = b[0] - a[0];
      const aby = b[1] - a[1];
      const abz = b[2] - a[2];
      const lenSq = abx * abx + aby * aby + abz * abz;
      if (lenSq < 1e-6) continue;
      const t = Math.max(0, Math.min(1, ((x - a[0]) * abx + (y - a[1]) * aby + (z - a[2]) * abz) / lenSq));
      const px = a[0] + abx * t;
      const py = a[1] + aby * t;
      const pz = a[2] + abz * t;
      const dist = Math.hypot(x - px, y - py, z - pz);
      if (!best || dist < best.dist) {
        const len = Math.sqrt(lenSq);
        best = { rail, segIdx: i, t, px, py, pz, dist, tx: abx / len, ty: aby / len, tz: abz / len };
      }
    }
  }
  return best;
}

const allRailsCache = new WeakMap<GsrLevelDoc, GsrRail[]>();

function makeTopEdgeRail(
  id: string,
  x: number,
  railY: number,
  z: number,
  yaw: number,
  width: number,
  color: string,
): GsrRail {
  const halfLen = width * 0.5 + 0.3;
  const dx = Math.cos(yaw) * halfLen;
  const dz = -Math.sin(yaw) * halfLen;
  return {
    id,
    points: [
      [x - dx, railY, z - dz],
      [x + dx, railY, z + dz],
    ],
    color,
    glowColor: color,
    speedBoost: 1.22,
  };
}

/** All grindable rails in the level: explicit ley-line rails plus billboard & perimeter-ad top rails. */
export function getAllRails(doc: GsrLevelDoc): GsrRail[] {
  const cached = allRailsCache.get(doc);
  if (cached) return cached;

  const billboardRails: GsrRail[] = [
    ...doc.data.billboards.map((bb) =>
      makeTopEdgeRail(`rail-bb-${bb.id}`, bb.x, bb.y + bb.h + 0.72, bb.z, bb.yaw, bb.w, bb.color),
    ),
    ...getPerimeterAdSpecs(doc).map((sp) =>
      makeTopEdgeRail(`rail-${sp.id}`, sp.x, sp.y + sp.h * 0.5 + 0.12, sp.z, sp.yaw, sp.w, '#00e5ff'),
    ),
  ];

  const all = [...doc.data.rails, ...billboardRails];
  allRailsCache.set(doc, all);
  return all;
}
