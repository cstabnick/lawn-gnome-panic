// src/soldiers.ts: soldier creation, movement, damage, death and respawn.
import * as THREE from 'three';
import {
  ARENA_HALF, CLASSES, TUNING, WEAPONS, weaponOf, type ClassId, type DamageCause, type Game, type Soldier, type Team, type WeaponId,
} from './config';
import type { GnomeLook, PlayerState } from './models/config';
import { createGnomeModel } from './models/gnome';
import { heightAt } from './terrain';
import { spawnPoints } from './conquest';

/** Creates a dead soldier (alive = false, respawnT = 0) and adds its gnome model to the scene. Call respawnSoldier to place it. */
export function createSoldier(scene: THREE.Scene, opts: { id: number; team: Team; name: string; isPlayer: boolean; look: GnomeLook; classId: ClassId }): Soldier {
  const cls = CLASSES[opts.classId];
  const weapon = WEAPONS[cls.weapon];
  const model = createGnomeModel(opts.look);
  scene.add(model.object);
  return {
    id: opts.id, team: opts.team, name: opts.name, isPlayer: opts.isPlayer,
    classId: opts.classId, nextClassId: opts.classId, ads: false, adsT: 0,
    pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: 0,
    grounded: true, jumpsUsed: 0, sprinting: false,
    hp: TUNING.maxHp, alive: false, respawnT: 0, sinceDamageS: 99, vehicle: null,
    ammo: weapon.magSize, reserve: weapon.reserveAmmo, reloadT: 0, fireT: 0, grenades: cls.grenades,
    kills: 0, deaths: 0, model,
  };
}

/** Moves toward target by at most maxStep. */
function approach(v: number, target: number, maxStep: number): number {
  if (v < target) return Math.min(target, v + maxStep);
  return Math.max(target, v - maxStep);
}

/** Pushes the soldier out of a vertical cylinder of radius minDist around (cx, cz), removing the velocity going into it. */
function pushOut(s: Soldier, cx: number, cz: number, minDist: number): void {
  let dx = s.pos.x - cx;
  let dz = s.pos.z - cz;
  let d = Math.hypot(dx, dz);
  if (d >= minDist) return;
  if (d < 1e-6) { dx = 1; dz = 0; d = 1; }
  const nx = dx / d;
  const nz = dz / d;
  s.pos.x = cx + nx * minDist;
  s.pos.z = cz + nz * minDist;
  const vn = s.vel.x * nx + s.vel.z * nz;
  if (vn < 0) {
    s.vel.x -= vn * nx;
    s.vel.z -= vn * nz;
  }
}

/** Moves a soldier on foot. wishX/wishZ: world-space wished direction, length 0..1. Does not change yaw. */
export function moveSoldier(game: Game, s: Soldier, wishX: number, wishZ: number, sprint: boolean, jump: boolean, dt: number): void {
  if (!s.alive || s.vehicle) return;

  // Horizontal velocity towards the wished velocity.
  // Class speed, slowed towards the weapon's adsMoveMult while aiming (sprinting is not slowed: aiming eases out).
  const aimMult = 1 + (weaponOf(s).adsMoveMult - 1) * s.adsT;
  const speed = (sprint ? TUNING.sprintSpeed : TUNING.walkSpeed * aimMult) * CLASSES[s.classId].speedMult;
  const maxStep = TUNING.accel * dt * (s.grounded ? 1 : TUNING.airControl);
  s.vel.x = approach(s.vel.x, wishX * speed, maxStep);
  s.vel.z = approach(s.vel.z, wishZ * speed, maxStep);
  s.sprinting = sprint && Math.hypot(wishX, wishZ) > 0.1;

  // Jump.
  if (jump && s.grounded) {
    s.vel.y = TUNING.jumpSpeed;
    s.grounded = false;
    s.jumpsUsed = 1;
    game.emit({ type: 'jump', soldier: s });
  }

  // Gravity and integration.
  s.vel.y -= TUNING.gravity * dt;
  s.pos.x += s.vel.x * dt;
  s.pos.y += s.vel.y * dt;
  s.pos.z += s.vel.z * dt;

  // Floor: the terrain, or the top of an obstacle the soldier is landing on.
  let floor = heightAt(s.pos.x, s.pos.z);
  for (const o of game.obstacles) {
    const top = heightAt(o.x, o.z) + o.h;
    if (top <= floor) continue;
    if (s.vel.y > 0 || s.pos.y < top - 0.3) continue;
    const dist = Math.hypot(s.pos.x - o.x, s.pos.z - o.z);
    if (dist < o.r) floor = top;
  }

  if (s.pos.y <= floor) {
    s.pos.y = floor;
    s.vel.y = 0;
    s.grounded = true;
    s.jumpsUsed = 0;
  } else if (s.grounded && s.pos.y - floor < 0.4) {
    // Walking downhill (or off a low step): stay on the floor.
    s.pos.y = floor;
    s.vel.y = 0;
  } else {
    s.grounded = false;
  }

  // Obstacles: push out of any cover the soldier is level with.
  for (const o of game.obstacles) {
    const top = heightAt(o.x, o.z) + o.h;
    if (s.pos.y >= top) continue;
    pushOut(s, o.x, o.z, o.r + TUNING.soldierRadius);
  }

  // Vehicles: push out of every nearby alive vehicle.
  for (const v of game.vehicles) {
    if (!v.alive) continue;
    if (Math.abs(s.pos.y - v.pos.y) >= 3) continue;
    pushOut(s, v.pos.x, v.pos.z, v.def.radius + TUNING.soldierRadius);
  }

  // Stay inside the arena.
  const limit = ARENA_HALF - 1;
  s.pos.x = Math.max(-limit, Math.min(limit, s.pos.x));
  s.pos.z = Math.max(-limit, Math.min(limit, s.pos.z));
}

