// Boss moves: telegraphed attacks of bosses (rings, cones, lanes, summons, pulls, pools, vanish, buffs).
// Each move draws a red ground decal for its telegraph time, then resolves it against the player.
import * as THREE from 'three';
import { PLAYER_ID } from './config';
import type { BossMoveDef, Entity, EnemyDef } from './config';
import { ENEMIES } from './content';
import { applyStatus, canAct, dealDamage, playerMitigation } from './combat';
import { talentBonus } from './abilities';
import { allEntities, getEntity, isEntityAuthority, spawnEnemyAt } from './entities';
import { bus } from './events';
import { player } from './player';
import { enemyStats } from './rules';
import { heightAt, isBlocked } from './terrain';

const TELEGRAPH_COLOR = 0xff3030;
const CONE_HALF_ANGLE = Math.PI / 6;
const PULL_FRACTION = 0.7;
const VANISH_SECONDS = 3;
const POOL_SECONDS = 6;
const BUFF_SECONDS = 8;
const BUFF_MULTIPLIER = 1.3;
const SUMMON_OFFSET = 2.5;

/** A telegraph (or a timed step) waiting to resolve. */
interface Pending {
  age: number;
  duration: number;
  mesh: THREE.Mesh | null;
  onDone: () => void;
}

/** A lingering damage disc left by a pool move. */
interface Pool {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  radius: number;
  left: number;
  tick: number;
  def: EnemyDef;
  move: BossMoveDef;
}

let scene: THREE.Scene | null = null;
const pending: Pending[] = [];
const pools: Pool[] = [];
/** Seconds until each boss move fires again, keyed by `${entityId}:${moveId}`. */
const timers = new Map<string, number>();
/** Bosses under the damage buff: seconds left and the glow mesh on their model. */
const buffs = new Map<number, { left: number; glow: THREE.Mesh; owner: THREE.Object3D }>();
/** Bosses hidden by vanish, with the spot they are pinned to until they reappear. */
const hidden = new Map<number, { x: number; z: number }>();

/** Keeps the scene the boss telegraphs are drawn in. */
export function initBossMoves(s: THREE.Scene): void {
  scene = s;
}

/** Per-frame boss move timers, telegraphs, pools and buffs. */
export function updateBossMoves(dt: number): void {
  updatePending(dt);
  updatePools(dt);
  updateBuffs(dt);
  pinHidden();

  for (const e of allEntities()) {
    if (e.kind !== 'enemy' || e.dead || !e.inCombat) continue;
    const def = ENEMIES[e.defId] as EnemyDef | undefined;
    if (!def?.moves) continue;
    for (const move of def.moves) {
      const key = `${e.id}:${move.id}`;
      const left = (timers.get(key) ?? move.every * 0.6) - dt;
      if (left > 0) {
        timers.set(key, left);
        continue;
      }
      timers.set(key, move.every);
      if (!bossCanAct(e.id)) continue;
      if (move.belowHpPct !== undefined && e.hp / e.maxHp > move.belowHpPct) continue;
      fire(e, def, move);
    }
  }
}

/** Multiplier on a boss's damage: 1.3 while its buff move is active, else 1. Read by combat when a boss hits. */
export function bossDamageMultiplier(entityId: number): number {
  return buffs.has(entityId) ? BUFF_MULTIPLIER : 1;
}

/** A boss can act when it is alive and not hidden by vanish. */
function bossCanAct(id: number): boolean {
  const e = getEntity(id);
  return !!e && !e.dead && !hidden.has(id) && canAct(id);
}

