// Slink, the Uncoiled Hose: articulated 18-segment giant garden hose boss AI & spline solver.
import { BOSS, WORLD } from './config';
import type { BossAttackId, BossEntity, PlayerEntity, SimEvent, Vec3 } from './types';

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function distXZ(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(bx - ax, bz - az);
}

/** Distance from point (px, pz) to segment (ax, az)-(bx, bz) in XZ. */
export function pointSegDistXZ(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): number {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 1e-6) return Math.hypot(px - ax, pz - az);
  const t = clamp(((px - ax) * dx + (pz - az) * dz) / lenSq, 0, 1);
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

export function createBoss(playerCount: number): BossEntity {
  const maxHp = Math.round(BOSS.baseHp * (1 + Math.max(0, playerCount - 1) * BOSS.coopHpScale));
  const boss: BossEntity = {
    active: false,
    alive: true,
    hp: maxHp,
    maxHp,
    poise: BOSS.maxPoise,
    maxPoise: BOSS.maxPoise,
    phase: 1,
    attack: 'prowl',
    timer: 0,
    cooldown: 0.7,
    targetId: null,
    aimAngle: 0,
    slamX: WORLD.basinCenter.x,
    slamZ: WORLD.basinCenter.z,
    didHitSubstep: 0,
    segments: [],
    telegraph: null,
  };
  solveHosePose(boss, 0);
  return boss;
}

