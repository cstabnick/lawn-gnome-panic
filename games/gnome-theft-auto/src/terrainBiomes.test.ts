// The biome props sit on the ground: with the test hill on, colliders near it have tops above the ground under them, and
// the dew barrels are lifted onto it. Runs on its own (it changes the terrain options for this file only).
import { afterAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from './testing/fakeDom';
import { heightAt, resetTerrainOptions, setTerrainOptions } from './terrain';

installFakeDom();
setTerrainOptions({ amplitude: 1, testHill: true });
const { buildBiomes } = await import('./biomes');
const b = buildBiomes(new THREE.Scene());

afterAll(resetTerrainOptions);

const HILL = { x: 545, z: 30 };
const distToHill = (x: number, z: number): number => Math.hypot(x - HILL.x, z - HILL.z);

describe('biome props on the test hill', () => {
  it('colliders near the hill have their tops above the ground under their centre', () => {
    const centre = (box: { minX: number; maxX: number; minZ: number; maxZ: number }) =>
      ({ cx: (box.minX + box.maxX) / 2, cz: (box.minZ + box.maxZ) / 2 });
    let near = b.boxes.filter((box) => { const { cx, cz } = centre(box); return distToHill(cx, cz) <= 100; });
    if (near.length === 0) near = b.boxes.filter((box) => { const { cx, cz } = centre(box); return distToHill(cx, cz) <= 150; });
    expect(near.length).toBeGreaterThan(0);
    for (const box of near) {
      const { cx, cz } = centre(box);
      expect(box.h).toBeGreaterThan(heightAt(cx, cz));
    }
  });

  it('every dew barrel is lifted onto the ground under it', () => {
    for (const d of b.dewBarrels) {
      expect(d.y).toBeGreaterThanOrEqual(heightAt(d.x, d.z) + 0.5);
    }
  });
});
