// The DayG world: creation, the tick loop, and the shared helpers every sim system uses. Pure: no DOM, no Math.random, no Date.
import { getItem } from '../items/defs';
import { MAP } from '../world/blockout';
import { writeChronicle } from './chronicle';
import { stepGroups } from './groups';
import { stepBase } from './base';
import { seedHorde, stepHorde } from './horde';
import { dailyForage, initLoot } from './loot';
import { initMarket, stepMarket } from './market';
import { spawnNpcs, stepNpcs } from './npcs';
import { buildGraph } from './regions';
import { createStreams, hashString, type Rng, type Streams } from './rng';
import { TUNING } from './tuning';
import {
  DEATH_CAUSES, RESOURCES,
  type ContainerDef, type DailyRow, type DeathCause, type ItemStack, type Npc, type RegionId, type Resource, type Tuning, type WorldState,
} from './types';
import { stepWeather, initWeather } from './weather';

export function emptyResources(): Record<Resource, number> {
  const r = {} as Record<Resource, number>;
  for (const k of RESOURCES) r[k] = 0;
  return r;
}
function emptyDeaths(): Record<DeathCause, number> {
  const r = {} as Record<DeathCause, number>;
  for (const k of DEATH_CAUSES) r[k] = 0;
  return r;
}

export function dayOf(tick: number, t: Tuning): number { return Math.floor(tick / t.clock.ticksPerDay) + 1; }
export function hourOf(tick: number, t: Tuning): number { return ((tick % t.clock.ticksPerDay) * 24) / t.clock.ticksPerDay; }
export function endOfDay(w: WorldState): boolean { const tpd = w.tuning.clock.ticksPerDay; return w.tick % tpd === tpd - 1; }

export function createWorld(seed: number, tuning: Tuning = TUNING, containers: readonly ContainerDef[] = MAP.containers): { world: WorldState; streams: Streams } {
  const graph = buildGraph();
  const streams = createStreams(seed);
  const density = {} as Record<RegionId, number>;
  const noise = {} as Record<RegionId, number>;
  const loot = {} as Record<RegionId, Record<Resource, number>>;
  const forage = {} as Record<RegionId, number>;
  for (const r of graph.regions) { density[r.id] = 0; noise[r.id] = 0; loot[r.id] = emptyResources(); forage[r.id] = 0; }
  const history = {} as Record<Resource, number[]>;
  for (const r of RESOURCES) history[r] = [];
  const w: WorldState = {
    seed, tick: 0, tuning, graph,
    weather: { kind: 'clear', tempC: 10, wind: 0, windDir: 0, since: 0 },
    npcs: [], groups: [],
    horde: { density, herds: [], noise },
    loot, regionLootStart: {} as Record<RegionId, Record<Resource, number>>, forage,
    containers: {},
    market: { region: tuning.market.region, stock: emptyResources(), acorns: 0, price: emptyResources(), history },
    chronicle: [], events: [],
    ledger: {
      npcsStart: 0, deaths: emptyDeaths(),
      hatlessStart: 0, hatlessRisen: 0, hatlessCrumbled: 0, hatlessDestroyed: 0,
      lootStart: emptyResources(), regionLootStart: emptyResources(),
      foraged: emptyResources(), consumed: emptyResources(), removedByPlayer: emptyResources(),
      acornsStart: 0,
    },
    promoted: { region: null, hatless: 0 },
    daily: [],
    nextId: { group: 1, herd: 1 },
    flags: {},
    base: null,
  };
  initWeather(w, streams.weather);
  seedHorde(w, streams.horde);
  spawnNpcs(w, streams.npc);
  initLoot(w, streams.loot, containers);
  initMarket(w, streams.market);

  w.ledger.npcsStart = w.npcs.length;
  w.ledger.hatlessStart = hatlessTotal(w);
  w.ledger.lootStart = resourceTotals(w);
  const regionSum = emptyResources();
  for (const r of graph.regions) {
    const stock = w.loot[r.id];
    w.regionLootStart[r.id] = { ...stock };
    for (const k of RESOURCES) regionSum[k] += stock[k];
  }
  w.ledger.regionLootStart = regionSum;
  w.ledger.acornsStart = acornTotal(w);
  return { world: w, streams };
}

