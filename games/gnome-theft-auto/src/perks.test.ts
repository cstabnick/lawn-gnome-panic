import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  PERKS, PERKS_KEY, QUEST_SAVE_KEY, clearPerkOverride, computeActive, grantPerk, listPerks, priceScaleFor, revokePerk,
  setPerkStorage, takeNewPerks, type PerkId,
} from './perks';

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string): string | null => map.get(k) ?? null,
    setItem: (k: string, v: string): void => { map.set(k, v); },
  };
}

const noOverrides = { granted: [], revoked: [], seen: [] };
const doneSave = { state: 'done' as const, step: 0, cracked: [] };

let storage: ReturnType<typeof fakeStorage>;

beforeEach(() => {
  storage = fakeStorage();
  setPerkStorage(storage);
});

afterEach(() => {
  setPerkStorage(null);
});

describe('computeActive', () => {
  it('a perk is active once its quest is done', () => {
    const saves = { 'sq-grid-truthers': doneSave };
    expect(computeActive(saves, noOverrides).has('datum-map')).toBe(true);
  });

  it('a revoke wins over a done quest and over a grant', () => {
    const saves = { 'sq-grid-truthers': doneSave };
    expect(computeActive(saves, { granted: [], revoked: ['datum-map'], seen: [] }).has('datum-map')).toBe(false);
    expect(computeActive({}, { granted: ['datum-map'], revoked: ['datum-map'], seen: [] }).has('datum-map')).toBe(false);
  });

  it('a grant turns a perk on without its quest', () => {
    expect(computeActive({}, { granted: ['datum-map'], revoked: [], seen: [] }).has('datum-map')).toBe(true);
  });
});

describe('grant / revoke / clear', () => {
  const source = (id: string) => listPerks().find((p) => p.def.id === id);

  it('moves a perk between locked, granted, revoked and back', () => {
    expect(source('datum-map')?.source).toBe('locked');
    expect(grantPerk('datum-map')).toBe(true);
    expect(source('datum-map')).toMatchObject({ source: 'granted', active: true });
    expect(revokePerk('datum-map')).toBe(true);
    expect(source('datum-map')).toMatchObject({ source: 'revoked', active: false });
    expect(clearPerkOverride('datum-map')).toBe(true);
    expect(source('datum-map')).toMatchObject({ source: 'locked', active: false });
  });

  it('reports a finished quest as the source', () => {
    storage.setItem(QUEST_SAVE_KEY, JSON.stringify({ 'sq-grid-truthers': doneSave }));
    expect(source('datum-map')).toMatchObject({ source: 'quest', active: true });
  });

  it('returns false for an unknown id', () => {
    expect(grantPerk('nope')).toBe(false);
    expect(revokePerk('nope')).toBe(false);
    expect(clearPerkOverride('nope')).toBe(false);
    expect(storage.map.has(PERKS_KEY)).toBe(false);
  });
});

describe('takeNewPerks', () => {
  it('returns a newly active perk once, then nothing', () => {
    grantPerk('datum-map');
    expect(takeNewPerks().map((p) => p.id)).toEqual(['datum-map']);
    expect(takeNewPerks()).toEqual([]);
  });
});

describe('priceScaleFor', () => {
  it('fizz-sponsor makes Dandelion Fizz free, and the lowest scale wins', () => {
    expect(priceScaleFor('Dandelion Fizz', new Set<PerkId>(['velvet-rope', 'fizz-sponsor']))).toBe(0);
  });

  it('velvet-rope discounts Acorn-Cola by 25%', () => {
    expect(priceScaleFor('Acorn-Cola', new Set<PerkId>(['velvet-rope']))).toBe(0.75);
  });

  it('an unknown reason costs full price', () => {
    expect(priceScaleFor('Mystery Item', new Set<PerkId>(['velvet-rope', 'fizz-sponsor']))).toBe(1);
    expect(priceScaleFor(undefined, new Set<PerkId>(['velvet-rope']))).toBe(1);
  });
});

describe('PERKS table', () => {
  it('every quest id is unique', () => {
    const quests = PERKS.map((p) => p.questId);
    expect(new Set(quests).size).toBe(quests.length);
  });

  it('every perk id appears once', () => {
    // Exhaustive over PerkId: adding a PerkId without listing it here fails to compile.
    const all: Record<PerkId, true> = {
      'datum-map': true, 'alley-clearance': true, 'velvet-rope': true, 'mulch-rebate': true, 'biscuit-nose': true,
      'castaway-float': true, 'porcelain-charm': true, 'bracken-blessing': true, 'sonar-trinket': true,
      'rebel-pension': true, 'audit-paperwork': true, 'thick-glaze': true, 'rookie-plate': true,
      'carb-contacts': true, 'shelldon-odds': true, 'fizz-sponsor': true,
      'conductor-punch': true, 'impound-key': true, 'glow-band': true, 'press-pass': true, 'union-card': true, 'weeping-line': true, 'combine-hum': true,
      'neighbour-badge': true, 'showoff': true, 'scrap-eye': true, 'sling-regular': true, 'verge-volunteer': true, 'bent-pin-regular': true, 'skyway-regular': true, 'staff-discount': true, 'slipway-regular': true, 'pigeon-tip': true, 'lodge-regular': true, 'hopper-pass': true, 'hide-regular': true, 'estate-agent': true, 'party-favour': true,
    };
    const ids = PERKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(Object.keys(all).sort());
  });
});
