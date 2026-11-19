import { DEV_TEST2_PACK } from './entries/dev-test2';
import { PROD_SHITPOST_PACK } from './entries/prod-shitpost';
import { parseRawShitposts } from './parser';
import type { EntityId, LorePack, ScamEntryDef, TributeItemDef, WhisperDef } from './types';

const STORAGE_KEY = 'tribute-schedule:custom-lore-v1';

export interface ActiveLore {
  packs: LorePack[];
  tributes: TributeItemDef[];
  scams: ScamEntryDef[];
  whispers: WhisperDef[];
}

function loadCustomRawEntries(): string[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function saveCustomRawEntries(entries: string[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage quota errors
  }
}

export function getActiveLore(extraPacks: LorePack[] = []): ActiveLore {
  const customPacks = loadCustomRawEntries().map((raw, i) =>
    parseRawShitposts(raw, 'custom', `Pasted Batch #${i + 1}`),
  );
  const packs = [PROD_SHITPOST_PACK, DEV_TEST2_PACK, ...customPacks, ...extraPacks];

  return {
    packs,
    tributes: packs.flatMap((p) => p.tributes),
    scams: packs.flatMap((p) => p.scams),
    whispers: packs.flatMap((p) => p.whispers),
  };
}

export function addCustomLoreFromText(rawText: string): LorePack {
  const trimmed = rawText.trim();
  const pack = parseRawShitposts(trimmed, 'custom', 'Pasted Responses');
  if (trimmed.length > 0 && (pack.whispers.length > 0 || pack.scams.length > 0 || pack.tributes.length > 0)) {
    const existing = loadCustomRawEntries();
    existing.push(trimmed);
    saveCustomRawEntries(existing);
  }
  return pack;
}

export function clearCustomLore(): void {
  saveCustomRawEntries([]);
}

export function getCustomLoreCount(): number {
  return loadCustomRawEntries().length;
}

export function pickWhisper(
  lore: ActiveLore,
  entity: EntityId,
  hour: number,
  rng: () => number,
): WhisperDef | null {
  const pool = lore.whispers.filter((w) => w.entity === entity && w.minHour <= hour);
  const fallback = pool.length > 0 ? pool : lore.whispers.filter((w) => w.entity === entity);
  if (fallback.length === 0) return null;
  return fallback[Math.floor(rng() * fallback.length)];
}
