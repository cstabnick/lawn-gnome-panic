// Scripted bot players for the headless sim (roadmap 7.7). Bots act only through applyAction, like a human player.
// Their private memory lives in a module-level WeakMap keyed by the world. Pure: no DOM, no Date, no Math.random.
import { MAP } from '../world/blockout';
import { assembleFullMap } from '../world/fullMap';
import { applyAction, tickWorld } from './actions';
import { HAVEN_REGION } from './regions';
import { questsNear } from './quests';
import { hatlessInRegion, hatlessThreat } from './horde';
import { districtOf } from './regionsFull';
import { createRng, hashString, type Rng, type Streams } from './rng';
import { TUNING } from './tuning';
import {
  type ActionEnvelope, type ActionResult, type ContainerState, type DailyRow, type DeathCause, type DistrictId,
  type MapKind, type NpcId, type PlayerKey, type Quest, type QuestId, type QuestTemplate, type RegionId, type SimAction,
  type Tuning, type WorldState,
} from './types';
import { createWorld, dayOf, endOfDay } from './world';

export type BotKind = 'quester' | 'scavenger' | 'solo' | 'friends';
export interface BotRow {
  seed: number; bot: PlayerKey; kind: BotKind; day: number; region: RegionId | null; alive: boolean; questsNear: number;
  templatesSeen: QuestTemplate[]; questsDone: number; districts: DistrictId[]; sessionOk: boolean | null; deaths: number;
  cause: DeathCause | null;
}

/** Window length of the session fit check, in ticks (roadmap 7.7 contract). */
const SESSION_TICKS = 9;
const DEATH_CHANCE = 0.02;

interface BotMem {
  key: PlayerKey; kind: BotKind; leader: PlayerKey | null; followers: PlayerKey[];
  region: RegionId; alive: boolean; deaths: number; cause: DeathCause | null; deathDay: number; deathTick: number | null;
  quest: QuestId | null; stage: number; path: RegionId[]; progress: number; questsDone: number;
  districts: DistrictId[]; visited: RegionId[]; seen: { tick: number; template: QuestTemplate }[];
  winDone: boolean; windows: { day: number; ok: boolean }[]; traded: boolean;
}
interface BotState { seq: number; bots: Record<PlayerKey, BotMem> }
const STATE = new WeakMap<WorldState, BotState>();

function stateOf(w: WorldState): BotState {
  let st = STATE.get(w);
  if (!st) { st = { seq: 0, bots: {} }; STATE.set(w, st); }
  return st;
}
function sessionTicks(w: WorldState): number { return Math.max(1, Math.round(w.tuning.bots.sessionHours * w.tuning.clock.ticksPerDay / 24)); }
function ticksPerHour(w: WorldState): number { return w.tuning.clock.ticksPerDay / 24; }
function isHaven(w: WorldState, r: RegionId): boolean { return w.graph.byId[r]?.traits.includes('HAVEN') ?? false; }

function newMem(w: WorldState, key: PlayerKey, kind: BotKind, region: RegionId): BotMem {
  return {
    key, kind, leader: null, followers: [], region, alive: true, deaths: 0, cause: null, deathDay: -1, deathTick: null,
    quest: null, stage: 0, path: [], progress: 0, questsDone: 0, districts: [districtOf(region)], visited: [], seen: [],
    winDone: false, windows: [], traded: false,
  };
}

function joinBot(w: WorldState, s: Streams, st: BotState, i: number, kind: BotKind): PlayerKey {
  const key = `bot:${i}`;
  const region: RegionId = 'gate-roof';
  applyAction(w, s, { tick: w.tick, seq: st.seq++, player: key, action: { kind: 'player-join', name: `Bot ${i}`, look: '', userId: null, region } });
  st.bots[key] = newMem(w, key, kind, region);
  return key;
}

