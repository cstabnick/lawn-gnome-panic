// The sim feed: steps the headless sim on the sun clock and promotes the player's region to L0 (Hatless and NPC actors).
import { FEED } from '../config';
import type { Streams } from '../sim/rng';
import { absorbIntoPromoted, demoteRegion, npcsIn, promoteRegion, recordHatlessDestroyed, stepWorld } from '../sim/world';
import type { RegionId, WorldState } from '../sim/types';
import type { BlockoutMap, SpotDef } from '../world/types';
import type { Bus } from './bus';
import type { Clock, HatlessSystem, NpcActors, PlayerState, SimFeed } from './types';

export interface FeedDeps { sim: { world: WorldState; streams: Streams }; map: BlockoutMap; bus: Bus; clock: Clock;
  hatless: HatlessSystem; npcs: NpcActors; getPlayer: () => PlayerState }

export function createSimFeed(deps: FeedDeps): SimFeed {
  const { world, streams } = deps.sim;
  const { hatless, npcs, bus, clock, getPlayer, map } = deps;
  let hold: { region: RegionId; remaining: number } | null = null;

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

  /** Empties the promoted region back into the sim (alive L0 Hatless are summed into density). */
  const demote = (): void => {
    demoteRegion(world, hatless.despawnAll());
    npcs.clear();
    hold = null;
  };

  /** Shows the first FEED.npcMaxShown alive NPCs of the region, and keeps the actors in step with the sim. */
  const syncNpcs = (): void => {
    const r = world.promoted.region;
    if (r === null) return;
    const wanted = npcsIn(world, r).slice(0, FEED.npcMaxShown);
    const wantedIds = new Set(wanted.map((n) => n.id));
    for (const id of npcs.ids()) if (!wantedIds.has(id)) npcs.remove(id);
    const shown = new Set(npcs.ids());
    const fresh = wanted.filter((n) => !shown.has(n.id));
    if (fresh.length > 0) npcs.show(fresh, spotsOf('npc', r));
  };

  const promote = (r: RegionId): void => {
    const n = promoteRegion(world, r);
    hatless.spawn(r, n, spotsOf('hatless', r));
    syncNpcs();
  };

  bus.on('hatless-destroyed', () => {
    if (world.promoted.region !== null) recordHatlessDestroyed(world);
  });

  return {
    update(dt: number) {
      // Promotion follows the player. Entering a region with no promotion promotes it; entering another region demotes the
      // old one first. Leaving into no region holds the promoted region for FEED.hysteresisSeconds.
      const pr = getPlayer().region;
      const cur = world.promoted.region;
      if (pr !== null) {
        if (pr !== cur) {
          if (cur !== null) demote();
          promote(pr);
        } else {
          hold = null;
        }
      } else if (cur !== null) {
        if (hold === null || hold.region !== cur) hold = { region: cur, remaining: FEED.hysteresisSeconds };
        hold.remaining -= dt;
        if (hold.remaining <= 0) demote();
      }

      // Step the sim while the sun clock is ahead of its tick (one tick per sun-hour).
      while (Math.floor(clock.sunHours) > world.tick) {
        stepWorld(world, streams);
        bus.emit('sim-tick', { tick: world.tick });
        const r = world.promoted.region;
        if (r === null) continue;
        const herd = world.events.find((e) => e.kind === 'herd-moved' && e.to === r);
        const n = absorbIntoPromoted(world);
        if (n > 0) {
          const from = herd && herd.kind === 'herd-moved' ? centre(herd.from) : nearestNeighbourCentre(r);
          hatless.spawn(r, n, spotsOf('hatless', r), from);
        }
        syncNpcs();
      }
    },
    promoted: () => world.promoted.region,
  };
}
