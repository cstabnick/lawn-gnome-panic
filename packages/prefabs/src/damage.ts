// Damage stages: turn a prefab into a worn, dented or wrecked version of itself. Pure data work on PrefabDef; build.ts does the meshes.
// A damaged def is derived once per (def, level) and cached, so the baked-geometry cache in build.ts keeps working for it.
import { colorOf } from './palette';
import type { Part, PrefabDef, Vec3 } from './types';

const SOOT = 0x26221e;
const derived = new WeakMap<PrefabDef, PrefabDef[]>();
const darkenOfDef = new WeakMap<PrefabDef, number>();

/** How many damage levels a prefab has (0 = it does not break). */
export function prefabDamageLevels(def: PrefabDef): number {
  return def.damage?.length ?? 0;
}

/** The soot blend (0..1) to apply to a damaged def's tint and trim colours. 0 for undamaged defs. */
export function darkenOf(def: PrefabDef): number {
  return darkenOfDef.get(def) ?? 0;
}

export function blendToSoot(hex: number, amount: number): number {
  if (amount <= 0) return hex;
  const k = Math.min(1, amount);
  const r = Math.round(((hex >> 16) & 255) * (1 - k) + ((SOOT >> 16) & 255) * k);
  const g = Math.round(((hex >> 8) & 255) * (1 - k) + ((SOOT >> 8) & 255) * k);
  const b = Math.round((hex & 255) * (1 - k) + (SOOT & 255) * k);
  return (r << 16) | (g << 8) | b;
}

const add3 = (a: Vec3 | undefined, b: Vec3): Vec3 => [(a?.[0] ?? 0) + b[0], (a?.[1] ?? 0) + b[1], (a?.[2] ?? 0) + b[2]];

/** The def at damage `level` (1..stages): `def` itself for 0 or for a prefab with no stages. */
export function damagedDef(def: PrefabDef, level: number): PrefabDef {
  const n = prefabDamageLevels(def);
  const lv = Math.max(0, Math.min(n, Math.floor(level)));
  if (lv === 0) return def;
  let list = derived.get(def);
  if (!list) { list = []; derived.set(def, list); }
  const cached = list[lv - 1];
  if (cached) return cached;

  let parts: Part[] = [...def.parts];
  let sink = 0;
  let darken = 0;
  for (let i = 0; i < lv; i++) {
    const st = def.damage![i];
    const hide = new Set(st.hide ?? []);
    if (hide.size > 0) parts = parts.filter((p) => !(p.name && hide.has(p.name)) && !(p.group && hide.has(p.group)));
    const morph = st.morph;
    if (morph) {
      parts = parts.map((p) => {
        const m = (p.name && morph[p.name]) || (p.group && morph[p.group]);
        if (!m) return p;
        return {
          ...p,
          at: m.at ? add3(p.at, m.at) : p.at,
          rot: m.rot ? add3(p.rot, m.rot) : p.rot,
          scale: m.scale
            ? [(p.scale?.[0] ?? 1) * m.scale[0], (p.scale?.[1] ?? 1) * m.scale[1], (p.scale?.[2] ?? 1) * m.scale[2]]
            : p.scale,
        };
      });
    }
    if (st.add) parts.push(...st.add);
    sink += st.sink ?? 0;
    darken = Math.max(darken, st.darken ?? 0);
  }
  // Slump: everything (parts, pivots, lights) drops together so wheel axles stay where their pivots are.
  const drop = (v: Vec3): Vec3 => [v[0], v[1] - sink, v[2]];
  if (sink !== 0) parts = parts.map((p) => ({ ...p, at: drop(p.at ?? [0, 0, 0]) }));
  // Soot on every fixed colour; 'tint' and 'trim' parts are darkened at build time (their colour is only known then).
  if (darken > 0) {
    parts = parts.map((p) => (p.c === 'tint' || p.c === 'trim' ? p : { ...p, c: blendToSoot(colorOf(p.c), darken) }));
  }
  const out: PrefabDef = {
    ...def,
    parts,
    pivots: def.pivots && sink !== 0 ? Object.fromEntries(Object.entries(def.pivots).map(([k, v]) => [k, drop(v)])) : def.pivots,
    lights: def.lights && sink !== 0 ? def.lights.map((l) => ({ ...l, at: drop(l.at) })) : def.lights,
    damage: undefined,
  };
  darkenOfDef.set(out, darken);
  list[lv - 1] = out;
  return out;
}
