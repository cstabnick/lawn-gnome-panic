import { describe, expect, it } from 'vitest';
import { heightAt, surfaceAt } from '../terrain';
import { SKATE_ORIGIN, SKATE_PIECES, SKATE_RAILS, SKATE_SITE } from './types';
import { parkBoxes, parkHeight, parkRails, pieceHeight, skateGround } from './park';

const piece = (id: string) => SKATE_PIECES.find((p) => p.id === id)!;
const ph = (id: string, u: number, v: number) => pieceHeight(piece(id), u, v);
const wx = (u: number) => SKATE_ORIGIN.x + u;
const wz = (v: number) => SKATE_ORIGIN.z + v;
const T = 2.449;

describe('pieceHeight', () => {
  it('Long Gutter', () => {
    expect(ph('long-gutter', 0, 12)).toBe(0);
    expect(ph('long-gutter', 0, 12 + 1.5 + T)).toBeCloseTo(2, 2);
    expect(ph('long-gutter', 0, 12 - 4.7)).toBeCloseTo(2, 5);
    expect(ph('long-gutter', 0, 12 + 4.7)).toBeCloseTo(2, 5);
    expect(ph('long-gutter', 0, 12 + 6)).toBeNull();
  });
  it('Gutter Bowl and its bank', () => {
    expect(ph('gutter-bowl', -10, -8)).toBe(0);
    expect(ph('gutter-bowl', -10 + 4.95, -8)).toBeCloseTo(2, 1);
    expect(ph('gutter-bowl', -10 + 6, -8)).toBeCloseTo(2, 5);
    expect(ph('gutter-bowl', -10 + 7, -8)).toBeNull();
    expect(ph('bowl-bank', 4.5 - 8.45 / 2, -8)).toBeCloseTo(1, 5);
  });
  it('street section', () => {
    expect(ph('kicker', 2, 0)).toBeCloseTo(0, 5);
    expect(ph('kicker', 3.9, 0)).toBeCloseTo(0.57, 2);
    expect(ph('kicker', 4.1, 0)).toBeNull();
    expect(ph('ledge', 9, -4)).toBe(0.45);
    expect(ph('stairs', 13.5 - 0.4, -13)).toBeCloseTo(0.6, 5);
    expect(ph('stairs', 13.5 - 1.2, -13)).toBeCloseTo(0.3, 5);
    expect(ph('stairs', 13.5 - 2.0, -13)).toBeCloseTo(0, 5);
  });
});

describe('parkHeight', () => {
  it('matches the pieces in world coordinates', () => {
    expect(parkHeight(wx(0), wz(12))).toBe(0);
    expect(parkHeight(wx(0), wz(16.7))).toBeCloseTo(2, 5);
    expect(parkHeight(wx(9), wz(-4))).toBe(0.45);
    expect(parkHeight(wx(3.9), wz(0))).toBeCloseTo(0.57, 2);
    expect(parkHeight(wx(13.1), wz(-13))).toBeCloseTo(0.6, 5);
    expect(parkHeight(500, 500)).toBe(0);
  });
});

describe('parkRails', () => {
  it('converts to world', () => {
    const rails = parkRails();
    expect(rails.length).toBe(SKATE_RAILS.length);
    const f = rails.find((r) => r.id === 'flat-rail')!;
    expect(f.ax).toBeCloseTo(-23);
    expect(f.bx).toBeCloseTo(-19);
    expect(f.az).toBe(90);
    expect(f.bz).toBe(90);
    expect(f.ay).toBeCloseTo(heightAt(-23, 90) + 0.47);
    expect(parkRails()).toBe(rails);
  });
});

describe('parkBoxes', () => {
  const boxes = parkBoxes();
  it('stays under the cap and below the surface', () => {
    expect(boxes.length).toBeLessThan(3000);
    for (let i = 0; i < 2000; i++) {
      const x = SKATE_SITE.minX + Math.random() * 40, z = SKATE_SITE.minZ + Math.random() * 40;
      for (const b of boxes) {
        if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) continue;
        expect(b.h).toBeLessThanOrEqual(heightAt(x, z) + parkHeight(x, z) + 1e-6);
      }
    }
  });
  it('has the ledge', () => {
    const want = heightAt(wx(9), wz(-4)) + 0.45;
    expect(boxes.some((b) => Math.abs(b.h - want) < 1e-9 && b.minX === wx(6.5))).toBe(true);
  });
});

describe('skateGround', () => {
  it('paves the site, not grass', () => {
    const g = skateGround();
    expect(g.paved(wx(0), wz(0))).toBe(true);
    let found: [number, number] | null = null;
    for (let r = 12; r < 200 && !found; r += 4) {
      for (let a = 0; a < 16 && !found; a++) {
        const x = SKATE_ORIGIN.x + Math.cos(a) * r, z = SKATE_ORIGIN.z + Math.sin(a) * r;
        const outside = x < SKATE_SITE.minX || x > SKATE_SITE.maxX || z < SKATE_SITE.minZ || z > SKATE_SITE.maxZ;
        if (outside && surfaceAt(x, z) === 'grass') found = [x, z];
      }
    }
    expect(found).not.toBeNull();
    expect(g.paved(found![0], found![1])).toBe(false);
    expect(g.height(wx(0), wz(16.7))).toBeCloseTo(heightAt(wx(0), wz(16.7)) + 2, 5);
  });
});
