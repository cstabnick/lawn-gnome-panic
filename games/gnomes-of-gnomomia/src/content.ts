// The content registry: merges every pack and zone under src/data/ into the game's tables, once at import time.
// A duplicate id throws, so two packs can never silently overwrite each other.
import type {
  AllyDef, BookDef, ContentPack, SpawnSpec, DialogueNode, DialogueOption, EnemyDef, Greeting, ItemDef, NpcDef, Objective, OutdoorZoneId, QuestDef, SpawnGroup, WorldObjectDef, WorldObjectSpec, ZoneDef, ZoneExit, ZoneId,
} from './config';
import { WORLD } from './config';
import { doorSpots, hashString, layoutInterior, mulberry32 } from './data/interiors';
export { FURNITURE_RADIUS } from './data/interiors';
import { ORIGINS } from './data/layout';
import type { MarkerDef } from '@lawn/level';
import { isObjectMarker, LEASH_MARKER_KIND, resolveLeash, resolveObject, resolveSpawn, SPAWN_MARKER_KIND, type ObjectPlacementMarker } from './placement';

import { PACK as mossbottom } from './data/packs/mossbottom';
import { PACK as ch2 } from './data/packs/ch2-thatchford';
import { PACK as ch3 } from './data/packs/ch3-keep';
import { PACK as ch4 } from './data/packs/ch4-cloverfield';
import { PACK as ch5 } from './data/packs/ch5-hedgewood';
import { PACK as ch6 } from './data/packs/ch6-rockery';
import { PACK as ch7 } from './data/packs/ch7-verge';
import { PACK as ch8 } from './data/packs/ch8-finale';
import { PACK as s01 } from './data/packs/s01-dandelion-idol';
import { PACK as s02 } from './data/packs/s02-neat-chapel';
import { PACK as s03 } from './data/packs/s03-heir-of-the-heap';
import { PACK as s04 } from './data/packs/s04-queen-outside';
import { PACK as s05 } from './data/packs/s05-seven-kiln-born';
import { PACK as s06 } from './data/packs/s06-the-forty';
import { PACK as s07 } from './data/packs/s07-straw-king';
import { PACK as s08 } from './data/packs/s08-range-war';
import { PACK as s09 } from './data/packs/s09-white-cricket';
import { PACK as s10 } from './data/packs/s10-hedgewrights';
import { PACK as s11 } from './data/packs/s11-finishing-the-unfired';
import { PACK as s12 } from './data/packs/s12-the-damp';
import { PACK as s13 } from './data/packs/s13-the-kings-cart';
import { PACK as s14 } from './data/packs/s14-the-smiths-road';
import { PACK as loreCommon } from './data/packs/lore-common';
import { PACK as loreMb } from './data/packs/lore-mossbottom-thatchford';
import { PACK as loreKeep } from './data/packs/lore-keep-deeps';
import { PACK as loreClover } from './data/packs/lore-cloverfield-hedgewood';
import { PACK as loreRock } from './data/packs/lore-rockery-verge';
import { PACK as raidStations } from './data/packs/raid-stations';
import { PACK as raidKeep, RAID_PACK as raidKeepR } from './data/packs/raid-keep';
import { PACK as raidClover, RAID_PACK as raidCloverR } from './data/packs/raid-clover';
import { PACK as raidHedge, RAID_PACK as raidHedgeR } from './data/packs/raid-hedge';
import { PACK as raidRock, RAID_PACK as raidRockR } from './data/packs/raid-rock';
import { PACK as raidVerge, RAID_PACK as raidVergeR } from './data/packs/raid-verge';
import type { RaidPack, RaidDef, RecipeDef } from './raidTypes';

import { ZONE as zMossbottom } from './data/zones/mossbottom';
import { ZONE as zThatchford } from './data/zones/thatchford';
import { ZONE as zKeep } from './data/zones/keep';
import { ZONE as zDeeps } from './data/zones/deeps';
import { ZONE as zCloverfield } from './data/zones/cloverfield';
import { ZONE as zHedgewood } from './data/zones/hedgewood';
import { ZONE as zRockery } from './data/zones/rockery';
import { ZONE as zVerge } from './data/zones/verge';

