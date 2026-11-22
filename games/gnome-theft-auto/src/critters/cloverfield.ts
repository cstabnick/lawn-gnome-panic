// Cloverfield Farms herds (cows, sheep, pigs, hens): issue 6C.
// Herds scatter from mowers; the combine and the mulch spreader herd them instead; running into a cow on foot tips it.
import { buildPrefab } from '@lawn/prefabs';
import type { Critter, CritterCtx, CritterKind, CritterRuntime, HitCause, RegionLife } from '../critters';
import { heightAt } from '../terrain';
import type { Vehicle } from '../types';

const HERDABLE: ReadonlySet<CritterKind> = new Set<CritterKind>(['cow', 'sheep', 'pig']);
const HITTABLE: ReadonlySet<CritterKind> = new Set<CritterKind>(['cow', 'sheep', 'pig', 'hen']);
const HERD_RANGE = 18;
const HERD_MIN = 5;
const HERD_COOLDOWN = 60;
const HERD_SPEED = 2;
const NUDGE_SPEED = 8;
const TIP_SPEED = 4;
const TIP_PAD = 0.6;
const TIP_AGAIN = 20;
const TIP_EVENT_COOLDOWN = 60;

const PEN_HALF = 7;
const FENCE_LEN = 4;
const FENCE_STEP = FENCE_LEN + 0.02;
const FENCE_H = 1.2;
const FENCE_THICK = 0.4;

/** True for a machine that herds: the combine and the mulch spreader. */
export function isHerder(v: Vehicle | null): boolean {
  return !!v && (v.kind === 'combine' || v.kind === 'mulch-spreader');
}

interface Memo { herdT: number; tipEventT: number }
const memo = new WeakMap<CritterRuntime, Memo>();
function stateOf(rt: CritterRuntime): Memo {
  let m = memo.get(rt);
  if (!m) {
    m = { herdT: -Infinity, tipEventT: -Infinity };
    memo.set(rt, m);
  }
  return m;
}

/** A square wooden-fence pen with a 4-unit gate in the south side, and a water trough inside. */
function buildPen(rt: CritterRuntime, cx: number, cz: number): void {
  const sections: { x: number; z: number; along: 'x' | 'z' }[] = [];
  for (const k of [-1, 0, 1]) {
    sections.push({ x: cx + k * FENCE_STEP, z: cz - PEN_HALF, along: 'x' }); // north
    sections.push({ x: cx - PEN_HALF, z: cz + k * FENCE_STEP, along: 'z' }); // west
    sections.push({ x: cx + PEN_HALF, z: cz + k * FENCE_STEP, along: 'z' }); // east
  }
  for (const k of [-1, 1]) sections.push({ x: cx + k * FENCE_STEP, z: cz + PEN_HALF, along: 'x' }); // south, gate in the middle

  for (const s of sections) {
    const obj = buildPrefab('wooden-fence', { scale: 2, lights: false });
    obj.position.set(s.x, heightAt(s.x, s.z), s.z);
    if (s.along === 'z') obj.rotation.y = Math.PI / 2;
    rt.scene.add(obj);
    const half = FENCE_LEN / 2;
    const t = FENCE_THICK / 2;
    rt.world.boxes.push(s.along === 'x'
      ? { minX: s.x - half, maxX: s.x + half, minZ: s.z - t, maxZ: s.z + t, h: FENCE_H }
      : { minX: s.x - t, maxX: s.x + t, minZ: s.z - half, maxZ: s.z + half, h: FENCE_H });
  }

  const trough = buildPrefab('water-trough', { scale: 1.5, lights: false });
  trough.position.set(cx, heightAt(cx, cz - 3), cz - 3);
  rt.scene.add(trough);
}

