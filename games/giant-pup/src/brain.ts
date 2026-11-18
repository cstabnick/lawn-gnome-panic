// The dog's behaviour and the ball. Plain data plus THREE vectors; no DOM, no meshes.
// main.ts reads dog.pose / dog.x / dog.z / dog.yaw to place the rig, and handles the returned events.
import * as THREE from 'three';
import {
  BALL_GRAVITY,
  BALL_RADIUS,
  DOGHOUSE_POS,
  DOG_RADIUS,
  DOG_RUN_SPEED,
  DOG_TURN_RATE,
  DOG_WALK_SPEED,
  FOOD_BOWL_POS,
  GNOME_POS,
  PRAISE_WINDOW,
  TRICK_SECONDS,
  WATER_BOWL_POS,
  YARD_HALF,
  type TrickId,
} from './config';
import type { DogPose } from './dog';
import * as sim from './sim';

export type DogEvent =
  | { kind: 'ate' }
  | { kind: 'drank' }
  | { kind: 'fetched' }
  | { kind: 'pickedUp' }
  | { kind: 'trick'; trick: TrickId; ok: boolean }
  | { kind: 'praised'; trick: TrickId }
  | { kind: 'fellAsleep' }
  | { kind: 'wokeUp' }
  | { kind: 'bark' }
  | { kind: 'shookOff' }
  | { kind: 'ballLanded'; speed: number };

type Act =
  | { kind: 'idle'; t: number }
  | { kind: 'goto'; x: number; z: number; run: boolean; then: 'idle' | 'eat' | 'drink' | 'sleep' | 'bath' | 'face' }
  | { kind: 'eat'; t: number }
  | { kind: 'drink'; t: number }
  | { kind: 'chase' }
  | { kind: 'return' }
  | { kind: 'trick'; trick: TrickId; t: number; ok: boolean }
  | { kind: 'confused'; t: number }
  | { kind: 'petted'; t: number }
  | { kind: 'sleep' }
  | { kind: 'bath' }
  | { kind: 'shakeOff'; t: number };

export type BallState = 'hand' | 'flying' | 'ground' | 'carried' | 'away';

/** The spot in front of the gnome where the dog sits to face the player. */
export const FRONT = { x: GNOME_POS.x, z: GNOME_POS.z - 3.6 } as const;
/** Where the dog stands for a bath. */
export const BATH_SPOT = { x: 0, z: 1.5 } as const;

const FOOD_SPOT = { x: FOOD_BOWL_POS.x + 0.2, z: FOOD_BOWL_POS.z - 2.6 };
const WATER_SPOT = { x: WATER_BOWL_POS.x - 0.2, z: WATER_BOWL_POS.z - 2.6 };
const SLEEP_SPOT = { x: DOGHOUSE_POS.x, z: DOGHOUSE_POS.z + 3.2 };

