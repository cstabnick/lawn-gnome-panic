// Applies one sequenced action to the world (every change a player makes) and runs the per-tick step.
// Pure: no DOM, no Date, no Math.random. Replaying the same envelopes on a copy gives the same world hash.
import { getItem } from '../items/defs';
import type { ActionEnvelope, ActionResult, ItemStack, PlayerRecord, Quest, RegionId, SimAction, TickResult, WorldState } from './types';
import { HAVEN_REGION } from './regions';
import type { Streams } from './rng';
import { destroyInBubble, enterRegion, absorbBubbles } from './bubbles';
import { rollContainer } from './loot';
import { addNoise } from './horde';
import { progressQuest, takeQuest, deliver, completeQuest, abandonQuest, questStartItems } from './quests';
import { talk } from './talk';
import { joinFaction, leaveFaction } from './factions';
import { placePiece, damagePiece, removePiece, checkSnare } from './build';
import { plantBed, waterBed, tendBed, harvestBed } from './farming';
import { subjectOfPlayer, witnessDeed } from './social';
import { hashWorld, recordPlayerTake, stepWorld } from './world';

function fail(error: string): ActionResult { return { ok: false, error }; }
function questOf(w: WorldState, id: number): Quest | null { return w.quests.find((q) => q.id === id) ?? null; }
function neighboursOf(w: WorldState, r: RegionId): RegionId[] { return (w.graph.neighbours[r] ?? []).map((n) => n.to); }

/** Regions within `hops` edges of `r` (r included), in graph order. */
function regionsWithin(w: WorldState, r: RegionId, hops: number): RegionId[] {
  const dist = new Map<RegionId, number>([[r, 0]]);
  const queue: RegionId[] = [r];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    const d = dist.get(cur) ?? 0;
    if (d >= hops) continue;
    for (const nb of neighboursOf(w, cur)) if (!dist.has(nb)) { dist.set(nb, d + 1); queue.push(nb); }
  }
  return w.graph.regions.map((g) => g.id).filter((id) => dist.has(id));
}

function join(w: WorldState, p: string, a: Extract<SimAction, { kind: 'player-join' }>): ActionResult {
  if (a.region !== null && !w.graph.byId[a.region]) return fail(`no region ${a.region}`);
  let rec = w.players[p];
  if (!rec) {
    rec = {
      key: p, name: a.name, look: a.look, userId: a.userId, region: null, online: true,
      joinedTick: w.tick, lastTick: w.tick, acorns: 0, faction: null, notoriety: 0, quests: [],
      done: 0, failed: 0, deaths: 0, skills: {}, bed: null,
    };
    w.players[p] = rec;
  } else {
    rec.name = a.name; rec.look = a.look; rec.userId = a.userId;
  }
  rec.online = true;
  rec.lastTick = w.tick;
  enterRegion(w, p, a.region, 0);
  rec.region = a.region;
  return { ok: true };
}

function died(w: WorldState, p: string, rec: PlayerRecord, a: Extract<SimAction, { kind: 'player-died' }>): ActionResult {
  if (a.region !== null && !w.graph.byId[a.region]) return fail(`no region ${a.region}`);
  const where = a.region ?? rec.region;
  if (where === null) return fail('player-died needs a region');
  const bodyId = `body-${p}-${w.tick}`;
  if (w.containers[bodyId]) return fail(`body ${bodyId} exists`);
  rec.deaths += 1;
  for (const q of [...rec.quests]) abandonQuest(w, q, p);
  const key = subjectOfPlayer(p);
  for (const m of w.memory) if (m) for (const e of m.entries) if (e.s === key) e.trust *= 0.5;
  const contents: ItemStack[] = a.carried.filter((st) => st.count > 0).map((st) => ({ ...st }));
  for (const st of contents) w.ledger.givenByPlayer[getItem(st.def).resource] += st.count;
  w.containers[bodyId] = { id: bodyId, region: where, type: 'body', opened: true, contents };
  w.horde.density[where] += 1;
  w.ledger.hatlessRisen += 1;
  enterRegion(w, p, null, 0);
  return { ok: true };
}

