// Gnomokemon Snap's courses as something the editor can change. A course file (games/gnomeokemon/src/data/levels/<id>.level.json)
// keeps every kind of thing in one `markers` list; here each kind is its own flat list so the Select tool can place and move it.
// The islands, platforms and ponds also have terrain: the game builds that ground from the stamps the file holds, so on save
// their stamps are rebuilt from the markers (moving an island moves its ground). The other stamps (hills, terraces, the graded
// track, the ford) are the course's own and are edited as they are.
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
  /** The course's own terrain stamps (not the ones the islands, platforms and ponds make). */
  stamps: Stamp[];
  props: PropDef[];
  zones: GnomeZone[];
  cover: GnomeCover[];
  creatures: GnomeCreature[];
  ponds: GnomePond[];
  islands: GnomeIsland[];
  platforms: GnomePlatform[];
  /** The rail and the walls, as the file has them (drawn, not edited here). */
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

/** Stamps the game builds for a pond, an island and a platform (the numbers the course files were written with). */
export function derivedStamps(level: GnomeLevel): Stamp[] {
  const out: Stamp[] = [];
  for (const p of level.ponds) out.push({ op: 'flatten', x: p.x, z: p.z, inner: +(p.r * 0.9).toFixed(2), outer: +(p.r + 1.2).toFixed(2), to: p.level - 0.6 });
  for (const i of level.islands) out.push({ op: 'flatten', x: i.x, z: i.z, inner: i.r, outer: +(i.r + 1.6).toFixed(2), to: i.h });
  for (const p of level.platforms) out.push({ op: 'flatten', x: p.x, z: p.z, inner: p.r, outer: +(p.r + 1.4).toFixed(2), to: p.h });
  return out;
}

export function docToLevel(doc: GnomeCourseDoc): GnomeLevel {
  const d = structuredClone(doc);
  const ponds: GnomePond[] = markersOf(d, 'pond').map((m) => {
    const x = m.data as Record<string, unknown>;
    return { id: m.id, x: m.x, z: m.z, r: m.r ?? 0, level: Number(x.level ?? 0), color: Number(x.color ?? 0x3b8ec4), lava: x.lava === true };
  });
  const islands: GnomeIsland[] = markersOf(d, 'island').map((m) => ({ id: m.id, x: m.x, z: m.z, r: m.r ?? 0, h: Number((m.data as Record<string, unknown>).h ?? 0) }));
  const platforms: GnomePlatform[] = markersOf(d, 'platform').map((m) => ({ id: m.id, x: m.x, z: m.z, r: m.r ?? 0, h: Number((m.data as Record<string, unknown>).h ?? 0) }));
  // The derived stamps are the last ones in the file: ponds, then islands, then platforms.
  const derivedCount = ponds.length + islands.length + platforms.length;
  const authored = d.stamps.slice(0, d.stamps.length - derivedCount);
  const level: GnomeLevel = {
    id: d.id,
    name: d.name,
    w: d.bounds.w,
    d: d.bounds.d,
    origin: { x: 0, z: 0 },
    half: Math.max(d.bounds.w, d.bounds.d) / 2,
    stamps: authored,
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
    paths: d.paths,
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
  return {
    format: 'lawn-level',
    version: 1,
    game: 'gnomeokemon',
    id: level.id,
    name: level.name,
    bounds: { w: level.w, d: level.d },
    stamps: [...level.stamps, ...derivedStamps(level)],
    paths: level.paths,
    props: level.props,
    markers,
    data: level.data,
  };
}

/** The height of the course's ground at (x, z): its stamps (the file's own and the derived ones), on flat ground. */
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
