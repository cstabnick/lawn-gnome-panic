import { cloneLootTable, DEFAULT_LOOT_TABLE, DEFAULT_PARAMS, type SimParams } from './bridge';

export const SCENARIOS_STORAGE_KEY = 'dead-grid.scenarios.v1';

export interface SavedScenario {
  id: string;
  name: string;
  seed: number;
  params: SimParams;
  savedAt: string;
}

export interface ScenarioStorage {
  getItem(key: string): string | null;
  setItem(key: string, val: string): void;
}

function defaultStorage(): ScenarioStorage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadSavedScenarios(storage: ScenarioStorage | null = defaultStorage()): SavedScenario[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(SCENARIOS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is SavedScenario =>
        s && typeof s.id === 'string' && typeof s.name === 'string' && typeof s.seed === 'number' && s.params,
    );
  } catch {
    return [];
  }
}

export function saveScenario(
  name: string,
  seed: number,
  params: SimParams,
  storage: ScenarioStorage | null = defaultStorage(),
): SavedScenario[] {
  const list = loadSavedScenarios(storage);
  const trimmed = name.trim() || `Scenario ${list.length + 1}`;
  const entry: SavedScenario = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: trimmed,
    seed: seed >>> 0 || 1,
    params: { ...DEFAULT_PARAMS, ...params },
    savedAt: new Date().toISOString(),
  };
  const next = [entry, ...list.filter((s) => s.name !== trimmed)].slice(0, 30);
  storage?.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function deleteScenario(
  id: string,
  storage: ScenarioStorage | null = defaultStorage(),
): SavedScenario[] {
  const next = loadSavedScenarios(storage).filter((s) => s.id !== id);
  storage?.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function exportScenarioJson(name: string, seed: number, params: SimParams): string {
  return JSON.stringify(
    {
      format: 'dead-grid.scenario/v1',
      name,
      seed,
      params,
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  );
}

export function importScenarioJson(jsonText: string): { name: string; seed: number; params: SimParams } {
  const data = JSON.parse(jsonText);
  if (!data || typeof data !== 'object' || !data.params) {
    throw new Error('Invalid scenario JSON: missing params');
  }
  const merged: SimParams = {
    ...DEFAULT_PARAMS,
    ...data.params,
    lootTable: cloneLootTable(data.params.lootTable ?? DEFAULT_LOOT_TABLE),
  };
  if (merged.gridSize !== 512 && merged.gridSize !== 768 && merged.gridSize !== 1024) {
    merged.gridSize = 512;
  }
  const seed = typeof data.seed === 'number' && data.seed > 0 ? Math.floor(data.seed) : 1337;
  const name = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : 'Imported Scenario';
  return { name, seed, params: merged };
}
