// Tuft hunting: the quarry simulation. Pure: plain data in, plain data out, no THREE, no DOM. The world reaches it
// through QuarryEnv (ground height, open land, a random source), so tests run without a scene.
import { HUNT, type HuntSpecies } from './species';

export type QuarryMode = 'graze' | 'walk' | 'wary' | 'flee' | 'rolled' | 'flying' | 'burrowed' | 'down' | 'hidden';

export interface Quarry {
  readonly id: number;
  readonly species: HuntSpecies;
  x: number; y: number; z: number;
  yaw: number;
  /** Ground speed this frame, units/s (drives the leg animation). */
  speed: number;
  homeX: number; homeZ: number; leash: number;
  mode: QuarryMode;
  /** Seconds left in the current mode. */
  modeT: number;
  goalX: number; goalZ: number;
  /** 0 calm .. 1 alarmed. */
  awareness: number;
  /** What it flees from (or what knocked it over). */
  fromX: number; fromZ: number;
  /** 0 standing .. 1 lying on its side. */
  tip: number;
  /** Height above the ground (a flushed bird in the air). */
  lift: number;
  /** > 0: combed recently, cannot be combed again yet (seconds). */
  combedT: number;
  /** Zigzag phase. */
  zig: number;
  /** Seconds to its next call. */
  callT: number;
  /** Distance of the shot that knocked it over (0 = none). */
  lastShotDist: number;
  /** Units moved since its last footprint (tracks.ts resets it). */
  moved: number;
}

export interface QuarryEnv {
  /** Ground height at (x, z). */
  ground(x: number, z: number): number;
  /** True when a circle of radius r at (x, z) is open land the quarry may stand on (its region, no water, no box, off the highways). */
  open(x: number, z: number, r: number): boolean;
  /** Random number in [0, 1). */
  rnd(): number;
}

export interface QuarryFrame {
  dt: number;
  playerX: number;
  playerZ: number;
  /** How loud the gnome is: 0.15 standing still, 0.45 walking, 1 running on foot, 1..2 in a moving vehicle. */
  noise: number;
  /** 0 day .. 1 night. */
  night: number;
  /** A gun went off at the player's position this frame. */
  shot: boolean;
}

const TAU = Math.PI * 2;
/** Tip rises or falls over this many seconds (1 / 0.35). */
const TIP_RATE = 1 / 0.35;
/** Flying quarry climb and land at this rate, units/s. */
const FLY_RATE = 3;
/** Knocked-over quarry lift falls at this rate, units/s. */
const LIFT_FALL = 6;
/** A flee target sits this far ahead of the quarry. */
const FLEE_STEP = 6;

/** Alarm sources queued by alarmQuarry, consumed by the next step (the from-point is kept, not the player's). */
const pendingAlarm = new WeakMap<Quarry, { x: number; z: number }>();

export function createQuarry(id: number, species: HuntSpecies, x: number, z: number, env: QuarryEnv, leash = 30): Quarry {
  return {
    id, species, x, y: env.ground(x, z), z, yaw: 0, speed: 0, homeX: x, homeZ: z, leash,
    mode: 'graze', modeT: 1, goalX: x, goalZ: z, awareness: 0, fromX: x, fromZ: z, tip: 0, lift: 0,
    combedT: 0, zig: 0, callT: species.callEvery[0], lastShotDist: 0, moved: 0,
  };
}

/** Smallest signed difference a - b, in (-PI, PI]. */
function angleDiff(a: number, b: number): number {
  const d = (a - b) % TAU;
  return d > Math.PI ? d - TAU : d < -Math.PI ? d + TAU : d;
}

/** Turns the quarry toward `want` at its turn rate. Returns the angle still left to turn. */
function turnToward(q: Quarry, want: number, dt: number): number {
  const maxTurn = q.species.turn * dt;
  q.yaw += Math.max(-maxTurn, Math.min(maxTurn, angleDiff(want, q.yaw)));
  return angleDiff(want, q.yaw);
}

/**
 * Moves toward (tx, tz) at speed v. Slows while facing away from the goal. Blocked by closed land unless flying.
 * Returns the distance left to the target.
 */
function moveTo(q: Quarry, env: QuarryEnv, tx: number, tz: number, v: number, dt: number, fly: boolean): number {
  const dx = tx - q.x, dz = tz - q.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.05 || v <= 0) { q.speed = 0; return d; }
  const left = turnToward(q, Math.atan2(dx, dz), dt);
  const speed = v * Math.max(0.25, Math.cos(Math.min(Math.PI / 2, Math.abs(left))));
  const step = Math.min(d, speed * dt);
  const nx = q.x + Math.sin(q.yaw) * step;
  const nz = q.z + Math.cos(q.yaw) * step;
  if (!fly && !env.open(nx, nz, q.species.radius + HUNT.roadMargin)) { q.speed = 0; return d; }
  q.speed = step / Math.max(dt, 1e-6);
  q.moved += step;
  q.x = nx;
  q.z = nz;
  return Math.hypot(tx - q.x, tz - q.z);
}

