// Factions and power (society.md "Factions and power", havens.md). Pure: no DOM, no Math.random, no Date.
import { defenceOf } from './build';
import { formatDate } from './chronicle';
import { HAVEN_NAME, HAVEN_REGION } from './regions';
import { adjustTrust, standingOf, subjectOfPlayer } from './social';
import { hashString, type Rng } from './rng';
import { killNpc } from './world';
import {
  HAVENS, RANKS, RESOURCES,
  type DailyRow, type Faction, type FactionId, type FactionPlan, type FounderId, type Group, type HavenId, type Norms,
  type Npc, type NpcId, type NpcTraits, type PlayerKey, type Rank, type RegionId, type Resource, type WorldState,
} from './types';

export interface FounderDef { id: FounderId; name: string; faction: string; hat: number; home: RegionId; fallback: RegionId; traits: Partial<NpcTraits>; norms: Norms }
export const FOUNDERS: readonly FounderDef[] = [
  { id: 'yarrow-gravelpot', name: 'Sexton Yarrow Gravelpot', faction: 'the Lantern Keepers', hat: 0xd9a441, home: 'niches-high', fallback: 'angel-square',
    traits: { sociability: 0.9, paranoia: 0.2, industry: 0.9, loyalty: 0.8 },
    norms: { sharing: 'tithe', strangers: 'question', bitten: 'nurse', leadership: 'council', violence: 'never-first' } },
  { id: 'nettle-rustspade', name: 'Nettle Rustspade', faction: 'the Rusted Spades', hat: 0x8b3a2b, home: 'the-yews', fallback: 'yew-edge',
    traits: { boldness: 0.95, greed: 0.9, industry: 0.1, loyalty: 0.4 },
    norms: { sharing: 'own', strangers: 'rob', bitten: 'shatter', leadership: 'strongest', violence: 'outsiders' } },
  { id: 'comfrey-kilnworth', name: 'Old Mother Comfrey Kilnworth', faction: 'the Kiln Sisters', hat: 0xe8e2d0, home: 'the-nave', fallback: 'masons-corner',
    traits: { sociability: 0.8, greed: 0.1, paranoia: 0.2 },
    norms: { sharing: 'all', strangers: 'welcome', bitten: 'nurse', leadership: 'council', violence: 'never-first' } },
  { id: 'thistle-stonewort', name: 'Thistle Stonewort', faction: 'the Crypt Holders', hat: 0x4b4f6b, home: 'crypt-row', fallback: 'child-graves',
    traits: { paranoia: 0.9, greed: 0.8, sociability: 0.4 },
    norms: { sharing: 'tithe', strangers: 'turn-away', bitten: 'cast-out', leadership: 'founder-line', violence: 'raiders-only' } },
  { id: 'lichen-ashbucket', name: 'Lichen Ashbucket', faction: 'the Greybearded', hat: 0x7d8b6a, home: 'wormways', fallback: 'the-sinks',
    traits: { boldness: 0.7, paranoia: 0.3, sociability: 0.6 },
    norms: { sharing: 'all', strangers: 'question', bitten: 'nurse', leadership: 'founder-line', violence: 'never-first' } },
];

const TRUCE_NORMS: Norms = { sharing: 'tithe', strangers: 'welcome', bitten: 'cast-out', leadership: 'council', violence: 'never-first' };
const WILLOW_NORMS: Norms = { sharing: 'all', strangers: 'question', bitten: 'nurse', leadership: 'council', violence: 'never-first' };
const SHELF_NORMS: Norms = { sharing: 'tithe', strangers: 'question', bitten: 'cast-out', leadership: 'council', violence: 'raiders-only' };

interface SeedDef { name: string; founder: FounderId | null; home: RegionId; hat: number; norms: Norms; leaderName?: string; traits?: Partial<NpcTraits> }

