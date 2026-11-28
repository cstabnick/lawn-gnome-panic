// Ownership (E08, docs/roadmaps/gta-batch-3/E08/contracts.md): properties bought with a loan beside Kiln-Debt, the
// Kiln-Shield vehicle cover (policies, written-off insured vehicles waiting to be reclaimed) and what each owned vehicle
// cost. Pure data and rules: no DOM, no three.js. The game makes one with createOwnership and installs it
// (installOwnership) so other epics can call the module-level buyProperty / ownsProperty / onPropertyChange.
// Saved under OWNERSHIP_KEY (saveIO.ts GTA_SAVE_KEYS, cloudSave.ts MERGES). Loans themselves live in economy.ts.
import type { Economy } from './economy';
import type { StoredVehicle } from './lockup/types';
import { notifySaveChanged } from './saveHook';

export const OWNERSHIP_KEY = 'gta-ownership-v1';

/** A property the player can buy (E10 home and apartment, E16 farm). Registered as data; bought with a loan. */
export interface PropertyDef {
  id: string;
  name: string;
  /** Full price in Acorns. */
  price: number;
  /** Paid from the wallet now (0 = all on loan). The rest (price - down) is booked as a loan with id = def.id. */
  down: number;
  /** One-off interest added to the loan when it is booked (0.1 = +10 %). Default 0. */
  interest?: number;
  /** One line for the Ledger app. */
  blurb?: string;
  /** E10: when set, the Ledger shows this line instead of a Buy button (the property is bought somewhere else, e.g. a quest at the bank counter). */
  buyHint?: string;
}

/** Kiln-Shield vehicle cover (decisions in docs/roadmaps/gta-batch-3/E08-economy-ownership-inventory.md, not re-asked). */
export const INSURANCE = {
  /** Policy fee, once per vehicle: this fraction of its value, rounded, at least minFee. */
  feeRate: 0.1,
  minFee: 20,
  /** Reclaim deductible: this fraction of its value, rounded, at least minDeductible. */
  deductibleRate: 0.25,
  minDeductible: 15,
  /** One reclaim per vehicle per this many milliseconds (10 minutes). */
  reclaimCooldownMs: 10 * 60 * 1000,
} as const;

export interface Policy {
  /** The value the fee and deductible are measured against (purchase price, or the dealer price of its model). */
  value: number;
  /** ms since epoch when the policy was taken out. */
  since: number;
  /** ms since epoch of the last reclaim, or 0. */
  lastReclaim: number;
}

/** The saved JSON under OWNERSHIP_KEY. */
export interface OwnershipSave {
  v: 1;
  /** Property ids owned. */
  properties: string[];
  /** Lock-Up uid -> policy. */
  policies: Record<string, Policy>;
  /** Insured vehicles written off and not reclaimed yet (the record as last synced, before it left the garage store). */
  wrecks: StoredVehicle[];
  /** Lock-Up uid -> Acorns paid for it at a dealership. */
  bought: Record<string, number>;
}

export interface OwnershipStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface OwnershipDeps {
  economy: Pick<Economy, 'spend' | 'borrow' | 'state'>;
  /** Default: globalThis.localStorage when reachable, else nothing is saved. */
  storage?: OwnershipStorage;
  /** Clock (tests). Default Date.now. */
  now?(): number;
}

export type BuyResult = { ok: true } | { ok: false; error: string };

export interface Ownership {
  // ---- Properties ----
  /** Buy a registered property: spend def.down Acorns, book (price - down) * (1 + interest) as loan def.id via
   *  economy.borrow (nothing booked when that is 0), mark owned, persist, notify onPropertyChange listeners.
   *  Errors (sentences): unknown id, already owned, not enough Acorns for the down payment. */
  buyProperty(id: string): BuyResult;
  ownsProperty(id: string): boolean;
  /** Owned property ids, in purchase order. */
  properties(): readonly string[];
  /** Called after every property change. Returns an unsubscribe function. */
  onPropertyChange(cb: (id: string) => void): () => void;

  // ---- Vehicle value ----
  /** Record what a vehicle cost at a dealership (persists). */
  setBought(uid: string, price: number): void;
  /** Acorns paid at a dealership for uid, or null. */
  boughtFor(uid: string): number | null;

