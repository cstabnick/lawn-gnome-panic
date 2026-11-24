// The portal ledger: what the player gained inside a building, applied to the origin game exactly once.
// The origin page keeps a LedgerBook in localStorage under ledgerKey(game): entries arrive while they happen
// (pending), and settle() applies them and moves their ids to `applied`, in one synchronous step with the save, so a
// closed tab neither loses nor repeats one: what was pending is settled on the next load.
import type { LedgerEntry, LedgerKind } from './types';

export const LEDGER_KEY = 'lawn.portal.ledger.v1';
/** How many applied ids are remembered (newest kept). An id older than this cannot come back: visits are unique. */
export const APPLIED_CAP = 500;
/** Most entries one message may carry. */
export const MAX_ENTRIES = 64;

export function ledgerKey(game: string): string {
  return `${LEDGER_KEY}:${game}`;
}

export interface LedgerBook {
  version: 1;
  pending: LedgerEntry[];
  applied: string[];
}

const KINDS: readonly LedgerKind[] = ['chips', 'acorns', 'item', 'achievement', 'note'];

export function isEntry(v: unknown): v is LedgerEntry {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  const s = (x: unknown, max = 200): boolean => typeof x === 'string' && x.length > 0 && x.length <= max;
  if (!s(e.id) || !s(e.visit) || !s(e.portal) || !s(e.store) || typeof e.at !== 'number') return false;
  if (!KINDS.includes(e.kind as LedgerKind)) return false;
  switch (e.kind) {
    case 'chips':
    case 'acorns':
      return typeof e.amount === 'number' && Number.isInteger(e.amount) && Math.abs(e.amount) <= 10_000_000;
    case 'item':
    case 'achievement':
      return s(e.ref, 80);
    case 'note':
      return s(e.text, 300);
  }
  return false;
}

export function emptyBook(): LedgerBook {
  return { version: 1, pending: [], applied: [] };
}

export function parseBook(text: string | null): LedgerBook {
  if (!text) return emptyBook();
  try {
    const raw = JSON.parse(text) as Partial<LedgerBook>;
    return {
      version: 1,
      pending: Array.isArray(raw.pending) ? raw.pending.filter(isEntry) : [],
      applied: Array.isArray(raw.applied) ? raw.applied.filter((x): x is string => typeof x === 'string').slice(-APPLIED_CAP) : [],
    };
  } catch {
    return emptyBook();
  }
}

export function serializeBook(b: LedgerBook): string {
  return JSON.stringify(b);
}

/** Adds new entries as pending. Malformed ones and ids already pending or applied are skipped (idempotent). */
export function addEntries(book: LedgerBook, entries: readonly unknown[]): LedgerBook {
  const seen = new Set([...book.applied, ...book.pending.map((e) => e.id)]);
  const pending = book.pending.slice();
  for (const e of entries) {
    if (!isEntry(e) || seen.has(e.id)) continue;
    seen.add(e.id);
    pending.push(e);
  }
  return { version: 1, pending, applied: book.applied };
}

/** How the origin game applies each kind. A missing handler means "this game has no such thing": recorded only. */
export interface LedgerAdapter {
  chips?(delta: number): void;
  acorns?(delta: number): void;
  item?(id: string): void;
  achievement?(id: string): void;
  note?(text: string): void;
}

/**
 * Applies the pending entries (of one visit, or all) and marks them applied. An entry whose `store` is myStore
 * (this page's location.origin) is already in this page's storage: only notes are shown, nothing else is applied
 * again. A throwing handler does not stop the others (the entry still counts as applied: never twice).
 * Call it, then save the returned book, in the same synchronous task.
 */
export function settle(book: LedgerBook, adapter: LedgerAdapter, myStore: string, visit?: string): { book: LedgerBook; settled: LedgerEntry[] } {
  const settled: LedgerEntry[] = [];
  const keep: LedgerEntry[] = [];
  for (const e of book.pending) {
    if (visit !== undefined && e.visit !== visit) {
      keep.push(e);
      continue;
    }
    settled.push(e);
    const foreign = e.store !== myStore;
    try {
      if (e.kind === 'note') adapter.note?.(e.text ?? '');
      else if (!foreign) continue;
      else if (e.kind === 'chips') adapter.chips?.(e.amount ?? 0);
      else if (e.kind === 'acorns') adapter.acorns?.(e.amount ?? 0);
      else if (e.kind === 'item') adapter.item?.(e.ref ?? '');
      else if (e.kind === 'achievement') adapter.achievement?.(e.ref ?? '');
    } catch (err) {
      console.warn('portal ledger: an entry failed to apply', e.id, err);
    }
  }
  const applied = [...book.applied, ...settled.map((e) => e.id)].slice(-APPLIED_CAP);
  return { book: { version: 1, pending: keep, applied }, settled };
}

/** Short lines for the "back from the building" toast: "+120 chips", "New: card-fan", "Achievement: ...". */
export function summarize(entries: readonly LedgerEntry[], title: (achievementId: string) => string = (id) => id): string[] {
  let chips = 0;
  let acorns = 0;
  const lines: string[] = [];
  for (const e of entries) {
    if (e.kind === 'chips') chips += e.amount ?? 0;
    else if (e.kind === 'acorns') acorns += e.amount ?? 0;
  }
  if (chips) lines.push(`${chips > 0 ? '+' : ''}${chips} chips`);
  if (acorns) lines.push(`${acorns > 0 ? '+' : ''}${acorns} acorns`);
  for (const e of entries) {
    if (e.kind === 'item') lines.push(`New: ${e.ref}`);
    else if (e.kind === 'achievement') lines.push(`Achievement: ${title(e.ref ?? '')}`);
    else if (e.kind === 'note') lines.push(e.text ?? '');
  }
  return lines;
}
