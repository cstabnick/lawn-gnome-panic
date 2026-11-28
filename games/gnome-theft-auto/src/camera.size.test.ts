import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { SIZE_VIEW, sizedView, vehicleFrame } from './camera';

describe('sizedView (drive)', () => {
  it('keeps today\'s ride-on view', () => {
    const v = sizedView('drive', { radius: 1.4, height: 1.7 });
    expect(Math.abs(v.dist - 8.5)).toBeLessThan(0.1);
    expect(Math.abs(v.lookHeight - 1.8)).toBeLessThan(0.1);
    expect(v.pitch).toBeCloseTo(0.2, 5);
  });

  it('gives the Combine a further, higher, steeper view', () => {
    const v = sizedView('drive', { radius: 3.2, height: 5.3 });
    expect(v.dist).toBeGreaterThan(8.5);
    expect(v.lookHeight).toBeGreaterThan(1.8);
    expect(v.pitch).toBeGreaterThan(0.2);
    expect(v.pitch).toBeLessThanOrEqual(SIZE_VIEW.pitchMax);
  });

  it('gives the Boot Float a larger dist and look, pitch capped at pitchMax', () => {
    const v = sizedView('drive', { radius: 3.8, height: 7.1 });
    expect(v.dist).toBeGreaterThan(8.5);
    expect(v.lookHeight).toBeGreaterThan(1.8);
    expect(v.pitch).toBeCloseTo(SIZE_VIEW.pitchMax, 5);
  });

  it('keeps a skateboard at the minimum look height and a usable distance', () => {
    const v = sizedView('drive', { radius: 0.45, height: 0.6 });
    expect(v.lookHeight).toBeCloseTo(1.8, 5);
    expect(v.dist).toBeGreaterThanOrEqual(6.5);
  });
});

describe('sizedView (fly)', () => {
  it('never goes closer or lower than the fly view', () => {
    const v = sizedView('fly', { radius: 0.5, height: 0.5 });
    expect(v.dist).toBeGreaterThanOrEqual(16);
    expect(v.lookHeight).toBeGreaterThanOrEqual(1.5);
  });
});

describe('vehicleFrame', () => {
  it('measures a 2 m tall body and ignores a transparent mesh 10 m up', () => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial());
    body.position.set(0, 1, 0);
    group.add(body);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ transparent: true }));
    glow.position.set(0, 10, 0);
    group.add(glow);
    group.position.set(5, 0, 5);
    const f = vehicleFrame(group, 1.2);
    expect(f.radius).toBe(1.2);
    expect(f.height).toBeCloseTo(2, 3);
  });

  it('returns the cached value on a second call', () => {
    const group = new THREE.Group();
    const tall = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 1), new THREE.MeshBasicMaterial());
    tall.position.y = 1.5;
    group.add(tall);
    const first = vehicleFrame(group, 1);
    const second = vehicleFrame(group, 1);
    expect(second).toBe(first);
    expect(first.height).toBeCloseTo(3, 3);
  });
});
