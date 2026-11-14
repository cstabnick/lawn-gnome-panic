// src/botAim.ts: how a bot picks targets, aims and pulls the trigger.
import * as THREE from 'three';
import type { Game, GameEvent, Soldier } from './config';
import { TUNING, weaponOf } from './config';
import { lineOfSight, startReload, throwGrenade, tryFire } from './combat';

export interface BotCombatInfo {
  /** The enemy being engaged (seen this think), or null. */
  target: Soldier | null;
  /** Horizontal distance to target; Infinity when none. */
  targetDist: number;
  /** World xz the latest danger came from (damage taken or enemy shots nearby), kept for 4 s; null if none. */
  threat: { x: number; z: number } | null;
  /** Took damage in the last 2 s. */
  underFire: boolean;
}

interface Mem {
  thinkT: number;
  target: Soldier | null;
  seenT: number;          // seconds the current target has been tracked
  reactT: number;         // reaction threshold for the current target (re-rolled per target)
  aimHead: boolean;       // snipers: aim at the head for the current target
  aimErrYaw: number;
  aimErrPitch: number;
  unseenT: number;        // seconds since a target was last held
  burstLeft: number;      // auto weapons: seconds left in the current burst (0 = not bursting)
  pauseLeft: number;      // auto weapons: seconds left in the current pause
  semiWaitT: number;      // semi-auto weapons: seconds until the next shot may leave
  lastHurtT: number;
  threat: { x: number; z: number } | null;
  threatT: number;
  attacker: Soldier | null;
}

const THINK_S = 0.2;
const CONE_COS = Math.cos(Math.PI / 3); // 120 degree cone: 60 degrees each side of yaw
const CHEST = 0.9;
const HEAD = 1.2;

const mems = new Map<number, Mem>();
const lastHitT = new Map<number, number>();
let subscribed: Game | null = null;

function newMem(): Mem {
  return {
    thinkT: Math.random() * THINK_S,
    target: null,
    seenT: 0,
    reactT: TUNING.botReactionS,
    aimHead: false,
    aimErrYaw: 0,
    aimErrPitch: 0,
    unseenT: 0,
    burstLeft: 0,
    pauseLeft: 0,
    semiWaitT: 0,
    lastHurtT: -Infinity,
    threat: null,
    threatT: -Infinity,
    attacker: null,
  };
}

function memOf(id: number): Mem {
  let m = mems.get(id);
  if (!m) {
    m = newMem();
    mems.set(id, m);
  }
  return m;
}

function subscribe(game: Game): void {
  if (subscribed === game) return;
  subscribed = game;
  mems.clear();
  lastHitT.clear();
  game.on((e) => {
    if (subscribed === game) onEvent(game, e);
  });
}

function clampN(v: number, max: number): number {
  return Math.max(-max, Math.min(max, v));
}

function wrapAngle(a: number): number {
  return a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
}

function eyeOf(s: Soldier): THREE.Vector3 {
  return new THREE.Vector3(s.pos.x, s.pos.y + TUNING.eyeHeight, s.pos.z);
}

function dirOf(yaw: number, pitch: number): THREE.Vector3 {
  return new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch),
  );
}

/** Distance from point p to the segment a..b. */
function segDist(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
  const ab = new THREE.Vector3().subVectors(b, a);
  const len2 = ab.lengthSq();
  const t = len2 > 0 ? THREE.MathUtils.clamp(new THREE.Vector3().subVectors(p, a).dot(ab) / len2, 0, 1) : 0;
  return p.distanceTo(a.clone().addScaledVector(ab, t));
}

function onEvent(game: Game, e: GameEvent): void {
  if (e.type === 'hit') {
    lastHitT.set(e.victim.id, game.time);
    if (!e.victim.isPlayer && e.shooter && e.shooter.team !== e.victim.team) {
      const m = memOf(e.victim.id);
      m.lastHurtT = game.time;
      m.threat = { x: e.shooter.pos.x, z: e.shooter.pos.z };
      m.threatT = game.time;
      m.attacker = e.shooter;
    }
  } else if (e.type === 'shot') {
    for (const b of game.soldiers) {
      if (!b.alive || b.isPlayer || b.team === e.shooter.team) continue;
      const chest = new THREE.Vector3(b.pos.x, b.pos.y + CHEST, b.pos.z);
      if (segDist(chest, e.from, e.to) > 6) continue;
      const m = memOf(b.id);
      m.threat = { x: e.shooter.pos.x, z: e.shooter.pos.z };
      m.threatT = game.time;
    }
  }
}

