// The off-map story room sets (built at ROOM_ORIGIN), their themes, and their colliders for the LOS check.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { GnomeModel } from '@lawn/gnome';
import type { CutsceneRoom } from '../quests/types';
import type { Box } from '../types';
import { makeGnome } from '../gnomes';
import { BASE_SPEAKER_LOOK, CAST as CHARACTER_PRESETS } from './cast';

/** The stage is built here, far outside the map. */
export const ROOM_ORIGIN = new THREE.Vector3(3000, 0, 3000);
/** The Bodega & Sons corner (late-night cameos) sits this far from the room, inside the room group. */
export const BODEGA_OFFSET = new THREE.Vector3(30, 0, 0);

export interface RoomTheme { floor: number; wall: number; trim: number; ceiling: number; bg: number; light: number }

export const ROOM_THEMES: Record<CutsceneRoom, { floor: number; wall: number; trim: number; ceiling: number; bg: number; light: number }> = {
  'mulch-club': { floor: 0x2a1810, wall: 0x4a1218, trim: 0xc9a227, ceiling: 0x1a0a0c, bg: 0x0a0608, light: 0xffc27a },
  'side-valve': { floor: 0x2c2f33, wall: 0x444b52, trim: 0xf08a24, ceiling: 0x1f2326, bg: 0x111417, light: 0xffd28a },
  'cloverfield-barn': { floor: 0x4b3621, wall: 0x7a2b20, trim: 0xd9c28a, ceiling: 0x321c12, bg: 0x1a110b, light: 0xffe0a8 },
  'unmowed-hollow': { floor: 0x254024, wall: 0x1f3620, trim: 0x76b041, ceiling: 0x122214, bg: 0x0d190f, light: 0xbef29c },
  'fells-shrine': { floor: 0xc9dbe6, wall: 0x5b7083, trim: 0x7cf0ff, ceiling: 0x2c3b4a, bg: 0x14202b, light: 0xb8ecff },
  'dust-overlook': { floor: 0xb98d56, wall: 0x8d6338, trim: 0xffd23f, ceiling: 0x543a1e, bg: 0x281b0e, light: 0xffd78a },
  street: { floor: 0x3b3f45, wall: 0x2d3238, trim: 0xffd23f, ceiling: 0x1a1e24, bg: 0x121722, light: 0xdbe9ff },
};

/** Build `id`, scale it so its widest side (or height) is `size`, stand it on the floor, return it with its top height. */
export function fitPrefab(id: string, size: number, by: 'w' | 'h'): { obj: THREE.Group; top: number } {
  const obj = buildPrefab(id, { lights: false });
  const bb = new THREE.Box3().setFromObject(obj);
  const dim = by === 'h' ? bb.max.y - bb.min.y : Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z);
  const k = dim > 0 ? size / dim : 1;
  obj.scale.setScalar(k);
  return { obj, top: (bb.max.y - bb.min.y) * k };
}

function buildRoomShell(g: THREE.Group, room: CutsceneRoom): void {
  const theme = ROOM_THEMES[room] ?? ROOM_THEMES['mulch-club'];
  const outdoor = room === 'street' || room === 'unmowed-hollow' || room === 'dust-overlook' || room === 'fells-shrine';
  const mat = (c: number): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 });
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, c: number): void => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
    m.position.set(x, y, z);
    m.receiveShadow = true;
    g.add(m);
  };
  box(16, 0.1, 15, 0, -0.05, 0, theme.floor);
  if (!outdoor) {
    box(14, 4.2, 0.2, 0, 2.1, -6.6, theme.wall);
    box(0.2, 4.2, 13, -7.1, 2.1, 0, theme.wall);
    box(0.2, 4.2, 13, 7.1, 2.1, 0, theme.wall);
    box(14, 0.2, 13, 0, 4.3, 0, theme.ceiling);
    box(14, 0.12, 0.2, 0, 0.3, -6.45, theme.trim);
  }

  const lampLight = new THREE.PointLight(theme.light, 18, 22, 1.4);
  lampLight.position.set(-2.2, 2.8, -1.6);
  g.add(lampLight);
  const spot = new THREE.SpotLight(0xffe8c2, 30, 16, 0.55, 0.6, 1.4);
  spot.position.set(0, 4.2, -1.0);
  spot.target.position.set(0, 1, -3.2);
  g.add(spot, spot.target);
}

