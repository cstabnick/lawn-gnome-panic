import * as THREE from 'three';
import { Mountain, RaycastHit } from './mountain';
import { SoundEngine } from './audio';
import { clamp } from './math';

export type PlayerMode = 'grounded' | 'airborne' | 'climbing' | 'downed' | 'summited' | 'dancing' | 'waving';

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  grab: boolean;
}

export interface PitonAnchor {
  id: string;
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
}

export class ClimbingController {
  readonly pos = new THREE.Vector3(0, 0.55, 12);
  readonly vel = new THREE.Vector3();
  readonly wallNormal = new THREE.Vector3(0, 0, 1);
  readonly grabPoint = new THREE.Vector3();

  yaw = 0;
  pitch = 0.25; // Start looking slightly up at the mountain!
  mode: PlayerMode = 'grounded';

  stamina = 130;
  readonly maxStamina = 130;
  hp = 100;
  readonly maxHp = 100;

  pitonsLeft = 2;
  activeCheckpoint = 0;
  climbTimeSec = 0;
  hasSummited = false;

  // Juice / feedback state
  cameraShake = 0;
  handBob = 0;
  dancePhase = 0;
  nearPiton = false;
  nearCampfire = false;
  canGrabTarget: RaycastHit | null = null;

  private readonly radius = 0.5;
  private readonly eyeOffset = 0.72;
  private readonly grabReach = 2.15;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private prevJump = false;
  private grabCooldown = 0;
  private exhaustedTimer = 0;
  private staminaRegenDelay = 0;
  private maxAirDownSpeed = 0;
  private readonly climbTargetPos = new THREE.Vector3();
  private reelTimer = 0;

  constructor(private readonly mountain: Mountain, private readonly sound: SoundEngine) {
    this.respawnAtCheckpoint(0);
  }

  getEyePosition(out = new THREE.Vector3()): THREE.Vector3 {
    const tiltOffset = this.mode === 'downed' ? -0.35 : 0;
    return out.set(this.pos.x, this.pos.y + this.eyeOffset + tiltOffset, this.pos.z);
  }

  getLookDirection(out = new THREE.Vector3()): THREE.Vector3 {
    const cosPitch = Math.cos(this.pitch);
    return out.set(
      -Math.sin(this.yaw) * cosPitch,
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * cosPitch
    ).normalize();
  }

  respawnAtCheckpoint(cpIndex = this.activeCheckpoint): void {
    const cp = this.mountain.checkpoints[cpIndex] ?? this.mountain.checkpoints[0];
    this.pos.set(cp.x, cp.y + this.radius + 0.2, cp.z);
    this.vel.set(0, 0, 0);
    this.mode = 'grounded';
    this.stamina = this.maxStamina;
    this.hp = this.maxHp;
    this.exhaustedTimer = 0;
    this.grabCooldown = 0;
    this.maxAirDownSpeed = 0;
  }

  revive(): void {
    if (this.mode !== 'downed') return;
    this.mode = 'grounded';
    this.hp = 55;
    this.stamina = 65;
    this.vel.set(0, 0, 0);
  }

  toggleDance(): void {
    if (this.mode === 'dancing') {
      this.mode = this.hasSummited ? 'summited' : 'grounded';
      return;
    }
    if (this.mode === 'grounded' || this.mode === 'summited' || this.mode === 'waving') {
      this.mode = 'dancing';
      this.dancePhase = 0;
      this.vel.set(0, 0, 0);
    }
  }

  toggleWave(): void {
    if (this.mode === 'waving') {
      this.mode = this.hasSummited ? 'summited' : 'grounded';
      return;
    }
    if (this.mode === 'grounded' || this.mode === 'summited' || this.mode === 'dancing') {
      this.mode = 'waving';
      this.dancePhase = 0;
      this.vel.set(0, 0, 0);
    }
  }

