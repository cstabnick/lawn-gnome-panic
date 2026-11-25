import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  CYCLE_SECONDS,
  INITIAL_PHASE,
  applyWeatherLook,
  computeAtmosphereState,
  createAtmosphere,
  effectivePhase,
  forwardDelta,
  shortestDelta,
  targetPhase,
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

function makeAtmosphere() {
  const scene = new THREE.Scene();
  const sun = new THREE.DirectionalLight();
  const hemi = new THREE.HemisphereLight();
  return createAtmosphere(scene, sun, hemi);
}

describe('atmosphere time-lapse and weather look', () => {
  it('a time-lapse does not move world time', () => {
    const atmo = makeAtmosphere();
    atmo.setPhase(0.3);
    const lapse = atmo.timeLapseTo('night', 2);
    expect(lapse.seconds).toBe(2);
    for (let i = 0; i < 10; i++) atmo.render(0.25, 0, 0, 'city');
    expect(atmo.displayPhase()).toBeCloseTo(0.75, 6);
    expect(atmo.getPhase()).toBeCloseTo(0.3, 6);
    expect(atmo.getMode()).toBe('auto');
    expect(atmo.lapsing()).toBe(true);

    atmo.releaseLapse(1);
    for (let i = 0; i < 8; i++) atmo.render(0.25, 0, 0, 'city');
    expect(atmo.displayPhase()).toBeCloseTo(0.3, 6);
    expect(atmo.lapsing()).toBe(false);
    expect(atmo.getMode()).toBe('auto');
  });

  it('a time-lapse goes forward, so halfway the display phase is between the two', () => {
    const atmo = makeAtmosphere();
    atmo.setPhase(0.3);
    atmo.render(0, 0, 0, 'city');
    atmo.timeLapseTo('night', 2);
    for (let i = 0; i < 4; i++) atmo.render(0.25, 0, 0, 'city');
    expect(atmo.displayPhase()).toBeGreaterThan(0.3);
    expect(atmo.displayPhase()).toBeLessThan(0.75);
  });

  it('a lapse to the time already shown takes 0 seconds', () => {
    const atmo = makeAtmosphere();
    atmo.setMode('night');
    atmo.render(0.25, 0, 0, 'city');
    expect(atmo.timeLapseTo('night', 2).seconds).toBe(0);
  });

  it('a fixed time mode is restored after a lapse', () => {
    const atmo = makeAtmosphere();
    atmo.setMode('noon');
    atmo.render(0.25, 0, 0, 'city');
    atmo.timeLapseTo('golden', 2);
    for (let i = 0; i < 4; i++) atmo.render(0.25, 0, 0, 'city');
    atmo.releaseLapse(1);
    for (let i = 0; i < 4; i++) atmo.render(0.25, 0, 0, 'city');
    expect(atmo.getMode()).toBe('noon');
    expect(atmo.displayPhase()).toBeCloseTo(0.25, 6);
  });

  it('advanceWorldTime moves the world clock once the scrub ends', () => {
    const atmo = makeAtmosphere();
    atmo.advanceWorldTime('night', 1);
    for (let i = 0; i < 6; i++) atmo.render(0.25, 0, 0, 'city');
    expect(atmo.getPhase()).toBeCloseTo(0.75, 6);
    expect(atmo.lapsing()).toBe(false);
  });

  it('applyWeatherLook with no overcast or mist returns the state unchanged', () => {
    const s = computeAtmosphereState(0.25, 'auto', 'city');
    expect(applyWeatherLook(s, 0, 0)).toBe(s);
  });

  it('overcast lowers the sun and the fog far distance', () => {
    const s = computeAtmosphereState(0.25, 'auto', 'city');
    const o = applyWeatherLook(s, 1, 0);
    expect(o.sunIntensity).toBeLessThan(s.sunIntensity);
    expect(o.fogFar).toBeLessThan(s.fogFar);
  });

  it('mist pulls the fog in more than overcast does', () => {
    const s = computeAtmosphereState(0.25, 'auto', 'city');
    const o = applyWeatherLook(s, 1, 0);
    const m = applyWeatherLook(s, 0, 1);
    expect(m.fogNear).toBeLessThan(s.fogNear);
    expect(m.fogFar).toBeLessThan(s.fogFar);
    expect(m.fogNear).toBeLessThan(o.fogNear);
    expect(m.fogFar).toBeLessThan(o.fogFar);
  });

  it('phase deltas wrap the short or forward way', () => {
    expect(forwardDelta(0.9, 0.1)).toBeCloseTo(0.2, 9);
    expect(shortestDelta(0.1, 0.9)).toBeCloseTo(-0.2, 9);
    expect(targetPhase('golden')).toBe(0.5);
  });
});
