import { describe, expect, it } from 'vitest';
import { validateLevelDoc } from '@lawn/level';
import { DOCS, derivedStamps, docToLevel, groundStamps, heightAt, levelToDoc } from './gnomeokemonLevel';

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

    it(`${id}: the rail is read as nodes with their heights`, () => {
      const doc = DOCS[id];
      const level = docToLevel(doc);
      const rail = doc.paths.find((p) => p.id === 'rail')!;
      expect(level.rail.map((n) => [n.x, n.z])).toEqual(rail.points);
      expect(level.rail.map((n) => n.lift)).toEqual(doc.data.railLift);
    });
  }

  it('moving an island moves its ground, and the file keeps the new spot', () => {
    const level = docToLevel(DOCS.lawn);
    const isl = level.islands[0];
    const stamps = (): ReturnType<typeof derivedStamps> => groundStamps(level);
    expect(heightAt(stamps(), isl.x, isl.z)).toBeCloseTo(isl.h, 3);
    isl.x += 6;
    expect(heightAt(stamps(), isl.x, isl.z)).toBeCloseTo(isl.h, 3);
    expect(levelToDoc(level).markers.find((m) => m.id === isl.id)?.x).toBe(isl.x);
  });

  it('moving a rail node moves the graded track and the file keeps the path', () => {
    const level = docToLevel(DOCS.desert);
    const node = level.rail[3];
    const before = levelToDoc(level).stamps.filter((s) => s.op === 'flatten' && s.to === 0 && s.inner === 2.6);
    node.x += 2;
    const after = levelToDoc(level);
    const grade = after.stamps.filter((s) => s.op === 'flatten' && s.to === 0 && s.inner === 2.6);
    // The grade is rebuilt from the path: a node that moved gives new grade stamps near its new spot.
    expect(grade.some((s) => s.op === 'flatten' && Math.abs(s.x - node.x) < 0.01 && Math.abs(s.z - node.z) < 0.01)).toBe(true);
    expect(before).not.toEqual(grade);
    expect(after.paths.find((p) => p.id === 'rail')!.points[3]).toEqual([node.x, node.z]);
    expect(after.data.railLift).toEqual(level.rail.map((n) => n.lift));
  });

  it('adding a rail node keeps the file valid and gives the path one more point', () => {
    const level = docToLevel(DOCS.kiln);
    level.rail.splice(2, 0, { x: 0, z: 0, lift: 0.2 });
    const doc = levelToDoc(level);
    expect(validateLevelDoc(doc)).toEqual([]);
    expect(doc.paths.find((p) => p.id === 'rail')!.points.length).toBe(DOCS.kiln.paths.find((p) => p.id === 'rail')!.points.length + 1);
    expect(doc.data.railLift.length).toBe(doc.paths.find((p) => p.id === 'rail')!.points.length);
  });

  it('the editor sees every course by its id and name', () => {
    expect(Object.keys(DOCS).sort()).toEqual(['city', 'depths', 'desert', 'frost', 'kiln', 'lawn', 'night', 'ocean']);
  });
});
