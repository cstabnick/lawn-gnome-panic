// World objects: valves, statues, signs and the like that the player can use.
// Each zone's objects are built from three.js primitives and rebuilt when a flag or quest changes.
import * as THREE from 'three';
import { UI, type WorldObjectDef, type ZoneId } from './config';
import { ITEMS, OBJECTS } from './content';
import { bus, say } from './events';
import { addItem, countItem, removeItem } from './inventory';
import { checkCondition } from './quests';
import { readBook, setFlag, state } from './state';
import { heightAt } from './terrain';

type Builder = (g: THREE.Group, c: number) => void;

let activeScene: THREE.Scene | null = null;
let liveZones: ReadonlySet<ZoneId> | null = null;
let group: THREE.Group | null = null;
/** True while useObject runs, so the flag-set it triggers does not rebuild mid-use. */
let deferRefresh = false;

/** Lambert materials, one per colour, shared by all objects (never disposed). */
const matCache = new Map<number, THREE.MeshLambertMaterial>();
function mat(color: number): THREE.MeshLambertMaterial {
  let m = matCache.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: true });
    matCache.set(color, m);
  }
  return m;
}

function part(parent: THREE.Object3D, geo: THREE.BufferGeometry, color: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): void {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  parent.add(m);
}

const box = (w: number, h: number, d: number): THREE.BoxGeometry => new THREE.BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, seg = 8): THREE.CylinderGeometry => new THREE.CylinderGeometry(rt, rb, h, seg);