/** A point 6 units ahead of the quarry, pointing away from (fromX, fromZ), leaning home when far out. */
function awayTarget(q: Quarry, fromX: number, fromZ: number, zigAngle: number): { x: number; z: number } {
  let ux = q.x - fromX, uz = q.z - fromZ;
  if (Math.hypot(ux, uz) < 1e-3) { ux = Math.sin(q.yaw); uz = Math.cos(q.yaw); }
  if (zigAngle !== 0) {
    const c = Math.cos(zigAngle), s = Math.sin(zigAngle);
    const rx = ux * c + uz * s;
    uz = -ux * s + uz * c;
    ux = rx;
  }
  const l = Math.hypot(ux, uz) || 1;
  let gx = q.x + (ux / l) * FLEE_STEP;
  let gz = q.z + (uz / l) * FLEE_STEP;
  const hx = q.homeX - q.x, hz = q.homeZ - q.z;
  const hd = Math.hypot(hx, hz);
  if (hd > q.leash * 2) {
    gx += (hx / hd) * FLEE_STEP * 0.8;
    gz += (hz / hd) * FLEE_STEP * 0.8;
  }
  return { x: gx, z: gz };
}

/** Picks a wander goal inside the leash, on open land (home when none of 8 tries is open). */
function pickWander(q: Quarry, env: QuarryEnv): void {
  for (let t = 0; t < 8; t++) {
    const a = env.rnd() * TAU;
    const r = Math.sqrt(env.rnd()) * q.leash;
    const gx = q.homeX + Math.cos(a) * r, gz = q.homeZ + Math.sin(a) * r;
    if (env.open(gx, gz, q.species.radius + HUNT.roadMargin)) {
      q.goalX = gx;
      q.goalZ = gz;
      return;
    }
  }
  q.goalX = q.homeX;
  q.goalZ = q.homeZ;
}

/** The quarry's reaction to being alarmed: its style decides the mode. */
function react(q: Quarry, from: { x: number; z: number }): void {
  const sp = q.species;
  q.fromX = from.x;
  q.fromZ = from.z;
  q.modeT = sp.fleeSeconds;
  switch (sp.style) {
    case 'run':
    case 'zigzag':
      q.mode = 'flee';
      break;
    case 'roll':
      q.mode = 'rolled';
      q.speed = 0;
      break;
    case 'flush':
      q.mode = 'flying';
      break;
    case 'burrow':
      q.mode = 'burrowed';
      q.speed = 0;
      break;
  }
}

