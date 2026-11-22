import { nearestRailPoint, sampleSurfaceHeight } from '../levels/loader';
import type { GsrLevelDoc, GsrRail } from '../levels/schema';
import { createSkateChassis, stepGroundChassis, syncChassisFromSkater, type SkateChassis } from './skateVehicle';

export type TrickAnimKind = 'frontflip' | 'spin360' | 'grab' | 'cork' | 'grindHop' | 'groundSpin';

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
  carveSlip: number;
  pitch: number;
  roll: number;
  boosting: boolean;
  speedKmh: number;
  grounded: boolean;
  grinding: boolean;
  wallRiding: boolean;
  wallSide: -1 | 0 | 1;
  airJumpsLeft: number;
  maxAirJumps: number;
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
  groundTrickCooldown: number;
  activeTrickAnim: TrickAnimKind | null;
  airTime: number;
  stridePhase: number;
  chassis?: SkateChassis;
}

export interface StepResult {
  landed: boolean;
  landImpact: number;
  bankedScore: number;
  bounced: boolean;
  trickTriggered: string | null;
  trickAnim: TrickAnimKind | null;
  jumpTriggered: boolean;
  airJumpTriggered: boolean;
  boostStarted: boolean;
  bumped: boolean;
  wallRideStarted: boolean;
  grindStarted: boolean;
}

