// Quest sim solvers. Set-piece objectives: air-drop, survive-derby, boss-combine.
import type { World } from '../../types';
import { heightAt } from '../../terrain';
import type { Finding, Solver } from '../types';
import { SimFail } from '../types';
import { getInto, nearestVehicle, objectiveBlips, runUntil, travelTo } from '../util';

const dist = (ax: number, az: number, bx: number, bz: number): number => Math.hypot(ax - bx, az - bz);

/** A 'content' finding for each named spot that lies outside the playable area. */
function offWorld(spots: [number, number, string][], world: World, questId: string, step: number): Finding[] {
  return spots
    .filter(([x, z]) => Math.abs(x) > world.half || Math.abs(z) > world.half)
    .map(([x, z, what]) => ({
      questId, step, check: 'spot-off-world', class: 'content' as const,
      detail: `${what} (${x}, ${z}) is outside the world (half ${world.half})`,
    }));
}

export const airDropSolver: Solver<'air-drop'> = {
  kind: 'air-drop',
  check(obj, world, questId, step) {
    const spots: [number, number, string][] = [[obj.dropZone[0], obj.dropZone[2], 'drop zone']];
    if (obj.planeAt) spots.push([obj.planeAt[0], obj.planeAt[1], 'plane']);
    return offWorld(spots, world, questId, step);
  },
  async solve(obj, ctx, opts) {
    const [zx, , zz] = obj.dropZone;
    // The plane is put over the zone by teleport, which replaces the flight: only the instantTravel cheat allows it.
    if (!ctx.cheats.instantTravel) {
      throw new SimFail('blocked', 'air-drop: flying the plane to the zone needs the instantTravel cheat (no flight solver yet)');
    }

    let plane = obj.planeAt ? nearestVehicle(ctx, obj.planeAt[0], obj.planeAt[1], 'plane') : null;
    if (!plane) plane = ctx.spawnVehicle('plane', zx, zz + 30, 0);
    await getInto(ctx, plane, 'air-drop: board the plane');

    ctx.useCheat('instantTravel', 'air-drop: plane put over the zone');
    ctx.teleport(zx, zz, { y: heightAt(zx, zz) + 60 });
    await ctx.step();
    if (!ctx.bail()) throw new SimFail('bot', 'air-drop: could not bail out of the plane at 60 m');

    await runUntil(ctx, { questId: opts.questId, step: opts.step, budget: opts.budget, what: 'air-drop' }, async () => {
      const p = ctx.player;
      if (p.airborne) {
        // Glide toward the zone centre; stop gliding once close.
        const d = dist(p.x, p.z, zx, zz);
        ctx.walk(d > 3 ? { moveX: 0, moveY: 1, camYaw: Math.atan2(zx - p.x, zz - p.z) } : null);
        return;
      }
      ctx.walk(null);
      if (p.vehicle) return;
      if (dist(p.x, p.z, zx, zz) > obj.radius) {
        await travelTo(ctx, zx, zz, 'air-drop: back to the drop zone');
        return;
      }
      if (obj.targetVehicle) {
        let v = nearestVehicle(ctx, p.x, p.z, obj.targetVehicle, 80);
        if (!v) {
          // The headless world has no parked Whirligig (app.ts places it on the base pad): park one at the zone.
          v = ctx.spawnVehicle(obj.targetVehicle, zx, zz, Math.PI);
          ctx.log(`air-drop: no ${obj.targetVehicle} near the zone, parked one on the drop zone`);
        }
        await getInto(ctx, v, `air-drop: board the ${obj.targetVehicle}`);
      }
    });
  },
};

export const surviveDerbySolver: Solver<'survive-derby'> = {
  kind: 'survive-derby',
  check(obj, world, questId, step) {
    return offWorld([[obj.arena[0], obj.arena[1], 'arena']], world, questId, step);
  },
  async solve(obj, ctx, opts) {
    const [ax, az] = obj.arena;
    await travelTo(ctx, ax, az, 'survive-derby: to the arena');
    if (ctx.cheats.godMode) ctx.useCheat('godMode', 'derby: health kept full');
    const dt = ctx.cheats.fastClock ? 0.1 : undefined;
    if (dt) ctx.useCheat('fastClock', 'derby timer stepped at 0.1 s');

    // Bumps push the player out; bring them back so the timer keeps running.
    await runUntil(ctx, { questId: opts.questId, step: opts.step, budget: opts.budget, what: 'survive-derby' }, async () => {
      const p = ctx.player;
      if (dist(p.x, p.z, ax, az) > obj.radius) await travelTo(ctx, ax, az, 'survive-derby: back in the arena');
    }, dt);
  },
};

export const bossCombineSolver: Solver<'boss-combine'> = {
  kind: 'boss-combine',
  check(obj, world, questId, step) {
    return offWorld([[0, obj.startZ, 'combine start'], [0, obj.endZ, 'combine end']], world, questId, step);
  },
  async solve(obj, ctx, opts) {
    // Shoot every guard, nearest first. The guards walk with the combine, so each one's spot is read fresh.
    const t0 = ctx.now();
    while (ctx.squad.length > 0) {
      if (ctx.now() - t0 > opts.budget) throw new SimFail('bot', `boss-combine: ${ctx.squad.length} guard(s) left after ${opts.budget}s`);
      const p = ctx.player;
      const g = ctx.squad.reduce((a, b) => (dist(a.x, a.z, p.x, p.z) <= dist(b.x, b.z, p.x, p.z) ? a : b));
      await travelTo(ctx, g.x, g.z, 'boss-combine: to a guard', { standOff: 6 });
      if (ctx.squad.includes(g)) ctx.shoot(g);
    }

    // E22: the 'guards' phase is done once the squad is down (the runner reports it at the next frame).
    if (obj.phase === 'guards') {
      await runUntil(ctx, { questId: opts.questId, step: opts.step, budget: opts.budget, what: 'boss-combine guards' }, async () => {});
      return;
    }
    // Guards are down: stand at the intake until the runner jams the combine.
    let since: number | null = null;
    await runUntil(ctx, { questId: opts.questId, step: opts.step, budget: opts.budget, what: 'boss-combine' }, async () => {
      const blip = objectiveBlips(ctx)[0];
      if (!blip) return;
      const intakeZ = blip.z + (obj.endZ > blip.z ? 8 : -8);
      if (dist(ctx.player.x, ctx.player.z, 0, intakeZ) > 5) {
        await travelTo(ctx, 0, intakeZ, 'boss-combine: to the intake');
      }
      const atIntake = dist(ctx.player.x, ctx.player.z, 0, intakeZ) <= 5;
      if (!atIntake || ctx.squad.length > 0) {
        since = null;
        return;
      }
      since ??= ctx.now();
      if (ctx.now() - since > 10) {
        throw new SimFail('bug', 'boss-combine: guards cracked by water are never counted (app.ts hitTest does not call quests.onCracked for squad units)');
      }
    });
  },
};