function buildThemedSet(g: THREE.Group, room: CutsceneRoom): void {
  const prop = (id: string, size: number, by: 'w' | 'h', x: number, y: number, z: number, yaw = 0): void => {
    const built = fitPrefab(id, size, by);
    built.obj.position.set(x, y, z);
    built.obj.rotation.y = yaw;
    g.add(built.obj);
  };
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, c: number, emissive = 0): void => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, emissive }),
    );
    m.position.set(x, y, z);
    g.add(m);
  };

  if (room === 'side-valve') {
    // Corrugated roll-up bay slats, orange trim, Black Dew barrels, wheelbarrow, workbench.
    for (let i = 0; i < 6; i++) box(5.4, 0.28, 0.14, 0, 0.5 + i * 0.42, -6.38, i % 2 === 0 ? 0x5c646d : 0x4a5159);
    box(5.8, 0.14, 0.2, 0, 3.1, -6.35, 0xf08a24, 0x5a2e04);
    prop('table', 2.4, 'w', 1.9, 0, -2.6, -0.2);
    prop('gta-dew-barrel', 1.1, 'h', -2.3, 0, -3.8, 0.4);
    prop('gta-dew-barrel', 1.1, 'h', -3.1, 0, -3.2, -0.3);
    prop('wheelbarrow', 2.0, 'w', 3.0, 0, -4.4, -0.7);
  } else if (room === 'cloverfield-barn') {
    // Red barn beams, haystacks, prize orange pumpkins on crates, Black Dew barrel.
    box(0.35, 4.2, 0.35, -4.2, 2.1, -5.8, 0x5c2018);
    box(0.35, 4.2, 0.35, 4.2, 2.1, -5.8, 0x5c2018);
    box(9.2, 0.32, 0.32, 0, 3.8, -5.8, 0x5c2018);
    prop('haystack', 1.7, 'w', -2.6, 0, -4.0, 0.2);
    prop('haystack', 1.5, 'w', 2.7, 0, -4.2, -0.4);
    prop('gta-dew-barrel', 1.1, 'h', -1.6, 0, -2.5, 0.3);
    const pumpkin = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xe6731e, roughness: 0.7 }),
    );
    pumpkin.scale.set(1.15, 0.8, 1.15);
    pumpkin.position.set(1.8, 0.36, -2.3);
    g.add(pumpkin);
  } else if (room === 'unmowed-hollow') {
    // Forest canopy backdrop, broadleaf trees, bushes, glowing Stopping Stone plinth.
    prop('broadleaf-tree', 4.6, 'h', -3.8, 0, -5.2, 0.3);
    prop('broadleaf-tree', 4.4, 'h', 3.9, 0, -5.0, -0.5);
    prop('round-bush', 2.0, 'w', -2.1, 0, -4.2, 0);
    prop('round-bush', 1.8, 'w', 2.2, 0, -4.4, 0.8);
    box(1.3, 0.65, 1.3, 1.7, 0.32, -2.5, 0x3b4d36);
    prop('stopping-stone', 0.85, 'h', 1.7, 0.65, -2.5, 0.4);
  } else if (room === 'fells-shrine') {
    // Ice-stone arch, snowdrifts, glowing cyan Aether crystals, flickering barrel fire.
    box(0.7, 3.6, 0.7, -2.4, 1.8, -5.2, 0x8ea6b8);
    box(0.7, 3.6, 0.7, 2.4, 1.8, -5.2, 0x8ea6b8);
    box(5.6, 0.7, 0.8, 0, 3.6, -5.2, 0xa8c2d4);
    prop('aether-crystal', 1.6, 'h', -2.6, 0, -3.4, 0.3);
    prop('aether-crystal', 1.4, 'h', 2.5, 0, -3.6, -0.5);
    box(0.7, 0.85, 0.7, 1.6, 0.42, -2.4, 0x4b4f54);
    box(0.45, 0.25, 0.45, 1.6, 0.92, -2.4, 0xff7a22, 0xc84600);
  } else if (room === 'dust-overlook') {
    // Sandbag parapet, desert cacti, tactical crate table, Black Dew barrel.
    box(9.0, 0.75, 0.65, 0, 0.38, -5.4, 0xb89664);
    prop('tall-cactus', 2.8, 'h', -3.4, 0, -4.2, 0.2);
    prop('tall-cactus', 2.4, 'h', 3.6, 0, -4.5, -0.3);
    prop('table', 2.0, 'w', 1.6, 0, -2.5, 0.15);
    prop('gta-dew-barrel', 1.1, 'h', -2.1, 0, -3.1, 0);
  } else if (room === 'mulch-club') {
    // Velvet back room: rug, bookshelves, armchair, lamp.
    prop('rug', 5.2, 'w', 0, 0.01, -2.0, 0);
    prop('bookshelf', 2.4, 'w', -3.6, 0, -6.1, 0);
    prop('bookshelf', 2.4, 'w', 3.6, 0, -6.1, 0);
    prop('lamp', 1.4, 'h', -2.4, 0, -4.6, 0);
    prop('table', 2.0, 'w', 1.6, 0, -2.4, 0);
  } else {
    // 'street': Turfton sidewalk storefront facade, neon sign, Acorn-Cola & Dandelion Fizz machines, picnic table.
    box(12, 3.8, 0.4, 0, 1.9, -6.0, 0x3b424c);
    box(4.6, 0.25, 0.35, 0, 3.1, -5.7, 0xffd23f, 0x8a6400);
    prop('gta-vending-cola', 1.6, 'h', -2.8, 0, -5.0, 0);
    prop('gta-vending-fizz', 1.6, 'h', 2.8, 0, -5.0, 0);
    prop('picnic-table', 2.2, 'w', 2.1, 0, -2.7, -0.25);
  }
}

