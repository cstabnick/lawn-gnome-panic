// src/vehicles.ts: rideable mowers and the combine. Driving physics, terrain following, collisions,
// running soldiers over, destruction and respawn, model animation.
import * as THREE from 'three';
import {
  ARENA_HALF, TUNING, VEHICLE_SLOTS, VEHICLES,
  type Game, type Soldier, type Vehicle, type VehicleControl,
} from './config';
import { createMowerModel } from './models/mowerModels';
import { heightAt, normalAt } from './terrain';
import { damageSoldier } from './soldiers';

/** Controls set this frame by driveVehicle, keyed by vehicle id. Cleared at the end of updateVehicles. */
const controls = new Map<number, VehicleControl>();
/** Seconds left on each vehicle's white hit flash, keyed by vehicle id. */
const flashT = new Map<number, number>();
/** Game time of the last run-over hit per "vehicle:soldier" pair. */
const lastRunOver = new Map<string, number>();

const UP = new THREE.Vector3(0, 1, 0);
const tmpNormal = new THREE.Vector3();
const tmpTilt = new THREE.Quaternion();
const tmpYaw = new THREE.Quaternion();
const NO_CONTROL: VehicleControl = { throttle: 0, steer: 0 };

/** Creates one vehicle per VEHICLE_SLOTS entry at its slot, adds the models to the scene. */
export function createVehicles(scene: THREE.Scene): Vehicle[] {
  return VEHICLE_SLOTS.map((slot, i) => {
    const def = VEHICLES[slot.kind];
    const model = createMowerModel(slot.kind);
    model.group.scale.setScalar(def.scale);
    model.group.position.set(slot.x, 0, slot.z);
    model.group.rotation.y = slot.yaw;
    scene.add(model.group);
    return {
      id: i, def, home: { x: slot.x, z: slot.z, yaw: slot.yaw }, team: slot.team,
      pos: new THREE.Vector3(slot.x, 0, slot.z), yaw: slot.yaw, speed: 0,
      hp: def.maxHp, alive: true, respawnT: 0, driver: null, model,
    };
  });
}

/** The closest alive, driverless vehicle within reach of a living soldier on foot, or null. */
export function nearestEnterable(game: Game, s: Soldier): Vehicle | null {
  if (!s.alive || s.vehicle) return null;
  let best: Vehicle | null = null;
  let bestD = Infinity;
  for (const v of game.vehicles) {
    if (!v.alive || v.driver) continue;
    const d = Math.hypot(s.pos.x - v.pos.x, s.pos.z - v.pos.z);
    if (d <= v.def.radius + TUNING.enterRange && d < bestD) {
      best = v;
      bestD = d;
    }
  }
  return best;
}

/** Puts a soldier in the driver seat (no checks beyond the vehicle being free). */
export function enterVehicle(game: Game, s: Soldier, v: Vehicle): void {
  v.driver = s;
  s.vehicle = v;
  v.team = s.team;
  game.emit({ type: 'enterVehicle', soldier: s, vehicle: v });
}

/** Gets a soldier out, beside the vehicle. */
export function exitVehicle(game: Game, s: Soldier): void {
  const v = s.vehicle;
  if (!v) return;
  v.driver = null;
  s.vehicle = null;
  // right = (-cos yaw, 0, sin yaw)
  const offset = v.def.radius + 1;
  s.pos.x = v.pos.x - Math.cos(v.yaw) * offset;
  s.pos.z = v.pos.z + Math.sin(v.yaw) * offset;
  s.pos.y = heightAt(s.pos.x, s.pos.z);
  s.vel.set(0, 0, 0);
  s.grounded = true;
  game.emit({ type: 'exitVehicle', soldier: s, vehicle: v });
}

/** Sets this frame's control for a vehicle. Call every frame while driving; a vehicle with no control this frame brakes. */
export function driveVehicle(v: Vehicle, ctl: VehicleControl): void {
  controls.set(v.id, ctl);
}

