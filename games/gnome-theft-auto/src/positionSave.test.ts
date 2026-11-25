import { describe, expect, it } from 'vitest';
import {
  decodePosition, encodePosition, POSITION_KEY, readPosition, validatePosition, writePosition, type SavedPosition,
} from './positionSave';

const world = {
  half: 1800,
  isWater: (x: number, z: number) => x > 500 && x < 600 && z > 0 && z < 100,
  interiorExists: (id: string) => id === 'bodega',
};

function memStore(): { getItem(k: string): string | null; setItem(k: string, v: string): void; map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => { map.set(k, v); },
  };
}

describe('positionSave', () => {
  it('round-trips encode and decode', () => {
    const raw = encodePosition({ x: 12.5, z: -40, yaw: 1.2 }, 1000);
    expect(JSON.parse(raw)).toEqual({ v: 1, x: 12.5, z: -40, yaw: 1.2, t: 1000 });
    expect(decodePosition(raw)).toEqual({ v: 1, x: 12.5, z: -40, yaw: 1.2, t: 1000 });
  });

  it('keeps the interior id through a round trip', () => {
    const raw = encodePosition({ x: 1, z: 2, yaw: 0, interior: 'bodega' }, 5);
    expect(decodePosition(raw)?.interior).toBe('bodega');
  });

  it('returns null for missing, bad JSON, wrong version or non-finite values', () => {
    expect(decodePosition(null)).toBeNull();
    expect(decodePosition('{not json')).toBeNull();
    expect(decodePosition('[]')).toBeNull();
    expect(decodePosition(JSON.stringify({ v: 2, x: 1, z: 1, yaw: 0, t: 1 }))).toBeNull();
    expect(decodePosition(JSON.stringify({ v: 1, x: 'a', z: 1, yaw: 0, t: 1 }))).toBeNull();
    expect(decodePosition(JSON.stringify({ v: 1, x: 1, z: null, yaw: 0, t: 1 }))).toBeNull();
    expect(decodePosition(JSON.stringify({ v: 1, x: 1, z: 1, yaw: 1e999, t: 1 }))).toBeNull();
  });

  it('rejects positions off the map (the edge margin is 5 m)', () => {
    const p = (x: number, z: number): SavedPosition => ({ v: 1, x, z, yaw: 0, t: 0 });
    expect(validatePosition(p(1796, 0), world)).toBeNull();
    expect(validatePosition(p(1795, 0), world)).not.toBeNull();
    expect(validatePosition(p(0, -1800), world)).toBeNull();
    expect(validatePosition(p(1790, -1790), world)).not.toBeNull();
    expect(validatePosition(null, world)).toBeNull();
  });

  it('rejects a spot under water', () => {
    expect(validatePosition({ v: 1, x: 550, z: 50, yaw: 0, t: 0 }, world)).toBeNull();
  });

  it('drops a missing interior but keeps an on-map spot', () => {
    const out = validatePosition({ v: 1, x: 10, z: 20, yaw: 0.5, interior: 'gone', t: 3 }, world);
    expect(out).toEqual({ v: 1, x: 10, z: 20, yaw: 0.5, t: 3 });
    expect(out && 'interior' in out).toBe(false);
  });

  it('keeps a good interior', () => {
    const out = validatePosition({ v: 1, x: 10, z: 20, yaw: 0, interior: 'bodega', t: 3 }, world);
    expect(out?.interior).toBe('bodega');
  });

  it('writes to storage and reads it back', () => {
    const store = memStore();
    writePosition({ x: 3, z: 4, yaw: 1, interior: 'bodega' }, store);
    expect(store.map.has(POSITION_KEY)).toBe(true);
    const back = readPosition(store);
    expect(back && [back.x, back.z, back.yaw, back.interior]).toEqual([3, 4, 1, 'bodega']);
  });

  it('never throws when storage fails', () => {
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } };
    expect(readPosition(broken)).toBeNull();
    expect(() => writePosition({ x: 0, z: 0, yaw: 0 }, broken)).not.toThrow();
  });
});
