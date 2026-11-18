import { buildPrefab, prefabIcon, type BuildOptions, type IconOptions, type PrefabDef } from '@lawn/prefabs';
import * as THREE from 'three';
import { BOSS_GNOMEOKEMON } from './bosses';
import { DEPTHS_AND_KILN_GNOMEOKEMON } from './depths';
import { DESERT_GNOMEOKEMON } from './desert';
import { FESCUE_EXTRA_GNOMEOKEMON } from './fescue2';
import { NIGHT_GNOMEOKEMON } from './night';
import { OCEAN_GNOMEOKEMON } from './ocean';
import { STARTER_GNOMEOKEMON } from './starters';
import type { GnomeokemonElement, GnomeokemonEntry } from './types';
import { WILD_GNOMEOKEMON } from './wilds';

export type { GnomeokemonElement, GnomeokemonEntry, GnomeokemonRank } from './types';

export const GNOMEOKEMON_CATALOG: readonly GnomeokemonEntry[] = [
  ...STARTER_GNOMEOKEMON,
  ...WILD_GNOMEOKEMON,
  ...BOSS_GNOMEOKEMON,
  ...DESERT_GNOMEOKEMON,
  ...DEPTHS_AND_KILN_GNOMEOKEMON,
  ...OCEAN_GNOMEOKEMON,
  ...FESCUE_EXTRA_GNOMEOKEMON,
  ...NIGHT_GNOMEOKEMON,
];

const byId = new Map<string, GnomeokemonEntry>();
for (const entry of GNOMEOKEMON_CATALOG) {
  if (byId.has(entry.prefab.id)) throw new Error(`Duplicate gnomeokemon id: ${entry.prefab.id}`);
  byId.set(entry.prefab.id, entry);
}

export function allGnomeokemon(): readonly GnomeokemonEntry[] {
  return GNOMEOKEMON_CATALOG;
}

export function getGnomeokemon(id: string): GnomeokemonEntry | undefined {
  return byId.get(id);
}

export function gnomeokemonIn(element: GnomeokemonElement): GnomeokemonEntry[] {
  return GNOMEOKEMON_CATALOG.filter((e) => e.element === element);
}

/** Load and build a Gnomeokemon model from its stored PrefabDef via @lawn/prefabs. */
export function buildGnomeokemon(idOrEntry: string | GnomeokemonEntry | PrefabDef, opts?: BuildOptions): THREE.Group {
  let def: PrefabDef | undefined;
  if (typeof idOrEntry === 'string') def = byId.get(idOrEntry)?.prefab;
  else if ('prefab' in idOrEntry) def = idOrEntry.prefab;
  else def = idOrEntry;
  if (!def) throw new Error(`Unknown gnomeokemon: ${String(idOrEntry)}`);
  return buildPrefab(def, opts);
}

/** Render a cached PNG icon of a Gnomeokemon prefab via @lawn/prefabs. */
export function gnomeokemonIcon(idOrEntry: string | GnomeokemonEntry | PrefabDef, opts?: IconOptions): string | null {
  let def: PrefabDef | undefined;
  if (typeof idOrEntry === 'string') def = byId.get(idOrEntry)?.prefab;
  else if ('prefab' in idOrEntry) def = idOrEntry.prefab;
  else def = idOrEntry;
  if (!def) return null;
  return prefabIcon(def, opts);
}
