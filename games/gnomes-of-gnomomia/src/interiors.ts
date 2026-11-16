// Building interiors: the meshes of the room the player is in (walls, trim, door, furniture and its lights). Interiors
// are instances (zones parked far beyond the Deeps); terrain.ts gives them a flat floor and their colliders, dressing.ts
// their doormats, objects.ts their bookshelves and lecterns. Only the room you stand in is built: initInteriors watches
// 'zone-changed'. main.ts calls updateInteriorCutaway every frame so walls between the camera and the room hide.
// Layout data comes from src/data/interiors.ts via ZoneDef.interior (room-local; the room group sits at the zone origin).
import * as THREE from 'three';
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

/** Adds a cylinder (or cone frustum) at (x, y, z) in parent. */
function cyl(parent: THREE.Object3D, rt: number, rb: number, h: number, color: number, x: number, y: number, z: number, seg = 10, rot?: V3): THREE.Mesh {
  return put(parent, new THREE.CylinderGeometry(rt, rb, h, seg), mat(color).clone(), x, y, z, rot);
}

/** Adds a cone standing on its base (point up) at (x, y, z) in parent. */
function cone(parent: THREE.Object3D, r: number, h: number, color: number, x: number, y: number, z: number, seg = 10, rot?: V3): THREE.Mesh {
  return put(parent, new THREE.ConeGeometry(r, h, seg), mat(color).clone(), x, y, z, rot);
}

/** Adds a ball at (x, y, z) in parent. */
function sphere(parent: THREE.Object3D, r: number, color: number, x: number, y: number, z: number, seg = 8): THREE.Mesh {
  return put(parent, new THREE.SphereGeometry(r, seg, Math.max(6, seg - 2)), mat(color).clone(), x, y, z);
}

/** Adds a flat ring lying in the floor plane (a hoop) at (x, y, z) in parent. */
function ring(parent: THREE.Object3D, r: number, tube: number, color: number, x: number, y: number, z: number): THREE.Mesh {
  return put(parent, new THREE.TorusGeometry(r, tube, 6, 12), mat(color).clone(), x, y, z, [Math.PI / 2, 0, 0]);
}

/** Adds an unlit glowing mesh (no shadows, no light of its own). */
function glow(parent: THREE.Object3D, geo: THREE.BufferGeometry, color: number, x: number, y: number, z: number): THREE.Mesh {
  const m = put(parent, geo, new THREE.MeshBasicMaterial({ color }), x, y, z);
  m.castShadow = false;
  m.receiveShadow = false;
  return m;
}

/**
 * One piece of furniture, built in its own group at the origin facing +z (yaw 0 = facing the door); the caller
 * positions and turns the group. `c` is the placement's colour or a default for the kind. Wood parts use `c` or the
 * room's `trim` colour. Origin on the floor at the piece's centre, y up, front faces +z.
 */
