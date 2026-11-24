// Who runs what online (docs/roadmaps/gta-online-sync.md). Pure: no net, no DOM.
//
// Players are RANKED: the match host first (the server picks it and hands it on when it leaves), then by player id
// (join order). Two rules come from the rank:
// - LEAD: a player spawns new street events, bird flocks and sky traffic only while no higher-ranked player is near
//   (within LEAD.near, with hysteresis). Everyone near a lead sees the lead's world; players far apart each lead their
//   own patch, so nobody plays in an empty world.
// - OWNER of a fixed thing (a hunting quarry, which every client has from the same seeded plan): the highest-ranked
//   player within OWN.near of it. The owner steps it and publishes it; the others mirror it.

export interface RankedPlayer { id: number; x: number; z: number }

/** Spawning lead: give the lead up when a higher-ranked player comes within `near`; take it back past `far`. */
export const LEAD = { near: 200, far: 260 } as const;
/** Fixed-entity ownership radius (hunting quarry), with the same kind of hysteresis. */
export const OWN = { near: 220, far: 280 } as const;

/** True when player a outranks player b (the host outranks everyone; else the lower id). */
export function outranks(a: number, b: number, hostId: number | null): boolean {
  if (a === b) return false;
  if (hostId !== null) {
    if (a === hostId) return true;
    if (b === hostId) return false;
  }
  return a < b;
}

/**
 * Am I the spawning lead here? `wasLead` is last answer (hysteresis): a lead keeps it until a higher-ranked player is
 * within LEAD.near; a non-lead gets it back only when every higher-ranked player is beyond LEAD.far.
 */
export function computeLead(me: RankedPlayer, others: readonly RankedPlayer[], hostId: number | null, wasLead: boolean): boolean {
  const r = wasLead ? LEAD.near : LEAD.far;
  for (const o of others) {
    if (!outranks(o.id, me.id, hostId)) continue;
    if (Math.hypot(o.x - me.x, o.z - me.z) < r) return false;
  }
  return true;
}

/**
 * The owner of a fixed entity at (x, z): the highest-ranked player within OWN.near of it. `current` (the owner last
 * time, or null) keeps it up to OWN.far as long as nobody higher-ranked is within OWN.near. Null when nobody is near.
 */
export function pickOwner(x: number, z: number, players: readonly RankedPlayer[], hostId: number | null, current: number | null): number | null {
  let best: number | null = null;
  for (const p of players) {
    const d = Math.hypot(p.x - x, p.z - z);
    const r = p.id === current ? OWN.far : OWN.near;
    if (d >= r) continue;
    if (best === null || outranks(p.id, best, hostId)) best = p.id;
  }
  return best;
}
