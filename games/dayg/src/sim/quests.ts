// Quests and notice boards (quests.md, roadmap 7.3). The world posts quests from sim state, they land on boards, pay from the
// poster's store, expire on sim deadlines, change the world when done, and are measured for consequence reach.
import { getItem } from '../items/defs';
import { factionOf, havenHolder, membersOf, powerOf, promoteRanks } from './factions';
import { hatlessInRegion } from './horde';
import { priceOf } from './market';
import { HAVEN_NAME, HAVEN_REGION } from './regions';
import { createRng, hashString, type Rng } from './rng';
import { adjustTrust, subjectOfPlayer, witnessDeed } from './social';
import {
  HAVENS, QUEST_TEMPLATES, RESOURCES, type BoardId, type DailyRow, type Faction, type FactionId, type ItemStack, type Norms, type Npc,
  type NpcId, type NoticeBoard, type PlayerKey, type PlayerRecord, type Quest, type QuestGoal, type QuestId, type QuestOutcome,
  type QuestReward, type QuestTemplate, type RegionId, type Resource, type SubjectKey, type WorldState,
} from './types';
import { dayOf, endOfDay } from './world';

export type NewQuest = Omit<Quest, 'id' | 'state' | 'takenBy' | 'takenTick' | 'doneTick' | 'progress'>;

/** A quest the world wants posted. `rival` is posted with it and the two are linked. */
interface Need { template: QuestTemplate; region: RegionId; poster: SubjectKey; goal: QuestGoal; value: number; items?: ItemStack[]; rival?: Need }

/** Posting order: the table in roadmap 7.3, at most one new quest per template per check. */
const POST_ORDER: readonly QuestTemplate[] = ['supply-run', 'clear-ground', 'missing-gnome', 'bounty', 'steer-drift', 'the-bitten',
  'envoy', 'sabotage', 'escort', 'open-crypt', 'teach'];
const NEWCOMER_TEMPLATES: ReadonlySet<QuestTemplate> = new Set<QuestTemplate>(['supply-run', 'clear-ground', 'missing-gnome']);
const NORM_KEYS: readonly (keyof Norms)[] = ['sharing', 'strangers', 'bitten', 'leadership', 'violence'];

const isOpen = (q: Quest): boolean => q.state === 'offered' || q.state === 'taken';
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

export function initBoards(w: WorldState): void {
  const boards: NoticeBoard[] = [];
  for (const h of HAVENS) {
    const region: RegionId = HAVEN_REGION[h];
    if (!w.graph.byId[region]) continue;
    const id: BoardId = `board:${region}`;
    boards.push({ id, region, haven: h, name: `${HAVEN_NAME[h]} board`, newcomer: region === 'gate-roof' });
  }
  w.boards = boards;
}

// ---- lookups (every helper reads the world, never caches)

function hopsFrom(w: WorldState, start: RegionId): Map<RegionId, number> {
  const dist = new Map<RegionId, number>([[start, 0]]);
  const queue: RegionId[] = [start];
  for (let i = 0; i < queue.length; i++) {
    const r = queue[i];
    const d = dist.get(r) ?? 0;
    for (const nb of w.graph.neighbours[r] ?? []) {
      if (!dist.has(nb.to)) { dist.set(nb.to, d + 1); queue.push(nb.to); }
    }
  }
  return dist;
}

function aliveFactions(w: WorldState): Faction[] { return w.factions.filter((f) => f.diedTick === null); }
function liveFaction(w: WorldState, id: FactionId | null | undefined): Faction | null {
  if (id === null || id === undefined) return null;
  const f = w.factions[id];
  return f && f.diedTick === null ? f : null;
}
function liveNpc(w: WorldState, id: NpcId): Npc | null {
  const n = w.npcs[id];
  return n && n.alive ? n : null;
}
function membersAlive(w: WorldState, f: Faction): Npc[] {
  return membersOf(w, f).map((id) => liveNpc(w, id)).filter((n): n is Npc => n !== null);
}
function factionAtHome(w: WorldState, r: RegionId): Faction | null { return aliveFactions(w).find((f) => f.home === r) ?? null; }

