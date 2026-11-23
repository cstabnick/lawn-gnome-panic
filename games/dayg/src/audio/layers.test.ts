import { describe, expect, it } from 'vitest';
import { layerPlan, type LayerInput } from './layers';

const base: LayerInput = { level: 0, fight: false, inHaven: false, night: false, hush: false, sacred: false, wet: false, thin: false };

describe('layer plan', () => {
  it('plays the day colour and the pad in the open', () => {
    const p = layerPlan(base);
    expect(p.pad).toBe(1);
    expect(p.day).toBe(1);
    expect(p.night).toBe(0);
    expect(p.pulse + p.ostinato + p.drums + p.stabs).toBe(0);
  });

  it('swaps to the night colour at night', () => {
    const p = layerPlan({ ...base, night: true });
    expect(p.day).toBe(0);
    expect(p.night).toBe(1);
  });

  it('raises the threat tiers with the level', () => {
    expect(layerPlan({ ...base, level: 1 }).pulse).toBe(1);
    expect(layerPlan({ ...base, level: 2 }).ostinato).toBe(1);
    const danger = layerPlan({ ...base, level: 3 });
    expect(danger.drums).toBe(1);
    expect(danger.stabs).toBe(0);
    expect(layerPlan({ ...base, level: 3, fight: true }).stabs).toBe(1);
  });

  it('caps a HUSH zone at Tense: no drums even at Danger', () => {
    const p = layerPlan({ ...base, level: 3, hush: true });
    expect(p.ostinato).toBe(1);
    expect(p.drums).toBe(0);
  });

  it('takes the drums out of a SACRED zone', () => {
    expect(layerPlan({ ...base, level: 3, sacred: true }).drums).toBe(0);
    expect(layerPlan({ ...base, level: 3, sacred: true }).stabs).toBe(0);
  });

  it('brings the drip into wet zones and thins the pad in high ones', () => {
    expect(layerPlan({ ...base, wet: true }).drip).toBe(1);
    expect(layerPlan(base).drip).toBe(0);
    expect(layerPlan({ ...base, thin: true }).pad).toBeCloseTo(0.8, 5);
  });

  it('is quiet with the threat tiers inside the haven, and plays the haven melody', () => {
    const p = layerPlan({ ...base, inHaven: true, level: 3, fight: true, wet: true });
    expect(p.pulse + p.ostinato + p.drums + p.stabs + p.drip).toBe(0);
    expect(p.haven).toBe(1);
    expect(p.pad).toBeCloseTo(0.6, 5);
  });
});
