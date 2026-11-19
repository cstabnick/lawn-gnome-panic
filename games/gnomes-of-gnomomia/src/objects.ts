// World objects: valves, statues, signs and the like that the player can use.
// Each zone's objects are built from three.js primitives and rebuilt when a flag or quest changes.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
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

// One builder per model. `c` is the object's main colour (def.color or the model default). Every model is a prefab
// from the shared library (packages/prefabs); the gnomes-of-gnomomia ones live in catalog/gnomes-of-gnomomia.ts.
const BUILDERS: Record<WorldObjectDef['model'], { color: number; build: Builder }> = {
  valve: {
    color: 0x7a7f86,
    build: (g, c) => {
      g.add(buildPrefab('gnome-valve', { tint: c }));
    },
  },
  statue: {
    color: 0x9aa0a6,
    build: (g, c) => {
      g.add(buildPrefab('gnome-statue', { tint: c, scale: 1.7 }));
    },
  },
  book: {
    color: 0x6b4a2b,
    build: (g, c) => {
      g.add(buildPrefab('book-pedestal', { tint: c }));
    },
  },
  cart: {
    color: 0x8b5a2b,
    build: (g, c) => {
      g.add(buildPrefab('wooden-cart', { tint: c }));
    },
  },
  chest: {
    color: 0x6d4420,
    build: (g, c) => {
      g.add(buildPrefab('wooden-chest', { tint: c, scale: 1.5 }));
    },
  },
  sign: {
    color: 0x6b4a2b,
    build: (g) => {
      g.add(buildPrefab('signpost', { scale: 1.3 }));
    },
  },
  stone: {
    color: 0x8d9097,
    build: (g, c) => {
      g.add(buildPrefab('standing-stone', { tint: c }));
    },
  },
  grave: {
    color: 0x9a9a9a,
    build: (g) => {
      g.add(buildPrefab('gravestone', { scale: 1.8 }));
    },
  },
  post: {
    color: 0x7a5230,
    build: (g, c) => {
      g.add(buildPrefab('wooden-post', { tint: c }));
    },
  },
  trough: {
    color: 0x5e4026,
    build: (g, c) => {
      g.add(buildPrefab('water-trough', { tint: c }));
    },
  },
  bookshelf: {
    color: 0x6b4a2b,
    build: (g) => {
      g.add(buildPrefab('bookshelf', { scale: 1.4 }));
    },
  },
  lectern: {
    color: 0x6b4a2b,
    build: (g) => {
      g.add(buildPrefab('lectern', { scale: 1.2 }));
    },
  },
  scroll: {
    color: 0xf2e8c9,
    build: (g) => {
      g.add(buildPrefab('rolled-scroll', { scale: 1.8 }));
    },
  },
  plaque: {
    color: 0x8d9097,
    build: (g, c) => {
      g.add(buildPrefab('stone-plaque', { tint: c }));
    },
  },
  generic: {
    color: 0xd0c080,
    build: (g, c) => {
      g.add(buildPrefab('garden-lump', { tint: c }));
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
  if (root.userData.prefab) return;
  if (root instanceof THREE.Mesh) root.geometry.dispose();
  for (const child of root.children) disposeTree(child);
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