/** Applies damage; at hp <= 0 the vehicle is destroyed (explosion, driver killed) and respawns later at home. */
export function damageVehicle(game: Game, v: Vehicle, amount: number, by: Soldier | null): void {
  if (!v.alive || amount <= 0) return;
  if (by && v.driver && by.team === v.team) return; // no friendly fire on a manned vehicle
  v.hp -= amount;
  flashT.set(v.id, 0.08);
  game.emit({ type: 'vehicleHit', shooter: by, vehicle: v, damage: amount });
  if (v.hp > 0) return;

  v.alive = false;
  v.hp = 0;
  v.respawnT = v.def.respawnS;
  v.speed = 0;
  v.model.group.visible = false;
  game.emit({ type: 'explosion', pos: v.pos.clone(), radius: v.def.radius * 2 });
  game.emit({ type: 'vehicleDestroyed', vehicle: v, by });
  const d = v.driver;
  if (d) {
    v.driver = null;
    d.vehicle = null;
    damageSoldier(game, d, 999, by, 'wreck', false);
  }
}

/** Driving physics, terrain following, collisions, running soldiers over, respawns, model animation. */
export function updateVehicles(game: Game, dt: number): void {
  for (const v of game.vehicles) {
    flashT.set(v.id, Math.max(0, (flashT.get(v.id) ?? 0) - dt));

    if (!v.alive) {
      v.respawnT -= dt;
      if (v.respawnT <= 0) respawnVehicle(v);
      continue;
    }
    if (v.driver && (!v.driver.alive || v.driver.vehicle !== v)) v.driver = null;
    const ctl = v.driver ? (controls.get(v.id) ?? NO_CONTROL) : NO_CONTROL;
    driveOne(game, v, ctl, dt);
  }

  collideVehicles(game);

  for (const v of game.vehicles) {
    if (!v.alive) continue;
    clampToArena(v);
    v.pos.y = heightAt(v.pos.x, v.pos.z);
    if (v.driver) runOver(game, v);
    updateModel(v, dt);
  }

  controls.clear();
}

function respawnVehicle(v: Vehicle): void {
  v.pos.set(v.home.x, 0, v.home.z);
  v.pos.y = heightAt(v.home.x, v.home.z);
  v.yaw = v.home.yaw;
  v.speed = 0;
  v.hp = v.def.maxHp;
  v.alive = true;
  v.respawnT = 0;
  v.team = VEHICLE_SLOTS[v.id].team;
  v.driver = null;
  v.model.group.visible = true;
}

/** Speed, steering, movement, slope and obstacle collisions for one alive vehicle. */
function driveOne(game: Game, v: Vehicle, ctl: VehicleControl, dt: number): void {
  const def = v.def;

  // Speed
  const t = ctl.throttle;
  if (t > 0) {
    v.speed = Math.min(def.maxSpeed, v.speed + def.accel * t * dt);
  } else if (t < 0) {
    if (v.speed > 0) v.speed = Math.max(0, v.speed - def.accel * 2 * dt);
    else v.speed = Math.max(-def.maxSpeed / 3, v.speed - def.accel * dt);
  } else {
    const step = def.accel * 0.6 * dt;
    v.speed = Math.abs(v.speed) <= step ? 0 : v.speed - Math.sign(v.speed) * step;
  }

  // Steering (steer right decreases yaw; reversing flips it)
  v.yaw -= ctl.steer * def.turnRate * dt * Math.min(1, Math.abs(v.speed) / 4) * Math.sign(v.speed);

  // Move
  const fx = Math.sin(v.yaw);
  const fz = Math.cos(v.yaw);
  v.pos.x += fx * v.speed * dt;
  v.pos.z += fz * v.speed * dt;
  v.pos.y = heightAt(v.pos.x, v.pos.z);

  // Slope: gravity's component along the forward vector slows uphill and speeds downhill
  const ahead = heightAt(v.pos.x + fx, v.pos.z + fz);
  const behind = heightAt(v.pos.x - fx, v.pos.z - fz);
  v.speed -= (9 * (ahead - behind)) / 2 * dt;
  v.speed = Math.max(-def.maxSpeed, Math.min(def.maxSpeed, v.speed));

  // Obstacles
  const isCombine = def.kind === 'combine';
  for (const o of game.obstacles) {
    if (isCombine && o.h < 2.5) continue; // the combine rolls over hedges, pots and stones
    const top = heightAt(o.x, o.z) + o.h;
    if (top <= v.pos.y + 0.3) continue;
    const dx = v.pos.x - o.x;
    const dz = v.pos.z - o.z;
    const d = Math.hypot(dx, dz);
    const minD = o.r + def.radius;
    if (d >= minD) continue;
    const nx = d > 1e-6 ? dx / d : 1;
    const nz = d > 1e-6 ? dz / d : 0;
    const movingIn = v.speed * (-fx * nx - fz * nz) > 0;
    if (movingIn) v.speed *= 0.3;
    const push = minD - d;
    v.pos.x += nx * push;
    v.pos.z += nz * push;
  }
}

