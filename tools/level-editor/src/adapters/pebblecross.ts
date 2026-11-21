// Pebblecross: the town as a level document (games/pebblecross/src/data/levels/pebblecross.level.json). The town is one flat
// map (single level). The ground is the file's stamps, applied the way the game applies them; the ground colour is data.ground.
// What stands in the town is drawn where it is: props (prefabs), buildings, blockers, ponds, and the markers (places, forage
// patches, the spawn). Markers are moved and edited but not added or deleted: their ids are fixed by docs/roadmaps/pebblecross.md.
// Everything the editor does not change (stamps, roads, the file's key order) is kept exactly as the file has it.
import * as THREE from 'three';
import { applyStamps, validateLevelDoc, type PathDef, type Stamp } from '@lawn/level';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { ZoneDef } from '@gnomomia/config';
import type { CollectionDef, EditorContext, FieldDef, GameAdapter, Item, MutableZone, World } from '../context';
import { createStubTerrain } from './stubTerrain';
import townFile from '../../../../games/pebblecross/src/data/levels/pebblecross.level.json';

const REBUILD_MS = 300;

/** A prop as the town file has it (rot, scale and solidR are optional). */
export interface PebblecrossProp { prefab: string; x: number; z: number; rot?: number; scale?: number; solidR?: number }
interface Circle { x: number; z: number; r: number }
interface Box { x: number; z: number; w: number; d: number }

/** A building with its colours as 0xRRGGBB numbers (the file keeps '#rrggbb' strings). */
export interface PebblecrossBuilding { id: string; label: string; x: number; z: number; w: number; d: number; h: number; color: number; roof: number }

/** A marker, flat: `label` is a place's data.label, `item` a forage patch's data.item. The spawn has neither radius nor data. */
export interface PebblecrossMarker { id: string; x: number; z: number; r?: number; label?: string; item?: string }

/** The town as the editor holds it. Each kind of thing is its own flat list so the Select tool can place and move it. */
export interface PebblecrossLevel {
  id: string;
  name: string;
  w: number;
  d: number;
  /** Where the camera starts: the town's centre, and half its larger side. */
  origin: { x: number; z: number };
  half: number;
  /** The ground colour as the file has it ('#rrggbb'). */
  ground: string;
  /** The town's terrain stamps: kept as they are. */
  stamps: Stamp[];
  /** The roads: kept as they are. */
  paths: PathDef[];
  props: PebblecrossProp[];
  spawn: PebblecrossMarker[];
  places: PebblecrossMarker[];
  forage: PebblecrossMarker[];
  ponds: Circle[];
  blockers: Box[];
  buildings: PebblecrossBuilding[];
}

interface TownFileMarker { id: string; kind: string; x: number; z: number; r?: number; data?: Record<string, unknown> }
interface TownFileBuilding { id: string; label: string; x: number; z: number; w: number; d: number; h: number; color: string; roof: string }

/** The town file's shape (format `lawn-level`; data is the town's TownData). */
export interface TownFile {
  format: string;
  version: number;
  game: string;
  id: string;
  name: string;
  bounds: { w: number; d: number };
  stamps: Stamp[];
  paths: PathDef[];
  props: PebblecrossProp[];
  markers: TownFileMarker[];
  data: { ground: string; ponds: Circle[]; blockers: Box[]; buildings: TownFileBuilding[] };
}

/** The town file the game loads (games/pebblecross/src/data/levels/pebblecross.level.json). */
export const TOWN_FILE = townFile as unknown as TownFile;

const hexOf = (colour: number): string => `#${colour.toString(16).padStart(6, '0')}`;
const numOf = (hex: string): number => parseInt(hex.replace('#', ''), 16);

/** The ground colour as 0xRRGGBB, for drawing. */
export function groundColour(ground: string): number {
  return numOf(ground);
}