/** The poster as a faction ('f:<id>') or an NPC ('n:<id>'), dead or alive. */
function posterFaction(w: WorldState, poster: SubjectKey): Faction | null {
  return poster.startsWith('f:') ? (w.factions[Number(poster.slice(2))] ?? null) : null;
}
function posterNpc(w: WorldState, poster: SubjectKey): Npc | null {
  return poster.startsWith('n:') ? (w.npcs[Number(poster.slice(2))] ?? null) : null;
}
function posterHome(w: WorldState, poster: SubjectKey): RegionId {
  const f = posterFaction(w, poster);
  if (f) return f.home;
  return posterNpc(w, poster)?.region ?? w.market.region;
}
function posterName(w: WorldState, poster: SubjectKey): string {
  return posterFaction(w, poster)?.name ?? posterNpc(w, poster)?.name ?? 'someone';
}
/** The store that pays out: a live faction's acorns or a live NPC's. */
function purseOf(w: WorldState, poster: SubjectKey): Faction | Npc | null {
  const f = posterFaction(w, poster);
  if (f) return f.diedTick === null ? f : null;
  const n = posterNpc(w, poster);
  return n && n.alive ? n : null;
}
function posterMembers(w: WorldState, poster: SubjectKey): NpcId[] {
  const f = posterFaction(w, poster);
  if (f) return membersAlive(w, f).map((n) => n.id);
  const n = posterNpc(w, poster);
  return n && n.alive ? [n.id] : [];
}
function npcName(w: WorldState, id: NpcId): string { return w.npcs[id]?.name ?? 'someone'; }
function regionName(w: WorldState, r: RegionId): string { return w.graph.byId[r]?.name ?? r; }
function placeName(w: WorldState, r: RegionId): string {
  const h = HAVENS.find((x) => HAVEN_REGION[x] === r);
  if (h) {
    const n = HAVEN_NAME[h];
    return n.startsWith('The ') ? `the ${n.slice(4)}` : n;
  }
  return regionName(w, r);
}

// ---- titles, rewards, boards

function titleOf(w: WorldState, template: QuestTemplate, goal: QuestGoal): string {
  switch (goal.kind) {
    case 'deliver':
      return template === 'the-bitten'
        ? `Medicine for the bitten in ${regionName(w, goal.to)}`
        : `Bring ${goal.count} ${goal.resource} to ${placeName(w, goal.to)}`;
    case 'clear':
      return template === 'open-crypt' ? 'Open Crypt Row' : `Thin the Hatless in ${regionName(w, goal.region)}`;
    case 'find': return `Find ${npcName(w, goal.npc)}`;
    case 'target': return `Deal with ${npcName(w, goal.npc)}`;
    case 'escort': return `See ${npcName(w, goal.npc)} to ${placeName(w, goal.to)}`;
    case 'steer': return `Turn the herd from ${placeName(w, goal.away)}`;
    case 'visit': {
      const who = factionAtHome(w, goal.region)?.name ?? regionName(w, goal.region);
      return template === 'envoy' ? `Carry a letter to ${who}` : `Spoil the ${who}' store`;
    }
    case 'teach': return `Teach gardening to the ${w.groups.find((g) => g.id === goal.group)?.name ?? 'group'}`;
    case 'storylet': return regionName(w, goal.region);
  }
}

function rewardFor(w: WorldState, need: Need): QuestReward {
  const t = w.tuning.quests;
  const want = Math.max(t.minReward, Math.round(need.value * (1 + t.rewardShare)));
  const purse = purseOf(w, need.poster);
  return { acorns: Math.min(want, purse?.acorns ?? 0), items: need.items ?? [], trust: 0.1 };
}

/** Newcomer board for easy quests near the gate, else the nearest board with room; null when every board is full. */
function pickBoard(w: WorldState, q: { template: QuestTemplate; region: RegionId }): BoardId | null {
  const cap = w.tuning.quests.perBoard;
  const load = (b: NoticeBoard): number => w.quests.filter((x) => x.board === b.id && isOpen(x)).length;
  const hops = hopsFrom(w, q.region);
  // A haven's own need (the Tap's market, a haven's supply) stays on that haven's board; the newcomer rule covers the rest near the gate.
  const atHaven = HAVENS.some((h) => HAVEN_REGION[h] === q.region);
  const nearGate = (hopsFrom(w, 'gate-roof').get(q.region) ?? Infinity) <= 2;
  const newcomer = w.boards.find((b) => b.newcomer);
  if (nearGate && !atHaven && newcomer && NEWCOMER_TEMPLATES.has(q.template) && load(newcomer) < cap) return newcomer.id;
  let best: NoticeBoard | null = null;
  let bestHops = Infinity;
  for (const b of w.boards) {
    if (load(b) >= cap) continue;
    const d = hops.get(b.region);
    if (d !== undefined && d < bestHops) { best = b; bestHops = d; }
  }
  return best?.id ?? null;
}