function zeroStock(): Record<Resource, number> {
  const r = {} as Record<Resource, number>;
  for (const k of RESOURCES) r[k] = 0;
  return r;
}
function note(w: WorldState, sentence: string): void {
  w.chronicle.push({ tick: w.tick, text: `${formatDate(w.tick, w.tuning)}. ${sentence}` });
}
function regionName(w: WorldState, r: RegionId): string { return w.graph.byId[r]?.name ?? r; }
function surnameOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
}
function alive(f: Faction): boolean { return f.diedTick === null; }
function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }

/** Ungrouped alive NPCs: the home region first, then each neighbour in graph order; ascending id within each. */
function ungroupedAround(w: WorldState, home: RegionId): Npc[] {
  const out: Npc[] = [];
  const take = (r: RegionId): void => {
    for (const n of w.npcs) if (n.alive && n.groupId === null && n.region === r) out.push(n);
  };
  take(home);
  for (const nb of w.graph.neighbours[home] ?? []) take(nb.to);
  return out;
}

/** Best by score; ties go to the lowest id (ids is ascending). */
function pickBest(ids: readonly NpcId[], score: (id: NpcId) => number): NpcId {
  let best = ids[0];
  for (const id of ids) if (score(id) > score(best)) best = id;
  return best;
}

/** Acorns above 0 in a new store: storeShare of each member's acorns, rounded down. */
function moveAcornsToStore(w: WorldState, members: readonly Npc[]): number {
  let acorns = 0;
  for (const n of members) {
    const m = Math.floor(n.acorns * w.tuning.factions.storeShare);
    n.acorns -= m;
    acorns += m;
  }
  return acorns;
}

/** Seeds a faction on a fresh group at `home`, or returns null when no ungrouped NPC is near. */
function seedFaction(w: WorldState, d: SeedDef): Faction | null {
  const pool = ungroupedAround(w, d.home);
  if (pool.length === 0) return null;
  const leader = pool[0];
  if (d.leaderName !== undefined) leader.name = d.leaderName;
  if (d.traits) Object.assign(leader.traits, d.traits);
  const picked = pool.slice(0, 9);
  const ids = picked.map((n) => n.id).sort((a, b) => a - b);
  const groupId = w.nextId.group++;
  const group: Group = { id: groupId, name: d.name, members: ids, leader: leader.id, region: d.home, formedTick: 0 };
  for (const id of ids) w.npcs[id].groupId = groupId;
  w.groups.push(group);
  const id = w.nextId.faction++;
  const f: Faction = {
    id, name: d.name, founder: d.founder, hat: d.hat, home: d.home, leader: leader.id, groups: [groupId], norms: { ...d.norms },
    power: 0, morale: 0.7, stock: zeroStock(), acorns: moveAcornsToStore(w, picked),
    havens: [], territory: [d.home], allies: [], enemies: [], plan: 'hold', planTarget: null, planSince: 0,
    formedTick: 0, diedTick: null, ranks: {}, done: {}, leaders: [{ npc: leader.id, from: 0 }],
  };
  w.factions.push(f);
  w.groupFaction[String(groupId)] = id;
  return f;
}

/** A faction from an existing group (a new group on its own, or a schism). The group keeps its members. */
function factionFromGroup(w: WorldState, g: Group): Faction {
  const leader = w.npcs[g.leader];
  const b = leader.traits.boldness;
  const gr = leader.traits.greed;
  const norms: Norms = {
    sharing: gr > 0.6 ? 'own' : 'tithe',
    strangers: leader.traits.paranoia > 0.6 ? 'turn-away' : 'question',
    bitten: 'nurse', leadership: 'council', violence: 'never-first',
  };
  if (b > 0.7 && gr > 0.6) { norms.strangers = 'rob'; norms.violence = 'outsiders'; norms.leadership = 'strongest'; }
  const name = `the ${surnameOf(leader.name)}s`;
  const members = g.members.map((id) => w.npcs[id]).filter((n) => n.alive);
  const id = w.nextId.faction++;
  const f: Faction = {
    id, name, founder: null, hat: hashString(name) & 0xffffff, home: g.region, leader: g.leader, groups: [g.id], norms,
    power: 0, morale: 0.7, stock: zeroStock(), acorns: moveAcornsToStore(w, members),
    havens: [], territory: [g.region], allies: [], enemies: [], plan: 'hold', planTarget: null, planSince: w.tick,
    formedTick: w.tick, diedTick: null, ranks: {}, done: {}, leaders: [{ npc: g.leader, from: w.tick }],
  };
  w.factions.push(f);
  w.groupFaction[String(g.id)] = id;
  w.events.push({ kind: 'faction-formed', faction: id, region: g.region });
  return f;
}

