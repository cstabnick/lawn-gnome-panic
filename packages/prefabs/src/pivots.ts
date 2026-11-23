// Pivot helpers for nested pivots (see `PrefabDef.pivots`). A pivot is a bare Vec3 or `{ at, parent }`.
import type { PivotDef, Vec3 } from './types';

type ObjectPivot = { readonly at: Vec3; readonly parent?: string };

// Not `'at' in def`: arrays have an `.at()` method, so that test is true for a bare Vec3 too.
/** True for the `{ at, parent }` form. */
export function isObjectPivot(def: PivotDef): def is ObjectPivot {
  return !Array.isArray(def);
}

/** The absolute position of a pivot in prefab-local coordinates. */
export function pivotAt(def: PivotDef): Vec3 {
  return isObjectPivot(def) ? def.at : def;
}

/** The name of the parent pivot, or undefined for a root-level pivot. */
export function pivotParent(def: PivotDef): string | undefined {
  return isObjectPivot(def) ? def.parent : undefined;
}

/**
 * Pivot names ordered so every parent comes before its children. Root pivots keep their authored order, so a
 * prefab with only Vec3 pivots gets exactly `Object.keys(pivots)`. Throws on a cycle (`pivot cycle: a -> b -> a`)
 * or an unknown parent (`pivot 'x' has unknown parent 'y'`).
 */
export function resolvePivotOrder(pivots: Readonly<Record<string, PivotDef>> | undefined): string[] {
  const table = pivots ?? {};
  const out: string[] = [];
  const done = new Set<string>();
  const stack: string[] = [];
  const visit = (name: string): void => {
    if (done.has(name)) return;
    const at = stack.indexOf(name);
    if (at >= 0) throw new Error(`pivot cycle: ${[...stack.slice(at), name].join(' -> ')}`);
    stack.push(name);
    const parent = pivotParent(table[name]);
    if (parent !== undefined) {
      if (!Object.hasOwn(table, parent)) throw new Error(`pivot '${name}' has unknown parent '${parent}'`);
      visit(parent);
    }
    stack.pop();
    done.add(name);
    out.push(name);
  };
  for (const name of Object.keys(table)) visit(name);
  return out;
}

/**
 * A group and its ancestors, nearest first: `['knuckle', 'suspension']` for a pivot nested under `suspension`.
 * A name that is not a pivot (a part's own group with no pivot) is just `[name]`. Stops at a cycle instead of looping.
 */
export function groupChain(pivots: Readonly<Record<string, PivotDef>> | undefined, name: string): string[] {
  const table = pivots ?? {};
  const chain: string[] = [];
  let cur: string | undefined = name;
  while (cur !== undefined && !chain.includes(cur)) {
    chain.push(cur);
    cur = Object.hasOwn(table, cur) ? pivotParent(table[cur]) : undefined;
  }
  return chain;
}
