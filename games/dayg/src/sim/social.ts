// Memory and trust (society.md "Memory and trust"): trust ledger, witnessed deeds, rumours, standing, notoriety.
import type { Deed, Grudge, Npc, NpcId, NpcMemory, RegionId, Rumour, RumourFact, SubjectKey, TrustEntry, FactionId, PlayerKey, WorldState } from './types';
import type { Rng } from './rng';
import { npcsIn } from './world';

export function subjectOfNpc(id: NpcId): SubjectKey { return `n:${id}`; }
export function subjectOfPlayer(key: PlayerKey): SubjectKey { return `p:${key}`; }

export function memoryOf(w: WorldState, npc: NpcId): NpcMemory {
  if (!w.memory[npc]) w.memory[npc] = { entries: [] };
  return w.memory[npc];
}
export function entryOf(w: WorldState, npc: NpcId, s: SubjectKey): TrustEntry | null {
  return memoryOf(w, npc).entries.find((e) => e.s === s) ?? null;
}
export function trustOf(w: WorldState, npc: NpcId, s: SubjectKey): number {
  return entryOf(w, npc, s)?.trust ?? 0;
}

const clampTrust = (x: number): number => Math.max(-1, Math.min(1, x));
const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

/** Adds or updates the entry (trust clamped to -1..1); at most tuning.social.memoryCap entries, the weakest |trust| forgotten first. */
export function adjustTrust(w: WorldState, npc: NpcId, s: SubjectKey, delta: number): void {
  if (s === subjectOfNpc(npc)) return;
  const mem = memoryOf(w, npc);
  let e = mem.entries.find((x) => x.s === s);
  if (!e) {
    e = { s, trust: 0, debt: 0, grudge: null, seen: w.tick, heard: false };
    mem.entries.push(e);
  }
  let d = delta;
  if (d < 0) {
    const t: Npc['traits'] = w.npcs[npc].traits;
    d *= clamp(1 + t.paranoia - t.loyalty, 0.25, 2);
  }
  e.trust = clampTrust(e.trust + d);
  e.seen = w.tick;
  e.heard = false;
  const cap = w.tuning.social.memoryCap;
  while (mem.entries.length > cap) {
    let weakest = -1;
    for (let i = 0; i < mem.entries.length; i++) {
      const c = mem.entries[i];
      if (c.s === s) continue;
      if (weakest < 0) { weakest = i; continue; }
      const b = mem.entries[weakest];
      const ca = Math.abs(c.trust), ba = Math.abs(b.trust);
      if (ca < ba || (ca === ba && c.seen < b.seen)) weakest = i;
    }
    if (weakest < 0) break;
    mem.entries.splice(weakest, 1);
  }
}

const GRUDGE_OF: Partial<Record<Deed, Grudge>> = {
  stole: 'theft', betrayed: 'betrayal', robbed: 'robbed', threatened: 'attacked', 'killed-gnome': 'attacked',
};

/** Every alive NPC in `region` except `who` itself learns of the deed; a strong one becomes a rumour. */
export function witnessDeed(w: WorldState, who: SubjectKey, deed: Deed, region: RegionId, rng: Rng): void {
  void rng; // deterministic: no draws here
  const value = w.tuning.social.deed[deed];
  for (const npc of npcsIn(w, region)) {
    if (subjectOfNpc(npc.id) === who) continue;
    adjustTrust(w, npc.id, who, value);
    const grudge = GRUDGE_OF[deed];
    if (grudge) {
      const e = entryOf(w, npc.id, who);
      if (e) e.grudge = grudge;
    }
  }
  if (Math.abs(value) >= 0.2) startRumour(w, { kind: 'deed', who, deed }, region);
}

/** A fact spreading along the region graph from `origin`; drops the oldest rumour past tuning.social.rumoursMax. */
export function startRumour(w: WorldState, fact: RumourFact, origin: RegionId): void {
  const id = w.nextId.rumour++;
  w.rumours.push({ id, fact, origin, at: [origin], tick: w.tick, strength: 1 });
  w.events.push({ kind: 'rumour', rumour: id, region: origin });
  const max = w.tuning.social.rumoursMax;
  if (w.rumours.length > max) w.rumours.splice(0, w.rumours.length - max);
}

