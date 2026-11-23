import type { Tuning } from './types';
import raw from './tuning.json';
export const TUNING: Tuning = raw as unknown as Tuning;

const isPlain = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function merge(base: unknown, patch: unknown): unknown {
  if (!isPlain(base) || !isPlain(patch)) return patch === undefined ? base : patch;
  const out: Record<string, unknown> = { ...base };
  for (const k of Object.keys(patch)) out[k] = merge(base[k], patch[k]);
  return out;
}

/** Deep merge of plain objects; arrays (and every other value) in the patch replace the base. Never mutates base. */
export function withOverrides(base: Tuning, patch: unknown): Tuning {
  if (patch === undefined || patch === null) return base;
  return merge(base, patch) as Tuning;
}