export function seedFactions(w: WorldState, rng: Rng): void {
  const t = w.tuning.factions;
  const pool = [...FOUNDERS];
  const n = rng.int(t.founders[0], t.founders[1]);
  for (let i = 0; i < n && pool.length > 0; i++) {
    const def = rng.pick(pool);
    pool.splice(pool.indexOf(def), 1);
    const home = def.home in w.graph.byId ? def.home : def.fallback;
    const f = seedFaction(w, { name: def.faction, founder: def.id, home, hat: def.hat, norms: def.norms, leaderName: def.name, traits: def.traits });
    if (f) w.events.push({ kind: 'faction-formed', faction: f.id, region: f.home });
  }
  const seeds: SeedDef[] = [{ name: 'the Truce of the Tap', founder: null, home: 'the-tap', hat: 0x5b7a8c, norms: TRUCE_NORMS }];
  if (w.map === 'full') {
    seeds.push({ name: 'the Willow Folk', founder: null, home: 'the-willow', hat: 0x6f8f5a, norms: WILLOW_NORMS });
    seeds.push({ name: 'the Shelf Wrights', founder: null, home: 'the-shelves', hat: 0xb5523b, norms: SHELF_NORMS });
  }
  for (const s of seeds) {
    const f = seedFaction(w, s);
    if (f) w.events.push({ kind: 'faction-formed', faction: f.id, region: f.home });
  }
  // Havens: each one whose region is a faction's home goes to it; the Waystation to a random seeded faction.
  for (const h of HAVENS) {
    if (h === 'waystation') continue;
    const owner = w.factions.find((f) => alive(f) && f.home === HAVEN_REGION[h]);
    if (owner) owner.havens.push(h);
  }
  const seeded = w.factions.filter(alive);
  if (seeded.length > 0) rng.pick(seeded).havens.push('waystation');
}

/** Members: alive NPCs in any of the faction's groups, ascending id. */
export function membersOf(w: WorldState, f: Faction): NpcId[] {
  const out: NpcId[] = [];
  for (const n of w.npcs) if (n.alive && n.groupId !== null && f.groups.includes(n.groupId)) out.push(n.id);
  return out;
}

export function factionOf(w: WorldState, npc: Npc): Faction | null {
  if (npc.groupId === null) return null;
  const fid = w.groupFaction[String(npc.groupId)];
  if (fid === undefined) return null;
  const f = w.factions[fid];
  return f && alive(f) ? f : null;
}

function repOf(w: WorldState, f: Faction): number {
  const online = Object.keys(w.players).sort().map((k) => w.players[k]).filter((p) => p.online);
  if (online.length === 0) return 0.5;
  let sum = 0;
  for (const p of online) sum += standingOf(w, f.id, p.key);
  return 0.5 + 0.5 * (sum / online.length / 100);
}

