import type { DirectorPhase, SimState } from './types';

const PEAK_MAX_SECONDS = 6.5;
const RELIEF_SECONDS = 7.0;
const CALM_MIN_SECONDS = 5.0;
const BUILD_MAX_SECONDS = 10.0;

function moveToward(cur: number, target: number, rate: number, dt: number): number {
  const diff = target - cur;
  const step = rate * dt;
  if (Math.abs(diff) <= step) return target;
  return cur + Math.sign(diff) * step;
}

export function updateDirector(state: SimState, dt: number): void {
  const { director, player, monsters, rooms } = state;

  // Compute nearest monster distance and whether any monster is actively chasing
  let minDist = Infinity;
  let anyChasing = false;
  let anyInvestigating = false;
  for (const m of monsters) {
    const d = Math.hypot(m.x - player.x, m.z - player.z);
    if (d < minDist) minDist = d;
    if (m.state === 'chase') anyChasing = true;
    if (m.state === 'investigate') anyInvestigating = true;
  }

  // Raw environmental tension (0..1)
  const proximityFactor = Math.max(0, Math.min(1, 1 - (minDist - 3.0) / 14.0));
  let targetTension = proximityFactor * 0.55;
  if (anyInvestigating) targetTension += 0.22;
  if (anyChasing) targetTension += 0.45;
  if (player.hiding && !anyChasing) targetTension *= 0.65;
  targetTension = Math.max(0.05, Math.min(1, targetTension));

  director.phaseTimer += dt;
  if (director.reliefCooldown > 0) director.reliefCooldown = Math.max(0, director.reliefCooldown - dt);

  const prevPhase: DirectorPhase = director.phase;

  switch (director.phase) {
    case 'calm': {
      director.tension = moveToward(director.tension, Math.min(targetTension, 0.35), 0.25, dt);
      director.dreamDrag = moveToward(director.dreamDrag, 0, 1.2, dt);

      if (anyChasing) {
        director.phase = 'peak';
        director.phaseTimer = 0;
        director.peakCount++;
      } else if (director.phaseTimer >= CALM_MIN_SECONDS && (minDist < 13 || director.phaseTimer >= 11)) {
        director.phase = 'build';
        director.phaseTimer = 0;
      }
      break;
    }

    case 'build': {
      // Artificially build tension toward a peak and nudge a patrolling monster closer
      const buildRamp = Math.min(1, director.phaseTimer / BUILD_MAX_SECONDS);
      const desired = Math.max(targetTension, 0.35 + buildRamp * 0.45);
      director.tension = moveToward(director.tension, desired, 0.32, dt);
      director.dreamDrag = moveToward(director.dreamDrag, buildRamp * 0.16, 0.4, dt);

      // Nudge nearest patrolling monster toward an adjacent room to create a near-miss
      if (director.phaseTimer > 1.5 && !anyChasing) {
        let nearest = monsters[0];
        let bestD = Infinity;
        for (const m of monsters) {
          const d = Math.hypot(m.x - player.x, m.z - player.z);
          if (d < bestD) {
            bestD = d;
            nearest = m;
          }
        }
        if (nearest && nearest.state === 'patrol' && bestD > 7.5) {
          const adjRoom = rooms[Math.min(rooms.length - 1, Math.max(0, player.roomId + (nearest.roomId >= player.roomId ? 0 : -1)))];
          if (adjRoom) {
            nearest.targetX = (adjRoom.xMin + adjRoom.xMax) / 2;
            nearest.targetZ = (adjRoom.zMin + adjRoom.zMax) / 2;
          }
        }
      }

      if (anyChasing || (director.tension >= 0.72 && director.reliefCooldown <= 0)) {
        director.phase = 'peak';
        director.phaseTimer = 0;
        director.peakCount++;
      } else if (player.hiding && minDist > 11 && director.phaseTimer > 6) {
        director.phase = 'calm';
        director.phaseTimer = 0;
      }
      break;
    }

    case 'peak': {
      // Nightmare Surge: sluggish dream-drag kicks in at the worst moment, then releases
      director.tension = moveToward(director.tension, Math.max(0.82, targetTension), 0.7, dt);
      const dragTarget = player.hiding && !anyChasing ? 0.25 : 0.64;
      director.dreamDrag = moveToward(director.dreamDrag, dragTarget, 0.9, dt);
      director.peakDuration += dt;

      const brokenContact = !anyChasing && (player.hiding || minDist > 8.5) && director.phaseTimer >= 2.6;
      if (director.phaseTimer >= PEAK_MAX_SECONDS || brokenContact) {
        director.phase = 'relief';
        director.phaseTimer = 0;
        director.reliefCooldown = RELIEF_SECONDS + 4.0;
      }
      break;
    }

    case 'relief': {
      // Crisp movement returns; monsters ease off so the player gets a breather
      director.tension = moveToward(director.tension, 0.14, 0.45, dt);
      director.dreamDrag = moveToward(director.dreamDrag, 0, 1.5, dt);

      // Gently steer any non-chasing monster away from the player's current room
      for (const m of monsters) {
        if (m.state === 'patrol' && m.roomId === player.roomId) {
          const awayRoomId = player.roomId < rooms.length - 1 ? player.roomId + 1 : Math.max(0, player.roomId - 1);
          const awayRoom = rooms[awayRoomId];
          m.targetX = (awayRoom.xMin + awayRoom.xMax) / 2;
          m.targetZ = (awayRoom.zMin + awayRoom.zMax) / 2;
        }
      }

      if (anyChasing && director.phaseTimer > 3.0) {
        director.phase = 'peak';
        director.phaseTimer = 0;
        director.peakCount++;
      } else if (director.phaseTimer >= RELIEF_SECONDS) {
        director.phase = 'calm';
        director.phaseTimer = 0;
      }
      break;
    }
  }

  director.heartbeatRate = 58 + director.tension * 74;

  if (prevPhase !== director.phase) {
    state.events.push({
      kind: 'phase_change',
      x: player.x,
      z: player.z,
      detail: director.phase,
    });
  }
}
