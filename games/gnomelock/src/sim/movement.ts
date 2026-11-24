// Pure movement physics: weighty-yet-fast momentum, slide, stamina, jump, double-jump, wall-jump, dash-jump, and Flow State.
import { FLOW_BONUSES, MOVEMENT } from './config';
import { findNearbyWallNormal, resolveMapCollision } from './map';

export interface MoveInput {
  forward: number; // -1..1
  right: number;   // -1..1
  yaw: number;     // radians, 0 = -Z
  jumpPressed: boolean;
  dashPressed: boolean;
  slideHeld: boolean;
}

export interface MoveState {
  pos: { x: number; y: number; z: number };
  vel: { x: number; y: number; z: number };
  grounded: boolean;
  sliding: boolean;
  doubleJumpAvailable: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  dashTimer: number;
  dashDirX: number;
  dashDirZ: number;
  stamina: number;
  maxStamina: number;
  staminaRegenTimer: number;
  flipTimer: number;
  flowScore: number; // 0..100
  flowTier: 0 | 1 | 2 | 3;
  flowDecayTimer: number;
  outOfCombatTimer: number;
  wallJumpCooldown: number;
  speedBonus: number;
  statusSpeedMult: number;
  rootedTimer: number;
}

export interface MoveEvents {
  jumped: boolean;
  doubleJumped: boolean;
  wallJumped: boolean;
  dashed: boolean;
  dashJumped: boolean;
  startedSlide: boolean;
  reachedFlowTier3: boolean;
}

export function createMoveState(x: number, y: number, z: number, maxStamina = 3): MoveState {
  return {
    pos: { x, y, z },
    vel: { x: 0, y: 0, z: 0 },
    grounded: true,
    sliding: false,
    doubleJumpAvailable: true,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    dashTimer: 0,
    dashDirX: 0,
    dashDirZ: -1,
    stamina: maxStamina,
    maxStamina,
    staminaRegenTimer: 0,
    flipTimer: 0,
    flowScore: 0,
    flowTier: 0,
    flowDecayTimer: 0,
    outOfCombatTimer: 0,
    wallJumpCooldown: 0,
    speedBonus: 0,
    statusSpeedMult: 1,
    rootedTimer: 0,
  };
}

function addFlow(m: MoveState, amount: number, events: MoveEvents): void {
  const prevTier = m.flowTier;
  m.flowScore = Math.min(100, m.flowScore + amount);
  m.flowDecayTimer = MOVEMENT.flowDecayS;
  m.flowTier = computeFlowTier(m.flowScore);
  if (m.flowTier === 3 && prevTier < 3) {
    events.reachedFlowTier3 = true;
  }
}

export function computeFlowTier(score: number): 0 | 1 | 2 | 3 {
  if (score >= MOVEMENT.flowTierThresholds[3]) return 3;
  if (score >= MOVEMENT.flowTierThresholds[2]) return 2;
  if (score >= MOVEMENT.flowTierThresholds[1]) return 1;
  return 0;
}

