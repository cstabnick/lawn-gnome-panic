import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AIRFIELD, biomeAt } from './config';
import { surfaceAt } from './surfaces';
import { resetTerrainOptions, setTerrainOptions } from './terrain';

// The unpainted mapping: the landforms' paint (terrainPaint.ts, tested in landforms.test.ts) is off here.
beforeAll(() => setTerrainOptions({ landforms: false }));
afterAll(resetTerrainOptions);

const mockWorld = {
  biomeAt,
  airfield: { ...AIRFIELD, planeSpots: [...AIRFIELD.planeSpots] },
};

describe('surfaceAt', () => {
  it('returns asphalt on city grid roads', () => {
    expect(surfaceAt(0, 45, mockWorld).kind).toBe('asphalt');
    expect(surfaceAt(64, -120, mockWorld).kind).toBe('asphalt');
    expect(surfaceAt(0, 0, mockWorld)).toMatchObject({
      kind: 'asphalt',
      speedMult: 1,
      accelMult: 1,
      turnMult: 1,
      lateralGrip: 1,
      bumpAmp: 0,
      trailKind: 'none',
    });
  });

  it('returns asphalt on highways and the airfield runway', () => {
    // East highway segment [180, 0] -> [250, 0]
    expect(surfaceAt(230, 2, mockWorld).kind).toBe('asphalt');
    // North highway segment [0, -180] -> [0, -260]
    expect(surfaceAt(-2, -230, mockWorld).kind).toBe('asphalt');
    // Airfield runway at (480, -110)
    expect(surfaceAt(480, -110, mockWorld).kind).toBe('asphalt');
  });

  it('returns asphalt on Rootwell Field runway, not beside it', () => {
    // Rootwell Field runs north-south at x 1300, z 370..830 (config ROOTWELL_AIRFIELD).
    expect(surfaceAt(1300, 600, {}).kind).toBe('asphalt');
    expect(surfaceAt(1300, 780, {}).kind).toBe('asphalt');
    expect(surfaceAt(1340, 600, {}).kind).not.toBe('asphalt');
  });

  it('returns ice on the Frozen Birdbath Basin', () => {
    const s = surfaceAt(4, -346, mockWorld);
    expect(s.kind).toBe('ice');
    expect(s.lateralGrip).toBe(0.25);
    expect(s.speedMult).toBe(0.96);
    expect(s.trailKind).toBe('snow');
  });

  it('maps all 5 biomes off-road to their expected surfaces', () => {
    // City off-road -> grass
    expect(surfaceAt(30, 30, mockWorld).kind).toBe('grass');
    // Desert off-road -> sand
    expect(surfaceAt(350, 200, mockWorld).kind).toBe('sand');
    // Forest off-road -> mud
    expect(surfaceAt(-400, -150, mockWorld).kind).toBe('mud');
    // Tundra off-road -> snow
    expect(surfaceAt(-100, -300, mockWorld).kind).toBe('snow');
    // Farmland off-road -> farm
    expect(surfaceAt(100, 350, mockWorld).kind).toBe('farm');
  });

  it('gives heavy and all-terrain vehicles half the off-road speed penalty', () => {
    const baseMud = surfaceAt(-400, -150, mockWorld);
    expect(baseMud.speedMult).toBe(0.86);

    const expectedHeavySpeed = 1 - (1 - 0.86) * 0.5;
    expect(surfaceAt(-400, -150, mockWorld, 'combine').speedMult).toBeCloseTo(expectedHeavySpeed, 5);
    expect(surfaceAt(-400, -150, mockWorld, 'mulch-spreader').speedMult).toBeCloseTo(expectedHeavySpeed, 5);
    expect(surfaceAt(-400, -150, mockWorld, 'zero-turn').speedMult).toBeCloseTo(expectedHeavySpeed, 5);

    // Regular vehicles take the full off-road penalty
    expect(surfaceAt(-400, -150, mockWorld, 'ride-on').speedMult).toBe(0.86);

    // Asphalt stays 1.0 for heavy vehicles
    expect(surfaceAt(0, 0, mockWorld, 'combine').speedMult).toBe(1);
  });
});