// ---- posting: the needs each template sees in the world (lazy, so rng is drawn only as far as a need is taken)

function* supplyNeeds(w: WorldState): Generator<Need> {
  const t = w.tuning.quests;
  const tm = w.tuning.market;
  const m = w.market;
  const holder = liveFaction(w, havenHolder(w, 'tap'));
  if (holder) {
    for (const res of RESOURCES) {
      const want = tm.target[res] * t.supplyBelow;
      if (m.stock[res] >= want) continue;
      const count = Math.max(2, Math.round(want - m.stock[res]));
      yield { template: 'supply-run', region: m.region, poster: `f:${holder.id}`, goal: { kind: 'deliver', resource: res, count, to: m.region }, value: priceOf(w, res) * count };
    }
  }
  for (const f of aliveFactions(w)) {
    const members = membersAlive(w, f).length;
    if (f.stock.food >= members) continue;
    const count = Math.max(2, members);
    yield { template: 'supply-run', region: f.home, poster: `f:${f.id}`, goal: { kind: 'deliver', resource: 'food', count, to: f.home }, value: priceOf(w, 'food') * count };
  }
}

function* clearNeeds(w: WorldState, rng: Rng): Generator<Need> {
  const t = w.tuning.quests;
  for (const f of aliveFactions(w)) {
    const near: RegionId[] = [f.home, ...(w.graph.neighbours[f.home] ?? []).map((nb) => nb.to)];
    const hot = near.find((r) => hatlessInRegion(w, r) >= t.clearDensity);
    if (hot === undefined) continue;
    const count = rng.int(t.clearCount[0], t.clearCount[1]);
    yield { template: 'clear-ground', region: hot, poster: `f:${f.id}`, goal: { kind: 'clear', region: hot, count }, value: 2 + 2 * count };
  }
}

function* missingNeeds(w: WorldState): Generator<Need> {
  for (const f of aliveFactions(w)) {
    const home = hopsFrom(w, f.home);
    for (const n of membersAlive(w, f)) {
      if ((home.get(n.region) ?? Infinity) < 2) continue;
      yield { template: 'missing-gnome', region: n.region, poster: `f:${f.id}`, goal: { kind: 'find', npc: n.id, region: n.region }, value: 6 };
      break;
    }
  }
}

function* bountyNeeds(w: WorldState): Generator<Need> {
  const grudge = w.tuning.quests.bountyGrudge;
  for (const n of w.npcs) {
    if (!n.alive) continue;
    for (const e of w.memory[n.id]?.entries ?? []) {
      if (e.grudge === null || e.trust > grudge || !e.s.startsWith('n:')) continue;
      const target = liveNpc(w, Number(e.s.slice(2)));
      if (!target || target.id === n.id) continue;
      const own = factionOf(w, n);
      const tf = factionOf(w, target);
      const need: Need = { template: 'bounty', region: target.region, poster: own ? `f:${own.id}` : `n:${n.id}`, goal: { kind: 'target', npc: target.id }, value: 6 };
      if (tf) need.rival = { template: 'escort', region: target.region, poster: `f:${tf.id}`, goal: { kind: 'escort', npc: target.id, from: target.region, to: tf.home }, value: 6 };
      yield need;
    }
  }
}

function* driftNeeds(w: WorldState): Generator<Need> {
  for (const herd of w.horde.herds) {
    if (herd.size < w.tuning.quests.driftSize || herd.target === null) continue;
    const target = herd.target;
    const haven = HAVENS.find((h) => HAVEN_REGION[h] === target);
    const f = factionAtHome(w, target) ?? (haven ? liveFaction(w, havenHolder(w, haven)) : null);
    if (!f) continue;
    yield { template: 'steer-drift', region: herd.region, poster: `f:${f.id}`, goal: { kind: 'steer', herd: herd.id, away: target }, value: 6 };
  }
}