/** Every pack, in load order (canon packs first so later packs can extend their NPCs). */
export const PACKS: readonly ContentPack[] = [
  mossbottom, ch2, ch3, ch4, ch5, ch6, ch7, ch8,
  s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14,
  loreCommon, loreMb, loreKeep, loreClover, loreRock,
  raidStations, raidKeep, raidClover, raidHedge, raidRock, raidVerge,
];

export const ZONES: Record<ZoneId, ZoneDef> = {
  mossbottom: zMossbottom, thatchford: zThatchford, keep: zKeep, deeps: zDeeps,
  cloverfield: zCloverfield, hedgewood: zHedgewood, rockery: zRockery, verge: zVerge,
};

/** Raid packs, merged into RAIDS and RECIPES after the world shift (src/raidTypes.ts). */
export const RAID_PACKS: readonly RaidPack[] = [raidKeepR, raidCloverR, raidHedgeR, raidRockR, raidVergeR];
export const RAIDS: Record<string, RaidDef> = {};
export const RECIPES: Record<string, RecipeDef> = {};

export const BOOKS: Record<string, BookDef> = {};
export const ITEMS: Record<string, ItemDef> = {};
export const ENEMIES: Record<string, EnemyDef> = {};
export const NPCS: Record<string, NpcDef> = {};
export const QUESTS: Record<string, QuestDef> = {};
export const OBJECTS: Record<string, WorldObjectDef> = {};
/** Pack objects as written: pass 1b turns each into a WorldObjectDef in OBJECTS (position from the pack or an object marker). */
const OBJECT_SPECS: Record<string, WorldObjectSpec> = {};
export const SPAWNS: SpawnGroup[] = [];
/** Pack spawns as written; pass 1b turns each into a SpawnGroup in SPAWNS (position from the pack or a spawn marker). */
const SPAWN_SPECS: SpawnSpec[] = [];
export const TOPICS: Record<string, DialogueOption[]> = {};
export const GREETINGS_FIRST: Record<string, Greeting[]> = {};
export const ALLIES: AllyDef[] = [];

/** Problems found while merging packs. The game throws them all at once below; the content linter (which sets
 * globalThis.__GNOMOMIA_LINT__) reads them instead, so one broken pack does not hide the others. */
export const LOAD_ERRORS: string[] = [];
function loadError(msg: string): void {
  LOAD_ERRORS.push(msg);
}

function mergeTable<T>(kind: string, pack: string, into: Record<string, T>, from: Record<string, T> | undefined): void {
  if (!from) return;
  for (const [id, def] of Object.entries(from)) {
    if (id in into) { loadError(`duplicate ${kind} id: ${id} in pack ${pack}`); continue; }
    into[id] = def;
  }
}

// Pass 1: the id-keyed tables (NPCs are copied so pass 2 can extend their nodes and shop).
for (const p of PACKS) {
  mergeTable('item', p.id, ITEMS, p.items);
  mergeTable('enemy', p.id, ENEMIES, p.enemies);
  mergeTable('quest', p.id, QUESTS, p.quests);
  mergeTable('object', p.id, OBJECT_SPECS, p.objects);
  mergeTable('book', p.id, BOOKS, p.books);
  if (p.npcs) {
    const copies: Record<string, NpcDef> = {};
    for (const [id, n] of Object.entries(p.npcs)) copies[id] = { ...n, nodes: { ...n.nodes }, shop: n.shop ? [...n.shop] : undefined };
    mergeTable('npc', p.id, NPCS, copies);
  }
  if (p.spawns) {
    for (const g of p.spawns) {
      if (g.id === undefined) loadError(`spawn without id: ${g.enemy} in zone ${g.zone} in pack ${p.id}`);
      else if (SPAWN_SPECS.some((s) => s.id === g.id)) loadError(`duplicate spawn id: ${g.id} in pack ${p.id}`);
      SPAWN_SPECS.push(g);
    }
  }
  if (p.allies) {
    for (const a of p.allies) {
      if (ALLIES.some((x) => x.id === a.id)) { loadError(`duplicate ally id: ${a.id} in pack ${p.id}`); continue; }
      ALLIES.push(a);
    }
  }
}

