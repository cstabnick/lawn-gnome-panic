import { describe, expect, it } from 'vitest';
import { allPrefabs, getPrefab } from '@lawn/prefabs';
import { searchPrefabs, type PrefabLite } from './prefabSearch';

const sample: PrefabLite[] = [
  { id: 'barrel', name: 'Barrel', category: 'container', tags: ['wood', 'storage'], emoji: ['🛢'] },
  { id: 'bar-stool', name: 'Bar stool', category: 'furniture', tags: ['seat', 'pub'], emoji: [] },
  { id: 'broadleaf-tree', name: 'Broadleaf tree', category: 'prop', tags: ['garden', 'wood'], emoji: ['🌳'] },
  { id: 'lamp', name: 'Street lamp', category: 'prop', tags: ['light'], emoji: ['💡'] },
  { id: 'hq-tent', name: 'HQ tent', category: 'prop', tags: ['camp'], emoji: ['⛺'] },
];

describe('searchPrefabs', () => {
  it('ranks an exact id first, then a prefix, then a substring', () => {
    expect(searchPrefabs(sample, 'barrel').map((p) => p.id)[0]).toBe('barrel');
    expect(searchPrefabs(sample, 'bar').map((p) => p.id).slice(0, 2)).toEqual(['barrel', 'bar-stool']); // equal prefix scores: the shorter id first
    expect(searchPrefabs(sample, 'tree').map((p) => p.id)).toEqual(['broadleaf-tree', 'lamp']); // the id match outranks "S-tree-t lamp"
  });

  it('matches names, tags and emoji', () => {
    expect(searchPrefabs(sample, 'street').map((p) => p.id)).toEqual(['lamp']);
    expect(searchPrefabs(sample, 'camp').map((p) => p.id)).toEqual(['hq-tent']);
    expect(searchPrefabs(sample, '💡').map((p) => p.id)).toEqual(['lamp']);
  });

  it('needs every word to match', () => {
    expect(searchPrefabs(sample, 'wood barrel').map((p) => p.id)).toEqual(['barrel']);
    expect(searchPrefabs(sample, 'wood lamp')).toEqual([]);
  });

  it('filters by category and lists a category alphabetically for an empty query', () => {
    expect(searchPrefabs(sample, '', 'prop').map((p) => p.id)).toEqual(['broadleaf-tree', 'hq-tent', 'lamp']);
    expect(searchPrefabs(sample, 'bar', 'container').map((p) => p.id)).toEqual(['barrel']);
  });

  it('lists level-friendly categories first for an empty query', () => {
    const ids = searchPrefabs(sample, '').map((p) => p.category);
    expect(ids.slice(0, 3)).toEqual(['prop', 'prop', 'prop']);
    expect(ids.indexOf('furniture')).toBeLessThan(ids.indexOf('container') + 1);
    expect(ids.indexOf('container')).toBeGreaterThan(ids.indexOf('prop'));
  });

  it('honours the limit and is case-insensitive', () => {
    expect(searchPrefabs(sample, '', 'all', 2)).toHaveLength(2);
    expect(searchPrefabs(sample, 'BARREL')[0].id).toBe('barrel');
  });

  it('finds the real prefabs the editor offers by default', () => {
    expect(getPrefab('barrel')).toBeDefined();
    const all = allPrefabs();
    expect(searchPrefabs(all, 'barrel')[0].id).toBe('barrel');
    expect(searchPrefabs(all, '', 'prop').length).toBeGreaterThan(10);
  });
});
