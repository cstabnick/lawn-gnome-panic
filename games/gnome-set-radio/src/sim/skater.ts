import { nearestRailPoint, sampleSurfaceHeight } from '../levels/loader';
import type { GsrLevelDoc, GsrRail } from '../levels/schema';

export interface SkaterInput {
  /** Desired movement direction in world XZ (-1..1). */
  moveX: number;
  moveZ: number;
  jump: boolean;
  grind: boolean;
  trick: boolean;
  boost: boolean;
}

export interface SkaterState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  lean: number;
  grounded: boolean;
  grinding: boolean;
  wallRiding: boolean;
  railId: string | null;
  railSeg: number;
  railT: number;
  railDir: 1 | -1;
  boost: number; // 0..100
  comboScore: number;
  comboMult: number;
  comboTimer: number;
  totalScore: number;
  lastTrickName: string;
  trickSpin: number;
  airTime: number;
  stridePhase: number;
}

export interface StepResult {
  landed: boolean;
  bankedScore: number;
  bounced: boolean;
  trickTriggered: string | null;
}

const TRICK_NAMES = [
  'Aether Grab',
  '360 Clay Spin',
  'Ley-Line Fakie',
  'Turfton Mute',
  'Bongo Flip',
  'Broadcast Backside',
];

export const SKATER_TUNE = {
  maxSpeed: 21,
  boostSpeed: 28,
  accel: 34,
  airAccel: 14,
  friction: 2.8,
  gravity: 30,
  jumpVel: 12.6,
  railSnapDist: 2.1,
  railSpeed: 22,
  railCooldownS: 0.25,
};

export function createSkater(doc: GsrLevelDoc): SkaterState {
  const spawn = doc.markers.find((m) => m.kind === 'spawn');
  const x = spawn?.x ?? 0;
  const z = spawn?.z ?? 36;
  const yaw = typeof spawn?.data?.yaw === 'number' ? spawn.data.yaw : Math.PI;
  const y = sampleSurfaceHeight(doc, x, z, 2);
  return {
    x,
    y,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw,
    lean: 0,
    grounded: true,
    grinding: false,
    wallRiding: false,
    railId: null,
    railSeg: 0,
    railT: 0,
    railDir: 1,
    boost: 75,
    comboScore: 0,
    comboMult: 1,
    comboTimer: 0,
    totalScore: 0,
    lastTrickName: '',
    trickSpin: 0,
    airTime: 0,
    stridePhase: 0,
  };
}

function advanceAlongRail(
  rail: GsrRail,
  seg: number,
  t: number,
  dir: 1 | -1,
  dist: number,
): { seg: number; t: number; x: number; y: number; z: number; tx: number; ty: number; tz: number; ended: boolean } {
  let curSeg = seg;
  let curT = t;
  let rem = dist;

  while (rem > 0) {
    const a = rail.points[curSeg];
    const b = rail.points[curSeg + 1];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    const segLen = Math.hypot(dx, dy, dz) || 1;
    const stepT = rem / segLen;
    if (dir === 1) {
      if (curT + stepT <= 1) {
        curT += stepT;
        rem = 0;
      } else {
        rem -= (1 - curT) * segLen;
        if (curSeg + 1 < rail.points.length - 1) {
          curSeg++;
          curT = 0;
        } else {
          curT = 1;
          return {
            seg: curSeg,
            t: curT,
            x: b[0],
            y: b[1],
            z: b[2],
            tx: dx / segLen,
            ty: dy / segLen,
            tz: dz / segLen,
            ended: true,
          };
        }
      }
    } else {
      if (curT - stepT >= 0) {
        curT -= stepT;
        rem = 0;
      } else {
        rem -= curT * segLen;
        if (curSeg > 0) {
          curSeg--;
          curT = 1;
        } else {
          curT = 0;
          return {
            seg: curSeg,
            t: curT,
            x: a[0],
            y: a[1],
            z: a[2],
            tx: -dx / segLen,
            ty: -dy / segLen,
            tz: -dz / segLen,
            ended: true,
          };
        }
      }
    }
  }

  const a = rail.points[curSeg];
  const b = rail.points[curSeg + 1];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  const len = Math.hypot(dx, dy, dz) || 1;
  return {
    seg: curSeg,
    t: curT,
    x: a[0] + dx * curT,
    y: a[1] + dy * curT,
    z: a[2] + dz * curT,
    tx: (dx / len) * dir,
    ty: (dy / len) * dir,
    tz: (dz / len) * dir,
    ended: false,
  };
}

