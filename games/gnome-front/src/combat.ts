// src/combat.ts: rifle fire, reloads, grenades, line of sight, tracers and explosions.
import * as THREE from 'three';
import { GRENADE, TUNING, WEAPONS, weaponOf } from './config';
import type { Game, Soldier, Vehicle, WeaponDef, WeaponId } from './config';
import { heightAt } from './terrain';
import { damageSoldier } from './soldiers';
import { damageVehicle } from './vehicles';

const PINE_R = 0.12;

interface Grenade {
  thrower: Soldier;
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  fuseT: number;
}

/** A short-lived visual (tracer, puff, fireball, smoke). frame(p) gets progress 0..1. */
interface Effect {
  obj: THREE.Object3D;
  age: number;
  life: number;
  frame: (p: number) => void;
}

const grenades: Grenade[] = [];
const effects: Effect[] = [];
let subscribedGame: Game | null = null;

function disposeObject(o: THREE.Object3D): void {
  const m = o as THREE.Mesh;
  m.geometry?.dispose();
  const mat = m.material as THREE.Material | THREE.Material[] | undefined;
  if (Array.isArray(mat)) for (const x of mat) x.dispose();
  else mat?.dispose();
}

/** A random direction within a cone of half-angle `angle` around dir. */
function perturb(dir: THREE.Vector3, angle: number): THREE.Vector3 {
  if (angle <= 0) return dir.clone();
  const up = Math.abs(dir.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const right = new THREE.Vector3().crossVectors(dir, up).normalize();
  const upv = new THREE.Vector3().crossVectors(right, dir).normalize();
  const phi = Math.random() * Math.PI * 2;
  const off = Math.tan(angle * Math.random());
  const out = dir.clone()
    .addScaledVector(right, Math.cos(phi) * off)
    .addScaledVector(upv, Math.sin(phi) * off);
  return out.normalize();
}

/** Ray vs vertical cylinder. dir is a unit vector. Returns the distance t, or -1 for no hit. */
function cylinderHit(origin: THREE.Vector3, dir: THREE.Vector3, pos: THREE.Vector3, r: number, h: number): number {
  const ox = origin.x - pos.x;
  const oz = origin.z - pos.z;
  const a = dir.x * dir.x + dir.z * dir.z;
  if (a < 1e-9) return -1;
  const b = 2 * (ox * dir.x + oz * dir.z);
  const c = ox * ox + oz * oz - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return -1;
  const sq = Math.sqrt(disc);
  const t0 = (-b - sq) / (2 * a);
  const t1 = (-b + sq) / (2 * a);
  if (t1 < 0) return -1;
  const tEnter = Math.max(t0, 0);
  // Candidate points: the entry, and where the ray crosses the bottom and top of the cylinder.
  const cands = [tEnter];
  if (Math.abs(dir.y) > 1e-9) {
    cands.push((pos.y - origin.y) / dir.y, (pos.y + h - origin.y) / dir.y);
  }
  let best = Infinity;
  for (const t of cands) {
    if (!(t >= tEnter && t <= t1)) continue;
    const y = origin.y + dir.y * t;
    if (y >= pos.y && y <= pos.y + h && t < best) best = t;
  }
  return best === Infinity ? -1 : best;
}

/** Ray vs sphere. dir is a unit vector. Returns the entry distance, or -1 for no hit. */
function sphereHit(origin: THREE.Vector3, dir: THREE.Vector3, centre: THREE.Vector3, radius: number): number {
  const oc = new THREE.Vector3().subVectors(origin, centre);
  const b = oc.dot(dir);
  const c = oc.lengthSq() - radius * radius;
  const disc = b * b - c;
  if (disc < 0) return -1;
  const t = -b - Math.sqrt(disc);
  return t < 0 ? -1 : t;
}

function spawnTracer(game: Game, from: THREE.Vector3, to: THREE.Vector3, weapon: WeaponId): void {
  const d = new THREE.Vector3().subVectors(to, from);
  const len = d.length();
  const sniper = weapon === 'peaShooter';
  const lifeS = sniper ? 0.25 : weapon === 'blunderbuss' ? 0.05 : 0.08;
  if (len > 1e-6) {
    d.divideScalar(len);
    const start = from.clone().addScaledVector(d, Math.min(1.2, len));
    const geo = new THREE.BufferGeometry().setFromPoints([start, to.clone()]);
    // Sniper tracers are brighter, so the thin line reads at long range.
    const colour = new THREE.Color(WEAPONS[weapon].tracerColor);
    if (sniper) colour.lerp(new THREE.Color(0xffffff), 0.5);
    const mat = new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity: 1 });
    const line = new THREE.Line(geo, mat);
    game.scene.add(line);
    effects.push({ obj: line, age: 0, life: lifeS, frame: (p) => { mat.opacity = 1 - p; } });
  }
  const puffMat = new THREE.MeshBasicMaterial({ color: 0x9a9a9a, transparent: true, opacity: 0.7 });
  const puff = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), puffMat);
  puff.position.copy(to);
  game.scene.add(puff);
  effects.push({ obj: puff, age: 0, life: 0.3, frame: (p) => { puffMat.opacity = 0.7 * (1 - p); } });
}

