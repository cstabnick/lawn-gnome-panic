import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { Vehicle } from '../../types';
import { createBinView } from './bins';
import { ARM, type BinRound, type LiftState } from './types';

function round(): BinRound {
  const stops = [0, 1, 2].map((id) => ({
    id,
    x: -240 + id * 22,
    z: -100,
    yaw: Math.PI / 2,
    street: 'Kerb Row',
    tint: 0x3f8f3a,
    heavy: id === 1,
    state: 'full' as const,
  }));
  return { stops, seed: 7, title: 'Bin round: Kerb Row' };
}

function lift(tilt: number): LiftState {
  return {
    phase: 'lift', t: 0, phaseT: 0, swing: 0, misses: 0, tilt,
    wasHeld: false, spilled: false, emptied: false, neat: 0, heavy: false,
  };
}

function fakeLorry(): Vehicle {
  const object = new THREE.Group();
  const arm = new THREE.Object3D();
  arm.name = 'arm';
  object.add(arm);
  return { object } as unknown as Vehicle;
}

describe('createBinView', () => {
  it('shows a round and clears it without throwing', () => {
    const scene = new THREE.Scene();
    const view = createBinView(scene);
    expect(() => view.show(round())).not.toThrow();
    expect(() => view.clear()).not.toThrow();
    expect(scene.children.length).toBe(0);
  });

  it('spills and sets down without throwing', () => {
    const scene = new THREE.Scene();
    const view = createBinView(scene);
    const r = round();
    view.show(r);
    expect(() => view.spill(r.stops[0])).not.toThrow();
    expect(() => view.setDown(r.stops[1], 0.4)).not.toThrow();
    expect(() => view.update(0.016)).not.toThrow();
    expect(() => view.clear()).not.toThrow();
  });

  it('poses the lorry arm from the tilt', () => {
    const scene = new THREE.Scene();
    const view = createBinView(scene);
    const r = round();
    view.show(r);
    const lorry = fakeLorry();
    const arm = lorry.object.getObjectByName('arm')!;
    view.pose(r.stops[0], lift(0.5), lorry);
    expect(arm.rotation.z).toBeCloseTo(ARM.max * 0.5);
    view.pose(null, null, lorry);
    view.update(0.1);
    expect(arm.rotation.z).toBeLessThan(ARM.max * 0.5);
    view.clear();
  });
});
