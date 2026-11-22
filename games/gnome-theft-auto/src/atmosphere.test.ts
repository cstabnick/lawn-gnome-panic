import { describe, expect, it } from 'vitest';
import {
  CYCLE_SECONDS,
  INITIAL_PHASE,
  computeAtmosphereState,
  effectivePhase,
  timeLabelForPhase,
} from './atmosphere';
import { VIEW } from './config';

describe('atmosphere pure helpers', () => {
  it('uses a 360-second cycle starting at bright morning-noon', () => {
    expect(CYCLE_SECONDS).toBe(360);
    expect(INITIAL_PHASE).toBeCloseTo(0.22, 5);
    const start = computeAtmosphereState(INITIAL_PHASE, 'auto', 'city');
    expect(start.nightFactor).toBe(0);
    expect(start.label).toBe('Noon');
  });

  it('maps phases to expected time labels and nightFactor values', () => {
    expect(timeLabelForPhase(0.02)).toBe('Dawn');
    expect(timeLabelForPhase(0.16)).toBe('Morning');
    expect(timeLabelForPhase(0.25)).toBe('Noon');
    expect(timeLabelForPhase(0.5)).toBe('Golden Hour');
    expect(timeLabelForPhase(0.6)).toBe('Dusk');
    expect(timeLabelForPhase(0.75)).toBe('Neon Night');
    expect(timeLabelForPhase(0.95)).toBe('Dawn');

    const noon = computeAtmosphereState(0.25, 'auto', 'city');
    const golden = computeAtmosphereState(0.5, 'auto', 'city');
    const dusk = computeAtmosphereState(0.6, 'auto', 'city');
    const night = computeAtmosphereState(0.75, 'auto', 'city');

    expect(noon.nightFactor).toBe(0);
    expect(golden.nightFactor).toBeGreaterThan(0);
    expect(golden.nightFactor).toBeLessThan(dusk.nightFactor);
    expect(dusk.nightFactor).toBeLessThan(night.nightFactor);
    expect(night.nightFactor).toBe(1);
    expect(night.sunIntensity).toBeLessThan(noon.sunIntensity);
    expect(night.hemiIntensity).toBeLessThan(noon.hemiIntensity);
  });

  it('respects mode overrides regardless of auto phase', () => {
    expect(effectivePhase(0.75, 'noon')).toBe(0.25);
    expect(effectivePhase(0.25, 'golden')).toBe(0.5);
    expect(effectivePhase(0.25, 'night')).toBe(0.75);

    const forcedNoon = computeAtmosphereState(0.75, 'noon', 'city');
    expect(forcedNoon.label).toBe('Noon');
    expect(forcedNoon.nightFactor).toBe(0);

    const forcedGolden = computeAtmosphereState(0.25, 'golden', 'city');
    expect(forcedGolden.label).toBe('Golden Hour');

    const forcedNight = computeAtmosphereState(0.25, 'night', 'city');
    expect(forcedNight.label).toBe('Neon Night');
    expect(forcedNight.nightFactor).toBe(1);
  });

  it('blends fog range and atmospheric tint by biome', () => {
    const city = computeAtmosphereState(0.25, 'noon', 'city');
    const desert = computeAtmosphereState(0.25, 'noon', 'desert');
    const forest = computeAtmosphereState(0.25, 'noon', 'forest');
    const tundra = computeAtmosphereState(0.25, 'noon', 'tundra');
    const farmland = computeAtmosphereState(0.25, 'noon', 'farmland');

    expect(city.fogNear).toBeCloseTo(VIEW.fogNear, 3);
    expect(city.fogFar).toBeCloseTo(VIEW.fogFar, 3);

    // Desert and forest have tighter fog than city.
    expect(desert.fogFar).toBeLessThan(city.fogFar);
    expect(forest.fogFar).toBeLessThan(city.fogFar);
    expect(tundra.fogFar).toBeLessThan(city.fogFar);
    expect(farmland.fogFar).toBeLessThan(city.fogFar);

    // Each biome produces a distinct sky/fog tint at noon.
    const fogColors = new Set([city.fogHex, desert.fogHex, forest.fogHex, tundra.fogHex, farmland.fogHex]);
    expect(fogColors.size).toBe(5);
  });
});