function spawnExplosion(game: Game, pos: THREE.Vector3, radius: number): void {
  const fireMat = new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 1 });
  const fire = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), fireMat);
  fire.position.copy(pos);
  fire.scale.setScalar(0.3);
  game.scene.add(fire);
  effects.push({
    obj: fire, age: 0, life: 0.35,
    frame: (p) => {
      fire.scale.setScalar(0.3 + (radius * 0.6 - 0.3) * p);
      fireMat.opacity = 1 - p;
    },
  });

  const smokeMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 1, transparent: true, opacity: 0.6 });
  const smoke = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), smokeMat);
  smoke.position.copy(pos);
  smoke.position.y += 0.5;
  game.scene.add(smoke);
  effects.push({
    obj: smoke, age: 0, life: 1,
    frame: (p) => {
      smoke.position.y = pos.y + 0.5 + 3 * p;
      smoke.scale.setScalar(1.2 + 1.8 * p);
      smokeMat.opacity = 0.6 * (1 - p);
    },
  });
}

function subscribe(game: Game): void {
  if (subscribedGame === game) return;
  subscribedGame = game;
  game.on((e) => {
    if (e.type === 'shot') spawnTracer(game, e.from, e.to, e.weapon);
    else if (e.type === 'explosion') spawnExplosion(game, e.pos, e.radius);
  });
}

/** Fires one rifle shot if the soldier can (alive, fireT <= 0, ammo > 0, not reloading). origin/dir in world space (dir normalised). Returns true if a shot was fired. */
export function tryFire(game: Game, s: Soldier, origin: THREE.Vector3, dir: THREE.Vector3): boolean {
  if (!s.alive || s.fireT > 0 || s.reloadT > 0 || s.ammo <= 0) return false;
  const RIFLE = weaponOf(s);
  s.fireT = RIFLE.fireIntervalS;
  s.ammo--;

  let spread = RIFLE.hipSpreadRad;
  if (s.sprinting) spread *= 2;
  if (s.vehicle) spread *= 1.5;
  const d = perturb(dir, spread);

  let best = raycastWorld(game, origin, d, RIFLE.range);
  let hitSoldier: Soldier | null = null;
  let hitVehicle: Vehicle | null = null;

  for (const o of game.soldiers) {
    if (o === s || !o.alive) continue;
    const t = cylinderHit(origin, d, o.pos, TUNING.soldierRadius, TUNING.soldierHeight);
    if (t >= 0 && t <= RIFLE.range && t < best) {
      best = t;
      hitSoldier = o;
      hitVehicle = null;
    }
  }

  for (const v of game.vehicles) {
    if (v === s.vehicle || !v.alive) continue;
    const centre = new THREE.Vector3(v.pos.x, v.pos.y + v.def.radius * 0.6, v.pos.z);
    const t = sphereHit(origin, d, centre, v.def.radius);
    if (t >= 0 && t <= RIFLE.range && t < best) {
      best = t;
      hitSoldier = null;
      hitVehicle = v;
    }
  }

  const hitPoint = origin.clone().addScaledVector(d, best);
  game.emit({ type: 'shot', shooter: s, weapon: RIFLE.id, from: origin.clone(), to: hitPoint });

  if (hitSoldier) {
    const headshot = hitPoint.y - hitSoldier.pos.y > 1.05;
    damageSoldier(game, hitSoldier, RIFLE.damage * (headshot ? RIFLE.headshotMult : 1), s, 'gun', headshot, RIFLE.id);
  } else if (hitVehicle) {
    damageVehicle(game, hitVehicle, RIFLE.damage * RIFLE.vehicleDamageMult, s);
  }

  if (s.ammo === 0) startReload(game, s);
  return true;
}

