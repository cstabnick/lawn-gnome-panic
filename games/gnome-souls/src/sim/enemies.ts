// Pre-boss corridor enemies: Hollow Trowel-Bearers and the Shovel Warden.
import { ENEMY_SPAWNS, ENEMY_SPECS, WORLD } from './config';
import type { EnemyEntity, PlayerEntity, SimEvent } from './types';

function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function createEnemies(): EnemyEntity[] {
  return ENEMY_SPAWNS.map((s) => {
    const spec = ENEMY_SPECS[s.kind];
    return {
      id: s.id,
      kind: s.kind,
      name: spec.name,
      x: s.x,
      z: s.z,
      facing: s.facing,
      hp: spec.maxHp,
      maxHp: spec.maxHp,
      poise: spec.maxPoise,
      maxPoise: spec.maxPoise,
      state: 'idle',
      timer: 0,
      targetId: null,
      didHit: false,
    };
  });
}

export function stepEnemies(
  enemies: EnemyEntity[],
  players: PlayerEntity[],
  dt: number,
  events: SimEvent[],
  onHitPlayer: (player: PlayerEntity, damage: number, angleFrom: number) => void,
): void {
  const living = players.filter((p) => p.action !== 'dead' && p.z >= WORLD.fogGateZ - 0.5);

  for (const e of enemies) {
    if (e.state === 'dead') continue;
    const spec = ENEMY_SPECS[e.kind];

    if (e.state !== 'stagger') {
      e.poise = Math.min(e.maxPoise, e.poise + 8 * dt);
    }

    let target: PlayerEntity | null = null;
    let bestD = Infinity;
    for (const p of living) {
      const d = Math.hypot(p.x - e.x, p.z - e.z);
      if (d < bestD) {
        bestD = d;
        target = p;
      }
    }

    if (e.state === 'stagger') {
      e.timer += dt;
      if (e.timer >= 1.1) {
        e.state = 'chase';
        e.timer = 0;
        e.poise = e.maxPoise;
      }
      continue;
    }

    if (e.state === 'idle') {
      if (target && bestD <= spec.aggroDist) {
        e.state = 'chase';
        e.targetId = target.id;
      }
      continue;
    }

    if (!target || bestD > spec.aggroDist * 1.75) {
      e.state = 'idle';
      e.targetId = null;
      continue;
    }

    const toTargetAng = Math.atan2(target.x - e.x, target.z - e.z);

    if (e.state === 'chase') {
      e.facing += angleDiff(e.facing, toTargetAng) * Math.min(1, dt * 8);
      if (bestD <= spec.attackRange) {
        e.state = 'windup';
        e.timer = 0;
        e.didHit = false;
      } else {
        const dirX = Math.sin(e.facing);
        const dirZ = Math.cos(e.facing);
        e.x = Math.max(-WORLD.corridorHalfW + spec.radius, Math.min(WORLD.corridorHalfW - spec.radius, e.x + dirX * spec.speed * dt));
        e.z = Math.max(WORLD.fogGateZ + spec.radius + 0.5, Math.min(WORLD.corridorMaxZ - spec.radius, e.z + dirZ * spec.speed * dt));
      }
    } else if (e.state === 'windup') {
      e.facing += angleDiff(e.facing, toTargetAng) * Math.min(1, dt * 4);
      e.timer += dt;
      if (e.timer >= spec.windup) {
        e.state = 'active';
        e.timer = 0;
        events.push({ kind: 'swing', x: e.x, y: 0.7, z: e.z });
      }
    } else if (e.state === 'active') {
      e.timer += dt;
      if (!e.didHit) {
        const halfArc = ((spec.arcDeg * 0.5) * Math.PI) / 180;
        for (const p of living) {
          const d = Math.hypot(p.x - e.x, p.z - e.z);
          if (d <= spec.reach + WORLD.playerRadius) {
            const ang = Math.atan2(p.x - e.x, p.z - e.z);
            if (Math.abs(angleDiff(e.facing, ang)) <= halfArc) {
              e.didHit = true;
              onHitPlayer(p, spec.damage, e.facing);
              break;
            }
          }
        }
      }
      if (e.timer >= spec.active) {
        e.state = 'recovery';
        e.timer = 0;
      }
    } else if (e.state === 'recovery') {
      e.timer += dt;
      if (e.timer >= spec.recovery) {
        e.state = 'chase';
        e.timer = 0;
      }
    }
  }
}
