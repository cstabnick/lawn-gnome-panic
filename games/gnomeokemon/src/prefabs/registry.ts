import { buildPrefab, prefabIcon, type BuildOptions, type IconOptions, type PrefabDef } from '@lawn/prefabs';
import * as THREE from 'three';
import { DEX_ENTRIES } from './dex';
import type { GnomeokemonElement, GnomeokemonEntry } from './types';

export type { GnomeokemonElement, GnomeokemonEntry, GnomeokemonRank } from './types';

export const GNOMEOKEMON_CATALOG: readonly GnomeokemonEntry[] = DEX_ENTRIES;

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

/** Load and build a Gnomeokemon model from @lawn/prefabs. */
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