function fire(e: Entity, def: EnemyDef, move: BossMoveDef): void {
  bus.emit('boss-phase', { boss: e.name, phase: 0, text: move.name });
  const cx = e.position.x;
  const cz = e.position.z;
  const px = player.position.x;
  const pz = player.position.z;

  switch (move.kind) {
    case 'ring': {
      const r = move.radius ?? 3;
      const mesh = groundMesh(discGeo(r), telegraphMaterial(), cx, cz);
      schedule(move.telegraph, mesh, () => {
        if (inDisc(cx, cz, r, player.position.x, player.position.z)) hitPlayer(def, move);
      });
      break;
    }
    case 'cone': {
      const r = move.radius ?? 6;
      const dir = Math.atan2(px - cx, pz - cz);
      const mesh = groundMesh(coneGeo(r), telegraphMaterial(), cx, cz);
      mesh.rotation.y = dir - Math.PI / 2;
      schedule(move.telegraph, mesh, () => {
        if (inCone(cx, cz, r, dir, player.position.x, player.position.z)) hitPlayer(def, move);
      });
      break;
    }
    case 'lane': {
      const len = move.length ?? 8;
      const wid = move.width ?? 1.5;
      const dir = Math.atan2(px - cx, pz - cz);
      const mesh = groundMesh(laneGeo(wid, len), telegraphMaterial(), cx, cz);
      mesh.rotation.y = dir;
      schedule(move.telegraph, mesh, () => {
        if (inLane(cx, cz, dir, len, wid, player.position.x, player.position.z)) hitPlayer(def, move);
      });
      break;
    }
    case 'pool': {
      const r = move.radius ?? 2;
      const mesh = groundMesh(discGeo(r), telegraphMaterial(), px, pz);
      schedule(move.telegraph, mesh, () => {
        const mat = new THREE.MeshBasicMaterial({ color: TELEGRAPH_COLOR, transparent: true, opacity: 0.3, depthWrite: false });
        const pm = groundMesh(discGeo(r), mat, px, pz);
        scene?.add(pm);
        // First tick one second after the pool forms.
        pools.push({ mesh: pm, x: px, z: pz, radius: r, left: POOL_SECONDS, tick: 1, def, move });
      });
      break;
    }
    case 'summon': {
      if (!move.summon || !isEntityAuthority(e.id)) break;
      const { enemy, count } = move.summon;
      const mesh = groundMesh(discGeo(move.radius ?? SUMMON_OFFSET), telegraphMaterial(), cx, cz);
      schedule(move.telegraph, mesh, () => {
        const boss = getEntity(e.id);
        if (!boss || boss.dead) return;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + Math.random();
          spawnEnemyAt(enemy, boss.position.x + Math.cos(a) * SUMMON_OFFSET, boss.position.z + Math.sin(a) * SUMMON_OFFSET);
        }
      });
      break;
    }
    case 'pull': {
      const r = move.radius ?? 6;
      const mesh = groundMesh(discGeo(r), telegraphMaterial(), cx, cz);
      schedule(move.telegraph, mesh, () => {
        const boss = getEntity(e.id);
        if (!boss || boss.dead || player.dead) return;
        const qx = player.position.x + (boss.position.x - player.position.x) * PULL_FRACTION;
        const qz = player.position.z + (boss.position.z - player.position.z) * PULL_FRACTION;
        if (isBlocked(qx, qz)) return;
        player.position.set(qx, heightAt(qx, qz), qz);
        player.path = [];
      });
      break;
    }
    case 'vanish': {
      const r = move.radius ?? 2;
      const mesh = groundMesh(discGeo(r), telegraphMaterial(), cx, cz);
      schedule(move.telegraph, mesh, () => hideBoss(e.id, def, move));
      break;
    }
    case 'buff': {
      applyBuff(e);
      break;
    }
  }
}

/** Hides the boss for VANISH_SECONDS, then it reappears next to the player with a ring hit. */
function hideBoss(id: number, def: EnemyDef, move: BossMoveDef): void {
  const boss = getEntity(id);
  if (!boss || boss.dead) return;
  hidden.set(id, { x: boss.position.x, z: boss.position.z });
  boss.object.visible = false;
  schedule(VANISH_SECONDS, null, () => {
    const b = getEntity(id);
    hidden.delete(id);
    if (!b || b.dead) return;
    const nx = player.position.x + 1.5;
    const nz = player.position.z;
    b.position.set(nx, heightAt(nx, nz), nz);
    b.object.visible = true;
    const r = move.radius ?? 3;
    const mesh = groundMesh(discGeo(r), telegraphMaterial(), nx, nz);
    schedule(0.5, mesh, () => {
      if (inDisc(nx, nz, r, player.position.x, player.position.z)) hitPlayer(def, move);
    });
  });
}

/** Glows the boss and raises its damage for BUFF_SECONDS. */
function applyBuff(e: Entity): void {
  const old = buffs.get(e.id);
  if (old) {
    old.owner.remove(old.glow);
    old.glow.geometry.dispose();
    (old.glow.material as THREE.Material).dispose();
  }
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.25, depthWrite: false }),
  );
  glow.position.set(0, 1, 0);
  e.object.add(glow);
  buffs.set(e.id, { left: BUFF_SECONDS, glow, owner: e.object });
}

/** Deals a move's damage and status to the player, scaled from the enemy's normal hit and mitigated by armor/talents. */
function hitPlayer(def: EnemyDef, move: BossMoveDef): void {
  if (player.dead) return;
  const [lo, hi] = enemyStats(def).damage;
  const avg = (lo + hi) / 2;
  let dmg = avg * (move.damage ?? 1);
  if (def.damageType === 'slash' || def.damageType === 'crush' || def.damageType === 'pierce') {
    dmg *= 1 - playerMitigation(def.level);
  } else {
    dmg *= 1 - Math.min(0.6, talentBonus('reductionPct') / 100);
  }
  dealDamage(PLAYER_ID, dmg, def.damageType, { noRoll: true });
  if (move.status) {
    const isDot = move.status === 'poisoned' || move.status === 'burning' || move.status === 'chipped';
    const dotPower = isDot ? Math.max(1, avg * 0.25) : 0;
    applyStatus(PLAYER_ID, move.status, move.statusSeconds ?? 3, dotPower);
  }
}

