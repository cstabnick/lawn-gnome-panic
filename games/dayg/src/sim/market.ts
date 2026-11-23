// The Truce of the Tap's market: prices follow stock against a target and drift back; NPCs trade with acorns.
// Pure sim code; randomness only from the rng stream. Goods and acorns are only moved, never created.
import type { Rng } from './rng';
import { RESOURCES, type Npc, type Resource, type WorldState } from './types';
import { dayOf, endOfDay } from './world';

export function initMarket(w: WorldState, _rng: Rng): void {
  const t = w.tuning.market;
  const history = {} as Record<Resource, number[]>;
  for (const r of RESOURCES) history[r] = [];
  w.market = { region: t.region, stock: { ...t.startStock }, acorns: t.acorns, price: { ...t.base }, history };
}

/** The price the stock alone implies: base x (target / (stock + 1))^elasticity, clamped. */
function formulaPrice(w: WorldState, res: Resource): number {
  const t = w.tuning.market;
  const base = t.base[res];
  const f = base * Math.pow(t.target[res] / (w.market.stock[res] + 1), t.elasticity[res]);
  return Math.min(t.clampHi * base, Math.max(t.clampLo * base, f));
}

export function stepMarket(w: WorldState, _rng: Rng): void {
  const t = w.tuning.market;
  const m = w.market;
  for (const res of RESOURCES) m.price[res] += (formulaPrice(w, res) - m.price[res]) * t.drift;
  if (!endOfDay(w)) return;
  const seasonIndex = Math.floor((dayOf(w.tick, w.tuning) - 1) / w.tuning.clock.daysPerSeason);
  for (const res of RESOURCES) {
    const price = m.price[res];
    m.history[res].push(price);
    const base = t.base[res];
    const flag = `price-spike:${res}:${seasonIndex}`;
    if (price > 2 * base && !w.flags[flag]) {
      w.flags[flag] = true;
      w.events.push({ kind: 'price-spike', resource: res, price, ratio: price / base });
    }
  }
}

/** Current buy price, tax included. */
export function priceOf(w: WorldState, res: Resource): number {
  return w.market.price[res] * (1 + w.tuning.market.tax);
}

export function marketBuy(w: WorldState, npc: Npc, res: Resource, units: number): number {
  const m = w.market;
  if (npc.region !== m.region || units <= 0) return 0;
  const cost = Math.max(1, Math.ceil(priceOf(w, res)));
  const n = Math.max(0, Math.min(Math.floor(units), m.stock[res], Math.floor(npc.acorns / cost)));
  if (n === 0) return 0;
  m.stock[res] -= n;
  npc.carried[res] += n;
  npc.acorns -= n * cost;
  m.acorns += n * cost;
  return n;
}

export function marketSell(w: WorldState, npc: Npc, res: Resource, units: number): number {
  const m = w.market;
  if (npc.region !== m.region || units <= 0) return 0;
  const pay = Math.max(0, Math.floor(m.price[res] * (1 - w.tuning.market.tax)));
  let n = Math.max(0, Math.min(Math.floor(units), npc.carried[res]));
  if (pay > 0) n = Math.min(n, Math.floor(m.acorns / pay));
  if (n === 0) return 0;
  npc.carried[res] -= n;
  m.stock[res] += n;
  m.acorns -= n * pay;
  npc.acorns += n * pay;
  return n;
}
