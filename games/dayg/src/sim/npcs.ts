// NPC gnomes as organisms: needs, utility decisions with a self-preservation filter, and the ways they die.
// Pure and deterministic: no DOM, no global randomness or clock. Every random number comes from the rng passed in.
import type { Rng } from './rng';
import { RESOURCES, type Npc, type NpcAction, type RegionId, type Resource, type WorldState } from './types';
import { groupOf, groupSafety } from './groups';
import { hatlessThreat, addNoise } from './horde';
import { takeLoot, forage } from './loot';
import { marketBuy, marketSell, priceOf } from './market';
import { isNight } from './weather';
import { makeName } from './names';
import { killNpc, npcsIn, hourOf, emptyResources } from './world';

const SELLABLE: readonly Resource[] = ['tools', 'materials', 'valuables'];

export function spawnNpcs(w: WorldState, rng: Rng): void {
  const t = w.tuning;
  for (const r of w.graph.regions) {
    const n = rng.int(r.startNpcs[0], r.startNpcs[1]);
    for (let i = 0; i < n; i++) {
      const id = w.npcs.length;
      const name = makeName(rng);
      const lookSeed = rng.int(0, 2 ** 31 - 1);
      const traits = {
        sociability: rng.next(), boldness: rng.next(), greed: rng.next(),
        loyalty: rng.next(), paranoia: rng.next(), industry: rng.next(),
      };
      const needs = { food: rng.int(70, 100), water: rng.int(70, 100), warmth: rng.int(70, 100), calm: rng.int(70, 100) };
      const carried = emptyResources();
      carried.food = rng.int(t.npc.carriedFoodStart[0], t.npc.carriedFoodStart[1]);
      const acorns = rng.int(t.npc.acornsStart[0], t.npc.acornsStart[1]);
      const npc: Npc = {
        id, name, lookSeed, region: r.id, alive: true,
        traits, needs, carried, acorns, groupId: null,
        plan: { action: 'rest', target: null, since: w.tick },
        infectedAt: null, zeroFoodTicks: 0, zeroWaterTicks: 0,
        bornTick: w.tick, diedTick: null, cause: null,
      };
      w.npcs.push(npc);
    }
  }
}

interface Candidate { action: NpcAction; target: RegionId | null; region: RegionId; score: number; risk: number; res?: Resource }

const clamp = (x: number): number => (x < 0 ? 0 : x > 100 ? 100 : x);

function hasTrait(w: WorldState, r: RegionId, trait: 'HIGH' | 'HAVEN'): boolean {
  return w.graph.byId[r].traits.includes(trait);
}

function carriedTotal(npc: Npc): number {
  let n = 0;
  for (const k of RESOURCES) n += npc.carried[k];
  return n;
}

function lootShare(w: WorldState, r: RegionId): number {
  let have = 0;
  let start = 0;
  const stock = w.loot[r];
  const s0 = w.regionLootStart[r];
  for (const k of RESOURCES) { have += stock[k]; start += s0 ? s0[k] : 0; }
  return have / Math.max(1, start);
}

function canUse(npc: Npc, climb: boolean): boolean { return !climb || npc.traits.boldness > 0.5; }

/** First step on the cheapest path (Dijkstra, index order on ties) to a region matching `goal`; null if none reachable. */
function stepToward(w: WorldState, npc: Npc, goal: (r: RegionId) => boolean, allowAllClimbs: boolean): RegionId | null {
  const dist = new Map<RegionId, number>();
  const first = new Map<RegionId, RegionId>();
  const done = new Set<RegionId>();
  dist.set(npc.region, 0);
  for (;;) {
    let best: RegionId | null = null;
    let bd = Infinity;
    for (const r of w.graph.regions) {
      const d = dist.get(r.id);
      if (d !== undefined && !done.has(r.id) && d < bd) { bd = d; best = r.id; }
    }
    if (best === null) return null;
    if (best !== npc.region && goal(best)) return first.get(best) ?? null;
    done.add(best);
    for (const nb of w.graph.neighbours[best]) {
      if (!allowAllClimbs && !canUse(npc, nb.climb)) continue;
      const nd = bd + nb.cost;
      const od = dist.get(nb.to);
      if (od === undefined || nd < od) {
        dist.set(nb.to, nd);
        first.set(nb.to, best === npc.region ? nb.to : (first.get(best) as RegionId));
      }
    }
  }
}

