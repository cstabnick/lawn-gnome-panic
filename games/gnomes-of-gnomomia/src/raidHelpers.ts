// Raid helpers in the world: Wayfarers who answer a horn call (models, movement, swings, heals, enemy targets).
import * as THREE from 'three';
import { createGnomeModel, type GnomeModel } from '@lawn/gnome';
import { PLAYER_LOOK, TUNING, look, type ClassId, type Entity } from './config';
import { ENEMIES } from './content';
import { dealDamage, healPlayer } from './combat';
import { RAID_HELPER_TARGET_BASE, allEntities, getEntity, setTargetSource, type RemoteTarget } from './entities';
import { player } from './player';
import { enemyStats } from './rules';
import { maxHp, state } from './state';
import { heightAt, isBlocked } from './terrain';
import {
  createHelperState, damageHelper, helperStats, isUp, pickHealTarget, tickHelper,
  type HelperState, type HelperStats,
} from './raidHelperLogic';
import type { HelperRole, RaidDef, RaidSeat } from './raidTypes';

export interface RaidHelperView { seatId: string; name: string; classId: ClassId; role: HelperRole; hp: number; hpMax: number; down: boolean }

/** Helpers spawn on a ring this far from the player, one every RING_STEP radians. */
const RING_RADIUS = 2.5;
const RING_STEP = 2.1;
/** With no target, a helper stands this far behind the player. */
const BEHIND_DIST = 2.5;
/** Swing animation length (s), as companions use. */
const SWING_SECONDS = 0.35;
/** Walk speed as a share of the player's walk speed. */
const WALK_FRACTION = 0.95;
/** Extra reach beyond stats.range that still lands a swing. */
const SWING_REACH = 0.5;
/** A helper this close to its walk goal stops. */
const ARRIVE = 0.3;
/** Adds count as raid-area enemies within raid.r plus this many metres of the centre. */
const ADD_PAD = 6;

interface Helper {
  seat: RaidSeat;
  st: HelperState;
  stats: HelperStats;
  model: GnomeModel;
  position: THREE.Vector3;
  facing: number;
  /** Seconds left on the swing animation. */
  swing: number;
  /** Entity id of the current enemy target, or null. */
  target: number | null;
  /** The down pose is on the model (setDead(true) has been called). */
  shownDown: boolean;
}

let sceneRef: THREE.Scene | null = null;
let raidDef: RaidDef | null = null;
let helpers: Helper[] = [];
const velScratch = new THREE.Vector3();

/** Helper i's enemy-target id (entities.ts RAID_HELPER_TARGET_BASE - i). */
function targetIdOf(h: Helper): number {
  return RAID_HELPER_TARGET_BASE - h.st.index;
}

function helperByTargetId(id: number): Helper | undefined {
  const index = RAID_HELPER_TARGET_BASE - id;
  return helpers.find((h) => h.st.index === index);
}

/** Registers the helpers as local AI targets (once per init; entities.ts keeps one source under 'raid-helpers'). */
export function initRaidHelpers(scene: THREE.Scene): void {
  sceneRef = scene;
  setTargetSource('raid-helpers', {
    targets: (): RemoteTarget[] => helpers.map((h) => ({
      id: targetIdOf(h),
      x: h.position.x,
      z: h.position.z,
      zone: raidDef ? raidDef.zone : null,
      dead: !isUp(h.st),
    })),
    attack: (id: number, enemy: Entity): void => {
      const h = helperByTargetId(id);
      const def = ENEMIES[enemy.defId];
      if (!h || !def) return;
      const [lo, hi] = enemyStats(def).damage;
      damageHelper(h.st, (lo + hi) / 2);
    },
  });
}

/** Removes the old helpers, then builds one gnome per helper seat around the player. */
export function spawnRaidHelpers(seats: readonly RaidSeat[], raid: RaidDef): void {
  despawnRaidHelpers();
  if (!sceneRef) return;
  raidDef = raid;
  const scene = sceneRef;
  seats.filter((s) => s.kind === 'helper').forEach((seat, i) => {
    const colors = seat.colors;
    const model = createGnomeModel(colors ? look(colors.hat, colors.shirt, colors.beard) : PLAYER_LOOK);
    model.object.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    const a = i * RING_STEP;
    const x = player.position.x + Math.cos(a) * RING_RADIUS;
    const z = player.position.z + Math.sin(a) * RING_RADIUS;
    const position = new THREE.Vector3(x, heightAt(x, z), z);
    scene.add(model.object);
    helpers.push({
      seat,
      st: createHelperState(i, seat),
      stats: helperStats(seat.role, seat.level),
      model,
      position,
      facing: Math.atan2(player.position.x - x, player.position.z - z),
      swing: 0,
      target: null,
      shownDown: false,
    });
  });
}

/** Picks the enemy a helper fights: tank on the boss, damage on adds first, healer on the boss. Null = none (walk behind player). */
function chooseTarget(h: Helper, bossId: number | null, raid: RaidDef): number | null {
  const boss = bossId !== null ? getEntity(bossId) : undefined;
  const bossAlive = boss && !boss.dead ? boss : undefined;
  if (h.seat.role === 'tank' || h.seat.role === 'healer') return bossAlive ? bossAlive.id : null;
  let best: Entity | null = null;
  for (const e of allEntities()) {
    if (e.kind !== 'enemy' || e.dead || e.id === bossId) continue;
    if (Math.hypot(e.position.x - raid.x, e.position.z - raid.z) > raid.r + ADD_PAD) continue;
    if (!best || e.hp < best.hp) best = e;
  }
  if (best) return best.id;
  return bossAlive ? bossAlive.id : null;
}

