// Quest sim: getting about for real, without the instantTravel cheat. Walking (player.updateFoot through ctx.walk),
// driving along the road graph (world.roads, planRoute in errands.ts, decks included) with ctx.drive, and flying a
// flyer to a point at a height. Timed runs and chases use these; everything else may teleport.
import { angleDiff } from '../../collide';
import { planRoute } from '../../errands';
import { nearestRoadNode, nodeY } from '../../highways/roads';
import { groundAt } from '../../terrain';
import type { RoadNode, Vehicle } from '../../types';
import type { SimCtx } from '../types';
import { SimFail } from '../types';
import { fmt } from '../util';

export interface MoveOpts {
  /** Done within this many metres (horizontal). */
  arrive: number;
  /** For the report and stuck dumps. */
  why: string;
  /** Top speed to aim for, m/s (default: the vehicle's). */
  speed?: number;
  /** Give up after this many sim seconds (default 300). */
  budget?: number;
  /** Called every step while moving; return true to stop early (a gate was passed, the step is done). */
  until?: () => boolean;
}

/** How far to the right of a road's centre line the bot aims (the same offset expandRoadWaypoints uses). */
const LANE_OFFSET = 2;
/** A stuck check looks at this many sim seconds of movement. */
const STUCK_WINDOW = 2;

/** Steer toward (tx, tz): the quest NPC's law (objectivesDrive.ts steerToward), returning the steer and heading error. */
function steerTo(v: Vehicle, tx: number, tz: number): { steer: number; diff: number } {
  const diff = angleDiff(Math.atan2(tx - v.x, tz - v.z), v.yaw);
  return { steer: Math.max(-1, Math.min(1, -diff * 2.2)), diff };
}

/** Walk to (x, z) round buildings. */
export async function walkTo(ctx: SimCtx, x: number, z: number, o: MoveOpts): Promise<void> {
  const budget = o.budget ?? 300;
  const t0 = ctx.now();
  let anchorX = ctx.player.x;
  let anchorZ = ctx.player.z;
  let anchorT = t0;
  let sidestepUntil = -1;
  // Alternate the side each time: a wall that blocks one way is usually open the other.
  let side = 1;
  try {
    for (;;) {
      const p = ctx.player;
      if (Math.hypot(x - p.x, z - p.z) <= o.arrive || o.until?.()) return;
      const now = ctx.now();
      if (now - t0 > budget) throw new SimFail('bot', `walkTo ${o.why}: stuck at (${fmt(p.x)}, ${fmt(p.z)})`);
      // Stuck: moved under half a metre in the window. Sidestep for a second, then carry on.
      if (now - anchorT >= STUCK_WINDOW) {
        if (Math.hypot(p.x - anchorX, p.z - anchorZ) < 0.5) {
          sidestepUntil = now + 1;
          side = -side;
        }
        anchorX = p.x;
        anchorZ = p.z;
        anchorT = now;
      }
      ctx.walk({ moveX: now < sidestepUntil ? side : 0, moveY: 1, camYaw: Math.atan2(x - p.x, z - p.z) });
      await ctx.step();
    }
  } finally {
    ctx.walk(null);
  }
}

/**
 * The aim points for a road trip from the vehicle to (x, z): each node of the planned route, 2 m right of the centre
 * line, then the target itself. Throws a bot SimFail when there is no road route.
 */
interface Aim { x: number; z: number; deck?: boolean }

function roadAims(ctx: SimCtx, v: Vehicle, x: number, z: number, deckY: number | undefined, why: string): Aim[] {
  const nodes = ctx.world.roads.nodes;
  // A car on the ground under a ramp or deck must not start from a deck node above it: route from the street.
  const near = nearestRoadNode(nodes, v.x, v.z, v.y);
  const from = near && near.deck !== undefined && nodeY(near) - v.y > 2.5 ? nearestRoadNode(nodes, v.x, v.z) : near;
  const to = nearestRoadNode(nodes, x, z, deckY);
  const route = from && to ? planRoute(nodes, from.id, to.id) : null;
  if (!route) throw new SimFail('bot', `driveTo ${why}: no road route from (${fmt(v.x)}, ${fmt(v.z)}) to (${fmt(x)}, ${fmt(z)})`);
  const byId = new Map<number, RoadNode>(nodes.map((n) => [n.id, n]));
  const pts: RoadNode[] = [];
  for (const id of route) {
    const n = byId.get(id);
    if (n) pts.push(n);
  }
  const aims: Aim[] = [];
  // The last node is skipped: the final leg runs straight to (x, z).
  for (let i = 0; i + 1 < pts.length; i++) {
    const n = pts[i];
    const next = pts[i + 1];
    const dx = next.x - n.x;
    const dz = next.z - n.z;
    const len = Math.hypot(dx, dz) || 1;
    // On a deck (and its ramps) the bot keeps to the centre line: the deck is narrow and has no kerb to stop a fall.
    const deck = n.deck !== undefined || next.deck !== undefined;
    const off = deck ? 0 : LANE_OFFSET;
    aims.push({ x: n.x - (dz / len) * off, z: n.z + (dx / len) * off, deck });
  }
  aims.push({ x, z, deck: deckY !== undefined });
  return aims;
}

