// Mowable plants at run time. createFlora drains the plants harvested from the static scenery (flora/harvest.ts), takes
// their colliders out of world.boxes, draws them instanced (flora/render.ts) and, every frame:
//   - every ground vehicle that moved (the player's, traffic, police, other players') mows the plants under its circle:
//     cut to stubble, clippings, a snip; local vehicles lose a little speed on big shrubs, the player's camera shakes;
//   - the player on foot brushes plants aside (they lean away and spring back);
//   - cut plants regrow after their wait, only while the player is 30 m or more away.
// The per-frame path allocates nothing. Online: no messages; each client mows from every vehicle it sees.
import type * as THREE from 'three';
import { aboveGround } from '../terrain';
import { playAt } from '../sound/bus';
import type { Player, Vehicle, World } from '../types';
import { drainHarvest, setPlantSink } from './harvest';
import { createPlantStore, nearestPlant, queryCircle } from './grid';
import { extractPlantBoxes } from './extract';
import { mowPlant, plantHeightScale, regrowPlant, stepPlants } from './state';
import { buildPlantRender, type PlantRender } from './render';
import { createClippings } from './clippings';
import { registerMowSounds } from './sounds';
import { createMowRewards } from './rewards';
import { createMowTally } from './tally';
import { FLORA, MOWER_KINDS, PLANT_KINDS } from './kinds';
import { CUT, REGROWING, STANDING, type PlantSeed, type PlantStore } from './types';
import { registerFloraTrainer } from './trainer';

export interface FloraDeps {
  scene: THREE.Scene; world: World; ui: HTMLElement;
  shake(amount: number): void;
  increment(id: string, by?: number): void;
  earn(amount: number, reason?: string): void;
  toast(text: string, ms?: number): void;
}
export interface FloraStats { plants: number; standing: number; cut: number; regrowing: number; mowed: number; lawn: number; byKind: Record<string, number> }
export interface Flora {
  /** Per frame. `remote`: other players' vehicles (mow locally from their poses; never slowed, never counted). */
  update(dt: number, vehicles: readonly Vehicle[], player: Player, remote?: readonly Vehicle[]): void;
  /** Trainer: cut every standing plant within r of (x, z) (not counted). Returns how many. */
  mowAllNear(x: number, z: number, r: number): number;
  /** Trainer: every plant standing again at once. Returns how many changed. */
  regrowAll(): number;
  stats(): FloraStats;
  /** Nearest plant (any state) within maxR (default 50): contact centre, radius, prefab id, state. For scripted checks. */
  nearest(x: number, z: number, maxR?: number): { x: number; z: number; r: number; id: string; state: number } | null;
  /** Trainer: zero the Mowed counter. */
  resetCounter(): void;
}

interface Layer { store: PlantStore; render: PlantRender; changed: Int32Array }
interface Brush { layer: Layer | null; i: number; lx: number; lz: number; t: number }

const BRUSH_SLOTS = 8;
const RUSTLE_GAP = 0.5;
const TELEPORT_M = 20;