export function powerOf(w: WorldState, f: Faction): number {
  const t = w.tuning.factions;
  const members = membersOf(w, f);
  const n = members.length;
  if (n === 0) return 0;
  let tools = f.stock.tools;
  let food = f.stock.food;
  for (const id of members) { tools += w.npcs[id].carried.tools; food += w.npcs[id].carried.food; }
  const arms = 1 + tools / n;
  const walls = 1 + defenceOf(w, f.home) * w.tuning.build.wallsWeight;
  const stockpileDays = food / n;
  return Math.pow(n, t.membersExp) * arms * walls * (1 + Math.log(1 + stockpileDays / 30)) * f.morale * repOf(w, f);
}

export function havenHolder(w: WorldState, h: HavenId): FactionId | null {
  return w.factions.find((f) => alive(f) && f.havens.includes(h))?.id ?? null;
}

function fall(w: WorldState, f: Faction): void {
  f.diedTick = w.tick;
  f.havens = [];
  f.power = 0;
  f.plan = 'collapse';
  f.planTarget = null;
  f.planSince = w.tick;
  w.events.push({ kind: 'faction-fell', faction: f.id, region: f.home });
  note(w, `${f.name} fell at ${regionName(w, f.home)}.`);
}

function changeLeader(w: WorldState, f: Faction, members: readonly NpcId[]): void {
  const at = (id: NpcId): Npc => w.npcs[id];
  let next: NpcId;
  if (f.norms.leadership === 'strongest') {
    next = pickBest(members, (id) => at(id).traits.boldness);
  } else if (f.norms.leadership === 'council') {
    next = pickBest(members, (id) => at(id).traits.sociability + at(id).traits.loyalty);
  } else {
    const first = members.filter((id) => at(id).groupId === f.groups[0]);
    const pool = first.length > 0 ? first : [...members];
    next = pickBest(pool, (id) => -at(id).bornTick);
  }
  f.leader = next;
  f.leaders.push({ npc: next, from: w.tick });
  w.events.push({ kind: 'leader-changed', faction: f.id, leader: next });
  note(w, `${at(next).name} took over ${f.name}.`);
}

/** Members put a share of what they carry above 2 per resource (and of their acorns) into the store. */
function payIntoStore(w: WorldState, f: Faction, members: readonly NpcId[]): void {
  const s = w.tuning.factions.storeShare;
  const share = f.norms.sharing === 'own' ? 0 : f.norms.sharing === 'all' ? Math.min(1, 2 * s) : s;
  if (share <= 0) return;
  for (const id of members) {
    const n = w.npcs[id];
    for (const k of RESOURCES) {
      const amt = Math.floor(Math.max(0, n.carried[k] - 2) * share);
      n.carried[k] -= amt;
      f.stock[k] += amt;
    }
    const amt = Math.floor(Math.max(0, n.acorns - 2) * share);
    n.acorns -= amt;
    f.acorns += amt;
  }
}

function upkeep(w: WorldState, f: Faction, members: readonly NpcId[], rng: Rng): void {
  const t = w.tuning.factions;
  const need = rng.round(t.upkeepK * Math.pow(f.power, t.upkeepExp) * t.planEvery / w.tuning.clock.ticksPerDay);
  let left = need;
  const fromStore = Math.min(left, f.stock.food);
  f.stock.food -= fromStore;
  left -= fromStore;
  for (const id of members) {
    if (left <= 0) break;
    const n = w.npcs[id];
    const take = Math.min(left, n.carried.food);
    n.carried.food -= take;
    left -= take;
  }
  w.ledger.consumed.food += need - left;
  f.morale = clamp01(left > 0 ? f.morale - t.moraleDrift : f.morale + t.moraleDrift / 2);
}

interface Candidate { plan: FactionPlan; score: number; target: FactionId | null; region?: RegionId }

function touches(w: WorldState, a: Faction, b: Faction): boolean {
  return a.territory.some((r) => (w.graph.neighbours[r] ?? []).some((nb) => b.territory.includes(nb.to)));
}

function sharedNorms(a: Norms, b: Norms): number {
  return (Object.keys(a) as (keyof Norms)[]).filter((k) => a[k] === b[k]).length;
}