export function addBots(w: WorldState, s: Streams, kinds: readonly BotKind[]): PlayerKey[] {
  const st = stateOf(w);
  const keys: PlayerKey[] = [];
  for (const kind of kinds) {
    if (kind === 'friends') {
      const group: PlayerKey[] = [];
      for (let k = 0; k < 3; k++) group.push(joinBot(w, s, st, keys.length + k, kind));
      const leader = st.bots[group[0]];
      leader.followers = group.slice(1);
      for (const f of group.slice(1)) st.bots[f].leader = leader.key;
      keys.push(...group);
    } else {
      keys.push(joinBot(w, s, st, keys.length, kind));
    }
  }
  return keys;
}

function setRegion(w: WorldState, b: BotMem, r: RegionId): void {
  b.region = r;
  const d = districtOf(r);
  if (!b.districts.includes(d)) b.districts.push(d);
  if (r !== HAVEN_REGION.tap) b.traded = false;
}

function stepTo(w: WorldState, b: BotMem, next: RegionId, emit: (a: SimAction) => ActionResult): void {
  emit({ kind: 'enter-region', region: next, alive: 0 });
  setRegion(w, b, next);
}

interface Search { dist: Map<RegionId, number>; parent: Map<RegionId, RegionId> }
/** Breadth-first over the graph. Regions with hatlessThreat above `limit` are skipped unless they are `goal`. */
function bfs(w: WorldState, from: RegionId, limit: number, goal: RegionId | null): Search {
  const dist = new Map<RegionId, number>([[from, 0]]);
  const parent = new Map<RegionId, RegionId>();
  const queue: RegionId[] = [from];
  for (let qi = 0; qi < queue.length; qi++) {
    const r = queue[qi];
    for (const nb of w.graph.neighbours[r] ?? []) {
      if (dist.has(nb.to)) continue;
      if (nb.to !== goal && hatlessThreat(w, nb.to) > limit) continue;
      dist.set(nb.to, (dist.get(r) ?? 0) + 1);
      parent.set(nb.to, r);
      queue.push(nb.to);
    }
  }
  return { dist, parent };
}
function pathTo(search: Search, from: RegionId, to: RegionId): RegionId[] | null {
  if (!search.dist.has(to)) return null;
  const path: RegionId[] = [];
  let cur = to;
  while (cur !== from) {
    path.unshift(cur);
    const p = search.parent.get(cur);
    if (p === undefined) return null;
    cur = p;
  }
  return path;
}

function waypoints(w: WorldState, q: Quest): RegionId[] {
  const g = q.goal;
  switch (g.kind) {
    case 'deliver': return [g.to];
    case 'clear': return [g.region];
    case 'find': return [g.region];
    case 'escort': return [g.from, g.to];
    case 'visit': return [g.region];
    case 'target': return [w.npcs.find((n) => n.id === g.npc)?.region ?? q.region];
    case 'steer': return [w.horde.herds.find((h) => h.id === g.herd)?.region ?? q.region];
    case 'teach': return [q.region];
    case 'storylet': return [g.region];
    default: return [q.region];
  }
}

function unopenedIn(w: WorldState, r: RegionId): ContainerState[] {
  return Object.keys(w.containers).sort().map((id) => w.containers[id])
    .filter((c) => c.region === r && !c.opened);
}

function openRegions(w: WorldState): Set<RegionId> {
  const out = new Set<RegionId>();
  for (const id of Object.keys(w.containers).sort()) {
    const c = w.containers[id];
    if (!c.opened) out.add(c.region);
  }
  return out;
}

