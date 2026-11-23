// The sim feed: the player's region is the bubble they are in. Every change to the world goes through SimHost actions
// (enter-region, hatless-destroyed, noise); the feed never steps the sim itself, it only promotes Hatless through the L0
// bubble it owns and keeps NPC actors in step with the host's ticks. Without a deps.host it owns a solo host and ticks it
// from update(), so main.ts keeps working until the shared host is passed in.
import { FEED } from '../config';
import type { Streams } from '../sim/rng';
import { LOCAL_PLAYER, npcsIn } from '../sim/world';
import { bubbleIn } from '../sim/bubbles';
import { regionAtIn } from '../sim/regions';
import type { RegionId, WorldState } from '../sim/types';
import type { BlockoutMap, SpotDef } from '../world/types';
import type { Bus } from './bus';
import type { Clock, HatlessSystem, NpcActors, PlayerState, SimFeed, SimHost } from './types';
import { createSimHost } from '../net/simHost';

export interface FeedDeps { sim: { world: WorldState; streams: Streams }; map: BlockoutMap; bus: Bus; clock: Clock;
  hatless: HatlessSystem; npcs: NpcActors; getPlayer: () => PlayerState; host?: SimHost }

const NOISE_FLUSH_SECONDS = 10;

export function createSimFeed(deps: FeedDeps): SimFeed {
  const { world, streams } = deps.sim;
  const { hatless, npcs, bus, clock, getPlayer, map } = deps;
  const ownHost = deps.host === undefined;
  const host: SimHost = deps.host ?? createSimHost({ world, streams, worker: false, me: LOCAL_PLAYER });
  let current: RegionId | null = null;
  let hold: { region: RegionId; remaining: number } | null = null;
  const noise = new Map<RegionId, number>();
  let noiseTimer = 0;

  const spotsOf = (kind: 'hatless' | 'npc', r: RegionId): SpotDef[] => map.spots.filter((s) => s.kind === kind && s.region === r);
  const centre = (r: RegionId): { x: number; z: number } => {
    const rect = world.graph.byId[r].rect;
    return { x: (rect.x0 + rect.x1) / 2, z: (rect.z0 + rect.z1) / 2 };
  };
  const nearestNeighbourCentre = (r: RegionId): { x: number; z: number } | undefined => {
    let best: { to: RegionId; cost: number } | null = null;
    for (const nb of world.graph.neighbours[r] ?? []) if (!best || nb.cost < best.cost) best = nb;
    return best ? centre(best.to) : undefined;
  };

  /** Shows the first FEED.npcMaxShown alive NPCs of the current region, and keeps the actors in step with the sim. */
  const syncNpcs = (): void => {
    if (current === null) return;
    const wanted = npcsIn(world, current).slice(0, FEED.npcMaxShown);
    const wantedIds = new Set(wanted.map((n) => n.id));
    for (const id of npcs.ids()) if (!wantedIds.has(id)) npcs.remove(id);
    const shown = new Set(npcs.ids());
    const fresh = wanted.filter((n) => !shown.has(n.id));
    if (fresh.length > 0) npcs.show(fresh, spotsOf('npc', current));
  };

  /** Moves the local player into region r (null: out of the map). The host moves the bubble; the feed shows its Hatless. */
  const enter = (r: RegionId | null): void => {
    const alive = hatless.aliveCount();
    host.apply({ kind: 'enter-region', region: r, alive });
    current = r;
    hold = null;
    hatless.despawnAll();
    npcs.clear();
    if (r === null) return;
    const b = bubbleIn(world, r);
    if (b && b.owner === host.me) hatless.spawn(r, b.hatless, spotsOf('hatless', r));
    syncNpcs();
  };

  const flushNoise = (): void => {
    for (const [region, amount] of noise) if (amount > 0) host.apply({ kind: 'noise', region, amount });
    noise.clear();
  };

  bus.on('noise', (e) => {
    const r = regionAtIn(world.graph.regions, e.x, e.z);
    if (r !== null) noise.set(r, (noise.get(r) ?? 0) + e.radius);
  });

  bus.on('hatless-destroyed', (e) => {
    if (current !== null && e.region !== null) host.apply({ kind: 'hatless-destroyed', region: e.region });
  });

  bus.on('world-loaded', () => {
    const r = current;
    current = null;
    hold = null;
    hatless.despawnAll();
    npcs.clear();
    if (r !== null) enter(r);
  });

  host.onTick((t) => {
    for (const a of t.arrivals) {
      if (a.player !== host.me || current === null || a.region !== current) continue;
      hatless.spawn(a.region, a.count, spotsOf('hatless', a.region), a.from ? centre(a.from) : nearestNeighbourCentre(a.region));
    }
    syncNpcs();
  });

  return {
    update(dt: number) {
      // The bubble follows the player. Entering a region moves the bubble there. Leaving into no region holds the old one
      // for FEED.hysteresisSeconds.
      const pr = getPlayer().region;
      if (pr !== null) {
        if (pr !== current) enter(pr);
        else hold = null;
      } else if (current !== null) {
        if (hold === null || hold.region !== current) hold = { region: current, remaining: FEED.hysteresisSeconds };
        hold.remaining -= dt;
        if (hold.remaining <= 0) enter(null);
      }

      noiseTimer += dt;
      if (noiseTimer >= NOISE_FLUSH_SECONDS) { noiseTimer = 0; flushNoise(); }

      if (ownHost) host.update(clock.sunHours);
    },
    promoted: () => current,
  };
}
