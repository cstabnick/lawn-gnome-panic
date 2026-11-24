// Quest sim solvers for on-foot objectives: crack (shoot named targets), visit (reach a spot), choice (walk into one
// ending ring). Each one plays the step the way the player would; travel may be a teleport (instantTravel cheat).
import type { Npc, World } from '../../types';
import type { ObjectiveDef } from '../../quests/types';
import type { Finding, Solver, SimCtx } from '../types';
import { SimFail } from '../types';
import { runUntil, travelTo } from '../util';

/** Crack targets are shot from this far or closer (the water gun's reach). */
const SHOOT_RANGE = 40;
/** Walk up to a target when it is farther than this; stop 6 m short of it. */
const WALK_RANGE = 12;
const STAND_OFF = 6;
/** A crack step with no live target npc for this long is a game bug, not a slow bot. */
const NO_TARGET_LIMIT = 5;
/** A visit spot the player is inside of for this long without the step completing is a game bug. */
const INSIDE_LIMIT = 30;

const offWorld = (world: World, x: number, z: number): boolean => Math.abs(x) > world.half || Math.abs(z) > world.half;

function spotFinding(questId: string, step: number, world: World, label: string, x: number, z: number): Finding[] {
  if (!offWorld(world, x, z)) return [];
  return [{
    questId, step, check: 'spot-off-world', class: 'content',
    detail: `${label} at (${x}, ${z}) is outside the world (half ${world.half})`,
  }];
}

/** The live npc for a crack target, or undefined (fled, cracked, or not spawned yet). */
function liveNpc(ctx: SimCtx, questId: string): Npc | undefined {
  return ctx.npcs.list.find((n) => n.quest === questId && n.state !== 'ragdoll');
}

export const crackSolver: Solver<'crack'> = {
  kind: 'crack',
  async solve(obj, ctx, o) {
    let missingSince: number | null = null;
    await runUntil(ctx, { questId: o.questId, step: o.step, budget: o.budget, what: 'crack' }, async () => {
      // Nearest live target: the first found is the one to hit next.
      const p = ctx.player;
      let best: Npc | undefined;
      let bd = Infinity;
      for (const t of obj.targets) {
        const n = liveNpc(ctx, t.id);
        if (!n) continue;
        const d = Math.hypot(n.x - p.x, n.z - p.z);
        if (d < bd) { bd = d; best = n; }
      }
      if (!best) {
        const now = ctx.now();
        if (missingSince === null) missingSince = now;
        if (now - missingSince >= NO_TARGET_LIMIT) {
          throw new SimFail('bug', `crack: no live target npc (ids ${obj.targets.map((t) => t.id).join(', ')})`);
        }
        return;
      }
      missingSince = null;
      if (bd > WALK_RANGE) await travelTo(ctx, best.x, best.z, `crack ${best.name}`, { standOff: STAND_OFF });
      if (Math.hypot(best.x - ctx.player.x, best.z - ctx.player.z) <= SHOOT_RANGE) ctx.shoot(best);
    });
  },
  check(obj, world, questId, step) {
    return obj.targets.flatMap((t) => spotFinding(questId, step, world, `crack target ${t.id}`, t.near[0], t.near[1]));
  },
};

export const visitSolver: Solver<'visit'> = {
  kind: 'visit',
  async solve(obj, ctx, o) {
    await travelTo(ctx, obj.at[0], obj.at[1], `visit ${obj.hint}`);
    let insideSince: number | null = null;
    await runUntil(ctx, { questId: o.questId, step: o.step, budget: o.budget, what: `visit ${obj.hint}` }, () => {
      // An arrival scene ends by itself in the harness; the step completes when it does.
      const inside = Math.hypot(ctx.player.x - obj.at[0], ctx.player.z - obj.at[1]) <= obj.radius;
      if (!inside) { insideSince = null; return; }
      if (insideSince === null) insideSince = ctx.now();
      if (ctx.now() - insideSince >= INSIDE_LIMIT) {
        throw new SimFail('bug', `visit: inside ${obj.hint} (${obj.at[0]}, ${obj.at[1]}) for ${INSIDE_LIMIT}s, step not done`);
      }
    });
  },
  check(obj, world, questId, step) {
    return spotFinding(questId, step, world, `visit ${obj.hint}`, obj.at[0], obj.at[1]);
  },
};

export const choiceSolver: Solver<'choice'> = {
  kind: 'choice',
  async solve(obj, ctx, o) {
    const opt = (o.choice ?? 'A') === 'B' ? obj.optionB : obj.optionA;
    ctx.log('choice: ' + opt.label);
    await travelTo(ctx, opt.at[0], opt.at[1], `choice ${opt.label}`);
    // The ending completes by itself once the player stands in the option's ring (choiceRun).
    await runUntil(ctx, { questId: o.questId, step: o.step, budget: o.budget, what: `choice ${opt.label}` }, () => {});
  },
  check(obj, world, questId, step) {
    return [
      ...spotFinding(questId, step, world, 'choice option A', obj.optionA.at[0], obj.optionA.at[1]),
      ...spotFinding(questId, step, world, 'choice option B', obj.optionB.at[0], obj.optionB.at[1]),
    ];
  },
};