function planCandidates(w: WorldState, f: Faction): Candidate[] {
  const t = w.tuning.factions;
  const out: Candidate[] = [{ plan: 'hold', score: 0, target: null }];
  const claimed = new Set<RegionId>();
  for (const o of w.factions) if (alive(o)) for (const r of o.territory) claimed.add(r);
  if (f.territory.length < t.patrolReach + 1) {
    for (const r of f.territory) {
      const free = (w.graph.neighbours[r] ?? []).find((nb) => !claimed.has(nb.to));
      if (free) { out.push({ plan: 'expand', score: 0.5, target: null, region: free.to }); break; }
    }
  }
  if (RESOURCES.some((k) => f.stock[k] > 10)) out.push({ plan: 'trade', score: 0.3, target: null });
  const others = w.factions.filter((o) => o.id !== f.id && alive(o));
  for (const o of others) {
    if (f.allies.includes(o.id) || sharedNorms(f.norms, o.norms) < 3) continue;
    if (!f.enemies.some((e) => o.enemies.includes(e))) continue;
    out.push({ plan: 'ally', score: 0.4, target: o.id });
  }
  const neighbours = others.filter((o) => touches(w, f, o));
  for (const o of neighbours) {
    if (f.power > 2 * o.power) out.push({ plan: 'tribute', score: 0.5, target: o.id });
  }
  if (neighbours.length > 0) {
    let target = neighbours[0];
    const total = (o: Faction): number => RESOURCES.reduce((s, k) => s + o.stock[k], 0) + o.acorns;
    for (const o of neighbours) if (total(o) > total(target)) target = o;
    const leader = w.npcs[f.leader];
    const risk = 1 - f.morale;
    const greedy = leader ? leader.traits.greed : 0;
    out.push({ plan: 'raid', score: greedy + (f.norms.violence === 'outsiders' ? 1 : 0) - risk, target: target.id });
  }
  return out;
}

function raid(w: WorldState, f: Faction, o: Faction, members: readonly NpcId[], rng: Rng): void {
  const t = w.tuning.factions;
  const p = f.power;
  const q = o.power;
  const chance = p + q > 0 ? p / (p + q) : 0.5;
  if (rng.chance(chance)) {
    for (const k of RESOURCES) {
      const take = Math.floor(o.stock[k] * t.raidTake);
      o.stock[k] -= take;
      f.stock[k] += take;
    }
    const acorns = Math.floor(o.acorns * t.raidTake);
    o.acorns -= acorns;
    f.acorns += acorns;
    o.morale = clamp01(o.morale - 0.1);
    if (!o.enemies.includes(f.id)) o.enemies.push(f.id);
    note(w, `${f.name} raided ${o.name} and took a share of their store.`);
  } else {
    const k = Math.max(1, Math.round(t.raidLoss * members.length));
    const raiders = [...members].sort((a, b) => w.npcs[b].traits.boldness - w.npcs[a].traits.boldness || a - b);
    for (const id of raiders.slice(0, k)) killNpc(w, w.npcs[id], 'gnome', rng);
    note(w, `${f.name} raided ${o.name} and lost ${Math.min(k, members.length)} gnomes.`);
  }
}

function schism(w: WorldState, f: Faction): void {
  const gid = f.groups[f.groups.length - 1];
  const g = w.groups.find((x) => x.id === gid);
  f.groups = f.groups.slice(0, -1);
  if (!g) return;
  const nf = factionFromGroup(w, g);
  f.plan = 'schism';
  f.planTarget = nf.id;
  f.planSince = w.tick;
  w.events.push({ kind: 'faction-plan', faction: f.id, plan: 'schism', target: nf.id });
  note(w, `${nf.name} split from ${f.name}.`);
}