/** The editor's level from a town file. Every list is a copy: editing it does not change the file until it is saved. */
export function docToLevel(file: TownFile = TOWN_FILE): PebblecrossLevel {
  const d = structuredClone(file);
  const markersOf = (kind: string): TownFileMarker[] => d.markers.filter((m) => m.kind === kind);
  return {
    id: d.id,
    name: d.name,
    w: d.bounds.w,
    d: d.bounds.d,
    origin: { x: 0, z: 0 },
    half: Math.max(d.bounds.w, d.bounds.d) / 2,
    ground: d.data.ground,
    stamps: d.stamps,
    paths: d.paths,
    props: d.props,
    spawn: markersOf('spawn').map((m) => ({ id: m.id, x: m.x, z: m.z })),
    places: markersOf('place').map((m) => ({ id: m.id, x: m.x, z: m.z, r: m.r, label: m.data?.label as string | undefined })),
    forage: markersOf('forage').map((m) => ({ id: m.id, x: m.x, z: m.z, r: m.r, item: m.data?.item as string | undefined })),
    ponds: d.data.ponds,
    blockers: d.data.blockers,
    buildings: d.data.buildings.map((b) => ({ id: b.id, label: b.label, x: b.x, z: b.z, w: b.w, d: b.d, h: b.h, color: numOf(b.color), roof: numOf(b.roof) })),
  };
}

/** The town file for the level as it is now (the file's own key order). */
export function levelToDoc(level: PebblecrossLevel): TownFile {
  const markers: TownFileMarker[] = [
    ...level.spawn.map((m) => ({ id: m.id, kind: 'spawn', x: m.x, z: m.z })),
    ...level.places.map((m) => ({ id: m.id, kind: 'place', x: m.x, z: m.z, r: m.r, data: { label: m.label } })),
    ...level.forage.map((m) => ({ id: m.id, kind: 'forage', x: m.x, z: m.z, r: m.r, data: { item: m.item } })),
  ];
  return {
    format: 'lawn-level',
    version: 1,
    game: 'pebblecross',
    id: level.id,
    name: level.name,
    bounds: { w: level.w, d: level.d },
    stamps: level.stamps,
    paths: level.paths,
    props: level.props,
    markers,
    data: {
      ground: level.ground,
      ponds: level.ponds,
      blockers: level.blockers,
      buildings: level.buildings.map((b) => ({ id: b.id, label: b.label, x: b.x, z: b.z, w: b.w, d: b.d, h: b.h, color: hexOf(b.color), roof: hexOf(b.roof) })),
    },
  };
}

export const asZone = (level: PebblecrossLevel): ZoneDef => level as unknown as ZoneDef;

// ---------------------------------------------------------------- the Select tool

const lvl = (d: MutableZone): PebblecrossLevel => d as unknown as PebblecrossLevel;
const num = (key: string, label: string, step = 0.1, min?: number): FieldDef => ({ key, label, type: 'number', step, min });
const txt = (key: string, label: string): FieldDef => ({ key, label, type: 'text' });

/** The next id of a kind that no item of that list uses yet. */
function nextId(items: readonly { id: string }[], prefix: string): string {
  const used = new Set(items.map((i) => i.id));
  let n = items.length + 1;
  while (used.has(`${prefix}-${n}`)) n += 1;
  return `${prefix}-${n}`;
}

const newBuilding = (id: string, x: number, z: number): Item =>
  ({ id, label: 'New building', x, z, w: 4, d: 4, h: 2.4, color: 0xe8d9b5, roof: 0x8a4b2a }) as unknown as Item;

