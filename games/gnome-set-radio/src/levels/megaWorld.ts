import { ARCHIPELAGO_NODES } from '../data/archipelago';
import { getLevelDoc, LEVEL_ORDER, sampleSurfaceHeight, type GsrLevelId } from './loader';
import type { GsrLevelDoc, GsrRail } from './schema';

export const MEGA_WORLD_OFFSETS: Record<GsrLevelId, [number, number, number]> = {
  'velvet-keys': [0, 0, 0],
  'bongo-basin': [-310, 20, -240],
  'chrome-kiln': [310, 40, -240],
  'neon-birdbath': [-310, 60, -540],
  'mulch-alley': [310, 80, -540],
  'tupperware-mall': [-310, 100, -840],
  'hoa-citadel': [310, 120, -840],
  'subsoil-relay': [0, 140, -1120],
  'zero-hz-zenith': [0, 175, -1420],
};

export function toWorldPos(areaId: GsrLevelId, lx: number, ly: number, lz: number): [number, number, number] {
  const [ox, oy, oz] = MEGA_WORLD_OFFSETS[areaId];
  return [lx + ox, ly + oy, lz + oz];
}

export function toLocalPos(areaId: GsrLevelId, wx: number, wy: number, wz: number): [number, number, number] {
  const [ox, oy, oz] = MEGA_WORLD_OFFSETS[areaId];
  return [wx - ox, wy - oy, wz - oz];
}

export interface MegaSkyRail {
  rail: GsrRail;
  fromId: GsrLevelId;
  toId: GsrLevelId;
}

function buildMegaSkyRails(): MegaSkyRail[] {
  const seenPairs = new Set<string>();
  const out: MegaSkyRail[] = [];

  for (const fromId of LEVEL_ORDER) {
    const node = ARCHIPELAGO_NODES[fromId];
    for (const link of node.links) {
      const toId = link.targetId;
      const pairKey = [fromId, toId].sort().join('<>');
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const rev = ARCHIPELAGO_NODES[toId].links.find((l) => l.targetId === fromId);
      const [fx, fy, fz] = toWorldPos(fromId, link.gatePos[0], link.gatePos[1] + 2.2, link.gatePos[2]);
      const [tx, ty, tz] = rev
        ? toWorldPos(toId, rev.gatePos[0], rev.gatePos[1] + 2.2, rev.gatePos[2])
        : toWorldPos(toId, 0, 2.5, 42);

      const mx = (fx + tx) * 0.5;
      const my = Math.max(fy, ty) + 16;
      const mz = (fz + tz) * 0.5;

      out.push({
        fromId,
        toId,
        rail: {
          id: `mega-sky-${fromId}-to-${toId}`,
          points: [
            [fx, fy, fz],
            [fx + (mx - fx) * 0.45, my - 4, fz + (mz - fz) * 0.45],
            [mx, my, mz],
            [tx + (mx - tx) * 0.45, my - 4, tz + (mz - tz) * 0.45],
            [tx, ty, tz],
          ],
          color: link.color,
          glowColor: '#ffffff',
          speedBoost: 1.85,
          aetherRail: true,
        },
      });
    }
  }
  return out;
}

export const MEGA_SKY_RAILS: readonly MegaSkyRail[] = buildMegaSkyRails();

const localDocCache = new Map<GsrLevelId, GsrLevelDoc>();

/**
 * Returns a GsrLevelDoc for `areaId` with connected Mega World sky rails
 * projected into `areaId`'s local coordinates so `stepSkater` can grind
 * seamlessly between islands.
 */
export function getMegaLocalDoc(areaId: GsrLevelId): GsrLevelDoc {
  const cached = localDocCache.get(areaId);
  if (cached) return cached;

  const base = getLevelDoc(areaId);
  const [ox, oy, oz] = MEGA_WORLD_OFFSETS[areaId];
  const skyRailsLocal: GsrRail[] = MEGA_SKY_RAILS.filter(
    (sr) => sr.fromId === areaId || sr.toId === areaId,
  ).map((sr) => ({
    ...sr.rail,
    points: sr.rail.points.map(([wx, wy, wz]) => [wx - ox, wy - oy, wz - oz] as [number, number, number]),
  }));

  const doc: GsrLevelDoc = {
    ...base,
    data: {
      ...base.data,
      rails: [...base.data.rails, ...skyRailsLocal],
    },
  };
  localDocCache.set(areaId, doc);
  return doc;
}

export function activeAreaAt(
  wx: number,
  wy: number,
  wz: number,
  currentAreaId: GsrLevelId,
): GsrLevelId {
  let bestId = currentAreaId;
  const [cx, cy, cz] = MEGA_WORLD_OFFSETS[currentAreaId];
  const curDist = Math.hypot(wx - cx, (wy - cy) * 0.6, wz - cz);

  for (const id of LEVEL_ORDER) {
    if (id === currentAreaId) continue;
    const [ox, oy, oz] = MEGA_WORLD_OFFSETS[id];
    const d = Math.hypot(wx - ox, (wy - oy) * 0.6, wz - oz);
    if (d + 18 < curDist) {
      bestId = id;
    }
  }
  return bestId;
}

export function sampleMegaGroundY(areaId: GsrLevelId, wx: number, wz: number): number {
  const [ox, oy, oz] = MEGA_WORLD_OFFSETS[areaId];
  const doc = getLevelDoc(areaId);
  return oy + sampleSurfaceHeight(doc, wx - ox, wz - oz, 200);
}

export function checkVoidRescue(
  wx: number,
  wy: number,
  wz: number,
  areaId: GsrLevelId,
  grinding: boolean,
): { rescued: boolean; x: number; y: number; z: number } {
  if (grinding) return { rescued: false, x: wx, y: wy, z: wz };
  const [ox, oy, oz] = MEGA_WORLD_OFFSETS[areaId];
  if (wy < oy - 24) {
    const doc = getLevelDoc(areaId);
    const spawn = doc.markers.find((m) => m.kind === 'spawn');
    const sx = ox + (spawn?.x ?? 0);
    const sz = oz + (spawn?.z ?? 36);
    const sy = oy + sampleSurfaceHeight(doc, spawn?.x ?? 0, spawn?.z ?? 36, 4) + 1.5;
    return { rescued: true, x: sx, y: sy, z: sz };
  }
  return { rescued: false, x: wx, y: wy, z: wz };
}
