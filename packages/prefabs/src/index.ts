export type { BuildOptions, Category, DamageStage, Part, PartMorph, PrefabDef, PrefabInteract, PrefabLight, PrefabWear, ShapeKind, Use, Vec3 } from './types';
export { WOOD_FROM_TINT } from './catalog/furniture';
export { PALETTE, colorOf, type Swatch } from './palette';
export {
  allPrefabs, getPrefab, normalizeEmoji, prefabFootprint, prefabForEmoji, prefabsForEmoji, prefabsIn, resolvePrefab, type ItemLike,
} from './registry';
export { buildHeld, buildPrefab, prewarmPrefabs, setPrefabDamage, type PrewarmEntry, type PrewarmOptions } from './build';
export { damagedDef, prefabDamageLevels } from './damage';
export { modeDef, prefabModes } from './modes';
export { buildStaticPrefabs, disposeStaticBatch, type StaticBatchOptions, type StaticPrefabPlacement } from './batch';
export { buildPrefabInstances, type InstanceOptions } from './instances';
export { prefabIcon, prefabIconElement, prewarmPrefabIcons, type IconOptions, type PrewarmIconOptions } from './icon';
export { createDrop, type Drop, type DropOptions } from './drop';
export {
  getPrefabInteractTarget, getPrefabPart, getPrefabParts, getPrefabRestTarget, getPrefabSitTarget, prefabFromObject,
  type InteractTarget, type PrefabHit, type RestTarget, type SitTarget,
} from './interact';