/** Walks toward (tx, tz) and stops `stop` metres short. Returns the velocity used (shared scratch vector). */
function walkToward(h: Helper, tx: number, tz: number, stop: number, dt: number): THREE.Vector3 {
  velScratch.set(0, 0, 0);
  const dx = tx - h.position.x;
  const dz = tz - h.position.z;
  const dist = Math.hypot(dx, dz);
  if (dist <= stop || dist < 1e-6) return velScratch;
  const speed = TUNING.walkSpeed * WALK_FRACTION;
  const k = Math.min(speed * dt, dist - stop) / dist;
  const nx = h.position.x + dx * k;
  const nz = h.position.z + dz * k;
  if (isBlocked(nx, nz)) return velScratch;
  h.position.x = nx;
  h.position.z = nz;
  h.position.y = heightAt(nx, nz);
  if (dt > 0) velScratch.set((dx * k) / dt, 0, (dz * k) / dt);
  return velScratch;
}

/** Per frame: AI for every helper (walk, swing, heal, animate) and the model pose. */
export function updateRaidHelpers(dt: number, bossId: number | null): void {
  if (!raidDef || helpers.length === 0) return;
  const raid = raidDef;
  const states = helpers.map((h) => h.st);
  for (const h of helpers) {
    const t = tickHelper(h.st, dt);
    if (!isUp(h.st)) {
      if (!h.shownDown) { h.model.setDead(true); h.shownDown = true; }
      h.target = null;
      h.position.y = heightAt(h.position.x, h.position.z);
      h.model.update({ position: h.position, velocity: velScratch.set(0, 0, 0), facing: h.facing, grounded: true, jumpsUsed: 0 }, dt);
      continue;
    }
    if (h.shownDown) { h.model.setDead(false); h.shownDown = false; }

    h.target = chooseTarget(h, bossId, raid);
    const tgt = h.target !== null ? getEntity(h.target) : undefined;
    let vel: THREE.Vector3;
    if (tgt && !tgt.dead) {
      const dist = Math.hypot(tgt.position.x - h.position.x, tgt.position.z - h.position.z);
      vel = walkToward(h, tgt.position.x, tgt.position.z, h.stats.range, dt);
      h.facing = Math.atan2(tgt.position.x - h.position.x, tgt.position.z - h.position.z);
      if (t.attack && dist <= h.stats.range + SWING_REACH) {
        dealDamage(tgt.id, h.stats.hit, h.stats.damageType, { attacker: targetIdOf(h), noRoll: true });
        h.swing = SWING_SECONDS;
      }
    } else {
      // No target (countdown, or the boss and adds are gone): stand a little behind the player.
      const fx = Math.sin(player.facing);
      const fz = Math.cos(player.facing);
      const spotX = player.position.x - fx * BEHIND_DIST;
      const spotZ = player.position.z - fz * BEHIND_DIST;
      vel = walkToward(h, spotX, spotZ, ARRIVE, dt);
      h.facing = Math.atan2(player.position.x - h.position.x, player.position.z - h.position.z);
    }

    if (t.heal) {
      const pick = pickHealTarget(state.hp / maxHp(), states);
      if (pick === 'player') {
        healPlayer(h.stats.heal);
      } else if (pick !== null) {
        const other = helpers.find((o) => o.st.index === pick);
        if (other) other.st.hp = Math.min(other.st.hpMax, other.st.hp + h.stats.heal);
      }
    }

    if (h.swing > 0) {
      h.swing = Math.max(0, h.swing - dt);
      h.model.arms.right.rotation.x = -2.4 * Math.sin(Math.PI * (1 - h.swing / SWING_SECONDS));
    }
    h.model.update({ position: h.position, velocity: vel, facing: h.facing, grounded: true, jumpsUsed: 0 }, dt);
  }
}

/** Removes every helper model from the scene and forgets them (the target source then yields nothing). */
export function despawnRaidHelpers(): void {
  for (const h of helpers) h.model.object.parent?.remove(h.model.object);
  helpers = [];
  raidDef = null;
}

export function raidHelperViews(): readonly RaidHelperView[] {
  return helpers.map((h) => ({
    seatId: h.seat.id,
    name: h.seat.name,
    classId: h.seat.classId,
    role: h.seat.role,
    hp: h.st.hp,
    hpMax: h.st.hpMax,
    down: !isUp(h.st),
  }));
}

/** Target id of the first up tank (for enemies choosing a target), or null. */
export function tankTargetId(): number | null {
  const tank = helpers.find((h) => h.seat.role === 'tank' && isUp(h.st));
  return tank ? targetIdOf(tank) : null;
}

/** Target ids of every helper that is up. */
export function upHelperTargetIds(): number[] {
  return helpers.filter((h) => isUp(h.st)).map(targetIdOf);
}
