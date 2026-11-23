import type { PlayerInfo } from '@lawn/mp/protocol';
import { LEVEL_ORDER, type GsrLevelId } from '../levels/loader';
import type { TrickAnimKind } from '../sim/skater';

export interface GsrPeer {
  id: number;
  name: string;
  color: number;
  character: string;
  userId?: string;
}

export function toGsrPeer(p: PlayerInfo): GsrPeer {
  return {
    id: p.id,
    name: p.name,
    color: p.color,
    character: p.character,
    ...(p.userId !== undefined ? { userId: p.userId } : {}),
  };
}

/**
 * Bitflags packed into pose p[7]:
 *   1 = grounded
 *   2 = grinding
 *   4 = boosting
 *   8 = wallRiding
 */
export type GsrNetMsg =
  | {
      k: 'pos';
      area: GsrLevelId;
      /** [x, y, z, yaw, vx, vy, vz, flags] */
      p: [number, number, number, number, number, number, number, number];
      t: number;
    }
  | {
      k: 'trick';
      area: GsrLevelId;
      kind: TrickAnimKind;
      name: string;
    }
  | {
      k: 'spray';
      area: GsrLevelId;
      x: number;
      y: number;
      z: number;
      tagId: string;
      bbId?: string;
    };

const VALID_AREAS = new Set<string>(LEVEL_ORDER);
const VALID_TRICKS = new Set<string>(['frontflip', 'spin360', 'grab', 'cork', 'grindHop', 'groundSpin']);

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isFiniteNum = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

export function isGsrArea(v: unknown): v is GsrLevelId {
  return typeof v === 'string' && VALID_AREAS.has(v);
}

export function parseGsrNetMsg(d: unknown): GsrNetMsg | null {
  if (!isObj(d) || !isGsrArea(d.area)) return null;

  if (d.k === 'pos') {
    const p = d.p;
    if (!Array.isArray(p) || p.length !== 8 || !p.every(isFiniteNum)) return null;
    if (!isFiniteNum(d.t)) return null;
    const [x, y, z, yaw, vx, vy, vz, flags] = p as [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    if (Math.abs(x) >= 400 || Math.abs(y) >= 200 || Math.abs(z) >= 400) return null;
    return { k: 'pos', area: d.area, p: [x, y, z, yaw, vx, vy, vz, flags], t: d.t };
  }

  if (d.k === 'trick') {
    if (typeof d.kind !== 'string' || !VALID_TRICKS.has(d.kind)) return null;
    if (typeof d.name !== 'string' || d.name.length === 0 || d.name.length > 48) return null;
    return { k: 'trick', area: d.area, kind: d.kind as TrickAnimKind, name: d.name };
  }

  if (d.k === 'spray') {
    if (!isFiniteNum(d.x) || !isFiniteNum(d.y) || !isFiniteNum(d.z)) return null;
    if (Math.abs(d.x) >= 400 || Math.abs(d.y) >= 200 || Math.abs(d.z) >= 400) return null;
    if (typeof d.tagId !== 'string' || d.tagId.length === 0 || d.tagId.length > 32) return null;
    if (d.bbId !== undefined && (typeof d.bbId !== 'string' || d.bbId.length > 48)) return null;
    return {
      k: 'spray',
      area: d.area,
      x: d.x,
      y: d.y,
      z: d.z,
      tagId: d.tagId,
      ...(d.bbId !== undefined ? { bbId: d.bbId } : {}),
    };
  }

  return null;
}
