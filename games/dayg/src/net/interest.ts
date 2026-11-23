// Who hears what: interest sets for poses, bubbles and news (roadmap 8.6).
import type { PlayerKey, RegionId, WorldState } from '../sim/types';
import { bubbleIn } from '../sim/bubbles';
import { hatlessInRegion, hatlessThreat } from '../sim/horde';
import { npcsIn } from '../sim/world';

export function interestedPlayers(w: WorldState, me: PlayerKey): PlayerKey[] {
  const mine = w.players[me]?.region ?? null;
  if (mine === null) return [];
  const near = new Set<RegionId>([mine, ...(w.graph.neighbours[mine] ?? []).map((nb) => nb.to)]);
  return Object.keys(w.players)
    .filter((k) => k !== me)
    .filter((k) => {
      const p = w.players[k];
      return p.online && p.region !== null && near.has(p.region);
    })
    .sort();
}

export function bubbleViewers(w: WorldState, owner: PlayerKey): PlayerKey[] {
  return w.bubbles.find((b) => b.owner === owner)?.viewers.slice() ?? [];
}

export function newsSince(w: WorldState, tick: number): string[] {
  return w.chronicle.filter((l) => l.tick >= tick).slice(-20).map((l) => l.text);
}

export function regionSummary(w: WorldState, r: RegionId): { region: RegionId; hatless: number; npcs: number; danger: 0 | 1 | 2 | 3 } {
  const threat = hatlessThreat(w, r);
  const danger: 0 | 1 | 2 | 3 = threat < 0.2 ? 0 : threat < 0.5 ? 1 : threat < 1 ? 2 : 3;
  return {
    region: r,
    hatless: hatlessInRegion(w, r) + (bubbleIn(w, r)?.hatless ?? 0),
    npcs: npcsIn(w, r).length,
    danger,
  };
}
