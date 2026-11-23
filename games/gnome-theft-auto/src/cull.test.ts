import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { classBySize, cullDecision, cullStats, registerCull, setCullScale, updateCull, unregisterCull, CULL_DIST } from './cull';
import { GOVERNOR, initialTier, stepTier, type GovernorState } from './quality';

function box(x: number, z: number, size = 1): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshBasicMaterial());
  m.position.set(x, 0, z);
  m.castShadow = true;
  m.updateMatrixWorld(true);
  return m;
}

describe('cull', () => {
  it('classes by size', () => {
    expect(classBySize(0.3, 0.5)).toBe('tiny');
    expect(classBySize(1, 1)).toBe('detail');
    expect(classBySize(3, 2)).toBe('prop');
    expect(classBySize(3, 9)).toBe('tree');
    expect(classBySize(8, 6)).toBe('building');
    expect(classBySize(8, 40)).toBe('landmark');
  });

  it('decides by distance and quality scale', () => {
    expect(cullDecision('prop', 10)).toMatchObject({ show: true, cast: true });
    expect(cullDecision('prop', CULL_DIST.prop.shadow + 1)).toMatchObject({ show: true, cast: false });
    expect(cullDecision('prop', CULL_DIST.prop.draw + 1)).toMatchObject({ show: false, cast: false });
    expect(cullDecision('prop', CULL_DIST.prop.draw * 0.7, 0.6)).toMatchObject({ show: false, cast: false });
    expect(cullDecision('tiny', 1).cast).toBe(false);
    expect(cullDecision('landmark', 5000).show).toBe(true);
    expect(cullDecision('gnome', 10).near).toBe(true);
    expect(cullDecision('gnome', 100)).toEqual({ show: true, cast: false, near: false });
  });

  it('drops the small parts of a moving object at range and brings them back near', () => {
    setCullScale(1, 1);
    const g = new THREE.Group();
    const body = box(0, 0, 1);
    const eye = box(0.3, 0, 0.05);
    g.add(body, eye);
    g.position.set(100, 0, 0);
    g.updateMatrixWorld(true);
    registerCull(g, 'gnome', { moves: true });
    updateCull(0, 0);
    expect(body.layers.isEnabled(0)).toBe(true);
    expect(eye.layers.isEnabled(0)).toBe(false);
    g.position.set(5, 0, 0);
    g.updateMatrixWorld(true);
    for (let i = 0; i < 4; i++) updateCull(0, 0);
    expect(eye.layers.isEnabled(0)).toBe(true);
    unregisterCull(g);
  });

  it('takes far meshes off layer 0 and stops their shadows, without touching visible', () => {
    setCullScale(1, 1);
    const near = box(5, 0);
    const far = box(1000, 0);
    registerCull(near, 'prop');
    registerCull(far, 'prop');
    updateCull(0, 0);
    expect(near.layers.isEnabled(0)).toBe(true);
    expect(near.castShadow).toBe(true);
    expect(far.layers.isEnabled(0)).toBe(false);
    expect(far.castShadow).toBe(false);
    expect(far.visible).toBe(true);
    expect(cullStats().registered).toBeGreaterThanOrEqual(2);
    unregisterCull(far);
    expect(far.layers.isEnabled(0)).toBe(true);
    expect(far.castShadow).toBe(true);
    unregisterCull(near);
  });
});

describe('quality governor', () => {
  const s0: GovernorState = { tier: 'high', ceiling: 'high', emaMs: 0, slowS: 0, fastS: 0, sinceStepS: 100 };

  it('reads ?quality', () => {
    expect(initialTier('?quality=low', false)).toEqual({ tier: 'low', adaptive: false });
    expect(initialTier('', true)).toEqual({ tier: 'medium', adaptive: true });
    expect(initialTier('', false)).toEqual({ tier: 'high', adaptive: true });
  });

  it('drops a tier after sustained slow frames, and climbs back no higher than the start', () => {
    let s = s0;
    for (let i = 0; i < 200 && s.tier === 'high'; i++) s = stepTier(s, 40);
    expect(s.tier).toBe('medium');
    for (let i = 0; i < 3000 && s.tier === 'medium'; i++) s = stepTier(s, 8);
    expect(s.tier).toBe('high');
    for (let i = 0; i < 5000; i++) s = stepTier(s, 8);
    expect(s.tier).toBe('high');
  });

  it('ignores a single hitch and 60 Hz frames', () => {
    let s = stepTier(s0, 16.7);
    s = stepTier(s, 2000);
    for (let i = 0; i < 2000; i++) s = stepTier(s, 16.7);
    expect(s.tier).toBe('high');
    expect(GOVERNOR.fastMs).toBeLessThan(16.7);
  });
});