// Pass 2: extensions to NPCs that may live in another pack.
const nodeOwner: Record<string, string> = {};
for (const p of PACKS) {
  for (const [npcId, nodes] of Object.entries(p.extraNodes ?? {})) {
    const npc = NPCS[npcId];
    if (!npc) { loadError(`extraNodes for unknown npc: ${npcId} in pack ${p.id}`); continue; }
    for (const [nodeId, node] of Object.entries(nodes)) {
      if (nodeId in npc.nodes) { loadError(`duplicate dialogue node id: ${npcId}.${nodeId} in pack ${p.id}${nodeOwner[`${npcId}.${nodeId}`] ? ` (also in ${nodeOwner[`${npcId}.${nodeId}`]})` : ''}`); continue; }
      npc.nodes[nodeId] = node;
      nodeOwner[`${npcId}.${nodeId}`] = p.id;
    }
  }
  for (const [npcId, stock] of Object.entries(p.shopAdds ?? {})) {
    const npc = NPCS[npcId];
    if (!npc) { loadError(`shopAdds for unknown npc: ${npcId} in pack ${p.id}`); continue; }
    npc.shop = [...(npc.shop ?? []), ...stock];
  }
  for (const [npcId, opts] of Object.entries(p.topics ?? {})) (TOPICS[npcId] ??= []).push(...opts);
  for (const [npcId, greets] of Object.entries(p.greetingsFirst ?? {})) (GREETINGS_FIRST[npcId] ??= []).push(...greets);
}

// Pass 1b: world objects. A pack gives an object its position, or an `object` marker in the zone's level file does
// (src/placement.ts). Positions stay zone-local here; pass 3 moves them by the origin like every other position.
// Runs before pass 2b, which reads OBJECTS to keep furniture clear of them.
{
  const markerOf = new Map<string, { zone: ZoneId; marker: ObjectPlacementMarker }>();
  for (const zone of Object.values(ZONES)) {
    for (const m of zone.markers ?? []) {
      if (!isObjectMarker(m)) continue;
      if (markerOf.has(m.id)) { loadError(`duplicate object marker id: ${m.id} in zone ${zone.id}`); continue; }
      markerOf.set(m.id, { zone: zone.id, marker: m });
    }
  }
  for (const [id, spec] of Object.entries(OBJECT_SPECS)) {
    const found = markerOf.get(id);
    const { def, errors } = resolveObject(spec, found?.zone ?? spec.zone, found?.marker);
    for (const e of errors) loadError(`object ${id}: ${e}`);
    OBJECTS[id] = def;
  }
  for (const id of markerOf.keys()) if (!(id in OBJECT_SPECS)) loadError(`object marker ${id} has no object`);
}

// Pass 1b: spawns. A spawn with an id takes its position and placement data from a `spawn` marker in its zone's
// level file (src/placement.ts), if one names it. Each resolved spawn replaces the pass-1 entry at the same index.
{
  const spawnMarkerOf = new Map<string, { zone: ZoneId; marker: MarkerDef }>();
  for (const zone of Object.values(ZONES)) {
    for (const m of zone.markers ?? []) {
      if (m.kind !== SPAWN_MARKER_KIND) continue;
      if (spawnMarkerOf.has(m.id)) { loadError(`duplicate spawn marker id: ${m.id} in zone ${zone.id}`); continue; }
      spawnMarkerOf.set(m.id, { zone: zone.id, marker: m });
    }
  }
  const specIds = new Set(SPAWN_SPECS.map((s) => s.id).filter((id): id is string => id !== undefined));
  for (const id of spawnMarkerOf.keys()) if (!specIds.has(id)) loadError(`spawn marker ${id} has no spawn`);
  // Same order as the packs (the index keys runtime state), so every spawn keeps its position in SPAWNS.
  for (const spec of SPAWN_SPECS) {
    const found = spec.id !== undefined ? spawnMarkerOf.get(spec.id) : undefined;
    const { def, errors } = resolveSpawn(spec, found?.zone ?? spec.zone, found?.marker);
    for (const e of errors) loadError(`spawn ${spec.id}: ${e}`);
    SPAWNS.push(def);
  }
}

