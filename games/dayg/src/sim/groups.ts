// Groups: NPCs in a region form packs and bands when being together pays, leave when it stops paying, and big groups
// split (fission). The aggregate rules of docs/design/dayg/society.md "At L2". Pure: no DOM; all randomness from the rng passed in.
import type { Rng } from './rng';
import { endOfDay } from './world';
import type { Group, Npc, RegionId, WorldState } from './types';

function sigmoid(x: number): number { return 1 / (1 + Math.exp(-x)); }

/** Value of a group of size n in region z for NPC i. withSafety=false gives V_alone (n = 1, no safety term). */
function groupValue(w: WorldState, npc: Npc, n: number, z: RegionId, withSafety = true): number {
  const t = w.tuning.groups;
  const traits = w.graph.byId[z].traits;
  const sZ = 1 + (traits.includes('COVER') || traits.includes('HIGH') ? 0.5 : 0);
  const open = traits.includes('OPEN') ? 0.5 : 0;
  const safety = withSafety ? t.safetyS * sZ * (1 - Math.exp(-n / 4)) * (n === 2 ? 0.5 : 1) : 0;
  const work = t.work * Math.min(n, t.roles);
  const belonging = 0.1 * npc.traits.sociability * Math.min(n, 8);
  const share = t.shareF * n * (0.5 + npc.traits.greed);
  const signature = t.sigma * Math.pow(n, 0.7) * (1 + open);
  const strain = t.strainK * Math.pow(Math.max(0, n - t.dunbarBase), 2) * (0.5 + npc.traits.paranoia);
  return safety + work + belonging - share - signature - strain;
}
function valueAlone(w: WorldState, npc: Npc): number { return groupValue(w, npc, 1, npc.region, false); }

function surnameOf(npc: Npc): string {
  const parts = npc.name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? npc.name;
}
function sizeWord(n: number): string { return n > 25 ? 'settlement' : n > 8 ? 'band' : 'pack'; }
function renameForSize(g: Group): void {
  const word = sizeWord(g.members.length);
  if (/ (pack|band|settlement)$/.test(g.name)) g.name = g.name.replace(/(pack|band|settlement)$/, word);
  else g.name = `${g.name} ${word}`;
}

/** Boldest of the given ids (ties: lowest id). */
function boldest(w: WorldState, ids: readonly number[]): number {
  let best = ids[0];
  for (const id of ids) {
    const b = w.npcs[id].traits.boldness;
    const cur = w.npcs[best].traits.boldness;
    if (b > cur || (b === cur && id < best)) best = id;
  }
  return best;
}

function removeGroup(w: WorldState, g: Group): void {
  const gi = w.groups.indexOf(g);
  if (gi !== -1) w.groups.splice(gi, 1);
  for (const id of g.members) if (w.npcs[id].groupId === g.id) w.npcs[id].groupId = null;
  g.members = [];
  w.events.push({ kind: 'group-dissolved', group: g.id, region: g.region });
}

function leaveGroup(w: WorldState, g: Group, npc: Npc): void {
  g.members = g.members.filter((id) => id !== npc.id);
  npc.groupId = null;
  if (g.members.length < 2) { removeGroup(w, g); return; }
  if (g.leader === npc.id) g.leader = boldest(w, g.members);
  renameForSize(g);
}

function newGroup(w: WorldState, founder: Npc, members: number[], region: RegionId): Group {
  const g: Group = {
    id: w.nextId.group++,
    name: `the ${surnameOf(founder)} pack`,
    members: [...members].sort((a, b) => a - b),
    leader: boldest(w, members),
    region,
    formedTick: w.tick,
  };
  for (const id of g.members) w.npcs[id].groupId = g.id;
  renameForSize(g);
  w.groups.push(g);
  return g;
}

/** Keep members with their leader and drop anything stale (dead members, missing ids). */
function syncGroups(w: WorldState): void {
  for (const g of [...w.groups]) {
    g.members = g.members.filter((id) => w.npcs[id]?.alive && w.npcs[id].groupId === g.id);
    if (g.members.length < 2) { removeGroup(w, g); continue; }
    if (!g.members.includes(g.leader)) g.leader = boldest(w, g.members);
    g.region = w.npcs[g.leader].region;
    for (const id of g.members) w.npcs[id].region = g.region;
  }
}

