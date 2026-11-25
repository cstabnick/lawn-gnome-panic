import { notifySaveChanged } from './saveHook';
export const ECONOMY_KEY = 'gta-economy-v1';
export const STARTING_ACORNS = 50;
export const STARTING_DEBT = 5000;
export const HOSPITAL_FEE = 35;

const MIN_FRAUD_IMPACT_SPEED = 4;
const FRAUD_PAYOUT_PER_SPEED = 10;

export interface FraudZone {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
}

export const FRAUD_ZONES: readonly FraudZone[] = [
  { id: 'downtown', name: 'Downtown Crossing', x: 0, z: 0, radius: 18 },
  { id: 'clay-mart', name: 'Clay-Mart Lot', x: -150, z: 130, radius: 22 },
  { id: 'greenhouse', name: 'Greenhouse Strip', x: 60, z: 0, radius: 20 },
];

/** A loan booked beside Kiln-Debt (ownership.ts buyProperty). Kiln-Debt stays the headline number; loans are extra. */
export interface Loan {
  /** Unique id; a property's loan uses the property id. */
  id: string;
  /** Shown name ("Mossbank Farm loan"). */
  name: string;
  /** Acorns borrowed. */
  principal: number;
  /** Acorns still owed (0 = repaid; repaid loans are dropped from the list). */
  remaining: number;
}

export interface EconomyState {
  acorns: number;
  debtRemaining: number;
  debtPaidOff: boolean;
  /** Open loans (E08). Older saves have none. Never part of debtRemaining / debtPaidOff. */
  loans: Loan[];
}

export interface Economy {
  state(): EconomyState;
  earn(amount: number, reason?: string): void;
  spend(amount: number, reason?: string): boolean;
  payDebt(amount: number): number;
  chargeHospital(): { fee: number; receipt: string };
  inFraudZone(x: number, z: number): boolean;
  onPlayerRagdollImpact(speed: number, x?: number, z?: number): number;
  /** Book a loan (no Acorns change hands here: the caller decides what the loan pays for). Adds to an existing loan
   *  with the same id. Returns false for a non-positive amount. */
  borrow(id: string, name: string, amount: number): boolean;
  /** Pay up to `amount` Acorns off loan `id` from the wallet; returns what was paid (0 = unknown id or no Acorns).
   *  A loan paid down to 0 is removed. */
  payLoan(id: string, amount: number): number;
  /** Kiln-Debt plus every open loan. */
  totalOwed(): number;
}

type EconomyStorage = Pick<Storage, 'getItem' | 'setItem'>;

interface ReceiptTemplate {
  treatment: string;
  denial: string;
}

const HOSPITAL_RECEIPTS: readonly ReceiptTemplate[] = [
  {
    treatment: 'Peppermint Slip',
    denial: 'Act of Pip Potsworth.',
  },
  {
    treatment: 'Cherry-Scented Kiln-Cement',
    denial: 'Pre-existing hairline crack.',
  },
  {
    treatment: 'Hat Re-Glaze & Bake',
    denial: 'Porcelain exclusion clause 4B.',
  },
  {
    treatment: 'Dustpan Sweep & Mortar Patch',
    denial: 'Unapproved airborne lawn-equipment impact.',
  },
  {
    treatment: 'Emergency Terracotta Splint',
    denial: 'Claim filed in non-teal ink.',
  },
];

function resolveDefaultStorage(): EconomyStorage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function defaultState(): EconomyState {
  return {
    acorns: STARTING_ACORNS,
    debtRemaining: STARTING_DEBT,
    debtPaidOff: false,
    loans: [],
  };
}

function parseLoans(raw: unknown): Loan[] {
  if (!Array.isArray(raw)) return [];
  const out: Loan[] = [];
  for (const l of raw) {
    if (!l || typeof l !== 'object') continue;
    const o = l as Partial<Loan>;
    if (typeof o.id !== 'string' || typeof o.name !== 'string') continue;
    const principal = typeof o.principal === 'number' && Number.isFinite(o.principal) ? Math.max(0, Math.round(o.principal)) : 0;
    const remaining = typeof o.remaining === 'number' && Number.isFinite(o.remaining) ? Math.max(0, Math.round(o.remaining)) : 0;
    if (remaining <= 0) continue;
    out.push({ id: o.id, name: o.name, principal, remaining });
  }
  return out;
}