/** Drive the current ground vehicle or boat to (x, z) along the road graph (or straight over open ground / water). */
export async function driveTo(ctx: SimCtx, x: number, z: number, o: MoveOpts & { deckY?: number }): Promise<void> {
  const first = ctx.player.vehicle;
  if (!first) throw new SimFail('bot', `driveTo ${o.why}: not in a vehicle`);
  let aims: Aim[] = first.spec.boat ? [{ x, z }] : roadAims(ctx, first, x, z, o.deckY, o.why);
  const budget = o.budget ?? 300;
  const t0 = ctx.now();
  let idx = 0;
  let anchorX = first.x;
  let anchorZ = first.z;
  let anchorT = t0;
  let reverseUntil = -1;
  let lastSteer = 0;
  try {
    for (;;) {
      const v = ctx.player.vehicle;
      if (!v) throw new SimFail('bot', `driveTo ${o.why}: left the vehicle`);
      const high = o.deckY === undefined || Math.abs(v.y - o.deckY) < 4;
      // Under the deck, not on it: plan again from here (the street, then the ramp).
      if (!high && !first.spec.boat && idx >= aims.length - 1 && Math.hypot(x - v.x, z - v.z) <= o.arrive + 10) {
        aims = roadAims(ctx, v, x, z, o.deckY, o.why);
        idx = 0;
      }
      if ((high && Math.hypot(x - v.x, z - v.z) <= o.arrive) || o.until?.()) return;
      const now = ctx.now();
      if (now - t0 > budget) throw new SimFail('bot', `driveTo ${o.why}: stuck at (${fmt(v.x)}, ${fmt(v.z)})`);
      // Stuck: moved under a metre in the window. Reverse and steer the other way for 1.2 s.
      if (now - anchorT >= STUCK_WINDOW) {
        if (Math.hypot(v.x - anchorX, v.z - anchorZ) < 1) reverseUntil = now + 1.2;
        anchorX = v.x;
        anchorZ = v.z;
        anchorT = now;
      }
      // Pass aims already reached; on the first aim also skip one that is behind us (we drove past it).
      const last = aims.length - 1;
      while (idx < last) {
        const a = aims[idx];
        const nx0 = aims[idx + 1];
        // Passed the first aim: the car is already past it along its road leg (a straight line back would cut across blocks).
        const behind = idx === 0 && nx0 !== undefined && (v.x - a.x) * (nx0.x - a.x) + (v.z - a.z) * (nx0.z - a.z) > 0;
        if (Math.hypot(a.x - v.x, a.z - v.z) >= (a.deck ? 2.5 : 6) && !behind) break;
        idx++;
      }
      const aim = aims[idx];
      const { steer, diff } = steerTo(v, aim.x, aim.z);
      if (now < reverseUntil) {
        ctx.drive({ throttle: -1, steer: -lastSteer, lift: 0 });
      } else {
        // Slow down for sharp turns; brake when faster than the cap, coast in the band, accelerate below it.
        let cap = (o.speed ?? v.spec.maxSpeed) * (Math.abs(diff) > 0.45 ? 0.55 : 1);
        // A sharp bend on a deck or ramp coming up: slow to a crawl so the turn stays on the deck.
        const nx = aims[idx + 1];
        if (aim.deck && nx && Math.hypot(aim.x - v.x, aim.z - v.z) < 14) {
          const turn = Math.abs(angleDiff(Math.atan2(nx.x - aim.x, nx.z - aim.z), Math.atan2(aim.x - v.x, aim.z - v.z)));
          if (turn > 0.5) cap = Math.min(cap, 5);
        }
        if (aim.deck && Math.abs(diff) > 0.3) cap = Math.min(cap, 6);
        const throttle = v.speed > cap + 1 ? -1 : v.speed < cap - 0.5 ? 1 : 0;
        lastSteer = steer;
        ctx.drive({ throttle, steer, lift: 0 });
      }
      await ctx.step();
    }
  } finally {
    ctx.drive(null);
  }
}

/** Fly the current flyer to (x, z) at height `y` (world y). */
export async function flyTo(ctx: SimCtx, x: number, y: number, z: number, o: MoveOpts): Promise<void> {
  if (!ctx.player.vehicle?.spec.flies) throw new SimFail('bot', `flyTo ${o.why}: not in a flyer`);
  const budget = o.budget ?? 300;
  const t0 = ctx.now();
  try {
    for (;;) {
      const v = ctx.player.vehicle;
      if (!v) throw new SimFail('bot', `flyTo ${o.why}: left the flyer`);
      if (Math.hypot(x - v.x, z - v.z) <= o.arrive && Math.abs(v.y - y) < 4) return;
      if (o.until?.()) return;
      if (ctx.now() - t0 > budget) {
        throw new SimFail('bot', `flyTo ${o.why}: not there after ${budget}s (at ${fmt(v.x)}, ${fmt(v.y)}, ${fmt(v.z)})`);
      }
      const { steer } = steerTo(v, x, z);
      const dist = Math.hypot(x - v.x, z - v.z);
      const stall = v.spec.stallSpeed ?? 22;
      // A hovering flyer eases off the throttle near the point; a plane keeps full power.
      let throttle = !v.spec.fixedWing && dist < 30 ? 0.4 : 1;
      let lift = Math.max(-1, Math.min(1, (y - v.y) / 5));
      // A plane on the ground runs up to stall speed with no lift, then climbs.
      const onGround = v.y - groundAt(v.x, v.z, v.y) <= 0.1;
      if (v.spec.fixedWing && onGround) {
        lift = v.speed >= 0.9 * stall ? 1 : 0;
        throttle = 1;
      }
      ctx.drive({ throttle, steer, lift });
      await ctx.step();
    }
  } finally {
    ctx.drive(null);
  }
}