// Pass 1c: leash zones. A `leash` marker in a zone's level file binds either the named `data.spawn` or any spawn
// in that zone whose centre falls inside the circle (explicit `data.spawn` takes precedence).
{
  const explicitSpawnLeash = new Set<string>();
  const areaLeashes: { zone: ZoneId; x: number; z: number; r: number }[] = [];
  for (const zone of Object.values(ZONES)) {
    for (const m of zone.markers ?? []) {
      if (m.kind !== LEASH_MARKER_KIND) continue;
      const { def, errors } = resolveLeash(m, zone.id);
      for (const e of errors) loadError(`leash ${m.id} in ${zone.id}: ${e}`);
      if (!def) continue;
      if (def.spawn !== undefined) {
        const target = SPAWNS.find((s) => s.id === def.spawn);
        if (!target) {
          loadError(`leash ${m.id} in ${zone.id}: unknown spawn '${def.spawn}'`);
          continue;
        }
        if (target.zone !== zone.id) {
          loadError(`leash ${m.id} in ${zone.id}: spawn '${def.spawn}' is in ${target.zone}`);
          continue;
        }
        if (explicitSpawnLeash.has(def.spawn)) {
          loadError(`leash ${m.id} in ${zone.id}: duplicate leash for spawn '${def.spawn}'`);
          continue;
        }
        explicitSpawnLeash.add(def.spawn);
        target.leash = { x: def.x, z: def.z, r: def.r };
      } else {
        areaLeashes.push({ zone: zone.id, x: def.x, z: def.z, r: def.r });
      }
    }
  }
  for (const area of areaLeashes) {
    for (const g of SPAWNS) {
      if (g.zone !== area.zone || g.leash) continue;
      if (Math.hypot(g.x - area.x, g.z - area.z) <= area.r) {
        g.leash = { x: area.x, z: area.z, r: area.r };
      }
    }
  }
}

// Pass 2b: building interiors. Each house becomes a small indoor zone (an instance, like the Deeps) with its own origin
// far beyond the Deeps; its door is a teleport exit both ways. Everything here is authored zone-local (room-local inside),
// so pass 3 below moves it into the world like any other content. Furniture is laid out after the packs merged, so it
// can keep clear of the NPCs and objects packs put inside.
const INTERIOR_X0 = 2000, INTERIOR_COLS = 12, INTERIOR_SPACING = 1000;
const AUTHORED = { ...ZONES } as Record<OutdoorZoneId, ZoneDef>;

function interiorSpots(zoneId: string): { x: number; z: number }[] {
  const spots: { x: number; z: number }[] = [];
  for (const o of Object.values(OBJECTS)) if (o.zone === zoneId) spots.push({ x: o.x, z: o.z });
  for (const n of Object.values(NPCS)) {
    if (n.zone === zoneId) spots.push({ x: n.x, z: n.z });
    for (const pl of n.placements ?? []) if (pl.zone === zoneId) spots.push({ x: pl.x, z: pl.z });
  }
  for (const sp of SPAWNS) if (sp.zone === zoneId) spots.push({ x: sp.x, z: sp.z });
  return spots;
}