// ---------------------------------------------------------------- telegraphs

function telegraphMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color: TELEGRAPH_COLOR, transparent: true, opacity: 0.35, depthWrite: false });
}

/** A flat mesh on the ground at (x, z). */
function groundMesh(geo: THREE.BufferGeometry, mat: THREE.MeshBasicMaterial, x: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, heightAt(x, z) + 0.05, z);
  return m;
}

/** Full disc of radius r, centred on the origin, lying flat. */
function discGeo(r: number): THREE.BufferGeometry {
  return new THREE.CircleGeometry(r, 32).rotateX(-Math.PI / 2);
}

/** 60 degree sector of radius r, pointing along +x (rotate.y to aim). */
function coneGeo(r: number): THREE.BufferGeometry {
  return new THREE.CircleGeometry(r, 24, -CONE_HALF_ANGLE, CONE_HALF_ANGLE * 2).rotateX(-Math.PI / 2);
}

/** Rectangle from the origin out along +z, length by width (rotate.y to aim). */
function laneGeo(width: number, length: number): THREE.BufferGeometry {
  return new THREE.PlaneGeometry(width, length).rotateX(-Math.PI / 2).translate(0, 0, length / 2);
}

/** Runs `onDone` after `duration` seconds; a mesh, if given, is drawn and fades up meanwhile. */
function schedule(duration: number, mesh: THREE.Mesh | null, onDone: () => void): void {
  if (mesh && scene) scene.add(mesh);
  pending.push({ age: 0, duration, mesh, onDone });
}

function updatePending(dt: number): void {
  for (let i = pending.length - 1; i >= 0; i--) {
    const p = pending[i];
    p.age += dt;
    const t = Math.min(1, p.age / Math.max(p.duration, 1e-3));
    if (p.mesh) (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.4 * t;
    if (t < 1) continue;
    pending.splice(i, 1);
    if (p.mesh) {
      scene?.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    }
    p.onDone();
  }
}

function updatePools(dt: number): void {
  for (let i = pools.length - 1; i >= 0; i--) {
    const p = pools[i];
    p.left -= dt;
    p.tick -= dt;
    if (p.tick <= 0) {
      p.tick += 1;
      if (inDisc(p.x, p.z, p.radius, player.position.x, player.position.z)) hitPlayer(p.def, p.move);
    }
    if (p.left <= 0) {
      scene?.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
      pools.splice(i, 1);
    }
  }
}

function updateBuffs(dt: number): void {
  for (const [id, b] of buffs) {
    const e = getEntity(id);
    b.left -= dt;
    if (b.left <= 0 || !e || e.dead) {
      b.owner.remove(b.glow);
      b.glow.geometry.dispose();
      (b.glow.material as THREE.Material).dispose();
      buffs.delete(id);
    }
  }
}

/** Keeps vanished bosses at their hiding spot and stops them attacking while hidden. */
function pinHidden(): void {
  for (const [id, spot] of hidden) {
    const e = getEntity(id);
    if (!e || e.dead) {
      hidden.delete(id);
      continue;
    }
    e.position.set(spot.x, heightAt(spot.x, spot.z), spot.z);
    e.attackTimer = Math.max(e.attackTimer, 1);
  }
}

// ---------------------------------------------------------------- shape tests

function inDisc(cx: number, cz: number, r: number, x: number, z: number): boolean {
  return (x - cx) ** 2 + (z - cz) ** 2 <= r * r;
}

/** Within `r` of (cx, cz) and within 30 degrees either side of `dir` (atan2(dx, dz) convention). */
function inCone(cx: number, cz: number, r: number, dir: number, x: number, z: number): boolean {
  const dx = x - cx;
  const dz = z - cz;
  if (dx * dx + dz * dz > r * r) return false;
  if (dx === 0 && dz === 0) return true;
  return angleDiff(Math.atan2(dx, dz), dir) <= CONE_HALF_ANGLE;
}

function inLane(cx: number, cz: number, dir: number, len: number, wid: number, x: number, z: number): boolean {
  const dx = x - cx;
  const dz = z - cz;
  const along = dx * Math.sin(dir) + dz * Math.cos(dir);
  const across = Math.abs(dx * Math.cos(dir) - dz * Math.sin(dir));
  return along >= 0 && along <= len && across <= wid / 2;
}

/** Smallest absolute difference between two angles, in radians. */
function angleDiff(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}