function* bittenNeeds(w: WorldState): Generator<Need> {
  for (const n of w.npcs) {
    if (!n.alive || n.infectedAt === null) continue;
    const f = factionOf(w, n);
    if (!f || f.norms.bitten === 'shatter') continue;
    yield { template: 'the-bitten', region: n.region, poster: `f:${f.id}`, goal: { kind: 'deliver', resource: 'medicine', count: 1, to: n.region }, value: priceOf(w, 'medicine') };
  }
}

function* envoyNeeds(w: WorldState): Generator<Need> {
  const fs = aliveFactions(w);
  for (const a of fs) {
    for (const b of fs) {
      if (b.id <= a.id) continue;
      if (a.allies.includes(b.id) || a.enemies.includes(b.id) || b.allies.includes(a.id) || b.enemies.includes(a.id)) continue;
      const shared = NORM_KEYS.filter((k) => a.norms[k] === b.norms[k]).length;
      if (shared < 3) continue;
      const [stronger, other] = powerOf(w, a) >= powerOf(w, b) ? [a, b] : [b, a];
      yield { template: 'envoy', region: other.home, poster: `f:${stronger.id}`, goal: { kind: 'visit', region: other.home, item: 'sealed-letter' }, value: 6 };
    }
  }
}

function* sabotageNeeds(w: WorldState): Generator<Need> {
  for (const f of aliveFactions(w)) {
    const enemy = f.enemies.map((id) => liveFaction(w, id)).find((e): e is Faction => e !== null);
    if (!enemy) continue;
    yield { template: 'sabotage', region: enemy.home, poster: `f:${f.id}`, goal: { kind: 'visit', region: enemy.home, item: null }, value: 6 };
  }
}

function* escortNeeds(w: WorldState): Generator<Need> {
  for (const f of aliveFactions(w)) {
    for (const ally of f.allies.map((id) => liveFaction(w, id)).filter((a): a is Faction => a !== null)) {
      const member = membersAlive(w, f).find((n) => n.region !== ally.home && (hopsFrom(w, n.region).get(ally.home) ?? Infinity) >= 2);
      if (!member) continue;
      yield { template: 'escort', region: member.region, poster: `f:${f.id}`, goal: { kind: 'escort', npc: member.id, from: member.region, to: ally.home }, value: 6 };
    }
  }
}

function* cryptNeeds(w: WorldState): Generator<Need> {
  if (!w.graph.byId['crypt-row']) return;
  for (const f of aliveFactions(w)) {
    if (!f.territory.includes('crypt-row') || hatlessInRegion(w, 'crypt-row') <= 0) continue;
    yield { template: 'open-crypt', region: 'crypt-row', poster: `f:${f.id}`, goal: { kind: 'clear', region: 'crypt-row', count: 10 }, value: 2 + 2 * 10, items: [{ def: 'gold-coins', count: 1, condition: 1 }] };
    return;
  }
}

function* teachNeeds(w: WorldState): Generator<Need> {
  for (const g of w.groups) {
    const f = liveFaction(w, w.groupFaction[String(g.id)]);
    if (!f) continue;
    const alive = g.members.map((id) => liveNpc(w, id)).filter((n): n is Npc => n !== null);
    if (alive.length < 4 || alive.some((n) => n.traits.industry >= 0.7)) continue;
    yield { template: 'teach', region: g.region, poster: `f:${f.id}`, goal: { kind: 'teach', group: g.id, skill: 'gardening', level: 3, hours: 6 }, value: 6 };
  }
}

function needsFor(w: WorldState, template: QuestTemplate, rng: Rng): Generator<Need> {
  switch (template) {
    case 'supply-run': return supplyNeeds(w);
    case 'clear-ground': return clearNeeds(w, rng);
    case 'missing-gnome': return missingNeeds(w);
    case 'bounty': return bountyNeeds(w);
    case 'steer-drift': return driftNeeds(w);
    case 'the-bitten': return bittenNeeds(w);
    case 'envoy': return envoyNeeds(w);
    case 'sabotage': return sabotageNeeds(w);
    case 'escort': return escortNeeds(w);
    case 'open-crypt': return cryptNeeds(w);
    case 'teach': return teachNeeds(w);
    case 'storylet': return (function* none(): Generator<Need> { /* storylets post their own quests (roadmap 7.18) */ })();
  }
}

