// Quest sim solvers. The Tessie quest objectives: sightings, buoys, escort, ride.
// Boat moves are teleports (instantTravel, recorded) except the escort ram, which is driven for real: the ram is the test.
import type { Blip, Vehicle, World } from '../../types';
import { angleDiff } from '../../collide';
import { heightAt, waterAt } from '../../terrain';
import type { Finding, SimCtx, Solver } from '../types';
import { SimFail } from '../types';
import { nearestVehicle, objectiveBlips, runUntil, travelTo, waitFor } from '../util';

/** Water surface height at (x, z), or the ground there when it is dry. */
function surfaceY(x: number, z: number): number {
  return waterAt(x, z)?.surface ?? heightAt(x, z);
}

/** The nearest water point to (x, z), searched in rings out to 60 m; null when there is none. */
function waterPoint(x: number, z: number): { x: number; z: number } | null {
  for (let r = 0; r <= 60; r += 2) {
    for (let a = 0; a < 16; a++) {
      const px = x + Math.sin((a / 16) * Math.PI * 2) * r;
      const pz = z + Math.cos((a / 16) * Math.PI * 2) * r;
      if (waterAt(px, pz)) return { x: px, z: pz };
    }
  }
  return null;
}

/** Put the player in a boat on the water near (x, z) (spawned and entered when not already in one). */
async function ensureBoat(ctx: SimCtx, x: number, z: number): Promise<void> {
  if (ctx.player.vehicle?.spec.boat === true) return;
  const w = waterPoint(x, z);
  if (!w) throw new SimFail('content', `no water within 60 m of (${x.toFixed(0)}, ${z.toFixed(0)}) for a boat`);
  ctx.useCheat('unlockAllItems', 'tessie: a boat spawned on the loch');
  if (ctx.player.vehicle) ctx.exit();
  const boat = ctx.spawnVehicle('gravy-boat', w.x, w.z, 0);
  ctx.enter(boat);
  ctx.teleport(w.x, w.z, { y: surfaceY(w.x, w.z) });
  await ctx.step();
}

/**
 * Teleport the player's boat to (x, z) at water height, facing `yaw` when given. Boats cannot be driven there yet, so
 * without the instantTravel cheat this fails as 'bot'.
 */
function boatTo(ctx: SimCtx, x: number, z: number, why: string, yaw?: number): void {
  if (!ctx.cheats.instantTravel) throw new SimFail('bot', `${why}: boat travel without instantTravel is not built (driveTo)`);
  ctx.useCheat('instantTravel', `teleport: ${why}`);
  ctx.teleport(x, z, yaw === undefined ? { y: surfaceY(x, z) } : { y: surfaceY(x, z), yaw });
}

const dist = (ax: number, az: number, bx: number, bz: number): number => Math.hypot(ax - bx, az - bz);

/** Unit vector from (fx, fz) toward (tx, tz); (1, 0) when they are the same point. */
function unitToward(fx: number, fz: number, tx: number, tz: number): { x: number; z: number } {
  const dx = tx - fx;
  const dz = tz - fz;
  const d = Math.hypot(dx, dz);
  return d < 0.01 ? { x: 1, z: 0 } : { x: dx / d, z: dz / d };
}

/** Findings for points off the playable area (world.half). */
function offWorld(points: [number, number][], world: World, questId: string, step: number): Finding[] {
  const out: Finding[] = [];
  for (const [x, z] of points) {
    if (Math.abs(x) > world.half || Math.abs(z) > world.half) {
      out.push({ questId, step, check: 'spot-off-world', class: 'content', detail: `(${x}, ${z}) is outside the world (half ${world.half})` });
    }
  }
  return out;
}

/** A blip with this label sitting on one of `points`, as that point; null when none is shown. */
function blipOnPoint(ctx: SimCtx, label: string, points: [number, number][]): [number, number] | null {
  const b = objectiveBlips(ctx).find((bl) => bl.quest === label && points.some(([x, z]) => dist(bl.x, bl.z, x, z) < 0.5));
  return b ? [b.x, b.z] : null;
}

// ---- Sightings ------------------------------------------------------------------------------------------------------

export const tessieSightingsSolver: Solver<'tessie-sightings'> = {
  kind: 'tessie-sightings',
  async solve(obj, ctx, opts) {
    const [fx, fz] = obj.points[0];
    await ensureBoat(ctx, fx, fz);
    // The runner shows a blip only for the sighting it is waiting on; the boat goes there and waits out the hump.
    await runUntil(ctx, { questId: opts.questId, step: opts.step, budget: opts.budget, what: 'tessie sightings' }, async () => {
      await ensureBoat(ctx, fx, fz);
      const target = blipOnPoint(ctx, obj.hint, obj.points);
      if (!target) return;
      const p = ctx.player;
      if (dist(p.x, p.z, target[0], target[1]) > 1) boatTo(ctx, target[0], target[1], 'sighting');
    });
  },
  check(obj, world, questId, step) {
    return offWorld(obj.points, world, questId, step);
  },
};

// ---- Buoys ----------------------------------------------------------------------------------------------------------

