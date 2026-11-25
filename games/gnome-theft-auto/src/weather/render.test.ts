import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createWeatherView } from './render';

const cam = new THREE.PerspectiveCamera();

describe('weather view', () => {
  it('draws rain and hides', () => {
    const scene = new THREE.Scene();
    const v = createWeatherView(scene);
    v.update(0.016, cam, { kind: 'rain', intensity: 1 }, { night: 0, tier: 'high', visible: true });
    expect(v.root.parent).toBe(scene);
    const rain = v.root.children.find((c) => c instanceof THREE.LineSegments) as THREE.LineSegments;
    expect(rain.geometry.drawRange.count).toBe(3200);
    v.update(0.016, cam, { kind: 'rain', intensity: 1 }, { night: 0, tier: 'high', visible: false });
    expect(v.root.parent).toBeNull();
    v.dispose();
  });

  it('draws snow on medium', () => {
    const scene = new THREE.Scene();
    const v = createWeatherView(scene);
    v.update(0.016, cam, { kind: 'snow', intensity: 0.5 }, { night: 0, tier: 'medium', visible: true });
    const snow = v.root.children.find((c) => c instanceof THREE.Points) as THREE.Points;
    expect(snow.geometry.drawRange.count).toBe(220);
    v.dispose();
  });

  it('clear with no clouds leaves the scene', () => {
    const scene = new THREE.Scene();
    const v = createWeatherView(scene);
    v.update(0.016, cam, { kind: 'clear', intensity: 0 }, { night: 0, tier: 'low', visible: true });
    expect(v.root.parent).toBeNull();
    v.dispose();
  });
});