  private findGrabHit(): RaycastHit | null {
    const eye = this.getEyePosition();
    const dir = this.getLookDirection();
    const direct = this.mountain.raycast(eye, dir, this.grabReach);
    if (direct.hit) return direct;

    // Forgiving cone fallback for catching ledges in mid-air
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, dir).normalize();
    const offsets = [
      [0, 0.09],
      [0, -0.09],
      [0.09, 0],
      [-0.09, 0],
    ];
    for (const [ox, oy] of offsets) {
      const probe = dir.clone().addScaledVector(right, ox).addScaledVector(up, oy).normalize();
      const hit = this.mountain.raycast(eye, probe, this.grabReach);
      if (hit.hit) return hit;
    }
    return null;
  }

  update(dt: number, input: InputState, pitons: readonly PitonAnchor[]): void {
    const clampedDt = Math.min(dt, 0.05);
    if (!this.hasSummited) {
      this.climbTimeSec += clampedDt;
    }

    this.cameraShake = Math.max(0, this.cameraShake - clampedDt * 2.5);
    this.grabCooldown = Math.max(0, this.grabCooldown - clampedDt);
    this.exhaustedTimer = Math.max(0, this.exhaustedTimer - clampedDt);
    this.staminaRegenDelay = Math.max(0, this.staminaRegenDelay - clampedDt);
    this.reelTimer = Math.max(0, this.reelTimer - clampedDt);

    // Edge-detect jump
    const jumpPressed = input.jump && !this.prevJump;
    this.prevJump = input.jump;
    if (jumpPressed) {
      this.jumpBufferTimer = 0.14;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - clampedDt);
    }

    // Check proximity to pitons and campfire checkpoints
    this.nearPiton = false;
    for (const p of pitons) {
      const dSq =
        (this.pos.x - p.x) ** 2 +
        (this.pos.y - p.y) ** 2 +
        (this.pos.z - p.z) ** 2;
      if (dSq < 2.6 * 2.6) {
        this.nearPiton = true;
        break;
      }
    }

    this.nearCampfire = false;
    for (const cp of this.mountain.checkpoints) {
      const d = Math.hypot(this.pos.x - cp.x, this.pos.y - cp.y, this.pos.z - cp.z);
      if (d < cp.radius) {
        this.nearCampfire = true;
        if (cp.index > this.activeCheckpoint) {
          this.activeCheckpoint = cp.index;
          this.pitonsLeft = Math.min(2, this.pitonsLeft + 1);
        }
      }
    }

    // Check summit reach
    if (!this.hasSummited && this.pos.distanceTo(this.mountain.summitPos) < 5.5) {
      this.hasSummited = true;
      this.mode = 'summited';
      this.sound.playSummit();
    }

    // Update grab target preview for HUD crosshair
    this.canGrabTarget = this.mode !== 'downed' ? this.findGrabHit() : null;

    if (this.mode === 'downed') {
      this.vel.x *= 0.85;
      this.vel.z *= 0.85;
      this.vel.y -= 24 * clampedDt;
      this.pos.addScaledVector(this.vel, clampedDt);
      const col = this.mountain.collideSphere(this.pos, this.radius);
      if (col.grounded && this.vel.y < 0) this.vel.y = 0;
      this.sound.updateAmbience(this.pos.y, 0, clampedDt);
      return;
    }

    // Cancel dance/wave if player moves, jumps, or grabs
    if (this.mode === 'dancing' || this.mode === 'waving') {
      if (input.forward || input.backward || input.left || input.right || input.jump || input.grab) {
        this.mode = this.hasSummited ? 'summited' : 'grounded';
      } else {
        this.dancePhase += clampedDt * 8.5;
        const regen = this.nearCampfire ? 48 : 18;
        this.stamina = Math.min(this.maxStamina, this.stamina + regen * clampedDt);
        this.sound.updateAmbience(this.pos.y, 0, clampedDt);
        return;
      }
    }

    // Try initiating grab if holding grab button
    if (
      this.mode !== 'climbing' &&
      input.grab &&
      this.grabCooldown <= 0 &&
      this.exhaustedTimer <= 0 &&
      this.stamina >= 10 &&
      this.canGrabTarget
    ) {
      this.startClimb(this.canGrabTarget);
    }

    if (this.mode === 'climbing') {
      this.updateClimbing(clampedDt, input);
    } else {
      this.updateFreeMovement(clampedDt, input);
    }

    this.sound.updateAmbience(this.pos.y, this.vel.length(), clampedDt);
  }

  private startClimb(hit: RaycastHit): void {
    const catchPenalty = this.vel.y < -3 ? Math.min(16, (-this.vel.y - 3) * 1.3) : 0;
    const grabCost = 7 + catchPenalty;
    this.stamina = Math.max(0, this.stamina - grabCost);
    this.staminaRegenDelay = 0.65;
    if (this.stamina <= 0) {
      this.exhaustedTimer = 1.4;
      this.cameraShake = 0.5;
      this.sound.playSlip();
      return;
    }

    this.mode = 'climbing';
    this.wallNormal.copy(hit.normal).normalize();
    this.grabPoint.copy(hit.point);
    this.vel.set(0, 0, 0);
    this.maxAirDownSpeed = 0;

    // Smoothly reel into the hold rather than teleporting upward (prevents spam-click climbing)
    this.climbTargetPos.copy(hit.point).addScaledVector(this.wallNormal, 0.62);
    this.reelTimer = 0.22;
    this.sound.playGrab();
  }

  private updateClimbing(dt: number, input: InputState): void {
    if (!input.grab) {
      this.mode = 'airborne';
      this.grabCooldown = 0.24;
      return;
    }

    // Wall Lunge / Dyno Jump!
    if (this.jumpBufferTimer > 0 && this.stamina >= 20) {
      this.jumpBufferTimer = 0;
      this.stamina = Math.max(0, this.stamina - 24);
      this.staminaRegenDelay = 0.75;
      const look = this.getLookDirection();
      this.vel.set(
        look.x * 2.8 + this.wallNormal.x * 1.2,
        Math.max(5.6, 5.6 + look.y * 2.2),
        look.z * 2.8 + this.wallNormal.z * 1.2
      );
      this.mode = 'airborne';
      this.grabCooldown = 0.28;
      this.sound.playLunge();
      return;
    }

    // Smooth reel-in right after initial grab
    if (this.reelTimer > 0) {
      this.pos.lerp(this.climbTargetPos, clamp(dt * 5.5, 0, 1));
    }

    // Surface tangent basis
    const worldUp = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(worldUp, this.wallNormal);
    if (right.lengthSq() < 1e-4) {
      right.set(1, 0, 0);
    } else {
      right.normalize();
    }
    const tangentUp = new THREE.Vector3().crossVectors(this.wallNormal, right).normalize();

    const moveUp = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
    const moveRight = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const isMoving = moveUp !== 0 || moveRight !== 0;

    // Stamina drain based on wall steepness (halved near pitons)
    let drainRate = 4.5;
    if (isMoving) {
      if (this.wallNormal.y >= 0.1) drainRate = 15;
      else if (this.wallNormal.y >= -0.15) drainRate = 20;
      else drainRate = 28;
    } else if (this.nearPiton) {
      drainRate = 0; // Rest on piton!
    }
    if (this.nearPiton) drainRate *= 0.5;

    this.staminaRegenDelay = 0.65;
    this.stamina = Math.max(0, this.stamina - drainRate * dt);
    if (this.stamina <= 0) {
      // Exhaustion slip!
      this.mode = 'airborne';
      this.exhaustedTimer = 1.4;
      this.cameraShake = 0.6;
      this.vel.copy(this.wallNormal).multiplyScalar(2.0);
      this.sound.playSlip();
      return;
    }

    const baseClimbSpeed = 1.45;
    const moveVec = new THREE.Vector3()
      .addScaledVector(tangentUp, moveUp)
      .addScaledVector(right, moveRight);
    if (moveVec.lengthSq() > 1) moveVec.normalize();

    if (isMoving) {
      this.handBob += dt * 5.2;
      this.sound.playClimbStep();
    }

    const pulse = isMoving ? 1 + 0.25 * Math.sin(this.handBob * 2) : 1;
    const climbSpeed = baseClimbSpeed * pulse;
    this.pos.addScaledVector(moveVec, climbSpeed * dt);
    this.vel.copy(moveVec).multiplyScalar(climbSpeed);

    // Probe rock surface to hug contour
    const intoWall = this.wallNormal.clone().negate();
    const probeOrigin = this.pos.clone().addScaledVector(this.wallNormal, 0.35);
    const hit = this.mountain.raycast(probeOrigin, intoWall, 1.8);

    if (hit.hit) {
      this.wallNormal.lerp(hit.normal, clamp(dt * 14, 0, 1)).normalize();
      this.grabPoint.copy(hit.point);
      const targetPos = hit.point.clone().addScaledVector(this.wallNormal, 0.62);
      this.pos.lerp(targetPos, clamp(dt * 18, 0, 1));
    } else if (moveUp > 0) {
      // Check for ledge mantle / top-out!
      const mantleOrigin = this.pos
        .clone()
        .add(new THREE.Vector3(0, 1.15, 0))
        .addScaledVector(intoWall, 0.75);
      const topHit = this.mountain.raycast(mantleOrigin, new THREE.Vector3(0, -1, 0), 1.6);
      if (topHit.hit && topHit.isWalkable) {
        this.pos.set(topHit.point.x, topHit.point.y + this.radius + 0.08, topHit.point.z);
        this.vel.set(intoWall.x * 2.2, 2.0, intoWall.z * 2.2);
        this.mode = 'grounded';
        this.sound.playGrab();
        return;
      }
      this.mode = 'airborne';
      return;
    } else {
      this.mode = 'airborne';
      return;
    }

    const col = this.mountain.collideSphere(this.pos, this.radius);
    // If climbing down onto walkable ground, release cleanly
    if (col.grounded && moveUp < 0) {
      this.mode = 'grounded';
      this.vel.set(0, 0, 0);
    }
  }

  private updateFreeMovement(dt: number, input: InputState): void {
    const forwardXZ = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const rightXZ = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const wish = new THREE.Vector3();
    if (input.forward) wish.add(forwardXZ);
    if (input.backward) wish.sub(forwardXZ);
    if (input.right) wish.add(rightXZ);
    if (input.left) wish.sub(rightXZ);
    if (wish.lengthSq() > 0) wish.normalize();

    const sprinting = input.sprint && this.mode === 'grounded' && wish.lengthSq() > 0 && this.stamina > 2;
    const targetSpeed = sprinting ? 5.8 : 3.8;

    if (this.mode === 'grounded') {
      this.coyoteTimer = 0.12;
      const accel = 9;
      this.vel.x = THREE.MathUtils.lerp(this.vel.x, wish.x * targetSpeed, clamp(accel * dt, 0, 1));
      this.vel.z = THREE.MathUtils.lerp(this.vel.z, wish.z * targetSpeed, clamp(accel * dt, 0, 1));

      if (sprinting) {
        this.stamina = Math.max(0, this.stamina - 15 * dt);
        this.staminaRegenDelay = 0.55;
      } else {
        if (this.staminaRegenDelay <= 0) {
          const regen = this.nearCampfire ? 48 : 18;
          this.stamina = Math.min(this.maxStamina, this.stamina + regen * dt);
        }
        if (this.nearCampfire) {
          this.hp = Math.min(this.maxHp, this.hp + 18 * dt);
        }
      }
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
      const airAccel = 3.5;
      this.vel.x += wish.x * airAccel * dt;
      this.vel.z += wish.z * airAccel * dt;
    }

    // Jump
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.vel.y = 7.2;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.mode = 'airborne';
    }

    // Gravity
    this.vel.y -= 22 * dt;
    if (this.vel.y < -36) this.vel.y = -36;
    if (this.vel.y < 0) {
      this.maxAirDownSpeed = Math.max(this.maxAirDownSpeed, -this.vel.y);
    }

    // Integrate & collide
    this.pos.addScaledVector(this.vel, dt);
    const col = this.mountain.collideSphere(this.pos, this.radius);

    if (col.grounded) {
      if (this.vel.y < 0) {
        // Fall damage check
        if (this.maxAirDownSpeed > 14.5) {
          const dmg = (this.maxAirDownSpeed - 14.5) * 4.8;
          this.hp = Math.max(0, this.hp - dmg);
          this.cameraShake = Math.min(1, dmg / 40);
          this.sound.playImpact(Math.min(1, dmg / 50));
          if (this.hp <= 0) {
            this.mode = 'downed';
            this.vel.set(0, 0, 0);
            this.maxAirDownSpeed = 0;
            return;
          }
        } else if (this.maxAirDownSpeed > 6) {
          this.sound.playImpact(0.25);
        }
        this.vel.y = 0;
        this.maxAirDownSpeed = 0;
      }
      if (this.mode !== 'summited') this.mode = 'grounded';
    } else {
      if (this.mode !== 'summited') this.mode = 'airborne';
      if (col.wallHit) {
        // Slide along steep wall
        const vn = this.vel.dot(col.wallNormal);
        if (vn < 0) {
          this.vel.addScaledVector(col.wallNormal, -vn);
        }
      }
    }
  }
}
