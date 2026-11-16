// The local gnome store: the player's gnome in localStorage, behind the GnomeStore interface (types.ts).
// createGnomeStore() is THE place that decides where gnomes live; the platform service replaces it later.
import { checkName } from '@lawn/mp/textFilter';
import { snapLook } from './look';
import { GnomeStoreError, type Gnome, type GnomeStore, type Look } from './types';

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

/** Checks a look from storage or from a caller. Optional fields must be absent (not null) when unused. */
function isValidLook(v: unknown): v is Look {
  if (typeof v !== 'object' || v === null) return false;
  const l = v as Record<string, unknown>;
  const colours = ['hatRgb', 'coatRgb', 'pantsRgb', 'bootsRgb', 'skinRgb'];
  if (!colours.every((k) => isColour(l[k]))) return false;
  if (l.beardRgb !== undefined && !isColour(l.beardRgb)) return false;
  if (l.hairRgb !== undefined && !isColour(l.hairRgb)) return false;
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
  ) {
    this.storage = storage;
    this.now = now;
    this.random = random;
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
    const next = copy(await this.getMe());
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

/** The store every game and the creator use. To move to the platform service, return its client here. */
export function createGnomeStore(): GnomeStore {
  return new LocalGnomeStore();
}
