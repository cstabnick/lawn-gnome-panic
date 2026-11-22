// Hoard Rush: a Gnome Party slice of The Final Collectathon. 30 s, four gnomes on Floor 2's open plan, the ceiling
// rains office supplies and the multiplier doubles every 10 s; whoever collects the most wins.
// Built from the game's own modules: collect.ts (items, rain, pickups, formatCount), walk.ts (stepWalker),
// office.ts (buildFloor 'f2') and items.ts (the pickup view). Only CPU, scoring and view glue live here.
import * as THREE from 'three';
import { createGnomeModel, type GnomeModel, type PlayerState } from '@lawn/gnome';
import type { MinigameDef } from '@lawn/party';
import { soleWinner } from '@lawn/party';
import { createCollectState, formatCount, rain, scatter, stepCollect } from '../collect';
import { createWalker, stepWalker } from '../walk';
import { buildFloor } from '../office';
import { createItemView } from '../items';
import type { Box, CollectState, ItemKind, Rect, Walker } from '../types';

const ROUND_S = 30;
/** Live items; the issue allows 16, but 16 resting items put S at ~2030 bytes, too close to the 2 KB cap. */
const MAX_ITEMS = 14;
const RAIN_EVERY = 0.6;
const DOUBLE_EVERY = 10;
const CPU_SPEED = 0.85;
/** Floor 2's 'open-plan' area (floors/f2.ts). */
const OPEN_PLAN: Rect = { x0: -9, z0: -6, x1: 9, z1: 9 };
const INSET = 1;

/** Four thin walls around the open plan, so step() stays pure (the real floor's colliders need three). */
function edgeBoxes(r: Rect): Box[] {
  const t = 0.5, h = 3;
  return [
    { min: [r.x0 - t, 0, r.z0 - t], max: [r.x0, h, r.z1 + t] },
    { min: [r.x1, 0, r.z0 - t], max: [r.x1 + t, h, r.z1 + t] },
    { min: [r.x0, 0, r.z0 - t], max: [r.x1, h, r.z0] },
    { min: [r.x0, 0, r.z1], max: [r.x1, h, r.z1 + t] },
  ];
}
const COLLIDERS = edgeBoxes(OPEN_PLAN);

interface S {
  t: number;
  c: CollectState;
  w: Walker[];
  score: number[];
  cpu: { tx: number; tz: number }[];
  nextRain: number;
  nextDouble: number;
}
interface I { x: number; z: number }

const r2 = (v: number) => Math.round(v * 100) / 100;

function randomPoint(rng: () => number): { tx: number; tz: number } {
  return {
    tx: r2(OPEN_PLAN.x0 + INSET + rng() * (OPEN_PLAN.x1 - OPEN_PLAN.x0 - 2 * INSET)),
    tz: r2(OPEN_PLAN.z0 + INSET + rng() * (OPEN_PLAN.z1 - OPEN_PLAN.z0 - 2 * INSET)),
  };
}

function rainKind(v: number): ItemKind {
  return v < 0.6 ? 'clip' : v < 0.9 ? 'sticky' : 'button';
}

function roundWalker(w: Walker): void {
  w.x = r2(w.x); w.y = r2(w.y); w.z = r2(w.z);
  w.vx = r2(w.vx); w.vy = r2(w.vy); w.vz = r2(w.vz);
  w.facing = r2(w.facing);
}