/** Starts a reload if the magazine is not full, reserve > 0 and none is in progress. */
export function startReload(game: Game, s: Soldier): void {
  const RIFLE = weaponOf(s);
  if (!s.alive || s.reloadT > 0 || s.ammo >= RIFLE.magSize || s.reserve <= 0) return;
  s.reloadT = RIFLE.reloadS;
  game.emit({ type: 'reload', soldier: s });
}

/** Throws a pinecone grenade if the soldier has one. Returns true if thrown. */
export function throwGrenade(game: Game, s: Soldier, origin: THREE.Vector3, dir: THREE.Vector3): boolean {
  if (!s.alive || s.grenades <= 0) return false;
  s.grenades--;
  subscribe(game);

  const geo = new THREE.ConeGeometry(PINE_R, 0.3, 8);
  const mat = new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  const pos = origin.clone().addScaledVector(dir, 0.6);
  mesh.position.copy(pos);
  game.scene.add(mesh);

  const vel = dir.clone().multiplyScalar(GRENADE.throwSpeed).add(new THREE.Vector3(0, 3, 0)).add(s.vel);
  grenades.push({ thrower: s, mesh, pos, vel, fuseT: GRENADE.fuseS });
  game.emit({ type: 'grenadeThrown', thrower: s });
  return true;
}

/** Distance along the ray to the first obstacle or the ground, or maxDist. */
export function raycastWorld(game: Game, origin: THREE.Vector3, dir: THREE.Vector3, maxDist: number): number {
  // (a) obstacles: 2D ray-circle in xz, checked at the entry point only.
  let tObs = Infinity;
  const a = dir.x * dir.x + dir.z * dir.z;
  if (a > 1e-9) {
    for (const o of game.obstacles) {
      const ox = origin.x - o.x;
      const oz = origin.z - o.z;
      const b = 2 * (ox * dir.x + oz * dir.z);
      const c = ox * ox + oz * oz - o.r * o.r;
      const disc = b * b - 4 * a * c;
      if (disc < 0) continue;
      const sq = Math.sqrt(disc);
      const t0 = (-b - sq) / (2 * a);
      const t1 = (-b + sq) / (2 * a);
      if (t1 < 0) continue;
      const t = Math.max(t0, 0);
      if (t > maxDist || t >= tObs) continue;
      const y = origin.y + dir.y * t;
      if (y < heightAt(o.x, o.z) + o.h) tObs = t;
    }
  }

  // (b) terrain: march in 1-unit steps up to the nearest obstacle, then bisect.
  const limit = Math.min(maxDist, tObs);
  const p = new THREE.Vector3();
  const below = (t: number): boolean => {
    p.copy(origin).addScaledVector(dir, t);
    return p.y < heightAt(p.x, p.z);
  };
  if (below(0)) return 0;
  let t = 0;
  while (t < limit) {
    const next = Math.min(t + 1, limit);
    if (below(next)) {
      let lo = t;
      let hi = next;
      for (let i = 0; i < 6; i++) {
        const mid = (lo + hi) / 2;
        if (below(mid)) hi = mid;
        else lo = mid;
      }
      return hi;
    }
    t = next;
  }
  return limit;
}