/** Places the 18 articulated segments from the north Spigot wall anchor to the nozzle head. */
export function solveHosePose(boss: BossEntity, worldTime: number): void {
  const n = BOSS.segmentCount;
  const ax = WORLD.spigotAnchor.x;
  const ay = WORLD.spigotAnchor.y;
  const az = WORLD.spigotAnchor.z;

  const speedMult = boss.phase === 2 ? 1.15 : 1.0;
  const t = boss.timer * speedMult;

  // Target nozzle world position & coil lateral sway
  let nx = 0;
  let ny = 2.4;
  let nz = -30;
  let coilAmp = 2.6;
  let coilDir = 1;

  if (!boss.alive) {
    nx = Math.sin(boss.aimAngle) * 14;
    ny = 0.45;
    nz = az + Math.cos(boss.aimAngle) * 14;
    coilAmp = 1.2;
  } else if (boss.attack === 'stagger') {
    const slump = Math.sin(boss.timer * 14) * 0.25;
    nx = Math.sin(boss.aimAngle) * 13 + slump;
    ny = 0.55;
    nz = az + Math.cos(boss.aimAngle) * 13;
    coilAmp = 1.5;
  } else if (boss.attack === 'phase_transition') {
    const thrash = Math.sin(boss.timer * 15) * 4.5;
    nx = thrash;
    ny = 5.6 + Math.sin(boss.timer * 10) * 0.6;
    nz = az + 11;
    coilAmp = 4.2;
  } else if (boss.attack === 'prowl') {
    const sway = Math.sin(worldTime * 2.1) * 0.22;
    const ang = boss.aimAngle + sway;
    const reach = 14.5 + Math.sin(worldTime * 1.4) * 1.2;
    nx = ax + Math.sin(ang) * reach;
    ny = 2.6 + Math.sin(worldTime * 2.8) * 0.5;
    nz = az + Math.cos(ang) * reach;
    coilAmp = 2.8;
  } else if (boss.attack === 'whip_left' || boss.attack === 'whip_right') {
    const dir = boss.attack === 'whip_left' ? -1 : 1;
    coilDir = dir;
    const windup = 0.85;
    const active = 0.38;
    if (t < windup) {
      const p = t / windup;
      const ang = boss.aimAngle + dir * lerp(0.15, 1.45, p * p);
      nx = ax + Math.sin(ang) * 16.5;
      ny = lerp(2.6, 3.8, p);
      nz = az + Math.cos(ang) * 16.5;
      coilAmp = lerp(2.6, 4.8, p);
    } else if (t < windup + active) {
      const p = (t - windup) / active;
      const smooth = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const ang = boss.aimAngle + dir * lerp(1.45, -1.35, smooth);
      const reach = 21.5;
      nx = ax + Math.sin(ang) * reach;
      ny = 0.85;
      nz = az + Math.cos(ang) * reach;
      coilAmp = 1.4;
    } else {
      const p = clamp((t - windup - active) / 1.1, 0, 1);
      const ang = boss.aimAngle - dir * lerp(1.35, 0.35, p);
      nx = ax + Math.sin(ang) * lerp(21.5, 15.0, p);
      ny = lerp(0.85, 2.5, p);
      nz = az + Math.cos(ang) * lerp(21.5, 15.0, p);
      coilAmp = lerp(1.4, 2.6, p);
    }
  } else if (boss.attack === 'double_lash') {
    const w1 = 0.78;
    const a1 = 0.34;
    const pause = 0.48;
    const a2 = 0.34;
    if (t < w1) {
      const p = t / w1;
      const ang = boss.aimAngle - lerp(0.2, 1.4, p);
      nx = ax + Math.sin(ang) * 17;
      ny = lerp(2.6, 3.6, p);
      nz = az + Math.cos(ang) * 17;
      coilAmp = 4.2;
    } else if (t < w1 + a1) {
      const p = (t - w1) / a1;
      const ang = boss.aimAngle + lerp(-1.4, 1.35, p);
      nx = ax + Math.sin(ang) * 21;
      ny = 0.85;
      nz = az + Math.cos(ang) * 21;
      coilAmp = 1.4;
    } else if (t < w1 + a1 + pause) {
      const p = (t - w1 - a1) / pause;
      const ang = boss.aimAngle + lerp(1.35, 1.48, p);
      nx = ax + Math.sin(ang) * 17.5;
      ny = lerp(0.9, 3.3, p);
      nz = az + Math.cos(ang) * 17.5;
      coilAmp = 3.8;
    } else if (t < w1 + a1 + pause + a2) {
      const p = (t - w1 - a1 - pause) / a2;
      const ang = boss.aimAngle + lerp(1.48, -1.35, p);
      nx = ax + Math.sin(ang) * 21;
      ny = 0.85;
      nz = az + Math.cos(ang) * 21;
      coilAmp = 1.4;
    } else {
      const p = clamp((t - w1 - a1 - pause - a2) / 1.15, 0, 1);
      const ang = boss.aimAngle + lerp(-1.35, 0, p);
      nx = ax + Math.sin(ang) * lerp(21, 15, p);
      ny = lerp(0.85, 2.5, p);
      nz = az + Math.cos(ang) * lerp(21, 15, p);
    }
  } else if (boss.attack === 'nozzle_slam') {
    const windup = 0.95;
    const slam = 0.22;
    if (t < windup) {
      const p = t / windup;
      nx = lerp(ax + Math.sin(boss.aimAngle) * 13, boss.slamX, p * 0.8);
      ny = lerp(2.8, 7.2, Math.sin(p * Math.PI * 0.5));
      nz = lerp(az + Math.cos(boss.aimAngle) * 13, boss.slamZ, p * 0.8);
      coilAmp = lerp(2.5, 1.2, p);
    } else if (t < windup + slam) {
      const p = (t - windup) / slam;
      nx = boss.slamX;
      ny = lerp(7.2, 0.52, p * p);
      nz = boss.slamZ;
      coilAmp = 0.8;
    } else {
      const p = clamp((t - windup - slam) / 1.35, 0, 1);
      nx = lerp(boss.slamX, ax + Math.sin(boss.aimAngle) * 14, Math.max(0, (p - 0.55) / 0.45));
      ny = lerp(0.52, 2.5, Math.max(0, (p - 0.55) / 0.45));
      nz = lerp(boss.slamZ, az + Math.cos(boss.aimAngle) * 14, Math.max(0, (p - 0.55) / 0.45));
      coilAmp = lerp(0.8, 2.5, p);
    }
  } else if (boss.attack === 'coil_burst') {
    const windup = 0.80;
    if (t < windup) {
      const p = t / windup;
      const r = lerp(13, 6.5, p);
      nx = ax + Math.sin(worldTime * 10) * r * 0.5;
      ny = lerp(2.5, 4.4, p);
      nz = az + r;
      coilAmp = lerp(2.5, 5.2, p);
    } else {
      const p = clamp((t - windup) / 1.0, 0, 1);
      nx = ax + Math.sin(boss.aimAngle) * lerp(7, 15, p);
      ny = lerp(4.4, 2.5, p);
      nz = az + Math.cos(boss.aimAngle) * lerp(7, 15, p);
      coilAmp = lerp(5.2, 2.6, p);
    }
  } else if (boss.attack === 'water_jet') {
    const windup = 1.0;
    const beam = 1.2;
    if (t < windup) {
      const p = t / windup;
      const ang = boss.aimAngle - 1.05;
      nx = ax + Math.sin(ang) * 12;
      ny = lerp(2.6, 3.1, p);
      nz = az + Math.cos(ang) * 12;
      coilAmp = 3.0;
    } else if (t < windup + beam) {
      const p = (t - windup) / beam;
      const ang = boss.aimAngle + lerp(-1.05, 1.05, p);
      nx = ax + Math.sin(ang) * 12.5;
      ny = 1.35;
      nz = az + Math.cos(ang) * 12.5;
      coilAmp = 2.0;
    } else {
      const p = clamp((t - windup - beam) / 1.2, 0, 1);
      const ang = boss.aimAngle + lerp(1.05, 0, p);
      nx = ax + Math.sin(ang) * 14;
      ny = lerp(1.35, 2.5, p);
      nz = az + Math.cos(ang) * 14;
    }
  } else if (boss.attack === 'frenzy_combo') {
    // 0..0.72 windup L, 0.72..1.04 whip L->R, 1.04..1.40 whip R->L, 1.40..2.05 rear up, 2.05..2.25 slam, 2.25..3.95 recover
    if (t < 0.72) {
      const p = t / 0.72;
      const ang = boss.aimAngle - lerp(0.2, 1.4, p);
      nx = ax + Math.sin(ang) * 17;
      ny = lerp(2.6, 3.8, p);
      nz = az + Math.cos(ang) * 17;
    } else if (t < 1.04) {
      const p = (t - 0.72) / 0.32;
      const ang = boss.aimAngle + lerp(-1.4, 1.4, p);
      nx = ax + Math.sin(ang) * 21.5;
      ny = 0.85;
      nz = az + Math.cos(ang) * 21.5;
    } else if (t < 1.40) {
      const p = (t - 1.04) / 0.36;
      const ang = boss.aimAngle + lerp(1.4, -1.35, p);
      nx = ax + Math.sin(ang) * 21.5;
      ny = 0.85;
      nz = az + Math.cos(ang) * 21.5;
    } else if (t < 2.05) {
      const p = (t - 1.40) / 0.65;
      nx = lerp(ax + Math.sin(boss.aimAngle - 1.35) * 18, boss.slamX, p);
      ny = lerp(1.2, 7.4, Math.sin(p * Math.PI * 0.5));
      nz = lerp(az + Math.cos(boss.aimAngle - 1.35) * 18, boss.slamZ, p);
    } else if (t < 2.25) {
      const p = (t - 2.05) / 0.20;
      nx = boss.slamX;
      ny = lerp(7.4, 0.52, p * p);
      nz = boss.slamZ;
    } else {
      const p = clamp((t - 2.25) / 1.7, 0, 1);
      nx = lerp(boss.slamX, ax + Math.sin(boss.aimAngle) * 14, Math.max(0, (p - 0.6) / 0.4));
      ny = lerp(0.52, 2.5, Math.max(0, (p - 0.6) / 0.4));
      nz = lerp(boss.slamZ, az + Math.cos(boss.aimAngle) * 14, Math.max(0, (p - 0.6) / 0.4));
    }
  }

  // Build 18 segments smoothly interpolating from spigot anchor to nozzle
  const pts: Vec3[] = new Array(n);
  const perpX = Math.cos(boss.aimAngle);
  const perpZ = -Math.sin(boss.aimAngle);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const arch = Math.sin(u * Math.PI) * 1.1;
    const wave = Math.sin(u * Math.PI * 2 + worldTime * 2.2) * coilAmp * coilDir * Math.sin(u * Math.PI);
    const x = lerp(ax, nx, u) + perpX * wave * 0.45;
    const y = Math.max(0.45, lerp(ay, ny, u) + arch * (ny > 1.5 ? 0.5 : -0.35));
    const z = lerp(az, nz, u) + perpZ * wave * 0.45;
    pts[i] = { x, y, z };
  }
  boss.segments = pts;
}

