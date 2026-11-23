// Garden beds and crops (crafting.md, world.md). Beds grow by world-day, with water, weeding, seasons and trampling.
import type { Bed, CropId, ItemId, ItemStack, WorldState } from './types';
import { getItem } from '../items/defs';
import type { Rng } from './rng';
import { bubbleIn } from './bubbles';
import { damagePiece } from './build';
import { hatlessInRegion } from './horde';
import { seasonOf } from './weather';
import { dayOf, endOfDay } from './world';

const BED_WATER_MAX = 3;
const TRAMPLE_DAMAGE = 10;
const CROP_ITEM: Record<CropId, ItemId> = {
  clover: 'seed-cake', toadstool: 'red-mushroom', grain: 'grain-sheaf', berries: 'blackberry', roses: 'petal-bundle', 'acorn-tree': 'acorn',
};

function standing(w: WorldState, piece: number): boolean { return (w.pieces[piece]?.hp ?? 0) > 0; }

export function plantBed(w: WorldState, bed: number, crop: CropId): boolean {
  const b = w.beds[bed];
  if (!b || b.crop !== null || !standing(w, b.piece)) return false;
  const season = seasonOf(dayOf(w.tick, w.tuning), w.tuningBase);
  if (!w.tuning.farm.crops[crop].seasons.includes(season)) return false;
  b.crop = crop;
  b.plantedTick = w.tick;
  b.ready = false;
  b.picks = 0;
  return true;
}

export function waterBed(w: WorldState, bed: number, litres: number): void {
  const b = w.beds[bed];
  if (b) b.water = Math.min(BED_WATER_MAX, b.water + litres);
}

export function tendBed(w: WorldState, bed: number): void {
  const b = w.beds[bed];
  if (b) b.tendedTick = w.tick;
}

export function harvestBed(w: WorldState, bed: number): ItemStack[] {
  const b: Bed | undefined = w.beds[bed];
  if (!b || b.crop === null || !b.ready) return [];
  const f = w.tuning.farm;
  const c = f.crops[b.crop];
  const tpd = w.tuning.clock.ticksPerDay;
  const dry = w.flags[`bed:${bed}:dry`] === true;
  const weedy = w.tick - b.tendedTick >= f.weedsDays * tpd;
  const n = Math.round(c.yield * (dry ? f.unwateredMul : 1) * (weedy ? f.weedsMul : 1));
  const def = CROP_ITEM[b.crop];
  const count = b.crop === 'berries' ? n * 2 : n;
  const out: ItemStack[] = [];
  let food = 0;
  if (count > 0) {
    out.push({ def, count, condition: 1 });
    const res = getItem(def).resource;
    w.ledger.farmed[res] += count;
    w.ledger.removedByPlayer[res] += count;
    if (res === 'food') food = count;
  }
  if (c.repeatDays > 0) {
    b.plantedTick = w.tick - (c.days - c.repeatDays) * tpd;
  } else {
    b.crop = null;
    b.plantedTick = 0;
  }
  b.ready = false;
  w.events.push({ kind: 'harvest', bed, food });
  return out;
}

export function stepFarms(w: WorldState, rng: Rng): void {
  if (!endOfDay(w)) return;
  const f = w.tuning.farm;
  const tpd = w.tuning.clock.ticksPerDay;
  for (let i = 0; i < w.beds.length; i++) {
    const b = w.beds[i];
    if (b.crop === null || !standing(w, b.piece)) continue;
    const left = b.water - f.waterPerDay;
    if (left < 0) {
      w.flags[`bed:${i}:dry`] = true;
      b.water = 0;
    } else {
      b.water = left;
      delete w.flags[`bed:${i}:dry`];
    }
    if (!b.ready && (w.tick - b.plantedTick) / tpd >= f.crops[b.crop].days) b.ready = true;
    const region = w.pieces[b.piece].region;
    if (bubbleIn(w, region) !== null) continue;   // L0 bubbles are simulated by the game
    const H = hatlessInRegion(w, region);
    if (rng.chance((f.trampleK * H) / 10)) {
      b.crop = null;
      b.ready = false;
      damagePiece(w, b.piece, TRAMPLE_DAMAGE);
    }
  }
}

export function bedOf(w: WorldState, piece: number): Bed | null {
  return w.beds.find((b) => b.piece === piece) ?? null;
}
