// Pure rules for what Wayfarers do between quests: which break to take (idle, rest or travel), how long, where to
// rest, and where to travel (a town or a zone shrine at most one zone hop away, in a zone whose level band suits the
// gnome). Used by src/companions.ts. Do not import three.js, state, player or terrain.
import type { OutdoorZoneId, ZoneDef, ZoneId } from './config';
import { ZONES } from './content';
import { TOWNS, type Town } from './towns';
import type { CompanionPersonalityId } from './companionLogic';

export type LifeActivity = 'idle' | 'rest' | 'travel';
export interface LifeWeights { idle: number; rest: number; travel: number }

export const LIFE_WEIGHTS: Record<CompanionPersonalityId, LifeWeights> = {
  tryhard:    { idle: 1, rest: 0, travel: 4 },
  lorehound:  { idle: 3, rest: 3, travel: 2 },
  lootgoblin: { idle: 3, rest: 1, travel: 2 },
  wanderer:   { idle: 2, rest: 2, travel: 4 },
  helper:     { idle: 2, rest: 3, travel: 2 },
};

/** Seconds a Wayfarer quests before it takes a break: [min, max]. */
export const QUEST_STINT_S: Record<CompanionPersonalityId, readonly [number, number]> = {
  tryhard: [90, 160], lorehound: [45, 90], lootgoblin: [60, 110], wanderer: [35, 70], helper: [50, 100],
};
/** Chance of a break right after finishing a quest. */
export const BREAK_AFTER_QUEST_CHANCE = 0.45;
export const IDLE_S: readonly [number, number] = [6, 14];
export const REST_S: readonly [number, number] = [14, 30];
/** After a trip, the Wayfarer idles at the destination this long. */
export const ARRIVE_LINGER_S: readonly [number, number] = [4, 10];
/** A trip goes at most this many zone hops away. */
export const TRAVEL_MAX_HOPS = 1;
/** A spot closer than this (m) to where the Wayfarer stands is not a trip. */
export const TRAVEL_MIN_DIST = 40;
/** Walk speed multiplier while travelling: they run between areas. */
export const TRAVEL_SPEED_MULT = 1.15;
/** A gnome sitting on the ground is drawn this much lower (m), so it sits on the grass, not in the air. */
export const SIT_DROP = 0.28;
/** A resting Wayfarer sits this far (m) from the rest spot's centre: [min, max], so several do not stack. */
export const REST_RING_M: readonly [number, number] = [1.5, 4];

/** range[0] + rng() * (range[1] - range[0]). */
export function rollRange(range: readonly [number, number], rng: () => number): number {
  return range[0] + rng() * (range[1] - range[0]);
}

/** Weighted pick from LIFE_WEIGHTS[personality]. When canTravel is false the travel weight counts as 0.
 * One rng() call: r = rng() * total; 'idle' if r < idle; else 'rest' if r < idle + rest; else 'travel'.
 * If the total weight is 0, returns 'idle'. */
export function pickLifeActivity(personality: CompanionPersonalityId, rng: () => number, canTravel = true): LifeActivity {
  const w = LIFE_WEIGHTS[personality];
  const idle = w.idle;
  const rest = w.rest;
  const travel = canTravel ? w.travel : 0;
  const total = idle + rest + travel;
  if (total <= 0) return 'idle';
  const r = rng() * total;
  if (r < idle) return 'idle';
  if (r < idle + rest) return 'rest';
  return 'travel';
}

/** A place to travel to or rest at. townId is the town's id for a town centre, null for a zone shrine. */
export interface LifeSpot { zone: OutdoorZoneId; x: number; z: number; label: string; townId: string | null }

/** Every town centre (from `towns`, in that order; label = town.name, x/z = town.x/z), then every outdoor zone's
 * shrine (label = zone.shrine.name) in Object.keys(zones) order. Zones whose id contains '/', or with `indoor`
 * or `interior` set, are left out (that drops the Deeps and every house interior). */
export function lifeSpots(zones: Record<ZoneId, ZoneDef> = ZONES, towns: readonly Town[] = TOWNS): LifeSpot[] {
  const spots: LifeSpot[] = towns.map((t) => ({ zone: t.zone, x: t.x, z: t.z, label: t.name, townId: t.id }));
  for (const key of Object.keys(zones) as ZoneId[]) {
    if (key.includes('/')) continue;
    const zone = zones[key];
    if (zone.indoor || zone.interior) continue;
    spots.push({ zone: key as OutdoorZoneId, x: zone.shrine.x, z: zone.shrine.z, label: zone.shrine.name, townId: null });
  }
  return spots;
}