export function applyAction(w: WorldState, s: Streams, env: ActionEnvelope): ActionResult {
  const a = env.action;
  const p = env.player;
  if (a.kind === 'player-join') return join(w, p, a);
  const rec = w.players[p];
  if (!rec) return fail(`unknown player ${p}`);
  switch (a.kind) {
    case 'player-leave':
      enterRegion(w, p, null, 0);
      rec.online = false;
      rec.lastTick = w.tick;
      return { ok: true };
    case 'enter-region':
      if (a.region !== null && !w.graph.byId[a.region]) return fail(`no region ${a.region}`);
      enterRegion(w, p, a.region, a.alive);
      rec.region = a.region;
      rec.lastTick = w.tick;
      return { ok: true };
    case 'open-container':
      if (!w.containers[a.id]) return fail(`no container ${a.id}`);
      return { ok: true, items: rollContainer(w, a.id, s.loot) };
    case 'player-take':
      if (a.stack.count <= 0) return fail('empty stack');
      recordPlayerTake(w, a.stack);
      return { ok: true };
    case 'hatless-destroyed': {
      if (!w.graph.byId[a.region]) return fail(`no region ${a.region}`);
      if (!destroyInBubble(w, a.region)) return fail('no hatless to destroy here');
      for (const id of [...rec.quests]) {
        const q = questOf(w, id);
        if (q && q.goal.kind === 'clear' && q.goal.region === a.region) progressQuest(w, id, p, 1);
      }
      return { ok: true };
    }
    case 'noise': {
      if (!w.graph.byId[a.region]) return fail(`no region ${a.region}`);
      if (a.amount <= 0) return fail('noise must be positive');
      addNoise(w, a.region, a.amount);
      const near = [a.region, ...neighboursOf(w, a.region)];
      for (const id of [...rec.quests]) {
        const q = questOf(w, id);
        if (!q || q.goal.kind !== 'steer') continue;
        const goal = q.goal;
        const herd = w.horde.herds.find((h) => h.id === goal.herd);
        if (herd && near.includes(herd.region)) progressQuest(w, id, p, 1);
      }
      return { ok: true };
    }
    case 'talk': {
      const npc = w.npcs[a.input.npc];
      if (!npc) return fail(`no npc ${a.input.npc}`);
      const res = talk(w, { ...a.input, player: p }, s.social);
      if (!res.ok) return { ok: false, error: 'talk refused', talk: res };
      const hostile = a.input.verb === 'threaten' || a.input.verb === 'rob';
      for (const id of [...rec.quests]) {
        const q = questOf(w, id);
        if (!q) continue;
        const g = q.goal;
        const bounty = hostile && g.kind === 'target' && g.npc === npc.id;
        const find = g.kind === 'find' && g.npc === npc.id;
        const storylet = g.kind === 'storylet' && g.region === npc.region;
        if (find || bounty || storylet) progressQuest(w, id, p, 1);
      }
      return { ok: true, talk: res };
    }
    case 'take-quest': {
      const q = questOf(w, a.quest);
      if (!q) return fail(`no quest ${a.quest}`);
      if (!takeQuest(w, a.quest, p)) return fail('cannot take quest');
      return { ok: true, quest: a.quest, items: questStartItems(q) };
    }
    case 'quest-progress':
      if (!questOf(w, a.quest)) return fail(`no quest ${a.quest}`);
      progressQuest(w, a.quest, p, a.amount);
      return { ok: true };
    case 'deliver':
      if (!questOf(w, a.quest)) return fail(`no quest ${a.quest}`);
      if (deliver(w, a.quest, p, a.resource, a.count) <= 0) return fail('nothing delivered');
      return { ok: true, quest: a.quest };
    case 'complete-quest': {
      if (!questOf(w, a.quest)) return fail(`no quest ${a.quest}`);
      const reward = completeQuest(w, a.quest, p);
      if (!reward) return fail('cannot complete quest');
      return { ok: true, quest: a.quest, items: reward.items };
    }
    case 'abandon-quest':
      if (!questOf(w, a.quest)) return fail(`no quest ${a.quest}`);
      abandonQuest(w, a.quest, p);
      return { ok: true };
    case 'join-faction':
      if (!joinFaction(w, a.faction, p)) return fail('cannot join faction');
      return { ok: true };
    case 'leave-faction':
      leaveFaction(w, p);
      return { ok: true };
    case 'player-died':
      return died(w, p, rec, a);
    case 'respawn': {
      const r = HAVEN_REGION[a.at];
      if (!r || !w.graph.byId[r]) return fail(`no haven ${a.at}`);
      rec.region = r;
      rec.lastTick = w.tick;
      enterRegion(w, p, r, 0);
      return { ok: true };
    }
    case 'set-skills':
      rec.skills = { ...a.skills };
      return { ok: true };
    case 'build': {
      if (!w.graph.byId[a.piece.region]) return fail(`no region ${a.piece.region}`);
      if (w.tuning.build.hp[a.piece.kind] === undefined) return fail(`no piece kind ${a.piece.kind}`);
      return { ok: true, piece: placePiece(w, a.piece, `p:${p}`).id };
    }
    case 'damage-piece':
      if (!w.pieces.some((x) => x.id === a.id)) return fail(`no piece ${a.id}`);
      damagePiece(w, a.id, a.amount);
      return { ok: true };
    case 'remove-piece':
      if (!w.pieces.some((x) => x.id === a.id)) return fail(`no piece ${a.id}`);
      removePiece(w, a.id);
      return { ok: true };
    case 'plant':
      if (!plantBed(w, a.bed, a.crop)) return fail('cannot plant');
      return { ok: true };
    case 'water-bed':
      if (a.litres <= 0) return fail('litres must be positive');
      waterBed(w, a.bed, a.litres);
      return { ok: true };
    case 'tend-bed':
      tendBed(w, a.bed);
      return { ok: true };
    case 'harvest':
      return { ok: true, items: harvestBed(w, a.bed) };
    case 'check-snare':
      return { ok: true, items: checkSnare(w, a.piece) };
    case 'ring-bell': {
      if (!w.graph.byId[a.region]) return fail(`no region ${a.region}`);
      w.bellTick = w.tick;
      for (const r of regionsWithin(w, a.region, w.tuning.bell.hops)) addNoise(w, r, w.tuning.bell.noise);
      witnessDeed(w, `p:${p}`, 'rang-bell', a.region, s.social);
      w.events.push({ kind: 'bell', region: a.region });
      return { ok: true };
    }
    case 'light-lantern': {
      w.lanterns[a.id] = true;
      for (const id of [...rec.quests]) {
        const q = questOf(w, id);
        if (q && q.goal.kind === 'storylet' && q.goal.storylet === 'last-sexton') progressQuest(w, id, p, 1);
      }
      return { ok: true };
    }
    default:
      return fail('unknown action');
  }
}

export function tickWorld(w: WorldState, s: Streams): TickResult {
  stepWorld(w, s);
  const arrivals = absorbBubbles(w);
  return { tick: w.tick, arrivals, hash: hashWorld(w) };
}
