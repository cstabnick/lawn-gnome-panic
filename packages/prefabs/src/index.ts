export type { BuildOptions, Category, Part, PrefabDef, PrefabLight, ShapeKind, Use, Vec3 } from './types';
export { WOOD_FROM_TINT } from './catalog/furniture';
export { PALETTE, colorOf, type Swatch } from './palette';
export {
  allPrefabs, getPrefab, normalizeEmoji, prefabForEmoji, prefabsForEmoji, prefabsIn, resolvePrefab, type ItemLike,
} from './registry';
export { buildHeld, buildPrefab } from './build';
export { prefabIcon, prefabIconElement, type IconOptions } from './icon';
export { createDrop, type Drop, type DropOptions } from './drop';
