// Talking to NPCs (quests.md "Talking to NPCs"). Eleven verbs, decided from the NPC's traits, trust and stock.
// `ok` means the verb took effect (an answer given, a trade made, a gift handed over); refusals are ok false.
import type {
  ItemStack, Npc, NpcId, PlayerKey, PlayerRecord, Quest, QuestId, RegionId, Resource, TalkInput, TalkResult, TalkVerb, WorldState,
} from './types';
import { RESOURCES, TALK_VERBS } from './types';
import { adjustTrust, entryOf, subjectOfNpc, subjectOfPlayer, trustOf, witnessDeed } from './social';
import { factionOf, joinFaction } from './factions';
import { postQuest, questTitle, questsNear, type NewQuest } from './quests';
import { hatlessThreat } from './horde';
import { priceOf } from './market';
import { itemsWith } from '../items/defs';
import type { Rng } from './rng';

const HOSTILE_AT = -0.6;

function playerOf(w: WorldState, key: PlayerKey): PlayerRecord | null { return w.players[key] ?? null; }

/** The NPC can be talked to: alive, and in the same region as the player. */
function reachable(w: WorldState, npc: NpcId, player: PlayerKey): boolean {
  const n = w.npcs[npc];
  const p = playerOf(w, player);
  return !!n && n.alive && !!p && p.region !== null && p.region === n.region;
}

function dayOf(w: WorldState): number { return Math.floor(w.tick / w.tuning.clock.ticksPerDay) + 1; }

/** Every region within `maxHops` graph steps of `from`, including `from`. */
function regionsWithin(w: WorldState, from: RegionId, maxHops: number): Set<RegionId> {
  const seen = new Set<RegionId>([from]);
  let frontier: RegionId[] = [from];
  for (let h = 0; h < maxHops; h++) {
    const next: RegionId[] = [];
    for (const r of frontier) {
      for (const nb of w.graph.neighbours[r] ?? []) {
        if (!seen.has(nb.to)) { seen.add(nb.to); next.push(nb.to); }
      }
    }
    frontier = next;
  }
  return seen;
}

function largestCarried(npc: Npc): Resource | null {
  let best: Resource | null = null;
  for (const r of RESOURCES) if (npc.carried[r] > 0 && (best === null || npc.carried[r] > npc.carried[best])) best = r;
  return best;
}

/** One single-count stack per unit, the first item of that resource. */
function stacksOf(res: Resource, count: number): ItemStack[] {
  const def = itemsWith(res)[0];
  if (!def || count <= 0) return [];
  return Array.from({ length: count }, () => ({ def: def.id, count: 1, condition: 1 }));
}

function dangerWord(threat: number): string {
  if (threat < 0.2) return 'quiet';
  if (threat < 1) return 'busy';
  if (threat < 2.5) return 'bad';
  return 'thick with them';
}

function greetBand(t: number): string {
  if (t <= -0.5) return 'greet.hostile';
  if (t < 0) return 'greet.wary';
  if (t >= 0.6) return 'greet.close';
  if (t >= 0.3) return 'greet.friendly';
  return 'greet.neutral';
}

/** Per unit: what the NPC asks from the player for a resource it sells. */
function askPrice(w: WorldState, npc: Npc, res: Resource, t: number): number {
  const x = priceOf(w, res) * (1 + 0.5 * npc.traits.greed);
  return t >= 0.2 ? x * 0.9 : x;
}
/** Per unit: what the NPC pays the player for a resource it buys. */
function bidPrice(w: WorldState, npc: Npc, res: Resource, t: number): number {
  const x = priceOf(w, res) * (1 - 0.3 * npc.traits.greed);
  return t >= 0.2 ? x * 1.1 : x;
}

/** Why a verb is closed to this NPC right now (null = open). Shared by verbsFor and talk. */
function verbBlock(w: WorldState, npc: Npc, player: PlayerKey, verb: TalkVerb, t: number): string | null {
  const p = playerOf(w, player);
  if (verb !== 'greet' && t <= HOSTILE_AT) return 'hostile';
  switch (verb) {
    case 'greet': return null;
    case 'ask': return t >= -0.3 ? null : 'will not talk';
    case 'trade': return npc.acorns > 0 || RESOURCES.some((r) => npc.carried[r] > 0) ? null : 'nothing to trade';
    case 'offer-help': return null;
    case 'ask-help': return t >= 0.3 && npc.traits.greed < 0.6 && npc.carried.food >= 1 ? null : 'will not give';
    case 'recruit':
      if (!p || p.faction === null) return 'you have no faction';
      if (factionOf(w, npc)) return 'already in a faction';
      return t >= 0.4 && npc.traits.sociability >= 0.4 ? null : 'not yet';
    case 'join': return factionOf(w, npc) ? null : 'no faction to join';
    case 'threaten':
    case 'rob':
    case 'share-food':
    case 'warn': return null;
  }
}

