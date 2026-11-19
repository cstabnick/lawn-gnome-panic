import { afterEach, describe, expect, it, vi } from 'vitest';
import { mergePhotos, thumbnailPhotos } from './cloud';
import type { PhotoRecord } from './types';

function photo(speciesId: string, total: number, extra: Partial<PhotoRecord> = {}): PhotoRecord {
  return {
    id: `${speciesId}-${total}`,
    speciesId,
    dex: '001',
    name: speciesId,
    element: 'bloom',
    capturedAt: 1000,
    dataUrl: 'data:image/png;base64,short',
    score: { size: 0, framing: 0, pose: 0, special: 0, total, specialLabels: [], grade: 'Bronze' },
    snapshot: { dogT: 0, cameraPos: [0, 0, 0], cameraQuat: [0, 0, 0, 1], fov: 50, creatures: [] },
    ...extra,
  } as PhotoRecord;
}

function map(...photos: PhotoRecord[]): string {
  return JSON.stringify(Object.fromEntries(photos.map((p) => [p.speciesId, p])));
}

function stubStorage(clearedAt?: string): void {
  const data = new Map<string, string>();
  if (clearedAt !== undefined) data.set('gnomeokemon.clearedAt', clearedAt);
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mergePhotos', () => {
  it('unions species from both sides', () => {
    stubStorage();
    const out = JSON.parse(mergePhotos(map(photo('a', 10)), map(photo('b', 20))));
    expect(Object.keys(out).sort()).toEqual(['a', 'b']);
  });

  it('keeps the higher score per species', () => {
    stubStorage();
    const local = map(photo('a', 10, { id: 'local' }));
    const remote = map(photo('a', 30, { id: 'remote' }));
    expect(JSON.parse(mergePhotos(local, remote)).a.id).toBe('remote');
    expect(JSON.parse(mergePhotos(remote, local)).a.id).toBe('remote');
  });

  it('keeps the local photo on a tie', () => {
    stubStorage();
    const local = map(photo('a', 10, { id: 'local' }));
    const remote = map(photo('a', 10, { id: 'remote' }));
    expect(JSON.parse(mergePhotos(local, remote)).a.id).toBe('local');
  });

  it('treats garbage as an empty map', () => {
    stubStorage();
    expect(JSON.parse(mergePhotos('not json', map(photo('a', 5))))).toEqual(JSON.parse(map(photo('a', 5))));
    expect(JSON.parse(mergePhotos(null, 'garbage'))).toEqual({});
    expect(JSON.parse(mergePhotos('[1,2]', '42'))).toEqual({});
  });

  it('drops remote photos captured at or before the cleared time', () => {
    stubStorage('2000');
    const remote = map(photo('old', 50, { capturedAt: 1500 }), photo('new', 5, { capturedAt: 2500 }));
    const out = JSON.parse(mergePhotos(null, remote));
    expect(Object.keys(out)).toEqual(['new']);
  });

  it('treats a missing cleared time as 0', () => {
    stubStorage();
    const out = JSON.parse(mergePhotos(null, map(photo('a', 5, { capturedAt: 1 }))));
    expect(Object.keys(out)).toEqual(['a']);
  });

  it('sorts keys and is idempotent', () => {
    stubStorage();
    const merged = mergePhotos(map(photo('b', 1)), map(photo('a', 2)));
    expect(Object.keys(JSON.parse(merged))).toEqual(['a', 'b']);
    expect(mergePhotos(merged, merged)).toBe(merged);
  });
});

describe('thumbnailPhotos', () => {
  it('replaces long data URLs with the shrink result and keeps short ones', async () => {
    const long = 'data:image/png;base64,' + 'A'.repeat(40000);
    const local = map(photo('short', 1), photo('long', 2, { dataUrl: long }));
    const shrink = vi.fn(async (u: string) => `thumb:${u.length}`);
    const out = JSON.parse(await thumbnailPhotos(local, shrink));
    expect(shrink).toHaveBeenCalledTimes(1);
    expect(shrink).toHaveBeenCalledWith(long);
    expect(out.short.dataUrl).toBe('data:image/png;base64,short');
    expect(out.long.dataUrl).toBe(`thumb:${long.length}`);
    expect(out.long.id).toBe('long-2');
  });

  it('stores an empty string when shrinking fails', async () => {
    const long = 'x'.repeat(40000);
    const out = JSON.parse(await thumbnailPhotos(map(photo('a', 1, { dataUrl: long })), async () => ''));
    expect(out.a.dataUrl).toBe('');
  });

  it('returns an empty map for garbage input', async () => {
    expect(JSON.parse(await thumbnailPhotos('garbage', async (u) => u))).toEqual({});
  });
});
