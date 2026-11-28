// Quest sim solver for 'inspect' (E20): walk to each point (in list order) and press or hold the action there. The
// action goes in as the runner's own `gta:inspect-action` window event (the same press the E key makes).
import type { Solver, SimCtx } from '../types';
import { SimFail } from '../types';
import { runUntil, travelTo } from '../util';
import { interiorById, interiorToWorld } from '../../interiors/registry';
import { INSPECT_EVENT } from '../../quests/objectivesInspect';

const send = (down: boolean): void => {
  window.dispatchEvent(new CustomEvent(INSPECT_EVENT, { detail: { down } }));
};

export const inspectSolver: Solver<'inspect'> = {
  kind: 'inspect',
  async solve(obj, ctx: SimCtx, o) {
    const hold = obj.holdSeconds && obj.holdSeconds > 0 ? obj.holdSeconds : 0;
    // E22: inspecting is done on foot (the runner ignores a player in a vehicle); get out of the last step's ride.
    if (ctx.player.vehicle) ctx.exit();
    for (const p of obj.points) {
      let [ax, az] = p.at;
      if (p.interior) {
        const pocket = interiorById(p.interior);
        if (!pocket) throw new SimFail('content', `inspect: unknown interior ${p.interior}`);
        await travelTo(ctx, pocket.def.door.x, pocket.def.door.z, `door of ${p.label}`);
        [ax, az] = interiorToWorld(p.interior, p.at[0], p.at[1]);
        ctx.teleport(ax, az, { y: 0 });
      } else {
        await travelTo(ctx, ax, az, p.label);
      }
      ctx.log(`inspect: ${p.label}`);
      await ctx.step();
      send(true);
      if (hold) {
        const t0 = ctx.now();
        while (ctx.now() - t0 < hold + 0.5) await ctx.step();
      }
      send(false);
      await ctx.step();
    }
    await runUntil(ctx, { questId: o.questId, step: o.step, budget: o.budget, what: `inspect ${obj.hint}` }, () => {});
  },
  check(obj, world, questId, step) {
    return obj.points.flatMap((p) => (p.interior || (Math.abs(p.at[0]) <= world.half && Math.abs(p.at[1]) <= world.half) ? [] : [{
      questId, step, check: 'spot-off-world' as const, class: 'content' as const,
      detail: `inspect point ${p.label} at (${p.at[0]}, ${p.at[1]}) is outside the world (half ${world.half})`,
    }]));
  },
};