/** Finishes the current quest's goal at its final waypoint. */
function actOnGoal(w: WorldState, b: BotMem, q: Quest, emit: (a: SimAction) => ActionResult, rng: Rng): void {
  const g = q.goal;
  const finish = (): void => {
    const r = emit({ kind: 'complete-quest', quest: q.id });
    if (r.ok) { b.questsDone++; b.winDone = true; }
    b.quest = null; b.path = []; b.stage = 0; b.progress = 0;
  };
  switch (g.kind) {
    case 'clear': {
      const left = hatlessInRegion(w, b.region);
      const n = Math.min(left, rng.round(w.tuning.bots.hatlessPerHour * ticksPerHour(w)));
      for (let i = 0; i < n; i++) emit({ kind: 'hatless-destroyed', region: b.region });
      b.progress += n;
      if (b.progress >= g.count) finish();
      return;
    }
    case 'deliver':
      for (const c of unopenedIn(w, b.region)) emit({ kind: 'open-container', id: c.id });
      emit({ kind: 'deliver', quest: q.id, resource: g.resource, count: g.count });
      finish();
      return;
    case 'find':
      emit({ kind: 'talk', input: { npc: g.npc, player: b.key, verb: 'greet' } });
      finish();
      return;
    case 'target':
      emit({ kind: 'talk', input: { npc: g.npc, player: b.key, verb: 'threaten' } });
      finish();
      return;
    case 'visit':
    case 'escort':
    case 'storylet':
      emit({ kind: 'quest-progress', quest: q.id, amount: 1 });
      finish();
      return;
    case 'steer':
      emit({ kind: 'noise', region: b.region, amount: 1 });
      finish();
      return;
    case 'teach':
      // Deviation from the contract's "then complete-quest": an abandoned teach quest cannot also be completed.
      emit({ kind: 'abandon-quest', quest: q.id });
      b.quest = null; b.path = []; b.stage = 0; b.progress = 0;
      return;
    default:
      finish();
  }
}

function questStep(w: WorldState, b: BotMem, limit: number, emit: (a: SimAction) => ActionResult, rng: Rng): void {
  const qid = b.quest;
  if (qid === null) return;
  const q = w.quests[qid];
  if (!q || q.state !== 'taken') { b.quest = null; b.path = []; return; }
  const wps = waypoints(w, q);
  const target = wps[Math.min(b.stage, wps.length - 1)];
  if (b.region !== target) {
    if (b.path.length === 0) {
      const p = pathTo(bfs(w, b.region, limit, target), b.region, target)
        ?? pathTo(bfs(w, b.region, Infinity, target), b.region, target);
      if (!p || p.length === 0) { emit({ kind: 'abandon-quest', quest: q.id }); b.quest = null; return; }
      b.path = p;
    }
    const next = b.path.shift();
    if (next !== undefined) stepTo(w, b, next, emit);
    return;
  }
  if (b.stage < wps.length - 1) { b.stage++; b.path = []; return; }
  actOnGoal(w, b, q, emit, rng);
}

/** Takes the best offered quest near the bot (reward acorns / (1 + hops)). Returns true when one was taken. */
function takeBest(w: WorldState, b: BotMem, emit: (a: SimAction) => ActionResult): boolean {
  const near = questsNear(w, b.region, w.tuning.bots.nearHops);
  if (near.length === 0) return false;
  const dist = bfs(w, b.region, Infinity, null).dist;
  let best: Quest | null = null;
  let bestScore = 0;
  for (const q of near) {
    const h = dist.get(q.region);
    if (h === undefined) continue;
    const score = q.reward.acorns / (1 + h);
    if (best === null || score > bestScore) { best = q; bestScore = score; }
  }
  if (best === null) return false;
  if (!emit({ kind: 'take-quest', quest: best.id }).ok) return false;
  b.quest = best.id; b.stage = 0; b.path = []; b.progress = 0;
  return true;
}

