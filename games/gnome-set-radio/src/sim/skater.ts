import { getAllRails, groundHeightAt, nearestRailPoint, sampleSurfaceHeight } from '../levels/loader';
import type { GsrArenaShape, GsrLevelDoc, GsrRail } from '../levels/schema';
import { createSkateChassis, stepGroundChassis, syncChassisFromSkater, type SkateChassis } from './skateVehicle';

export type TrickAnimKind = 'frontflip' | 'spin360' | 'grab' | 'cork' | 'grindHop' | 'groundSpin';
export type BreakdanceMove = 'headspin' | 'windmill' | 'airfreeze';

export interface SkaterInput {
  /** Desired movement direction in world XZ (-1..1). */
  moveX: number;
  moveZ: number;
  jump: boolean;
  grind: boolean;
  trick: boolean;
  boost: boolean;
  brake?: boolean;
  dance?: boolean;
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
  braking: boolean;
  danceMove: BreakdanceMove | null;
  danceTimer: number;
  danceIndex: number;
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
  coyoteTimer: number;
  jumpBufferTimer: number;
  wallNormalX: number;
  wallNormalZ: number;
  maxCombo: number;
  onBeatCount: number;
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
  wallKickTriggered: boolean;
  boostStarted: boolean;
  bumped: boolean;
  wallRideStarted: boolean;
  grindStarted: boolean;
  danceStarted: BreakdanceMove | null;
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
    braking: false,
    danceMove: null,
    danceTimer: 0,
    danceIndex: 0,
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
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    wallNormalX: 0,
    wallNormalZ: 0,
    maxCombo: 1,
    onBeatCount: 0,
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
  prevButtons: { jump: boolean; trick: boolean; railCooldown: number; dance?: boolean },
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
    wallKickTriggered: false,
    boostStarted: false,
    bumped: false,
    wallRideStarted: false,
    grindStarted: false,
    danceStarted: null,
  };
  prevButtons.railCooldown = Math.max(0, prevButtons.railCooldown - dt);
  s.groundTrickCooldown = Math.max(0, s.groundTrickCooldown - dt);

  if (!s.chassis) {
    s.chassis = createSkateChassis(doc, s.x, s.y, s.z, s.yaw);
  }

  const jumpEdge = input.jump && !prevButtons.jump;
  const trickEdge = input.trick && !prevButtons.trick;
  const danceEdge = !!input.dance && !prevButtons.dance;
  prevButtons.jump = input.jump;
  prevButtons.trick = input.trick;
  prevButtons.dance = !!input.dance;

  s.coyoteTimer = s.grounded || s.wallRiding ? 0.13 : Math.max(0, s.coyoteTimer - dt);
  s.jumpBufferTimer = jumpEdge ? 0.13 : Math.max(0, s.jumpBufferTimer - dt);

  const wasBoosting = s.boosting;
  const boosting = input.boost && s.boost > 2;
  s.boosting = boosting;
  s.braking = false;
  if (boosting && !wasBoosting) res.boostStarted = true;
  if (boosting) s.boost = Math.max(0, s.boost - 24 * dt);
  else s.boost = Math.min(100, s.boost + 4 * dt);

  // Decay trick spin visual
  if (s.trickSpin > 0) s.trickSpin = Math.max(0, s.trickSpin - dt * 6);

  // Handle Rail Grinding
  if (s.grinding && s.railId) {
    s.airJumpsLeft = s.maxAirJumps;
    const rail = getAllRails(doc).find((r) => r.id === s.railId);
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
        } else if (adv.ended && adv.ty >= -0.05) {
          s.vy = Math.max(s.vy, 5.5);
          s.grounded = false;
        }
        syncChassisFromSkater(s.chassis, s.x, s.y, s.z, s.vx, s.vz, s.yaw);
      }
      s.maxCombo = Math.max(s.maxCombo, s.comboMult);
      return res;
    }
  }

  // Horizontal carving & momentum (plus Brake & Breakdance)
  const moveLen = Math.hypot(input.moveX, input.moveZ);
  const nx = moveLen > 0.05 ? input.moveX / Math.max(1, moveLen) : 0;
  const nz = moveLen > 0.05 ? input.moveZ / Math.max(1, moveLen) : 0;
  const maxSpd = boosting ? SKATER_TUNE.boostSpeed : SKATER_TUNE.maxSpeed;

  const DANCE_MOVES: readonly BreakdanceMove[] = ['headspin', 'windmill', 'airfreeze'];
  const DANCE_NAMES: Record<BreakdanceMove, string> = {
    headspin: 'Headspin',
    windmill: 'Windmill Flare',
    airfreeze: 'Aether Air-Freeze',
  };

  if (s.grounded && danceEdge) {
    const move = DANCE_MOVES[s.danceIndex % DANCE_MOVES.length]!;
    s.danceIndex++;
    s.danceMove = move;
    s.danceTimer = 0;
    s.vx *= 0.2;
    s.vz *= 0.2;
    syncChassisFromSkater(s.chassis, s.x, s.y, s.z, s.vx, s.vz, s.yaw);
    s.comboMult++;
    s.comboScore += 180;
    s.comboTimer = 2.8;
    s.lastTrickName = DANCE_NAMES[move];
    res.trickTriggered = DANCE_NAMES[move];
    res.danceStarted = move;
  } else if (s.danceMove) {
    if (!s.grounded || moveLen > 0.25 || jumpEdge || boosting) {
      s.danceMove = null;
    } else {
      s.danceTimer += dt;
      s.vx *= Math.max(0, 1 - 10 * dt);
      s.vz *= Math.max(0, 1 - 10 * dt);
      s.comboScore += Math.round(90 * dt);
      s.comboTimer = Math.max(s.comboTimer, 2.2);
      s.boost = Math.min(100, s.boost + 12 * dt);
      syncChassisFromSkater(s.chassis, s.x, s.y, s.z, s.vx, s.vz, s.yaw);
    }
  }

  if (s.grounded) {
    if (s.danceMove) {
      // Hold position while breakdancing
    } else if (input.brake) {
      s.braking = true;
      const damp = Math.max(0, 1 - 7.5 * dt);
      s.vx *= damp;
      s.vz *= damp;
      s.x += s.vx * dt;
      s.z += s.vz * dt;
      syncChassisFromSkater(s.chassis, s.x, s.y, s.z, s.vx, s.vz, s.yaw);
    } else {
      stepGroundChassis(s.chassis, s, input.moveX, input.moveZ, boosting, dt);
      const horizSpd = Math.hypot(s.vx, s.vz);
      if (horizSpd > maxSpd) {
        s.vx = (s.vx / horizSpd) * maxSpd;
        s.vz = (s.vz / horizSpd) * maxSpd;
      }
      if (horizSpd > 0.5) {
        s.stridePhase += horizSpd * dt * 0.85;
      }
    }
  } else {
    s.danceMove = null;
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

  // Jump, Wall-Kick, Coyote Jump, Buffered Jump & Double Jump (Air Jump)
  if (s.jumpBufferTimer > 0 && (s.grounded || s.wallRiding || s.coyoteTimer > 0)) {
    const hasWall = s.wallRiding || (!s.grounded && (s.wallNormalX !== 0 || s.wallNormalZ !== 0));
    if (hasWall) {
      s.vx += s.wallNormalX * 9.5;
      s.vz += s.wallNormalZ * 9.5;
      s.vy = SKATER_TUNE.jumpVel * 1.08;
      if (Math.hypot(s.vx, s.vz) > 0.2) s.yaw = Math.atan2(s.vx, s.vz);
      s.comboMult++;
      s.comboScore += 180;
      s.comboTimer = 2.6;
      s.trickSpin = Math.PI * 2;
      s.lastTrickName = 'Wall-Kick';
      s.activeTrickAnim = 'spin360';
      res.trickTriggered = 'Wall-Kick';
      res.trickAnim = 'spin360';
      res.wallKickTriggered = true;
    } else {
      s.vy = SKATER_TUNE.jumpVel;
      res.jumpTriggered = true;
    }
    s.grounded = false;
    s.wallRiding = false;
    s.wallNormalX = 0;
    s.wallNormalZ = 0;
    s.coyoteTimer = 0;
    s.jumpBufferTimer = 0;
    s.airJumpsLeft = s.maxAirJumps;
  } else if (jumpEdge && s.airJumpsLeft > 0) {
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
    s.jumpBufferTimer = 0;
    res.airJumpTriggered = true;
    res.trickTriggered = 'Aether Air-Jump';
    res.trickAnim = 'frontflip';
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
    if (nextY >= b.yBase - 0.8 && nextY < top - 0.85) {
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
            s.wallNormalX = wnx;
            s.wallNormalZ = 0;
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
            s.wallNormalX = 0;
            s.wallNormalZ = wnz;
            s.yaw = Math.atan2(s.vx, s.vz);
            const rz = Math.sin(s.yaw);
            s.wallSide = wnz * rz >= 0 ? -1 : 1;
            s.airJumpsLeft = s.maxAirJumps;
          }
        }
      }
    }
  }
  if (!s.wallRiding && s.coyoteTimer <= 0) {
    s.wallNormalX = 0;
    s.wallNormalZ = 0;
  }
  if (s.wallRiding && !wasWallRiding) res.wallRideStarted = true;

  // Solid cylinder collision against static props & billboard posts
  for (const prop of doc.props) {
    const sc = prop.scale ?? 1;
    const py = groundHeightAt(doc, prop.x, prop.z);
    if (nextY < py - 0.5 || nextY > py + 1.8 * sc) continue;
    const minR = r + 0.65 * sc;
    const dx = s.x - prop.x;
    const dz = s.z - prop.z;
    const d = Math.hypot(dx, dz);
    if (d < minR) {
      const nxP = d > 1e-4 ? dx / d : 1;
      const nzP = d > 1e-4 ? dz / d : 0;
      s.x = prop.x + nxP * minR;
      s.z = prop.z + nzP * minR;
      const vn = s.vx * nxP + s.vz * nzP;
      if (vn < 0) {
        s.vx -= vn * nxP;
        s.vz -= vn * nzP;
      }
      bumpedWall = true;
    }
  }
  for (const bb of doc.data.billboards) {
    if (nextY < bb.y - 0.5 || nextY > bb.y + bb.h - 0.15) continue;
    const minR = r + 0.75;
    const dx = s.x - bb.x;
    const dz = s.z - bb.z;
    const d = Math.hypot(dx, dz);
    if (d < minR) {
      const nxB = d > 1e-4 ? dx / d : 1;
      const nzB = d > 1e-4 ? dz / d : 0;
      s.x = bb.x + nxB * minR;
      s.z = bb.z + nzB * minR;
      const vn = s.vx * nxB + s.vz * nzB;
      if (vn < 0) {
        s.vx -= vn * nxB;
        s.vz -= vn * nzB;
      }
      bumpedWall = true;
    }
  }

  // Keep inside island bounds (respecting arenaShape perimeter)
  const limX = doc.bounds.w * 0.5 - 2;
  const limZ = doc.bounds.d * 0.5 - 2;
  if (clampToArenaPerimeter(s, doc.data.arenaShape, limX, limZ)) {
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
    const near = nearestRailPoint(getAllRails(doc), s.x, nextY, s.z);
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
    s.wallNormalX = 0;
    s.wallNormalZ = 0;
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

  s.maxCombo = Math.max(s.maxCombo, s.comboMult);
  return res;
}

