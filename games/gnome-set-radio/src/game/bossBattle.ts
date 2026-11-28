import type { GsrLevelId } from '../levels/loader';
import type { GsrLevelDoc } from '../levels/schema';

export type BossHazardKind =
  | 'chord-rings'
  | 'double-pulse'
  | 'sweeping-laser'
  | 'orbit-chase'
  | 'glitch-blink'
  | 'twin-lasers'
  | 'bylaw-wall'
  | 'sub-shockwave'
  | 'zenith-barrage';

export interface BossBattleState {
  areaId: GsrLevelId;
  hazardKind: BossHazardKind;
  waypoints: [number, number, number][];
  waypointIdx: number;
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  patrolPhase: number;
  laserAngle: number;
  hitRadius: number;
  waveSpeed: number;
  blinkedJustNow: boolean;
}

const HAZARD_BY_AREA: Record<GsrLevelId, BossHazardKind> = {
  'velvet-keys': 'chord-rings',
  'bongo-basin': 'double-pulse',
  'chrome-kiln': 'sweeping-laser',
  'neon-birdbath': 'orbit-chase',
  'mulch-alley': 'glitch-blink',
  'tupperware-mall': 'twin-lasers',
  'hoa-citadel': 'bylaw-wall',
  'subsoil-relay': 'sub-shockwave',
  'zero-hz-zenith': 'zenith-barrage',
};

export function createBossBattle(areaId: GsrLevelId, doc: GsrLevelDoc): BossBattleState {
  const bossEv = doc.data.events.find((e) => e.kind === 'boss');
  const start: [number, number, number] = [bossEv?.x ?? 0, bossEv?.y ?? 0, bossEv?.z ?? 0];
  const waypoints = doc.data.bossWaypoints && doc.data.bossWaypoints.length > 0
    ? doc.data.bossWaypoints
    : [start, [-28, start[1], 18], [28, start[1], -18]];

  return {
    areaId,
    hazardKind: HAZARD_BY_AREA[areaId] ?? 'chord-rings',
    waypoints: waypoints as [number, number, number][],
    waypointIdx: 0,
    x: start[0],
    y: start[1],
    z: start[2],
    targetX: start[0],
    targetY: start[1],
    targetZ: start[2],
    patrolPhase: 0,
    laserAngle: 0,
    hitRadius: 6.2,
    waveSpeed:
      areaId === 'bongo-basin' || areaId === 'chrome-kiln'
        ? 0.78
        : areaId === 'zero-hz-zenith'
          ? 0.85
          : 0.58,
    blinkedJustNow: false,
  };
}

export function advanceBossWaypoint(b: BossBattleState): void {
  if (b.waypoints.length === 0) return;
  b.waypointIdx = (b.waypointIdx + 1) % b.waypoints.length;
  const wp = b.waypoints[b.waypointIdx]!;
  b.targetX = wp[0];
  b.targetY = wp[1];
  b.targetZ = wp[2];
}

export function bossHasLaser(b: BossBattleState): boolean {
  return (
    b.hazardKind === 'sweeping-laser' ||
    b.hazardKind === 'twin-lasers' ||
    b.hazardKind === 'bylaw-wall' ||
    b.hazardKind === 'zenith-barrage'
  );
}

export function bossLaserBeamCount(b: BossBattleState): number {
  return b.hazardKind === 'twin-lasers' || b.hazardKind === 'zenith-barrage' ? 2 : bossHasLaser(b) ? 1 : 0;
}

/** Returns true if local player coords (lx, ly, lz) intersect an active sweeping boss laser beam. */
export function checkBossLaserHit(b: BossBattleState, lx: number, ly: number, lz: number): boolean {
  const count = bossLaserBeamCount(b);
  if (count === 0) return false;
  if (Math.abs(ly - b.y) > 3.2) return false;
  const dx = lx - b.x;
  const dz = lz - b.z;
  const range = b.hazardKind === 'zenith-barrage' ? 30 : 25;
  for (let i = 0; i < count; i++) {
    const ang = b.laserAngle + i * Math.PI;
    const ux = Math.sin(ang);
    const uz = Math.cos(ang);
    const along = dx * ux + dz * uz;
    if (along > 1.5 && along < range) {
      const perp = Math.abs(dx * uz - dz * ux);
      if (perp < 1.35) return true;
    }
  }
  return false;
}

export function stepBossBattle(
  b: BossBattleState,
  dt: number,
  bossUnlocked: boolean,
  levelCleared: boolean,
): void {
  b.blinkedJustNow = false;
  if (!bossUnlocked || levelCleared) return;

  b.patrolPhase += dt;
  const laserRate =
    b.hazardKind === 'zenith-barrage'
      ? 1.75
      : b.hazardKind === 'twin-lasers'
        ? 1.45
        : b.hazardKind === 'sweeping-laser'
          ? 1.15
          : 0.85;
  b.laserAngle += dt * laserRate;

  // Smoothly travel across the district's map-wide waypoints
  const lerpK = Math.min(1, dt * 2.4);
  b.x += (b.targetX - b.x) * lerpK;
  b.y += (b.targetY - b.y) * lerpK;
  b.z += (b.targetZ - b.z) * lerpK;

  // Per-boss unique roaming motion around the active waypoint across all 9 districts
  switch (b.hazardKind) {
    case 'chord-rings':
      b.x += Math.cos(b.patrolPhase * 0.9) * 4.5 * dt;
      b.z += Math.sin(b.patrolPhase * 1.8) * 3.8 * dt;
      break;
    case 'double-pulse':
      b.x += Math.sin(b.patrolPhase * 1.5) * 6.0 * dt;
      b.z += Math.cos(b.patrolPhase * 0.75) * 3.5 * dt;
      break;
    case 'sweeping-laser':
      b.x += Math.cos(b.patrolPhase * 0.8) * 3.6 * dt;
      b.y += Math.sin(b.patrolPhase * 2.1) * 0.8 * dt;
      break;
    case 'orbit-chase':
      b.x += Math.cos(b.patrolPhase * 1.5) * 5.8 * dt;
      b.z += Math.sin(b.patrolPhase * 1.5) * 5.8 * dt;
      break;
    case 'glitch-blink':
      if (Math.floor(b.patrolPhase * 0.34) !== Math.floor((b.patrolPhase - dt) * 0.34)) {
        advanceBossWaypoint(b);
        b.blinkedJustNow = true;
      }
      break;
    case 'twin-lasers':
      b.x += Math.sin(b.patrolPhase * 1.1) * 5.2 * dt;
      b.z += Math.sin(b.patrolPhase * 2.2) * 4.2 * dt;
      break;
    case 'bylaw-wall':
      b.x += Math.cos(b.patrolPhase * 0.7) * 5.0 * dt;
      b.z += Math.sin(b.patrolPhase * 0.7) * 5.0 * dt;
      break;
    case 'sub-shockwave':
      b.x += Math.cos(b.patrolPhase * 1.35) * 5.2 * dt;
      b.z += Math.sin(b.patrolPhase * 1.35) * 5.2 * dt;
      break;
    case 'zenith-barrage':
      b.x += Math.sin(b.patrolPhase * 1.0) * 7.2 * dt;
      b.z += Math.cos(b.patrolPhase * 0.75) * 7.2 * dt;
      break;
  }
}