function hear(w: WorldState, r: Rumour, region: RegionId, hops: number): void {
  if (r.fact.kind !== 'deed') return;
  const { who, deed } = r.fact;
  const value = w.tuning.social.deed[deed] * Math.pow(w.tuning.social.rumourDiscount, hops);
  for (const npc of npcsIn(w, region)) {
    adjustTrust(w, npc.id, who, value);
    const e = entryOf(w, npc.id, who);
    if (e) e.heard = true;
  }
}

export function stepSocial(w: WorldState, rng: Rng): void {
  const soc = w.tuning.social;
  const tpd = w.tuning.clock.ticksPerDay;
  const chance = soc.rumourChance / tpd;
  for (const r of w.rumours) {
    for (const from of r.at.slice()) {
      for (const nb of w.graph.neighbours[from]) {
        if (r.at.includes(nb.to)) continue;
        if (!rng.chance(chance)) continue;
        r.at.push(nb.to);
        hear(w, r, nb.to, r.at.length - 1);
      }
    }
  }
  const maxAge = soc.rumourMaxDays * tpd;
  const kept = w.rumours.filter((r) => w.tick - r.tick <= maxAge);
  if (kept.length !== w.rumours.length) w.rumours.splice(0, w.rumours.length, ...kept);

  if (w.tick % tpd !== 0) return;
  for (let i = 0; i < w.memory.length; i++) {
    const mem = w.memory[i];
    if (!mem) continue;
    for (const e of mem.entries) {
      if (e.trust > 0) e.trust = Math.max(0, e.trust - soc.forgetPerDay);
      else if (e.trust < 0) e.trust = Math.min(0, e.trust + soc.forgetPerDay);
    }
    mem.entries = mem.entries.filter((e) => !(Math.abs(e.trust) < 0.01 && e.debt === 0));
  }
  const alive = w.npcs.filter((n) => n.alive);
  for (const key of Object.keys(w.players).sort()) {
    const s = subjectOfPlayer(key);
    let known = 0;
    for (const n of alive) if (entryOf(w, n.id, s)) known++;
    w.players[key].notoriety = alive.length === 0 ? 0 : known / alive.length;
  }
}

function membersOfFaction(w: WorldState, f: FactionId): NpcId[] {
  const faction = w.factions[f];
  if (!faction || faction.diedTick !== null) return [];
  const ids = new Set<NpcId>();
  for (const g of w.groups) {
    if (!faction.groups.includes(g.id)) continue;
    for (const id of g.members) if (w.npcs[id]?.alive) ids.add(id);
  }
  return [...ids].sort((a, b) => a - b);
}

/** -100..100: the mean trust of the faction's members who know the player, pulled toward the leader's trust. */
export function standingOf(w: WorldState, f: FactionId, player: PlayerKey): number {
  const faction = w.factions[f];
  if (!faction || faction.diedTick !== null) return 0;
  const s = subjectOfPlayer(player);
  const members = membersOfFaction(w, f);
  const known: { npc: NpcId; trust: number }[] = [];
  for (const id of members) {
    const e = entryOf(w, id, s);
    if (e) known.push({ npc: id, trust: e.trust });
  }
  if (known.length === 0) return 0;
  const mean = known.reduce((sum, k) => sum + k.trust, 0) / known.length;
  const leader = known.find((k) => k.npc === faction.leader);
  const leaderTrust = leader ? leader.trust : mean;
  const value = 100 * (mean + (leaderTrust - mean) * w.tuning.social.standingLeaderPull);
  return clamp(value, -100, 100);
}

/** Alive NPCs holding an entry for the player, strongest feeling first (|trust|), then id. */
export function knownBy(w: WorldState, player: PlayerKey): { npc: NpcId; trust: number }[] {
  const s = subjectOfPlayer(player);
  const out: { npc: NpcId; trust: number }[] = [];
  for (const n of w.npcs) {
    if (!n.alive) continue;
    const e = entryOf(w, n.id, s);
    if (e) out.push({ npc: n.id, trust: e.trust });
  }
  return out.sort((a, b) => Math.abs(b.trust) - Math.abs(a.trust) || a.npc - b.npc);
}
