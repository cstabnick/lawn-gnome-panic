// Player movement: walk, jog, sprint (stamina), crouch, gravity and falls, kerb vaults, climbing up and down
// by fixed routes or a placed rope or ladder, step noise, region and haven tracking.
import * as THREE from 'three';
import {
  CARRY, CLIMB, LADDER_MAX, MOVE, NOISE, PLAYER_HEIGHT, PLAYER_RADIUS, ROPE_MAX, STAMINA, STEP_UP, VAULT_MAX,
} from '../config';
import type { Collider, FaceHit } from '../world/collide';
import type { ClimbRouteDef, RouteKind } from '../world/types';
import type { Bus } from './bus';
import type { ClimbHint, ClimbVia, MoveMods, PlayerController, PlayerState, Vec3 } from './types';

const TOO_HIGH = 'Too high to climb. A rope reaches 15 gm, a ladder 10.';
const HINT_EVERY = 3;        // s between 'too high' hints
const TURN_RATE = 10;        // rad/s the gnome turns toward where it moves
const STEP_LERP = 20;        // 1/s: how fast y follows small steps up and down
const PAST_FACE = 0.6;       // gm past a face where a vault or climb ends
const FALL_EVENT = 2;        // gm: falls higher than this emit 'fell'

export function createPlayerState(spawn: Vec3): PlayerState {
  return {
    pos: new THREE.Vector3(spawn.x, spawn.y, spawn.z), vel: new THREE.Vector3(), facing: 0,
    grounded: true, stance: 'stand', sprinting: false, stamina: STAMINA.max,
    climbing: null, vaulting: 0, fallFromY: null, speed: 0, noise: 0,
    region: null, haven: null, alive: true,
  };
}

/** Per-player motion data the shared PlayerState has no field for. */
interface Extra {
  dirX: number; dirZ: number;           // climb / vault direction (unit, xz)
  stepPast: number;                     // gm to move along dir when a climb up ends
  vaultFrom: Vec3; vaultTo: Vec3;
  sinceSpend: number;                   // s since stamina was last spent
  noiseTimer: number;
}

/** What a climb press would do: the plan, with no side effects yet. */
type Plan =
  | { kind: 'down'; hit: FaceHit; height: number; bottomY: number; via: ClimbVia; place: RouteKind | null }
  | { kind: 'vault'; hit: FaceHit; height: number }
  | { kind: 'up'; hit: FaceHit; height: number; via: ClimbVia; place: RouteKind | null }
  | { kind: 'too-high'; hit: FaceHit; height: number };

const wrapAngle = (a: number): number => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