function postNeed(w: WorldState, need: Need): QuestId {
  const id = postQuest(w, {
    template: need.template, title: titleOf(w, need.template, need.goal), poster: need.poster, board: null,
    region: need.region, goal: need.goal, reward: rewardFor(w, need), postedTick: w.tick,
    deadline: w.tick + w.tuning.quests.expireDays[need.template] * w.tuning.clock.ticksPerDay, rival: null,
  });
  const q = w.quests[id];
  q.board = pickBoard(w, q);
  if (need.rival) {
    const rid = postNeed(w, need.rival);
    q.rival = rid;
    w.quests[rid].rival = id;
  }
  return id;
}

// ---- the step: expire, post, and measure outcomes

function expireQuests(w: WorldState, rng: Rng): void {
  for (const q of w.quests) {
    if (!isOpen(q) || w.tick <= q.deadline) continue;
    if (q.state === 'offered') { q.state = 'expired'; continue; }
    const key = q.takenBy;
    q.state = 'failed';
    const rec = key !== null ? w.players[key] : undefined;
    if (rec && key !== null) {
      rec.failed += 1;
      rec.quests = rec.quests.filter((x) => x !== q.id);
    }
    w.events.push({ kind: 'quest-failed', quest: q.id, player: key, expired: true });
    if (key !== null) witnessDeed(w, subjectOfPlayer(key), 'quest-failed', posterHome(w, q.poster), rng);
  }
}

function postQuests(w: WorldState, rng: Rng): void {
  const max = w.tuning.quests.maxOpen;
  for (const template of POST_ORDER) {
    if (w.quests.filter((q) => q.state === 'offered').length >= max) return;
    for (const need of needsFor(w, template, rng)) {
      if (w.quests.some((q) => isOpen(q) && q.template === need.template && q.region === need.region)) continue;
      postNeed(w, need);
      break;
    }
  }
}

/** Once per world-day: an outcome whose reach window has passed reads the daily rows from its done day onward. */
function measureOutcomes(w: WorldState): void {
  const t = w.tuning.quests;
  const tpd = w.tuning.clock.ticksPerDay;
  for (const o of w.outcomes) {
    if (o.reach !== null || o.doneTick + t.reachDays * tpd > w.tick) continue;
    const doneDay = dayOf(o.doneTick, w.tuning);
    const rows = w.daily.filter((r) => r.day >= doneDay && r.day <= doneDay + t.reachDays);
    if (rows.length < 2) continue;
    const base = rows.find((r) => r.day === doneDay) ?? rows[0];
    const later = rows.filter((r) => r !== base);
    const top = (r: DailyRow): FactionId[] => (r.topFactions ?? []).slice(0, 3);
    const sameTop = (a: DailyRow, b: DailyRow): boolean => {
      const x = top(a);
      const y = top(b);
      return x.length === y.length && x.every((v, i) => v === y[i]);
    };
    o.reach = {
      rankChange: later.some((r) => !sameTop(r, base)),
      havenChange: later.some((r) => HAVENS.some((h) => (r.havenHolders?.[h] ?? null) !== (base.havenHolders?.[h] ?? null))),
      marketOutOfBand: base.marketInBand === true && later.some((r) => r.marketInBand === false),
    };
  }
}

export function stepQuests(w: WorldState, rng: Rng): void {
  if (endOfDay(w)) measureOutcomes(w);
  if (w.tick % w.tuning.quests.checkEvery !== 0) return;
  expireQuests(w, rng);
  postQuests(w, rng);
}

// ---- queries

export function questsOn(w: WorldState, board: BoardId): Quest[] {
  return w.quests.filter((q) => q.board === board && isOpen(q)).sort((a, b) => b.id - a.id);
}

export function questsNear(w: WorldState, region: RegionId, hops: number): Quest[] {
  const dist = hopsFrom(w, region);
  return w.quests.filter((q) => q.state === 'offered' && (dist.get(q.region) ?? Infinity) <= hops).sort((a, b) => b.id - a.id);
}

// ---- player actions

export function takeQuest(w: WorldState, q: QuestId, player: PlayerKey): boolean {
  const quest = w.quests[q];
  const rec = w.players[player];
  if (!quest || !rec || quest.state !== 'offered' || w.tick > quest.deadline || rec.quests.length >= 3) return false;
  quest.state = 'taken';
  quest.takenBy = player;
  quest.takenTick = w.tick;
  rec.quests.push(q);
  return true;
}