/** No quest: open the containers of each new region and walk toward the nearest region with containers not yet opened. */
function wander(w: WorldState, b: BotMem, limit: number, emit: (a: SimAction) => ActionResult, rng: Rng): void {
  const open = openRegions(w);
  if (open.has(b.region) && !b.visited.includes(b.region)) {
    b.visited.push(b.region);
    for (const c of unopenedIn(w, b.region)) emit({ kind: 'open-container', id: c.id });
    return;
  }
  const search = bfs(w, b.region, limit, null);
  let target: RegionId | null = null;
  for (const r of search.dist.keys()) {
    if (r !== b.region && open.has(r) && !b.visited.includes(r)) { target = r; break; }
  }
  if (target !== null) {
    const p = pathTo(search, b.region, target);
    if (p && p.length > 0) { stepTo(w, b, p[0], emit); return; }
  }
  const safe = (w.graph.neighbours[b.region] ?? []).map((n) => n.to).filter((r) => hatlessThreat(w, r) <= limit);
  if (safe.length > 0) stepTo(w, b, rng.pick(safe), emit);
}

/** One decision for one bot (its own key); `emit` applies an action as that bot and returns the result. */
function think(w: WorldState, s: Streams, b: BotMem, emit: (a: SimAction) => ActionResult): void {
  const tun: Tuning['bots'] = w.tuning.bots;
  const rng = s.bots;
  const limit = b.kind === 'solo' ? tun.riskLimit / 2 : tun.riskLimit;
  if (!b.alive) {
    emit({ kind: 'respawn', at: 'waystation', teacher: null });
    b.alive = true;
    setRegion(w, b, HAVEN_REGION.waystation);
    return;
  }
  const threat = hatlessThreat(w, b.region);
  if (threat > 0 && rng.chance(DEATH_CHANCE * threat)) {
    emit({ kind: 'player-died', cause: 'hatless', region: b.region, carried: [] });
    b.alive = false; b.deaths++; b.cause = 'hatless'; b.deathDay = dayOf(w.tick, w.tuning); b.deathTick = w.tick;
    b.quest = null; b.path = []; b.stage = 0; b.progress = 0;
    return;
  }
  const seenFrom = w.tick - sessionTicks(w);
  for (const q of questsNear(w, b.region, tun.nearHops)) b.seen.push({ tick: w.tick, template: q.template });
  b.seen = b.seen.filter((x) => x.tick > seenFrom);

  if (b.quest !== null) { questStep(w, b, limit, emit, rng); return; }
  if (b.kind === 'scavenger' && b.region === HAVEN_REGION.tap && !b.traded) {
    const npc = w.npcs.find((n) => n.alive && n.region === b.region);
    b.traded = true;
    if (npc) {
      const r = emit({ kind: 'talk', input: { npc: npc.id as NpcId, player: b.key, verb: 'trade', offer: { resource: 'food', count: 1 }, want: { resource: 'valuables', count: 0 }, acorns: -1 } });
      if (r.ok) b.winDone = true;
    }
    return;
  }
  if (b.kind !== 'scavenger' && takeBest(w, b, emit)) return;
  wander(w, b, limit, emit, rng);
}

/** Copies a leader's memory to a friend who moves with it. */
function mirror(src: BotMem, dst: BotMem): void {
  dst.region = src.region; dst.alive = src.alive; dst.deaths = src.deaths; dst.cause = src.cause;
  dst.deathDay = src.deathDay; dst.deathTick = src.deathTick; dst.quest = src.quest; dst.stage = src.stage;
  dst.path = [...src.path]; dst.progress = src.progress; dst.questsDone = src.questsDone;
  dst.districts = [...src.districts]; dst.visited = [...src.visited]; dst.seen = [...src.seen];
  dst.winDone = src.winDone; dst.windows = [...src.windows]; dst.traded = src.traded;
}

/** Friends replay the leader's actions under their own keys. */
function retarget(a: SimAction, key: PlayerKey): SimAction {
  if (a.kind === 'talk') return { kind: 'talk', input: { ...a.input, player: key } };
  return a;
}