export function stepWorld(w: WorldState, s: Streams): void {
  w.events.length = 0;
  stepWeather(w, s.weather);
  stepHorde(w, s.horde);
  stepBase(w, s.base);
  stepNpcs(w, s.npc);
  stepGroups(w, s.groups);
  stepMarket(w, s.market);
  if (endOfDay(w)) { dailyForage(w, s.loot); recordDaily(w); }
  writeChronicle(w, s.chronicle);
  w.tick += 1;
}

export function runDays(w: WorldState, s: Streams, days: number): void {
  const n = days * w.tuning.clock.ticksPerDay;
  for (let i = 0; i < n; i++) stepWorld(w, s);
}

export function runWorld(seed: number, days: number, tuning?: Tuning): { world: WorldState; rows: DailyRow[] } {
  const { world, streams } = createWorld(seed, tuning);
  runDays(world, streams, days);
  return { world, rows: world.daily };
}

export function killNpc(w: WorldState, npc: Npc, cause: DeathCause, rng: Rng): void {
  if (!npc.alive) return;
  const region = npc.region;
  npc.alive = false;
  npc.diedTick = w.tick;
  npc.cause = cause;
  w.ledger.deaths[cause] += 1;
  // The body keeps nothing: what it carried is in the region's stock now (looted later; totals unchanged).
  const stock = w.loot[region];
  for (const k of RESOURCES) { stock[k] += npc.carried[k]; npc.carried[k] = 0; }
  // Leave the group.
  if (npc.groupId !== null) {
    const gi = w.groups.findIndex((g) => g.id === npc.groupId);
    if (gi !== -1) {
      const g = w.groups[gi];
      g.members = g.members.filter((id) => id !== npc.id);
      if (g.members.length < 2) {
        w.groups.splice(gi, 1);
        const last = g.members[0];
        if (last !== undefined) w.npcs[last].groupId = null;
        w.events.push({ kind: 'group-dissolved', group: g.id, region: g.region });
      } else if (g.leader === npc.id) {
        g.leader = g.members[0];
      }
    }
    npc.groupId = null;
  }
  // Rise as a Hatless.
  const mossy = w.graph.byId[region].traits.includes('MOSSY');
  const p = Math.min(1, w.tuning.horde.riseChance[cause] * (mossy ? 1.5 : 1));
  if (rng.chance(p)) {
    w.horde.density[region] += 1;
    w.ledger.hatlessRisen += 1;
    w.events.push({ kind: 'npc-rose', npc: npc.id, region });
  }
  w.events.push({ kind: 'npc-died', npc: npc.id, region, cause });
}

export function npcsIn(w: WorldState, r: RegionId): Npc[] {
  return w.npcs.filter((n) => n.alive && n.region === r);
}

/** Moves density[r] and the herds in r into w.promoted (held at L0 by the game); returns the count moved. */
export function promoteRegion(w: WorldState, r: RegionId): number {
  if (w.promoted.region !== null && w.promoted.region !== r) demoteRegion(w, w.promoted.hatless);
  let n = w.horde.density[r];
  w.horde.density[r] = 0;
  const kept = [];
  for (const h of w.horde.herds) { if (h.region === r) n += h.size; else kept.push(h); }
  w.horde.herds = kept;
  w.promoted = { region: r, hatless: (w.promoted.region === r ? w.promoted.hatless : 0) + n };
  return n;
}