export function progressQuest(w: WorldState, q: QuestId, player: PlayerKey, amount: number): void {
  const quest = w.quests[q];
  if (!quest || quest.state !== 'taken' || quest.takenBy !== player) return;
  quest.progress += amount;
}

/** Hands units over for a deliver goal; the units go to the poster's store (the market's when the poster holds the Tap). */
export function deliver(w: WorldState, q: QuestId, player: PlayerKey, resource: Resource, count: number): number {
  const quest = w.quests[q];
  const rec = w.players[player];
  if (!quest || !rec || quest.state !== 'taken' || quest.takenBy !== player) return 0;
  const goal = quest.goal;
  if (goal.kind !== 'deliver' || goal.resource !== resource || rec.region !== goal.to) return 0;
  const f = posterFaction(w, quest.poster);
  if (!f || f.diedTick !== null) return 0;
  const n = Math.max(0, Math.min(Math.floor(count), goal.count - quest.progress));
  if (n === 0) return 0;
  if (w.market.region === goal.to && havenHolder(w, 'tap') === f.id) w.market.stock[resource] += n;
  else f.stock[resource] += n;
  quest.progress += n;
  w.ledger.givenByPlayer[resource] += n;
  return n;
}

function goalMet(w: WorldState, quest: Quest, rec: PlayerRecord): boolean {
  const g = quest.goal;
  switch (g.kind) {
    case 'deliver':
    case 'clear': return quest.progress >= g.count;
    case 'find':
    case 'target': return quest.progress >= 1;
    case 'escort': return rec.region === g.to;
    case 'visit': return rec.region === g.region;
    case 'steer': {
      const herd = w.horde.herds.find((h) => h.id === g.herd);
      return quest.progress >= 1 && herd !== undefined && herd.region !== g.away;
    }
    case 'teach': return quest.progress >= g.hours;
    case 'storylet': return quest.progress >= g.step;
  }
}

function failRival(w: WorldState, id: QuestId): void {
  const r = w.quests[id];
  if (!r || !isOpen(r)) return;
  if (r.state === 'taken' && r.takenBy !== null) {
    const p = w.players[r.takenBy];
    if (p) p.quests = p.quests.filter((x) => x !== id);
  }
  r.state = 'failed';
}

export function completeQuest(w: WorldState, q: QuestId, player: PlayerKey): QuestReward | null {
  const quest = w.quests[q];
  const rec = w.players[player];
  if (!quest || !rec || quest.state !== 'taken' || quest.takenBy !== player || !goalMet(w, quest, rec)) return null;
  const goal = quest.goal;
  const f = posterFaction(w, quest.poster);
  if (goal.kind === 'escort') {
    const npc = liveNpc(w, goal.npc);
    if (npc) npc.region = goal.to;
  }

  // pay: acorns from the poster's store, reward items from the faction's stock by resource
  const purse = purseOf(w, quest.poster);
  const pay = purse ? Math.max(0, Math.min(quest.reward.acorns, purse.acorns)) : 0;
  if (purse) purse.acorns -= pay;
  rec.acorns += pay;
  const items: ItemStack[] = [];
  if (f) {
    for (const st of quest.reward.items) {
      const res = getItem(st.def).resource;
      const n = Math.min(st.count, f.stock[res]);
      if (n <= 0) continue;
      f.stock[res] -= n;
      w.ledger.removedByPlayer[res] += n;
      items.push({ ...st, count: n });
    }
  }
  for (const id of posterMembers(w, quest.poster)) adjustTrust(w, id, subjectOfPlayer(player), quest.reward.trust);
  const rng = createRng(hashString(`${w.seed}:quest-done:${quest.id}:${w.tick}`));
  witnessDeed(w, subjectOfPlayer(player), 'quest-done', posterHome(w, quest.poster), rng);
  if (f) f.done[player] = (f.done[player] ?? 0) + 1;
  rec.done += 1;
  promoteRanks(w, player);
  rec.quests = rec.quests.filter((x) => x !== q);
  quest.state = 'done';
  quest.doneTick = w.tick;
  const outcome: QuestOutcome = { quest: q, template: quest.template, doneTick: w.tick, by: player, reach: null };
  w.outcomes.push(outcome);
  w.events.push({ kind: 'quest-done', quest: q, player });
  w.chronicle.push({ tick: w.tick, text: `${rec.name} finished ${quest.title} for ${posterName(w, quest.poster)}.` });

  // what the finished quest changes in the world
  switch (quest.template) {
    case 'the-bitten': {
      const cured = w.npcs.find((n) => n.alive && n.infectedAt !== null && n.region === quest.region && f !== null && factionOf(w, n)?.id === f.id);
      if (cured) {
        cured.infectedAt = null;
        w.events.push({ kind: 'npc-cured', npc: cured.id, region: cured.region });
      }
      if (f) f.norms.bitten = 'nurse';
      break;
    }
    case 'envoy': {
      const other = goal.kind === 'visit' ? factionAtHome(w, goal.region) : null;
      if (f && other && other.id !== f.id) {
        if (!f.allies.includes(other.id)) f.allies.push(other.id);
        if (!other.allies.includes(f.id)) other.allies.push(f.id);
      }
      break;
    }
    case 'sabotage': {
      const enemy = goal.kind === 'visit' ? factionAtHome(w, goal.region) : null;
      if (enemy && goal.kind === 'visit') {
        for (const res of RESOURCES) {
          const spill = Math.floor(enemy.stock[res] * 0.3);
          enemy.stock[res] -= spill;
          w.loot[goal.region][res] += spill;
        }
        enemy.morale = clamp01(enemy.morale - 0.1);
      }
      break;
    }
    case 'bounty': {
      const target = goal.kind === 'target' ? liveNpc(w, goal.npc) : null;
      const tf = target ? factionOf(w, target) : null;
      if (target && tf) tf.morale = clamp01(tf.morale - 0.05);
      if (target) adjustTrust(w, target.id, subjectOfPlayer(player), -0.3);
      if (quest.rival !== null) failRival(w, quest.rival);
      break;
    }
    case 'clear-ground':
      if (f) f.morale = clamp01(f.morale + 0.05);
      break;
    default:
      break;
  }
  return { acorns: pay, items, trust: quest.reward.trust };
}

