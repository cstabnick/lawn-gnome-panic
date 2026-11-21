import { describe, expect, it } from 'vitest';
import { validateLevelDoc } from '@lawn/level';
import { DOCS, derivedStamps, docToLevel, heightAt, levelToDoc } from './gnomeokemonLevel';

const byId = <T extends { id: string }>(xs: readonly T[]): T[] => [...xs].sort((a, b) => a.id.localeCompare(b.id));

describe('Gnomokemon courses in the level editor', () => {
  for (const id of Object.keys(DOCS)) {
    it(`${id}: the course survives a round trip unchanged`, () => {
      const doc = DOCS[id];
      const back = levelToDoc(docToLevel(doc));
      expect(validateLevelDoc(back)).toEqual([]);
      expect(back.stamps).toEqual(doc.stamps);
      expect(back.props).toEqual(doc.props);
      expect(back.paths).toEqual(doc.paths);
      expect(back.data).toEqual(doc.data);
      expect(back.bounds).toEqual(doc.bounds);
      expect(byId(back.markers)).toEqual(byId(doc.markers));
    });
  }

  it('moving an island moves its ground, and the file keeps the new spot', () => {
    const level = docToLevel(DOCS.lawn);
    const isl = level.islands[0];
    const stamps = (): ReturnType<typeof derivedStamps> => [...level.stamps, ...derivedStamps(level)];
    expect(heightAt(stamps(), isl.x, isl.z)).toBeCloseTo(isl.h, 3);
    isl.x += 6;
    expect(heightAt(stamps(), isl.x, isl.z)).toBeCloseTo(isl.h, 3);
    expect(levelToDoc(level).markers.find((m) => m.id === isl.id)?.x).toBe(isl.x);
  });

  it('the editor sees every course by its id and name', () => {
    expect(Object.keys(DOCS).sort()).toEqual(['city', 'depths', 'desert', 'frost', 'kiln', 'lawn', 'night', 'ocean']);
  });
});
