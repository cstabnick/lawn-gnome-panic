// Modes: the bookshelf's book modes are data-consistent, build into grounded models, and an unknown mode falls back to the default.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildPrefab } from './build';
import { getPrefab } from './registry';
import { modeDef, prefabModes } from './modes';

const shelf = getPrefab('bookshelf')!;
const bookParts = (mode: string) => shelf.modes![mode].length;

describe('bookshelf modes', () => {
  it('has bare, sparse, stocked and full, defaulting to full', () => {
    expect(prefabModes(shelf)).toEqual(['bare', 'sparse', 'stocked', 'full']);
    expect(shelf.defaultMode).toBe('full');
  });

  it('holds more books in each mode, from none to a full shelf', () => {
    expect(bookParts('bare')).toBe(0);
    expect(bookParts('sparse')).toBeGreaterThan(0);
    expect(bookParts('stocked')).toBeGreaterThan(bookParts('sparse'));
    expect(bookParts('full')).toBeGreaterThan(bookParts('stocked'));
  });

  it('appends the chosen mode to the base parts, and the default when no mode is given', () => {
    expect(modeDef(shelf, 'sparse').parts.length).toBe(shelf.parts.length + bookParts('sparse'));
    expect(modeDef(shelf).parts.length).toBe(shelf.parts.length + bookParts('full'));
    expect(modeDef(shelf, 'no-such-mode')).toBe(modeDef(shelf));
  });

  it('caches the derived def per mode', () => {
    expect(modeDef(shelf, 'stocked')).toBe(modeDef(shelf, 'stocked'));
  });

  it('builds every mode into a finite model standing on the ground', () => {
    for (const mode of prefabModes(shelf)) {
      const root = buildPrefab('bookshelf', { mode });
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      expect(Number.isFinite(box.min.y), mode).toBe(true);
      expect(Math.abs(box.min.y), mode).toBeLessThan(0.03);
    }
  });

  it('leaves prefabs without modes unchanged', () => {
    const plain = getPrefab('bed')!;
    expect(modeDef(plain, 'anything')).toBe(plain);
    expect(prefabModes(plain)).toEqual([]);
  });
});
