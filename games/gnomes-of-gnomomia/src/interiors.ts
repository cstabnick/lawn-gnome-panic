// Building interiors: the meshes of the room the player is in (walls, trim, door, furniture and its lights). Interiors
// are instances (zones parked far beyond the Deeps); terrain.ts gives them a flat floor and their colliders, dressing.ts
// their doormats, objects.ts their bookshelves and lecterns. Only the room you stand in is built: initInteriors watches
// 'zone-changed'. main.ts calls updateInteriorCutaway every frame so walls between the camera and the room hide.
// Layout data comes from src/data/interiors.ts via ZoneDef.interior (room-local; the room group sits at the zone origin).
import * as THREE from 'three';
import { WOOD_FROM_TINT, buildPrefab } from '@lawn/prefabs';
import type { FurnitureKind, FurniturePlacement, ZoneDef } from './config';
import { ZONES } from './content';
import { bus } from './events';
import { state } from './state';

/** Height of the room walls. */
export const WALL_HEIGHT = 2.6;

/** The four walls of the room built last, with the direction each one faces into the room (for the cutaway). */
let walls: { group: THREE.Group; inward: THREE.Vector3 }[] = [];

const matCache = new Map<number, THREE.MeshLambertMaterial>();
function mat(color: number): THREE.MeshLambertMaterial {
  let m = matCache.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: true });
    matCache.set(color, m);
  }
  return m;
}

type V3 = readonly [number, number, number];

/**
 * Adds a mesh at (x, y, z) in parent. Each mesh gets its own material and geometry (clearWorld disposes both of
 * every mesh in the room), so never share one between meshes.
 */
function put(parent: THREE.Object3D, geo: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, rot?: V3): THREE.Mesh {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/** Adds a box at (x, y, z) in parent. */
function box(parent: THREE.Object3D, w: number, h: number, d: number, color: number, x: number, y: number, z: number): THREE.Mesh {
  return put(parent, new THREE.BoxGeometry(w, h, d), mat(color).clone(), x, y, z);
}

/**
 * One piece of furniture, built in its own group at the origin facing +z (yaw 0 = facing the door); the caller
 * positions and turns the group. `c` is the placement's colour or a default for the kind. Wood parts use `c` or the
 * room's `trim` colour. Origin on the floor at the piece's centre, y up, front faces +z.
 */
export function buildFurniture(kind: FurnitureKind, c: number | undefined, trim: number): THREE.Group {
  // Furniture is drawn by the shared prefab library (packages/prefabs/src/catalog/furniture.ts, id = kind).
  // "Wood" kinds take the placement colour as their wood (trim); the rest take it as their main colour (tint).
  return WOOD_FROM_TINT.has(kind) ? buildPrefab(kind, { trim: c ?? trim }) : buildPrefab(kind, { tint: c, trim });
}

/** Builds the room's walls, door frame and furniture into parent. Called by world.ts once per interior build. */
export function buildInteriorRoom(parent: THREE.Object3D, def: ZoneDef): void {
  const inf = def.interior;
  walls = [];
  if (!inf) return;
  const { hw, hd, palette } = inf;
  const t = 0.3;
  const wall = (x: number, z: number, w: number, d: number, inward: THREE.Vector3): void => {
    const g = new THREE.Group();
    box(g, w, WALL_HEIGHT, d, palette.wall, x, WALL_HEIGHT / 2, z);
    // The trim's top stands 3 cm over the wall's: flush tops z-fight, and the overhead camera sees them.
    box(g, w + 0.02, 0.2, d + 0.02, palette.trim, x, WALL_HEIGHT - 0.07, z);
    parent.add(g);
    walls.push({ group: g, inward });
  };
  wall(0, -hd - t / 2, hw * 2 + t * 2, t, new THREE.Vector3(0, 0, 1));
  wall(0, hd + t / 2, hw * 2 + t * 2, t, new THREE.Vector3(0, 0, -1));
  wall(-hw - t / 2, 0, t, hd * 2, new THREE.Vector3(1, 0, 0));
  wall(hw + t / 2, 0, t, hd * 2, new THREE.Vector3(-1, 0, 0));
  // Door in the south wall (z = +hd), part of that wall's group so it hides with it.
  const south = walls[1].group;
  box(south, 1.1, 1.8, 0.1, palette.trim, 0, 0.9, hd - 0.02);

  for (const f of inf.layout) placeFurniture(parent, f, palette.trim);
}

function placeFurniture(parent: THREE.Object3D, f: FurniturePlacement, trim: number): void {
  const g = buildFurniture(f.kind, f.color, trim);
  g.position.set(f.x, 0, f.z);
  g.rotation.y = f.yaw ?? 0;
  g.scale.setScalar(f.scale ?? 1);
  parent.add(g);
}

let sceneRef: THREE.Scene | null = null;
/** The room built now (one at most), and the interior zone it belongs to. */
let room: THREE.Group | null = null;
let roomZone: string | null = null;

function disposeRoom(): void {
  if (!room) return;
  room.parent?.remove(room);
  room.traverse((o) => {
    // Prefab meshes share cached geometry and materials with every other copy and with icons: never dispose them.
    for (let a: THREE.Object3D | null = o; a; a = a.parent) if (a.userData.prefab) return;
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const material = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) material.forEach((x) => x.dispose());
    else if (material) material.dispose();
  });
  room = null;
  roomZone = null;
  walls = [];
}

/** Builds the room of the zone the player is in (if it is a building interior) and drops any other. */
function syncRoom(): void {
  if (!sceneRef) return;
  const def = ZONES[state.zone];
  if (roomZone === state.zone && room) return;
  disposeRoom();
  if (!def?.interior) return;
  const g = new THREE.Group();
  g.name = `interior:${def.id}`;
  const o = def.origin ?? { x: 0, z: 0 };
  g.position.set(o.x, 0, o.z);
  // Warm light: the world's indoor hemisphere is dim and blue; a room is lamplit.
  g.add(new THREE.HemisphereLight(0xfff0d8, 0x3a2a1a, 1.1));
  const lamp = new THREE.PointLight(def.interior.light, 2.5, 0, 0);
  lamp.position.set(0, 3.2, 0);
  g.add(lamp);
  buildInteriorRoom(g, def);
  sceneRef.add(g);
  room = g;
  roomZone = def.id;
}

/** Keeps the scene and builds the room the player is in now and after every zone change. Call once, after initZones. */
export function initInteriors(scene: THREE.Scene): void {
  sceneRef = scene;
  bus.on('zone-changed', () => syncRoom());
  syncRoom();
}

const wallPos = new THREE.Vector3();
/** Hides each wall that stands between the camera and the room. Cheap; call every frame. Also catches a zone change
 * that happened without an event (a save loaded before initInteriors). */
export function updateInteriorCutaway(camera: THREE.Camera): void {
  if (roomZone !== state.zone && (room || ZONES[state.zone]?.interior)) syncRoom();
  if (walls.length === 0) return;
  for (const w of walls) {
    // The camera is outside this wall when it is behind the wall's inward normal.
    w.group.children[0].getWorldPosition(wallPos);
    const side = (camera.position.x - wallPos.x) * w.inward.x + (camera.position.z - wallPos.z) * w.inward.z;
    w.group.visible = side > 0;
  }
}