/** Hops from `from` to `to` over ZoneDef.exits (breadth-first; exit `when` conditions are ignored; an exit whose
 * `to` equals its own zone is skipped). 0 for the same zone; Infinity when unreachable or unknown. */
export function zoneHops(from: ZoneId, to: ZoneId, zones: Record<ZoneId, ZoneDef> = ZONES): number {
  if (!zones[from]) return Infinity;
  if (from === to) return 0;
  const dist = new Map<ZoneId, number>([[from, 0]]);
  const queue: ZoneId[] = [from];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const d = dist.get(cur)!;
    for (const exit of zones[cur]?.exits ?? []) {
      if (exit.to === cur || dist.has(exit.to) || !zones[exit.to]) continue;
      if (exit.to === to) return d + 1;
      dist.set(exit.to, d + 1);
      queue.push(exit.to);
    }
  }
  return Infinity;
}

let cached: LifeSpot[] | null = null;
function defaultSpots(): LifeSpot[] {
  if (!cached) cached = lifeSpots();
  return cached;
}

/** A trip: a spot whose zone is at most TRAVEL_MAX_HOPS hops from `fromZone`, at least TRAVEL_MIN_DIST from
 * (x, z), and whose zone's `levels` band passes `fits`. Uniform pick among those with one rng() call:
 * candidates[Math.min(n - 1, Math.floor(rng() * n))]. Null when there is none (no rng call then).
 * When fromZone contains '/', use the part before the '/'. */
export function pickTravelDestination(
  fromZone: ZoneId, x: number, z: number,
  fits: (band: readonly [number, number]) => boolean,
  rng: () => number,
  spots: readonly LifeSpot[] = defaultSpots(),
  zones: Record<ZoneId, ZoneDef> = ZONES,
): LifeSpot | null {
  const base = (fromZone.includes('/') ? fromZone.split('/')[0] : fromZone) as ZoneId;
  const candidates = spots.filter((s) =>
    zoneHops(base, s.zone, zones) <= TRAVEL_MAX_HOPS
    && Math.hypot(s.x - x, s.z - z) >= TRAVEL_MIN_DIST
    && fits(zones[s.zone].levels),
  );
  const n = candidates.length;
  if (n === 0) return null;
  return candidates[Math.min(n - 1, Math.floor(rng() * n))];
}

/** Where a Wayfarer in `zone` at (x, z) sits down: the nearest spot in the same zone (part before '/' if any);
 * null when the zone has none. */
export function restSpot(zone: ZoneId, x: number, z: number, spots: readonly LifeSpot[] = defaultSpots()): LifeSpot | null {
  const base = zone.includes('/') ? zone.split('/')[0] : zone;
  let best: LifeSpot | null = null;
  let bestD = Infinity;
  for (const s of spots) {
    if (s.zone !== base) continue;
    const d = Math.hypot(s.x - x, s.z - z);
    if (d < bestD) { best = s; bestD = d; }
  }
  return best;
}

/** Bubble lines for breaks. */
export const LIFE_LINES: Record<CompanionPersonalityId, { rest: readonly string[]; travel: readonly string[]; arrive: readonly string[] }> = {
  tryhard: {
    rest: ['Brb, two minutes.', 'Waiting on cooldowns.', 'Lacing my boots tighter.'],
    travel: ['Better spawns over there.', 'Changing zones.', 'Running, not walking.'],
    arrive: ['Made it. Next.', 'Right, pulling here.'],
  },
  lorehound: {
    rest: ['A fine spot to sit a while.', 'Let my feet remember the road.', 'Hush. Listen to the grass.'],
    travel: ['The road calls, friends.', 'I hear there is a plaque yonder.', 'Onward, to the next chapter.'],
    arrive: ['Ah, the air is different here.', 'Just as the ledger described.'],
  },
  lootgoblin: {
    rest: ['Counting it all again.', 'Shh, sorting my bags.', 'Nobody touch my pile.'],
    travel: ['Heard the pickings are better there.', 'Off to new pickings!'],
    arrive: ['Fresh ground. Fresh loot.', 'What have we here?'],
  },
  wanderer: {
    rest: ['Just sitting. Is that allowed?', 'My legs gave up.', 'Nice and squishy here.'],
    travel: ['I think it is this way.', 'Ooh, what is over there?', 'Following the road. Probably.'],
    arrive: ['Where am I now?', 'Oh! This place.'],
  },
  helper: {
    rest: ['Taking five. Shout if you need me.', 'Sit with me a minute?', 'Rest up, then back to it.'],
    travel: ['Off to help out yonder.', 'Someone over there needs a hand.'],
    arrive: ['Right, who needs help?', 'Made it. Anyone stuck?'],
  },
};
