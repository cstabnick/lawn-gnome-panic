import { afterEach, describe, expect, it } from 'vitest';
import { v3 } from '@lawn/vehicle';
import { CITY_HALF, TERRAIN } from './config';
import {
  aboveGround, heightAt, naturalHeightAt, normalAt, resetTerrainOptions, setTerrainOptions, surfaceAt, terrainFlat,
  terrainProbe, waterAt, withGround,
} from './terrain';

const HILL = TERRAIN.testHill;

afterEach(() => resetTerrainOptions());

describe('terrain: flat (amplitude 0; the shipped amplitude is 1 since Epic 5)', () => {
  it('is exactly flat while the amplitude is 0', () => {
    // With the water off (Epic 4 carves the river into even the flat world; water.test.ts covers it).
    setTerrainOptions({ amplitude: 0, water: false });
    expect(terrainFlat()).toBe(true);
    for (const [x, z] of [[0, 0], [HILL.x, HILL.z], [-800, 700], [899, -899]]) {
      expect(Object.is(heightAt(x, z), 0)).toBe(true);
      expect(normalAt(x, z)).toEqual({ x: 0, y: 1, z: 0 });
    }
    const p = { x: HILL.x, z: HILL.z, id: 'rock' };
    expect(withGround(p)).toBe(p);
    expect(waterAt(0, 0)).toBeNull();
  });

  it('the probe is flatGround(0)', () => {
    setTerrainOptions({ amplitude: 0, water: false });
    const hit = terrainProbe().cast(v3(HILL.x, 3, HILL.z), v3(0, -1, 0), 10);
    expect(hit?.distance).toBeCloseTo(3, 9);
    expect(hit?.point.y).toBe(0);
  });
});

describe('terrain: the test hill', () => {
  it('rises in the Dust Flats and leaves Turfton at exactly 0', () => {
    setTerrainOptions({ amplitude: 1, testHill: true });
    expect(terrainFlat()).toBe(false);
    // On the hill's top (the east highway runs over it, so the road follows the natural height of its centre line).
    expect(heightAt(HILL.x, HILL.z)).toBeGreaterThan(HILL.amount * 0.9);
    expect(naturalHeightAt(HILL.x + HILL.sigma, HILL.z)).toBeCloseTo(HILL.amount * Math.exp(-1), 3);
    // Turfton is flat to its edge.
    for (const [x, z] of [[0, 0], [CITY_HALF, 0], [CITY_HALF + TERRAIN.cityMargin, 30]]) expect(heightAt(x, z)).toBe(0);
    expect(aboveGround(HILL.x, 10, HILL.z)).toBeCloseTo(10 - heightAt(HILL.x, HILL.z), 9);
    expect(withGround({ x: HILL.x, z: HILL.z, y: 0.5 }).y).toBeCloseTo(heightAt(HILL.x, HILL.z) + 0.5, 6);
  });

  it('is gentle and continuous (mowers can drive over it)', () => {
    setTerrainOptions({ amplitude: 1, testHill: true });
    let prev = heightAt(HILL.x - 120, HILL.z);
    for (let x = HILL.x - 120; x <= HILL.x + 120; x += 0.5) {
      const h = heightAt(x, HILL.z + 40);
      expect(Math.abs(h - prev)).toBeLessThan(0.5 * 0.3);
      prev = h;
      expect(normalAt(x, HILL.z + 40).y).toBeGreaterThan(Math.cos((20 * Math.PI) / 180));
    }
  });

  it('the road is flat across', () => {
    setTerrainOptions({ amplitude: 1, testHill: true });
    // The east highway runs along z = 30 from x 520 to 570.
    const mid = heightAt(HILL.x - 10, 30);
    expect(heightAt(HILL.x - 10, 33)).toBeCloseTo(mid, 1);
    expect(heightAt(HILL.x - 10, 27)).toBeCloseTo(mid, 1);
  });

  it('the probe hits the hill straight down and slanted', () => {
    setTerrainOptions({ amplitude: 1, testHill: true });
    const h = heightAt(HILL.x + 10, HILL.z + 20);
    const down = terrainProbe().cast(v3(HILL.x + 10, h + 2, HILL.z + 20), v3(0, -1, 0), 5);
    expect(down?.distance).toBeCloseTo(2, 5);
    expect(down!.normal.y).toBeLessThan(1);
    const d = Math.SQRT1_2;
    const slant = terrainProbe().cast(v3(HILL.x + 10, h + 2, HILL.z + 20), v3(d, -d, 0), 10);
    expect(slant).not.toBeNull();
    expect(Math.abs(aboveGround(slant!.point.x, slant!.point.y, slant!.point.z))).toBeLessThan(1e-3);
    expect(terrainProbe().cast(v3(HILL.x, 100, HILL.z), v3(0, -1, 0), 10)).toBeNull();
  });

  it('keeps the surfaces', () => {
    expect(surfaceAt(0, 45)).toBe('asphalt');
    expect(surfaceAt(600, 300)).toBe('sand');
  });
});