function setTarget(s: Soldier, m: Mem, t: Soldier | null): void {
  if (t === m.target) return;
  m.target = t;
  m.seenT = 0;
  if (!t) return;
  m.aimErrYaw = (Math.random() * 2 - 1) * 0.25;
  m.aimErrPitch = (Math.random() * 2 - 1) * 0.12;
  m.reactT = TUNING.botReactionS * (0.7 + Math.random() * 0.6);
  m.aimHead = s.classId === 'sniper' && Math.random() < 0.5;
}

/** Re-picks the target (every THINK_S). Keeps the current one unless a new candidate scores 10 better. */
function think(game: Game, s: Soldier, m: Mem): void {
  const eye = eyeOf(s);
  const w = weaponOf(s);
  const range = TUNING.botViewRange * (s.classId === 'sniper' ? 1.4 : 1);
  const fx = Math.sin(s.yaw);
  const fz = Math.cos(s.yaw);
  let pick: Soldier | null = null;
  let pickScore = Infinity;
  let curScore = Infinity;
  let curOk = false;

  for (const e of game.soldiers) {
    if (e === s || !e.alive || e.team === s.team) continue;
    const dx = e.pos.x - s.pos.x;
    const dz = e.pos.z - s.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > range) continue;
    const attacker = m.attacker === e;
    const inCone = d < 1e-6 || (dx * fx + dz * fz) / d >= CONE_COS;
    if (!(inCone || d <= 12 || attacker)) continue;
    const chest = new THREE.Vector3(e.pos.x, e.pos.y + CHEST, e.pos.z);
    if (!lineOfSight(game, eye, chest)) continue;

    let score = d;
    if (attacker) score -= 25;
    if (d >= w.botRange[0] && d <= w.botRange[1]) score -= 10;
    if (e.vehicle && s.grenades > 0 && d <= 25) score -= 15;

    if (e === m.target) {
      curOk = true;
      curScore = score;
    }
    if (score < pickScore) {
      pickScore = score;
      pick = e;
    }
  }

  const keepCurrent = curOk && !(pick && pickScore < curScore - 10);
  setTarget(s, m, keepCurrent ? m.target : pick);
}

function infoOf(game: Game, m: Mem, target: Soldier | null, dH: number): BotCombatInfo {
  return {
    target,
    targetDist: target ? dH : Infinity,
    threat: game.time - m.threatT < 4 ? m.threat : null,
    underFire: game.time - m.lastHurtT < 2,
  };
}

/**
 * For one alive bot (on foot or driving): chooses a target, turns s.yaw / s.pitch towards it while it has one,
 * sets s.ads, and fires, reloads and throws grenades. Leaves s.yaw alone when there is no target.
 * Call once per bot per frame, before moving it.
 */
