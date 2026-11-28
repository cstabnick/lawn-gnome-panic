import { beforeEach, describe, expect, it } from 'vitest';
import { createEconomy } from './economy';
import type { StoredVehicle } from './lockup/types';
import {
  clearProperties,
  createOwnership,
  INSURANCE,
  OWNERSHIP_KEY,
  registerProperty,
} from './ownership';

function createMemoryStorage(initial: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

function vehicle(uid: string): StoredVehicle {
  return { uid, kind: 'car', variant: null, name: 'Clunker', tint: 0, look: null, hp: 1 } as unknown as StoredVehicle;
}

function setup(acorns = 50, clock = { t: 1_000_000 }) {
  const economyStorage = createMemoryStorage();
  const economy = createEconomy(economyStorage);
  if (acorns > 50) economy.earn(acorns - 50);
  if (acorns < 50) economy.spend(50 - acorns);
  const storage = createMemoryStorage();
  const ownership = createOwnership({ economy, storage, now: () => clock.t });
  return { economy, economyStorage, storage, ownership, clock };
}

beforeEach(() => {
  clearProperties();
  registerProperty({ id: 'farm', name: 'Mossbank Farm', price: 300, down: 50, interest: 0.1 });
  registerProperty({ id: 'house', name: 'Gnome Cottage', price: 500, down: 80 });
});

describe('ownership: properties', () => {
  it('buys on a loan: pays the down payment and books the rest with interest', () => {
    const { economy, ownership } = setup(50);

    expect(ownership.buyProperty('farm')).toEqual({ ok: true });
    expect(economy.state().acorns).toBe(0);
    // (300 - 50) * 1.1 = 275
    expect(economy.state().loans).toEqual([
      { id: 'farm', name: 'Mossbank Farm loan', principal: 275, remaining: 275 },
    ]);
    expect(ownership.ownsProperty('farm')).toBe(true);
    expect(ownership.properties()).toEqual(['farm']);
  });

  it('rounds the booked loan to whole Acorns', () => {
    registerProperty({ id: 'odd', name: 'Odd Plot', price: 105, down: 0, interest: 0.333 });
    const { economy, ownership } = setup(50);

    expect(ownership.buyProperty('odd')).toEqual({ ok: true });
    // 105 * 1.333 = 139.965 -> 140
    expect(economy.state().loans[0].principal).toBe(140);
    expect(economy.state().acorns).toBe(50);
  });

  it('refuses a property already owned, and an unknown id', () => {
    const { ownership } = setup(50);
    ownership.buyProperty('farm');
    expect(ownership.buyProperty('farm')).toEqual({ ok: false, error: 'You already own Mossbank Farm.' });
    expect(ownership.buyProperty('nope')).toEqual({ ok: false, error: 'No such property.' });
  });

  it('leaves state unchanged when the down payment is not affordable', () => {
    const { economy, ownership } = setup(50);
    const before = economy.state();

    expect(ownership.buyProperty('house')).toEqual({
      ok: false,
      error: 'Gnome Cottage needs 80 Acorns down. You have 50.',
    });
    expect(economy.state()).toEqual(before);
    expect(ownership.ownsProperty('house')).toBe(false);
  });

  it('calls each property listener once per purchase, and unsubscribe stops calls', () => {
    const { ownership } = setup(50);
    const seen: string[] = [];
    const unsubscribe = ownership.onPropertyChange((id) => seen.push(id));

    ownership.buyProperty('farm');
    expect(seen).toEqual(['farm']);

    unsubscribe();
    registerProperty({ id: 'free', name: 'Free Plot', price: 0, down: 0 });
    ownership.buyProperty('free');
    expect(seen).toEqual(['farm']);
  });

  it('persists owned properties and reloads them with a second createOwnership', () => {
    const { storage, ownership } = setup(50);
    ownership.buyProperty('farm');

    const economy2 = createEconomy(createMemoryStorage());
    const reloaded = createOwnership({ economy: economy2, storage });
    expect(reloaded.ownsProperty('farm')).toBe(true);
    expect(reloaded.properties()).toEqual(['farm']);
  });
});

describe('ownership: Kiln-Shield policies', () => {
  it('charges the fee with a minimum, and refuses a second policy', () => {
    const { economy, ownership } = setup(50);

    // 500 * 0.1 = 50
    expect(ownership.feeFor(500)).toBe(50);
    expect(ownership.insure('lk-1', 500)).toEqual({ ok: true });
    expect(economy.state().acorns).toBe(0);
    expect(ownership.policy('lk-1')).toEqual({ value: 500, since: 1_000_000, lastReclaim: 0 });
    expect(ownership.insured('lk-1')).toBe(true);

    expect(ownership.insure('lk-1', 500)).toEqual({ ok: false, error: 'That one is already covered.' });
    expect(economy.state().acorns).toBe(0);
  });

  it('uses the minimum fee for cheap vehicles', () => {
    const { economy, ownership } = setup(50);
    expect(ownership.feeFor(100)).toBe(INSURANCE.minFee);
    expect(ownership.insure('lk-2', 100)).toEqual({ ok: true });
    expect(economy.state().acorns).toBe(30);
  });

  it('refuses a policy when the fee cannot be paid, and changes nothing', () => {
    const { economy, ownership } = setup(10);
    expect(ownership.insure('lk-3', 100)).toEqual({ ok: false, error: 'Kiln-Shield cover costs 20 Acorns.' });
    expect(economy.state().acorns).toBe(10);
    expect(ownership.insured('lk-3')).toBe(false);
    expect(ownership.policyUids()).toEqual([]);
  });

  it('policy() returns a copy, and policyUids lists every policy', () => {
    const { ownership } = setup(500);
    ownership.insure('lk-1', 200);
    ownership.insure('lk-2', 200);
    const copy = ownership.policy('lk-1');
    if (copy) copy.value = 9999;
    expect(ownership.policy('lk-1')?.value).toBe(200);
    expect(ownership.policy('lk-missing')).toBeNull();
    expect(ownership.policyUids().sort()).toEqual(['lk-1', 'lk-2']);
  });
});

describe('ownership: wrecks and reclaims', () => {
  it('keeps an insured wreck and forgets the bought price of an uninsured one', () => {
    const { ownership } = setup(500);
    ownership.insure('lk-1', 400);
    ownership.setBought('lk-1', 400);
    ownership.setBought('lk-9', 200);

    expect(ownership.fileWreck(vehicle('lk-1'))).toBe(true);
    expect(ownership.wrecks().map((w) => w.uid)).toEqual(['lk-1']);
    expect(ownership.boughtFor('lk-1')).toBe(400);

    expect(ownership.fileWreck(vehicle('lk-9'))).toBe(false);
    expect(ownership.boughtFor('lk-9')).toBeNull();
    expect(ownership.wrecks().map((w) => w.uid)).toEqual(['lk-1']);
  });

  it('reclaim spends the deductible and returns the record', () => {
    const { economy, ownership } = setup(500);
    ownership.insure('lk-1', 400);
    ownership.fileWreck(vehicle('lk-1'));
    const before = economy.state().acorns;

    // 400 * 0.25 = 100
    expect(ownership.deductibleFor(400)).toBe(100);
    const result = ownership.reclaim('lk-1');
    expect(result).toMatchObject({ ok: true, paid: 100, rec: { uid: 'lk-1' } });
    expect(economy.state().acorns).toBe(before - 100);
    expect(ownership.wrecks()).toEqual([]);
  });

  it('refuses a reclaim with no claim, and when the deductible cannot be paid', () => {
    const { economy, ownership } = setup(50);
    expect(ownership.reclaim('lk-x')).toEqual({ ok: false, error: 'No claim for that one.' });

    // Fee 40 leaves 10 Acorns; the deductible for 400 is 100.
    ownership.insure('lk-1', 400);
    ownership.fileWreck(vehicle('lk-1'));
    expect(economy.state().acorns).toBe(10);
    expect(ownership.reclaim('lk-1')).toEqual({ ok: false, error: 'The deductible is 100 Acorns.' });
    expect(ownership.wrecks().map((w) => w.uid)).toEqual(['lk-1']);
    expect(ownership.reclaimWait('lk-1')).toBe(0);
  });

  it('enforces the cooldown with a fake clock and allows reclaims again after 10 minutes', () => {
    const clock = { t: 1_000_000 };
    const { ownership } = setup(1000, clock);
    ownership.insure('lk-1', 400);
    ownership.fileWreck(vehicle('lk-1'));
    expect(ownership.reclaimWait('lk-1')).toBe(0);
    expect(ownership.reclaim('lk-1').ok).toBe(true);

    // The same car is wrecked again straight away.
    ownership.fileWreck(vehicle('lk-1'));
    expect(ownership.reclaimWait('lk-1')).toBe(600);
    expect(ownership.reclaim('lk-1')).toEqual({
      ok: false,
      error: 'Kiln-Shield needs 600 s more to process that claim.',
    });

    clock.t += 5 * 60 * 1000;
    expect(ownership.reclaimWait('lk-1')).toBe(300);
    expect(ownership.reclaim('lk-1')).toEqual({
      ok: false,
      error: 'Kiln-Shield needs 300 s more to process that claim.',
    });

    clock.t += 5 * 60 * 1000;
    expect(ownership.reclaimWait('lk-1')).toBe(0);
    expect(ownership.reclaim('lk-1').ok).toBe(true);
  });

  it('reclaimWait is 0 for an unknown uid', () => {
    const { ownership } = setup(50);
    expect(ownership.reclaimWait('lk-unknown')).toBe(0);
  });
});

describe('ownership: rekey, forget and saving', () => {
  it('rekey moves the policy and bought price to the new uid', () => {
    const { ownership } = setup(500);
    ownership.insure('lk-1', 300);
    ownership.setBought('lk-1', 300);

    ownership.rekey('lk-1', 'lk-2');
    expect(ownership.policy('lk-1')).toBeNull();
    expect(ownership.insured('lk-2')).toBe(true);
    expect(ownership.boughtFor('lk-1')).toBeNull();
    expect(ownership.boughtFor('lk-2')).toBe(300);
  });

  it('forget removes the policy, bought price and wreck', () => {
    const { ownership } = setup(500);
    ownership.insure('lk-1', 300);
    ownership.setBought('lk-1', 300);
    ownership.fileWreck(vehicle('lk-1'));

    ownership.forget('lk-1');
    expect(ownership.policy('lk-1')).toBeNull();
    expect(ownership.boughtFor('lk-1')).toBeNull();
    expect(ownership.wrecks()).toEqual([]);
  });

  it('loads defaults when the saved JSON is malformed', () => {
    const bad = createMemoryStorage({ [OWNERSHIP_KEY]: '{not-json' });
    const ownership = createOwnership({ economy: createEconomy(createMemoryStorage()), storage: bad });
    expect(ownership.properties()).toEqual([]);
    expect(ownership.policyUids()).toEqual([]);
    expect(ownership.wrecks()).toEqual([]);

    const nullJson = createMemoryStorage({ [OWNERSHIP_KEY]: 'null' });
    const other = createOwnership({ economy: createEconomy(createMemoryStorage()), storage: nullJson });
    expect(other.properties()).toEqual([]);
  });

  it('drops invalid entries from a saved file and keeps the valid ones', () => {
    const saved = {
      v: 1,
      properties: ['farm', 42],
      policies: {
        'lk-ok': { value: 300, since: 1, lastReclaim: 0 },
        'lk-bad': { value: 'x', since: 1, lastReclaim: 0 },
      },
      wrecks: [{ uid: 'lk-w' }, { nope: true }, null],
      bought: { 'lk-ok': 120, 'lk-neg': -5 },
    };
    const storage = createMemoryStorage({ [OWNERSHIP_KEY]: JSON.stringify(saved) });
    const ownership = createOwnership({ economy: createEconomy(createMemoryStorage()), storage });
    expect(ownership.properties()).toEqual(['farm']);
    expect(ownership.policyUids()).toEqual(['lk-ok']);
    expect(ownership.wrecks().map((w) => w.uid)).toEqual(['lk-w']);
    expect(ownership.boughtFor('lk-ok')).toBe(120);
    expect(ownership.boughtFor('lk-neg')).toBeNull();
  });
});
