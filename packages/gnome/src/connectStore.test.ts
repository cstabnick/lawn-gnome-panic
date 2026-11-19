import { describe, expect, it, vi } from 'vitest';
import { ConnectGnomeStore, type PlatformApi } from './connectStore';
import { LocalGnomeStore, createGnomeStore, type StorageLike } from './store';
import { GnomeStoreError, type Look } from './types';

function fakeStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

const NOW = () => new Date('2026-01-02T03:04:05.000Z');
const RANDOM = () => 0.5;

const LOOK: Look = {
  hatRgb: 0xd93636,
  coatRgb: 0x2f64c9,
  pantsRgb: 0x6b4a2e,
  bootsRgb: 0x222222,
  skinRgb: 0xf1c27d,
  freckles: true,
  dress: false,
  glasses: false,
};

class FakeConnectError extends Error {
  code: number;
  rawMessage: string;
  constructor(code: number, rawMessage: string) {
    super(rawMessage);
    this.code = code;
    this.rawMessage = rawMessage;
  }
}

// The server's gnome as the generated client returns it (protobuf JSON-ish, with a bigint Timestamp).
const SERVER_GNOME = {
  userId: 'u_abc',
  displayName: 'Ferdinand',
  handle: 'ferdinand',
  look: {
    hatRgb: 0xd93636,
    coatRgb: 0x2f64c9,
    pantsRgb: 0x6b4a2e,
    bootsRgb: 0x222222,
    skinRgb: 0xf1c27d,
    hairRgb: 0x8b4513,
    freckles: true,
    dress: false,
    glasses: true,
    equipment: { head: 'helmet', bogus: 'x' },
  },
  // 2026-01-02T03:04:05.500Z
  createdAt: { seconds: 1767323045n, nanos: 500_000_000 },
};

const UPLOADED_GNOME = { userId: 'u_new', displayName: 'Bob', handle: 'bob' };

function harness(opts: { token?: string | null; timeoutMs?: number } = {}) {
  const local = new LocalGnomeStore(fakeStorage(), NOW, RANDOM);
  const client = {
    getMe: vi.fn(async (_req: object): Promise<unknown> => ({ gnome: SERVER_GNOME, created: false })),
    updateGnome: vi.fn(async (_req: object): Promise<unknown> => ({ gnome: SERVER_GNOME })),
    batchGetGnomes: vi.fn(async (_req: object): Promise<unknown> => ({ gnomes: [SERVER_GNOME] })),
  };
  const token = opts.token === undefined ? 'tok' : opts.token;
  const api = {
    getAccessToken: vi.fn(async () => token),
    userClient: () => client,
    ConnectError: FakeConnectError,
    Code: { InvalidArgument: 3 },
  };
  const store = new ConnectGnomeStore({
    local,
    timeoutMs: opts.timeoutMs ?? 1000,
    load: async () => api as unknown as PlatformApi,
  });
  return { store, local, client };
}

