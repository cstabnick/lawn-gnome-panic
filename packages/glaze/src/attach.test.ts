// attachLoadout lifecycle: the shell, the wheels, ride height, camber, lights, damage rebuilds, dispose. Run: npx vitest run packages/glaze/src/attach.test.ts
import * as THREE from 'three';
import { setPrefabDamage } from '@lawn/prefabs';
import { describe, expect, it } from 'vitest';
import { RIDE_TRAVEL, attachLoadout, buildGlazeBody } from './attach';
import { defaultLoadout } from './loadout';

const PREFAB = 'ride-on-mower';
const SCALE = 1.5;
const stock = defaultLoadout(0xd8342c);

const shellsIn = (root: THREE.Object3D) => root.children.filter((c) => c.name === 'glaze-shell');
const groundsIn = (root: THREE.Object3D) => root.children.filter((c) => c.name === 'glaze-ground');
const wheelsIn = (root: THREE.Object3D) => root.children.filter((c) => /^wheel-\d$/.test(c.name));

function tintCount(root: THREE.Object3D): number {
  let n = 0;
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o.userData.tint === true) n++;
  });
  return n;
}

describe('attachLoadout', () => {
  it('wraps the body in one shell and keeps the four wheel pivots on the root', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    const shells = shellsIn(body);
    expect(shells).toHaveLength(1);
    const wheels = wheelsIn(body);
    expect(wheels).toHaveLength(4);
    for (const wheel of wheels) {
      expect(wheel.parent).toBe(body);
      expect(shells[0].children).not.toContain(wheel);
    }
    expect(rig.seatLift).toBe(0);
  });

  it('moves the shell by the ride height and reports the seat lift in parent space', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    rig.set({ ...stock, rideHeight: -1 });
    expect(shellsIn(body)[0].position.y).toBe(-RIDE_TRAVEL.down);
    expect(rig.seatLift).toBe(-RIDE_TRAVEL.down * SCALE);
    rig.set({ ...stock, rideHeight: 1 });
    expect(shellsIn(body)[0].position.y).toBe(RIDE_TRAVEL.up);
    expect(rig.seatLift).toBe(RIDE_TRAVEL.up * SCALE);
  });

  it('returns camber in radians per axle, and 0 for any other index', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, { ...stock, camberFront: -10, camberRear: 4 });
    expect(rig.camberOf(2)).toBe(-10 * Math.PI / 180);
    expect(rig.camberOf(3)).toBe(-10 * Math.PI / 180);
    expect(rig.camberOf(0)).toBe(4 * Math.PI / 180);
    expect(rig.camberOf(1)).toBe(4 * Math.PI / 180);
    expect(rig.camberOf(9)).toBe(0);
  });

  it('keeps one stable lights group through set and damage, and keeps its visibility', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    const lights = rig.lights;
    expect(lights.visible).toBe(false);
    rig.set({ ...stock, rideHeight: 0.5 });
    expect(rig.lights).toBe(lights);
    setPrefabDamage(body, 1);
    rig.apply();
    expect(rig.lights).toBe(lights);
    rig.setLightsOn(true);
    expect(lights.visible).toBe(true);
    rig.apply();
    expect(lights.visible).toBe(true);
  });

  it('applied twice leaves no duplicate shell or ground group', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    const tints = tintCount(body);
    rig.apply();
    rig.apply();
    expect(shellsIn(body)).toHaveLength(1);
    expect(groundsIn(body).length).toBeLessThanOrEqual(1);
    expect(tintCount(body)).toBe(tints);
  });

  it('after a damage rebuild the wheels are on the root again and the shell exists once', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    setPrefabDamage(body, 2);
    rig.apply();
    const wheels = wheelsIn(body);
    expect(wheels.length).toBeGreaterThan(0);
    for (const wheel of wheels) {
      expect(wheel.parent).toBe(body);
      expect(shellsIn(body)[0].children).not.toContain(wheel);
    }
    expect(shellsIn(body)).toHaveLength(1);
  });

  it('dispose leaves no shell and puts every original child back under the root', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const originals = [...body.children];
    const tints = tintCount(body);
    const rig = attachLoadout(body, PREFAB, { ...stock, rideHeight: -1 });
    rig.dispose();
    expect(shellsIn(body)).toHaveLength(0);
    expect(groundsIn(body)).toHaveLength(0);
    expect(rig.lights.parent).toBeNull();
    for (const child of originals) expect(child.parent).toBe(body);
    expect(tintCount(body)).toBe(tints);
  });

  it('keeps every tinted mesh through set, so nothing is lost in the unwrap', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const before = tintCount(body);
    const rig = attachLoadout(body, PREFAB, stock);
    expect(tintCount(body)).toBe(before);
    rig.set({ ...stock, rideHeight: 1, camberFront: -5 });
    expect(tintCount(body)).toBe(before);
  });
});
