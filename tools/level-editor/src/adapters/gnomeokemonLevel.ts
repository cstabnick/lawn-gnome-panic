// Gnomokemon Snap's courses as something the editor can change. A course file (games/gnomeokemon/src/data/levels/<id>.level.json)
// keeps every kind of thing in one `markers` list; here each kind is its own flat list so the Select tool can place and move it.
//
// Three things in a course file are derived, so the editor rebuilds them on save and nothing drifts:
//  - the rail (the dog's path): its nodes are `rail`, each with a lift; the file's `paths` rail and `data.railLift` come from them.
//  - the graded track under the rail (flatten to 0, inside 2.6 m, banked to 5 m), and on the lawn the ford's stream bed;
//  - the ground of each pond, island and platform (their markers are their stamps).
// Everything else in `stamps` is the course's own (hills, pits, terraces) and is edited as it is.
import { applyStamps, type LevelDoc, type PathDef, type PropDef, type Stamp } from '@lawn/level';
import type { ZoneDef } from '@gnomomia/config';
import lawn from '@gnomeokemon/data/levels/lawn.level.json';
import desert from '@gnomeokemon/data/levels/desert.level.json';
import depths from '@gnomeokemon/data/levels/depths.level.json';
import kiln from '@gnomeokemon/data/levels/kiln.level.json';
import ocean from '@gnomeokemon/data/levels/ocean.level.json';
import night from '@gnomeokemon/data/levels/night.level.json';
import frost from '@gnomeokemon/data/levels/frost.level.json';
import city from '@gnomeokemon/data/levels/city.level.json';

export interface GnomeCourseData {
  railLift: number[];
  cave?: boolean;
  city?: boolean;
  wallStyles?: Record<string, string>;
}

export type GnomeCourseDoc = LevelDoc<GnomeCourseData>;

export interface GnomeRailNode { x: number; z: number; lift: number }
export interface GnomeZone { id: string; x: number; z: number; r: number }
export interface GnomeCover { id: string; x: number; z: number }
export interface GnomeCreature {
  id: string; x: number; z: number;
  species: string; zone: number; lift: number; rotY: number;
  behavior: string; speed: number; radius: number;
  scale?: number; phase?: number; bob?: number;
}
export interface GnomePond { id: string; x: number; z: number; r: number; level: number; color: number; lava: boolean }
export interface GnomeIsland { id: string; x: number; z: number; r: number; h: number }
export interface GnomePlatform { id: string; x: number; z: number; r: number; h: number }

export interface GnomeLevel {
  id: string;
  name: string;
  w: number;
  d: number;
  /** Where the camera starts: the course's centre, and half its larger side (the editor frames the map from these). */
  origin: { x: number; z: number };
  half: number;
  /** The course's own terrain stamps (hills, pits, terraces); the derived ones are added by groundStamps(). */
  stamps: Stamp[];
  /** The dog's path, in order: each node is a point of the rail with its lift above the ground. */
  rail: GnomeRailNode[];
  props: PropDef[];
  zones: GnomeZone[];
  cover: GnomeCover[];
  creatures: GnomeCreature[];
  ponds: GnomePond[];
  islands: GnomeIsland[];
  platforms: GnomePlatform[];
  /** The walls (drawn; their styles are in data.wallStyles). The rail is not here: it is `rail`. */
  paths: PathDef[];
  data: GnomeCourseData;
}

/** Every course's document, by id (the files the game loads). */
export const DOCS: Record<string, GnomeCourseDoc> = {
  lawn: lawn as unknown as GnomeCourseDoc,
  desert: desert as unknown as GnomeCourseDoc,
  depths: depths as unknown as GnomeCourseDoc,
  kiln: kiln as unknown as GnomeCourseDoc,
  ocean: ocean as unknown as GnomeCourseDoc,
  night: night as unknown as GnomeCourseDoc,
  frost: frost as unknown as GnomeCourseDoc,
  city: city as unknown as GnomeCourseDoc,
};

/** Each course's id and name, for the header. */
export const COURSE_LIST: { id: string; name: string }[] = Object.values(DOCS).map((d) => ({ id: d.id, name: d.name }));

/** The ground colour of each course (the same colours the game uses). */
export const GROUND_COLOUR: Record<string, number> = {
  lawn: 0x5c9442, desert: 0xd9b36c, depths: 0x1c4a5c, kiln: 0x3b2d29, ocean: 0x2a6668, night: 0x1e2c2b, frost: 0xeef6fa, city: 0x3a3d42,
};

