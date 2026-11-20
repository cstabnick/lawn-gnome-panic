// The world-object models: one prefab-built model per WorldObjectDef.model, shared by the game (objects.ts) and the
// level editor's 3D view. Only three, @lawn/prefabs and type imports, so the editor can load it without starting the game.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { WorldObjectDef } from './config';

type Builder = (g: THREE.Group, c: number) => void;

// One builder per model. `c` is the object's main colour (def.color or the model default). Every model is a prefab
// from the shared library (packages/prefabs); the gnomes-of-gnomomia ones live in catalog/gnomes-of-gnomomia.ts.
const MODEL_SPECS: Record<WorldObjectDef['model'], { color: number; build: Builder }> = {
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

/** The default colour of each model (used when a WorldObjectDef has no `color`). */
export const OBJECT_MODEL_COLOR: Record<WorldObjectDef['model'], number> = Object.fromEntries(
  Object.entries(MODEL_SPECS).map(([model, spec]) => [model, spec.color]),
) as Record<WorldObjectDef['model'], number>;

/** Adds the model's prefab(s) to `parent`, tinted with `color` where the prefab takes a tint. */
export function buildObjectModel(model: WorldObjectDef['model'], color: number, parent: THREE.Group): void {
  MODEL_SPECS[model].build(parent, color);
}