function planFaction(w: WorldState, f: Faction, rng: Rng): void {
  const t = w.tuning.factions;
  const members = membersOf(w, f);
  if (members.length === 0) { fall(w, f); return; }
  if (!members.includes(f.leader)) changeLeader(w, f, members);
  payIntoStore(w, f, members);
  f.power = powerOf(w, f);
  upkeep(w, f, members, rng);
  if (f.morale < t.collapseMorale) { fall(w, f); return; }
  if (f.groups.length >= 2 && f.morale < 0.4) { schism(w, f); return; }

  const cands = planCandidates(w, f);
  const c = rng.weighted(cands, (x) => Math.exp(x.score / t.planTemp));
  f.plan = c.plan;
  f.planTarget = c.target;
  f.planSince = w.tick;
  const others = w.factions.filter((o) => alive(o) && o.id !== f.id);
  switch (c.plan) {
    case 'expand':
      if (c.region !== undefined) f.territory.push(c.region);
      break;
    case 'ally': {
      const o = others.find((x) => x.id === c.target);
      if (o) {
        if (!f.allies.includes(o.id)) f.allies.push(o.id);
        if (!o.allies.includes(f.id)) o.allies.push(f.id);
        note(w, `${f.name} made a pact with ${o.name}.`);
      }
      break;
    }
    case 'tribute': {
      const o = others.find((x) => x.id === c.target);
      if (o) {
        const take = Math.floor(o.acorns * t.raidTake / 2);
        o.acorns -= take;
        f.acorns += take;
        note(w, `${o.name} paid tribute to ${f.name}.`);
      }
      break;
    }
    case 'raid': {
      const o = others.find((x) => x.id === c.target);
      if (o) raid(w, f, o, members, rng);
      break;
    }
    default:
      break;
  }
  w.events.push({ kind: 'faction-plan', faction: f.id, plan: c.plan, target: c.target });
}

/** Alive members of the faction standing in region `r`. */
function membersInRegion(w: WorldState, f: Faction, r: RegionId): number {
  return membersOf(w, f).filter((id) => w.npcs[id].region === r).length;
}

function streakOf(w: WorldState, h: HavenId, day: number): number {
  let k = 0;
  while (w.flags[`haven-empty:${h}:${day - k}`]) k++;
  return k;
}

function stepHavens(w: WorldState): void {
  const t = w.tuning.factions;
  const day = Math.floor(w.tick / w.tuning.clock.ticksPerDay) + 1;
  for (const h of HAVENS) {
    const holderId = havenHolder(w, h);
    const region = HAVEN_REGION[h];
    const holder = holderId === null ? null : w.factions[holderId];
    if (holder !== null) {
      if (membersInRegion(w, holder, region) > 0) continue;
      w.flags[`haven-empty:${h}:${day}`] = true;
      if (streakOf(w, h, day) < t.havenHoldDays) continue;
    }
    let best: Faction | null = null;
    let bestN = 0;
    for (const f of w.factions) {
      if (!alive(f)) continue;
      const n = membersInRegion(w, f, region);
      if (n > bestN) { best = f; bestN = n; }
    }
    if (holder !== null) holder.havens = holder.havens.filter((x) => x !== h);
    if (best !== null) best.havens.push(h);
    for (const key of Object.keys(w.flags)) if (key.startsWith(`haven-empty:${h}:`)) delete w.flags[key];
    if (best === null && holder === null) continue;
    w.events.push({ kind: 'haven-changed', haven: h, from: holder?.id ?? null, to: best?.id ?? null });
    note(w, best === null ? `${HAVEN_NAME[h]} was left empty.` : `${best.name} took ${HAVEN_NAME[h]}.`);
  }
}