// One builder per model. `c` is the object's main colour (def.color or the model default).
const BUILDERS: Record<WorldObjectDef['model'], { color: number; build: Builder }> = {
  valve: {
    color: 0x7a7f86,
    build: (g, c) => {
      part(g, cyl(0.12, 0.12, 1.2), c, 0, 0.6, 0);
      part(g, cyl(0.1, 0.1, 0.6), c, 0.3, 0.9, 0, 0, 0, Math.PI / 2);
      part(g, new THREE.TorusGeometry(0.26, 0.05, 6, 12), 0xc62828, 0, 1.35, 0.14);
      part(g, cyl(0.06, 0.06, 0.08, 6), 0xc62828, 0, 1.35, 0.14, Math.PI / 2, 0, 0);
    },
  },
  statue: {
    color: 0x9aa0a6,
    build: (g, c) => {
      part(g, box(0.6, 0.2, 0.6), 0x7d828a, 0, 0.1, 0);
      part(g, cyl(0.2, 0.26, 0.6), c, 0, 0.5, 0);
      part(g, new THREE.SphereGeometry(0.2, 8, 6), 0xa8aeb4, 0, 1.0, 0);
      part(g, new THREE.ConeGeometry(0.22, 0.45, 7), c, 0, 1.3, 0);
    },
  },
  book: {
    color: 0x6b4a2b,
    build: (g, c) => {
      part(g, cyl(0.06, 0.08, 0.9, 6), c, 0, 0.45, 0);
      part(g, box(0.5, 0.06, 0.4), c, 0, 0.95, 0, -0.35, 0, 0);
      part(g, box(0.22, 0.03, 0.3), 0xf2e8c9, -0.12, 1.0, 0, -0.35, 0, 0);
      part(g, box(0.22, 0.03, 0.3), 0xf2e8c9, 0.12, 1.0, 0, -0.35, 0, 0);
    },
  },
  cart: {
    color: 0x8b5a2b,
    build: (g, c) => {
      part(g, box(0.9, 0.4, 0.6), c, 0, 0.5, 0);
      for (const x of [-0.38, 0.38]) {
        for (const z of [-0.34, 0.34]) part(g, cyl(0.15, 0.15, 0.08, 10), 0x2b2b2b, x, 0.15, z, Math.PI / 2, 0, 0);
      }
    },
  },
  chest: {
    color: 0x6d4420,
    build: (g, c) => {
      part(g, box(0.8, 0.45, 0.5), c, 0, 0.225, 0);
      part(g, box(0.82, 0.15, 0.52), 0x5a3616, 0, 0.525, 0);
      part(g, box(0.1, 0.12, 0.04), 0xd4af37, 0, 0.35, 0.26);
    },
  },
  sign: {
    color: 0x6b4a2b,
    build: (g, c) => {
      part(g, cyl(0.05, 0.05, 1.2, 6), c, 0, 0.6, 0);
      part(g, box(0.6, 0.4, 0.06), 0x9c7448, 0, 1.1, 0);
    },
  },
  stone: {
    color: 0x8d9097,
    build: (g, c) => {
      part(g, cyl(0.3, 0.36, 1.3, 6), c, 0, 0.65, 0);
    },
  },
  grave: {
    color: 0x9a9a9a,
    build: (g, c) => {
      part(g, box(0.7, 0.1, 0.25), 0x6b6b6b, 0, 0.05, 0);
      part(g, box(0.6, 0.9, 0.15), c, 0, 0.45, 0);
    },
  },
  post: {
    color: 0x7a5230,
    build: (g, c) => {
      part(g, cyl(0.1, 0.12, 1.5, 6), c, 0, 0.75, 0);
      part(g, box(0.7, 0.12, 0.12), c, 0, 1.2, 0);
    },
  },
  trough: {
    color: 0x5e4026,
    build: (g, c) => {
      part(g, box(1.6, 0.4, 0.5), c, 0, 0.2, 0);
      part(g, box(1.5, 0.05, 0.4), 0x3a6f8f, 0, 0.4, 0);
    },
  },
  bookshelf: {
    color: 0x6b4a2b,
    build: (g, c) => {
      // Frame 1.2 x 2.0 x 0.45, back at z -0.22 (front at +0.22). Four compartments, each with a row of spines.
      part(g, box(1.2, 2.0, 0.04), 0x4a3018, 0, 1.0, -0.2);
      part(g, box(0.06, 2.0, 0.45), c, -0.57, 1.0, 0.005);
      part(g, box(0.06, 2.0, 0.45), c, 0.57, 1.0, 0.005);
      for (const y of [0.03, 0.5, 1.0, 1.5, 1.97]) part(g, box(1.2, 0.06, 0.45), c, 0, y, 0.005);
      const spines = [0x8a2b2b, 0x2b5a8a, 0x3f7a3f, 0xb08a2b, 0x6a3f7a, 0xf2e8c9, 0x2b6a6a, 0xa0522d];
      const floors = [0.06, 0.53, 1.03, 1.53];
      for (let row = 0; row < floors.length; row++) {
        for (let i = 0; i < 8; i++) {
          const w = 0.06 + ((i * 3 + row) % 4) * 0.01;
          const h = 0.22 + ((i * 5 + row * 2) % 5) * 0.03;
          part(g, box(w, h, 0.3), spines[(i * 3 + row) % spines.length], -0.48 + i * 0.13, floors[row] + h / 2, 0.06);
        }
      }
    },
  },
  lectern: {
    color: 0x6b4a2b,
    build: (g, c) => {
      part(g, cyl(0.2, 0.22, 0.06, 8), c, 0, 0.03, 0);
      part(g, cyl(0.05, 0.06, 0.9, 6), c, 0, 0.5, 0);
      // A slanted top that tilts toward the reader (+z), with an open book of two cream pages.
      const slope = new THREE.Group();
      slope.position.set(0, 1.0, 0.05);
      slope.rotation.x = 0.35;
      g.add(slope);
      part(slope, box(0.6, 0.06, 0.45), c, 0, 0, 0);
      part(slope, box(0.26, 0.02, 0.36), 0xf2e8c9, -0.14, 0.04, 0);
      part(slope, box(0.26, 0.02, 0.36), 0xf2e8c9, 0.14, 0.04, 0);
    },
  },
  scroll: {
    color: 0xf2e8c9,
    build: (g, c) => {
      // A half-unrolled parchment on the ground, with a roll at each end (their axes run along z).
      part(g, box(0.5, 0.02, 0.32), c, 0, 0.02, 0);
      part(g, cyl(0.04, 0.04, 0.32, 6), c, -0.25, 0.04, 0, Math.PI / 2, 0, 0);
      part(g, cyl(0.04, 0.04, 0.32, 6), c, 0.25, 0.04, 0, Math.PI / 2, 0, 0);
    },
  },
  plaque: {
    color: 0x8d9097,
    build: (g, c) => {
      part(g, box(0.9, 0.2, 0.4), 0x7d828a, 0, 0.1, 0);       // stone base
      part(g, box(0.7, 0.9, 0.12), c, 0, 0.65, 0);            // upright slab, 0.2 to 1.1
      part(g, box(0.5, 0.6, 0.02), 0x4a4f56, 0, 0.65, 0.07);  // darker panel on the front face
    },
  },
  generic: {
    color: 0xd0c080,
    build: (g, c) => {
      part(g, new THREE.SphereGeometry(0.4, 10, 8), c, 0, 0.4, 0);
    },
  },
};

