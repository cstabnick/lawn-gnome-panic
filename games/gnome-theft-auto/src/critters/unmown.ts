// The Unmown's wildlife (E31): hares in the Long Meadow, hedgehogs and a fox at the edge of Oldroot Wood, frogs and
// dragonflies at Reedmere, ducks on the marsh, butterflies over the meadow. Local to each browser, nothing dies.
import type { Critter, CritterCtx, CritterRuntime, RegionLife, SpawnGroup } from '../critters';
import { heightAt } from '../terrain';

const R = 'the-unmown';
const g = (id: string, kind: SpawnGroup['kind'], x: number, z: number, count: number, spread: number, leash: number): SpawnGroup =>
  ({ id, kind, region: R, x, z, count, spread, leash });

const ACTIVE = 150;
const BOX_MIN_D = 15;
const BOX_MAX_D = 60;
const BOX_TIME = 1.5;
const BOUNCE = 0.3;
const BOUNCE_H = 0.3;
const PLOP_D = 3;
const NIGHT_EDGE = 0.3;
const FROG_FLEE = { x: 0, z: 1 }; // south, into the marsh water

interface Memo { nextBox: number; a: Critter | null; b: Critter | null; boxT: number }
const memo = new WeakMap<CritterRuntime, Memo>();
function stateOf(rt: CritterRuntime): Memo {
  let m = memo.get(rt);
  if (!m) {
    m = { nextBox: 20 + Math.random() * 20, a: null, b: null, boxT: 0 };
    memo.set(rt, m);
  }
  return m;
}

function endBox(m: Memo): void {
  for (const c of [m.a, m.b]) {
    if (!c) continue;
    c.mode = 'wander';
    c.goalX = c.homeX;
    c.goalZ = c.homeZ;
    c.y = heightAt(c.x, c.z);
  }
  m.a = null;
  m.b = null;
}

function startBox(rt: CritterRuntime, m: Memo, ctx: CritterCtx): void {
  const groups = ['unmown-hares-a', 'unmown-hares-b', 'unmown-hares-c'];
  const id = groups[Math.floor(Math.random() * groups.length)];
  const members = rt.inGroup(id).filter((c) => c.mode === 'idle' || c.mode === 'wander');
  if (members.length < 2) return;
  const a = members[0], b = members[1];
  const d = Math.hypot(a.x - ctx.playerX, a.z - ctx.playerZ);
  if (d < BOX_MIN_D || d > BOX_MAX_D) return;
  a.mode = 'script';
  b.mode = 'script';
  a.speed = 0;
  b.speed = 0;
  a.yaw = Math.atan2(b.x - a.x, b.z - a.z);
  b.yaw = Math.atan2(a.x - b.x, a.z - b.z);
  m.a = a;
  m.b = b;
  m.boxT = 0;
}

export const unmownLife: RegionLife = {
  id: R,
  groups: [
    g('unmown-hares-a', 'hare', -640, -1650, 4, 6, 14),
    g('unmown-hares-b', 'hare', -520, -1610, 3, 6, 14),
    g('unmown-hares-c', 'hare', -440, -1660, 3, 6, 14),
    g('unmown-hedgehogs-a', 'hedgehog', -1620, -1450, 2, 3, 8),
    g('unmown-hedgehogs-b', 'hedgehog', -1700, -1500, 2, 3, 8),
    g('unmown-fox', 'fox', -1660, -1380, 2, 3, 8),
    g('unmown-frogs-a', 'frog', -1150, -1600, 5, 3, 8),
    g('unmown-frogs-b', 'frog', -1060, -1600, 5, 3, 8),
    g('unmown-dragonflies-a', 'dragonfly', -1150, -1650, 3, 4, 14),
    g('unmown-dragonflies-b', 'dragonfly', -1100, -1660, 3, 4, 14),
    g('unmown-ducks', 'duck', -1180, -1640, 4, 4, 14),
    g('unmown-butterflies-a', 'butterfly', -600, -1580, 3, 5, 18),
    g('unmown-butterflies-b', 'butterfly', -480, -1640, 3, 5, 18),
    g('unmown-butterflies-c', 'butterfly', -750, -1470, 3, 5, 18),
  ],

  update(rt, ctx) {
    const m = stateOf(rt);

    // Hares box: the pair faces off, bouncing, then goes back to wandering.
    if (m.a && m.b) {
      m.boxT += ctx.dt;
      const bounce = Math.abs(Math.sin((m.boxT / BOUNCE) * Math.PI)) * BOUNCE_H;
      m.a.y = heightAt(m.a.x, m.a.z) + bounce;
      m.b.y = heightAt(m.b.x, m.b.z) + Math.abs(Math.sin((m.boxT / BOUNCE) * Math.PI + 1.2)) * BOUNCE_H;
      if (m.boxT >= BOX_TIME) endBox(m);
    } else if (ctx.time >= m.nextBox) {
      m.nextBox = ctx.time + 20 + Math.random() * 20;
      if (ctx.night < NIGHT_EDGE) startBox(rt, m, ctx);
    }

    const dusk = ctx.night > NIGHT_EDGE;
    for (const c of rt.list) {
      if (c.region !== R) continue;
      const dx = c.x - ctx.playerX, dz = c.z - ctx.playerZ;
      if (dx * dx + dz * dz > ACTIVE * ACTIVE) continue;
      switch (c.kind) {
        case 'fox':
        case 'hedgehog':
          c.leash = dusk ? 40 : 8;
          break;
        case 'frog':
          if (!ctx.playerVehicle && (c.mode === 'idle' || c.mode === 'wander') && dx * dx + dz * dz < PLOP_D * PLOP_D) {
            c.fleeDir = FROG_FLEE;
            rt.scare(c, ctx.playerX, ctx.playerZ, 1.5);
          }
          break;
        case 'butterfly': {
          const t = ((c.data.zigT as number | undefined) ?? Math.random() * 3) - ctx.dt;
          if (t <= 0) {
            const a = Math.random() * Math.PI * 2;
            const r = 3 + Math.random() * 6;
            c.goalX = c.x + Math.cos(a) * r;
            c.goalZ = c.z + Math.sin(a) * r;
            if (Math.hypot(c.goalX - c.homeX, c.goalZ - c.homeZ) > c.leash) { c.goalX = c.homeX; c.goalZ = c.homeZ; }
            if (c.mode === 'idle') c.mode = 'wander';
            c.data.zigT = 2 + Math.random() * 3;
          } else {
            c.data.zigT = t;
          }
          break;
        }
        default:
          break;
      }
    }
  },
};
