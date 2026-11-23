// attachLoadout lifecycle: the shell, the wheels, ride height, camber, lights, damage rebuilds, dispose. Run: npx vitest run packages/glaze/src/attach.test.ts
import * as THREE from 'three';
import { setPrefabDamage } from '@lawn/prefabs';
import { describe, expect, it } from 'vitest';
import { RIDE_TRAVEL, attachLoadout, buildGlazeBody } from './attach';

/** The ride-on mower's biggest wheel has radius 0.275, so a full slam drops the body 0.2 of that. */
const DOWN = 0.2 * 0.275;
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
    expect(shellsIn(body)[0].position.y).toBeCloseTo(-DOWN, 5);
    expect(rig.seatLift).toBeCloseTo(-DOWN * SCALE, 5);
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

  it('setSuspension moves the shell up with heave and moves the seat with it', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    rig.setSuspension({ heave: 0.05, pitch: 0, roll: 0 });
    expect(shellsIn(body)[0].position.y).toBeCloseTo(0.05, 5);
    expect(rig.seatLift).toBeCloseTo(0.05 * SCALE, 5);
    rig.set({ ...stock, rideHeight: -1 });
    expect(shellsIn(body)[0].position.y).toBeCloseTo(-DOWN + 0.05, 5);
    expect(rig.seatLift).toBeCloseTo((-DOWN + 0.05) * SCALE, 5);
  });

  it('pitch and roll tilt the shell (not the seat) and zeros restore the stock pose', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    const shell = shellsIn(body)[0];
    const seatBefore = rig.seatLift;
    rig.setSuspension({ heave: 0, pitch: 0.08, roll: -0.05 });
    expect(shell.rotation.x).toBeCloseTo(-0.08, 5);
    expect(shell.rotation.z).toBeCloseTo(-0.05, 5);
    expect(rig.seatLift).toBe(seatBefore);
    rig.setSuspension({ heave: 0, pitch: 0, roll: 0 });
    expect(shell.rotation.x).toBeCloseTo(0, 5);
    expect(shell.rotation.z).toBeCloseTo(0, 5);
    expect(shell.position.y).toBe(0);
    expect(rig.seatLift).toBe(0);
  });

  it('apply() keeps the stored suspension on the rebuilt shell', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    rig.setSuspension({ heave: 0.03, pitch: -0.04, roll: 0.02 });
    rig.set({ ...stock, rideHeight: 0.5 });
    const shell = shellsIn(body)[0];
    expect(shell.position.y).toBeCloseTo(RIDE_TRAVEL.up * 0.5 + 0.03, 5);
    expect(shell.rotation.x).toBeCloseTo(0.04, 5);
    expect(shell.rotation.z).toBeCloseTo(0.02, 5);
    setPrefabDamage(body, 1);
    rig.apply();
    expect(shellsIn(body)[0].rotation.z).toBeCloseTo(0.02, 5);
    expect(shellsIn(body)).toHaveLength(1);
  });

  it('wheel pivots never move under suspension', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    const pos = (w: THREE.Object3D) => [w.position.x, w.position.y, w.position.z];
    const before = wheelsIn(body).map(pos);
    rig.setSuspension({ heave: 0.1, pitch: 0.1, roll: -0.1 });
    wheelsIn(body).forEach((w, i) => {
      expect(pos(w)).toEqual(before[i]);
      expect(w.rotation.x).toBeCloseTo(0, 5);
    });
  });
});
