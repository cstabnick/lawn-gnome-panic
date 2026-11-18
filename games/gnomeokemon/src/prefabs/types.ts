import type { PrefabDef } from '@lawn/prefabs';

export type GnomeokemonElement = 'bloom' | 'sun' | 'rain' | 'clay' | 'iron';

export type GnomeokemonRank = 'Starter' | 'Wild' | 'Elite' | 'Boss';

export interface GnomeokemonEntry {
  /** Three-digit Field Guide number, e.g. '001'. */
  dex: string;
  element: GnomeokemonElement;
  region: string;
  rank: GnomeokemonRank;
  /** Bestiary family from Gnomomia lore (e.g. 'Plant', 'Fired clay', 'Furred', 'Shelled', 'Soft', 'Winged', 'Metal'). */
  family: string;
  /** Lore rule 6: every pest or creature wants something. */
  wants: string;
  /** Standard @lawn/prefabs definition used by buildPrefab() and prefabIcon(). */
  prefab: PrefabDef;
}