/** Applies damage. Kills at hp <= 0 (events, tickets, kill counts, vehicle ejection). Ignores dead soldiers and friendly fire. */
export function damageSoldier(game: Game, victim: Soldier, amount: number, attacker: Soldier | null, cause: DamageCause, headshot: boolean, weapon: WeaponId | null = null): void {
  if (!victim.alive || amount <= 0) return;
  if (attacker && attacker !== victim && attacker.team === victim.team) return;

  victim.hp -= amount;
  victim.sinceDamageS = 0;
  game.emit({ type: 'hit', shooter: attacker, victim, damage: amount, headshot });

  if (victim.hp > 0) return;

  victim.hp = 0;
  victim.alive = false;
  victim.respawnT = TUNING.respawnS;
  victim.deaths++;
  if (attacker && attacker.team !== victim.team) attacker.kills++;
  game.tickets[victim.team] = Math.max(0, game.tickets[victim.team] - TUNING.deathTicketCost);
  if (victim.vehicle) {
    victim.vehicle.driver = null;
    victim.vehicle = null;
  }
  victim.reloadT = 0;
  victim.ads = false;
  victim.adsT = 0;
  victim.model.setDead(true);
  game.emit({ type: 'kill', killer: attacker, victim, cause, weapon, headshot });
}

/** Brings a soldier back to life at one of its team's spawn points with full health, ammo and grenades. */
export function respawnSoldier(game: Game, s: Soldier): void {
  const pts = spawnPoints(game, s.team);
  const owned = pts.slice(1);
  let base: { x: number; z: number; yaw: number };

  if (s.isPlayer) {
    // The owned flag closest to the map centre, or the HQ if none.
    base = pts[0];
    let bestD = Infinity;
    for (const p of owned) {
      const d = Math.hypot(p.x, p.z);
      if (d < bestD) { bestD = d; base = p; }
    }
  } else if (owned.length === 0) {
    base = pts[0];
  } else if (Math.random() < 0.3) {
    base = pts[0];
  } else {
    base = owned[Math.floor(Math.random() * owned.length)];
  }

  // A random spot within 6 units of the base, clear of cover if possible.
  let x = base.x;
  let z = base.z;
  for (let attempt = 0; attempt < 8; attempt++) {
    const ang = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 6;
    const cx = base.x + Math.cos(ang) * r;
    const cz = base.z + Math.sin(ang) * r;
    let clear = true;
    for (const o of game.obstacles) {
      if (Math.hypot(cx - o.x, cz - o.z) < o.r + 0.6) { clear = false; break; }
    }
    if (clear) { x = cx; z = cz; break; }
  }
  const limit = ARENA_HALF - 1;
  x = Math.max(-limit, Math.min(limit, x));
  z = Math.max(-limit, Math.min(limit, z));

  s.pos.set(x, heightAt(x, z), z);
  s.vel.set(0, 0, 0);
  s.yaw = base.yaw;
  s.pitch = 0;
  s.hp = TUNING.maxHp;
  s.alive = true;
  s.respawnT = 0;
  s.sinceDamageS = 99;
  s.vehicle = null;
  s.classId = s.nextClassId;
  s.ads = false;
  s.adsT = 0;
  const weapon = weaponOf(s);
  s.ammo = weapon.magSize;
  s.reserve = weapon.reserveAmmo;
  s.reloadT = 0;
  s.fireT = 0;
  s.grenades = CLASSES[s.classId].grenades;
  s.grounded = true;
  s.jumpsUsed = 0;
  s.sprinting = false;
  s.model.setDead(false);
  game.emit({ type: 'spawn', soldier: s });
}

const poseStates = new WeakMap<Soldier, PlayerState>();

function poseOf(s: Soldier): PlayerState {
  let st = poseStates.get(s);
  if (!st) {
    st = {
      position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0,
      grounded: true, jumpsUsed: 0, stamina: 1, staminaDelay: 0, sprinting: false, exhausted: false,
    };
    poseStates.set(s, st);
  }
  return st;
}

/** Respawn timers, health regen, drivers riding on their seats, gnome model animation. */
export function updateSoldiers(game: Game, dt: number): void {
  for (const s of game.soldiers) {
    if (!s.alive) {
      s.respawnT -= dt;
      if (s.respawnT <= 0 && !game.over) respawnSoldier(game, s);
    } else {
      s.sinceDamageS += dt;
      if (s.sinceDamageS >= TUNING.regenDelayS) {
        s.hp = Math.min(TUNING.maxHp, s.hp + TUNING.regenPerS * dt);
      }
    }

    // Aim down sights: ease adsT towards the wish. No aiming while sprinting, reloading or dead.
    const aimWanted = s.alive && s.ads && !s.sprinting && s.reloadT <= 0;
    const aimStep = dt / TUNING.adsTimeS;
    s.adsT = aimWanted ? Math.min(1, s.adsT + aimStep) : Math.max(0, s.adsT - aimStep);

    const v = s.vehicle;
    if (v) {
      s.pos.set(v.pos.x, v.pos.y + v.def.seatY, v.pos.z);
      s.vel.set(0, 0, 0);
      s.grounded = true;
    }

    const p = poseOf(s);
    p.position.copy(s.pos);
    p.velocity.copy(s.vel);
    p.facing = v ? v.yaw : s.yaw;
    p.grounded = s.grounded;
    p.jumpsUsed = s.jumpsUsed;
    p.sprinting = s.sprinting;
    p.stamina = 1;
    p.staminaDelay = 0;
    p.exhausted = false;
    s.model.update(p, dt);

    s.model.object.visible = !(s.isPlayer && s.alive && !v);
  }
}