export function stepQuarry(q: Quarry, f: QuarryFrame, env: QuarryEnv): void {
  const sp = q.species;
  const dt = f.dt;
  q.combedT = Math.max(0, q.combedT - dt);
  const d = Math.hypot(q.x - f.playerX, q.z - f.playerZ);
  if (d > HUNT.simRadius) { q.speed = 0; return; }
  // A queued alarm waits until the quarry is in sim range; the next step then reacts to it.
  const pending = pendingAlarm.get(q);
  pendingAlarm.delete(q);
  if (q.mode !== 'down') q.tip = Math.max(0, q.tip - dt * TIP_RATE);

  // Active time: night species hide while it is day, day species hide while it is night.
  if (sp.active === 'night') {
    if (q.mode === 'hidden') { if (f.night >= 0.35) { q.mode = 'graze'; q.modeT = 1; } }
    else if (f.night < 0.35 && (q.mode === 'graze' || q.mode === 'walk' || q.mode === 'wary')) q.mode = 'hidden';
  } else if (sp.active === 'day') {
    if (q.mode === 'hidden') { if (f.night <= 0.65) { q.mode = 'graze'; q.modeT = 1; } }
    else if (f.night > 0.65 && (q.mode === 'graze' || q.mode === 'walk' || q.mode === 'wary')) q.mode = 'hidden';
  }
  if (q.mode === 'hidden') {
    q.speed = 0;
    q.awareness = 0;
    q.y = env.ground(q.x, q.z) + q.lift;
    return;
  }

  // Awareness: heard within hear * noise, seen within sight, or it calms down.
  if (q.mode !== 'down' && q.mode !== 'burrowed') {
    const hearR = sp.hear * f.noise;
    let sensed = false;
    if (d < hearR) { q.awareness += dt * 1.2 * (1.3 - d / hearR); sensed = true; }
    if (d < sp.sight) { q.awareness += dt * 2; sensed = true; }
    if (!sensed) q.awareness -= dt * 0.25;
    if (f.shot && d < HUNT.shotAlert) q.awareness = 1;
    q.awareness = Math.max(0, Math.min(1, q.awareness));
  }

  // Alert transitions for the idle modes.
  if (q.mode === 'graze' || q.mode === 'walk' || q.mode === 'wary') {
    if (q.awareness >= 1 || pending) {
      react(q, pending ?? { x: f.playerX, z: f.playerZ });
    } else if ((q.mode === 'graze' || q.mode === 'walk') && q.awareness >= HUNT.wary) {
      q.mode = 'wary';
      q.modeT = 0;
    }
  }

  switch (q.mode) {
    case 'graze':
      q.speed = 0;
      q.modeT -= dt;
      if (q.modeT <= 0) {
        pickWander(q, env);
        q.mode = 'walk';
      }
      break;

    case 'walk': {
      const left = moveTo(q, env, q.goalX, q.goalZ, sp.walk, dt, false);
      if (left < 0.6 || q.speed < 0.01) {
        q.mode = 'graze';
        q.modeT = 2 + env.rnd() * 4;
      }
      break;
    }

    case 'wary':
      q.speed = 0;
      turnToward(q, Math.atan2(f.playerX - q.x, f.playerZ - q.z), dt);
      if (q.awareness < HUNT.wary * 0.5) {
        q.mode = 'graze';
        q.modeT = 1 + env.rnd() * 2;
      }
      break;

    case 'flee': {
      q.modeT -= dt;
      let zigAngle = 0;
      if (sp.style === 'zigzag') {
        q.zig += dt * 5;
        zigAngle = Math.sin(q.zig) * 0.9;
      }
      const t = awayTarget(q, q.fromX, q.fromZ, zigAngle);
      moveTo(q, env, t.x, t.z, sp.run, dt, false);
      if (q.modeT <= 0) {
        q.mode = 'graze';
        q.modeT = 1;
        q.awareness = 0.6;
      }
      break;
    }

    case 'rolled':
      q.speed = 0;
      q.modeT -= dt;
      if (q.modeT <= 0) {
        q.awareness = 0.5;
        if (d < sp.sight) {
          q.mode = 'flee';
          q.modeT = sp.fleeSeconds;
          q.fromX = f.playerX;
          q.fromZ = f.playerZ;
        } else {
          q.mode = 'graze';
          q.modeT = 1;
        }
      }
      break;

    case 'flying':
      if (q.modeT > 0) {
        q.modeT -= dt;
        q.lift = Math.min(sp.flyHeight ?? 0, q.lift + FLY_RATE * dt);
        const t = awayTarget(q, q.fromX, q.fromZ, 0);
        moveTo(q, env, t.x, t.z, sp.run, dt, true);
      } else {
        q.speed = 0;
        q.lift = Math.max(0, q.lift - FLY_RATE * dt);
        if (q.lift <= 0) {
          q.mode = 'graze';
          q.modeT = 1;
        }
      }
      break;

    case 'burrowed':
      q.speed = 0;
      q.modeT -= dt;
      if (q.modeT <= 0) {
        q.mode = 'graze';
        q.modeT = 1;
        q.awareness = 0.3;
      }
      break;

    case 'down':
      q.speed = 0;
      q.lift = Math.max(0, q.lift - LIFT_FALL * dt);
      q.modeT -= dt;
      if (q.modeT > 0) {
        q.tip = Math.min(1, q.tip + dt * TIP_RATE);
      } else {
        q.tip = Math.max(0, q.tip - dt * TIP_RATE);
        if (q.tip <= 0) {
          q.awareness = 1;
          q.mode = 'flee';
          q.modeT = sp.fleeSeconds;
          q.fromX = f.playerX;
          q.fromZ = f.playerZ;
        }
      }
      break;

  }

  q.y = env.ground(q.x, q.z) + q.lift;
}

export function quarryContains(q: Quarry, x: number, y: number, z: number): boolean {
  if (q.mode === 'hidden' || q.mode === 'burrowed') return false;
  const sp = q.species;
  if (Math.hypot(x - q.x, z - q.z) > sp.radius * sp.scale) return false;
  return y >= q.y - 0.2 && y <= q.y + sp.height * sp.scale + 0.1;
}

export function shootQuarry(q: Quarry, fromX: number, fromZ: number, dist: number): 'downed' | 'bounced' | 'miss' {
  if (q.mode === 'hidden' || q.mode === 'burrowed') return 'miss';
  if (q.mode === 'rolled') {
    q.awareness = 1;
    return 'bounced';
  }
  if (q.mode === 'down') {
    q.modeT = q.species.downTime;
    return 'downed';
  }
  q.mode = 'down';
  q.modeT = q.species.downTime;
  q.speed = 0;
  q.fromX = fromX;
  q.fromZ = fromZ;
  q.lastShotDist = dist;
  q.awareness = 1;
  return 'downed';
}

export function canComb(q: Quarry, px: number, pz: number): boolean {
  return q.mode === 'down' && q.combedT <= 0 && Math.hypot(q.x - px, q.z - pz) <= HUNT.combRange;
}

export function combQuarry(q: Quarry, px: number, pz: number): void {
  q.combedT = HUNT.recombSeconds;
  q.tip = 0;
  q.mode = 'flee';
  q.modeT = q.species.fleeSeconds;
  q.awareness = 1;
  q.fromX = px;
  q.fromZ = pz;
}

export function alarmQuarry(q: Quarry, fromX: number, fromZ: number): void {
  if (q.mode === 'down' || q.mode === 'hidden' || q.mode === 'burrowed') return;
  q.awareness = 1;
  pendingAlarm.set(q, { x: fromX, z: fromZ });
}
