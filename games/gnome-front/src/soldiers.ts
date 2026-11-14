// src/soldiers.ts: soldier creation, movement, damage, death and respawn. STUB: filled in by epic 2.
import * as THREE from 'three';
import { GRENADE, RIFLE, TUNING, type DamageCause, type Game, type Soldier, type Team } from './config';
import type { GnomeLook } from './models/config';
import { createGnomeModel } from './models/gnome';

/** Creates a dead soldier (alive = false, respawnT = 0) and adds its gnome model to the scene. Call respawnSoldier to place it. */
export function createSoldier(scene: THREE.Scene, opts: { id: number; team: Team; name: string; isPlayer: boolean; look: GnomeLook }): Soldier {
  const model = createGnomeModel(opts.look);
  scene.add(model.object);
  return {
    id: opts.id, team: opts.team, name: opts.name, isPlayer: opts.isPlayer,
    pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: 0,
    grounded: true, jumpsUsed: 0, sprinting: false,
    hp: TUNING.maxHp, alive: false, respawnT: 0, sinceDamageS: 99, vehicle: null,
    ammo: RIFLE.magSize, reserve: RIFLE.reserveAmmo, reloadT: 0, fireT: 0, grenades: GRENADE.count,
    kills: 0, deaths: 0, model,
  };
}

/** Moves a soldier on foot. wishX/wishZ: world-space wished direction, length 0..1. */
export function moveSoldier(game: Game, s: Soldier, wishX: number, wishZ: number, sprint: boolean, jump: boolean, dt: number): void {
  void game; void jump;
  const speed = sprint ? TUNING.sprintSpeed : TUNING.walkSpeed;
  s.pos.x += wishX * speed * dt;
  s.pos.z += wishZ * speed * dt;
}

/** Applies damage. Kills at hp <= 0 (events, tickets, kill counts, vehicle ejection). Ignores dead soldiers. */
export function damageSoldier(game: Game, victim: Soldier, amount: number, attacker: Soldier | null, cause: DamageCause, headshot: boolean): void {
  void game; void attacker; void cause; void headshot;
  victim.hp -= amount;
}

/** Brings a soldier back to life at one of its team's spawn points with full health, ammo and grenades. */
export function respawnSoldier(game: Game, s: Soldier): void {
  void game;
  s.alive = true;
  s.hp = TUNING.maxHp;
}

/** Respawn timers, health regen, drivers riding on their seats, gnome model animation. */
export function updateSoldiers(game: Game, dt: number): void {
  void game; void dt;
}