function angleTo(fromX: number, fromZ: number, toX: number, toZ: number): number {
  return Math.atan2(toX - fromX, toZ - fromZ);
}
function wrap(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export class Dog {
  x = 0;
  z = 0;
  yaw = 0;
  /** Current ground speed (units/s), for the gait. */
  speed = 0;
  pose: DogPose = 'stand';
  act: Act = { kind: 'idle', t: 2 };
  /** Food/water currently in the bowls (main shows it). */
  foodInBowl = false;
  waterInBowl = false;

  ball = new THREE.Vector3(GNOME_POS.x, 1, GNOME_POS.z);
  ballVel = new THREE.Vector3();
  ballState: BallState = 'away';

  private lastTrick: { trick: TrickId; at: number } | null = null;
  private clock = 0;
  private barkCd = 4;
  private events: DogEvent[] = [];

  constructor(private s: sim.PetState, private rand: () => number = Math.random) {
    this.x = FRONT.x;
    this.z = FRONT.z - 2;
    this.yaw = 0;
  }

  /** True while the dog is doing something the player started (tricks and bowls are refused). */
  get busy(): boolean {
    const k = this.act.kind;
    return k === 'eat' || k === 'drink' || k === 'chase' || k === 'return' || k === 'trick' || k === 'shakeOff' ||
      (k === 'goto' && this.act.then !== 'idle' && this.act.then !== 'face');
  }
  get asleep(): boolean {
    return this.act.kind === 'sleep';
  }
  get bathing(): boolean {
    return this.act.kind === 'bath' || (this.act.kind === 'goto' && this.act.then === 'bath');
  }

  // ---- commands from the player ----

  fillFood(): boolean {
    if (this.foodInBowl) return false;
    this.foodInBowl = true;
    if (!this.busy && !this.bathing) this.wake(), (this.act = { kind: 'goto', ...FOOD_SPOT, run: true, then: 'eat' });
    return true;
  }
  fillWater(): boolean {
    if (this.waterInBowl) return false;
    this.waterInBowl = true;
    if (!this.busy && !this.bathing) this.wake(), (this.act = { kind: 'goto', ...WATER_SPOT, run: true, then: 'drink' });
    return true;
  }

  /** Walk over to a tapped spot. */
  call(x: number, z: number): void {
    if (this.busy || this.bathing) return;
    this.wake();
    const lim = YARD_HALF - DOG_RADIUS;
    this.act = { kind: 'goto', x: THREE.MathUtils.clamp(x, -lim, lim), z: THREE.MathUtils.clamp(z, -lim, GNOME_POS.z - 2.5), run: false, then: 'face' };
  }

  /** Come to the gnome (used when entering a mode or asking for a trick from afar). */
  comeHere(): void {
    if (this.busy || this.bathing) return;
    this.wake();
    this.act = { kind: 'goto', ...FRONT, run: true, then: 'face' };
  }

  startBath(): void {
    this.wake();
    if (this.ballState === 'carried') this.dropBall();
    this.act = { kind: 'goto', ...BATH_SPOT, run: false, then: 'bath' };
  }
  endBath(): void {
    if (this.bathing) this.act = { kind: 'shakeOff', t: 1.4 };
  }

  readyBall(): void {
    if (this.ballState === 'away') this.ballState = 'hand';
  }
  hideBall(): void {
    if (this.ballState === 'carried' && (this.act.kind === 'return' || this.act.kind === 'chase')) this.act = { kind: 'idle', t: 1 };
    this.ballState = 'away';
  }

  throwBall(vel: THREE.Vector3): boolean {
    if (this.ballState !== 'hand') return false;
    this.ball.set(GNOME_POS.x + 0.4, 1.6, GNOME_POS.z - 0.4);
    this.ballVel.copy(vel);
    this.ballState = 'flying';
    if (!this.bathing && this.act.kind !== 'eat' && this.act.kind !== 'drink') {
      this.wake();
      this.act = { kind: 'chase' };
    }
    return true;
  }

  trick(t: TrickId): void {
    if (this.busy || this.bathing) return;
    this.wake();
    const ok = sim.attemptTrick(this.s, t, this.rand());
    this.yaw = angleTo(this.x, this.z, GNOME_POS.x, GNOME_POS.z);
    if (ok) {
      this.act = { kind: 'trick', trick: t, t: TRICK_SECONDS[t], ok };
      this.lastTrick = { trick: t, at: this.clock + TRICK_SECONDS[t] };
    } else {
      this.act = { kind: 'confused', t: 1.6 };
    }
    this.events.push({ kind: 'trick', trick: t, ok });
  }

  /** The player is stroking the dog (px moved this frame). Returns true if it counts as praise this frame. */
  petting(px: number): void {
    if (this.act.kind === 'sleep') {
      this.wake();
    }
    if (this.act.kind === 'idle' || this.act.kind === 'petted' || (this.act.kind === 'goto' && this.act.then === 'face')) {
      this.act = { kind: 'petted', t: 1.2 };
      this.speed = 0;
    }
    sim.pet(this.s, px);
    if (this.lastTrick && this.clock - this.lastTrick.at < PRAISE_WINDOW && this.clock >= this.lastTrick.at - TRICK_SECONDS[this.lastTrick.trick]) {
      sim.praise(this.s, this.lastTrick.trick);
      this.events.push({ kind: 'praised', trick: this.lastTrick.trick });
      this.lastTrick = null;
    }
  }

  scrubbing(px: number): void {
    if (this.act.kind === 'bath') sim.scrub(this.s, px);
  }

  /** Advance one frame; returns what happened. */
  update(dt: number): DogEvent[] {
    this.clock += dt;
    this.updateBall(dt);
    this.think(dt);
    const out = this.events;
    this.events = [];
    return out;
  }

  // ---- internals ----

  private wake(): void {
    if (this.act.kind === 'sleep') {
      this.act = { kind: 'idle', t: 1 };
      this.events.push({ kind: 'wokeUp' });
    }
  }

  private dropBall(): void {
    this.ballState = 'ground';
    this.ball.set(this.x + Math.sin(this.yaw) * 2.6, BALL_RADIUS, this.z + Math.cos(this.yaw) * 2.6);
    this.ballVel.set(0, 0, 0);
  }

  /** Mouth position in the world (rough; main snaps the ball to the rig's mouth while carried). */
  private mouthX(): number { return this.x + Math.sin(this.yaw) * 2.8; }
  private mouthZ(): number { return this.z + Math.cos(this.yaw) * 2.8; }

  private updateBall(dt: number): void {
    if (this.ballState !== 'flying' && this.ballState !== 'ground') return;
    const b = this.ball, v = this.ballVel;
    if (this.ballState === 'flying') {
      v.y -= BALL_GRAVITY * dt;
      b.addScaledVector(v, dt);
      if (b.y <= BALL_RADIUS) {
        b.y = BALL_RADIUS;
        const impact = -v.y;
        if (impact > 3) {
          v.y = impact * 0.45;
          v.x *= 0.7;
          v.z *= 0.7;
          this.events.push({ kind: 'ballLanded', speed: impact });
        } else {
          v.y = 0;
          this.ballState = 'ground';
        }
      }
    } else {
      const f = Math.max(0, 1 - 2.2 * dt);
      v.x *= f;
      v.z *= f;
      b.x += v.x * dt;
      b.z += v.z * dt;
    }
    // Fence: bounce back in.
    const lim = YARD_HALF - BALL_RADIUS;
    if (Math.abs(b.x) > lim) { b.x = Math.sign(b.x) * lim; v.x *= -0.5; }
    if (Math.abs(b.z) > lim) { b.z = Math.sign(b.z) * lim; v.z *= -0.5; }
  }

  private moveToward(tx: number, tz: number, maxSpeed: number, dt: number, stopDist = 0.25): boolean {
    const dx = tx - this.x, dz = tz - this.z;
    const d = Math.hypot(dx, dz);
    if (d < stopDist) {
      this.speed = 0;
      return true;
    }
    const want = Math.atan2(dx, dz);
    const diff = wrap(want - this.yaw);
    this.yaw = wrap(this.yaw + THREE.MathUtils.clamp(diff, -DOG_TURN_RATE * dt, DOG_TURN_RATE * dt));
    // Slow down for sharp turns and on arrival.
    const turnFactor = Math.max(0.25, Math.cos(diff));
    const target = Math.min(maxSpeed, d * 2.5) * turnFactor;
    this.speed += (target - this.speed) * Math.min(1, dt * 6);
    this.x += Math.sin(this.yaw) * this.speed * dt;
    this.z += Math.cos(this.yaw) * this.speed * dt;
    this.keepInYard();
    return false;
  }

  private keepInYard(): void {
    const lim = YARD_HALF - DOG_RADIUS;
    this.x = THREE.MathUtils.clamp(this.x, -lim, lim);
    this.z = THREE.MathUtils.clamp(this.z, -lim, lim);
    // Never stand on the gnome.
    const dx = this.x - GNOME_POS.x, dz = this.z - GNOME_POS.z;
    const d = Math.hypot(dx, dz), min = DOG_RADIUS + 1.2;
    if (d < min && d > 1e-4) {
      this.x = GNOME_POS.x + (dx / d) * min;
      this.z = GNOME_POS.z + (dz / d) * min;
    }
  }

  private faceToward(tx: number, tz: number, dt: number): void {
    const diff = wrap(angleTo(this.x, this.z, tx, tz) - this.yaw);
    this.yaw = wrap(this.yaw + THREE.MathUtils.clamp(diff, -DOG_TURN_RATE * 0.6 * dt, DOG_TURN_RATE * 0.6 * dt));
  }

  private think(dt: number): void {
    const a = this.act;
    const s = this.s;
    const walkSpeed = DOG_WALK_SPEED * (0.7 + 0.3 * sim.willingness(s));
    const runSpeed = DOG_RUN_SPEED * (0.6 + 0.4 * Math.min(1, s.energy / 50));

    switch (a.kind) {
      case 'idle': {
        this.speed *= Math.max(0, 1 - dt * 6);
        this.pose = 'stand';
        if (s.energy < 50 || sim.mood(s) === 'sad') this.pose = 'sit';
        this.faceToward(GNOME_POS.x, GNOME_POS.z, dt);
        a.t -= dt;
        this.barkCd -= dt;
        if (this.barkCd <= 0) {
          this.barkCd = 6 + this.rand() * 10;
          if (s.fun < 40 || s.hunger < 30 || s.thirst < 30) this.events.push({ kind: 'bark' });
        }
        if (a.t > 0) break;
        // Pick something to do.
        if (s.energy < 15) {
          this.act = { kind: 'goto', ...SLEEP_SPOT, run: false, then: 'sleep' };
        } else if (this.foodInBowl && s.hunger < 95) {
          this.act = { kind: 'goto', ...FOOD_SPOT, run: true, then: 'eat' };
        } else if (this.waterInBowl && s.thirst < 95) {
          this.act = { kind: 'goto', ...WATER_SPOT, run: true, then: 'drink' };
        } else if (this.ballState === 'ground') {
          this.act = { kind: 'chase' };
        } else if (this.rand() < 0.45) {
          const r = 4 + this.rand() * 8, ang = this.rand() * Math.PI * 2;
          this.act = { kind: 'goto', x: Math.sin(ang) * r, z: Math.min(GNOME_POS.z - 4, Math.cos(ang) * r - 2), run: false, then: 'idle' };
        } else if (s.fun < 50) {
          this.act = { kind: 'goto', ...FRONT, run: false, then: 'face' };
        } else {
          a.t = 2 + this.rand() * 4;
        }
        break;
      }
      case 'goto': {
        const arrived = this.moveToward(a.x, a.z, a.run ? runSpeed : walkSpeed, dt);
        this.pose = this.speed > DOG_WALK_SPEED * 1.2 ? 'run' : this.speed > 0.2 ? 'walk' : 'stand';
        if (!arrived) break;
        if (a.then === 'eat') {
          if (this.foodInBowl) this.act = { kind: 'eat', t: 3 };
          else this.act = { kind: 'idle', t: 1 };
          this.yaw = angleTo(this.x, this.z, FOOD_BOWL_POS.x, FOOD_BOWL_POS.z);
        } else if (a.then === 'drink') {
          if (this.waterInBowl) this.act = { kind: 'drink', t: 2.5 };
          else this.act = { kind: 'idle', t: 1 };
          this.yaw = angleTo(this.x, this.z, WATER_BOWL_POS.x, WATER_BOWL_POS.z);
        } else if (a.then === 'sleep') {
          this.act = { kind: 'sleep' };
          this.yaw = 0;
          this.events.push({ kind: 'fellAsleep' });
        } else if (a.then === 'bath') {
          this.act = { kind: 'bath' };
        } else {
          this.act = { kind: 'idle', t: 3 + this.rand() * 3 };
        }
        break;
      }
      case 'eat':
      case 'drink': {
        this.speed = 0;
        this.pose = 'eat';
        a.t -= dt;
        if (a.t <= 0) {
          if (a.kind === 'eat') {
            this.foodInBowl = false;
            sim.feed(s);
            this.events.push({ kind: 'ate' });
          } else {
            this.waterInBowl = false;
            sim.water(s);
            this.events.push({ kind: 'drank' });
          }
          this.act = { kind: 'idle', t: 1.5 };
        }
        break;
      }
      case 'chase': {
        if (this.ballState === 'hand' || this.ballState === 'away') {
          this.act = { kind: 'idle', t: 1 };
          break;
        }
        if (this.ballState === 'flying') {
          // Run under where the ball is heading, a little ahead of it.
          const lead = 0.35;
          this.moveToward(this.ball.x + this.ballVel.x * lead, this.ball.z + this.ballVel.z * lead, runSpeed, dt, 0.5);
        } else {
          const reached = Math.hypot(this.ball.x - this.mouthX(), this.ball.z - this.mouthZ()) < 1.3;
          if (reached) {
            this.ballState = 'carried';
            this.ballVel.set(0, 0, 0);
            this.events.push({ kind: 'pickedUp' });
            this.act = { kind: 'return' };
          } else {
            // Aim the mouth (not the body centre) at the ball.
            const tx = this.ball.x - Math.sin(this.yaw) * 2.4, tz = this.ball.z - Math.cos(this.yaw) * 2.4;
            const close = Math.hypot(this.ball.x - this.x, this.ball.z - this.z) < 3.4;
            this.moveToward(close ? this.ball.x : tx, close ? this.ball.z : tz, runSpeed, dt, 0.1);
          }
        }
        this.pose = this.speed > DOG_WALK_SPEED * 1.2 ? 'run' : 'walk';
        break;
      }
      case 'return': {
        const arrived = this.moveToward(FRONT.x, FRONT.z, runSpeed * 0.8, dt, 0.4);
        this.pose = this.speed > DOG_WALK_SPEED * 1.2 ? 'run' : this.speed > 0.2 ? 'walk' : 'sit';
        if (arrived) {
          this.yaw = angleTo(this.x, this.z, GNOME_POS.x, GNOME_POS.z);
          this.ballState = 'hand';
          sim.fetchDone(s);
          this.events.push({ kind: 'fetched' });
          this.act = { kind: 'idle', t: 2 };
        }
        break;
      }
      case 'trick': {
        this.speed = 0;
        this.pose = a.trick;
        a.t -= dt;
        if (a.t <= 0) this.act = { kind: 'idle', t: 2 };
        break;
      }
      case 'confused': {
        this.speed = 0;
        this.pose = 'tilt';
        a.t -= dt;
        if (a.t <= 0) this.act = { kind: 'idle', t: 1 };
        break;
      }
      case 'petted': {
        this.speed = 0;
        this.pose = s.energy < 30 ? 'lie' : 'beg';
        a.t -= dt;
        if (a.t <= 0) this.act = { kind: 'idle', t: 2 };
        break;
      }
      case 'sleep': {
        this.speed = 0;
        this.pose = 'sleep';
        sim.nap(s, dt);
        if (s.energy >= 95) {
          this.act = { kind: 'idle', t: 1 };
          this.events.push({ kind: 'wokeUp' });
        }
        break;
      }
      case 'bath': {
        this.speed = 0;
        this.pose = 'sit';
        this.faceToward(GNOME_POS.x, GNOME_POS.z, dt);
        break;
      }
      case 'shakeOff': {
        this.speed = 0;
        this.pose = 'shakeoff';
        if (a.t === 1.4) this.events.push({ kind: 'shookOff' });
        a.t -= dt;
        if (a.t <= 0) this.act = { kind: 'idle', t: 1 };
        break;
      }
    }
  }
}