export const tessieBuoysSolver: Solver<'tessie-buoys'> = {
  kind: 'tessie-buoys',
  async solve(obj, ctx, opts) {
    const [fx, fz] = obj.points[0];
    await ensureBoat(ctx, fx, fz);
    await runUntil(ctx, { questId: opts.questId, step: opts.step, budget: opts.budget, what: 'tessie buoys' }, async () => {
      await ensureBoat(ctx, fx, fz);
      // Undropped points are the blips labelled 'Sonar buoy', nearest first.
      const todo = objectiveBlips(ctx).find((b) => b.quest === 'Sonar buoy');
      if (!todo) return;
      // Wait while the HOA patrol boat is near the spot; the patrol moves, so the wait ends.
      const patrol = objectiveBlips(ctx).find((b) => b.quest === 'HOA patrol boat');
      if (patrol && dist(patrol.x, patrol.z, todo.x, todo.z) < obj.spotRadius + 10) return;
      const p = ctx.player;
      if (dist(p.x, p.z, todo.x, todo.z) > 1) {
        boatTo(ctx, todo.x, todo.z, 'sonar buoy');
        await ctx.step(1);
      }
    });
  },
  check(obj, world, questId, step) {
    return offWorld(obj.points, world, questId, step);
  },
};

// ---- Escort ---------------------------------------------------------------------------------------------------------

/** Ram the dredger: a straight run at it from 12 m off, steering with the boat's heading. */
function ramDredger(ctx: SimCtx, clutch: Blip, dredger: Blip): void {
  let boat = ctx.player.vehicle as Vehicle;
  if (dist(boat.x, boat.z, dredger.x, dredger.z) > 40) {
    // 12 m from the dredger on the side away from the clutch, facing it.
    const u = unitToward(clutch.x, clutch.z, dredger.x, dredger.z);
    const px = dredger.x + u.x * 12;
    const pz = dredger.z + u.z * 12;
    boatTo(ctx, px, pz, 'ram the dredger', Math.atan2(dredger.x - px, dredger.z - pz));
    boat = ctx.player.vehicle as Vehicle;
  }
  const want = Math.atan2(dredger.x - boat.x, dredger.z - boat.z);
  const steer = Math.min(1, Math.max(-1, -2 * angleDiff(want, boat.yaw)));
  ctx.drive({ throttle: 1, steer, lift: 0 });
}

/** Stay within 15 m of the clutch: when farther, teleport 8 m behind it (the side away from the nest). */
function keepWithClutch(ctx: SimCtx, clutch: Blip, nest: [number, number]): void {
  ctx.drive(null);
  const boat = ctx.player.vehicle as Vehicle;
  if (dist(boat.x, boat.z, clutch.x, clutch.z) <= 15) return;
  const u = unitToward(nest[0], nest[1], clutch.x, clutch.z);
  const px = clutch.x + u.x * 8;
  const pz = clutch.z + u.z * 8;
  boatTo(ctx, px, pz, 'keep with the egg clutch', Math.atan2(clutch.x - px, clutch.z - pz));
}

export const tessieEscortSolver: Solver<'tessie-escort'> = {
  kind: 'tessie-escort',
  async solve(obj, ctx, opts) {
    const [sx, sz] = obj.route[0];
    await ensureBoat(ctx, sx, sz);
    await runUntil(ctx, { questId: opts.questId, step: opts.step, budget: opts.budget, what: 'tessie escort' }, async () => {
      await ensureBoat(ctx, sx, sz);
      const blips = objectiveBlips(ctx);
      const clutch = blips.find((b) => b.quest === 'Egg clutch');
      if (!clutch) {
        ctx.drive(null);
        return;
      }
      const dredger = blips.find((b) => b.quest === 'HOA dredger');
      if (dredger) ramDredger(ctx, clutch, dredger);
      else keepWithClutch(ctx, clutch, obj.nest);
    });
    ctx.drive(null);
  },
  check(obj, world, questId, step) {
    return offWorld([...obj.route, obj.nest, obj.dredgerAt], world, questId, step);
  },
};

// ---- Ride -----------------------------------------------------------------------------------------------------------

export const tessieRideSolver: Solver<'tessie-ride'> = {
  kind: 'tessie-ride',
  async solve(obj, ctx, opts) {
    const [sx, sz] = obj.spawnAt;
    // Tessie surfaces at spawnAt once the objective starts.
    const found = await waitFor(ctx, () => nearestVehicle(ctx, sx, sz, 'tessie', 40) !== null, 2);
    if (!found) throw new SimFail('bot', `tessie-ride: Tessie not beside (${sx}, ${sz}) within 2 s`);
    const tessie = nearestVehicle(ctx, sx, sz, 'tessie', 40) as Vehicle;
    // Swim out and climb aboard: the player is teleported to her at water height, then takes her wheel.
    if (ctx.player.vehicle !== tessie) {
      if (!ctx.cheats.instantTravel) throw new SimFail('bot', 'tessie-ride: swimming out without instantTravel is not built');
      ctx.useCheat('instantTravel', 'teleport: swim out to Tessie');
      if (ctx.player.vehicle) ctx.exit();
      ctx.teleport(tessie.x + 1.5, tessie.z, { y: surfaceY(tessie.x, tessie.z) });
      ctx.enter(tessie);
      await ctx.step();
    }
    // Ride her to the dock (travelTo teleports the boat, recorded, when instantTravel is on).
    await travelTo(ctx, obj.to[0], obj.to[1], 'ride Tessie to the dock');
    await runUntil(ctx, { questId: opts.questId, step: opts.step, budget: opts.budget, what: 'tessie ride' }, () => {});
  },
  check(obj, world, questId, step) {
    return offWorld([[obj.to[0], obj.to[1]], [obj.spawnAt[0], obj.spawnAt[1]]], world, questId, step);
  },
};