function bounceInward(s: SkaterState, nx: number, nz: number): void {
  const vn = s.vx * nx + s.vz * nz;
  if (vn < 0) {
    s.vx -= 1.4 * vn * nx;
    s.vz -= 1.4 * vn * nz;
  }
}

function clampToArenaPerimeter(
  s: SkaterState,
  shape: GsrArenaShape | undefined,
  limX: number,
  limZ: number,
): boolean {
  let bumped = false;

  if (shape === 'dome-atrium' || shape === 'vinyl-disc' || shape === 'spiral-spire') {
    const maxR = Math.min(limX, limZ) * (shape === 'spiral-spire' ? 0.88 : 1);
    const dist = Math.hypot(s.x, s.z);
    if (dist > maxR && dist > 1e-4) {
      const nx = -s.x / dist;
      const nz = -s.z / dist;
      s.x = (s.x / dist) * maxR;
      s.z = (s.z / dist) * maxR;
      bounceInward(s, nx, nz);
      bumped = true;
    }
    return bumped;
  }

  if (shape === 's-curve-viaduct') {
    if (Math.abs(s.z) > limZ) {
      s.z = Math.sign(s.z) * limZ;
      s.vz *= -0.4;
      bumped = true;
    }
    const u = Math.max(-1, Math.min(1, s.z / limZ));
    const wave = 0.28 * Math.sin(u * Math.PI);
    const minX = -limX * (0.68 - wave);
    const maxX = limX * (0.68 + wave);
    if (s.x < minX) {
      s.x = minX;
      s.vx = Math.abs(s.vx) * 0.4;
      bumped = true;
    } else if (s.x > maxX) {
      s.x = maxX;
      s.vx = -Math.abs(s.vx) * 0.4;
      bumped = true;
    }
    return bumped;
  }

  if (shape === 'canyon-alley') {
    if (Math.abs(s.z) > limZ) {
      s.z = Math.sign(s.z) * limZ;
      s.vz *= -0.4;
      bumped = true;
    }
    const az = Math.abs(s.z) / limZ;
    const maxHalfX = az < 0.14 ? 0.9 * limX : az < 0.46 ? 0.5 * limX : 0.66 * limX;
    if (Math.abs(s.x) > maxHalfX) {
      s.x = Math.sign(s.x) * maxHalfX;
      s.vx *= -0.4;
      bumped = true;
    }
    return bumped;
  }

  // Outer box clamp for rectangular, octagonal, diamond, and cross decks
  if (Math.abs(s.x) > limX) {
    s.x = Math.sign(s.x) * limX;
    s.vx *= -0.4;
    bumped = true;
  }
  if (Math.abs(s.z) > limZ) {
    s.z = Math.sign(s.z) * limZ;
    s.vz *= -0.4;
    bumped = true;
  }

  if (shape === 'hedged-diamond' || shape === 'octagonal-plaza' || shape === 'crucible-ring') {
    const maxSum = shape === 'hedged-diamond' ? 1.22 : shape === 'crucible-ring' ? 1.52 : 1.72;
    const sum = Math.abs(s.x) / limX + Math.abs(s.z) / limZ;
    if (sum > maxSum) {
      const sx = s.x >= 0 ? 1 : -1;
      const sz = s.z >= 0 ? 1 : -1;
      const ax = sx / limX;
      const az = sz / limZ;
      const denom = ax * ax + az * az;
      const excess = sum - maxSum;
      s.x -= (excess * ax) / denom;
      s.z -= (excess * az) / denom;
      const invLen = 1 / Math.sqrt(denom);
      bounceInward(s, -ax * invLen, -az * invLen);
      bumped = true;
    }
  } else if (shape === 'relay-cross') {
    const armX = limX * 0.46;
    const armZ = limZ * 0.46;
    if (Math.abs(s.x) > armX && Math.abs(s.z) > armZ) {
      const penX = Math.abs(s.x) - armX;
      const penZ = Math.abs(s.z) - armZ;
      if (penX < penZ) {
        s.x = Math.sign(s.x) * armX;
        s.vx *= -0.4;
      } else {
        s.z = Math.sign(s.z) * armZ;
        s.vz *= -0.4;
      }
      bumped = true;
    }
  }

  return bumped;
}
