import type { GsrLevelId } from '../levels/loader';
import type { GsrLevelDoc } from '../levels/schema';

export interface BossBattleState {
  areaId: GsrLevelId;
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
}

export function createBossBattle(areaId: GsrLevelId, doc: GsrLevelDoc): BossBattleState {
  const bossEv = doc.data.events.find((e) => e.kind === 'boss');
  const start: [number, number, number] = [bossEv?.x ?? 0, bossEv?.y ?? 0, bossEv?.z ?? 0];
  const waypoints = doc.data.bossWaypoints && doc.data.bossWaypoints.length > 0
    ? doc.data.bossWaypoints
    : [start, [-28, start[1], 18], [28, start[1], -18]];

  return {
    areaId,
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
    waveSpeed: areaId === 'bongo-basin' || areaId === 'chrome-kiln' ? 0.72 : 0.55,
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

export function stepBossBattle(
  b: BossBattleState,
  dt: number,
  bossUnlocked: boolean,
  levelCleared: boolean,
): void {
  if (!bossUnlocked || levelCleared) return;

  b.patrolPhase += dt;
  b.laserAngle += dt * (b.areaId === 'tupperware-mall' || b.areaId === 'zero-hz-zenith' ? 1.55 : 0.9);

  // Smoothly travel across the district's map-wide waypoints
  const lerpK = Math.min(1, dt * 2.4);
  b.x += (b.targetX - b.x) * lerpK;
  b.y += (b.targetY - b.y) * lerpK;
  b.z += (b.targetZ - b.z) * lerpK;

  // Per-boss unique roaming motion around the active waypoint
  if (b.areaId === 'neon-birdbath' || b.areaId === 'subsoil-relay') {
    b.x += Math.cos(b.patrolPhase * 1.4) * 5.0 * dt;
    b.z += Math.sin(b.patrolPhase * 1.4) * 5.0 * dt;
  } else if (b.areaId === 'mulch-alley') {
    // Periodic arcade glitch-hop
    if (Math.floor(b.patrolPhase * 0.35) !== Math.floor((b.patrolPhase - dt) * 0.35)) {
      advanceBossWaypoint(b);
    }
  } else if (b.areaId === 'zero-hz-zenith') {
    b.x += Math.sin(b.patrolPhase * 0.9) * 6.5 * dt;
    b.z += Math.cos(b.patrolPhase * 0.7) * 6.5 * dt;
  }
}