export const SKATER_TUNE = {
  maxSpeed: 22,
  boostSpeed: 29,
  accel: 34,
  airAccel: 21,
  friction: 2.6,
  gravity: 30,
  jumpVel: 12.6,
  airJumpVel: 11.6,
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
    carveSlip: 0,
    pitch: 0,
    roll: 0,
    boosting: false,
    speedKmh: 0,
    grounded: true,
    grinding: false,
    wallRiding: false,
    wallSide: 0,
    airJumpsLeft: 1,
    maxAirJumps: 1,
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
    groundTrickCooldown: 0,
    activeTrickAnim: null,
    airTime: 0,
    stridePhase: 0,
    chassis: createSkateChassis(doc, x, y, z, yaw),
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

function pickAirTrick(
  s: SkaterState,
  moveX: number,
  moveZ: number,
): { name: string; anim: TrickAnimKind; pts: number; boost: number } {
  const moveLen = Math.hypot(moveX, moveZ);
  if (moveLen > 0.25) {
    const nx = moveX / moveLen;
    const nz = moveZ / moveLen;
    const fwdDot = nx * Math.sin(s.yaw) + nz * Math.cos(s.yaw);
    const sideDot = nx * -Math.cos(s.yaw) + nz * Math.sin(s.yaw);
    if (Math.abs(fwdDot) >= Math.abs(sideDot)) {
      return fwdDot >= 0
        ? { name: 'Aether Flip', anim: 'frontflip', pts: 240, boost: 12 }
        : { name: 'Turfton Grab', anim: 'grab', pts: 250, boost: 12 };
    }
    return { name: '360 Clay Spin', anim: 'spin360', pts: 220, boost: 10 };
  }
  return { name: 'Broadcast Cork', anim: 'cork', pts: 260, boost: 14 };
}

export function stepSkater(
  s: SkaterState,
  doc: GsrLevelDoc,
  input: SkaterInput,
  dt: number,
  prevButtons: { jump: boolean; trick: boolean; railCooldown: number },
): StepResult {
  const res: StepResult = {
    landed: false,
    landImpact: 0,
    bankedScore: 0,
    bounced: false,
    trickTriggered: null,
    trickAnim: null,
    jumpTriggered: false,
    airJumpTriggered: false,
    boostStarted: false,
    bumped: false,
    wallRideStarted: false,
    grindStarted: false,
  };
  prevButtons.railCooldown = Math.max(0, prevButtons.railCooldown - dt);
  s.groundTrickCooldown = Math.max(0, s.groundTrickCooldown - dt);

  if (!s.chassis) {
    s.chassis = createSkateChassis(doc, s.x, s.y, s.z, s.yaw);
  }

  const jumpEdge = input.jump && !prevButtons.jump;
  const trickEdge = input.trick && !prevButtons.trick;
  prevButtons.jump = input.jump;
  prevButtons.trick = input.trick;

  const wasBoosting = s.boosting;
  const boosting = input.boost && s.boost > 2;
  s.boosting = boosting;
  if (boosting && !wasBoosting) res.boostStarted = true;
  if (boosting) s.boost = Math.max(0, s.boost - 24 * dt);
  else s.boost = Math.min(100, s.boost + 4 * dt);

  // Decay trick spin visual
  if (s.trickSpin > 0) s.trickSpin = Math.max(0, s.trickSpin - dt * 6);

  // Handle Rail Grinding
  if (s.grinding && s.railId) {
    s.airJumpsLeft = s.maxAirJumps;
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
      s.speedKmh = Math.round(speed * 3.6);
      s.comboScore += Math.round(120 * dt);
      s.comboTimer = 2.4;
      s.boost = Math.min(100, s.boost + 14 * dt);

      if (trickEdge) {
        const name = s.comboMult % 2 === 0 ? 'Switch Stance' : 'One-Foot Grind';
        s.comboMult++;
        s.comboScore += 200;
        s.boost = Math.min(100, s.boost + 12);
        s.lastTrickName = name;
        s.activeTrickAnim = 'grindHop';
        res.trickTriggered = name;
        res.trickAnim = 'grindHop';
      }

      if (jumpEdge || adv.ended) {
        s.grinding = false;
        s.railId = null;
        prevButtons.railCooldown = SKATER_TUNE.railCooldownS;
        if (jumpEdge) {
          s.vy = SKATER_TUNE.jumpVel * 1.05;
          s.grounded = false;
          s.airJumpsLeft = s.maxAirJumps;
          res.jumpTriggered = true;
        }
        syncChassisFromSkater(s.chassis, s.x, s.y, s.z, s.vx, s.vz, s.yaw);
      }
      return res;
    }
  }

  // Horizontal carving & momentum
  const moveLen = Math.hypot(input.moveX, input.moveZ);
  const nx = moveLen > 0.05 ? input.moveX / Math.max(1, moveLen) : 0;
  const nz = moveLen > 0.05 ? input.moveZ / Math.max(1, moveLen) : 0;
  const maxSpd = boosting ? SKATER_TUNE.boostSpeed : SKATER_TUNE.maxSpeed;

  if (s.grounded) {
    stepGroundChassis(s.chassis, s, input.moveX, input.moveZ, boosting, dt);
    const horizSpd = Math.hypot(s.vx, s.vz);
    if (horizSpd > maxSpd) {
      s.vx = (s.vx / horizSpd) * maxSpd;
      s.vz = (s.vz / horizSpd) * maxSpd;
    }
    if (horizSpd > 0.5) {
      s.stridePhase += horizSpd * dt * 0.85;
    }
  } else {
    // Airborne carving
    if (moveLen > 0.05) {
      s.vx += nx * SKATER_TUNE.airAccel * (boosting ? 1.3 : 1) * dt;
      s.vz += nz * SKATER_TUNE.airAccel * (boosting ? 1.3 : 1) * dt;
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
      s.yaw += diff * Math.min(1, dt * 8);
      s.lean = Math.max(-0.35, Math.min(0.35, diff * 0.45));
    } else {
      s.lean *= Math.max(0, 1 - dt * 8);
    }
    s.carveSlip *= Math.max(0, 1 - dt * 6);
    s.pitch *= Math.max(0, 1 - dt * 6);
    s.roll *= Math.max(0, 1 - dt * 6);
  }

  // Jump & Double Jump (Air Jump)
  if (jumpEdge) {
    if (s.grounded || s.wallRiding) {
      s.vy = SKATER_TUNE.jumpVel;
      s.grounded = false;
      s.wallRiding = false;
      s.airJumpsLeft = s.maxAirJumps;
      res.jumpTriggered = true;
    } else if (s.airJumpsLeft > 0) {
      s.airJumpsLeft--;
      s.vy = SKATER_TUNE.airJumpVel;
      if (moveLen > 0.05) {
        s.vx += nx * 4.5;
        s.vz += nz * 4.5;
      }
      s.trickSpin = Math.PI * 2;
      s.comboMult++;
      s.comboScore += 120;
      s.comboTimer = Math.max(s.comboTimer, 2.5);
      s.lastTrickName = 'Aether Air-Jump';
      s.activeTrickAnim = 'frontflip';
      res.airJumpTriggered = true;
      res.trickTriggered = 'Aether Air-Jump';
      res.trickAnim = 'frontflip';
    }
  }

  // Mid-air directional trick or Ground Cess Spin
  if (trickEdge) {
    if (!s.grounded) {
      const picked = pickAirTrick(s, input.moveX, input.moveZ);
      s.comboMult++;
      s.comboScore += picked.pts;
      s.comboTimer = 2.6;
      s.lastTrickName = picked.name;
      s.activeTrickAnim = picked.anim;
      if (picked.anim === 'spin360' || picked.anim === 'cork') s.trickSpin = Math.PI * 2;
      s.boost = Math.min(100, s.boost + picked.boost);
      res.trickTriggered = picked.name;
      res.trickAnim = picked.anim;
    } else if (Math.hypot(s.vx, s.vz) > 4.5 && s.groundTrickCooldown <= 0) {
      s.comboMult++;
      s.comboScore += 140;
      s.comboTimer = Math.max(s.comboTimer, 2.4);
      s.groundTrickCooldown = 0.55;
      s.lastTrickName = 'Cess Spin';
      s.activeTrickAnim = 'groundSpin';
      s.trickSpin = Math.PI * 2;
      s.boost = Math.min(100, s.boost + 8);
      res.trickTriggered = 'Cess Spin';
      res.trickAnim = 'groundSpin';
    }
  }

  // Gravity & integration
  if (!s.grounded) {
    s.vy -= SKATER_TUNE.gravity * (s.wallRiding ? 0.35 : 1) * dt;
    s.airTime += dt;
  } else {
    s.airTime = 0;
  }

  const nextX = s.grounded ? s.x : s.x + s.vx * dt;
  const nextZ = s.grounded ? s.z : s.z + s.vz * dt;
  const nextY = s.y + s.vy * dt;

  // Building side wall collisions (with wall-ride support!)
  s.x = nextX;
  s.z = nextZ;
  const wasWallRiding = s.wallRiding;
  s.wallRiding = false;
  s.wallSide = 0;
  const r = 0.65;
  let bumpedWall = false;
  for (const b of doc.data.buildings) {
    const top = b.yBase + b.h;
    if (nextY >= b.yBase && nextY < top - 0.6) {
      const halfW = b.w * 0.5 + r;
      const halfD = b.d * 0.5 + r;
      const dx = s.x - b.x;
      const dz = s.z - b.z;
      if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
        bumpedWall = true;
        const penX = halfW - Math.abs(dx);
        const penZ = halfD - Math.abs(dz);
        if (penX < penZ) {
          const wnx = Math.sign(dx || 1);
          s.x = b.x + wnx * halfW;
          s.vx = 0;
          if (!s.grounded && Math.abs(s.vz) > 4) {
            s.wallRiding = true;
            s.yaw = Math.atan2(s.vx, s.vz);
            const rx = -Math.cos(s.yaw);
            s.wallSide = wnx * rx >= 0 ? -1 : 1;
            s.airJumpsLeft = s.maxAirJumps;
          }
        } else {
          const wnz = Math.sign(dz || 1);
          s.z = b.z + wnz * halfD;
          s.vz = 0;
          if (!s.grounded && Math.abs(s.vx) > 4) {
            s.wallRiding = true;
            s.yaw = Math.atan2(s.vx, s.vz);
            const rz = Math.sin(s.yaw);
            s.wallSide = wnz * rz >= 0 ? -1 : 1;
            s.airJumpsLeft = s.maxAirJumps;
          }
        }
      }
    }
  }
  if (s.wallRiding && !wasWallRiding) res.wallRideStarted = true;

  // Keep inside island bounds (bounce back onto edge if near rim)
  const limX = doc.bounds.w * 0.5 - 2;
  const limZ = doc.bounds.d * 0.5 - 2;
  if (Math.abs(s.x) > limX) {
    s.x = Math.sign(s.x) * limX;
    s.vx *= -0.4;
    bumpedWall = true;
  }
  if (Math.abs(s.z) > limZ) {
    s.z = Math.sign(s.z) * limZ;
    s.vz *= -0.4;
    bumpedWall = true;
  }
  if (bumpedWall) {
    if (!s.wallRiding) res.bumped = true;
    if (s.grounded) {
      syncChassisFromSkater(s.chassis, s.x, s.y, s.z, s.vx, s.vz, s.yaw);
    }
  }

  // Rail snap check (when airborne or pressing grind)
  if (prevButtons.railCooldown <= 0 && (!s.grounded || input.grind)) {
    const near = nearestRailPoint(doc.data.rails, s.x, nextY, s.z);
    if (near && near.dist <= SKATER_TUNE.railSnapDist && s.vy <= 4) {
      s.grinding = true;
      s.grounded = false;
      s.airJumpsLeft = s.maxAirJumps;
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
      s.activeTrickAnim = 'grindHop';
      res.trickTriggered = 'Ley-Line Grind';
      res.trickAnim = 'grindHop';
      res.grindStarted = true;
      return res;
    }
  }

  // Surface landing
  const surfY = sampleSurfaceHeight(doc, s.x, s.z, s.y);
  if (nextY <= surfY + 0.08 && s.vy <= 0.5) {
    const wasAir = !s.grounded;
    if (wasAir && s.airTime > 0.12) {
      res.landed = true;
      res.landImpact = Math.abs(s.vy);
    }
    s.y = surfY;
    s.vy = 0;
    s.grounded = true;
    s.airJumpsLeft = s.maxAirJumps;
    if (wasAir) {
      syncChassisFromSkater(s.chassis, s.x, s.y, s.z, s.vx, s.vz, s.yaw);
    }
  } else {
    s.y = nextY;
    if (nextY > surfY + 0.25) s.grounded = false;
  }

  s.speedKmh = Math.round(Math.hypot(s.vx, s.vy, s.vz) * 3.6);

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
