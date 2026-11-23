// syncVehicleMesh once per frame (perf pass 2): a second timed sync of a vehicle in the same frame only places the mesh.
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./audio', () => ({ play: () => undefined }));
const { beginVehicleFrame, createVehicle, syncVehicleMesh } = await import('./vehicles');

describe('syncVehicleMesh', () => {
  it('steps the wheels once per frame however many systems sync the vehicle, but always places it', () => {
    const v = createVehicle(new THREE.Scene(), 'ride-on', 0, 0, 0, 0x2f64c9);
    v.speed = 5;
    beginVehicleFrame();
    const before = v.wheelSpin;
    syncVehicleMesh(v, 0.1);
    const once = v.wheelSpin - before;
    expect(once).toBeGreaterThan(0);
    v.x = 3;
    syncVehicleMesh(v, 0.1);
    expect(v.wheelSpin - before).toBeCloseTo(once);
    expect(v.object.position.x).toBe(3);
    beginVehicleFrame();
    syncVehicleMesh(v, 0.1);
    expect(v.wheelSpin - before).toBeCloseTo(once * 2);
  });
});
