import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { attachCullPass, classBySize, cullDecision, cullPassActive, cullStats, endCullPass, registerCull, setCullScale, updateCull, unregisterCull, CULL_DIST } from './cull';
import { GOVERNOR, initialTier, QUALITY, shadowFrame, stepTier, TIERS, type GovernorState } from './quality';

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

  it('hides far objects only during the cull pass and stops their shadows; the game sees its own visible', () => {
    setCullScale(1, 1);
    const near = box(5, 0);
    const far = box(1000, 0);
    registerCull(near, 'prop');
    registerCull(far, 'prop');
    updateCull(0, 0);
    expect(cullPassActive()).toBe(true);
    expect(near.visible).toBe(true);
    expect(near.castShadow).toBe(true);
    expect(far.visible).toBe(false);
    expect(far.castShadow).toBe(false);
    endCullPass();
    expect(far.visible).toBe(true);
    // The game hides it while culled: it stays hidden after it comes back into range.
    far.visible = false;
    updateCull(0, 0);
    expect(far.visible).toBe(false);
    endCullPass();
    expect(far.visible).toBe(false);
    far.visible = true;
    expect(cullStats().registered).toBeGreaterThanOrEqual(2);
    unregisterCull(far);
    expect(far.visible).toBe(true);
    expect(Object.getOwnPropertyDescriptor(far, 'visible')?.writable).toBe(true);
    expect(far.castShadow).toBe(true);
    unregisterCull(near);
  });

  it('a culled root skips its matrix update during the pass and catches up when drawn again', () => {
    setCullScale(1, 1);
    const g = new THREE.Group();
    const child = box(0, 0);
    g.add(child);
    g.position.set(2000, 0, 0);
    g.updateMatrixWorld(true);
    registerCull(g, 'prop', { moves: true });
    updateCull(0, 0);
    // Moved while culled: the scene's matrix walk leaves it alone during the pass.
    g.position.set(2001, 0, 0);
    const scene = new THREE.Scene();
    scene.add(g);
    attachCullPass(scene);
    updateCull(0, 0);
    scene.updateMatrixWorld();
    expect(child.matrixWorld.elements[12]).toBe(2000);
    // The scene's render ends the pass (three calls onAfterRender at the end of renderer.render).
    scene.onAfterRender({} as THREE.WebGLRenderer, scene, new THREE.Camera(), null as unknown as THREE.BufferGeometry, null as unknown as THREE.Material, null as unknown as THREE.Group);
    expect(cullPassActive()).toBe(false);
    // Back in range: matrices are current again on the next walk.
    g.position.set(5, 0, 0);
    for (let i = 0; i < 4; i++) updateCull(0, 0);
    scene.updateMatrixWorld();
    expect(child.matrixWorld.elements[12]).toBe(5);
    endCullPass();
    unregisterCull(g);
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

  it('drops from low to min when low is still slow, and reads ?quality=min', () => {
    let s: GovernorState = { ...s0, tier: 'low', ceiling: 'medium' };
    for (let i = 0; i < 400 && s.tier === 'low'; i++) s = stepTier(s, 40);
    expect(s.tier).toBe('min');
    for (let i = 0; i < 400; i++) s = stepTier(s, 40);
    expect(s.tier).toBe('min');
    expect(initialTier('?quality=min', true)).toEqual({ tier: 'min', adaptive: false });
  });

  it('lower tiers re-render the shadow map less often, and never cost more than the tier above', () => {
    expect(QUALITY.high.shadowEvery).toBe(1);
    expect(QUALITY.medium.shadowEvery).toBe(1);
    for (let i = 1; i < TIERS.length; i++) {
      const lo = QUALITY[TIERS[i - 1]];
      const hi = QUALITY[TIERS[i]];
      expect(lo.shadowEvery).toBeGreaterThanOrEqual(hi.shadowEvery);
      expect(lo.maxPixelRatio).toBeLessThanOrEqual(hi.maxPixelRatio);
      expect(lo.view).toBeLessThanOrEqual(hi.view);
      expect(lo.shadowMap).toBeLessThanOrEqual(hi.shadowMap);
    }
    const frames = (every: number): number => Array.from({ length: 12 }, (_, f) => f).filter((f) => shadowFrame(f, every)).length;
    expect(frames(1)).toBe(12);
    expect(frames(2)).toBe(6);
    expect(frames(3)).toBe(4);
  });

  it('ignores a single hitch and 60 Hz frames', () => {
    let s = stepTier(s0, 16.7);
    s = stepTier(s, 2000);
    for (let i = 0; i < 2000; i++) s = stepTier(s, 16.7);
    expect(s.tier).toBe('high');
    expect(GOVERNOR.fastMs).toBeLessThan(16.7);
  });
});
