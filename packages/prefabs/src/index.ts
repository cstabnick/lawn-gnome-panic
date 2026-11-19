export type { BuildOptions, Category, Part, PrefabDef, PrefabInteract, PrefabLight, ShapeKind, Use, Vec3 } from './types';
export { WOOD_FROM_TINT } from './catalog/furniture';
export { PALETTE, colorOf, type Swatch } from './palette';
export {
  allPrefabs, getPrefab, normalizeEmoji, prefabForEmoji, prefabsForEmoji, prefabsIn, resolvePrefab, type ItemLike,
} from './registry';
export { buildHeld, buildPrefab, prewarmPrefabs, type PrewarmOptions } from './build';
export { buildStaticPrefabs, disposeStaticBatch, type StaticBatchOptions, type StaticPrefabPlacement } from './batch';
export { prefabIcon, prefabIconElement, prewarmPrefabIcons, type IconOptions, type PrewarmIconOptions } from './icon';
export { createDrop, type Drop, type DropOptions } from './drop';
export {
  getPrefabInteractTarget, getPrefabPart, getPrefabParts, getPrefabRestTarget, getPrefabSitTarget, prefabFromObject,
  type InteractTarget, type PrefabHit, type RestTarget, type SitTarget,
} from './interact';
