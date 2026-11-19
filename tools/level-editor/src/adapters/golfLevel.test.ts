/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLevelDoc } from '@lawn/level';
import { describe, expect, it } from 'vitest';
import { HOLES } from '@golf/config';
import { gradientAt, heightAt as gameHeightAt, lieAt as gameLieAt } from '@golf/course';
import { COURSE_DOC } from '@golf/levelDoc';
import { courseOf, docToLevel, levelToDoc, levelToHoles, nearestHole } from './golfLevel';

const FILE = join(dirname(fileURLToPath(import.meta.url)), '../../../../games/gnome-golf/src/data/levels/island.level.json');

describe('Gnome Golf level model', () => {
  it('every fairway path starts at its tee and ends at its green (the conversion relies on it)', () => {
    for (const h of HOLES) {
      expect(h.path[0]).toEqual(h.tee);
      expect(h.path.at(-1)).toEqual({ x: h.green.x, z: h.green.z });
    }
  });

  it('saves exactly the bytes of the file it loaded', () => {
    expect(JSON.stringify(levelToDoc(docToLevel()), null, 2) + '\n').toBe(readFileSync(FILE, 'utf8'));
  });

  it('produces a valid level document and the same holes the game has', () => {
    expect(validateLevelDoc(levelToDoc(docToLevel()))).toEqual([]);
    expect(levelToHoles(docToLevel())).toEqual(COURSE_DOC.data.holes);
    expect(levelToHoles(docToLevel())).toEqual(HOLES);
  });

  it('the editor\'s ground, lies and gradients are the game\'s', () => {
    const c = courseOf(docToLevel());
    for (let x = -700; x <= 700; x += 70) for (let z = -540; z <= 540; z += 60) {
      expect(c.heightAt(x, z)).toBe(gameHeightAt(x, z));
      expect(c.lieAt(x, z)).toBe(gameLieAt(x, z));
    }
    for (const h of HOLES) expect(c.gradientAt(h.green.x + 2, h.green.z)).toEqual(gradientAt(h.green.x + 2, h.green.z));
  });

  it('moving a green moves the end of its fairway, and a new corner bends the path', () => {
    const l = docToLevel();
    l.greens[0].x += 10;
    expect(levelToHoles(l)[0].path.at(-1)!.x).toBe(HOLES[0].path.at(-1)!.x + 10);
    expect(levelToHoles(l)[0].green.x).toBe(HOLES[0].green.x + 10);
    const before = levelToHoles(l)[1].path.length;
    l.corners.push({ n: 2, x: 150, z: -20 });
    expect(levelToHoles(l)[1].path.length).toBe(before + 1);
    expect(levelToHoles(l)[1].path[1]).toEqual({ x: 150, z: -20 });
  });

  it('assigns a new bunker to the hole whose fairway is nearest', () => {
    const l = docToLevel();
    expect(nearestHole(l, 130, -10)).toBe(2); // beside hole 2's fairway
    const h9 = HOLES[8];
    expect(nearestHole(l, h9.green.x + 3, h9.green.z)).toBe(9);
  });

  it('is a copy: editing it does not change the game\'s course', () => {
    const l = docToLevel();
    l.bunkers.push({ n: 1, x: 0, z: 0, r: 5 });
    expect(HOLES[0].bunkers.length).toBe(levelToHoles(docToLevel())[0].bunkers.length);
  });
});
