// Quest sim solvers. Vehicle objectives: steal-deliver, chase-follow, convoy-ambush.
import type { Vehicle, World } from '../../types';
import type { Finding, SimCtx, Solver } from '../types';
import { SimFail } from '../types';
import { followStats } from '../../quests/followWatchdog';
import { getInto, nearestVehicle, objectiveBlips, runUntil, travelTo, waitFor } from '../util';

/** Findings for every spot (x, z) outside the playable area (world.half). */
function offWorld(questId: string, step: number, world: World, spots: { name: string; x: number; z: number }[]): Finding[] {
  const out: Finding[] = [];
  for (const s of spots) {
    if (Math.abs(s.x) <= world.half && Math.abs(s.z) <= world.half) continue;
    out.push({
      questId,
      step,
      check: 'spot-off-world',
      class: 'content',
      detail: `${s.name} (${s.x.toFixed(1)}, ${s.z.toFixed(1)}) is outside the world (half ${world.half})`,
    });
  }
  return out;
}

/** The leader of a chase: the NPC-driven quest vehicle nearest the first objective blip. */
function findLeader(ctx: SimCtx): Vehicle | null {
  const blip = objectiveBlips(ctx)[0];
  if (!blip) return null;
  let best: Vehicle | null = null;
  let bestD = Infinity;
  for (const v of ctx.vehicles) {
    if (v.driver !== 'npc' || !v.questOwned || v.exploded) continue;
    const d = Math.hypot(v.x - blip.x, v.z - blip.z);
    if (d < bestD) { bestD = d; best = v; }
  }
  return best;
}

/** The convoy's hauler: the quest-owned 'ride-on' nearest the first objective blip. */
function findHauler(ctx: SimCtx): Vehicle | null {
  const blip = objectiveBlips(ctx)[0];
  if (!blip) return null;
  let best: Vehicle | null = null;
  let bestD = Infinity;
  for (const v of ctx.vehicles) {
    if (v.kind !== 'ride-on' || !v.questOwned || v.exploded) continue;
    const d = Math.hypot(v.x - blip.x, v.z - blip.z);
    if (d < bestD) { bestD = d; best = v; }
  }
  return best;
}

export const stealDeliverSolver: Solver<'steal-deliver'> = {
  kind: 'steal-deliver',
  async solve(obj, ctx, opts) {
    const [sx, sz] = obj.spawnAt;
    await waitFor(ctx, () => nearestVehicle(ctx, sx, sz, obj.vehicleKind, 40) !== null, 2);
    const target = nearestVehicle(ctx, sx, sz, obj.vehicleKind, 40);
    if (!target) {
      throw new SimFail('bug', `steal-deliver: no ${obj.vehicleKind} spawned near ${sx}, ${sz}`);
    }
    await getInto(ctx, target, 'steal-deliver: take the target');
    await travelTo(ctx, obj.dropAt[0], obj.dropAt[1], 'deliver');
    await runUntil(ctx, { questId: opts.questId, step: opts.step, budget: opts.budget, what: 'steal-deliver' }, async () => {
      // The runner only delivers while the player drives the target: climb back in if the car was left behind.
      if (ctx.player.vehicle !== target) await getInto(ctx, target, 'steal-deliver: back into the target');
    });
  },
  check(obj, world, questId, step) {
    return offWorld(questId, step, world, [
      { name: 'spawnAt', x: obj.spawnAt[0], z: obj.spawnAt[1] },
      { name: 'dropAt', x: obj.dropAt[0], z: obj.dropAt[1] },
    ]);
  },
};

export const chaseFollowSolver: Solver<'chase-follow'> = {
  kind: 'chase-follow',
  async solve(obj, ctx, opts) {
    // Driving the chase needs driveTo to follow a moving car (not built yet): until then the bot teleports behind.
    if (!ctx.cheats.instantTravel) throw new SimFail('bot', 'chase-follow: needs instantTravel until driveTo can follow');
    await waitFor(ctx, () => findLeader(ctx) !== null, 2);
    const leader = findLeader(ctx);
    if (!leader) throw new SimFail('bug', `chase-follow: no quest-owned ${obj.leaderKind} leader near the objective`);
    // A realistic follower: always where the leader was TRAIL_S seconds ago (a trail of breadcrumbs), plus one lag episode
    // (stand still LAG_S seconds, once) so the leader has to wait for the player.
    const TRAIL_S = 2.5;
    const LAG_AT = 10;
    const LAG_S = 12;
    const crumbs: { t: number; x: number; z: number }[] = [];
    const t0 = ctx.now();
    await runUntil(ctx, { questId: opts.questId, step: opts.step, budget: opts.budget, what: 'chase-follow' }, () => {
      const now = ctx.now();
      crumbs.push({ t: now, x: leader.x, z: leader.z });
      while (crumbs.length > 2 && crumbs[1].t <= now - TRAIL_S) crumbs.shift();
      const elapsed = now - t0;
      if (elapsed >= LAG_AT && elapsed < LAG_AT + LAG_S) {
        return; // standing still: the player falls behind
      }
      ctx.useCheat('instantTravel', 'chase: trails the leader by 2.5 s');
      ctx.teleport(crumbs[0].x, crumbs[0].z);
    });
    const stats = followStats();
    if (stats && stats.maxStall > 20) {
      throw new SimFail('bug', `chase-follow: the leader stalled for ${stats.maxStall.toFixed(1)}s (more than 20s) without progress`);
    }
  },
  check(obj, world, questId, step) {
    return offWorld(questId, step, world, obj.waypoints.map(([x, z], i) => ({ name: `waypoint ${i}`, x, z })));
  },
};

export const convoyAmbushSolver: Solver<'convoy-ambush'> = {
  kind: 'convoy-ambush',
  async solve(obj, ctx, opts) {
    // Clear the escorts first. Copy the list: shooting removes units from ctx.squad.
    for (const npc of [...ctx.squad]) {
      if (!ctx.squad.includes(npc)) continue;
      await travelTo(ctx, npc.x, npc.z, 'convoy-ambush: reach an escort', { standOff: 5 });
      if (ctx.squad.includes(npc)) ctx.shoot(npc);
    }
    await waitFor(ctx, () => findHauler(ctx) !== null, 2);
    const hauler = findHauler(ctx);
    if (!hauler) throw new SimFail('bug', `convoy-ambush: no quest-owned Dew-Hauler near the objective`);
    await getInto(ctx, hauler, 'convoy-ambush: take the Dew-Hauler');
    await travelTo(ctx, obj.dropAt[0], obj.dropAt[1], 'convoy-ambush: drive the hauler to the drop');
    try {
      await runUntil(ctx, { questId: opts.questId, step: opts.step, budget: 10, what: 'convoy-ambush' }, () => {});
    } catch (e) {
      if (e instanceof SimFail && ctx.squad.length === 0) {
        // app.ts hitTest never tells the runner about a squad unit cracked by water, so the hauler can never finish.
        throw new SimFail(
          'bug',
          'convoy-ambush: escorts cracked by water are never counted (app.ts hitTest does not call quests.onCracked for squad units)',
        );
      }
      throw e;
    }
  },
  check(obj, world, questId, step) {
    const spots = [{ name: 'dropAt', x: obj.dropAt[0], z: obj.dropAt[1] }];
    obj.route.forEach(([x, z], i) => spots.push({ name: `route point ${i}`, x, z }));
    return offWorld(questId, step, world, spots);
  },
};