export const PEBBLECROSS_COLLECTIONS: readonly CollectionDef[] = [
  {
    // The places are the roadmap's fixed ids: moved and relabelled here, never added or deleted.
    id: 'places', label: 'Place', color: 0x6fd3c4, shape: 'circle', fixed: true,
    radius: (i) => Number(i.r),
    items: (d) => lvl(d).places as unknown as Item[],
    make: (x, z): Item => ({ id: 'place', x, z, r: 1.5, label: 'Place' }),
    fields: [num('r', 'Radius (m)', 0.1, 0.2), txt('label', 'Label')],
  },
  {
    id: 'forage', label: 'Forage patch', color: 0xf2c14e, shape: 'circle', fixed: true,
    radius: (i) => Number(i.r),
    items: (d) => lvl(d).forage as unknown as Item[],
    make: (x, z): Item => ({ id: 'forage', x, z, r: 0.6, item: 'dandelion' }),
    fields: [num('r', 'Radius (m)', 0.1, 0.2), txt('item', 'Gift id')],
  },
  {
    id: 'spawn', label: 'Spawn', color: 0xff8fab, shape: 'circle', fixed: true,
    radius: () => 1,
    items: (d) => lvl(d).spawn as unknown as Item[],
    make: (x, z): Item => ({ id: 'spawn', x, z }),
    fields: [],
  },
  {
    id: 'ponds', label: 'Pond', color: 0x4aa3ff, shape: 'circle',
    radius: (i) => Number(i.r),
    items: (d) => lvl(d).ponds as unknown as Item[],
    make: (x, z): Item => ({ x, z, r: 2 }),
    fields: [num('r', 'Radius (m)', 0.1, 0.5)],
  },
  {
    id: 'blockers', label: 'Blocker', color: 0x8c877f, shape: 'rect',
    radius: (i) => Math.hypot(Number(i.w), Number(i.d)) / 2,
    items: (d) => lvl(d).blockers as unknown as Item[],
    make: (x, z): Item => ({ x, z, w: 1, d: 1 }),
    fields: [num('w', 'Width along x (m)', 0.1, 0.1), num('d', 'Depth along z (m)', 0.1, 0.1)],
  },
  {
    id: 'buildings', label: 'Building', color: 0xc98b5a, shape: 'rect',
    radius: (i) => Math.hypot(Number(i.w), Number(i.d)) / 2,
    items: (d) => lvl(d).buildings as unknown as Item[],
    make: (x, z): Item => newBuilding('building', x, z),
    makeIn: (d, x, z): Item => newBuilding(nextId(lvl(d).buildings, 'building'), x, z),
    fields: [
      txt('label', 'Name'),
      num('w', 'Width along x (m)', 0.1, 0.1),
      num('d', 'Depth along z (m)', 0.1, 0.1),
      num('h', 'Wall height (m)', 0.1, 0.1),
      { key: 'color', label: 'Walls', type: 'color' },
      { key: 'roof', label: 'Roof', type: 'color' },
    ],
  },
  {
    id: 'props', label: 'Prop', color: 0xf2d16b, shape: 'circle',
    radius: () => 1.2,
    items: (d) => lvl(d).props as unknown as Item[],
    make: (x, z): Item => ({ prefab: 'bench', x, z }),
    fields: [
      { key: 'prefab', label: 'Prefab', type: 'prefab' },
      num('rot', 'Rotation (rad)', 0.05),
      num('solidR', 'Solid radius (m, 0 = walk through)', 0.1, 0),
    ],
  },
];

// ---------------------------------------------------------------- the 3D view

const lambert = (colour: number, opts: { transparent?: boolean; opacity?: number } = {}): THREE.MeshLambertMaterial =>
  new THREE.MeshLambertMaterial({ color: colour, transparent: opts.transparent ?? false, opacity: opts.opacity ?? 1, flatShading: true });

function prefabOrPlaceholder(id: string): THREE.Object3D {
  try {
    return buildPrefab(id, { lights: false });
  } catch {
    // An unknown prefab still shows: a pink box, so it can be found and fixed (Save refuses it).
    return new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), lambert(0xff77aa));
  }
}

/** Draws the town: props (prefabs), buildings, blockers, ponds (in the `water` group, hidden by default), and the markers. */
export function createTownObjectView(ctx: EditorContext): { dispose(): void } {
  const scene = ctx.viewport.scene;
  const root = new THREE.Group();
  root.name = 'object-view';
  scene.add(root);
  const water = new THREE.Group();
  water.name = 'water';
  scene.add(water);

  function clear(g: THREE.Group): void {
    for (const c of [...g.children]) {
      g.remove(c);
      c.traverse((x) => {
        const m = x as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((k) => k.dispose());
      });
    }
  }

  function build(): void {
    clear(root);
    clear(water);
    const level = ctx.zones[ctx.zone] as unknown as PebblecrossLevel;
    const ground = (x: number, z: number): number => ctx.terrain.heightAt(x, z);

    for (const p of level.props) {
      const model = prefabOrPlaceholder(p.prefab);
      model.position.set(p.x, ground(p.x, p.z), p.z);
      model.rotation.y = p.rot ?? 0;
      model.scale.setScalar(p.scale ?? 1);
      root.add(model);
    }

    for (const b of level.buildings) {
      const base = ground(b.x, b.z);
      const walls = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), lambert(b.color));
      walls.position.set(b.x, base + b.h / 2, b.z);
      root.add(walls);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(b.w * 1.08, 0.5, b.d * 1.08), lambert(b.roof));
      roof.position.set(b.x, base + b.h + 0.25, b.z);
      root.add(roof);
    }

    for (const b of level.blockers) {
      const block = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.8, b.d), lambert(0x8c877f));
      block.position.set(b.x, ground(b.x, b.z) + 0.4, b.z);
      root.add(block);
    }

    for (const p of level.ponds) {
      const surface = new THREE.Mesh(
        new THREE.CircleGeometry(p.r * 0.95, 28),
        new THREE.MeshLambertMaterial({ color: 0x4aa3ff, transparent: true, opacity: 0.82 }),
      );
      surface.rotation.x = -Math.PI / 2;
      surface.position.set(p.x, ground(p.x, p.z) + 0.03, p.z);
      water.add(surface);
    }

    for (const m of level.places) {
      const r = Number(m.r ?? 1);
      const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.85, r, 24), new THREE.MeshBasicMaterial({ color: 0x6fd3c4, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(m.x, ground(m.x, m.z) + 0.05, m.z);
      root.add(ring);
    }

    for (const m of level.forage) {
      const patch = new THREE.Mesh(new THREE.SphereGeometry(Number(m.r ?? 0.6) * 0.6, 8, 6), lambert(0xf2c14e));
      patch.position.set(m.x, ground(m.x, m.z) + 0.2, m.z);
      root.add(patch);
    }

    for (const m of level.spawn) {
      const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8), lambert(0xff8fab));
      marker.position.set(m.x, ground(m.x, m.z) + 0.75, m.z);
      root.add(marker);
    }
  }

  build();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let alive = true;
  const rebuild = (): void => {
    if (timer !== undefined) return;
    timer = setTimeout(() => { timer = undefined; if (alive) build(); }, REBUILD_MS);
  };
  const off = ctx.events.changed.on(rebuild);
  return {
    dispose() {
      alive = false;
      clearTimeout(timer);
      off();
      clear(root);
      clear(water);
      scene.remove(root);
      scene.remove(water);
    },
  };
}