export function createFlora(deps: FloraDeps): Flora {
  const layers: Layer[] = [];
  const addLayer = (seeds: PlantSeed[]): void => {
    if (seeds.length === 0) return;
    const store = createPlantStore(seeds);
    const render = buildPlantRender(store);
    deps.scene.add(render.root);
    layers.push({ store, render, changed: new Int32Array(store.count) });
  };
  const first = drainHarvest();
  extractPlantBoxes(deps.world.boxes, first);
  addLayer(first);
  setPlantSink((more) => {
    extractPlantBoxes(deps.world.boxes, more);
    addLayer(more);
  });

  registerMowSounds();
  const clippings = createClippings(deps.scene);
  const rewards = createMowRewards({ increment: deps.increment, earn: deps.earn, toast: deps.toast });
  const tally = createMowTally(deps.ui);

  const hits = new Int32Array(64);
  const last = new WeakMap<Vehicle, Float64Array>();
  const soundAt = { x: 0, z: 0 };
  const brushes: Brush[] = [];
  for (let k = 0; k < BRUSH_SLOTS; k++) brushes.push({ layer: null, i: -1, lx: 0, lz: 0, t: 0 });
  let soundsThisFrame = 0;
  let rustleT = 0;

  const play = (id: string, x: number, z: number): void => {
    soundAt.x = x;
    soundAt.z = z;
    playAt(id, soundAt);
  };

  /** One vehicle's mowing pass this frame. */
  const mowWith = (v: Vehicle, dt: number, local: boolean): void => {
    if (v.exploded || v.spec.boat) return;
    let prev = last.get(v);
    if (!prev) {
      prev = new Float64Array(3);
      prev[0] = v.x;
      prev[1] = v.z;
      last.set(v, prev);
      return;
    }
    const moved = Math.hypot(v.x - prev[0], v.z - prev[1]);
    prev[0] = v.x;
    prev[1] = v.z;
    if (prev[2] > 0) prev[2] -= dt;
    if (dt <= 0 || moved > TELEPORT_M || moved / dt < FLORA.minMowSpeed) return;
    if (aboveGround(v.x, v.y, v.z) > FLORA.maxMowAboveGround) return;
    const isPlayer = local && v.driver === 'player';
    for (let L = 0; L < layers.length; L++) {
      const { store, render } = layers[L];
      const n = queryCircle(store, v.x, v.z, v.spec.radius, hits);
      for (let k = 0; k < n; k++) {
        const i = hits[k];
        if (!mowPlant(store, i, Math.random())) continue;
        render.pose(i, FLORA.stubbleY);
        const kind = PLANT_KINDS[store.kind[i]];
        const seed = store.seeds[i];
        clippings.burst(seed.cx, seed.y, seed.cz, kind.clip, FLORA.clipCount[kind.size], Math.max(0.3, store.r[i] * 0.6));
        if (prev[2] <= 0 && soundsThisFrame < FLORA.soundsPerFrame) {
          play(kind.sound, seed.cx, seed.cz);
          prev[2] = FLORA.soundGap;
          soundsThisFrame++;
        }
        if (local && kind.slow < 1) v.speed *= kind.slow;
        if (isPlayer) {
          if (kind.size === 'big') deps.shake(FLORA.bigShake);
          rewards.record(kind.id, kind.longGrass, MOWER_KINDS.includes(v.kind));
          tally.show(rewards.save().total);
        }
      }
    }
  };

  const freeBrush = (b: Brush): void => {
    b.layer = null;
    b.i = -1;
  };

  /** The player on foot leans the plants at their feet away; they spring back once the gnome has passed. */
  const brushFoot = (dt: number, px: number, pz: number, onFoot: boolean): void => {
    if (rustleT > 0) rustleT -= dt;
    if (onFoot) {
      for (let L = 0; L < layers.length; L++) {
        const layer = layers[L];
        const { store } = layer;
        const n = queryCircle(store, px, pz, FLORA.brushRadius, hits);
        for (let k = 0; k < n; k++) {
          const i = hits[k];
          if (store.state[i] !== STANDING) continue;
          let taken = false;
          let free: Brush | null = null;
          for (let s = 0; s < BRUSH_SLOTS; s++) {
            const b = brushes[s];
            if (b.layer === layer && b.i === i) taken = true;
            else if (!b.layer && !free) free = b;
          }
          if (taken || !free) continue;
          let dx = store.cx[i] - px, dz = store.cz[i] - pz;
          const d = Math.hypot(dx, dz);
          if (d < 1e-3) { dx = 1; dz = 0; } else { dx /= d; dz /= d; }
          free.layer = layer;
          free.i = i;
          free.lx = dz * FLORA.brushLean;
          free.lz = -dx * FLORA.brushLean;
          free.t = 0;
          if (rustleT <= 0) {
            play('mow-rustle', store.cx[i], store.cz[i]);
            rustleT = RUSTLE_GAP;
          }
        }
      }
    }
    for (let s = 0; s < BRUSH_SLOTS; s++) {
      const b = brushes[s];
      const layer = b.layer;
      if (!layer) continue;
      const { store, render } = layer;
      const i = b.i;
      if (store.state[i] !== STANDING) { freeBrush(b); continue; }
      const reach = store.r[i] + FLORA.brushRadius;
      const dx = store.cx[i] - px, dz = store.cz[i] - pz;
      if (onFoot && dx * dx + dz * dz < reach * reach) b.t = 0;
      else b.t += dt;
      const a = 1 - b.t / FLORA.brushBack;
      if (a <= 0) {
        render.pose(i, 1);
        freeBrush(b);
      } else {
        render.pose(i, 1, b.lx * a, b.lz * a);
      }
    }
  };

  const flora: Flora = {
    update(dt, vehicles, player, remote) {
      soundsThisFrame = 0;
      if (layers.length > 0) {
        for (let k = 0; k < vehicles.length; k++) mowWith(vehicles[k], dt, true);
        if (remote) for (let k = 0; k < remote.length; k++) mowWith(remote[k], dt, false);
        brushFoot(dt, player.x, player.z, !player.vehicle && !player.ragdolling);
        for (let L = 0; L < layers.length; L++) {
          const { store, render, changed } = layers[L];
          if (store.activeCount === 0) continue;
          const n = stepPlants(store, dt, player.x, player.z, changed);
          for (let k = 0; k < n; k++) render.pose(changed[k], plantHeightScale(store, changed[k]));
        }
      }
      clippings.update(dt);
      rewards.update(dt);
      tally.update(dt);
    },
    mowAllNear(x, z, r) {
      let count = 0;
      for (const { store, render } of layers) {
        const out = new Int32Array(store.count);
        const n = queryCircle(store, x, z, r, out);
        for (let k = 0; k < n; k++) {
          if (store.state[out[k]] === CUT) continue;
          if (mowPlant(store, out[k], Math.random())) {
            render.pose(out[k], FLORA.stubbleY);
            count++;
          }
        }
      }
      return count;
    },
    regrowAll() {
      let count = 0;
      for (const { store, render } of layers) {
        for (let k = store.activeCount - 1; k >= 0; k--) {
          const i = store.active[k];
          regrowPlant(store, i);
          render.pose(i, 1);
          count++;
        }
      }
      return count;
    },
    stats() {
      let plants = 0, standing = 0, cut = 0, regrowing = 0;
      for (const { store } of layers) {
        plants += store.count;
        for (let i = 0; i < store.count; i++) {
          const s = store.state[i];
          if (s === STANDING) standing++;
          else if (s === CUT) cut++;
          else if (s === REGROWING) regrowing++;
        }
      }
      const save = rewards.save();
      return { plants, standing, cut, regrowing, mowed: save.total, lawn: save.lawn, byKind: { ...save.byKind } };
    },
    nearest(x, z, maxR = 50) {
      let best: { x: number; z: number; r: number; id: string; state: number } | null = null;
      let bestD = Infinity;
      for (const { store } of layers) {
        const i = nearestPlant(store, x, z, maxR);
        if (i < 0) continue;
        const d = Math.hypot(store.cx[i] - x, store.cz[i] - z);
        if (d < bestD) {
          bestD = d;
          best = { x: store.cx[i], z: store.cz[i], r: store.r[i], id: store.seeds[i].p.id, state: store.state[i] };
        }
      }
      return best;
    },
    resetCounter() {
      rewards.reset();
    },
  };
  registerFloraTrainer(flora);
  return flora;
}