function buildBodegaCorner(parent: THREE.Group): { keeper: GnomeModel; cat: THREE.Group } {
  const corner = new THREE.Group();
  corner.position.copy(BODEGA_OFFSET);
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, c: number, emissive = 0): void => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, emissive }),
    );
    m.position.set(x, y, z);
    corner.add(m);
  };
  box(9, 0.1, 8, 0, -0.05, 0, 0x26292e);
  box(9, 3.6, 0.2, 0, 1.8, -3.5, 0x1b2b34);
  // Warm neon Bodega & Sons window frame
  box(3.4, 0.14, 0.18, 0, 2.7, -3.35, 0xff5a36, 0x7a220c);
  box(2.8, 0.85, 0.9, 0, 0.42, -1.3, 0x6b4a2e);

  const bodegaLight = new THREE.PointLight(0xffb86c, 16, 14, 1.4);
  bodegaLight.position.set(0, 2.4, -0.8);
  corner.add(bodegaLight);

  const keeper = makeGnome(corner, { ...BASE_SPEAKER_LOOK, ...CHARACTER_PRESETS.bodega.look });
  keeper.object.scale.setScalar(1.25);

  // Asphalt the clay-dust tabby cat sitting on the counter batting a bottlecap
  const cat = new THREE.Group();
  const catMat = new THREE.MeshStandardMaterial({ color: 0x555a60, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.42), catMat);
  body.position.set(0, 0.11, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.2), catMat);
  head.position.set(0, 0.26, 0.16);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 10), new THREE.MeshStandardMaterial({ color: 0xd8342c }));
  cap.position.set(0.18, 0.02, 0.28);
  cat.add(body, head, cap);
  cat.position.set(0.8, 0.86, -1.25);
  corner.add(cat);
  parent.add(corner);
  return { keeper, cat };
}

export interface BuiltRoom {
  /** Positioned at ROOM_ORIGIN; add it to the scene. Everything in it is room-local. */
  group: THREE.Group;
  /** The Bodega corner's keeper and cat, when built. */
  bodega: { keeper: GnomeModel; cat: THREE.Group } | null;
}

/** Shell + themed set (when `set`, default on) + the Bodega corner (when `bodega`, default off), in a group at ROOM_ORIGIN. */
export function buildRoom(room: CutsceneRoom, opts: { set?: boolean; bodega?: boolean } = {}): BuiltRoom {
  const set = opts.set ?? true;
  const bodega = opts.bodega ?? false;
  const group = new THREE.Group();
  group.position.copy(ROOM_ORIGIN);
  buildRoomShell(group, room);
  if (set) buildThemedSet(group, room);
  return { group, bodega: bodega ? buildBodegaCorner(group) : null };
}

const colliderCache = new Map<CutsceneRoom, Box[]>();

/**
 * The room's walls, ceiling and big set pieces as room-local collider boxes for the LOS check. The floor, rugs and
 * anything below 5 cm are skipped, and so is anything 3 m or higher (the ceiling).
 */
export function roomColliders(room: CutsceneRoom): Box[] {
  const cached = colliderCache.get(room);
  if (cached) return cached;
  const { group } = buildRoom(room, { set: true, bodega: false });
  group.updateMatrixWorld(true);
  const boxes: Box[] = [];
  const bb = new THREE.Box3();
  for (const child of group.children) {
    // Lights and light targets are not solid.
    if (!(child as THREE.Mesh).isMesh && !(child as THREE.Group).isGroup) continue;
    bb.setFromObject(child);
    if (bb.max.y <= 0.05 || bb.min.y >= 3.0) continue;
    boxes.push({
      minX: bb.min.x - ROOM_ORIGIN.x,
      maxX: bb.max.x - ROOM_ORIGIN.x,
      minZ: bb.min.z - ROOM_ORIGIN.z,
      maxZ: bb.max.z - ROOM_ORIGIN.z,
      h: bb.max.y,
    });
  }
  colliderCache.set(room, boxes);
  return boxes;
}