const markersOf = (doc: GnomeCourseDoc, kind: string) => doc.markers.filter((m) => m.kind === kind);

// ---- the rail's derived ground (the same numbers the game's level generator used)

/** Points spaced `step` apart along the polyline, with the last point at the end. */
function railSamples(points: readonly [number, number][], step: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
    for (let s = 0; s < n; s++) out.push([ax + ((bx - ax) * s) / n, az + ((bz - az) * s) / n]);
  }
  out.push(points[points.length - 1]);
  return out;
}

/** The graded track: levelled to 0 inside 2.6 m of the rail, banked out to 5 m. */
export function gradeStamps(points: readonly [number, number][]): Stamp[] {
  return railSamples(points, 2).map(([x, z]): Stamp => ({ op: 'flatten', x: +x.toFixed(2), z: +z.toFixed(2), inner: 2.6, outer: 5, to: 0 }));
}

/** The lawn's ford: a stream bed at -0.3 along the rail between z 1.5 and 11.5. */
export function fordStamps(points: readonly [number, number][]): Stamp[] {
  const out: Stamp[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    for (let s = 0; s <= 6; s++) {
      const t = s / 6;
      const x = +(ax + (bx - ax) * t).toFixed(2);
      const z = +(az + (bz - az) * t).toFixed(2);
      if (z < 1.5 || z > 11.5) continue;
      if (out.some((o) => Math.hypot((o as { x: number }).x - x, (o as { z: number }).z - z) < 0.6)) continue;
      out.push({ op: 'flatten', x, z, inner: 1.3, outer: 2.2, to: -0.3 });
    }
  }
  return out;
}

const isGrade = (s: Stamp): boolean => s.op === 'flatten' && s.to === 0 && s.inner === 2.6 && s.outer === 5;
const isFord = (s: Stamp): boolean => s.op === 'flatten' && s.to === -0.3 && s.inner === 1.3 && s.outer === 2.2;

/** Stamps the game builds for a pond, an island and a platform. */
export function derivedStamps(level: GnomeLevel): Stamp[] {
  const out: Stamp[] = [];
  for (const p of level.ponds) out.push({ op: 'flatten', x: p.x, z: p.z, inner: +(p.r * 0.9).toFixed(2), outer: +(p.r + 1.2).toFixed(2), to: p.level - 0.6 });
  for (const i of level.islands) out.push({ op: 'flatten', x: i.x, z: i.z, inner: i.r, outer: +(i.r + 1.6).toFixed(2), to: i.h });
  for (const p of level.platforms) out.push({ op: 'flatten', x: p.x, z: p.z, inner: p.r, outer: +(p.r + 1.4).toFixed(2), to: p.h });
  return out;
}

/** Every stamp the ground is made of, in the order the game applies them: the course's own, the track's grade, the lawn's ford, then the pools. */
export function groundStamps(level: GnomeLevel): Stamp[] {
  const points = level.rail.map((n): [number, number] => [n.x, n.z]);
  const ford = level.id === 'lawn' ? fordStamps(points) : [];
  return [...level.stamps, ...gradeStamps(points), ...ford, ...derivedStamps(level)];
}

