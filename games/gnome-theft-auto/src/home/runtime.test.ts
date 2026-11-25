import { beforeEach, describe, expect, it } from 'vitest';
import { createEconomy } from '../economy';
import { createOwnership, installOwnership, listProperties, ownsProperty } from '../ownership';
import { FLAT_ID } from './types';
import { loadLayout, resetLayoutCache } from './layout';
import { HOME_QUEST_ID, installHome, type HomeDeps } from './runtime';

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

function stubDeps() {
  const toasts: string[] = [];
  const decorCalls: string[] = [];
  const economy = createEconomy(createMemoryStorage());
  const deps: HomeDeps = {
    hud: { toast: (text: string) => { toasts.push(text); } },
    economy,
    heal: () => {},
    advanceWorldTime: null,
    nightFactor: () => 0,
    unlock: () => {},
    increment: () => {},
    activeQuestId: () => HOME_QUEST_ID,
    currentInterior: () => null,
    decor: {
      open: (tab?: string) => { decorCalls.push(`open:${tab ?? ''}`); },
      close: () => { decorCalls.push('close'); },
      isOpen: () => false,
    },
  };
  return { deps, toasts, decorCalls, economy };
}

beforeEach(() => {
  resetLayoutCache();
  loadLayout(undefined);
});

describe('home runtime', () => {
  it('registers the flat as a property', () => {
    const { deps } = stubDeps();
    installHome(deps);
    expect(listProperties().map((p) => p.id)).toContain(FLAT_ID);
  });

  it('signs the loan at the bank step and stores the housewarming gifts', () => {
    const { deps, toasts, economy } = stubDeps();
    installOwnership(createOwnership({ economy, storage: createMemoryStorage() }));
    const runtime = installHome(deps);

    runtime.onQuestStep(HOME_QUEST_ID, 2);

    expect(ownsProperty(FLAT_ID)).toBe(true);
    expect(loadLayout().stored.armchair).toBe(1);
    expect(loadLayout().stored.plant).toBe(1);
    expect(toasts.some((t) => t.includes('Parsley Inkpot'))).toBe(true);
    installOwnership(null);
  });

  it('does not sign before the bank step', () => {
    const { deps, economy } = stubDeps();
    installOwnership(createOwnership({ economy, storage: createMemoryStorage() }));
    const runtime = installHome(deps);

    runtime.onQuestStep(HOME_QUEST_ID, 1);

    expect(ownsProperty(FLAT_ID)).toBe(false);
    installOwnership(null);
  });
});
