// A zone as a level document: the shared layers (stamps, paths, props) plus Gnomomia's own block (`data`).
import type { LevelDoc, MarkerDef, PathDef, PropDef, Stamp } from '@lawn/level';
import type { Deck, HouseDef, Region, ZoneDef, ZoneExit, ZoneId } from './config';
import { ORIGINS } from './data/layout';
import mossbottom from './data/levels/mossbottom.level.json';
import thatchford from './data/levels/thatchford.level.json';
import keep from './data/levels/keep.level.json';
import deeps from './data/levels/deeps.level.json';
import cloverfield from './data/levels/cloverfield.level.json';
import hedgewood from './data/levels/hedgewood.level.json';
import rockery from './data/levels/rockery.level.json';
import verge from './data/levels/verge.level.json';

/** The ZoneDef fields that are not a shared layer. Zone-local coordinates, like the old zone files. Colours are '#rrggbb'. */
export interface ZoneData {
  levels: [number, number];
  half: number;
  indoor?: boolean;
  /** 'authored': only the document's `paths` are roads (see terrainCore derivedRoadPaths). Absent: derived. */
  roadMode?: 'derived' | 'authored';
  spawn: { x: number; z: number };
  shrine: { x: number; z: number; name: string };
  regions: Region[];
  lakes: { x: number; z: number; r: number }[];
  houses: HouseDef[];
  decks?: Deck[];
  walls?: { x1: number; z1: number; x2: number; z2: number }[];
  theme: { ground: string; groundAlt: string; flora: ZoneDef['theme']['flora']; floraDensity: number; fog: string; sky: string; hilliness: number };
  exits: ZoneExit[];
}

/** The level document of every authored zone (the 8 files in src/data/levels/<id>.level.json). */
export const ZONE_DOCS: Partial<Record<ZoneId, LevelDoc<ZoneData>>> = {
  mossbottom: mossbottom as unknown as LevelDoc<ZoneData>,
  thatchford: thatchford as unknown as LevelDoc<ZoneData>,
  keep: keep as unknown as LevelDoc<ZoneData>,
  deeps: deeps as unknown as LevelDoc<ZoneData>,
  cloverfield: cloverfield as unknown as LevelDoc<ZoneData>,
  hedgewood: hedgewood as unknown as LevelDoc<ZoneData>,
  rockery: rockery as unknown as LevelDoc<ZoneData>,
  verge: verge as unknown as LevelDoc<ZoneData>,
};

const toHex = (n: number): string => '#' + n.toString(16).padStart(6, '0');
const fromHex = (s: string): number => parseInt(s.slice(1), 16);
const round = (v: number): number => Math.round(v * 1e6) / 1e6;

/** A document as a ZoneDef, zone-local (no origin yet): what src/data/zones/<id>.ts used to export. */
export function docToZone(doc: LevelDoc<ZoneData>): ZoneDef {
  // Copied so that nothing the game does to a zone can change the imported document.
  const copy = structuredClone(doc);
  const { theme, ...rest } = copy.data;
  return {
    ...rest,
    id: copy.id as ZoneId,
    name: copy.name,
    theme: {
      ground: fromHex(theme.ground), groundAlt: fromHex(theme.groundAlt), flora: theme.flora,
      floraDensity: theme.floraDensity, fog: fromHex(theme.fog), sky: fromHex(theme.sky), hilliness: theme.hilliness,
    },
    ...(copy.stamps.length ? { stamps: copy.stamps } : {}),
    ...(copy.paths.length ? { paths: copy.paths } : {}),
    ...(copy.props.length ? { props: copy.props } : {}),
    ...(copy.markers.length ? { markers: copy.markers } : {}),
  };
}

/** A zone in WORLD coordinates (def.origin set, as content.ts leaves it) back to its document: subtracts the origin from
 * every position (and from each exit's arriveX/arriveZ, using the destination zone's origin), drops what content.ts
 * generates (house door exits, default house ids), and writes colours as '#rrggbb'. */
export function worldZoneToDoc(def: ZoneDef): LevelDoc<ZoneData> {
  const o = def.origin ?? ORIGINS[def.id];
  // Adding a zone origin and taking it away again leaves float noise (-13.7 comes back as -13.699999999999989).
  // Positions are authored to millimetres, so round to micrometres.
  const sx = (x: number): number => round(x - o.x);
  const sz = (z: number): number => round(z - o.z);
  const pt = <T extends { x: number; z: number }>(p: T): T => ({ ...p, x: sx(p.x), z: sz(p.z) });

  // content.ts turns or shuts a house it could not place; undo exactly that, and keep any edit made since.
  const houses = def.houses.map((h): HouseDef => {
    const { authored, ...rest } = h;
    const out: HouseDef = pt(rest);
    if (authored) {
      if (authored.turnedYaw !== undefined && h.yaw === authored.turnedYaw) out.yaw = authored.yaw;
      if (authored.autoShut && h.interior === false) delete out.interior;
    }
    return out;
  });

  // Door exits are generated from houses by content.ts; the document keeps the house, not its door exit.
  const exits = def.exits.filter((e) => !e.door).map((e): ZoneExit => {
    const dest = ORIGINS[e.to];
    return { ...e, x: sx(e.x), z: sz(e.z), arriveX: round(e.arriveX - dest.x), arriveZ: round(e.arriveZ - dest.z) };
  });

  const stamps: Stamp[] = (def.stamps ?? []).map((s) => ({ ...s, x: sx(s.x), z: sz(s.z) }));
  const paths: PathDef[] = (def.paths ?? []).map((p) => ({ ...p, points: p.points.map(([x, z]): [number, number] => [sx(x), sz(z)]) }));
  const props: PropDef[] = (def.props ?? []).map((p) => ({ ...p, x: sx(p.x), z: sz(p.z) }));
  const markers: MarkerDef[] = (def.markers ?? []).map((m) => ({ ...m, x: sx(m.x), z: sz(m.z) }));

  const data: ZoneData = {
    levels: [def.levels[0], def.levels[1]],
    half: def.half,
    ...(def.indoor !== undefined ? { indoor: def.indoor } : {}),
    ...(def.roadMode === 'authored' ? { roadMode: 'authored' as const } : {}),
    spawn: pt(def.spawn),
    shrine: pt(def.shrine),
    regions: def.regions.map(pt),
    lakes: def.lakes.map(pt),
    houses,
    ...(def.decks?.length ? { decks: def.decks.map(pt) } : {}),
    ...(def.walls ? { walls: def.walls.map((w) => ({ x1: sx(w.x1), z1: sz(w.z1), x2: sx(w.x2), z2: sz(w.z2) })) } : {}),
    theme: {
      ground: toHex(def.theme.ground), groundAlt: toHex(def.theme.groundAlt), flora: def.theme.flora,
      floraDensity: def.theme.floraDensity, fog: toHex(def.theme.fog), sky: toHex(def.theme.sky), hilliness: def.theme.hilliness,
    },
    exits,
  };

  return {
    format: 'lawn-level', version: 1, game: 'gnomes-of-gnomomia', id: def.id, name: def.name,
    bounds: { w: 2 * def.half, d: 2 * def.half }, stamps, paths, props, markers, data,
  };
}