export function createPlayerController(deps: { bus: Bus; collider: Collider }): PlayerController {
  const { bus, collider } = deps;
  const out = { x: 0, y: 0, z: 0 };
  const extras = new WeakMap<PlayerState, Extra>();
  let placed = 0;
  let clock = 0;
  let lastHintAt = -Infinity;

  const extraOf = (p: PlayerState): Extra => {
    let e = extras.get(p);
    if (!e) {
      e = { dirX: 0, dirZ: 1, stepPast: 0, vaultFrom: { x: 0, y: 0, z: 0 }, vaultTo: { x: 0, y: 0, z: 0 }, sinceSpend: 99, noiseTimer: 0 };
      extras.set(p, e);
    }
    return e;
  };

  const viaFor = (mods: MoveMods, height: number, routes: readonly ClimbRouteDef[]): { via: ClimbVia; place: RouteKind | null } | null => {
    if (routes.length > 0) return { via: 'route', place: null };
    if (mods.hasLadder && height <= LADDER_MAX) return { via: 'ladder', place: 'ladder' };
    if (mods.hasRope && height <= ROPE_MAX) return { via: 'rope', place: 'rope' };
    return null;
  };

  const plan = (p: PlayerState, mods: MoveMods): Plan | null => {
    const { x, y, z } = p.pos;
    // 1. Climb down from the edge of a block top.
    const edge = collider.edgeAhead(x, y, z, p.facing, CLIMB.reach, CLIMB.alongTolerance);
    if (edge) {
      const ox = x + Math.sin(p.facing) * (edge.distance + PLAYER_RADIUS + 0.05);
      const oz = z + Math.cos(p.facing) * (edge.distance + PLAYER_RADIUS + 0.05);
      const bottomY = collider.groundAt(ox, oz, y - STEP_UP - 0.01);
      const height = edge.topY - bottomY;
      // A drop no higher than a kerb is just walked or hopped off, so it falls through to the checks below.
      if (height > VAULT_MAX) {
        const v = viaFor(mods, height, edge.routes);
        if (v) return { kind: 'down', hit: edge, height, bottomY, ...v };
      }
    }
    // 2. A face ahead: vault, route, ladder, rope, or too high.
    const hit = collider.faceAhead(x, y, z, p.facing, CLIMB.reach, STEP_UP, CLIMB.alongTolerance);
    if (!hit) return null;
    const height = hit.topY - y;
    if (height <= VAULT_MAX) return { kind: 'vault', hit, height };
    const v = viaFor(mods, height, hit.routes);
    if (v) return { kind: 'up', hit, height, ...v };
    return { kind: 'too-high', hit, height };
  };

  const placeRoute = (hit: FaceHit, kind: RouteKind, fromY: number, topY: number): void => {
    const route: ClimbRouteDef = { id: `placed-${placed++}`, block: hit.id, side: hit.side, kind, at: hit.along };
    collider.addRoute(route);
    bus.emit('route-placed', { route, fromY, topY });
  };

  const speedFor = (via: ClimbVia): number =>
    via === 'ladder' ? CLIMB.ladderSpeed : via === 'rope' ? CLIMB.ropeSpeed : CLIMB.routeSpeed;

  const startFall = (p: PlayerState): void => {
    p.climbing = null;
    p.grounded = false;
    p.vel.set(0, 0, 0);
    p.fallFromY = p.pos.y;
  };

  const isClearAt = (x: number, y: number, z: number): boolean =>
    collider.inBounds(x, z) && collider.move({ x, y, z }, 0, 0, PLAYER_RADIUS, PLAYER_HEIGHT, STEP_UP, out) === null;

  /** Finds a clear landing spot past a climbed/vaulted face (on top of the block or safely across a thin wall). */
  const findClearLanding = (from: Vec3, dx: number, dz: number, baseDist: number, topY: number): Vec3 | null => {
    const px = -dz, pz = dx;
    for (const d of [baseDist, baseDist + 0.5, baseDist + 1.0, baseDist + 1.6]) {
      for (const lat of [0, 0.5, -0.5]) {
        const nx = from.x + dx * d + px * lat;
        const nz = from.z + dz * d + pz * lat;
        const ny = collider.groundAt(nx, nz, topY + STEP_UP);
        if (ny <= topY + STEP_UP && isClearAt(nx, ny, nz)) return { x: nx, y: ny, z: nz };
      }
    }
    return null;
  };

  /** Radial spiral nudge if the player ever ends up overlapping a block. */
  const unstuck = (p: PlayerState): void => {
    if (isClearAt(p.pos.x, p.pos.y, p.pos.z)) return;
    for (const r of [0.35, 0.7, 1.1, 1.6, 2.2]) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const nx = p.pos.x + Math.cos(a) * r;
        const nz = p.pos.z + Math.sin(a) * r;
        const ny = collider.groundAt(nx, nz, p.pos.y + STEP_UP);
        if (isClearAt(nx, ny, nz)) { p.pos.set(nx, ny, nz); return; }
      }
    }
  };

  const startClimb = (p: PlayerState, e: Extra, pl: Plan): void => {
    const dx = Math.sin(p.facing), dz = Math.cos(p.facing);
    e.dirX = dx; e.dirZ = dz;
    p.vel.set(0, 0, 0);
    p.sprinting = false;
    if (pl.kind === 'vault') {
      const d = pl.hit.distance + PAST_FACE;
      const land = findClearLanding(p.pos, dx, dz, d, pl.hit.topY);
      if (!land) { emitHint(); return; }
      e.vaultFrom = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
      e.vaultTo = land;
      p.vaulting = CLIMB.vaultSeconds;
      return;
    }
    if (pl.kind === 'up') {
      if (pl.place) placeRoute(pl.hit, pl.place, p.pos.y, pl.hit.topY);
      e.stepPast = pl.hit.distance + PAST_FACE;
      p.climbing = { topY: pl.hit.topY, speed: speedFor(pl.via), via: pl.via, startY: p.pos.y, down: false };
      return;
    }
    if (pl.kind === 'down') {
      if (pl.place) placeRoute(pl.hit, pl.place, pl.bottomY, pl.hit.topY);
      const d = pl.hit.distance + PLAYER_RADIUS + 0.05;
      p.pos.x += dx * d; p.pos.z += dz * d;
      p.facing = wrapAngle(p.facing + Math.PI);   // face the wall on the way down
      p.climbing = { topY: pl.bottomY, speed: speedFor(pl.via), via: pl.via, startY: p.pos.y, down: true };
    }
  };

  const emitHint = (): void => {
    if (clock - lastHintAt < HINT_EVERY) return;
    lastHintAt = clock;
    bus.emit('hint', { text: TOO_HIGH });
  };

  const spend = (p: PlayerState, e: Extra, amount: number): void => {
    p.stamina = Math.max(0, p.stamina - amount);
    e.sinceSpend = 0;
  };

  const emitNoise = (p: PlayerState, e: Extra, dt: number, radius: number, source: 'step' | 'climb'): void => {
    e.noiseTimer += dt;
    if (e.noiseTimer < NOISE.everySec) return;
    e.noiseTimer -= NOISE.everySec;
    p.noise = radius;
    bus.emit('noise', { x: p.pos.x, z: p.pos.z, radius, source });
  };

  /** Ground snapping, steps, gravity, falls and landings. */
  const applyGround = (p: PlayerState, dt: number): void => {
    const g = collider.groundAt(p.pos.x, p.pos.z, p.pos.y);
    if (p.grounded && p.pos.y - g <= STEP_UP) {
      const k = Math.min(1, STEP_LERP * dt);
      p.pos.y += (g - p.pos.y) * k;
      if (Math.abs(g - p.pos.y) < 0.01) p.pos.y = g;
      p.vel.y = 0;
      return;
    }
    if (p.grounded) { p.grounded = false; p.fallFromY = p.pos.y; p.vel.y = 0; }
    if (p.fallFromY === null) p.fallFromY = p.pos.y;
    p.vel.y -= MOVE.gravity * dt;
    p.pos.y += p.vel.y * dt;
    if (p.pos.y <= g) {
      const height = p.fallFromY - g;
      p.pos.y = g;
      p.vel.y = 0;
      p.grounded = true;
      p.fallFromY = null;
      if (height > FALL_EVENT) bus.emit('fell', { height });
    }
  };

  const track = (p: PlayerState): void => {
    const region = collider.regionAt(p.pos.x, p.pos.z);
    if (region !== p.region) {
      p.region = region;
      if (region) bus.emit('entered-region', { region });
    }
    const haven = collider.havenAt(p.pos.x, p.pos.y, p.pos.z);
    if (haven !== p.haven) {
      const prev = p.haven;
      p.haven = haven;
      if (haven) bus.emit('haven', { inside: true, haven });
      else if (prev) bus.emit('haven', { inside: false, haven: prev });
    }
  };

  const regen = (p: PlayerState, e: Extra, dt: number, mods: MoveMods): void => {
    e.sinceSpend += dt;
    if (e.sinceSpend >= STAMINA.regenDelay) {
      p.stamina = Math.min(STAMINA.max, p.stamina + STAMINA.regenPerSec * mods.staminaRegenMul * dt);
    }
  };

  const updateClimb = (p: PlayerState, e: Extra, input: { moveZ: number }, dt: number): void => {
    const c = p.climbing!;
    if (!c.down && input.moveZ < -0.5) { startFall(p); return; }
    spend(p, e, CLIMB.staminaPerSec * dt);
    emitNoise(p, e, dt, NOISE.climb, 'climb');
    if (p.stamina <= 0) { startFall(p); return; }
    if (c.down) {
      p.pos.y -= c.speed * dt;
      if (p.pos.y <= c.topY) {
        p.pos.y = c.topY;
        p.climbing = null;
        p.grounded = true;
        p.fallFromY = null;
      }
      return;
    }
    p.pos.y += c.speed * dt;
    if (p.pos.y >= c.topY) {
      const land = findClearLanding(p.pos, e.dirX, e.dirZ, e.stepPast, c.topY);
      if (land) p.pos.set(land.x, land.y, land.z);
      else p.pos.y = c.topY;
      p.climbing = null;
      p.grounded = true;
      p.fallFromY = null;
      unstuck(p);
      const height = c.topY - c.startY;
      if (height > VAULT_MAX) bus.emit('climbed', { height, via: c.via });
    }
  };

  const updateVault = (p: PlayerState, e: Extra, dt: number): void => {
    p.vaulting = Math.max(0, p.vaulting - dt);
    const t = 1 - p.vaulting / CLIMB.vaultSeconds;
    const a = e.vaultFrom, b = e.vaultTo;
    // Rise first, then cross: y leads the horizontal move so the gnome clears the top.
    const ty = Math.min(1, t * 2);
    p.pos.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * ty, a.z + (b.z - a.z) * t);
    if (p.vaulting <= 0) {
      p.pos.set(b.x, b.y, b.z);
      p.grounded = true;
      p.fallFromY = null;
      p.vel.set(0, 0, 0);
    }
  };

  return {
    update(p, input, yaw, dt, mods) {
      clock += dt;
      const e = extraOf(p);
      p.noise = 0;

      if (!p.alive) {
        p.climbing = null; p.vaulting = 0; p.sprinting = false;
        p.vel.x = 0; p.vel.z = 0; p.speed = 0;
        applyGround(p, dt);
        return;
      }

      if (input.crouch && !p.climbing && p.vaulting <= 0) p.stance = p.stance === 'crouch' ? 'stand' : 'crouch';

      if (p.vaulting > 0) {
        updateVault(p, e, dt);
        p.speed = 0;
        regen(p, e, dt, mods);
        track(p);
        return;
      }
      if (p.climbing) {
        updateClimb(p, e, input, dt);
        p.speed = 0;
        track(p);
        return;
      }

      if (input.climb && p.grounded) {
        const pl = plan(p, mods);
        if (pl && pl.kind !== 'too-high') {
          startClimb(p, e, pl);
          p.speed = 0;
          track(p);
          return;
        }
        if (pl) emitHint();
      }

      // Walk, jog, sprint, crouch.
      const fx = Math.sin(yaw), fz = Math.cos(yaw);
      const rx = -Math.cos(yaw), rz = Math.sin(yaw);
      let wx = rx * input.moveX + fx * input.moveZ;
      let wz = rz * input.moveX + fz * input.moveZ;
      const mag = Math.min(1, Math.hypot(input.moveX, input.moveZ));
      const wl = Math.hypot(wx, wz);
      const moving = mag > 0.05 && wl > 1e-6;
      if (moving) { wx /= wl; wz /= wl; } else { wx = 0; wz = 0; }

      const crouched = p.stance === 'crouch';
      const overloaded = mods.carryRatio > CARRY.overloadWalkOnly;
      let gait: 'walk' | 'jog' | 'sprint' = mag < MOVE.jogAt || overloaded ? 'walk' : 'jog';
      p.sprinting = false;
      if (moving && !overloaded && input.sprint && mods.canSprint && p.stamina > 0 && !crouched && p.grounded) {
        gait = 'sprint';
        p.sprinting = true;
        spend(p, e, STAMINA.sprintPerSec * dt);
      }
      let target: number = MOVE[gait];
      if (crouched) target *= MOVE.crouchMul;
      target *= mods.speedMul * (1 - 0.4 * Math.max(0, mods.carryRatio - 1));
      target = Math.max(0, target);

      if (p.grounded) {
        const tvx = wx * target, tvz = wz * target;
        const dvx = tvx - p.vel.x, dvz = tvz - p.vel.z;
        const dl = Math.hypot(dvx, dvz);
        const maxDv = MOVE.accel * dt;
        if (dl <= maxDv) { p.vel.x = tvx; p.vel.z = tvz; }
        else { p.vel.x += (dvx / dl) * maxDv; p.vel.z += (dvz / dl) * maxDv; }
      }
      if (!p.sprinting) regen(p, e, dt, mods);

      if (moving) {
        const want = Math.atan2(wx, wz);
        const diff = wrapAngle(want - p.facing);
        const step = TURN_RATE * dt;
        p.facing = wrapAngle(Math.abs(diff) <= step ? want : p.facing + Math.sign(diff) * step);
      }

      // Collision, then ground and gravity.
      const ox = p.pos.x, oz = p.pos.z;
      collider.move(p.pos, p.vel.x * dt, p.vel.z * dt, PLAYER_RADIUS, PLAYER_HEIGHT, STEP_UP, out);
      p.pos.x = out.x; p.pos.z = out.z;
      p.speed = dt > 0 ? Math.hypot(out.x - ox, out.z - oz) / dt : 0;
      applyGround(p, dt);
      unstuck(p);

      // Step noise.
      if (p.grounded && p.speed > 0.2) {
        const base = NOISE[gait];
        const radius = base * (crouched ? NOISE.crouchMul : 1) * (1 + NOISE.weightMul * Math.min(1, Math.max(0, mods.carryRatio)));
        emitNoise(p, e, dt, radius, 'step');
      } else {
        e.noiseTimer = 0;
      }

      track(p);
    },

    climbHint(p, mods) {
      if (!p.alive || p.climbing || p.vaulting > 0 || !p.grounded) return null;
      const pl = plan(p, mods);
      if (!pl) return null;
      const kind: ClimbHint['kind'] = pl.kind === 'up' ? pl.via : pl.kind;
      return { kind, height: pl.height };
    },
  };
}