  // ---- Kiln-Shield ----
  insured(uid: string): boolean;
  /** The policy fee for a vehicle worth `value`. */
  feeFor(value: number): number;
  /** The reclaim deductible for a vehicle worth `value`. */
  deductibleFor(value: number): number;
  /** Take out a policy: spends feeFor(value) Acorns ('Kiln-Shield'). Errors: already insured, not enough Acorns. */
  insure(uid: string, value: number): BuyResult;
  policy(uid: string): Policy | null;
  /** Every uid with a policy (stored, out, or a wreck). */
  policyUids(): string[];
  /** An owned vehicle was written off (lockup onWrittenOff). Insured: keep rec in wrecks (persist) and return true.
   *  Uninsured: forget its bought price and return false (the loss stands). */
  fileWreck(rec: StoredVehicle): boolean;
  /** Insured wrecks waiting for a reclaim, oldest first. */
  wrecks(): readonly StoredVehicle[];
  /** Seconds until uid may be reclaimed again (0 = now). 0 for an unknown uid. */
  reclaimWait(uid: string): number;
  /** Reclaim the wreck uid: refuses (error sentence) when there is no such wreck, during the cooldown, or when the
   *  deductible cannot be paid; else spends the deductible ('Kiln-Shield'), removes the wreck, sets lastReclaim and
   *  returns the record. The caller puts it back in a garage and calls rekey with the new uid. */
  reclaim(uid: string): { ok: true; rec: StoredVehicle; paid: number } | { ok: false; error: string };
  /** Move policy and bought price from oldUid to newUid (a reclaimed vehicle gets a new Lock-Up uid). */
  rekey(oldUid: string, newUid: string): void;
  /** Forget uid entirely (scrapped): policy, bought price, wreck. */
  forget(uid: string): void;
}

// ---- Property registry (module level, so a content epic can register at import time) ----

const propertyDefs = new Map<string, PropertyDef>();

/** Add a property (or replace the one with the same id). */
export function registerProperty(def: PropertyDef): void {
  propertyDefs.set(def.id, def);
}

/** Every registered property, in registration order. */
export function listProperties(): readonly PropertyDef[] {
  return [...propertyDefs.values()];
}

export function propertyDef(id: string): PropertyDef | undefined {
  return propertyDefs.get(id);
}

/** Debug and tests: drop every registered property. */
export function clearProperties(): void {
  propertyDefs.clear();
}

function defaultOwnershipSave(): OwnershipSave {
  return { v: 1, properties: [], policies: {}, wrecks: [], bought: {} };
}

function resolveDefaultOwnershipStorage(): OwnershipStorage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function isFiniteNumber(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}

function hasOwn(o: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, key);
}

/** Load the saved ownership data; anything malformed is dropped field by field (never throws). */
function loadOwnershipSave(storage: OwnershipStorage | undefined): OwnershipSave {
  if (!storage) return defaultOwnershipSave();
  try {
    const raw = storage.getItem(OWNERSHIP_KEY);
    if (!raw) return defaultOwnershipSave();
    const parsed = JSON.parse(raw) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== 'object') return defaultOwnershipSave();

    const out = defaultOwnershipSave();
    if (Array.isArray(parsed.properties)) {
      out.properties = parsed.properties.filter((id): id is string => typeof id === 'string');
    }
    if (parsed.policies && typeof parsed.policies === 'object') {
      for (const [uid, value] of Object.entries(parsed.policies as Record<string, unknown>)) {
        const p = value as Partial<Policy> | null;
        if (p && typeof p === 'object' && isFiniteNumber(p.value) && isFiniteNumber(p.since) && isFiniteNumber(p.lastReclaim)) {
          out.policies[uid] = { value: p.value, since: p.since, lastReclaim: p.lastReclaim };
        }
      }
    }
    if (Array.isArray(parsed.wrecks)) {
      out.wrecks = parsed.wrecks.filter(
        (w): w is StoredVehicle => !!w && typeof w === 'object' && typeof (w as StoredVehicle).uid === 'string',
      );
    }
    if (parsed.bought && typeof parsed.bought === 'object') {
      for (const [uid, price] of Object.entries(parsed.bought as Record<string, unknown>)) {
        if (isFiniteNumber(price) && price >= 0) out.bought[uid] = price;
      }
    }
    return out;
  } catch {
    return defaultOwnershipSave();
  }
}

