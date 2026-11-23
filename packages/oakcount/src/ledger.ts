// The Oakcount's rules as pure functions of plain data: no storage, no DOM. Every operation returns the next state,
// or null when it is not allowed (not enough acorns, a bad amount), and never changes the state it was given.

/** Tuning: exchange rate, gifts and the cap. */
export const OAK = {
  /** Chips you get for one acorn at the Gnomecino cashier. Acorns become chips; chips never become acorns. */
  chipsPerAcorn: 10,
  /** The one-time welcome gift on a gnome's first visit to Club Gnome. */
  welcomeAcorns: 100,
  /** The daily visit gift (once per local calendar day). */
  dailyAcorns: 25,
  /** No balance goes above this. */
  maxBalance: 9_999_999,
} as const;

export interface OakState {
  version: 1;
  acorns: number;
  chips: number;
  /** Ids of everything bought (shop item ids, hair styles as 'hair:<style>'), sorted, no duplicates. */
  owned: string[];
  /** The welcome gift was given. */
  welcomed: boolean;
  /** Day key ('YYYY-MM-DD') of the last daily gift, '' for never. */
  lastDaily: string;
  /** Bumped on every change; the cloud merge keeps the state with the higher rev. */
  rev: number;
  /** Date.now() of the last change. */
  updatedAt: number;
}

export function emptyOak(): OakState {
  return { version: 1, acorns: 0, chips: 0, owned: [], welcomed: false, lastDaily: '', rev: 0, updatedAt: 0 };
}

const count = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(OAK.maxBalance, Math.floor(v)) : 0;

/** Reads a saved state; anything malformed counts as empty (field by field). */
export function parseOak(text: string | null): OakState {
  if (text === null) return emptyOak();
  let d: Record<string, unknown>;
  try {
    const v: unknown = JSON.parse(text);
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return emptyOak();
    d = v as Record<string, unknown>;
  } catch {
    return emptyOak();
  }
  const owned = Array.isArray(d.owned) ? d.owned.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 64) : [];
  return {
    version: 1,
    acorns: count(d.acorns),
    chips: count(d.chips),
    owned: [...new Set(owned)].sort(),
    welcomed: d.welcomed === true,
    lastDaily: typeof d.lastDaily === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.lastDaily) ? d.lastDaily : '',
    rev: count(d.rev),
    updatedAt: count(d.updatedAt),
  };
}

export function serializeOak(s: OakState): string {
  return JSON.stringify(s);
}

/**
 * Cloud merge (deterministic, idempotent): the side with the higher rev wins (then the later updatedAt, then the
 * larger text), but purchases are never lost: owned is the union of both sides.
 */
export function mergeOak(local: string | null, remote: string): string {
  const a = parseOak(local);
  const b = parseOak(remote);
  const ta = serializeOak(a);
  const tb = serializeOak(b);
  const aWins = a.rev !== b.rev ? a.rev > b.rev : a.updatedAt !== b.updatedAt ? a.updatedAt > b.updatedAt : ta >= tb;
  const win = aWins ? a : b;
  return serializeOak({ ...win, owned: [...new Set([...a.owned, ...b.owned])].sort(), welcomed: a.welcomed || b.welcomed });
}

const okAmount = (n: number): boolean => Number.isInteger(n) && n > 0 && n <= OAK.maxBalance;

function bump(s: OakState, now: number, patch: Partial<OakState>): OakState {
  return { ...s, ...patch, rev: s.rev + 1, updatedAt: now };
}

export function earnAcorns(s: OakState, n: number, now: number): OakState | null {
  if (!okAmount(n)) return null;
  return bump(s, now, { acorns: Math.min(OAK.maxBalance, s.acorns + n) });
}

export function spendAcorns(s: OakState, n: number, now: number): OakState | null {
  if (!okAmount(n) || s.acorns < n) return null;
  return bump(s, now, { acorns: s.acorns - n });
}

/** Trades `acorns` acorns for acorns * OAK.chipsPerAcorn chips. One way. */
export function buyChips(s: OakState, acorns: number, now: number): OakState | null {
  if (!okAmount(acorns) || s.acorns < acorns) return null;
  return bump(s, now, { acorns: s.acorns - acorns, chips: Math.min(OAK.maxBalance, s.chips + acorns * OAK.chipsPerAcorn) });
}

export function spendChips(s: OakState, n: number, now: number): OakState | null {
  if (!okAmount(n) || s.chips < n) return null;
  return bump(s, now, { chips: s.chips - n });
}

/** Buys item `id` for `price` in acorns or chips. Null when already owned or not affordable. */
export function buyItem(s: OakState, id: string, price: number, currency: 'acorns' | 'chips', now: number): OakState | null {
  if (id.length === 0 || id.length > 64 || s.owned.includes(id)) return null;
  const paid = currency === 'acorns' ? spendAcorns(s, price, now) : spendChips(s, price, now);
  if (!paid) return null;
  return { ...paid, owned: [...paid.owned, id].sort() };
}

/** The welcome gift, once ever. */
export function welcome(s: OakState, now: number): OakState | null {
  if (s.welcomed) return null;
  return bump(s, now, { welcomed: true, acorns: Math.min(OAK.maxBalance, s.acorns + OAK.welcomeAcorns) });
}

/** The daily gift, once per day key. */
export function claimDaily(s: OakState, dayKey: string, now: number): OakState | null {
  if (s.lastDaily === dayKey) return null;
  return bump(s, now, { lastDaily: dayKey, acorns: Math.min(OAK.maxBalance, s.acorns + OAK.dailyAcorns) });
}

/** Local calendar day of a time, 'YYYY-MM-DD'. */
export function dayKeyOf(t: number): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