/** True when a door spot is walkable ground: on the map, out of the water, clear of other houses, walls and doormats. */
function doorSpotClear(zone: ZoneDef, self: number, x: number, z: number, taken: readonly { x: number; z: number }[]): boolean {
  if (Math.abs(x) > zone.half - 4 || Math.abs(z) > zone.half - 4) return false;
  if (zone.houses.some((o, j) => j !== self && Math.hypot(x - o.x, z - o.z) < o.r + 0.8)) return false;
  if (zone.lakes.some((l) => Math.hypot(x - l.x, z - l.z) < l.r * 1.1)) return false;
  if (Math.hypot(x - zone.shrine.x, z - zone.shrine.z) < 2.5) return false;
  if (zone.exits.some((e) => Math.hypot(x - e.x, z - e.z) < e.r + 1.5)) return false;
  for (const w of zone.walls ?? []) {
    const dx = w.x2 - w.x1, dz = w.z2 - w.z1;
    const t = Math.max(0, Math.min(1, ((x - w.x1) * dx + (z - w.z1) * dz) / (dx * dx + dz * dz || 1)));
    if (Math.hypot(x - (w.x1 + t * dx), z - (w.z1 + t * dz)) < 1.6) return false;
  }
  for (const d of zone.decks ?? []) {
    // The deck's footprint, and its one ramp (2.4 m wide, 2*y long, leaving from the `stair` side), with 1 m to spare.
    const m = 1, len = 2 * d.y, hw = 1.2;
    if (Math.abs(x - d.x) < d.w / 2 + m && Math.abs(z - d.z) < d.d / 2 + m) return false;
    const along = d.stair === 'n' || d.stair === 's' ? 'z' : 'x';
    const sign = d.stair === 's' || d.stair === 'e' ? 1 : -1;
    const start = along === 'z' ? d.z + sign * d.d / 2 : d.x + sign * d.w / 2;
    const t = ((along === 'z' ? z : x) - start) * sign;                  // distance out along the ramp
    const side = Math.abs(along === 'z' ? x - d.x : z - d.z);            // distance across it
    if (t > -m && t < len + m && side < hw + m) return false;
  }
  return !taken.some((p) => Math.hypot(x - p.x, z - p.z) < 1.8);
}

