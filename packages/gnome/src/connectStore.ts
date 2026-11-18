// The gnome store for a signed-in player: the platform service's UserService, behind the same
// GnomeStore interface as LocalGnomeStore. createGnomeStore() (store.ts) picks it when a Keycloak
// session is stored. The platform client (OIDC + Connect) is loaded with a dynamic import() on first
// use, so games that never sign in don't download it.
import type * as Platform from '@lawn/platform';
import { checkName } from '@lawn/mp/textFilter';
import { LocalGnomeStore } from './store';
import { GnomeStoreError, type EquipSlot, type Gnome, type GnomeEquipment, type GnomeStore, type Look } from './types';

/** What ConnectGnomeStore uses from @lawn/platform (tests pass a fake). */
export type PlatformApi = Pick<typeof Platform, 'getAccessToken' | 'userClient' | 'ConnectError' | 'Code'>;

export interface ConnectGnomeStoreOptions {
  /** Mirror of the account's gnome, and the fallback when the service can't be reached. */
  local?: LocalGnomeStore;
  /** getMe() falls back to the local gnome after this long (must stay under loadMyGnome's 1500 ms). Default 1200. */
  timeoutMs?: number;
  /** Loads the platform client. Default: () => import('@lawn/platform'). */
  load?: () => Promise<PlatformApi>;
}

type ProtoGnome = Platform.Gnome;
type ProtoLook = Platform.GnomeLook;
type ProtoTimestamp = NonNullable<ProtoGnome['createdAt']>;

const EQUIP_SLOTS: EquipSlot[] = ['head', 'back', 'neck', 'hand'];
const SIGN_IN_EXPIRED = 'Your sign-in expired. Sign in again on the Your Gnome page.';
const SERVER_UNREACHABLE = 'Could not reach the gnome server. Try again.';

function protoToLook(l: ProtoLook): Look {
  const look: Look = {
    hatRgb: l.hatRgb,
    coatRgb: l.coatRgb,
    pantsRgb: l.pantsRgb,
    bootsRgb: l.bootsRgb,
    skinRgb: l.skinRgb,
    freckles: l.freckles,
    dress: l.dress,
    glasses: l.glasses,
  };
  if (l.beardRgb !== undefined) look.beardRgb = l.beardRgb;
  if (l.hairRgb !== undefined) look.hairRgb = l.hairRgb;
  const equipment: GnomeEquipment = {};
  for (const slot of EQUIP_SLOTS) {
    const id = l.equipment[slot];
    if (id !== undefined) equipment[slot] = id;
  }
  if (Object.keys(equipment).length > 0) look.equipment = equipment;
  return look;
}

function lookToProto(look: Look) {
  const equipment: Record<string, string> = {};
  for (const [slot, id] of Object.entries(look.equipment ?? {})) {
    if (id !== undefined) equipment[slot] = id;
  }
  return {
    hatRgb: look.hatRgb,
    coatRgb: look.coatRgb,
    pantsRgb: look.pantsRgb,
    bootsRgb: look.bootsRgb,
    skinRgb: look.skinRgb,
    ...(look.beardRgb !== undefined ? { beardRgb: look.beardRgb } : {}),
    ...(look.hairRgb !== undefined ? { hairRgb: look.hairRgb } : {}),
    freckles: look.freckles,
    dress: look.dress,
    glasses: look.glasses,
    equipment,
  };
}

function timestampToIso(ts: ProtoTimestamp | undefined): string {
  if (!ts) return new Date().toISOString();
  return new Date(Number(ts.seconds) * 1000 + Math.floor(ts.nanos / 1e6)).toISOString();
}

function protoToGnome(g: ProtoGnome): Gnome {
  const gnome: Gnome = {
    userId: g.userId,
    displayName: g.displayName,
    createdAt: timestampToIso(g.createdAt),
  };
  if (g.look) gnome.look = protoToLook(g.look);
  return gnome;
}

