import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { angleToView, bearingTo, createScope } from './scope';
import type { ScopeFrame } from './types';

function fakeCamera(): THREE.PerspectiveCamera {
  return { fov: 62, position: new THREE.Vector3(), lookAt() {}, updateProjectionMatrix() {} } as unknown as THREE.PerspectiveCamera;
}

function frame(canView: boolean, dt = 0.1): ScopeFrame {
  return { dt, canView, lookYaw: 0, lookPitch: 0, camYaw: 0, camPitch: 0, zooms: [2, 4] };
}

describe('angleToView', () => {
  it('is 0 for a point straight ahead', () => {
    expect(angleToView(0, 0, 0, 0, 0, 0, 0, 10)).toBeCloseTo(0, 6);
  });

  it('is about PI/2 for a point to the side', () => {
    expect(angleToView(0, 0, 0, 0, 0, 10, 0, 0)).toBeCloseTo(Math.PI / 2, 6);
  });

  it('is 0 when the point is at the eye', () => {
    expect(angleToView(0.3, 0.1, 1, 2, 3, 1, 2, 3)).toBe(0);
  });
});

describe('bearingTo', () => {
  it('is positive for a point on the right at yaw 0', () => {
    // Right at yaw 0 is (-1, 0): a point at x < 0 is to the right.
    expect(bearingTo(0, 0, 0, -10, 0)).toBeGreaterThan(0);
    expect(bearingTo(0, 0, 0, 10, 0)).toBeLessThan(0);
  });

  it('is positive for a point on the right at yaw PI/2', () => {
    // Right at yaw PI/2 is (0, 1): a point at +z is to the right.
    expect(bearingTo(Math.PI / 2, 0, 0, 0, 10)).toBeGreaterThan(0);
  });

  it('is 0 straight ahead', () => {
    expect(bearingTo(0, 0, 0, 0, 10)).toBeCloseTo(0, 6);
  });
});

describe('scope tap and hold', () => {
  it('a short press latches the scope up', () => {
    const s = createScope(fakeCamera());
    s.setHeld(true);
    s.update(frame(true, 0.1));
    expect(s.viewing()).toBe(true);
    s.setHeld(false);
    s.update(frame(true, 0.016));
    expect(s.viewing()).toBe(true);
    s.dispose();
  });

  it('a second press lowers a latched scope', () => {
    const s = createScope(fakeCamera());
    s.setHeld(true);
    s.update(frame(true, 0.1));
    s.setHeld(false);
    s.update(frame(true, 0.016));
    s.setHeld(true);
    s.update(frame(true, 0.05));
    expect(s.viewing()).toBe(false);
    s.setHeld(false);
    s.update(frame(true, 0.016));
    expect(s.viewing()).toBe(false);
    s.dispose();
  });

  it('a long press views only while held', () => {
    const s = createScope(fakeCamera());
    s.setHeld(true);
    s.update(frame(true, 0.3));
    expect(s.viewing()).toBe(true);
    s.setHeld(false);
    s.update(frame(true, 0.016));
    expect(s.viewing()).toBe(false);
    s.dispose();
  });

  it('canView false lowers the scope', () => {
    const s = createScope(fakeCamera());
    s.setHeld(true);
    s.update(frame(true, 0.1));
    expect(s.viewing()).toBe(true);
    s.update(frame(false, 0.016));
    expect(s.viewing()).toBe(false);
    s.dispose();
  });
});