export function docToLevel(doc: GnomeCourseDoc): GnomeLevel {
  const d = structuredClone(doc);
  const ponds: GnomePond[] = markersOf(d, 'pond').map((m) => {
    const x = m.data as Record<string, unknown>;
    return { id: m.id, x: m.x, z: m.z, r: m.r ?? 0, level: Number(x.level ?? 0), color: Number(x.color ?? 0x3b8ec4), lava: x.lava === true };
  });
  const islands: GnomeIsland[] = markersOf(d, 'island').map((m) => ({ id: m.id, x: m.x, z: m.z, r: m.r ?? 0, h: Number((m.data as Record<string, unknown>).h ?? 0) }));
  const platforms: GnomePlatform[] = markersOf(d, 'platform').map((m) => ({ id: m.id, x: m.x, z: m.z, r: m.r ?? 0, h: Number((m.data as Record<string, unknown>).h ?? 0) }));
  // The file's stamps: the course's own, the track's grade and the ford (all but the last ones are the course's), then the pools.
  // The derived ones are the last ones in the file: ponds, then islands, then platforms.
  const derivedCount = ponds.length + islands.length + platforms.length;
  const railPath = d.paths.find((p) => p.id === 'rail' && p.kind === 'road');
  const rail: GnomeRailNode[] = (railPath?.points ?? []).map(([x, z], i) => ({ x, z, lift: d.data.railLift[i] ?? 0 }));
  const level: GnomeLevel = {
    id: d.id,
    name: d.name,
    w: d.bounds.w,
    d: d.bounds.d,
    origin: { x: 0, z: 0 },
    half: Math.max(d.bounds.w, d.bounds.d) / 2,
    stamps: d.stamps.slice(0, d.stamps.length - derivedCount).filter((s) => !isGrade(s) && !isFord(s)),
    rail,
    props: d.props,
    zones: markersOf(d, 'zone').map((m) => ({ id: m.id, x: m.x, z: m.z, r: m.r ?? 0 })),
    cover: markersOf(d, 'cover').map((m) => ({ id: m.id, x: m.x, z: m.z })),
    creatures: markersOf(d, 'creature').map((m): GnomeCreature => {
      const x = m.data as Record<string, unknown>;
      const c: GnomeCreature = {
        id: m.id, x: m.x, z: m.z,
        species: String(x.species), zone: Number(x.zone), lift: Number(x.lift ?? 0), rotY: Number(x.rotY ?? 0),
        behavior: String(x.behavior), speed: Number(x.speed), radius: Number(x.radius),
      };
      if (x.scale !== undefined) c.scale = Number(x.scale);
      if (x.phase !== undefined) c.phase = Number(x.phase);
      if (x.bob !== undefined) c.bob = Number(x.bob);
      return c;
    }),
    ponds,
    islands,
    platforms,
    paths: d.paths.filter((p) => p.id !== 'rail'),
    data: d.data,
  };
  return level;
}

export function levelToDoc(level: GnomeLevel): GnomeCourseDoc {
  const markers: GnomeCourseDoc['markers'] = [
    ...level.zones.map((z) => ({ id: z.id, kind: 'zone', x: z.x, z: z.z, r: z.r })),
    ...level.cover.map((c) => ({ id: c.id, kind: 'cover', x: c.x, z: c.z })),
    ...level.creatures.map((c) => {
      const data: Record<string, unknown> = { species: c.species, zone: c.zone, lift: c.lift, rotY: c.rotY, behavior: c.behavior, speed: c.speed, radius: c.radius };
      if (c.scale !== undefined) data.scale = c.scale;
      if (c.phase !== undefined) data.phase = c.phase;
      if (c.bob !== undefined) data.bob = c.bob;
      return { id: c.id, kind: 'creature', x: c.x, z: c.z, data };
    }),
    ...level.ponds.map((p) => ({ id: p.id, kind: 'pond', x: p.x, z: p.z, r: p.r, data: { level: p.level, color: p.color, lava: p.lava } })),
    ...level.islands.map((i) => ({ id: i.id, kind: 'island', x: i.x, z: i.z, r: i.r, data: { h: i.h } })),
    ...level.platforms.map((p) => ({ id: p.id, kind: 'platform', x: p.x, z: p.z, r: p.r, data: { h: p.h } })),
  ];
  const railPath: PathDef = { id: 'rail', kind: 'road', points: level.rail.map((n): [number, number] => [n.x, n.z]) };
  return {
    format: 'lawn-level',
    version: 1,
    game: 'gnomeokemon',
    id: level.id,
    name: level.name,
    bounds: { w: level.w, d: level.d },
    stamps: groundStamps(level),
    paths: [railPath, ...level.paths],
    props: level.props,
    markers,
    data: { ...level.data, railLift: level.rail.map((n) => n.lift) },
  };
}

/** The height of the course's ground at (x, z) on flat ground, from the stamps (groundStamps(level)). */
export function heightAt(stamps: readonly Stamp[], x: number, z: number): number {
  return applyStamps(0, stamps, x, z);
}

/** The ground colour at (x, z): pools show their water or lava, islands and platforms their grass or stone, the rest the course's ground. */
export function groundColourAt(level: GnomeLevel, x: number, z: number): number {
  for (const p of level.ponds) if (Math.hypot(x - p.x, z - p.z) <= p.r * 0.95) return p.lava ? 0xff6a1a : p.color;
  for (const i of level.islands) if (Math.hypot(x - i.x, z - i.z) <= i.r) return 0x7a9a4a;
  for (const p of level.platforms) if (Math.hypot(x - p.x, z - p.z) <= p.r) return 0x9c8b6e;
  return level.data.city ? GROUND_COLOUR.city : GROUND_COLOUR[level.id] ?? 0x5c9442;
}

export const asZone = (level: GnomeLevel): ZoneDef => level as unknown as ZoneDef;
