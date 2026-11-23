// The local gnome store: the player's gnome in localStorage, behind the GnomeStore interface (types.ts).
// createGnomeStore() is THE place that decides where gnomes live; the platform service replaces it later.
import { checkName } from '@lawn/mp/textFilter';
import { accountsEnabled, hasStoredSession } from '@lawn/platform/session';
import { showSyncNotice, watchKey } from '@lawn/sync';
import { ConnectGnomeStore } from './connectStore';
import { snapLook } from './look';
import { GnomeStoreError, isHairStyle, type Gnome, type GnomeStore, type Look } from './types';

/** localStorage key. Holds exactly one `Gnome` as JSON (the service's `Gnome` JSON), so uploading it later needs no conversion. */
export const STORAGE_KEY = 'gnome.profile.v1';

/** The part of localStorage the store uses (tests pass a fake). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** A 0xRRGGBB colour. */
function isColour(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 0xffffff;
}

const EQUIP_SLOTS = new Set(['head', 'back', 'neck', 'hand']);

function isValidEquipment(v: unknown): boolean {
  if (v === undefined) return true;
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (!EQUIP_SLOTS.has(k)) return false;
    if (val !== undefined && typeof val !== 'string') return false;
  }
  return true;
}

/** Checks a look from storage or from a caller. Optional fields must be absent (not null) when unused. */
function isValidLook(v: unknown): v is Look {
  if (typeof v !== 'object' || v === null) return false;
  const l = v as Record<string, unknown>;
  const colours = ['hatRgb', 'coatRgb', 'pantsRgb', 'bootsRgb', 'skinRgb'];
  if (!colours.every((k) => isColour(l[k]))) return false;
  if (l.beardRgb !== undefined && !isColour(l.beardRgb)) return false;
  if (l.hairRgb !== undefined && !isColour(l.hairRgb)) return false;
  if (l.hairStyle !== undefined && !isHairStyle(l.hairStyle)) return false;
  if (!isValidEquipment(l.equipment)) return false;
  return typeof l.freckles === 'boolean' && typeof l.dress === 'boolean' && typeof l.glasses === 'boolean';
}

/** Returns the gnome if the stored value has the right shape; an invalid look is dropped, the rest is kept. */
function parseGnome(data: unknown): Gnome | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  const d = data as Record<string, unknown>;
  if (typeof d.userId !== 'string' || d.userId === '') return null;
  if (typeof d.createdAt !== 'string') return null;
  const name = checkName(d.displayName);
  if (!name.ok) return null;
  const gnome: Gnome = { userId: d.userId, displayName: name.name, createdAt: d.createdAt };
  if (isValidLook(d.look)) gnome.look = d.look;
  return gnome;
}

/** Deep copy so callers cannot change the cached gnome. */
function copy(g: Gnome): Gnome {
  return JSON.parse(JSON.stringify(g)) as Gnome;
}

export class LocalGnomeStore implements GnomeStore {
  private readonly storage: StorageLike | null;
  private readonly now: () => Date;
  private readonly random: () => number;
  /** The gnome this instance last loaded or saved. Kept so storage-less instances still work. */
  private cache: Gnome | null = null;

  constructor(
    storage: StorageLike | null = typeof localStorage === 'undefined' ? null : localStorage,
    now: () => Date = () => new Date(),
    random: () => number = Math.random,
    watch = false,
  ) {
    this.storage = storage;
    this.now = now;
    this.random = random;
    if (watch) watchKey(STORAGE_KEY, () => this.onOtherTab());
  }

  /** Another tab saved the gnome: take its version (latest write wins) and tell the player. Games keep the gnome
   *  they started with, so nothing changes under a running round; the new one shows after a reload. */
  private onOtherTab(): void {
    const fresh = this.readStored();
    if (!fresh) return;
    if (this.cache && JSON.stringify(fresh) === JSON.stringify(this.cache)) return;
    this.cache = fresh;
    showSyncNotice('Your gnome was changed in another tab. Reload this tab to see it.');
  }

  async getMe(): Promise<Gnome> {
    if (!this.cache) {
      this.cache = this.readStored();
      if (!this.cache) {
        this.cache = this.createGnome();
        // Storage may be blocked; the cache still keeps this instance's gnome stable.
        this.tryWrite(this.cache);
      }
    }
    return copy(this.cache);
  }

  async updateGnome(patch: { displayName?: string; look?: Look }): Promise<Gnome> {
    // Merge into what is stored NOW, not into this tab's cache, which may be stale: a name saved in one tab and an
    // outfit saved in another both survive. The same field saved in two tabs cannot be merged (an outfit is one
    // unit), so the latest save wins.
    await this.getMe();
    const next = copy(this.readStored() ?? this.cache!);
    if (patch.displayName !== undefined) {
      const check = checkName(patch.displayName);
      if (!check.ok) throw new GnomeStoreError('INVALID_ARGUMENT', check.reason);
      next.displayName = check.name;
    }
    if (patch.look !== undefined) {
      if (!isValidLook(patch.look)) throw new GnomeStoreError('INVALID_ARGUMENT', 'Invalid look.');
      next.look = snapLook(patch.look);
    }
    if (!this.storage) throw unavailable();
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw unavailable();
    }
    this.cache = next;
    return copy(next);
  }

  async batchGetGnomes(userIds: string[]): Promise<Gnome[]> {
    const me = await this.getMe();
    return userIds.includes(me.userId) ? [me] : [];
  }

  private readStored(): Gnome | null {
    if (!this.storage) return null;
    let raw: string | null;
    try {
      raw = this.storage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
    if (raw === null) return null;
    try {
      return parseGnome(JSON.parse(raw));
    } catch {
      return null; // corrupt JSON: make a new gnome
    }
  }

  private createGnome(): Gnome {
    let userId = 'local-';
    for (let i = 0; i < 12; i++) userId += ID_CHARS[Math.min(ID_CHARS.length - 1, Math.floor(this.random() * ID_CHARS.length))];
    const number = 1000 + Math.min(8999, Math.floor(this.random() * 9000));
    return { userId, displayName: `Gnome${number}`, createdAt: this.now().toISOString() };
  }

  private tryWrite(g: Gnome): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(g));
    } catch {
      // ignored: the gnome lives in the cache for this session
    }
  }
}

function unavailable(): GnomeStoreError {
  return new GnomeStoreError('UNAVAILABLE', 'Browser storage is not available, so the gnome could not be saved.');
}

/**
 * The store every game and the creator use. Signed in (accounts set up and a Keycloak session stored on this
 * origin): the platform service (connectStore.ts). Otherwise the local gnome. Only '@lawn/platform/session' is
 * imported statically; the OIDC and Connect code loads on first use inside ConnectGnomeStore.
 */
export function createGnomeStore(): GnomeStore {
  // Signed-out saves are watched across tabs; the account path has its own sync.
  return accountsEnabled() && hasStoredSession() ? new ConnectGnomeStore() : new LocalGnomeStore(undefined, undefined, undefined, true);
}
