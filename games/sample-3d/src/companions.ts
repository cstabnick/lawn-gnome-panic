import * as THREE from 'three';
import {
  ARENA_HALF, BASE_STATS, MOWER_TIERS, PLAYER_RADIUS, TUNING,
  type CompanionContext, type CompanionSystem, type EnemyView, type GnomeModel,
  type InputState, type Obstacle, type PlayerState, type PlayerStats,
} from './config';
import { createGnome } from './gnome';
import { createNameTag } from './br/bots';
import { createPlayerState, updatePlayer } from './player';
import { heightAt } from './terrain';

const HAT_COLORS = [0x43a047, 0x1e88e5, 0xfb8c00, 0x8e24aa, 0xfdd835, 0x00acc1, 0xec407a];
const SHIRT_COLORS = [0x2e7d32, 0x2f64c9, 0xef6c00, 0x6a1b9a, 0x00838f, 0xad1457, 0x455a64];

const COMPANION_NAMES = [
  'Barnaby', 'Sprout', 'Pebble', 'Gnomercy', 'Bramble', 'Twig', 'Mossy',
  'Mulch Jr.', 'Dandelion', 'Clover', 'Thimble', 'Wobbles', 'Turnip', 'Puddle',
  'Dewdrop', 'Nugget', 'Crumb', 'Pippin',
];

const TAG_OFFSET_Y = 2.05;
const TRACER_S = 0.08;
const FORAGE_SEARCH_RADIUS = 14;
const FORAGE_REACH = 1.15;
const PANIC_RANGE = 5.5;
const FIGHT_RANGE = 12;
const STRAFE_DIST = 4.5;
const MISS_CHANCE = 0.25;

type CompanionMood = 'wander' | 'admire' | 'forage' | 'fight';

interface Companion {
  id: number;
  name: string;
  state: PlayerState;
  stats: PlayerStats;
  model: GnomeModel;
  tag: THREE.Sprite;
  hearts: number;
  invulnS: number;
  alive: boolean;
  respawnS: number;
  mood: CompanionMood;
  moodTimer: number;
  waypoint: { x: number; z: number };
  admireSpin: number;
  jumpCooldown: number;
  attackTimer: number;
  stealCooldown: number;
}

interface Tracer {
  line: THREE.Line;
  array: Float32Array;
  attr: THREE.BufferAttribute;
  timeLeft: number;
}

function unit(x: number, z: number): { x: number; z: number } {
  const len = Math.hypot(x, z);
  return len < 1e-6 ? { x: 0, z: 0 } : { x: x / len, z: z / len };
}

function clampToArena(x: number, z: number): { x: number; z: number } {
  const limit = ARENA_HALF - 3;
  return {
    x: Math.max(-limit, Math.min(limit, x)),
    z: Math.max(-limit, Math.min(limit, z)),
  };
}

function randomAround(cx: number, cz: number, minR: number, maxR: number): { x: number; z: number } {
  const angle = Math.random() * Math.PI * 2;
  const r = minR + Math.random() * (maxR - minR);
  return clampToArena(cx + Math.cos(angle) * r, cz + Math.sin(angle) * r);
}

function pickDistinctNames(count: number): string[] {
  const pool = [...COMPANION_NAMES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function disposeModel(model: GnomeModel): void {
  model.object.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) m.dispose();
    }
  });
}

function disposeTag(tag: THREE.Sprite): void {
  const mat = tag.material as THREE.SpriteMaterial;
  mat.map?.dispose();
  mat.dispose();
}

