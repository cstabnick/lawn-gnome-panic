// src/bots.ts: bot soldiers for both teams. Every non-player soldier plays conquest: it heads for a flag it does not hold,
// fights enemies it can see, and sometimes takes a mower or the Combine and drives it at flags and at enemy gnomes.
import * as THREE from 'three';
import { TUNING } from './config';
import type { FlagState, Game, Soldier, Vehicle, VehicleControl } from './config';
import { moveSoldier } from './soldiers';
import { lineOfSight, startReload, throwGrenade, tryFire } from './combat';
import { driveVehicle, enterVehicle, exitVehicle, nearestEnterable } from './vehicles';

const THINK_S = 0.25;
const VIEW_HALF_ANGLE = (110 * Math.PI) / 180;
const CHEST_Y = 0.8;
const TURN_RATE = 6;           // rad/s
const BURST_ON_S = 0.6;
const BURST_OFF_S = 0.4;
const ON_FOOT_AIM_TOL = 0.15;  // rad
const RUNOVER_RANGE = 30;
const RUNOVER_ARC = (60 * Math.PI) / 180;

interface Brain {
  goal: FlagState | null;
  target: Soldier | null;
  seenS: number;
  thinkT: number;
  strafeDir: 1 | -1;
  strafeT: number;
  wantVehicle: boolean;
  lastPos: THREE.Vector3;
  stuckT: number;
  unstickT: number;
  unstickDir: number;
  unstickJumped: boolean;
  lastSpawnTime: number;
  wander: THREE.Vector3;   // x, z: point to walk to while at the goal
  wanderT: number;
  burstOn: boolean;
  burstT: number;
  vStuckT: number;
  reverseT: number;
}

const brainsByGame = new WeakMap<Game, Map<number, Brain>>();

function makeBrain(game: Game, s: Soldier): Brain {
  return {
    goal: null,
    target: null,
    seenS: 0,
    thinkT: 0,
    strafeDir: Math.random() < 0.5 ? 1 : -1,
    strafeT: 0,
    wantVehicle: Math.random() < TUNING.botVehicleChance,
    lastPos: s.pos.clone(),
    stuckT: 1.5,
    unstickT: 0,
    unstickDir: 0,
    unstickJumped: false,
    lastSpawnTime: game.time,
    wander: new THREE.Vector3(),
    wanderT: 0,
    burstOn: false,
    burstT: 0,
    vStuckT: 0,
    reverseT: 0,
  };
}

/** The brain map for this game. The first call subscribes to spawn events so a respawned bot starts fresh. */
function brainsFor(game: Game): Map<number, Brain> {
  const existing = brainsByGame.get(game);
  if (existing) return existing;
  const created = new Map<number, Brain>();
  brainsByGame.set(game, created);
  game.on((e) => {
    if (e.type === 'spawn') created.set(e.soldier.id, makeBrain(game, e.soldier));
  });
  return created;
}

/** Thinks and acts for every alive non-player soldier. */
export function updateBots(game: Game, dt: number): void {
  const brains = brainsFor(game);
  for (const s of game.soldiers) {
    if (s.isPlayer || !s.alive) continue;
    let b = brains.get(s.id);
    if (!b) {
      b = makeBrain(game, s);
      brains.set(s.id, b);
    }
    updateBot(game, s, b, dt);
  }
}

function updateBot(game: Game, s: Soldier, b: Brain, dt: number): void {
  b.thinkT -= dt;
  if (b.thinkT <= 0) {
    b.thinkT = THINK_S;
    think(game, s, b);
  }
  if (b.target && !b.target.alive) setTarget(b, null);
  if (b.target) b.seenS += dt;

  b.burstT -= dt;
  if (b.burstT <= 0) {
    b.burstOn = !b.burstOn;
    b.burstT = b.burstOn ? BURST_ON_S : BURST_OFF_S;
  }

  if (s.vehicle) driveBot(game, s, s.vehicle, b, dt);
  else footBot(game, s, b, dt);
}

