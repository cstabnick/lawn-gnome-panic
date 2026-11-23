// Club Gnome's maps as level documents (src/data/levels/<id>.level.json). The documents are the data; docToMap rebuilds
// the MapDef that world.ts draws and walk.ts walks, and mapToDoc is its inverse (the level editor saves through it).
import type { LevelDoc, MarkerDef } from '@lawn/level';
import { MAP_NAMES, type BuildingDef, type CounterDef, type PanelId, type GameKey, type MapDef, type MapId, type PortalDef, type Rect, type SeatDef, type SignDef, type SpotDef } from './config';
import arcade from './data/levels/arcade.level.json';
import gnomecino from './data/levels/gnomecino.level.json';
import market from './data/levels/market.level.json';
import park from './data/levels/park.level.json';
import row from './data/levels/row.level.json';
import salon from './data/levels/salon.level.json';
import town from './data/levels/town.level.json';

/** A building as stored: colours as '#rrggbb'. */
export type MapBuilding = Omit<BuildingDef, 'color' | 'roof'> & { color: string; roof: string };
/** A sign as stored: its colour, when it has one, as '#rrggbb'. */
export type MapSign = Omit<SignDef, 'color'> & { color?: string };
/** A floor patch as stored: colour as '#rrggbb'. */
export type MapPatch = Omit<NonNullable<MapDef['patches']>[number], 'color'> & { color: string };

/** The `data` block of a map document: everything the level has that the shared layers do not. */
export interface MapData {
  indoor: boolean;
  ground: string;
  wallColor?: string;
  buildings: MapBuilding[];
  blockers: Rect[];
  signs: MapSign[];
  patches?: MapPatch[];
}

interface PortalData { label: string; to: MapId; spawnX: number; spawnZ: number }
interface SpotData { label: string; game: GameKey }
interface SeatData { label: string; facing: number; y: number }
interface CounterData { label: string; panel: PanelId }

/** The level document of every map (the files in src/data/levels/). */
export const MAP_DOCS: Record<MapId, LevelDoc<MapData>> = {
  town: town as unknown as LevelDoc<MapData>,
  gnomecino: gnomecino as unknown as LevelDoc<MapData>,
  arcade: arcade as unknown as LevelDoc<MapData>,
  park: park as unknown as LevelDoc<MapData>,
  row: row as unknown as LevelDoc<MapData>,
  market: market as unknown as LevelDoc<MapData>,
  salon: salon as unknown as LevelDoc<MapData>,
};

const toHex = (n: number): string => '#' + n.toString(16).padStart(6, '0');
const fromHex = (s: string): number => parseInt(s.slice(1), 16);

/** A document as a MapDef. Copied, so nothing the game does to a map can change the imported document. */
export function docToMap(doc: LevelDoc<MapData>): MapDef {
  const copy = structuredClone(doc);
  const { data } = copy;
  let spawn = { x: 0, z: 0 };
  const portals: PortalDef[] = [];
  const spots: SpotDef[] = [];
  const seats: SeatDef[] = [];
  const counters: CounterDef[] = [];
  for (const m of copy.markers) {
    if (m.kind === 'spawn') {
      spawn = { x: m.x, z: m.z };
    } else if (m.kind === 'portal') {
      const d = m.data as unknown as PortalData;
      portals.push({ id: m.id, label: d.label, x: m.x, z: m.z, r: m.r ?? 0, to: d.to, spawnX: d.spawnX, spawnZ: d.spawnZ });
    } else if (m.kind === 'spot') {
      const d = m.data as unknown as SpotData;
      spots.push({ id: m.id, label: d.label, x: m.x, z: m.z, r: m.r ?? 0, game: d.game });
    } else if (m.kind === 'seat') {
      const d = m.data as unknown as SeatData;
      seats.push({ id: m.id, label: d.label, x: m.x, z: m.z, r: m.r ?? 0, facing: d.facing, y: d.y });
    } else if (m.kind === 'counter') {
      const d = m.data as unknown as CounterData;
      counters.push({ id: m.id, label: d.label, x: m.x, z: m.z, r: m.r ?? 0, panel: d.panel });
    }
  }
  return {
    id: copy.id as MapId,
    w: copy.bounds.w,
    d: copy.bounds.d,
    ground: fromHex(data.ground),
    indoor: data.indoor,
    ...(data.wallColor !== undefined ? { wallColor: fromHex(data.wallColor) } : {}),
    spawn,
    buildings: data.buildings.map((b) => mapColours(b, fromHex, ['color', 'roof']) as unknown as BuildingDef),
    props: copy.props,
    blockers: data.blockers,
    portals,
    spots,
    seats,
    counters,
    signs: data.signs.map((s) => mapColours(s, fromHex, ['color']) as unknown as SignDef),
    ...(data.patches ? { patches: data.patches.map((p) => mapColours(p, fromHex, ['color']) as unknown as NonNullable<MapDef['patches']>[number]) } : {}),
  };
}

/** Converts the named colour fields of an object in place, so the keys keep their order (a load followed by a save must not
 * reorder anything: the saved file would differ from the original for no reason). */
function mapColours<T extends object, V>(o: T, f: (v: never) => V, keys: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, keys.includes(k) && v !== undefined ? f(v as never) : v]));
}

/** A MapDef as its level document: the inverse of docToMap. Colours become '#rrggbb'; markers keep their file order. */
export function mapToDoc(map: MapDef): LevelDoc<MapData> {
  const markers: MarkerDef[] = [
    { id: 'spawn', kind: 'spawn', x: map.spawn.x, z: map.spawn.z },
    ...map.portals.map((p): MarkerDef => ({
      id: p.id, kind: 'portal', x: p.x, z: p.z, r: p.r,
      data: { label: p.label, to: p.to, spawnX: p.spawnX, spawnZ: p.spawnZ },
    })),
    ...map.spots.map((s): MarkerDef => ({ id: s.id, kind: 'spot', x: s.x, z: s.z, r: s.r, data: { label: s.label, game: s.game } })),
    ...map.seats.map((s): MarkerDef => ({
      id: s.id, kind: 'seat', x: s.x, z: s.z, r: s.r,
      data: { label: s.label, facing: s.facing, y: s.y },
    })),
    ...map.counters.map((c): MarkerDef => ({ id: c.id, kind: 'counter', x: c.x, z: c.z, r: c.r, data: { label: c.label, panel: c.panel } })),
  ];
  return {
    format: 'lawn-level',
    version: 1,
    game: 'club-gnome',
    id: map.id,
    name: MAP_NAMES[map.id],
    bounds: { w: map.w, d: map.d },
    stamps: [],
    paths: [],
    props: map.props.map((p) => ({ ...p })),
    markers,
    data: {
      indoor: map.indoor,
      ground: toHex(map.ground),
      ...(map.wallColor !== undefined ? { wallColor: toHex(map.wallColor) } : {}),
      buildings: map.buildings.map((b) => mapColours(b, toHex, ['color', 'roof']) as unknown as MapData['buildings'][number]),
      blockers: map.blockers.map((r) => ({ ...r })),
      signs: map.signs.map((s) => mapColours(s, toHex, ['color']) as unknown as MapSign),
      ...(map.patches ? { patches: map.patches.map((p) => mapColours(p, toHex, ['color']) as unknown as NonNullable<MapData['patches']>[number]) } : {}),
    },
  };
}
