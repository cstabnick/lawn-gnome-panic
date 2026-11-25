import { describe, expect, it } from 'vitest';
import { getMarkerHeight, getMarkerHeightPref, setMarkerHeightPref, trackBeam } from './questMarkerPrefs';
import { getOption } from './optionsRegistry';

describe('quest marker height', () => {
  it('defaults to low and scales the beam lengths', () => {
    expect(getMarkerHeightPref()).toBe('low');
    expect(getMarkerHeight(90)).toBeCloseTo(31.5);
    setMarkerHeightPref('tall');
    expect(getMarkerHeight(90)).toBe(90);
    setMarkerHeightPref('low');
  });

  it('re-sizes a tracked beam when the setting changes', () => {
    const beam = { scale: { y: 1 }, position: { y: 0 }, parent: {} };
    trackBeam(beam as never, 10, 40);
    expect(beam.scale.y).toBeCloseTo(0.35);
    expect(beam.position.y).toBeCloseTo(10 + 14 / 2);
    setMarkerHeightPref('tall');
    expect(beam.scale.y).toBe(1);
    expect(beam.position.y).toBe(10 + 20);
    setMarkerHeightPref('low');
  });

  it('registers the row under Map and markers', () => {
    const row = getOption('marker-height');
    expect(row?.kind).toBe('cycle');
    expect(row?.section).toBe('map');
  });
});
