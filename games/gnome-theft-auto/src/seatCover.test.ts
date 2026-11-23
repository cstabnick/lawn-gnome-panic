// Seat covers lift the driver: RIDER_SEAT_HEIGHT matches the sitting pose, and a fitted cover raises the seat (only the driver's).
// Run: npx vitest run src/seatCover.test.ts
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createGnomeModel, DEFAULT_LOOK, toModelLook, type PlayerState } from '@lawn/gnome';
import { RIDER_SEAT_HEIGHT, coverLift } from './seatCover';

vi.mock('./audio', () => ({ play: () => undefined }));
const { createVehicle, setVehicleLook } = await import('./vehicles');

/** The lowest point of a seated gnome's legs above its feet origin, after the sit pose has settled (2 s at 60 Hz). */
function measureSeatHeight(): number {
  const model = createGnomeModel(toModelLook(DEFAULT_LOOK));
  const state: PlayerState = {
    position: new THREE.Vector3(0, 0, 0), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0, sitting: true,
  };
  for (let i = 0; i < 120; i++) model.update(state, 1 / 60);
  model.object.position.set(0, 0, 0);
  model.object.updateMatrixWorld(true);
  const legs = model.legs!;
  const box = new THREE.Box3().setFromObject(legs.left, true).union(new THREE.Box3().setFromObject(legs.right, true));
  return box.min.y;
}

describe('RIDER_SEAT_HEIGHT', () => {
  it('matches the sitting pose of the gnome model', () => {
    expect(Math.abs(RIDER_SEAT_HEIGHT - measureSeatHeight())).toBeLessThanOrEqual(0.02);
  });
});

describe('coverLift', () => {
  it('lifts the driver by a hay bale, and not a passenger', () => {
    const v = createVehicle(new THREE.Scene(), 'ride-on', 0, 0, 0, 0x2f64c9);
    setVehicleLook(v, { ...v.look!, seat: 'hay' });
    expect(coverLift(v, 0)).toBeGreaterThan(0);
    expect(coverLift(v, 1)).toBe(0);
  });

  it('is 0 without a seat cover', () => {
    const v = createVehicle(new THREE.Scene(), 'ride-on', 0, 0, 0, 0x2f64c9);
    setVehicleLook(v, { ...v.look!, seat: 'none' });
    expect(coverLift(v, 0)).toBe(0);
  });
});