export function stepBots(w: WorldState, s: Streams, bots: readonly PlayerKey[]): ActionEnvelope[] {
  const st = stateOf(w);
  const envs: ActionEnvelope[] = [];
  const send = (player: PlayerKey, action: SimAction): ActionResult => {
    const env: ActionEnvelope = { tick: w.tick, seq: st.seq++, player, action };
    envs.push(env);
    return applyAction(w, s, env);
  };
  for (const key of bots) {
    const b = st.bots[key];
    if (!b || b.leader !== null) continue;
    const mark = envs.length;
    think(w, s, b, (a) => send(b.key, a));
    const mine = envs.slice(mark);
    if (w.tick % SESSION_TICKS === SESSION_TICKS - 1) {
      b.windows.push({ day: dayOf(w.tick, w.tuning), ok: b.winDone && isHaven(w, b.region) });
      b.winDone = false;
    }
    for (const fk of b.followers) {
      const f = st.bots[fk];
      if (!f) continue;
      for (const e of mine) send(fk, retarget(e.action, fk));
      mirror(b, f);
    }
  }
  return envs;
}

export function botDaily(w: WorldState, bots: readonly PlayerKey[]): BotRow[] {
  const st = stateOf(w);
  const day = dayOf(w.tick - 1, w.tuning);
  const from = w.tick - sessionTicks(w);
  const rows: BotRow[] = [];
  for (const key of bots) {
    const b = st.bots[key];
    if (!b) continue;
    b.windows = b.windows.filter((x) => x.day >= day);
    const today = b.windows.filter((x) => x.day === day);
    const templates = new Set<QuestTemplate>(b.seen.filter((x) => x.tick > from).map((x) => x.template));
    rows.push({
      seed: w.seed, bot: key, kind: b.kind, day, region: b.region,
      alive: b.alive && b.deathDay !== day,
      questsNear: questsNear(w, b.region, w.tuning.bots.nearHops).length,
      templatesSeen: [...templates].sort(),
      questsDone: b.questsDone,
      districts: [...b.districts],
      sessionOk: today.length === 0 ? null : today.every((x) => x.ok),
      deaths: b.deaths,
      cause: b.deathDay === day ? b.cause : null,
    });
  }
  return rows;
}

export function runWithBots(seed: number, days: number, kinds: readonly BotKind[], opts?: { tuning?: Tuning; map?: MapKind; perturb?: boolean }):
  { world: WorldState; rows: DailyRow[]; bots: BotRow[] } {
  const tuning = opts?.tuning ?? TUNING;
  const containers = opts?.map === 'full' ? assembleFullMap().containers : MAP.containers;
  const { world: w, streams: s } = createWorld(seed, tuning, containers, { map: opts?.map });
  const keys = addBots(w, s, kinds);
  const out: BotRow[] = [];
  const total = days * w.tuning.clock.ticksPerDay;
  for (let i = 0; i < total; i++) {
    if (opts?.perturb && w.tick === 24) nullPerturb(w, createRng(hashString(`${seed}:perturb`)));
    stepBots(w, s, keys);
    const last = endOfDay(w);
    tickWorld(w, s);
    if (last) out.push(...botDaily(w, keys));
  }
  return { world: w, rows: w.daily, bots: out };
}

export function divergence(a: WorldState, b: WorldState): number {
  const n = Math.max(a.npcs.length, b.npcs.length);
  if (n === 0) return 0;
  let diff = 0;
  for (let i = 0; i < n; i++) {
    const x = a.npcs[i];
    const y = b.npcs[i];
    if (!x || !y) { diff++; continue; }
    if (x.alive !== y.alive || x.region !== y.region || x.groupId !== y.groupId) diff++;
  }
  return diff / n;
}

export function nullPerturb(w: WorldState, rng: Rng): void {
  const alive = w.npcs.filter((n) => n.alive);
  if (alive.length === 0) return;
  const npc = rng.pick(alive);
  const nb = w.graph.neighbours[npc.region] ?? [];
  if (nb.length === 0) return;
  npc.region = rng.pick(nb).to;
}