let instanceSlot = 0;
for (const [zid, zone] of Object.entries(AUTHORED) as [OutdoorZoneId, ZoneDef][]) {
  const doors: ZoneExit[] = [];
  const seenIds = new Set<string>();
  const taken: { x: number; z: number }[] = [];
  // Doors that face into a neighbour, a lake or a wall are turned (45 degrees at a time, nearest first) to a clear side.
  const houses = zone.houses.map((h, i) => {
    if (h.interior === false) return h;
    for (const turn of [0, 1, -1, 2, -2, 3, -3, 4]) {
      const yaw = h.yaw + (turn * Math.PI) / 4;
      const d = doorSpots({ ...h, yaw });
      if (doorSpotClear(zone, i, d.matX, d.matZ, taken) && doorSpotClear(zone, i, d.outX, d.outZ, taken)) {
        taken.push({ x: d.matX, z: d.matZ }, { x: d.outX, z: d.outZ });
        return yaw === h.yaw ? h : { ...h, yaw, authored: { yaw: h.yaw, turnedYaw: yaw } };
      }
    }
    return { ...h, interior: false as const, authored: { yaw: h.yaw, autoShut: true } };   // no clear side: this one stays shut
  });
  houses.forEach((h, i) => {
    if (h.interior === false) return;
    const houseId = h.id ?? `h${i}`;
    if (seenIds.has(houseId)) { loadError(`duplicate house id ${houseId} in zone ${zid}`); return; }
    seenIds.add(houseId);
    const id = `${zid}/${houseId}` as ZoneId;
    const spec = h.interior ?? {};
    const lay = layoutInterior(id, h.style, spec, interiorSpots(id));
    const { hw, hd } = lay.template;
    const d = doorSpots(h);
    const name = lay.name.charAt(0).toUpperCase() + lay.name.slice(1);

    // Bookshelves and lecterns become objects holding a book: the house's own books first, then seeded common ones.
    const pool = Object.values(BOOKS).filter((b) => b.common && (!b.where || b.where.includes(zid))).map((b) => b.id).sort();
    const rng = mulberry32(hashString(id) ^ 0x5eed);
    const own = [...(spec.books ?? [])];
    let shelf = 0, lectern = 0;
    const layout = lay.furniture.filter((f) => {
      if (f.kind !== 'bookshelf' && f.kind !== 'lectern') return true;
      let book = own.shift();
      if (!book && pool.length) book = pool.splice(Math.floor(rng() * pool.length), 1)[0];
      if (book && !(book in BOOKS)) loadError(`house ${id}: unknown book '${book}'`);
      const isShelf = f.kind === 'bookshelf';
      const oid = isShelf ? `${id}#shelf${++shelf}` : `${id}#lectern${++lectern}`;
      OBJECTS[oid] = {
        id: oid, zone: id, name: isShelf ? 'Bookshelf' : 'Lectern', x: f.x, z: f.z, yaw: f.yaw ?? 0,
        model: f.kind, color: f.color, verb: isShelf ? 'Browse' : 'Read', book,
        examine: isShelf ? 'Shelves of well-thumbed books, most of them about weather.' : 'A slanted reading stand with a book left open on it.',
        text: book ? undefined : "Seed catalogues and old almanacs. Nothing you haven't read.",
      };
      return false;
    });

    const slot = instanceSlot++;
    ORIGINS[id] = { x: INTERIOR_X0 + (slot % INTERIOR_COLS) * INTERIOR_SPACING, z: WORLD.instanceZ + INTERIOR_SPACING * (1 + Math.floor(slot / INTERIOR_COLS)) };
    ZONES[id] = {
      id, name, levels: zone.levels, half: Math.max(hw, hd) + 2,
      spawn: { x: 0, z: hd - 2.0 },
      shrine: { x: 0, z: hd - 2.0, name },
      regions: [], lakes: [], houses: [], walls: [], indoor: true,
      theme: { ground: lay.palette.floor, groundAlt: lay.palette.floor, flora: 'pipe', floraDensity: 0, fog: 0x14100c, sky: 0x14100c, hilliness: 0 },
      exits: [{ to: zid, x: 0, z: hd - 0.4, r: 0.9, arriveX: d.outX, arriveZ: d.outZ, label: `Out to ${zone.name}`, door: true }],
      interior: { parent: zid, houseId, template: lay.template.id, hw, hd, palette: lay.palette, light: lay.template.light, layout },
    };
    doors.push({ to: id, x: d.matX, z: d.matZ, r: 0.9, arriveX: 0, arriveZ: hd - 2.0, label: name, door: true });
  });
  ZONES[zid] = { ...zone, houses, exits: [...zone.exits, ...doors] };
}

// Pass 3: the open world. Every position above is authored zone-local (around 0,0); move each by its zone's origin
// (src/data/layout.ts) so the rest of the game sees one world coordinate space. Everything is copied, never changed in
// place, because packs share objects (a travel action built from one table, a spawn list reused).
function shiftX(zone: ZoneId, x: number): number { return x + ORIGINS[zone].x; }
function shiftZ(zone: ZoneId, z: number): number { return z + ORIGINS[zone].z; }

function worldZone(def: ZoneDef): ZoneDef {
  const o = ORIGINS[def.id];
  const pt = <T extends { x: number; z: number }>(p: T): T => ({ ...p, x: p.x + o.x, z: p.z + o.z });
  return {
    ...def,
    origin: { x: o.x, z: o.z },
    spawn: pt(def.spawn),
    shrine: pt(def.shrine),
    regions: def.regions.map(pt),
    lakes: def.lakes.map(pt),
    houses: def.houses.map(pt),
    decks: def.decks?.map(pt),
    walls: def.walls?.map((w) => ({ x1: w.x1 + o.x, z1: w.z1 + o.z, x2: w.x2 + o.x, z2: w.z2 + o.z })),
    exits: def.exits.map((e) => ({ ...e, x: e.x + o.x, z: e.z + o.z, arriveX: shiftX(e.to, e.arriveX), arriveZ: shiftZ(e.to, e.arriveZ) })),
    ...(def.stamps ? { stamps: def.stamps.map((s) => ({ ...s, x: s.x + o.x, z: s.z + o.z })) } : {}),
    ...(def.paths ? { paths: def.paths.map((p) => ({ ...p, points: p.points.map(([x, z]): [number, number] => [x + o.x, z + o.z]) })) } : {}),
    ...(def.props ? { props: def.props.map((p) => ({ ...p, x: p.x + o.x, z: p.z + o.z })) } : {}),
    ...(def.markers ? { markers: def.markers.map((m) => ({ ...m, x: m.x + o.x, z: m.z + o.z })) } : {}),
  };
}

