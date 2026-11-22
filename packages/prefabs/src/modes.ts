// Modes: a prefab's named extra-part sets (`PrefabDef.modes`), such as a bookshelf with 0, 5 or 40 books. modeDef() returns
// the def with the chosen mode's parts appended. Derived once per (def, mode) and cached, so the baked-geometry cache in
// build.ts keeps working. Damage levels are applied on top of this (see damage.ts).
import type { PrefabDef } from './types';

const derived = new WeakMap<PrefabDef, Map<string, PrefabDef>>();

/** The mode names a prefab has, in declaration order (empty when it has none). */
export function prefabModes(def: PrefabDef): string[] {
  return Object.keys(def.modes ?? {});
}

/** The def to build for `mode`. Unknown or missing mode: `defaultMode`. A prefab without modes is returned unchanged. */
export function modeDef(def: PrefabDef, mode?: string): PrefabDef {
  const modes = def.modes;
  if (!modes) return def;
  const name = mode !== undefined && mode in modes ? mode
    : def.defaultMode !== undefined && def.defaultMode in modes ? def.defaultMode
      : undefined;
  if (name === undefined) return def;
  let byMode = derived.get(def);
  if (!byMode) { byMode = new Map(); derived.set(def, byMode); }
  const cached = byMode.get(name);
  if (cached) return cached;
  const out: PrefabDef = { ...def, parts: [...def.parts, ...modes[name]] };
  byMode.set(name, out);
  return out;
}