/** True if nothing static (obstacles, terrain) blocks the segment from a to b. */
export function lineOfSight(game: Game, a: THREE.Vector3, b: THREE.Vector3): boolean {
  const d = a.distanceTo(b);
  if (d < 1e-6) return true;
  const dir = new THREE.Vector3().subVectors(b, a).divideScalar(d);
  return raycastWorld(game, a, dir, d) >= d - 0.05;
}

function explode(game: Game, g: Grenade): void {
  const blast = g.pos.clone();
  game.emit({ type: 'explosion', pos: blast.clone(), radius: GRENADE.radius });

  const eye = blast.clone().add(new THREE.Vector3(0, 0.3, 0));
  for (const s of game.soldiers) {
    if (!s.alive) continue;
    const chest = s.pos.clone().add(new THREE.Vector3(0, 0.7, 0));
    const d = chest.distanceTo(blast);
    if (d > GRENADE.radius) continue;
    if (!lineOfSight(game, eye, chest)) continue;
    damageSoldier(game, s, GRENADE.damage * (1 - d / GRENADE.radius), g.thrower, 'grenade', false);
  }

  for (const v of game.vehicles) {
    if (!v.alive) continue;
    const d = v.pos.distanceTo(blast);
    if (d > GRENADE.radius + v.def.radius) continue;
    const falloff = 1 - Math.max(0, d - v.def.radius) / GRENADE.radius;
    damageVehicle(game, v, GRENADE.vehicleDamage * falloff, g.thrower);
  }
}

/** Weapon timers and reload completion, grenade flight and explosions, and fading tracer/explosion visuals. */
export function updateCombat(game: Game, dt: number): void {
  subscribe(game);

  // Weapons.
  for (const s of game.soldiers) {
    s.fireT = Math.max(0, s.fireT - dt);
    if (!s.alive) {
      s.reloadT = 0;
      continue;
    }
    if (s.reloadT > 0) {
      s.reloadT -= dt;
      if (s.reloadT <= 0) {
        s.reloadT = 0;
        const take = Math.min(weaponOf(s).magSize - s.ammo, s.reserve);
        s.ammo += take;
        s.reserve -= take;
      }
    }
  }

  // Grenades.
  for (let i = grenades.length - 1; i >= 0; i--) {
    const g = grenades[i];
    g.vel.y -= TUNING.gravity * dt;
    g.pos.addScaledVector(g.vel, dt);

    const gh = heightAt(g.pos.x, g.pos.z);
    if (g.pos.y < gh) {
      g.pos.y = gh;
      g.vel.y = -g.vel.y * 0.35;
      g.vel.x *= 0.6;
      g.vel.z *= 0.6;
    }

    for (const o of game.obstacles) {
      const dx = g.pos.x - o.x;
      const dz = g.pos.z - o.z;
      const d = Math.hypot(dx, dz);
      const reach = o.r + PINE_R;
      if (d >= reach || g.pos.y >= heightAt(o.x, o.z) + o.h) continue;
      const nx = d > 1e-6 ? dx / d : 1;
      const nz = d > 1e-6 ? dz / d : 0;
      g.pos.x = o.x + nx * reach;
      g.pos.z = o.z + nz * reach;
      const vn = g.vel.x * nx + g.vel.z * nz;
      if (vn < 0) {
        g.vel.x -= 1.5 * vn * nx;
        g.vel.z -= 1.5 * vn * nz;
      }
    }

    g.mesh.position.copy(g.pos);
    g.mesh.rotation.x += dt * 8;
    g.mesh.rotation.z += dt * 5;

    g.fuseT -= dt;
    if (g.fuseT <= 0) {
      explode(game, g);
      game.scene.remove(g.mesh);
      disposeObject(g.mesh);
      grenades.splice(i, 1);
    }
  }

  // Fading visuals.
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i];
    e.age += dt;
    const p = Math.min(1, e.age / e.life);
    e.frame(p);
    if (e.age >= e.life) {
      game.scene.remove(e.obj);
      disposeObject(e.obj);
      effects.splice(i, 1);
    }
  }
}