function worldOption(opt: DialogueOption): DialogueOption {
  const a = opt.action;
  if (!a || a.type !== 'travel') return opt;
  return { ...opt, action: { ...a, x: shiftX(a.zone, a.x), z: shiftZ(a.zone, a.z) } };
}

function worldNode(node: DialogueNode): DialogueNode {
  return { ...node, options: node.options.map(worldOption) };
}

function worldObjective(o: Objective): Objective {
  if (o.type === 'reach' || o.type === 'escort' || o.type === 'defend') return { ...o, x: shiftX(o.zone, o.x), z: shiftZ(o.zone, o.z) };
  return o;
}

for (const id of Object.keys(ZONES) as ZoneId[]) ZONES[id] = worldZone(ZONES[id]);
for (const npc of Object.values(NPCS)) {
  npc.x = shiftX(npc.zone, npc.x);
  npc.z = shiftZ(npc.zone, npc.z);
  npc.placements = npc.placements?.map((p) => ({ ...p, x: shiftX(p.zone, p.x), z: shiftZ(p.zone, p.z) }));
  for (const [nodeId, node] of Object.entries(npc.nodes)) npc.nodes[nodeId] = worldNode(node);
}
for (const [npcId, opts] of Object.entries(TOPICS)) TOPICS[npcId] = opts.map(worldOption);
for (let i = 0; i < SPAWNS.length; i++) {
  const g = SPAWNS[i];
  SPAWNS[i] = {
    ...g,
    x: shiftX(g.zone, g.x),
    z: shiftZ(g.zone, g.z),
    ...(g.leash ? { leash: { x: shiftX(g.zone, g.leash.x), z: shiftZ(g.zone, g.leash.z), r: g.leash.r } } : {}),
  };
}
for (const [id, def] of Object.entries(OBJECTS)) OBJECTS[id] = { ...def, x: shiftX(def.zone, def.x), z: shiftZ(def.zone, def.z) };
for (const [id, q] of Object.entries(QUESTS)) {
  QUESTS[id] = { ...q, stages: q.stages.map((st) => ({ ...st, objective: worldObjective(st.objective) })) };
}

// Raids and reforging recipes (src/raidTypes.ts). Arena centres are written zone-local, like everything else.
for (const rp of RAID_PACKS) {
  for (const r of rp.raids ?? []) {
    if (r.id in RAIDS) { loadError(`duplicate raid id: ${r.id}`); continue; }
    RAIDS[r.id] = { ...r, x: shiftX(r.zone, r.x), z: shiftZ(r.zone, r.z) };
  }
  for (const c of rp.recipes ?? []) {
    if (c.id in RECIPES) { loadError(`duplicate recipe id: ${c.id}`); continue; }
    RECIPES[c.id] = c;
  }
}

if (LOAD_ERRORS.length > 0 && !(globalThis as { __GNOMOMIA_LINT__?: boolean }).__GNOMOMIA_LINT__) {
  throw new Error(`content packs failed to load:\n${LOAD_ERRORS.join('\n')}`);
}

/** An NPC's greetings in check order: pack greetings first, then its own. */
export function npcGreetings(id: string): Greeting[] {
  return [...(GREETINGS_FIRST[id] ?? []), ...(NPCS[id]?.greetings ?? [])];
}
