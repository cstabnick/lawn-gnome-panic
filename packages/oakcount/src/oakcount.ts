// The Oakcount at runtime: one state per browser (localStorage `oakcount.v1`), mirrored to the signed-in player's
// account (cloud slot game 'OAKCOUNT', merge mode, see ledger.ts mergeOak). Guests keep it in this browser only.
// Every game on the site shares it: acorns earned anywhere can be spent anywhere.
import { createCloudSlot, type CloudDeps, type CloudSlot } from '@lawn/cloudsave';
import * as L from './ledger';
import type { OakState } from './ledger';

export const OAKCOUNT_STORAGE_KEY = 'oakcount.v1';
export const OAKCOUNT_CLOUD_SYNC_KEY = 'oakcount.cloud.v1';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface LoadOakcountOptions {
  /** Default: localStorage (null when blocked: the Oakcount then lives in memory for this visit). */
  storage?: StorageLike | null;
  /** Replaces cloud slot deps (tests). `{ signedIn: () => false }` turns the cloud off. */
  slotDeps?: Partial<CloudDeps>;
  /** Clock (tests). Default Date.now. */
  now?: () => number;
}

let storage: StorageLike | null = null;
let slot: CloudSlot | null = null;
let now: () => number = () => Date.now();
let state: OakState = L.emptyOak();
let loading: Promise<void> | null = null;
const listeners = new Set<(s: Readonly<OakState>) => void>();

function defaultStorage(): StorageLike | null {
  try {
    const s = localStorage;
    s.getItem(OAKCOUNT_STORAGE_KEY);
    return s;
  } catch {
    return null;
  }
}

function readLocal(): void {
  try {
    if (storage) state = L.parseOak(storage.getItem(OAKCOUNT_STORAGE_KEY));
  } catch {
    // keep what we have
  }
}

function emit(): void {
  for (const cb of [...listeners]) {
    try {
      cb(state);
    } catch (e) {
      console.warn('oakcount listener failed', e);
    }
  }
}

/** Applies an operation's result: saves, pushes to the cloud, tells listeners. False when the op refused. */
function commit(next: OakState | null): boolean {
  if (next === null) return false;
  state = next;
  try {
    storage?.setItem(OAKCOUNT_STORAGE_KEY, L.serializeOak(state));
  } catch {
    // storage full or blocked: the change holds for this visit
  }
  slot?.pushSave();
  emit();
  return true;
}

/**
 * Call once at startup (after finishing a sign-in, before reading balances). Syncs with the account when signed in
 * (gives up after 3 s and plays from local). Calling it again returns the same promise. Never rejects.
 */
export function loadOakcount(opts: LoadOakcountOptions = {}): Promise<void> {
  if (loading) return loading;
  storage = opts.storage !== undefined ? opts.storage : defaultStorage();
  now = opts.now ?? (() => Date.now());
  loading = (async () => {
    readLocal();
    try {
      slot = createCloudSlot({
        game: 'OAKCOUNT',
        saveKey: OAKCOUNT_STORAGE_KEY,
        syncKey: OAKCOUNT_CLOUD_SYNC_KEY,
        mode: 'merge',
        merge: L.mergeOak,
        summarize: (t) => {
          const s = L.parseOak(t);
          return `${s.acorns} acorns, ${s.chips} chips, ${s.owned.length} items`;
        },
        onLocalChanged: () => {
          readLocal();
          emit();
        },
        deps: { storage, ...opts.slotDeps },
      });
      await slot.syncAtStartup(3000);
    } catch {
      // play from local
    }
    readLocal();
    emit();
  })();
  return loading;
}

/** Forgets everything loaded (tests only). */
export function resetOakcountForTests(): void {
  loading = null;
  slot = null;
  storage = null;
  state = L.emptyOak();
  listeners.clear();
}

export function getOakcount(): Readonly<OakState> {
  return state;
}
export function getAcorns(): number {
  return state.acorns;
}
export function getChips(): number {
  return state.chips;
}
export function owns(id: string): boolean {
  return state.owned.includes(id);
}

/** Adds acorns (a pickup, a prize). False for a bad amount. */
export function earnAcorns(n: number): boolean {
  return commit(L.earnAcorns(state, n, now()));
}
export function spendAcorns(n: number): boolean {
  return commit(L.spendAcorns(state, n, now()));
}
/** Acorns -> chips at OAK.chipsPerAcorn. One way. False when there are not enough acorns. */
export function buyChips(acorns: number): boolean {
  return commit(L.buyChips(state, acorns, now()));
}
/** Chips won at a table or slot machine. False for a bad amount. */
export function winChips(n: number): boolean {
  return commit(L.winChips(state, n, now()));
}
export function spendChips(n: number): boolean {
  return commit(L.spendChips(state, n, now()));
}
/** Buys an item once. False when already owned or not affordable. */
export function buyItem(id: string, price: number, currency: 'acorns' | 'chips'): boolean {
  return commit(L.buyItem(state, id, price, currency, now()));
}
/** The one-time welcome gift: returns the acorns given (0 when it was given before). */
export function grantWelcome(): number {
  return commit(L.welcome(state, now())) ? L.OAK.welcomeAcorns : 0;
}
/** Today's visit gift: returns the acorns given (0 when already claimed today). */
export function claimDailyAcorns(): number {
  return commit(L.claimDaily(state, L.dayKeyOf(now()), now())) ? L.OAK.dailyAcorns : 0;
}

/** Calls cb after every change (and once after loadOakcount finishes). Returns an unsubscribe function. */
export function onOakcountChange(cb: (s: Readonly<OakState>) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