export const cloverfieldLife: RegionLife = {
  id: 'cloverfield-farms',
  groups: [
    { id: 'clover-cows-west', kind: 'cow', region: 'cloverfield-farms', x: -140, z: 480, count: 6, spread: 10, leash: 30 },
    { id: 'clover-cows-east', kind: 'cow', region: 'cloverfield-farms', x: 200, z: 760, count: 5, spread: 10, leash: 30 },
    { id: 'clover-sheep-south', kind: 'sheep', region: 'cloverfield-farms', x: 120, z: 560, count: 8, spread: 12, leash: 35 },
    { id: 'clover-sheep-west', kind: 'sheep', region: 'cloverfield-farms', x: -220, z: 800, count: 7, spread: 12, leash: 35 },
    { id: 'clover-pigs', kind: 'pig', region: 'cloverfield-farms', x: -130, z: 360, count: 4, spread: 3, leash: 5 },
    { id: 'clover-hens-granny', kind: 'hen', region: 'cloverfield-farms', x: -50, z: 345, count: 10, spread: 5, leash: 10 },
    { id: 'clover-hens-east', kind: 'hen', region: 'cloverfield-farms', x: 300, z: 650, count: 8, spread: 5, leash: 10 },
  ],

  init(rt) {
    const pig = rt.inGroup('clover-pigs')[0];
    if (pig) buildPen(rt, pig.homeX, pig.homeZ);
  },

  update(rt, ctx: CritterCtx) {
    const m = stateOf(rt);

    // Cow tipping clock: every cow counts up.
    for (const c of rt.list) {
      if (c.kind === 'cow') c.data.tipT = ((c.data.tipT as number | undefined) ?? 999) + ctx.dt;
    }

    // Herding: the combine or mulch spreader moving under power herds the cows, sheep and pigs around it.
    const v = ctx.playerVehicle;
    if (v && isHerder(v) && Math.abs(v.speed) > HERD_SPEED) {
      const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
      let herded = 0;
      for (const c of rt.list) {
        if (!HERDABLE.has(c.kind) || c.mode === 'down' || c.mode === 'script') continue;
        if (Math.hypot(c.x - v.x, c.z - v.z) > HERD_RANGE) continue;
        c.fleeDir = { x: fx, z: fz };
        rt.scare(c, v.x, v.z, 2);
        herded++;
      }
      if (herded >= HERD_MIN && ctx.time - m.herdT >= HERD_COOLDOWN) {
        m.herdT = ctx.time;
        rt.deps.toast('Herding the herd!');
        rt.deps.earn(10, 'Herding');
        rt.deps.event('herd-herded');
      }
    }

    // Cow tipping: running into a standing cow on foot knocks it over.
    if (!ctx.playerVehicle && ctx.playerSpeed > TIP_SPEED) {
      for (const c of rt.list) {
        if (c.kind !== 'cow' || (c.mode !== 'idle' && c.mode !== 'wander')) continue;
        if (((c.data.tipT as number | undefined) ?? 999) <= TIP_AGAIN) continue;
        if (Math.hypot(c.x - ctx.playerX, c.z - ctx.playerZ) > c.spec.radius + TIP_PAD) continue;
        c.data.tipT = 0;
        rt.knock(c, ctx.playerX, ctx.playerZ, 'foot');
        rt.deps.callout('COW TIPPED!', '+20 Acorns');
        rt.deps.earn(20, 'Cow Tipping');
        rt.deps.play('stunt');
        if (ctx.time - m.tipEventT >= TIP_EVENT_COOLDOWN) {
          m.tipEventT = ctx.time;
          rt.deps.event('cow-tipped');
        }
      }
    }
  },

  onHit(rt, c: Critter, cause: HitCause): boolean {
    if (!HITTABLE.has(c.kind)) return false;
    const v = rt.ctx?.playerVehicle ?? null;
    // A slow herding machine only nudges the herd.
    if (cause === 'vehicle' && v && isHerder(v) && Math.abs(v.speed) < NUDGE_SPEED) return true;
    if (c.kind === 'hen' && Math.random() < 1 / 3) rt.deps.toast('Feathers everywhere.');
    return false;
  },
};
