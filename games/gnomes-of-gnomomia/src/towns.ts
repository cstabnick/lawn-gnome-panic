// The towns of Fescue and the Bound-Peace: where a town is, what a walker should be able to reach in it, and the
// pure rule that keeps enemies from fighting inside one. Lore: docs/lore/entries/fescue/the-bounds.md, rulings R-039
// to R-041. Pure (zone data in, plain data out): the game, the sim, the tests and the scripts all call it.
import type { NpcDef, OutdoorZoneId, ZoneDef, ZoneId } from './config';
import { NPCS, ZONES } from './content';

export interface TownDef {
  /** Stable town id (kebab-case). */
  id: string;
  /** The name gnomes use. */
  name: string;
  zone: OutdoorZoneId;
  /** The region of `zone` whose circle is the town's bounds. */
  region: string;
}

/** A town with its bounds resolved to world coordinates. */
export interface Town extends TownDef {
  x: number;
  z: number;
  r: number;
}

export type TownWaypointKind = 'shrine' | 'region' | 'door' | 'npc' | 'exit' | 'path';

/** A spot in a town that a gnome walking around town should be able to reach (world coordinates). */
export interface TownWaypoint {
  kind: TownWaypointKind;
  /** Unique inside the town, e.g. 'door:h12', 'npc:burlap', 'region:guildhall', 'path:main-street:3'. */
  id: string;
  label: string;
  x: number;
  z: number;
}

/** Every town in Fescue, in the order of the story. The Deeps and interiors are not towns. */
export const TOWN_DEFS: readonly TownDef[] = [
  { id: 'mossbottom', name: 'Mossbottom', zone: 'mossbottom', region: 'village' },
  { id: 'thatchford', name: 'Thatchford', zone: 'thatchford', region: 'thatchford-town' },
  { id: 'pedestal-ward', name: 'Pedestal Ward', zone: 'keep', region: 'pedestal-ward' },
  { id: 'sodbury', name: 'Sodbury', zone: 'cloverfield', region: 'sodbury' },
  { id: 'clippings', name: 'Clippings', zone: 'hedgewood', region: 'clippings' },
  { id: 'barkhollow', name: 'Barkhollow', zone: 'hedgewood', region: 'barkhollow' },
  { id: 'flintdelve', name: 'Flintdelve', zone: 'rockery', region: 'flintdelve' },
  { id: 'last-tuft', name: 'the Last Tuft', zone: 'verge', region: 'last-tuft' },
];

/** Spawn circles (centre +- spread) of ambient enemy groups must stay at least this far outside every town's bounds. */
export const TOWN_SPAWN_MARGIN = 2;

/** Resolves TOWN_DEFS against zone data (world coordinates; content.ts has already moved regions by the zone origin).
 * Throws when a town names a zone or region that does not exist, so a renamed region fails loudly. */
export function resolveTowns(zones: Record<ZoneId, ZoneDef> = ZONES, defs: readonly TownDef[] = TOWN_DEFS): Town[] {
  return defs.map((d) => {
    const zone = zones[d.zone];
    if (!zone) throw new Error(`town ${d.id}: unknown zone ${d.zone}`);
    const region = zone.regions.find((r) => r.id === d.region);
    if (!region) throw new Error(`town ${d.id}: zone ${d.zone} has no region ${d.region}`);
    return { ...d, x: region.x, z: region.z, r: region.r };
  });
}

/** The towns of the shipped content. */
export const TOWNS: readonly Town[] = resolveTowns();

/** The town whose bounds contain (x, z), or null. World coordinates; interiors are parked far away, so never match. */
export function townAt(x: number, z: number, towns: readonly Town[] = TOWNS): Town | null {
  for (const t of towns) if (Math.hypot(x - t.x, z - t.z) <= t.r) return t;
  return null;
}

/** True when (x, z) lies inside a town's bounds. */
export function inTown(x: number, z: number, towns: readonly Town[] = TOWNS): boolean {
  return townAt(x, z, towns) !== null;
}