// ---------------------------------------------------------------- the adapter

function createWorld(): World {
  const level = docToLevel();
  const terrain = createStubTerrain({
    zone: asZone(level),
    w: level.w,
    d: level.d,
    heightAt: (x, z) => applyStamps(0, level.stamps, x, z),
    groundColourAt: () => groundColour(level.ground),
  });
  return {
    terrain,
    zones: { [level.id]: asZone(level) } as unknown as World['zones'],
    deltas: terrain.deltas,
    outdoorZones: [level.id] as unknown as World['outdoorZones'],
    setGatesOpen() {},
    gatesOpen: true,
  };
}

export const pebblecrossAdapter: GameAdapter = {
  id: 'pebblecross',
  label: 'Pebblecross',
  singleLevel: true,
  levels: () => [{ id: TOWN_FILE.id, name: TOWN_FILE.name }],
  createWorld,
  collections: PEBBLECROSS_COLLECTIONS,
  editableKeys: ['spawn', 'places', 'forage', 'ponds', 'blockers', 'buildings', 'props'],
  zoneRect: (def) => {
    const l = def as unknown as PebblecrossLevel;
    return { minX: -l.w / 2 - 4, maxX: l.w / 2 + 4, minZ: -l.d / 2 - 4, maxZ: l.d / 2 + 4 };
  },
  tools: ['view', 'select'],
  toDoc: (def) => {
    const doc = levelToDoc(def as unknown as PebblecrossLevel);
    return { game: doc.game, id: doc.id, doc };
  },
  createObjectView: createTownObjectView,
  beforeSave(ctx) {
    const level = ctx.zones[ctx.zone] as unknown as PebblecrossLevel;
    const problems = validateLevelDoc(levelToDoc(level));
    if (problems.length > 0) throw new Error(problems[0]);
    if (level.spawn.length !== 1) throw new Error('The town needs exactly one spawn marker.');
    for (const p of level.props) {
      if (!getPrefab(p.prefab)) throw new Error(`Prop prefab "${p.prefab}" does not exist. Fix it in Select > Prop (Browse lists every prefab).`);
    }
    const markerIds = [...level.spawn, ...level.places, ...level.forage].map((m) => m.id);
    const dupMarker = markerIds.find((id, i) => markerIds.indexOf(id) !== i);
    if (dupMarker) throw new Error(`The marker id "${dupMarker}" is used twice: ids must be unique.`);
    const buildingIds = level.buildings.map((b) => b.id);
    const dupBuilding = buildingIds.find((id, i) => buildingIds.indexOf(id) !== i);
    if (dupBuilding) throw new Error(`The building id "${dupBuilding}" is used twice: ids must be unique.`);
    for (const b of level.buildings) {
      if (!(b.w > 0 && b.d > 0 && b.h > 0)) throw new Error(`Building "${b.id}" needs a width, depth and height above 0.`);
    }
  },
};