/** Pushes apart every overlapping pair of alive vehicles. The combine does not move for smaller vehicles. */
function collideVehicles(game: Game): void {
  const vs = game.vehicles;
  for (let i = 0; i < vs.length; i++) {
    const a = vs[i];
    if (!a.alive) continue;
    for (let j = i + 1; j < vs.length; j++) {
      const b = vs[j];
      if (!b.alive) continue;
      const dx = a.pos.x - b.pos.x;
      const dz = a.pos.z - b.pos.z;
      const d = Math.hypot(dx, dz);
      const minD = a.def.radius + b.def.radius;
      if (d >= minD) continue;
      const nx = d > 1e-6 ? dx / d : 1;
      const nz = d > 1e-6 ? dz / d : 0;
      const overlap = minD - d;
      const aCombine = a.def.kind === 'combine';
      const bCombine = b.def.kind === 'combine';
      // Share of the push taken by a and by b.
      let shareA = 0.5;
      let shareB = 0.5;
      if (aCombine && !bCombine) { shareA = 0; shareB = 1; }
      else if (bCombine && !aCombine) { shareA = 1; shareB = 0; }
      a.pos.x += nx * overlap * shareA;
      a.pos.z += nz * overlap * shareA;
      b.pos.x -= nx * overlap * shareB;
      b.pos.z -= nz * overlap * shareB;
      a.speed *= 0.5;
      b.speed *= 0.5;
    }
  }
}

function clampToArena(v: Vehicle): void {
  const lim = ARENA_HALF - v.def.radius - 1;
  v.pos.x = Math.max(-lim, Math.min(lim, v.pos.x));
  v.pos.z = Math.max(-lim, Math.min(lim, v.pos.z));
}

/** Running soldiers over: enemy gnomes on foot in the path take damage and are knocked away if they survive. */
function runOver(game: Game, v: Vehicle): void {
  if (!v.driver || Math.abs(v.speed) < 4) return;
  const def = v.def;
  const driver = v.driver;
  const fx = Math.sin(v.yaw);
  const fz = Math.cos(v.yaw);
  const power = Math.min(1, Math.abs(v.speed) / (0.6 * def.maxSpeed));
  for (const s of game.soldiers) {
    if (!s.alive || s.vehicle || s.team === v.team) continue;
    if (Math.abs(s.pos.y - v.pos.y) >= 2) continue;
    const d = Math.hypot(s.pos.x - v.pos.x, s.pos.z - v.pos.z);
    if (d >= def.radius + TUNING.soldierRadius) continue;
    const key = `${v.id}:${s.id}`;
    const last = lastRunOver.get(key);
    if (last !== undefined && game.time - last < 0.5) continue;
    lastRunOver.set(key, game.time);
    damageSoldier(game, s, def.runOverDamage * power, driver, 'roadkill', false);
    if (s.alive) {
      s.vel.x += fx * 6;
      s.vel.z += fz * 6;
      s.vel.y += 5;
      s.grounded = false;
    }
  }
}

/** Places the model at the vehicle, tilted to the ground normal and turned to its yaw. */
function updateModel(v: Vehicle, dt: number): void {
  const group = v.model.group;
  group.position.copy(v.pos);
  normalAt(v.pos.x, v.pos.z, tmpNormal);
  tmpTilt.setFromUnitVectors(UP, tmpNormal);
  tmpYaw.setFromAxisAngle(UP, v.yaw);
  group.quaternion.copy(tmpTilt).multiply(tmpYaw);
  v.model.animate(dt, Math.abs(v.speed));
  v.model.setFlash((flashT.get(v.id) ?? 0) > 0);
}