/** AI companions that follow each player, mimic their run, and cluelessly compete for resources. */
export function createCompanionSystem(scene: THREE.Scene): CompanionSystem {
  const companions: Companion[] = [];
  const tracers: Tracer[] = [];

  function showTracer(ax: number, ay: number, az: number, bx: number, by: number, bz: number): void {
    let t = tracers.find((tr) => tr.timeLeft <= 0);
    if (!t) {
      const array = new Float32Array(6);
      const attr = new THREE.BufferAttribute(array, 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', attr);
      const material = new THREE.LineBasicMaterial({ color: 0xc6ff4a, transparent: true, opacity: 0.75 });
      const line = new THREE.Line(geometry, material);
      line.frustumCulled = false;
      scene.add(line);
      t = { line, array, attr, timeLeft: 0 };
      tracers.push(t);
    }
    t.array.set([ax, ay, az, bx, by, bz]);
    t.attr.needsUpdate = true;
    t.line.visible = true;
    t.timeLeft = TRACER_S;
  }

  function pickMood(c: Companion, ctx: CompanionContext, nearest: EnemyView | undefined, nearestDist: number): void {
    const roll = Math.random();
    if (c.stealCooldown <= 0 && roll < 0.35) {
      const target =
        ctx.pickups.findForageTarget(c.state.position.x, c.state.position.z, FORAGE_SEARCH_RADIUS, ctx.playerPos, TUNING.companionStealPlayerBuffer) ??
        ctx.drops.findForageTarget(c.state.position.x, c.state.position.z, FORAGE_SEARCH_RADIUS, ctx.playerPos, TUNING.companionStealPlayerBuffer);
      if (target) {
        c.mood = 'forage';
        c.waypoint = target;
        c.moodTimer = 3.5 + Math.random() * 2;
        return;
      }
    }
    if (nearest && nearestDist < FIGHT_RANGE && roll < 0.65) {
      c.mood = 'fight';
      c.moodTimer = 2.5 + Math.random() * 2.5;
      return;
    }
    if (roll < 0.82) {
      c.mood = 'wander';
      c.waypoint = randomAround(ctx.playerPos.x, ctx.playerPos.z, 3.5, TUNING.companionOrbitRadius);
      c.moodTimer = 2.5 + Math.random() * 3;
      return;
    }
    c.mood = 'admire';
    c.admireSpin = (Math.random() < 0.5 ? -1 : 1) * (1.2 + Math.random() * 2);
    c.moodTimer = 1.2 + Math.random() * 1.6;
  }

  function think(c: Companion, ctx: CompanionContext, nearest: EnemyView | undefined, nearestDist: number, dt: number): InputState {
    const px = c.state.position.x;
    const pz = c.state.position.z;
    const distToPlayer = Math.hypot(ctx.playerPos.x - px, ctx.playerPos.z - pz);

    let desired = { x: 0, z: 0 };
    let sprint = false;
    let jump = false;

    c.moodTimer -= dt;

    // 1. Stay inside the royale zone if active.
    if (ctx.zone && ctx.zone.isOutside(px, pz)) {
      const zs = ctx.zone.state();
      desired = unit(zs.cx - px, zs.cz - pz);
      sprint = true;
    } else if (distToPlayer > TUNING.companionMaxDist) {
      // 2. Magically keep up: sprint back toward the player when trailing behind.
      desired = unit(ctx.playerPos.x - px, ctx.playerPos.z - pz);
      sprint = true;
    } else if (nearest && nearestDist < PANIC_RANGE) {
      // 3. Clueless panic: run away from close mowers and do unnecessary panic jumps.
      const away = unit(px - nearest.pos.x, pz - nearest.pos.z);
      const wobble = (Math.sin(ctx.elapsedS * 5 + c.id) * 0.4);
      desired = { x: away.x - away.z * wobble, z: away.z + away.x * wobble };
      sprint = true;
      if (c.state.grounded && c.jumpCooldown <= 0 && Math.random() < 0.45) {
        jump = true;
        c.jumpCooldown = 1.4;
      }
    } else {
      if (c.moodTimer <= 0) pickMood(c, ctx, nearest, nearestDist);

      if (c.mood === 'forage') {
        const d = Math.hypot(c.waypoint.x - px, c.waypoint.z - pz);
        if (d < FORAGE_REACH) {
          const claimed =
            ctx.pickups.claimNear(px, pz, FORAGE_REACH) ||
            ctx.drops.claimNear(px, pz, FORAGE_REACH);
          if (claimed) {
            c.stealCooldown = TUNING.companionStealCooldownS + Math.random() * 2.5;
            if (c.state.grounded && c.jumpCooldown <= 0) {
              jump = true;
              c.jumpCooldown = 1.0;
            }
          }
          pickMood(c, ctx, nearest, nearestDist);
        } else {
          desired = { x: c.waypoint.x - px, z: c.waypoint.z - pz };
        }
      } else if (c.mood === 'fight' && nearest && nearestDist < FIGHT_RANGE + 3) {
        const toward = unit(nearest.pos.x - px, nearest.pos.z - pz);
        if (nearestDist > STRAFE_DIST) desired = toward;
        else desired = { x: -toward.z, z: toward.x };
      } else if (c.mood === 'admire') {
        c.state.facing += c.admireSpin * dt;
      } else {
        // 'wander'
        if (Math.hypot(c.waypoint.x - px, c.waypoint.z - pz) < 2) {
          c.waypoint = randomAround(ctx.playerPos.x, ctx.playerPos.z, 3.5, TUNING.companionOrbitRadius);
        }
        desired = { x: c.waypoint.x - px, z: c.waypoint.z - pz };
      }
    }

    // Simple obstacle avoidance.
    const dir = unit(desired.x, desired.z);
    if (dir.x !== 0 || dir.z !== 0) {
      const aheadX = px + dir.x * 1.8;
      const aheadZ = pz + dir.z * 1.8;
      if (ctx.obstacles.some((o: Obstacle) => Math.hypot(o.x - aheadX, o.z - aheadZ) < o.radius + 1.2)) {
        desired = { x: -dir.z, z: dir.x };
      }
    }

    // Occasional random hop just for vibes.
    if (!jump && c.state.grounded && c.jumpCooldown <= 0 && Math.random() < 0.004) {
      jump = true;
      c.jumpCooldown = 2.5;
    }

    const move = unit(desired.x, desired.z);
    return { moveX: -move.x, moveY: move.z, jump, sprint, start: false, lookX: 0, lookY: 0 };
  }

  function stepCompanion(c: Companion, dt: number, ctx: CompanionContext): void {
    if (!ctx.playerAlive) {
      if (c.alive) {
        c.alive = false;
        c.model.setDead(true);
      }
      return;
    }

    if (!c.alive) {
      c.respawnS -= dt;
      if (c.respawnS <= 0) {
        const spot = randomAround(ctx.playerPos.x, ctx.playerPos.z, 5, TUNING.companionOrbitRadius);
        c.state.position.set(spot.x, heightAt(spot.x, spot.z), spot.z);
        c.state.velocity.set(0, 0, 0);
        c.hearts = TUNING.companionHearts;
        c.invulnS = TUNING.invulnS;
        c.alive = true;
        c.model.setDead(false);
        c.mood = 'wander';
        c.moodTimer = 1.5;
        c.waypoint = randomAround(ctx.playerPos.x, ctx.playerPos.z, 3.5, TUNING.companionOrbitRadius);
      }
      return;
    }

    // Keep pace with the player's speed upgrades and teleport if absurdly far behind.
    c.stats.moveSpeed = Math.max(BASE_STATS.moveSpeed * 0.95, ctx.playerStats.moveSpeed * 0.95);
    const distToPlayer = Math.hypot(ctx.playerPos.x - c.state.position.x, ctx.playerPos.z - c.state.position.z);
    if (distToPlayer > TUNING.companionTeleportDist) {
      const spot = randomAround(ctx.playerPos.x, ctx.playerPos.z, 6, TUNING.companionOrbitRadius);
      c.state.position.set(spot.x, heightAt(spot.x, spot.z), spot.z);
      c.state.velocity.set(0, 0, 0);
    }

    c.jumpCooldown -= dt;
    c.stealCooldown -= dt;

    let nearest: EnemyView | undefined;
    let nearestDist = Infinity;
    for (const e of ctx.enemies) {
      const d = Math.hypot(e.pos.x - c.state.position.x, e.pos.z - c.state.position.z);
      if (d < nearestDist) {
        nearest = e;
        nearestDist = d;
      }
    }

    const input = think(c, ctx, nearest, nearestDist, dt);
    updatePlayer(c.state, input, 0, ctx.obstacles, c.stats, dt);

    // Cluelessly fire at nearby mowers; scales gently with player level.
    c.attackTimer -= dt;
    const attackInterval = Math.max(0.28, 0.48 - 0.02 * Math.max(0, ctx.playerLevel - 1));
    if (c.attackTimer <= 0) {
      c.attackTimer = attackInterval;
      if (nearest && nearestDist <= TUNING.companionAttackRange) {
        const px = c.state.position.x;
        const py = c.state.position.y + 0.9;
        const pz = c.state.position.z;
        if (Math.random() < MISS_CHANCE) {
          // Clueless miss: shoot slightly wide.
          const angle = Math.atan2(nearest.pos.z - pz, nearest.pos.x - px) + (Math.random() < 0.5 ? 0.35 : -0.35);
          showTracer(px, py, pz, px + Math.cos(angle) * (nearestDist + 2), 0.7, pz + Math.sin(angle) * (nearestDist + 2));
        } else {
          const dps = TUNING.companionBaseDps + TUNING.companionDpsPerLevel * Math.max(0, ctx.playerLevel - 1);
          ctx.damageEnemy(nearest.id, dps * attackInterval);
          showTracer(px, py, pz, nearest.pos.x, 0.6, nearest.pos.z);
        }
      }
    }

    // Contact damage from mowers.
    c.invulnS -= dt;
    if (c.invulnS <= 0) {
      const px = c.state.position.x;
      const py = c.state.position.y;
      const pz = c.state.position.z;
      const hitter = ctx.enemies.find((e) => {
        const d = Math.hypot(e.pos.x - px, e.pos.z - pz);
        return d < PLAYER_RADIUS + e.radius && py < e.pos.y + MOWER_TIERS[e.tier].height && py > e.pos.y - 0.6;
      });
      if (hitter) {
        c.hearts -= MOWER_TIERS[hitter.tier].contactDamage;
        c.invulnS = TUNING.invulnS;
        if (c.hearts <= 0) {
          c.alive = false;
          c.respawnS = TUNING.companionRespawnS;
          c.model.setDead(true);
        }
      }
    }
  }

  return {
    spawn(count: number, around: THREE.Vector3, ownerColor: number | null): void {
      const names = pickDistinctNames(count);
      for (let i = 0; i < count; i++) {
        const spot = randomAround(around.x, around.z, 4, TUNING.companionOrbitRadius);
        const stats: PlayerStats = { ...BASE_STATS };
        const state = createPlayerState(stats);
        state.position.set(spot.x, heightAt(spot.x, spot.z), spot.z);
        state.facing = Math.random() * Math.PI * 2;

        const hatColor = ownerColor ?? HAT_COLORS[i % HAT_COLORS.length];
        const shirtColor = SHIRT_COLORS[i % SHIRT_COLORS.length];
        const model = createGnome(hatColor, shirtColor);
        const tag = createNameTag(names[i], ownerColor);
        scene.add(model.object, tag);

        companions.push({
          id: i,
          name: names[i],
          state,
          stats,
          model,
          tag,
          hearts: TUNING.companionHearts,
          invulnS: 0,
          alive: true,
          respawnS: 0,
          mood: 'wander',
          moodTimer: 1 + Math.random() * 2,
          waypoint: { x: spot.x, z: spot.z },
          admireSpin: 0,
          jumpCooldown: 0,
          attackTimer: Math.random() * 0.4,
          stealCooldown: 1.5 + Math.random() * 3,
        });
      }
    },

    update(dt: number, ctx: CompanionContext): void {
      for (const t of tracers) {
        if (t.timeLeft > 0) {
          t.timeLeft -= dt;
          if (t.timeLeft <= 0) t.line.visible = false;
        }
      }

      for (const c of companions) {
        stepCompanion(c, dt, ctx);
        const p = c.state.position;
        c.model.update(c.state, dt);
        const invulnerable = c.alive && c.invulnS > 0;
        c.model.object.visible = !invulnerable || Math.floor(ctx.elapsedS * 12) % 2 === 0;
        c.tag.position.set(p.x, p.y + TAG_OFFSET_Y, p.z);
        c.tag.visible = c.alive;
      }
    },

    livingPositions(): THREE.Vector3[] {
      const out: THREE.Vector3[] = [];
      for (const c of companions) {
        if (c.alive) out.push(c.state.position);
      }
      return out;
    },

    snapshot(): [number, string, number, number, number, number, 0 | 1][] {
      return companions.map((c) => [
        c.id,
        c.name,
        c.state.position.x,
        c.state.position.y,
        c.state.position.z,
        c.state.facing,
        c.alive ? 1 : 0,
      ]);
    },

    reset(): void {
      for (const c of companions) {
        scene.remove(c.model.object, c.tag);
        disposeTag(c.tag);
        disposeModel(c.model);
      }
      companions.length = 0;
      for (const t of tracers) {
        scene.remove(t.line);
        t.line.geometry.dispose();
        (t.line.material as THREE.Material).dispose();
      }
      tracers.length = 0;
    },
  };
}