export function stepSkater(
  s: SkaterState,
  doc: GsrLevelDoc,
  input: SkaterInput,
  dt: number,
  prevButtons: { jump: boolean; trick: boolean; railCooldown: number },
): StepResult {
  const res: StepResult = { landed: false, bankedScore: 0, bounced: false, trickTriggered: null };
  prevButtons.railCooldown = Math.max(0, prevButtons.railCooldown - dt);

  const jumpEdge = input.jump && !prevButtons.jump;
  const trickEdge = input.trick && !prevButtons.trick;
  prevButtons.jump = input.jump;
  prevButtons.trick = input.trick;

  const boosting = input.boost && s.boost > 2;
  if (boosting) s.boost = Math.max(0, s.boost - 24 * dt);
  else s.boost = Math.min(100, s.boost + 4 * dt);

  // Decay trick spin visual
  if (s.trickSpin > 0) s.trickSpin = Math.max(0, s.trickSpin - dt * 6);

  // Handle Rail Grinding
  if (s.grinding && s.railId) {
    const rail = doc.data.rails.find((r) => r.id === s.railId);
    if (!rail) {
      s.grinding = false;
      s.railId = null;
    } else {
      const speed = SKATER_TUNE.railSpeed * (rail.speedBoost ?? 1.2) * (boosting ? 1.2 : 1);
      const adv = advanceAlongRail(rail, s.railSeg, s.railT, s.railDir, speed * dt);
      s.x = adv.x;
      s.y = adv.y;
      s.z = adv.z;
      s.railSeg = adv.seg;
      s.railT = adv.t;
      s.vx = adv.tx * speed;
      s.vy = adv.ty * speed;
      s.vz = adv.tz * speed;
      s.yaw = Math.atan2(adv.tx, adv.tz);
      s.comboScore += Math.round(120 * dt);
      s.comboTimer = 2.4;
      s.boost = Math.min(100, s.boost + 14 * dt);

      if (trickEdge) {
        const name = TRICK_NAMES[(s.comboMult + Math.floor(s.x + s.z)) % TRICK_NAMES.length] ?? 'Ley-Line Grind';
        s.comboMult++;
        s.comboScore += 180;
        s.lastTrickName = name;
        s.trickSpin = Math.PI * 2;
        res.trickTriggered = name;
      }

      if (jumpEdge || adv.ended) {
        s.grinding = false;
        s.railId = null;
        prevButtons.railCooldown = SKATER_TUNE.railCooldownS;
        if (jumpEdge) {
          s.vy = SKATER_TUNE.jumpVel * 1.05;
          s.grounded = false;
        }
      }
      return res;
    }
  }

  // Horizontal carving & momentum
  const moveLen = Math.hypot(input.moveX, input.moveZ);
  const nx = moveLen > 0.05 ? input.moveX / Math.max(1, moveLen) : 0;
  const nz = moveLen > 0.05 ? input.moveZ / Math.max(1, moveLen) : 0;
  const accel = s.grounded ? SKATER_TUNE.accel : SKATER_TUNE.airAccel;
  const maxSpd = boosting ? SKATER_TUNE.boostSpeed : SKATER_TUNE.maxSpeed;

  if (moveLen > 0.05) {
    s.vx += nx * accel * (boosting ? 1.35 : 1) * dt;
    s.vz += nz * accel * (boosting ? 1.35 : 1) * dt;
  } else if (s.grounded) {
    const damp = Math.max(0, 1 - SKATER_TUNE.friction * dt);
    s.vx *= damp;
    s.vz *= damp;
  }

  const horizSpd = Math.hypot(s.vx, s.vz);
  if (horizSpd > maxSpd) {
    s.vx = (s.vx / horizSpd) * maxSpd;
    s.vz = (s.vz / horizSpd) * maxSpd;
  }

  if (horizSpd > 0.5) {
    const targetYaw = Math.atan2(s.vx, s.vz);
    let diff = targetYaw - s.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    s.yaw += diff * Math.min(1, dt * 11);
    s.lean = Math.max(-0.35, Math.min(0.35, diff * 0.45));
    if (s.grounded) s.stridePhase += horizSpd * dt * 0.85;
  } else {
    s.lean *= Math.max(0, 1 - dt * 8);
  }

  // Jump
  if (jumpEdge && (s.grounded || s.wallRiding)) {
    s.vy = SKATER_TUNE.jumpVel;
    s.grounded = false;
    s.wallRiding = false;
  }

  // Mid-air trick
  if (!s.grounded && trickEdge) {
    const name = TRICK_NAMES[Math.abs(Math.round(s.x + s.z + s.comboMult)) % TRICK_NAMES.length] ?? 'Aether Grab';
    s.comboMult++;
    s.comboScore += 220;
    s.comboTimer = 2.6;
    s.lastTrickName = name;
    s.trickSpin = Math.PI * 2;
    s.boost = Math.min(100, s.boost + 10);
    res.trickTriggered = name;
  }

  // Gravity & integration
  if (!s.grounded) {
    s.vy -= SKATER_TUNE.gravity * (s.wallRiding ? 0.35 : 1) * dt;
    s.airTime += dt;
  } else {
    s.airTime = 0;
  }

  const nextX = s.x + s.vx * dt;
  const nextZ = s.z + s.vz * dt;
  const nextY = s.y + s.vy * dt;

  // Building side wall collisions (with wall-ride support!)
  s.x = nextX;
  s.z = nextZ;
  s.wallRiding = false;
  const r = 0.65;
  for (const b of doc.data.buildings) {
    const top = b.yBase + b.h;
    if (nextY >= b.yBase && nextY < top - 0.6) {
      const halfW = b.w * 0.5 + r;
      const halfD = b.d * 0.5 + r;
      const dx = s.x - b.x;
      const dz = s.z - b.z;
      if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
        const penX = halfW - Math.abs(dx);
        const penZ = halfD - Math.abs(dz);
        if (penX < penZ) {
          s.x = b.x + Math.sign(dx || 1) * halfW;
          s.vx = 0;
          if (!s.grounded && Math.abs(s.vz) > 4) s.wallRiding = true;
        } else {
          s.z = b.z + Math.sign(dz || 1) * halfD;
          s.vz = 0;
          if (!s.grounded && Math.abs(s.vx) > 4) s.wallRiding = true;
        }
      }
    }
  }

  // Keep inside island bounds (bounce back onto edge if near rim)
  const limX = doc.bounds.w * 0.5 - 2;
  const limZ = doc.bounds.d * 0.5 - 2;
  if (Math.abs(s.x) > limX) {
    s.x = Math.sign(s.x) * limX;
    s.vx *= -0.4;
  }
  if (Math.abs(s.z) > limZ) {
    s.z = Math.sign(s.z) * limZ;
    s.vz *= -0.4;
  }

  // Rail snap check (when airborne or pressing grind)
  if (prevButtons.railCooldown <= 0 && (!s.grounded || input.grind)) {
    const near = nearestRailPoint(doc.data.rails, s.x, nextY, s.z);
    if (near && near.dist <= SKATER_TUNE.railSnapDist && s.vy <= 4) {
      s.grinding = true;
      s.grounded = false;
      s.railId = near.rail.id;
      s.railSeg = near.segIdx;
      s.railT = near.t;
      const dot = s.vx * near.tx + s.vz * near.tz;
      s.railDir = dot >= 0 ? 1 : -1;
      s.x = near.px;
      s.y = near.py;
      s.z = near.pz;
      s.vy = 0;
      s.comboMult = Math.max(1, s.comboMult);
      s.comboScore += 100;
      s.comboTimer = 2.4;
      s.lastTrickName = 'Ley-Line Grind';
      res.trickTriggered = 'Ley-Line Grind';
      return res;
    }
  }

  // Surface landing
  const surfY = sampleSurfaceHeight(doc, s.x, s.z, s.y);
  if (nextY <= surfY + 0.08 && s.vy <= 0.5) {
    if (!s.grounded && s.airTime > 0.12) res.landed = true;
    s.y = surfY;
    s.vy = 0;
    s.grounded = true;
  } else {
    s.y = nextY;
    if (nextY > surfY + 0.25) s.grounded = false;
  }

  // Combo banking timer
  if (s.comboScore > 0) {
    if (s.grounded && !s.grinding) {
      s.comboTimer -= dt;
      if (s.comboTimer <= 0) {
        res.bankedScore = s.comboScore * s.comboMult;
        s.totalScore += res.bankedScore;
        s.comboScore = 0;
        s.comboMult = 1;
        s.comboTimer = 0;
      }
    }
  }

  return res;
}