export function stepFactions(w: WorldState, rng: Rng): void {
  const t = w.tuning.factions;
  const tpd = w.tuning.clock.ticksPerDay;
  // Groups that no longer exist are dropped from factions and from the map.
  const live = new Set<number>(w.groups.map((g) => g.id));
  for (const f of w.factions) f.groups = f.groups.filter((g) => live.has(g));
  for (const key of Object.keys(w.groupFaction)) if (!live.has(Number(key))) delete w.groupFaction[key];
  // Groups of formAt+ members with no faction become factions.
  for (const g of [...w.groups]) {
    if (w.groupFaction[String(g.id)] !== undefined || g.members.length < t.formAt) continue;
    const f = factionFromGroup(w, g);
    note(w, `${f.name} formed at ${regionName(w, f.home)}.`);
  }
  if (w.tick % t.planEvery === 0) {
    const n = w.factions.length;
    for (let i = 0; i < n; i++) {
      const f = w.factions[i];
      if (alive(f)) planFaction(w, f, rng);
    }
  }
  if (w.tick % tpd === tpd - 1) stepHavens(w);
}

export function rankOf(w: WorldState, f: FactionId, player: PlayerKey): Rank | null {
  return w.factions[f]?.ranks[player] ?? null;
}

export function joinFaction(w: WorldState, f: FactionId, player: PlayerKey): boolean {
  const p = w.players[player];
  const fac = w.factions[f];
  if (!p || !fac || !alive(fac) || p.faction !== null) return false;
  const need = fac.norms.strangers === 'turn-away' ? 40 : 0;
  if (standingOf(w, f, player) < need) return false;
  fac.ranks[player] = 'stray';
  p.faction = f;
  w.events.push({ kind: 'player-joined-faction', player, faction: f });
  return true;
}

export function leaveFaction(w: WorldState, player: PlayerKey): void {
  const p = w.players[player];
  if (!p || p.faction === null) return;
  const fac = w.factions[p.faction];
  if (fac) {
    for (const id of membersOf(w, fac)) adjustTrust(w, id, subjectOfPlayer(player), -0.1);
    delete fac.ranks[player];
  }
  p.faction = null;
}

export function promoteRanks(w: WorldState, player: PlayerKey): Rank | null {
  const p = w.players[player];
  if (!p || p.faction === null) return null;
  const fac = w.factions[p.faction];
  const t = w.tuning.factions;
  if (!fac || !fac.ranks[player]) return null;
  let idx = RANKS.indexOf(fac.ranks[player]);
  let moved: Rank | null = null;
  while (idx + 1 < RANKS.length) {
    const next = RANKS[idx + 1];
    const done = fac.done[player] ?? 0;
    const trust = standingOf(w, fac.id, player) / 100;
    if (done < t.rankDone[next] || trust < t.rankTrust[next]) break;
    idx += 1;
    moved = next;
  }
  if (moved === null) return null;
  fac.ranks[player] = moved;
  w.events.push({ kind: 'rank-changed', player, faction: fac.id, rank: moved });
  return moved;
}

export function factionDaily(w: WorldState): Pick<DailyRow, 'factions' | 'topFactions' | 'hhiNorm' | 'topShare' | 'havensUp' | 'havenHolders'> {
  const living = w.factions.filter(alive);
  const n = living.length;
  const total = living.reduce((s, f) => s + f.power, 0);
  const ranked = [...living].sort((a, b) => b.power - a.power || a.id - b.id);
  const shares = living.map((f) => (total > 0 ? f.power / total : 0));
  const hhi = shares.reduce((s, x) => s + x * x, 0);
  const hhiNorm = n < 2 || total <= 0 ? 0 : (hhi - 1 / n) / (1 - 1 / n);
  const havenHolders: Partial<Record<HavenId, FactionId | null>> = {};
  let havensUp = 0;
  for (const h of HAVENS) {
    const holder = havenHolder(w, h);
    havenHolders[h] = holder;
    if (holder !== null) havensUp += 1;
  }
  return {
    factions: n,
    topFactions: ranked.map((f) => f.id),
    hhiNorm,
    topShare: shares.length > 0 ? Math.max(...shares) : 0,
    havensUp,
    havenHolders,
  };
}
