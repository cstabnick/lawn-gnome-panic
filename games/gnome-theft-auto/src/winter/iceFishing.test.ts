import * as THREE from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { fishWaterAt, iceHoleNear, setIceHoleSource } from '../fishing/waterKind';
import { createIceFishing, type IceFishingDeps } from './iceFishing';
import { ICE } from './types';

// Ice for x < 0, snow otherwise. Test points sit far off the map (dry), so waterAt is null there.
const X = -5000;
const Z = -5000;

function makeDeps() {
  const toasts: string[] = [];
  const sounds: string[] = [];
  let holesDone = 0;
  const deps: IceFishingDeps = {
    scene: new THREE.Scene(),
    surfaceAt: (x) => (x < 0 ? 'ice' : 'snow'),
    heightAt: () => 3,
    toast: (t) => toasts.push(t),
    play: (id) => sounds.push(id),
    onHole: () => { holesDone++; },
  };
  return { deps, toasts, sounds, holesDone: () => holesDone };
}

afterEach(() => setIceHoleSource(null));

describe('iceFishing', () => {
  it('prompt is on ice and null on snow', () => {
    const { deps } = makeDeps();
    const f = createIceFishing(deps);
    expect(f.prompt(X, Z)).toBe('Drill a hole in the ice');
    expect(f.prompt(10, 0)).toBeNull();
  });

  it('drilling for ICE.drillS makes one hole at (x, z + 0.8), registered with fishing', () => {
    const { deps, holesDone } = makeDeps();
    const f = createIceFishing(deps);
    expect(f.interact(X, Z)).toBe(true);
    for (let i = 0; i < 17; i++) f.update(0.1, X, Z, true);
    expect(f.holes().length).toBe(1);
    const hole = f.holes()[0];
    expect(hole.x).toBeCloseTo(X);
    expect(hole.z).toBeCloseTo(Z + 0.8);
    expect(hole.y).toBeCloseTo(2.96);
    expect(holesDone()).toBe(1);
    expect(f.drilling()).toBe(-1);
    expect(iceHoleNear(hole.x, hole.z, 0)).not.toBeNull();
    expect(fishWaterAt(hole.x, hole.z)).toBe('ice');
  });

  it('moving 2 m during the drill cancels it', () => {
    const { deps, toasts, holesDone } = makeDeps();
    const f = createIceFishing(deps);
    f.interact(X, Z);
    for (let i = 0; i < 17; i++) f.update(0.1, X + 2, Z, true);
    expect(f.holes().length).toBe(0);
    expect(f.drilling()).toBe(-1);
    expect(holesDone()).toBe(0);
    expect(toasts).toContain('You stopped drilling.');
  });

  it('leaving the ground cancels it', () => {
    const { deps } = makeDeps();
    const f = createIceFishing(deps);
    f.interact(X, Z);
    for (let i = 0; i < 17; i++) f.update(0.1, X, Z, false);
    expect(f.holes().length).toBe(0);
    expect(f.drilling()).toBe(-1);
  });

  it('a fifth hole removes the first', () => {
    const { deps } = makeDeps();
    const f = createIceFishing(deps);
    for (let i = 0; i < 5; i++) expect(f.drillNow(X - i * 10, Z)).toBe(true);
    expect(f.holes().length).toBe(ICE.maxHoles);
    expect(f.holes()[0].x).toBeCloseTo(X - 10);
  });

  it('prompt is null within ICE.reach of an existing hole', () => {
    const { deps } = makeDeps();
    const f = createIceFishing(deps);
    f.drillNow(X, Z);
    expect(f.prompt(X, Z)).toBeNull();
    expect(f.prompt(X + ICE.reach - 0.5, Z)).toBeNull();
    expect(f.prompt(X - 100, Z)).toBe('Drill a hole in the ice');
  });
});