export class ConnectGnomeStore implements GnomeStore {
  private readonly local: LocalGnomeStore;
  private readonly timeoutMs: number;
  private readonly load: () => Promise<PlatformApi>;
  /** True once getMe() found a brand-new account and uploaded this browser's local gnome to it (the /me/ page says so). */
  uploadedLocal = false;

  constructor(opts: ConnectGnomeStoreOptions = {}) {
    this.local = opts.local ?? new LocalGnomeStore();
    this.timeoutMs = opts.timeoutMs ?? 1200;
    this.load = opts.load ?? (() => import('@lawn/platform'));
  }

  async getMe(): Promise<Gnome> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), this.timeoutMs);
    });
    let remote: Gnome | null = null;
    try {
      remote = await Promise.race([this.remoteMe(), timeout]);
    } catch {
      remote = null;
    } finally {
      clearTimeout(timer);
    }
    return remote ?? this.local.getMe();
  }

  /** The platform's gnome (uploading the local one on first sign-in). null when signed out. Throws on errors. */
  private async remoteMe(): Promise<Gnome | null> {
    const api = await this.load();
    const token = await api.getAccessToken();
    if (token === null) return null;
    const client = api.userClient();
    const res = await client.getMe({});
    if (!res.gnome) throw new Error('GetMe returned no gnome.');
    let g = protoToGnome(res.gnome);
    if (res.created) {
      const mine = await this.local.getMe();
      try {
        const up = await client.updateGnome({
          gnome: { displayName: mine.displayName, look: mine.look ? lookToProto(mine.look) : undefined },
          updateMask: { paths: mine.look ? ['display_name', 'look'] : ['display_name'] },
        });
        if (up.gnome) g = protoToGnome(up.gnome);
        this.uploadedLocal = true;
      } catch {
        // keep the server's default gnome; the player can rename it or save a look on the /me/ page or in the creator
      }
    }
    await this.local.updateGnome({ displayName: g.displayName, ...(g.look ? { look: g.look } : {}) }).catch(() => {});
    return g;
  }

  async updateGnome(patch: { displayName?: string; look?: Look }): Promise<Gnome> {
    let displayName: string | undefined;
    if (patch.displayName !== undefined) {
      const check = checkName(patch.displayName);
      if (!check.ok) throw new GnomeStoreError('INVALID_ARGUMENT', check.reason);
      displayName = check.name;
    }
    const paths: string[] = [];
    if (displayName !== undefined) paths.push('display_name');
    if (patch.look !== undefined) paths.push('look');
    if (paths.length === 0) return this.getMe();

    const api = await this.load().catch(() => null);
    const token = api ? await api.getAccessToken().catch(() => null) : null;
    if (!api || token === null) throw new GnomeStoreError('UNAVAILABLE', SIGN_IN_EXPIRED);

    let out: Gnome;
    try {
      const res = await api.userClient().updateGnome({
        gnome: {
          ...(displayName !== undefined ? { displayName } : {}),
          ...(patch.look !== undefined ? { look: lookToProto(patch.look) } : {}),
        },
        updateMask: { paths },
      });
      if (!res.gnome) throw new Error('UpdateGnome returned no gnome.');
      out = protoToGnome(res.gnome);
    } catch (err) {
      if (err instanceof api.ConnectError && err.code === api.Code.InvalidArgument) {
        throw new GnomeStoreError('INVALID_ARGUMENT', err.rawMessage);
      }
      throw new GnomeStoreError('UNAVAILABLE', SERVER_UNREACHABLE);
    }
    await this.local.updateGnome({ displayName: out.displayName, ...(out.look ? { look: out.look } : {}) }).catch(() => {});
    return out;
  }

  async batchGetGnomes(userIds: string[]): Promise<Gnome[]> {
    const ids = userIds.filter((id) => id.startsWith('u_'));
    if (ids.length === 0) return [];
    try {
      const api = await this.load();
      const res = await api.userClient().batchGetGnomes({ userIds: ids });
      return res.gnomes.map((g) => protoToGnome(g));
    } catch {
      return [];
    }
  }
}