async function expectGnomeError(p: Promise<unknown>, code: string, message?: string) {
  const err = await p.then(
    () => {
      throw new Error('expected a rejection');
    },
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(GnomeStoreError);
  expect((err as GnomeStoreError).code).toBe(code);
  if (message !== undefined) expect((err as GnomeStoreError).message).toBe(message);
}

describe('ConnectGnomeStore', () => {
  it('getMe maps the proto gnome and mirrors the name into local', async () => {
    const { store, local } = harness();
    const g = await store.getMe();
    expect(g.userId).toBe('u_abc');
    expect(g.displayName).toBe('Ferdinand');
    expect(g.createdAt).toBe('2026-01-02T03:04:05.500Z');
    expect(g.look).toEqual({
      hatRgb: 0xd93636,
      coatRgb: 0x2f64c9,
      pantsRgb: 0x6b4a2e,
      bootsRgb: 0x222222,
      skinRgb: 0xf1c27d,
      hairRgb: 0x8b4513,
      freckles: true,
      dress: false,
      glasses: true,
      equipment: { head: 'helmet' },
    });
    expect(g.look).not.toHaveProperty('beardRgb');
    expect((await local.getMe()).displayName).toBe('Ferdinand');
  });

  it('created=true uploads the local name and look, and returns the uploaded gnome', async () => {
    const { store, local, client } = harness();
    client.getMe.mockResolvedValueOnce({ gnome: UPLOADED_GNOME, created: true });
    await local.updateGnome({ displayName: 'Bob', look: LOOK });
    client.updateGnome.mockResolvedValueOnce({ gnome: UPLOADED_GNOME });
    const g = await store.getMe();
    expect(client.updateGnome).toHaveBeenCalledWith({
      gnome: { displayName: 'Bob', look: expect.objectContaining({ coatRgb: expect.any(Number), freckles: true }) },
      updateMask: { paths: ['display_name', 'look'] },
    });
    expect(g.userId).toBe('u_new');
    expect(g.displayName).toBe('Bob');
  });

  it('created=true without a local look uploads only the name', async () => {
    const { store, client } = harness();
    client.getMe.mockResolvedValueOnce({ gnome: { ...UPLOADED_GNOME }, created: true });
    await store.getMe();
    expect(client.updateGnome).toHaveBeenCalledWith({
      gnome: { displayName: expect.any(String), look: undefined },
      updateMask: { paths: ['display_name'] },
    });
  });

  it('signed out (token null) returns the local gnome and never calls the server', async () => {
    const { store, local, client } = harness({ token: null });
    expect(await store.getMe()).toEqual(await local.getMe());
    expect(client.getMe).not.toHaveBeenCalled();
  });

  it('getMe rejecting returns the local gnome', async () => {
    const { store, local, client } = harness();
    client.getMe.mockRejectedValueOnce(new Error('down'));
    expect(await store.getMe()).toEqual(await local.getMe());
  });

  it('a getMe that never resolves returns the local gnome after timeoutMs', async () => {
    const { store, local, client } = harness({ timeoutMs: 20 });
    client.getMe.mockImplementationOnce(() => new Promise<unknown>(() => {}));
    expect(await store.getMe()).toEqual(await local.getMe());
  });

  it('updateGnome with a bad name throws INVALID_ARGUMENT without calling the server', async () => {
    const { store, client } = harness();
    await expectGnomeError(store.updateGnome({ displayName: 'x' }), 'INVALID_ARGUMENT');
    expect(client.updateGnome).not.toHaveBeenCalled();
  });

  it('updateGnome with no signed-in token throws UNAVAILABLE', async () => {
    const { store, client } = harness({ token: null });
    await expectGnomeError(store.updateGnome({ displayName: 'Alice' }), 'UNAVAILABLE');
    expect(client.updateGnome).not.toHaveBeenCalled();
  });

  it('server InvalidArgument becomes INVALID_ARGUMENT with the server text', async () => {
    const { store, client } = harness();
    client.updateGnome.mockRejectedValueOnce(new FakeConnectError(3, 'Name is taken.'));
    await expectGnomeError(store.updateGnome({ displayName: 'Alice' }), 'INVALID_ARGUMENT', 'Name is taken.');
  });

  it('any other server error becomes UNAVAILABLE', async () => {
    const { store, client } = harness();
    client.updateGnome.mockRejectedValueOnce(new Error('boom'));
    await expectGnomeError(store.updateGnome({ displayName: 'Alice' }), 'UNAVAILABLE');
  });

  it('updateGnome success sends the name with its mask, mirrors local and returns the gnome', async () => {
    const { store, local, client } = harness();
    client.updateGnome.mockResolvedValueOnce({ gnome: { ...SERVER_GNOME, displayName: 'Alice' } });
    const g = await store.updateGnome({ displayName: 'Alice' });
    expect(client.updateGnome).toHaveBeenCalledWith({
      gnome: { displayName: 'Alice' },
      updateMask: { paths: ['display_name'] },
    });
    expect(g.displayName).toBe('Alice');
    expect((await local.getMe()).displayName).toBe('Alice');
  });

  it('batchGetGnomes asks only for u_ ids', async () => {
    const { store, client } = harness();
    const gnomes = await store.batchGetGnomes(['local-abc', 'u_abc']);
    expect(client.batchGetGnomes).toHaveBeenCalledWith({ userIds: ['u_abc'] });
    expect(gnomes.map((g) => g.userId)).toEqual(['u_abc']);
  });

  it('batchGetGnomes with only local ids returns [] without calling the server', async () => {
    const { store, client } = harness();
    expect(await store.batchGetGnomes(['local-abc'])).toEqual([]);
    expect(client.batchGetGnomes).not.toHaveBeenCalled();
  });

  it('batchGetGnomes returns [] on error', async () => {
    const { store, client } = harness();
    client.batchGetGnomes.mockRejectedValueOnce(new Error('down'));
    expect(await store.batchGetGnomes(['u_abc'])).toEqual([]);
  });
});

describe('createGnomeStore', () => {
  it('returns a LocalGnomeStore in the test environment (no location, no stored session)', () => {
    expect(createGnomeStore()).toBeInstanceOf(LocalGnomeStore);
  });
});
