import {
  billboardObbCollision,
  buildArenaOutline2D,
  buildingHorizontalCollision,
  clampPointToPolygon,
  getPropCollisionRadius,
  satelliteSurfaceAt,
} from '../levels/collision';
import { getAllRails, groundHeightAt, nearestRailPoint, sampleSurfaceHeight } from '../levels/loader';
import type { GsrLevelDoc, GsrRail } from '../levels/schema';
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
  speedMode?: boolean;
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
  speedMode: boolean;
  airDashCooldown: number;
  bumpCooldown: number;
  unmultipliedScore: number;
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
  airDashTriggered: boolean;
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
    speedMode: false,
    airDashCooldown: 0,
    bumpCooldown: 0,
    unmultipliedScore: 0,
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
  prevButtons: { jump: boolean; trick: boolean; railCooldown: number; dance?: boolean; boost?: boolean },
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
    airDashTriggered: false,
    wallKickTriggered: false,
    boostStarted: false,
    bumped: false,
    wallRideStarted: false,
    grindStarted: false,
    danceStarted: null,
  };
  prevButtons.railCooldown = Math.max(0, prevButtons.railCooldown - dt);
  s.groundTrickCooldown = Math.max(0, s.groundTrickCooldown - dt);
  s.airDashCooldown = Math.max(0, s.airDashCooldown - dt);
  s.bumpCooldown = Math.max(0, s.bumpCooldown - dt);

  if (!s.chassis) {
    s.chassis = createSkateChassis(doc, s.x, s.y, s.z, s.yaw);
  }

  const jumpEdge = input.jump && !prevButtons.jump;
  const trickEdge = input.trick && !prevButtons.trick;
  const danceEdge = !!input.dance && !prevButtons.dance;
  const boostEdge = input.boost && !prevButtons.boost;
  prevButtons.jump = input.jump;
  prevButtons.trick = input.trick;
  prevButtons.dance = !!input.dance;
  prevButtons.boost = input.boost;

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
    s.speedMode = !!input.speedMode;
    const rail = getAllRails(doc).find((r) => r.id === s.railId);
    if (!rail) {
      s.grinding = false;
      s.railId = null;
    } else {
      const incomingSpd = Math.hypot(s.vx, s.vz);
      const baseRailSpd = SKATER_TUNE.railSpeed * (rail.speedBoost ?? 1.2) * (boosting ? 1.2 : 1);
      const speed = Math.max(baseRailSpd, incomingSpd * (boosting ? 1.02 : 0.998));
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
      const grindPts = Math.round(120 * dt);
      s.comboScore += grindPts;
      s.unmultipliedScore += grindPts;
      s.comboTimer = 2.4;
      s.boost = Math.min(100, s.boost + 14 * dt);

      if (trickEdge) {
        const name = s.comboMult % 2 === 0 ? 'Switch Stance' : 'One-Foot Grind';
        s.comboMult++;
        s.comboScore += 200;
        s.unmultipliedScore += 200;
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

  s.speedMode = !!input.speedMode && !s.danceMove && !input.brake;

  if (s.grounded) {
    if (s.danceMove) {
      // Hold position while breakdancing
    } else if (input.brake) {
      s.braking = true;
      s.speedMode = false;
      const damp = Math.max(0, 1 - 7.5 * dt);
      s.vx *= damp;
      s.vz *= damp;
      s.x += s.vx * dt;
      s.z += s.vz * dt;
      syncChassisFromSkater(s.chassis, s.x, s.y, s.z, s.vx, s.vz, s.yaw);
    } else {
      const preVx = s.vx;
      const preVz = s.vz;
      const preSpd = Math.hypot(preVx, preVz);
      stepGroundChassis(s.chassis, s, input.moveX, input.moveZ, boosting, dt, s.speedMode);
      const horizSpd = Math.hypot(s.vx, s.vz);
      if (s.speedMode) {
        // Speed Mode preserves momentum with minimal drag and wider arcs
        const keepSpd = Math.max(horizSpd, preSpd * Math.exp(-0.12 * dt));
        if (keepSpd > horizSpd) {
          if (horizSpd > 0.2) {
            s.vx = (s.vx / horizSpd) * keepSpd;
            s.vz = (s.vz / horizSpd) * keepSpd;
          } else if (preSpd > 0.2) {
            s.vx = (preVx / preSpd) * keepSpd;
            s.vz = (preVz / preSpd) * keepSpd;
          }
          syncChassisFromSkater(s.chassis, s.x, s.y, s.z, s.vx, s.vz, s.yaw);
        }
      } else if (horizSpd > maxSpd) {
        // Exiting Speed Mode or landing fast decays excess speed smoothly instead of snapping
        const decayed = maxSpd + (horizSpd - maxSpd) * Math.exp(-1.35 * dt);
        s.vx = (s.vx / horizSpd) * decayed;
        s.vz = (s.vz / horizSpd) * decayed;
        syncChassisFromSkater(s.chassis, s.x, s.y, s.z, s.vx, s.vz, s.yaw);
      }
      const finalSpd = Math.hypot(s.vx, s.vz);
      if (finalSpd > 0.5) {
        s.stridePhase += finalSpd * dt * 0.85;
      }
    }
  } else {
    s.danceMove = null;
    // Air Dash (boost edge while airborne): forward speed capped, sideways speed uncapped
    if (!s.wallRiding && boostEdge && s.boost >= 16 && s.airDashCooldown <= 0) {
      s.boost = Math.max(0, s.boost - 16);
      s.airDashCooldown = 0.35;
      res.airDashTriggered = true;
      const fx = Math.sin(s.yaw);
      const fz = Math.cos(s.yaw);
      const rx = -fz;
      const rz = fx;
      const dx = moveLen > 0.05 ? nx : fx;
      const dz = moveLen > 0.05 ? nz : fz;
      s.vx += dx * 12.5;
      s.vz += dz * 12.5;
      s.vy = Math.max(s.vy, 2.5);
      const vFwd = s.vx * fx + s.vz * fz;
      const vSide = s.vx * rx + s.vz * rz;
      const clampedFwd = Math.min(34, vFwd);
      s.vx = fx * clampedFwd + rx * vSide;
      s.vz = fz * clampedFwd + rz * vSide;
    }

    // Airborne carving (preserves momentum above maxSpd)
    const preAirSpd = Math.hypot(s.vx, s.vz);
    if (moveLen > 0.05) {
      const airScale = s.speedMode ? 0.55 : 1;
      s.vx += nx * SKATER_TUNE.airAccel * airScale * (boosting ? 1.3 : 1) * dt;
      s.vz += nz * SKATER_TUNE.airAccel * airScale * (boosting ? 1.3 : 1) * dt;
    }
    const horizSpd = Math.hypot(s.vx, s.vz);
    const airCap = Math.max(maxSpd, preAirSpd * Math.exp(-0.25 * dt));
    if (horizSpd > airCap) {
      s.vx = (s.vx / horizSpd) * airCap;
      s.vz = (s.vz / horizSpd) * airCap;
    }
    if (horizSpd > 0.5) {
      const targetYaw = Math.atan2(s.vx, s.vz);
      let diff = targetYaw - s.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      s.yaw += diff * Math.min(1, dt * (s.speedMode ? 3.5 : 8));
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

  // Finer-grain building, prop, billboard & polygon perimeter collisions
  s.x = nextX;
  s.z = nextZ;
  const wasWallRiding = s.wallRiding;
  s.wallRiding = false;
  s.wallSide = 0;
  const r = 0.65;
  let maxImpactSpd = 0;

  for (const b of doc.data.buildings) {
    const hit = buildingHorizontalCollision(b, s.x, s.z, nextY, r);
    if (hit) {
      const impact = -(s.vx * hit.nx + s.vz * hit.nz);
      if (impact > maxImpactSpd) maxImpactSpd = impact;
      s.x = hit.x;
      s.z = hit.z;
      const vn = s.vx * hit.nx + s.vz * hit.nz;
      if (vn < 0) {
        s.vx -= vn * hit.nx;
        s.vz -= vn * hit.nz;
      }
      if (!s.grounded && hit.axisAligned) {
        const tangentSpd = Math.abs(hit.nx) > 0.5 ? Math.abs(s.vz) : Math.abs(s.vx);
        if (tangentSpd > 4) {
          s.wallRiding = true;
          s.wallNormalX = hit.nx;
          s.wallNormalZ = hit.nz;
          s.yaw = Math.atan2(s.vx, s.vz);
          const rightComp = Math.abs(hit.nx) > 0.5 ? hit.nx * -Math.cos(s.yaw) : hit.nz * Math.sin(s.yaw);
          s.wallSide = rightComp >= 0 ? -1 : 1;
          s.airJumpsLeft = s.maxAirJumps;
        }
      }
    }
  }
  if (!s.wallRiding && s.coyoteTimer <= 0) {
    s.wallNormalX = 0;
    s.wallNormalZ = 0;
  }
  if (s.wallRiding && !wasWallRiding) res.wallRideStarted = true;

  for (const prop of doc.props) {
    const sc = prop.scale ?? 1;
    const py = groundHeightAt(doc, prop.x, prop.z);
    if (nextY < py - 0.5 || nextY > py + 1.8 * sc) continue;
    const minR = r + getPropCollisionRadius(prop.prefab, sc);
    const dx = s.x - prop.x;
    const dz = s.z - prop.z;
    const d = Math.hypot(dx, dz);
    if (d < minR) {
      const nxP = d > 1e-4 ? dx / d : 1;
      const nzP = d > 1e-4 ? dz / d : 0;
      const impact = -(s.vx * nxP + s.vz * nzP);
      if (impact > maxImpactSpd) maxImpactSpd = impact;
      s.x = prop.x + nxP * minR;
      s.z = prop.z + nzP * minR;
      const vn = s.vx * nxP + s.vz * nzP;
      if (vn < 0) {
        s.vx -= vn * nxP;
        s.vz -= vn * nzP;
      }
    }
  }

  for (const bb of doc.data.billboards) {
    const hit = billboardObbCollision(bb, s.x, s.z, nextY, r);
    if (hit) {
      const impact = -(s.vx * hit.nx + s.vz * hit.nz);
      if (impact > maxImpactSpd) maxImpactSpd = impact;
      s.x = hit.x;
      s.z = hit.z;
      const vn = s.vx * hit.nx + s.vz * hit.nz;
      if (vn < 0) {
        s.vx -= vn * hit.nx;
        s.vz -= vn * hit.nz;
      }
    }
  }

  // Keep inside island bounds (exact arenaShape polygon, bypassed when over a satellite island)
  const overSatellite = satelliteSurfaceAt(doc.data.satellites, s.x, s.z, s.y + 4) !== null;
  if (!overSatellite) {
    const limX = doc.bounds.w * 0.5 - 2;
    const limZ = doc.bounds.d * 0.5 - 2;
    const poly = getPerimeterPoly(doc, limX, limZ);
    const clamped = clampPointToPolygon(s.x, s.z, poly);
    if (clamped.clamped) {
      const impact = -(s.vx * clamped.nx + s.vz * clamped.nz);
      if (impact > maxImpactSpd) maxImpactSpd = impact;
      s.x = clamped.x;
      s.z = clamped.z;
      bounceInward(s, clamped.nx, clamped.nz);
    }
  }

  if (maxImpactSpd > 0) {
    if (!s.wallRiding && maxImpactSpd > 3.5 && s.bumpCooldown <= 0) {
      res.bumped = true;
      s.bumpCooldown = 0.42;
    }
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

const perimeterCache = new WeakMap<GsrLevelDoc, [number, number][]>();

function getPerimeterPoly(doc: GsrLevelDoc, limX: number, limZ: number): [number, number][] {
  let poly = perimeterCache.get(doc);
  if (!poly) {
    poly = buildArenaOutline2D(doc.data.arenaShape, limX, limZ);
    perimeterCache.set(doc, poly);
  }
  return poly;
}

function bounceInward(s: SkaterState, nx: number, nz: number): void {
  const vn = s.vx * nx + s.vz * nz;
  if (vn < 0) {
    s.vx -= 1.4 * vn * nx;
    s.vz -= 1.4 * vn * nz;
  }
}
