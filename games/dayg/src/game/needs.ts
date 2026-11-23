// The player's four needs (warmth, water, food, calm). Rates are per sun-hour and live in tuning.json `player`.
import type { Tuning } from '../sim/types';
import type { ItemDef } from '../items/defs';
import type { Bus } from './bus';
import type { NeedDamage, Needs, NeedsEffects, NeedsEnv, NeedsSystem } from './types';

const DIRTY_WATER_FACTOR = 0.5;   // dirty water gives half as much
const CLEAN_LITRE = 60;           // 0.5 L = +30
const CRAMP_FOOD_LOSS = 10;

const clamp = (v: number): number => Math.min(100, Math.max(0, v));

// Small seeded generator (mulberry32) for the dirty-water cramp roll; separate from the sim's streams.
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stepNeeds(n: Needs, env: NeedsEnv, hours: number, t: Tuning): void {
  const p = t.player;
  const infectionStage = env.infectionStage;

  // water and food
  n.water -= (p.waterPerHour + env.exertion * p.exertionWaterPerHour) * hours;
  n.food -= (p.foodPerHour + env.exertion * p.exertionFoodPerHour) * hours;

  // warmth
  let warmthRate: number;
  if (env.tempC >= p.comfortTemp && env.wet === 0 && !env.night) {
    warmthRate = p.warmthRecoverPerHour;
  } else {
    warmthRate =
      Math.min(0, env.tempC - p.comfortTemp) * p.warmthPerDegreeHour +
      p.warmthWeatherPerHour[env.weather] +
      (env.night ? p.warmthNightPerHour : 0) +
      env.wet * p.warmthWetPerHour +
      (env.altitude > 15 ? p.warmthHighPerHour : 0);
  }
  if (env.nearFire) warmthRate += p.warmthFirePerHour;
  if (env.inHaven) warmthRate += p.warmthHavenPerHour;
  if (infectionStage !== null) warmthRate += t.infection.stageWarmthPerHour[infectionStage];
  n.warmth += warmthRate * hours;

  // calm
  let calmRate = 0;
  if (env.hatlessNear > 0) calmRate += p.calmHatlessPerHour * Math.min(3, env.hatlessNear) / 3;
  if (env.night && !env.inHaven) calmRate += p.calmNightOutsidePerHour;
  if (env.inHaven) calmRate += p.calmHavenPerHour;
  if (env.nearFire) calmRate += p.calmFirePerHour;
  if (!env.night && env.hatlessNear === 0) calmRate += p.calmDayPerHour;
  if (infectionStage !== null) calmRate += t.infection.stageCalmPerHour[infectionStage];
  n.calm += calmRate * hours;

  n.warmth = clamp(n.warmth);
  n.water = clamp(n.water);
  n.food = clamp(n.food);
  n.calm = clamp(n.calm);
}

export function needsEffects(n: Needs, t: Tuning): NeedsEffects {
  const p = t.player;
  const low = p.lowThreshold;
  const anyLow = n.warmth < low || n.water < low || n.food < low || n.calm < low;
  let speedMul = 1;
  if (anyLow) speedMul -= 0.15;
  if (n.food < low && n.water < low) speedMul -= 0.15;

  const damage: NeedDamage[] = [];
  if (n.warmth === 0) damage.push({ cause: 'cold', perHour: p.zeroWearPerHour.cold });
  if (n.water === 0) damage.push({ cause: 'thirst', perHour: p.zeroWearPerHour.thirst });
  if (n.food === 0) damage.push({ cause: 'hunger', perHour: p.zeroWearPerHour.hunger });

  return {
    speedMul,
    staminaRegenMul: n.warmth < low ? 0.5 : 1,
    aimShake: n.calm < low ? (low - n.calm) / low : 0,
    damage,
  };
}

export function createNeedsSystem(bus: Bus, t: Tuning): NeedsSystem {
  const state: Needs = { warmth: 80, water: 85, food: 75, calm: 70 };
  const rng = makeRng(0x6e656564);

  return {
    state,
    update(sunHours: number, env: NeedsEnv): void {
      stepNeeds(state, env, sunHours, t);
    },
    effects(): NeedsEffects {
      return needsEffects(state, t);
    },
    eat(def: ItemDef): void {
      state.food = clamp(state.food + (def.props?.food ?? 0));
      bus.emit('ate', { def: def.id });
    },
    drink(litres: number, clean: boolean): void {
      if (clean) {
        state.water = clamp(state.water + litres * CLEAN_LITRE);
      } else {
        state.water = clamp(state.water + litres * CLEAN_LITRE * DIRTY_WATER_FACTOR);
        if (rng() < t.player.dirtyWaterCrampChance) state.food = clamp(state.food - CRAMP_FOOD_LOSS);
      }
      bus.emit('drank', { clean, litres });
    },
  };
}
