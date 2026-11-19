/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { validateLevelDoc } from '@lawn/level';
import { describe, expect, it } from 'vitest';
import { heightAt as gameHeightAt } from '@front/terrain';
import { buildWorld, buildArenaObjects } from '@front/world';
import { ARENA_DOC } from '@front/levelDoc';
import { arenaOf, docToLevel, levelToDoc } from './frontLevel';

const FILE = join(dirname(fileURLToPath(import.meta.url)), '../../../../games/gnome-front/src/data/levels/arena.level.json');

describe('Gnome Front level model', () => {
  it('saves exactly the bytes of the file it loaded (a load then a save changes nothing)', () => {
    const text = JSON.stringify(levelToDoc(docToLevel()), null, 2) + '\n';
    expect(text).toBe(readFileSync(FILE, 'utf8'));
  });

  it('produces a valid level document', () => {
    expect(validateLevelDoc(levelToDoc(docToLevel()))).toEqual([]);
  });

  it('the editor\'s ground is the game\'s ground', () => {
    const a = arenaOf(docToLevel());
    for (let x = -150; x <= 150; x += 15) for (let z = -150; z <= 150; z += 15) expect(a.heightAt(x, z)).toBe(gameHeightAt(x, z));
  });

  it('the editor builds exactly the obstacles the game builds, in the same order', () => {
    const game = buildWorld(new THREE.Scene());
    const root = new THREE.Group();
    const editor = buildArenaObjects(root, arenaOf(docToLevel()));
    expect(editor).toEqual(game);
    expect(root.children.length).toBeGreaterThan(100);
  });

  it('moving a flag with its landmarks keeps every landmark where it was relative to the flag', () => {
    const l = docToLevel();
    const flag = l.flags.find((f) => f.id === 'D')!;
    const before = levelToDoc(l).data.landmarks.filter((x) => x.at === 'D');
    flag.x += 7;
    flag.z -= 3;
    for (const lm of l.landmarks) if (lm.at === 'D') { lm.x += 7; lm.z -= 3; }
    const after = levelToDoc(l).data.landmarks.filter((x) => x.at === 'D');
    expect(after).toEqual(before);
    // ...and the same landmarks left behind are offset by the move instead.
    const l2 = docToLevel();
    l2.flags.find((f) => f.id === 'D')!.x += 7;
    const left = levelToDoc(l2).data.landmarks.filter((x) => x.at === 'D');
    expect(left[0].dx).toBe(before[0].dx - 7);
  });

  it('a landmark carries its collision circles when it is moved', () => {
    const l = docToLevel();
    const shed = l.landmarks.find((x) => x.prefab === 'garden-shed')!;
    const before = levelToDoc(l).data.landmarks.find((x) => x.prefab === 'garden-shed')!;
    shed.x += 2;
    shed.z += 3;
    const after = levelToDoc(l).data.landmarks.find((x) => x.prefab === 'garden-shed')!;
    expect(after.dx).toBe(before.dx + 2);
    expect(after.obstacles.map((o) => [o.dx - 2, o.dz - 3])).toEqual(before.obstacles.map((o) => [o.dx, o.dz]));
  });

  it('is not tied to the module-level document', () => {
    const l = docToLevel();
    l.mounds.push({ x: 0, z: 0, r: 5, h: 5 });
    expect(ARENA_DOC.data.mounds.length).toBe(l.mounds.length - 1);
  });
});