export function verbsFor(w: WorldState, npc: NpcId, player: PlayerKey): { verb: TalkVerb; ok: boolean; why: string | null }[] {
  const n = w.npcs[npc];
  return TALK_VERBS.map((verb) => {
    if (!n || !reachable(w, npc, player)) return { verb, ok: false, why: 'away' };
    const why = verbBlock(w, n, player, verb, trustOf(w, npc, subjectOfPlayer(player)));
    return { verb, ok: why === null, why };
  });
}

/** The newcomer-style supply run an NPC posts when it is short of food (quests.md "offer-help"). */
function supplyRun(w: WorldState, npc: Npc): NewQuest {
  return {
    template: 'supply-run',
    title: `Bring food to ${w.graph.byId[npc.region].name}`,
    poster: subjectOfNpc(npc.id),
    board: null,
    region: npc.region,
    goal: { kind: 'deliver', resource: 'food', count: 2, to: npc.region },
    reward: { acorns: Math.min(3, npc.acorns), items: [], trust: 0 },
    postedTick: w.tick,
    deadline: w.tick + 2 * w.tuning.clock.ticksPerDay,
    rival: null,
  };
}

export function talk(w: WorldState, input: TalkInput, rng: Rng): TalkResult {
  const npc = w.npcs[input.npc];
  const p = playerOf(w, input.player);
  const subj = subjectOfPlayer(input.player);
  const t0 = npc ? trustOf(w, input.npc, subj) : 0;
  const r: TalkResult = { ok: false, lines: [], trustDelta: 0, give: [], take: [], acorns: 0, quest: null, joined: null, hostile: false };
  const finish = (): TalkResult => {
    r.trustDelta = npc ? trustOf(w, input.npc, subj) - t0 : 0;
    return r;
  };
  if (!npc || !reachable(w, input.npc, input.player) || !p) {
    r.lines.push({ key: 'talk.away', vars: { name: npc?.name ?? '' } });
    return finish();
  }
  const vars = (extra: Record<string, string | number>): Record<string, string | number> => ({
    name: npc.name, player: p.name, region: w.graph.byId[npc.region].name, ...extra,
  });
  const say = (key: string, extra: Record<string, string | number> = {}): void => { r.lines.push({ key, vars: vars(extra) }); };
  const refuse = (key: string, extra: Record<string, string | number> = {}): TalkResult => { say(key, extra); return finish(); };
  /** The NPC fled or turned on the player. */
  const turnOn = (key: string): TalkResult => { r.hostile = true; say(key); return finish(); };

  if (input.verb !== 'greet' && t0 <= HOSTILE_AT) return turnOn('talk.hostile');

  switch (input.verb) {
    case 'greet': {
      const key = `greet:${input.npc}:${input.player}:${dayOf(w)}`;
      if (!w.flags[key]) { w.flags[key] = true; adjustTrust(w, input.npc, subj, 0.02); }
      say(greetBand(t0));
      r.ok = true;
      return finish();
    }

    case 'ask': {
      if (t0 < -0.3 || !input.topic) return refuse('ask.refuse');
      const topic = input.topic;
      if (topic.about === 'place') {
        say('ask.place', { region: w.graph.byId[topic.region].name, danger: dangerWord(hatlessThreat(w, topic.region)) });
      } else if (topic.about === 'gnome') {
        const o = w.npcs[topic.npc];
        if (!o || !o.alive) say('ask.unknown');
        else say('ask.gnome', { other: o.name, region: w.graph.byId[o.region].name });
      } else if (topic.about === 'price') {
        say('ask.price', { resource: topic.resource, price: Math.round(priceOf(w, topic.resource) * 10) / 10 });
      } else {
        let best: { size: number; region: RegionId } | null = null;
        const near = regionsWithin(w, npc.region, 2);
        for (const h of w.horde.herds) {
          if (near.has(h.region) && (best === null || h.size > best.size)) best = { size: h.size, region: h.region };
        }
        if (best) say('ask.herd', { size: best.size, region: w.graph.byId[best.region].name });
        else say('ask.noherd');
      }
      r.ok = true;
      return finish();
    }

    case 'trade': {
      const offer = input.offer;
      const want = input.want;
      if (!offer || !want || offer.count <= 0 || want.count <= 0) return refuse('trade.refuse');
      const pays = input.acorns ?? 0;   // + the player adds acorns, - the player asks for acorns
      const value = offer.count * bidPrice(w, npc, offer.resource, t0) + pays;
      const need = want.count * askPrice(w, npc, want.resource, t0);
      const haveOffer = (input.carried?.[offer.resource] ?? 0) >= offer.count;
      const playerPays = pays <= 0 || p.acorns >= pays;
      const npcPays = pays >= 0 || npc.acorns >= -pays;
      const npcHas = npc.carried[want.resource] >= want.count;
      if (!haveOffer || !playerPays || !npcPays || !npcHas || value < need) return refuse('trade.refuse');
      npc.carried[offer.resource] += offer.count;
      w.ledger.givenByPlayer[offer.resource] += offer.count;
      npc.carried[want.resource] -= want.count;
      w.ledger.removedByPlayer[want.resource] += want.count;
      npc.acorns += pays;
      p.acorns -= pays;
      r.acorns = -pays;
      r.give = stacksOf(want.resource, want.count);
      r.take = [{ resource: offer.resource, count: offer.count }];
      say('trade.accept', { count: want.count, resource: want.resource });
      r.ok = true;
      return finish();
    }

    case 'offer-help': {
      const f = factionOf(w, npc);
      let q: Quest | undefined;
      if (f) q = questsNear(w, npc.region, 1).find((x) => x.poster === `f:${f.id}` && x.state === 'offered');
      if (!q && npc.carried.food < 2) q = w.quests[postQuest(w, supplyRun(w, npc))];
      if (!q) return refuse('help.none');
      r.quest = q.id;
      say('help.quest', { title: questTitle(w, q) });
      r.ok = true;
      return finish();
    }

    case 'ask-help': {
      if (t0 < 0.3 || npc.traits.greed >= 0.6 || npc.carried.food < 1) return refuse('askhelp.refuse');
      npc.carried.food -= 1;
      w.ledger.removedByPlayer.food += 1;
      r.give = stacksOf('food', 1);
      adjustTrust(w, input.npc, subj, 0);
      const e = entryOf(w, input.npc, subj);
      if (e) e.debt += 1;
      say('askhelp.give');
      r.ok = true;
      return finish();
    }

    case 'recruit': {
      const f = p.faction === null ? undefined : w.factions.find((x) => x.id === p.faction);
      if (!f || factionOf(w, npc) || t0 < 0.4 || npc.traits.sociability < 0.4) return refuse('recruit.refuse');
      const gid = f.groups[0] ?? null;
      npc.groupId = gid;
      if (gid !== null) {
        const g = w.groups.find((x) => x.id === gid);
        if (g && !g.members.includes(input.npc)) g.members.push(input.npc);
      }
      npc.region = f.home;
      r.joined = f.id;
      say('recruit.ok', { faction: f.name });
      r.ok = true;
      return finish();
    }

    case 'join': {
      const f = factionOf(w, npc);
      if (!f || !joinFaction(w, f.id, input.player)) return refuse('join.refuse');
      r.joined = f.id;
      say('join.ok', { faction: f.name });
      r.ok = true;
      return finish();
    }

    case 'threaten': {
      const armed = (input.carried?.tools ?? 0) >= 1;
      witnessDeed(w, subj, 'threatened', npc.region, rng);
      if (armed && npc.traits.boldness < 0.5) {
        const res = largestCarried(npc);
        if (res) {
          npc.carried[res] -= 1;
          w.ledger.removedByPlayer[res] += 1;
          r.give = stacksOf(res, 1);
        }
        say('threaten.give', { resource: res ?? 'nothing' });
        r.ok = true;
        return finish();
      }
      r.hostile = true;
      say('threaten.fight');
      return finish();
    }

    case 'rob': {
      const success = rng.chance(0.5 * (1 - npc.traits.boldness));
      witnessDeed(w, subj, 'robbed', npc.region, rng);
      adjustTrust(w, input.npc, subj, w.tuning.social.deed.robbed);
      const e = entryOf(w, input.npc, subj);
      if (e) e.grudge = 'robbed';
      const res = largestCarried(npc);
      if (success && res) {
        const n = Math.min(2, npc.carried[res]);
        npc.carried[res] -= n;
        w.ledger.removedByPlayer[res] += n;
        r.give = stacksOf(res, n);
        say('rob.ok', { count: n, resource: res });
        r.ok = true;
        return finish();
      }
      say('rob.caught');
      r.hostile = true;
      return finish();
    }

    case 'share-food': {
      const o = input.offer;
      if (!o || o.resource !== 'food' || o.count <= 0 || (input.carried?.food ?? 0) < o.count) return refuse('talk.short');
      npc.carried.food += o.count;
      w.ledger.givenByPlayer.food += o.count;
      r.take = [{ resource: 'food', count: o.count }];
      adjustTrust(w, input.npc, subj, Math.min(0.4, 0.2 * o.count));
      witnessDeed(w, subj, 'shared-food', npc.region, rng);
      say('share.thanks', { count: o.count });
      r.ok = true;
      return finish();
    }

    case 'warn': {
      if (input.warnOf !== input.npc) return refuse('warn.none');
      adjustTrust(w, input.npc, subj, 0.15);
      witnessDeed(w, subj, 'warned', npc.region, rng);
      for (const q of w.quests) {
        if (q.goal.kind !== 'target' || q.goal.npc !== input.npc) continue;
        if (q.state === 'offered') q.state = 'failed';
        else if (q.state === 'taken') {
          q.state = 'failed';
          const holder = q.takenBy === null ? undefined : w.players[q.takenBy];
          if (holder) {
            holder.quests = holder.quests.filter((id: QuestId) => id !== q.id);
            holder.failed += 1;
          }
        }
      }
      const f = factionOf(w, npc);
      if (f) npc.region = f.home;
      say('warn.thanks');
      r.ok = true;
      return finish();
    }
  }
  return finish();
}