function riskOf(w: WorldState, npc: Npc, action: NpcAction, region: RegionId, night: boolean, safety: number): number {
  const n = w.tuning.npc;
  const nightMul = night && !hasTrait(w, region, 'HIGH') && !hasTrait(w, region, 'HAVEN') ? n.nightRisk : 1;
  return n.hatlessKill * hatlessThreat(w, region) * n.exposure[action] * nightMul * (1 - safety);
}

function scavengeResource(w: WorldState, npc: Npc): Resource | null {
  if (npc.carried.food < 3) return 'food';
  const stock = w.loot[npc.region];
  for (const k of RESOURCES) if (k !== 'food' && npc.carried[k] === 0 && stock[k] > 0) return k;
  return null;
}

function decide(w: WorldState, npc: Npc, night: boolean): Candidate {
  const n = w.tuning.npc;
  const tr = npc.traits;
  const here = npc.region;
  const safety = groupSafety(w, npc);
  const threatHere = hatlessThreat(w, here);
  const foodUrg = (100 - npc.needs.food) / 100;
  const room = n.carryMax - carriedTotal(npc);
  const cands: Candidate[] = [];
  const add = (action: NpcAction, target: RegionId | null, region: RegionId, base: number, res?: Resource): void => {
    const risk = riskOf(w, npc, action, region, night, safety);
    cands.push({ action, target, region, score: base - risk * 1000 * (1 - tr.boldness), risk, res });
  };

  // Drink, or travel toward the nearest water.
  if (npc.needs.water < 40) {
    const urg = (100 - npc.needs.water) / 100;
    if (w.graph.byId[here].water !== null) add('drink', null, here, urg * 1.5);
    else {
      const isWater = (r: RegionId): boolean => w.graph.byId[r].water !== null;
      const to = stepToward(w, npc, isWater, false) ?? stepToward(w, npc, isWater, true);
      if (to !== null) add('travel', to, to, urg * 1.5);
    }
  }
  // Forage.
  if (room > 0) {
    const relief = (w.forage[here] ?? 0) > 0 ? 1 : 0.1;
    add('forage', null, here, relief * (0.2 + foodUrg) + tr.industry * 0.3);
  }
  // Scavenge.
  const res = scavengeResource(w, npc);
  if (res !== null && room > 0) {
    const relief = w.loot[here][res] > 0 ? 1 : 0.05;
    const urg = res === 'food' ? 0.2 + foodUrg : 0.3;
    add('scavenge', null, here, relief * urg + tr.greed * 0.3, res);
  }
  // Travel to the neighbour with the best expected loot.
  let bestTo: RegionId | null = null;
  let bestVal = -Infinity;
  for (const nb of w.graph.neighbours[here]) {
    if (!canUse(npc, nb.climb)) continue;
    const v = lootShare(w, nb.to) - hatlessThreat(w, nb.to);
    if (v > bestVal) { bestVal = v; bestTo = nb.to; }
  }
  if (bestTo !== null) {
    add('travel', bestTo, bestTo, bestVal - lootShare(w, here) + hatlessThreat(w, here) + n.travelBias * tr.boldness);
  }
  // Hide.
  if (threatHere > 1) {
    const base = (threatHere - 1) + tr.paranoia * 0.3;
    if (hasTrait(w, here, 'HIGH') || hasTrait(w, here, 'HAVEN')) add('hide', null, here, base);
    else {
      for (const nb of w.graph.neighbours[here]) {
        if (!canUse(npc, nb.climb)) continue;
        if (hasTrait(w, nb.to, 'HIGH') || hasTrait(w, nb.to, 'HAVEN')) { add('hide', nb.to, nb.to, base); break; }
      }
    }
  }
  // Trade.
  if (here === w.market.region) {
    let s = 0;
    if (npc.carried.food === 0 && npc.acorns >= priceOf(w, 'food')) s = Math.max(s, 0.5 + foodUrg);
    for (const k of SELLABLE) if (npc.carried[k] > 2) s = Math.max(s, 0.3 + tr.greed * 0.2);
    if (s > 0) add('trade', null, here, s);
  }
  // Rest.
  add('rest', null, here, night ? 0.6 : 0.05);

  const limit = n.riskLimitBase + n.riskLimitBoldness * tr.boldness;
  let pick: Candidate | null = null;
  for (const c of cands) if (c.risk <= limit && (pick === null || c.score > pick.score)) pick = c;
  if (pick === null) { // nothing is safe enough: take the least risky option
    for (const c of cands) if (pick === null || c.risk < pick.risk) pick = c;
  }
  return pick as Candidate;
}