export function createOwnership(deps: OwnershipDeps): Ownership {
  const economy = deps.economy;
  const storage = deps.storage ?? resolveDefaultOwnershipStorage();
  const now = deps.now ?? (() => Date.now());
  const data = loadOwnershipSave(storage);
  const listeners = new Set<(id: string) => void>();

  const persist = (): void => {
    if (storage) {
      try {
        storage.setItem(OWNERSHIP_KEY, JSON.stringify(data));
      } catch {
        // Storage quota or private-mode access failure is non-fatal.
      }
    }
    notifySaveChanged();
  };

  const feeFor = (value: number): number => Math.max(INSURANCE.minFee, Math.round(value * INSURANCE.feeRate));
  const deductibleFor = (value: number): number =>
    Math.max(INSURANCE.minDeductible, Math.round(value * INSURANCE.deductibleRate));

  const reclaimWait = (uid: string): number => {
    if (!hasOwn(data.policies, uid)) return 0;
    const p = data.policies[uid];
    if (p.lastReclaim === 0) return 0;
    return Math.max(0, Math.ceil((p.lastReclaim + INSURANCE.reclaimCooldownMs - now()) / 1000));
  };

  // ---- Properties ----

  const buyProperty = (id: string): BuyResult => {
    const def = propertyDef(id);
    if (!def) return { ok: false, error: 'No such property.' };
    if (data.properties.includes(id)) return { ok: false, error: `You already own ${def.name}.` };

    const down = Math.max(0, Math.round(def.down));
    const acorns = economy.state().acorns;
    if (acorns < down || (down > 0 && !economy.spend(down, def.name))) {
      return { ok: false, error: `${def.name} needs ${down} Acorns down. You have ${acorns}.` };
    }

    const loan = Math.round(Math.max(0, def.price - down) * (1 + (def.interest ?? 0)));
    if (loan > 0) economy.borrow(def.id, `${def.name} loan`, loan);

    data.properties.push(id);
    persist();
    for (const cb of Array.from(listeners)) cb(id);
    return { ok: true };
  };

  // ---- Vehicle value ----

  const setBought = (uid: string, price: number): void => {
    data.bought[uid] = Math.max(0, Math.round(price));
    persist();
  };

  const boughtFor = (uid: string): number | null => (hasOwn(data.bought, uid) ? data.bought[uid] : null);

  // ---- Kiln-Shield ----

  const insure = (uid: string, value: number): BuyResult => {
    if (hasOwn(data.policies, uid)) return { ok: false, error: 'That one is already covered.' };
    const fee = feeFor(value);
    if (economy.state().acorns < fee || !economy.spend(fee, 'Kiln-Shield')) {
      return { ok: false, error: `Kiln-Shield cover costs ${fee} Acorns.` };
    }
    data.policies[uid] = { value: Math.round(value), since: now(), lastReclaim: 0 };
    persist();
    return { ok: true };
  };

  const fileWreck = (rec: StoredVehicle): boolean => {
    if (hasOwn(data.policies, rec.uid)) {
      data.wrecks = data.wrecks.filter((w) => w.uid !== rec.uid);
      data.wrecks.push({ ...rec });
      persist();
      return true;
    }
    delete data.bought[rec.uid];
    persist();
    return false;
  };

  const reclaim = (uid: string): { ok: true; rec: StoredVehicle; paid: number } | { ok: false; error: string } => {
    const idx = data.wrecks.findIndex((w) => w.uid === uid);
    if (idx < 0 || !hasOwn(data.policies, uid)) return { ok: false, error: 'No claim for that one.' };
    const wait = reclaimWait(uid);
    if (wait > 0) return { ok: false, error: `Kiln-Shield needs ${wait} s more to process that claim.` };

    const policy = data.policies[uid];
    const deductible = deductibleFor(policy.value);
    if (economy.state().acorns < deductible || !economy.spend(deductible, 'Kiln-Shield')) {
      return { ok: false, error: `The deductible is ${deductible} Acorns.` };
    }

    const [rec] = data.wrecks.splice(idx, 1);
    policy.lastReclaim = now();
    persist();
    return { ok: true, rec: { ...rec }, paid: deductible };
  };

  const rekey = (oldUid: string, newUid: string): void => {
    if (oldUid === newUid) return;
    if (hasOwn(data.policies, oldUid)) {
      data.policies[newUid] = data.policies[oldUid];
      delete data.policies[oldUid];
    }
    if (hasOwn(data.bought, oldUid)) {
      data.bought[newUid] = data.bought[oldUid];
      delete data.bought[oldUid];
    }
    persist();
  };

  const forget = (uid: string): void => {
    delete data.policies[uid];
    delete data.bought[uid];
    data.wrecks = data.wrecks.filter((w) => w.uid !== uid);
    persist();
  };

  return {
    buyProperty,
    ownsProperty: (id) => data.properties.includes(id),
    properties: () => [...data.properties],
    onPropertyChange: (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },

    setBought,
    boughtFor,

    insured: (uid) => hasOwn(data.policies, uid),
    feeFor,
    deductibleFor,
    insure,
    policy: (uid) => (hasOwn(data.policies, uid) ? { ...data.policies[uid] } : null),
    policyUids: () => Object.keys(data.policies),
    fileWreck,
    wrecks: () => data.wrecks.map((w) => ({ ...w })),
    reclaimWait,
    reclaim,
    rekey,
    forget,
  };
}

// ---- The installed instance (the game installs one; other epics call these) ----

let active: Ownership | null = null;

export function installOwnership(o: Ownership | null): void {
  active = o;
}

export function activeOwnership(): Ownership | null {
  return active;
}

/** Buy a registered property through the installed instance. */
export function buyProperty(id: string): BuyResult {
  return active ? active.buyProperty(id) : { ok: false, error: 'Not now.' };
}

export function ownsProperty(id: string): boolean {
  return active ? active.ownsProperty(id) : false;
}

/** Listen for property changes on the installed instance (no-op unsubscribe when none is installed yet). */
export function onPropertyChange(cb: (id: string) => void): () => void {
  return active ? active.onPropertyChange(cb) : () => {};
}
