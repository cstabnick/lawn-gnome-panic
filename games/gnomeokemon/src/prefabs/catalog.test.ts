import * as THREE from 'three';
import { PALETTE, type ShapeKind } from '@lawn/prefabs';
import { describe, expect, it } from 'vitest';
import { GNOMEOKEMON_CATALOG, buildGnomeokemon, getGnomeokemon } from './registry';

const DIMS: Record<ShapeKind, [number, number]> = {
  box: [3, 3], cyl: [3, 3], cone: [2, 2], ball: [1, 1], ring: [2, 3], pill: [2, 2], wedge: [3, 3],
};

describe('gnomeokemon prefab catalog', () => {
  it('has unique kebab-case ids and unique dex numbers', () => {
    const ids = new Set<string>();
    const dex = new Set<string>();
    for (const entry of GNOMEOKEMON_CATALOG) {
      const p = entry.prefab;
      expect(p.id, p.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(ids.has(p.id), `duplicate id ${p.id}`).toBe(false);
      ids.add(p.id);
      expect(entry.dex).toMatch(/^\d{3}$/);
      expect(dex.has(entry.dex), `duplicate dex ${entry.dex}`).toBe(false);
      dex.add(entry.dex);
    }
  });

  for (const entry of GNOMEOKEMON_CATALOG) {
    const p = entry.prefab;
    describe(`#${entry.dex} ${p.id}`, () => {
      it('is well-formed prefab data', () => {
        expect(p.name.length).toBeGreaterThan(0);
        expect(p.about.length).toBeGreaterThan(0);
        expect(p.examine.length).toBeGreaterThanOrEqual(4);
        for (const line of p.examine) {
          expect(line.length).toBeLessThanOrEqual(160);
          expect(line.length).toBeGreaterThan(8);
        }
        expect(new Set(p.examine).size).toBe(p.examine.length);
        expect(p.parts.length).toBeGreaterThan(0);
        expect(p.parts.length).toBeLessThanOrEqual(40);
        for (const part of p.parts) {
          const [min, max] = DIMS[part.s];
          expect(part.d.length).toBeGreaterThanOrEqual(min);
          expect(part.d.length).toBeLessThanOrEqual(max);
          for (const n of [...part.d, ...(part.at ?? []), ...(part.rot ?? []), ...(part.scale ?? [])]) {
            expect(Number.isFinite(n)).toBe(true);
          }
          if (typeof part.c === 'string' && part.c !== 'tint' && part.c !== 'trim') {
            expect(part.c in PALETTE, `palette has '${part.c}'`).toBe(true);
          }
        }
        if (p.parts.some((part) => part.c === 'tint')) expect(p.tint).toBeDefined();
        if (p.parts.some((part) => part.c === 'trim')) expect(p.trim).toBeDefined();
      });

      it('builds into a grounded, gnome-sized Three.js group', () => {
        const g = buildGnomeokemon(entry);
        const box = new THREE.Box3().setFromObject(g);
        const size = box.getSize(new THREE.Vector3());
        expect(box.min.y, 'bottom near y=0').toBeGreaterThan(-0.03);
        expect(box.min.y, 'bottom near y=0').toBeLessThan(0.03);
        expect(Math.max(size.x, size.y, size.z)).toBeGreaterThan(0.15);
        expect(Math.max(size.x, size.y, size.z)).toBeLessThan(3);
        const c = box.getCenter(new THREE.Vector3());
        expect(Math.abs(c.x)).toBeLessThan(0.15 + size.x / 2);
        expect(Math.abs(c.z)).toBeLessThan(0.15 + size.z / 2);
      });

      it('can be looked up and tinted', () => {
        expect(getGnomeokemon(p.id)).toBe(entry);
        const tinted = buildGnomeokemon(p.id, { tint: 'sapphire', trim: 'gold' });
        expect(tinted.userData.prefab).toBe(p.id);
      });
    });
  }
});