export function stepHeroMovement(m: MoveState, input: MoveInput, dt: number): MoveEvents {
  const events: MoveEvents = {
    jumped: false,
    doubleJumped: false,
    wallJumped: false,
    dashed: false,
    dashJumped: false,
    startedSlide: false,
    reachedFlowTier3: false,
  };

  if (dt <= 0) return events;

  m.wallJumpCooldown = Math.max(0, m.wallJumpCooldown - dt);
  m.flipTimer = Math.max(0, m.flipTimer - dt);
  m.outOfCombatTimer += dt;
  m.rootedTimer = Math.max(0, m.rootedTimer - dt);

  // Stamina regeneration
  const regenMult = FLOW_BONUSES[m.flowTier].staminaRegenMult;
  if (m.stamina < m.maxStamina) {
    m.stamina = Math.min(m.maxStamina, m.stamina + (dt / MOVEMENT.staminaRegenS) * regenMult);
  }

  // Flow decay
  if (m.flowDecayTimer > 0) {
    m.flowDecayTimer -= dt;
  } else if (m.flowScore > 0) {
    m.flowScore = Math.max(0, m.flowScore - 22 * dt);
    m.flowTier = computeFlowTier(m.flowScore);
  }

  // Timers
  if (m.grounded) {
    m.coyoteTimer = MOVEMENT.coyoteS;
    m.doubleJumpAvailable = true;
  } else {
    m.coyoteTimer = Math.max(0, m.coyoteTimer - dt);
  }

  if (input.jumpPressed) {
    m.jumpBufferTimer = MOVEMENT.jumpBufferS;
  } else {
    m.jumpBufferTimer = Math.max(0, m.jumpBufferTimer - dt);
  }

  // Wish direction in world space (yaw = 0 faces -Z)
  const sinY = Math.sin(input.yaw);
  const cosY = Math.cos(input.yaw);
  const fwdX = -sinY;
  const fwdZ = -cosY;
  const rightX = cosY;
  const rightZ = -sinY;

  let wishX = fwdX * input.forward + rightX * input.right;
  let wishZ = fwdZ * input.forward + rightZ * input.right;
  const wishLen = Math.hypot(wishX, wishZ);
  if (wishLen > 1e-4) {
    wishX /= wishLen;
    wishZ /= wishLen;
  }

  // Rooted check (still falls with gravity)
  if (m.rootedTimer > 0) {
    m.vel.x *= Math.max(0, 1 - 14 * dt);
    m.vel.z *= Math.max(0, 1 - 14 * dt);
    m.sliding = false;
  } else {
    // Dash initiation
    if (input.dashPressed && m.stamina >= 1 && m.dashTimer <= 0) {
      m.stamina -= 1;
      m.dashTimer = MOVEMENT.dashDurationS;
      if (wishLen > 1e-4) {
        m.dashDirX = wishX;
        m.dashDirZ = wishZ;
      } else {
        m.dashDirX = fwdX;
        m.dashDirZ = fwdZ;
      }
      m.vel.x = m.dashDirX * MOVEMENT.dashSpeed;
      m.vel.z = m.dashDirZ * MOVEMENT.dashSpeed;
      if (!m.grounded && m.vel.y < 1.2) {
        m.vel.y = 1.2;
      }
      m.sliding = false;
      events.dashed = true;
      addFlow(m, 18, events);
    }

    // Active dash
    if (m.dashTimer > 0) {
      const elapsed = MOVEMENT.dashDurationS - m.dashTimer;
      m.dashTimer = Math.max(0, m.dashTimer - dt);
      m.vel.x = m.dashDirX * MOVEMENT.dashSpeed;
      m.vel.z = m.dashDirZ * MOVEMENT.dashSpeed;

      // Dash-Jump sweet spot!
      if (
        m.jumpBufferTimer > 0 &&
        elapsed >= MOVEMENT.dashJumpWindowMin &&
        elapsed <= MOVEMENT.dashJumpWindowMax &&
        (m.grounded || m.coyoteTimer > 0)
      ) {
        m.jumpBufferTimer = 0;
        m.coyoteTimer = 0;
        m.dashTimer = 0;
        m.grounded = false;
        m.vel.y = MOVEMENT.jumpVel * 1.04;
        m.vel.x = m.dashDirX * (MOVEMENT.dashSpeed * 0.92);
        m.vel.z = m.dashDirZ * (MOVEMENT.dashSpeed * 0.92);
        m.stamina = Math.min(m.maxStamina, m.stamina + MOVEMENT.dashJumpStaminaRefund);
        events.dashJumped = true;
        addFlow(m, 30, events);
      }
    }

    // Jump / Wall-Jump / Double-Jump
    if (m.jumpBufferTimer > 0) {
      if (m.grounded || m.coyoteTimer > 0) {
        m.jumpBufferTimer = 0;
        m.coyoteTimer = 0;
        m.grounded = false;
        m.sliding = false;
        m.vel.y = MOVEMENT.jumpVel;
        events.jumped = true;
        addFlow(m, 10, events);
      } else if (m.wallJumpCooldown <= 0) {
        const wallN = findNearbyWallNormal(m.pos, MOVEMENT.wallDetectDist, MOVEMENT.heroHeight);
        if (wallN) {
          m.jumpBufferTimer = 0;
          m.wallJumpCooldown = 0.25;
          m.sliding = false;
          m.doubleJumpAvailable = true; // Wall-jump resets double jump!
          m.vel.y = MOVEMENT.wallJumpUpVel;
          m.vel.x = wallN.x * MOVEMENT.wallJumpOutVel + wishX * 3.5;
          m.vel.z = wallN.z * MOVEMENT.wallJumpOutVel + wishZ * 3.5;
          events.wallJumped = true;
          addFlow(m, 34, events);
        } else if (m.doubleJumpAvailable && m.stamina >= 1) {
          m.jumpBufferTimer = 0;
          m.stamina -= 1;
          m.doubleJumpAvailable = false;
          m.sliding = false;
          m.vel.y = MOVEMENT.doubleJumpVel;
          m.flipTimer = 0.45;
          if (wishLen > 1e-4) {
            const hSpeed = Math.max(MOVEMENT.runSpeed, Math.hypot(m.vel.x, m.vel.z));
            m.vel.x = wishX * hSpeed * 0.75 + m.vel.x * 0.25;
            m.vel.z = wishZ * hSpeed * 0.75 + m.vel.z * 0.25;
          }
          events.doubleJumped = true;
          addFlow(m, 16, events);
        }
      }
    }

    // Slide state
    const horizSpeed = Math.hypot(m.vel.x, m.vel.z);
    if (input.slideHeld && m.grounded && horizSpeed >= MOVEMENT.slideMinSpeed && m.dashTimer <= 0) {
      if (!m.sliding) {
        m.sliding = true;
        events.startedSlide = true;
        addFlow(m, 16, events);
      }
    } else if (!input.slideHeld || !m.grounded || horizSpeed < MOVEMENT.slideMinSpeed * 0.55) {
      m.sliding = false;
    }

    // Horizontal acceleration & friction (when not dashing)
    if (m.dashTimer <= 0) {
      const sprintBonus = m.outOfCombatTimer >= MOVEMENT.sprintOutOfCombatS ? MOVEMENT.sprintSpeed - MOVEMENT.runSpeed : 0;
      const topSpeed = (MOVEMENT.runSpeed + sprintBonus + m.speedBonus) * m.statusSpeedMult;

      if (m.grounded) {
        if (m.sliding) {
          // Low friction + slight steering
          const drop = Math.max(0, 1 - MOVEMENT.slideFriction * dt);
          m.vel.x *= drop;
          m.vel.z *= drop;
          if (wishLen > 1e-4) {
            m.vel.x += wishX * 6.0 * dt;
            m.vel.z += wishZ * 6.0 * dt;
          }
        } else {
          // Weighty-yet-snappy ground friction & accel
          const drop = Math.max(0, 1 - MOVEMENT.groundFriction * dt);
          m.vel.x *= drop;
          m.vel.z *= drop;
          if (wishLen > 1e-4) {
            const targetVx = wishX * topSpeed;
            const targetVz = wishZ * topSpeed;
            const blend = Math.min(1, MOVEMENT.groundAccel * dt / Math.max(1, topSpeed));
            m.vel.x += (targetVx - m.vel.x) * blend;
            m.vel.z += (targetVz - m.vel.z) * blend;
          }
        }
      } else {
        // Air control: preserves momentum while letting you curve
        const airDrop = Math.max(0, 1 - MOVEMENT.airDrag * dt);
        m.vel.x *= airDrop;
        m.vel.z *= airDrop;
        if (wishLen > 1e-4) {
          m.vel.x += wishX * MOVEMENT.airAccel * dt;
          m.vel.z += wishZ * MOVEMENT.airAccel * dt;
          const newHSpeed = Math.hypot(m.vel.x, m.vel.z);
          const cap = Math.max(topSpeed, MOVEMENT.slideMaxSpeed);
          if (newHSpeed > cap) {
            m.vel.x = (m.vel.x / newHSpeed) * cap;
            m.vel.z = (m.vel.z / newHSpeed) * cap;
          }
        }
      }
    }
  }

  // Gravity
  if (!m.grounded) {
    m.vel.y -= MOVEMENT.gravity * dt;
  }

  // Integrate position
  m.pos.x += m.vel.x * dt;
  m.pos.y += m.vel.y * dt;
  m.pos.z += m.vel.z * dt;

  // Map collision
  const height = m.sliding ? MOVEMENT.slideHeight : MOVEMENT.heroHeight;
  const col = resolveMapCollision(m.pos, m.vel, MOVEMENT.heroRadius, height);
  m.grounded = col.grounded;

  // Downhill slope boost when sliding!
  if (m.grounded && m.sliding) {
    const slopeX = col.groundNormal.x;
    const slopeZ = col.groundNormal.z;
    const slopeMag = Math.hypot(slopeX, slopeZ);
    if (slopeMag > 0.02) {
      const dirX = slopeX / slopeMag;
      const dirZ = slopeZ / slopeMag;
      m.vel.x += dirX * MOVEMENT.slideSlopeAccel * dt;
      m.vel.z += dirZ * MOVEMENT.slideSlopeAccel * dt;
      const spd = Math.hypot(m.vel.x, m.vel.z);
      if (spd > MOVEMENT.slideMaxSpeed) {
        m.vel.x = (m.vel.x / spd) * MOVEMENT.slideMaxSpeed;
        m.vel.z = (m.vel.z / spd) * MOVEMENT.slideMaxSpeed;
      }
      addFlow(m, 14 * dt, events);
    }
  }

  // Passive Flow reward for maintaining high speed (> 12.2 m/s)
  if (Math.hypot(m.vel.x, m.vel.z) > 12.2) {
    addFlow(m, 12 * dt, events);
  }

  return events;
}
