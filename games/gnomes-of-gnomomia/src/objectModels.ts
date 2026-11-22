// The world-object models: one prefab-built model per WorldObjectDef.model, shared by the game (objects.ts) and the
// level editor's 3D view. Only three, @lawn/prefabs and type imports, so the editor can load it without starting the game.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { WorldObjectDef } from './config';

/** `seed` is the object's id, when the caller has one: it picks a stable variant (a bookshelf's book count). */
type Builder = (g: THREE.Group, c: number, seed?: string) => void;

// Bookshelves: the prefab's book modes. A seed (the object id) picks one stably, so a shelf looks the same on every rebuild;
// without a seed every shelf is 'stocked'. An empty shelf ('bare') is not picked, so every shelf shows some books.
const SHELF_MODES = ['sparse', 'stocked', 'full'] as const;
function shelfMode(seed?: string): (typeof SHELF_MODES)[number] {
  if (seed === undefined) return 'stocked';
  let h = 0;
  for (const ch of seed) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return SHELF_MODES[(h >>> 0) % SHELF_MODES.length];
}

// One builder per model. `c` is the object's main colour (def.color or the model default). Every model is a prefab
// from the shared library (packages/prefabs); the gnomes-of-gnomomia ones live in catalog/gnomes-of-gnomomia.ts.
// `prefab` is the prefab id the builder passes to buildPrefab, so tools can show the actual model name.
const MODEL_SPECS: Record<WorldObjectDef['model'], { color: number; prefab: string; build: Builder }> = {
  valve: {
    color: 0x7a7f86,
    prefab: 'gnome-valve',
    build: (g, c) => {
      g.add(buildPrefab('gnome-valve', { tint: c }));
    },
  },
  statue: {
    color: 0x9aa0a6,
    prefab: 'gnome-statue',
    build: (g, c) => {
      g.add(buildPrefab('gnome-statue', { tint: c, scale: 1.7 }));
    },
  },
  book: {
    color: 0x6b4a2b,
    prefab: 'book-pedestal',
    build: (g, c) => {
      g.add(buildPrefab('book-pedestal', { tint: c }));
    },
  },
  cart: {
    color: 0x8b5a2b,
    prefab: 'wooden-cart',
    build: (g, c) => {
      g.add(buildPrefab('wooden-cart', { tint: c }));
    },
  },
  chest: {
    color: 0x6d4420,
    prefab: 'wooden-chest',
    build: (g, c) => {
      g.add(buildPrefab('wooden-chest', { tint: c, scale: 1.5 }));
    },
  },
  sign: {
    color: 0x6b4a2b,
    prefab: 'signpost',
    build: (g) => {
      g.add(buildPrefab('signpost', { scale: 1.3 }));
    },
  },
  stone: {
    color: 0x8d9097,
    prefab: 'standing-stone',
    build: (g, c) => {
      g.add(buildPrefab('standing-stone', { tint: c }));
    },
  },
  grave: {
    color: 0x9a9a9a,
    prefab: 'gravestone',
    build: (g) => {
      g.add(buildPrefab('gravestone', { scale: 1.8 }));
    },
  },
  post: {
    color: 0x7a5230,
    prefab: 'wooden-post',
    build: (g, c) => {
      g.add(buildPrefab('wooden-post', { tint: c }));
    },
  },
  trough: {
    color: 0x5e4026,
    prefab: 'water-trough',
    build: (g, c) => {
      g.add(buildPrefab('water-trough', { tint: c }));
    },
  },
  bookshelf: {
    color: 0x6b4a2b,
    prefab: 'bookshelf',
    build: (g, _c, seed) => {
      g.add(buildPrefab('bookshelf', { scale: 1.4, mode: shelfMode(seed) }));
    },
  },
  lectern: {
    color: 0x6b4a2b,
    prefab: 'lectern',
    build: (g) => {
      g.add(buildPrefab('lectern', { scale: 1.2 }));
    },
  },
  scroll: {
    color: 0xf2e8c9,
    prefab: 'rolled-scroll',
    build: (g) => {
      g.add(buildPrefab('rolled-scroll', { scale: 1.8 }));
    },
  },
  plaque: {
    color: 0x8d9097,
    prefab: 'stone-plaque',
    build: (g, c) => {
      g.add(buildPrefab('stone-plaque', { tint: c }));
    },
  },
  generic: {
    color: 0xd0c080,
    prefab: 'garden-lump',
    build: (g, c) => {
      g.add(buildPrefab('garden-lump', { tint: c }));
    },
  },
};

/** The default colour of each model (used when a WorldObjectDef has no `color`). */
export const OBJECT_MODEL_COLOR: Record<WorldObjectDef['model'], number> = Object.fromEntries(
  Object.entries(MODEL_SPECS).map(([model, spec]) => [model, spec.color]),
) as Record<WorldObjectDef['model'], number>;

/** The prefab id a model builds (for example 'wooden-cart' for 'cart'). */
export function objectModelPrefab(model: WorldObjectDef['model']): string {
  return MODEL_SPECS[model].prefab;
}

/** Adds the model's prefab(s) to `parent`, tinted with `color` where the prefab takes a tint. `seed` (the object id) picks
 * a stable variant where a model has several, such as how many books a bookshelf holds. */
export function buildObjectModel(model: WorldObjectDef['model'], color: number, parent: THREE.Group, seed?: string): void {
  MODEL_SPECS[model].build(parent, color, seed);
}