function chooseNextAttack(boss: BossEntity, target: PlayerEntity): BossAttackId {
  const d = distXZ(WORLD.spigotAnchor.x, WORLD.spigotAnchor.z, target.x, target.z);
  const relAngle = angleDiff(0, Math.atan2(target.x - WORLD.spigotAnchor.x, target.z - WORLD.spigotAnchor.z));
  const roll = Math.abs(Math.sin(boss.hp * 0.37 + boss.timer * 13.7 + target.x * 1.9));

  if (d < 8.5 && roll < 0.45) return 'coil_burst';
  if (boss.phase === 2) {
    if (roll < 0.28) return 'water_jet';
    if (roll < 0.50) return 'frenzy_combo';
  }
  if (roll < 0.25) return 'double_lash';
  if (roll < 0.52) return 'nozzle_slam';
  return relAngle >= 0 ? 'whip_right' : 'whip_left';
}

export interface BossHitCallback {
  (player: PlayerEntity, damage: number, angleFrom: number): void;
}

export function stepBoss(
  boss: BossEntity,
  players: PlayerEntity[],
  dt: number,
  worldTime: number,
  events: SimEvent[],
  onHitPlayer: BossHitCallback,
): void {
  if (!boss.active || !boss.alive) {
    solveHosePose(boss, worldTime);
    return;
  }

  // Poise decay
  if (boss.attack !== 'stagger') {
    boss.poise = Math.min(boss.maxPoise, boss.poise + BOSS.poiseDecayPerS * dt);
  }

  // Phase 2 transition check
  if (boss.phase === 1 && boss.hp <= boss.maxHp * BOSS.phase2Threshold && boss.attack !== 'phase_transition') {
    boss.phase = 2;
    boss.attack = 'phase_transition';
    boss.timer = 0;
    boss.telegraph = null;
    events.push({ kind: 'phase2', x: WORLD.basinCenter.x, y: 2, z: WORLD.basinCenter.z });
    solveHosePose(boss, worldTime);
    return;
  }

  // Pick nearest living target in the basin
  const living = players.filter((p) => p.action !== 'dead');
  if (living.length === 0) {
    solveHosePose(boss, worldTime);
    return;
  }
  let target = living[0];
  let bestD = Infinity;
  for (const p of living) {
    const d = distXZ(WORLD.basinCenter.x, WORLD.basinCenter.z, p.x, p.z);
    if (d < bestD) {
      bestD = d;
      target = p;
    }
  }
  boss.targetId = target.id;
  const desiredAng = clamp(
    Math.atan2(target.x - WORLD.spigotAnchor.x, target.z - WORLD.spigotAnchor.z),
    -1.05,
    1.05,
  );

  boss.timer += dt;
  const speedMult = boss.phase === 2 ? 1.15 : 1.0;
  const t = boss.timer * speedMult;
  boss.telegraph = null;

  if (boss.attack === 'stagger') {
    if (boss.timer >= BOSS.staggerDuration) {
      boss.attack = 'prowl';
      boss.timer = 0;
      boss.cooldown = 0.5;
      boss.poise = boss.maxPoise;
    }
    solveHosePose(boss, worldTime);
    return;
  }

  if (boss.attack === 'phase_transition') {
    if (boss.timer >= 1.8) {
      boss.attack = 'prowl';
      boss.timer = 0;
      boss.cooldown = 0.35;
    }
    solveHosePose(boss, worldTime);
    return;
  }

  if (boss.attack === 'prowl') {
    boss.aimAngle += angleDiff(boss.aimAngle, desiredAng) * Math.min(1, dt * 3.5);
    boss.cooldown -= dt;
    if (boss.cooldown <= 0) {
      const next = chooseNextAttack(boss, target);
      boss.attack = next;
      boss.timer = 0;
      boss.didHitSubstep = 0;
      boss.slamX = target.x;
      boss.slamZ = target.z;
    }
    solveHosePose(boss, worldTime);
    return;
  }

  solveHosePose(boss, worldTime);
  const nozzle = boss.segments[boss.segments.length - 1];

  // Helper: check hose segment sweep against all living players
  const checkHoseSweepDamage = (substep: number, dmg: number) => {
    if (boss.didHitSubstep >= substep) return;
    for (let i = 6; i < boss.segments.length - 1; i++) {
      const a = boss.segments[i];
      const b = boss.segments[i + 1];
      for (const p of living) {
        const d = pointSegDistXZ(p.x, p.z, a.x, a.z, b.x, b.z);
        if (d <= BOSS.segmentRadius + WORLD.playerRadius + 0.25) {
          boss.didHitSubstep = substep;
          onHitPlayer(p, dmg, Math.atan2(p.x - nozzle.x, p.z - nozzle.z));
          return;
        }
      }
    }
  };

  if (boss.attack === 'whip_left' || boss.attack === 'whip_right') {
    if (t < 0.85) {
      boss.telegraph = { kind: 'sweep', x: WORLD.spigotAnchor.x, z: WORLD.spigotAnchor.z, radius: 21.5, angle: boss.aimAngle, alpha: t / 0.85 };
    } else if (t < 1.23) {
      if (boss.didHitSubstep === 0) {
        events.push({ kind: 'boss_whip', x: nozzle.x, y: nozzle.y, z: nozzle.z });
      }
      checkHoseSweepDamage(1, 38);
    } else if (t >= 2.33) {
      boss.attack = 'prowl';
      boss.timer = 0;
      boss.cooldown = 0.65;
    }
  } else if (boss.attack === 'double_lash') {
    if (t < 0.78) {
      boss.telegraph = { kind: 'sweep', x: WORLD.spigotAnchor.x, z: WORLD.spigotAnchor.z, radius: 21, angle: boss.aimAngle, alpha: t / 0.78 };
    } else if (t < 1.12) {
      if (boss.didHitSubstep === 0) events.push({ kind: 'boss_whip', x: nozzle.x, y: nozzle.y, z: nozzle.z });
      checkHoseSweepDamage(1, 34);
    } else if (t < 1.60) {
      // second windup
    } else if (t < 1.94) {
      if (boss.didHitSubstep < 2) {
        events.push({ kind: 'boss_whip', x: nozzle.x, y: nozzle.y, z: nozzle.z });
      }
      checkHoseSweepDamage(2, 36);
    } else if (t >= 3.09) {
      boss.attack = 'prowl';
      boss.timer = 0;
      boss.cooldown = 0.75;
    }
  } else if (boss.attack === 'nozzle_slam') {
    if (t < 0.65) {
      boss.slamX = lerp(boss.slamX, target.x, Math.min(1, dt * 6));
      boss.slamZ = lerp(boss.slamZ, target.z, Math.min(1, dt * 6));
    }
    if (t < 0.95) {
      boss.telegraph = { kind: 'circle', x: boss.slamX, z: boss.slamZ, radius: 3.4, angle: 0, alpha: t / 0.95 };
    } else if (t < 1.17) {
      if (boss.didHitSubstep === 0 && t >= 1.08) {
        boss.didHitSubstep = 1;
        events.push({ kind: 'boss_slam', x: boss.slamX, y: 0.2, z: boss.slamZ });
        for (const p of living) {
          if (distXZ(boss.slamX, boss.slamZ, p.x, p.z) <= 3.4 + WORLD.playerRadius) {
            onHitPlayer(p, 48, Math.atan2(p.x - boss.slamX, p.z - boss.slamZ));
          }
        }
      }
    } else if (t >= 2.52) {
      boss.attack = 'prowl';
      boss.timer = 0;
      boss.cooldown = 0.6;
    }
  } else if (boss.attack === 'coil_burst') {
    if (t < 0.80) {
      boss.telegraph = { kind: 'circle', x: WORLD.spigotAnchor.x, z: WORLD.spigotAnchor.z + 4.5, radius: 6.2, angle: 0, alpha: t / 0.80 };
    } else if (boss.didHitSubstep === 0) {
      boss.didHitSubstep = 1;
      events.push({ kind: 'boss_slam', x: WORLD.spigotAnchor.x, y: 1.0, z: WORLD.spigotAnchor.z + 4.5 });
      for (const p of living) {
        if (distXZ(WORLD.spigotAnchor.x, WORLD.spigotAnchor.z + 4.5, p.x, p.z) <= 6.2) {
          onHitPlayer(p, 42, Math.atan2(p.x - WORLD.spigotAnchor.x, p.z - WORLD.spigotAnchor.z));
        }
      }
    } else if (t >= 1.80) {
      boss.attack = 'prowl';
      boss.timer = 0;
      boss.cooldown = 0.65;
    }
  } else if (boss.attack === 'water_jet') {
    if (t < 1.0) {
      boss.telegraph = { kind: 'beam', x: nozzle.x, z: nozzle.z, radius: 18, angle: boss.aimAngle - 1.05, alpha: t / 1.0 };
    } else if (t < 2.2) {
      const p = (t - 1.0) / 1.2;
      const beamAng = boss.aimAngle + lerp(-1.05, 1.05, p);
      boss.telegraph = { kind: 'beam', x: nozzle.x, z: nozzle.z, radius: 18, angle: beamAng, alpha: 1 };
      if (boss.didHitSubstep === 0) {
        events.push({ kind: 'boss_jet', x: nozzle.x, y: nozzle.y, z: nozzle.z });
      }
      const endX = nozzle.x + Math.sin(beamAng) * 18;
      const endZ = nozzle.z + Math.cos(beamAng) * 18;
      const tickBucket = Math.floor(t * 4);
      if (boss.didHitSubstep < tickBucket) {
        for (const pl of living) {
          if (pointSegDistXZ(pl.x, pl.z, nozzle.x, nozzle.z, endX, endZ) <= 0.95 + WORLD.playerRadius) {
            boss.didHitSubstep = tickBucket;
            onHitPlayer(pl, 26, beamAng);
          }
        }
      }
    } else if (t >= 3.4) {
      boss.attack = 'prowl';
      boss.timer = 0;
      boss.cooldown = 0.7;
    }
  } else if (boss.attack === 'frenzy_combo') {
    if (t < 0.72) {
      boss.telegraph = { kind: 'sweep', x: WORLD.spigotAnchor.x, z: WORLD.spigotAnchor.z, radius: 21.5, angle: boss.aimAngle, alpha: t / 0.72 };
    } else if (t < 1.04) {
      if (boss.didHitSubstep === 0) events.push({ kind: 'boss_whip', x: nozzle.x, y: nozzle.y, z: nozzle.z });
      checkHoseSweepDamage(1, 32);
    } else if (t < 1.40) {
      if (boss.didHitSubstep < 2) events.push({ kind: 'boss_whip', x: nozzle.x, y: nozzle.y, z: nozzle.z });
      checkHoseSweepDamage(2, 34);
    } else if (t < 2.05) {
      if (t < 1.85) {
        boss.slamX = lerp(boss.slamX, target.x, Math.min(1, dt * 7));
        boss.slamZ = lerp(boss.slamZ, target.z, Math.min(1, dt * 7));
      }
      boss.telegraph = { kind: 'circle', x: boss.slamX, z: boss.slamZ, radius: 3.6, angle: 0, alpha: (t - 1.40) / 0.65 };
    } else if (t < 2.25) {
      if (boss.didHitSubstep < 3 && t >= 2.18) {
        boss.didHitSubstep = 3;
        events.push({ kind: 'boss_slam', x: boss.slamX, y: 0.2, z: boss.slamZ });
        for (const p of living) {
          if (distXZ(boss.slamX, boss.slamZ, p.x, p.z) <= 3.6 + WORLD.playerRadius) {
            onHitPlayer(p, 46, Math.atan2(p.x - boss.slamX, p.z - boss.slamZ));
          }
        }
      }
    } else if (t >= 3.95) {
      boss.attack = 'prowl';
      boss.timer = 0;
      boss.cooldown = 0.85;
    }
  }
}