function buildObject(id: string, def: WorldObjectDef): THREE.Group {
  const spec = BUILDERS[def.model];
  const g = new THREE.Group();
  spec.build(g, def.color ?? spec.color);
  g.scale.setScalar(def.scale ?? 1);
  g.position.set(def.x, heightAt(def.x, def.z), def.z);
  g.rotation.y = def.yaw ?? 0;
  g.traverse((o) => {
    o.userData.objectId = id;
  });
  return g;
}

function disposeTree(root: THREE.Object3D): void {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) o.geometry.dispose();
  });
}

/** Places the objects of every live zone in the scene (rebuilt whole; there are few). */
export function setActiveObjectZones(scene: THREE.Scene, zones: ReadonlySet<ZoneId>): void {
  if (group) {
    group.parent?.remove(group);
    disposeTree(group);
    group = null;
  }
  activeScene = scene;
  liveZones = new Set(zones);

  const root = new THREE.Group();
  root.name = 'world-objects';
  for (const [id, def] of Object.entries(OBJECTS)) {
    if (!zones.has(def.zone)) continue;
    if (!checkCondition(def.when)) continue;
    if (def.once && (state.objects[id] ?? 0) >= 1) continue;
    root.add(buildObject(id, def));
  }
  scene.add(root);
  group = root;
}

/** Rebuilds the current zone's objects, since a flag or quest may have made one appear. */
function refresh(): void {
  if (deferRefresh || !activeScene || !liveZones) return;
  setActiveObjectZones(activeScene, liveZones);
}

bus.on('flag-set', refresh);
bus.on('quest-updated', refresh);

function removeMesh(id: string): void {
  if (!group) return;
  const child = group.children.find((c) => c.userData.objectId === id);
  if (!child) return;
  group.remove(child);
  disposeTree(child);
}

/** Uses an object (the verb from its definition). */
export function useObject(objectId: string): void {
  const def = OBJECTS[objectId];
  if (!def) return;
  if (def.takeItem && countItem(def.takeItem.item) < def.takeItem.count) {
    say(`You need ${def.takeItem.count} x ${ITEMS[def.takeItem.item]?.name ?? def.takeItem.item}.`, UI.bad);
    return;
  }
  deferRefresh = true;
  try {
    if (def.takeItem) removeItem(def.takeItem.item, def.takeItem.count);
    if (def.text) say(def.text, UI.quest);
    if (def.book) readBook(def.book);
    if (def.giveItem) addItem(def.giveItem.item, def.giveItem.count);
    if (def.setFlag) setFlag(def.setFlag.flag, def.setFlag.value);
    state.objects[objectId] = (state.objects[objectId] ?? 0) + 1;
    bus.emit('interacted', { objectId });
    if (def.once) removeMesh(objectId);
  } finally {
    deferRefresh = false;
  }
  refresh();
}

/** The object id a mesh belongs to, or null. */
export function objectFromMesh(obj: THREE.Object3D): string | null {
  let o: THREE.Object3D | null = obj;
  while (o) {
    const id = o.userData.objectId;
    if (typeof id === 'string') return id;
    o = o.parent;
  }
  return null;
}

/** Ground position of an object, for walking to it. Null for an unknown id. */
export function objectPosition(id: string): THREE.Vector3 | null {
  const def = OBJECTS[id];
  if (!def) return null;
  return new THREE.Vector3(def.x, heightAt(def.x, def.z), def.z);
}