export function botCombat(game: Game, s: Soldier, dt: number): BotCombatInfo {
  subscribe(game);
  const m = memOf(s.id);
  if (!s.alive) {
    setTarget(s, m, null);
    return infoOf(game, m, null, Infinity);
  }
  const w = weaponOf(s);

  m.thinkT -= dt;
  if (m.thinkT <= 0 || (m.target && !m.target.alive)) {
    m.thinkT = THINK_S;
    think(game, s, m);
  }

  const t = m.target;
  if (!t) {
    s.ads = false;
    m.burstLeft = 0;
    m.unseenT += dt;
    if (s.ammo < w.magSize * 0.5 && s.reloadT <= 0 && m.unseenT >= 2) startReload(game, s);
    return infoOf(game, m, null, Infinity);
  }

  // Tracking
  m.unseenT = 0;
  m.seenT += dt;
  const decay = Math.exp(-dt * 2.2);
  m.aimErrYaw *= decay;
  m.aimErrPitch *= decay;

  const eye = eyeOf(s);
  const dH = Math.hypot(t.pos.x - s.pos.x, t.pos.z - s.pos.z);
  const aimY = t.pos.y + (m.aimHead ? HEAD : CHEST);
  const dist3 = eye.distanceTo(new THREE.Vector3(t.pos.x, aimY, t.pos.z));
  // Lead the target by its velocity, scaled by distance.
  const lead = dist3 / 250;
  const ax = t.pos.x + t.vel.x * lead;
  const ay = aimY + t.vel.y * lead;
  const az = t.pos.z + t.vel.z * lead;
  const dx = ax - eye.x;
  const dy = ay - eye.y;
  const dz = az - eye.z;
  const hz = Math.hypot(dx, dz);
  const wantYaw = Math.atan2(dx, dz) + m.aimErrYaw;
  const wantPitch = clampN(Math.atan2(dy, hz) + m.aimErrPitch, TUNING.maxPitch);

  // Aim down sights: shotgun never, sniper always, others beyond 15 units.
  s.ads = !s.vehicle && (w.id === 'peaShooter' || (w.id !== 'blunderbuss' && dH > 15));

  // Turn towards the aim at up to 5 rad/s.
  const maxStep = 5 * dt;
  s.yaw = wrapAngle(s.yaw + clampN(wrapAngle(wantYaw - s.yaw), maxStep));
  s.pitch = clampN(s.pitch + clampN(wantPitch - s.pitch, maxStep), TUNING.maxPitch);

  const look = dirOf(s.yaw, s.pitch);
  const want = dirOf(wantYaw, wantPitch);
  const angle = Math.acos(clampN(look.dot(want), 1));
  const ready = m.seenT > m.reactT && angle < 0.06 + 0.6 / Math.max(dH, 1);

  const addShotNoise = (): void => {
    const speed = Math.hypot(s.vel.x, s.vel.z);
    const tSpeed = t.vel.length();
    let sigma = 0.004 + 0.0006 * dist3;
    if (speed > 2) sigma *= 1.8;
    if (tSpeed > 4) sigma *= 1.5;
    if (s.adsT > 0.8) sigma *= 0.5;
    m.aimErrYaw += (Math.random() * 2 - 1) * sigma;
    m.aimErrPitch += (Math.random() * 2 - 1) * sigma;
  };

  if (!ready) {
    m.burstLeft = 0;
  } else if (w.auto) {
    if (m.pauseLeft > 0) {
      m.pauseLeft -= dt;
    } else {
      if (m.burstLeft <= 0) m.burstLeft = dH > 40 ? 0.25 : dH < 15 ? 0.6 : 0.4;
      m.burstLeft -= dt;
      if (tryFire(game, s, eye, look)) addShotNoise();
      if (m.burstLeft <= 0) {
        m.burstLeft = 0;
        m.pauseLeft = 0.3 + Math.random() * 0.3;
      }
    }
  } else {
    m.semiWaitT -= dt;
    if (m.semiWaitT <= 0 && tryFire(game, s, eye, look)) {
      m.semiWaitT = s.classId === 'sniper' ? 0.5 + Math.random() * 0.7 : 0.15 + Math.random() * 0.25;
      addShotNoise();
    }
  }

  // Grenades: on foot, target 10-28 units away, and a juicy target.
  if (s.grenades > 0 && !s.vehicle && dH >= 10 && dH <= 28) {
    const hitRecently = game.time - (lastHitT.get(t.id) ?? -Infinity) < 3;
    let crowd = 0;
    for (const o of game.soldiers) {
      if (o === t || !o.alive || o.team !== t.team) continue;
      if (Math.hypot(o.pos.x - t.pos.x, o.pos.z - t.pos.z, o.pos.y - t.pos.y) <= 6) crowd++;
    }
    if ((t.vehicle || crowd >= 2 || !hitRecently) && Math.random() < 0.25 * dt) {
      const gdir = new THREE.Vector3(t.pos.x - eye.x, aimY - eye.y + 0.3, t.pos.z - eye.z).normalize();
      throwGrenade(game, s, eye, gdir);
    }
  }

  return infoOf(game, m, t, dH);
}

/** Forgets a bot's aim memory. Call when the bot respawns. */
export function resetBotCombat(s: Soldier): void {
  mems.delete(s.id);
}
