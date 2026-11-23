// Base save (localStorage). Every access is guarded: localStorage may be missing or throw (tests, private windows).
import { SAVE } from './config';
import { parseBase, serializeBase } from './model';
import type { BaseState } from './types';

interface KeyValue { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }

function store(): KeyValue | null {
  try {
    return (globalThis as { localStorage?: KeyValue }).localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadBase(seed: number): BaseState | null {
  try {
    const raw = store()?.getItem(SAVE.prefix + seed);
    if (raw == null) return null;
    const base = parseBase(raw);
    return base && base.seed === seed ? base : null;
  } catch {
    return null;
  }
}

export function saveBase(base: BaseState): void {
  try {
    const ls = store();
    if (!ls) return;
    ls.setItem(SAVE.prefix + base.seed, serializeBase(base));
    ls.setItem(SAVE.lastSeedKey, String(base.seed));
  } catch { /* storage full or blocked: the base just is not saved */ }
}

export function clearBase(seed: number): void {
  try {
    const ls = store();
    if (!ls) return;
    ls.removeItem(SAVE.prefix + seed);
    if (ls.getItem(SAVE.lastSeedKey) === String(seed)) ls.removeItem(SAVE.lastSeedKey);
  } catch { /* ignore */ }
}

export function lastBaseSeed(): number | null {
  try {
    const raw = store()?.getItem(SAVE.lastSeedKey);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