function doForage(w: WorldState, npc: Npc, rng: Rng): void {
  const room = w.tuning.npc.carryMax - carriedTotal(npc);
  if (room <= 0) return;
  npc.carried.food += forage(w, npc.region, Math.min(w.tuning.npc.forageTake, room), rng);
}

function doScavenge(w: WorldState, npc: Npc, res: Resource | null, rng: Rng): boolean {
  if (res === null) return false;
  const room = w.tuning.npc.carryMax - carriedTotal(npc);
  const want = Math.min(room, rng.round(w.tuning.npc.scavengePerTick));
  if (want <= 0) return true; // the search itself still made noise
  npc.carried[res] += takeLoot(w, npc.region, res, want, rng);
  return true;
}

function setPlan(w: WorldState, npc: Npc, action: NpcAction, target: RegionId | null): void {
  if (npc.plan.action !== action || npc.plan.target !== target) npc.plan = { action, target, since: w.tick };
}

export function stepNpcs(w: WorldState, rng: Rng): void {
  const t = w.tuning;
  const n = t.npc;
  const tpd = t.clock.ticksPerDay;
  const hoursPerTick = 24 / tpd;
  const night = isNight(hourOf(w.tick, t), t);
  const coldWeather = w.weather.tempC < 5 || w.weather.kind === 'storm' || w.weather.kind === 'frost';

  for (let i = 0; i < w.npcs.length; i++) {
    const npc = w.npcs[i];
    if (!npc.alive) continue;
    const needs = npc.needs;

    // 1. Needs.
    needs.food = clamp(needs.food - n.foodPerDay / tpd);
    needs.water = clamp(needs.water - n.waterPerDay / tpd);
    const warmthRate = n.warmthPerDayCold / tpd;
    if (coldWeather && !hasTrait(w, npc.region, 'HAVEN')) needs.warmth = clamp(needs.warmth - warmthRate);
    else needs.warmth = clamp(needs.warmth + warmthRate);
    if (hatlessThreat(w, npc.region) > 1.5) needs.calm = clamp(needs.calm - warmthRate);
    else needs.calm = clamp(needs.calm + warmthRate);

    // 2. Eat and drink.
    if (needs.food < n.eatBelow && npc.carried.food >= 1) {
      npc.carried.food -= 1;
      w.ledger.consumed.food += 1;
      needs.food = clamp(needs.food + n.mealValue);
    }
    if (needs.water < n.drinkBelow) {
      if (w.graph.byId[npc.region].water !== null) needs.water = clamp(needs.water + n.drinkValue);
      else if (npc.carried.water >= 1) {
        npc.carried.water -= 1;
        w.ledger.consumed.water += 1;
        needs.water = clamp(needs.water + n.drinkValue);
      }
    }
    npc.zeroFoodTicks = needs.food > 0 ? 0 : npc.zeroFoodTicks + 1;
    npc.zeroWaterTicks = needs.water > 0 ? 0 : npc.zeroWaterTicks + 1;

    // 3./4. Decide (alone or leader) or follow (member), then act.
    const group = groupOf(w, npc);
    const isMember = group !== null && group.leader !== npc.id;
    let risk: number;
    let noisy = false;
    if (isMember) {
      const res = scavengeResource(w, npc);
      const useForage = res === null || ((w.forage[npc.region] ?? 0) > 0 && npc.traits.industry >= 0.5);
      const action: NpcAction = useForage ? 'forage' : 'scavenge';
      risk = riskOf(w, npc, action, npc.region, night, groupSafety(w, npc));
      setPlan(w, npc, action, null);
      if (useForage) doForage(w, npc, rng);
      else noisy = doScavenge(w, npc, res, rng);
    } else {
      const c = decide(w, npc, night);
      risk = c.risk;
      setPlan(w, npc, c.action, c.target);
      switch (c.action) {
        case 'drink':
          if (w.graph.byId[npc.region].water !== null) needs.water = clamp(needs.water + n.drinkValue);
          break;
        case 'forage': doForage(w, npc, rng); break;
        case 'scavenge': noisy = doScavenge(w, npc, c.res ?? null, rng); break;
        case 'travel': case 'hide': case 'flee':
          if (c.target !== null) npc.region = c.target;
          break;
        case 'trade':
          if (npc.carried.food === 0 && npc.acorns >= priceOf(w, 'food')) marketBuy(w, npc, 'food', 1);
          for (const k of SELLABLE) if (npc.carried[k] > 2) marketSell(w, npc, k, npc.carried[k] - 2);
          break;
        default: break;
      }
    }

    // 5. Dangers.
    if (rng.chance(risk)) { killNpc(w, npc, 'hatless', rng); continue; }
    if (npc.zeroFoodTicks > n.starveDays * tpd) { killNpc(w, npc, 'hunger', rng); continue; }
    if (npc.zeroWaterTicks > n.thirstDays * tpd) { killNpc(w, npc, 'thirst', rng); continue; }
    if (needs.warmth === 0 && rng.chance(n.coldKill)) { killNpc(w, npc, 'cold', rng); continue; }
    if (hasTrait(w, npc.region, 'HIGH') && rng.chance(n.fallKill)) { killNpc(w, npc, 'fall', rng); continue; }
    if (needs.food < 20 && npc.traits.greed > 0.7) {
      const others = npcsIn(w, npc.region).filter((o) => o.id !== npc.id);
      if (others.length > 0 && rng.chance(n.fightChance)) {
        const victim = rng.pick(others);
        const half = Math.floor(victim.carried.food / 2);
        victim.carried.food -= half;
        npc.carried.food += half;
        killNpc(w, victim, 'gnome', rng);
        noisy = true;
      }
    }
    // Moss.
    if (npc.infectedAt === null && rng.chance(n.scratchChance * hatlessThreat(w, npc.region))) {
      npc.infectedAt = w.tick;
      w.events.push({ kind: 'npc-infected', npc: npc.id, region: npc.region });
    }
    if (npc.infectedAt !== null) {
      const hours = (w.tick - npc.infectedAt) * hoursPerTick;
      if (hasTrait(w, npc.region, 'HAVEN') && npc.carried.medicine >= 1 && hours < t.infection.stage1Hours) {
        npc.carried.medicine -= 1;
        w.ledger.consumed.medicine += 1;
        if (rng.chance(n.cureChance)) {
          npc.infectedAt = null;
          w.events.push({ kind: 'npc-cured', npc: npc.id, region: npc.region });
        }
      }
      if (npc.infectedAt !== null && hours >= t.infection.turnHours) {
        if (noisy) addNoise(w, npc.region, 1);
        killNpc(w, npc, 'moss', rng);
        continue;
      }
    }

    // 6. Noise.
    if (noisy) addNoise(w, npc.region, 1);
  }

  // Group members end the tick where their leader is.
  for (let i = 0; i < w.npcs.length; i++) {
    const npc = w.npcs[i];
    if (!npc.alive) continue;
    const g = groupOf(w, npc);
    if (g === null || g.leader === npc.id) continue;
    const leader = w.npcs[g.leader];
    if (leader && leader.alive) npc.region = leader.region;
  }
}
