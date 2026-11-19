/// <reference types="node" />
// The level documents are the source of Club Gnome's maps: each one is valid, round-trips to the MapDef the game uses,
// and the set of maps and portal destinations agree with config.ts.
import { describe, expect, it } from 'vitest';
import { validateLevelDoc } from '@lawn/level';
import { MAP_IDS, type MapId } from './config';
import { MAPS } from './maps';
import { MAP_DOCS, mapToDoc } from './levelDocs';

describe.each(MAP_IDS)('level document %s', (id: MapId) => {
  it('passes validateLevelDoc', () => {
    expect(validateLevelDoc(MAP_DOCS[id])).toEqual([]);
  });

  it('is the map the game uses (mapToDoc(MAPS) equals the document)', () => {
    expect(mapToDoc(MAPS[id])).toEqual(MAP_DOCS[id]);
  });
});

describe('maps and documents', () => {
  it('has a map for every map id', () => {
    expect(Object.keys(MAPS).sort()).toEqual([...MAP_IDS].sort());
    expect(Object.keys(MAP_DOCS).sort()).toEqual([...MAP_IDS].sort());
  });

  it('only sends portals to maps that exist', () => {
    for (const id of MAP_IDS) {
      for (const p of MAPS[id].portals) {
        expect(MAP_IDS.includes(p.to), `portal ${id}/${p.id} -> ${p.to}`).toBe(true);
      }
    }
  });
});

describe('saving a map unchanged', () => {
  it('writes back exactly the bytes of its file (a load then a save must not reorder or reformat anything)', async () => {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const dir = join(dirname(fileURLToPath(import.meta.url)), 'data/levels');
    for (const id of MAP_IDS) {
      const file = readFileSync(join(dir, `${id}.level.json`), 'utf8');
      expect(JSON.stringify(mapToDoc(structuredClone(MAPS[id])), null, 2) + '\n', id).toBe(file);
    }
  });
});
