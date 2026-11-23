// Memory and trust (society.md "Memory and trust"). Step 0 stub: keys, memory and trust are real; the rest waits for roadmap 7.1.
import type { Deed, NpcId, NpcMemory, Rumour, RumourFact, RegionId, SubjectKey, TrustEntry, FactionId, PlayerKey, WorldState } from './types';
import type { Rng } from './rng';

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
/** Adds or updates the entry (trust clamped to -1..1); at most tuning.social.memoryCap entries, the weakest |trust| forgotten first. */
export function adjustTrust(w: WorldState, npc: NpcId, s: SubjectKey, delta: number): void {
  const mem = memoryOf(w, npc);
  const clamp = (x: number): number => Math.max(-1, Math.min(1, x));
  const e = mem.entries.find((x) => x.s === s);
  if (e) { e.trust = clamp(e.trust + delta); e.seen = w.tick; e.heard = false; }
  else mem.entries.push({ s, trust: clamp(delta), debt: 0, grudge: null, seen: w.tick, heard: false });
  const cap = w.tuning.social.memoryCap;
  while (mem.entries.length > cap) {
    let weakest = 0;
    for (let i = 1; i < mem.entries.length; i++) if (Math.abs(mem.entries[i].trust) < Math.abs(mem.entries[weakest].trust)) weakest = i;
    mem.entries.splice(weakest, 1);
  }
}
export function witnessDeed(w: WorldState, who: SubjectKey, deed: Deed, region: RegionId, rng: Rng): void { /* roadmap 7.1 */ }
export function startRumour(w: WorldState, fact: RumourFact, origin: RegionId): void { /* roadmap 7.1 */ }
export function stepSocial(w: WorldState, rng: Rng): void { /* roadmap 7.1 */ }
export function standingOf(w: WorldState, f: FactionId, player: PlayerKey): number { return 0; }
export function knownBy(w: WorldState, player: PlayerKey): { npc: NpcId; trust: number }[] { return []; }