function decide(w: WorldState, rng: Rng): void {
  const t = w.tuning.groups;
  for (const npc of w.npcs) {
    if (!npc.alive) continue;
    const g = groupOf(w, npc);
    if (g) {
      const n = g.members.length;
      const p = Math.max(0, sigmoid(t.a * (valueAlone(w, npc) - groupValue(w, npc, n, g.region)) - t.d * 0.5) - 0.5);
      if (p > 0 && rng.chance(p)) leaveGroup(w, g, npc);
      continue;
    }
    // Alone: join the best group in the region, or pair up with another loner.
    const vAlone = valueAlone(w, npc);
    const bias = t.b * npc.traits.sociability - t.c * npc.traits.paranoia;
    let best: Group | null = null;
    let bestV = -Infinity;
    for (const cand of w.groups) {
      if (cand.region !== npc.region) continue;
      const v = groupValue(w, npc, cand.members.length + 1, cand.region);
      if (v > bestV) { bestV = v; best = cand; }
    }
    if (best) {
      const p = Math.max(0, sigmoid(t.a * (bestV - vAlone) + bias) - 0.5);
      if (p > 0 && rng.chance(p)) {
        best.members.push(npc.id);
        best.members.sort((a, b) => a - b);
        npc.groupId = best.id;
        renameForSize(best);
      }
      continue;
    }
    const other = w.npcs.find((o) => o.alive && o.id !== npc.id && o.groupId === null && o.region === npc.region);
    if (!other) continue;
    const p = Math.max(0, sigmoid(t.a * (groupValue(w, npc, 2, npc.region) - vAlone) + bias) - 0.5);
    if (p > 0 && rng.chance(p)) {
      const ng = newGroup(w, npc, [npc.id, other.id], npc.region);
      w.events.push({ kind: 'group-formed', group: ng.id, region: ng.region, size: ng.members.length });
    }
  }
}

function fission(w: WorldState, rng: Rng): void {
  const t = w.tuning.groups;
  const D = t.dunbarBase;
  for (const g of [...w.groups]) {
    const n = g.members.length;
    if (n <= D) continue;
    if (!rng.chance((t.fissionQ * (n - D)) / n)) continue;
    const others = g.members.filter((id) => id !== g.leader);
    const splitter = boldest(w, others);
    const rest = others.filter((id) => id !== splitter).sort((a, b) => a - b);
    const leaving = [splitter];
    for (let i = 0; i < rest.length; i++) if (i % 2 === 1) leaving.push(rest[i]);
    g.members = g.members.filter((id) => !leaving.includes(id));
    renameForSize(g);
    const ng = newGroup(w, w.npcs[splitter], leaving, g.region);
    ng.leader = splitter;
    w.events.push({ kind: 'group-split', group: g.id, newGroup: ng.id, region: g.region });
  }
}

export function stepGroups(w: WorldState, rng: Rng): void {
  const t = w.tuning.groups;
  if (w.tick % t.decideEvery === 0) {
    syncGroups(w);
    decide(w, rng);
  }
  if (endOfDay(w)) {
    syncGroups(w);
    fission(w, rng);
    for (const g of [...w.groups]) if (g.members.length < 2) removeGroup(w, g);
    for (const g of w.groups) renameForSize(g);
  }
}

/** 0 when alone; else t.maxSafety x (1 - e^(-n/4)), halved for n == 2. */
export function groupSafety(w: WorldState, npc: Npc): number {
  const g = groupOf(w, npc);
  if (!g) return 0;
  const n = g.members.length;
  if (n < 2) return 0;
  return w.tuning.groups.maxSafety * (1 - Math.exp(-n / 4)) * (n === 2 ? 0.5 : 1);
}

export function groupOf(w: WorldState, npc: Npc): Group | null {
  if (npc.groupId === null) return null;
  return w.groups.find((g) => g.id === npc.groupId) ?? null;
}