export function abandonQuest(w: WorldState, q: QuestId, player: PlayerKey): void {
  const quest = w.quests[q];
  const rec = w.players[player];
  if (!quest || !rec || quest.state !== 'taken' || quest.takenBy !== player) return;
  quest.state = 'failed';
  rec.failed += 1;
  rec.quests = rec.quests.filter((x) => x !== q);
  for (const id of posterMembers(w, quest.poster)) adjustTrust(w, id, subjectOfPlayer(player), -0.05);
}

/** Stores the quest with the next index as its id (offered) and logs quest-posted. The posting rules are in stepQuests. */
export function postQuest(w: WorldState, q: NewQuest): QuestId {
  const id = w.quests.length;
  w.quests.push({ ...q, id, state: 'offered', takenBy: null, takenTick: null, doneTick: null, progress: 0 });
  w.nextId.quest = w.quests.length;
  w.events.push({ kind: 'quest-posted', quest: id, template: q.template, region: q.region });
  return id;
}

export function questDaily(w: WorldState): Pick<DailyRow, 'marketInBand' | 'questsOpen' | 'questsDone' | 'templatesOffered' | 'outcomesMeasured' | 'outcomesReached'> {
  const [lo, hi] = w.tuning.quests.marketBand;
  const marketInBand = (['food', 'water', 'medicine', 'fuel'] as const).every((r) => {
    const ratio = w.market.price[r] / w.tuning.market.base[r];
    return ratio >= lo && ratio <= hi;
  });
  const offered = w.quests.filter((q) => q.state === 'offered');
  const measured = w.outcomes.filter((o) => o.reach !== null);
  return {
    marketInBand,
    questsOpen: offered.length,
    questsDone: w.quests.filter((q) => q.state === 'done').length,
    templatesOffered: QUEST_TEMPLATES.filter((t) => offered.some((q) => q.template === t)),
    outcomesMeasured: measured.length,
    outcomesReached: measured.filter((o) => o.reach !== null && (o.reach.rankChange || o.reach.havenChange || o.reach.marketOutOfBand)).length,
  };
}

export function questStartItems(q: Quest): ItemStack[] {
  const g = q.goal;
  return g.kind === 'visit' && g.item !== null ? [{ def: g.item, count: 1, condition: 1 }] : [];
}

export function questTitle(w: WorldState, q: Quest): string {
  return q.template === 'storylet' ? q.title : titleOf(w, q.template, q.goal);
}