const def: MinigameDef<S, I> = {
  meta: {
    id: 'hoard-rush',
    title: 'Hoard Rush',
    game: 'final-collectathon',
    goal: 'Collect more than anyone in 30 seconds while the ceiling rains office supplies.',
    controls: 'Move with the stick, WASD or arrows; walk into things to collect them.',
    maxSeconds: ROUND_S,
  },

  init(seats, rng) {
    const c = createCollectState(Math.floor(rng() * 4294967296));
    c.magnet = 0.8;
    const cx = (OPEN_PLAN.x0 + OPEN_PLAN.x1) / 2, cz = (OPEN_PLAN.z0 + OPEN_PLAN.z1) / 2;
    const corners = [
      [OPEN_PLAN.x0 + INSET, OPEN_PLAN.z0 + INSET], [OPEN_PLAN.x1 - INSET, OPEN_PLAN.z0 + INSET],
      [OPEN_PLAN.x0 + INSET, OPEN_PLAN.z1 - INSET], [OPEN_PLAN.x1 - INSET, OPEN_PLAN.z1 - INSET],
    ];
    const w = seats.map((_, k) => {
      const [x, z] = corners[k % 4];
      return createWalker(x, 0, z, r2(Math.atan2(cx - x, cz - z)));
    });
    scatter(c, 'clip', 8, OPEN_PLAN);
    for (const it of c.items) { it.x = r2(it.x); it.y = r2(it.y); it.z = r2(it.z); }
    return {
      t: 0, c, w,
      score: seats.map(() => 0),
      cpu: seats.map(() => randomPoint(rng)),
      nextRain: RAIN_EVERY,
      nextDouble: DOUBLE_EVERY,
    };
  },

  step(s, inputs, dt, rng) {
    s.t += dt;
    s.w.forEach((w, k) => {
      const i = inputs[k] ?? { x: 0, z: 0 };
      stepWalker(w, i.x, i.z, false, COLLIDERS, 0, dt);
      roundWalker(w);
      const target = s.cpu[k];
      if (Math.hypot(w.x - target.tx, w.z - target.tz) < 1) s.cpu[k] = randomPoint(rng);
    });
    if (s.t >= s.nextRain) {
      s.nextRain += RAIN_EVERY;
      if (s.c.items.length < MAX_ITEMS) rain(s.c, rainKind(rng()), Math.min(2, MAX_ITEMS - s.c.items.length), OPEN_PLAN);
    }
    if (s.t >= s.nextDouble) {
      s.nextDouble += DOUBLE_EVERY;
      s.c.multiplier *= 2;
    }
    // stepCollect gives a contested item to the first collector in range: rotate who is first every step.
    const n = s.w.length, first = Math.floor(s.t * 60) % n;
    const order = s.w.map((_, i) => (first + i) % n);
    const picks = stepCollect(s.c, order.map((k) => ({ x: s.w[k].x, y: s.w[k].y, z: s.w[k].z })), dt);
    for (const p of picks) s.score[order[p.by]] += p.amount;
    s.c.t = r2(s.c.t);
    for (const it of s.c.items) { it.x = r2(it.x); it.y = r2(it.y); it.z = r2(it.z); it.vy = r2(it.vy); }
  },

  cpu(s, seat) {
    const w = s.w[seat];
    let tx = s.cpu[seat].tx, tz = s.cpu[seat].tz, best = Infinity;
    for (const it of s.c.items) {
      const d = (it.x - w.x) ** 2 + (it.z - w.z) ** 2;
      // Prefer items no other gnome is closer to, so the CPUs spread out instead of chasing one clip as a pack.
      const mine = s.w.every((o, k) => k === seat || (it.x - o.x) ** 2 + (it.z - o.z) ** 2 >= d);
      const cost = mine ? d : d + 100;
      if (cost < best) { best = cost; tx = it.x; tz = it.z; }
    }
    const dx = tx - w.x, dz = tz - w.z;
    const len = Math.hypot(dx, dz);
    if (len < 1e-3) return { x: 0, z: 0 };
    return { x: r2((dx / len) * CPU_SPEED), z: r2((dz / len) * CPU_SPEED) };
  },

  result(s, timeUp) {
    if (!timeUp && s.t < ROUND_S) return null;
    return s.score.map((v) => s.score.filter((o) => o > v).length);
  },

  report(s, places, seats) {
    const w = soleWinner(places);
    return {
      headline: w === null ? undefined : `${seats[w]?.name ?? 'Someone'} hoarded ${formatCount(s.score[w])}!`,
      stats: [{ key: 'hoard', label: 'Collected', better: 'higher' }],
      values: s.score.map((v) => ({ hoard: v })),
      notes: s.score.map((_, k) => (k === w ? 'Floor 2: 104%' : null)),
    };
  },

  createView(ctx) {
    const { scene, camera, ui, seats } = ctx;
    const floor = buildFloor(scene, 'f2');
    const items = createItemView(scene);

    const look = new THREE.Vector3(0, 0, 1.5);
    const base = new THREE.Vector3(0, 22, 20).sub(look);
    let aspect = 0;
    function aimCamera(): void {
      if (camera.aspect === aspect) return;
      aspect = camera.aspect;
      // ×1.4 on a portrait screen, and far enough that the open plan's width (plus a margin) always fits.
      const halfW = (OPEN_PLAN.x1 - OPEN_PLAN.x0) / 2 + 1.5;
      const fit = halfW / (base.length() * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect);
      const pull = Math.max(aspect < 1 ? 1.4 : 1, fit);
      camera.position.copy(base).multiplyScalar(pull).add(look);
      camera.lookAt(look);
    }
    aimCamera();

    const gnomes: { model: GnomeModel; pose: PlayerState; target: THREE.Vector3; facing: number }[] = seats.map(
      (seat) => {
        const model = createGnomeModel(seat.look);
        scene.add(model.object);
        return {
          model,
          pose: { position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0 },
          target: new THREE.Vector3(),
          facing: 0,
        };
      },
    );
    let placed = false;

    const bar = document.createElement('div');
    bar.style.cssText =
      'position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom, 0px) + 10px);display:flex;justify-content:center;' +
      'flex-wrap:wrap;gap:6px;padding:0 16px;pointer-events:none;font:700 clamp(12px, 3.4vw, 16px) system-ui;color:#fff';
    const chips = seats.map((seat) => {
      const chip = document.createElement('div');
      const hex = `#${seat.color.toString(16).padStart(6, '0')}`;
      chip.style.cssText = `background:${hex};border-radius:999px;padding:4px 12px;text-shadow:0 1px 2px #000;box-shadow:0 1px 4px #0006`;
      bar.appendChild(chip);
      return chip;
    });
    const mult = document.createElement('div');
    mult.style.cssText = 'background:#222c;border-radius:999px;padding:4px 12px';
    bar.appendChild(mult);
    ui.appendChild(bar);

    return {
      render(s, dt) {
        aimCamera();
        const k = 1 - Math.exp(-dt * 15);
        s.w.forEach((w, i) => {
          const g = gnomes[i];
          if (!g) return;
          g.target.set(w.x, w.y, w.z);
          if (!placed) g.pose.position.copy(g.target);
          const prev = g.pose.position.clone();
          g.pose.position.lerp(g.target, k);
          if (dt > 0) g.pose.velocity.copy(g.pose.position).sub(prev).divideScalar(dt);
          g.pose.velocity.y = 0;
          g.pose.facing = w.facing;
          g.model.update(g.pose, dt);
        });
        placed = true;
        items.sync(s.c as CollectState, dt);
        floor.update(dt);
        chips.forEach((chip, i) => { chip.textContent = `${seats[i].name} ${formatCount(s.score[i] ?? 0)}`; });
        mult.textContent = `×${formatCount(s.c.multiplier)}`;
      },
      input(pad) {
        return { x: r2(pad.x), z: r2(-pad.y) };
      },
      dispose() {
        floor.dispose();
        items.clear();
        for (const g of gnomes) scene.remove(g.model.object);
        bar.remove();
      },
    };
  },
};

export default def;