function think(game: Game, s: Soldier, b: Brain): void {
  const prevGoal = b.goal;
  b.goal = pickGoal(game, s);
  if (b.goal !== prevGoal) b.wanderT = 0;
  setTarget(b, pickTarget(game, s));
}

function setTarget(b: Brain, t: Soldier | null): void {
  if (t !== b.target) {
    b.target = t;
    b.seenS = 0;
  }
}

function pickGoal(game: Game, s: Soldier): FlagState | null {
  const wanted = game.flags.filter(
    (f) => f.owner !== s.team || (s.team === 0 ? f.progress < 0 : f.progress > 0),
  );
  if (wanted.length > 0) return nearestFlag(wanted, s.pos.x, s.pos.z);
  const owned = game.flags.filter((f) => f.owner === s.team);
  const pool = owned.length > 0 ? owned : game.flags;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

function nearestFlag(list: readonly FlagState[], x: number, z: number): FlagState | null {
  let best: FlagState | null = null;
  let bestD = Infinity;
  for (const f of list) {
    const d = horizDist(x, z, f.def.x, f.def.z);
    if (d < bestD) {
      bestD = d;
      best = f;
    }
  }
  return best;
}

function pickTarget(game: Game, s: Soldier): Soldier | null {
  const eye = eyeOf(s);
  let best: Soldier | null = null;
  let bestD = Infinity;
  for (const e of game.soldiers) {
    if (e.team === s.team || !e.alive) continue;
    const d = horizDist(s.pos.x, s.pos.z, e.pos.x, e.pos.z);
    if (d > TUNING.botViewRange || d >= bestD) continue;
    const off = Math.abs(wrapAngle(bearing(s.pos.x, s.pos.z, e.pos.x, e.pos.z) - s.yaw));
    if (off > VIEW_HALF_ANGLE && d > 15) continue;
    if (!lineOfSight(game, eye, chestOf(e))) continue;
    best = e;
    bestD = d;
  }
  return best;
}

// ---------------------------------------------------------------------
// On foot
// ---------------------------------------------------------------------

function footBot(game: Game, s: Soldier, b: Brain, dt: number): void {
  const goal = b.goal;
  const goalDist = goal ? horizDist(s.pos.x, s.pos.z, goal.def.x, goal.def.z) : 0;

  if (b.wantVehicle && goal && goalDist > 40) {
    const v = nearestEnterable(game, s);
    if (v) {
      enterVehicle(game, s, v);
      return;
    }
  }

  // Where to look and walk
  const target = b.target;
  let aimX = 0;
  let aimZ = 0;
  let hasAim = false;
  if (target) {
    aimX = target.pos.x;
    aimZ = target.pos.z;
    hasAim = true;
  } else if (goal) {
    if (goalDist < TUNING.captureRadius * 0.5) {
      b.wanderT -= dt;
      if (b.wanderT <= 0) {
        pickWander(b, goal);
        b.wanderT = 3;
      }
      aimX = b.wander.x;
      aimZ = b.wander.z;
    } else {
      aimX = goal.def.x;
      aimZ = goal.def.z;
    }
    hasAim = true;
  }

  if (hasAim) turnToward(s, bearing(s.pos.x, s.pos.z, aimX, aimZ), dt);

  const eye = eyeOf(s);
  if (target) s.pitch = pitchTo(eye, chestOf(target));
  else s.pitch = 0;

  // Movement
  const fx = Math.sin(s.yaw);
  const fz = Math.cos(s.yaw);
  let wx = 0;
  let wz = 0;
  if (target) {
    const far = horizDist(s.pos.x, s.pos.z, target.pos.x, target.pos.z) > 25;
    // Right of facing is (-cos yaw, 0, sin yaw)
    wx = -fz * b.strafeDir + (far ? 0.4 * fx : 0);
    wz = fx * b.strafeDir + (far ? 0.4 * fz : 0);
    b.strafeT -= dt;
    if (b.strafeT <= 0) {
      b.strafeDir = b.strafeDir === 1 ? -1 : 1;
      b.strafeT = 1 + Math.random();
    }
  } else if (hasAim) {
    wx = fx;
    wz = fz;
  }
  const wl = Math.hypot(wx, wz);
  if (wl > 1) {
    wx /= wl;
    wz /= wl;
  }

  // Stuck check: every 1.5 s, did we get anywhere while trying to move?
  let jump = false;
  b.stuckT -= dt;
  if (b.stuckT <= 0) {
    b.stuckT = 1.5;
    const moved = horizDist(s.pos.x, s.pos.z, b.lastPos.x, b.lastPos.z);
    if (wl > 0 && moved < 0.8 && b.unstickT <= 0) {
      b.unstickT = 1;
      b.unstickDir = Math.random() * Math.PI * 2;
      b.unstickJumped = false;
    }
    b.lastPos.copy(s.pos);
  }
  if (b.unstickT > 0) {
    wx = Math.sin(b.unstickDir);
    wz = Math.cos(b.unstickDir);
    if (!b.unstickJumped) {
      jump = true;
      b.unstickJumped = true;
    }
    b.unstickT -= dt;
  }

  const sprint = !target && goal !== null && goalDist > 20;
  moveSoldier(game, s, wx, wz, sprint, jump, dt);

  shoot(game, s, b);
  if (target) maybeGrenade(game, s, target, dt);

  if (!target && s.ammo < 10 && s.reloadT <= 0) startReload(game, s);
}

function pickWander(b: Brain, goal: FlagState): void {
  const a = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * TUNING.captureRadius;
  b.wander.set(goal.def.x + Math.cos(a) * r, 0, goal.def.z + Math.sin(a) * r);
}

function maybeGrenade(game: Game, s: Soldier, target: Soldier, dt: number): void {
  if (s.grenades <= 0) return;
  const d = horizDist(s.pos.x, s.pos.z, target.pos.x, target.pos.z);
  if (d < 10 || d > 25) return;
  if (Math.random() >= 0.15 * dt) return;
  const eye = eyeOf(s);
  const chest = chestOf(target);
  const dir = new THREE.Vector3(chest.x - eye.x, chest.y - eye.y + 0.35, chest.z - eye.z).normalize();
  throwGrenade(game, s, eye, dir);
}

/** Fires at the target from the eye when the bot is ready, aligned and inside a burst. Works on foot and from a seat. */
function shoot(game: Game, s: Soldier, b: Brain): void {
  const target = b.target;
  if (!target || b.seenS <= TUNING.botReactionS || !b.burstOn) return;
  const brg = bearing(s.pos.x, s.pos.z, target.pos.x, target.pos.z);
  if (Math.abs(wrapAngle(brg - s.yaw)) >= ON_FOOT_AIM_TOL) return;
  const eye = eyeOf(s);
  const chest = chestOf(target);
  const dx = chest.x - eye.x;
  const dy = chest.y - eye.y;
  const dz = chest.z - eye.z;
  const yaw = Math.atan2(dx, dz) + aimError();
  const pitch = Math.atan2(dy, Math.hypot(dx, dz)) + aimError();
  tryFire(game, s, eye, dirFrom(yaw, pitch));
}

// ---------------------------------------------------------------------
// In a vehicle
// ---------------------------------------------------------------------

function driveBot(game: Game, s: Soldier, v: Vehicle, b: Brain, dt: number): void {
  const target = b.target;
  if (target) {
    turnToward(s, bearing(s.pos.x, s.pos.z, target.pos.x, target.pos.z), dt);
    s.pitch = pitchTo(eyeOf(s), chestOf(target));
  } else {
    turnToward(s, v.yaw, dt);
    s.pitch = 0;
  }

  let ctl: VehicleControl = { throttle: 0, steer: 0 };
  const goal = b.goal;
  const victim = nearestRunOver(game, s, v);
  if (victim) {
    ctl = steerToward(v, victim.pos.x, victim.pos.z);
  } else if (goal) {
    const dGoal = horizDist(v.pos.x, v.pos.z, goal.def.x, goal.def.z);
    if (dGoal < TUNING.captureRadius * 0.6) {
      if (v.def.kind !== 'combine') {
        exitVehicle(game, s);
        b.wantVehicle = false;
        return;
      }
      // The Combine circles the flag until it is owned, then the bot picks a new goal.
      if (goal.owner === s.team) b.thinkT = 0;
      ctl = { throttle: 0.5, steer: 0.6 };
    } else {
      ctl = steerToward(v, goal.def.x, goal.def.z);
      if (dGoal < 6) ctl.throttle = 0;
    }
  }

  // Stuck: barely moving while asked to drive, so reverse for a while.
  if (b.reverseT <= 0 && ctl.throttle > 0 && Math.abs(v.speed) < 1) {
    b.vStuckT += dt;
    if (b.vStuckT >= 2) {
      b.vStuckT = 0;
      b.reverseT = 1.5;
    }
  } else {
    b.vStuckT = 0;
  }
  if (b.reverseT > 0) {
    b.reverseT -= dt;
    ctl = { throttle: -1, steer: -ctl.steer };
  }

  driveVehicle(v, ctl);
  shoot(game, s, b);
}

function steerToward(v: Vehicle, x: number, z: number): VehicleControl {
  const err = wrapAngle(bearing(v.pos.x, v.pos.z, x, z) - v.yaw);
  return {
    throttle: Math.abs(err) > 1.6 ? 0.4 : 1,
    steer: -clamp(err * 2, -1, 1), // steering right decreases yaw
  };
}

function nearestRunOver(game: Game, s: Soldier, v: Vehicle): Soldier | null {
  let best: Soldier | null = null;
  let bestD = RUNOVER_RANGE;
  for (const e of game.soldiers) {
    if (e.team === s.team || !e.alive || e.vehicle) continue;
    const d = horizDist(v.pos.x, v.pos.z, e.pos.x, e.pos.z);
    if (d >= bestD) continue;
    const off = Math.abs(wrapAngle(bearing(v.pos.x, v.pos.z, e.pos.x, e.pos.z) - v.yaw));
    if (off > RUNOVER_ARC) continue;
    best = e;
    bestD = d;
  }
  return best;
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function eyeOf(s: Soldier): THREE.Vector3 {
  return new THREE.Vector3(s.pos.x, s.pos.y + TUNING.eyeHeight, s.pos.z);
}

function chestOf(e: Soldier): THREE.Vector3 {
  return new THREE.Vector3(e.pos.x, e.pos.y + CHEST_Y, e.pos.z);
}

/** Yaw from (ax, az) to (bx, bz): yaw 0 faces +z. */
function bearing(ax: number, az: number, bx: number, bz: number): number {
  return Math.atan2(bx - ax, bz - az);
}

function pitchTo(eye: THREE.Vector3, chest: THREE.Vector3): number {
  const pitch = Math.atan2(chest.y - eye.y, Math.hypot(chest.x - eye.x, chest.z - eye.z));
  return clamp(pitch, -TUNING.maxPitch, TUNING.maxPitch);
}

function dirFrom(yaw: number, pitch: number): THREE.Vector3 {
  return new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch),
  );
}

function aimError(): number {
  return (Math.random() * 2 - 1) * TUNING.botAimError;
}

function turnToward(s: Soldier, desired: number, dt: number): void {
  const step = clamp(wrapAngle(desired - s.yaw), -TURN_RATE * dt, TURN_RATE * dt);
  s.yaw = wrapAngle(s.yaw + step);
}

function horizDist(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(bx - ax, bz - az);
}

/** Wraps an angle into -PI..PI. */
function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