/** New arrivals in the promoted region since the last call, moved into w.promoted; returns how many. */
export function absorbIntoPromoted(w: WorldState): number {
  const r = w.promoted.region;
  if (r === null) return 0;
  let n = w.horde.density[r];
  w.horde.density[r] = 0;
  const kept = [];
  for (const h of w.horde.herds) { if (h.region === r) n += h.size; else kept.push(h); }
  w.horde.herds = kept;
  w.promoted.hatless += n;
  return n;
}

export function demoteRegion(w: WorldState, alive: number): void {
  const r = w.promoted.region;
  if (r !== null) w.horde.density[r] += alive;
  w.promoted = { region: null, hatless: 0 };
}

export function recordHatlessDestroyed(w: WorldState): void {
  w.promoted.hatless -= 1;
  w.ledger.hatlessDestroyed += 1;
}

export function recordPlayerTake(w: WorldState, stack: ItemStack): void {
  w.ledger.removedByPlayer[getItem(stack.def).resource] += stack.count;
}

export function hatlessTotal(w: WorldState): number {
  let n = w.promoted.hatless;
  for (const r of w.graph.regions) n += w.horde.density[r.id] ?? 0;
  for (const h of w.horde.herds) n += h.size;
  return n;
}

export function resourceTotals(w: WorldState): Record<Resource, number> {
  const t = emptyResources();
  for (const r of w.graph.regions) { const s = w.loot[r.id]; for (const k of RESOURCES) t[k] += s[k]; }
  for (const id of Object.keys(w.containers)) {
    for (const st of w.containers[id].contents) t[getItem(st.def).resource] += st.count;
  }
  for (const n of w.npcs) for (const k of RESOURCES) t[k] += n.carried[k];
  for (const k of RESOURCES) t[k] += w.market.stock[k];
  return t;
}

export function acornTotal(w: WorldState): number {
  let n = w.market.acorns;
  for (const npc of w.npcs) n += npc.acorns;
  return n;
}

export function hashWorld(w: WorldState): string {
  const json = JSON.stringify({
    tick: w.tick, weather: w.weather, npcs: w.npcs, groups: w.groups, horde: w.horde,
    loot: w.loot, containers: w.containers, market: w.market,
  });
  return hashString(json).toString(16).padStart(8, '0');
}

export function recordDaily(w: WorldState): DailyRow {
  const alive = w.npcs.filter((n) => n.alive);
  const modes = { alone: 0, pack: 0, band: 0, settlement: 0 };
  const sizes = new Map<number, number>();
  for (const g of w.groups) sizes.set(g.id, g.members.filter((id) => w.npcs[id]?.alive).length);
  for (const n of alive) {
    const size = n.groupId === null ? 1 : (sizes.get(n.groupId) ?? 1);
    if (size <= 1) modes.alone += 1;
    else if (size <= 8) modes.pack += 1;
    else if (size <= 25) modes.band += 1;
    else modes.settlement += 1;
  }
  const lootLeft = emptyResources();
  for (const k of RESOURCES) {
    let sum = 0;
    for (const r of w.graph.regions) sum += w.loot[r.id][k];
    const start = w.ledger.regionLootStart[k];
    lootLeft[k] = start > 0 ? sum / start : 0;
  }
  const total = hatlessTotal(w);
  let sinks = 0;
  for (const r of w.graph.regions) {
    if (!r.traits.includes('NEST') && !r.traits.includes('PIT')) continue;
    sinks += w.horde.density[r.id] ?? 0;
    for (const h of w.horde.herds) if (h.region === r.id) sinks += h.size;
    if (w.promoted.region === r.id) sinks += w.promoted.hatless;
  }
  const row: DailyRow = {
    day: dayOf(w.tick, w.tuning), alive: alive.length, start: w.ledger.npcsStart,
    hatless: total, hatlessStart: w.ledger.hatlessStart,
    modes, lootLeft, prices: { ...w.market.price }, deaths: { ...w.ledger.deaths },
    hordeInSinks: total > 0 ? sinks / total : 0,
    chronicleLines: w.chronicle.length,
  };
  w.daily.push(row);
  return row;
}