function loadState(storage: EconomyStorage | undefined): EconomyState {
  if (!storage) return defaultState();
  try {
    const raw = storage.getItem(ECONOMY_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<EconomyState> | null;
    if (!parsed || typeof parsed !== 'object') return defaultState();

    const acorns =
      typeof parsed.acorns === 'number' && Number.isFinite(parsed.acorns) && parsed.acorns >= 0
        ? Math.round(parsed.acorns)
        : STARTING_ACORNS;
    const debtRemaining =
      typeof parsed.debtRemaining === 'number' &&
      Number.isFinite(parsed.debtRemaining) &&
      parsed.debtRemaining >= 0
        ? Math.round(parsed.debtRemaining)
        : STARTING_DEBT;
    const debtPaidOff = debtRemaining <= 0 || parsed.debtPaidOff === true;

    return { acorns, debtRemaining, debtPaidOff, loans: parseLoans((parsed as { loans?: unknown }).loans) };
  } catch {
    return defaultState();
  }
}

function saveState(storage: EconomyStorage | undefined, state: EconomyState): void {
  if (!storage) return;
  try {
    storage.setItem(ECONOMY_KEY, JSON.stringify(state));
    notifySaveChanged();
  } catch {
    // Storage quota or private-mode access failure is non-fatal.
  }
}

/**
 * Creates the player's Acorn wallet, Clay-Mart Kiln-Debt ledger,
 * Glaze Clinic billing, and Kiln-Shield ragdoll fraud tracker.
 */
export function createEconomy(storage?: EconomyStorage): Economy {
  const store = storage ?? resolveDefaultStorage();
  const current = loadState(store);
  let receiptCursor = 0;

  const persist = (): void => saveState(store, current);

  const earn = (amount: number, _reason?: string): void => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const delta = Math.round(amount);
    if (delta <= 0) return;
    current.acorns += delta;
    persist();
  };

  const spend = (amount: number, _reason?: string): boolean => {
    if (!Number.isFinite(amount)) return false;
    if (amount <= 0) return true;
    const cost = Math.round(amount);
    if (cost <= 0) return true;
    if (current.acorns < cost) return false;
    current.acorns -= cost;
    persist();
    return true;
  };

  const payDebt = (amount: number): number => {
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    const paid = Math.max(0, Math.min(Math.round(amount), current.acorns, current.debtRemaining));
    if (paid <= 0) return 0;
    current.acorns -= paid;
    current.debtRemaining -= paid;
    current.debtPaidOff = current.debtRemaining <= 0;
    persist();
    return paid;
  };

  const chargeHospital = (): { fee: number; receipt: string } => {
    const fee = Math.max(0, Math.min(HOSPITAL_FEE, current.acorns));
    current.acorns -= fee;
    persist();

    const template = HOSPITAL_RECEIPTS[receiptCursor % HOSPITAL_RECEIPTS.length];
    receiptCursor += 1;
    const receipt = `GLAZE CLINIC: -${fee} Acorns (${template.treatment}). KILN-SHIELD: CLAIM DENIED — "${template.denial}"`;
    return { fee, receipt };
  };

  const inFraudZone = (x: number, z: number): boolean => {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
    return FRAUD_ZONES.some((zone) => {
      const dx = x - zone.x;
      const dz = z - zone.z;
      return dx * dx + dz * dz <= zone.radius * zone.radius;
    });
  };

  const onPlayerRagdollImpact = (speed: number, x?: number, z?: number): number => {
    if (!Number.isFinite(speed) || speed < MIN_FRAUD_IMPACT_SPEED) return 0;
    if (x !== undefined && z !== undefined && !inFraudZone(x, z)) return 0;
    const payout = Math.round(speed * FRAUD_PAYOUT_PER_SPEED);
    earn(payout, 'Kiln-Shield Fraud');
    return payout;
  };

  const borrow = (id: string, name: string, amount: number): boolean => {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    const a = Math.round(amount);
    if (a <= 0) return false;
    const have = current.loans.find((l) => l.id === id);
    if (have) {
      have.principal += a;
      have.remaining += a;
      have.name = name;
    } else {
      current.loans.push({ id, name, principal: a, remaining: a });
    }
    persist();
    return true;
  };

  const payLoan = (id: string, amount: number): number => {
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    const loan = current.loans.find((l) => l.id === id);
    if (!loan) return 0;
    const paid = Math.max(0, Math.min(Math.round(amount), current.acorns, loan.remaining));
    if (paid <= 0) return 0;
    current.acorns -= paid;
    loan.remaining -= paid;
    if (loan.remaining <= 0) current.loans = current.loans.filter((l) => l !== loan);
    persist();
    return paid;
  };

  const totalOwed = (): number => current.debtRemaining + current.loans.reduce((n, l) => n + l.remaining, 0);

  return {
    state: () => ({ ...current, loans: current.loans.map((l) => ({ ...l })) }),
    borrow,
    payLoan,
    totalOwed,
    earn,
    spend,
    payDebt,
    chargeHospital,
    inFraudZone,
    onPlayerRagdollImpact,
  };
}
