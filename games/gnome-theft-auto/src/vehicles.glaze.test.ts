// Pay 'n' Glaze on vehicles: every ground vehicle is dressed by its @lawn/glaze rig and keeps it through damage, repaints and removal.
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./audio', () => ({ play: () => undefined }));
const {
  createVehicle, damageVehicle, removeVehicle, repaintVehicle, seatWorld, setVehicleLook, syncVehicleMesh,
} = await import('./vehicles');

describe('ground vehicles are dressed by the glaze rig', () => {
  it.each(['ride-on', 'zero-turn'] as const)('%s takes the tint, the rig and its lamps', (kind) => {
    const v = createVehicle(new THREE.Scene(), kind, 0, 0, 0, 0x2f64c9);
    expect(v.rig).toBeDefined();
    expect(v.look?.paint).toBe(0x2f64c9);
    expect(v.tint).toBe(0x2f64c9);
    expect(v.headlights).toBe(v.rig?.lights);
  });

  it.each(['combine', 'hoa-van', 'snail-coach'] as const)('%s keeps its own colours whatever tint a caller passes, and is still dressed', (kind) => {
    const v = createVehicle(new THREE.Scene(), kind, 0, 0, 0, 0x2f64c9);
    expect(v.rig).toBeDefined();
    expect(v.look?.paint).not.toBe(0x2f64c9);
    expect(v.tint).toBe(0x2f64c9);
  });

  it.each(['plane', 'clog-cruiser'] as const)('%s (flyer or boat) has no rig', (kind) => {
    const v = createVehicle(new THREE.Scene(), kind, 0, 0, 0);
    expect(v.rig).toBeUndefined();
  });

  it('a seat drops when the ride height drops', () => {
    const v = createVehicle(new THREE.Scene(), 'ride-on', 0, 0, 0, 0x2f64c9);
    const before = seatWorld(v, new THREE.Vector3()).y;
    setVehicleLook(v, { ...v.look!, rideHeight: -1 });
    const after = seatWorld(v, new THREE.Vector3()).y;
    expect(after).toBeCloseTo(before + v.rig!.seatLift, 5);
    expect(after).toBeLessThan(before);
  });

  it('repaintVehicle updates the loadout paint', () => {
    const v = createVehicle(new THREE.Scene(), 'ride-on', 0, 0, 0, 0x2f64c9);
    repaintVehicle(v, 0xf2c230);
    expect(v.look?.paint).toBe(0xf2c230);
    expect(v.tint).toBe(0xf2c230);
  });

  it('the body stays dressed after crossing a damage level', () => {
    const v = createVehicle(new THREE.Scene(), 'ride-on', 0, 0, 0, 0x2f64c9);
    damageVehicle(v, 0.6);
    expect(v.damage).toBeGreaterThan(0);
    expect(v.object.getObjectByName('glaze-shell')).toBeDefined();
  });

  it('a rear wheel turns with ZYX order when the vehicle is synced', () => {
    const v = createVehicle(new THREE.Scene(), 'ride-on', 0, 0, 0, 0x2f64c9);
    v.steerVis = 1;
    syncVehicleMesh(v, 0.016);
    const rear = v.object.getObjectByName('wheel-0');
    expect(rear).toBeDefined();
    expect(rear!.rotation.order).toBe('ZYX');
  });

  it('removeVehicle does not throw', () => {
    const scene = new THREE.Scene();
    const v = createVehicle(scene, 'ride-on', 0, 0, 0, 0x2f64c9);
    expect(() => removeVehicle(scene, v)).not.toThrow();
  });
});