export function buildFurniture(kind: FurnitureKind, c: number | undefined, trim: number): THREE.Group {
  const g = new THREE.Group();
  const wood = c ?? trim;
  switch (kind) {
    case 'bed': {
      const blanket = c ?? 0x8a3b3b;
      box(g, 1.0, 0.25, 1.9, trim, 0, 0.125, 0);
      box(g, 0.96, 0.18, 1.5, blanket, 0, 0.34, 0.15);
      box(g, 0.5, 0.12, 0.32, 0xf2e8c9, 0, 0.5, -0.7);
      box(g, 1.0, 0.7, 0.08, trim, 0, 0.6, -0.95);
      box(g, 1.0, 0.4, 0.08, trim, 0, 0.45, 0.95);
      break;
    }
    case 'bedroll': {
      const cloth = c ?? 0x7a6a4a;
      box(g, 0.8, 0.05, 1.8, cloth, 0, 0.025, 0);
      cyl(g, 0.14, 0.14, 0.8, 0x5a4a34, 0, 0.16, -0.6, 8, [0, 0, Math.PI / 2]);
      break;
    }
    case 'table': {
      box(g, 1.2, 0.08, 0.8, wood, 0, 0.56, 0);
      for (const x of [-0.5, 0.5]) for (const z of [-0.33, 0.33]) box(g, 0.08, 0.56, 0.08, wood, x, 0.28, z);
      break;
    }
    case 'chair': {
      box(g, 0.5, 0.06, 0.5, wood, 0, 0.32, 0);
      for (const x of [-0.2, 0.2]) for (const z of [-0.2, 0.2]) box(g, 0.06, 0.32, 0.06, wood, x, 0.16, z);
      box(g, 0.5, 0.5, 0.06, wood, 0, 0.6, -0.22);
      break;
    }
    case 'stool': {
      cyl(g, 0.22, 0.22, 0.08, wood, 0, 0.36, 0, 10);
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        cyl(g, 0.035, 0.035, 0.36, wood, Math.cos(a) * 0.15, 0.18, Math.sin(a) * 0.15, 6);
      }
      break;
    }
    case 'bench': {
      box(g, 1.2, 0.08, 0.4, wood, 0, 0.46, 0);
      for (const x of [-0.45, 0.45]) box(g, 0.08, 0.42, 0.36, wood, x, 0.21, 0);
      break;
    }
    case 'hearth': {
      const stone = c ?? 0x8d8a84;
      box(g, 1.6, 1.4, 0.8, stone, 0, 0.7, 0);                // surround, back at z -0.4
      box(g, 0.9, 1.2, 0.6, stone, 0, 2.0, -0.1);             // chimney breast up to 2.6 m
      box(g, 1.8, 0.12, 0.9, 0x6a6660, 0, 1.46, 0);           // mantel
      box(g, 0.8, 0.6, 0.06, 0x141010, 0, 0.4, 0.41);         // dark opening
      glow(g, new THREE.ConeGeometry(0.14, 0.4, 8), 0xff8a1e, 0, 0.3, 0.42);
      const light = new THREE.PointLight(0xff9a3c, 1.5, 6, 1);
      light.position.set(0, 0.5, 0.6);
      g.add(light);
      break;
    }
    case 'barrel': {
      cyl(g, 0.3, 0.27, 0.9, wood, 0, 0.45, 0, 10);
      ring(g, 0.28, 0.025, 0x4a3018, 0, 0.2, 0);
      ring(g, 0.295, 0.025, 0x4a3018, 0, 0.7, 0);
      break;
    }
    case 'crate': {
      box(g, 0.6, 0.6, 0.6, wood, 0, 0.3, 0);
      box(g, 0.62, 0.06, 0.62, 0x4a3018, 0, 0.12, 0);
      box(g, 0.62, 0.06, 0.62, 0x4a3018, 0, 0.48, 0);
      break;
    }
    case 'sack': {
      const cloth = c ?? 0xc9b48a;
      cyl(g, 0.12, 0.24, 0.42, cloth, 0, 0.21, 0, 8);
      sphere(g, 0.07, 0x8a7450, 0, 0.45, 0, 6);
      break;
    }
    case 'rug': {
      // Receive shadows only: the rug lies flat on the floor.
      const weave = c ?? 0xb0603a;
      box(g, 2.2, 0.02, 1.5, 0x5e2f25, 0, 0.01, 0).castShadow = false;
      box(g, 1.9, 0.03, 1.2, weave, 0, 0.025, 0).castShadow = false;
      break;
    }
    case 'pot': {
      const clay = c ?? 0xb8673a;
      cyl(g, 0.2, 0.14, 0.36, clay, 0, 0.18, 0, 10);
      cyl(g, 0.22, 0.2, 0.06, clay, 0, 0.39, 0, 10);
      break;
    }
    case 'lamp': {
      const bulb = c ?? 0xffe6a0;
      cyl(g, 0.14, 0.16, 0.05, wood, 0, 0.025, 0, 8);
      cyl(g, 0.03, 0.03, 0.9, wood, 0, 0.5, 0, 6);
      glow(g, new THREE.SphereGeometry(0.14, 8, 6), bulb, 0, 1.0, 0);
      break;
    }
    case 'counter': {
      box(g, 2.0, 0.9, 0.7, wood, 0, 0.45, 0);                // body, back at z -0.35
      box(g, 2.1, 0.08, 0.8, 0x8d8a84, 0, 0.94, 0.05);        // worktop to 0.98
      break;
    }
    case 'altar': {
      const stone = c ?? 0xb8b0a0;
      box(g, 1.4, 0.9, 0.7, stone, 0, 0.45, 0);
      box(g, 1.5, 0.1, 0.85, 0xd8d0c0, 0, 0.95, 0);
      box(g, 0.9, 0.6, 0.03, 0x7a2a3a, 0, 0.5, 0.37);         // altar cloth
      for (const x of [-0.5, 0.5]) cyl(g, 0.03, 0.03, 0.2, 0xf2e8c9, x, 1.1, 0, 6);
      break;
    }
    case 'pew': {
      box(g, 1.6, 0.08, 0.45, wood, 0, 0.41, 0);              // seat top at 0.45
      box(g, 1.6, 0.36, 0.06, wood, 0, 0.62, -0.2);           // back to 0.8
      for (const x of [-0.7, 0.7]) box(g, 0.08, 0.4, 0.45, wood, x, 0.2, 0);
      break;
    }
    case 'workbench': {
      box(g, 1.8, 0.1, 0.8, wood, 0, 0.85, 0);                // top to 0.9
      for (const x of [-0.8, 0.8]) for (const z of [-0.32, 0.32]) box(g, 0.1, 0.8, 0.1, trim, x, 0.4, z);
      box(g, 0.4, 0.04, 0.22, 0x7a7f86, 0.4, 0.93, 0);        // metal plate
      break;
    }
    case 'anvil': {
      const metal = c ?? 0x5a5f66;
      box(g, 0.5, 0.3, 0.4, 0x3a3f46, 0, 0.15, 0);
      cyl(g, 0.14, 0.2, 0.2, 0x4a4f56, 0, 0.4, 0, 8);
      box(g, 0.7, 0.12, 0.36, metal, 0, 0.56, 0);             // face to 0.62
      cone(g, 0.06, 0.3, metal, 0.45, 0.56, 0, 8, [0, 0, -Math.PI / 2]);  // horn
      break;
    }
    case 'loom': {
      const cloth = c ?? 0x9a5a3a;
      box(g, 1.4, 0.1, 0.6, wood, 0, 0.05, 0);
      for (const x of [-0.65, 0.65]) box(g, 0.1, 1.5, 0.1, wood, x, 0.75, -0.2);
      box(g, 1.4, 0.1, 0.1, wood, 0, 1.45, -0.2);
      box(g, 1.1, 0.9, 0.03, cloth, 0, 0.85, -0.2);           // woven cloth
      break;
    }
    case 'cauldron': {
      const iron = c ?? 0x2a2a2a;
      sphere(g, 0.35, iron, 0, 0.45, 0, 10).scale.y = 0.85;
      ring(g, 0.34, 0.04, 0x1a1a1a, 0, 0.78, 0);
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        cyl(g, 0.03, 0.03, 0.2, 0x1a1a1a, Math.cos(a) * 0.25, 0.1, Math.sin(a) * 0.25, 6);
      }
      break;
    }
    case 'plant': {
      const leaf = c ?? 0x3f8f3f;
      cyl(g, 0.2, 0.15, 0.3, 0xb8673a, 0, 0.15, 0, 10);       // clay pot
      sphere(g, 0.18, leaf, 0, 0.5, 0, 8);
      sphere(g, 0.15, 0x4fa34a, 0.14, 0.42, 0.08, 8);
      sphere(g, 0.14, 0x2f7a33, -0.12, 0.44, -0.08, 8);
      break;
    }
    case 'painting': {
      // Wall piece: frame back at z -0.15, canvas at y 1.5.
      box(g, 0.9, 0.7, 0.1, trim, 0, 1.5, -0.1);
      box(g, 0.76, 0.56, 0.02, c ?? 0xe8dcc0, 0, 1.5, -0.03);
      box(g, 0.76, 0.26, 0.01, 0x9fd3e6, 0, 1.65, -0.02);     // sky
      box(g, 0.76, 0.14, 0.01, 0x5a8f3a, 0, 1.33, -0.02);     // hill
      break;
    }
    case 'wardrobe': {
      box(g, 1.1, 1.7, 0.6, wood, 0, 0.85, 0);                // back at z -0.3
      box(g, 1.2, 0.1, 0.66, trim, 0, 1.75, 0);               // cornice to 1.8 m
      for (const x of [-0.27, 0.27]) box(g, 0.5, 1.5, 0.03, trim, x, 0.85, 0.32);
      break;
    }
    case 'cupboard': {
      box(g, 1.1, 1.4, 0.5, wood, 0, 0.7, 0);                 // back at z -0.25
      for (const x of [-0.27, 0.27]) box(g, 0.5, 1.2, 0.03, trim, x, 0.7, 0.265);
      box(g, 1.2, 0.08, 0.5, trim, 0, 1.44, 0);
      break;
    }
    case 'millstone': {
      const stone = c ?? 0x8d9097;
      cyl(g, 0.9, 0.9, 0.4, 0x6a6e76, 0, 0.2, 0, 12);         // bed stone
      cyl(g, 0.85, 0.85, 0.2, stone, 0, 0.5, 0, 12);          // runner
      cyl(g, 0.1, 0.1, 0.08, trim, 0, 0.64, 0, 8);            // spindle
      break;
    }
    case 'bookshelf': {
      // Simple stand-in model (the real one is an object from objects.ts): back at z -0.22.
      box(g, 0.06, 2.0, 0.45, wood, -0.57, 1.0, 0.005);
      box(g, 0.06, 2.0, 0.45, wood, 0.57, 1.0, 0.005);
      box(g, 1.04, 1.9, 0.04, 0x2a1e12, 0, 1.0, -0.2);
      box(g, 1.2, 0.06, 0.45, wood, 0, 0.03, 0.005);
      box(g, 1.2, 0.06, 0.45, wood, 0, 1.97, 0.005);
      for (const y of [0.5, 1.0, 1.5]) box(g, 1.04, 0.06, 0.42, wood, 0, y, 0.005);
      break;
    }
    case 'lectern': {
      // Simple stand-in model (the real one is an object from objects.ts): a post, a sloped top and an open book.
      cyl(g, 0.2, 0.22, 0.06, wood, 0, 0.03, 0, 8);
      cyl(g, 0.05, 0.06, 0.9, wood, 0, 0.5, 0, 8);
      const top = new THREE.Group();
      top.position.set(0, 1.0, 0.05);
      top.rotation.x = 0.35;
      g.add(top);
      box(top, 0.6, 0.06, 0.45, wood, 0, 0, 0);
      box(top, 0.26, 0.02, 0.36, 0xf2e8c9, -0.14, 0.04, 0);
      box(top, 0.26, 0.02, 0.36, 0xf2e8c9, 0.14, 0.04, 0);
      break;
    }
    default: {
      box(g, 0.6, 0.6, 0.6, wood, 0, 0.3, 0);
      break;
    }
  }
  return g;
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
    box(g, w + 0.02, 0.2, d + 0.02, palette.trim, x, WALL_HEIGHT - 0.1, z);
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
