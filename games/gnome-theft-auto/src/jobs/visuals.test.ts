import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VEHICLES } from '../config';
import type { Vehicle } from './types';
import { createJobVisuals, lookFromSeed, MAX_WAITING } from './visuals';

describe('lookFromSeed', () => {
  it('gives the same look for the same seed and a different one for another seed', () => {
    expect(lookFromSeed(5)).toEqual(lookFromSeed(5));
    expect(lookFromSeed(5)).not.toEqual(lookFromSeed(6));
  });
});

describe('job visuals', () => {
  it('seats a passenger and clears the seat again', () => {
    const vis = createJobVisuals(new THREE.Scene());
    const v = { object: new THREE.Group(), spec: VEHICLES['golf-cart'] } as unknown as Vehicle;
    vis.setPassengers(v, [[1, 5]], 'calm');
    expect(v.object.children.length).toBe(1);
    vis.setPassengers(v, [], 'calm');
    expect(v.object.children.length).toBe(0);
  });

  it('keeps at most MAX_WAITING waiting gnomes visible', () => {
    const scene = new THREE.Scene();
    const vis = createJobVisuals(scene);
    for (let i = 0; i <= MAX_WAITING; i++) vis.showWaiting(`w${i}`, i, 0, 0, i + 1, 'wait-bus');
    expect(scene.children.filter((c) => c.visible).length).toBe(MAX_WAITING);
  });
});