/** The towns of one zone. */
export function townsInZone(zone: ZoneId, towns: readonly Town[] = TOWNS): Town[] {
  return towns.filter((t) => t.zone === zone);
}

export function townById(id: string, towns: readonly Town[] = TOWNS): Town | undefined {
  return towns.find((t) => t.id === id);
}

/**
 * The Hearth-Peace, as one decision: may an enemy start or keep fighting a target standing at (x, z)?
 * No, when the target is inside a town, unless the enemy belongs to a called fight (`townFight`: a defend wave or a
 * spawn group a quest starts on purpose, listed in the data with `townFight: true`).
 */
export function enemyMayEngage(x: number, z: number, townFight: boolean, towns: readonly Town[] = TOWNS): boolean {
  return townFight || !inTown(x, z, towns);
}

/** True when an idle enemy may wander to (x, z): never into a town unless it belongs to a called fight. */
export function enemyMayWanderTo(x: number, z: number, townFight: boolean, towns: readonly Town[] = TOWNS): boolean {
  return townFight || !inTown(x, z, towns);
}

/** True when the circle (x, z, spread) of an ambient spawn group stays TOWN_SPAWN_MARGIN clear of every town. */
export function spawnCircleClearOfTowns(x: number, z: number, spread: number, towns: readonly Town[] = TOWNS): boolean {
  for (const t of towns) if (Math.hypot(x - t.x, z - t.z) - spread < t.r + TOWN_SPAWN_MARGIN) return false;
  return true;
}

const inside = (t: Town, x: number, z: number): boolean => Math.hypot(x - t.x, z - t.z) <= t.r;

/**
 * The spots a gnome walking around `town` should be able to reach, from zone data only (no terrain): the shrine, every
 * house door (the doormat exits content.ts generates), every other exit, the centres of the zone's other regions that
 * lie in town and are not under a house, the home spots of NPCs who live in town, and the points of authored paths
 * inside the bounds. Sorted by id, so the order is stable.
 */
export function townWaypoints(
  town: Town,
  zones: Record<ZoneId, ZoneDef> = ZONES,
  npcs: Record<string, NpcDef> = NPCS,
): TownWaypoint[] {
  const zone = zones[town.zone];
  const out: TownWaypoint[] = [];
  if (inside(town, zone.shrine.x, zone.shrine.z)) {
    out.push({ kind: 'shrine', id: 'shrine', label: zone.shrine.name, x: zone.shrine.x, z: zone.shrine.z });
  }
  const underHouse = (x: number, z: number): boolean => zone.houses.some((h) => Math.hypot(x - h.x, z - h.z) <= h.r + 0.5);
  for (const r of zone.regions) {
    if (r.id === town.region || !inside(town, r.x, r.z) || underHouse(r.x, r.z)) continue;
    out.push({ kind: 'region', id: `region:${r.id}`, label: r.name, x: r.x, z: r.z });
  }
  zone.exits.forEach((e, i) => {
    if (!inside(town, e.x, e.z)) return;
    const kind: TownWaypointKind = e.door ? 'door' : 'exit';
    const key = e.door && typeof e.to === 'string' && e.to.includes('/') ? e.to.slice(e.to.indexOf('/') + 1) : `${i}`;
    out.push({ kind, id: `${kind}:${key}`, label: e.label, x: e.x, z: e.z });
  });
  for (const n of Object.values(npcs)) {
    if (n.zone !== town.zone || !inside(town, n.x, n.z)) continue;
    out.push({ kind: 'npc', id: `npc:${n.id}`, label: n.name, x: n.x, z: n.z });
  }
  for (const p of zone.paths ?? []) {
    p.points.forEach(([x, z], i) => {
      if (inside(town, x, z)) out.push({ kind: 'path', id: `path:${p.id}:${i}`, label: `${p.id} #${i}`, x, z });
    });
  }
  return out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
